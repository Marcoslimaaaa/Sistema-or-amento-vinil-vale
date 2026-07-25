// Montagem da timeline do lead — lógica pura, separada do componente para ser
// testável sem o ambiente do Vite (Node não carrega .jsx).

/** Junta interações e mensagens num array só, do mais recente para o mais antigo. */
export function montarTimeline(interacoes, conv, limite = 60) {
  const itens = [];

  for (const i of interacoes || []) {
    itens.push({
      tipo: i.tipo || "nota",
      texto: i.texto || "",
      ts: i.ts || parseData(i.data),
      origem: "crm",
    });
  }

  const hist = conv?.history || [];
  // Mensagens antigas não têm ts. Em vez de descartá-las ou fingir uma data,
  // ancoramos no lastActivity da conversa e recuamos 1 min por mensagem: a
  // ordem relativa fica certa e elas não pulam para o topo da timeline.
  const base = msDe(conv?.lastActivity) || Date.now();
  hist.forEach((m, idx) => {
    if (!m?.content) return;
    itens.push({
      tipo: "whatsapp",
      texto: m.content,
      ts: m.ts || base - (hist.length - 1 - idx) * 60000,
      tsAproximado: !m.ts,
      origem: m.role === "user" ? "cliente" : "empresa",
    });
  });

  return itens.filter((i) => i.ts).sort((a, b) => b.ts - a.ts).slice(0, limite);
}

function parseData(d) {
  if (!d) return null;
  const p = String(d).split("/");
  if (p.length !== 3) return null;
  const dt = new Date(p[2], p[1] - 1, p[0]);
  return isNaN(dt) ? null : dt.getTime();
}

function msDe(v) {
  if (!v) return null;
  if (typeof v === "number") return v;
  if (v.toMillis) return v.toMillis();
  const ms = new Date(v).getTime();
  return isNaN(ms) ? null : ms;
}
