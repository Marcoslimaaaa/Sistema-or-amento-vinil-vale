// Respostas rápidas — dados e substituição de variáveis. Lógica pura separada
// do componente para ser testável fora do Vite.

export const PADRAO = [
  { atalho: "orcamento", titulo: "Orçamento a caminho", texto: "Olá {{nome}}! Estou te enviando o orçamento da sua piscina agora. Qualquer dúvida sobre os valores, é só chamar aqui." },
  { atalho: "visita", titulo: "Agendar medição", texto: "Olá {{nome}}! Para fechar o projeto certinho precisamos fazer a medição no local. Qual o melhor dia e período para você?" },
  { atalho: "pagamento", titulo: "Formas de pagamento", texto: "{{nome}}, sobre o pagamento temos algumas opções: Pix com desconto, cartão em até 5x sem juros, ou entrada + saldo na entrega. Qual funciona melhor para você?" },
  { atalho: "prazo", titulo: "Prazo de execução", texto: "{{nome}}, o prazo de execução é de 20 dias úteis após a medição detalhada. Assim que fecharmos, já entra na agenda." },
  { atalho: "garantia", titulo: "Garantia", texto: "{{nome}}, o vinil tem garantia de fábrica e a nossa instalação também é garantida. Qualquer problema no período, resolvemos sem custo." },
  { atalho: "retomar", titulo: "Retomar contato", texto: "Olá {{nome}}, tudo bem? Passando para saber se você ainda tem interesse no projeto da piscina. Seguimos à disposição!" },
  { atalho: "obrigado", titulo: "Agradecer fechamento", texto: "{{nome}}, muito obrigado pela confiança! Já estamos com tudo encaminhado. Qualquer coisa é só chamar aqui." },
];

/** Troca {{nome}}, {{valor}}, {{cidade}} e {{prazo}} pelos dados do lead. */
export function preencher(texto, lead) {
  const nome = (lead?.data?.client?.name || lead?.cN || "").split(" ")[0] || "";
  const valor = lead?.tot
    ? Number(lead.tot).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
    : "";
  const cidade = lead?.data?.client?.city || lead?.cC || "";
  const prazo = lead?.data?.execDays || "20";
  const valores = { nome, valor, cidade, prazo };

  return String(texto)
    // Consome o espaço à esquerda junto com a variável: sem isso, um lead sem
    // nome transformava "Olá {{nome}}, tudo bem?" em "Olá , tudo bem?" — com o
    // espaço solto antes da vírgula, na cara do cliente.
    .replace(/(\s*)\{\{(\w+)\}\}/g, (_, espaco, chave) => {
      const v = valores[chave];
      if (v === undefined) return ""; // variável desconhecida some inteira
      return v ? espaco + v : "";
    })
    .replace(/\s{2,}/g, " ")
    // Pontuação órfã que sobra quando a variável abria a frase
    .replace(/^[,;:\s]+/, "")
    .trim();
}
