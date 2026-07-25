# Plano — WhatsApp integrado ao sistema + upgrade do CRM

Auditoria feita em 25/07/2026 sobre `main` (20cd934) do painel e `master` (6eefbd6) do bot.
Continua de onde o `PLANO-CRM-UPGRADE.md` parou (fases 1, 2, 3a e 4 concluídas em v4.7).

---

## ✅ STATUS DA EXECUÇÃO (25/07/2026)

Todas as fases de código estão implementadas e **mergeadas**.

| Fase | Status | Onde |
|---|---|---|
| 0 — Fechar a API do bot | ✅ **em produção** | bot `master` (f28ec5c) |
| 1 — Camada única de envio | ✅ mergeado em `main` | painel (6a072a1) |
| 2 — WhatsApp no CRM | ✅ mergeado em `main` | painel (e052cdd) |
| 3 — Upgrade do CRM | ✅ mergeado em `main` | painel (39a451c) |
| 4 — Follow-ups com template (código) | ✅ **em produção** | bot (4d0693d) |
| 4 — Templates aprovados na Meta | ⛔ **precisa do Marcos** | `TEMPLATES-PARA-SUBMETER.md` |

**86 testes** passando no painel (`npm test`); build limpo nos dois repos.

### Bot: PUBLICADO (25/07)

`git push origin master` feito, Railway redeployou. Verificado em produção:

```
/api/status        → {"server":"online","whatsapp":null}   (igual a antes)
/api/send-template → valida os campos; sem Cloud API responde erro claro
/api/leads         → 200 (modo compatibilidade, sem PANEL_API_KEY ainda)
/webhook-meta      → 403 (verificação da Meta; confirma que fica fora do auth)
```

Antes de publicar, um teste provou que sem as envs novas o bot se comporta
exatamente como antes (auth passa direto, CORS `*`, `isMetaEnabled()` false).

### Painel: MERGEADO em `main`, ainda NÃO publicado

6 commits prontos. **Não dei push** por um motivo específico: o CRM só aparece
depois do login com conta real, então a interface nova nunca rodou com os dados
de produção. O que dava para verificar foi verificado (ver abaixo), mas publicar
uma interface nova sem esse teste, com o Marcos ausente para reagir, não valia o
risco de deixar a empresa sem sistema de orçamento.

```bash
cd C:\Users\thami\orcamentos-vinil-vale && git push origin main
```

Se algo sair errado depois do push, o rollback é imediato pelo painel da Vercel
(promover o deployment anterior) ou por `git revert -m 1 HEAD && git push`.

**O que foi verificado no navegador** (via `sandbox.html`, página de teste que
não entra no build): CanalStatus detectando o modo manual contra o bot real; SLA
ordenando do mais antigo; janela de 24h mostrando "aberta 20h" e "fora da
janela" nos casos certos; timeline intercalando CRM e conversa na ordem certa;
drag & drop movendo o card e destacando a coluna; botão e `<select>` dentro do
card arrastável continuando clicáveis; console sem erros nem warnings.

Esse teste encontrou dois bugs, já corrigidos: a resposta rápida de prazo tinha
"20 dias" fixo (mandava o número errado para orçamento com outro prazo) e o
atalho `/` capturava Enter de qualquer lugar da página.

### Templates na Meta: 2 de 9 submetidos (25/07)

| Template | Categoria | Status |
|---|---|---|
| `followup_orcamento_recebido` | Utilidade | ✅ **ATIVO** (aprovado) |
| `followup_orcamento_condicoes` | Marketing | 🕐 Em análise |
| outros 7 | — | ⛔ a submeter |

**Descoberta importante**: a conta tem 4 WABAs e a config apontava a de TESTE.
O número real (+55 13 99730-5949) está na WABA `1740068426953762` e já aparece
como **Conectado, qualidade Alta**. Template aprovado na conta de teste não vale
para produção. Detalhes e link direto em `TEMPLATES-PARA-SUBMETER.md` (repo do bot).

Os 7 restantes ficaram por fazer: o formulário da Meta tem rodapé fixo e scroll
dinâmico que torna a automação por clique pouco confiável — várias tentativas
falharam no meio. Feito à mão leva ~3 min cada, e o documento já traz as
armadilhas mapeadas (autocomplete das chaves, espaço comido pelo botão de
variável, variável não pode abrir nem fechar o corpo).

### O que falta — só o que exige acesso que eu não tenho

