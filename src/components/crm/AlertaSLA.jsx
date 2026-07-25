import React from "react";
import { conversasSemResposta } from "../../services/score.js";

// Alerta de SLA: clientes que mandaram mensagem e estão esperando resposta
// humana há mais de 1 hora.
//
// A análise de perdas do próprio sistema mostra "sem retorno" como a causa
// dominante — este é o aviso que ataca isso antes de virar perda.

export default function AlertaSLA({ waConvs, t, onAbrirConversa, fmtPhone }) {
  const fila = conversasSemResposta(waConvs);
  if (fila.length === 0) return null;

  return (
    <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderLeft: "3px solid #dc2626", borderRadius: "8px", padding: "9px 12px", marginBottom: "10px" }}>
      <div style={{ fontSize: "11px", fontWeight: "800", color: "#dc2626", marginBottom: "6px" }}>
        ⏰ {fila.length} cliente{fila.length > 1 ? "s" : ""} esperando resposta
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
        {fila.slice(0, 5).map(({ conv, horas }) => {
          const ultima = (conv.history || [])[conv.history.length - 1]?.content || "";
          return (
            <button
              key={conv.phone}
              onClick={() => onAbrirConversa(conv.phone)}
              style={{ display: "flex", alignItems: "center", gap: "8px", width: "100%", textAlign: "left", background: "#fff", border: "1px solid #fecaca", borderRadius: "6px", padding: "6px 9px", cursor: "pointer" }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "10.5px", fontWeight: "700", color: "#111827" }}>
                  {conv.leadData?.nome || fmtPhone(conv.phone)}
                </div>
                <div style={{ fontSize: "9px", color: "#6b7280", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {ultima.slice(0, 70)}
                </div>
              </div>
              <span style={{ fontSize: "9px", fontWeight: "800", color: "#dc2626", whiteSpace: "nowrap" }}>
                {horas >= 24 ? `${Math.floor(horas / 24)}d` : `${horas}h`}
              </span>
            </button>
          );
        })}
        {fila.length > 5 && (
          <div style={{ fontSize: "9px", color: "#991b1b", fontWeight: "600", paddingLeft: "2px" }}>
            e mais {fila.length - 5}…
          </div>
        )}
      </div>
    </div>
  );
}
