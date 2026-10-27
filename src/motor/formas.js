// Motor de formas livres da piscina — port do motor do projeto hidraulica-piscinas.
// Convenção: pontos {x,y} em METROS, eixo y para baixo (orientação do canvas).
// O "desenho" de um orçamento = { vertices:[{x,y}...], formas:[FormaComposta...] }.
// FormaComposta = retângulo (rotacionável) UNIDO (prainha/escada/spa) ou
// SUBTRAÍDO (recorte) do corpo, com profundidade própria quando união.
import polygonClipping from "polygon-clipping";

export const PROFUNDIDADE_FORMA_DEFAULT = { prainha: 0.3, escada: 0.75, spa: 0.9, recorte: 0, banco: 0.5 };

// ── Geometria básica ──
export function areaPoligono(p) {
  let s = 0;
  for (let i = 0; i < p.length; i++) {
    const a = p[i], b = p[(i + 1) % p.length];
    s += a.x * b.y - b.x * a.y;
  }
  return Math.abs(s) / 2;
}

export function perimetroPoligono(p) {
  let s = 0;
  for (let i = 0; i < p.length; i++) {
    const a = p[i], b = p[(i + 1) % p.length];
    s += Math.hypot(b.x - a.x, b.y - a.y);
  }
  return s;
}

export function pontoDentro(pt, poly) {
  // ray casting
  let dentro = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i], b = poly[j];
    if ((a.y > pt.y) !== (b.y > pt.y) && pt.x < ((b.x - a.x) * (pt.y - a.y)) / (b.y - a.y) + a.x) dentro = !dentro;
  }
  return dentro;
}

// ── Boolean de polígonos (polygon-clipping) ──
function paraRing(p) {
  const r = p.map(q => [q.x, q.y]);
  if (r.length && (r[0][0] !== r[r.length - 1][0] || r[0][1] !== r[r.length - 1][1])) r.push([r[0][0], r[0][1]]);
  return r;
}
function deMultiPolygon(mp) {
  return mp
    .map(poly => poly[0].map(([x, y]) => ({ x, y })))
    .map(anel => {
      const p = anel[0], q = anel[anel.length - 1];
      return anel.length > 1 && p.x === q.x && p.y === q.y ? anel.slice(0, -1) : anel;
    })
    .filter(anel => anel.length >= 3);
}
export function uniaoPoligonos(a, ...outros) {
  return deMultiPolygon(polygonClipping.union([paraRing(a)], ...outros.map(o => [paraRing(o)])));
}
export function diferencaPoligonos(a, ...recortes) {
  return deMultiPolygon(polygonClipping.difference([paraRing(a)], ...recortes.map(o => [paraRing(o)])));
}
export function interseccaoPoligonos(a, b) {
  return deMultiPolygon(polygonClipping.intersection([paraRing(a)], [paraRing(b)]));
}
export function maiorPoligono(polys) {
  let melhor = [], melhorA = -Infinity;
  for (const p of polys) {
    const ar = areaPoligono(p);
    if (ar > melhorA) { melhorA = ar; melhor = p; }
  }
  return melhor;
}

// ── Formas compostas ──
export function retanguloForma(f) {
  const hw = f.larguraM / 2, hl = f.comprimentoM / 2;
  const ang = ((f.rotacaoGraus ?? 0) * Math.PI) / 180;
  const cos = Math.cos(ang), sin = Math.sin(ang);
  return [{ x: -hw, y: -hl }, { x: hw, y: -hl }, { x: hw, y: hl }, { x: -hw, y: hl }]
    .map(c => ({ x: f.cxM + c.x * cos - c.y * sin, y: f.cyM + c.x * sin + c.y * cos }));
}

export function profundidadeForma(f, profCorpo) {
  const bruta = f.profundidadeM ?? PROFUNDIDADE_FORMA_DEFAULT[f.tipo] ?? 0.5;
  return Math.min(Math.max(bruta, 0.05), profCorpo || bruta);
}

/**
 * É região INTERNA (aparada pelas paredes, não estende o contorno)?
 * - prainha: SEMPRE interna — é área rasa dentro da piscina; pode ser desenhada
 *   maior que o corpo que a parte fora das paredes é aparada (segue comprimento,
 *   largura e diagonal de uma vez).
 * - escada/spa: interna só quando o centro cai dentro do corpo; com o centro
 *   fora, é anexo que ESTENDE a piscina (spa acoplado).
 */
