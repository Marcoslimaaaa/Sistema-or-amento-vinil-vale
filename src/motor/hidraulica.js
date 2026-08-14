// Motor de material hidráulico — conta o que o encanamento REALMENTE tem,
// a partir do traçado desenhado, e não por fórmula fixa.
//
// Topologia por sistema (regra passada pelo Marcos, 2026-08-13):
//
// RALO DE FUNDO (no chão)
//   Cada ralo sai com uma curva longa virada para o outro; os dois se encontram
//   num T. Do T sai um ramal único, ainda no nível do chão da piscina, até
//   passar para fora da parede. Só ali entra outra curva longa, sobe até a
//   altura da casa de máquinas, entra em mais uma curva longa que aponta para a
//   casa e segue.
//
// RALO DE FUNDO DE ÁGUA QUENTE
//   Igual ao de cima quando está no chão. Quando está na parede, já sai na
//   altura dele: faz a junção e segue direto, sem o trecho no piso nem a subida.
//
// RETORNO E HIDROMASSAGEM — ramal EQUALIZADO
//   Nenhum bico pode ter mais força que o outro. Cada bico atravessa a parede,
//   as duas pontas do ramal entram com curva longa, os bicos do meio entram com
//   T, e o tronco sai do MEIO do ramal (mais um T) para a casa de máquinas.
//   Tês = bicos − 1; curvas longas do ramal = 2 (uma em cada ponta).
//
// ASPIRAÇÃO / SKIMMER / RETORNO DE ÁGUA QUENTE
//   Mesmo ramal, mesma contagem. As curvas do percurso saem do traçado real.
//
// NIVELADOR (dreno lateral de nível)
//   Não tem canamento nenhum.
//
// REFLETOR LED
//   Só sai da piscina e faz a curva para cima. E é eletroduto de 3/4", não o
//   PVC de 50 mm dos sistemas de água.

import { offsetPoligono, fracaoMaisProxima, caminhoNoContorno, pontoNaFracao, ortogonalizar } from "./formas.js";

export const BARRA_M = 6;                    // comprimento comercial da barra
export const SEM_TUBO = ["nivelador"];       // não gera tubulação
export const DIAM_34 = ["refletor"];         // eletroduto 3/4"
export const COTO_LED = 0.30;                // sobra do eletroduto acima da borda

export const ROTULO_SIS = {
  retorno: "Retorno", aspiracao: "Aspiração", dreno: "Dreno Fundo", skimmer: "Skimmer",
  refletor: "Refletor LED", nivelador: "Nivelador", hidro: "Hidrojet",
  drenoQuente: "Ralo Fundo Á. Quente", retornoQuente: "Retorno Á. Quente",
};

/** Comprimento de uma polilinha. */
export function comprimento(pts) {
  let s = 0;
  for (let i = 1; i < pts.length; i++) s += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
  return s;
}

/**
 * Curvas longas de um traçado, pelo ÂNGULO TOTAL que ele vira.
 * Somar giro e dividir por 90° trata igual o canto vivo de uma piscina
 * retangular (um giro de 90° = 1 curva) e o arco de uma oval feito de muitos
 * segmentos pequenos (mesmo 90° no total = 1 curva). Contar vértice a vértice
 * daria dezenas de "curvas" numa piscina redonda.
 */
export function curvasDoTracado(pts) {
  let giro = 0;
  for (let i = 1; i < pts.length - 1; i++) {
    const a = pts[i - 1], b = pts[i], c = pts[i + 1];
    const v1 = { x: b.x - a.x, y: b.y - a.y }, v2 = { x: c.x - b.x, y: c.y - b.y };
    const l1 = Math.hypot(v1.x, v1.y), l2 = Math.hypot(v2.x, v2.y);
    if (l1 < 1e-9 || l2 < 1e-9) continue;
    const cos = Math.max(-1, Math.min(1, (v1.x * v2.x + v1.y * v2.y) / (l1 * l2)));
    giro += Math.acos(cos);
  }
  return Math.round(giro / (Math.PI / 2));
}

/**
 * Monta o ramal de UM sistema e devolve traçado (para desenhar) + material.
 *
 * Tudo em METROS, num referencial único:
 *   contorno – polígono da piscina
 *   devs     – [{key,label,x,y,z,floor}]  z medido a partir do fundo
 *   cm       – {x,y} da casa de máquinas;  zCasa – altura da linha de tubo lá
 *   off      – afastamento do ramal em relação à parede (faixa do sistema)
 */
