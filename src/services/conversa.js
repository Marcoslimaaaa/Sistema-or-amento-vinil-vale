// Conversa do bot como o painel lê — funções puras, testáveis sem o Vite.
//
// POR QUE ISSO EXISTE
// O painel trata `content` de cada mensagem como texto (.slice, .startsWith,
// render direto). Entre 06/10 e 12/10/2026 o bot gravou foto sem legenda como
// o OBJETO { message: "" }: uma única mensagem dessas como última da conversa
// dava tela branca na aba WhatsApp inteira ("ke.slice is not a function").
// O bot foi corrigido, mas o painel não pode depender disso — o histórico é
// escrito por outro sistema. Tudo que chega do Firestore passa por aqui.

const AVISO_IMAGEM = "(o cliente enviou uma imagem)";

/** `content` de uma mensagem do histórico, sempre string. */
export function textoDaMensagem(content) {
  if (typeof content === "string") return content;
  if (content == null) return "";
  if (typeof content.message === "string") return content.message.trim() ? content.message : AVISO_IMAGEM;
  // Array de blocos (formato da API do Claude): junta os textos.
  if (Array.isArray(content)) {
    return content.map((b) => (typeof b === "string" ? b : typeof b?.text === "string" ? b.text : "")).join(" ").trim();
  }
  return "";
}

/** Documento de whatsapp_conversations com o histórico garantido em texto. */
export function normalizarConversa(dados) {
  const d = dados || {};
  if (!Array.isArray(d.history)) return { ...d, history: [] };
  return {
    ...d,
    history: d.history
      .filter((m) => m && typeof m === "object")
      .map((m) => (typeof m.content === "string" ? m : { ...m, content: textoDaMensagem(m.content) })),
  };
}
