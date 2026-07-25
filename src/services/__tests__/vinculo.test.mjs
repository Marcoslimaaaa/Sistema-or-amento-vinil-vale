import { conversaDoLead, leadDaConversa, leadsCandidatos } from "../vinculo.js";
import { montarTimeline } from "../timeline.js";

let ok = 0, total = 0;
const check = (nome, real, esperado) => {
  total++;
  const passou = JSON.stringify(real) === JSON.stringify(esperado);
  if (passou) ok++;
  console.log(`${passou ? "PASS" : "FALHOU"}  ${nome.padEnd(48)} → ${JSON.stringify(real)}`);
  if (!passou) console.log(`        esperado: ${JSON.stringify(esperado)}`);
};

const convA = { phone: "5513996781966", crmQuoteId: "1000" };
const convB = { phone: "5513991112222" };
const convs = [convA, convB];

const q1000 = { id: "1000", cN: "Maria", data: { client: { phone: "13996781966" } }, status: "lead" };
const q2000 = { id: "2000", cN: "Maria (2o orcamento)", data: { client: { phone: "13996781966" } }, status: "lead" };
const q3000 = { id: "3000", cN: "Joao", data: { client: { phone: "(13) 99111-2222" } }, status: "perdido" };
const hist = [q1000, q2000, q3000];

// --- lead → conversa ---
check("por crmQuoteId", conversaDoLead(q1000, convs)?.phone, "5513996781966");
check("por telefone (sem crmQuoteId)", conversaDoLead(q3000, convs)?.phone, "5513991112222");
check("telefone formatado normaliza", conversaDoLead({ id: "9", data: { client: { phone: "(13) 99678-1966" } } }, convs)?.phone, "5513996781966");
check("vinculo manual tem precedencia", conversaDoLead(q1000, convs, { 1000: "5513991112222" })?.phone, "5513991112222");
check("lead sem telefone", conversaDoLead({ id: "9", data: {} }, convs), null);
check("sem conversas", conversaDoLead(q1000, []), null);

// --- conversa → lead ---
check("crmQuoteId aponta o orcamento certo", leadDaConversa(convA, hist)?.id, "1000");
check("dois orcamentos no mesmo tel → mais recente", leadDaConversa({ phone: "5513996781966" }, hist)?.id, "2000");
check("vinculo manual vence o crmQuoteId", leadDaConversa(convA, hist, { 2000: "5513996781966" })?.id, "2000");
check("telefone sem lead", leadDaConversa({ phone: "5511000000000" }, hist), null);

// prefere aberto sobre fechado
const q4000 = { id: "4000", cN: "Ana", data: { client: { phone: "13990000000" } }, status: "concluido" };
const q4001 = { id: "4001", cN: "Ana", data: { client: { phone: "13990000000" } }, status: "negociacao" };
check("prefere lead aberto ao concluido", leadDaConversa({ phone: "5513990000000" }, [q4001, q4000])?.id, "4001");

check("candidatos pelo telefone", leadsCandidatos(convA, hist).map(q => q.id), ["2000", "1000"]);

// --- timeline ---
const agora = Date.now();
const tl = montarTimeline(
  [{ tipo: "nota", texto: "ligou", ts: agora - 5000 }],
  { lastActivity: agora, history: [{ role: "user", content: "oi", ts: agora - 10000 }, { role: "assistant", content: "ola" }] }
);
check("timeline junta CRM + conversa", tl.length, 3);
check("timeline ordena do mais recente", tl[0].texto, "ola");
check("origem do cliente marcada", tl.find(i => i.texto === "oi")?.origem, "cliente");
check("msg sem ts marcada como aproximada", tl.find(i => i.texto === "ola")?.tsAproximado, true);
check("timeline vazia", montarTimeline([], null).length, 0);

// data BR sem ts não some da timeline
const tl2 = montarTimeline([{ tipo: "nota", texto: "antiga", data: "01/07/2026" }], null);
check("interacao antiga com data BR entra", tl2.length, 1);

console.log(`\n${ok}/${total} casos`);
process.exit(ok === total ? 0 : 1);