function formaInterna(f, corpo) {
  if (f.operacao === "subtracao") return false;
  return f.tipo === "prainha" || f.interno || pontoDentro({ x: f.cxM, y: f.cyM }, corpo);
}

/**
 * Contorno EFETIVO: base ⊕ formas (união/subtração). Sempre o maior corpo.
 * Formas internas (ver formaInterna) não alteram o contorno — nada "sobra para
 * fora" mesmo que o retângulo cruze as paredes; são aparadas na região.
 */
export function contornoEfetivo(desenho) {
  const base = desenho?.vertices || [];
  if (base.length < 3) return base;
  const formas = desenho.formas || [];
  let atual = base;
  for (const f of formas) {
    if (f.tipo === "banco") continue;   // banco é interno: não muda o contorno
    if (f.larguraM <= 0 || f.comprimentoM <= 0) continue;
    if (formaInterna(f, atual)) continue;
    const rect = retanguloForma(f);
    const res = f.operacao === "subtracao" ? diferencaPoligonos(atual, rect) : uniaoPoligonos(atual, rect);
    const maior = maiorPoligono(res);
    if (maior.length >= 3) atual = maior;
  }
  return atual;
}

/** Faixas de degrau da escada, do lado externo ao interno. */
function faixasDegrau(f, paraDentro, n) {
  const ang = ((f.rotacaoGraus ?? 0) * Math.PI) / 180;
  const eixoY = { x: -Math.sin(ang), y: Math.cos(ang) };
  const eixoX = { x: Math.cos(ang), y: Math.sin(ang) };
  const dotY = paraDentro.x * eixoY.x + paraDentro.y * eixoY.y;
  const dotX = paraDentro.x * eixoX.x + paraDentro.y * eixoX.y;
  const aoLongoDeY = Math.abs(dotY) >= Math.abs(dotX);
  const eixo = aoLongoDeY ? eixoY : eixoX;
  const extensao = aoLongoDeY ? f.comprimentoM : f.larguraM;
  const sinal = (aoLongoDeY ? dotY : dotX) >= 0 ? 1 : -1;
  const perp = aoLongoDeY ? eixoX : eixoY;
  const meiaPerp = (aoLongoDeY ? f.larguraM : f.comprimentoM) / 2;
  const faixas = [];
  for (let i = 0; i < n; i++) {
    const a0 = sinal * (-extensao / 2 + (extensao * i) / n);
    const a1 = sinal * (-extensao / 2 + (extensao * (i + 1)) / n);
    const canto = (a, s) => ({ x: f.cxM + eixo.x * a + perp.x * s * meiaPerp, y: f.cyM + eixo.y * a + perp.y * s * meiaPerp });
    faixas.push([canto(a0, -1), canto(a1, -1), canto(a1, 1), canto(a0, 1)]);
  }
  return faixas;
}

/**
 * Regiões de profundidade: corpo (profundidadeM=null) + regiões rasas das
 * uniões (escada = um degrau por faixa). Recortes removem área de todas.
 */
/**
 * BANCO QUE CONTORNA A PISCINA — o anel entre o contorno e o recuo dele.
 *
 * Devolve UM TRAPÉZIO POR PAREDE, e não um anel com furo, por dois motivos
 * práticos: polígono com furo não desenha em `<polygon>`, e é assim que a peça
 * é cortada na obra (uma tira por lado). Cada trapézio liga a aresta de fora à
 * aresta correspondente de dentro.
 *
 * Serve a qualquer formato: triângulo, retângulo ou desenho livre.
 *
 * @param {Array} contorno     polígono da piscina
 * @param {number} larguraM    quanto o banco avança para dentro
 * @param {number} profundidadeM  da BORDA até o assento (mesma convenção da prainha)
 */
/**
 * Encosta os bicos no CONTORNO quando a piscina não é retangular.
 *
 * POR QUE EXISTE
 * As posições padrão nascem em fração do retângulo envolvente (0,05 da parede
 * esquerda, 0,95 da direita...). Num triângulo — ou em qualquer desenho livre —
 * boa parte dessas posições cai FORA da água: visto na planta em 22/09/2026,
 * com metade dos bicos boiando do lado de fora do triângulo.
 *
 * Aqui cada peça de parede é puxada para o ponto mais próximo do contorno, e as
 * de fundo (ralo) são trazidas para dentro se estiverem fora. Quem arrastar a
 * peça depois continua mandando — isto é só o ponto de partida.
 *
 * @param {object} pos           mapa de posições em fração (0..1) do retângulo
 * @param {Array}  contornoNorm  contorno na MESMA fração (0..1)
 */
