// Preço do orçamento — a conta única do editor e do PDF.
// node src/motor/__tests__/orcamento.test.mjs
import { planoMantaDoOrcamento, quantidadeEfetiva, totalDoOrcamento, condicoesPagamento, spaDaManta, totalDeHoje, precoMudou, resumoMedidas, medidasParaEstoque } from "../orcamento.js";
import { calcA } from "../areas.js";
import { areaCobravelDe } from "../manta.js";

let ok = 0, falhas = 0;
const eq = (n, r, e) => { const p = JSON.stringify(r) === JSON.stringify(e); p ? ok++ : falhas++;
  console.log(`  ${p ? "ok " : "FALHA"} ${n}${p ? "" : `\n       esperado ${JSON.stringify(e)}\n       veio     ${JSON.stringify(r)}`}`); };
const vd = (n, c) => eq(n, !!c, true);
const perto = (n, r, e, tol = 0.01) => { const p = Math.abs(r - e) <= tol; p ? ok++ : falhas++;
  console.log(`  ${p ? "ok " : "FALHA"} ${n}${p ? ` [${Number(r).toFixed(2)}]` : `\n       esperado ${e} ± ${tol}, veio ${r}`}`); };

const SPA_OFF = { on: false };

console.log("\n— total: o que sempre foi —");
const ar6 = calcA({ length: "6", width: "3", depth: "1.40" }, SPA_OFF, "regular", [], "Retangular", [], {}, null);
const itens = [
  { id: 1, n: "Vinil", c: 55, m: 30, on: true, un: "m²" },
  { id: 3, n: "Perfil", c: 20, m: 0, on: true, un: "ml" },
  { id: 4, n: "Filtro", q: 2, c: 100, m: 10, on: true, un: "un" },
  { id: 5, n: "Desligado", q: 9, c: 999, m: 0, on: false, un: "un" },
];
const t1 = totalDoOrcamento({ items: itens, ar: ar6, manta: null, mo: "", totOv: "" });
perto("custo = área×55 + perímetro×20 + 2×100", t1.custo, 43.2 * 55 + 18 * 20 + 200);
perto("venda aplica a margem de cada item", t1.venda, 43.2 * 55 * 1.3 + 18 * 20 + 220);
eq("item desligado não entra", t1.total, t1.calculado);
const t2 = totalDoOrcamento({ items: itens, ar: ar6, manta: null, mo: "3.500,00", totOv: "" });
perto("mão de obra no padrão BR soma 3.500", t2.total - t1.total, 3500);
const t3 = totalDoOrcamento({ items: itens, ar: ar6, manta: null, mo: "3500", totOv: "18734.486" });
eq("valor final gravado como número de JS manda (não vira 18 milhões)", t3.total, 18734.486);
const t4 = totalDoOrcamento({ items: itens, ar: ar6, manta: null, mo: "", totOv: "12.500,00" });
eq("valor final digitado no padrão BR manda", t4.total, 12500);

console.log("\n— quantidade por unidade —");
const mantaFake = { areaCobravel: 70, chao: { metrosLineares: 10 }, solda: { total: 33 } };
eq("m² sem manta = área da piscina", quantidadeEfetiva({ un: "m²" }, ar6, null), 43.2);
eq("m² com manta = manta cortada", quantidadeEfetiva({ un: "m²" }, ar6, mantaFake), 70);
eq("chão com manta = faixas × 1,55", quantidadeEfetiva({ un: "chao" }, ar6, mantaFake), 15.5);
eq("solda só existe com manta", quantidadeEfetiva({ un: "solda" }, ar6, null), 0);
eq("un = a quantidade digitada", quantidadeEfetiva({ un: "un", q: 4 }, ar6, null), 4);

