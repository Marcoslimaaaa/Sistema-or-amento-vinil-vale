import React, { useState } from "react";

const RESCUE_MSGS = [
  { min: 3, max: 8, msg: (name) => `Ol\u00e1 ${name}! \ud83d\ude0a\n\nTudo bem? Passando pra saber se voc\u00ea ainda tem interesse no or\u00e7amento da piscina.\n\nQualquer d\u00favida estamos \u00e0 disposi\u00e7\u00e3o! \ud83d\udcaa` },
  { min: 9, max: 19, msg: (name) => `Ol\u00e1 ${name}! \ud83d\ude0a\n\nFaz um tempinho que conversamos sobre sua piscina. Gostaria de saber se ainda tem interesse!\n\nTemos condi\u00e7\u00f5es especiais essa semana. Posso te ajudar? \ud83c\udfca` },
  { min: 20, max: 44, msg: (name) => `Ol\u00e1 ${name}! \ud83d\ude0a\n\nJ\u00e1 faz um tempo desde nosso \u00faltimo contato sobre o projeto da piscina.\n\nSe ainda tiver interesse, temos novidades e condi\u00e7\u00f5es especiais que podem te interessar! Me chama quando puder \ud83d\ude4f` },
  { min: 45, max: 9999, msg: (name) => `Ol\u00e1 ${name}! \ud83d\ude0a\n\nH\u00e1 bastante tempo conversamos sobre sua piscina. Gostar\u00edamos muito de retomar o contato!\n\nTemos novos pre\u00e7os e materiais. Se quiser, posso preparar um novo or\u00e7amento atualizado. O que acha? \ud83c\udfca\u2728` },
];

const getRescueMsg = (days, name) => {
  const tmpl = RESCUE_MSGS.find((m) => days >= m.min && days <= m.max) || RESCUE_MSGS[RESCUE_MSGS.length - 1];
  return tmpl.msg(name || "");
};

export default function RescueModal({ q, t, daysSince, onClose, openWA, addInteracao, setLeadTag, crmTags }) {
  const clientName = q.data?.client?.name || q.cN || "Cliente";
  const [msg, setMsg] = useState(() => getRescueMsg(daysSince, clientName));

  const handleSend = () => {
    const phone = q.data?.client?.phone || "";
    openWA(phone, msg);
    addInteracao(q.id, "whatsapp", "Follow-up de resgate enviado");
    // Add "Retornar" tag if not already present
    const tags = crmTags[q.id] || [];
    if (!tags.includes("Retornar")) {
      setLeadTag(q.id, "Retornar");
    }
    onClose();
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: t.card, borderRadius: "12px", padding: "20px", maxWidth: "420px", width: "100%", border: `1px solid ${t.cardBorder}`, boxShadow: "0 8px 32px rgba(0,0,0,.2)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
          <div>
            <div style={{ fontSize: "14px", fontWeight: "800", color: t.text }}>\ud83d\udcde Resgatar Lead</div>
            <div style={{ fontSize: "10px", color: t.textMuted, marginTop: "2px" }}>{clientName} \u00b7 {daysSince} dias sem contato</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: "18px", cursor: "pointer", color: t.textMuted }}>\u2715</button>
        </div>

        <div style={{ marginBottom: "10px" }}>
          <div style={{ fontSize: "9px", fontWeight: "700", color: t.textMuted, textTransform: "uppercase", letterSpacing: ".5px", marginBottom: "4px" }}>Mensagem de resgate</div>
          <textarea
            value={msg}
            onChange={(e) => setMsg(e.target.value)}
            rows={6}
            style={{
              width: "100%", padding: "10px", borderRadius: "8px",
              border: `1.5px solid ${t.cardBorder}`, background: t.inputBg,
              color: t.text, fontSize: "12px", fontFamily: "inherit",
              resize: "vertical", outline: "none", lineHeight: "1.5",
            }}
          />
        </div>

        <div style={{ display: "flex", gap: "8px" }}>
          <button onClick={onClose} style={{ flex: 1, padding: "8px", borderRadius: "8px", border: `1.5px solid ${t.cardBorder}`, background: "transparent", color: t.textSec, fontSize: "11px", fontWeight: "600", cursor: "pointer" }}>Cancelar</button>
          <button onClick={handleSend} style={{ flex: 2, padding: "8px", borderRadius: "8px", border: "none", background: "#25d366", color: "#fff", fontSize: "11px", fontWeight: "700", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}>\ud83d\udcac Enviar via WhatsApp</button>
        </div>
      </div>
    </div>
  );
}
