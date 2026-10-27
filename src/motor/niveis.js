// Degraus em vários níveis — a ponta rasa em escada (degraus + prainha) e a
// escada lateral (o banco em 2–3 degraus).
//
// POR QUE EXISTE
// O Marcos, em 24/10/2026: "o que eu também tenho dificuldade em executar são
// piscinas que têm dois, três degraus com níveis diferentes e depois vem uma
// prainha, ou ela tem uma escada lateral que também é com dois, três níveis".
// O sistema só conhecia UM nível na ponta (a prainha) e UM na lateral (o banco).
//
// O QUE ELE DECIDIU (mesma conversa)
//   - na ponta, os degraus ocupam a largura toda. Chegou a existir um bloco
//     num canto ("os dois acontecem"); em 26/10 ele tirou: "apenas os degraus
//     inteiriços, para a gente não ter complicação";
//   - a escada lateral corre a lateral inteira, como o banco de hoje;
//   - manta: a PISADA é peça separada, e as estreitas saem lado a lado na mesma
//     passada da bobina; a parede que acompanha os degraus sai INTEIRA, na
//     altura maior, e é recortada na obra;
//   - ordem da obra: primeiro todos os espelhos, depois as paredes — "2
//     comprimentos, 1 largura e mais os espelhos para o lado do degrau". Quando
//     a piscina deixa, uma faixa só rodeando: lateral + fundo + lateral.
//
// CONVENÇÃO
//   Tudo em METROS. x corre no comprimento, com 0 na testeira RASA (a ponta da
//   prainha, que a planta desenha à esquerda); y corre na largura, com 0 na
//   lateral "de cima" da planta. Profundidade é sempre da BORDA até o piso,
//   igual à prainha e ao banco: o vinil sobe até a borda, e a lâmina d'água não
//   entra na conta.
//
// O QUE NÃO MUDA: sem degrau digitado, a prainha e o banco seguem EXATAMENTE
// pelo caminho antigo (areas.js / manta.js), para orçamento salvo não mudar de
// valor. Os testes provam que a conta por células dá o mesmo número nesses casos.

import {
  MANTA, cortarPeca, cortarCorrida, cortarChao,
  anexoExterno, encaixarBobinas,
} from "./manta.js";

const pf = (v) => parseFloat(String(v ?? "").replace(",", ".")) || 0;
const m2 = (v) => v.toFixed(2).replace(".", ",");
const arred = (v, casas = 2) => Math.round(v * 10 ** casas) / 10 ** casas;
const EPS = 1e-9;

/** Um nível tem de ficar pelo menos 5 cm abaixo do anterior — menos que isso não é degrau. */
export const DEGRAU_MINIMO = 0.05;
/** Depois de todos os níveis da ponta, tem de sobrar fundo. */
export const FUNDO_MINIMO = 0.10;

/**
 * "030" no lugar de "0,30": sem a vírgula, o zero da frente some e o degrau
 * vira 30 m. Achado no teste do Marcos em 24/10 — o D2 com "030" dava "os
 * níveis da ponta somam 31,30 m" sem dizer qual campo estava errado.
 * Só vale para campo que começa com zero seguido de algarismo: "0,30", "0.30",
 * "0" e "10" passam direto. Não corrige sozinho; diz o que entendeu e pede a
 * vírgula.
 *
 * @returns {string|null} a mensagem de erro, ou null quando está escrito certo
 */
export function faltouVirgula(valor, rotulo) {
  const s = String(valor ?? "").trim();
  if (!/^0\d*[1-9]\d*$/.test(s)) return null;
  return `${rotulo} "${s}" ficou ${m2(pf(s))} m. Faltou a vírgula? Digite 0,${s.slice(1)}.`;
}

/**
 * Linhas de degrau digitadas.
 *
 * Linha toda vazia some (o usuário só apertou "+ Degrau"). Linha pela metade é
 * ERRO: degrau sem uma das medidas não pode virar preço, e sumir com ele em
 * silêncio seria cobrar uma piscina diferente da que foi descrita.
 *
 * @returns {{lista: Array<{a:number, p:number}>, erro: string|null}}
 */
