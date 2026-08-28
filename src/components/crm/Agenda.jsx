import React, { useState } from "react";
import {
  TIPOS, PERIODOS, agruparPorDia, rotuloData, situacao, resumo,
  outrosNaRegiao, hojeISO, REGIOES, regiao,
} from "../../services/agenda.js";

// Agenda de serviço — visita, instalação, entrega, manutenção.
//
// Marcação à mão, de propósito: o volume hoje é baixo e quem escolhe o dia é o
// Marcos. Nada aqui sugere horário, manda lembrete ou fala com o cliente.
//
// A tela é uma lista por dia, não um calendário mensal: numa semana com três
// compromissos, o mês inteiro em grade mostra 28 quadrados vazios e esconde o
// que importa. Atrasado vem sempre primeiro — é o único que cobra decisão hoje.

const COR_SITUACAO = {
  atrasado: "#dc2626",
  hoje: "#f59e0b",
  amanha: "#0055a4",
  futuro: "#64748b",
};

function Selo({ texto, cor, titulo }) {
  return (
    <span title={titulo} style={{
      fontSize: "8.5px", fontWeight: "800", color: cor, background: cor + "1f",
      padding: "1px 5px", borderRadius: "4px", whiteSpace: "nowrap",
    }}>{texto}</span>
  );
}

