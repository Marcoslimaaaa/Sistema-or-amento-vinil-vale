// Degraus em vários níveis — ponta rasa em escada e escada lateral.
// Roda sem navegador: node src/motor/__tests__/niveis.test.mjs
//
// GABARITOS FEITOS À MÃO (não saem do motor), piscina 8,00 × 4,00 × 1,40:
//
// A) PONTA, LARGURA TODA — D1 0,30 × 0,20 · D2 0,30 × 0,40 · prainha 1,50 × 0,60
//    laterais: 2 × (0,3·0,2 + 0,3·0,4 + 1,5·0,6 + 5,9·1,4) = 2 × 9,34 = 18,68
//    testeira rasa 4 × 0,2 = 0,80 · testeira funda 4 × 1,4 = 5,60
//    espelhos: 4·0,2 + 4·0,2 + 4·0,8 = 4,80        → vertical 29,88 m²
//    chão 32,00 → TOTAL 61,88 m² · volume 4 × 9,34 = 37,36 m³
//
// B) BLOCO NO CANTO DE CIMA, 1,20 de largura — D1 0,30 × 0,20 · D2 0,30 × 0,40,
//    sobre a prainha 1,50 × 0,60 (largura toda)
//    testeira rasa 1,2·0,2 + 2,8·0,6 = 1,92 · funda 5,60
//    lateral de cima 0,06 + 0,12 + 0,9·0,6 + 6,5·1,4 = 9,82 · de baixo 0,90 + 9,10 = 10,00
//    espelhos: D1→D2 1,2·0,2 = 0,24 · D2→prainha 1,2·0,2 = 0,24
//              lado do bloco 0,3·0,4 + 0,3·0,2 = 0,18 · prainha→fundo 4·0,8 = 3,20
//    vertical 27,34 + 3,86 = 31,20 → TOTAL 63,20 m²
//    volume 0,072 + 0,144 + 5,28·0,6 + 26·1,4 = 39,784 m³
//
// C) ESCADA LATERAL EM CIMA — D1 0,30 × 0,20 · D2 0,30 × 0,40
//    lateral de cima 8·0,2 = 1,60 · de baixo 8·1,4 = 11,20
//    testeiras 2 × (0,3·0,2 + 0,3·0,4 + 3,4·1,4) = 2 × 4,94 = 9,88
//    espelhos 8·0,2 + 8·1,0 = 9,60 → vertical 32,28 → TOTAL 64,28 m²
//    volume 8 × 4,94 = 39,52 m³
import { lerDegraus, pontaCfg, textoPonta, celulasDaPiscina, medirCelulas,
  facesPontaNiveis, chaoPontaNiveis, ninharPecas, planoNiveis } from "../niveis.js";
import { calcA } from "../areas.js";
import { bancoCfg, textoBanco } from "../banco.js";
import { facesComBanco, cortarPeca, planoManta } from "../manta.js";
import { planoMantaDoOrcamento } from "../orcamento.js";

let ok = 0, falhas = 0;
const eq = (nome, real, esperado) => {
  const passou = JSON.stringify(real) === JSON.stringify(esperado);
  passou ? ok++ : falhas++;
  console.log(`  ${passou ? "ok " : "FALHA"} ${nome}${passou ? "" : `\n       esperado ${JSON.stringify(esperado)}\n       veio     ${JSON.stringify(real)}`}`);
};
const perto = (nome, real, esperado, tol = 0.005) => {
  const passou = Number.isFinite(real) && Math.abs(real - esperado) <= tol;
  passou ? ok++ : falhas++;
  console.log(`  ${passou ? "ok " : "FALHA"} ${nome}${passou ? ` [${real.toFixed(3)}]` : `\n       esperado ${esperado} ± ${tol}, veio ${real}`}`);
};
const vd = (nome, cond) => eq(nome, !!cond, true);