export function lerDegraus(linhas, { campoA = "avanco", campoP = "prof", nome = "Degrau", inicio = 1 } = {}) {
  const lista = [];
  const rows = Array.isArray(linhas) ? linhas : [];
  for (let i = 0; i < rows.length; i++) {
    const l = rows[i] || {};
    const vazioA = !String(l[campoA] ?? "").trim(), vazioP = !String(l[campoP] ?? "").trim();
    if (vazioA && vazioP) continue;
    const virgula = faltouVirgula(l[campoA], `${nome} ${i + inicio}: ${campoA === "larg" ? "a largura" : "o avanço"}`)
      || faltouVirgula(l[campoP], `${nome} ${i + inicio}: a profundidade`);
    if (virgula) return { lista: [], erro: virgula };
    const a = pf(l[campoA]), p = pf(l[campoP]);
    if (!(a > 0)) return { lista: [], erro: `${nome} ${i + inicio}: falta ${campoA === "larg" ? "a largura" : "o avanço"}.` };
    if (!(p > 0)) return { lista: [], erro: `${nome} ${i + inicio}: falta a profundidade (da borda até o piso do degrau).` };
    lista.push({ a, p });
  }
  return { lista, erro: null };
}

/**
 * A ponta rasa em níveis — degraus (e a prainha, se houver) do formato
 * "Com prainha". Devolve null quando não há degrau: aí a prainha segue pelo
 * caminho antigo.
 *
 * Campos do orçamento (pool):
 *   prainhaComp / prainhaProf  a prainha, como sempre foi
 *   degraus      [{avanco, prof}] — avanço = pisada, no sentido do comprimento
 *   degrausPos   "antes" (padrão): borda → degraus → prainha → fundo
 *                "depois":         borda → prainha → degraus → fundo
 *   Todo nível atravessa a largura toda.
 *
 * @returns {null|{niveis, fim, prainha, erro}}
 *   niveis  em ordem, com x0/x1
 *   fim     onde começa o trecho que é só fundo (é dali que a escada lateral corre)
 */
export function pontaCfg(pool, poolFmt, L, W, D) {
  if (poolFmt !== "Com prainha") return null;
  const { lista, erro: erroLeitura } = lerDegraus(pool?.degraus);
  if (!lista.length && !erroLeitura) return null;
  const falha = (erro) => ({ niveis: [], fim: 0, prainha: null, erro });
  if (erroLeitura) return falha(erroLeitura);
  // Só com degrau: a prainha sozinha segue pelo caminho antigo, sem esta trava.
  const virgula = faltouVirgula(pool?.prainhaComp, "Prainha: o comprimento")
    || faltouVirgula(pool?.prainhaProf, "Prainha: a profundidade");
  if (virgula) return falha(virgula);
  if (!(L > 0 && W > 0 && D > 0)) return falha("Faltam comprimento, largura ou profundidade da piscina.");

  const praiC = pf(pool?.prainhaComp), praiP = pf(pool?.prainhaProf);
  if (praiC > 0 && !(praiP > 0)) {
    return falha("Falta a profundidade da prainha — com degraus é ela que diz a ordem dos níveis.");
  }
  const prainha = praiC > 0 ? { tipo: "prainha", rotulo: "Prainha", avanco: praiC, prof: praiP } : null;
  const depois = pool?.degrausPos === "depois" && !!prainha;
  const degraus = lista.map((d, i) => ({ tipo: "degrau", rotulo: `D${i + 1}`, avanco: d.a, prof: d.p }));

  const ordem = depois ? [prainha, ...degraus] : [...degraus, ...(prainha ? [prainha] : [])];
  let x = 0, ant = 0;
  const niveis = [];
  for (const n of ordem) {
    if (n.prof < ant + DEGRAU_MINIMO - EPS) {
      return falha(`${n.rotulo} (${m2(n.prof)} m) tem de ficar pelo menos 5 cm abaixo do ${ant > 0 ? `nível anterior (${m2(ant)} m)` : "nível da borda"}.`);
    }
    niveis.push({ ...n, x0: x, x1: x + n.avanco });
    x += n.avanco; ant = n.prof;
  }
  if (ant > D - DEGRAU_MINIMO + EPS) {
    return falha(`O último nível (${m2(ant)} m) tem de ficar pelo menos 5 cm acima do fundo (${m2(D)} m).`);
  }
  if (x > L - FUNDO_MINIMO + EPS) {
    return falha(`Os níveis da ponta somam ${m2(x)} m e a piscina tem ${m2(L)} m: não sobra fundo. ${confira(niveis)}`);
  }
  return { niveis, fim: x, prainha, erro: null };
}

