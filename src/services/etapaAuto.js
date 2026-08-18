// Classificação automática de etapa do funil.
//
// POR QUE ISSO EXISTE
// Medido em 12/08/2026: 157 dos 170 orçamentos estavam parados em "lead", com
// ZERO em "perdido". Mudar de etapa era trabalho manual puro — e ninguém faz.
// Como quase todo número do painel (funil, taxa de conversão, ticket médio,
// tempo por etapa, análise de perdas, peso do lead score) é calculado em cima
// desse campo, o CRM inteiro estava medindo uma ficção.
//
// Aqui a etapa passa a ser DEDUZIDA do que o sistema já sabe: se o orçamento
// foi entregue, se o cliente voltou a falar depois disso, se pediu para parar
// de receber mensagem, há quanto tempo sumiu.
//
// ⚠️ REGRA DE OURO: MUDAR ETAPA PODE DISPARAR MENSAGEM AO CLIENTE.
// O bot escuta a coleção de orçamentos (services/crm-sync.js no repo do bot) e
// reage à mudança de status:
//
//   → 'orcamento'  grava `quoteSentAt = agora` SE a conversa ainda não tiver a
//                  data. Isso LIGA a régua de follow-up com o relógio zerado:
//                  mover 157 leads antigos de uma vez faria a régua disparar
//                  para toda a base no dia seguinte, cobrado como marketing,
//                  para gente que não fala com a empresa há meses. É o mesmo
//                  desastre que o FOLLOWUP_CUTOFF evitou em 30/07.
//   → 'fechou'     ENVIA "obrigado por fechar com a Vinil Vale 🎉" e marca
//                  dealClosedAt (que agenda o pós-venda). No painel ainda
//                  dispara o syncFinancas, lançando conta a receber.
//   → 'negociacao' não tem tratamento no bot. Não dispara nada.
//   → 'perdido'    só registra no log. Não dispara nada.
//
// Por isso a classificação é dividida em dois níveis, e não em um só:
//
//   automatico: true   nada é enviado ao cliente, pode aplicar em lote
//   automatico: false  precisa de confirmação humana, um a um
//
// Nenhuma regra aqui envia mensagem. Este módulo só decide e explica.

import { ultimaMensagemDoCliente } from "./janela.js";

/** Etapas que o motor nunca mexe: já são decisão humana tomada. */
const TERMINAIS = ["execucao", "concluido", "perdido"];

/** Ordem do funil — o motor só anda para frente. */
const ORDEM = ["lead", "orcamento", "negociacao", "fechou"];

const DIAS = 24 * 60 * 60 * 1000;

/** Converte Timestamp do Firestore / ISO / number em ms. Null se não der. */
export function ms(v) {
  if (!v) return null;
  if (typeof v === "number") return v;
  if (v.toMillis) return v.toMillis();
  const n = new Date(v).getTime();
  return isNaN(n) ? null : n;
}

/** Quando o orçamento foi entregue (ms), olhando os dois lados. */
export function entregueEm(q, conv) {
  return ms(conv?.quoteSentAt) || ms(q?.sentAt) || null;
}

/**
 * O cliente falou DEPOIS de receber o orçamento?
 *
 * É o sinal mais forte que existe de negociação: a pessoa recebeu o PDF e
 * voltou. Não interessa o que ela disse — voltar já basta. Interpretar o texto
 * é trabalho do bloco de LLM, não deste motor.
 */
export function respondeuDepoisDoOrcamento(q, conv) {
  const entrega = entregueEm(q, conv);
  if (!entrega) return false;
  const ultimaCliente = ultimaMensagemDoCliente(conv);
  if (!ultimaCliente) return false;
  // Margem de 2 minutos: o carimbo de entrega e o eco da mensagem podem chegar
  // fora de ordem, e "respondeu no mesmo minuto" não é resposta ao orçamento.
  return ultimaCliente > entrega + 2 * 60 * 1000;
}

/** Dias desde a última manifestação do cliente (não do bot). Null se nunca. */
export function diasDesdeOCliente(conv) {
  const t = ultimaMensagemDoCliente(conv);
  if (!t) return null;
  return Math.floor((Date.now() - t) / DIAS);
}

/**
 * Decide a etapa de um lead.
 *
 * O campo `quando` é o instante do EVENTO que justificou a mudança — não o
 * "agora" da reclassificação. Ele vira o `stageSince` do lead, e a diferença
 * importa: carimbar hoje em 157 leads faria o painel inteiro dizer "0 dias
 * nesta etapa" e o tempo médio por etapa do Analytics nascer zerado. Com a data
 * do evento, o histórico fica certo no mesmo instante em que é aplicado.
 *
 * @param {object} q     orçamento do CRM
 * @param {object} conv  conversa do WhatsApp vinculada (pode ser null)
 * @returns {null|{etapa,motivo,automatico,aviso,quando}}
 *   null quando não há nada a mudar.
 */
