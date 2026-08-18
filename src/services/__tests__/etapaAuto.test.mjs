// Teste do motor de classificação de etapa.
// Roda com: node src/services/__tests__/etapaAuto.test.mjs
//
// O foco dos casos é o que NÃO pode acontecer: mover para 'fechou' sozinho
// (manda mensagem ao cliente e lança receita), mover para 'orcamento' sem
// quoteSentAt na conversa (liga a régua com o relógio zerado) e andar para trás.
import {
  classificarEtapa,
  classificarBase,
  respondeuDepoisDoOrcamento,
  entregueEm,
} from "../etapaAuto.js";

const D = (dias) => Date.now() - dias * 24 * 3600 * 1000;
let ok = 0, total = 0;
const check = (nome, real, esperado) => {
  total++;
  const passou = real === esperado;
  if (passou) ok++;
  console.log(`${passou ? "PASS" : "FALHOU"}  ${nome.padEnd(58)} → ${real} (esperado ${esperado})`);
};

const etapaDe = (q, conv) => classificarEtapa(q, conv)?.etapa ?? null;
const autoDe = (q, conv) => {
  const d = classificarEtapa(q, conv);
  return d ? d.automatico : null;
};

// ── Nada a fazer ────────────────────────────────────────────────────────
check("lead sem orçamento e sem conversa", etapaDe({ id: 1, status: "lead" }, null), null);
check("lead com conversa mas sem entrega", etapaDe({ id: 1, status: "lead" }, { phone: "5513", lastUserMessageAt: D(1) }), null);
check("orçamento não anda para trás", etapaDe({ id: 1, status: "negociacao", sentAt: D(3) }, { quoteSentAt: D(3) }), null);
check("execução é terminal", etapaDe({ id: 1, status: "execucao", sentAt: D(3) }, { quoteSentAt: D(3), dealClosedAt: D(1) }), null);
check("concluído é terminal", etapaDe({ id: 1, status: "concluido" }, { dealClosedAt: D(1) }), null);
check("perdido é terminal", etapaDe({ id: 1, status: "perdido" }, { quoteSentAt: D(3) }), null);
check("orçamento parado 10d não vira perdido ainda", etapaDe({ id: 1, status: "orcamento", sentAt: D(10) }, { quoteSentAt: D(10), lastUserMessageAt: D(10) }), null);

// ── Lead → Orçamento ────────────────────────────────────────────────────
check("entregue e registrado na conversa", etapaDe({ id: 1, status: "lead" }, { quoteSentAt: D(2) }), "orcamento");
check("...e é automático (bot mantém a data)", autoDe({ id: 1, status: "lead" }, { quoteSentAt: D(2) }), true);
check("entregue, lead sem conversa", etapaDe({ id: 1, status: "lead", sentAt: D(2) }, null), "orcamento");
check("...e é automático (crm-sync nem roda)", autoDe({ id: 1, status: "lead", sentAt: D(2) }, null), true);
// O caso perigoso: conversa existe e NÃO tem quoteSentAt. Aplicar carimba a
// data de hoje no bot e liga a régua de follow-up do zero.
check("entregue no painel, conversa sem registro", etapaDe({ id: 1, status: "lead", sentAt: D(2) }, { phone: "5513", lastUserMessageAt: D(20) }), "orcamento");
check("...NÃO é automático (ligaria a régua hoje)", autoDe({ id: 1, status: "lead", sentAt: D(2) }, { phone: "5513", lastUserMessageAt: D(20) }), false);
check("...e avisa o que vai acontecer", Boolean(classificarEtapa({ id: 1, status: "lead", sentAt: D(2) }, { phone: "5513", lastUserMessageAt: D(20) }).aviso), true);

// ── Lead/Orçamento → Negociação ─────────────────────────────────────────
const respondeu = { quoteSentAt: D(5), lastUserMessageAt: D(3) };
check("respondeu depois do orçamento", etapaDe({ id: 1, status: "orcamento" }, respondeu), "negociacao");
check("...e é automático (bot não trata o status)", autoDe({ id: 1, status: "orcamento" }, respondeu), true);
check("pula lead direto para negociação", etapaDe({ id: 1, status: "lead" }, respondeu), "negociacao");
check("falou ANTES do orçamento não conta", etapaDe({ id: 1, status: "orcamento" }, { quoteSentAt: D(3), lastUserMessageAt: D(9) }), null);
check("falou no mesmo minuto não conta", etapaDe({ id: 1, status: "orcamento" }, { quoteSentAt: D(3), lastUserMessageAt: D(3) }), null);
check("só o bot falou depois", etapaDe({ id: 1, status: "orcamento" }, { quoteSentAt: D(5), lastActivity: D(1) }), null);
check("respondeu, mas já está em negociação", etapaDe({ id: 1, status: "negociacao" }, respondeu), null);

// ── Fechou — nunca automático ───────────────────────────────────────────
const fechado = { quoteSentAt: D(20), dealClosedAt: D(2) };
check("dealClosedAt sugere fechou", etapaDe({ id: 1, status: "orcamento" }, fechado), "fechou");
check("...mas NUNCA sozinho (manda msg + lança receita)", autoDe({ id: 1, status: "orcamento" }, fechado), false);
check("já está em fechou: nada a fazer", etapaDe({ id: 1, status: "fechou" }, fechado), null);

