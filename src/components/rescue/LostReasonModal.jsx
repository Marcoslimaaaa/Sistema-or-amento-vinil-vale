import React, { useState } from "react";

export const MOTIVOS_PERDA = [
  { id: "caro", icon: "\ud83d\udcb8", label: "Achou caro" },
  { id: "concorrente", icon: "\ud83e\udd1d", label: "Fechou com concorrente" },
  { id: "depois", icon: "\u23f3", label: "Vai fazer depois" },
  { id: "mudou", icon: "\ud83d\udd04", label: "Mudou de ideia" },
  { id: "sem_retorno", icon: "\ud83d\udd07", label: "Sem retorno (n\u00e3o responde)" },
  { id: "outro", icon: "\ud83d\udcdd", label: "Outro motivo" },
];

export default function LostReasonModal({ q, t, daysSince, sugestaoAutomatica, onClose, onConfirm }) {
  const [selected, setSelected] = useState(null);
  const [obs, setObs] = useState("");

  const clientName = q.data?.client?.name || q.cN || "Cliente";
  const canConfirm = selected && (selected !== "outro" || obs.trim());

  const handleConfirm = () => {
    if (!canConfirm) return;
    const motivo = MOTIVOS_PERDA.find((m) => m.id === selected);
    onConfirm({
      motivoId: selected,
      motivoLabel: motivo.label,
      observacao: obs.trim() || "",
      dataMotivoPerda: new Date().toISOString(),
      diasParadoNaPerda: daysSince,
    });
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: t.card, borderRadius: "12px", padding: "20px", maxWidth: "420px", width: "100%", border: `1px solid ${t.cardBorder}`, boxShadow: "0 8px 32px rgba(0,0,0,.2)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
          <div>
            <div style={{ fontSize: "14px", fontWeight: "800", color: "#dc2626" }}>\u274c Motivo da Perda</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: "18px", cursor: "pointer", color: t.textMuted }}>\u2715</button>
        </div>

        {/* Card de identificacao do lead */}
        <div style={{ background: t.sectionBg || "#f8fafc", borderRadius: "8px", padding: "10px 12px", marginBottom: "12px", border: `1px solid ${t.cardBorder}` }}>
          <div style={{ fontSize: "14px", fontWeight: "800", color: t.text }}>{clientName}</div>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "4px", fontSize: "10px", color: t.textSec || t.textMuted }}>
            {q.data?.client?.phone && <span>\u260e {q.data.client.phone}</span>}
            {(q.data?.client?.city || q.cC) && <span>\u00b7 \ud83d\udccd {q.data?.client?.city || q.cC}</span>}
            {q.tot && <span>\u00b7 \ud83d\udcb0 R$ {parseFloat(q.tot).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>}
          </div>
          <div style={{ fontSize: "10px", color: "#dc2626", fontWeight: "700", marginTop: "4px" }}>\u23f1 {daysSince} dias parado</div>
        </div>

        {sugestaoAutomatica && (
          <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "8px", padding: "8px 10px", marginBottom: "12px", fontSize: "10px", color: "#991b1b", fontWeight: "600" }}>
            \u26a0\ufe0f Este lead est\u00e1 h\u00e1 {daysSince} dias sem contato. Sugerimos marc\u00e1-lo como perdido.
          </div>
        )}

        <div style={{ fontSize: "9px", fontWeight: "700", color: t.textMuted, textTransform: "uppercase", letterSpacing: ".5px", marginBottom: "6px" }}>Selecione o motivo</div>
        <div style={{ display: "flex", flexDirection: "column", gap: "4px", marginBottom: "12px" }}>
          {MOTIVOS_PERDA.map((m) => (
            <button
              key={m.id}
              onClick={() => setSelected(m.id)}
              style={{
                display: "flex", alignItems: "center", gap: "8px",
                padding: "8px 12px", borderRadius: "8px", cursor: "pointer",
                border: `1.5px solid ${selected === m.id ? "#dc2626" : t.cardBorder}`,
                background: selected === m.id ? "#fef2f2" : "transparent",
                color: selected === m.id ? "#dc2626" : t.text,
                fontSize: "12px", fontWeight: selected === m.id ? "700" : "500",
                textAlign: "left", transition: "all .15s",
              }}
            >
              <span style={{ fontSize: "14px" }}>{m.icon}</span>
              {m.label}
            </button>
          ))}
        </div>

        <div style={{ marginBottom: "12px" }}>
          <div style={{ fontSize: "9px", fontWeight: "700", color: t.textMuted, textTransform: "uppercase", letterSpacing: ".5px", marginBottom: "4px" }}>
            Observa\u00e7\u00e3o {selected === "outro" ? "(obrigat\u00f3rio)" : "(opcional)"}
          </div>
          <textarea
            value={obs}
            onChange={(e) => setObs(e.target.value)}
            placeholder="Detalhes sobre a perda..."
            rows={2}
            style={{
              width: "100%", padding: "8px", borderRadius: "8px",
              border: `1.5px solid ${t.cardBorder}`, background: t.inputBg,
              color: t.text, fontSize: "11px", fontFamily: "inherit",
              resize: "vertical", outline: "none",
            }}
          />
        </div>

        <div style={{ display: "flex", gap: "8px" }}>
          <button onClick={onClose} style={{ flex: 1, padding: "8px", borderRadius: "8px", border: `1.5px solid ${t.cardBorder}`, background: "transparent", color: t.textSec, fontSize: "11px", fontWeight: "600", cursor: "pointer" }}>
            {sugestaoAutomatica ? "Manter ativo" : "Cancelar"}
          </button>
          <button
            onClick={handleConfirm}
            disabled={!canConfirm}
            style={{
              flex: 2, padding: "8px", borderRadius: "8px", border: "none",
              background: canConfirm ? "#dc2626" : "#e5e7eb",
              color: canConfirm ? "#fff" : "#9ca3af",
              fontSize: "11px", fontWeight: "700", cursor: canConfirm ? "pointer" : "not-allowed",
            }}
          >
            \u274c Marcar como Perdido
          </button>
        </div>
      </div>
    </div>
  );
}
