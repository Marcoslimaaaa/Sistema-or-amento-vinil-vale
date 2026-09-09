// Testes da geometria do spa: contorno de roteamento, trava de arrasto e bicos.
// Nasceram do bug de 2026-09: o tubo atravessava o spa e o bico não saía da piscina.
import assert from "node:assert";
import { areaPoligono, pontoDentro } from "../formas.js";
import { retanguloPoli, circuloPoli, contornoComSpa, pontoNoContorno, caixaSpaNorm, bicosSpaNorm } from "../spa.js";

let n = 0;
const t = (nome, fn) => { fn(); n++; console.log("  ok  " + nome); };
const perto = (a, b, tol = 1e-6) => Math.abs(a - b) <= tol;

// piscina 6x3 (em "metros" para o teste; o app usa pixel, mesma conta)
const piscina = [{x:0,y:0},{x:6,y:0},{x:6,y:3},{x:0,y:3}];

t("contorno sem spa continua sendo o da piscina", () => {
  assert.strictEqual(contornoComSpa(piscina, []), piscina);
});

t("spa colado no lado de cima entra no contorno como um polígono só", () => {
  const spa = retanguloPoli({ x: 2, y: -2, w: 2, h: 2 });
  const c = contornoComSpa(piscina, [spa]);
  assert.ok(perto(areaPoligono(c), 18 + 4, 1e-6), "área = piscina + spa: " + areaPoligono(c));
  assert.ok(pontoDentro({ x: 3, y: -1 }, c), "o miolo do spa tem de ficar DENTRO do contorno");
  assert.ok(!pontoDentro({ x: 0.5, y: -1 }, c), "fora do spa segue fora");
});

t("spa de canto redondo também entra", () => {
  const c = contornoComSpa(piscina, [circuloPoli(0, 0, 1)]);
  assert.ok(areaPoligono(c) > 18, "o quarto de círculo de fora soma área");
  assert.ok(pontoDentro({ x: -0.4, y: -0.4 }, c));
});

t("união quebrada não derruba a tela — volta o contorno da piscina", () => {
  assert.strictEqual(contornoComSpa(piscina, [[{x:0,y:0}]]), piscina); // polígono degenerado
  assert.strictEqual(contornoComSpa(piscina, [null]), piscina);
});

t("arrasto: ponto dentro passa; ponto fora gruda na parede", () => {
  const centro = { x: 3, y: 1.5 };
  const dentro = pontoNoContorno({ x: 5, y: 1 }, piscina, centro);
  assert.deepStrictEqual(dentro, { x: 5, y: 1 });
  const fora = pontoNoContorno({ x: 9, y: 1.5 }, piscina, centro);
  assert.ok(fora.x < 6 && fora.x > 5.9, "gruda na parede direita: " + fora.x);
  assert.ok(pontoDentro(fora, piscina));
});

t("arrasto: com o spa no contorno, o bico CHEGA no spa (era o bug)", () => {
  const c = contornoComSpa(piscina, [retanguloPoli({ x: 2, y: -2, w: 2, h: 2 })]);
  const alvo = { x: 3, y: -1.5 };
  assert.ok(!pontoDentro(alvo, piscina), "no contorno antigo o ponto era inalcançável");
  assert.deepStrictEqual(pontoNoContorno(alvo, c, { x: 3, y: 1.5 }), alvo);
});

t("caixa do spa em coordenadas normalizadas, por lado", () => {
  const spa = { on: true, length: "2.00", width: "1.50", depth: "0.80", side: "top" };
  const cima = caixaSpaNorm(6, 3, spa, null);
  assert.ok(perto(cima.du, 2 / 6) && perto(cima.dv, 1.5 / 3));
  assert.ok(perto(cima.v0, -1.5 / 3), "spa de cima fica com v negativo: " + cima.v0);
  assert.strictEqual(cima.prof, 0.8);
  const dir = caixaSpaNorm(6, 3, { ...spa, side: "right" }, null);
  assert.ok(perto(dir.u0, 1), "spa da direita começa na parede da piscina");
  assert.ok(perto(dir.du, 1.5 / 6) && perto(dir.dv, 2 / 3));
  assert.strictEqual(caixaSpaNorm(6, 3, { ...spa, on: false }, null), null);
});

t("posição arrastada do spa manda mais que a do formulário", () => {
  const spa = { on: true, length: "2.00", width: "1.50", side: "top" };
  const c = caixaSpaNorm(6, 3, spa, { side: "bottom", pos: 0 });
  assert.ok(perto(c.v0, 1) && perto(c.u0, 0));
});

t("bicos do spa caem dentro do spa, na parede externa", () => {
  const c = caixaSpaNorm(6, 3, { on: true, length: "2.00", width: "1.50", depth: "0.80", side: "top" }, null);
  const b = bicosSpaNorm(c, 2);
  assert.deepStrictEqual(Object.keys(b), ["hid_0", "hid_1"]);
  for (const k of Object.keys(b)) {
    assert.ok(b[k].x >= c.u0 && b[k].x <= c.u0 + c.du, "x dentro da caixa");
    assert.ok(b[k].y >= c.v0 && b[k].y <= c.v0 + c.dv, "y dentro da caixa");
    assert.ok(b[k].y < 0, "spa de cima: o bico fica acima da piscina");
    assert.strictEqual(b[k].profRef, 0.8, "altura do bico medida pela profundidade DO SPA");
    assert.strictEqual(b[k].noSpa, true);
  }
  assert.ok(b.hid_0.x < b.hid_1.x, "distribuídos ao longo da parede");
  // parede externa = a mais longe da piscina
  assert.ok(b.hid_0.y < c.v0 + c.dv / 2, "encostado na parede de fora do spa");
});

t("sem spa não há bico de spa", () => {
  assert.deepStrictEqual(bicosSpaNorm(null, 3), {});
  assert.deepStrictEqual(bicosSpaNorm(caixaSpaNorm(6, 3, { on: true, side: "top" }, null), 0), {});
});

console.log(`spa.test: ${n} testes ok`);
