// Teste da agenda de serviço.
// Roda com: node src/services/__tests__/agenda.test.mjs
//
// O que não pode acontecer: compromisso atrasado sumir da frente (é o único que
// cobra decisão hoje), e a mesma cidade escrita de dois jeitos virar duas —
// porque é isso que faz uma viagem à Baixada parecer que não vale a pena.
import {
  hojeISO, diasAte, situacao, cidadeChave, regiao,
  agruparPorDia, rotuloData, outrosNaRegiao, resumo, emAberto,
} from "../agenda.js";

let ok = 0, total = 0;
const check = (nome, real, esperado) => {
  total++;
  const passou = JSON.stringify(real) === JSON.stringify(esperado);
  if (passou) ok++;
  console.log(`${passou ? "PASS" : "FALHOU"}  ${nome.padEnd(58)} → ${JSON.stringify(real)} (esperado ${JSON.stringify(esperado)})`);
};

const HOJE = "2026-09-01";
const ag = (o = {}) => ({ id: o.id || "1", data: o.data || HOJE, tipo: o.tipo || "visita", status: o.status || "agendado", cidade: o.cidade || "Registro", periodo: o.periodo || "manha", ...o });

// ── datas ───────────────────────────────────────────────────────────────
check("hoje é hoje", diasAte(HOJE, HOJE), 0);
check("amanhã é 1", diasAte("2026-09-02", HOJE), 1);
check("ontem é -1", diasAte("2026-08-31", HOJE), -1);
check("data inválida não quebra", diasAte("qualquer", HOJE), null);
check("sem data devolve null", diasAte(null, HOJE), null);
check("hojeISO usa o fuso local, não UTC", hojeISO(new Date(2026, 8, 1, 23, 30)), "2026-09-01");
check("rótulo traz o dia da semana", rotuloData("2026-09-01"), "ter, 01/09");

// ── situação ────────────────────────────────────────────────────────────
check("compromisso de ontem está atrasado", situacao(ag({ data: "2026-08-31" }), HOJE), "atrasado");
check("de hoje é hoje", situacao(ag({ data: HOJE }), HOJE), "hoje");
check("de amanhã é amanhã", situacao(ag({ data: "2026-09-02" }), HOJE), "amanha");
check("feito não fica atrasado", situacao(ag({ data: "2026-08-01", status: "feito" }), HOJE), "feito");
check("cancelado também não cobra nada", situacao(ag({ data: "2026-08-01", status: "cancelado" }), HOJE), "cancelado");

// ── cidade: o caso real da base ─────────────────────────────────────────
check('"Peruíbe-Sp" e "Peruibe-Sp" são a mesma cidade',
  cidadeChave("Peruíbe-Sp") === cidadeChave("Peruibe-Sp"), true);
check('"Miracatu-Sp CEP 11850-00" também é Miracatu',
  cidadeChave("Miracatu-Sp CEP 11850-00"), "miracatu");
check('"Ilha Comprida " e "Ilha comprida-Sp" batem',
  cidadeChave("Ilha Comprida ") === cidadeChave("Ilha comprida-Sp"), true);
check("cidade vazia devolve vazio", cidadeChave(""), "");

check("Peruíbe é Baixada", regiao("Peruíbe-Sp"), "baixada");
check("Cajati é Vale", regiao("Cajati-Sp"), "vale");
check("Jundiaí é outra região", regiao("Jundiai-Sp"), "outra");
check("sem cidade tem rótulo próprio", regiao(""), "sem_cidade");

// ── agrupamento por dia ─────────────────────────────────────────────────
const lista = [
  ag({ id: "a", data: "2026-09-03", cidade: "Registro" }),
  ag({ id: "b", data: "2026-08-28", cidade: "Peruíbe" }),          // atrasado
  ag({ id: "c", data: "2026-09-03", cidade: "Cajati", periodo: "tarde" }),
  ag({ id: "d", data: "2026-09-10", status: "feito" }),            // não entra
  ag({ id: "e", data: "2026-09-05", status: "cancelado" }),        // não entra
];
const dias = agruparPorDia(lista, HOJE);
check("atrasado vem primeiro, custe o que custar", dias[0].data, "2026-08-28");
check("depois a ordem do calendário", dias.map((d) => d.data), ["2026-08-28", "2026-09-03"]);
check("dois no mesmo dia ficam juntos", dias[1].itens.length, 2);
check("feito e cancelado saem da agenda", emAberto(lista).length, 3);
check("manhã antes de tarde", dias[1].itens.map((i) => i.periodo), ["manha", "tarde"]);

// ── quem mais está esperando por perto ──────────────────────────────────
const hist = [
  { status: "negociacao", cC: "Peruíbe-Sp" },
  { status: "orcamento", cC: "Peruibe-Sp" },          // mesma cidade, grafia diferente
  { status: "fechou", data: { client: { city: "Peruíbe" } } },
  { status: "lead", cC: "Peruíbe-Sp" },               // lead ainda não conta
  { status: "negociacao", cC: "Itanhaem-Sp" },        // mesma região
  { status: "negociacao", cC: "Registro-Sp" },        // outra região
  { status: "perdido", cC: "Peruíbe-Sp" },            // perdido não conta
];
const perto = outrosNaRegiao("Peruíbe-Sp", hist);
check("conta os 3 de Peruíbe apesar das grafias", perto.cidade, 3);
check("e 1 na Baixada fora da cidade", perto.regiao, 1);
check("com o nome da região por extenso", perto.nomeRegiao, "Baixada Santista");
check("cidade desconhecida não quebra", outrosNaRegiao("", hist).cidade, 0);

// ── resumo do topo ──────────────────────────────────────────────────────
const r = resumo(lista, HOJE);
// Dois compromissos caem em 03/09, ambos dentro da semana — por isso 2, nao 1.
check("resumo separa atrasado, hoje e semana", [r.atrasados, r.hoje, r.semana, r.total], [1, 0, 2, 3]);
check("lista vazia não quebra", resumo([], HOJE).total, 0);
check("undefined não quebra", resumo(undefined, HOJE).total, 0);

console.log(`\n${ok}/${total} casos`);
process.exit(ok === total ? 0 : 1);
