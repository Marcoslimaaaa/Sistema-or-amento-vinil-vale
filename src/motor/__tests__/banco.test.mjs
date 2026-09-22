// Banco lateral: leitura dos campos, conta e texto.
// Roda sem navegador: node src/motor/__tests__/banco.test.mjs
import { bancoCfg, ajusteBanco, textoBanco, FORMATOS_COM_BANCO } from "../banco.js";
import { calcA } from "../areas.js";
import { facesComBanco, cortarPeca, planoManta } from "../manta.js";

let ok = 0, falhas = 0;
const eq = (nome, real, esperado) => {
  const passou = JSON.stringify(real) === JSON.stringify(esperado);
  passou ? ok++ : falhas++;
  console.log(`  ${passou ? "ok " : "FALHA"} ${nome}${passou ? "" : `\n       esperado ${JSON.stringify(esperado)}\n       veio     ${JSON.stringify(real)}`}`);
};
const perto = (nome, real, esperado, tol = 0.005) => {
  const passou = Math.abs(real - esperado) <= tol;
  passou ? ok++ : falhas++;
  console.log(`  ${passou ? "ok " : "FALHA"} ${nome}${passou ? ` [${real.toFixed(2)}]` : `\n       esperado ${esperado} ± ${tol}, veio ${real}`}`);
};

const L = 8, W = 4, D = 1.4;
const base = { length: "8", width: "4", depth: "1.40" };

console.log("\n— leitura dos campos —");
eq("sem o interruptor não há banco", bancoCfg({ ...base }, "Retangular", L, W, D), null);
eq("formato sem banco devolve null", bancoCfg({ ...base, bancoOn: true, bancoLarg: "0,45", bancoProf: "0,40" }, "Oval", L, W, D), null);
eq("a lista de formatos é explícita", FORMATOS_COM_BANCO.includes("Oval"), false);

const b = bancoCfg({ ...base, bancoOn: true, bancoLarg: "0,45", bancoProf: "0,40" }, "Retangular", L, W, D);
eq("largura lida com vírgula", b.larg, 0.45);
eq("profundidade lida com vírgula", b.prof, 0.4);
perto("altura do bloco = profundidade da piscina − a do banco", b.altura, 1.0);
eq("lado padrão é em cima (como se vê na planta)", b.lado, "cima");
eq("corre a piscina inteira", b.comprimento, 8);
eq("com medida entra na conta", b.medida, true);
eq("sem aviso quando a medida é sensata", b.aviso, null);

const bd = bancoCfg({ ...base, bancoOn: true, bancoLarg: "0,45", bancoProf: "0,40", bancoLado: "baixo" }, "Retangular", L, W, D);
eq("o outro lado é respeitado", bd.lado, "baixo");
eq("lado invalido cai no padrao", bancoCfg({ ...base, bancoOn: true, bancoLarg: "0,45", bancoProf: "0,40", bancoLado: "banana" }, "Retangular", L, W, D).lado, "cima");

const semMedida = bancoCfg({ ...base, bancoOn: true }, "Retangular", L, W, D);
eq("sem medida o banco é só desenho", semMedida.medida, false);
eq("e não mexe na conta", ajusteBanco(semMedida, { D }), { chao: 0, parede: 0, volume: 0 });

console.log("\n— travas de medida —");
const largo = bancoCfg({ ...base, bancoOn: true, bancoLarg: "3", bancoProf: "0,40" }, "Retangular", L, W, D);
perto("banco largo demais é limitado", largo.larg, 1.8);
eq("e avisa", typeof largo.aviso, "string");
const fundo = bancoCfg({ ...base, bancoOn: true, bancoLarg: "0,45", bancoProf: "1,60" }, "Retangular", L, W, D);
perto("banco mais fundo que a piscina é corrigido", fundo.prof, 1.3);
eq("e avisa também", typeof fundo.aviso, "string");

console.log("\n— a conta —");
const aj = ajusteBanco(b, { D });
eq("chão não muda: o assento devolve o fundo tampado", aj.chao, 0);
perto("parede perde as duas testeiras (2 × 0,45 × 1,00)", aj.parede, -0.9);
perto("volume perde 8,00 × 0,45 × 1,00", aj.volume, -3.6);

// Com prainha: o banco corre só o trecho fundo e encosta numa testeira só.
const comPrainha = bancoCfg(
  { ...base, bancoOn: true, bancoLarg: "0,45", bancoProf: "0,40", prainhaComp: "2", prainhaProf: "0,30" },
  "Com prainha", L, W, D
);
eq("com prainha o banco para no degrau", comPrainha.comprimento, 6);
eq("e sabe que está só no trecho fundo", comPrainha.sobreTrechoFundo, true);
const ajP = ajusteBanco(comPrainha, { D, prainhaProf: 0.3 });
perto("desconta 1 testeira + o pedaço do degrau", ajP.parede, -0.45 - 0.45 * Math.min(1.0, 1.1));
perto("volume só do trecho fundo", ajP.volume, -2.7);

