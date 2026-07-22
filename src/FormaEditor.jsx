// Editor de forma da piscina — port do EditorPiscina do projeto hidraulica-piscinas,
// adaptado ao tema da VinilVale (sem casa de máquinas; ela vive na aba Planta).
// - vértices arrastáveis (snap 0,1 m) com medida de cada lado ao vivo
// - duplo clique numa aresta adiciona vértice; num vértice, remove
// - prainha/escada/spa somam ao contorno; recorte subtrai — com profundidade própria
import React, { useRef, useState } from "react";
import {
  areaPoligono,
  perimetroPoligono,
  contornoEfetivo,
  retanguloForma,
  calcDesenho,
  PROFUNDIDADE_FORMA_DEFAULT,
} from "./motor/formas.js";

const LARGURA = 640, ALTURA = 430, MARGEM = 56, SNAP_M = 0.1;
const ROTULO = { prainha: "Prainha", escada: "Escada", spa: "Spa", recorte: "Recorte" };
let contadorForma = 0;

const numBR = (v, casas = 2) => (v ?? 0).toLocaleString("pt-BR", { maximumFractionDigits: casas });

export default function FormaEditor({ desenho, profundidade, onChange, t, dark }) {
  const vertices = desenho?.vertices || [];
  const formas = desenho?.formas || [];
  const svgRef = useRef(null);
  const [arrasto, setArrasto] = useState(null);

  // enquadramento: piscina + formas com margem
  const cantosFormas = formas.flatMap(f => retanguloForma(f));
  const xs = [...vertices.map(v => v.x), ...cantosFormas.map(c => c.x)];
  const ys = [...vertices.map(v => v.y), ...cantosFormas.map(c => c.y)];
  const minX = Math.min(...xs) - 1, maxX = Math.max(...xs) + 1;
  const minY = Math.min(...ys) - 1, maxY = Math.max(...ys) + 1;
  const escala = Math.min((LARGURA - MARGEM * 2) / (maxX - minX), (ALTURA - MARGEM * 2) / (maxY - minY));
  const px = p => ({ x: MARGEM + (p.x - minX) * escala, y: MARGEM + (p.y - minY) * escala });

  const eventoParaM = e => {
    const rect = svgRef.current.getBoundingClientRect();
    const sx = ((e.clientX - rect.left) / Math.max(rect.width, 1)) * LARGURA;
    const sy = ((e.clientY - rect.top) / Math.max(rect.height, 1)) * ALTURA;
    const clamp = v => Math.min(100, Math.max(-100, v));
    const snap = v => Math.round(v / SNAP_M) * SNAP_M;
    return { x: clamp(snap((sx - MARGEM) / escala + minX)), y: clamp(snap((sy - MARGEM) / escala + minY)) };
  };

  const aoMover = e => {
    if (!arrasto) return;
    const m = eventoParaM(e);
    if (arrasto.tipo === "vertice") onChange({ ...desenho, vertices: vertices.map((v, j) => (j === arrasto.indice ? m : v)) });
    else atualizarForma(arrasto.id, { cxM: Math.round((m.x + arrasto.dx) * 100) / 100, cyM: Math.round((m.y + arrasto.dy) * 100) / 100 });
  };

  const atualizarForma = (id, patch) => onChange({ ...desenho, formas: formas.map(f => (f.id === id ? { ...f, ...patch } : f)) });
  const removerForma = id => onChange({ ...desenho, formas: formas.filter(f => f.id !== id) });

  const adicionarForma = tipo => {
    const vx = vertices.map(v => v.x), vy = vertices.map(v => v.y);
    const pMinX = Math.min(...vx), pMaxX = Math.max(...vx), pMinY = Math.min(...vy), pMaxY = Math.max(...vy);
    const largP = pMaxX - pMinX, cxMeio = (pMinX + pMaxX) / 2;
    const presets = {
      prainha: { operacao: "uniao", larguraM: Math.max(2, largP * 0.5), comprimentoM: 1.5, cxM: cxMeio, cyM: pMaxY },
      escada: { operacao: "uniao", larguraM: 2.5, comprimentoM: 1.2, cxM: cxMeio, cyM: pMaxY, degrausQtd: 3 },
      spa: { operacao: "uniao", larguraM: 2.5, comprimentoM: 2.5, cxM: pMaxX, cyM: pMaxY },
      recorte: { operacao: "subtracao", larguraM: 1.5, comprimentoM: 1.5, cxM: pMinX, cyM: pMinY },
    };
    const nova = {
      id: `f${Date.now().toString(36)}${contadorForma++}`,
      tipo, operacao: "uniao", cxM: cxMeio, cyM: pMaxY, larguraM: 2, comprimentoM: 2,
      profundidadeM: PROFUNDIDADE_FORMA_DEFAULT[tipo] || undefined,
      ...presets[tipo],
    };
    onChange({ ...desenho, formas: [...formas, nova] });
  };

  const adicionarVertice = i => {
    const a = vertices[i], b = vertices[(i + 1) % vertices.length];
    const meio = { x: Math.round(((a.x + b.x) / 2) * 100) / 100, y: Math.round(((a.y + b.y) / 2) * 100) / 100 };
    onChange({ ...desenho, vertices: [...vertices.slice(0, i + 1), meio, ...vertices.slice(i + 1)] });
  };
  const removerVertice = i => {
    if (vertices.length <= 3) return;
    onChange({ ...desenho, vertices: vertices.filter((_, j) => j !== i) });
  };

  if (vertices.length < 3) return null;

  const efetivo = contornoEfetivo(desenho);
  const m = calcDesenho(desenho, profundidade) || { chao: 0, perim: 0, paredes: 0, vol: 0 };
  const pontosPx = vertices.map(px);
  const efetivoPx = efetivo.map(px);

  // grid de 1 m
  const grid = [];
  const gridCor = dark ? "#1c2f4d" : "#e2e8f0";
  for (let gx = Math.ceil(minX); gx <= Math.floor(maxX) && grid.length < 300; gx++) {
    const a = px({ x: gx, y: minY }), b = px({ x: gx, y: maxY });
    grid.push(<line key={`gx${gx}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={gridCor} strokeWidth={1} />);
  }
  for (let gy = Math.ceil(minY); gy <= Math.floor(maxY) && grid.length < 300; gy++) {
    const a = px({ x: minX, y: gy }), b = px({ x: maxX, y: gy });
    grid.push(<line key={`gy${gy}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={gridCor} strokeWidth={1} />);
  }

  const inpSt = { width: "52px", padding: "3px 5px", border: `1.5px solid ${t.cardBorder}`, borderRadius: "5px", fontSize: "10px", background: t.inputBg, color: t.text, outline: "none" };
  const lblSt = { fontSize: "8px", fontWeight: "700", color: t.textMuted, display: "flex", flexDirection: "column", gap: "2px", alignItems: "flex-start" };

  return (
    <div>
      <div style={{ display: "flex", gap: "14px", marginBottom: "8px", fontSize: "11px", flexWrap: "wrap", color: t.textSec }}>
        <span>Chão: <b style={{ color: t.text }}>{numBR(m.chao)} m²</b></span>
        <span>Paredes: <b style={{ color: t.text }}>{numBR(m.paredes)} m²</b></span>
        <span>Perímetro: <b style={{ color: t.text }}>{numBR(m.perim)} m</b></span>
        <span>Volume real: <b style={{ color: t.text }}>{numBR(m.vol)} m³</b></span>
      </div>
      <div style={{ fontSize: "9px", color: t.textMuted, marginBottom: "6px" }}>
        Arraste os pontos · duplo clique na borda adiciona ponto · duplo clique no ponto remove · arraste a alça ● para mover uma forma
      </div>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${LARGURA} ${ALTURA}`}
        style={{ width: "100%", height: "auto", display: "block", background: dark ? "#0f172a" : "#f8fafc", borderRadius: "8px", border: `1px solid ${t.cardBorder}`, touchAction: "none", userSelect: "none" }}
        onPointerMove={aoMover}
        onPointerUp={() => setArrasto(null)}
        onPointerLeave={() => setArrasto(null)}
      >
        <defs>
          <linearGradient id="aguaEditorVV" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={dark ? "#1a7fa8" : "#7cc4e8"} />
            <stop offset="1" stopColor={dark ? "#0e5d86" : "#4a9fd4"} />
          </linearGradient>
        </defs>
        {grid}

        {/* água = contorno efetivo (base ⊕ formas) */}
        <polygon points={efetivoPx.map(p => `${p.x},${p.y}`).join(" ")} fill="url(#aguaEditorVV)" stroke={dark ? "#8fd8ea" : "#2563eb"} strokeWidth={2.5} />

        {/* contorno base pontilhado quando há formas */}
        {formas.length > 0 && (
          <polygon points={pontosPx.map(p => `${p.x},${p.y}`).join(" ")} fill="none" stroke={dark ? "#8fd8ea" : "#2563eb"} strokeWidth={1} strokeDasharray="3 4" opacity={0.45} />
        )}

        {/* arestas invisíveis largas: duplo clique adiciona vértice */}
        {vertices.map((_, i) => {
          const a = pontosPx[i], b = pontosPx[(i + 1) % vertices.length];
          return <line key={`e${i}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="transparent" strokeWidth={16} style={{ cursor: "copy" }} onDoubleClick={() => adicionarVertice(i)} />;
        })}

        {/* medidas das arestas */}
        {vertices.map((v, i) => {
          const w = vertices[(i + 1) % vertices.length];
          const a = pontosPx[i], b = px(w);
          const compr = Math.hypot(w.x - v.x, w.y - v.y);
          if (compr < 0.35) return null;
          const dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy) || 1;
          return (
            <text key={`m${i}`} x={(a.x + b.x) / 2 + (dy / len) * 16} y={(a.y + b.y) / 2 - (dx / len) * 16 + 4} textAnchor="middle" fill={dark ? "#e8f1fb" : "#334155"} fontSize={11} fontWeight={700}>
              {numBR(compr)} m
            </text>
          );
        })}

        {/* formas compostas arrastáveis */}
        {formas.map(f => {
          const cantos = retanguloForma(f).map(px);
          const c = px({ x: f.cxM, y: f.cyM });
          const cor = f.operacao === "subtracao" ? "#ef4444" : "#16a34a";
          const arrastando = arrasto?.tipo === "forma" && arrasto.id === f.id;
          return (
            <g key={f.id} style={{ cursor: "move" }} onPointerDown={e => { e.target.setPointerCapture?.(e.pointerId); const mm = eventoParaM(e); setArrasto({ tipo: "forma", id: f.id, dx: f.cxM - mm.x, dy: f.cyM - mm.y }); }}>
              <polygon points={cantos.map(p => `${p.x},${p.y}`).join(" ")} fill={cor} fillOpacity={arrastando ? 0.3 : 0.16} stroke={cor} strokeWidth={2} strokeDasharray="6 4" />
              <circle cx={c.x} cy={c.y} r={10} fill={dark ? "#0b1a30" : "#fff"} stroke={cor} strokeWidth={2.5} />
              <text x={c.x} y={c.y + 3.5} textAnchor="middle" fill={cor} fontSize={11} fontWeight={800} pointerEvents="none">{f.operacao === "subtracao" ? "−" : "+"}</text>
              <text x={c.x} y={c.y - 14} textAnchor="middle" fill={cor} fontSize={9.5} fontWeight={700} pointerEvents="none">{ROTULO[f.tipo]}</text>
            </g>
          );
        })}

        {/* vértices arrastáveis */}
        {pontosPx.map((p, i) => (
          <circle
            key={`v${i}`} cx={p.x} cy={p.y} r={7}
            fill={dark ? "#0b1a30" : "#fff"} stroke="#0e9c8d" strokeWidth={2.5}
            style={{ cursor: "grab" }}
            onPointerDown={e => { e.target.setPointerCapture?.(e.pointerId); setArrasto({ tipo: "vertice", indice: i }); }}
            onDoubleClick={() => removerVertice(i)}
          />
        ))}
      </svg>

      {/* painel de formas compostas */}
      <div style={{ marginTop: "8px" }}>
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ fontSize: "10px", color: t.textMuted, fontWeight: "600" }}>Adicionar:</span>
          {[["prainha", "+ Prainha"], ["escada", "+ Escada"], ["spa", "+ Spa"], ["recorte", "− Recorte"]].map(([tp, lb]) => (
            <button key={tp} onClick={() => adicionarForma(tp)} style={{ padding: "5px 10px", borderRadius: "7px", border: `1.5px solid ${tp === "recorte" ? "#ef4444" : "#16a34a"}44`, background: "transparent", color: tp === "recorte" ? "#ef4444" : "#16a34a", fontSize: "10px", fontWeight: "700", cursor: "pointer" }}>{lb}</button>
          ))}
        </div>
        {formas.length === 0 ? (
          <div style={{ fontSize: "9.5px", color: t.textMuted, marginTop: "6px" }}>
            Prainha, escada e spa somam à piscina (com profundidade própria); recorte tira um pedaço.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "8px" }}>
            {formas.map(f => (
              <div key={f.id} style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "flex-end", background: t.sectionBg, borderRadius: "8px", padding: "7px 9px", border: `1px solid ${t.cardBorder}` }}>
                <b style={{ fontSize: "11px", color: f.operacao === "subtracao" ? "#ef4444" : "#16a34a", minWidth: "56px" }}>{ROTULO[f.tipo]}</b>
                <label style={lblSt}>LARG. (m)<input type="number" step="0.1" value={f.larguraM} onChange={e => atualizarForma(f.id, { larguraM: Number(e.target.value) })} style={inpSt} /></label>
                <label style={lblSt}>COMPR. (m)<input type="number" step="0.1" value={f.comprimentoM} onChange={e => atualizarForma(f.id, { comprimentoM: Number(e.target.value) })} style={inpSt} /></label>
                <label style={lblSt}>GIRO °<input type="number" step="5" value={f.rotacaoGraus ?? 0} onChange={e => atualizarForma(f.id, { rotacaoGraus: Number(e.target.value) })} style={inpSt} /></label>
                {f.operacao === "uniao" && (
                  <label style={lblSt} title="Profundidade da forma — prainha/escada/spa são mais rasas que a piscina">PROF. (m)<input type="number" step="0.05" min="0.05" value={f.profundidadeM ?? PROFUNDIDADE_FORMA_DEFAULT[f.tipo]} onChange={e => atualizarForma(f.id, { profundidadeM: Number(e.target.value) })} style={inpSt} /></label>
                )}
                {f.tipo === "escada" && (
                  <label style={lblSt}>DEGRAUS<input type="number" step="1" min="1" value={f.degrausQtd ?? 3} onChange={e => atualizarForma(f.id, { degrausQtd: Number(e.target.value) })} style={inpSt} /></label>
                )}
                <button onClick={() => removerForma(f.id)} title="Remover" style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: "13px", marginLeft: "auto" }}>✕</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/** Miniatura SVG de um modelo/desenho (galeria de modelos e cards). */
export function MiniForma({ desenho, size = 72, dark }) {
  const efetivo = contornoEfetivo(desenho);
  if (efetivo.length < 3) return null;
  const xs = efetivo.map(p => p.x), ys = efetivo.map(p => p.y);
  const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
  const pad = 4;
  const esc = Math.min((size - pad * 2) / (maxX - minX || 1), (size * 0.72 - pad * 2) / (maxY - minY || 1));
  const w = size, h = size * 0.72;
  const ox = (w - (maxX - minX) * esc) / 2, oy = (h - (maxY - minY) * esc) / 2;
  const px = p => `${ox + (p.x - minX) * esc},${oy + (p.y - minY) * esc}`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: "100%", height: "auto", display: "block" }}>
      <polygon points={efetivo.map(px).join(" ")} fill={dark ? "#1a7fa8" : "#7cc4e8"} fillOpacity="0.75" stroke={dark ? "#8fd8ea" : "#2563eb"} strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}
