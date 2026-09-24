// Contornos de oitavada e circular, e a conta do círculo.
// node src/motor/__tests__/formatos.test.mjs
import { contornoOitavada, contornoCircular, medidasCirculo, GOMOS_CIRCULO, bancoMaximoRedondo, erroBancoRedondo } from "../formatos.js";
import { geometriaComBanco, geometriaTriangular, planoTriangular } from "../triangular.js";
import { areaPoligono, perimetroPoligono, regioesBanco } from "../formas.js";
import { calcA } from "../areas.js";
import { planoCircular } from "../circular.js";

let ok = 0, falhas = 0;
const eq = (n, r, e) => { const p = JSON.stringify(r) === JSON.stringify(e); p ? ok++ : falhas++;
  console.log(`  ${p ? "ok " : "FALHA"} ${n}${p ? "" : `\n       esperado ${JSON.stringify(e)}\n       veio     ${JSON.stringify(r)}`}`); };
const perto = (n, r, e, tol = 0.02) => { const p = Math.abs(r - e) <= tol; p ? ok++ : falhas++;
  console.log(`  ${p ? "ok " : "FALHA"} ${n}${p ? ` [${r.toFixed(2)}]` : `\n       esperado ${e} ± ${tol}, veio ${r}`}`); };

console.log("\n— oitavada —");
const oit = contornoOitavada(6, 3, 1);
eq("oito lados", oit.length, 8);
perto("área = retângulo menos os 4 cantos", areaPoligono(oit), 6 * 3 - 4 * 0.5, 0.01);
perto("perímetro com as diagonais", perimetroPoligono(oit), 2 * 4 + 2 * 1 + 4 * Math.SQRT2, 0.01);
eq("sem chanfro vira retângulo", contornoOitavada(6, 3, 0).length, 4);
eq("chanfro maior que a piscina é limitado", contornoOitavada(6, 3, 99).length, 8);
eq("medida inválida devolve null", contornoOitavada(0, 3, 1), null);

const gOit = geometriaComBanco({ contorno: oit, prof: 1.4, banco: { larg: 0.5, prof: 0.5 } });
perto("lâmina 16,00 m²", gOit.areas.lamina, 16.0);
perto("fundo + assento = lâmina", gOit.areas.fundo + gOit.areas.assento, 16.0);
perto("costas = perímetro × 0,50", gOit.areas.costas, perimetroPoligono(oit) * 0.5, 0.05);
eq("o plano de corte sai pelas 8 paredes", planoTriangular({ contorno: oit, prof: 1.4, banco: { larg: 0.5, prof: 0.5 } }).paredes.qtdPecas, 16);

console.log("\n— circular —");
eq("48 gomos por padrão", contornoCircular(4).length, GOMOS_CIRCULO);
eq("diâmetro zero não vira contorno", contornoCircular(0), null);
const c = medidasCirculo(4, { bancoLarg: 0.5, bancoProf: 0.5, prof: 1.0 });
perto("área πr²", c.area, Math.PI * 4, 0.01);
perto("perímetro 2πr", c.perimetro, 2 * Math.PI * 2, 0.01);
perto("fundo = círculo de 1,50 de raio", c.fundo, Math.PI * 1.5 * 1.5, 0.01);
perto("assento = coroa", c.assento, Math.PI * (4 - 2.25), 0.01);
perto("espelho = 2πri × 0,50", c.espelho, 2 * Math.PI * 1.5 * 0.5, 0.01);
perto("costas = perímetro × 0,50", c.costas, 2 * Math.PI * 2 * 0.5, 0.01);
perto("volume desconta o bloco do banco", c.volume, Math.PI * 4 * 1 - (Math.PI * 4 - Math.PI * 2.25) * 0.5, 0.02);
eq("sem banco não há assento", medidasCirculo(4, { prof: 1 }).assento, 0);
perto("sem banco a parede é o cilindro", medidasCirculo(4, { prof: 1 }).parede, 2 * Math.PI * 2, 0.01);

