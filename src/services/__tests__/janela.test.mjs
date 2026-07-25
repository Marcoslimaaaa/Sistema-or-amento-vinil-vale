// Teste da janela de 24h. Roda com: node src/services/__tests__/janela.test.mjs
import { dentroDaJanela, ultimaMensagemDoCliente, horasRestantesDaJanela } from "../janela.js";

const H = (h) => Date.now() - h * 3600 * 1000;
let ok = 0, total = 0;
const check = (nome, real, esperado) => {
  total++;
  const passou = real === esperado;
  if (passou) ok++;
  console.log(`${passou ? "PASS" : "FALHOU"}  ${nome.padEnd(42)} → ${real} (esperado ${esperado})`);
};

check("cliente falou ha 2h", dentroDaJanela({ lastUserMessageAt: H(2) }), true);
check("cliente falou ha 23h", dentroDaJanela({ lastUserMessageAt: H(23) }), true);
check("cliente falou ha 25h", dentroDaJanela({ lastUserMessageAt: H(25) }), false);
check("cliente falou ha 5 dias", dentroDaJanela({ lastUserMessageAt: H(120) }), false);
check("so o bot falou (lastActivity recente)", dentroDaJanela({ lastActivity: H(1), history: [{ role: "assistant", ts: H(1) }] }), false);
check("conversa antiga sem ts", dentroDaJanela({ history: [{ role: "user", content: "oi" }] }), false);
check("fallback pelo ts do historico", dentroDaJanela({ history: [{ role: "user", ts: H(3) }, { role: "assistant", ts: H(2) }] }), true);
check("historico so assistant com ts", dentroDaJanela({ history: [{ role: "assistant", ts: H(1) }] }), false);
check("ISO string", dentroDaJanela({ lastUserMessageAt: new Date(H(4)).toISOString() }), true);
check("Timestamp do Firestore", dentroDaJanela({ lastUserMessageAt: { toMillis: () => H(5) } }), true);
check("conversa vazia", dentroDaJanela({}), false);
check("undefined", dentroDaJanela(undefined), false);
check("sem referencia → null", ultimaMensagemDoCliente({}), null);
// 4,5h de uso → 19h e meia restantes → 19 inteiras. Evita o limite exato
// (4h daria 20,0000 ou 19,9999 conforme o clock avançasse entre as chamadas).
check("horas restantes com 4h30 de uso", horasRestantesDaJanela({ lastUserMessageAt: H(4.5) }), 19);
check("horas restantes fora da janela", horasRestantesDaJanela({ lastUserMessageAt: H(30) }), 0);

console.log(`\n${ok}/${total} casos`);
process.exit(ok === total ? 0 : 1);
