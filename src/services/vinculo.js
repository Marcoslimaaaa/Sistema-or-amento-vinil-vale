// Vínculo entre lead (orçamento) e conversa do WhatsApp.
//
// O bot já grava `crmQuoteId` na conversa quando o status do orçamento muda
// (services/crm-sync.js) — mas o painel nunca leu esse campo, cruzando tudo por
// telefone normalizado. Isso quebra em dois casos comuns: cliente que trocou de
// número, e cliente com mais de um orçamento (o telefone bate com os dois e o
// primeiro da lista ganha).
//
// Ordem de precedência:
//   1. vínculo manual salvo no painel (crmMeta.vinculos) — decisão humana
//   2. crmQuoteId gravado pelo bot
//   3. telefone normalizado (fallback histórico)

import { normalizePhone } from "../components/crm/regua.js";

/**
 * Acha a conversa de um lead.
 * @param {object} q         orçamento
 * @param {array}  waConvs   conversas carregadas do Firestore
 * @param {object} vinculos  mapa manual { [quoteId]: phone }
 */
export function conversaDoLead(q, waConvs, vinculos = {}) {
  if (!q || !waConvs?.length) return null;

  const manual = vinculos[q.id];
  if (manual) {
    const c = waConvs.find((c) => c.phone === manual);
    if (c) return c;
  }

  const porId = waConvs.find((c) => String(c.crmQuoteId || "") === String(q.id));
  if (porId) return porId;

  const tel = normalizePhone(q.data?.client?.phone || q.tel || "");
  if (!tel) return null;
  return waConvs.find((c) => normalizePhone(c.phone) === tel) || null;
}

/**
 * Acha o lead de uma conversa (caminho inverso, usado na aba WhatsApp).
 * Entre vários orçamentos do mesmo telefone, prefere o vínculo explícito e
 * depois o mais recente que ainda esteja em aberto — que é quase sempre o que
 * a pessoa está tratando na conversa.
 */
export function leadDaConversa(conv, hist, vinculos = {}) {
  if (!conv || !hist?.length) return null;

  const manualId = Object.keys(vinculos).find((qid) => vinculos[qid] === conv.phone);
  if (manualId) {
    const q = hist.find((h) => String(h.id) === String(manualId));
    if (q) return q;
  }

  if (conv.crmQuoteId) {
    const q = hist.find((h) => String(h.id) === String(conv.crmQuoteId));
    if (q) return q;
  }

  const tel = normalizePhone(conv.phone);
  if (!tel) return null;
  const candidatos = hist.filter(
    (h) => normalizePhone(h.data?.client?.phone || h.tel || "") === tel
  );
  if (candidatos.length === 0) return null;
  if (candidatos.length === 1) return candidatos[0];

  const abertos = candidatos.filter((h) => !["concluido", "perdido"].includes(h.status));
  const pool = abertos.length > 0 ? abertos : candidatos;
  // id é timestamp de criação — o maior é o mais recente
  return pool.reduce((a, b) => (Number(b.id) > Number(a.id) ? b : a));
}

/** Leads que compartilham o telefone da conversa (para o seletor de vínculo). */
export function leadsCandidatos(conv, hist) {
  if (!conv || !hist?.length) return [];
  const tel = normalizePhone(conv.phone);
  if (!tel) return [];
  return hist
    .filter((h) => normalizePhone(h.data?.client?.phone || h.tel || "") === tel)
    .sort((a, b) => Number(b.id) - Number(a.id));
}