/** Quando a ponta não cabe, aponta o nível de maior avanço — quase sempre o digitado errado. */
function confira(niveis) {
  const maior = niveis.reduce((a, b) => (b.avanco > a.avanco ? b : a));
  return `Confira ${maior.tipo === "prainha" ? "a prainha" : `o ${maior.rotulo}`} (${m2(maior.avanco)} m de avanço).`;
}

/** Uma linha por nível, do jeito que vai para o PDF e para o resumo. */
export function textoPonta(p) {
  if (!p || p.erro) return null;
  const partes = (p.niveis || []).map((n) => `${n.rotulo} ${m2(n.avanco)} × ${m2(n.prof)} m`);
  return `Ponta em níveis · ${partes.join(" → ")} → fundo`;
}

// ═══ A PISCINA EM CÉLULAS ═══════════════════════════════════════════════════
// Degrau, prainha e escada lateral são todos retângulos em
// níveis diferentes. Picando a piscina numa grade pelas linhas de todos eles,
// cada quadradinho tem UM piso — e aí parede, espelho e volume saem exatos em
// qualquer combinação, sem uma fórmula especial para cada caso.

/**
 * @param {object} o
 * @param {number} o.L, o.W, o.D  comprimento, largura, profundidade do fundo
 * @param {object} [o.ponta]      saída do pontaCfg
 * @param {object} [o.prainhaLegada] {comp, prof} — a prainha antiga, sem degrau
 * @param {object} [o.banco]      saída do bancoCfg (com `niveis`)
 * @returns {{xs:number[], ys:number[], prof:number[][]}} prof[i][j] da célula [xs[i],xs[i+1]] × [ys[j],ys[j+1]]
 */
export function celulasDaPiscina({ L, W, D, ponta = null, prainhaLegada = null, banco = null }) {
  // retângulos na ordem de prioridade: quem vem depois manda no pedaço que cobre
  const rets = [];
  if (prainhaLegada && prainhaLegada.comp > 0) {
    rets.push({ x0: 0, x1: prainhaLegada.comp, y0: 0, y1: W, prof: prainhaLegada.prof });
  }
  for (const n of ponta?.niveis || []) rets.push({ x0: n.x0, x1: n.x1, y0: 0, y1: W, prof: n.prof });
  if (banco && banco.medida && (banco.niveis || []).length) {
    let y = 0;
    for (const n of banco.niveis) {
      const a = y, b = y + n.larg;
      const y0 = banco.lado === "baixo" ? W - b : a, y1 = banco.lado === "baixo" ? W - a : b;
      rets.push({ x0: banco.x0 || 0, x1: L, y0, y1, prof: n.prof });
      y = b;
    }
  }
  const corte = (vals, max) => [...new Set([0, max, ...vals.filter((v) => v > EPS && v < max - EPS)].map((v) => arred(v, 6)))].sort((a, b) => a - b);
  const xs = corte(rets.flatMap((r) => [r.x0, r.x1]), L);
  const ys = corte(rets.flatMap((r) => [r.y0, r.y1]), W);
  const prof = [];
  for (let i = 0; i < xs.length - 1; i++) {
    const linha = [];
    const cx = (xs[i] + xs[i + 1]) / 2;
    for (let j = 0; j < ys.length - 1; j++) {
      const cy = (ys[j] + ys[j + 1]) / 2;
      let p = D;
      for (const r of rets) if (cx > r.x0 && cx < r.x1 && cy > r.y0 && cy < r.y1) p = r.prof;
      linha.push(p);
    }
    prof.push(linha);
  }
  return { xs, ys, prof };
}

/**
 * Área de piso, paredes do contorno, espelhos internos e volume das células.
 *
 *   parede  = trecho do contorno × profundidade da célula que encosta nele
 *   espelho = divisa entre duas células × diferença de nível
 *   volume  = área × profundidade, célula por célula (até a borda)
 */
