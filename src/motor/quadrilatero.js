// Piscina FORA DE ESQUADRO — a forma real a partir dos 4 lados e das diagonais.
//
// POR QUE EXISTE (achado 4.2c da planta de obra, corrigido em 26/10/2026)
// Quatro lados não definem uma piscina: 8,00 / 4,00 / 8,00 / 4,00 pode estar no
// esquadro (diagonais 8,94 e 8,94) ou com um canto a 88° (diagonais 9,07 e
// 8,82, a parede do fundo 14 cm deslocada). A trena nos lados não enxerga isso;
// só a diagonal enxerga. Antes, no modo "Fora de Esquadro", o chão continuava
// comprimento × largura e o desenho virava um trapézio simétrico inventado.
//
// CONVENÇÃO — a mesma ordem das paredes na tela (P1 a P4), andando em volta:
//   P1 = A→B (em cima na planta), P2 = B→C, P3 = C→D, P4 = D→A
//   diagonal A→C liga o canto P4/P1 ao canto P2/P3
//   diagonal B→D liga o canto P1/P2 ao canto P3/P4
// Uma diagonal já fecha a forma (dois triângulos). A segunda serve de
// CONFERÊNCIA: a conta diz quanto ela deveria medir e quanto a trena errou.
//
// Tudo em METROS. Puro, sem React.

const m2 = (v) => v.toFixed(2).replace(".", ",");

/** Até onde a segunda diagonal pode errar sem aviso: trena de obra, 2 cm. */
export const TOLERANCIA_DIAGONAL = 0.02;

// terceiro vértice de um triângulo: a partir de p (lado dp) e q (lado dq), do lado `sinal`
function vertice(p, q, dp, dq, sinal) {
  const base = Math.hypot(q.x - p.x, q.y - p.y);
  if (!(base > 0)) return null;
  const a = (dp * dp - dq * dq + base * base) / (2 * base);
  const h2 = dp * dp - a * a;
  if (h2 < -1e-9) return null;
  const h = Math.sqrt(Math.max(0, h2));
  const ux = (q.x - p.x) / base, uy = (q.y - p.y) / base;
  return { x: p.x + a * ux - sinal * h * uy, y: p.y + a * uy + sinal * h * ux };
}

const area = (pts) => Math.abs(pts.reduce((s, a, i) => {
  const b = pts[(i + 1) % pts.length];
  return s + a.x * b.y - b.x * a.y;
}, 0)) / 2;

const fecha = (a, b, c) => a + b > c + 1e-9 && a + c > b + 1e-9 && b + c > a + 1e-9;

/**
 * @param {number[]} lados  [P1, P2, P3, P4]
 * @param {number} [diagAC]
 * @param {number} [diagBD]
 * @returns {null|{vertices, area, diagonais:{AC, BD}, conferencia, erro}}
 *   null quando não há diagonal (a conta segue no esquadro, como antes)
 *   conferencia: {medida, calculada, diferenca, ok} — só com as duas diagonais
 */
export function quadrilateroPorDiagonais(lados, diagAC = 0, diagBD = 0) {
  const [p1, p2, p3, p4] = lados || [];
  if (!(p1 > 0 && p2 > 0 && p3 > 0 && p4 > 0)) return null;
  if (!(diagAC > 0) && !(diagBD > 0)) return null;
  const falha = (erro) => ({ vertices: [], area: 0, diagonais: { AC: diagAC, BD: diagBD }, conferencia: null, erro });

  // A em (0,0), B em (P1, 0); y cresce para BAIXO, como na planta
  const A = { x: 0, y: 0 }, B = { x: p1, y: 0 };
  let C, D;
  if (diagAC > 0) {
    if (!fecha(p1, p2, diagAC)) return falha(`A diagonal A→C (${m2(diagAC)} m) não fecha com P1 (${m2(p1)}) e P2 (${m2(p2)}). Confira a medida.`);
    if (!fecha(p3, p4, diagAC)) return falha(`A diagonal A→C (${m2(diagAC)} m) não fecha com P3 (${m2(p3)}) e P4 (${m2(p4)}). Confira a medida.`);
    C = vertice(A, B, diagAC, p2, 1);
    D = vertice(A, C, p4, p3, 1);
  } else {
    if (!fecha(p1, p4, diagBD)) return falha(`A diagonal B→D (${m2(diagBD)} m) não fecha com P1 (${m2(p1)}) e P4 (${m2(p4)}). Confira a medida.`);
    if (!fecha(p2, p3, diagBD)) return falha(`A diagonal B→D (${m2(diagBD)} m) não fecha com P2 (${m2(p2)}) e P3 (${m2(p3)}). Confira a medida.`);
    D = vertice(A, B, p4, diagBD, 1);
    C = vertice(B, D, p2, p3, -1);
  }
  if (!C || !D) return falha("Os lados e a diagonal não fecham uma piscina. Confira as medidas.");
  const vertices = [A, B, C, D];
  const AC = Math.hypot(C.x - A.x, C.y - A.y), BD = Math.hypot(D.x - B.x, D.y - B.y);

  let conferencia = null;
  if (diagAC > 0 && diagBD > 0) {
    const diferenca = diagBD - BD;
    conferencia = { medida: diagBD, calculada: BD, diferenca, ok: Math.abs(diferenca) <= TOLERANCIA_DIAGONAL };
  }
  return { vertices, area: area(vertices), diagonais: { AC, BD }, conferencia, erro: null };
}

/** O ângulo de cada canto (A, B, C, D), em graus — 90 é o esquadro. */
export function angulosDosCantos(vertices) {
  return vertices.map((v, i) => {
    const a = vertices[(i + vertices.length - 1) % vertices.length], b = vertices[(i + 1) % vertices.length];
    const u = { x: a.x - v.x, y: a.y - v.y }, w = { x: b.x - v.x, y: b.y - v.y };
    const cos = (u.x * w.x + u.y * w.y) / (Math.hypot(u.x, u.y) * Math.hypot(w.x, w.y));
    return (Math.acos(Math.max(-1, Math.min(1, cos))) * 180) / Math.PI;
  });
}
