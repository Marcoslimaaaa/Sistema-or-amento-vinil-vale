// O que a régua do bot já fez com este lead.
//
// POR QUE ISSO EXISTE
// O sistema tinha DUAS réguas que não se falavam:
//
//   bot     dispara por `quoteSentAt` nos dias 1, 2, 3, 7, 14 e 30
//   painel  dispara por "5 dias sem contato" (REGUA.followUp), com outro texto
//
// O TodayTasks recebia só os orçamentos e as datas — não as conversas. Não
// tinha como saber que o bot mandou mensagem ontem, então pedia um contato
// manual por cima da régua automática, com um texto diferente, para o mesmo
// cliente. É a mesma sobreposição corrigida na v1.6.1 do bot (sem-resposta ×
// orçamento), só que atravessando os dois sistemas.
//
// Aqui o painel passa a ler os carimbos que o bot já gravava (`followups.*`) e
// a pausa (`followupPausado`). Nada de novo precisou ser gravado no bot.

/** Quantas horas o painel espera antes de sugerir contato manual. */
export const CARENCIA_HORAS = 48;

/** Timestamp (ms) do último follow-up automático, ou null. */
export function ultimoFollowup(conv) {
  const carimbos = conv?.followups;
  if (!carimbos) return null;
  let maior = null;
  let chave = null;
  for (const [k, v] of Object.entries(carimbos)) {
    const ms = new Date(v).getTime();
    if (isNaN(ms)) continue;
    if (maior === null || ms > maior) { maior = ms; chave = k; }
  }
  return maior === null ? null : { ts: maior, chave };
}

/**
 * O bot cuidou deste lead há pouco?
 *
 * A carência de 48h existe porque as batidas do bot são de 1, 2 e 3 dias: uma
 * janela menor deixaria o painel pedir contato manual entre duas mensagens
 * automáticas, que é exatamente o que se quer evitar.
 */
export function botCuidouRecente(conv, agora = Date.now()) {
  const ult = ultimoFollowup(conv);
  if (!ult) return false;
  return agora - ult.ts < CARENCIA_HORAS * 3600 * 1000;
}

/** Follow-up automático pausado para este número? */
export function followupPausado(conv) {
  return Boolean(conv?.followupPausado);
}

const ROTULO = {
  quote_24h: "orçamento recebido", quote_1d: "orçamento recebido",
  quote_3d: "dúvidas do orçamento", quote_7d: "condições de pagamento",
  quote_14d: "retomada", quote_30d: "retomada",
  no_response_1d: "sem resposta", no_response_2d: "sem resposta",
  no_response_3d: "sem resposta", no_response_5d: "conversa parada",
  post_sale_30d: "pós-venda", birthday: "aniversário",
};

/**
 * Uma linha explicando o que o bot fez, para aparecer ao lado da tarefa.
 * Null quando o bot não tocou neste lead.
 */
export function resumoDaRegua(conv, agora = Date.now()) {
  if (followupPausado(conv)) {
    return conv.followupPausadoPor === "cliente"
      ? "🔕 o cliente pediu para parar"
      : "🔕 follow-up pausado";
  }
  const ult = ultimoFollowup(conv);
  if (!ult) return null;
  const dias = Math.floor((agora - ult.ts) / 86400000);
  const chave = ult.chave.replace(/^(birthday|holiday)_.*/, "$1");
  const nome = ROTULO[chave] || chave;
  const quando = dias === 0 ? "hoje" : dias === 1 ? "ontem" : `há ${dias} dias`;
  return `🤖 bot mandou "${nome}" ${quando}`;
}

/**
 * Deve sair da lista de contato manual?
 *
 * Pausado sai sempre: insistir à mão em quem pediu para parar é pior do que a
 * mensagem automática que já foi desligada por isso.
 */
export function escondeDaLista(conv, agora = Date.now()) {
  return followupPausado(conv) || botCuidouRecente(conv, agora);
}
