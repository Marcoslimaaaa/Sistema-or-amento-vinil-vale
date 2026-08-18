// Teste da ficha do lead.
// Roda com: node src/services/__tests__/fichaLead.test.mjs
import { fichaDoLead, completude } from "../fichaLead.js";

let ok = 0, total = 0;
const check = (nome, real, esperado) => {
  total++;
  const passou = real === esperado;
  if (passou) ok++;
  console.log(`${passou ? "PASS" : "FALHOU"}  ${nome.padEnd(52)} → ${real} (esperado ${esperado})`);
};

const achaGrupo = (f, g) => f.find((x) => x.grupo === g);
const achaItem = (f, chave) => f.flatMap((g) => g.itens).find((i) => i.chave === chave);

// ── vazios ──────────────────────────────────────────────────────────────
check("leadData null", fichaDoLead(null).length, 0);
check("leadData vazio", fichaDoLead({}).length, 0);
// O bot grava a string "null" quando a IA não extraiu o campo.
check('string "null" não vira linha', fichaDoLead({ cidade: "null" }).length, 0);
check("string vazia não vira linha", fichaDoLead({ cidade: "   " }).length, 0);
check("undefined não vira linha", fichaDoLead({ cidade: undefined }).length, 0);

// ── agrupamento e ordem ─────────────────────────────────────────────────
const lead = {
  nome: "Maria", cidade: "Registro", cep: "11900-000",
  tipo_servico: "revestimento", medidas: "8x4x1,40", extras: "prainha",
  padrao_construcao: "completo", acesso_bobcat: "sim", como_conheceu: "Instagram Ads",
};
const f = fichaDoLead(lead);
check("3 grupos", f.length, 3);
check("grupo 1 é Contato", f[0].grupo, "Contato");
check("grupo 2 é A obra", f[1].grupo, "A obra");
check("grupo 3 é Qualificação", f[2].grupo, "Qualificação");
check("Contato tem 3 itens", achaGrupo(f, "Contato").itens.length, 3);
check("nome vem primeiro no Contato", achaGrupo(f, "Contato").itens[0].chave, "nome");
check("CEP tem rótulo", achaItem(f, "cep").rotulo, "CEP");
// Os campos que existiam só no bot e nunca apareceram no painel.
check("padrão de construção aparece", achaItem(f, "padrao_construcao").valor, "completo");
check("acesso para máquina aparece", achaItem(f, "acesso_bobcat").rotulo, "Acesso para máquina");
check("como conheceu aparece", achaItem(f, "como_conheceu").valor, "Instagram Ads");

// ── foto_recebida ───────────────────────────────────────────────────────
check("foto true vira Sim", achaItem(fichaDoLead({ foto_recebida: true }), "foto_recebida").valor, "Sim");
check("foto 'sim' vira Sim", achaItem(fichaDoLead({ foto_recebida: "sim" }), "foto_recebida").valor, "Sim");
check("foto false some", fichaDoLead({ foto_recebida: false }).length, 0);
check("foto 'não' some", fichaDoLead({ foto_recebida: "não" }).length, 0);

// ── campo novo do bot não some em silêncio ──────────────────────────────
const comNovo = fichaDoLead({ nome: "Ana", campo_que_o_bot_criou: "valor x" });
check("campo desconhecido cai em Outros", achaGrupo(comNovo, "Outros").itens.length, 1);
check("...com rótulo legível", achaItem(comNovo, "campo_que_o_bot_criou").rotulo, "campo que o bot criou");
check("'completo' é controle interno, não aparece", fichaDoLead({ completo: true }).length, 0);

// ── completude ──────────────────────────────────────────────────────────
check("lead vazio: 0 de 8", completude({}).preenchidos, 0);
check("lead null: 0 de 8", completude(null).preenchidos, 0);
check("lead null lista tudo faltando", completude(null).faltando.length, 8);
// nome, cidade, cep, tipo_servico, medidas, extras = 6; faltam formato e estado.
check("lead do exemplo: 6 de 8", completude(lead).preenchidos, 6);
check("...faltando 2", completude(lead).faltando.length, 2);
check("...e estado_piscina está entre eles", completude(lead).faltando.includes("estado_piscina"), true);
const cheio = { nome: "a", cidade: "b", cep: "c", tipo_servico: "d", formato_piscina: "e", medidas: "f", extras: "g", estado_piscina: "h" };
check('"null" conta como faltando', completude({ ...cheio, estado_piscina: "null" }).preenchidos, 7);
check("lead completo: 8 de 8", completude(cheio).preenchidos, 8);
check("...sem nada faltando", completude(cheio).faltando.length, 0);

console.log(`\n${ok}/${total} casos`);
process.exit(ok === total ? 0 : 1);
