# Plano de Melhoria — Sistema de Orçamentos Vinil Vale

Auditoria feita em 06/07/2026. Código analisado: `main` (f740365), App v4.5 → v4.6 após correções.

---

## 1. Corrigido nesta rodada (v4.6)

### 🐛 Bug principal: orçamentos feitos no celular sumiam
**Causa raiz (3 problemas combinados):**
1. **Sem persistência offline do Firestore** — gravações feitas sem internet ficavam só na memória; fechou o app antes de reconectar, perdeu.
2. **`saveFS` falhava em silêncio** — se o Firebase ainda não tinha conectado (comum no celular, rede lenta), a função retornava sem salvar na nuvem, mas a tela mostrava "Salvo!".
3. **Sync substituía em vez de mesclar** — quando o `onSnapshot` conectava, ele trocava o histórico local inteiro pelos dados da nuvem e sobrescrevia o `localStorage`, apagando o orçamento recém-criado que ainda não tinha subido.

**Correções aplicadas em `src/App.jsx`:**
- Persistência offline ativada (`persistentLocalCache` + multi-tab) — gravações sobrevivem a queda de conexão e fechamento do app, e sincronizam sozinhas ao reconectar.
- Fila de pendências (`vv_pending` no localStorage): todo save entra na fila e só sai quando a nuvem confirma; o sync reenvia o que ficou pendente.
- Merge no sync: orçamentos locais pendentes são preservados e reenviados em vez de apagados.
- Fila de exclusões (`vv_pending_del`): orçamento excluído offline não "ressuscita" no sync.
- Feedback honesto: se não há conexão/login, a mensagem vira "💾 Salvo no aparelho — sincroniza ao conectar".

### 🐛 Listener do WhatsApp rodava antes do login
`whatsapp_conversations` era assinado só com `fbReady`, sem checar `user` → `permission-denied` no console em toda abertura do app. Corrigido com guarda de usuário + handler de erro nos dois listeners.

### 🔧 Outros
- Logout agora limpa também `vv_pending`/`vv_pending_del`.
- `npm audit fix` aplicado: 9 vulnerabilidades → 2 (todas eram no `protobufjs`, transitiva do Firebase).

---

## 2. Problemas encontrados que AINDA precisam de decisão/ação

### 🔴 SEGURANÇA — urgente
1. **Qualquer conta Google entra no sistema.** O botão "Entrar com Google" aceita qualquer pessoa; não existe allowlist. Como as rules dão acesso a `whatsapp_conversations`, `whatsapp_leads` (leitura) e `google_contacts` (leitura E escrita) para *qualquer autenticado*, um estranho logado com Google vê as conversas e os leads dos seus clientes.
   **Fix sugerido:** allowlist de e-mails/UIDs nas Firestore Rules (ex.: `request.auth.token.email in ['vinilvale@hotmail.com', ...]`) + esconder/validar no app. Precisa de deploy das rules (`firebase deploy --only firestore:rules`).
2. **2 vulnerabilidades npm restantes** (1 moderate, 1 high) — só saem com `npm audit fix --force` (pode quebrar dependência). Avaliar depois com calma.

### 🟡 CONFIABILIDADE
3. **Financeiro/estoque/CRM usam documento único "last-write-wins".** `receber`, `pagar`, `fixas`, `estoque`, `fornecedores`, `interacoes` são cada um UM doc com um array inteiro. Dois aparelhos abertos = um sobrescreve o outro. A persistência offline reduziu o risco, mas o certo é migrar para subcoleções (1 doc por lançamento), como já é nos orçamentos.
4. **`package.json` diz v4.4.0, app diz v4.6** — alinhar versões.

### 🟡 PERFORMANCE (afeta direto o uso no celular)
5. **Bundle principal de 1,6 MB (462 KB gzip)** + chunk 3D de 883 KB. Em 4G fraco isso é o app demorando ~10s pra abrir — e contribui para o cenário do bug (salvar antes do Firebase conectar). Fix: code-splitting por aba (`React.lazy` para WhatsApp, Financeiro, Estoque, Contratos), `manualChunks` para firebase/recharts/jspdf.
6. **`App.jsx` com 4.400 linhas** — extrair cada aba para `src/components/<aba>/` (o padrão já começou com `rescue/` e `dashboard/`). Facilita manutenção e o code-splitting acima.

### 🟢 MENOR
7. Fontes de 7–9px em vários botões (ilegível no celular); alvos de toque < 40px.
8. PWA: falta `manifest.json` + service worker — instalável na tela inicial e abre offline (casa com a persistência nova).
9. `getRedirectResult` é chamado mas o login Google usa só popup; em Safari iOS popup falha às vezes — considerar fallback `signInWithRedirect`.

---

## 3. Roadmap sugerido (ordem de ataque)

| Fase | O quê | Esforço |
|------|-------|---------|
| 1 | Allowlist nas rules + deploy (item 1) | 1h |
| 2 | PWA (manifest + SW) e ajustes de toque/fonte mobile | 3h |
| 3 | Code-splitting por aba + manualChunks | 4h |
| 4 | Quebrar App.jsx em módulos por aba | 1 dia |
| 5 | Migrar financeiro/estoque para subcoleções | 1 dia |
| 6 | Redesign do frontend (abaixo) | 2–3 dias |

---

## 4. Proposta de frontend novo — "cara de ferramenta profissional, não de template de IA"

O que denuncia "site de IA" hoje: emojis como ícones, gradiente azul genérico, Segoe UI, cards arredondados iguais, densidade aleatória (fonte 7px ao lado de 22px). A proposta é assumir a identidade **"ferramenta de bancada de quem constrói piscina"** — instrumento de trabalho, não dashboard de startup.

**Identidade (aproveita o que a marca já tem):**
- Paleta: azul-profundo `#0a1f44` (já é a cor do PDF) como estrutura, **turquesa-água** `#2dd4bf` como ação/destaque, **amarelo-medida** `#e8b100` (já usado no cabeçalho do PDF) só para alertas e totais. Fundo claro `#f4f6f8` levemente frio.
- Tipografia: **Archivo** (títulos, semi-expandido, remete a placa de obra) + **Inter** no corpo em 13–14px mínimos + **números tabulares monoespaçados** em todo valor de R$ e medida (m², m³) — valores alinham em coluna como planilha de engenheiro.
- Ícones: **Lucide** (traço fino consistente) no lugar de todos os emojis. Emojis só em mensagens de feedback.
- Detalhe de personalidade: separadores e bordas com **motivo de régua/escala métrica** (tracinhos de medida) nos cards de piscina — liga o visual ao ofício. Cantos pouco arredondados (4–6px), sombras curtas. Nada de glassmorphism/gradiente roxo.

**Estrutura:**
- **Mobile-first de verdade**: barra de navegação inferior com 5 itens (Orçamento, Salvos, Pipeline, WhatsApp, Mais) em vez do hambúrguer — no campo se usa com uma mão. Sidebar atual continua no desktop.
- Editor de orçamento como **stepper horizontal** (Cliente → Piscina → Custos → Valor → Planta) com total sempre visível num rodapé fixo ("taxímetro").
- Indicador de sincronização discreto no topo: ☁️ verde = tudo na nuvem, ↻ laranja = pendente sincronizando (usa a fila `vv_pending` nova — o usuário nunca mais fica na dúvida se salvou).
- Tela de login com foto real de obra da Vinil Vale de fundo (tem no Instagram @vinilvaleoficial) em vez do gradiente.

Quando aprovar a direção, o redesign entra pela Fase 6 usando a skill de frontend-design, uma aba por vez, sem quebrar as demais.