export function encostarNoContorno(pos, contornoNorm) {
  if (!contornoNorm || contornoNorm.length < 3) return pos;
  const saida = {};
  const centro = contornoNorm.reduce(
    (s, p) => ({ x: s.x + p.x / contornoNorm.length, y: s.y + p.y / contornoNorm.length }),
    { x: 0, y: 0 });
  for (const [k, p] of Object.entries(pos)) {
    if (p.special) { saida[k] = p; continue; }
    if (p.floor) {
      // peça de fundo: só mexe se estiver fora d'água, e aí vai para o miolo
      saida[k] = pontoDentro(p, contornoNorm) ? p : { ...p, x: centro.x, y: centro.y };
      continue;
    }
    const t = fracaoMaisProxima(contornoNorm, p);
    const q = pontoNaFracao(contornoNorm, t);
    saida[k] = { ...p, x: q.x, y: q.y, fracaoContorno: t };
  }
  return saida;
}

/**
 * O piso que sobra ao recuar todas as paredes em `larguraM` — ou null quando
 * o recuo não cabe.
 *
 * RECUO QUE PASSA DO PONTO: o offset não some — ele devolve um polígono
 * FANTASMA (medido em 22/09/2026: no triângulo 4,10/3,10/2,80, recuar 1,20
 * devolveu um "piso" de 0,64 m², com a mesma orientação e área menor, então
 * nem sinal nem tamanho denunciam).
 *
 * A prova que funciona é a definição do recuo: todo ponto do piso tem de
 * estar a pelo menos `larguraM` de TODAS as paredes. No fantasma, um vértice
 * fica a 0,39 m da base.
 *
 * Serve ao DESENHO (regioesBanco) e à CONTA do banco em polígono qualquer
 * (triangular.js): antes só o desenho fazia esta prova, e numa oitavada de
 * 6 × 3 a conta aceitava banco de 2,00 m com 2,06 m² de piso inexistente.
 */
export function pisoRecuado(contorno, larguraM) {
  if (!(contorno?.length >= 3) || !(larguraM > 0)) return null;
  const dentro = offsetPoligono(contorno, -larguraM);
  if (!dentro || dentro.length !== contorno.length) return null;
  const distPonto = (pt, a2, b2) => {
    const dx = b2.x - a2.x, dy = b2.y - a2.y;
    const len2 = dx * dx + dy * dy || 1e-9;
    let t = ((pt.x - a2.x) * dx + (pt.y - a2.y) * dy) / len2;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(pt.x - (a2.x + t * dx), pt.y - (a2.y + t * dy));
  };
  const folga = Math.max(0.01, larguraM * 0.02);
  const cabe = dentro.every(q => contorno.every((a2, i) =>
    distPonto(q, a2, contorno[(i + 1) % contorno.length]) >= larguraM - folga));
  if (!cabe || areaPoligono(dentro) < 1e-4) return null;
  return dentro;
}

export function regioesBanco(contorno, larguraM, profundidadeM) {
  const dentro = pisoRecuado(contorno, larguraM);
  if (!dentro) return [];
  return contorno.map((a, i) => {
    const b = contorno[(i + 1) % contorno.length];
    const bi = dentro[(i + 1) % dentro.length];
    const ai = dentro[i];
    return { poligono: [a, b, bi, ai], profundidadeM, tipo: "banco", lado: i };
  }).filter(r => areaPoligono(r.poligono) > 1e-6);
}

