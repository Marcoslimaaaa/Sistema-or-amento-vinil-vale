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
import RevisaoEtapas from "./components/crm/RevisaoEtapas";
import OrigemReport from "./components/dashboard/OrigemReport";
import FichaLead from "./components/crm/FichaLead";
import AnaliseConversa from "./components/crm/AnaliseConversa";
import SeloPotencial from "./components/crm/SeloPotencial";
import RascunhosBot from "./components/crm/RascunhosBot";
import Agenda from "./components/crm/Agenda";
import { metricasFunil } from "./services/leadUnico.js";
import { classificarBase } from "./services/etapaAuto.js";
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

      <Bloco titulo="Agenda de servico" nota="Lista por dia, nao calendario mensal: com 3 compromissos na semana, a grade do mes mostra 28 quadrados vazios. O ATRASADO vem sempre primeiro. Botoes so registram no log aqui.">
        {(() => {
          const d = (n) => { const x = new Date(); x.setDate(x.getDate() + n); return x.toISOString().slice(0, 10); };
          const histEx = [
            { id: 91, status: "negociacao", cN: "Solange", cC: "Peruíbe-Sp", data: { client: { name: "Solange", city: "Peruíbe-Sp", phone: "13991112222" } } },
            { id: 92, status: "orcamento", cN: "Edilson", cC: "Peruibe-Sp", data: { client: { name: "Edilson", city: "Peruibe-Sp" } } },
            { id: 93, status: "fechou", cN: "Jerry", cC: "Itanhaem-Sp", data: { client: { name: "Jerry", city: "Itanhaem-Sp" } } },
            { id: 94, status: "negociacao", cN: "Suzana", cC: "Registro-Sp", data: { client: { name: "Suzana", city: "Registro-Sp" } } },
          ];
          return (
            <Agenda
              t={t} blue={blue} hist={histEx}
              agendamentos={[
                { id: 1, quoteId: "94", cliente: "Suzana", cidade: "Registro-Sp", tipo: "visita", data: d(-3), periodo: "manha", status: "agendado", obs: "Levar amostra da Petros" },
                { id: 2, quoteId: "91", cliente: "Solange", cidade: "Peruíbe-Sp", tipo: "visita", data: d(0), periodo: "tarde", status: "agendado" },
                { id: 3, quoteId: "93", cliente: "Jerry", cidade: "Itanhaem-Sp", tipo: "instalacao", data: d(1), periodo: "dia", status: "agendado", obs: "2 dias de obra" },
                { id: 4, quoteId: "92", cliente: "Edilson", cidade: "Peruibe-Sp", tipo: "entrega", data: d(6), periodo: "manha", status: "agendado" },
                { id: 5, quoteId: "94", cliente: "Ja feito", cidade: "Cajati", tipo: "visita", data: d(-10), periodo: "manha", status: "feito" },
              ]}
              onNovo={(f) => registrar(`novo agendamento ${f.tipo} em ${f.data}`)}
              onMarcarFeito={(a) => registrar(`feito: ${a.cliente}`)}
              onRemarcar={(a, nova) => registrar(`remarcar ${a.cliente} para ${nova}`)}
              onCancelar={(a) => registrar(`cancelar ${a.cliente}`)}
              onAbrirLead={(id) => registrar(`abrir lead ${id}`)}
            />
          );
        })()}
      </Bloco>

      <Bloco titulo="Aba CRM — como fica dentro do sistema" nota="Recorte da aba CRM com o que mudou: os KPIs contando CLIENTE (nao documento) e a fila do Vini no lugar onde ela aparece, acima dos avisos.">
        {(() => {
          const histEx = [
            { id: 1, status: "fechou", tot: "12000", cN: "Célio Pereira", cC: "Registro", data: { client: { name: "Célio Pereira", city: "Registro", phone: "13991112222" } } },
            { id: 2, status: "lead", tot: "9000", cN: "Célio Pereira", cC: "Registro", data: { client: { name: "Célio Pereira", city: "Registro", phone: "13991112222" } } },
            { id: 3, status: "negociacao", tot: "11000", cN: "Ana", cC: "Peruíbe", data: { client: { name: "Ana", city: "Peruíbe", phone: "13993334444" } } },
            { id: 4, status: "lead", tot: "3000", cN: "Novo", cC: "Cajati", data: { client: { name: "Novo", city: "Cajati", phone: "13999990000" } } },
            { id: 5, status: "perdido", tot: "5000", cN: "Zé", cC: "Juquiá", data: { client: { name: "Zé", city: "Juquiá", phone: "13997778888" } } },
          ];
          const mF = metricasFunil(histEx);
          const kpis = [
            { label: mF.orcamentosExtras > 0 ? `Clientes (${histEx.length} orçamentos)` : "Clientes", val: mF.leads, bg: "linear-gradient(135deg,#0055a4,#003d7a)" },
            { label: "Ativos", val: mF.ativos, bg: "linear-gradient(135deg,#f97316,#ea580c)" },
            { label: "Fechados", val: mF.fechados, bg: "linear-gradient(135deg,#16a34a,#15803d)" },
            { label: `Conversão real (geral ${mF.txConv}%)`, val: mF.winRate + "%", bg: "linear-gradient(135deg,#8b5cf6,#7c3aed)" },
            { label: "Ticket Médio", val: fmt(mF.ticketMedio), bg: "linear-gradient(135deg,#f59e0b,#d97706)" },
            { label: "Follow-up", val: 2, bg: "linear-gradient(135deg,#dc2626,#991b1b)" },
          ];
          return (
            <div style={{ background: "#f8fafc", border: `1px solid ${t.cardBorder}`, borderRadius: "12px", padding: "14px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "8px", marginBottom: "14px" }}>
                {kpis.map((k, i) => (
                  <div key={i} style={{ borderRadius: "10px", padding: "12px", color: "#fff", background: k.bg }}>
                    <div style={{ fontSize: "18px", fontWeight: "800" }}>{k.val}</div>
                    <div style={{ fontSize: "8px", opacity: .85, marginTop: "2px", fontWeight: "600", textTransform: "uppercase", letterSpacing: ".5px" }}>{k.label}</div>
                  </div>
                ))}
              </div>
              <RascunhosBot
                t={t} fmtPhone={(p) => p}
                rascunhos={[
                  { id: "a", completude: 100, precisaDesenho: false, nota: 82,
                    campos: { svcType: "construcao", poolFmt: "Retangular", client: { name: "Suzana", city: "Sete Barras" }, pool: { length: "4", width: "3", depth: "1.5" } },
                    faltando: [], observacoes: ["Estado: construção nova"] },
                  { id: "b", completude: 86, precisaDesenho: false, nota: 64,
                    campos: { svcType: "revestimento", poolFmt: "Retangular", client: { name: "Solange", city: "Terra Preta - Mairiporã" }, pool: { length: "10", width: "5", depth: "" } },
                    faltando: ["profundidade"], observacoes: [] },
                  { id: "c", completude: 100, precisaDesenho: true, nota: 71,
                    campos: { svcType: "construcao", poolFmt: "Feijão", client: { name: "Janayne", city: "Registro" }, pool: { length: "6", width: "3", depth: "1.2" } },
                    faltando: [], observacoes: [] },
                ]}
                onAbrir={(r) => registrar(`abrir rascunho ${r.id}`)}
                onDescartar={(r) => registrar(`descartar rascunho ${r.id}`)}
              />
              <div style={{ fontSize: "10px", color: t.textMuted, marginTop: "4px" }}>
                (abaixo daqui vêm os avisos de etapa e o SLA, e depois o kanban)
              </div>
            </div>
          );
        })()}
      </Bloco>

      <Bloco titulo="RascunhosBot" nota="Fila do que o Vini preencheu pela conversa. O 100% deve vir primeiro; o que precisa de desenho vai pro fim. Descartar e Abrir apenas registram no log abaixo.">
        <RascunhosBot
          t={t}
          fmtPhone={(p) => p}
          rascunhos={[
            { id: "5513991112222", completude: 100, precisaDesenho: false, nota: 85,
              campos: { svcType: "revestimento", poolFmt: "Retangular", client: { name: "Carlos", city: "Registro" }, pool: { length: "8", width: "4", depth: "1.4" } },
              faltando: [], observacoes: ["Cliente contou 6 flanges — conferir a divisão dos dispositivos."] },
            { id: "5513993334444", completude: 78, precisaDesenho: false, nota: 60,
              campos: { svcType: "revestimento", poolFmt: "Com prainha", client: { name: "Ana", city: "Peruíbe" }, pool: { length: "10", width: "5", depth: "1.5" } },
              faltando: ["avanço da prainha", "lâmina d'água da prainha"], observacoes: ["Foto: retangular com prainha na lateral"] },
            { id: "5513995556666", completude: 100, precisaDesenho: true, nota: 70,
              campos: { svcType: "construcao", poolFmt: "Formato L", client: { name: "Rui", city: "Cajati" }, pool: { length: "9", width: "4", depth: "1.4" } },
              faltando: [], observacoes: [] },
            { id: "descartado", status: "descartado", completude: 100, campos: { client: { name: "NÃO DEVE APARECER" }, pool: {} }, faltando: [] },
          ]}
          onAbrir={(r) => registrar(`abrir rascunho ${r.id}`)}
          onDescartar={(r) => registrar(`descartar rascunho ${r.id}`)}
        />
      </Bloco>

      <Bloco titulo="SeloPotencial" nota="Nota do bot no fim da triagem. Compacto é o que aparece na lista de conversas; o detalhado mostra os motivos. Sem qualificação NÃO deve renderizar nada.">
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {[
            { nota: 85, faixa: "A", ticketEstimado: 5280, motivos: ["32 m² ≈ R$ 5.280 de revestimento", "quer fazer: esse mês", "piscina pronta esperando revestimento"] },
            { nota: 52, faixa: "B", ticketEstimado: null, motivos: ["50 m² de piscina", "ainda vai construir", "escreveu 4 mensagens"] },
            { nota: 28, faixa: "C", ticketEstimado: null, motivos: ["só 1 mensagem", "não disse nada sobre a própria piscina"] },
          ].map((q) => (
            <div key={q.nota} style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "12px", color: t.text }}>
              <span style={{ width: "90px" }}>Ana Paula</span>
              <SeloPotencial qualificacao={q} />
              <SeloPotencial qualificacao={q} compacto={false} />
            </div>
          ))}
          <div style={{ fontSize: "11px", color: t.textMuted }}>
            sem qualificação: [<SeloPotencial qualificacao={null} />] (tem que ficar vazio)
          </div>
        </div>
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

      <Bloco titulo="RevisaoEtapas — com sugestões" nota="As duas listas: 'sem risco' aplica em lote; 'confira antes' avisa o efeito colateral. Abra no ▼.">
        <RevisaoEtapasTeste registrar={registrar} />
      </Bloco>

      <Bloco titulo="RevisaoEtapas — funil em dia" nota="Sem nada a ajustar, vira uma linha só com o interruptor.">
        <RevisaoEtapas automaticas={[]} revisar={[]} t={t} fmt={fmt} auto={false}
          setAuto={(v) => registrar(`interruptor → ${v}`)} onAplicar={() => {}} onAplicarTodas={() => {}} onIgnorar={() => {}} />
      </Bloco>

      <Bloco titulo="OrigemReport" nota="Canal que fatura no topo; conversão em verde acima de 20%; rodapé avisa a cobertura do dado.">
        <OrigemReport hist={histOrigem} achaConversa={(q) => convsOrigem[q.id] || null} t={t} fmt={fmt} blue={blue} />
      </Bloco>

      <Bloco titulo="OrigemReport — base sem origem nenhuma" nota="Deve explicar o que o bot coleta, não mostrar tabela vazia.">
        <OrigemReport hist={[{ id: 1, tot: "1000", status: "lead" }]} achaConversa={() => null} t={t} fmt={fmt} blue={blue} />
      </Bloco>

      <Bloco titulo="FichaLead — completa" nota="Os campos que o bot coleta e o CRM ignorava: CEP, padrão, acesso pra máquina, prazo, como conheceu.">
        <FichaLead t={t} leadData={{
          nome: "Maria Silva", cidade: "Registro", cep: "11900-000", email: "maria@exemplo.com",
          tipo_servico: "revestimento em vinil", formato_piscina: "retangular", medidas: "8x4x1,40",
          estado_piscina: "azulejo soltando", extras: "prainha e escada", quantidade_flanges: "4",
          padrao_construcao: "completo", acesso_bobcat: "sim, pela lateral", prazo: "antes do verão",
          como_conheceu: "Instagram Ads", foto_recebida: true,
        }} />
      </Bloco>

      <Bloco titulo="FichaLead — incompleta" nota="Barra vermelha e a linha 'falta perguntar' com os campos obrigatórios que faltam.">
        <FichaLead t={t} leadData={{ nome: "João", cidade: "Cajati", como_conheceu: "indicação do vizinho" }} />
      </Bloco>

      <Bloco titulo="FichaLead — sem dados" nota="Deve explicar por que está vazia, não sumir.">
        <FichaLead t={t} leadData={null} />
      </Bloco>

      <Bloco titulo="AnaliseConversa — botão (estado inicial)" nota="Clicar chama o bot de verdade; sem login o retorno é erro, e o erro tem que aparecer ao lado do botão.">
        <AnaliseConversa q={lead} temConversa t={t} />
      </Bloco>

      <Bloco titulo="AnaliseConversa — sem conversa vinculada" nota="Não deve renderizar nada (não há o que analisar).">
        <div style={{ fontSize: "10px", color: t.textMuted }}>
          [abaixo deve ficar vazio]
          <AnaliseConversa q={lead} temConversa={false} t={t} />
        </div>
      </Bloco>

      <Bloco titulo="Ações registradas" nota="Confirma que os callbacks disparam.">
        {log.length === 0 ? <span style={{ fontSize: "10px", color: t.textMuted }}>nada ainda — interaja acima</span>
          : log.map((l, i) => <div key={i} style={{ fontSize: "10px", color: t.text, padding: "2px 0" }}>• {l}</div>)}
      </Bloco>
    </div>
  );
}