console.log("\n— dentro do calcA —");
const semBanco = calcA(base, { on: false }, "regular", [], "Retangular", [], {}, null);
const comBanco = calcA({ ...base, bancoOn: true, bancoLarg: "0,45", bancoProf: "0,40" }, { on: false }, "regular", [], "Retangular", [], {}, null);
perto("chão igual com e sem banco", parseFloat(comBanco.chaoTot), parseFloat(semBanco.chaoTot));
perto("parede cai 0,90 m²", parseFloat(semBanco.par) - parseFloat(comBanco.par), 0.9);
perto("volume cai 3,60 m³", parseFloat(semBanco.vol) - parseFloat(comBanco.vol), 3.6);
perto("total = chão + parede", parseFloat(comBanco.tot), parseFloat(comBanco.chaoTot) + parseFloat(comBanco.par), 0.02);

// A trava que protege orçamento antigo: sem o campo, nada muda.
const antigo = calcA(base, { on: false }, "regular", [], "Retangular", [], {}, null);
eq("orçamento sem o campo novo calcula igual ao de antes", antigo.tot, semBanco.tot);

console.log("\n— plano de corte da manta armada —");
// GABARITO DITADO PELO MARCOS em 22/09/2026: piscina 6,00 x 4,00 x 1,40 com
// banco de 0,50 de largura e 0,50 de profundidade. As duas testeiras levam os
// 5 cm de cada lado; as tres pecas do comprimento saem RENTES, porque a sobra
// dos cantos ja veio nas testeiras.
const pecas = facesComBanco(6, 4, 1.4, 0.5, 0.5).map((f) => cortarPeca(f));
const medida = (nome) => {
  const p = pecas.find((x) => x.nome === nome);
  return p ? `${p.comp.toFixed(2)} x ${p.altura.toFixed(2)}` : "nao existe";
};
eq("testeira 1 sai 4,10 x 1,50 (com sobra nos cantos)", medida("Testeira 1"), "4.10 x 1.50");
eq("testeira 2 idem", medida("Testeira 2"), "4.10 x 1.50");
eq("lateral em frente ao banco sai 6,00 x 1,50, rente", medida("Lateral (em frente ao banco)"), "6.00 x 1.50");
eq("espelho do banco sai 6,00 x 1,00", medida("Espelho do banco"), "6.00 x 1.00");
eq("testeira do banco sai 6,00 x 0,60", medida("Testeira do banco"), "6.00 x 0.60");
eq("sao 5 pecas de parede", pecas.length, 5);
perto("26,20 m lineares de parede", pecas.reduce((a2, p) => a2 + p.metrosLineares, 0), 26.2, 0.01);

const t1 = pecas.find((p) => p.nome === "Testeira 1");
eq("a testeira carrega o recorte do banco", [t1.recorte.larg, t1.recorte.alt], [0.5, 0.9]);
eq("a lateral do banco deixa de sair de altura cheia", pecas.some((p) => p.nome === "Lateral 1"), false);

// O chao nao muda: o degrau corre PARALELO as faixas, entao as mesmas 3 pecas
// forram o fundo e o topo do assento. E o contrario da prainha.
const plano = planoManta({ comp: 6, larg: 4, prof: 1.4, perimetro: 20, areaReal: 52, faces: facesComBanco(6, 4, 1.4, 0.5, 0.5) });
eq("o chao sai em 3 faixas de 6 m", [plano.chao.partes[0].faixas, plano.chao.partes[0].compFaixa], [3, 6.02]);
eq("uma regiao de chao so", plano.chao.partes.length, 1);
perto("18,06 m lineares de chao", plano.chao.metrosLineares, 18.06, 0.01);
perto("44,26 m lineares no total", plano.metrosLineares, 44.26, 0.02);
eq("2 bobinas", plano.pedido.qtd, 2);

const semB = planoManta({ comp: 6, larg: 4, prof: 1.4, perimetro: 20, areaReal: 52,
  faces: [{ nome: "Lateral 1", comp: 6, prof: 1.4 }, { nome: "Lateral 2", comp: 6, prof: 1.4 },
          { nome: "Testeira 1", comp: 4, prof: 1.4 }, { nome: "Testeira 2", comp: 4, prof: 1.4 }] });
eq("piscina lisa segue com 4 pecas de parede", semB.paredes.qtdPecas, 4);
perto("e 20,40 m lineares de parede, como antes", semB.paredes.metrosLineares, 20.4, 0.01);

console.log("\n— texto do PDF —");
eq("sem medida não escreve linha", textoBanco(semMedida), null);
eq("com medida descreve o banco",
  textoBanco(b),
  "Banco lateral · 0,45 m de largura × 8,00 m de extensão · assento a 0,40 m da borda (bloco de 1,00 m de altura)");

console.log(`\nbanco.test: ${ok} testes ok${falhas ? `, ${falhas} FALHA(S)` : ""}`);
process.exit(falhas ? 1 : 0);
