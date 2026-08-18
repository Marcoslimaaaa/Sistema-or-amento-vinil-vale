import React, { useState } from "react";
import { analisarConversa } from "../../services/wa.js";

// "Onde parou com esse cliente?" respondido sem reler a conversa.
//
// O card do lead mostra nome, valor e etapa. O que foi combinado — o que ele
// achou caro, o que pediu, o que ficou de mandar — está em dezenas de
// mensagens. Aqui um clique traz o resumo, a próxima ação e, quando a conversa
// mostra desistência, o motivo já classificado.
//
// ⚠️ CADA CLIQUE CUSTA. Por isso é botão, e não algo que roda ao abrir a tela:
// abrir o CRM com 170 leads dispararia 170 chamadas pagas. O resultado também
// não é guardado — a conversa muda, e resumo velho em cache mente com
// aparência de verdade.

const COR_TEMP = { quente: "#dc2626", morno: "#f59e0b", frio: "#0891b2" };
const LABEL_TEMP = { quente: "🔥 Quente", morno: "🌡️ Morno", frio: "🧊 Frio" };

const LABEL_MOTIVO = {
  preco: "Preço", prazo: "Prazo", concorrente: "Foi para o concorrente",
  fora_de_area: "Fora da área de atendimento", desistiu: "Desistiu ou adiou",
  sem_resposta: "Sumiu sem dizer nada", nao_perdido: null,
};
const LABEL_CONF = { alta: "leitura clara", media: "leitura provável", baixa: "dedução do silêncio" };

export default function AnaliseConversa({ q, temConversa, t }) {
  const [estado, setEstado] = useState("parado"); // parado | carregando | pronto | erro
  const [analise, setAnalise] = useState(null);
  const [erro, setErro] = useState("");

  const rodar = async () => {
    setEstado("carregando"); setErro("");
    const r = await analisarConversa(q.data?.client?.phone || "", { valor: q.tot });
    if (!r.ok) { setErro(r.erro || "Não consegui analisar."); setEstado("erro"); return; }
    setAnalise(r.analise); setEstado("pronto");
  };

  if (!temConversa) return null;

  if (estado !== "pronto") {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
        <button
          onClick={rodar}
          disabled={estado === "carregando"}
          title="Lê a conversa e resume onde o atendimento parou"
          style={{
            fontSize: "9px", fontWeight: "700", padding: "5px 10px", borderRadius: "6px",
            border: `1px solid ${t.cardBorder}`, background: "transparent",
            color: estado === "carregando" ? t.textMuted : "#8b5cf6",
            cursor: estado === "carregando" ? "wait" : "pointer",
          }}
        >
          {estado === "carregando" ? "Lendo a conversa..." : "✨ Resumir conversa"}
        </button>
        {erro && <span style={{ fontSize: "9px", color: "#dc2626" }}>{erro}</span>}
      </div>
    );
  }

  const motivo = LABEL_MOTIVO[analise.motivo_perda];

  return (
    <div style={{ background: t.sectionBg, border: `1px solid ${t.cardBorder}`, borderLeft: "3px solid #8b5cf6", borderRadius: "7px", padding: "9px 11px", marginBottom: "8px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "5px" }}>
        <span style={{ fontSize: "8.5px", fontWeight: "800", textTransform: "uppercase", letterSpacing: ".4px", color: t.textMuted }}>Leitura da conversa</span>
        <span style={{ fontSize: "8.5px", fontWeight: "800", color: COR_TEMP[analise.temperatura] }}>{LABEL_TEMP[analise.temperatura]}</span>
        <button onClick={rodar} title="Ler de novo (nova chamada paga)" style={{ marginLeft: "auto", fontSize: "8.5px", background: "none", border: "none", color: t.textMuted, cursor: "pointer" }}>↻</button>
      </div>

      <div style={{ fontSize: "10px", color: t.text, lineHeight: 1.55 }}>{analise.resumo}</div>

      {analise.proxima_acao && (
        <div style={{ fontSize: "9.5px", color: t.text, marginTop: "6px", padding: "5px 7px", background: t.card, borderRadius: "5px", border: `1px solid ${t.cardBorder}` }}>
          <b style={{ color: "#8b5cf6" }}>Agora:</b> {analise.proxima_acao}
        </div>
      )}

      {/* O motivo de perda só aparece quando a conversa mostra perda. É este
          campo que enche a aba Perdas, que vivia vazia por depender de alguém
          digitar. A confiança vai junto de propósito: "dedução do silêncio" não
          pode ser lida como o cliente tendo dito alguma coisa. */}
      {motivo && (
        <div style={{ fontSize: "9px", color: "#dc2626", marginTop: "6px", fontWeight: "700" }}>
          Possível perda: {motivo}
          <span style={{ fontWeight: "500", color: t.textMuted }}> · {LABEL_CONF[analise.confianca_motivo]}</span>
        </div>
      )}

      {analise.sinais?.length > 0 && (
        <div style={{ marginTop: "5px", display: "flex", flexWrap: "wrap", gap: "3px" }}>
          {analise.sinais.map((s, i) => (
            <span key={i} style={{ fontSize: "8px", color: t.textSec, background: t.card, border: `1px solid ${t.cardBorder}`, borderRadius: "8px", padding: "2px 6px" }}>“{s}”</span>
          ))}
        </div>
      )}

      <div style={{ fontSize: "7.5px", color: t.textMuted, marginTop: "6px" }}>
        Leitura automática da conversa — confira antes de decidir.
      </div>
    </div>
  );
}
