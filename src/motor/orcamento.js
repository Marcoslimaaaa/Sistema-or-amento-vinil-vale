// Preço do orçamento — UMA conta para o editor e para o PDF.
//
// POR QUE ISSO EXISTE
// O total era calculado em dois lugares do App.jsx: no editor (o que aparece
// na aba Valor e vai gravado em `tot`, que alimenta CRM, contrato e financeiro)
// e dentro do QP (o que sai no PDF para o cliente). As duas cópias já tinham se
// separado: o plano de corte da manta armada do editor respeitava o "aproveitar
// a tira" e o do PDF não — e o interruptor nem era gravado no orçamento.
// Medido em 24/09: em 7,8% das piscinas com prainha em manta armada (6-10 m ×
// 3-5 m, prainha de 1,0 a 2,5 m), ligar o aproveitamento baixava 5 a 8 m² no
// editor enquanto o PDF cobrava a manta inteira.
//
// Com uma função só, o número da tela e o do PDF não têm como divergir.
//
// Tudo aqui é puro (sem React): testado em __tests__/orcamento.test.mjs.

import { planoManta, facesRetangulo, facesComPrainha, facesComBanco, facesDoContorno, cortarChaoContorno } from "./manta.js";
import { contornoEfetivo } from "./formas.js";
import { bancoCfg } from "./banco.js";
import { planoTriangular } from "./triangular.js";
import { contornoOitavada } from "./formatos.js";
import { planoCircular } from "./circular.js";
import { calcA } from "./areas.js";
import { parseMoney } from "../services/dinheiro.js";

const num = (v) => parseFloat(String(v ?? "").replace(",", ".")) || 0;

// Spa externo no plano de corte da MANTA: até aqui o plano usava só comp×larg
// da piscina e o spa não saía da bobina — a manta vinha igual com e sem spa.
// O motor já sabe cortar anexo encostado (motor/manta.js, anexoExterno): a face
// que encosta não é parede, é linha de solda. Quando o spa é tanque SEPARADO
// essa face existe dos dois lados, então a divisória entra como parede extra.
export function spaDaManta(spa, L, W, D) {
  const sL = num(spa?.length), sW = num(spa?.width), sD = num(spa?.depth);
  if (!(spa?.on && sL > 0 && sW > 0 && sD > 0)) return { anexos: [], facesExtra: [] };
  const lado = (spa.side === "left" || spa.side === "right") ? W : L;
  const cont = Math.min(sL, lado || sL);
  return {
    anexos: [{ nome: "Spa", comp: cont, larg: sW, prof: sD, encaixe: "lado" }],
    facesExtra: spa.integrado === true ? [] : [{ nome: "Divisória do spa", comp: cont, prof: sD }],
  };
}

/**
 * Plano de corte da manta armada 1,5 mm para o orçamento.
 *
 * Só a manta é orçada por plano de corte de bobina; quem chama decide se o
 * vinil é manta (o vinil 0,7/0,8 segue por área e não passa por aqui).
 *
 * @param {object} o      { pool, poolFmt, spa, wMode, desenho }
 * @param {object} ar     resultado do calcA para o mesmo orçamento
 * @param {object} [opts] { aproveitarSobra } — a tira que sobra da última faixa
 * @returns {object|null} o plano, ou null quando não há medida para cortar
 */
