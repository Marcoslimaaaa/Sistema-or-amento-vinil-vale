// Página de verificação visual da planta hidráulica, SEM login.
// Não entra no app nem no build de produção — só existe em dev, em
// http://localhost:5199/planta.html
import React, { useState } from "react";
import ReactDOM from "react-dom/client";
import { PlantaView } from "./App.jsx";
import { MODELOS } from "./data/modelos.js";
import { espelharDesenho, contornoEfetivo, regioesProfundidade } from "./motor/formas.js";

const ROT_PRAINHA = { esquerda: 0, cima: 90, direita: 180, baixo: 270 };
const giraPos = (p, rot) => {
  if (rot === 90) return { ...p, x: 1 - p.y, y: p.x };
  if (rot === 180) return { ...p, x: 1 - p.x, y: 1 - p.y };
  if (rot === 270) return { ...p, x: p.y, y: 1 - p.x };
  return p;
};

// Cópia da autoPositions do App (mesma lógica) para a sandbox não depender do estado dele.
const autoPositions = (L, W, d, inv, fmt, opts = {}) => {
  const { flipH = false, flipV = false, ladoPrainha = null, raloQuenteParede = false } = opts;
  const pos = {}; const r = d.retorno || 0; const refs = d.refletor || 0;
  const isOval = fmt === "Oval" || fmt === "Feijão";
  const rotP = ROT_PRAINHA[ladoPrainha] ?? 0;
  const deitado = rotP === 90 || rotP === 270;
  const eixoDr = deitado ? W : L, eixoSep = deitado ? L : W;
  const eX = (y, side) => { const t = Math.max(-0.98, Math.min(0.98, (y - 0.5) / 0.5)); const ins = Math.sqrt(1 - t * t) * 0.47; return side === "left" ? 0.5 - ins : 0.5 + ins; };
  const eY = (x, side) => { const t = Math.max(-0.98, Math.min(0.98, (x - 0.5) / 0.5)); const ins = Math.sqrt(1 - t * t) * 0.47; return side === "top" ? 0.5 - ins : 0.5 + ins; };
  for (let i = 0; i < r; i++) { const y = (i + 1) / (r + 1); const side = inv ? "right" : "left"; pos["ret_" + i] = { x: isOval ? eX(y, side) : (inv ? 0.95 : 0.05), y, label: "R" + (i + 1), type: "retorno" }; }
  for (let i = 0; i < (d.aspiracao || 0); i++) { const x = 0.5; pos["asp_" + i] = { x, y: isOval ? eY(x, "bottom") : 0.95, label: "A" + (i + 1), type: "aspiracao" }; }
  const drQty = d.dreno || 0;
  if (drQty > 0) { const drX = inv ? (0.5 / (eixoDr || 10)) : eixoDr > 0 ? (eixoDr - 0.5) / eixoDr : 0.9; const sepDr = 1.5; const totalSep = (drQty - 1) * sepDr; const startY = eixoSep > 0 ? (eixoSep / 2 - totalSep / 2) / eixoSep : 0.5; for (let i = 0; i < drQty; i++) { const yPos = drQty === 1 ? 0.5 : startY + (i * sepDr) / eixoSep; pos["drn_" + i] = { x: isOval ? Math.max(0.25, Math.min(0.75, drX)) : drX, y: Math.max(0.15, Math.min(0.85, yPos)), label: "DF" + (i + 1), type: "dreno", floor: true }; } }
  for (let i = 0; i < (d.skimmer || 0); i++) { const y = (i + 1) / ((d.skimmer || 1) + 1); const side = inv ? "left" : "right"; pos["skm_" + i] = { x: isOval ? eX(y, side) : (inv ? 0.05 : 0.95), y, label: "SK" + (i + 1), type: "skimmer" }; }
  for (let i = 0; i < refs; i++) { const x = (Math.floor(i / 2) + 1) / (Math.ceil(refs / 2) + 1); if (i % 2 === 0) { pos["ref_" + i] = { x, y: isOval ? eY(x, "top") : 0.03, label: "L" + (i + 1), type: "refletor" }; } else { pos["ref_" + i] = { x, y: isOval ? eY(x, "bottom") : 0.97, label: "L" + (i + 1), type: "refletor" }; } }
  for (let i = 0; i < (d.nivelador || 0); i++) { const y = 0.15; const side = inv ? "left" : "right"; pos["niv_" + i] = { x: isOval ? eX(y, side) : (inv ? 0.05 : 0.95), y, label: "N" + (i + 1), type: "nivelador" }; }
  const hQty = d.hidro || 0;
  for (let i = 0; i < hQty; i++) { const y = (i + 1) / (hQty + 1); const side = inv ? "right" : "left"; pos["hid_" + i] = { x: isOval ? eX(y, side) : (inv ? 0.95 : 0.05), y, label: "H" + (i + 1), type: "hidro" }; }
  const ocupadosEm = faixa => { const o = [0.02, 0.98]; Object.values(pos).forEach(q => { if (!q.special && faixa(q)) o.push(q.x); }); return o; };
  const maiorFolga = (ocupados, dimX) => { let melhor = 0.5, melhorD = -1; for (let c = 0.10; c <= 0.901; c += 0.01) { let dmin = Infinity; for (const o of ocupados) dmin = Math.min(dmin, Math.abs(c - o) * dimX); if (dmin > melhorD) { melhorD = dmin; melhor = c; } } return Math.round(melhor * 100) / 100; };
  const dimX = deitado ? W : L;
  const rqQ = d.retornoQuente || 0; const ocupCima = ocupadosEm(q => q.y < 0.2);
  for (let i = 0; i < rqQ; i++) { const x = maiorFolga(ocupCima, dimX); ocupCima.push(x); pos["rtq_" + i] = { x, y: isOval ? eY(x, "top") : 0.03, label: "RQ" + (i + 1), type: "retornoQuente" }; }
  const dqQ = d.drenoQuente || 0; const ocupBaixo = ocupadosEm(q => q.y > 0.8);
  for (let i = 0; i < dqQ; i++) { const x = maiorFolga(ocupBaixo, dimX); ocupBaixo.push(x); pos["drq_" + i] = raloQuenteParede ? { x, y: isOval ? eY(x, "bottom") : 0.97, label: "DQ" + (i + 1), type: "drenoQuente" } : { x: isOval ? Math.max(0.25, Math.min(0.75, x)) : x, y: 0.78, label: "DQ" + (i + 1), type: "drenoQuente", floor: true }; }
  if (rotP) Object.keys(pos).forEach(k => { pos[k] = giraPos(pos[k], rotP); });
  if (flipH || flipV) Object.keys(pos).forEach(k => { pos[k] = { ...pos[k], x: flipH ? 1 - pos[k].x : pos[k].x, y: flipV ? 1 - pos[k].y : pos[k].y }; });
  pos["casa"] = { x: 1.12, y: 0.5, label: "CM", type: "casa", special: true };
  return pos;
};

