// Teste da leitura da régua do bot pelo painel.
// Roda com: node src/services/__tests__/reguaBot.test.mjs
import {
  ultimoFollowup, botCuidouRecente, followupPausado, resumoDaRegua, escondeDaLista,
} from "../reguaBot.js";

const H = (h) => new Date(Date.now() - h * 3600 * 1000).toISOString();
let ok = 0, total = 0;
const check = (nome, real, esperado) => {
  total++;
  const passou = real === esperado;
  if (passou) ok++;
  console.log(`${passou ? "PASS" : "FALHOU"}  ${nome.padEnd(52)} → ${real} (esperado ${esperado})`);
};

// ── ultimoFollowup ──────────────────────────────────────────────────────
check("conversa sem carimbo", ultimoFollowup({}), null);
check("conversa undefined", ultimoFollowup(undefined), null);
check("followups vazio", ultimoFollowup({ followups: {} }), null);
check("pega o mais recente entre vários", ultimoFollowup({ followups: { quote_24h: H(200), quote_7d: H(10), quote_1d: H(150) } }).chave, "quote_7d");
check("ignora data inválida", ultimoFollowup({ followups: { quote_24h: "sei lá", quote_7d: H(5) } }).chave, "quote_7d");
check("só data inválida → null", ultimoFollowup({ followups: { quote_24h: "sei lá" } }), null);

// ── botCuidouRecente ────────────────────────────────────────────────────
check("bot mandou há 3h", botCuidouRecente({ followups: { quote_1d: H(3) } }), true);
check("bot mandou há 47h", botCuidouRecente({ followups: { quote_1d: H(47) } }), true);
check("bot mandou há 49h", botCuidouRecente({ followups: { quote_1d: H(49) } }), false);
check("bot nunca mandou", botCuidouRecente({}), false);

// ── pausa ───────────────────────────────────────────────────────────────
check("pausado", followupPausado({ followupPausado: true }), true);
check("não pausado", followupPausado({}), false);

// ── escondeDaLista ──────────────────────────────────────────────────────
check("pausado some da lista", escondeDaLista({ followupPausado: true }), true);
check("pausado some mesmo sem follow-up", escondeDaLista({ followupPausado: true, followups: {} }), true);
check("cutucado ontem some", escondeDaLista({ followups: { quote_3d: H(20) } }), true);
check("cutucado há 5 dias fica", escondeDaLista({ followups: { quote_3d: H(120) } }), false);
check("intocado fica na lista", escondeDaLista({}), false);
check("sem conversa fica na lista", escondeDaLista(null), false);

// ── resumoDaRegua ───────────────────────────────────────────────────────
check("sem nada → null", resumoDaRegua({}), null);
check("pausa pelo cliente", resumoDaRegua({ followupPausado: true, followupPausadoPor: "cliente" }), "🔕 o cliente pediu para parar");
check("pausa por comando", resumoDaRegua({ followupPausado: true, followupPausadoPor: "comando" }), "🔕 follow-up pausado");
check("pausa ganha do carimbo", resumoDaRegua({ followupPausado: true, followups: { quote_7d: H(2) } }), "🔕 follow-up pausado");
check("mandou hoje", resumoDaRegua({ followups: { quote_7d: H(2) } }), '🤖 bot mandou "condições de pagamento" hoje');
check("mandou ontem", resumoDaRegua({ followups: { quote_1d: H(30) } }), '🤖 bot mandou "orçamento recebido" ontem');
check("mandou há 4 dias", resumoDaRegua({ followups: { no_response_3d: H(100) } }), '🤖 bot mandou "sem resposta" há 4 dias');
check("aniversário com ano na chave", resumoDaRegua({ followups: { birthday_2026: H(5) } }), '🤖 bot mandou "aniversário" hoje');
check("chave desconhecida não quebra", resumoDaRegua({ followups: { chave_nova_9d: H(5) } }), '🤖 bot mandou "chave_nova_9d" hoje');

console.log(`\n${ok}/${total} casos`);
process.exit(ok === total ? 0 : 1);
