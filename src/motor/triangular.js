// Piscina / hidromassagem TRIANGULAR com banco acompanhando as três paredes.
//
// POR QUE EXISTE
// Obra real de 22/09/2026: hidro de 4,10 × 3,10 × 2,80, 1,00 de profundidade,
// banco de 0,50 de largura correndo de fora a fora nos três lados. O sistema
// não tinha esse formato e a conta saiu à mão.
//
// O QUE MUDA EM RELAÇÃO AO RETANGULAR
// O banco de 0,50 nos TRÊS lados encolhe o piso muito mais do que parece: cada
// lado perde 0,50 em duas direções ao mesmo tempo. Medido nesta hidro, o pé do
// banco vira 1,74 / 1,31 / 1,19 (perímetro de 10,00 para 4,24) e o piso do
// fundo fica com 0,78 m². O espelho do banco NÃO tem o comprimento da parede —
// é o erro fácil de cometer ao cortar.
//
// A REGRA DE CORTE É DO MARCOS (22/09/2026):
//   · paredes primeiro, chão por último
//   · cada lado sai da MESMA tira, na ordem da montagem: costas do banco (a
//     peça maior, onde a pessoa encosta) e, logo abaixo, o espelho daquele
//     mesmo banco. Ele aceita gastar mais manta para não retalhar: sobra junta
//     ainda serve, retalho espalhado não.
//   · o topo do assento sai com o chão, cada lado numa tira
//
// Tudo em METROS. Sem pixel, sem React.

import { offsetPoligono, pisoRecuado } from "./formas.js";
import { MANTA, cortarPeca, cortarChao, encaixarBobinas } from "./manta.js";

const arred = (v, c = 2) => Math.round(v * 10 ** c) / 10 ** c;
const pf = (v) => parseFloat(String(v ?? "").replace(",", ".")) || 0;
// Piso mínimo para o banco ainda ser banco (m²).
const PISO_MINIMO = 0.01;

/**
 * Maior banco que ainda passa na prova do recuo (pisoRecuado + piso mínimo),
 * arredondado para baixo. Bisseção entre 0 e área ÷ semiperímetro, que é teto
 * em polígono convexo. Cada recuo custa ~0,01 ms; os 24 passos, ~0,2 ms.
 */
function maiorRecuo(poly, teto) {
  if (!(teto > 0)) return 0;
  const cabe = (x) => { const p = pisoRecuado(poly, x); return !!p && area(p) >= PISO_MINIMO; };
  let lo = 0, hi = teto;
  for (let i = 0; i < 24; i++) {
    const meio = (lo + hi) / 2;
    if (cabe(meio)) lo = meio; else hi = meio;
  }
  return Math.floor(lo * 100) / 100;
}

/** Os três lados fecham um triângulo? (desigualdade triangular) */
export function trianguloValido(a, b, c) {
  return a > 0 && b > 0 && c > 0 && a + b > c && a + c > b && b + c > a;
}

/** Vértices do triângulo a partir dos três lados, com o lado `a` na base. */
export function verticesTriangulo(a, b, c) {
  if (!trianguloValido(a, b, c)) return null;
  const x = (a * a + c * c - b * b) / (2 * a);
  const y = Math.sqrt(Math.max(c * c - x * x, 0));
  return [{ x: 0, y: 0 }, { x: a, y: 0 }, { x, y }];
}

const lados = (p) => p.map((q, i) => {
  const r = p[(i + 1) % p.length];
  return Math.hypot(r.x - q.x, r.y - q.y);
});
const area = (p) => Math.abs(p.reduce((s, q, i) => {
  const r = p[(i + 1) % p.length];
  return s + (q.x * r.y - r.x * q.y);
}, 0)) / 2;
const caixa = (p) => ({
  w: Math.max(...p.map((q) => q.x)) - Math.min(...p.map((q) => q.x)),
  h: Math.max(...p.map((q) => q.y)) - Math.min(...p.map((q) => q.y)),
});

/**
 * Geometria e áreas.
 *
 * @param {object} p  {a,b,c} lados em metros, `prof` da hidro, `banco`
 *                    {larg, prof} — prof do banco = da BORDA até o assento
 * @returns {null|object} null quando os lados não fecham triângulo
 */