console.log("\n— manta armada: o aproveitamento da tira —");
// Caso medido em 24/09: 6,00 × 3,10 × 1,40 com prainha de 1,00 a 0,40.
const poolP = { length: "6", width: "3.1", depth: "1.40", prainhaComp: "1.00", prainhaProf: "0.40" };
const arP = calcA(poolP, SPA_OFF, "regular", [], "Com prainha", [], {}, null);
const semAprov = planoMantaDoOrcamento({ pool: poolP, poolFmt: "Com prainha", spa: SPA_OFF, wMode: "regular", desenho: null }, arP);
const comAprov = planoMantaDoOrcamento({ pool: poolP, poolFmt: "Com prainha", spa: SPA_OFF, wMode: "regular", desenho: null }, arP, { aproveitarSobra: true });
eq("sem aproveitar: 61,92 m² cortados", semAprov.areaCobravel, 61.92);
eq("aproveitando a tira: 57,09 m²", comAprov.areaCobravel, 57.09);
eq("o padrão é NÃO aproveitar", planoMantaDoOrcamento({ pool: poolP, poolFmt: "Com prainha", spa: SPA_OFF }, arP).areaCobravel, 61.92);
eq("sem medida não há plano", planoMantaDoOrcamento({ pool: {}, poolFmt: "Retangular", spa: SPA_OFF }, ar6), null);

console.log("\n— spa no plano de corte —");
eq("spa desligado não entra", spaDaManta({ on: false }, 6, 3, 1.4), { anexos: [], facesExtra: [] });
eq("tanque separado leva a divisória como parede", spaDaManta({ on: true, length: "2", width: "1.5", depth: "0.8", side: "top" }, 6, 3, 1.4).facesExtra.length, 1);
eq("mesmo tanque não tem divisória", spaDaManta({ on: true, integrado: true, length: "2", width: "1.5", depth: "0.8", side: "top" }, 6, 3, 1.4).facesExtra.length, 0);

console.log("\n— condições de pagamento —");
const c1 = condicoesPagamento(10000, { pixD: 5, entPct: 50, balPct: 50, noFee: 5, btcD: 15 });
eq("pix com 5%", c1.pix, 9500);
eq("entrada 50%", c1.ent, 5000);
eq("5x sem juros", c1.inst, 2000);
// O caso real da base: entrada 0% + saldo 100%. O PDF fazia `|| 50` e
// mostrava entrada de 50% — as duas parcelas somavam 150% do total.
const c0 = condicoesPagamento(5555.1, { pixD: 10, entPct: 0, balPct: 100, noFee: 10, btcD: 15 });
eq("entrada 0% é zero, não 50%", c0.ent, 0);
eq("saldo 100% é o total", c0.bal, 5555.1);
eq("entrada + saldo = total", c0.ent + c0.bal, 5555.1);
const cv = condicoesPagamento(1000, undefined);
eq("sem condições: entrada padrão de 50%", cv.ent, 500);
eq("sem parcelas não divide por zero", condicoesPagamento(1000, { noFee: 0 }).inst, 1000);

console.log("\n— preço que mudou desde que foi salvo —");
const dSalvo = { pool: { length: "6", width: "3", depth: "1.40" }, poolFmt: "Retangular", items: itens, mo: "", totOv: "" };
const hoje = totalDeHoje(dSalvo, false);
perto("totalDeHoje = a mesma conta do editor", hoje, t1.total);
eq("salvo pelo mesmo valor: nada a avisar", precoMudou({ tot: String(hoje), data: dSalvo }, false), null);
eq("diferença de centavos não é aviso", precoMudou({ tot: String(hoje + 0.4), data: dSalvo }, false), null);
const mudou = precoMudou({ tot: "3000", data: dSalvo }, false);
eq("salvo por outro valor: avisa com os dois números", [mudou.salvo, Math.round(mudou.agora * 100) / 100], [3000, Math.round(hoje * 100) / 100]);
eq("registro manual (sem cálculo) não avisa", precoMudou({ tot: "10590", manual: true, data: { items: [] } }, false), null);
eq("sem tot gravado não avisa", precoMudou({ data: dSalvo }, false), null);
// Com valor final digitado o total não depende do motor: não há o que mudar.
eq("valor final gravado segura o preço", precoMudou({ tot: "18734.486", data: { ...dSalvo, totOv: "18734.486" } }, false), null);
// Manta armada: a regra de cobrança mudou (manta cortada, não superfície).
const dManta = { ...dSalvo, vinilT: "1,5mm", items: [{ id: 1, c: 100, m: 0, on: true, un: "m²" }] };
const mManta = precoMudou({ tot: "4320", data: dManta }, true); // 43,2 m² de superfície × 100
eq("manta salva pela superfície: avisa que hoje sai pela manta cortada", mManta !== null && mManta.agora > mManta.salvo, true);