const L = 8, W = 4, D = 1.4;
const BASE = { length: "8", width: "4", depth: "1.40" };
const SEM_SPA = { on: false, length: "0", width: "0", depth: "0" };
const PONTA_A = { ...BASE, prainhaComp: "1,50", prainhaProf: "0,60",
  degraus: [{ avanco: "0,30", prof: "0,20" }, { avanco: "0,30", prof: "0,40" }] };
const PONTA_B = { ...PONTA_A, degrausLarg: "1,20", degrausLado: "cima" };
const ESCADA_C = { ...BASE, bancoOn: true, bancoLarg: "0,30", bancoProf: "0,20", bancoLado: "cima",
  bancoDegraus: [{ larg: "0,30", prof: "0,40" }] };

console.log("\n— leitura das linhas de degrau —");
eq("linha toda vazia some (só apertou + Degrau)", lerDegraus([{ avanco: "", prof: "" }]).lista, []);
eq("vírgula decimal", lerDegraus([{ avanco: "0,30", prof: "0,2" }]).lista, [{ a: 0.3, p: 0.2 }]);
vd("linha pela metade é erro, não some", lerDegraus([{ avanco: "0,30", prof: "" }]).erro?.includes("profundidade"));
vd("avanço faltando também", lerDegraus([{ avanco: "", prof: "0,40" }]).erro?.includes("avanço"));

console.log("\n— pontaCfg —");
eq("sem degrau devolve null (a prainha segue o caminho antigo)", pontaCfg({ ...BASE, prainhaComp: "1,5", prainhaProf: "0,6" }, "Com prainha", L, W, D), null);
eq("outro formato não tem ponta em níveis", pontaCfg(PONTA_A, "Retangular", L, W, D), null);
const pA = pontaCfg(PONTA_A, "Com prainha", L, W, D);
eq("A: sem erro", pA.erro, null);
eq("A: ordem borda → D1 → D2 → prainha", pA.niveis.map((n) => n.rotulo), ["D1", "D2", "Prainha"]);
eq("A: posições no comprimento", pA.niveis.map((n) => [+n.x0.toFixed(2), +n.x1.toFixed(2)]), [[0, 0.3], [0.3, 0.6], [0.6, 2.1]]);
perto("A: o fundo começa em 2,10", pA.fim, 2.1);
const pDep = pontaCfg({ ...BASE, prainhaComp: "1,50", prainhaProf: "0,40", degrausPos: "depois",
  degraus: [{ avanco: "0,30", prof: "0,70" }, { avanco: "0,30", prof: "1,00" }] }, "Com prainha", L, W, D);
eq("depois: prainha primeiro, degraus descendo para o fundo", pDep.niveis.map((n) => n.rotulo), ["Prainha", "D1", "D2"]);
eq("depois: D2 termina em 2,10", +pDep.niveis[2].x1.toFixed(2), 2.1);
const soDeg = pontaCfg({ ...BASE, degraus: [{ avanco: "0,30", prof: "0,25" }, { avanco: "0,30", prof: "0,50" }, { avanco: "0,30", prof: "0,75" }] }, "Com prainha", L, W, D);
eq("só degraus, sem prainha, também vale", [soDeg.erro, soDeg.niveis.length, +soDeg.fim.toFixed(2)], [null, 3, 0.9]);