// ── Perdido — nunca automático ──────────────────────────────────────────
const pediuParar = { quoteSentAt: D(10), followupPausado: true, followupPausadoPor: "cliente", followupPausadoTrecho: "não tenho mais interesse" };
check("cliente pediu para parar", etapaDe({ id: 1, status: "orcamento" }, pediuParar), "perdido");
check("...nunca automático", autoDe({ id: 1, status: "orcamento" }, pediuParar), false);
check("...mostra o que o cliente disse", classificarEtapa({ id: 1, status: "orcamento" }, pediuParar).aviso.includes("não tenho mais interesse"), true);
// Pausa feita pelo Marcos no comando não é desistência do cliente.
check("pausa por comando não vira perdido", etapaDe({ id: 1, status: "orcamento" }, { quoteSentAt: D(10), followupPausado: true, followupPausadoPor: "comando", lastUserMessageAt: D(10) }), null);
check("sumiu há 50 dias com orçamento", etapaDe({ id: 1, status: "orcamento", sentAt: D(50) }, { quoteSentAt: D(50), lastUserMessageAt: D(50) }), "perdido");
check("...nunca automático", autoDe({ id: 1, status: "orcamento", sentAt: D(50) }, { quoteSentAt: D(50), lastUserMessageAt: D(50) }), false);
check("sumiu há 50 dias MAS respondeu ao orçamento", etapaDe({ id: 1, status: "orcamento", sentAt: D(60) }, { quoteSentAt: D(60), lastUserMessageAt: D(50) }), "negociacao");
check("quem já fechou não vira perdido por pausa", etapaDe({ id: 1, status: "fechou" }, { ...pediuParar, dealClosedAt: D(5) }), null);

// ── Base inteira ────────────────────────────────────────────────────────
const hist = [
  { id: 1, status: "lead", tot: "10000" },                     // nada
  { id: 2, status: "lead", tot: "20000", sentAt: D(2) },       // → orcamento (auto, sem conversa)
  { id: 3, status: "orcamento", tot: "50000" },                // → negociacao (auto)
  { id: 4, status: "orcamento", tot: "30000", sentAt: D(50) }, // → perdido (revisar)
];
const convs = {
  3: { quoteSentAt: D(5), lastUserMessageAt: D(3) },
  4: { quoteSentAt: D(50), lastUserMessageAt: D(50) },
};
const r = classificarBase(hist, (q) => convs[q.id] || null);
check("base: 2 automáticas", r.automaticas.length, 2);
check("base: 1 para revisar", r.revisar.length, 1);
check("base: automáticas ordenadas por valor", r.automaticas[0].q.id, 3);
check("base: nenhuma automática é 'fechou'", r.automaticas.some((x) => x.etapa === "fechou"), false);
check("base: nenhuma automática é 'perdido'", r.automaticas.some((x) => x.etapa === "perdido"), false);
check("base: guarda a etapa de origem", r.automaticas[0].de, "orcamento");
check("base vazia não quebra", classificarBase([], () => null).automaticas.length, 0);
check("base undefined não quebra", classificarBase(undefined, () => null).revisar.length, 0);

// ── `quando`: a data do evento, nunca "agora" ───────────────────────────
// Carimbar hoje em 157 leads faria o painel dizer "0 dias nesta etapa" para a
// base inteira e zerar o tempo médio por etapa do Analytics.
const entregaMs = D(12);
check("orçamento usa a data da entrega", classificarEtapa({ id: 1, status: "lead" }, { quoteSentAt: entregaMs }).quando, entregaMs);
check("negociação usa a data da resposta", classificarEtapa({ id: 1, status: "orcamento" }, { quoteSentAt: D(9), lastUserMessageAt: D(4) }).quando, D(4));
check("fechou usa a data do fechamento", classificarEtapa({ id: 1, status: "orcamento" }, { quoteSentAt: D(20), dealClosedAt: D(6) }).quando, D(6));
check("perdido por pausa usa a data da pausa", classificarEtapa({ id: 1, status: "orcamento" }, { quoteSentAt: D(10), followupPausado: true, followupPausadoPor: "cliente", followupPausadoEm: D(7) }).quando, D(7));
check("nenhum `quando` cai no futuro", [...r.automaticas, ...r.revisar].every((x) => x.quando <= Date.now()), true);
check("nenhum `quando` vem vazio", [...r.automaticas, ...r.revisar].every((x) => Number(x.quando) > 0), true);

// ── Auxiliares ──────────────────────────────────────────────────────────
check("entregueEm prefere a conversa", entregueEm({ sentAt: 111 }, { quoteSentAt: 222 }), 222);
check("entregueEm cai no painel", entregueEm({ sentAt: 111 }, {}), 111);
check("entregueEm sem nada", entregueEm({}, null), null);
check("respondeuDepois sem entrega", respondeuDepoisDoOrcamento({}, { lastUserMessageAt: D(1) }), false);
check("respondeuDepois sem conversa", respondeuDepoisDoOrcamento({ sentAt: D(5) }, null), false);

console.log(`\n${ok}/${total} casos`);
process.exit(ok === total ? 0 : 1);
