// Teste do histórico do bot normalizado. Roda com: node src/services/__tests__/conversa.test.mjs
//
// Trava o defeito de 12/10/2026: foto sem legenda gravada pelo bot como o
// objeto { message: "" } dava tela branca na aba WhatsApp.
import { readFileSync } from "node:fs";
import { textoDaMensagem, normalizarConversa } from "../conversa.js";

let ok = 0, total = 0;
const check = (nome, real, esperado) => {
  total++;
  const passou = JSON.stringify(real) === JSON.stringify(esperado);
  if (passou) ok++;
  console.log(`${passou ? "PASS" : "FALHOU"}  ${nome.padEnd(52)} → ${JSON.stringify(real)}${passou ? "" : ` (esperado ${JSON.stringify(esperado)})`}`);
};

check("texto passa igual", textoDaMensagem("oi"), "oi");
check("texto vazio continua vazio", textoDaMensagem(""), "");
check("o objeto do bug (foto sem legenda)", textoDaMensagem({ message: "" }), "(o cliente enviou uma imagem)");
check("objeto com texto", textoDaMensagem({ message: "Juquiá" }), "Juquiá");
check("undefined", textoDaMensagem(undefined), "");
check("null", textoDaMensagem(null), "");
check("array de blocos junta os textos", textoDaMensagem([{ type: "image" }, { type: "text", text: "olha" }]), "olha");
check("número não quebra", textoDaMensagem(42), "");
check("objeto estranho não quebra", textoDaMensagem({ a: 1 }), "");

// A conversa que derrubou a aba: última mensagem é o objeto.
const conv = normalizarConversa({
  status: "collecting",
  history: [
    { role: "assistant", content: "Perfeito, sem extras então.", ts: 1 },
    { role: "user", content: { message: "" }, ts: 2 },
    { role: "user", content: "Isaías Juquiá sp", ts: 3 },
    { role: "user", content: { message: "" }, ts: 4 },
    null,
  ],
});
check("todo content vira string", conv.history.every((m) => typeof m.content === "string"), true);
check("o que a lista faz não quebra mais", conv.history[conv.history.length - 1].content.slice(0, 55), "(o cliente enviou uma imagem)");
check("startsWith (chat aberto) não quebra", conv.history.some((m) => m.content.startsWith("[Marcos]")), false);
check("ts e role preservados", [conv.history[1].role, conv.history[1].ts], ["user", 2]);
check("mensagem nula sai", conv.history.length, 4);
check("outros campos preservados", conv.status, "collecting");
check("sem history vira lista vazia", normalizarConversa({ status: "x" }).history, []);
check("history que não é lista vira vazia", normalizarConversa({ history: "lixo" }).history, []);
check("documento undefined", normalizarConversa(undefined).history, []);

const msgTexto = { role: "user", content: "oi", ts: 9 };
check("mensagem já em texto é o mesmo objeto (sem cópia)", normalizarConversa({ history: [msgTexto] }).history[0] === msgTexto, true);

// [código real] os dois onSnapshot de whatsapp_conversations no App.jsx
// passam pela normalização — senão este teste passa e a tela continua branca.
const app = readFileSync(new URL("../../App.jsx", import.meta.url), "utf8");
check("[App.jsx] lista de conversas normalizada", /convs\.push\(\{phone:doc\.id,\.\.\.normalizarConversa\(d\)\}\)/.test(app), true);
check("[App.jsx] chat aberto normalizado", /setWaChatData\(\{phone:snap\.id,\.\.\.normalizarConversa\(snap\.data\(\)\)\}\)/.test(app), true);
check("[App.jsx] nenhum outro onSnapshot cru da coleção", (app.match(/"whatsapp_conversations"/g) || []).length, 2);

console.log(`\n${ok}/${total} passaram`);
if (ok !== total) process.exit(1);