export function planoMantaDoOrcamento({ pool, poolFmt, spa, wMode, desenho }, ar, { aproveitarSobra = false } = {}) {
  pool = pool || {};
  const L = num(pool.length), W = num(pool.width);
  const D = ar?.depthInfo?.avg || num(pool.depth);
  if (!(L > 0 && W > 0 && D > 0)) return null;
  const praiC = poolFmt === "Com prainha" ? num(pool.prainhaComp) : 0;
  const praiP = num(pool.prainhaProf);
  const perimetro = parseFloat(ar?.perim) || 0;
  const areaReal = parseFloat(ar?.tot) || 0;

  // desenho livre / formato irregular: as faixas seguem o contorno real
  const contorno = desenho && (desenho.vertices || []).length >= 3 ? contornoEfetivo(desenho) : null;
  if (contorno && contorno.length >= 3) {
    const chao = cortarChaoContorno(contorno, undefined, "Chão · desenho");
    const paredes = facesDoContorno(contorno, D);
    const spC = spaDaManta(spa, L, W, D);
    const base = planoManta({ comp: L, larg: W, prof: D, perimetro, areaReal,
      faces: [...paredes, ...spC.facesExtra], anexos: spC.anexos, aproveitarSobra });
    // troca o chão retangular pelo chão que acompanha o desenho
    const diff = chao.metrosLineares - base.chao.metrosLineares;
    return { ...base, chao: { partes: [chao], metrosLineares: chao.metrosLineares,
      emendas: chao.emendas, soldaLinear: chao.soldaLinear },
      metrosLineares: +(base.metrosLineares + diff).toFixed(2),
      areaCobravel: +((base.metrosLineares + diff) * 1.55).toFixed(2), contorno: true };
  }

  // TRIANGULAR tem plano próprio: paredes e chão não saem de comprimento ×
  // largura, e o ninho (costas + espelho do mesmo lado) muda a bobina. A
  // OITAVADA com banco usa o mesmo caminho sobre o contorno de 8 lados.
  if (poolFmt === "Triangular" || (poolFmt === "Oitavada" && pool.bancoOn)) {
    const banco = pool.bancoOn ? { larg: num(pool.bancoLarg), prof: num(pool.bancoProf) } : null;
    const pt = poolFmt === "Triangular"
      ? planoTriangular({ a: num(pool.triA), b: num(pool.triB), c: num(pool.triC), prof: D, banco })
      : planoTriangular({ contorno: contornoOitavada(L, W, num(pool.chanfro)), prof: D, banco });
    return pt.erro ? null : pt;
  }

  // CIRCULAR na regra do Marcos (23/09): parede é uma TIRA contornando até
  // fechar, e o plano horizontal sai do QUADRADO que envolve.
  if (poolFmt === "Circular") {
    const pc = planoCircular({ diametro: num(pool.diametro), prof: D,
      banco: pool.bancoOn ? { larg: num(pool.bancoLarg), prof: num(pool.bancoProf) } : null });
    return pc.erro ? null : pc;
  }

  // BANCO LATERAL muda a lista de paredes: o degrau corre no sentido do
  // comprimento, então a lateral do banco vira espelho + testeira do banco e
  // as testeiras saem com recorte. Prainha manda mais alto porque o plano
  // dela já existe e as duas juntas ainda não foram levantadas na obra.
  const bcM = bancoCfg(pool, poolFmt, L, W, D);
  const faces = praiC > 0 && praiC < L
    ? facesComPrainha(L, W, D, praiC, Math.min(praiP > 0 ? praiP : D * 0.25, Math.max(D - 0.05, 0.05)),
      { prainhaCorrida: (wMode || "regular") !== "irregular" })
    : (bcM && bcM.medida
      ? facesComBanco(L, W, D, bcM.larg, bcM.prof)
      : facesRetangulo(L, W, D));
  const sp = spaDaManta(spa, L, W, D);
  return planoManta({ comp: L, larg: W, prof: D, perimetro, areaReal, praiComp: praiC,
    faces: [...faces, ...sp.facesExtra], anexos: sp.anexos, aproveitarSobra });
}

/**
 * Quantidade que multiplica o preço de cada item.
 *   m²    área da piscina — ou, com manta armada, a MANTA CORTADA (o que sai
 *         da bobina: solda, dobras e a largura perdida ao lado de peça baixa)
 *   chao  só o fundo (manta acrílica) — com manta armada, as faixas do chão
 *   ml    perímetro
 *   solda metros de solda (só manta armada)
 *   un    a quantidade digitada
 */
export function quantidadeEfetiva(item, ar, manta) {
  if (item.un === "m²") return manta ? manta.areaCobravel : (parseFloat(ar?.tot) || 0);
  if (item.un === "chao") return manta ? +(manta.chao.metrosLineares * 1.55).toFixed(2) : (parseFloat(ar?.chaoTot) || 0);
  if (item.un === "ml") return parseFloat(ar?.perim) || 0;
  if (item.un === "solda") return manta ? manta.solda.total : 0;
  return item.q || 0;
}

/**
 * Custo, venda e total. `totOv` (valor final digitado) manda sobre o calculado,
 * e a mão de obra só entra no calculado — igual sempre foi.
 */
