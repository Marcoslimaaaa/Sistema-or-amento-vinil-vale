// Régua única de dias do CRM — fonte da verdade para follow-up,
// temperatura do lead e escada de resgate. Alterar aqui muda o app inteiro.
export const REGUA = {
  followUp: 5,      // dias sem contato para entrar na lista de follow-up
  quente: 2,        // ≤2d  🔥
  morno: 7,         // ≤7d  🌡️
  frio: 14,         // ≤14d ❄️  (acima disso: 🧊 gelado)
  resgate: {
    aguardando: 3,  // 3-8d   ⏳ aguardando resposta
    ligar: 9,       // 9-19d  📞 resgatar agora
    urgente: 20,    // 20-44d 🚨 urgente
    perda: 45,      // ≥45d   💀 sugerir perda
  },
  // dias ≥ este valor significam "sem nenhuma referência de contato" (lead sem data)
  desconhecido: 900,
};

export const normalizePhone = (p) => {
  const d = String(p || "").replace(/\D/g, "");
  if (!d) return "";
  return d.startsWith("55") ? d : "55" + d;
};

/**
 * Dois telefones são da mesma pessoa?
 *
 * Compara DDD + os 8 dígitos finais, porque a Meta entrega o número da conversa
 * SEM o 9 para todo DDD fora da faixa 11-28, enquanto o cadastro do orçamento é
 * digitado COM o 9. Comparar string exata fazia a conversa da Janice (41) e da
 * Maria das Graças (51) nunca casar com o orçamento delas: o card não abria o
 * chat e a janela de 24h era calculada como se não houvesse conversa.
 *
 * O DDD entra na conta de propósito — só os 8 finais casariam clientes de
 * cidades diferentes por acaso.
 */
export const mesmoTelefone = (a, b) => {
  const chave = (p) => {
    const d = String(p || "").replace(/\D/g, "");
    const s = d.startsWith("55") ? d.slice(2) : d;
    return s.length >= 10 ? s.slice(0, 2) + s.slice(-8) : "";
  };
  const x = chave(a), y = chave(b);
  return !!x && x === y;
};

export const openWaMe = (phone, msg) => {
  const full = normalizePhone(phone);
  if (!full) return false;
  window.open(`https://wa.me/${full}${msg ? "?text=" + encodeURIComponent(msg) : ""}`, "_blank");
  return true;
};
