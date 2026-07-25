import React, { useEffect, useState } from "react";
import { REGUA } from "./regua";
import { getRescueMsg } from "../rescue/RescueModal";
import { sendWA } from "../../services/wa.js";

// "Tarefas de Hoje" — transforma o badge de follow-up em lista acionável:
// quem contatar hoje, por quê, e envio em 1 clique. O envio passa pela camada
// única (services/wa.js): usa o bot quando está conectado, wa.me quando não.

const toISO = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export default function TodayTasks({ hist, getDays, fmt, t, blue, crmNextContact, setNextContact, addInteracao, onResumo }) {
  const [expanded, setExpanded] = useState(true);
  const [showAll, setShowAll] = useState(false);

  const today = new Date(); today.setHours(0, 0, 0, 0);

  const tasks = hist
    .filter((q) => !["fechou", "execucao", "concluido", "perdido"].includes(q.status || "lead"))
    .map((q) => {
      const days = getDays(q.id);
      const nc = crmNextContact[q.id];
      let scheduled = null;
      if (nc) {
        const p = nc.split("-");
        const d = new Date(p[0], p[1] - 1, p[2]);
        if (d <= today) scheduled = d < today ? "atrasado" : "hoje";
      }
      const needsUp = days >= REGUA.followUp && days < REGUA.desconhecido;
      if (!scheduled && !needsUp) return null;
      const valor = parseFloat(q.tot) || 0;
      // prioridade: agendado atrasado > agendado hoje > follow-up; dentro do grupo, valor × tempo parado
      const groupW = scheduled === "atrasado" ? 2e9 : scheduled === "hoje" ? 1e9 : 0;
      return { q, days, valor, scheduled, score: groupW + valor * (1 + Math.min(days, 60) / 10) };
    })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score);

  // Resumo do dia por notificação (o próprio serviço garante 1x por dia)
  useEffect(() => { if (onResumo) onResumo(tasks.length); }, [tasks.length, onResumo]);

  if (tasks.length === 0) return (
    <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "8px", padding: "8px 12px", marginBottom: "10px", fontSize: "10px", fontWeight: "700", color: "#16a34a" }}>
      ✅ Nenhum follow-up pendente hoje — pipeline em dia!
    </div>
  );

  const visible = showAll ? tasks : tasks.slice(0, 6);

  const doneFollowUp = (q) => {
    // reagenda o próximo contato automaticamente (cadência)
    const next = new Date(); next.setDate(next.getDate() + REGUA.followUp);
    setNextContact(q.id, toISO(next));
  };

  // Passa pela camada única: usa o bot quando ele está conectado e cai no
  // wa.me quando não está. Registra a interação só em envio confirmado.
  const sendWa = async (task) => {
    const phone = task.q.data?.client?.phone || "";
    const name = (task.q.cN || "").split(" ")[0];
    const r = await sendWA({ phone, text: getRescueMsg(task.days, name) });
    if (!r.ok) { alert(r.erro || "Não foi possível enviar."); return; }
    addInteracao(
      task.q.id,
      "whatsapp",
      r.canal === "wa.me" ? "Follow-up enviado (Tarefas de Hoje)" : "Follow-up enviado pelo sistema (Tarefas de Hoje)"
    );
    doneFollowUp(task.q);
  };

  const markDone = (task) => {
    addInteracao(task.q.id, "nota", "Contato feito (Tarefas de Hoje)");
    doneFollowUp(task.q);
  };

  const postpone = (task) => {
    const next = new Date(); next.setDate(next.getDate() + 3);
    setNextContact(task.q.id, toISO(next));
  };

  return (
    <div style={{ background: t.sectionBg, border: `1px solid ${t.cardBorder}`, borderLeft: "3px solid #dc2626", borderRadius: "8px", marginBottom: "12px", overflow: "hidden" }}>
      <button onClick={() => setExpanded((p) => !p)} style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 12px", background: "transparent", border: "none", cursor: "pointer" }}>
        <span style={{ fontSize: "11px", fontWeight: "800", color: t.text }}>📋 Tarefas de Hoje <span style={{ background: "#dc2626", color: "#fff", borderRadius: "9px", padding: "1px 7px", fontSize: "9px", marginLeft: "4px" }}>{tasks.length}</span></span>
        <span style={{ fontSize: "10px", color: t.textMuted }}>{expanded ? "▲" : "▼"}</span>
      </button>
      {expanded && (
        <div style={{ padding: "0 8px 8px", display: "flex", flexDirection: "column", gap: "4px" }}>
          {visible.map((task) => {
            const { q, days, valor, scheduled } = task;
            const reason = scheduled === "atrasado" ? { txt: "⏰ Contato atrasado", color: "#dc2626" }
              : scheduled === "hoje" ? { txt: "📅 Agendado p/ hoje", color: "#f59e0b" }
              : { txt: `🔔 ${days}d sem contato`, color: days >= REGUA.resgate.urgente ? "#dc2626" : "#f97316" };
            const hasPhone = !!(q.data?.client?.phone || "").replace(/\D/g, "");
            return (
              <div key={q.id} style={{ display: "flex", alignItems: "center", gap: "8px", background: t.card, border: `1px solid ${t.cardBorder}`, borderRadius: "7px", padding: "7px 10px" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "11px", fontWeight: "700", color: t.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{q.cN || "Sem nome"} <span style={{ fontWeight: "600", color: t.textMuted, fontSize: "9px" }}>· {fmt(valor)}</span></div>
                  <div style={{ fontSize: "8.5px", fontWeight: "700", color: reason.color }}>{reason.txt}{q.data?.client?.city ? ` · ${q.data.client.city}` : ""}</div>
                </div>
                <button title={hasPhone ? "Enviar follow-up via WhatsApp" : "Sem telefone cadastrado"} onClick={() => sendWa(task)} disabled={!hasPhone} style={{ fontSize: "9px", fontWeight: "700", padding: "5px 9px", borderRadius: "6px", border: "none", background: hasPhone ? "#25d366" : t.cardBorder, color: "#fff", cursor: hasPhone ? "pointer" : "not-allowed", whiteSpace: "nowrap" }}>💬 Enviar</button>
                <button title="Já falei com o cliente por outro meio" onClick={() => markDone(task)} style={{ fontSize: "9px", fontWeight: "700", padding: "5px 8px", borderRadius: "6px", border: `1px solid ${t.cardBorder}`, background: "transparent", color: "#16a34a", cursor: "pointer" }}>✓ Feito</button>
                <button title="Adiar 3 dias" onClick={() => postpone(task)} style={{ fontSize: "9px", fontWeight: "700", padding: "5px 8px", borderRadius: "6px", border: `1px solid ${t.cardBorder}`, background: "transparent", color: t.textMuted, cursor: "pointer" }}>+3d</button>
              </div>
            );
          })}
          {tasks.length > 6 && (
            <button onClick={() => setShowAll((p) => !p)} style={{ fontSize: "9px", fontWeight: "700", padding: "5px", borderRadius: "6px", border: "none", background: "transparent", color: blue, cursor: "pointer" }}>
              {showAll ? "Mostrar menos" : `Ver todas as ${tasks.length} tarefas`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