export function medirCelulas({ xs, ys, prof }) {
  let chao = 0, volume = 0, espelhos = 0;
  const paredes = { testeiraRasa: 0, testeiraFunda: 0, lateralCima: 0, lateralBaixo: 0 };
  const nx = xs.length - 1, ny = ys.length - 1;
  for (let i = 0; i < nx; i++) {
    const dx = xs[i + 1] - xs[i];
    for (let j = 0; j < ny; j++) {
      const dy = ys[j + 1] - ys[j];
      const p = prof[i][j];
      chao += dx * dy;
      volume += dx * dy * p;
      if (i === 0) paredes.testeiraRasa += dy * p;
      if (i === nx - 1) paredes.testeiraFunda += dy * p;
      if (j === 0) paredes.lateralCima += dx * p;
      if (j === ny - 1) paredes.lateralBaixo += dx * p;
      if (i < nx - 1) espelhos += dy * Math.abs(prof[i + 1][j] - p);
      if (j < ny - 1) espelhos += dx * Math.abs(prof[i][j + 1] - p);
    }
  }
  const totParedes = paredes.testeiraRasa + paredes.testeiraFunda + paredes.lateralCima + paredes.lateralBaixo;
  return { chao, volume, espelhos, paredes: totParedes, porParede: paredes, total: chao + totParedes + espelhos };
}

// ═══ PLANO DE CORTE DA MANTA — PONTA EM NÍVEIS ══════════════════════════════

/**
 * Faces de parede e espelho da ponta em níveis, na ordem em que a obra monta:
 * primeiro os espelhos do lado do degrau, depois 2 comprimentos e 1 largura.
 *
 * As paredes de pé em escada saem INTEIRAS, na altura maior, e levam no
 * `recorte.degraus` o que é tirado na obra — decisão do Marcos de 24/10/2026
 * ("uma peça inteira, recortada": menos solda, mais manta).
 * Os espelhos levam a regrinha de sempre: 5 cm sobrando para cima, 5 para
 * baixo e 5 em cada ponta (cortarPeca).
 *
 * `faixaUnica`: lateral + testeira funda + lateral numa peça só, vincada nos
 * dois cantos — "às vezes dá para passar a faixa inteira, rodear toda a
 * piscina e retornar para o degrau, mas às vezes não". Só em piscina no esquadro.
 */
export function facesPontaNiveis({ L, W, D, ponta, faixaUnica = false }) {
  const espelhos = [];
  const paredes = [];
  const r = (v) => arred(v, 4);
  const niveis = ponta.niveis || [];

  // recorte de uma lateral: onde o pé da parede sobe, a peça cheia é cortada
  const recorteLateral = (trechos) => {
    const degraus = trechos.filter((t) => t.alt > EPS).map((t) => ({ larg: r(t.comp), alt: r(t.alt) }));
    return degraus.length ? { larg: r(degraus.reduce((s, d) => s + d.larg, 0)), alt: r(Math.max(...degraus.map((d) => d.alt))), degraus } : null;
  };

  // ESPELHOS: da borda até o 1º nível (é a testeira rasa) e de nível em nível
  espelhos.push({ nome: "Testeira rasa", comp: W, prof: r(niveis[0].prof) });
  niveis.forEach((n, i) => {
    const prox = niveis[i + 1];
    espelhos.push({
      nome: `Espelho ${n.rotulo} → ${prox ? prox.rotulo : "fundo"}`,
      comp: W, prof: r((prox ? prox.prof : D) - n.prof),
    });
  });
  const rec = recorteLateral(niveis.map((n) => ({ comp: n.avanco, alt: D - n.prof })));
  paredes.push({ nome: "Lateral 1", comp: L, prof: D, recorte: rec });
  paredes.push({ nome: "Testeira funda", comp: W, prof: D });
  paredes.push({ nome: "Lateral 2", comp: L, prof: D, recorte: rec });

  if (faixaUnica) {
    // as duas laterais e a testeira funda viram UMA corrida vincada nos cantos
    const nomes = new Set(paredes.filter((p) => p.nome !== "Testeira rasa").map((p) => p.nome));
    for (const p of paredes) if (nomes.has(p.nome)) p.grupo = "Paredes · faixa única";
  }
  return { espelhos, paredes };
}

/**
 * Regiões de piso da ponta em níveis. Cada pisada é peça própria (a faixa do
 * fundo não sobe degrau), cortada pelo mesmo `cortarChao` do piso da prainha:
 * 1 cm de rebarba contra parede, zero no pé e no topo de espelho.
 */
