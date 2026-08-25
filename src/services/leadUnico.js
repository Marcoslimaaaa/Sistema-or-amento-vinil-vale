// Um cliente = um lead, mesmo com vários orçamentos.
//
// POR QUE EXISTE
// Cada orçamento é um documento, e é comum o mesmo cliente ter dois: um
// primeiro esboço e o revisado, ou uma versão em vinil e outra em manta. O CRM
// contava cada documento como um lead — então o funil mostrava o Célio e a
// Regiane duas vezes, e a taxa de conversão dividia os fechamentos por um
// total inflado.
//
// Regra do Marcos (2026-08-24):
//   1. dois ou mais orçamentos do mesmo cliente contam como UM lead;
//   2. quando fecha, o valor contado é o DO QUE FECHOU — o outro orçamento não
//      vira receita nem perda.
//
// Enquanto nada fechou, o valor do cliente é o do orçamento mais avançado, não
// a soma: o cliente vai contratar um serviço, não os dois. Somar inflaria o
// pipeline com dinheiro que nunca existiu.

import { normalizePhone } from "../components/crm/regua.js";

// Ordem do funil. Quem representa o cliente é sempre o orçamento mais avançado.
const PESO_ETAPA = {
  concluido: 6, execucao: 5, fechou: 4, negociacao: 3, orcamento: 2, lead: 1, perdido: 0,
};

const GANHOS = ["fechou", "execucao", "concluido"];

function texto(v) {
  return String(v || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Identidade do cliente por trás de um orçamento.
 *
 * Telefone primeiro (é o que não se repete por acaso), comparado pelos últimos
 * 8 dígitos para casar com e sem o 9. Sem telefone, cai em nome+cidade — é o
 * caso dos orçamentos que o Gercione (parceiro) pede, que entram só com o nome.
 * Sem nada disso, o orçamento fica sozinho no seu próprio grupo: agrupar dois
 * anônimos seria pior que não agrupar.
 */
export function chaveCliente(q) {
  const tel = normalizePhone(q?.data?.client?.phone || q?.tel || "");
  const dig = String(tel || "").replace(/\D/g, "");
  if (dig.length >= 8) return "tel:" + dig.slice(-8);

  const nome = texto(q?.data?.client?.name || q?.cN);
  if (nome) return "nome:" + nome + "|" + texto(q?.data?.client?.city || q?.cC);

  return "orc:" + String(q?.id ?? Math.random());
}

function maisAvancado(lista) {
  return [...lista].sort((a, b) => {
    const p = (PESO_ETAPA[b.status] ?? 1) - (PESO_ETAPA[a.status] ?? 1);
    if (p !== 0) return p;
    return Number(b.id) - Number(a.id); // empate: o mais novo
  })[0];
}

const valorDe = (q) => parseFloat(q?.tot) || 0;

/**
 * Agrupa orçamentos por cliente.
 *
 * @returns {Array<{chave, orcamentos, principal, status, valor, ganhou, duplicado}>}
 *   valor  — soma dos ganhos quando há fechamento; senão o do mais avançado
 *   duplicado — o cliente tem mais de um orçamento
 */
export function agruparLeads(hist) {
  const grupos = new Map();
  for (const q of hist || []) {
    if (!q) continue;
    const k = chaveCliente(q);
    if (!grupos.has(k)) grupos.set(k, []);
    grupos.get(k).push(q);
  }

  return [...grupos.entries()].map(([chave, orcamentos]) => {
    const ganhos = orcamentos.filter((q) => GANHOS.includes(q.status));
    const perdas = orcamentos.filter((q) => q.status === "perdido");

    // PERDA NÃO PODE SUMIR NA JUNÇÃO.
    //
    // Vários clientes têm o mesmo orçamento em duas contas do painel: numa ele
    // está marcado como perdido, com motivo escrito ("achou caro", "fechou com
    // concorrente"), e na outra ficou parado em `lead`. Escolher só o "mais
    // avançado" descartava a perda classificada e zerava a análise de perdas.
    //
    // `lead` é o estado inicial de qualquer orçamento — não é decisão de
    // ninguém. Já `orcamento`, `negociacao` e `execucao` são movimento real e
    // posterior; havendo um desses, o cliente segue vivo apesar da perda antiga.
    const ATIVAS = ["orcamento", "negociacao", "execucao"];
    const temAtivaReal = orcamentos.some((q) => ATIVAS.includes(q.status));
    const perdidoEfetivo = ganhos.length === 0 && perdas.length > 0 && !temAtivaReal;

    const principal = perdidoEfetivo
      ? [...perdas].sort((a, b) => valorDe(b) - valorDe(a))[0]
      : maisAvancado(orcamentos);

    return {
      chave,
      orcamentos,
      principal,
      status: perdidoEfetivo ? "perdido" : (principal.status || "lead"),
      // O que fechou é o que conta. Sem fechamento, o mais avançado — nunca a soma.
      valor: ganhos.length ? ganhos.reduce((s, q) => s + valorDe(q), 0) : valorDe(principal),
      ganhou: ganhos.length > 0,
      perdido: perdidoEfetivo,
      duplicado: orcamentos.length > 1,
    };
  });
}

/**
 * Métricas do funil contando CLIENTE, não documento.
 *
 * Cliente que perdeu um orçamento e fechou outro é uma venda, não uma perda.
 * Cliente com um orçamento perdido e outro só encostado em `lead` continua
 * sendo uma perda — ver `perdidoEfetivo` em agruparLeads.
 */
export function metricasFunil(hist) {
  const grupos = agruparLeads(hist);

  const fechados = grupos.filter((g) => g.ganhou);
  const perdidos = grupos.filter((g) => g.perdido);
  const ativos = grupos.filter((g) => !g.ganhou && !g.perdido && g.status !== "concluido");

  const receita = fechados.reduce((s, g) => s + g.valor, 0);
  const decididos = fechados.length + perdidos.length;

  return {
    leads: grupos.length,
    fechados: fechados.length,
    perdidos: perdidos.length,
    ativos: ativos.length,
    receita,
    ticketMedio: fechados.length ? receita / fechados.length : 0,
    txConv: grupos.length ? Math.round((fechados.length / grupos.length) * 100) : 0,
    winRate: decididos ? Math.round((fechados.length / decididos) * 100) : 0,
    maiorValorAtivo: Math.max(0, ...ativos.map((g) => g.valor)),
    // Quantos documentos a mais existem além de um por cliente. É o número que
    // explica a diferença entre "leads" e o tamanho da lista de orçamentos.
    orcamentosExtras: grupos.reduce((s, g) => s + (g.orcamentos.length - 1), 0),
  };
}

/**
 * Mapa { [idDoOrcamento]: { quantos, ehPrincipal } } para a lista marcar quais
 * cards são o segundo orçamento do mesmo cliente.
 */
export function mapaDuplicados(hist) {
  const mapa = {};
  for (const g of agruparLeads(hist)) {
    if (!g.duplicado) continue;
    for (const q of g.orcamentos) {
      mapa[q.id] = { quantos: g.orcamentos.length, ehPrincipal: String(q.id) === String(g.principal.id) };
    }
  }
  return mapa;
}
