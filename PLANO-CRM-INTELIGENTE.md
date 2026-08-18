# Plano — CRM inteligente (Vinil Vale)

Levantado em 2026-08-18 lendo o código dos dois repos (`orcamentos-vinil-vale` e
`vinil-vale-whatsapp-bot`) e os números medidos em 12/08 com dados reais.

> **Estado em 18/08, madrugada:** os blocos 1 a 4 estão **construídos e
> testados, mas NÃO publicados** — nada foi commitado, nada foi para a Vercel
> nem para o Railway, e nenhum dado real foi tocado. O resumo do que foi feito
> está na seção 6, no fim deste arquivo.

---

## 1. Estado do setup

### Bot — está configurado e no ar
- Produção responde `version 1.9.0`; o `master` local está sincronizado com o
  remoto (nada represado).
- Canal Cloud API oficial, número real, réguas rodando, pausa de follow-up
  (`/pausar` + opt-out automático), corte de backlog, handoff sem corrida.

### Templates — falta 1 de 10
9 aprovados cobrem 12 das 14 chaves. **Falta `quote_3d`** (faixa de 3 a 6 dias):
o template `followup_orcamento_duvidas` foi submetido em 29/07 e o `name` em
`src/config/templates.js:70` continua vazio — ou seja, todo lead que está entre
o 3º e o 6º dia depois de receber o orçamento **não recebe nada**, e o
diagnóstico de 12/08 achou uma conversa parada exatamente nessa faixa.

`12-31` (véspera de ano novo) também está sem template, mas isso foi decisão.

Conferir com:

```
META_WA_TOKEN=... node scripts/criar-templates.js --status
```

---

## 2. Os furos do CRM

### 2.1 A etapa do funil é ficção — e ela é a base de tudo

Medido em 12/08, sobre 170 orçamentos:

| Etapa | Quantidade |
|---|---|
| lead | 157 |
| fechou | 10 |
| orçamento | 4 |
| negociação | 1 |
| **perdido** | **0** |

92% da base está parada em "lead". Só existe **uma** automação de etapa (entrega
do orçamento → move para "Orçamento", feita em 13/08); todo o resto depende de o
Marcos arrastar card. Ele não arrasta — e não deveria precisar.

O estrago é em cascata, porque quase todo cálculo do painel lê esse campo:

- **Funil, taxa de conversão, ticket médio, tempo por etapa** — calculados sobre
  um campo que ninguém preenche. Os números estão errados, não incompletos.
- **Aba Perdas** (`src/components/dashboard/LossAnalysis.jsx`, 210 linhas) —
  estruturalmente vazia: com zero leads perdidos não há o que analisar.
- **Lead score** (`src/services/score.js`) pesa a etapa (`ETAPA_PESO`). Com todo
  mundo em "lead" esse fator vira constante e o score perde um terço do sinal.

### 2.2 O painel não vê o que o bot manda

`sendFollowup` (`src/services/followup.js:228`) grava **só** o carimbo
`followups.<chave>`. Não chama `addAssistantMessage`, e o eco do envio pela API
volta com `fromApi: true` — que o webhook descarta de propósito
(`src/index.js:281`).

Consequências, as duas reais:

1. **O follow-up automático não aparece no chat do painel.** O Marcos abre a
   conversa e não vê a mensagem que o cliente recebeu ontem em nome dele.
2. **`lastActivity` não avança** → `getDaysSince` no painel continua contando
   desde a última mensagem real → o lead segue em "Tarefas de Hoje" marcado como
   "12d sem contato" mesmo tendo sido cutucado ontem.

### 2.3 Duas réguas paralelas que não se falam

| | Gatilho | Texto |
|---|---|---|
| Bot | `quoteSentAt` → dias 1, 2, 3, 7, 14, 30 | `followup.js` |
| Painel | `REGUA.followUp = 5` dias sem contato | `getRescueMsg` |

`TodayTasks` recebe `hist, getDays, crmNextContact` — **não recebe as conversas
nem os carimbos `followups.*`**. Ele não tem como saber que o bot já mandou.
O botão "💬 Enviar" dispara um texto diferente do que o bot usa, e nada impede
duas mensagens no mesmo dia.

É a mesma classe do bug de sobreposição corrigido na v1.6.1 (sem-resposta ×
orçamento), só que atravessando painel e bot em vez de duas réguas do bot.

### 2.4 Dado coletado e jogado fora

