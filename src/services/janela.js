// Janela de 24h da Cloud API — funções puras, separadas do wa.js para poderem
// ser testadas sem o ambiente do Vite (import.meta.env).
//
// A regra da Meta: fora de 24h desde a última mensagem DO CLIENTE, texto livre
// é recusado (erro 131047) e só template aprovado passa. Espelha a mesma lógica
// do bot em services/followup.js — se mudar aqui, mude lá.

/** Timestamp (ms) da última mensagem do cliente, ou null. */
export function ultimaMensagemDoCliente(conv) {
  if (!conv) return null;

  // Campo dedicado, gravado pelo bot em conversation.js.
  const direto = conv.lastUserMessageAt;
  if (direto) {
    if (typeof direto === "number") return direto;
    if (direto.toMillis) return direto.toMillis();
    const ms = new Date(direto).getTime();
    if (!isNaN(ms)) return ms;
  }

  // Conversas anteriores a esse campo: procura o ts da última mensagem 'user'.
  const hist = conv.history || [];
  for (let i = hist.length - 1; i >= 0; i--) {
    if (hist[i]?.role === "user" && hist[i]?.ts) return hist[i].ts;
  }

  // lastActivity NÃO serve como fallback: ele também sobe quando o bot
  // responde, então uma conversa onde só o bot falou pareceria estar aberta.
  return null;
}

/**
 * A conversa está dentro da janela de 24h?
 * Na dúvida devolve false: template funciona sempre, texto livre fora da
 * janela é recusado e o cliente não recebe nada.
 */
export function dentroDaJanela(conv) {
  const t = ultimaMensagemDoCliente(conv);
  if (!t) return false;
  return Date.now() - t < 24 * 60 * 60 * 1000;
}

/** Horas restantes da janela (0 se já fechou). Para exibir na interface. */
export function horasRestantesDaJanela(conv) {
  const t = ultimaMensagemDoCliente(conv);
  if (!t) return 0;
  const restante = 24 * 60 * 60 * 1000 - (Date.now() - t);
  return restante > 0 ? Math.floor(restante / (60 * 60 * 1000)) : 0;
}
