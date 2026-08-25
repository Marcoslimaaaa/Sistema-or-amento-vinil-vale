// Teste da regra "um cliente = um lead".
// Roda com: node src/services/__tests__/leadUnico.test.mjs
//
// O que não pode acontecer: contar o mesmo cliente duas vezes no funil, somar
// dois orçamentos do mesmo cliente como receita, e marcar como perdido quem
// perdeu um orçamento mas fechou outro.
import { chaveCliente, agruparLeads, metricasFunil, mapaDuplicados } from "../leadUnico.js";

let ok = 0, total = 0;
const check = (nome, real, esperado) => {
  total++;
  const passou = JSON.stringify(real) === JSON.stringify(esperado);
  if (passou) ok++;
  console.log(`${passou ? "PASS" : "FALHOU"}  ${nome.padEnd(58)} → ${JSON.stringify(real)} (esperado ${JSON.stringify(esperado)})`);
};

const orc = (id, o = {}) => ({
  id,
  status: o.status || "lead",
  tot: o.tot || "0",
  cN: o.nome || "",
  cC: o.cidade || "",
  data: { client: { name: o.nome || "", city: o.cidade || "", phone: o.tel || "" } },
});

// ── identidade ──────────────────────────────────────────────────────────
check("mesmo telefone com e sem o 9 é o mesmo cliente",
  chaveCliente(orc(1, { tel: "13996781966" })) === chaveCliente(orc(2, { tel: "1396781966" })), true);
check("telefone com +55 e máscara também casa",
  chaveCliente(orc(1, { tel: "+55 (13) 99678-1966" })) === chaveCliente(orc(2, { tel: "13996781966" })), true);
check("sem telefone, cai em nome+cidade (caso dos pedidos do Gercione)",
  chaveCliente(orc(1, { nome: "Gercione", cidade: "Registro" })) === chaveCliente(orc(2, { nome: "gercione ", cidade: "registro" })), true);
check("mesmo nome em cidade diferente NÃO é o mesmo cliente",
  chaveCliente(orc(1, { nome: "João", cidade: "Registro" })) === chaveCliente(orc(2, { nome: "João", cidade: "Cajati" })), false);
check("sem nome e sem telefone, cada orçamento fica sozinho",
  chaveCliente(orc(1)) === chaveCliente(orc(2)), false);

// ── o caso Célio/Regiane: dois orçamentos, um fechou ────────────────────
const celio = [
  orc(1778785541785, { tel: "13991112222", nome: "Célio Pereira", tot: "9000", status: "lead" }),
  orc(1779243991953, { tel: "13991112222", nome: "Célio Pereira", tot: "12000", status: "fechou" }),
];
const gCelio = agruparLeads(celio);
check("dois orçamentos do mesmo cliente viram 1 lead", gCelio.length, 1);
check("o lead é representado pelo orçamento fechado", String(gCelio[0].principal.id), "1779243991953");
check("o valor é SÓ o que fechou (não soma os dois)", gCelio[0].valor, 12000);
check("e o grupo fica marcado como duplicado", gCelio[0].duplicado, true);

// ── nada fechou ainda: vale o mais avançado, nunca a soma ───────────────
const emAberto = [
  orc(10, { tel: "13993334444", nome: "Ana", tot: "8000", status: "lead" }),
  orc(11, { tel: "13993334444", nome: "Ana", tot: "11000", status: "negociacao" }),
];
check("em aberto, o valor é o do mais avançado", agruparLeads(emAberto)[0].valor, 11000);
check("e não a soma dos dois", agruparLeads(emAberto)[0].valor === 19000, false);

// ── perdido só quando TUDO do cliente se perdeu ─────────────────────────
const perdeuUmFechouOutro = [
  orc(20, { tel: "13995556666", nome: "Rui", tot: "5000", status: "perdido" }),
  orc(21, { tel: "13995556666", nome: "Rui", tot: "7000", status: "fechou" }),
];
const m1 = metricasFunil(perdeuUmFechouOutro);
check("quem perdeu um e fechou outro conta como venda", [m1.leads, m1.fechados, m1.perdidos], [1, 1, 0]);
check("e a receita é a do fechado", m1.receita, 7000);

// O caso real das duas contas do painel: o MESMO orçamento aparece perdido (com
// motivo) numa conta e parado em `lead` na outra. A perda classificada não pode
// sumir só porque o outro documento tem status "mais avançado".
const perdidoComCopiaEmLead = [
  orc(60, { tel: "13992223333", nome: "Franciele", tot: "3600", status: "perdido" }),
  orc(61, { tel: "13992223333", nome: "Franciele", tot: "3600", status: "lead" }),
];
const mCopia = metricasFunil(perdidoComCopiaEmLead);
check("perdido + cópia em lead continua sendo perda", [mCopia.leads, mCopia.perdidos, mCopia.ativos], [1, 1, 0]);
check("e o lead é representado pelo orçamento perdido", String(agruparLeads(perdidoComCopiaEmLead)[0].principal.id), "60");

// Mas movimento real posterior (negociação) mantém o cliente vivo.
const perdidoMasNegociando = [
  orc(70, { tel: "13994445555", nome: "Elias", tot: "38990", status: "perdido" }),
  orc(71, { tel: "13994445555", nome: "Elias", tot: "38990", status: "negociacao" }),
];
const mElias = metricasFunil(perdidoMasNegociando);
check("perdido + negociação em aberto conta como ativo", [mElias.perdidos, mElias.ativos], [0, 1]);

const perdeuTudo = [
  orc(30, { tel: "13997778888", nome: "Zé", tot: "5000", status: "perdido" }),
  orc(31, { tel: "13997778888", nome: "Zé", tot: "6000", status: "perdido" }),
];
const m2 = metricasFunil(perdeuTudo);
check("cliente com tudo perdido conta 1 perda, não 2", [m2.leads, m2.perdidos], [1, 1]);

// ── métricas do funil ───────────────────────────────────────────────────
const base = [...celio, ...emAberto, ...perdeuTudo, orc(40, { tel: "13999990000", nome: "Novo", tot: "3000" })];
const m = metricasFunil(base);
check("7 orçamentos viram 4 clientes", [base.length, m.leads], [7, 4]);
check("a taxa de conversão usa clientes, não documentos", m.txConv, 25); // 1 de 4
check("win rate = fechados / decididos", m.winRate, 50); // 1 fechado, 1 perdido
check("ticket médio é do que fechou", m.ticketMedio, 12000);
check("conta quantos documentos sobram além de um por cliente", m.orcamentosExtras, 3);

// ── marcação de duplicados na lista ─────────────────────────────────────
const dup = mapaDuplicados(base);
check("o orçamento fechado do Célio é o principal", dup[1779243991953].ehPrincipal, true);
check("o outro orçamento dele aparece como secundário", dup[1778785541785].ehPrincipal, false);
check("cliente com um orçamento só não entra no mapa", dup[40], undefined);

// ── entrada defeituosa ──────────────────────────────────────────────────
check("lista vazia não quebra", metricasFunil([]).leads, 0);
check("undefined não quebra", metricasFunil(undefined).leads, 0);
check("item nulo no meio da lista é ignorado", agruparLeads([null, orc(50, { tel: "13990001111" })]).length, 1);

console.log(`\n${ok}/${total} casos`);
process.exit(ok === total ? 0 : 1);