export function chaoPontaNiveis({ L, W, D, ponta }, cfg = MANTA) {
  const R = cfg.rebarbaParede, Z = cfg.rebarbaDescida;
  const partes = [];
  const niveis = ponta.niveis || [];
  const nomePiso = (n) => (n.tipo === "prainha" ? "Piso da prainha" : `Pisada ${n.rotulo}`);

  niveis.forEach((n, i) => {
    partes.push(cortarChao(n.avanco, W, cfg, nomePiso(n), { comp: [i === 0 ? R : Z, Z], larg: [R, R] }));
  });
  partes.push(cortarChao(L - ponta.fim, W, cfg, "Chão · fundo", { comp: [Z, R], larg: [R, R] }));
  return partes;
}

/**
 * Peças lado a lado na mesma passada da bobina.
 *
 * A regra do Marcos: o que cabe junto na largura de 1,55 sai da mesma passada —
 * vale para parede baixa, espelho e, desde 24/10/2026, para as pisadas
 * estreitas ("separada, várias na mesma passada"). Entre duas peças vizinhas
 * fica a folga de uma solda (5 cm), a mesma do plano do triângulo.
 * First-fit pelo comprimento: peças de comprimento parecido caem juntas, e a
 * passada custa o comprimento da maior.
 */
export function ninharPecas(pecas, cfg = MANTA) {
  const B = cfg.larguraBobina, S = cfg.solda;
  const fila = (pecas || []).filter((p) => p && p.comp > EPS && p.largura > EPS)
    .slice().sort((a, b) => b.comp - a.comp || b.largura - a.largura);
  const passadas = [];
  for (const p of fila) {
    const w = Math.min(p.largura, B);
    let alvo = passadas.find((x) => x.largura + S + w <= B + EPS);
    if (!alvo) { alvo = { largura: -S, comp: 0, pecas: [], larguras: [] }; passadas.push(alvo); }
    alvo.largura = arred(alvo.largura + S + w, 4);
    alvo.comp = arred(Math.max(alvo.comp, p.comp));
    alvo.pecas.push(p.nome);
    alvo.larguras.push(arred(w));
  }
  return passadas.map((p) => ({ comp: p.comp, pecas: p.pecas, larguras: p.larguras, largura: arred(p.largura) }));
}

/**
 * Plano de corte completo da ponta em níveis, no MESMO formato que `planoManta`
 * e `planoTriangular` devolvem — a tela do orçamento não precisa saber que a
 * piscina tem degraus.
 */
