// De onde vêm os clientes que fecham.
//
// POR QUE ISSO EXISTE
// O bot detecta a origem do lead desde sempre: o WhatsApp Business insere um
// cabeçalho quando a conversa nasce de anúncio, e `services/origin.js` no bot
// reconhece Facebook Ads, Instagram Ads, Meta Ads e Google Ads e grava em
// `leadData.como_conheceu`. Fora isso, o próprio cliente às vezes responde de
// onde conheceu, e o bot guarda no mesmo campo.
//
// Esse dado nunca foi lido por nada. Resultado: paga-se anúncio sem saber qual
// canal traz cliente que FECHA — só quanto cada um traz de conversa, que é a
// métrica que engana.
//
// Aqui ele vira: por canal, quantos leads, quantos fecharam, quanto entrou.

const FECHADOS = ["fechou", "execucao", "concluido"];

// Agrupamento por padrão, não por igualdade: o campo é meio detectado, meio
// digitado pelo cliente ("vi no instagram de vocês", "insta", "Instagram Ads").
// Whitelist de padrões conhecidos; o que não bate mantém o texto do cliente.
const CANAIS = [
  { chave: "Instagram Ads", re: /instagram\s*ads|an[uú]ncio.*instagram/i },
  { chave: "Facebook Ads", re: /facebook\s*ads|an[uú]ncio.*facebook|meta\s*ads|an[uú]ncio.*meta/i },
  { chave: "Google Ads", re: /google\s*ads|an[uú]ncio.*google/i },
  { chave: "Instagram", re: /instagram|insta\b|@/i },
  { chave: "Facebook", re: /facebook|face\b/i },
  { chave: "Google / busca", re: /google|pesquis|busca|internet|site/i },
  // `\bindic` e não `indica`: o cliente escreve "indicou", "indicaram",
  // "me indicaram". A borda de palavra evita casar com "sindicato".
  { chave: "Indicação", re: /\bindic|amigo|vizinho|conhecid|parente|compadre|cunhad|cliente de voc|boca a boca/i },
  { chave: "Já era cliente", re: /j[áa]\s*(sou|era|fui)|outra\s*piscina|segunda\s*vez/i },
  { chave: "Placa / carro / rua", re: /placa|carro|rua|passei|vi na|adesiv|banner|outdoor/i },
  { chave: "WhatsApp / grupo", re: /grupo|whats|zap/i },
];

/** Normaliza o texto bruto em um canal. Null quando não há dado. */
export function normalizarCanal(bruto) {
  const txt = String(bruto || "").trim();
  if (!txt || /^(null|undefined|n[aã]o informado|-)$/i.test(txt)) return null;
  for (const c of CANAIS) if (c.re.test(txt)) return c.chave;
  // Sem padrão conhecido: preserva o que o cliente disse, capitalizado. Melhor
  // uma linha "Feira de piscinas" com 2 leads do que jogar no balaio "Outros".
  return txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase();
}

/** A origem de um lead, cruzando o orçamento com a conversa. */
export function origemDoLead(q, conv) {
  return normalizarCanal(conv?.leadData?.como_conheceu) || normalizarCanal(q?.origem);
}

/**
 * Agrega a base por canal de origem.
 *
 * @param {array}    hist         orçamentos
 * @param {function} achaConversa (q) => conv|null
 * @returns {{linhas:array, semOrigem:number, totalLeads:number, cobertura:number}}
 */
export function relatorioOrigem(hist, achaConversa) {
  const mapa = new Map();
  let semOrigem = 0;

  for (const q of hist || []) {
    const canal = origemDoLead(q, achaConversa ? achaConversa(q) : null);
    if (!canal) { semOrigem++; continue; }

    if (!mapa.has(canal)) mapa.set(canal, { canal, leads: 0, fechados: 0, receita: 0, emAberto: 0, valorTotal: 0 });
    const linha = mapa.get(canal);
    const valor = parseFloat(q.tot) || 0;
    const status = q.status || "lead";

    linha.leads++;
    linha.valorTotal += valor;
    if (FECHADOS.includes(status)) { linha.fechados++; linha.receita += valor; }
    else if (status !== "perdido") linha.emAberto++;
  }

  const linhas = [...mapa.values()].map((l) => ({
    ...l,
    // Conversão sobre o total do canal, não só sobre os decididos: aqui a
    // pergunta é "quanto rende cada real de anúncio", e lead que ficou parado
    // custou dinheiro do mesmo jeito.
    conversao: l.leads > 0 ? Math.round((l.fechados / l.leads) * 100) : 0,
    ticket: l.fechados > 0 ? l.receita / l.fechados : 0,
  })).sort((a, b) => b.receita - a.receita || b.leads - a.leads);

  const totalLeads = (hist || []).length;
  return {
    linhas,
    semOrigem,
    totalLeads,
    cobertura: totalLeads > 0 ? Math.round(((totalLeads - semOrigem) / totalLeads) * 100) : 0,
  };
}
