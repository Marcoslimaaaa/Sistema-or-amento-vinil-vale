// Cardápio de vinil da Vinil Vale (Marcos, 01/10/2026):
//   Acqualiner: 0,6 / 0,63 / 0,7 mm → 3 anos de garantia de fábrica; 0,73 mm → 4 anos
//   Locomotiva: vinil de bolsão 0,65 e 0,8 mm (tramado) → 36 meses; tela armada 1,5 mm → 5 anos
//
// t        chave gravada no orçamento (d.vinilT). NUNCA mudar a de uma opção que já existe:
//          o orçamento salvo abre pela chave, e o PDF e o contrato saem dela.
// w        anos de garantia de fábrica do vinil (contrato: "Vinil (fabricação)").
// marca    linha do vinil: dá o nome do item do revestimento ("Vinil ACQUALINER", "Vinil LOCOMOTIVA")
//          e o catálogo de estampas que o seletor mostra.
// estoque  categoria do catálogo de estoque de onde sai a baixa. null = sem estoque cadastrado:
//          a baixa pede conferência em vez de descontar de outra bobina.
// estampas só estas estampas existem nesta espessura (o tramado 0,8 sai em duas).
// antigo   só para abrir orçamento salvo com ela; não aparece para orçamento novo.
export const VOPTS = [
  { t: "0,6mm", w: 3, marca: "ACQUALINER", nome: "ACQUALINER 0,6mm", resist: "Resist. até 32°C", estoque: null },
  { t: "0,63mm", w: 3, marca: "ACQUALINER", nome: "ACQUALINER 0,63mm", resist: "Resist. até 32°C", estoque: null },
  { t: "0,7mm", w: 3, marca: "ACQUALINER", nome: "ACQUALINER 0,7mm", resist: "Resist. até 32°C", estoque: "Vinil 0,7mm" },
  { t: "0,73mm", w: 4, marca: "ACQUALINER", nome: "ACQUALINER 0,73mm", resist: "Resist. até 32°C", estoque: null },
  { t: "0,65mm-locomotiva", w: 3, marca: "LOCOMOTIVA", nome: "LOCOMOTIVA 0,65mm", resist: "Resist. até 32°C", estoque: null },
  { t: "0,8mm-locomotiva", w: 3, marca: "LOCOMOTIVA", nome: "LOCOMOTIVA 0,8mm tramado", resist: "Tela de poliéster · Resist. até 32°C", estoque: null, estampas: ["Azul Celeste", "Eagle Blue"] },
  { t: "1,5mm", w: 5, marca: "MANTA", nome: "Manta Armada 1,5mm", resist: "Alto padrão · reforçada com trama de poliéster", armada: true, estoque: null },
  // Até 01/10/2026 o sistema oferecia "ACQUALINER 0,8mm" com 4 anos. Fica para os orçamentos salvos assim.
  { t: "0,8mm", w: 4, marca: "ACQUALINER", nome: "ACQUALINER 0,8mm", resist: "Resist. até 32°C", estoque: "Vinil 0,8mm", antigo: true },
];

export const VINIL_PADRAO = "0,7mm";

export const vinilOpt = (t) => VOPTS.find((v) => v.t === t) || VOPTS.find((v) => v.t === VINIL_PADRAO);
export const vinilNome = (t) => vinilOpt(t).nome; // ex.: "Manta Armada 1,5mm"
export const vinilDesc = (t) => { const o = vinilOpt(t); return o.nome + (o.resist ? " · " + o.resist : ""); };

/** Opções do seletor: as atuais, mais a antiga só quando é a do orçamento aberto. */
export const opcoesVinil = (atual) => VOPTS
  .filter((v) => !v.antigo || v.t === atual)
  .map((v) => ({ value: v.t, label: `${v.nome} (${v.w}a)${v.antigo ? " · antigo" : ""}` }));

/** Nome do item do revestimento num orçamento de vinil (a manta armada tem o dela). */
export const nomeItemVinil = (t) => "Vinil " + (vinilOpt(t).marca === "LOCOMOTIVA" ? "LOCOMOTIVA" : "ACQUALINER");