export function regioesProfundidade(desenho, profCorpo) {
  const base = desenho?.vertices || [];
  if (base.length < 3) return [];
  let regioes = [{ poligono: base, profundidadeM: null }];
  const formas = desenho.formas || [];
  // BANCO: não é retângulo solto como as outras formas — é o anel que segue o
  // contorno inteiro. Entra antes das demais, e o corpo continua sendo o corpo:
  // o assento é uma região rasa por cima dele.
  const banco = formas.find(f => f.tipo === "banco" && f.larguraM > 0);
  if (banco) {
    regioes.push(...regioesBanco(base, banco.larguraM, profundidadeForma(banco, profCorpo)));
  }
  if (formas.filter(f => f.tipo !== "banco").length === 0) return regioes;

  const removerDeTodas = rect => {
    regioes = regioes.flatMap(r => diferencaPoligonos(r.poligono, rect).map(pol => ({ ...r, poligono: pol })));
  };
  let efetivo = base;

  for (const f of formas) {
    if (f.tipo === "banco") continue;   // já virou anel lá em cima
    if (f.larguraM <= 0 || f.comprimentoM <= 0) continue;
    const rect = retanguloForma(f);
    if (f.operacao === "subtracao") {
      const res = maiorPoligono(diferencaPoligonos(efetivo, rect));
      if (res.length >= 3) efetivo = res;
      removerDeTodas(rect);
      continue;
    }
    if (!formaInterna(f, efetivo)) {
      const uniao = uniaoPoligonos(efetivo, rect);
      if (uniao.length !== 1) continue; // forma solta não entra
      efetivo = uniao[0];
    } // interna (prainha / centro dentro): contorno intocado, recorte no final resolve
    removerDeTodas(rect);
    const prof = profundidadeForma(f, profCorpo);
    if (f.tipo === "escada") {
      const cx = base.reduce((s, v) => s + v.x, 0) / base.length;
      const cy = base.reduce((s, v) => s + v.y, 0) / base.length;
      const n = Math.max(1, Math.round(f.degrausQtd ?? Math.max(2, Math.round(prof / 0.25))));
      faixasDegrau(f, { x: cx - f.cxM, y: cy - f.cyM }, n).forEach((faixa, i) => {
        regioes.push({ poligono: faixa, profundidadeM: (prof * (i + 1)) / n, formaId: f.id, tipo: f.tipo });
      });
    } else {
      regioes.push({ poligono: rect, profundidadeM: prof, formaId: f.id, tipo: f.tipo });
    }
  }

  return regioes
    .flatMap(r => interseccaoPoligonos(r.poligono, efetivo).map(pol => ({ ...r, poligono: pol })))
    .filter(r => r.poligono.length >= 3 && areaPoligono(r.poligono) > 1e-6);
}

// ── Roteamento de tubulação pelo contorno (port do geo.ts do hidraulica) ──

/** Orientação do polígono: >0 anti-horária (no eixo y para baixo: horária visual). */
function orientacao(p) {
  let s = 0;
  for (let i = 0; i < p.length; i++) {
    const a = p[i], b = p[(i + 1) % p.length];
    s += a.x * b.y - b.x * a.y;
  }
  return Math.sign(s) || 1;
}

function normalExterna(a, b, sinal) {
  const dx = b.x - a.x, dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  return { x: (sinal * dy) / len, y: (-sinal * dx) / len };
}

/** Offset do contorno para FORA por `dist` (bissetriz por vértice, com trava em cantos agudos). */
export function offsetPoligono(p, dist) {
  const n = p.length;
  const sinal = orientacao(p);
  const out = [];
  for (let i = 0; i < n; i++) {
    const prev = p[(i - 1 + n) % n], cur = p[i], next = p[(i + 1) % n];
    const n1 = normalExterna(prev, cur, sinal), n2 = normalExterna(cur, next, sinal);
    let nx = n1.x + n2.x, ny = n1.y + n2.y;
    const len = Math.hypot(nx, ny) || 1;
    nx /= len; ny /= len;
    const cos = nx * n1.x + ny * n1.y || 1;
    const d = dist / Math.max(cos, 0.3);
    out.push({ x: cur.x + nx * d, y: cur.y + ny * d });
  }
  return out;
}

/**
 * Ortogonaliza um caminho (padrão de prancha técnica/Revit): todo segmento vira
 * horizontal OU vertical. Segmentos quase-retos encaixam no eixo dominante;
 * diagonais reais viram um "L" (cotovelo 90°). `tol` na mesma unidade dos pontos
 * (px aqui). O primeiro ponto é preservado.
 */
