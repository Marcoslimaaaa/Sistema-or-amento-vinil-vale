// Página de verificação visual dos componentes novos do CRM v5.
// Não entra no app nem no build de produção — serve para exercitar os
// componentes com dados de exemplo em http://localhost:5199/sandbox.html
import React, { useState } from "react";
import ReactDOM from "react-dom/client";
// sem index.css: os componentes usam estilo inline e o postcss do projeto
// conflita quando processado a partir desta entrada separada.

import AlertaSLA from "./components/crm/AlertaSLA";
import LeadNoChat from "./components/crm/LeadNoChat";
import RespostasRapidas from "./components/crm/RespostasRapidas";
import Timeline from "./components/crm/Timeline";
import CanalStatus from "./components/crm/CanalStatus";
import TodayTasks from "./components/crm/TodayTasks";
import { leadScore, faixaScore } from "./services/score.js";

const t = {
  card: "#fff", cardBorder: "#e2e8f0", sectionBg: "#f8fafc", inputBg: "#fff",
  text: "#0f172a", textSec: "#475569", textMuted: "#64748b",
};
const blue = "#0055a4";
const fmt = (v) => Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const H = (h) => Date.now() - h * 3600 * 1000;

const lead = {
  id: String(Date.now() - 12 * 86400000), cN: "Maria Silva", tot: "18500", status: "negociacao",
  data: { client: { name: "Maria Silva", phone: "13996781966", city: "Registro" }, execDays: "25" },
};
const leadB = { id: String(Date.now() - 3 * 86400000), cN: "João Pereira", tot: "7200", status: "lead",
  data: { client: { name: "João Pereira", phone: "13991112222", city: "Cajati" } } };

const conv = {
  phone: "5513996781966", crmQuoteId: lead.id, lastUserMessageAt: H(3),
  leadData: { nome: "Maria Silva" },
  history: [
    { role: "user", content: "Oi, queria um orçamento para trocar o vinil", ts: H(30) },
    { role: "assistant", content: "Claro! Qual o tamanho da piscina?", ts: H(29) },
    { role: "user", content: "8x4, profundidade 1,40", ts: H(28) },
    { role: "assistant", content: "Perfeito, vou preparar e te mando." },
    { role: "user", content: "E aí, conseguiu ver?", ts: H(3) },
  ],
};
const convSemResposta = {
  phone: "5513993334444", lastUserMessageAt: H(7), leadData: { nome: "Ana Costa" },
  history: [{ role: "user", content: "Bom dia, ainda tem aquela promoção do vinil?", ts: H(7) }],
};
const convForaDaJanela = { phone: "5513991112222", lastUserMessageAt: H(40), history: [{ role: "user", content: "ok", ts: H(40) }] };

function Bloco({ titulo, nota, children }) {
  return (
    <section style={{ marginBottom: "26px" }}>
      <h2 style={{ fontSize: "13px", fontWeight: 800, color: blue, marginBottom: "2px" }}>{titulo}</h2>
      {nota && <p style={{ fontSize: "10px", color: t.textMuted, margin: "0 0 8px" }}>{nota}</p>}
      <div style={{ background: t.card, border: `1px solid ${t.cardBorder}`, borderRadius: "10px", padding: "12px" }}>
        {children}
      </div>
    </section>
  );
}