O bot coleta 8 campos obrigatórios + 10 opcionais + origem do lead. O painel
mostra 9 no drawer do chat e **nenhum** no CRM.

Nunca usados em lugar nenhum:

- **`como_conheceu` / origem detectada** — o bot identifica Facebook Ads,
  Instagram Ads, Meta Ads e Google Ads pelo cabeçalho do WhatsApp Business
  (`src/services/origin.js`) e grava no lead. **Não existe nenhum relatório de
  conversão por canal.** Paga-se anúncio sem saber qual traz cliente que fecha.
- **`cep` / `cidade`** — o raio de atendimento é regra do negócio (200km de
  Registro + Baixada até Santos) e não há nenhum agrupamento por região.
- **`padrao_construcao`** (básico × completo), `prazo`, `acesso_bobcat`,
  `aquecimento`, `dispositivos`, `escopo_reforma` — sinais de qualificação e de
  valor que não entram no score nem em filtro.
- **`birthday`** — gravado, serve só para o disparo automático; não aparece no
  CRM.

### 2.5 Lead sem orçamento não existe no CRM

O funil é a lista de orçamentos (`hist`). Quem conversa com o bot e não chega a
receber PDF não está em coluna nenhuma. O próprio `LeadNoChat` admite:
"Esta conversa não está ligada a nenhum orçamento, então não entra no funil nem
na régua de follow-up."

### 2.6 Sem log de transição, não existe métrica de tempo

`stageSince` guarda só a data da **última** mudança. Não há histórico de
transições — então "quanto tempo leva para fechar", "onde os leads travam" e
"conversão etapa a etapa" não são calculáveis, só chutáveis.

---

## 3. Plano

### Bloco 0 — fechar o setup (sem código novo)

- [ ] `--status` no script de templates; preencher `quote_3d` se aprovado, ou
      reenviar.
- [ ] `POST /api/run-followups` + raio-x, confirmar a contagem no log.

### Bloco 1 — fazer a etapa virar verdade (destrava todo o resto)

**1.1 Etapa dirigida por evento, com confirmação de um clique.**
Uma barra no topo do CRM: *"4 leads mudaram de estado — revisar"*, cada linha
com o motivo e um botão. As sugestões saem do que já está no banco:

| Sinal (já existe) | Sugestão |
|---|---|
| Cliente respondeu depois do `quoteSentAt` | → Negociação |
| `followupPausado` por pedido do cliente | → Perdido (motivo: pediu para parar) |
| 45+ dias sem resposta com orçamento entregue | → Perdido (motivo: sumiu) |
| `dealClosedAt` | → Fechou (já sincroniza com o financas-pessoal) |

Confirmação em vez de movimento automático porque "Perdido" é irreversível na
cabeça de quem usa — e porque o `FOLLOWUP_CUTOFF` já ensinou que automação
disparando sozinha sobre base histórica gera estrago em massa.

**1.2 `stageLog: [{de, para, quando, por}]`** em cada orçamento. Sem isso,
nenhuma métrica de tempo existe. É barato e só serve para frente.

**1.3 Backfill dos 157 em "lead".** Script que classifica pelo que já está no
banco e propõe a etapa em lote, para aprovação de uma vez só. Sem isso o
histórico continua mentindo mesmo com o 1.1 no ar.

### Bloco 2 — unificar as duas réguas

**2.1 O follow-up automático entra no histórico da conversa**
(`addAssistantMessage` dentro do `sendFollowup`, marcado como automático).
Resolve o 2.2 inteiro: aparece no chat do painel e o `lastActivity` passa a
refletir a realidade.

**2.2 `TodayTasks` passa a receber as conversas.** Some da lista quem o bot
cutucou nas últimas 48h; nas demais, mostra na linha *"bot mandou quote_7d há 2
dias"*. Respeita `followupPausado`.

**2.3 Dividir o trabalho explicitamente.** O bot cobre as batidas automáticas; a
tarefa humana passa a ser o que ele não faz — ligar por telefone, lead sem
WhatsApp, lead acima de X reais, e lead que respondeu e está esperando (o alerta
de SLA já existe e é o melhor sinal do sistema).

### Bloco 3 — usar o que já está no banco

**3.1 Ficha do lead no CRM** com o `leadData` inteiro, não os 9 campos do drawer.

**3.2 Relatório de origem** — leads / orçamentos / fechados / receita por
`como_conheceu`. É a métrica que decide onde gastar anúncio, e o dado já está
gravado desde sempre. **Maior retorno por linha de código de todo o plano.**

