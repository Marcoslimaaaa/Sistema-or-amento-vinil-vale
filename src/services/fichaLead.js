// A ficha do lead, como o bot a coletou.
//
// POR QUE ISSO EXISTE
// O bot coleta 8 campos obrigatórios e 10 opcionais em toda conversa
// (config/system-prompt.js, no repo do bot): CEP, padrão de construção, prazo,
// acesso para máquina, aquecimento, dispositivos, escopo da reforma, número de
// flanges, como conheceu a empresa. O painel exibia NOVE campos, num drawer
// dentro da aba WhatsApp, e nada disso no CRM.
//
// Era informação de qualificação — a que diz se o serviço é grande ou pequeno,
// se dá para levar máquina, se o cliente tem pressa — coletada e descartada.
//
// Aqui os campos ganham rótulo, ordem e agrupamento, num lugar só, usado tanto
// pelo drawer da conversa quanto pela ficha do CRM. Campo novo no bot é uma
// linha nesta lista.

const CAMPOS = [
  // Quem é e onde
  { chave: "nome", rotulo: "Nome", grupo: "Contato" },
  { chave: "cidade", rotulo: "Cidade", grupo: "Contato" },
  { chave: "cep", rotulo: "CEP", grupo: "Contato" },
  { chave: "email", rotulo: "E-mail", grupo: "Contato" },
  { chave: "nascimento", rotulo: "Nascimento", grupo: "Contato" },
  { chave: "aniversario", rotulo: "Aniversário", grupo: "Contato" },

  // O serviço
  { chave: "tipo_servico", rotulo: "Serviço", grupo: "A obra" },
  { chave: "formato_piscina", rotulo: "Formato", grupo: "A obra" },
  { chave: "medidas", rotulo: "Medidas", grupo: "A obra" },
  { chave: "estado_piscina", rotulo: "Estado da piscina", grupo: "A obra" },
  { chave: "situacao_alvenaria", rotulo: "Alvenaria", grupo: "A obra" },
  { chave: "escopo_reforma", rotulo: "Escopo da reforma", grupo: "A obra" },
  { chave: "quantidade_flanges", rotulo: "Flanges", grupo: "A obra" },
  { chave: "extras", rotulo: "Extras", grupo: "A obra" },
  { chave: "dispositivos", rotulo: "Dispositivos", grupo: "A obra" },
  { chave: "aquecimento", rotulo: "Aquecimento", grupo: "A obra" },

  // O que muda o preço e a viabilidade
  { chave: "padrao_construcao", rotulo: "Padrão", grupo: "Qualificação" },
  { chave: "acesso_bobcat", rotulo: "Acesso para máquina", grupo: "Qualificação" },
  { chave: "prazo", rotulo: "Prazo do cliente", grupo: "Qualificação" },
  { chave: "como_conheceu", rotulo: "Como conheceu", grupo: "Qualificação" },
  { chave: "foto_recebida", rotulo: "Mandou foto", grupo: "Qualificação" },
];

/** O bot grava a string "null" quando o campo não foi preenchido. */
function vazio(v) {
  if (v === null || v === undefined) return true;
  const s = String(v).trim();
  return s === "" || s.toLowerCase() === "null" || s.toLowerCase() === "undefined";
}

function formatar(chave, valor) {
  if (chave === "foto_recebida") {
    if (valor === true || /^(true|sim|1)$/i.test(String(valor))) return "Sim";
    if (valor === false || /^(false|n[aã]o|0)$/i.test(String(valor))) return null;
  }
  return String(valor);
}

/**
 * Os campos preenchidos, na ordem, agrupados.
 * @returns {Array<{grupo:string, itens:Array<{chave,rotulo,valor}>}>}
 */
export function fichaDoLead(leadData) {
  if (!leadData) return [];
  const grupos = new Map();

  for (const campo of CAMPOS) {
    const bruto = leadData[campo.chave];
    if (vazio(bruto)) continue;
    const valor = formatar(campo.chave, bruto);
    if (valor === null) continue;
    if (!grupos.has(campo.grupo)) grupos.set(campo.grupo, []);
    grupos.get(campo.grupo).push({ chave: campo.chave, rotulo: campo.rotulo, valor });
  }

  // Campo que o bot passar a coletar e que ainda não esteja na lista acima
  // aparece assim mesmo, em vez de sumir sem ninguém notar.
  const conhecidos = new Set(CAMPOS.map((c) => c.chave));
  const extras = Object.keys(leadData)
    .filter((k) => !conhecidos.has(k) && k !== "completo" && !vazio(leadData[k]))
    .map((k) => ({ chave: k, rotulo: k.replace(/_/g, " "), valor: String(leadData[k]) }));
  if (extras.length > 0) grupos.set("Outros", [...(grupos.get("Outros") || []), ...extras]);

  return [...grupos.entries()].map(([grupo, itens]) => ({ grupo, itens }));
}

/** Quantos dos campos obrigatórios do bot já foram preenchidos (0 a 8). */
export const OBRIGATORIOS = [
  "nome", "cidade", "cep", "tipo_servico",
  "formato_piscina", "medidas", "extras", "estado_piscina",
];

export function completude(leadData) {
  if (!leadData) return { preenchidos: 0, total: OBRIGATORIOS.length, faltando: [...OBRIGATORIOS] };
  const faltando = OBRIGATORIOS.filter((k) => vazio(leadData[k]));
  return {
    preenchidos: OBRIGATORIOS.length - faltando.length,
    total: OBRIGATORIOS.length,
    faltando,
  };
}
