# Plano de Upgrade do CRM — Sistema de Orçamentos Vinil Vale

Auditoria feita em 17/07/2026 sobre `main` (8650d4e), foco em CRM/follow-up + varredura geral.

---

## 1. Por que o follow-up NÃO funciona hoje — causas raiz

| # | Bug | Onde | Efeito |
|---|-----|------|--------|
| 1 | **Dias sem contato ignoram a criação do orçamento e as conversas reais do WhatsApp.** `getDaysSince` só olha interações registradas manualmente; lead sem interação retorna **999 dias**. | `src/App.jsx:1529` | Lead criado hoje já nasce "🧊 Gelado", entra no contador de Follow-up e pode receber "sugerir perda". O KPI fica inflado e ninguém confia nele. |
| 2 | **Automação de resgate roda 1× por sessão, 30s após abrir o app** — muitas vezes antes de `interacoes` carregar da nuvem (tudo = 999d). | `src/components/rescue/useRescueAutomation.js:10-50` | Tagueia "Aguardando/Retornar/Urgente" em massa errado e grava `crmMeta` inteiro por cima (pode apagar datas de próximo contato feitas em outro aparelho). |
| 3 | **Enviar mensagem no chat inline do CRM usa closure velho de `waChat`.** `setWaChat(...)` + `setTimeout(waSendMessage, 100)` não funciona: a função capturada ainda vê o chat antigo. | `src/App.jsx:2699-2701` | Se a aba WhatsApp nunca foi aberta, o envio **não faz nada** (silencioso). Se havia outro chat aberto, a mensagem **vai para o contato errado**. |
| 4 | **Só clicar em "Abrir Chat" registra interação** ("Chat WhatsApp aberto"). | `src/App.jsx:2511` e `2630` | Zera o contador de dias sem nenhum contato real → lead some da lista de follow-up e é esquecido. |
| 5 | **Modal de resgate registra "Follow-up de resgate enviado" mesmo quando o envio falha** (sem telefone / conversa inexistente no bot). | `src/components/rescue/RescueModal.jsx:19-28` + `src/App.jsx:1910` (`openWA`) | Falso positivo de contato → contador zera → lead esquecido. |
| 6 | **Próximo contato agendado para HOJE aparece como "Atrasado"** (compara meia-noite < agora). | `src/App.jsx:1668-1672` | Alarme falso todo dia. |
| 7 | **`interacoes` e `crmMeta` são documento único (last-write-wins).** | `src/App.jsx:1483-1514` | Dois aparelhos abertos = notas/datas somem → dias voltam a 999. Mesmo problema já mapeado para estoque/fornecedores no PLANO-MELHORIA. |
| 8 | **Três réguas de dias conflitantes:** follow-up ≥5d, temperatura 2/7/14d, resgate 3/9/20/45d. | `App.jsx:1642-1654`, `RescueButton.jsx:3-10` | O mesmo lead é "Morno", "UP" e "Aguardando" ao mesmo tempo — ninguém sabe qual sinal seguir. |

## 2. KPIs com cálculo enganoso

- **Conversão (7%)**: `fechados / hist.length` — o denominador inclui leads ainda em aberto e os antigos importados. A taxa real de decisão é `fechados / (fechados + perdidos)`. Mostrar as duas ("conversão do funil" e "taxa de vitória").
- **Taxa de Resgate** (análise de perdas): conta "mensagem de resgate enviada", não "cliente que voltou". Renomear ou medir retorno real (lead saiu de `perdido`).
- **Follow-up**: número inflado pelos 999d (item 1).

## 3. Bugs gerais (fora do CRM)

- **Vírgula decimal**: `calcA` (`src/App.jsx:761-763`) usa `parseFloat` direto nas dimensões — "3,5" vira **3** → área, m² de vinil e preço errados. Os `extras` já tratam vírgula (`pf`), as dimensões principais não. Padronizar `pf` em todo lugar.
- **Sync Google Contacts** (`src/App.jsx:1603-1628`): apaga a coleção antiga num **único batch** (limite Firestore = 500 ops → quebra com 500+ contatos); ids por telefone colidem para contatos com mesmo número; `contact_${batchCount}` gera ids instáveis a cada sync.
- **Rules**: allowlist de equipe está no `firestore.rules` — **confirmar se foi deployada** (`firebase deploy --only firestore:rules`).
- Pendências conhecidas do PLANO-MELHORIA continuam: bundle 1,6MB, App.jsx monolito (3.656 linhas), 2 vulnerabilidades npm.

## 4. O que os melhores CRMs de 2026 fazem (e cabe aqui)

Referência: Pipedrive + WhatsApp, Clientify, NetHunt — padrões de mercado em CRM com WhatsApp:

1. **Última atividade automática** — o CRM deriva "dias sem contato" das conversas reais, não de registro manual. **Vantagem Vinil Vale: os dados já existem** — o bot grava `whatsapp_conversations` com `lastActivity` por telefone. Basta cruzar lead ↔ conversa pelo telefone.
2. **Cadência automática de follow-up** — se o lead não responde em 48h, o sistema envia a sequência (2d → 5d → 9d → 20d) e **para quando o cliente responde**. O bot no Railway já envia mensagens via API (`/api/send-message`); falta o agendador.
3. **Tarefas de Hoje** — caixa diária acionável no topo do CRM: "5 contatos para hoje" com botão de 1 clique, em vez de um badge vermelho que não leva a lugar nenhum.
4. **Lead scoring** — prioridade = valor do orçamento × recência × engajamento (respondeu no WhatsApp?). Ordena o pipeline por "quem fechar primeiro".
5. **SLA de primeiro contato** — alerta se lead novo do WhatsApp ficar 1h+ sem resposta humana (o próprio insight do sistema diz que "sem retorno" domina as perdas).
6. **Kanban drag & drop** + tempo médio em cada etapa (hoje mover é um `<select>`).
7. **Push notification (PWA)** — o app já é PWA; notificar follow-ups do dia de manhã.

