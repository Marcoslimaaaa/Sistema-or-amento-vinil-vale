// Teste da fila de rascunhos do Vini.
// Roda com: node src/services/__tests__/rascunhoBot.test.mjs
//
// O que não pode acontecer: o painel confundir "o bot errou" com "o bot não
// sabia". Se as duas coisas contarem igual, a medição do item 4 do plano mente
// e a gente nunca descobre que o mapeamento está ruim.
import { camposEditados, resumoRascunho, ordenarRascunhos, estadoDoRascunho } from "../rascunhoBot.js";

let ok = 0, total = 0;
const check = (nome, real, esperado) => {
  total++;
  const passou = JSON.stringify(real) === JSON.stringify(esperado);
  if (passou) ok++;
  console.log(`${passou ? "PASS" : "FALHOU"}  ${nome.padEnd(58)} → ${JSON.stringify(real)} (esperado ${JSON.stringify(esperado)})`);
};

const aplicado = {
  svcType: "revestimento", poolFmt: "Com prainha",
  client: { name: "Carlos", city: "Registro", phone: "5513999" },
  pool: { length: "8", width: "4", depth: "1.4", prainhaComp: "", prainhaProf: "" },
};

// ── nada mexido ─────────────────────────────────────────────────────────
check("salvar sem mexer não gera edição", camposEditados(aplicado, JSON.parse(JSON.stringify(aplicado))), []);

// ── corrigir x completar ────────────────────────────────────────────────
const corrigido = JSON.parse(JSON.stringify(aplicado));
corrigido.pool.length = "9";
const dc = camposEditados(aplicado, corrigido);
check("mudar valor existente é CORREÇÃO", [dc.length, dc[0].tipo, dc[0].campo], [1, "corrigiu", "comprimento"]);

const completado = JSON.parse(JSON.stringify(aplicado));
completado.pool.prainhaComp = "2";
const dp = camposEditados(aplicado, completado);
check("preencher campo vazio é COMPLEMENTO, não erro do bot", [dp.length, dp[0].tipo, dp[0].campo], [1, "completou", "avanço da prainha"]);

check("entrada faltando não quebra", camposEditados(null, aplicado), []);

// ── resumo da linha ─────────────────────────────────────────────────────
check("resumo junta medidas, formato e cidade",
  resumoRascunho({ campos: aplicado }), "8x4x1.4 · Com prainha · Registro");
check("resumo de rascunho vazio não quebra", resumoRascunho({}), "");

// ── ordem da fila ───────────────────────────────────────────────────────
const fila = ordenarRascunhos([
  { id: "a", completude: 100, precisaDesenho: true, nota: 90 },
  { id: "b", completude: 70, precisaDesenho: false, nota: 40 },
  { id: "c", completude: 100, precisaDesenho: false, nota: 50 },
  { id: "d", completude: 100, precisaDesenho: false, nota: 80 },
]);
check("quem precisa de desenho vai pro fim", fila.map((r) => r.id), ["d", "c", "b", "a"]);

// ── estado do editor ────────────────────────────────────────────────────
const e = estadoDoRascunho({ campos: { svcType: "construcao", poolFmt: "Retangular", client: { name: "Ana" }, pool: { length: "10" } } });
check("cliente vem completo, com os campos vazios que o editor espera",
  Object.keys(e.client).sort(), ["address", "birthday", "city", "cpf", "email", "name", "phone", "rg"]);
check("serviço e formato passam direto", [e.svcType, e.poolFmt], ["construcao", "Retangular"]);
check("rascunho vazio cai no serviço padrão", estadoDoRascunho({}).svcType, "revestimento");
check("e NÃO inventa formato", estadoDoRascunho({}).poolFmt, "");

// O bot não decide preço: nada de item, margem ou mão de obra sai daqui.
check("estado não traz itens", e.items, undefined);
check("estado não traz mão de obra", e.mo, undefined);

console.log(`\n${ok}/${total} casos`);
process.exit(ok === total ? 0 : 1);
