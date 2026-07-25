import React from "react";
import { horasRestantesDaJanela, dentroDaJanela } from "../../services/janela.js";

// Painel do lead dentro da conversa do WhatsApp.
//
// Antes, a aba WhatsApp era um espelho do WhatsApp Web sem nenhuma ligação com
// a venda: para saber o valor do orçamento ou mover a etapa era preciso sair da
// conversa, achar o lead no pipeline e voltar. Aqui o contexto e as ações ficam
// ao lado da conversa.

const PIPE_LABEL = {
  lead: "Lead", orcamento: "Orçamento", negociacao: "Negociação",
  fechou: "Fechou", execucao: "Execução", concluido: "Concluído", perdido: "Perdido",
};

export default function LeadNoChat({
  lead, conv, t, fmt, dias, canalOficial,
  onAbrirLead, onMover, onEnviarOrcamento, onVincular, candidatos,
}) {
  // Sem lead vinculado: oferece vincular a um orçamento existente
  if (!lead) {
    return (
      <div style={{ padding: "12px", borderLeft: `1px solid ${t.cardBorder}`, background: t.sectionBg, width: "230px", flexShrink: 0, fontSize: "11px", color: t.textSec }}>
        <div style={{ fontWeight: "800", color: t.text, marginBottom: "6px", fontSize: "11px" }}>Sem orçamento vinculado</div>
        <div style={{ fontSize: "10px", lineHeight: 1.5, marginBottom: "10px" }}>
          Esta conversa não está ligada a nenhum orçamento, então não entra no funil nem na régua de follow-up.
        </div>
        {candidatos?.length > 0 && (
          <>
            <div style={{ fontSize: "9px", fontWeight: "700", textTransform: "uppercase", letterSpacing: ".5px", marginBottom: "4px" }}>Mesmo telefone</div>
            {candidatos.map((c) => (
              <button key={c.id} onClick={() => onVincular(c.id)} style={{ display: "block", width: "100%", textAlign: "left", padding: "6px 8px", marginBottom: "4px", borderRadius: "6px", border: `1px solid ${t.cardBorder}`, background: t.card, color: t.text, fontSize: "10px", cursor: "pointer" }}>
                <b>{c.cN || "Sem nome"}</b><br />
                <span style={{ color: t.textMuted }}>{fmt(parseFloat(c.tot) || 0)}</span>
              </button>
            ))}
          </>
        )}
      </div>
    );
  }

  const etapa = lead.status || "lead";
  const valor = parseFloat(lead.tot) || 0;
  const horas = horasRestantesDaJanela(conv);
  const aberta = dentroDaJanela(conv);

  return (
    <div style={{ padding: "12px", borderLeft: `1px solid ${t.cardBorder}`, background: t.sectionBg, width: "230px", flexShrink: 0, overflowY: "auto" }}>
      <button onClick={() => onAbrirLead(lead)} style={{ display: "block", width: "100%", textAlign: "left", background: "none", border: "none", padding: 0, cursor: "pointer", marginBottom: "10px" }}>
        <div style={{ fontSize: "12px", fontWeight: "800", color: t.text }}>{lead.cN || "Sem nome"}</div>
        <div style={{ fontSize: "9px", color: t.textMuted }}>{lead.data?.client?.city || lead.cC || "Cidade não informada"}</div>
      </button>

      <div style={{ background: "linear-gradient(135deg,#0055a4,#003d7a)", color: "#fff", borderRadius: "8px", padding: "10px", marginBottom: "10px" }}>
        <div style={{ fontSize: "8px", opacity: 0.75, textTransform: "uppercase", letterSpacing: ".5px", fontWeight: "700" }}>Valor do orçamento</div>
        <div style={{ fontSize: "17px", fontWeight: "800" }}>{fmt(valor)}</div>
      </div>

      <Linha t={t} rotulo="Etapa" valor={PIPE_LABEL[etapa] || etapa} />
      <Linha t={t} rotulo="Sem contato" valor={dias >= 900 ? "sem referência" : `${dias} dia${dias === 1 ? "" : "s"}`} destaque={dias >= 5} />

      {/* Janela de 24h: só faz diferença com a Cloud API oficial ligada */}
      {canalOficial && (
        <div style={{ marginTop: "8px", padding: "7px 9px", borderRadius: "7px", background: aberta ? "#dcfce7" : "#fef3c7", border: `1px solid ${aberta ? "#16a34a33" : "#d9770633"}` }}>
          <div style={{ fontSize: "9px", fontWeight: "800", color: aberta ? "#16a34a" : "#d97706" }}>
            {aberta ? `Janela aberta · ${horas}h` : "Fora da janela de 24h"}
          </div>
          <div style={{ fontSize: "8.5px", color: t.textSec, marginTop: "2px", lineHeight: 1.4 }}>
            {aberta ? "Pode mandar mensagem livre." : "Só template aprovado inicia a conversa."}
          </div>
        </div>
      )}

      <div style={{ marginTop: "12px", display: "flex", flexDirection: "column", gap: "5px" }}>
        <button onClick={() => onEnviarOrcamento(lead)} style={botao("#128c7e")}>📄 Enviar orçamento</button>
        <select
          value=""
          onChange={(e) => { if (e.target.value) onMover(lead.id, e.target.value); e.target.value = ""; }}
          style={{ padding: "6px", borderRadius: "6px", border: `1px solid ${t.cardBorder}`, background: t.inputBg, color: t.text, fontSize: "10px", cursor: "pointer" }}
        >
          <option value="">Mover de etapa...</option>
          {Object.entries(PIPE_LABEL).filter(([k]) => k !== etapa).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <button onClick={() => onAbrirLead(lead)} style={botao("transparent", t.textSec, t.cardBorder)}>Abrir no CRM</button>
      </div>
    </div>
  );
}

const Linha = ({ t, rotulo, valor, destaque }) => (
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 0", borderBottom: `1px solid ${t.cardBorder}` }}>
    <span style={{ fontSize: "9px", color: t.textMuted, fontWeight: "600" }}>{rotulo}</span>
    <span style={{ fontSize: "10px", fontWeight: "700", color: destaque ? "#dc2626" : t.text }}>{valor}</span>
  </div>
);

const botao = (bg, cor = "#fff", borda) => ({
  padding: "7px", borderRadius: "6px", border: borda ? `1px solid ${borda}` : "none",
  background: bg, color: cor, fontSize: "10px", fontWeight: "700", cursor: "pointer",
});
