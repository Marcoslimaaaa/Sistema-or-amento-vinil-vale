import React from "react";
import { fichaDoLead, completude } from "../../services/fichaLead.js";

// O que o bot descobriu sobre este lead, dentro do CRM.
//
// O bot pergunta 8 campos obrigatórios e mais 10 opcionais em toda conversa. O
// painel mostrava nove deles, e só dentro do drawer da aba WhatsApp — para ver
// se dá para levar máquina no terreno ou se o cliente tem pressa era preciso
// sair do CRM, achar a conversa e abrir o drawer. Aqui a ficha fica ao lado do
// lead, onde a decisão é tomada.
//
// A barra de completude serve para uma coisa só: saber, antes de ligar, o que
// ainda falta perguntar.

export default function FichaLead({ leadData, t, compacto }) {
  const grupos = fichaDoLead(leadData);
  const { preenchidos, total, faltando } = completude(leadData);

  if (grupos.length === 0) {
    return (
      <div style={{ fontSize: "9px", color: t.textMuted, padding: "6px 0", lineHeight: 1.5 }}>
        Sem dados do bot para este lead — a conversa não está vinculada ou o cliente nunca respondeu às perguntas.
      </div>
    );
  }

  const pct = Math.round((preenchidos / total) * 100);
  const cor = pct >= 100 ? "#16a34a" : pct >= 60 ? "#f59e0b" : "#dc2626";

  return (
    <div style={{ marginTop: compacto ? 0 : "8px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "7px" }}>
        <span style={{ fontSize: "9px", fontWeight: "800", textTransform: "uppercase", letterSpacing: ".4px", color: t.textMuted }}>
          Ficha do bot
        </span>
        <span style={{ flex: 1, height: "3px", background: t.cardBorder, borderRadius: "2px", overflow: "hidden" }}>
          <span style={{ display: "block", height: "100%", width: `${pct}%`, background: cor, borderRadius: "2px" }} />
        </span>
        <span style={{ fontSize: "8.5px", fontWeight: "700", color: cor }}>{preenchidos}/{total}</span>
      </div>

      {faltando.length > 0 && (
        <div style={{ fontSize: "8px", color: "#d97706", marginBottom: "7px", lineHeight: 1.4 }}>
          Falta perguntar: {faltando.map((k) => k.replace(/_/g, " ")).join(", ")}
        </div>
      )}

      {grupos.map((g) => (
        <div key={g.grupo} style={{ marginBottom: "7px" }}>
          <div style={{ fontSize: "8px", fontWeight: "800", color: t.textMuted, textTransform: "uppercase", letterSpacing: ".4px", marginBottom: "3px" }}>{g.grupo}</div>
          <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "2px 10px" }}>
            {g.itens.map((i) => (
              <React.Fragment key={i.chave}>
                <span style={{ fontSize: "9px", color: t.textMuted, whiteSpace: "nowrap" }}>{i.rotulo}</span>
                <span style={{ fontSize: "9.5px", color: t.text, fontWeight: "600", wordBreak: "break-word" }}>{i.valor}</span>
              </React.Fragment>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
