import React, { useState } from "react";

// Barra de revisão da classificação automática de etapa.
//
// O motor (services/etapaAuto.js) deduz a etapa de cada lead a partir do que o
// sistema já sabe. Aqui isso vira uma coisa só na tela: "N leads estão na
// coluna errada — arrumar".
//
// DUAS LISTAS, DE PROPÓSITO
//   automáticas — não disparam nada para o cliente. Um botão resolve todas.
//   revisar     — mover dispara mensagem ao cliente, lança receita no
//                 financeiro ou marca alguém como perdido. Uma a uma, com o
//                 motivo escrito e o efeito colateral avisado antes.
//
// O interruptor "arrumar sozinho" aplica as automáticas assim que a base
// carrega, sem clique. Ele começa DESLIGADO: a primeira passada mexe em toda a
// base de uma vez, e isso o Marcos precisa ver acontecer antes de delegar.

const CORES = {
  orcamento: "#3b82f6", negociacao: "#8b5cf6",
  fechou: "#16a34a", perdido: "#dc2626", lead: "#f59e0b",
};
const LABEL = {
  lead: "Lead", orcamento: "Orçamento", negociacao: "Negociação",
  fechou: "Fechou", perdido: "Perdido",
};

export default function RevisaoEtapas({
  automaticas, revisar, t, fmt, onAplicar, onAplicarTodas, onIgnorar,
  auto, setAuto,
}) {
  const [aberto, setAberto] = useState(false);
  const total = automaticas.length + revisar.length;

  if (total === 0) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "8px", padding: "8px 12px", marginBottom: "10px" }}>
        <span style={{ fontSize: "10px", fontWeight: "700", color: "#16a34a" }}>✅ Funil em dia — nenhum lead na coluna errada</span>
        <Interruptor auto={auto} setAuto={setAuto} t={t} />
      </div>
    );
  }

  return (
    <div style={{ background: t.sectionBg, border: `1px solid ${t.cardBorder}`, borderLeft: "3px solid #8b5cf6", borderRadius: "8px", marginBottom: "12px", overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "9px 12px" }}>
        <button onClick={() => setAberto((p) => !p)} style={{ flex: 1, display: "flex", alignItems: "center", gap: "6px", background: "transparent", border: "none", cursor: "pointer", padding: 0, textAlign: "left" }}>
          <span style={{ fontSize: "11px", fontWeight: "800", color: t.text }}>
            🎯 Etapas a ajustar
            <span style={{ background: "#8b5cf6", color: "#fff", borderRadius: "9px", padding: "1px 7px", fontSize: "9px", marginLeft: "5px" }}>{total}</span>
          </span>
          <span style={{ fontSize: "9px", color: t.textMuted }}>
            {automaticas.length > 0 && `${automaticas.length} sem risco`}
            {automaticas.length > 0 && revisar.length > 0 && " · "}
            {revisar.length > 0 && `${revisar.length} para conferir`}
          </span>
          <span style={{ fontSize: "10px", color: t.textMuted, marginLeft: "auto" }}>{aberto ? "▲" : "▼"}</span>
        </button>
        {automaticas.length > 0 && (
          <button onClick={onAplicarTodas} style={{ fontSize: "9px", fontWeight: "800", padding: "6px 11px", borderRadius: "6px", border: "none", background: "#8b5cf6", color: "#fff", cursor: "pointer", whiteSpace: "nowrap" }}>
            Arrumar {automaticas.length}
          </button>
        )}
      </div>

      {aberto && (
        <div style={{ padding: "0 8px 8px", display: "flex", flexDirection: "column", gap: "4px" }}>
          {automaticas.length > 0 && (
            <Secao t={t} titulo="Sem risco — nada é enviado ao cliente" />
          )}
          {automaticas.map((item) => (
            <Linha key={item.q.id} item={item} t={t} fmt={fmt} onAplicar={onAplicar} onIgnorar={onIgnorar} />
          ))}

          {revisar.length > 0 && (
            <Secao t={t} titulo="Confira antes — mover tem efeito fora do CRM" alerta />
          )}
          {revisar.map((item) => (
            <Linha key={item.q.id} item={item} t={t} fmt={fmt} onAplicar={onAplicar} onIgnorar={onIgnorar} />
          ))}

          <div style={{ paddingTop: "6px", borderTop: `1px solid ${t.cardBorder}`, marginTop: "2px" }}>
            <Interruptor auto={auto} setAuto={setAuto} t={t} />
          </div>
        </div>
      )}
    </div>
  );
}