## 5. Status da execução (17/07/2026 — v4.7)

**✅ Fase 1 concluída** — todos os 6 bugs da seção 1 corrigidos:
- `getDaysSince` agora usa o mais recente entre interação manual, conversa real do WhatsApp e data de criação do orçamento (nunca mais 999d para lead novo).
- Régua única em `src/components/crm/regua.js` (follow-up 5d · quente ≤2 · morno ≤7 · frio ≤14 · resgate 3/9/20/45) usada por App, RescueButton e automação.
- Automação de resgate só roda depois de hist+interações+crmMeta carregarem da nuvem e ignora leads sem referência de contato.
- Chat inline do CRM envia direto para `crmChatPhone` (closure corrigido — não falha em silêncio nem manda para contato errado).
- "Abrir Chat" não registra mais interação falsa.
- Modal de resgate envia via **wa.me** (funciona com o bot desconectado, sem risco de ban) e só registra interação se o WhatsApp abriu de verdade.
- Contato agendado para hoje não conta mais como atrasado.

**✅ Fase 2 concluída** — dias sem contato cruzam lead ↔ `whatsapp_conversations` pelo telefone (`lastActivity`); mensagem enviada pelo sistema registra interação automática no lead correspondente.

**✅ Fase 3a concluída** — caixa **"Tarefas de Hoje"** no topo do Pipeline (`src/components/crm/TodayTasks.jsx`): contatos agendados atrasados/de hoje + leads parados ≥5d, ordenados por prioridade (valor × tempo parado), com 💬 envio 1-clique via wa.me (mensagem pronta pela régua de dias + registra interação + reagenda +5d), ✓ Feito e +3d adiar. KPI de conversão agora mostra a **taxa de vitória sobre decididos** (a geral antiga aparece ao lado).

**✅ Fase 4 concluída (parte segura)** — robustez:
- `interacoes` e `crmMeta` agora gravam com **merge por lead** (`saveInteracaoLead`/`patchCrmMeta`): dois aparelhos abertos não apagam mais as notas um do outro; a automação grava só as tags que mudaram e não toca no `nextContact`.
- **Vírgula decimal**: dimensões da piscina/spa/paredes normalizam "," → "." na digitação; valores em R$ (valor final e lead manual) usam `parseMoney` no padrão BR ("12.500,50" → 12500.50 — antes "12.500" virava R$ 12,50).
- **Google Contacts**: exclusão da coleção antiga em blocos de 450 (antes um batch único quebrava com 500+ contatos).

**✅ Rules deployadas (17/07)** — Firestore (allowlist de equipe) e Storage publicadas via `firebase deploy` no projeto `sistema-vinil-vale`.

**✅ Fase 3b — código pronto (bot v1.5, commit 9092c9d)** — o bot agora suporta a **Meta Cloud API oficial**: provider em `src/services/meta-cloud.js` (texto, templates, mídia, anti-loop de ecos), roteamento automático em `whatsapp.js` (ativa quando `META_WA_TOKEN`+`META_WA_PHONE_ID` existirem), rotas `/webhook-meta` traduzindo o payload da Meta (incl. echoes do Coexistence) para o pipeline atual. **Nada muda em produção até configurar as variáveis.**

**Pendente (precisa do Marcos — não dá via CLI):**
- Seguir o passo a passo de `MIGRACAO-META-CLOUD-API.md` no repo do bot (criar app na Meta, conectar o número via Coexistence, token permanente, webhook, variáveis no Railway — ~30–60 min).
- Depois da migração: criar os 3 templates de follow-up no WhatsApp Manager e ligar o `followup.js` neles (cadência 100% automática).
- Itens maiores do PLANO-MELHORIA: quebrar App.jsx em módulos, code-splitting do bundle.

## 6. Roadmap proposto

| Fase | O quê | Esforço |
|------|-------|---------|
| **1 — Fundação do follow-up** | Corrigir itens 1–6 da seção 1: fallback de `getDaysSince` para data de criação (`q.id` é timestamp); régua única de dias; automação só depois de `interacoes` carregar + merge de tags; consertar closure do chat inline; interação só após envio real; "hoje" ≠ atrasado | 1 dia |
| **2 — Contato real via WhatsApp** | Cruzar lead ↔ `whatsapp_conversations` por telefone; "dias sem contato" = máx(interação manual, última msg real); registrar interação automática quando mensagem é enviada pelo sistema | 1 dia |
| **3 — CRM de mercado** | Tarefas de Hoje + lead scoring + KPIs corrigidos (taxa de vitória) + push notification + cadência automática pelo bot (mexe também no repo `vinil-vale-whatsapp-bot`) | 2–3 dias |
| **4 — Robustez** | `interacoes`/`crmMeta` em subcoleções (multi-aparelho); vírgula decimal em `calcA`; Google Contacts em batches seguros; deploy das rules | 1–2 dias |

Fases 1–2 resolvem o "follow-up não funciona". Fase 3 é o upgrade de mercado. Fase 4 protege os dados.
