// Plano de corte da manta armada numa piscina/hidro REDONDA.
//
// A REGRA É DO MARCOS (23/09/2026), e ela é de obra, não de geometria:
//
//   CHÃO — "calculo sempre as partes maiores dela. Se a piscina tem 3 por 3,
//   eu calculo o chão 3 por 3, e as pontas que sobram do círculo eu cobro,
//   mas entram como descarte. Não tem como fazer o cálculo correto."
//   Ou seja: o chão sai do QUADRADO que envolve o círculo. O canto é perda, e
//   perda cobrada — porque é manta que sai da bobina do mesmo jeito.
//
//   PAREDE — "vou contornando com a fita métrica até fechar". A parede é uma
//   tira só, do comprimento do PERÍMETRO, com a solda onde ela fecha.
//
// Vale para MANTA ARMADA. O bolsão convencional o Marcos ainda vai conferir.

import { MANTA, cortarPeca, cortarChao, encaixarBobinas } from "./manta.js";
import { medidasCirculo, erroBancoRedondo } from "./formatos.js";

const arred = (v, c = 2) => Math.round(v * 10 ** c) / 10 ** c;

/**
 * @param {object} p {diametro, prof, banco:{larg,prof}|null, assento:"gomos"|"quadrado"}
 */
export function planoCircular({ diametro, prof, banco = null, assento = "quadrado" }, cfg = MANTA) {
  const m = medidasCirculo(diametro, {
    bancoLarg: banco ? banco.larg : 0,
    bancoProf: banco ? banco.prof : 0,
    prof,
  });
  if (!m) return { erro: "Diâmetro inválido." };
  // A mesma régua do cálculo de área (formatos.js): banco largo demais OU com
  // o assento no fundo é erro — antes o fundo demais saía como redonda sem
  // banco, sem aviso.
  const erroBanco = banco ? erroBancoRedondo(diametro, banco.larg, banco.prof, prof) : null;
  if (erroBanco) return { erro: erroBanco };

  // ── PAREDES: tira contornando, com a solda no fechamento ─────────────────
  const faces = m.temBanco
    ? [
      { nome: "Costas do banco (contorno)", comp: m.perimetro, prof: banco.prof, semSobraLateral: true },
      { nome: "Espelho do banco (contorno)", comp: 2 * Math.PI * m.raioInterno, prof: m.alturaEspelho, semSobraLateral: true },
    ]
    : [{ nome: "Parede (contorno)", comp: m.perimetro, prof, semSobraLateral: true }];
  // +5 cm de fechamento: a tira dá a volta e monta sobre o próprio começo.
  const pecasParede = faces.map((f) => cortarPeca({ ...f, comp: f.comp + cfg.solda }, cfg));

  // ── CHÃO: o quadrado que envolve o círculo do fundo ───────────────────────
  const dFundo = 2 * m.raioInterno;
  const partesChao = [cortarChao(dFundo, dFundo, cfg, "Chão do fundo (quadrado que envolve)",
    { comp: [cfg.rebarbaDescida, cfg.rebarbaDescida], larg: [cfg.rebarbaDescida, cfg.rebarbaDescida] })];

  // ── ASSENTO: as duas leituras possíveis da mesma regra ────────────────────
  // "gomos": o anel é cortado em pedaços que seguem a curva (menos manta, mais
  //          corte e mais solda).
  // "quadrado" (PADRÃO, escolhido pelo Marcos em 23/09): o plano horizontal
  //          inteiro sai do quadrado do diâmetro cheio — "pego o comprimento
  //          maior e a largura maior". O miolo vira descarte, cobrado, porque
  //          sai da bobina do mesmo jeito. Medido numa Ø4 com banco: 24,62 m
  //          contra 24,92 m em gomos, e 1 bobina nos dois casos — ou seja, a
  //          simplicidade não custa material.
  if (m.temBanco) {
    if (assento === "quadrado") {
      partesChao.length = 0;
      partesChao.push(cortarChao(diametro, diametro, cfg, "Chão + assento (quadrado que envolve)",
        { comp: [cfg.rebarbaDescida, cfg.rebarbaDescida], larg: [cfg.rebarbaDescida, cfg.rebarbaDescida] }));
    } else {
      const n = 4;   // quatro gomos fecham o anel sem peça maior que a bobina
      const arco = m.perimetro / n;
      for (let i = 0; i < n; i++) {
        partesChao.push(cortarChao(arco, banco.larg, cfg, `Assento · gomo ${i + 1}`,
          { comp: [cfg.rebarbaParede, cfg.rebarbaDescida], larg: [cfg.rebarbaParede, cfg.rebarbaParede] }));
      }
    }
  }

  const chao = {
    partes: partesChao,
    metrosLineares: arred(partesChao.reduce((s, p) => s + p.metrosLineares, 0)),
    emendas: partesChao.reduce((s, p) => s + p.emendas, 0),
    soldaLinear: arred(partesChao.reduce((s, p) => s + p.soldaLinear, 0)),
  };
  const paredes = {
    pecas: pecasParede, qtdPecas: pecasParede.length,
    metrosLineares: arred(pecasParede.reduce((s, p) => s + p.metrosLineares, 0)),
    soldaLinear: arred(pecasParede.reduce((s, p) => s + p.soldaLinear, 0)),
    complementos: { passadas: [], metrosLineares: 0 },
  };

  // Ninho na regra do Marcos: costas e espelho saem na mesma passada.
  const passadas = [];
  const cabe = (h1, h2) => h1 + h2 + cfg.solda <= cfg.larguraBobina;
  if (m.temBanco && cabe(pecasParede[0].altura, pecasParede[1].altura)) {
    passadas.push({ comp: arred(Math.max(pecasParede[0].comp, pecasParede[1].comp)),
      pecas: [pecasParede[0].nome, pecasParede[1].nome] });
  } else {
    pecasParede.forEach((p) => passadas.push({ comp: p.comp, pecas: [p.nome] }));
  }
  const resto = partesChao.map((p) => ({ nome: p.nome, comp: p.compFaixa * p.faixas, alt: p.alvo ?? 0 }))
    .sort((a, b) => b.comp - a.comp);
  while (resto.length) {
    const p = resto.shift();
    const j = resto.findIndex((q) => cabe(p.alt, q.alt));
    if (j >= 0) { const q = resto.splice(j, 1)[0]; passadas.push({ comp: arred(Math.max(p.comp, q.comp)), pecas: [p.nome, q.nome] }); }
    else passadas.push({ comp: arred(p.comp), pecas: [p.nome] });
  }

  const metrosLineares = arred(passadas.reduce((s, p) => s + p.comp, 0));
  const areaCobravel = arred(metrosLineares * cfg.larguraBobina);
  const areaUtil = arred(m.fundo + m.assento + m.espelho + m.costas + m.parede);
  const solda = {
    emendaChao: arred(partesChao.reduce((s, p) => s + p.soldaEmenda, 0)),
    chaoNaParede: arred(partesChao.reduce((s, p) => s + p.soldaBorda, 0)),
    cantosParede: arred(pecasParede.reduce((s, p) => s + p.altura, 0)),
    anexos: 0,
  };
  solda.total = arred(solda.emendaChao + solda.chaoNaParede + solda.cantosParede);

  return {
    medidas: m, chao, paredes, passadas, solda,
    lista: [...pecasParede.map((p) => ({ nome: p.nome, comp: p.comp })),
      ...partesChao.flatMap((p) => Array.from({ length: p.faixas }, (_, i) => ({
        nome: p.faixas > 1 ? `${p.nome} · faixa ${i + 1}` : p.nome, comp: p.compFaixa })))],
    pedido: encaixarBobinas(passadas.map((p, i) => ({ nome: `Passada ${i + 1}`, comp: p.comp })), cfg),
    anexos: [], anexoNinho: { passadas: [], metrosLineares: 0 },
    oportunidades: [], aproveitado: [], economiaAproveitamento: 0,
    metrosLineares, areaCobravel, areaUtil,
    perda: arred(areaCobravel - areaUtil),
    perdaPct: areaCobravel > 0 ? arred(((areaCobravel - areaUtil) / areaCobravel) * 100, 1) : 0,
  };
}