// O polígono serve para desenhar; a conta exata é a de cima.
const areaPoli = areaPoligono(contornoCircular(4));
perto("o polígono de 48 gomos erra menos de 0,4%", (1 - areaPoli / c.area) * 100, 0.29, 0.05);
eq("e o banco desenha nele", regioesBanco(contornoCircular(4), 0.5, 0.5).length, GOMOS_CIRCULO);

console.log("\n— dentro do orçamento —");
const arC = calcA({ diametro: "4", depth: "1.00", bancoOn: true, bancoLarg: "0.50", bancoProf: "0.50" }, { on: false }, "regular", [], "Circular", [], {}, null);
perto("circular: chão 12,6", parseFloat(arC.chao), 12.6, 0.06);
perto("circular: paredes 11,0", parseFloat(arC.par), 11.0, 0.06);
perto("circular: volume 9,8", parseFloat(arC.vol), 9.8, 0.06);
perto("circular: perímetro 12,6", parseFloat(arC.perim), 12.57, 0.06);
eq("circular sem diâmetro não vira área fantasma", calcA({ depth: "1" }, { on: false }, "regular", [], "Circular", [], {}, null).circular === undefined, true);

// O teste de cima passava com o bug vivo: sem comprimento e largura o retângulo
// dá zero de qualquer jeito. O editor de verdade NASCE com 10,00 × 4,00
// (App.jsx) e circular/triangular só escondem esses campos. Medido em 24/09:
// circular sem diâmetro cobrava 79,2 m²; triângulo com banco grande, 68,0 m².
console.log("\n— medida que não fecha não cobra o retângulo escondido —");
const EDITOR = { length: "10.00", width: "4.00", depth: "1.40", diametro: "", triA: "", triB: "", triC: "" };
const arCirSem = calcA({ ...EDITOR }, { on: false }, "regular", [], "Circular", [], {}, null);
eq("circular sem diâmetro: 0 m², não 79,2", arCirSem.tot, "0.0");
eq("e diz o que falta", arCirSem.invalido, "Falta o DIÂMETRO da piscina redonda");
const arTriSem = calcA({ ...EDITOR }, { on: false }, "regular", [], "Triangular", [], {}, null);
eq("triângulo sem lados: 0 m²", arTriSem.tot, "0.0");
eq("e pede os três lados", arTriSem.invalido, "Faltam os TRÊS LADOS do triângulo");
const arTriTorto = calcA({ ...EDITOR, triA: "1", triB: "1", triC: "5" }, { on: false }, "regular", [], "Triangular", [], {}, null);
eq("lados que não fecham: 0 m², não 68,0", arTriTorto.tot, "0.0");
eq("e manda conferir a medida", arTriTorto.invalido, "Esses três lados não fecham um triângulo — confira a medida");
const arTriBanco = calcA({ ...EDITOR, depth: "1.00", triA: "4.10", triB: "3.10", triC: "2.80", bancoOn: true, bancoLarg: "1.20", bancoProf: "0.50" }, { on: false }, "regular", [], "Triangular", [], {}, null);
eq("banco maior que o raio inscrito: 0 m², não 68,0", arTriBanco.tot, "0.0");
eq("e repete o erro do motor", /não cabe neste triângulo/.test(arTriBanco.invalido), true);
// A TRAVA do outro lado: medida válida continua igual.
const arTriOk = calcA({ ...EDITOR, depth: "1.00", triA: "4.10", triB: "3.10", triC: "2.80" }, { on: false }, "regular", [], "Triangular", [], {}, null);
eq("triângulo válido não ganha aviso", arTriOk.invalido, undefined);
eq("e continua 14,3 m²", arTriOk.tot, "14.3");
eq("circular válida não ganha aviso", calcA({ ...EDITOR, diametro: "4" }, { on: false }, "regular", [], "Circular", [], {}, null).invalido, undefined);
eq("retangular nunca é marcado", calcA({ ...EDITOR }, { on: false }, "regular", [], "Retangular", [], {}, null).invalido, undefined);

