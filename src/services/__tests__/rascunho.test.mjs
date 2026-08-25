// Teste do rascunho do orçamento em edição.
// Roda com: node src/services/__tests__/rascunho.test.mjs
import { CHAVE, VALIDADE_MS, assinatura, salvarRascunho, lerRascunho, limparRascunho, deveOferecer, descricaoRascunho } from "../rascunho.js";

let ok = 0, total = 0;
const check = (nome, real, esperado) => {
  total++;
  const passou = real === esperado;
  if (passou) ok++;
  console.log(`${passou ? "PASS" : "FALHOU"}  ${nome.padEnd(56)} → ${real} (esperado ${esperado})`);
};

// localStorage de mentira, com os mesmos defeitos do de verdade.
const mkStorage = (inicial = {}) => {
  const m = { ...inicial };
  return {
    getItem: (k) => (k in m ? m[k] : null),
    setItem: (k, v) => { m[k] = String(v); },
    removeItem: (k) => { delete m[k]; },
    _dados: m,
  };
};

const DATA = { client: { name: "João Silva", phone: "13999998888" }, pool: { length: "8.00" }, items: [] };
const T0 = 1755700000000; // referência fixa

// ── ida e volta ─────────────────────────────────────────────────────────
{
  const s = mkStorage();
  salvarRascunho({ data: DATA, editingId: null, tab: "cliente" }, { storage: s, agora: () => T0 });
  const r = lerRascunho({ storage: s, agora: () => T0 });
  check("volta o mesmo conteúdo", assinatura(r.data), assinatura(DATA));
  check("guarda a aba aberta", r.tab, "cliente");
  check("guarda o id em edição", r.editingId, null);
  check("marca a hora", r.ts, T0);
  check("não é recuperação automática por padrão", r.auto, false);
}

// ── validade ────────────────────────────────────────────────────────────
{
  const s = mkStorage();
  salvarRascunho({ data: DATA }, { storage: s, agora: () => T0 });
  const quase = lerRascunho({ storage: s, agora: () => T0 + VALIDADE_MS - 1000 });
  check("6 dias e pouco ainda vale", quase !== null, true);
  const velho = lerRascunho({ storage: s, agora: () => T0 + VALIDADE_MS + 1000 });
  check("passou de 7 dias, não devolve", velho, null);
  check("e apaga o registro velho", s.getItem(CHAVE), null);
}

// ── entrada estragada não derruba o editor ──────────────────────────────
check("JSON quebrado vira null", lerRascunho({ storage: mkStorage({ [CHAVE]: "{isso não é json" }) }), null);
check("versão antiga vira null", lerRascunho({ storage: mkStorage({ [CHAVE]: JSON.stringify({ v: 0, data: DATA, ts: T0 }) }), agora: () => T0 }), null);
check("registro sem data vira null", lerRascunho({ storage: mkStorage({ [CHAVE]: JSON.stringify({ v: 1, ts: T0 }) }), agora: () => T0 }), null);
check("storage vazio vira null", lerRascunho({ storage: mkStorage() }), null);

// Cota estourada é o caso real do celular com muita foto no cache: gravar
// falha, mas o editor tem que continuar de pé.
{
  const cheio = { getItem: () => null, setItem: () => { throw new Error("QuotaExceededError"); }, removeItem: () => {} };
  check("cota estourada devolve false sem explodir", salvarRascunho({ data: DATA }, { storage: cheio }), false);
}
check("salvar sem data devolve false", salvarRascunho({ data: null }, { storage: mkStorage() }), false);

// ── limpar ──────────────────────────────────────────────────────────────
{
  const s = mkStorage();
  salvarRascunho({ data: DATA }, { storage: s, agora: () => T0 });
  limparRascunho({ storage: s });
  check("limpou", lerRascunho({ storage: s, agora: () => T0 }), null);
}

// ── quando vale perguntar ───────────────────────────────────────────────
{
  const inicial = assinatura({ client: { name: "" }, pool: { length: "10.00" }, items: [] });
  const reg = { v: 1, ts: T0, data: DATA, editingId: null };
  check("editor mexido → oferece", deveOferecer(reg, { inicial, hist: [] }), true);
  check("editor intocado → não oferece", deveOferecer({ v: 1, ts: T0, data: JSON.parse(inicial) }, { inicial, hist: [] }), false);
  check("sem rascunho → não oferece", deveOferecer(null, { inicial, hist: [] }), false);

  // Orçamento já salvo, rascunho idêntico ao que está no histórico.
  const salvo = { id: 42, data: DATA };
  check("igual ao salvo → não oferece", deveOferecer({ v: 1, ts: T0, data: DATA, editingId: 42 }, { inicial, hist: [salvo] }), false);
  check("id em texto também casa", deveOferecer({ v: 1, ts: T0, data: DATA, editingId: "42" }, { inicial, hist: [salvo] }), false);

  // Mesmo orçamento, com edição que ainda não foi salva.
  const editado = { ...DATA, client: { ...DATA.client, phone: "13911112222" } };
  check("editado depois de salvar → oferece", deveOferecer({ v: 1, ts: T0, data: editado, editingId: 42 }, { inicial, hist: [salvo] }), true);
  check("id que sumiu do histórico → oferece", deveOferecer({ v: 1, ts: T0, data: DATA, editingId: 99 }, { inicial, hist: [salvo] }), true);
  check("histórico ausente não quebra", deveOferecer({ v: 1, ts: T0, data: DATA, editingId: 42 }, { inicial }), true);
}

// ── texto do aviso ──────────────────────────────────────────────────────
{
  const d = new Date(2026, 7, 19, 14, 32); // 19/08/2026 14:32 local
  check("descrição com nome", descricaoRascunho({ ts: d.getTime(), data: DATA }), "João Silva · 19/08 às 14:32");
  check("descrição sem nome", descricaoRascunho({ ts: d.getTime(), data: { client: { name: "  " } } }), "sem nome · 19/08 às 14:32");
  check("sem registro devolve vazio", descricaoRascunho(null), "");
}

console.log(`\n${ok}/${total} casos`);
process.exit(ok === total ? 0 : 1);
