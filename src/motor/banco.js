// Banco lateral — a régua de assento que corre de ponta a ponta na lateral.
//
// POR QUE EXISTE
// A prainha resolve a ponta rasa (no sentido da LARGURA). O banco é o contrário:
// um bloco encostado numa lateral que atravessa a piscina no sentido do
// COMPRIMENTO, de uma testeira à outra. Não existia no sistema e apareceu numa
// obra real (22/09/2026).
//
// O QUE O USUÁRIO DIGITA
//   largura  – quanto o banco avança para dentro da piscina
//   profundidade – da BORDA da piscina até o assento, exatamente como se mede a
//              prainha. NÃO é lâmina de água: o vinil sobe até a borda, e o
//              nível da água não entra na conta (correção do Marcos, 22/09).
//   lado     – "cima" ou "baixo", que é como o banco aparece na planta (o
//              comprimento corre na horizontal, então os dois lados possíveis
//              são a borda de cima e a de baixo do desenho). Dizer
//              "esquerda/direita" seria mentira: depende de onde a pessoa está.
//
// A altura do bloco é o que sobra: profundidade − lâmina.
//
// O QUE MUDA NA CONTA (e por quê)
//   CHÃO: não muda. O banco tampa um pedaço do fundo e devolve a mesma área no
//   topo do assento — é o mesmo vinil, noutro nível.
//   PAREDE: diminui. Onde o banco encosta na testeira, aquele pedaço de parede
//   deixa de existir (fica atrás do bloco). A lateral continua valendo o mesmo:
//   o que se perde em parede alta se ganha na face vertical do banco.
//   VOLUME: diminui — o bloco ocupa água (comprimento × largura × altura).
//
// Sem medida o banco é só desenho e não mexe em preço nenhum, igual à prainha.

import { pontaCfg, lerDegraus, faltouVirgula, DEGRAU_MINIMO } from "./niveis.js";

/** Formatos em que o banco de ponta a ponta faz sentido geométrico. */
export const FORMATOS_COM_BANCO = ["Retangular", "Retangular irregular", "Com prainha", "Com Spa"];

const pf = (v) => parseFloat(String(v ?? "").replace(",", ".")) || 0;
const n2 = (v) => v.toFixed(2).replace(".", ",");

/**
 * Lê os campos do orçamento e devolve o banco já validado, ou null.
 *
 * ESCADA LATERAL (24/10/2026): `pool.bancoDegraus` = [{larg, prof}] são os
 * degraus que vêm DEPOIS do banco, cada um mais fundo e mais para dentro da
 * piscina. Com eles o banco vira uma escada que corre a lateral inteira, e a
 * medida passa a ser conferida com rigor — degrau fora de ordem ou escada larga
 * demais vira `erro` (o orçamento trava), em vez do ajuste com aviso do banco
 * simples. Sem degrau extra, nada muda.
 *
 * @returns {null|{larg,prof,altura,lado,comprimento,sobreTrechoFundo,medida,aviso,
 *                 niveis,x0,erro}}
 *   larg   largura TOTAL (todos os degraus juntos)
 *   prof   profundidade do 1º degrau — o assento, no banco simples
 *   niveis [{larg, prof}] do 1º degrau (encostado na parede) para dentro
 *   x0     onde a escada começa no comprimento (depois da prainha/degraus da ponta)
 */