1. **Submeter os 7 templates restantes** na WABA `1740068426953762`.
2. **Criar as envs** — sem elas a Fase 0 não liga (está em modo compatibilidade
   e não quebra nada enquanto isso):
   - Vercel: `VITE_BOT_API_KEY` → redeploy
   - Railway: `PANEL_API_KEY` (mesma chave) e `ALLOWED_ORIGINS`
   - **Nesta ordem.** Invertendo, o painel fica sem chave contra um bot que já
     exige, e toda chamada volta 401.
   - Gerar a chave: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
3. **Submeter os templates na Meta** — textos prontos em
   `TEMPLATES-PARA-SUBMETER.md` no repo do bot. É o item de maior prazo.
4. **Decidir quais feriados manter** — hoje são 14 disparando de graça; na Cloud
   API viram conversas MARKETING cobradas × tamanho da base. Sugestão no
   documento: manter 2.

### Pendências conhecidas (não bloqueiam)

- **Push com o app fechado**: as notificações implementadas são locais (só com o
  painel aberto). Push real precisa de Web Push com chaves VAPID e o servidor
  disparando — o bot no Railway serviria.
- **Tempo por etapa** só conta leads movidos depois desta atualização
  (`stageSince` não existe retroativamente).
- Dívida técnica da Fase 5 segue de pé: `App.jsx` passou de 4.001 para ~4.200
  linhas. A lógica nova saiu toda em `src/services/`, mas o monolito continua.

---

## 1. Diagnóstico — o que está de pé hoje

### O canal de WhatsApp está DESLIGADO (verificado ao vivo)

```
GET https://vinil-vale-whatsapp-bot-production.up.railway.app/api/status
→ {"server":"online","whatsapp":null}
```

O servidor do bot está no ar, mas **nenhum provider está conectado**: o Z-API não
responde (assinatura encerrada) e a Meta Cloud API ainda não tem
`META_WA_TOKEN`/`META_WA_PHONE_ID` (App Review pendente). `checkConnection()`
devolve `null` nos dois casos.

Consequência prática: **tudo que envia pelo bot falha hoje**.

| Caminho de envio | Como envia | Funciona hoje? |
|---|---|---|
| Aba WhatsApp → caixa de mensagem (`waSendMessage`) | `POST /api/send-message` do bot | ❌ falha |
| Aba WhatsApp → anexo (`waSendFile`) | `POST /api/send-media` do bot | ❌ falha |
| Chat inline no CRM | mesmo `waSendMessage` | ❌ falha |
| Tarefas de Hoje (`TodayTasks`) | `wa.me` (abre o WhatsApp do aparelho) | ✅ funciona |
| Modal de resgate (`RescueModal`) | `wa.me` | ✅ funciona |
| "Enviar Contrato (WhatsApp)" | gera PDF e **baixa/compartilha** | ⚠️ parcial |
| Botão 📄 PDF no pipeline (`sendOrcWA`) | gera PDF e **baixa** — não envia nada | ⚠️ mentira |

São **dois caminhos de envio paralelos** com comportamentos diferentes, e o
usuário não tem como saber qual está vivo. Pior: o `waSendMessage` engole o erro
num `alert()` genérico e o `sendOrcWA` **registra interação "Orçamento enviado
via WhatsApp" e move o lead para a coluna Orçamento** sem ter enviado nada
(`src/App.jsx:2715` e `2834`). Isso zera o contador de dias sem contato → o lead
some da régua de follow-up. É exatamente o bug nº 5 do plano anterior, que
voltou por outro caminho.

### A API do bot está aberta na internet

`src/index.js:40-46` — CORS `Access-Control-Allow-Origin: *`, sem chave, sem
autenticação em nenhuma rota `/api/*`. Qualquer pessoa com a URL pode:

- `GET /api/leads` e `GET /api/conversations` → **baixar a base de clientes e o
  histórico completo das conversas** (nome, telefone, tudo). Exposição de dados
  pessoais — problema de LGPD, não só de segurança.
- `POST /api/send-message` → **mandar mensagem pelo WhatsApp da empresa** para
  qualquer número.
- `POST /api/run-followups` → disparar a régua de follow-up em massa.

Hoje o dano é limitado porque o provider está desconectado. **No dia em que a
Meta aprovar, isso vira o risco número um**: envio em massa por terceiros derruba
a qualidade do número e pode banir a conta na hora — depois de todo o trabalho da
App Review.

### O que já está bom (não mexer)

- Aba WhatsApp é uma réplica fiel do WhatsApp Web: busca, filtros (não lidas /
  assumidos / qualificados / favoritas / arquivadas), fixar, arquivar, drag-drop
  de arquivo, notificação sonora, contexto por conversa.