/**
 * A MESMA CONTA PARA QUALQUER CONTORNO — triângulo, oitavada, círculo
 * aproximado em gomos ou desenho livre. O que muda de um para outro é só o
 * polígono que entra.
 *
 * @param {object} p  {contorno, prof, banco:{larg,prof}}
 */
export function geometriaComBanco({ contorno, prof = 1, banco = null }) {
  return medir(contorno, pf(prof), banco);
}

export function geometriaTriangular({ a, b, c, prof = 1, banco = null }) {
  const tri = verticesTriangulo(pf(a), pf(b), pf(c));
  if (!tri) return null;
  return medir(tri, pf(prof), banco);
}

function medir(tri, D, banco) {
  if (!(tri?.length >= 3)) return null;
  const bl = banco ? pf(banco.larg) : 0;
  const bp = banco ? pf(banco.prof) : 0;
  const n2 = (v) => v.toFixed(2).replace(".", ",");
  // `medir` serve ao triângulo E a qualquer contorno (a oitavada entra por aqui
  // com 8 lados). A mensagem dizia "neste triângulo ... os três bancos" para a
  // oitavada também.
  const ehTriangulo = tri.length === 3;
  // BANCO MAIS FUNDO QUE A PISCINA: com as duas medidas digitadas, o assento
  // ficaria no fundo ou abaixo dele. Antes o banco era descartado em silêncio
  // e a conta saía como piscina sem banco — sem aviso nenhum na tela.
  // (Sem profundidade da piscina quem avisa é a tela, não aqui.)
  if (bl > 0 && bp > 0 && D > 0 && bp >= D) {
    return { erro: `Banco com o assento a ${n2(bp)} m da borda numa piscina de ${n2(D)} m de profundidade: o assento ficaria no fundo. Confira a profundidade do banco.` };
  }
  const temBanco = bl > 0 && bp > 0 && bp < D;

  const externos = lados(tri);
  // ATÉ ONDE O BANCO CABE: num triângulo, recuar as três paredes em `x` só
  // deixa piso enquanto x < RAIO INSCRITO (área ÷ semiperímetro). Passando
  // disso os três bancos se encontram e não existe fundo.
  //
  // A trava é esta conta, e NÃO o resultado do offset: medido em 22/09/2026,
  // `offsetPoligono` com recuo maior que o raio devolve um triângulo fantasma
  // de 0,64 m² em vez de devolver nada — o orçamento sairia com piso que não
  // existe.
  const raioInscrito = area(tri) / (externos.reduce((s, L) => s + L, 0) / 2);
  // EM POLÍGONO QUALQUER (a oitavada), área ÷ semiperímetro NÃO é o limite —
  // isso só vale para triângulo. Numa oitavada de 6 × 3 dá 2,04 m, numa
  // piscina de 3 m de largura: medido em 24/09, bancos de 1,55 a 2,00 m viravam
  // um piso de 0,31 a 2,06 m² que não existe, enquanto a planta já recusava
  // desenhá-los. Ali a prova é o recuo de verdade (pisoRecuado, formas.js) — a
  // mesma que a planta usa. O triângulo segue exatamente como era.
  const bancoMaximo = ehTriangulo ? Math.floor(raioInscrito * 100) / 100 : maiorRecuo(tri, raioInscrito);
  let dentro = tri;
  if (temBanco && ehTriangulo) {
    if (bl >= raioInscrito) {
      return { erro: `Banco de ${n2(bl)} m não cabe neste triângulo: acima de ${n2(bancoMaximo)} m os três bancos se encontram e não sobra piso.` };
    }
    dentro = offsetPoligono(tri, -bl);
    if (!dentro || dentro.length < 3 || area(dentro) < PISO_MINIMO) {
      return { erro: `Banco de ${n2(bl)} m não deixou piso utilizável.` };
    }
  } else if (temBanco) {
    dentro = pisoRecuado(tri, bl);
    if (!dentro || area(dentro) < PISO_MINIMO) {
      return { erro: `Banco de ${n2(bl)} m não cabe nesta piscina: acima de ${n2(bancoMaximo)} m os bancos das paredes se encontram.` };
    }
  }
  const internos = temBanco ? lados(dentro) : externos;
  const alturaEspelho = temBanco ? arred(D - bp) : 0;

  const aFundo = area(dentro);
  const aAssento = temBanco ? area(tri) - aFundo : 0;
  const aEspelho = temBanco ? internos.reduce((s, L) => s + L * alturaEspelho, 0) : 0;
  const aCostas = temBanco ? externos.reduce((s, L) => s + L * bp, 0) : 0;
  const aParede = temBanco ? 0 : externos.reduce((s, L) => s + L * D, 0);

  return {
    tri, dentro, temBanco,
    externos: externos.map((v) => arred(v)),
    internos: internos.map((v) => arred(v)),
    alturaEspelho,
    profBanco: bp,
    largBanco: bl,
    caixaFundo: { w: arred(caixa(dentro).w), h: arred(caixa(dentro).h) },
    areas: {
      lamina: arred(area(tri)),
      fundo: arred(aFundo),
      assento: arred(aAssento),
      espelho: arred(aEspelho),
      costas: arred(aCostas),
      parede: arred(aParede),
      total: arred(aFundo + aAssento + aEspelho + aCostas + aParede),
    },
    perimetro: arred(externos.reduce((s, L) => s + L, 0)),
    bancoMaximo: arred(bancoMaximo),
    // o banco desloca água: o bloco ocupa a área do assento pela sua altura
    volume: arred(area(tri) * D - aAssento * alturaEspelho),
  };
}