console.log("\n— pontaCfg: medida que não fecha vira erro com motivo —");
vd("degrau mais raso que o anterior", pontaCfg({ ...PONTA_A, degraus: [{ avanco: "0,3", prof: "0,40" }, { avanco: "0,3", prof: "0,20" }] }, "Com prainha", L, W, D).erro?.includes("abaixo"));
vd("degraus com menos de 5 cm de diferença", pontaCfg({ ...PONTA_A, degraus: [{ avanco: "0,3", prof: "0,20" }, { avanco: "0,3", prof: "0,22" }] }, "Com prainha", L, W, D).erro?.includes("5 cm"));
vd("último nível no fundo", pontaCfg({ ...PONTA_A, prainhaProf: "1,38" }, "Com prainha", L, W, D).erro?.includes("acima do fundo"));
vd("níveis que comem a piscina inteira", pontaCfg({ ...PONTA_A, prainhaComp: "7,50" }, "Com prainha", L, W, D).erro?.includes("não sobra fundo"));
vd("prainha sem profundidade, com degraus", pontaCfg({ ...PONTA_A, prainhaProf: "" }, "Com prainha", L, W, D).erro?.includes("profundidade da prainha"));
vd("linha de degrau pela metade", pontaCfg({ ...PONTA_A, degraus: [{ avanco: "0,3", prof: "" }] }, "Com prainha", L, W, D).erro?.includes("Degrau 1"));

console.log("\n— pontaCfg: bloco num canto —");
const pB = pontaCfg(PONTA_B, "Com prainha", L, W, D);
eq("B: sem erro", pB.erro, null);
eq("B: canto de cima, 0 a 1,20", [pB.canto.lado, pB.canto.y0, pB.canto.y1], ["cima", 0, 1.2]);
eq("B: os degraus do bloco", pB.canto.degraus.map((d) => [d.rotulo, +d.x0.toFixed(2), +d.x1.toFixed(2), d.prof]), [["D1", 0, 0.3, 0.2], ["D2", 0.3, 0.6, 0.4]]);
eq("B: o bloco senta na prainha", [pB.canto.baseProf, pB.canto.baseRotulo], [0.6, "prainha"]);
eq("B: a prainha atravessa a largura toda", pB.niveis.map((n) => n.rotulo), ["Prainha"]);
perto("B: o fundo começa no fim da prainha", pB.fim, 1.5);
const pBb = pontaCfg({ ...PONTA_B, degrausLado: "baixo" }, "Com prainha", L, W, D);
eq("B embaixo: 2,80 a 4,00", [+pBb.canto.y0.toFixed(2), +pBb.canto.y1.toFixed(2)], [2.8, 4]);
vd("bloco mais comprido que a prainha", pontaCfg({ ...PONTA_B, prainhaComp: "0,50" }, "Com prainha", L, W, D).erro?.includes("caber dentro da prainha"));
vd("bloco de canto só antes da prainha", pontaCfg({ ...PONTA_B, degrausPos: "depois" }, "Com prainha", L, W, D).erro?.includes("borda rasa"));
vd("sobra menos de 10 cm ao lado", pontaCfg({ ...PONTA_B, degrausLarg: "3,95" }, "Com prainha", L, W, D).erro?.includes("10 cm"));
eq("largura igual à da piscina = largura toda", pontaCfg({ ...PONTA_B, degrausLarg: "4,00" }, "Com prainha", L, W, D).canto, null);
const pBf = pontaCfg({ ...BASE, degrausLarg: "1,20", degraus: [{ avanco: "0,3", prof: "0,25" }, { avanco: "0,3", prof: "0,5" }] }, "Com prainha", L, W, D);
eq("bloco sem prainha senta no fundo", [pBf.erro, pBf.canto.baseRotulo, pBf.canto.baseProf], [null, "fundo", 1.4]);

