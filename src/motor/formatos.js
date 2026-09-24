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

import { verticesTriangulo } from "./triangular.js";

/**
 * O contorno que as VISTAS desenham — planta, isométrica, 3D e a planta do
 * PDF — para os formatos que não são desenho livre: triângulo, redonda e
 * oitavada com banco. Cada renderizador já sabe desenhar contorno qualquer
 * (o caminho do desenho livre), e o banco entra como forma, igual prainha e spa.
 *
 * POR QUE MORA AQUI
 * Isto vivia dentro do editor. A tela do PDF desenhava com `d.desenho`, que é
 * vazio nesses formatos, e caía no retângulo 10 × 4 escondido do editor — foi
 * o que o Marcos viu no PDF da triangular em 24/09. Uma função só para os dois.
 *
 * A OITAVADA só entra com banco: sem banco ela já desenha do jeito nativo e
 * não há por que mexer em orçamento que existe.
 *
 * @param {object} [opts] { bancoCabe } — false quando a conta recusou o banco:
 *   banco que não cabe não vira desenho
 * @returns {null|{vertices, formas}}
 */
export function desenhoDoFormato(pool, poolFmt, { bancoCabe = true } = {}) {
  const p = pool || {};
  const n = (v) => parseFloat(String(v ?? "").replace(",", ".")) || 0;
  const v = poolFmt === "Triangular" ? verticesTriangulo(n(p.triA), n(p.triB), n(p.triC))
    : poolFmt === "Circular" ? contornoCircular(n(p.diametro))
    : (poolFmt === "Oitavada" && p.bancoOn) ? contornoOitavada(n(p.length), n(p.width), n(p.chanfro))
    : null;
  if (!v) return null;
  const bl = n(p.bancoLarg), bp = n(p.bancoProf);
  const formas = p.bancoOn && bl > 0 && bp > 0 && bancoCabe
    ? [{ id: "banco", tipo: "banco", larguraM: bl, comprimentoM: bl, profundidadeM: bp }]
    : [];
  return { vertices: v, formas };
}

/**
 * A piscina que as vistas recebem. Com contorno próprio, comprimento e largura
 * passam a ser os da CAIXA do contorno: o contorno é mapeado centrado e os
 * bicos em fração de comprimento × largura — com as duas caixas diferentes, o
 * bico certo aparecia fora da água (planta de 22/09/2026).
 */
export function piscinaDaVista(pool, desenhoFormato) {
  if (!desenhoFormato) return pool;
  const xs = desenhoFormato.vertices.map((q) => q.x), ys = desenhoFormato.vertices.map((q) => q.y);
  // 2 casas: a medida vai para a tela, e "2.115633994361116m" não é medida.
  const r2 = (v) => String(Math.round(v * 100) / 100);
  return { ...pool, length: r2(Math.max(...xs) - Math.min(...xs)), width: r2(Math.max(...ys) - Math.min(...ys)) };
}

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

// Piso mínimo para o banco ainda ser banco — o mesmo limite do triângulo
// (triangular.js: "não deixou piso utilizável").
const PISO_MINIMO = 0.01; // m²

/** Largura máxima de banco que ainda deixa piso nesta redonda (arredondada para baixo). */
export function bancoMaximoRedondo(diametro) {
  const r = (diametro || 0) / 2;
  if (!(r > 0)) return 0;
  return Math.max(0, Math.floor((r - Math.sqrt(PISO_MINIMO / Math.PI)) * 100) / 100);
}

/**
 * O banco cabe nesta redonda? Devolve a mensagem de erro, ou null.
 *
 * `medidasCirculo` descarta o banco EM SILÊNCIO quando ele não cabe e a conta
 * sai como piscina sem banco. Quem precisa avisar pergunta aqui antes.
 * Banco sem as duas medidas é só desenho — não é erro, igual nos outros formatos.
 */
export function erroBancoRedondo(diametro, bancoLarg, bancoProf, prof) {
  const r = (diametro || 0) / 2;
  if (!(r > 0) || !(bancoLarg > 0) || !(bancoProf > 0)) return null;
  const n = (v) => v.toFixed(2).replace(".", ",");
  if (prof > 0 && bancoProf >= prof) {
    return `Banco com o assento a ${n(bancoProf)} m da borda numa piscina de ${n(prof)} m de profundidade: o assento ficaria no fundo. Confira a profundidade do banco.`;
  }
  if (bancoLarg >= r || Math.PI * (r - bancoLarg) ** 2 < PISO_MINIMO) {
    return `Banco de ${n(bancoLarg)} m não cabe nesta redonda de ${n(diametro)} m: acima de ${n(bancoMaximoRedondo(diametro))} m os bancos se encontram no meio e não sobra piso.`;
  }
  return null;
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