- `getDaysSince` já cruza interação manual × `whatsapp_conversations.lastActivity`
  × data de criação (`src/App.jsx:1665`).
- Régua única em `src/components/crm/regua.js`, Tarefas de Hoje, merge por lead
  em `interacoes`/`crmMeta`, taxa de vitória — tudo da v4.7 continua de pé.
- No bot: `meta-cloud.js` completo (texto, template, mídia, anti-eco do
  Coexistence), `/webhook-meta` verificado, páginas `/conectar` e
  `/conectar/trocar` prontas, `crm-sync.js` já grava `crmQuoteId` na conversa.

### O elo perdido: `crmQuoteId`

O bot grava `crmQuoteId` na conversa quando o status do orçamento muda
(`crm-sync.js:78`), mas **o painel nunca lê esse campo** — ele cruza tudo por
telefone normalizado. Resultado: cliente que trocou de número, ou que tem dois
orçamentos, se perde. O vínculo forte já existe no banco e está sendo ignorado.

---

## 2. A decisão de arquitetura

Não faz sentido esperar a Meta para mexer no sistema, nem construir duas vezes.
A proposta é uma **camada única de envio** no painel, com escolha automática de
canal e a mesma interface para toda a aplicação:

```
sendWA({ phone, text, media, quoteId, motivo })
   │
   ├─ canal "bot"      → POST /api/send-message|send-media   (quando o provider está online
   │                                                          e a conversa está na janela de 24h)
   ├─ canal "template" → POST /api/send-template             (fora da janela de 24h, Cloud API)
   └─ canal "wa.me"    → abre o WhatsApp do aparelho          (fallback — funciona SEMPRE)
```

Regras que valem para os três canais:

1. **Interação no CRM só é registrada em sucesso confirmado.** No `wa.me`, só se
   a janela realmente abriu (o `RescueModal` já faz isso — vira o padrão).
2. **Toda mensagem grava de qual canal saiu** (`interacao.canal`), para o
   histórico do lead contar a verdade.
3. **O painel mostra o estado do canal**, sempre visível: 🟢 Oficial conectado ·
   🟡 Modo manual (wa.me) · 🔴 Bot fora do ar.

Com isso, **tudo que for construído agora já funciona hoje em modo manual** e
liga o modo oficial sozinho no dia da aprovação, sem retrabalho.

---

## 3. Fases

### Fase 0 — Fechar a API do bot 🔒 (bloqueante · 2-3h)

Repo `vinil-vale-whatsapp-bot`.

1. Middleware de chave em todas as rotas `/api/*`: header `x-api-key` conferido
   contra `PANEL_API_KEY` (env nova no Railway). Webhooks (`/webhook`,
   `/webhook-meta`) ficam de fora — têm a própria verificação da Meta.
2. CORS com allowlist em vez de `*`: domínio da Vercel do painel + `localhost`
   em dev.
3. Rate limit simples nas rotas de envio (ex.: 30 msg/min por processo) — trava
   de segurança contra loop de código e contra abuso.
4. No painel: `VITE_BOT_API_KEY` nas envs da Vercel, enviado no header por um
   `botFetch()` único.

> Chave no bundle do front é ofuscação, não segurança — mas já elimina o
> varredor automático e o curioso com a URL. A blindagem real (proxy autenticado
> pelo Firebase Auth) fica registrada na Fase 5; não vale segurar o resto por ela.

### Fase 1 — Camada única de envio + verdade no CRM (1 dia)

Painel. Arquivo novo `src/services/wa.js`.

1. `getChannelStatus()` — consulta `GET /api/status` do bot a cada 60s, com
   cache; devolve `oficial | manual | offline`.
2. `sendWA()` com a cascata da seção 2 e retorno `{ ok, canal, erro }`.
3. **Migrar todos os pontos de envio** para ela: `waSendMessage`, `waSendFile`,
   chat inline do CRM, `TodayTasks`, `RescueModal`, contrato.
4. **Corrigir o falso positivo do `sendOrcWA`**: o botão 📄 passa a fazer
   "gerar PDF → enviar de verdade" quando o canal está oficial (o endpoint
   `/api/send-media` já aceita base64 — o PDF já é gerado como blob, é só
   converter); em modo manual, baixa o PDF **e** abre o `wa.me` com o texto
   pronto, avisando "anexe o PDF baixado". Só registra interação e move o lead
   para Orçamento **depois** de um dos dois confirmar.