export function planoNiveis({ L, W, D, ponta, faixaUnica = false, areaReal = null,
                              anexos = [], facesExtra = [] }, cfg = MANTA) {
  if (!ponta || ponta.erro) return null;
  const { espelhos, paredes } = facesPontaNiveis({ L, W, D, ponta, faixaUnica });
  const faces = [...espelhos, ...paredes, ...(facesExtra || [])];

  // ── PAREDES E ESPELHOS: uma peça por face; a faixa única vira corrida ──
  const soltas = faces.filter((f) => !f.grupo).map((f) => cortarPeca(f, cfg));
  const grupos = new Map();
  for (const f of faces) {
    if (!f.grupo) continue;
    if (!grupos.has(f.grupo)) grupos.set(f.grupo, []);
    grupos.get(f.grupo).push(f);
  }
  const corridas = [...grupos.entries()].map(([nome, fs]) => {
    const c = cortarCorrida(fs, cfg, nome);
    const degraus = fs.flatMap((f) => f.recorte?.degraus || []);
    return degraus.length ? { ...c, recorte: { larg: arred(degraus.reduce((s, d) => s + d.larg, 0)), alt: arred(Math.max(...degraus.map((d) => d.alt))), degraus } } : c;
  });
  const pecasParede = [...soltas, ...corridas];

  // ── PISO ──
  const partesChao = chaoPontaNiveis({ L, W, D, ponta }, cfg);

  // ── ANEXOS (spa externo): peça própria, ninhada junto ──
  const anexosCalc = (anexos || []).map((a) => anexoExterno(a, cfg)).filter(Boolean);

  // ── PASSADAS ──
  // parede: a peça principal tem no máximo a largura da bobina; o que falta
  // é faixinha soldada no pé, que também entra na ninhagem
  const ninhaveis = [
    ...pecasParede.map((p) => ({ nome: p.nome, comp: p.comp, largura: p.alturaPrincipal ?? p.altura })),
    ...pecasParede.flatMap((p) => (p.complementos || []).map((c, i) => ({
      nome: `Faixinha ${i + 1} · ${p.nome}`, comp: c.comp, largura: c.largura,
    }))),
    ...partesChao.filter((p) => p.faixas === 1).map((p) => ({ nome: p.nome, comp: p.compFaixa ?? p.maior, largura: p.alvo })),
    ...anexosCalc.flatMap((a) => a.itens.map((it) => ({ nome: it.nome, comp: it.comp, largura: it.largura }))),
  ];
  const passadas = ninharPecas(ninhaveis, cfg);
  // piso de várias faixas: cada faixa é uma passada inteira
  for (const p of partesChao.filter((x) => x.faixas > 1)) {
    const comps = p.contorno ? p.pecas.map((f) => f.comp) : Array.from({ length: p.faixas }, () => p.compFaixa);
    comps.forEach((c, i) => passadas.push({ comp: arred(c), pecas: [`${p.nome} · faixa ${i + 1}`], larguras: [cfg.larguraBobina], largura: cfg.larguraBobina }));
  }

  const metrosLineares = arred(passadas.reduce((s, p) => s + p.comp, 0));
  const pedido = encaixarBobinas(passadas.map((p, i) => ({ nome: `Passada ${i + 1}`, comp: p.comp })), cfg);
  const areaCobravel = arred(metrosLineares * cfg.larguraBobina);

  const chao = {
    partes: partesChao,
    metrosLineares: arred(partesChao.reduce((s, p) => s + p.metrosLineares, 0)),
    emendas: partesChao.reduce((s, p) => s + p.emendas, 0),
    soldaLinear: arred(partesChao.reduce((s, p) => s + p.soldaLinear, 0)),
  };
  const paredesOut = {
    pecas: pecasParede,
    qtdPecas: pecasParede.length,
    metrosLineares: arred(pecasParede.reduce((s, p) => s + p.metrosLineares, 0)
      + pecasParede.reduce((s, p) => s + (p.complementos || []).reduce((t, c) => t + c.comp, 0), 0)),
    soldaLinear: arred(pecasParede.reduce((s, p) => s + p.soldaLinear, 0)),
    complementos: { passadas: [], metrosLineares: 0 },
  };
  const solda = {
    emendaChao: arred(partesChao.reduce((s, p) => s + (p.soldaEmenda || 0), 0)),
    chaoNaParede: arred(partesChao.reduce((s, p) => s + (p.soldaBorda || 0), 0)),
    cantosParede: arred(pecasParede.reduce((s, p) => s + p.altura, 0)),
    anexos: arred(anexosCalc.reduce((s, a) => s + a.solda.total, 0)),
  };
  solda.total = arred(solda.emendaChao + solda.chaoNaParede + solda.cantosParede + solda.anexos);

  // superfície de verdade: a conta por células (a mesma do orçamento de vinil)
  const cel = medirCelulas(celulasDaPiscina({ L, W, D, ponta }));
  const areaUtil = arred(cel.total + anexosCalc.reduce((s, a) => s + (a.areaUtil || 0), 0));
  const real = areaReal ?? areaUtil;
  const lista = [
    ...pecasParede.map((p) => ({ nome: p.nome, comp: p.comp })),
    ...partesChao.flatMap((p) => (p.contorno
      ? p.pecas.map((f, i) => ({ nome: p.faixas > 1 ? `${p.nome} · faixa ${i + 1}` : p.nome, comp: f.comp }))
      : Array.from({ length: p.faixas }, (_, i) => ({ nome: p.faixas > 1 ? `${p.nome} · faixa ${i + 1}` : p.nome, comp: p.compFaixa })))),
  ];

  return {
    niveis: true,
    chao, paredes: paredesOut, lista, passadas, pedido, solda,
    metrosSemNinhar: arred(chao.metrosLineares + paredesOut.metrosLineares),
    anexos: anexosCalc, anexoNinho: { passadas: [], metrosLineares: 0 },
    oportunidades: [], aproveitado: [], economiaAproveitamento: 0,
    metrosLineares,
    areaCobravel,
    areaUtil,
    perda: arred(areaCobravel - areaUtil),
    perdaPct: areaCobravel > 0 ? arred(((areaCobravel - areaUtil) / areaCobravel) * 100, 1) : 0,
    areaReal: arred(real),
    sobra: arred(areaCobravel - real),
    sobraPct: real > 0 ? arred((areaCobravel / real - 1) * 100, 1) : 0,
    cfg,
  };
}
