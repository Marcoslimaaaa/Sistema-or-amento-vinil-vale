import { leadScore, faixaScore, slaEstourado, horasEsperando, conversasSemResposta } from "../score.js";

let ok = 0, total = 0;
const check = (nome, real, esperado) => {
  total++; const passou = JSON.stringify(real) === JSON.stringify(esperado); if (passou) ok++;
  console.log(`${passou ? "PASS" : "FALHOU"}  ${nome.padEnd(50)} → ${JSON.stringify(real)}`);
  if (!passou) console.log(`        esperado: ${JSON.stringify(esperado)}`);
};
const gt = (nome, a, b) => {
  total++; const passou = a > b; if (passou) ok++;
  console.log(`${passou ? "PASS" : "FALHOU"}  ${nome.padEnd(50)} → ${a} > ${b}`);
};
const H = (h) => Date.now() - h * 3600 * 1000;

const base = { q: { id: "1", tot: "10000", status: "lead" }, dias: 5, conv: null, maiorValor: 20000 };

// --- leads fora da disputa zeram ---
check("fechado tem score 0", leadScore({ ...base, q: { ...base.q, status: "fechou" } }), 0);
check("perdido tem score 0", leadScore({ ...base, q: { ...base.q, status: "perdido" } }), 0);
check("concluido tem score 0", leadScore({ ...base, q: { ...base.q, status: "concluido" } }), 0);

// --- valor pesa ---
gt("orcamento maior pontua mais",
  leadScore({ ...base, q: { ...base.q, tot: "20000" } }),
  leadScore({ ...base, q: { ...base.q, tot: "2000" } }));

// --- etapa pesa ---
gt("negociacao pontua mais que lead novo",
  leadScore({ ...base, q: { ...base.q, status: "negociacao" } }),
  leadScore({ ...base, q: { ...base.q, status: "lead" } }));

// --- a curva de recencia sobe e DEPOIS cai ---
gt("7 dias pontua mais que 1 dia", leadScore({ ...base, dias: 7 }), leadScore({ ...base, dias: 1 }));
gt("14 dias pontua mais que 90 dias", leadScore({ ...base, dias: 14 }), leadScore({ ...base, dias: 90 }));
gt("lead com contato vence o sem referencia", leadScore({ ...base, dias: 10 }), leadScore({ ...base, dias: 999 }));

// --- engajamento ---
const respondeu = { history: [{ role: "assistant" }, { role: "user" }, { role: "assistant" }] };
const mudo = { history: [{ role: "assistant" }] };
gt("quem respondeu pontua mais que quem so ouviu",
  leadScore({ ...base, conv: respondeu }), leadScore({ ...base, conv: mudo }));
gt("cliente falou por ultimo pontua mais",
  leadScore({ ...base, conv: { history: [{ role: "assistant" }, { role: "user" }] } }),
  leadScore({ ...base, conv: { history: [{ role: "user" }, { role: "assistant" }] } }));

// --- limites ---
const s = leadScore({ ...base, q: { ...base.q, tot: "999999", status: "negociacao" }, dias: 7, conv: respondeu, maiorValor: 999999 });
check("score fica dentro de 0..100", s >= 0 && s <= 100, true);
check("sem maiorValor nao quebra", typeof leadScore({ ...base, maiorValor: 0 }), "number");
check("faixa alta", faixaScore(80).label, "Alta");
check("faixa media", faixaScore(50).label, "Média");
check("faixa baixa", faixaScore(10).label, "Baixa");

// --- SLA ---
check("cliente esperando ha 3h → estourou", slaEstourado({ history: [{ role: "user" }], lastUserMessageAt: H(3) }), true);
check("cliente esperando ha 10min → ok", slaEstourado({ history: [{ role: "user" }], lastUserMessageAt: H(0.16) }), false);
check("empresa ja respondeu → sem SLA", slaEstourado({ history: [{ role: "user" }, { role: "assistant" }], lastUserMessageAt: H(5) }), false);
check("conversa vazia", slaEstourado({ history: [] }), false);
check("conv nula", slaEstourado(null), false);
check("horas esperando", horasEsperando({ history: [{ role: "user" }], lastUserMessageAt: H(4) }), 4);
check("horas quando nao estourou", horasEsperando({ history: [{ role: "user" }, { role: "assistant" }] }), 0);

const fila = conversasSemResposta([
  { phone: "1", history: [{ role: "user" }], lastUserMessageAt: H(2) },
  { phone: "2", history: [{ role: "user" }], lastUserMessageAt: H(9) },
  { phone: "3", history: [{ role: "assistant" }], lastUserMessageAt: H(9) },
]);
check("fila do SLA so com quem espera", fila.map(f => f.conv.phone), ["2", "1"]);

console.log(`\n${ok}/${total} casos`);
process.exit(ok === total ? 0 : 1);
