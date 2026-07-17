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

export const openWaMe = (phone, msg) => {
  const full = normalizePhone(phone);
  if (!full) return false;
  window.open(`https://wa.me/${full}${msg ? "?text=" + encodeURIComponent(msg) : ""}`, "_blank");
  return true;
};
