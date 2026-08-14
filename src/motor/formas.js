// Motor de formas livres da piscina — port do motor do projeto hidraulica-piscinas.
// Convenção: pontos {x,y} em METROS, eixo y para baixo (orientação do canvas).
// O "desenho" de um orçamento = { vertices:[{x,y}...], formas:[FormaComposta...] }.
// FormaComposta = retângulo (rotacionável) UNIDO (prainha/escada/spa) ou
// SUBTRAÍDO (recorte) do corpo, com profundidade própria quando união.
import polygonClipping from "polygon-clipping";

export const PROFUNDIDADE_FORMA_DEFAULT = { prainha: 0.3, escada: 0.75, spa: 0.9, recorte: 0 };

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
export function regioesProfundidade(desenho, profCorpo) {
  const base = desenho?.vertices || [];
  if (base.length < 3) return [];
  let regioes = [{ poligono: base, profundidadeM: null }];
  const formas = desenho.formas || [];
  if (formas.length === 0) return regioes;

  const removerDeTodas = rect => {
    regioes = regioes.flatMap(r => diferencaPoligonos(r.poligono, rect).map(pol => ({ ...r, poligono: pol })));
  };
  let efetivo = base;

  for (const f of formas) {
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

/**
 * Métricas reais do desenho para o orçamento de vinil:
 * - chao: área do contorno efetivo (m²)
 * - perim: perímetro do contorno efetivo (m)
 * - paredes: Σ lado × profundidade da REGIÃO que encosta nele (prainha rasa
 *   conta parede baixa, não a do corpo) (m²)
 * - vol: Σ área × profundidade por região (m³)
 */
export function calcDesenho(desenho, profCorpo) {
  const efetivo = contornoEfetivo(desenho);
  if (efetivo.length < 3) return null;
  const chao = areaPoligono(efetivo);
  const perim = perimetroPoligono(efetivo);
  const regioes = regioesProfundidade(desenho, profCorpo);
  const vol = regioes.reduce((s, r) => s + areaPoligono(r.poligono) * (r.profundidadeM ?? profCorpo), 0);

  // paredes: para cada aresta do contorno, a profundidade da região logo por dentro
  let paredes = 0;
  for (let i = 0; i < efetivo.length; i++) {
    const a = efetivo[i], b = efetivo[(i + 1) % efetivo.length];
    const len = Math.hypot(b.x - a.x, b.y - a.y);
    if (len < 1e-9) continue;
    // ponto 6 cm para dentro a partir do meio da aresta
    const nx = (b.y - a.y) / len, ny = -(b.x - a.x) / len;
    const meio = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
    const dentroA = { x: meio.x + nx * 0.06, y: meio.y + ny * 0.06 };
    const dentroB = { x: meio.x - nx * 0.06, y: meio.y - ny * 0.06 };
    const pt = pontoDentro(dentroA, efetivo) ? dentroA : dentroB;
    const reg = regioes.find(r => r.profundidadeM !== null && pontoDentro(pt, r.poligono));
    paredes += len * (reg ? reg.profundidadeM : profCorpo);
  }
  return { chao, perim, paredes, vol, efetivo, regioes };
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
