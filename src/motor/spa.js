// ═══ SPA: a geometria que faltava no roteamento ═══
// O sistema desenha spa em três lugares (o spa externo do toggle, o spa quadrado
// e o spa de canto do formato "Com Spa") e até 2026-09 nenhum dos três entrava no
// contorno usado para rotear a tubulação. Consequências que o Marcos viu na tela:
// o ramal atravessava o spa por cima em vez de contorná-lo, e o bico não podia ser
// arrastado para dentro do spa porque o arrasto era travado no retângulo da piscina.
// Aqui mora a conta única, para o desenho e o roteamento nunca divergirem.
import { uniaoPoligonos, maiorPoligono, pontoDentro } from "./formas.js";

const num = (v, d = 0) => {
  const n = parseFloat(String(v ?? "").replace(",", "."));
  return Number.isFinite(n) ? n : d;
};

// Retângulo {x,y,w,h} → polígono de 4 pontos (mesma unidade de entrada).
export const retanguloPoli = r => [
  { x: r.x, y: r.y },
  { x: r.x + r.w, y: r.y },
  { x: r.x + r.w, y: r.y + r.h },
  { x: r.x, y: r.y + r.h },
];

// Círculo → polígono. 24 lados bastam: o contorno serve para medir tubo, não para
// desenhar o spa (o desenho continua sendo um <circle> de verdade).
export const circuloPoli = (cx, cy, raio, lados = 24) => {
  const p = [];
  for (let i = 0; i < lados; i++) {
    const a = (i / lados) * 2 * Math.PI;
    p.push({ x: cx + raio * Math.cos(a), y: cy + raio * Math.sin(a) });
  }
  return p;
};

// Une o contorno da piscina aos polígonos do spa. Se a união falhar ou devolver
// lixo, volta o contorno da piscina — tubo roteado errado é problema, tela branca
// no orçamento do cliente é problema maior.
export function contornoComSpa(base, spaPolis = []) {
  const polis = (spaPolis || []).filter(p => p && p.length >= 3);
  if (!base || base.length < 3 || polis.length === 0) return base;
  try {
    const u = maiorPoligono(uniaoPoligonos(base, ...polis));
    return u && u.length >= 3 ? u : base;
  } catch {
    return base;
  }
}

// Trava um ponto DENTRO do contorno efetivo (piscina ∪ spa), em vez de dentro do
// retângulo da piscina. Fora do contorno, devolve o ponto mais próximo na direção
// da âncora (o centro da piscina), o que faz o bico grudar na parede mais perto.
export function pontoNoContorno(pt, contorno, ancora) {
  if (!contorno || contorno.length < 3) return pt;
  if (pontoDentro(pt, contorno)) return pt;
  if (!ancora || !pontoDentro(ancora, contorno)) return pt;
  let dentro = { ...ancora }, fora = { ...pt };
  for (let i = 0; i < 24; i++) {
    const m = { x: (dentro.x + fora.x) / 2, y: (dentro.y + fora.y) / 2 };
    if (pontoDentro(m, contorno)) dentro = m; else fora = m;
  }
  return dentro;
}

// Retângulo do spa externo em coordenadas NORMALIZADAS do retângulo da piscina
// (u,v: 0..1 é a piscina; o spa cai fora desse intervalo, que é justamente o
// motivo de o arrasto antigo não deixar chegar nele). SEM espelho: o espelho é
// aplicado depois, junto com os bicos, para spa e bico virarem juntos.
export function caixaSpaNorm(L, W, spa, spaExtCustom) {
  if (!spa?.on) return null;
  const l = num(spa.length, 2) || 2, w = num(spa.width, 2) || 2;
  if (L <= 0 || W <= 0) return null;
  const side = spaExtCustom?.side || spa.side || "top";
  const pos = Math.max(0, Math.min(1, spaExtCustom?.pos ?? 1));
  const prof = num(spa.depth, 0) || null;
  if (side === "left")  return { side, u0: -w / L, v0: pos * (1 - l / W), du: w / L, dv: l / W, prof };
  if (side === "right") return { side, u0: 1,      v0: pos * (1 - l / W), du: w / L, dv: l / W, prof };
  if (side === "bottom")return { side, u0: pos * (1 - l / L), v0: 1,      du: l / L, dv: w / W, prof };
  return                       { side, u0: pos * (1 - l / L), v0: -w / W, du: l / L, dv: w / W, prof };
}

// Bicos que moram no spa, distribuídos na parede EXTERNA dele (a mais longe da
// piscina), em coordenadas normalizadas da piscina. `profRef` faz a altura do
// bico ser medida pela profundidade do spa, não pela da piscina.
export function bicosSpaNorm(caixa, qtd, prefixo = "hid_", rotulo = "H", tipo = "hidro") {
  const pos = {};
  if (!caixa || qtd <= 0) return pos;
  const INSET = 0.12; // fração da caixa: encosta na parede sem sair dela
  for (let i = 0; i < qtd; i++) {
    const f = (i + 1) / (qtd + 1);
    let u, v;
    if (caixa.side === "left")        { u = caixa.u0 + caixa.du * INSET;       v = caixa.v0 + caixa.dv * f; }
    else if (caixa.side === "right")  { u = caixa.u0 + caixa.du * (1 - INSET); v = caixa.v0 + caixa.dv * f; }
    else if (caixa.side === "bottom") { u = caixa.u0 + caixa.du * f;           v = caixa.v0 + caixa.dv * (1 - INSET); }
    else                              { u = caixa.u0 + caixa.du * f;           v = caixa.v0 + caixa.dv * INSET; }
    pos[prefixo + i] = { x: u, y: v, label: rotulo + (i + 1), type: tipo, noSpa: true, ...(caixa.prof ? { profRef: caixa.prof } : {}) };
  }
  return pos;
}
