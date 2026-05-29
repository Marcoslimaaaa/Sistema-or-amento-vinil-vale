import React from "react";

export const getRescuePriority = (days, status) => {
  if (!["lead", "negociacao", "orcamento"].includes(status || "lead")) return null;
  if (days < 3) return null;
  if (days <= 8) return { level: "aguardando", label: "Aguardando", icon: "\u23f3", color: "#3b82f6", bg: "#eff6ff", border: "#93c5fd" };
  if (days <= 19) return { level: "resgatar", label: "Resgatar agora", icon: "\ud83d\udcde", color: "#f97316", bg: "#fff7ed", border: "#fdba74" };
  if (days <= 44) return { level: "urgente", label: "Urgente", icon: "\ud83d\udea8", color: "#dc2626", bg: "#fef2f2", border: "#fca5a5" };
  return { level: "sugerir_perda", label: "Sugerir perda", icon: "\ud83d\udc80", color: "#7f1d1d", bg: "#fef2f2", border: "#f87171" };
};

export default function RescueButton({ q, daysSince, onClick, compact }) {
  const priority = getRescuePriority(daysSince, q.status || "lead");
  if (!priority) return null;

  return (
    <button
      title={`${priority.label} - ${daysSince} dias sem contato`}
      onClick={(e) => { e.stopPropagation(); onClick(q); }}
      style={{
        fontSize: compact ? "7px" : "9px",
        padding: compact ? "2px 5px" : "4px 8px",
        borderRadius: "4px",
        border: `1px solid ${priority.border}`,
        background: priority.bg,
        color: priority.color,
        cursor: "pointer",
        fontWeight: "700",
        display: "flex",
        alignItems: "center",
        gap: "2px",
        whiteSpace: "nowrap",
      }}
    >
      {priority.icon} {compact ? "" : priority.label}
    </button>
  );
}
