// Rascunhos de orçamento que o Vini deixa prontos para o Marcos conferir.
//
// O bot preenche em `rascunhos_bot` o que o cliente contou na conversa
// (vinil-vale-whatsapp-bot/src/services/rascunho-orcamento.js). Aqui é só o
// lado de leitura: o que mostrar na fila e como medir se o rascunho serviu.
//
// O rascunho NÃO é orçamento. Ele não aparece no funil, não tem valor e não
// conta em métrica nenhuma até o Marcos abrir, conferir e salvar — aí nasce um
// orçamento normal, pelo caminho normal.

/** Campos que o bot preenche e que valem comparar depois da conferência. */
const CAMPOS_COMPARAVEIS = [
  "svcType", "poolFmt",
  "client.name", "client.city", "client.phone",
  "pool.length", "pool.width", "pool.depth",
  "pool.depthMin", "pool.depthMax", "pool.prainhaComp", "pool.prainhaProf",
];

const ROTULOS = {
  svcType: "serviço", poolFmt: "formato",
  "client.name": "nome", "client.city": "cidade", "client.phone": "telefone",
  "pool.length": "comprimento", "pool.width": "largura", "pool.depth": "profundidade",
  "pool.depthMin": "parte rasa", "pool.depthMax": "parte funda",
  "pool.prainhaComp": "avanço da prainha", "pool.prainhaProf": "água na prainha",
};

function valorEm(obj, caminho) {
  return caminho.split(".").reduce((o, k) => (o == null ? undefined : o[k]), obj);
}

const texto = (v) => String(v ?? "").trim();

/**
 * O que mudou entre o que o bot preencheu e o que o Marcos salvou.
 *
 * É a régua do item 4 do plano: se ele corrige tudo em todo rascunho, o
 * mapeamento está ruim e volta pra mesa. Sem isto a automação vira fé.
 */
export function camposEditados(aplicado, salvo) {
  if (!aplicado || !salvo) return [];
  const mudou = [];
  for (const c of CAMPOS_COMPARAVEIS) {
    const a = texto(valorEm(aplicado, c));
    const b = texto(valorEm(salvo, c));
    // Campo que o bot deixou vazio e o Marcos preencheu conta como
    // COMPLEMENTO, não como correção — são coisas diferentes e a segunda é
    // que diz se o bot está errando.
    if (a === "" && b !== "") { mudou.push({ campo: ROTULOS[c] || c, tipo: "completou", de: "", para: b }); continue; }
    if (a !== b) mudou.push({ campo: ROTULOS[c] || c, tipo: "corrigiu", de: a, para: b });
  }
  return mudou;
}

/** Uma linha de resumo para a fila, sem abrir o rascunho. */
export function resumoRascunho(r) {
  const c = r?.campos || {};
  const p = c.pool || {};
  const partes = [];
  if (p.length && p.width) partes.push(`${p.length}x${p.width}${p.depth ? "x" + p.depth : ""}`);
  if (c.poolFmt) partes.push(c.poolFmt);
  if (c.client?.city) partes.push(c.client.city);
  return partes.join(" · ");
}

/** Ordem da fila: quem está mais pronto primeiro; empate, o mais quente. */
export function ordenarRascunhos(lista) {
  return [...(lista || [])].sort((a, b) => {
    const pa = a.precisaDesenho ? 1 : 0, pb = b.precisaDesenho ? 1 : 0;
    if (pa !== pb) return pa - pb;
    if ((b.completude || 0) !== (a.completude || 0)) return (b.completude || 0) - (a.completude || 0);
    return (b.nota || 0) - (a.nota || 0);
  });
}

/**
 * Estado do editor a partir do rascunho.
 *
 * Devolve só o que o bot sabe. Itens, garantia, condições e prazo NÃO saem
 * daqui: quem monta é o próprio painel, a partir do tipo de serviço, como já
 * faz quando se escolhe o serviço na barra lateral. O bot não opina em preço.
 */
export function estadoDoRascunho(r) {
  const c = r?.campos || {};
  const clienteVazio = { name: "", phone: "", address: "", city: "", cpf: "", rg: "", email: "", birthday: "" };
  return {
    svcType: c.svcType || "revestimento",
    poolFmt: c.poolFmt || "",
    client: { ...clienteVazio, ...(c.client || {}) },
    pool: c.pool || {},
  };
}

export { CAMPOS_COMPARAVEIS, ROTULOS };
