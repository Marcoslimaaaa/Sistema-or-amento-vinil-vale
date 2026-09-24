// Preço do orçamento — a conta única do editor e do PDF.
// node src/motor/__tests__/orcamento.test.mjs
import { planoMantaDoOrcamento, quantidadeEfetiva, totalDoOrcamento, condicoesPagamento, spaDaManta, totalDeHoje, precoMudou, resumoMedidas } from "../orcamento.js";
import { calcA } from "../areas.js";

let ok = 0, falhas = 0;
const eq = (n, r, e) => { const p = JSON.stringify(r) === JSON.stringify(e); p ? ok++ : falhas++;
  console.log(`  ${p ? "ok " : "FALHA"} ${n}${p ? "" : `\n       esperado ${JSON.stringify(e)}\n       veio     ${JSON.stringify(r)}`}`); };
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

console.log("\n— medidas no resumo (lista, WhatsApp, PDF simples) —");
const EDITOR = { length: "10.00", width: "4.00", depth: "1.40", triA: "4.10", triB: "3.10", triC: "2.80", diametro: "4" };
eq("retangular continua como sempre foi", resumoMedidas("Retangular", EDITOR), "10.00x4.00x1.40");
eq("triangular continua pelos três lados", resumoMedidas("Triangular", EDITOR), "4.10/3.10/2.80x1.40");
eq("circular sai pelo diâmetro, não pelo 10x4 escondido", resumoMedidas("Circular", EDITOR), "Ø4x1.40");
eq("separador do PDF", resumoMedidas("Circular", EDITOR, "×"), "Ø4×1.40");

console.log(`\norcamento.test: ${ok} testes ok${falhas ? `, ${falhas} FALHA(S)` : ""}`);
process.exit(falhas ? 1 : 0);