/**
 * Plano de corte da manta, no MESMO formato que `planoManta` devolve — a tela
 * do orçamento não precisa saber que a piscina é triangular.
 */
export function planoTriangular(entrada, cfg = MANTA) {
  // `contorno` pronto (oitavada, desenho) ou os três lados (triângulo).
  const g = entrada.contorno ? geometriaComBanco(entrada) : geometriaTriangular(entrada);
  if (!g) return { erro: entrada.contorno ? "Contorno inválido." : "Os três lados não fecham um triângulo." };
  if (g.erro) return { erro: g.erro };

  // ── PAREDES ───────────────────────────────────────────────────────────────
  const faces = [];
  if (g.temBanco) {
    g.externos.forEach((L, i) => faces.push({ nome: `Costas do banco ${i + 1}`, comp: L, prof: g.profBanco }));
    g.internos.forEach((L, i) => faces.push({ nome: `Espelho do banco ${i + 1}`, comp: L, prof: g.alturaEspelho }));
  } else {
    g.externos.forEach((L, i) => faces.push({ nome: `Parede ${i + 1}`, comp: L, prof: pf(entrada.prof) }));
  }
  const pecasParede = faces.map((f) => cortarPeca(f, cfg));

  // ── CHÃO: o assento (uma tira por lado) e o piso do fundo ─────────────────
  const partesChao = [];
  if (g.temBanco) {
    g.externos.forEach((L, i) => {
      const p = cortarChao(L, g.largBanco, cfg, `Assento ${i + 1}`,
        { comp: [cfg.rebarbaParede, cfg.rebarbaDescida], larg: [cfg.rebarbaParede, cfg.rebarbaParede] });
      partesChao.push(p);
    });
  }
  // O piso do fundo é um triângulo: sai da caixa que o envolve, e o recorte das
  // pontas é aparado na obra. Cortar triângulo "justo" não economiza bobina —
  // a faixa tem a largura toda de qualquer jeito.
  partesChao.push(cortarChao(g.caixaFundo.w, g.caixaFundo.h, cfg, "Chão do fundo",
    { comp: [cfg.rebarbaDescida, cfg.rebarbaDescida], larg: [cfg.rebarbaDescida, cfg.rebarbaDescida] }));

  const chao = {
    partes: partesChao,
    metrosLineares: arred(partesChao.reduce((s, p) => s + p.metrosLineares, 0)),
    emendas: partesChao.reduce((s, p) => s + p.emendas, 0),
    soldaLinear: arred(partesChao.reduce((s, p) => s + p.soldaLinear, 0)),
  };
  const paredes = {
    pecas: pecasParede,
    qtdPecas: pecasParede.length,
    metrosLineares: arred(pecasParede.reduce((s, p) => s + p.metrosLineares, 0)),
    soldaLinear: arred(pecasParede.reduce((s, p) => s + p.soldaLinear, 0)),
    complementos: { passadas: [], metrosLineares: 0 },
  };

  // ── NINHAR: a regra do Marcos ────────────────────────────────────────────
  // Nenhuma dessas peças chega perto de 1,55 de altura, então duas saem lado a
  // lado na MESMA passada da bobina. Sem isto a conta pede 2 bobinas onde a
  // obra usa 1 — foi o que aconteceu no primeiro teste desta hidro.
  //
  // A ordem é a da montagem, não a do melhor encaixe: costas e espelho DO
  // MESMO LADO saem juntos. Ele abre mão de ~2 m de manta para não retalhar:
  // sobra junta ainda serve, retalho espalhado não.
  const passadas = [];
  const usados = new Set();
  const cabe = (h1, h2) => h1 + h2 + cfg.solda <= cfg.larguraBobina;
  if (g.temBanco) {
    g.externos.forEach((_, i) => {
      const costas = pecasParede[i], espelho = pecasParede[i + g.externos.length];
      if (cabe(costas.altura, espelho.altura)) {
        usados.add(costas.nome); usados.add(espelho.nome);
        passadas.push({ comp: arred(Math.max(costas.comp, espelho.comp)), pecas: [costas.nome, espelho.nome] });
      }
    });
  }
  // o que sobrou (peças de parede soltas + as tiras de chão) entra pelo maior
  const resto = [
    ...pecasParede.filter((p) => !usados.has(p.nome)).map((p) => ({ nome: p.nome, comp: p.comp, alt: p.altura })),
    ...partesChao.map((p) => ({ nome: p.nome, comp: p.compFaixa * p.faixas, alt: p.alvo ?? p.larg ?? 0 })),
  ].sort((x, y) => y.comp - x.comp);
  while (resto.length) {
    const p = resto.shift();
    const j = resto.findIndex((q) => cabe(p.alt, q.alt));
    if (j >= 0) {
      const q = resto.splice(j, 1)[0];
      passadas.push({ comp: arred(Math.max(p.comp, q.comp)), pecas: [p.nome, q.nome] });
    } else {
      passadas.push({ comp: arred(p.comp), pecas: [p.nome] });
    }
  }

  const lista = [
    ...pecasParede.map((p) => ({ nome: p.nome, comp: p.comp })),
    ...partesChao.flatMap((p) => Array.from({ length: p.faixas }, (_, i) => ({
      nome: p.faixas > 1 ? `${p.nome} · faixa ${i + 1}` : p.nome, comp: p.compFaixa,
    }))),
  ];
  // A bobina paga o que PASSA por ela, não a soma das peças: peça ninhada com
  // outra divide a mesma passada.
  const metrosLineares = arred(passadas.reduce((s2, p) => s2 + p.comp, 0));
  const metrosSemNinhar = arred(chao.metrosLineares + paredes.metrosLineares);
  const pedido = encaixarBobinas(passadas.map((p, i) => ({ nome: `Passada ${i + 1}`, comp: p.comp })), cfg);
  const areaCobravel = arred(metrosLineares * cfg.larguraBobina);
  const solda = {
    emendaChao: arred(partesChao.reduce((s, p) => s + p.soldaEmenda, 0)),
    chaoNaParede: arred(partesChao.reduce((s, p) => s + p.soldaBorda, 0)),
    cantosParede: arred(pecasParede.reduce((s, p) => s + p.altura, 0)),
    anexos: 0,
  };
  solda.total = arred(solda.emendaChao + solda.chaoNaParede + solda.cantosParede);

  return {
    geometria: g,
    chao, paredes, lista, passadas, pedido, solda,
    metrosSemNinhar,
    anexos: [], anexoNinho: { passadas: [], metrosLineares: 0 },
    oportunidades: [], aproveitado: [], economiaAproveitamento: 0,
    metrosLineares,
    areaCobravel,
    areaUtil: g.areas.total,
    perda: arred(areaCobravel - g.areas.total),
    perdaPct: areaCobravel > 0 ? arred(((areaCobravel - g.areas.total) / areaCobravel) * 100, 1) : 0,
  };
}