console.log("\n— células: batem com a conta ANTIGA nos casos de um nível só —");
const caixa = medirCelulas(celulasDaPiscina({ L, W, D }));
perto("caixa lisa: paredes 2(L+W)D", caixa.paredes, 2 * (L + W) * D, 1e-9);
perto("caixa lisa: sem espelho", caixa.espelhos, 0, 1e-9);
perto("caixa lisa: volume L·W·D", caixa.volume, L * W * D, 1e-9);
// prainha antiga, 6,00 × 3,50 × 1,40 com 1,00 a 0,50
const legP = calcA({ length: "6", width: "3.5", depth: "1.4", prainhaComp: "1", prainhaProf: "0.5" }, SEM_SPA, "regular", [], "Com prainha", [], {}, null);
const celP = medirCelulas(celulasDaPiscina({ L: 6, W: 3.5, D: 1.4, prainhaLegada: { comp: 1, prof: 0.5 } }));
eq("prainha antiga: parede igual (paredes + degrau)", (celP.paredes + celP.espelhos).toFixed(1), legP.par);
eq("prainha antiga: volume igual", celP.volume.toFixed(1), legP.vol);
// banco antigo, 8,00 × 4,00 × 1,40 com 0,45 a 0,40
const bancoPool = { ...BASE, bancoOn: true, bancoLarg: "0,45", bancoProf: "0,40" };
const legB = calcA(bancoPool, SEM_SPA, "regular", [], "Retangular", [], {}, null);
const bc1 = bancoCfg(bancoPool, "Retangular", L, W, D);
eq("banco de um nível segue com 1 nível", bc1.niveis.length, 1);
const celB = medirCelulas(celulasDaPiscina({ L, W, D, banco: bc1 }));
eq("banco antigo: parede igual", (celB.paredes + celB.espelhos).toFixed(1), legB.par);
eq("banco antigo: volume igual", celB.volume.toFixed(1), legB.vol);

console.log("\n— células: os três gabaritos feitos à mão —");
const mA = medirCelulas(celulasDaPiscina({ L, W, D, ponta: pA }));
perto("A: paredes do contorno 25,08", mA.paredes, 25.08, 1e-6);
perto("A: espelhos 4,80", mA.espelhos, 4.8, 1e-6);
perto("A: total 61,88", mA.total, 61.88, 1e-6);
perto("A: volume 37,36", mA.volume, 37.36, 1e-6);
const mB = medirCelulas(celulasDaPiscina({ L, W, D, ponta: pB }));
perto("B: testeira rasa 1,92", mB.porParede.testeiraRasa, 1.92, 1e-6);
perto("B: lateral de cima 9,82", mB.porParede.lateralCima, 9.82, 1e-6);
perto("B: lateral de baixo 10,00", mB.porParede.lateralBaixo, 10, 1e-6);
perto("B: espelhos 3,86", mB.espelhos, 3.86, 1e-6);
perto("B: total 63,20", mB.total, 63.2, 1e-6);
perto("B: volume 39,784", mB.volume, 39.784, 1e-6);
const bcC = bancoCfg(ESCADA_C, "Retangular", L, W, D);
eq("C: escada com 2 degraus", bcC.niveis, [{ larg: 0.3, prof: 0.2 }, { larg: 0.3, prof: 0.4 }]);
perto("C: largura total 0,60", bcC.larg, 0.6, 1e-9);
const mC = medirCelulas(celulasDaPiscina({ L, W, D, banco: bcC }));
perto("C: testeiras 9,88", mC.porParede.testeiraRasa + mC.porParede.testeiraFunda, 9.88, 1e-6);
perto("C: espelhos 9,60", mC.espelhos, 9.6, 1e-6);
perto("C: total 64,28", mC.total, 64.28, 1e-6);
perto("C: volume 39,52", mC.volume, 39.52, 1e-6);