export default function Agenda({ agendamentos, hist, t, blue, onNovo, onMarcarFeito, onRemarcar, onCancelar, onAbrirLead }) {
  const [novo, setNovo] = useState(null); // formulário aberto
  const hoje = hojeISO();
  const dias = agruparPorDia(agendamentos, hoje);
  const r = resumo(agendamentos, hoje);

  const form = novo || { tipo: "visita", data: hoje, periodo: "manha", quoteId: "", obs: "" };
  const leadDoForm = (hist || []).find((q) => String(q.id) === String(form.quoteId));
  const cidadeForm = leadDoForm?.data?.client?.city || leadDoForm?.cC || "";
  const perto = cidadeForm ? outrosNaRegiao(cidadeForm, hist) : null;

  return (
    <div>
      {/* Resumo: só o que cobra ação */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "12px", flexWrap: "wrap" }}>
        {[
          ["Atrasados", r.atrasados, "#dc2626"],
          ["Hoje", r.hoje, "#f59e0b"],
          ["Próximos 7 dias", r.semana, blue],
          ["Em aberto", r.total, "#64748b"],
        ].map(([lb, val, cor]) => (
          <div key={lb} style={{ flex: "1 1 90px", background: t.card, border: `1px solid ${val > 0 && cor === "#dc2626" ? "#fecaca" : t.cardBorder}`, borderRadius: "8px", padding: "8px 10px" }}>
            <div style={{ fontSize: "17px", fontWeight: "800", color: val > 0 ? cor : t.textMuted }}>{val}</div>
            <div style={{ fontSize: "8.5px", color: t.textMuted, fontWeight: "700", textTransform: "uppercase", letterSpacing: ".4px" }}>{lb}</div>
          </div>
        ))}
        <button onClick={() => setNovo(form)}
          style={{ padding: "8px 14px", borderRadius: "8px", border: "none", background: blue, color: "#fff", fontSize: "11px", fontWeight: "700", cursor: "pointer" }}>
          + Agendar
        </button>
      </div>

      {/* Formulário — some depois de salvar */}
      {novo && (
        <div style={{ background: t.sectionBg, border: `1px solid ${t.cardBorder}`, borderRadius: "10px", padding: "12px", marginBottom: "12px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: "8px" }}>
            <label style={{ fontSize: "9px", color: t.textMuted, fontWeight: "700" }}>CLIENTE
              <select value={form.quoteId} onChange={(e) => setNovo({ ...form, quoteId: e.target.value })}
                style={{ width: "100%", marginTop: "3px", padding: "6px", borderRadius: "6px", border: `1.5px solid ${t.cardBorder}`, background: t.inputBg, color: t.text, fontSize: "11px" }}>
                <option value="">— escolha —</option>
                {(hist || []).filter((q) => !["perdido", "concluido"].includes(q.status))
                  .map((q) => <option key={q.id} value={q.id}>{q.cN || "sem nome"} · {q.data?.client?.city || q.cC || "?"}</option>)}
              </select>
            </label>
            <label style={{ fontSize: "9px", color: t.textMuted, fontWeight: "700" }}>TIPO
              <select value={form.tipo} onChange={(e) => setNovo({ ...form, tipo: e.target.value })}
                style={{ width: "100%", marginTop: "3px", padding: "6px", borderRadius: "6px", border: `1.5px solid ${t.cardBorder}`, background: t.inputBg, color: t.text, fontSize: "11px" }}>
                {Object.entries(TIPOS).map(([k, v]) => <option key={k} value={k}>{v.icon} {v.label}</option>)}
              </select>
            </label>
            <label style={{ fontSize: "9px", color: t.textMuted, fontWeight: "700" }}>DIA
              <input type="date" value={form.data} onChange={(e) => setNovo({ ...form, data: e.target.value })}
                style={{ width: "100%", marginTop: "3px", padding: "6px", borderRadius: "6px", border: `1.5px solid ${t.cardBorder}`, background: t.inputBg, color: t.text, fontSize: "11px" }} />
            </label>
            <label style={{ fontSize: "9px", color: t.textMuted, fontWeight: "700" }}>PERÍODO
              <select value={form.periodo} onChange={(e) => setNovo({ ...form, periodo: e.target.value })}
                style={{ width: "100%", marginTop: "3px", padding: "6px", borderRadius: "6px", border: `1.5px solid ${t.cardBorder}`, background: t.inputBg, color: t.text, fontSize: "11px" }}>
                {Object.entries(PERIODOS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </label>
          </div>

          <input value={form.obs} onChange={(e) => setNovo({ ...form, obs: e.target.value })}
            placeholder="Observação (opcional): levar amostra, portão dos fundos, confirmar com o caseiro…"
            style={{ width: "100%", marginTop: "8px", padding: "7px 9px", borderRadius: "6px", border: `1.5px solid ${t.cardBorder}`, background: t.inputBg, color: t.text, fontSize: "11px" }} />

          {/* A semente do agrupamento por rota: só informa, não decide nada. */}
          {perto && (perto.cidade > 1 || perto.regiao > 0) && (
            <div style={{ marginTop: "8px", fontSize: "10px", color: "#0055a4", background: "#0055a41a", padding: "6px 9px", borderRadius: "6px" }}>
              📍 Nessa viagem: <b>{perto.cidade}</b> {perto.cidade === 1 ? "cliente" : "clientes"} em {cidadeForm}
              {perto.regiao > 0 && <> e mais <b>{perto.regiao}</b> {perto.nomeRegiao ? `n${perto.nomeRegiao.startsWith("Vale") ? "o" : "a"} ${perto.nomeRegiao}` : "por perto"}</>} esperando.
            </div>
          )}

          <div style={{ display: "flex", gap: "6px", marginTop: "9px" }}>
            <button onClick={() => { if (form.quoteId) { onNovo(form); setNovo(null); } }}
              disabled={!form.quoteId}
              style={{ padding: "7px 14px", borderRadius: "7px", border: "none", background: form.quoteId ? blue : t.cardBorder, color: "#fff", fontSize: "11px", fontWeight: "700", cursor: form.quoteId ? "pointer" : "not-allowed" }}>
              Salvar
            </button>
            <button onClick={() => setNovo(null)}
              style={{ padding: "7px 14px", borderRadius: "7px", border: `1.5px solid ${t.cardBorder}`, background: "transparent", color: t.textSec, fontSize: "11px", cursor: "pointer" }}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Lista por dia */}
      {dias.length === 0 ? (
        <div style={{ textAlign: "center", padding: "28px", color: t.textMuted }}>
          <div style={{ fontSize: "32px" }}>📅</div>
          <div style={{ fontSize: "12px", marginTop: "6px" }}>Nenhum compromisso marcado.</div>
        </div>
      ) : dias.map((dia) => (
        <div key={dia.data} style={{ marginBottom: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "7px", marginBottom: "5px" }}>
            <span style={{ fontSize: "11px", fontWeight: "800", color: dia.atrasado ? "#dc2626" : t.text }}>
              {rotuloData(dia.data)}
            </span>
            {dia.atrasado && <Selo texto={`${Math.abs(dia.dias)}d atrás`} cor="#dc2626" titulo="Passou e ninguém resolveu" />}
            {dia.dias === 0 && <Selo texto="HOJE" cor="#f59e0b" />}
            {dia.dias === 1 && <Selo texto="amanhã" cor="#0055a4" />}
            <span style={{ flex: 1, height: "1px", background: t.cardBorder }} />
          </div>

          {dia.itens.map((a) => {
            const tipo = TIPOS[a.tipo] || TIPOS.visita;
            const sit = situacao(a, hoje);
            return (
              <div key={a.id} style={{ background: t.card, border: `1px solid ${sit === "atrasado" ? "#fecaca" : t.cardBorder}`, borderRadius: "8px", padding: "8px 10px", marginBottom: "5px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                  <span style={{ fontSize: "13px" }}>{tipo.icon}</span>
                  <span style={{ fontSize: "12px", fontWeight: "700", color: t.text, cursor: onAbrirLead ? "pointer" : "default" }}
                    onClick={() => onAbrirLead && onAbrirLead(a.quoteId)}>
                    {a.cliente || "sem nome"}
                  </span>
                  <Selo texto={tipo.label} cor={tipo.cor} />
                  <span style={{ fontSize: "10px", color: t.textSec }}>{PERIODOS[a.periodo] || ""}</span>
                  <span style={{ fontSize: "10px", color: t.textMuted, marginLeft: "auto" }}>
                    {a.cidade || "—"}{a.cidade ? ` · ${REGIOES[regiao(a.cidade)] || ""}` : ""}
                  </span>
                </div>
                {a.obs && <div style={{ fontSize: "10px", color: t.textMuted, marginTop: "3px" }}>{a.obs}</div>}
                <div style={{ display: "flex", gap: "5px", marginTop: "7px" }}>
                  <button onClick={() => onMarcarFeito(a)}
                    style={{ padding: "4px 10px", borderRadius: "6px", border: "none", background: "#16a34a", color: "#fff", fontSize: "10px", fontWeight: "700", cursor: "pointer" }}>
                    Feito
                  </button>
                  <input type="date" defaultValue={a.data} onChange={(e) => e.target.value && onRemarcar(a, e.target.value)}
                    title="Remarcar para outro dia"
                    style={{ padding: "3px 6px", borderRadius: "6px", border: `1.5px solid ${t.cardBorder}`, background: t.inputBg, color: t.textSec, fontSize: "10px" }} />
                  <button onClick={() => onCancelar(a)}
                    style={{ padding: "4px 10px", borderRadius: "6px", border: `1.5px solid ${t.cardBorder}`, background: "transparent", color: t.textSec, fontSize: "10px", cursor: "pointer", marginLeft: "auto" }}>
                    Cancelar
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