5. Badge de estado do canal no topo da aba WhatsApp e no CRM.

Entrega desta fase: **nenhum botão do sistema mente mais**, e o follow-up volta a
ser confiável mesmo com o bot fora do ar.

### Fase 2 — WhatsApp de verdade dentro do CRM (1-2 dias)

O pedido central: hoje o WhatsApp é uma aba separada que espelha o WhatsApp Web.
Ele precisa virar parte do fluxo de venda.

1. **Vínculo forte lead ↔ conversa**: usar `crmQuoteId` (já gravado pelo bot)
   como chave primária, telefone como fallback. Botão "vincular esta conversa a
   um orçamento" quando o automático não achar, e "criar orçamento a partir desta
   conversa" (puxa nome/telefone/`leadData` do bot direto para o formulário).
2. **Painel do lead dentro do chat**: abrindo uma conversa na aba WhatsApp,
   coluna lateral com o orçamento vinculado — valor, etapa do pipeline, dias sem
   contato, próximo contato agendado, notas — com ações (mover etapa, agendar,
   enviar PDF) sem sair da conversa.
3. **Respostas rápidas** (`/` no campo de texto): biblioteca editável de
   mensagens com variáveis (`{{nome}}`, `{{valor}}`, `{{prazo}}`), guardada em
   `users/{uid}/config/respostasRapidas`. É o item que mais economiza tempo no
   dia a dia e não depende da Meta.
4. **Timeline unificada na ficha do lead**: mensagens reais do WhatsApp +
   interações manuais + mudanças de etapa em uma linha do tempo só, em ordem
   cronológica. Hoje são duas listas separadas que ninguém cruza.
5. **Indicador da janela de 24h** por conversa (a Cloud API só permite texto
   livre dentro dela): "livre por mais 6h" / "fora da janela — só template".
   Preparado agora, acende sozinho na aprovação.

### Fase 3 — Upgrade do CRM (2-3 dias)

1. **Cadência automática de follow-up** — o `followup.js` do bot já tem a
   estrutura e o agendador de hora em hora; falta plugar na régua do painel
   (`regua.js`: 5d · quente ≤2 · morno ≤7 · frio ≤14 · resgate 3/9/20/45) e
   **parar a sequência assim que o cliente responder**. Enquanto não houver
   template aprovado, a cadência **sugere** em Tarefas de Hoje em vez de enviar
   sozinha — mesma régua, um clique de distância.
2. **Lead scoring** — prioridade = valor × recência × engajamento (respondeu no
   WhatsApp?) × etapa. Ordena o pipeline e as Tarefas de Hoje por "quem fecha
   primeiro". Os três dados já existem.
3. **SLA de primeiro contato** — alerta quando um lead novo do WhatsApp passa 1h
   sem resposta humana. A própria análise de perdas do sistema mostra "sem
   retorno" como causa dominante.
4. **Kanban drag & drop** + tempo médio em cada etapa (hoje mover é um `<select>`
   escondido de 7px) + "parado há X dias nesta etapa" no card.
5. **Push notification (PWA)** — o app já é PWA (`vite-plugin-pwa`); notificação
   de manhã com as tarefas do dia e na chegada de mensagem nova.
6. **Motivo de perda obrigatório** ao mover para Perdido (o `LostReasonModal` já
   existe, só não é obrigatório) — sem isso a análise de perdas fica cega.

### Fase 4 — Migrar os follow-ups do bot para templates ⚠️ (comece ANTES da aprovação)

**Esta fase não é um checklist de 1-2h — é a que tem o maior prazo externo.**

#### O problema: a janela de 24h

Todo o `followup.js` envia **texto livre** (`sendText`, chamado num ponto só:
`sendFollowup()` em `src/services/followup.js:93`). A Cloud API oficial só aceita
texto livre **dentro de 24h da última mensagem do cliente**; fora disso exige
**template aprovado pela Meta**, ou rejeita com erro **131047**.

E o gatilho de todos os follow-ups é, por definição, "faz N dias que ninguém
fala" — ou seja, **todos nascem fora da janela**:

| Follow-up | Gatilho | Na janela? |
|---|---|---|
| `no_response_1d` / `2d` / `3d` | cliente não responde há 1-3 dias | ❌ |
| `quote_24h` / `1d` / `3d` / `7d` / `14d` / `30d` | orçamento enviado há 1-30 dias | ❌ |
| `post_sale_30d` (avaliação Google) | 30 dias após fechar | ❌ |
| `birthday_{ano}` | aniversário do cliente | ❌ |
| 14 datas comemorativas (`HOLIDAYS`) | feriado | ❌ |