export function ortogonalizar(caminho, tol = 4) {
  if (caminho.length < 2) return caminho;
  const out = [{ ...caminho[0] }];
  for (let i = 1; i < caminho.length; i++) {
    const cur = out[out.length - 1];
    const p = caminho[i];
    const dx = p.x - cur.x, dy = p.y - cur.y;
    if (Math.abs(dx) <= tol || Math.abs(dy) <= tol) {
      if (Math.abs(dx) >= Math.abs(dy)) out.push({ x: p.x, y: cur.y });
      else out.push({ x: cur.x, y: p.y });
    } else {
      out.push({ x: p.x, y: cur.y });
      out.push({ x: p.x, y: p.y });
    }
  }
  return out.filter((q, i) => i === 0 || Math.hypot(q.x - out[i - 1].x, q.y - out[i - 1].y) > 1e-6);
}

/** Ponto sobre o contorno na fração t ∈ [0,1) do perímetro. */
export function pontoNaFracao(p, t) {
  const total = perimetroPoligono(p);
  let alvo = (((t % 1) + 1) % 1) * total;
  for (let i = 0; i < p.length; i++) {
    const a = p[i], b = p[(i + 1) % p.length];
    const len = Math.hypot(b.x - a.x, b.y - a.y);
    if (alvo <= len) {
      const u = len === 0 ? 0 : alvo / len;
      return { x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * u };
    }
    alvo -= len;
  }
  return p[0];
}

/** Fração do perímetro cujo ponto é o mais próximo de `alvo` (projeção exata por aresta). */
export function fracaoMaisProxima(p, alvo) {
  const total = perimetroPoligono(p);
  if (total === 0) return 0;
  let melhor = 0, melhorD = Infinity, acumulado = 0;
  for (let i = 0; i < p.length; i++) {
    const a = p[i], b = p[(i + 1) % p.length];
    const dx = b.x - a.x, dy = b.y - a.y;
    const len = Math.hypot(dx, dy);
    if (len > 0) {
      const t = Math.max(0, Math.min(1, ((alvo.x - a.x) * dx + (alvo.y - a.y) * dy) / (len * len)));
      const q = { x: a.x + dx * t, y: a.y + dy * t };
      const d = Math.hypot(q.x - alvo.x, q.y - alvo.y);
      if (d < melhorD) { melhorD = d; melhor = (acumulado + len * t) / total; }
    }
    acumulado += len;
  }
  return melhor % 1;
}

/**
 * Trechos mínimos do anel que interligam todas as frações (dispositivos + casa)
 * num coletor ÚNICO: no ciclo, a árvore mínima é o anel inteiro menos o maior
 * vão entre pontos consecutivos. Devolve pares [tA,tB] adjacentes a desenhar —
 * cada trecho uma vez só (ramal compartilhado, sem tubo duplicado).
 */
export function trechosColetor(fracoes) {
  const pts = fracoes.map(t => ((t % 1) + 1) % 1).sort((a, b) => a - b);
  const n = pts.length;
  if (n < 2) return [];
  let gi = 0, gs = -1;
  for (let i = 0; i < n; i++) {
    const a = pts[i], b = i === n - 1 ? pts[0] + 1 : pts[i + 1];
    if (b - a > gs) { gs = b - a; gi = i; }
  }
  const segs = [];
  for (let i = 0; i < n; i++) {
    if (i === gi) continue;
    segs.push([pts[i], i === n - 1 ? pts[0] : pts[i + 1]]);
  }
  return segs;
}

/** Caminho ao longo do contorno entre as frações tA→tB, na direção mais curta. */
export function caminhoNoContorno(p, tA, tB) {
  const total = perimetroPoligono(p);
  const norm = t => ((t % 1) + 1) % 1;
  tA = norm(tA); tB = norm(tB);
  const horario = norm(tB - tA) <= 0.5;
  const caminho = [pontoNaFracao(p, tA)];
  const fr = [];
  let acc = 0;
  for (let i = 0; i < p.length; i++) {
    fr.push(acc / total);
    const a = p[i], b = p[(i + 1) % p.length];
    acc += Math.hypot(b.x - a.x, b.y - a.y);
  }
  const dentro = t => (horario ? norm(t - tA) < norm(tB - tA) : norm(tA - t) < norm(tA - tB));
  const ordenados = fr
    .map((t, i) => ({ t, i }))
    .filter(({ t }) => dentro(t) && t !== tA)
    .sort((a, b) => (horario ? norm(a.t - tA) - norm(b.t - tA) : norm(tA - a.t) - norm(tA - b.t)));
  for (const { i } of ordenados) caminho.push(p[i]);
  caminho.push(pontoNaFracao(p, tB));
  return caminho;
}

