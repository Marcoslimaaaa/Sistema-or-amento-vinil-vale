import { preencher, PADRAO } from "../respostas.js";

let ok = 0, total = 0;
const check = (nome, real, esperado) => {
  total++; const passou = real === esperado; if (passou) ok++;
  console.log(`${passou ? "PASS" : "FALHOU"}  ${nome.padEnd(46)} → ${JSON.stringify(real)}`);
  if (!passou) console.log(`        esperado: ${JSON.stringify(esperado)}`);
};

const lead = { cN: "Maria Silva", tot: "12500", data: { client: { name: "Maria Silva", city: "Registro" }, execDays: "25" } };

check("nome vira primeiro nome", preencher("Olá {{nome}}!", lead), "Olá Maria!");
check("valor formatado em BRL", preencher("Valor: {{valor}}", lead), "Valor: R$ 12.500,00");
check("cidade", preencher("Em {{cidade}}", lead), "Em Registro");
check("prazo do orcamento", preencher("{{prazo}} dias", lead), "25 dias");
check("prazo padrao sem execDays", preencher("{{prazo}} dias", { cN: "Ana" }), "20 dias");
check("varias variaveis", preencher("{{nome}}, {{valor}} em {{cidade}}", lead), "Maria, R$ 12.500,00 em Registro");
check("sem lead nao deixa {{}} na cara do cliente", preencher("Olá {{nome}}, tudo bem?", null), "Olá, tudo bem?");
check("variavel desconhecida some", preencher("Oi {{inexistente}} tchau", lead), "Oi tchau");
check("texto sem variavel intacto", preencher("Bom dia!", lead), "Bom dia!");
check("valor vazio nao deixa espaco orfao", preencher("O total fica em {{valor}} certo?", { cN: "Ana" }), "O total fica em certo?");
check("variavel no inicio some com a virgula", preencher("{{nome}}, bom dia!", null), "bom dia!");
check("cidade vazia", preencher("Atendemos em {{cidade}} sim", { cN: "Ana" }), "Atendemos em sim");
// o texto de prazo tinha "20" fixo e mandava o numero errado quando o
// orcamento usava outro prazo
const tplPrazo = PADRAO.find(r => r.atalho === "prazo").texto;
check("resposta de prazo usa a variavel", tplPrazo.includes("{{prazo}}"), true);
check("prazo do orcamento chega na mensagem", preencher(tplPrazo, lead).includes("25 dias"), true);
check("prazo padrao quando o orcamento nao define", preencher(tplPrazo, { cN: "Ana" }).includes("20 dias"), true);
check("todos os padroes tem atalho e texto", PADRAO.every(r => r.atalho && r.texto && r.titulo), true);

console.log(`\n${ok}/${total} casos`);
process.exit(ok === total ? 0 : 1);
