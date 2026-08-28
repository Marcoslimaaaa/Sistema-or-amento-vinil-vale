import React from "react";
import { resumoRascunho, ordenarRascunhos } from "../../services/rascunhoBot.js";

// Fila de rascunhos que o Vini deixou prontos.
//
// O que o cliente contou na conversa já vem preenchido; o Marcos confere,
// ajusta o que quiser (e desenha, nos poucos casos que exigem) e salva. Só aí
// nasce um orçamento — antes disso o rascunho não está no funil, não tem valor
// e não conta em métrica nenhuma.
//
// Dois avisos ficam visíveis ANTES de abrir, porque são eles que decidem se
// vale a pena abrir agora: o que falta e se precisa de desenho.

export default function RascunhosBot({ rascunhos, t, onAbrir, onDescartar, fmtPhone }) {
  const fila = ordenarRascunhos((rascunhos || []).filter((r) => r.status !== "descartado" && r.status !== "aproveitado"));
  if (fila.length === 0) return null;

  return (
    <div style={{ background: t.sectionBg, border: `1px solid ${t.cardBorder}`, borderRadius: "10px", padding: "10px", marginBottom: "12px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
        <span style={{ fontSize: "11px", fontWeight: "800", color: t.text }}>
          Rascunhos do Vini
        </span>
        <span style={{ fontSize: "9px", fontWeight: "800", background: "#0055a41f", color: "#0055a4", padding: "1px 6px", borderRadius: "10px" }}>
          {fila.length}
        </span>
        <span style={{ fontSize: "9px", color: t.textMuted, marginLeft: "auto" }}>
          preenchidos pela conversa · confira antes de salvar
        </span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        {fila.map((r) => {
          const nome = r.campos?.client?.name || (fmtPhone ? fmtPhone(r.telefone) : r.telefone);
          const completo = (r.completude ?? 0) >= 100;
          return (
            <div key={r.id} style={{ background: t.card, border: `1px solid ${t.cardBorder}`, borderRadius: "8px", padding: "8px 10px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                <span style={{ fontSize: "12px", fontWeight: "700", color: t.text }}>{nome}</span>

                <span title="Quanto dos campos que dependem do cliente já veio da conversa"
                  style={{
                    fontSize: "8.5px", fontWeight: "800", padding: "1px 5px", borderRadius: "4px",
                    background: completo ? "#16a34a1f" : "#f59e0b1f", color: completo ? "#16a34a" : "#f59e0b",
                  }}>
                  {r.completude ?? 0}%
                </span>

                {r.precisaDesenho && (
                  <span title="O formato não sai do cálculo paramétrico — vai precisar do seu desenho"
                    style={{ fontSize: "8.5px", fontWeight: "800", padding: "1px 5px", borderRadius: "4px", background: "#8b5cf61f", color: "#8b5cf6" }}>
                    precisa de desenho
                  </span>
                )}

                <span style={{ fontSize: "10px", color: t.textSec, marginLeft: "auto" }}>{resumoRascunho(r)}</span>
              </div>

              {r.faltando?.length > 0 && (
                <div style={{ fontSize: "9px", color: "#dc2626", marginTop: "4px" }}>
                  falta: {r.faltando.join(", ")}
                </div>
              )}
              {r.observacoes?.length > 0 && (
                <div style={{ fontSize: "9px", color: t.textMuted, marginTop: "3px", lineHeight: 1.5 }}>
                  {r.observacoes.slice(0, 2).map((o, i) => <div key={i}>{o}</div>)}
                </div>
              )}

              <div style={{ display: "flex", gap: "6px", marginTop: "7px" }}>
                <button onClick={() => onAbrir(r)}
                  style={{ flex: 1, padding: "5px", borderRadius: "6px", border: "none", background: "#0055a4", color: "#fff", fontSize: "10px", fontWeight: "700", cursor: "pointer" }}>
                  Abrir no editor
                </button>
                <button onClick={() => onDescartar(r)}
                  style={{ padding: "5px 10px", borderRadius: "6px", border: `1px solid ${t.cardBorder}`, background: "transparent", color: t.textSec, fontSize: "10px", cursor: "pointer" }}>
                  Descartar
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