const oitCB = calcA({ length: "6", width: "3", depth: "1.40", chanfro: "1", bancoOn: true, bancoLarg: "0.50", bancoProf: "0.50" }, { on: false }, "regular", [], "Oitavada", [], {}, null);
perto("oitavada com banco: chão 16,0", parseFloat(oitCB.chao), 16.0, 0.06);
perto("oitavada com banco: paredes 18,9", parseFloat(oitCB.par), 18.9, 0.06);
perto("oitavada com banco: volume 16,1", parseFloat(oitCB.vol), 16.1, 0.06);

// A TRAVA: oitavada SEM banco tem de calcular igual ao de antes.
const oitSB = calcA({ length: "6", width: "3", depth: "1.40", chanfro: "1" }, { on: false }, "regular", [], "Oitavada", [], {}, null);
perto("oitavada sem banco: chão continua 16,0", parseFloat(oitSB.chao), 16.0, 0.06);
perto("oitavada sem banco: paredes continuam 21,9", parseFloat(oitSB.par), 21.9, 0.06);
perto("oitavada sem banco: volume continua 22,4", parseFloat(oitSB.vol), 22.4, 0.06);

console.log("\n— plano de corte da redonda (regra do Marcos, 23/09) —");
const pc = planoCircular({ diametro: 4, prof: 1.0, banco: { larg: 0.5, prof: 0.5 } });
eq("parede sai em tira contornando, 2 peças (costas + espelho)", pc.paredes.qtdPecas, 2);
perto("a tira das costas mede o perímetro + fechamento", pc.paredes.pecas[0].comp, 2 * Math.PI * 2 + 0.05, 0.02);
perto("e a altura leva as duas dobras", pc.paredes.pecas[0].altura, 0.5 + 0.1, 0.01);
eq("o plano horizontal sai do QUADRADO que envolve", pc.chao.partes[0].nome, "Chão + assento (quadrado que envolve)");
perto("quadrado de 4,00 → 3 faixas de 4,00", pc.chao.partes[0].faixas, 3, 0.01);
eq("costas e espelho saem na mesma passada", pc.passadas[0].pecas.length, 2);
perto("24,62 m lineares", pc.metrosLineares, 24.62, 0.05);
eq("1 bobina", pc.pedido.qtd, 1);
perto("superfície real 23,56 m²", pc.areaUtil, 12.57 - 5.50 + 5.50 + 4.71 + 6.28, 0.05);
eq("banco maior que o raio vira erro", typeof planoCircular({ diametro: 4, prof: 1, banco: { larg: 2.5, prof: 0.5 } }).erro, "string");
eq("diâmetro zero vira erro", typeof planoCircular({ diametro: 0, prof: 1 }).erro, "string");

const semB = planoCircular({ diametro: 4, prof: 1.2 });
eq("sem banco: uma tira de parede só", semB.paredes.qtdPecas, 1);
perto("sem banco: altura = prof + dobras", semB.paredes.pecas[0].altura, 1.2 + 0.1, 0.01);
eq("sem banco: o chão é o quadrado do diâmetro", semB.chao.partes.length, 1);

// ─── BANCO QUE NÃO CABE (24/09) ───────────────────────────────────────────
// Antes: redonda e oitavada descartavam o banco em silêncio e cobravam a
// piscina sem ele; banco com o assento no fundo sumia nos três formatos; e a
// oitavada aceitava banco mais largo que a metade da piscina, com "piso" que
// não existe. Banco com as medidas vazias continua só ilustrativo.
console.log("\n— banco que não cabe: redonda —");
const R4 = { length: "10.00", width: "4.00", depth: "1.00", diametro: "4" };
const cR = (p) => calcA({ ...R4, ...p }, { on: false }, "regular", [], "Circular", [], {}, null);
eq("banco máximo da Ø4: 1,94 m (sobra 0,01 m² de piso)", bancoMaximoRedondo(4), 1.94);
eq("1,94 cabe", erroBancoRedondo(4, 1.94, 0.5, 1), null);
eq("1,95 não cabe", typeof erroBancoRedondo(4, 1.95, 0.5, 1), "string");
const rLargo = cR({ bancoOn: true, bancoLarg: "2.10", bancoProf: "0.50" });
eq("banco de 2,10: área zero, não a redonda sem banco", rLargo.tot, "0.0");
eq("e diz até onde cabe", /acima de 1,94 m/.test(rLargo.invalido), true);
const rFundo = cR({ bancoOn: true, bancoLarg: "0.50", bancoProf: "1.20" });
eq("assento a 1,20 numa de 1,00: área zero", rFundo.tot, "0.0");
eq("e diz que o assento ficaria no fundo", /ficaria no fundo/.test(rFundo.invalido), true);
eq("banco ligado sem medida segue ilustrativo", cR({ bancoOn: true, bancoLarg: "", bancoProf: "" }).tot, cR({}).tot);
eq("banco que cabe não muda (0,50 × 0,50)", cR({ bancoOn: true, bancoLarg: "0.50", bancoProf: "0.50" }).invalido, undefined);
eq("o plano de corte recusa o assento no fundo também", /ficaria no fundo/.test(planoCircular({ diametro: 4, prof: 1, banco: { larg: 0.5, prof: 1.2 } }).erro), true);