const Secao = ({ t, titulo, alerta }) => (
  <div style={{ fontSize: "8.5px", fontWeight: "800", textTransform: "uppercase", letterSpacing: ".5px", color: alerta ? "#d97706" : t.textMuted, padding: "6px 4px 2px" }}>
    {alerta ? "⚠️ " : ""}{titulo}
  </div>
);

const Linha = ({ item, t, fmt, onAplicar, onIgnorar }) => {
  const { q, etapa, de, motivo, aviso } = item;
  const valor = parseFloat(q.tot) || 0;
  return (
    <div style={{ background: t.card, border: `1px solid ${t.cardBorder}`, borderRadius: "7px", padding: "7px 10px", display: "flex", alignItems: "center", gap: "8px" }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: "11px", fontWeight: "700", color: t.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {q.cN || "Sem nome"}
          <span style={{ fontWeight: "600", color: t.textMuted, fontSize: "9px" }}> · {fmt(valor)}</span>
        </div>
        <div style={{ fontSize: "8.5px", color: t.textSec, marginTop: "1px" }}>
          <b style={{ color: CORES[de] || t.textMuted }}>{LABEL[de] || de}</b>
          <span style={{ color: t.textMuted }}> → </span>
          <b style={{ color: CORES[etapa] }}>{LABEL[etapa] || etapa}</b>
          <span style={{ color: t.textMuted }}> · {motivo}</span>
        </div>
        {aviso && (
          <div style={{ fontSize: "8px", color: "#d97706", marginTop: "2px", lineHeight: 1.4 }}>⚠️ {aviso}</div>
        )}
      </div>
      <button onClick={() => onAplicar(item)} style={{ fontSize: "9px", fontWeight: "700", padding: "5px 10px", borderRadius: "6px", border: "none", background: CORES[etapa], color: "#fff", cursor: "pointer", whiteSpace: "nowrap" }}>
        Mover
      </button>
      <button title="Não mexer neste lead" onClick={() => onIgnorar(item)} style={{ fontSize: "9px", fontWeight: "700", padding: "5px 8px", borderRadius: "6px", border: `1px solid ${t.cardBorder}`, background: "transparent", color: t.textMuted, cursor: "pointer" }}>
        Ignorar
      </button>
    </div>
  );
};

const Interruptor = ({ auto, setAuto, t }) => (
  <button
    onClick={() => setAuto(!auto)}
    title="Aplica sozinho só o que não dispara nada para o cliente. Perdido e Fechou continuam pedindo confirmação."
    style={{ display: "flex", alignItems: "center", gap: "6px", background: "transparent", border: "none", cursor: "pointer", padding: "2px 4px" }}
  >
    <span style={{ width: "26px", height: "15px", borderRadius: "8px", background: auto ? "#8b5cf6" : t.cardBorder, position: "relative", transition: "background .2s", flexShrink: 0 }}>
      <span style={{ position: "absolute", top: "2px", left: auto ? "13px" : "2px", width: "11px", height: "11px", borderRadius: "50%", background: "#fff", transition: "left .2s" }} />
    </span>
    <span style={{ fontSize: "9px", fontWeight: "700", color: auto ? "#8b5cf6" : t.textMuted }}>
      Arrumar sozinho{auto ? "" : " (desligado)"}
    </span>
  </button>
);