console.log("\n— dentro do calcA —");
const aA = calcA(PONTA_A, SEM_SPA, "regular", [], "Com prainha", [], {}, null);
eq("A: chão 32,0 · paredes 29,9 · total 61,9 · volume 37,4", [aA.chao, aA.par, aA.tot, aA.vol], ["32.0", "29.9", "61.9", "37.4"]);
const aB = calcA(PONTA_B, SEM_SPA, "regular", [], "Com prainha", [], {}, null);
eq("B: total 63,2 · volume 39,8", [aB.tot, aB.vol], ["63.2", "39.8"]);
const aC = calcA(ESCADA_C, SEM_SPA, "regular", [], "Retangular", [], {}, null);
eq("C: total 64,3 · volume 39,5", [aC.tot, aC.vol], ["64.3", "39.5"]);
const ruim = calcA({ ...PONTA_A, prainhaProf: "1,38" }, SEM_SPA, "regular", [], "Com prainha", [], {}, null);
vd("medida que não fecha trava o orçamento, com motivo", ruim.invalido && ruim.tot === "0.0");
const ruimC = calcA({ ...ESCADA_C, bancoDegraus: [{ larg: "0,30", prof: "0,10" }] }, SEM_SPA, "regular", [], "Retangular", [], {}, null);
vd("escada com degrau fora de ordem também trava", !!ruimC.invalido);
const largaC = calcA({ ...ESCADA_C, bancoDegraus: [{ larg: "1,80", prof: "0,40" }] }, SEM_SPA, "regular", [], "Retangular", [], {}, null);
vd("escada larga demais (mais de 45%) trava", largaC.invalido?.includes("45%"));
// orçamento antigo não muda: 6,00 × 3,00 × 1,40 com prainha 1,00 a 0,50 dava
// 41,4 m² e 22,5 m³ ANTES desta mudança (medido no código da main, 24/10)
const leg6x3 = calcA({ length: "6", width: "3", depth: "1.4", prainhaComp: "1", prainhaProf: "0.5" }, SEM_SPA, "regular", [], "Com prainha", [], {}, null);
eq("prainha sem degrau calcula igual ao de sempre (41,4 · 22,5)", [leg6x3.tot, leg6x3.vol], ["41.4", "22.5"]);
// escada lateral junto com a ponta em níveis: começa depois do último nível
const aAC = calcA({ ...PONTA_A, bancoOn: true, bancoLarg: "0,30", bancoProf: "0,20", bancoLado: "baixo",
  bancoDegraus: [{ larg: "0,30", prof: "0,40" }] }, SEM_SPA, "regular", [], "Com prainha", [], {}, null);
const bAC = bancoCfg({ ...PONTA_A, bancoOn: true, bancoLarg: "0,30", bancoProf: "0,20", bancoLado: "baixo",
  bancoDegraus: [{ larg: "0,30", prof: "0,40" }] }, "Com prainha", L, W, D);
perto("ponta + escada: a escada começa em 2,10", bAC.x0, 2.1, 1e-9);
perto("ponta + escada: corre 5,90", bAC.comprimento, 5.9, 1e-9);
// mão: A (61,88) − testeira funda 0,3·1,2 + 0,3·1,0 = 0,66 − espelho prainha→fundo
// tapado (0,3·0,8 + 0,3·0,8 = 0,48) + face do bloco subindo da prainha... só a
// conta por células sabe — conferimos contra ela, com o volume exato.
const mAC = medirCelulas(celulasDaPiscina({ L, W, D, ponta: pA, banco: bAC }));
eq("ponta + escada: calcA = células", [aAC.tot, aAC.vol], [mAC.total.toFixed(1), mAC.volume.toFixed(1)]);
perto("ponta + escada: volume = A − 5,90 × (0,3·1,2 + 0,3·1,0)", mAC.volume, 37.36 - 5.9 * 0.66, 1e-6);

// paredes digitadas (fora de esquadro) valem como a caixa; os degraus entram
// como diferença — digitando a própria caixa, o número tem de ser o mesmo
const caixaDigitada = [{ l: "8", h: "1.4" }, { l: "4", h: "1.4" }, { l: "8", h: "1.4" }, { l: "4", h: "1.4" }];
eq("C fora de esquadro, paredes = caixa: igual ao regular", calcA(ESCADA_C, SEM_SPA, "irregular", caixaDigitada, "Retangular", [], {}, null).tot, aC.tot);
eq("A fora de esquadro, paredes = caixa: igual ao regular", calcA(PONTA_A, SEM_SPA, "irregular", caixaDigitada, "Com prainha", [], {}, null).tot, aA.tot);

