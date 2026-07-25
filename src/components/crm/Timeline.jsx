import React, { useMemo, useState } from "react";
import { montarTimeline } from "../../services/timeline.js";

// Linha do tempo unificada do lead: interações registradas no CRM + mensagens
// reais da conversa do WhatsApp, em ordem cronológica.
//
// Antes eram duas listas separadas — as notas do CRM numa aba, a conversa em
// outra — e ninguém cruzava as duas para entender o histórico do cliente.

// Reexporta para quem importa a partir do componente.
export { montarTimeline };

const ICONE = {
  whatsapp: "💬", orcamento: "📄", nota: "📝", ligacao: "📞",
  email: "✉️", visita: "🏠", etapa: "🔀", cliente: "👤", empresa: "🏢",
};

const fmtQuando = (ts) => {
  const d = new Date(ts);
  const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
  const dia = new Date(ts); dia.setHours(0, 0, 0, 0);
  const diff = Math.round((hoje - dia) / 86400000);
  const hora = d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  if (diff === 0) return `hoje ${hora}`;
  if (diff === 1) return `ontem ${hora}`;
  if (diff < 7) return `${diff} dias atrás`;
  return d.toLocaleDateString("pt-BR");
};

export default function Timeline({ interacoes, conv, t, limite = 12 }) {
  const [verTudo, setVerTudo] = useState(false);
  const itens = useMemo(() => montarTimeline(interacoes, conv), [interacoes, conv]);

  if (itens.length === 0) {
    return <div style={{ fontSize: "10px", color: t.textMuted, padding: "8px 0" }}>Nenhum histórico ainda.</div>;
  }

  const visiveis = verTudo ? itens : itens.slice(0, limite);

  return (
    <div>
      {visiveis.map((i, n) => {
        const doCliente = i.origem === "cliente";
        const cor = doCliente ? "#0284c7" : i.origem === "crm" ? "#8b5cf6" : "#16a34a";
        return (
          <div key={n} style={{ display: "flex", gap: "8px", padding: "6px 0", borderBottom: `1px solid ${t.cardBorder}` }}>
            <div style={{ fontSize: "13px", lineHeight: "1.2", flexShrink: 0 }}>{ICONE[i.tipo] || "•"}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: "10.5px", color: t.text, lineHeight: 1.45, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                {i.texto.length > 220 ? i.texto.slice(0, 220) + "…" : i.texto}
              </div>
              <div style={{ fontSize: "8.5px", color: t.textMuted, marginTop: "2px", display: "flex", gap: "6px", alignItems: "center" }}>
                <span style={{ color: cor, fontWeight: "700" }}>
                  {doCliente ? "cliente" : i.origem === "crm" ? "CRM" : "empresa"}
                </span>
                <span>{i.tsAproximado ? "~" : ""}{fmtQuando(i.ts)}</span>
              </div>
            </div>
          </div>
        );
      })}
      {itens.length > limite && (
        <button onClick={() => setVerTudo((p) => !p)} style={{ marginTop: "6px", fontSize: "9px", fontWeight: "700", background: "none", border: "none", color: "#0055a4", cursor: "pointer", padding: "2px 0" }}>
          {verTudo ? "Mostrar menos" : `Ver todo o histórico (${itens.length})`}
        </button>
      )}
    </div>
  );
}