export function ramalSistema({ tipo, devs, contorno, cm, zCasa, off = 0.3, ortho = true }) {
  const vazio = { tipo, bicos: 0, tuboM: 0, curvas: 0, tes: 0, diam: 50, tracado: [], stubs: [] };
  if (SEM_TUBO.includes(tipo) || !devs || devs.length === 0) return vazio;

  const n = devs.length;

  // ── Refletor: não vai à casa de máquinas, só sai e sobe ──────────────────
  if (DIAM_34.includes(tipo)) {
    const anel = offsetPoligono(contorno, off);
    let tubo = 0;
    const stubs = [];
    devs.forEach(d => {
      const t = fracaoMaisProxima(anel, d);
      const q = pontoNaFracao(anel, t);
      const saida = Math.hypot(q.x - d.x, q.y - d.y);           // travessia da parede
      const subida = Math.max(0, (d.zBorda ?? 0) - (d.z ?? 0)) + COTO_LED;
      tubo += saida + subida;
      stubs.push([d, q]);
    });
    return { tipo, bicos: n, tuboM: tubo, curvas: n, tes: 0, diam: 34, tracado: [], stubs };
  }

  const anel = offsetPoligono(contorno, off);
  const noChao = devs.every(d => d.floor);
  const zRamal = noChao ? 0 : (devs[0].z ?? 0);

  const tracado = [];
  const stubs = [];
  let tubo = 0, curvas = 0;
  // Cada bico do meio entra com T e o tronco sai do meio com mais um: n − 1
  const tes = Math.max(0, n - 1);
  // Duas curvas longas fecham as pontas do ramal (com um bico só, é uma virada)
  curvas += Math.min(n, 2);
  let tMeio;

  if (noChao) {
    // ── Ralo de fundo: a junção é DENTRO, no piso ─────────────────────────
    // Cada ralo sai com uma curva virada para o outro, encontram-se num T, e
    // dali sai UM ramal só, ainda rente ao chão, até passar da parede.
    const xs = devs.map(d => d.x), ys = devs.map(d => d.y);
    const porX = (Math.max(...xs) - Math.min(...xs)) >= (Math.max(...ys) - Math.min(...ys));
    const ord = [...devs].sort((a, b) => (porX ? a.x - b.x : a.y - b.y));
    const espinha = ord.map(d => ({ x: d.x, y: d.y }));
    tubo += comprimento(espinha);
    if (espinha.length > 1) tracado.push(espinha);
    ord.forEach(d => stubs.push([d, d]));
    // saída pelo meio da espinha (equalização) até fora da parede
    const meio = { x: (ord[0].x + ord[ord.length - 1].x) / 2, y: (ord[0].y + ord[ord.length - 1].y) / 2 };
    const tS = fracaoMaisProxima(anel, meio);
    let saida = [meio, pontoNaFracao(anel, tS)];
    if (ortho) saida = ortogonalizar(saida, 0.08);
    tubo += comprimento(saida);
    curvas += curvasDoTracado(saida);
    tracado.push(saida);
    tMeio = tS;
  } else {
    // ── Bico de parede: atravessa a parede e entra no ramal externo ───────
    const fr = [];
    devs.forEach(d => {
      const t = fracaoMaisProxima(anel, d);
      const q = pontoNaFracao(anel, t);
      tubo += Math.hypot(q.x - d.x, q.y - d.y);
      fr.push(t); stubs.push([d, q]);
    });
    const ordenados = [...fr].sort((a, b) => a - b);
    for (let i = 1; i < ordenados.length; i++) {
      let trecho = caminhoNoContorno(anel, ordenados[i - 1], ordenados[i]);
      if (ortho) trecho = ortogonalizar(trecho, 0.08);
      tubo += comprimento(trecho);
      curvas += curvasDoTracado(trecho);
      tracado.push(trecho);
    }
    tMeio = ordenados.length > 1 ? (ordenados[0] + ordenados[ordenados.length - 1]) / 2 : ordenados[0];
  }

  // ── Tronco: sai do MEIO do ramal (equalização) e vai até a casa ──────────
  const tCasa = fracaoMaisProxima(anel, cm);
  let tronco = caminhoNoContorno(anel, tMeio, tCasa);
  if (ortho) tronco = ortogonalizar(tronco, 0.08);
  const qc = pontoNaFracao(anel, tCasa);
  const fecho = [qc, { x: cm.x, y: qc.y }, { x: cm.x, y: cm.y }];
  tubo += comprimento(tronco) + comprimento(fecho);
  curvas += curvasDoTracado([...tronco, ...fecho.slice(1)]);
  tracado.push(tronco, fecho);

  // ── Subida até a linha de tubo da casa de máquinas ───────────────────────
  // O ralo de chão sobe o desnível inteiro (é o trecho que o Marcos descreveu:
  // curva longa, sobe, curva longa, entra na casa). Bico de parede sobe só a
  // diferença até a linha da casa.
  const desnivel = Math.abs((zCasa ?? 0) - zRamal);
  if (desnivel > 0.05) { tubo += desnivel; curvas += 2; }

  return { tipo, bicos: n, tuboM: tubo, curvas, tes, diam: 50, tracado, stubs, zRamal, desnivel };
}

/** Junta os sistemas e fecha o total por diâmetro. */
export function totaisHidraulica(porSistema) {
  const lista = Object.values(porSistema).filter(s => s.bicos > 0);
  const t50 = lista.filter(s => s.diam === 50);
  const t34 = lista.filter(s => s.diam === 34);
  const soma = (a, f) => a.reduce((s, x) => s + f(x), 0);
  const tubo50 = soma(t50, s => s.tuboM), tubo34 = soma(t34, s => s.tuboM);
  return {
    tubo50, tubo34,
    barras50: Math.ceil(tubo50 / BARRA_M), barras34: Math.ceil(tubo34 / BARRA_M),
    curvas50: soma(t50, s => s.curvas), curvas34: soma(t34, s => s.curvas),
    tes: soma(lista, s => s.tes),
  };
}
