import React, { useState, useMemo } from "react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { MOTIVOS_PERDA } from "../rescue/LostReasonModal";

const fmt = (v) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

const PERIODOS = [
  { id: "30d", label: "30 dias", days: 30 },
  { id: "90d", label: "90 dias", days: 90 },
  { id: "6m", label: "6 meses", days: 180 },
  { id: "1a", label: "1 ano", days: 365 },
  { id: "tudo", label: "Tudo", days: Infinity },
];

const PIE_COLORS = ["#dc2626", "#f97316", "#f59e0b", "#8b5cf6", "#64748b", "#06b6d4"];

const getInsights = (motivos, total) => {
  if (total === 0) return [];
  const insights = [];
  motivos.forEach((m) => {
    const pct = Math.round((m.count / total) * 100);
    if (m.id === "caro" && pct > 30) insights.push({ icon: "\ud83d\udcb8", text: `${pct}% dos leads acham caro. Considere revisar a precifica\u00e7\u00e3o ou criar pacotes com op\u00e7\u00f5es mais acess\u00edveis.` });
    if (m.id === "concorrente" && pct > 30) insights.push({ icon: "\ud83e\udd1d", text: `${pct}% fecharam com concorrentes. Mapeie os concorrentes e identifique seus diferenciais.` });
    if (m.id === "depois" && pct > 30) insights.push({ icon: "\u23f3", text: `${pct}% querem fazer depois. Ofere\u00e7a condi\u00e7\u00f5es de financiamento ou parcelamento estendido.` });
    if (m.id === "sem_retorno" && pct > 40) insights.push({ icon: "\ud83d\udd07", text: `${pct}% n\u00e3o responderam. Acelere o primeiro contato e fa\u00e7a follow-ups mais r\u00e1pidos.` });
    if (m.id === "mudou" && pct > 25) insights.push({ icon: "\ud83d\udd04", text: `${pct}% mudaram de ideia. Invista em conte\u00fado que reforce o valor da piscina.` });
  });
  return insights;
};

