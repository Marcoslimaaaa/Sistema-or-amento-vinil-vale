// Hidro/piscina triangular com banco nos três lados.
// Roda sem navegador: node src/motor/__tests__/triangular.test.mjs
//
// O gabarito é a obra real de 22/09/2026 (lados 4,10 / 3,10 / 2,80, 1,00 de
// profundidade, banco de 0,50 de largura e 0,50 da borda até o assento),
// conferida com o Marcos peça por peça.
import { trianguloValido, verticesTriangulo, geometriaTriangular, planoTriangular } from "../triangular.js";
import { calcA } from "../areas.js";

let ok = 0, falhas = 0;
const eq = (nome, real, esperado) => {
  const passou = JSON.stringify(real) === JSON.stringify(esperado);
  passou ? ok++ : falhas++;
  console.log(`  ${passou ? "ok " : "FALHA"} ${nome}${passou ? "" : `\n       esperado ${JSON.stringify(esperado)}\n       veio     ${JSON.stringify(real)}`}`);
};
const perto = (nome, real, esperado, tol = 0.02) => {
  const passou = Math.abs(real - esperado) <= tol;
  passou ? ok++ : falhas++;
  console.log(`  ${passou ? "ok " : "FALHA"} ${nome}${passou ? ` [${real}]` : `\n       esperado ${esperado} ± ${tol}, veio ${real}`}`);
};

const OBRA = { a: 4.10, b: 3.10, c: 2.80, prof: 1.00, banco: { larg: 0.50, prof: 0.50 } };

console.log("\n— o triângulo fecha? —");
eq("os lados da obra fecham", trianguloValido(4.10, 3.10, 2.80), true);
eq("2 + 3 não fecha com 9", trianguloValido(2, 3, 9), false);
eq("lado zero não fecha", trianguloValido(0, 3, 4), false);
eq("triângulo inválido devolve null", verticesTriangulo(2, 3, 9), null);
eq("o lado a fica na base", verticesTriangulo(4.10, 3.10, 2.80).slice(0, 2), [{ x: 0, y: 0 }, { x: 4.10, y: 0 }]);

console.log("\n— geometria da obra —");
const g = geometriaTriangular(OBRA);
perto("lâmina d'água 4,34 m²", g.areas.lamina, 4.34);
perto("piso do fundo 0,78 m²", g.areas.fundo, 0.78);
perto("topo do assento 3,56 m²", g.areas.assento, 3.56);
perto("espelho do banco 2,12 m²", g.areas.espelho, 2.12);
perto("costas do banco 5,00 m²", g.areas.costas, 5.00);
perto("SUPERFÍCIE TOTAL 11,45 m²", g.areas.total, 11.45);
perto("volume de água 2,56 m³", g.volume, 2.56);
perto("perímetro externo 10,00 m", g.perimetro, 10.00);
// O achado que mais pesa: o pé do banco é MUITO menor que a parede.
eq("pé do banco: 1,74 / 1,31 / 1,19", g.internos, [1.74, 1.31, 1.19]);
perto("altura do espelho = 1,00 − 0,50", g.alturaEspelho, 0.50);

console.log("\n— o que não pode passar —");
eq("lados que não fecham viram erro", planoTriangular({ a: 2, b: 3, c: 9, prof: 1 }).erro,
  "Os três lados não fecham um triângulo.");
// 22/09/2026: com recuo maior que o raio inscrito, o offsetPoligono devolve um
// triângulo FANTASMA de 0,64 m². Por isso a trava é o raio inscrito, e não o
// resultado do offset.
const apertado = geometriaTriangular({ ...OBRA, banco: { larg: 1.2, prof: 0.5 } });
eq("banco largo demais vira erro, não piso fantasma", typeof apertado.erro, "string");
eq("e o erro diz até onde o banco cabe", /0,86/.test(apertado.erro), true);
perto("banco máximo desta hidro: 0,86 m", geometriaTriangular(OBRA).bancoMaximo, 0.86);
eq("no limite exato também barra", typeof geometriaTriangular({ ...OBRA, banco: { larg: 0.87, prof: 0.5 } }).erro, "string");
const semBanco = geometriaTriangular({ a: 4.10, b: 3.10, c: 2.80, prof: 1.00 });
perto("sem banco, o piso é a lâmina inteira", semBanco.areas.fundo, 4.34);
perto("e a parede é o perímetro × profundidade", semBanco.areas.parede, 10.00);