**3.3 Score com os sinais reais** — padrão de construção, tipo de serviço,
distância pelo CEP, além do que já entra hoje.

**3.4 Alerta de região** — lead fora do raio marcado antes de consumir tempo.

### Bloco 4 — inteligência de verdade (usa LLM, tem custo)

**4.1 Resumo da conversa no card do lead**: *"quer trocar vinil de 8×4 em
Itanhaém, orçou 14k, achou caro, pediu parcelamento"*. Hoje é preciso ler a
conversa inteira para saber onde parou.

**4.2 Motivo de perda classificado a partir da conversa** (preço / prazo /
concorrente / sumiu / fora de área). Resolve a aba Perdas vazia **sem exigir
digitação** — que é exatamente a razão de ela estar vazia.

**4.3 Sugestão de próxima ação** por lead, com o texto pronto para revisar.

Custo: ~170 conversas × 1 chamada, sob demanda (não em loop). Com Haiku fica em
centavos. O texto do cliente entra como conteúdo não confiável, delimitado, e a
tool não ganha poder destrutivo.

---

## 4. Ordem recomendada

`Bloco 0` → `3.2` → `Bloco 1` → `Bloco 2` → resto do `3` → `Bloco 4`

O 3.2 (relatório de origem) fura a fila porque é pequeno, independente e é o
único item que responde uma pergunta de dinheiro que hoje não tem resposta
nenhuma.

**Se fosse uma coisa só: Bloco 1.** Enquanto 92% da base estiver em "lead", todo
número do painel está errado e nenhuma inteligência construída em cima vale.

---

## 5. Regras de entrega

- Proposta visual em **rota isolada + noindex**, nunca direto na tela no ar.
- `git status` limpo antes de entregar.
- Nada de disparo retroativo: toda régua ou automação nova conferida contra
  carimbo de "já fiz isso" **antes** de ligar (lição do `FOLLOWUP_CUTOFF`).


---

## 6. O que foi construído (18/08, madrugada)

Tudo roda local e passa nos testes. **Nada publicado, nada commitado, nenhum
dado real alterado** — o `git status` dos dois repos mostra só arquivos novos e
modificados, esperando revisão.

### A decisão que mudei no meio do caminho, e por quê

Ficou combinado "mover sozinho, menos Perdido". Ao ler o `crm-sync.js` do bot
antes de escrever, apareceu o motivo de **`Fechou` também não poder ser
automático**:

| Mover para | O que o bot faz |
|---|---|
| `negociacao` | nada — não existe tratamento para este status |
| `orcamento` | grava `quoteSentAt = agora` **se a conversa não tiver a data** → liga a régua de follow-up com o relógio zerado |
| `fechou` | **envia "obrigado por fechar 🎉" ao cliente** e marca `dealClosedAt`; no painel ainda lança conta a receber no financas-pessoal |
| `perdido` | só registra no log |

Classificar `fechou` errado não desalinha um card: manda uma mensagem
constrangedora para quem não comprou e lança receita falsa no financeiro. Então
`fechou` foi para a fila de confirmação junto com `perdido`. **Se preferir o
automático mesmo assim, é uma linha** (`automatico: true` no ramo do `fechou`
em `src/services/etapaAuto.js`).

O mesmo raciocínio salvou o caso de `orcamento`: só é automático quando a
conversa **já tem** `quoteSentAt`. Quando não tem, aplicar ligaria a régua
contando de hoje — e mover 157 leads de uma vez faria a base inteira receber
mensagem paga em 24h. Esse caso aparece na lista de conferir, com o aviso
escrito.

### Bloco 1 — a etapa vira verdade ✅

- **`src/services/etapaAuto.js`** — motor puro, 51 testes. Deduz a etapa de
  orçamento + conversa; separa o que é seguro do que precisa de confirmação.
- **`src/components/crm/RevisaoEtapas.jsx`** — barra no topo do Pipeline:
  *"🎯 Etapas a ajustar (N) — X sem risco · Y para conferir"*, com "Arrumar N"
  em lote, "Mover"/"Ignorar" por lead e o interruptor **"Arrumar sozinho"**.
- **`stageLog`** em cada orçamento (`{de, para, quando, por, motivo}`).
- **O backfill dos 157 é o próprio botão "Arrumar N"** — não precisou de script
  separado.

Duas armadilhas evitadas, que valem a leitura:

1. **A reclassificação NÃO registra interação.** `addInteracao` alimenta o
   `getLastContact` → `getDaysSince`. Registrar zeraria o "dias sem contato" da
   base inteira, esvaziando as Tarefas de Hoje e escondendo justo quem espera
   contato. O rastro fica no `stageLog`.
2. **`stageSince` recebe a data do EVENTO, não a de agora** — senão o painel
   diria "0 dias nesta etapa" para todo mundo e o tempo médio por etapa do
   Analytics nasceria zerado.

O interruptor **começa desligado**: a primeira passada mexe na base inteira, e
isso é para ser visto acontecendo antes de virar rotina.

### Bloco 2 — as duas réguas conversam ✅

- **Bot:** `sendFollowup` agora grava a mensagem no histórico
  (`addAssistantMessage` com `{auto:'followup', chave, template}`). Resolve os
  dois sintomas de uma vez: o follow-up aparece no chat do painel e o
  `lastActivity` passa a refletir a realidade.
  - Fora da janela o cliente lê o **template**, não o texto livre. Gravar o
    texto livre encheria o painel de mensagens que o cliente nunca leu, então
    nesse caminho vai registrado o template que saiu.
- **Painel:** `src/services/reguaBot.js` (27 testes) + `TodayTasks` — quem o bot
  cutucou nas últimas 48h sai da lista; quem pediu para parar sai sempre; nos
  que ficam aparece *"🤖 bot mandou 'condições de pagamento' há 2 dias"*.

### Bloco 3 — o dado que estava no banco ✅

- **`src/services/origem.js`** + **`OrigemReport.jsx`** (41 testes) — nova visão
  **📣 Origem** na aba CRM: leads, fechados, conversão e receita por canal,
  com o canal que mais fatura em destaque e a cobertura do dado no rodapé
  (sem ela a tabela mentiria por omissão).
- **`src/services/fichaLead.js`** + **`FichaLead.jsx`** (31 testes) — a ficha
  inteira do bot (18 campos, agrupados) na ficha do lead do CRM **e** no drawer
  da conversa, que antes mostrava 9 campos fixos. Com barra de completude e a
  linha "falta perguntar".

### Bloco 4 — leitura da conversa por IA ✅

- **Bot:** `src/services/analise.js` + `POST /api/analisar/:phone` (29 testes).
  Devolve resumo, próxima ação, temperatura e **motivo de perda classificado** —
  que é o que enche a aba Perdas sem depender de digitação.
- **Painel:** botão **"✨ Resumir conversa"** na ficha do lead.

Cuidados: **sob demanda, nunca em lote** (cada clique custa); rate limit
**próprio**, separado do de envio de mensagem (envio demais queima o número na
Meta, análise demais queima a fatura da Anthropic — baldes diferentes); conversa
entra delimitada e declarada como dado não confiável, com o pedido depois do
bloco; **nenhuma tool na chamada**, então o pior que um texto malicioso faz é um
resumo errado na tela; tamanho cortado em 60 mensagens / 24k caracteres. Modelo
padrão `claude-haiku-4-5` (`ANALISE_MODEL` troca).

O resultado **não é gravado**: cache de resumo envelhece calado, e a conversa
muda todo dia.

### Testes

| Onde | Antes | Agora |
|---|---|---|
| Painel (`npm test`) | 86 | **236** |
| Bot (scripts) | corte, opt-out, régua assumida | + `teste-analise.js` |

Verificação visual dos componentes novos em `sandbox.html`
(`npm run dev` → `/sandbox.html`), com os estados de erro e de lista vazia.

### O que ficou pendente, e por quê

1. **Template `quote_3d`** — precisa do `META_WA_TOKEN`, que eu não tenho e não
   devo receber por conversa. Rodar:
   `META_WA_TOKEN=... node scripts/criar-templates.js --status`
2. **Deploy** — nada foi publicado. A ordem importa: **painel primeiro, bot
   depois** (o painel só lê campos que o bot já grava; o inverso não vale).
3. **`firestore.rules` / `storage.rules`** continuam modificados desde a
   auditoria de segurança de 12/08, e seguem **fora** de tudo isto — deploy
   separado, com a ordem do `docs/SEGURANCA.md`.
4. **Medir de novo antes de ligar o automático.** Os números de etapa são de
   12/08. Vale abrir o CRM, ver o que a barra propõe e conferir alguns nomes
   antes de clicar em "Arrumar N".