const achaPrainha = d => (d?.formas || []).find(f => f.tipo === "prainha") || null;
const bbox = d => { const v = d?.vertices || []; if (v.length < 3) return null; const xs = v.map(p => p.x), ys = v.map(p => p.y); return { minX: Math.min(...xs), maxX: Math.max(...xs), minY: Math.min(...ys), maxY: Math.max(...ys) }; };
const lePrainha = (d, f) => { const bb = bbox(d); if (!f || !bb) return { lado: "baixo" }; const horiz = (f.larguraM || 0) >= (f.comprimentoM || 0); if (horiz) return { lado: Math.abs(f.cyM - bb.maxY) <= Math.abs(f.cyM - bb.minY) ? "baixo" : "cima" }; return { lado: Math.abs(f.cxM - bb.maxX) <= Math.abs(f.cxM - bb.minX) ? "direita" : "esquerda" }; };

const t = { text: "#0f172a", textSec: "#475569", textMuted: "#64748b", card: "#fff", cardBorder: "#e2e8f0", sectionBg: "#f8fafc", stampBg: "#e2e8f0", inputBg: "#fff", inputBorder: "#cbd5e1" };
const FMTS = ["Retangular", "Formato L", "Oval", "Oitavada", "Com prainha", "Personalizado"];

function App() {
  const [poolFmt, setPoolFmt] = useState("Retangular");
  const [modelo, setModelo] = useState("romana");
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  const [raloParede, setRaloParede] = useState(false);
  const [disps, setDisps] = useState({ retorno: 2, aspiracao: 1, dreno: 2, skimmer: 1, refletor: 6, nivelador: 1, hidro: 4, drenoQuente: 1, retornoQuente: 1 });
  const [customPos, setCustomPos] = useState({});
  const [dragging, setDragging] = useState(null);

  const pool = { length: "10.00", width: "4.00", depth: "1.40", chanfro: "1.00", prainhaComp: "1.50", prainhaProf: "0.30" };
  const usaDesenho = poolFmt === "Personalizado";
  const base = usaDesenho ? MODELOS.find(m => m.id === modelo).build(10, 4) : null;
  const desenho = base && !achaPrainha(base)
    ? { ...base, formas: [...base.formas, { id: "p1", tipo: "prainha", operacao: "uniao", rotacaoGraus: 0, larguraM: 3, comprimentoM: 5.2, cxM: 10, cyM: 2, profundidadeM: 0.3 }] }
    : base;
  const ladoPrainha = desenho ? (achaPrainha(desenho) ? lePrainha(desenho, achaPrainha(desenho)).lado : null) : (poolFmt === "Com prainha" ? "esquerda" : null);
  const desenhoV = desenho && (flipH || flipV) ? espelharDesenho(desenho, flipH, flipV) : desenho;

  const ar = { total: "0", chao: "0", paredes: "0", perim: "0", vol: "0" };
  const bt = (on) => ({ padding: "5px 11px", fontSize: "12px", fontWeight: 700, borderRadius: 6, cursor: "pointer", border: "1.5px solid " + (on ? "#0055a4" : "#cbd5e1"), background: on ? "#0055a4" : "#fff", color: on ? "#fff" : "#475569" });

  return (
    <div style={{ fontFamily: "system-ui,sans-serif", padding: 16, maxWidth: 1000, margin: "0 auto", color: "#0f172a" }}>
      <h2 style={{ margin: "0 0 4px" }}>Sandbox — planta hidráulica</h2>
      <p style={{ margin: "0 0 14px", fontSize: 12, color: "#64748b" }}>Verificação visual sem login. Piscina 10 × 4 × 1,40 m.</p>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginBottom: 10 }}>
        {FMTS.map(f => <button key={f} onClick={() => { setPoolFmt(f); setCustomPos({}); }} style={bt(poolFmt === f)}>{f}</button>)}
      </div>
      {usaDesenho && <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
        {["romana", "feijao", "canto-curvo", "em-l", "retangular-prainha"].map(m => <button key={m} onClick={() => { setModelo(m); setCustomPos({}); }} style={bt(modelo === m)}>{m}</button>)}
      </div>}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginBottom: 10 }}>
        <button onClick={() => { setFlipH(v => !v); setCustomPos({}); }} style={bt(flipH)}>↔ Virar lado</button>
        <button onClick={() => { setFlipV(v => !v); setCustomPos({}); }} style={bt(flipV)}>↕ Virar fundo</button>
        <button onClick={() => { setRaloParede(v => !v); setCustomPos({}); }} style={bt(raloParede)}>Ralo quente: {raloParede ? "parede" : "chão"}</button>
        <span style={{ fontSize: 12, color: "#64748b" }}>prainha: <b>{String(ladoPrainha)}</b></span>
      </div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 14 }}>
        {Object.keys(disps).map(k => (
          <label key={k} style={{ fontSize: 11, display: "flex", gap: 4, alignItems: "center" }}>
            {k}
            <input type="number" min="0" max="12" value={disps[k]} style={{ width: 46 }}
              onChange={e => { setDisps(p => ({ ...p, [k]: Math.max(0, parseInt(e.target.value) || 0) })); setCustomPos({}); }} />
          </label>
        ))}
      </div>

      <PlantaView
        pool={pool} spa={{ on: false, length: "2", width: "2", depth: "0.8", side: "top" }}
        disps={disps} customPos={customPos} setCustomPos={setCustomPos}
        dragging={dragging} setDragging={setDragging} dark={false}
        poolFmt={poolFmt} ar={ar} autoPositions={autoPositions} blue="#0055a4" t={t}
        invertSide={false} wMode="regular" walls={[]} spaType={{ redondo: false, quadrado: false }}
        extras={[]} desenho={desenhoV} flipH={flipH} flipV={flipV}
        ladoPrainha={ladoPrainha} raloQuenteParede={raloParede} devHeights={{}}
      />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