console.log("\n— manta: escada lateral (a regra do banco, degrau por degrau) —");
const pecasC = facesComBanco(L, W, D, bcC.larg, bcC.prof, bcC.niveis).map((f) => cortarPeca(f));
const med = (nome) => { const p = pecasC.find((x) => x.nome === nome); return p ? `${p.comp.toFixed(2)} x ${p.altura.toFixed(2)}` : "nao existe"; };
eq("testeira 1 sai 4,10 × 1,50, com sobra nos cantos", med("Testeira 1"), "4.10 x 1.50");
eq("testeira 2 idem", med("Testeira 2"), "4.10 x 1.50");
eq("lateral em frente à escada rente", med("Lateral (em frente à escada)"), "8.00 x 1.50");
eq("espelho do degrau 1: 0,20 + 5 em cima + 5 embaixo", med("Espelho do degrau 1"), "8.00 x 0.30");
eq("espelho do degrau 2: 1,00 + 5 + 5", med("Espelho do degrau 2"), "8.00 x 1.10");
eq("testeira do 1º degrau: do assento até a borda", med("Testeira do 1º degrau"), "8.00 x 0.30");
eq("a testeira carrega o recorte em escada", pecasC[0].recorte.degraus, [{ larg: 0.3, alt: 1.2 }, { larg: 0.3, alt: 1 }]);
const facesLegado = facesComBanco(6, 4, 1.4, 0.5, 0.5);
eq("banco de um nível segue com as 5 peças ditadas em 22/09", facesLegado.map((f) => f.nome),
  ["Testeira 1", "Testeira 2", "Lateral (em frente ao banco)", "Espelho do banco", "Testeira do banco"]);
eq("e passar o nível único dá o mesmo", facesComBanco(6, 4, 1.4, 0.5, 0.5, [{ larg: 0.5, prof: 0.5 }]), facesLegado);
const plC = planoMantaDoOrcamento({ pool: ESCADA_C, poolFmt: "Retangular", spa: SEM_SPA, wMode: "regular", desenho: null }, aC);
eq("o chão da escada lateral não muda: 3 faixas de 8,02", [plC.chao.partes.length, plC.chao.partes[0].faixas, plC.chao.partes[0].compFaixa], [1, 3, 8.02]);
eq("6 peças de parede", plC.paredes.qtdPecas, 6);

console.log("\n— manta: ponta em níveis, largura toda —");
const fA = facesPontaNiveis({ L, W, D, ponta: pA });
eq("espelhos primeiro, na ordem da obra", fA.espelhos.map((f) => f.nome),
  ["Testeira rasa", "Espelho D1 → D2", "Espelho D2 → Prainha", "Espelho Prainha → fundo"]);