// ── Medição do desenho: parede trecho a trecho e degrau interno ──
//
// POR QUE EXISTE (achado 4.2a da planta de obra, corrigido em 26/10/2026)
// A conta antiga dava a cada lado do contorno UMA profundidade, a do ponto do
// meio, e somava só o contorno. O degrau entre a prainha e o corpo não entrava.
// Medido em 24/10: a mesma 6,00 × 3,00 × 1,40 com prainha de 1,00 a 0,50 dava
// 22,5 m² de parede no desenho livre e 23,4 no "Com prainha"; a piscina do
// Gilberto (Sólazer) dava 71,7 m² contra 75,08 do gabarito.
//
// Agora cada lado é partido onde muda a região, cada trecho leva a
// profundidade de quem encosta nele, e toda divisa interna entre regiões de
// profundidade diferente vira espelho (o degrau). Com raso e fundo o corpo
// desce em rampa ao longo do eixo x do desenho, do raso à esquerda (como no
// corte) ao fundo à direita.

const EPS_SONDA = 0.005;   // 5 mm para cada lado de uma linha, para ver quem está ali

/** Interseções e vértices que partem o segmento a→b, em trechos. */
function partesDoSegmento(a, b, segs) {
  const dx = b.x - a.x, dy = b.y - a.y, len2 = dx * dx + dy * dy;
  if (len2 < 1e-18) return [];
  const ts = [0, 1];
  for (const [c, d] of segs) {
    for (const q of [c, d]) {
      const t = ((q.x - a.x) * dx + (q.y - a.y) * dy) / len2;
      if (t > 1e-9 && t < 1 - 1e-9 && Math.hypot(a.x + t * dx - q.x, a.y + t * dy - q.y) < 1e-6) ts.push(t);
    }
    const ex = d.x - c.x, ey = d.y - c.y, den = dx * ey - dy * ex;
    if (Math.abs(den) < 1e-12) continue;
    const t = ((c.x - a.x) * ey - (c.y - a.y) * ex) / den;
    const u = ((c.x - a.x) * dy - (c.y - a.y) * dx) / den;
    if (t > 1e-9 && t < 1 - 1e-9 && u > -1e-9 && u < 1 + 1e-9) ts.push(t);
  }
  ts.sort((x, y) => x - y);
  const out = [];
  for (let i = 0; i < ts.length - 1; i++) {
    if (ts[i + 1] - ts[i] < 1e-9) continue;
    out.push([{ x: a.x + ts[i] * dx, y: a.y + ts[i] * dy }, { x: a.x + ts[i + 1] * dx, y: a.y + ts[i + 1] * dy }]);
  }
  return out;
}

const arestas = (p) => p.map((a, i) => [a, p[(i + 1) % p.length]]);

/** Área e centróide em x de um multipolígono do polygon-clipping (furos descontados). */
function areaECentroX(mp) {
  let area = 0, mom = 0;
  for (const poly of mp) {
    poly.forEach((anel, k) => {
      let A = 0, Cx = 0;
      for (let i = 0; i < anel.length - 1; i++) {
        const [x1, y1] = anel[i], [x2, y2] = anel[i + 1];
        const cr = x1 * y2 - x2 * y1;
        A += cr; Cx += (x1 + x2) * cr;
      }
      const a = Math.abs(A) / 2, cx = A ? Cx / (3 * A) : 0;
      const sinal = k === 0 ? 1 : -1;
      area += sinal * a; mom += sinal * a * cx;
    });
  }
  return { area, cx: area > 1e-12 ? mom / area : 0 };
}

/** ∫ |f| num trecho onde f vai em linha reta de fa a fb (exato, mesmo trocando de sinal). */
function integralAbs(fa, fb, len) {
  if (fa * fb >= 0) return len * Math.abs(fa + fb) / 2;
  return len * (fa * fa + fb * fb) / (2 * Math.abs(fa - fb));
}

