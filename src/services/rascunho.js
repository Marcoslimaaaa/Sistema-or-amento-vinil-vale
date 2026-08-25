// Rascunho do orçamento em edição.
//
// POR QUE ISSO EXISTE
// O orçamento que está sendo montado vivia só na memória da aba: `gData()` só
// ia para o localStorage/Firestore quando o Marcos clicava em "Salvar" ou
// depois que o PDF terminava de ser gerado. Qualquer recarregamento antes
// disso apagava o trabalho e devolvia o editor em branco.
//
// E existia um recarregamento programado bem no pior momento: o botão "Baixar
// PDF" é o único ponto do sistema que precisa buscar arquivo novo no servidor
// (jspdf/html2canvas são carregados sob demanda). Quando esse download falhava
// — deploy novo no ar enquanto a aba estava aberta, ou rede móvel instável —,
// o código chamava `window.location.reload()` para se recuperar. O conserto
// custava o orçamento inteiro. Aconteceu 3 ou 4 vezes entre 24/07 e 20/08/2026.
//
// Aqui o estado do editor é gravado a cada mexida. Recarregar deixa de doer.

export const CHAVE = "vv_rascunho";
export const VERSAO = 1;
// Depois disso o rascunho é lixo: ou virou orçamento salvo, ou foi abandonado.
export const VALIDADE_MS = 7 * 24 * 60 * 60 * 1000;

const store = (opts) => (opts && opts.storage) || (typeof localStorage !== "undefined" ? localStorage : null);
const agoraMs = (opts) => ((opts && opts.agora) || Date.now)();

// Assinatura do conteúdo do editor. Serve para responder duas perguntas:
// "mexeram em alguma coisa?" e "esse rascunho é diferente do que já está
// salvo?". `gData()` monta as chaves sempre na mesma ordem, então comparar as
// strings basta.
export function assinatura(data) {
  try { return JSON.stringify(data ?? null); } catch { return ""; }
}

export function salvarRascunho(estado, opts) {
  const s = store(opts);
  if (!s || !estado || !estado.data) return false;
  const reg = {
    v: VERSAO,
    ts: agoraMs(opts),
    data: estado.data,
    editingId: estado.editingId ?? null,
    tab: estado.tab || null,
    // Marcado quando o próprio sistema provocou o recarregamento (aviso de
    // atualização). Nesse caso o orçamento volta sozinho — o usuário não
    // escolheu perder nada, não faz sentido pedir confirmação para devolver.
    auto: !!estado.auto,
  };
  try { s.setItem(CHAVE, JSON.stringify(reg)); return true; }
  catch { return false; } // cota estourada não pode derrubar o editor
}

export function lerRascunho(opts) {
  const s = store(opts);
  if (!s) return null;
  let reg;
  try { const cru = s.getItem(CHAVE); if (!cru) return null; reg = JSON.parse(cru); }
  catch { limparRascunho(opts); return null; }
  if (!reg || reg.v !== VERSAO || !reg.data) { limparRascunho(opts); return null; }
  if (agoraMs(opts) - (reg.ts || 0) > VALIDADE_MS) { limparRascunho(opts); return null; }
  return reg;
}

export function limparRascunho(opts) {
  const s = store(opts);
  if (!s) return;
  try { s.removeItem(CHAVE); } catch { /* nada a fazer */ }
}

// Só vale interromper o Marcos com "recuperar rascunho?" quando há trabalho de
// verdade para recuperar.
export function deveOferecer(reg, { inicial, hist } = {}) {
  if (!reg || !reg.data) return false;
  const atual = assinatura(reg.data);
  // Editor intocado: o rascunho é igual ao que a tela já mostra.
  if (inicial && atual === inicial) return false;
  // Orçamento já salvo e sem edição pendente: recuperar não devolve nada.
  if (reg.editingId != null && Array.isArray(hist)) {
    const salvo = hist.find((q) => String(q.id) === String(reg.editingId));
    if (salvo && assinatura(salvo.data) === atual) return false;
  }
  return true;
}

// Texto do aviso: quem era o cliente e de quando é o rascunho.
export function descricaoRascunho(reg) {
  if (!reg) return "";
  const nome = (reg.data?.client?.name || "").trim();
  const d = new Date(reg.ts || Date.now());
  const quando = `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")} às ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  return nome ? `${nome} · ${quando}` : `sem nome · ${quando}`;
}