// Base de exemplo do relatorio de origem: canais mistos, um deles detectado
// pelo bot (Instagram Ads) e outro digitado pelo cliente ("meu vizinho fez").
const histOrigem = [
  { id: 801, tot: "32000", status: "fechou" },
  { id: 802, tot: "18000", status: "lead" },
  { id: 803, tot: "25000", status: "perdido" },
  { id: 804, tot: "9000", status: "lead" },
  { id: 805, tot: "61000", status: "concluido" },
  { id: 806, tot: "14000", status: "lead" },
  { id: 807, tot: "22000", status: "fechou" },
  { id: 808, tot: "7000", status: "lead" },
];
const convsOrigem = {
  801: { leadData: { como_conheceu: "Instagram Ads" } },
  802: { leadData: { como_conheceu: "Instagram Ads" } },
  803: { leadData: { como_conheceu: "anuncio do instagram" } },
  804: { leadData: { como_conheceu: "Google Ads" } },
  805: { leadData: { como_conheceu: "meu vizinho fez com voces" } },
  806: { leadData: { como_conheceu: "vi a placa no carro de voces" } },
  807: { leadData: { como_conheceu: "me indicaram" } },
};

// Exercita o motor de verdade (services/etapaAuto.js), não uma lista fabricada:
// é a checagem de que 'fechou' e 'perdido' nunca caem no lote automático.
function RevisaoEtapasTeste({ registrar }) {
  const [auto, setAuto] = useState(false);
  const D = (d) => Date.now() - d * 86400000;
  const base = [
    { id: 901, cN: "Ana Ribeiro", tot: "42000", status: "lead", sentAt: D(6) },
    { id: 902, cN: "Carlos Menezes", tot: "18500", status: "orcamento" },
    { id: 903, cN: "Dona Lourdes", tot: "9800", status: "orcamento", sentAt: D(52) },
    { id: 904, cN: "Sérgio Pinto", tot: "27000", status: "orcamento" },
    { id: 905, cN: "Bruna Tavares", tot: "15300", status: "lead", sentAt: D(4) },
  ];
  const convs = {
    901: { quoteSentAt: D(6) },                                   // auto → orcamento
    902: { quoteSentAt: D(9), lastUserMessageAt: D(4) },           // auto → negociacao
    903: { quoteSentAt: D(52), lastUserMessageAt: D(52) },         // revisar → perdido
    904: { quoteSentAt: D(30), dealClosedAt: D(2) },               // revisar → fechou
    905: { phone: "5513999999999", lastUserMessageAt: D(20) },     // revisar → orcamento (liga a régua)
  };
  const r = classificarBase(base, (q) => convs[q.id] || null);
  return (
    <RevisaoEtapas automaticas={r.automaticas} revisar={r.revisar} t={t} fmt={fmt}
      auto={auto} setAuto={(v) => { setAuto(v); registrar(`arrumar sozinho → ${v}`); }}
      onAplicar={(i) => registrar(`mover ${i.q.cN}: ${i.de} → ${i.etapa}`)}
      onAplicarTodas={() => registrar(`aplicar as ${r.automaticas.length} automáticas`)}
      onIgnorar={(i) => registrar(`ignorar ${i.q.cN}`)} />
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