// Réplica da estrutura do card do kanban: draggable com botões e <select>
// dentro. É onde o drag&drop costuma quebrar a interação dos filhos.
function KanbanTeste({ registrar }) {
  const [cols, setCols] = useState({ lead: [lead], negociacao: [leadB], fechou: [] });
  const [arrastando, setArrastando] = useState(null);
  const [sobre, setSobre] = useState(null);
  const mover = (q, destino) => {
    setCols((c) => {
      const novo = {};
      for (const k of Object.keys(c)) novo[k] = c[k].filter((x) => x.id !== q.id);
      novo[destino] = [...novo[destino], q];
      return novo;
    });
    registrar(`arrastou ${q.cN} → ${destino}`);
  };
  return (
    <div style={{ display: "flex", gap: "8px" }}>
      {Object.entries(cols).map(([col, itens]) => (
        <div key={col} style={{ flex: 1 }}>
          <div style={{ fontSize: "10px", fontWeight: 800, padding: "6px", background: "#e2e8f0", borderRadius: "6px 6px 0 0" }}>{col} ({itens.length})</div>
          <div
            onDragOver={(e) => { e.preventDefault(); if (sobre !== col) setSobre(col); }}
            onDragLeave={() => setSobre(null)}
            onDrop={(e) => { e.preventDefault(); if (arrastando) mover(arrastando, col); setArrastando(null); setSobre(null); }}
            style={{ minHeight: "110px", padding: "6px", background: sobre === col ? "#dbeafe" : "#f8fafc", border: `1px ${sobre === col ? "dashed #0055a4" : "solid #e2e8f0"}`, borderRadius: "0 0 6px 6px", display: "flex", flexDirection: "column", gap: "5px" }}
          >
            {itens.map((q) => (
              <div key={q.id} draggable onDragStart={() => setArrastando(q)} onDragEnd={() => { setArrastando(null); setSobre(null); }}
                style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "7px", padding: "7px", cursor: "grab", opacity: arrastando?.id === q.id ? 0.4 : 1 }}>
                <div style={{ fontSize: "10px", fontWeight: 700 }}>{q.cN} · {fmt(q.tot)}</div>
                <div style={{ display: "flex", gap: "3px", marginTop: "4px" }}>
                  <button data-teste="botao-card" onClick={() => registrar(`clicou botão de ${q.cN}`)} style={{ fontSize: "9px", padding: "3px 6px", cursor: "pointer" }}>Ação</button>
                  <select data-teste="select-card" value="" onChange={(e) => { if (e.target.value) mover(q, e.target.value); e.target.value = ""; }} style={{ fontSize: "9px" }}>
                    <option value="">→ Mover</option>
                    {Object.keys(cols).filter((c) => c !== col).map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function App() {
  const [msg, setMsg] = useState("/");
  const [log, setLog] = useState([]);
  const registrar = (txt) => setLog((l) => [txt, ...l].slice(0, 8));
  const hist = [lead, leadB];
  const maiorValor = 18500;

  return (
    <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "24px", fontFamily: "Inter, system-ui, sans-serif", background: "#f1f5f9", minHeight: "100vh" }}>
      <h1 style={{ fontSize: "18px", fontWeight: 800, color: blue, marginBottom: "4px" }}>Sandbox — componentes CRM v5</h1>
      <p style={{ fontSize: "11px", color: t.textMuted, marginBottom: "20px" }}>
        Verificação visual com dados de exemplo. Não faz parte do app.
      </p>

      <Bloco titulo="CanalStatus" nota="Consulta o bot de verdade — deve mostrar 🟡 Modo manual, já que nenhum provider está conectado.">
        <CanalStatus />
      </Bloco>

      <Bloco titulo="AlertaSLA" nota="Duas conversas esperando resposta: 7h e 3h. A de 3h NÃO deve aparecer (última mensagem é do cliente mas... veja: ambas terminam com o cliente).">
        <AlertaSLA waConvs={[conv, convSemResposta]} t={t} fmtPhone={(p) => p} onAbrirConversa={(p) => registrar(`abrir conversa ${p}`)} />
      </Bloco>

      <Bloco titulo="Lead scoring" nota="Notas dos dois leads de exemplo.">
        {hist.map((q) => {
          const s = leadScore({ q, dias: 6, conv: q.id === lead.id ? conv : null, maiorValor });
          const f = faixaScore(s);
          return (
            <div key={q.id} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", fontSize: "11px", borderBottom: `1px solid ${t.cardBorder}` }}>
              <span style={{ color: t.text }}>{q.cN} · {fmt(q.tot)} · {q.status}</span>
              <span style={{ fontWeight: 800, color: f.cor }}>{s}/100 · {f.label}</span>
            </div>
          );
        })}
      </Bloco>

      <Bloco titulo="TodayTasks" nota="Follow-up acionável. O botão Enviar cai no wa.me (canal manual).">
        <TodayTasks hist={hist} getDays={() => 8} fmt={fmt} t={t} blue={blue} crmNextContact={{}} setNextContact={(id, d) => registrar(`agendar ${id} → ${d}`)} addInteracao={(id, tipo, txt) => registrar(`interação ${tipo}: ${txt}`)} />
      </Bloco>

      <Bloco titulo="LeadNoChat — com lead vinculado (janela ABERTA)" nota="Cliente falou há 3h: deve mostrar janela aberta com ~20h restantes.">
        <div style={{ display: "flex", height: "330px", border: `1px solid ${t.cardBorder}`, borderRadius: "8px", overflow: "hidden" }}>
          <div style={{ flex: 1, background: "#efeae2", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b", fontSize: "11px" }}>(área da conversa)</div>
          <LeadNoChat lead={lead} conv={conv} t={t} fmt={fmt} dias={3} canalOficial={true}
            onAbrirLead={(q) => registrar(`abrir lead ${q.cN}`)} onMover={(id, e) => registrar(`mover ${id} → ${e}`)}
            onEnviarOrcamento={(q) => registrar(`enviar orçamento ${q.cN}`)} onVincular={(id) => registrar(`vincular ${id}`)} candidatos={[]} />
        </div>
      </Bloco>

      <Bloco titulo="LeadNoChat — janela FECHADA" nota="Cliente falou há 40h: deve mostrar 'Fora da janela de 24h'.">
        <div style={{ display: "flex", height: "300px", border: `1px solid ${t.cardBorder}`, borderRadius: "8px", overflow: "hidden" }}>
          <div style={{ flex: 1, background: "#efeae2" }} />
          <LeadNoChat lead={leadB} conv={convForaDaJanela} t={t} fmt={fmt} dias={12} canalOficial={true}
            onAbrirLead={() => {}} onMover={() => {}} onEnviarOrcamento={() => {}} onVincular={() => {}} candidatos={[]} />
        </div>
      </Bloco>

      <Bloco titulo="LeadNoChat — conversa SEM orçamento" nota="Deve oferecer vincular a um orçamento do mesmo telefone.">
        <div style={{ display: "flex", height: "260px", border: `1px solid ${t.cardBorder}`, borderRadius: "8px", overflow: "hidden" }}>
          <div style={{ flex: 1, background: "#efeae2" }} />
          <LeadNoChat lead={null} conv={convSemResposta} t={t} fmt={fmt} dias={0} canalOficial={false}
            onAbrirLead={() => {}} onMover={() => {}} onEnviarOrcamento={() => {}}
            onVincular={(id) => registrar(`vincular conversa ao orçamento ${id}`)} candidatos={hist} />
        </div>
      </Bloco>

      <Bloco titulo="RespostasRapidas" nota='Digite "/" e depois filtre (ex: "/pag"). ↑↓ navega, Enter escolhe.'>
        <div style={{ position: "relative", marginTop: "180px" }}>
          {msg.startsWith("/") && (
            <RespostasRapidas filtro={msg} respostas={[]} lead={lead} t={t}
              onEscolher={(txt) => { setMsg(txt); registrar("escolheu resposta rápida"); }} onFechar={() => setMsg("")} />
          )}
          <input value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="Digite / para abrir"
            style={{ width: "100%", padding: "10px", borderRadius: "8px", border: `1px solid ${t.cardBorder}`, fontSize: "12px" }} />
        </div>
      </Bloco>

      <Bloco titulo="Timeline" nota="CRM + conversa juntos. A mensagem sem ts deve aparecer com '~' e não pular para o topo.">
        <Timeline conv={conv} t={t}
          interacoes={[
            { tipo: "orcamento", texto: "Orçamento enviado via WhatsApp", ts: H(26) },
            { tipo: "nota", texto: "Cliente pediu para ligar depois das 18h", ts: H(20) },
            { tipo: "etapa", texto: "Movido para Negociação", ts: H(5) },
            { tipo: "nota", texto: "Interação antiga sem ts (só data BR)", data: "10/07/2026" },
          ]} />
      </Bloco>

      <Bloco titulo="Kanban drag & drop" nota="Arraste um card entre as colunas. Os botões e o select dentro do card precisam continuar clicáveis.">
        <KanbanTeste registrar={registrar} />
      </Bloco>

      <Bloco titulo="Ações registradas" nota="Confirma que os callbacks disparam.">
        {log.length === 0 ? <span style={{ fontSize: "10px", color: t.textMuted }}>nada ainda — interaja acima</span>
          : log.map((l, i) => <div key={i} style={{ fontSize: "10px", color: t.text, padding: "2px 0" }}>• {l}</div>)}
      </Bloco>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