console.log("\n— manta armada com medida que não fecha —");
// Na manta o preço sai do PLANO de corte. Se o plano existisse com a área
// inválida, o total da manta não zeraria junto.
const poolRedBanco = { length: "10.00", width: "4.00", depth: "1.00", diametro: "4", bancoOn: true, bancoLarg: "0.50", bancoProf: "1.20" };
const arRedBanco = calcA(poolRedBanco, SPA_OFF, "regular", [], "Circular", [], {}, null);
eq("área inválida (assento no fundo)", typeof arRedBanco.invalido, "string");
eq("então também não há plano de corte", planoMantaDoOrcamento({ pool: poolRedBanco, poolFmt: "Circular", spa: SPA_OFF }, arRedBanco), null);
const poolRedOk = { ...poolRedBanco, bancoProf: "0.50" };
eq("com o banco certo o plano volta", planoMantaDoOrcamento({ pool: poolRedOk, poolFmt: "Circular", spa: SPA_OFF }, calcA(poolRedOk, SPA_OFF, "regular", [], "Circular", [], {}, null)) !== null, true);

console.log("\n— baixa de estoque: a mesma área do orçamento —");
// O caso real: só raso e fundo preenchidos, profundidade vazia. A conta antiga
// (C × L × profundidade) zerava as paredes: sugeria ~50 m² antes dos 10%.
const soRasoFundo = { pool: { length: "10.00", width: "5.00", depth: "", depthMin: "1.00", depthMax: "1.90" }, poolFmt: "Retangular" };
const eRF = medidasParaEstoque(soRasoFundo);
perto("raso/fundo: 93,7 m² de vinil, não 50", eRF.areaTotal, 93.7, 0.06);
eq("e há o que sugerir", eRF.semMedida, null);
perto("redonda Ø4 × 1,40 pelo diâmetro (30,2 m²), não pelo 10 × 4 escondido (79,2)", medidasParaEstoque({ pool: { length: "10.00", width: "4.00", depth: "1.40", diametro: "4" }, poolFmt: "Circular" }).areaTotal, 30.2, 0.06);
eq("redonda sem diâmetro: pede conferência", medidasParaEstoque({ pool: { length: "10.00", width: "4.00", depth: "1.00", diametro: "" }, poolFmt: "Circular" }).semMedida, "Falta o DIÂMETRO da piscina redonda");
eq("registro manual (piscina zerada): pede conferência", medidasParaEstoque({ pool: { length: 0, width: 0, depth: 0 }, items: [] }).semMedida, "Orçamento sem medida da piscina");

console.log("\n— medidas no resumo (lista, WhatsApp, PDF simples) —");
const EDITOR = { length: "10.00", width: "4.00", depth: "1.40", triA: "4.10", triB: "3.10", triC: "2.80", diametro: "4" };
eq("retangular continua como sempre foi", resumoMedidas("Retangular", EDITOR), "10.00x4.00x1.40");
eq("triangular continua pelos três lados", resumoMedidas("Triangular", EDITOR), "4.10/3.10/2.80x1.40");
eq("circular sai pelo diâmetro, não pelo 10x4 escondido", resumoMedidas("Circular", EDITOR), "Ø4x1.40");
eq("separador do PDF", resumoMedidas("Circular", EDITOR, "×"), "Ø4×1.40");

console.log("\n— manta com fundo inclinado e faixinha (achado 4.2b, 26/10/2026) —");
// O Marcos: a parede sai pela altura que ela tem; acima da bobina, a faixinha
// corre a parede INTEIRA e se cobra só a largura dela × o comprimento todo.
const plano = (pool, fmt = "Retangular") => {
  const ar = calcA(pool, SPA_OFF, "regular", [], fmt, [], {}, null);
  return planoMantaDoOrcamento({ pool, poolFmt: fmt, spa: SPA_OFF, wMode: "regular", desenho: null }, ar);
};
const peca = (pl, nome) => { const p = pl.paredes.pecas.find((x) => x.nome === nome);
  return p ? [p.comp, p.altura, ...(p.complementos || []).map((c) => [c.comp, c.largura])] : "nao existe"; };