console.log("\n— plano de corte —");
const p = planoTriangular(OBRA);
const peca = (n) => {
  const x = p.paredes.pecas.find((q) => q.nome === n);
  return x ? `${x.comp.toFixed(2)} x ${x.altura.toFixed(2)}` : "nao existe";
};
eq("costas do banco 1 sai 4,20 × 0,60", peca("Costas do banco 1"), "4.20 x 0.60");
eq("costas do banco 2 sai 3,20 × 0,60", peca("Costas do banco 2"), "3.20 x 0.60");
eq("costas do banco 3 sai 2,90 × 0,60", peca("Costas do banco 3"), "2.90 x 0.60");
eq("espelho 1 sai 1,84 × 0,60", peca("Espelho do banco 1"), "1.84 x 0.60");
eq("espelho 2 sai 1,41 × 0,60", peca("Espelho do banco 2"), "1.41 x 0.60");
eq("espelho 3 sai 1,29 × 0,60", peca("Espelho do banco 3"), "1.29 x 0.60");
eq("6 peças de parede", p.paredes.qtdPecas, 6);
eq("4 tiras de chão (3 assentos + o fundo)", p.chao.partes.length, 4);

// A REGRA DO MARCOS: costas e espelho do MESMO lado na mesma passada.
eq("passada 1 leva costas 1 + espelho 1", p.passadas[0].pecas, ["Costas do banco 1", "Espelho do banco 1"]);
eq("passada 2 leva costas 2 + espelho 2", p.passadas[1].pecas, ["Costas do banco 2", "Espelho do banco 2"]);
eq("passada 3 leva costas 3 + espelho 3", p.passadas[2].pecas, ["Costas do banco 3", "Espelho do banco 3"]);
eq("5 passadas no total", p.passadas.length, 5);
perto("cada passada mede o maior dos dois (4,20)", p.passadas[0].comp, 4.20);

perto("17,22 m lineares ninhado", p.metrosLineares, 17.22, 0.05);
perto("26,61 m se cortasse cada peça sozinha", p.metrosSemNinhar, 26.61, 0.05);
eq("UMA bobina de 25 m", p.pedido.qtd, 1);
// Sem ninhar a conta pediria 2 bobinas: é o erro que a regra evita.
eq("sem ninhar passaria de uma bobina", p.metrosSemNinhar > 25, true);
perto("manta cobrável 26,7 m²", p.areaCobravel, 17.22 * 1.55, 0.1);
perto("área útil = superfície real", p.areaUtil, 11.45);

console.log("\n— dentro do orçamento (calcA) —");
const poolTri = { triA: "4,10", triB: "3,10", triC: "2,80", depth: "1,00", bancoOn: true, bancoLarg: "0,50", bancoProf: "0,50" };
const ar = calcA(poolTri, { on: false }, "regular", [], "Triangular", [], {}, null);
perto("area total 11,5 m2", parseFloat(ar.tot), 11.5, 0.06);
perto("chao (fundo + assento) 4,3 m2", parseFloat(ar.chao), 4.34, 0.06);
perto("paredes (espelho + costas) 7,1 m2", parseFloat(ar.par), 7.12, 0.06);
perto("volume 2,6 m3", parseFloat(ar.vol), 2.56, 0.06);
perto("perimetro 10,0 m", parseFloat(ar.perim), 10.0, 0.06);
eq("o orcamento enxerga a geometria", !!ar.triangular, true);

const arSem = calcA({ ...poolTri, bancoOn: false }, { on: false }, "regular", [], "Triangular", [], {}, null);
perto("sem banco: chao = lamina inteira", parseFloat(arSem.chao), 4.34, 0.06);
perto("sem banco: parede = perimetro x profundidade", parseFloat(arSem.par), 10.0, 0.06);
perto("sem banco: volume cheio", parseFloat(arSem.vol), 4.34, 0.06);

// Medida impossivel NAO pode virar orcamento com area fantasma.
const arRuim = calcA({ ...poolTri, triC: "0,20" }, { on: false }, "regular", [], "Triangular", [], {}, null);
eq("lados impossiveis nao viram area de triangulo", arRuim.triangular === undefined, true);

console.log(`\ntriangular.test: ${ok} testes ok${falhas ? `, ${falhas} FALHA(S)` : ""}`);
process.exit(falhas ? 1 : 0);