/**
 * Mede o desenho: chão, paredes do contorno, espelhos internos e volume, e
 * devolve também cada trecho de parede e de espelho (é o que a manta corta).
 *
 * @param {object} desenho     { vertices, formas }
 * @param {number} profCorpo   profundidade do corpo (a média, quando há rampa)
 * @param {object} [rampa]     { raso, fundo } — o corpo desce ao longo do eixo x
 */
export function medirDesenho(desenho, profCorpo, rampa = null) {
  const efetivo = contornoEfetivo(desenho);
  if (efetivo.length < 3) return null;
  const regioes = regioesProfundidade(desenho, profCorpo);
  const xs = efetivo.map((p) => p.x);
  const x0 = Math.min(...xs), x1 = Math.max(...xs);
  const inclinado = !!rampa && rampa.fundo !== rampa.raso && x1 - x0 > 1e-9;
  const incl = inclinado ? (rampa.fundo - rampa.raso) / (x1 - x0) : 0;
  // profundidade de uma região num ponto: forma rasa é plana; o corpo segue a rampa
  const profEm = (ri, pt) => {
    const r = regioes[ri];
    if (r && r.profundidadeM != null) return r.profundidadeM;
    return inclinado ? rampa.raso + incl * (pt.x - x0) : profCorpo;
  };
  // quem manda num ponto: a ÚLTIMA região que o contém (corpo, banco, formas)
  const regiaoEm = (pt) => {
    for (let i = regioes.length - 1; i >= 0; i--) if (pontoDentro(pt, regioes[i].poligono)) return i;
    return -1;
  };
  const sondas = (p, q) => {
    const len = Math.hypot(q.x - p.x, q.y - p.y);
    const nx = (q.y - p.y) / len, ny = -(q.x - p.x) / len;
    const m = { x: (p.x + q.x) / 2, y: (p.y + q.y) / 2 };
    return { len, m, s1: { x: m.x + nx * EPS_SONDA, y: m.y + ny * EPS_SONDA }, s2: { x: m.x - nx * EPS_SONDA, y: m.y - ny * EPS_SONDA } };
  };
  const segsRegioes = regioes.flatMap((r) => arestas(r.poligono));
  const segsContorno = arestas(efetivo);

  // PAREDES: cada lado do contorno partido onde muda a região
  const trechosParede = [];
  segsContorno.forEach(([a, b], lado) => {
    let atual = null;
    for (const [p, q] of partesDoSegmento(a, b, segsRegioes)) {
      const { len, s1, s2 } = sondas(p, q);
      const ri = regiaoEm(pontoDentro(s1, efetivo) ? s1 : s2);
      const pa = profEm(ri, p), pb = profEm(ri, q);
      if (atual && atual.regiao === ri) {
        atual.comp += len; atual.area += len * (pa + pb) / 2;
        atual.max = Math.max(atual.max, pa, pb); atual.min = Math.min(atual.min, pa, pb);
      } else {
        atual = { lado, regiao: ri, comp: len, area: len * (pa + pb) / 2, max: Math.max(pa, pb), min: Math.min(pa, pb) };
        trechosParede.push(atual);
      }
    }
  });

  // ESPELHOS: divisa interna entre duas regiões de profundidade diferente.
  // Duas regiões vizinhas trazem a mesma divisa nas duas bordas: conta uma vez só.
  const trechosEspelho = [];
  const contados = [];
  const jaContado = (m) => contados.some(([p, q]) => {
    const dx = q.x - p.x, dy = q.y - p.y, l2 = dx * dx + dy * dy;
    const t = Math.max(0, Math.min(1, ((m.x - p.x) * dx + (m.y - p.y) * dy) / l2));
    return Math.hypot(p.x + t * dx - m.x, p.y + t * dy - m.y) < 1e-5;
  });
  for (const [a, b] of segsRegioes) {
    for (const [p, q] of partesDoSegmento(a, b, [...segsRegioes, ...segsContorno])) {
      const { len, m, s1, s2 } = sondas(p, q);
      if (jaContado(m)) continue;
      if (!pontoDentro(s1, efetivo) || !pontoDentro(s2, efetivo)) continue;   // é parede, já contada
      const r1 = regiaoEm(s1), r2 = regiaoEm(s2);
      if (r1 === r2) continue;
      const fa = profEm(r1, p) - profEm(r2, p), fb = profEm(r1, q) - profEm(r2, q);
      if (Math.abs(fa) < 1e-9 && Math.abs(fb) < 1e-9) continue;
      contados.push([p, q]);
      const par = `${Math.min(r1, r2)}|${Math.max(r1, r2)}`;
      const area = integralAbs(fa, fb, len);
      const ant = trechosEspelho[trechosEspelho.length - 1];
      if (ant && ant.par === par && Math.hypot(ant.fim.x - p.x, ant.fim.y - p.y) < 1e-6) {
        ant.comp += len; ant.area += area; ant.max = Math.max(ant.max, Math.abs(fa), Math.abs(fb)); ant.fim = q;
      } else {
        trechosEspelho.push({ par, comp: len, area, max: Math.max(Math.abs(fa), Math.abs(fb)), fim: q });
      }
    }
  }

  // CHÃO e VOLUME: a última região manda no pedaço que cobre
  let chao = 0, vol = 0;
  regioes.forEach((r, i) => {
    const depois = regioes.slice(i + 1).map((o) => [paraRing(o.poligono)]);
    const mp = depois.length ? polygonClipping.difference([paraRing(r.poligono)], ...depois) : [[paraRing(r.poligono)]];
    const { area, cx } = areaECentroX(mp);
    if (area < 1e-9) return;
    if (r.profundidadeM != null) { chao += area; vol += area * r.profundidadeM; return; }
    // corpo: a rampa estica o piso (√(1 + i²)), e o volume é a área × a profundidade no centróide
    chao += area * Math.sqrt(1 + incl * incl);
    vol += area * (inclinado ? rampa.raso + incl * (cx - x0) : profCorpo);
  });

  const paredesContorno = trechosParede.reduce((s, t) => s + t.area, 0);
  const espelhos = trechosEspelho.reduce((s, t) => s + t.area, 0);
  return {
    chao, perim: perimetroPoligono(efetivo), paredes: paredesContorno + espelhos,
    paredesContorno, espelhos, vol, efetivo, regioes,
    trechosParede: trechosParede.map(({ lado, regiao, comp, area, max, min }) =>
      ({ lado, regiao, comp, profMedia: comp ? area / comp : 0, prof: max, raso: min })),
    trechosEspelho: trechosEspelho.map(({ comp, area, max }) => ({ comp, profMedia: comp ? area / comp : 0, prof: max })),
  };
}

