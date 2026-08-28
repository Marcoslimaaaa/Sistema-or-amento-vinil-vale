// Agenda de serviço: visita, medição, instalação e manutenção.
//
// POR QUE EXISTE
// O CRM sabia tudo sobre o orçamento e nada sobre o compromisso. Data de visita
// e de instalação viviam na cabeça do Marcos, num papel ou como tag "Visita
// agendada" — que não diz QUANDO. A régua de follow-up, a etapa do funil e o
// pós-venda dependem de datas que ninguém registrava.
//
// DE PROPÓSITO SIMPLES: marcação à mão, sem sugerir horário, sem lembrete
// automático, sem integração de calendário. O fluxo hoje é baixo e o Marcos
// prefere marcar ele mesmo; automatizar antes de existir hábito seria construir
// para um problema que ninguém tem ainda.
//
// O QUE JÁ FICA PRONTO PARA DEPOIS: cada agendamento guarda cidade e região, e
// `outrosNaRegiao` conta quem mais está esperando por perto. É a semente do
// agrupamento por rota — que, com clientes de Apiaí a Itanhaém, é onde está o
// dinheiro: uma viagem à Baixada pode render 5 visitas em vez de 1.

export const TIPOS = {
  visita: { label: "Visita / medição", icon: "📍", cor: "#0055a4" },
  instalacao: { label: "Instalação", icon: "🔧", cor: "#16a34a" },
  entrega: { label: "Entrega de material", icon: "📦", cor: "#f59e0b" },
  manutencao: { label: "Manutenção", icon: "🛠️", cor: "#8b5cf6" },
};

export const PERIODOS = {
  manha: "Manhã",
  tarde: "Tarde",
  dia: "Dia todo",
};

/** Data de hoje em AAAA-MM-DD, no fuso local (não em UTC). */
export function hojeISO(agora = new Date()) {
  const d = new Date(agora.getTime() - agora.getTimezoneOffset() * 60000);
  return d.toISOString().slice(0, 10);
}

/** Diferença em dias entre duas datas AAAA-MM-DD. Negativo = passado. */
export function diasAte(dataISO, hoje = hojeISO()) {
  if (!dataISO) return null;
  const a = new Date(dataISO + "T00:00:00");
  const b = new Date(hoje + "T00:00:00");
  if (isNaN(a) || isNaN(b)) return null;
  return Math.round((a - b) / 86400000);
}

/**
 * Situação de um agendamento — é o que decide a cor e a ordem na tela.
 * `atrasado` só existe para compromisso que ainda não foi resolvido: depois de
 * feito ou cancelado, a data não cobra mais nada de ninguém.
 */
export function situacao(ag, hoje = hojeISO()) {
  if (!ag) return "futuro";
  if (ag.status === "feito") return "feito";
  if (ag.status === "cancelado") return "cancelado";
  const d = diasAte(ag.data, hoje);
  if (d === null) return "futuro";
  if (d < 0) return "atrasado";
  if (d === 0) return "hoje";
  if (d === 1) return "amanha";
  return "futuro";
}

/**
 * Cidade comparável. "Peruíbe-Sp", "Peruibe-Sp" e "peruíbe sp" são a mesma
 * cidade — e na base do Marcos elas aparecem escritas de jeitos diferentes,
 * o que faria 5 leads em Peruíbe parecerem 3 e 2. Se a viagem não aparece,
 * a agenda não serve para o que mais importa aqui.
 */