export default function LossAnalysis({ hist, interacoes, t, blue }) {
  const [periodo, setPeriodo] = useState("tudo");

  const data = useMemo(() => {
    const periodoConfig = PERIODOS.find((p) => p.id === periodo);
    const cutoff = periodoConfig.days === Infinity ? 0 : Date.now() - periodoConfig.days * 86400000;

    const perdidos = hist.filter((q) => {
      if (q.status !== "perdido") return false;
      if (cutoff === 0) return true;
      const ts = q.dataMotivoPerda ? new Date(q.dataMotivoPerda).getTime() : (q.id || 0);
      return ts >= cutoff;
    });

    const totalPerdido = perdidos.reduce((s, q) => s + (parseFloat(q.tot) || 0), 0);
    const ticketMedio = perdidos.length > 0 ? totalPerdido / perdidos.length : 0;

    // Count rescues: leads that were "perdido" and came back (have follow-up interactions after loss)
    let resgatados = 0;
    perdidos.forEach((q) => {
      const ints = interacoes[q.id] || [];
      const hasFollowUp = ints.some((i) => i.tipo === "whatsapp" && i.texto?.includes("resgate"));
      if (hasFollowUp) resgatados++;
    });
    const taxaResgate = perdidos.length > 0 ? Math.round((resgatados / perdidos.length) * 100) : 0;

    // Group by motivo
    const motivoMap = {};
    MOTIVOS_PERDA.forEach((m) => { motivoMap[m.id] = { ...m, count: 0, valor: 0 }; });
    // "sem_motivo" for old leads without reason
    motivoMap["sem_motivo"] = { id: "sem_motivo", icon: "\u2753", label: "Sem motivo registrado", count: 0, valor: 0 };

    perdidos.forEach((q) => {
      const mid = q.motivoId || "sem_motivo";
      if (!motivoMap[mid]) motivoMap[mid] = { id: mid, icon: "\u2753", label: mid, count: 0, valor: 0 };
      motivoMap[mid].count++;
      motivoMap[mid].valor += parseFloat(q.tot) || 0;
    });

    const motivos = Object.values(motivoMap).filter((m) => m.count > 0).sort((a, b) => b.count - a.count);

    // Pie data
    const pieData = motivos.map((m) => ({ name: m.label, value: m.count }));

    // Bar chart: losses per month
    const monthMap = {};
    perdidos.forEach((q) => {
      const ts = q.dataMotivoPerda ? new Date(q.dataMotivoPerda) : new Date(parseInt(q.id) || Date.now());
      const key = `${ts.getFullYear()}-${String(ts.getMonth() + 1).padStart(2, "0")}`;
      const label = `${String(ts.getMonth() + 1).padStart(2, "0")}/${ts.getFullYear()}`;
      if (!monthMap[key]) monthMap[key] = { key, label, count: 0, valor: 0 };
      monthMap[key].count++;
      monthMap[key].valor += parseFloat(q.tot) || 0;
    });
    const barData = Object.values(monthMap).sort((a, b) => a.key.localeCompare(b.key)).slice(-12);

    const insights = getInsights(motivos, perdidos.length);

    return { perdidos, totalPerdido, ticketMedio, taxaResgate, resgatados, motivos, pieData, barData, insights };
  }, [hist, interacoes, periodo]);

  return (
    <div>
      {/* Period filter */}
      <div style={{ display: "flex", gap: "4px", marginBottom: "14px", flexWrap: "wrap" }}>
        {PERIODOS.map((p) => (
          <button
            key={p.id}
            onClick={() => setPeriodo(p.id)}
            style={{
              padding: "5px 10px", borderRadius: "6px", fontSize: "9px", fontWeight: "700", cursor: "pointer",
              border: `1.5px solid ${periodo === p.id ? "#dc2626" : t.cardBorder}`,
              background: periodo === p.id ? "#fef2f2" : "transparent",
              color: periodo === p.id ? "#dc2626" : t.textSec,
            }}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px", marginBottom: "14px" }} className="vv-g4">
        {[
          { icon: "\u274c", label: "Perdidos", val: data.perdidos.length, bg: "linear-gradient(135deg,#dc2626,#991b1b)" },
          { icon: "\ud83d\udcb8", label: "Valor Perdido", val: fmt(data.totalPerdido), bg: "linear-gradient(135deg,#f97316,#ea580c)" },
          { icon: "\ud83d\udcca", label: "Ticket M\u00e9dio", val: fmt(data.ticketMedio), bg: "linear-gradient(135deg,#8b5cf6,#7c3aed)" },
          { icon: "\ud83c\udfaf", label: "Taxa Resgate", val: data.taxaResgate + "%", bg: "linear-gradient(135deg,#16a34a,#15803d)" },
        ].map((k, i) => (
          <div key={i} style={{ borderRadius: "10px", padding: "12px", color: "#fff", background: k.bg }}>
            <div style={{ fontSize: "18px", fontWeight: "800" }}>{k.val}</div>
            <div style={{ fontSize: "8px", opacity: 0.85, marginTop: "2px", fontWeight: "600", textTransform: "uppercase", letterSpacing: ".5px" }}>{k.icon} {k.label}</div>
          </div>
        ))}
      </div>

      {data.perdidos.length === 0 ? (
        <div style={{ textAlign: "center", padding: "32px", color: t.textMuted }}>
          <div style={{ fontSize: "40px" }}>\u2705</div>
          <div style={{ fontSize: "12px", marginTop: "8px" }}>Nenhum or\u00e7amento perdido neste per\u00edodo</div>
        </div>
      ) : (
        <>
          {/* Charts row */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "14px" }} className="vv-g2">
            {/* Pie: motivos */}
            <div style={{ background: t.sectionBg, borderRadius: "10px", padding: "12px", border: `1px solid ${t.cardBorder}` }}>
              <div style={{ fontSize: "11px", fontWeight: "700", color: t.text, marginBottom: "8px" }}>\ud83e\udd67 Motivos de Perda</div>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={data.pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={65} innerRadius={30} paddingAngle={2}>
                    {data.pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v) => [v, "Leads"]} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginTop: "6px" }}>
                {data.pieData.map((d, i) => (
                  <span key={i} style={{ fontSize: "8px", display: "flex", alignItems: "center", gap: "3px", color: t.textSec }}>
                    <span style={{ width: "8px", height: "8px", borderRadius: "2px", background: PIE_COLORS[i % PIE_COLORS.length], display: "inline-block" }} />
                    {d.name} ({d.value})
                  </span>
                ))}
              </div>
            </div>

            {/* Bar: per month */}
            <div style={{ background: t.sectionBg, borderRadius: "10px", padding: "12px", border: `1px solid ${t.cardBorder}` }}>
              <div style={{ fontSize: "11px", fontWeight: "700", color: t.text, marginBottom: "8px" }}>\ud83d\udcca Perdas por M\u00eas</div>
              {data.barData.length > 0 ? (
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={data.barData}>
                    <XAxis dataKey="label" tick={{ fontSize: 8 }} />
                    <YAxis tick={{ fontSize: 8 }} allowDecimals={false} />
                    <Tooltip formatter={(v, name) => [name === "count" ? v + " leads" : fmt(v), name === "count" ? "Perdidos" : "Valor"]} />
                    <Bar dataKey="count" fill="#dc2626" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ textAlign: "center", padding: "40px", color: t.textMuted, fontSize: "10px" }}>Sem dados</div>
              )}
            </div>
          </div>

          {/* Detail by motivo */}
          <div style={{ background: t.sectionBg, borderRadius: "10px", padding: "12px", border: `1px solid ${t.cardBorder}`, marginBottom: "14px" }}>
            <div style={{ fontSize: "11px", fontWeight: "700", color: t.text, marginBottom: "10px" }}>\ud83d\udccb Detalhamento por Motivo</div>
            {data.motivos.map((m) => {
              const pct = data.perdidos.length > 0 ? Math.round((m.count / data.perdidos.length) * 100) : 0;
              return (
                <div key={m.id} style={{ marginBottom: "8px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", marginBottom: "3px" }}>
                    <span style={{ fontWeight: "700", color: t.text }}>{m.icon} {m.label}</span>
                    <span style={{ color: t.textSec }}>{m.count}x \u00b7 {fmt(m.valor)} ({pct}%)</span>
                  </div>
                  <div style={{ height: "8px", background: t.cardBorder, borderRadius: "4px", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: pct + "%", background: "#dc2626", borderRadius: "4px", transition: "width .5s" }} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Insights */}
          {data.insights.length > 0 && (
            <div style={{ background: "linear-gradient(135deg,#fef3c7,#fef9c3)", borderRadius: "10px", padding: "14px", border: "1px solid #fde68a" }}>
              <div style={{ fontSize: "12px", fontWeight: "800", color: "#92400e", marginBottom: "10px" }}>\ud83d\udca1 Insights Autom\u00e1ticos</div>
              {data.insights.map((ins, i) => (
                <div key={i} style={{ display: "flex", gap: "8px", alignItems: "flex-start", marginBottom: "8px" }}>
                  <span style={{ fontSize: "16px", flexShrink: 0 }}>{ins.icon}</span>
                  <span style={{ fontSize: "11px", color: "#78350f", lineHeight: "1.5" }}>{ins.text}</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