console.log("\n— banco que não cabe: oitavada (piso fantasma) —");
const O63 = { length: "6", width: "3", depth: "1.40", chanfro: "1" };
const cO = (p) => calcA({ ...O63, ...p }, { on: false }, "regular", [], "Oitavada", [], {}, null);
const oit63 = contornoOitavada(6, 3, 1);
// área ÷ semiperímetro dava 2,04 m numa piscina de 3 m de largura
perto("banco máximo da 6 × 3 é 1,24 m, não 2,04", geometriaComBanco({ contorno: oit63, prof: 1.4 }).bancoMaximo, 1.24);
for (const b of ["1.55", "2.00"]) {
  const r = cO({ bancoOn: true, bancoLarg: b, bancoProf: "0.50" });
  eq(`banco de ${b.replace(".", ",")}: recusa em vez de piso fantasma`, r.tot, "0.0");
}
const oLargo = cO({ bancoOn: true, bancoLarg: "1.40", bancoProf: "0.50" });
eq("a mensagem fala da piscina, não de triângulo", /nesta piscina/.test(oLargo.invalido) && !/triângulo/.test(oLargo.invalido), true);
eq("assento no fundo também recusa", /ficaria no fundo/.test(cO({ bancoOn: true, bancoLarg: "0.50", bancoProf: "1.60" }).invalido), true);
eq("banco ligado sem medida: conta da oitavada sem banco", cO({ bancoOn: true, bancoLarg: "", bancoProf: "" }).tot, cO({}).tot);
// A conta e a planta passam a responder a mesma pergunta do mesmo jeito.
const concordam = [0.5, 1.0, 1.2, 1.3, 1.4, 1.6, 2.0].every(b => {
  const conta = !cO({ bancoOn: true, bancoLarg: String(b), bancoProf: "0.50" }).invalido;
  const planta = regioesBanco(oit63, b, 0.5).length > 0;
  return conta === planta;
});
eq("conta e planta concordam de 0,50 a 2,00 m", concordam, true);

console.log("\n— banco que não cabe: triângulo —");
const T = { length: "10.00", width: "4.00", depth: "1.00", triA: "4.10", triB: "3.10", triC: "2.80" };
const tFundo = calcA({ ...T, bancoOn: true, bancoLarg: "0.50", bancoProf: "1.20" }, { on: false }, "regular", [], "Triangular", [], {}, null);
eq("assento no fundo: área zero (antes sumia o banco em silêncio)", tFundo.tot, "0.0");
eq("e diz por quê", /ficaria no fundo/.test(tFundo.invalido), true);
eq("o triângulo continua falando de triângulo", /neste triângulo: acima de 0,86 m os três bancos/.test(geometriaTriangular({ a: 4.1, b: 3.1, c: 2.8, prof: 1, banco: { larg: 1.2, prof: 0.5 } }).erro), true);

console.log(`\nformatos.test: ${ok} testes ok${falhas ? `, ${falhas} FALHA(S)` : ""}`);
process.exit(falhas ? 1 : 0);
