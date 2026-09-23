// Contornos dos formatos que não são desenhados à mão.
//
// POR QUE EXISTE
// Depois do triangular, o banco que acompanha as paredes passou a valer para
// qualquer contorno (motor/formas.js → regioesBanco) e a conta também
// (motor/triangular.js → geometriaComBanco). O que faltava era um lugar só que
// soubesse DESENHAR o contorno de cada formato a partir das medidas que o
// Marcos digita — antes isso estava espalhado dentro do JSX da planta.
//
// Tudo em METROS, com a origem no canto de cima à esquerda da caixa.

/**
 * Oitavada: retângulo com os quatro cantos cortados em 45°.
 * `chanfro` é o quanto se corta em cada direção a partir do canto.
 */
export function contornoOitavada(L, W, chanfro) {
  const c = Math.max(0, Math.min(chanfro || 0, Math.min(L, W) / 2 - 0.01));
  if (!(L > 0 && W > 0)) return null;
  if (c <= 0) return [{ x: 0, y: 0 }, { x: L, y: 0 }, { x: L, y: W }, { x: 0, y: W }];
  return [
    { x: c, y: 0 }, { x: L - c, y: 0 },
    { x: L, y: c }, { x: L, y: W - c },
    { x: L - c, y: W }, { x: c, y: W },
    { x: 0, y: W - c }, { x: 0, y: c },
  ];
}

/**
 * Circular, aproximada em gomos.
 *
 * 48 gomos: MEDIDO, o polígono fica 0,29% menor que o círculo real — numa
 * hidro de 4 m de diâmetro são 0,04 m², abaixo do arredondamento de 0,1 m² que
 * o orçamento mostra. Por isso o polígono serve para DESENHAR e para o banco,
 * mas área, perímetro e volume saem da conta exata (`medidasCirculo`).
 */
export const GOMOS_CIRCULO = 48;

export function contornoCircular(diametro, gomos = GOMOS_CIRCULO) {
  const r = (diametro || 0) / 2;
  if (!(r > 0)) return null;
  const n = Math.max(12, Math.round(gomos));
  return Array.from({ length: n }, (_, i) => {
    const a = (2 * Math.PI * i) / n;
    return { x: r + r * Math.cos(a), y: r + r * Math.sin(a) };
  });
}

/** Área e perímetro EXATOS do círculo — o polígono é só para desenhar. */
export function medidasCirculo(diametro, { bancoLarg = 0, bancoProf = 0, prof = 0 } = {}) {
  const r = (diametro || 0) / 2;
  if (!(r > 0)) return null;
  const area = Math.PI * r * r;
  const perimetro = 2 * Math.PI * r;
  const temBanco = bancoLarg > 0 && bancoProf > 0 && bancoProf < prof && bancoLarg < r;
  const ri = temBanco ? r - bancoLarg : r;
  const alturaEspelho = temBanco ? prof - bancoProf : 0;
  const fundo = Math.PI * ri * ri;
  return {
    area, perimetro, raio: r, raioInterno: ri, temBanco, alturaEspelho,
    fundo,
    assento: temBanco ? area - fundo : 0,
    espelho: temBanco ? 2 * Math.PI * ri * alturaEspelho : 0,
    costas: temBanco ? perimetro * bancoProf : 0,
    parede: temBanco ? 0 : perimetro * prof,
    volume: area * prof - (temBanco ? (area - fundo) * alturaEspelho : 0),
    bancoMaximo: r,
  };
}