Hoje funcionam porque o Z-API é não-oficial e ignora a regra. **No dia da
migração, todos param de sair** se nada for feito.

#### No código: mudança pequena e cirúrgica

A arquitetura ajudou — todos os envios passam por `sendFollowup()`.

1. `sendFollowup()` decide o canal: dentro da janela → `sendText` (mais barato e
   sem aprovação); fora → `sendTemplate`, que o `meta-cloud.js` **já tem pronto**.
2. Arquivo novo de mapa: `chave do follow-up → nome do template + parâmetros`.
3. Fallback registrado quando não existe template para a chave — não pode falhar
   em silêncio.

**Não muda**: agendador, régua de dias, dedupe por `followups.{key}`,
`resolveClientName`, delays anti-ban, `index.js`, `claude.js`, `conversation.js`,
`crm-sync.js`. O projeto inicial do bot fica de pé.

#### Fora do código: é aqui que mora o prazo

São **~11 mensagens únicas + 14 feriados** para submeter e aprovar como template.

- **Prazo**: aprovação vai de minutos a dias, uma por template. Começar assim que
  a conta permitir — não deixar para o dia da liberação.
- **Risco de reprovação**: os textos atuais são bem comerciais ("a agenda do
  Marcos tá quase cheia", "quem fechar agora garante a piscina pra temporada").
  Entram como categoria **MARKETING**, a mais rígida — parte vai precisar de
  reescrita.
- **Custo**: a Meta cobra **por conversa iniciada pela empresa**, e MARKETING é a
  faixa mais cara. Os 14 feriados disparando para a base inteira, hoje gratuitos,
  passam a ter conta no fim do mês. Vale reavaliar quais continuam valendo a pena
  (sugestão: manter aniversário e pós-venda, cortar a maioria dos feriados).

#### Checklist do dia da aprovação (aí sim, 1-2h)

1. `/conectar` → QR do Coexistence no app → `/conectar/trocar` → colar
   `META_WA_TOKEN` + `META_WA_PHONE_ID` no Railway.
2. Assinar o campo `smb_message_echoes` no webhook (senão as mensagens enviadas
   pelo celular não aparecem no painel).
3. Rota `POST /api/send-template` no bot expondo o `meta-cloud.sendTemplate`
   (usada também pelo painel, Fase 1).
4. Trocar o token de 60 dias por **system user token permanente** — senão o canal
   cai sozinho a cada dois meses.
5. Ligar a cadência automática da Fase 3 no modo "envia" em vez de "sugere".
6. Rodar `POST /api/run-followups` e conferir nos logs se algum caiu em 131047.

> `followup_orcamento_5d` já está PENDING na Meta (id 1039772525192160) — é o
> primeiro teste real de que o caminho template funciona ponta a ponta.

### Fase 5 — Dívida técnica (contínuo)

- `App.jsx` com 4.001 linhas — quebrar por aba (o CRM e a aba WhatsApp saem
  primeiro, são os que mais vão mudar daqui pra frente).
- Bundle e code-splitting (three.js + jspdf + html2canvas já são lazy; falta o
  resto).
- `interacoes`/`crmMeta` em subcoleções de verdade (hoje é documento único com
  merge — funciona, mas cresce sem limite).
- Proxy autenticado por Firebase Auth entre painel e bot, aposentando a
  `PANEL_API_KEY` no front.

---

## 4. Ordem recomendada

| Ordem | Fase | Por quê |
|---|---|---|
| 1º | **0 — fechar a API** | Rápido, e é o único item que fica perigoso no dia da aprovação. |
| 2º | **4 (só a redação dos templates)** | **Tem prazo externo** — submeter cedo, porque aprovação leva dias e pode reprovar. Corre em paralelo com o resto. |
| 3º | **1 — camada de envio** | Faz o sistema parar de mentir e funciona hoje, sem a Meta. |
| 4º | **2 — WhatsApp no CRM** | É o pedido central e não depende da aprovação. |
| 5º | **3 — upgrade do CRM** | Ganho de rotina; a cadência entra em modo "sugere". |
| 6º | **4 (código + checklist)** | Quando a Meta liberar. |

Fases 0 a 3 somam **4 a 6 dias** de trabalho e não dependem de nada externo — mas
a **redação e submissão dos templates da Fase 4 tem que começar junto**, porque é
o único item cujo prazo não está nas nossas mãos. Feito isso, a aprovação da Meta
deixa de ser um bloqueio e vira um interruptor.
