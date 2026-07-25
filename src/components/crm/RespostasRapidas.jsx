import React, { useEffect, useMemo, useRef, useState } from "react";
import { PADRAO, preencher } from "../../services/respostas.js";

export { PADRAO, preencher };

// Respostas rápidas: digite "/" no campo de mensagem e escolha um texto pronto.
// As variáveis são preenchidas com os dados do lead vinculado à conversa.
//
// Guardadas em users/{uid}/config/respostasRapidas (mesmo padrão de interacoes
// e crmMeta). Sem nada salvo, entram estes padrões.

/**
 * Lista suspensa que aparece quando o texto começa com "/".
 * onEscolher recebe o texto já preenchido.
 */
export default function RespostasRapidas({ filtro, respostas, lead, onEscolher, onFechar, t }) {
  const [idx, setIdx] = useState(0);
  const ref = useRef(null);

  const lista = useMemo(() => {
    const termo = filtro.replace(/^\//, "").toLowerCase().trim();
    const base = respostas?.length ? respostas : PADRAO;
    if (!termo) return base;
    return base.filter(
      (r) => r.atalho.toLowerCase().includes(termo) || r.titulo.toLowerCase().includes(termo)
    );
  }, [filtro, respostas]);

  useEffect(() => { setIdx(0); }, [filtro]);

  useEffect(() => {
    const onKey = (e) => {
      // Só reage com o foco num campo de texto — o listener é global (window,
      // em captura) e sem isso um Enter dado em qualquer outro lugar da página
      // escolheria uma resposta enquanto a lista estivesse aberta.
      const alvo = e.target;
      const emCampo = alvo instanceof HTMLElement &&
        (alvo.tagName === "INPUT" || alvo.tagName === "TEXTAREA" || alvo.isContentEditable);
      if (!emCampo) return;

      if (e.key === "ArrowDown") { e.preventDefault(); setIdx((i) => Math.min(i + 1, lista.length - 1)); }
      else if (e.key === "ArrowUp") { e.preventDefault(); setIdx((i) => Math.max(i - 1, 0)); }
      else if (e.key === "Enter" && lista[idx]) { e.preventDefault(); onEscolher(preencher(lista[idx].texto, lead)); }
      else if (e.key === "Escape") { onFechar(); }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [lista, idx, lead, onEscolher, onFechar]);

  if (lista.length === 0) return null;

  return (
    <div
      ref={ref}
      style={{
        position: "absolute", bottom: "100%", left: 0, right: 0, marginBottom: "6px",
        background: t?.card || "#fff", border: `1px solid ${t?.cardBorder || "#e2e8f0"}`,
        borderRadius: "10px", boxShadow: "0 8px 24px rgba(0,0,0,.18)",
        maxHeight: "260px", overflowY: "auto", zIndex: 50,
      }}
    >
      <div style={{ padding: "6px 10px", fontSize: "9px", fontWeight: "700", textTransform: "uppercase", letterSpacing: ".5px", color: t?.textMuted || "#64748b", borderBottom: `1px solid ${t?.cardBorder || "#e2e8f0"}` }}>
        Respostas rápidas · ↑↓ para navegar · Enter para usar
      </div>
      {lista.map((r, i) => (
        <button
          key={r.atalho}
          onMouseEnter={() => setIdx(i)}
          onClick={() => onEscolher(preencher(r.texto, lead))}
          style={{
            display: "block", width: "100%", textAlign: "left", border: "none", cursor: "pointer",
            padding: "8px 10px", background: i === idx ? (t?.sectionBg || "#f1f5f9") : "transparent",
            borderBottom: `1px solid ${t?.cardBorder || "#f1f5f9"}`,
          }}
        >
          <div style={{ fontSize: "11px", fontWeight: "700", color: t?.text || "#0f172a" }}>
            /{r.atalho} <span style={{ fontWeight: "500", color: t?.textMuted || "#64748b" }}>· {r.titulo}</span>
          </div>
          <div style={{ fontSize: "10px", color: t?.textSec || "#475569", marginTop: "2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {preencher(r.texto, lead)}
          </div>
        </button>
      ))}
    </div>
  );
}