eq("depois 2 comprimentos e 1 largura", fA.paredes.map((f) => f.nome), ["Lateral 1", "Testeira funda", "Lateral 2"]);
const pecA = [...fA.espelhos, ...fA.paredes].map((f) => cortarPeca(f));
const medA = (nome) => { const p = pecA.find((x) => x.nome === nome); return p ? `${p.comp.toFixed(2)} x ${p.altura.toFixed(2)}` : "nao existe"; };
eq("testeira rasa 4,10 × 0,30", medA("Testeira rasa"), "4.10 x 0.30");
eq("espelho D1 → D2: 0,20 + 5 cima + 5 baixo, 5 em cada ponta", medA("Espelho D1 → D2"), "4.10 x 0.30");
eq("espelho prainha → fundo 4,10 × 0,90", medA("Espelho Prainha → fundo"), "4.10 x 0.90");
eq("lateral INTEIRA na altura maior: 8,10 × 1,50", medA("Lateral 1"), "8.10 x 1.50");
eq("e leva o recorte dos 3 níveis", pecA.find((p) => p.nome === "Lateral 1").recorte.degraus.length, 3);
const chA = chaoPontaNiveis({ L, W, D, ponta: pA });
eq("pisadas e pisos, cada um peça própria", chA.map((p) => p.nome), ["Pisada D1", "Pisada D2", "Piso da prainha", "Chão · fundo"]);
eq("pisada D1: 1 cm contra a testeira, zero no topo do espelho", [chA[0].faixas, chA[0].compFaixa, chA[0].alvo], [1, 4.02, 0.31]);
eq("pisada D2: zero dos dois lados", [chA[1].faixas, chA[1].compFaixa, chA[1].alvo], [1, 4.02, 0.3]);
eq("fundo: 3 faixas de 5,91 no comprimento (menos emenda)", [chA[3].faixas, chA[3].compFaixa], [3, 5.91]);
const plA = planoNiveis({ L, W, D, ponta: pA });
const juntas = plA.passadas.find((p) => p.pecas.includes("Pisada D1"));
vd("as pisadas estreitas saem na MESMA passada", juntas.pecas.includes("Pisada D2"));
vd("com folga de solda entre elas, sem passar de 1,55", juntas.largura <= 1.55 + 1e-9);
perto("50,25 m lineares (8,10 + 8,10 + 4,10 × 3 + 4,02 + 3 × 5,91)", plA.metrosLineares, 50.25, 0.001);
perto("manta cortada 77,89 m²", plA.areaCobravel, 77.89, 0.01);
perto("superfície de verdade = a do calcA (61,88)", plA.areaUtil, 61.88, 0.01);
eq("3 bobinas de 25 m", plA.pedido.qtd, 3);
const plAU = planoNiveis({ L, W, D, ponta: pA, faixaUnica: true });
const faixa = plAU.paredes.pecas.find((p) => p.corrida);
eq("faixa única: lateral + fundo + lateral numa peça de 20,10 × 1,50", faixa && `${faixa.comp.toFixed(2)} x ${faixa.altura.toFixed(2)}`, "20.10 x 1.50");
eq("vincada nos 2 cantos", faixa.vincos, 2);
perto("e economiza os 20 cm das 4 pontas", plA.metrosLineares - plAU.metrosLineares, 0.2, 0.001);

console.log("\n— manta: bloco no canto —");
const fB = facesPontaNiveis({ L, W, D, ponta: pB });
eq("espelhos do bloco, a face do bloco e o da prainha", fB.espelhos.map((f) => f.nome),
  ["Espelho D1 → D2", "Espelho D2 → prainha", "Lateral dos degraus", "Espelho prainha → fundo"]);
eq("espelhos do bloco têm a largura do bloco", fB.espelhos.slice(0, 2).map((f) => f.comp), [1.2, 1.2]);
eq("a face do bloco: 0,60 de comprimento, 0,40 de altura cheia", [fB.espelhos[2].comp, fB.espelhos[2].prof], [0.6, 0.4]);
eq("testeira rasa inteira na altura da prainha, recortada no bloco", [fB.paredes[0].nome, fB.paredes[0].prof, fB.paredes[0].recorte.degraus], ["Testeira rasa", 0.6, [{ larg: 1.2, alt: 0.4 }]]);
eq("lateral do lado do bloco recortada em 3 trechos", fB.paredes[1].recorte.degraus.length, 3);
eq("lateral oposta recortada só na prainha", fB.paredes[3].recorte.degraus, [{ larg: 1.5, alt: 0.8 }]);
const chB = chaoPontaNiveis({ L, W, D, ponta: pB });
eq("pisadas do bloco, piso da prainha em L e o fundo", chB.map((p) => p.nome), ["Pisada D1", "Pisada D2", "Piso da prainha", "Chão · fundo"]);
// a pisada do bloco é 0,31 × 1,21 (1 cm na testeira e na lateral); o motor corta
// ATRAVESSANDO a bobina, que gasta 0,31 m de rolo em vez de 1,21
eq("pisada do bloco: 0,31 × 1,21, atravessando a bobina", [chB[0].compFaixa, chB[0].alvo], [0.31, 1.21]);
vd("o piso da prainha acompanha o L", chB[2].contorno === true);
const plB = planoNiveis({ L, W, D, ponta: pB });
perto("B: superfície de verdade 63,20", plB.areaUtil, 63.2, 0.01);
vd("B: tem plano e pedido", plB.metrosLineares > 0 && plB.pedido.qtd >= 1);