const RAMPA = { length: "8", width: "4", depth: "", depthMin: "1.00", depthMax: "1.80" };
const pR = plano(RAMPA);
eq("testeira rasa na altura do raso: 4,10 × 1,10", peca(pR, "Testeira rasa"), [4.1, 1.1]);
eq("testeira funda 4,10 × 1,90: bobina de 1,55 + faixinha de 0,40", peca(pR, "Testeira funda"), [4.1, 1.9, [4.1, 0.4]]);
eq("lateral na altura funda, faixinha na peça INTEIRA (8,10)", peca(pR, "Lateral 1"), [8.1, 1.9, [8.1, 0.4]]);
eq("e a lateral sabe que é recortada na rampa", pR.paredes.pecas.find((x) => x.nome === "Lateral 1").rampa, { de: 1, ate: 1.8 });
perto("metros lineares: 24,40 de parede + 8,10 de faixinhas + 3 × 8,02 de chão", pR.metrosLineares, 56.56);
// À MÃO: (56,56 − 8,10 da passada de faixinhas) × 1,55 = 75,113; faixinhas
// 0,40 × (8,10 + 8,10 + 4,10) = 8,12 → 83,23. Pela média dava 48,46 m / 75,11 m².
perto("cobra 75,11 de peça cheia + 8,12 de faixinha = 83,23 m²", pR.areaCobravel, 83.23);
eq("3 bobinas", pR.pedido.qtd, 3);
eq("o exemplo dele: faixa de 16 m (6 + 4 + 6) × 0,40 = 6,40 m², não 16 × 1,55", areaCobravelDe(0, [{ largura: 0.4, comp: 16 }]), 6.4);
const p160 = plano({ length: "8", width: "4", depth: "1.60" });
// constante 1,60: 4 faixinhas de 0,20 numa passada de 8,10. Antes a passada
// inteira era cobrada: 56,56 × 1,55 = 87,67 m².
perto("1,60 constante: 75,11 + 0,20 × 24,40 = 79,99 m²", p160.areaCobravel, 79.99);
eq("1,40 constante não muda nada (48,46 m · 75,11 m²)", (({ metrosLineares, areaCobravel }) => [metrosLineares, areaCobravel])(plano({ length: "8", width: "4", depth: "1.40" })), [48.46, 75.11]);
const pRP = plano({ ...RAMPA, prainhaComp: "1,50", prainhaProf: "0,60" }, "Com prainha");
eq("prainha + rampa: espelho da prainha no raso (1,00 − 0,60 + 0,10)", peca(pRP, "Espelho da prainha"), [4.1, 0.5]);
eq("prainha + rampa: testeira funda 1,90 com faixinha", peca(pRP, "Testeira funda"), [4.1, 1.9, [4.1, 0.4]]);
const pRD = plano({ ...RAMPA, prainhaComp: "1,50", prainhaProf: "0,60",
  degraus: [{ avanco: "0,30", prof: "0,20" }, { avanco: "0,30", prof: "0,40" }] }, "Com prainha");
eq("degraus + rampa: espelho prainha → fundo no raso", peca(pRD, "Espelho Prainha → fundo"), [4.1, 0.5]);
eq("degraus + rampa: lateral 1,90 com faixinha inteira", peca(pRD, "Lateral 1"), [8.1, 1.9, [8.1, 0.4]]);
const pBR = plano({ ...RAMPA, bancoOn: true, bancoLarg: "0,45", bancoProf: "0,40" });
eq("banco + rampa: testeira rasa recortada no raso", pBR.paredes.pecas.find((x) => x.nome === "Testeira rasa").recorte, { larg: 0.45, alt: 0.6 });
eq("banco + rampa: espelho do banco na altura funda (1,80 − 0,40)", peca(pBR, "Espelho do banco"), [8, 1.5]);
const pC = plano({ length: "4", width: "4", depth: "1.60", diametro: "4" }, "Circular");
// antes de 26/10 a redonda funda nem contava a faixinha: a passada dela não existia
eq("redonda Ø4 × 1,60: a faixinha da tira entra no pedido", pC.passadas.filter((x) => x.faixinhas).length, 1);
perto("e cobra só 0,20 × 12,62", pC.areaCobravel - (pC.metrosLineares - 12.62) * 1.55, 0.2 * 12.62, 0.02);