export function classificarEtapa(q, conv) {
  if (!q) return null;
  const atual = q.status || "lead";

  // Etapa terminal: decisão humana já tomada, o motor não desfaz.
  if (TERMINAIS.includes(atual)) return null;

  const entrega = entregueEm(q, conv);
  const temConversa = Boolean(conv);
  const paradoHa = diasDesdeOCliente(conv);

  // ── PERDIDO ────────────────────────────────────────────────────────────
  // Sempre com confirmação. Um falso positivo aqui tira da régua alguém que
  // ia fechar, e some com o lead sem ninguém entender por quê semanas depois
  // — exatamente o problema que a pausa de follow-up teve que resolver.

  // O próprio cliente pediu para parar de receber mensagem. O bot já detecta
  // isso (services/optout.js) e grava na conversa.
  if (conv?.followupPausado && conv?.followupPausadoPor === "cliente" && atual !== "fechou") {
    return {
      etapa: "perdido",
      motivo: "O cliente pediu para parar de receber mensagens",
      automatico: false,
      aviso: conv.followupPausadoTrecho ? `Disse: "${conv.followupPausadoTrecho}"` : null,
      quando: ms(conv.followupPausadoEm) || ultimaMensagemDoCliente(conv) || Date.now(),
    };
  }

  // Recebeu o orçamento, nunca mais deu sinal.
  if (entrega && paradoHa !== null && paradoHa >= 45 && !respondeuDepoisDoOrcamento(q, conv)) {
    return {
      etapa: "perdido",
      motivo: `Recebeu o orçamento e está há ${paradoHa} dias sem responder`,
      automatico: false,
      aviso: null,
      quando: ultimaMensagemDoCliente(conv) || entrega,
    };
  }

  // ── FECHOU ─────────────────────────────────────────────────────────────
  // NUNCA automático, mesmo com o interruptor de automação ligado.
  // Mover para 'fechou' faz o bot mandar "obrigado por fechar 🎉" ao cliente e
  // o painel lançar conta a receber no financas-pessoal. Errar aqui não é um
  // card fora do lugar: é uma mensagem constrangedora e uma receita falsa no
  // financeiro. Fechamento é decisão comercial, não dedução.
  if (conv?.dealClosedAt && atual !== "fechou") {
    return {
      etapa: "fechou",
      motivo: "O bot registrou o fechamento nesta conversa",
      automatico: false,
      aviso: "Confirma o lançamento no financeiro e manda o agradecimento ao cliente.",
      quando: ms(conv.dealClosedAt) || Date.now(),
    };
  }

  // ── NEGOCIAÇÃO ─────────────────────────────────────────────────────────
  // Seguro: o bot não tem tratamento para este status, nada é enviado.
  if (respondeuDepoisDoOrcamento(q, conv) && posicao(atual) < posicao("negociacao")) {
    return {
      etapa: "negociacao",
      motivo: "Respondeu depois de receber o orçamento",
      automatico: true,
      aviso: null,
      quando: ultimaMensagemDoCliente(conv),
    };
  }

  // ── ORÇAMENTO ──────────────────────────────────────────────────────────
  if (entrega && posicao(atual) < posicao("orcamento")) {
    // A conversa JÁ tem quoteSentAt: o bot vê o campo preenchido, mantém a data
    // e não liga régua nenhuma. Seguro.
    if (conv?.quoteSentAt) {
      return {
        etapa: "orcamento",
        motivo: "Orçamento entregue e registrado na conversa",
        automatico: true,
        aviso: null,
        quando: entrega,
      };
    }

    // Sem conversa: o crm-sync sai antes de fazer qualquer coisa (não acha
    // telefone válido). Também seguro.
    if (!temConversa) {
      return {
        etapa: "orcamento",
        motivo: "Orçamento entregue (lead sem conversa no WhatsApp)",
        automatico: true,
        aviso: null,
        quando: entrega,
      };
    }

    // Existe conversa mas SEM quoteSentAt. Este é o caso perigoso: aplicar faz
    // o bot carimbar a data de hoje e ligar a régua de follow-up do zero, com
    // mensagem paga saindo em 24h. Só com confirmação, e dizendo o que vai
    // acontecer.
    return {
      etapa: "orcamento",
      motivo: "Orçamento entregue pelo painel, mas a conversa não tem o registro",
      automatico: false,
      aviso: "Aplicar liga a régua de follow-up contando a partir de hoje — o cliente recebe a primeira mensagem em 24h.",
      quando: entrega,
    };
  }

  return null;
}

function posicao(etapa) {
  const i = ORDEM.indexOf(etapa);
  return i === -1 ? 99 : i;
}

/**
 * Roda o motor sobre a base inteira.
 *
 * @param {array}    hist        orçamentos
 * @param {function} achaConversa (q) => conv|null
 * @returns {{automaticas:array, revisar:array}}
 *   automaticas — nada é enviado ao cliente, aplicáveis em lote
 *   revisar     — precisam de confirmação, uma a uma
 */
export function classificarBase(hist, achaConversa) {
  const automaticas = [];
  const revisar = [];

  for (const q of hist || []) {
    const conv = achaConversa ? achaConversa(q) : null;
    const d = classificarEtapa(q, conv);
    if (!d) continue;
    const item = { q, conv, ...d, de: q.status || "lead" };
    (d.automatico ? automaticas : revisar).push(item);
  }

  // Maior valor primeiro: se a lista for longa, o que importa fica à vista.
  const porValor = (a, b) => (parseFloat(b.q.tot) || 0) - (parseFloat(a.q.tot) || 0);
  return { automaticas: automaticas.sort(porValor), revisar: revisar.sort(porValor) };
}
