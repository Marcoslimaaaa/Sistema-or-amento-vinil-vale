import React from "react";

// Potencial de venda do lead, calculado pelo bot no fim da triagem
// (vinil-vale-whatsapp-bot/src/services/potencial.js) e gravado em
// `qualificacao` no doc da conversa.
//
// NÃO confundir com a "Prioridade" do pipeline (services/score.js): aquela é
// valor × etapa × tempo parado e só existe depois que há orçamento com valor.
// Esta aqui responde antes disso — vale a pena correr atrás deste lead?
//
// A nota é interna. O cliente nunca vê, e o bot é proibido de mencionar.

const FAIXAS = {
  A: { cor: "#dc2626", fundo: "#dc262618", rotulo: "Quente" },
  B: { cor: "#f59e0b", fundo: "#f59e0b18", rotulo: "Morno" },
  C: { cor: "#64748b", fundo: "#64748b18", rotulo: "Frio" },
};

/** Selo compacto pra lista de conversas. */
export default function SeloPotencial({ qualificacao, compacto = true }) {
  if (!qualificacao || typeof qualificacao.nota !== "number") return null;

  const f = FAIXAS[qualificacao.faixa] || FAIXAS.C;
  const ticket = qualificacao.ticketEstimado
    ? ` · ~R$ ${Number(qualificacao.ticketEstimado).toLocaleString("pt-BR")}`
    : "";
  // O title é onde ficam os motivos: explica a nota sem ocupar espaço na
  // lista. Nota sem motivo vira superstição — ninguém confia e ninguém usa.
  const explicacao = [
    `${f.rotulo} · ${qualificacao.nota}/100${ticket}`,
    ...(qualificacao.motivos || []),
  ].join("\n");

  if (compacto) {
    return (
      <span
        title={explicacao}
        style={{
          fontSize: "8.5px", fontWeight: "800", color: f.cor, background: f.fundo,
          padding: "1px 5px", borderRadius: "4px", flexShrink: 0, letterSpacing: ".3px",
        }}
      >
        {qualificacao.faixa} {qualificacao.nota}
      </span>
    );
  }

  return (
    <div title={explicacao} style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
      <span style={{
        fontSize: "10px", fontWeight: "800", color: f.cor, background: f.fundo,
        padding: "2px 7px", borderRadius: "5px",
      }}>
        {f.rotulo.toUpperCase()} · {qualificacao.nota}/100{ticket}
      </span>
      {(qualificacao.motivos || []).slice(0, 3).map((m, i) => (
        <span key={i} style={{ fontSize: "9px", color: "#64748b" }}>{m}</span>
      ))}
    </div>
  );
}

export { FAIXAS };