console.log("\n— outra bobina (catálogo da Corte da Manta) —");
{
  const ar = calcA(RAMPA, SPA_OFF, "regular", [], "Retangular", [], {}, null);
  const comBobina = (largura, comprimento) => planoMantaDoOrcamento({ pool: RAMPA, poolFmt: "Retangular", spa: SPA_OFF, wMode: "regular", desenho: null }, ar, { bobina: { largura, comprimento } });
  const larga = comBobina(2.05, 25);
  eq("Alkorplan extra largo 2,05: a parede de 1,90 cabe sem faixinha", peca(larga, "Testeira funda"), [4.1, 1.9]);
  eq("e o chão de 4,00 sai em 2 faixas", larga.chao.partes[0].faixas, 2);
  perto("cobra os 40,44 m × 2,05", larga.areaCobravel, 40.44 * 2.05);
  eq("Sansuy 1,40 × 60: faixinha de 0,55 (1,90 − 1,40 + 5 de solda)", peca(comBobina(1.4, 60), "Testeira funda"), [4.1, 1.9, [4.1, 0.55]]);
  eq("sem bobina escolhida segue a 1,55 × 25 (83,23)", plano(RAMPA).areaCobravel, 83.23);
}
{
  // desenho livre: trocar o chão pelo do contorno não pode apagar o desconto
  // da faixinha (antes recalculava tudo × 1,55). A piscina do Gilberto em
  // manta: 117,09 → 104,83 m².
  const V = [[0, 0], [10, 0], [10, 3], [6.3, 3], [6.3, 5], [2.3, 5], [2.3, 3], [1.3, 3], [0, 1.7]].map(([x, y]) => ({ x, y: 5 - y }));
  const des = { vertices: V, formas: [{ id: "p1", tipo: "prainha", operacao: "uniao", cxM: 4.3, cyM: 1, larguraM: 4, comprimentoM: 2, profundidadeM: 0.6 }] };
  const pg = { length: "10", width: "5", depth: "", depthMin: "1.2", depthMax: "1.6" };
  const ag = calcA(pg, SPA_OFF, "regular", [], "Personalizado", [], {}, des);
  const pd = planoMantaDoOrcamento({ pool: pg, poolFmt: "Personalizado", spa: SPA_OFF, wMode: "regular", desenho: des }, ag);
  const tiras = pd.paredes.complementos.passadas.flatMap((x) => x.itens).reduce((s, f) => s + f.largura * f.comp, 0);
  perto("desenho: cobra peça cheia × 1,55 + faixinha na largura dela", pd.areaCobravel, (pd.metrosLineares - pd.paredes.complementos.metrosLineares) * 1.55 + tiras);
}

console.log("\n— anexos externos (os da Corte da Manta) —");
{
  const pool = { length: "8", width: "4", depth: "1.40" };
  const ar = calcA(pool, SPA_OFF, "regular", [], "Retangular", [], {}, null);
  const base = planoMantaDoOrcamento({ pool, poolFmt: "Retangular", spa: SPA_OFF, wMode: "regular", desenho: null }, ar);
  const lado = planoMantaDoOrcamento({ pool, poolFmt: "Retangular", spa: SPA_OFF, wMode: "regular", desenho: null }, ar,
    { anexos: [{ nome: "Prainha externa", comp: 2, larg: 2, prof: 0.5, encaixe: "lado" }] });
  eq("anexo de lado entra com piso e 3 paredes", [lado.anexos.length, lado.anexos[0].paredes.qtdPecas], [1, 3]);
  vd("e soma manta", lado.metrosLineares > base.metrosLineares);
  const canto = planoMantaDoOrcamento({ pool, poolFmt: "Retangular", spa: SPA_OFF, wMode: "regular", desenho: null }, ar,
    { anexos: [{ nome: "Spa", forma: "redondo", diametro: 2, prof: 0.8, encaixe: "canto" }] });
  eq("redondo no canto: cinta curva numa peça", canto.anexos[0].paredes.qtdPecas, 1);
  const pD = { ...pool, prainhaComp: "1,50", prainhaProf: "0,60", degraus: [{ avanco: "0,30", prof: "0,20" }] };
  const arD = calcA(pD, SPA_OFF, "regular", [], "Com prainha", [], {}, null);
  const comDegrau = planoMantaDoOrcamento({ pool: pD, poolFmt: "Com prainha", spa: SPA_OFF, wMode: "regular", desenho: null }, arD,
    { anexos: [{ nome: "Spa", forma: "redondo", diametro: 2, prof: 0.8, encaixe: "canto" }] });
  eq("com degraus, o anexo de canto também usa o modelo de canto", comDegrau.anexos[0].forma, "redondo");
}

console.log(`\norcamento.test: ${ok} testes ok${falhas ? `, ${falhas} FALHA(S)` : ""}`);
process.exit(falhas ? 1 : 0);
