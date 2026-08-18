// Teste do relatório de origem do lead.
// Roda com: node src/services/__tests__/origem.test.mjs
import { normalizarCanal, origemDoLead, relatorioOrigem } from "../origem.js";

let ok = 0, total = 0;
const check = (nome, real, esperado) => {
  total++;
  const passou = real === esperado;
  if (passou) ok++;
  console.log(`${passou ? "PASS" : "FALHOU"}  ${nome.padEnd(50)} → ${real} (esperado ${esperado})`);
};

// ── normalizarCanal ─────────────────────────────────────────────────────
// O que o bot detecta sozinho (services/origin.js no repo do bot).
check("Instagram Ads", normalizarCanal("Instagram Ads"), "Instagram Ads");
check("Facebook Ads", normalizarCanal("Facebook Ads"), "Facebook Ads");
check("Meta Ads entra em Facebook Ads", normalizarCanal("Meta Ads"), "Facebook Ads");
check("Google Ads", normalizarCanal("Google Ads"), "Google Ads");
// O que o cliente digita.
check("'vi no instagram de voces'", normalizarCanal("vi no instagram de voces"), "Instagram");
check("'insta'", normalizarCanal("insta"), "Instagram");
check("'pesquisei no google'", normalizarCanal("pesquisei no google"), "Google / busca");
check("'um amigo indicou'", normalizarCanal("um amigo indicou"), "Indicação");
check("'meu vizinho fez com voces'", normalizarCanal("meu vizinho fez com voces"), "Indicação");
check("'me indicaram'", normalizarCanal("me indicaram voces"), "Indicação");
check("'meu compadre indicou'", normalizarCanal("meu compadre indicou"), "Indicação");
check("'sindicato' não é indicação", normalizarCanal("pelo sindicato rural"), "Pelo sindicato rural");
check("'vi a placa no carro'", normalizarCanal("vi a placa no carro"), "Placa / carro / rua");
check("'ja sou cliente'", normalizarCanal("ja sou cliente"), "Já era cliente");
check("'num grupo de whatsapp'", normalizarCanal("num grupo de whatsapp"), "WhatsApp / grupo");
// Anúncio ganha do canal orgânico quando os dois casam.
check("anúncio do instagram → Ads", normalizarCanal("Anúncio do Instagram"), "Instagram Ads");
// Desconhecido preserva o texto em vez de virar "Outros".
check("texto livre desconhecido", normalizarCanal("feira de piscinas"), "Feira de piscinas");
// Vazios.
check("vazio", normalizarCanal(""), null);
check("null", normalizarCanal(null), null);
check("string 'null'", normalizarCanal("null"), null);
check("'não informado'", normalizarCanal("não informado"), null);
check("só espaços", normalizarCanal("   "), null);

// ── origemDoLead ────────────────────────────────────────────────────────
check("vem da conversa", origemDoLead({}, { leadData: { como_conheceu: "Google Ads" } }), "Google Ads");
check("cai no orçamento", origemDoLead({ origem: "Indicação do João" }, null), "Indicação");
check("conversa ganha do orçamento", origemDoLead({ origem: "insta" }, { leadData: { como_conheceu: "Google Ads" } }), "Google Ads");
check("nenhum dos dois", origemDoLead({}, {}), null);

// ── relatorioOrigem ─────────────────────────────────────────────────────
const hist = [
  { id: 1, tot: "20000", status: "fechou" },     // Instagram Ads
  { id: 2, tot: "15000", status: "lead" },       // Instagram Ads
  { id: 3, tot: "30000", status: "perdido" },    // Instagram Ads
  { id: 4, tot: "50000", status: "concluido" },  // Indicação
  { id: 5, tot: "10000", status: "lead" },       // sem origem
  { id: 6, tot: "8000", status: "lead" },        // sem conversa nenhuma
];
const convs = {
  1: { leadData: { como_conheceu: "Instagram Ads" } },
  2: { leadData: { como_conheceu: "anúncio do instagram" } },
  3: { leadData: { como_conheceu: "Instagram Ads" } },
  4: { leadData: { como_conheceu: "meu compadre indicou" } },
  5: { leadData: {} },
};
const r = relatorioOrigem(hist, (q) => convs[q.id] || null);

check("2 canais", r.linhas.length, 2);
check("ordenado por receita", r.linhas[0].canal, "Indicação");
check("Instagram Ads com 3 leads", r.linhas.find((l) => l.canal === "Instagram Ads").leads, 3);
check("Instagram Ads: 1 fechado", r.linhas.find((l) => l.canal === "Instagram Ads").fechados, 1);
check("Instagram Ads: receita só do fechado", r.linhas.find((l) => l.canal === "Instagram Ads").receita, 20000);
check("Instagram Ads: conversão 33%", r.linhas.find((l) => l.canal === "Instagram Ads").conversao, 33);
check("Instagram Ads: 1 em aberto (perdido fora)", r.linhas.find((l) => l.canal === "Instagram Ads").emAberto, 1);
check("Indicação: concluído conta como fechado", r.linhas[0].fechados, 1);
check("Indicação: ticket médio", r.linhas[0].ticket, 50000);
check("2 leads sem origem", r.semOrigem, 2);
check("cobertura 67%", r.cobertura, 67);
check("total de leads", r.totalLeads, 6);
check("base vazia não quebra", relatorioOrigem([], () => null).linhas.length, 0);
check("cobertura de base vazia é 0", relatorioOrigem([], () => null).cobertura, 0);
check("base undefined não quebra", relatorioOrigem(undefined, () => null).totalLeads, 0);

console.log(`\n${ok}/${total} casos`);
process.exit(ok === total ? 0 : 1);