export function bancoCfg(pool, poolFmt, L, W, D) {
  if (!pool?.bancoOn) return null;
  if (!FORMATOS_COM_BANCO.includes(poolFmt)) return null;

  const larg = pf(pool.bancoLarg);
  const prof = pf(pool.bancoProf);   // da borda até o assento
  const lado = pool.bancoLado === "baixo" ? "baixo" : "cima";
  const { lista: extras, erro: erroExtras } = lerDegraus(pool.bancoDegraus, { campoA: "larg", campoP: "prof", nome: "Degrau", inicio: 2 });
  // Sem medida: desenho ilustrativo, largura de mentirinha e nada na conta.
  const medida = larg > 0 && prof > 0;
  if (!medida) {
    const erro = erroExtras || (extras.length ? "Escada lateral: preencha a largura e a profundidade do 1º degrau." : null);
    return { larg: Math.min(W * 0.15, 0.5), prof: Math.min(D * 0.3, 0.4), altura: 0, lado, comprimento: 0, sobreTrechoFundo: false, medida: false, aviso: null, niveis: [], x0: 0, erro };
  }

  // Onde a lateral começa: depois da prainha, ou depois de todos os níveis da
  // ponta quando ela tem degraus (motor/niveis.js).
  const ponta = pontaCfg(pool, poolFmt, L, W, D);
  const praiC = poolFmt === "Com prainha" ? pf(pool.prainhaComp) : 0;
  const inicio = ponta && !ponta.erro ? ponta.fim : (praiC > 0 && praiC < L ? praiC : 0);

  // ── ESCADA LATERAL: 2 ou mais degraus ─────────────────────────────────────
  if (erroExtras || extras.length) {
    const falha = (erro) => ({ larg, prof, altura: Math.max(D - prof, 0), lado, comprimento: 0, sobreTrechoFundo: false, medida: false, aviso: null, niveis: [], x0: 0, erro });
    // O 1º degrau usa os campos do banco; a trava do "030" só entra aqui, na
    // escada — o banco de um nível segue como sempre foi.
    const virgula = faltouVirgula(pool.bancoLarg, "Degrau 1: a largura") || faltouVirgula(pool.bancoProf, "Degrau 1: a profundidade");
    if (virgula) return falha(virgula);
    if (erroExtras) return falha(erroExtras);
    const niveis = [{ larg, prof }, ...extras.map((e) => ({ larg: e.a, prof: e.p }))];
    let ant = 0;
    for (let i = 0; i < niveis.length; i++) {
      if (niveis[i].prof < ant + DEGRAU_MINIMO - 1e-9) {
        return falha(`Escada lateral: o degrau ${i + 1} (${n2(niveis[i].prof)} m) tem de ficar pelo menos 5 cm abaixo do ${i ? `degrau ${i} (${n2(ant)} m)` : "nível da borda"}.`);
      }
      ant = niveis[i].prof;
    }
    if (ant > D - DEGRAU_MINIMO + 1e-9) {
      return falha(`Escada lateral: o último degrau (${n2(ant)} m) tem de ficar pelo menos 5 cm acima do fundo (${n2(D)} m).`);
    }
    const total = niveis.reduce((s, n) => s + n.larg, 0);
    if (total > W * 0.45 + 1e-9) {
      return falha(`Escada lateral de ${n2(total)} m de largura numa piscina de ${n2(W)} m: passa de 45% da largura. Confira as medidas — isso já é outro nível de piscina, não escada.`);
    }
    return {
      larg: total,
      prof,
      altura: Math.max(D - prof, 0),
      lado,
      comprimento: L - inicio,
      sobreTrechoFundo: inicio > 0,
      medida: true,
      aviso: null,
      niveis,
      x0: inicio,
      erro: null,
    };
  }

  let aviso = null;
  // Banco mais largo que a piscina não é banco, é fundo. Trava em 45% da
  // largura: acima disso o cliente está descrevendo outra coisa (prainha,
  // spa, piscina em dois níveis) e o desenho sairia mentindo.
  let largUsada = larg;
  if (larg >= W * 0.45) {
    largUsada = W * 0.45;
    aviso = `Banco de ${larg.toFixed(2).replace(".", ",")} m em piscina de ${W.toFixed(2).replace(".", ",")} m de largura: limitado a ${largUsada.toFixed(2).replace(".", ",")} m no cálculo. Confirme a medida.`;
  }
  let profUsada = prof;
  if (prof >= D) {
    profUsada = Math.max(D - 0.1, 0.05);
    aviso = `Banco de ${prof.toFixed(2).replace(".", ",")} m de profundidade em piscina de ${D.toFixed(2).replace(".", ",")} m: o assento ficaria no fundo. Usado ${profUsada.toFixed(2).replace(".", ",")} m.`;
  }

  // Com prainha de medida, o banco corre só o trecho fundo: em cima da prainha
  // não há banco, há prainha (e com degraus na ponta, depois deles).
  const sobreTrechoFundo = inicio > 0;
  const comprimento = sobreTrechoFundo ? L - inicio : L;

  return {
    larg: largUsada,
    prof: profUsada,
    altura: Math.max(D - profUsada, 0),
    lado,
    comprimento,
    sobreTrechoFundo,
    medida: true,
    aviso,
    niveis: [{ larg: largUsada, prof: profUsada }],
    x0: inicio,
    erro: null,
  };
}

/**
 * Quanto o banco tira (ou põe) na conta da piscina.
 *
 * @param {object} b   saída do bancoCfg
 * @param {object} dim {L, W, D, prainhaProf} em metros
 * @returns {{chao:number, parede:number, volume:number}} deltas em m² / m³
 */
export function ajusteBanco(b, { D = 0, prainhaProf = 0 } = {}) {
  if (!b || !b.medida || b.altura <= 0 || b.comprimento <= 0) return { chao: 0, parede: 0, volume: 0 };

  // Testeiras: o bloco cobre um retângulo largura × altura em cada ponta que
  // ele encosta. De ponta a ponta são duas; encostado na prainha é uma só,
  // mais o pedaço do degrau da prainha que o bloco tapa.
  let parede = -b.larg * b.altura;
  if (!b.sobreTrechoFundo) {
    parede += -b.larg * b.altura;
  } else {
    const alturaDegrau = Math.max(D - prainhaProf, 0);
    parede += -b.larg * Math.min(b.altura, alturaDegrau);
  }

  return {
    chao: 0,                                     // o topo do assento devolve o fundo tampado
    parede,
    volume: -(b.comprimento * b.larg * b.altura),
  };
}

/** Linha do resumo/PDF. O lado sai como está na planta, nunca como "esquerda". */
export function textoBanco(b) {
  if (!b || !b.medida) return null;
  const n = (v) => v.toFixed(2).replace(".", ",");
  if ((b.niveis || []).length > 1) {
    const degs = b.niveis.map((d, i) => `D${i + 1} ${n(d.larg)} × ${n(d.prof)} m`).join(" → ");
    return `Escada lateral · ${b.niveis.length} degraus (${degs}) · ${n(b.comprimento)} m de extensão`;
  }
  return `Banco lateral · ${n(b.larg)} m de largura × ${n(b.comprimento)} m de extensão · assento a ${n(b.prof)} m da borda (bloco de ${n(b.altura)} m de altura)`;
}