console.log("\n— ninhagem —");
const nn = ninharPecas([{ nome: "a", comp: 4, largura: 0.3 }, { nome: "b", comp: 4, largura: 0.3 }, { nome: "c", comp: 4, largura: 0.9 }, { nome: "d", comp: 4, largura: 0.1 }]);
eq("cabe tudo em uma passada: 0,3 + 0,3 + 0,9 + 3 × 0,05 = 1,65 não; 0,9 + 0,3 + 0,3 = 1,60 não", nn.length, 2);
eq("peça larga demais não estoura a passada", ninharPecas([{ nome: "x", comp: 3, largura: 2 }])[0].largura, 1.55);

console.log("\n— plano pelo orçamento —");
const plOrc = planoMantaDoOrcamento({ pool: PONTA_A, poolFmt: "Com prainha", spa: SEM_SPA, wMode: "regular", desenho: null }, aA);
vd("Com prainha + degraus usa o plano de níveis", plOrc?.niveis === true);
perto("mesmo número do plano direto", plOrc.metrosLineares, 50.25, 0.001);
const plOrcU = planoMantaDoOrcamento({ pool: { ...PONTA_A, paredeFaixaUnica: true }, poolFmt: "Com prainha", spa: SEM_SPA, wMode: "regular", desenho: null }, aA);
perto("com a faixa única ligada, 50,05", plOrcU.metrosLineares, 50.05, 0.001);
const plOrcI = planoMantaDoOrcamento({ pool: { ...PONTA_A, paredeFaixaUnica: true }, poolFmt: "Com prainha", spa: SEM_SPA, wMode: "irregular", desenho: null }, aA);
perto("fora de esquadro a faixa única não vale (manta não vinca)", plOrcI.metrosLineares, 50.25, 0.001);
const legado = planoMantaDoOrcamento({ pool: { length: "6", width: "3.5", depth: "1.4", prainhaComp: "1", prainhaProf: "0.5" }, poolFmt: "Com prainha", spa: SEM_SPA, wMode: "regular", desenho: null }, legP);
const legadoDireto = planoManta({ comp: 6, larg: 3.5, prof: 1.4, perimetro: 19, areaReal: 41.4, praiComp: 1, faces: undefined });
vd("prainha sem degrau continua no plano antigo", legado && !legado.niveis && legadoDireto);

console.log("\n— texto do PDF —");
eq("ponta largura toda", textoPonta(pA), "Ponta em níveis · D1 0,30 × 0,20 m → D2 0,30 × 0,40 m → Prainha 1,50 × 0,60 m → fundo · largura toda");
eq("bloco no canto", textoPonta(pB), "Ponta em níveis · D1 0,30 × 0,20 m → D2 0,30 × 0,40 m → Prainha 1,50 × 0,60 m → fundo · degraus no canto de cima, 1,20 m de largura");
eq("escada lateral", textoBanco(bcC), "Escada lateral · 2 degraus (D1 0,30 × 0,20 m → D2 0,30 × 0,40 m) · 8,00 m de extensão");
eq("banco simples segue com o texto de sempre", textoBanco(bc1), "Banco lateral · 0,45 m de largura × 8,00 m de extensão · assento a 0,40 m da borda (bloco de 1,00 m de altura)");

console.log(`\nniveis.test: ${ok} testes ok${falhas ? `, ${falhas} FALHA(S)` : ""}`);
process.exit(falhas ? 1 : 0);