export function totalDoOrcamento({ items, ar, manta, mo, totOv }) {
  const inc = (items || []).filter((i) => i.on);
  const q = (i) => quantidadeEfetiva(i, ar, manta);
  const custo = inc.reduce((s, i) => s + q(i) * (i.c || 0), 0);
  const venda = inc.reduce((s, i) => s + q(i) * (i.c || 0) * (1 + (i.m || 0) / 100), 0);
  const calculado = venda + parseMoney(mo);
  return { custo, venda, calculado, total: parseMoney(totOv) || calculado };
}

/**
 * O total que um orçamento GRAVADO dá hoje, com o motor atual — o mesmo
 * caminho do PDF. `armada` vem de quem conhece o catálogo de vinil (App.jsx).
 */
export function totalDeHoje(d, armada) {
  const pool = d.pool || { length: "0", width: "0", depth: "0" };
  const spa = d.spa || { on: false, length: "0", width: "0", depth: "0" };
  const ar = calcA(pool, spa, d.wMode || "regular", d.walls || [], d.poolFmt, d.extras || [], d.spaType, d.desenho);
  const manta = armada
    ? planoMantaDoOrcamento({ pool, poolFmt: d.poolFmt, spa, wMode: d.wMode || "regular", desenho: d.desenho }, ar, { aproveitarSobra: !!d.mantaAproveita })
    : null;
  return totalDoOrcamento({ items: d.items, ar, manta, mo: d.mo, totOv: d.totOv }).total;
}

/**
 * O preço deste orçamento mudou desde que foi salvo?
 *
 * POR QUE EXISTE
 * Orçamento salvo não congela o preço: reabrir recalcula com o motor de hoje.
 * Medido em 24/09 renderizando o PDF dos 208 orçamentos: 12 dariam outro valor
 * se o PDF fosse gerado de novo (de −R$ 82 a +R$ 6.179) — 8 deles de manta
 * armada de agosto, porque a manta passou a ser cobrada pelo que sai da bobina
 * e não pela superfície. Sete estão em orçamento ou negociação. Quem já mandou
 * PDF para o cliente não pode ver o número mudar sozinho — mas a regra nova
 * pode estar certa para quem ainda vai receber. Então não se decide aqui: só
 * se avisa.
 *
 * @returns {{salvo:number, agora:number}|null}  null quando não há o que avisar
 */
export function precoMudou(q, armada) {
  if (!q?.data?.items || q.manual) return null; // registro manual não tem cálculo
  const salvo = parseFloat(q.tot) || 0;
  if (!(salvo > 0)) return null;
  const agora = totalDeHoje(q.data, armada);
  return Math.abs(agora - salvo) >= 1 ? { salvo, agora } : null;
}

/**
 * As medidas da piscina numa linha, do jeito que cada formato é descrito.
 *
 * Circular e triangular não mostram comprimento × largura na tela, mas o
 * estado do editor continua com eles (nasce 10,00 × 4,00). O resumo gravado
 * em `ps` (lista de Salvos e mensagem de WhatsApp) e o PDF simples do pipeline
 * saíam com essas medidas escondidas: uma redonda de 4 m ia para o cliente
 * como "10.00x4.00x1.40".
 */
export function resumoMedidas(poolFmt, pool, sep = "x") {
  const p = pool || {};
  if (poolFmt === "Triangular") return `${p.triA}/${p.triB}/${p.triC}${sep}${p.depth}`;
  if (poolFmt === "Circular") return `Ø${p.diametro}${sep}${p.depth}`;
  return `${p.length}${sep}${p.width}${sep}${p.depth}`;
}

/**
 * Valores das condições de pagamento a partir do total.
 *
 * Zero é valor de verdade: "entrada 0% + saldo 100%" existe na base. O PDF
 * fazia `pay.entPct || 50` e mostrava "0% + 100%" com uma entrada de 50% do
 * total — as duas parcelas somavam 150%.
 */
export function condicoesPagamento(total, pay) {
  const p = (v, padrao) => { const n = parseFloat(v); return Number.isFinite(n) ? n : padrao; };
  const pixD = p(pay?.pixD, 0), btcD = p(pay?.btcD, 0);
  const entPct = p(pay?.entPct, 50), balPct = p(pay?.balPct, 50);
  const noFee = p(pay?.noFee, 1) || 1;
  return {
    pix: total * (1 - pixD / 100),
    btc: total * (1 - btcD / 100),
    ent: total * entPct / 100,
    bal: total * balPct / 100,
    inst: total / noFee,
  };
}
