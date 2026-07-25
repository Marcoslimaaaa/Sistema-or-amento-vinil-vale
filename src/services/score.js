// Lead scoring e SLA de primeiro contato.
//
// O pipeline hoje ordena por data e a lista por nome/valor — nenhum dos dois
// responde a pergunta que importa de manhã: "quem eu ligo primeiro?". O score
// combina os sinais que o sistema já tem para responder isso.

import { REGUA } from "../components/crm/regua.js";

const ETAPA_PESO = {
  negociacao: 1.4,  // já discutindo valor — mais perto de fechar
  orcamento: 1.2,   // recebeu proposta
  lead: 1.0,
  fechou: 0, execucao: 0, concluido: 0, perdido: 0, // fora da disputa
};

/**
 * Prioridade de um lead, de 0 a 100.
 *
 * Combina quatro sinais:
 *   valor      — quanto maior o orçamento, mais vale o tempo gasto
 *   etapa      — quem está em negociação fecha antes de quem é lead novo
 *   recência   — a curva sobe até a régua de follow-up e depois CAI: lead de
 *                90 dias não é mais urgente que o de 7, é mais frio
 *   engajamento— cliente que respondeu no WhatsApp vale mais que silêncio
 */
export function leadScore({ q, dias, conv, maiorValor }) {
  const etapa = q.status || "lead";
  const pesoEtapa = ETAPA_PESO[etapa] ?? 1;
  if (pesoEtapa === 0) return 0;

  const valor = parseFloat(q.tot) || 0;
  const teto = maiorValor > 0 ? maiorValor : 1;
  const nValor = Math.min(valor / teto, 1); // 0..1

  // Urgência: cresce até followUp, fica no topo até 'frio', depois decai.
  let urgencia;
  if (dias >= REGUA.desconhecido) urgencia = 0.3; // sem referência de contato
  else if (dias <= REGUA.followUp) urgencia = dias / REGUA.followUp;
  else if (dias <= REGUA.frio) urgencia = 1;
  else urgencia = Math.max(0.2, 1 - (dias - REGUA.frio) / 60);

  // Engajamento: respondeu alguma vez? falou por último?
  let engajamento = 0.3;
  const hist = conv?.history || [];
  if (hist.length > 0) {
    const doCliente = hist.filter((m) => m.role === "user").length;
    if (doCliente > 0) engajamento = 0.7;
    if (doCliente >= 3) engajamento = 0.9;
    if (hist[hist.length - 1]?.role === "user") engajamento = 1; // esperando resposta NOSSA
  }

  const bruto = (nValor * 0.35 + urgencia * 0.3 + engajamento * 0.35) * pesoEtapa;
  return Math.round(Math.min(bruto, 1.4) / 1.4 * 100);
}

export function faixaScore(score) {
  if (score >= 70) return { label: "Alta", cor: "#dc2626" };
  if (score >= 45) return { label: "Média", cor: "#f59e0b" };
  return { label: "Baixa", cor: "#64748b" };
}

// ============================================================
// SLA de primeiro contato
// ============================================================

const SLA_HORAS = 1;

/**
 * A conversa está esperando a PRIMEIRA resposta humana há mais de 1h?
 *
 * A própria análise de perdas do sistema aponta "sem retorno" como causa
 * dominante — este é o alerta que ataca isso na origem.
 *
 * Só conta quando a última mensagem é do cliente: se a empresa (ou o bot) já
 * respondeu, não há SLA estourando.
 */
export function slaEstourado(conv) {
  if (!conv) return false;
  const hist = conv.history || [];
  if (hist.length === 0) return false;
  if (hist[hist.length - 1]?.role !== "user") return false;

  const t = ultimaMensagemMs(conv);
  if (!t) return false;
  return Date.now() - t > SLA_HORAS * 60 * 60 * 1000;
}

/** Há quantas horas o cliente está esperando resposta (0 se não está). */
export function horasEsperando(conv) {
  if (!slaEstourado(conv)) return 0;
  const t = ultimaMensagemMs(conv);
  return Math.floor((Date.now() - t) / (60 * 60 * 1000));
}

function ultimaMensagemMs(conv) {
  const v = conv?.lastUserMessageAt || conv?.lastActivity;
  if (!v) return null;
  if (typeof v === "number") return v;
  if (v.toMillis) return v.toMillis();
  const ms = new Date(v).getTime();
  return isNaN(ms) ? null : ms;
}

/** Conversas aguardando resposta humana há mais de 1h, das mais antigas primeiro. */
export function conversasSemResposta(waConvs) {
  return (waConvs || [])
    .filter(slaEstourado)
    .map((c) => ({ conv: c, horas: horasEsperando(c) }))
    .sort((a, b) => b.horas - a.horas);
}