/**
 * Métricas reais do desenho para o orçamento de vinil:
 * - chao: área do contorno efetivo (m²), com o piso da rampa esticado
 * - perim: perímetro do contorno efetivo (m)
 * - paredes: paredes do contorno trecho a trecho + espelhos internos (m²) —
 *   a mesma convenção do calcA: toda face vertical, interna ou não
 * - vol: Σ área × profundidade por região (m³)
 */
export function calcDesenho(desenho, profCorpo, rampa = null) {
  return medirDesenho(desenho, profCorpo, rampa);
}

/**
 * Espelha o desenho inteiro (contorno + prainha/escada/spa/recorte) dentro do
 * próprio bounding box. Usado quando o orçamento "vira a piscina de lado" —
 * a casa de máquinas fica parada e a piscina é que gira para o lado oposto.
 * Área, perímetro e volume não mudam (espelho é isometria), só a orientação.
 */
export function espelharDesenho(desenho, flipH = false, flipV = false) {
  if (!desenho || (!flipH && !flipV)) return desenho;
  const base = desenho.vertices || [];
  if (base.length < 3) return desenho;
  const xs = base.map(p => p.x), ys = base.map(p => p.y);
  const sx = Math.min(...xs) + Math.max(...xs);
  const sy = Math.min(...ys) + Math.max(...ys);
  const esp = p => ({ ...p, x: flipH ? sx - p.x : p.x, y: flipV ? sy - p.y : p.y });
  const verts = base.map(esp);
  // um único espelho inverte o sentido do polígono — devolve a orientação original
  if (flipH !== flipV) verts.reverse();
  return {
    ...desenho,
    vertices: verts,
    formas: (desenho.formas || []).map(f => ({
      ...f,
      cxM: flipH ? sx - f.cxM : f.cxM,
      cyM: flipV ? sy - f.cyM : f.cyM,
      rotacaoGraus: flipH !== flipV ? -(f.rotacaoGraus ?? 0) : (f.rotacaoGraus ?? 0),
    })),
  };
}