export function cidadeChave(cidade) {
  return String(cidade || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\bcep\b.*$/, "")       // "Miracatu-Sp CEP 11850-00"
    .replace(/[-–,/]/g, " ")
    .replace(/\b(sp|s\.p|sao paulo)\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

const VALE = ["registro", "cajati", "juquia", "eldorado", "sete barras", "jacupiranga", "pariquera", "itariri", "cananeia", "apiai", "miracatu", "pedro de toledo", "iguape", "ilha comprida", "barra do turvo"];
const BAIXADA = ["santos", "sao vicente", "guaruja", "praia grande", "mongagua", "itanhaem", "peruibe", "bertioga", "cubatao"];

export function regiao(cidade) {
  const c = cidadeChave(cidade);
  if (!c) return "sem_cidade";
  if (VALE.some((x) => c.includes(x))) return "vale";
  if (BAIXADA.some((x) => c.includes(x))) return "baixada";
  return "outra";
}

export const REGIOES = {
  vale: "Vale do Ribeira",
  baixada: "Baixada Santista",
  outra: "Outra região",
  sem_cidade: "Sem cidade",
};

/** Só o que ainda vai acontecer (ou ficou para trás sem resolver). */
export function emAberto(lista) {
  return (lista || []).filter((a) => a && a.status !== "feito" && a.status !== "cancelado");
}

/**
 * Agenda ordenada e agrupada por dia. Atrasados primeiro — são os que cobram
 * decisão hoje; depois a ordem natural do calendário.
 */
export function agruparPorDia(lista, hoje = hojeISO()) {
  const dias = new Map();
  for (const a of emAberto(lista)) {
    if (!a.data) continue;
    if (!dias.has(a.data)) dias.set(a.data, []);
    dias.get(a.data).push(a);
  }
  return [...dias.entries()]
    .map(([data, itens]) => ({
      data,
      dias: diasAte(data, hoje),
      atrasado: diasAte(data, hoje) < 0,
      itens: itens.sort((x, y) => (x.periodo || "").localeCompare(y.periodo || "")),
    }))
    .sort((a, b) => {
      if (a.atrasado !== b.atrasado) return a.atrasado ? -1 : 1;
      return a.data.localeCompare(b.data);
    });
}

/** Data em "seg, 01/09" — o dia da semana é o que o olho procura numa agenda. */
export function rotuloData(dataISO) {
  if (!dataISO) return "";
  const d = new Date(dataISO + "T12:00:00");
  if (isNaN(d)) return dataISO;
  const semana = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"][d.getDay()];
  return `${semana}, ${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/**
 * Quem mais está esperando na mesma cidade e na mesma região.
 *
 * É o começo do agrupamento por rota, na versão mais barata possível: só
 * mostra o número, não sugere nada, não mexe em agenda nenhuma. Serve para o
 * Marcos ver, na hora de marcar Peruíbe, que tem mais quatro por lá.
 *
 * @param cidade cidade do compromisso que está sendo marcado
 * @param hist   orçamentos do CRM
 * @param ativos status que contam como "esperando"
 */
export function outrosNaRegiao(cidade, hist, ativos = ["orcamento", "negociacao", "fechou", "execucao"]) {
  const chave = cidadeChave(cidade);
  const reg = regiao(cidade);
  if (!chave) return { cidade: 0, regiao: 0, nomeRegiao: REGIOES[reg] };

  let naCidade = 0, naRegiao = 0;
  for (const q of hist || []) {
    if (!q || !ativos.includes(q.status)) continue;
    const c = q.data?.client?.city || q.cC || "";
    if (!cidadeChave(c)) continue;
    if (cidadeChave(c) === chave) naCidade++;
    else if (regiao(c) === reg && reg !== "outra" && reg !== "sem_cidade") naRegiao++;
  }
  return { cidade: naCidade, regiao: naRegiao, nomeRegiao: REGIOES[reg] };
}

/** Resumo para o topo da tela: o que cobra ação. */
export function resumo(lista, hoje = hojeISO()) {
  const abertos = emAberto(lista);
  return {
    atrasados: abertos.filter((a) => situacao(a, hoje) === "atrasado").length,
    hoje: abertos.filter((a) => situacao(a, hoje) === "hoje").length,
    semana: abertos.filter((a) => {
      const d = diasAte(a.data, hoje);
      return d !== null && d >= 0 && d <= 7;
    }).length,
    total: abertos.length,
  };
}
