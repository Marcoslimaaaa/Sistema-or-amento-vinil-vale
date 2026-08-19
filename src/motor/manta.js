// Motor da MANTA ARMADA 1,5 mm — plano de corte de bobina.
//
// Vinil convencional (0,7/0,8 mm) é orçado por ÁREA: soma chão + paredes e pronto.
// Manta armada não. Ela chega em bobina de largura fixa e é SOLDADA no local, então
// o que se compra é metro linear de bobina — e cada emenda, cada dobra e cada aparo
// vira material que entra na conta mas não aparece na área da piscina.
//
// O que a obra exige, na prática:
//   - parede: a peça desce, faz a curva no pé (5 cm) e sobra 5 cm no topo, que é
//     onde ela é travada no perfil. Altura de corte = profundidade + 10 cm.
//   - ordem da obra: TODAS as paredes primeiro, depois o chão. Por isso a peça
//     do chão não traz material para a solda com a parede — a dobra de 5 cm do
//     pé da parede já está deitada ali. O chão leva só 1 cm de rebarba no canto
//     de 90°, e zero na descida para o fundo.
//   - com prainha o chão vira DUAS regiões: o fundo e o piso da prainha, que
//     estão em alturas diferentes. A faixa do fundo não sobe para a prainha.
//   - emenda: uma peça monta 5 cm sobre a outra para a solda. Numa costura de
//     n faixas há n−1 emendas; a largura útil de cada faixa cai 5 cm.
//
// Tudo em METROS.
import polygonClipping from "polygon-clipping";

export const MANTA = {
  larguraBobina: 1.55,     // largura útil da bobina
  comprimentoBobina: 25,   // cada bobina vem com 25 m lineares
  solda: 0.05,             // sobreposição entre duas peças
  dobraPe: 0.05,           // parede: dobra para dentro no pé
  dobraTopo: 0.05,         // parede: arremate travado na borda de cima
  // A obra monta TODAS as paredes primeiro, e cada peça de parede já desce com
  // 5 cm dobrados para dentro, deitados no chão. Quando o chão entra, o material
  // da solda já está lá — a peça do chão não precisa trazer os 5 cm de novo.
  //   borda contra parede  → 1 cm de rebarba de acabamento no canto de 90°
  //   borda na descida para o fundo (pé do espelho) → zero, encosta rente
  //   emenda entre duas faixas de chão → 5 cm de sobreposição, como sempre
  rebarbaParede: 0.01,
  rebarbaDescida: 0,
};

const arred = (v, casas = 2) => Math.round(v * 10 ** casas) / 10 ** casas;

/**
 * FORMATO IRREGULAR (Feijão, Oitavada, Formato L, desenho livre).
 *
 * A regra da obra: rodar as faixas sempre no sentido do COMPRIMENTO, pôr a peça
 * maior no centro e jogar as sobras para os cantos, com as paredes seguindo o
 * contorno inteiro. O objetivo é a menor perda possível — mesmo o cliente
 * pagando a sobra, ninguém quer cortar manta à toa.
 *
 * Aqui as faixas não têm todas o mesmo comprimento: cada uma é medida onde ela
 * cai no desenho, então a faixa do meio sai cheia e as das pontas saem curtas,
 * acompanhando a curva.
 */
export function cortarChaoContorno(poligono, cfg = MANTA, nome = "Chão", bordas) {
  if (!poligono || poligono.length < 3) return null;
  const { larguraBobina: B, solda: S } = cfg;
  const R = bordas?.lateral ?? cfg.rebarbaParede;
  const Rp = bordas?.ponta ?? cfg.rebarbaParede;
  const xs = poligono.map(p => p.x), ys = poligono.map(p => p.y);
  const x0 = Math.min(...xs), x1 = Math.max(...xs);
  const y0 = Math.min(...ys), y1 = Math.max(...ys);
  // faixas correm no maior lado; a travessia é o menor
  const aoLongoDeX = (x1 - x0) >= (y1 - y0);
  const trav0 = aoLongoDeX ? y0 : x0, trav1 = aoLongoDeX ? y1 : x1;
  const alvo = (trav1 - trav0) + 2 * R;
  const n = faixasPara(alvo, cfg);
  // peça maior no CENTRO: distribui as faixas a partir do meio da travessia
  const coberto = coberturaDe(n, cfg);
  const inicio = (trav0 + trav1) / 2 - coberto / 2;
  const anel = [poligono.map(p => [p.x, p.y])];
  const faixas = [];
  for (let i = 0; i < n; i++) {
    const a = inicio + i * (B - S), b = a + B;
    const caixa = aoLongoDeX
      ? [[[x0 - 1, a], [x1 + 1, a], [x1 + 1, b], [x0 - 1, b]]]
      : [[[a, y0 - 1], [b, y0 - 1], [b, y1 + 1], [a, y1 + 1]]];
    let comp = 0;
    try {
      const corte = polygonClipping.intersection(anel, caixa);
      for (const poly of corte) for (const ring of poly) {
        const vs = ring.map(([px, py]) => (aoLongoDeX ? px : py));
        comp = Math.max(comp, Math.max(...vs) - Math.min(...vs));
      }
    } catch { comp = 0; }
    if (comp <= 1e-6) continue; // faixa fora do desenho
    faixas.push({ n: faixas.length + 1, comp: arred(comp + 2 * Rp) });
  }
  const metrosLineares = arred(faixas.reduce((s, f) => s + f.comp, 0));
  return {
    nome,
    sentido: aoLongoDeX ? "comprimento" : "largura",
    contorno: true,
    faixas: faixas.length,
    pecas: faixas,
    maior: arred(Math.max(0, ...faixas.map(f => f.comp))),
    compFaixa: arred(Math.max(0, ...faixas.map(f => f.comp))),
    alvo: arred(alvo),
    cobertura: arred(coberto),
    metrosLineares,
    emendas: Math.max(0, faixas.length - 1),
    // costura entre faixas: cada emenda corre o menor dos dois vizinhos
    soldaEmenda: arred(faixas.slice(1).reduce((s, f, i) => s + Math.min(f.comp, faixas[i].comp), 0)),
    soldaBorda: arred(perimetroDe(poligono)),
    soldaLinear: arred(
      faixas.slice(1).reduce((s, f, i) => s + Math.min(f.comp, faixas[i].comp), 0) +
      perimetroDe(poligono)),
  };
}

function perimetroDe(p) {
  let s = 0;
  for (let i = 0; i < p.length; i++) {
    const a = p[i], b = p[(i + 1) % p.length];
    s += Math.hypot(b.x - a.x, b.y - a.y);
  }
  return s;
}

/** Cada lado do contorno vira uma face de parede — a parede segue o desenho. */
export function facesDoContorno(poligono, prof, minimo = 0.05) {
  const faces = [];
  for (let i = 0; i < poligono.length; i++) {
    const a = poligono[i], b = poligono[(i + 1) % poligono.length];
    const comp = Math.hypot(b.x - a.x, b.y - a.y);
    if (comp < minimo) continue;
    faces.push({ nome: `Parede ${faces.length + 1}`, comp: arred(comp), prof });
  }
  return faces;
}

/**
 * Quantas faixas de bobina cobrem uma largura, sabendo que cada emenda
 * come `solda` da largura útil: n faixas cobrem n×largura − (n−1)×solda.
 */
export function faixasPara(larguraAlvo, cfg = MANTA) {
  const { larguraBobina: B, solda: S } = cfg;
  if (larguraAlvo <= 0) return 0;
  if (larguraAlvo <= B) return 1;
  // n×B − (n−1)×S ≥ alvo  →  n ≥ (alvo − S) / (B − S)
  return Math.ceil((larguraAlvo - S) / (B - S));
}

/** Largura efetivamente coberta por n faixas, já descontadas as emendas. */
export function coberturaDe(n, cfg = MANTA) {
  if (n <= 0) return 0;
  return n * cfg.larguraBobina - (n - 1) * cfg.solda;
}

/**
 * Corta uma região de chão. Testa os dois sentidos de faixa e fica com o que dá
 * menos emenda.
 * `bordaComp` / `bordaLarg` = [extra numa ponta, extra na outra], em metros.
 * Sem informar, assume as quatro bordas contra parede (1 cm cada).
 */
export function cortarChao(comp, larg, cfg = MANTA, nome = "Chão", bordas) {
  const R = cfg.rebarbaParede;
  const bComp = bordas?.comp ?? [R, R];
  const bLarg = bordas?.larg ?? [R, R];
  const opcao = (aoLongoDe, atravessando, sentido, exLongo, exTrav) => {
    // as emendas ENTRE faixas continuam sobrepondo 5 cm (dentro de faixasPara);
    // as bordas externas só levam a rebarba do canto
    const alvo = atravessando + exTrav[0] + exTrav[1];
    const faixas = faixasPara(alvo, cfg);
    const compFaixa = aoLongoDe + exLongo[0] + exLongo[1];
    return {
      nome,
      sentido,
      faixas,
      compFaixa: arred(compFaixa),
      metrosLineares: arred(faixas * compFaixa),
      cobertura: arred(coberturaDe(faixas, cfg)),
      alvo: arred(alvo),
      emendas: Math.max(0, faixas - 1),
      // costura entre faixas + a volta inteira colada na parede/degrau
      soldaLinear: arred(Math.max(0, faixas - 1) * compFaixa + 2 * (aoLongoDe + atravessando)),
      soldaEmenda: arred(Math.max(0, faixas - 1) * compFaixa),
      soldaBorda: arred(2 * (aoLongoDe + atravessando)),
    };
  };
  const a = opcao(comp, larg, "comprimento", bComp, bLarg);
  const b = opcao(larg, comp, "largura", bLarg, bComp);
  // Critério: MENOS EMENDA primeiro, bobina só como desempate. Solda é o passo
  // caro e arriscado da manta armada — trocar 2 costuras por 4 para economizar
  // 30 cm de bobina é mau negócio na obra.
  const melhor = b.emendas !== a.emendas
    ? (b.emendas < a.emendas ? b : a)
    : (b.metrosLineares < a.metrosLineares ? b : a);
  return { ...melhor, alternativa: melhor === a ? b : a };
}

/**
 * O chão não é um retângulo só quando há prainha: o fundo e o piso da prainha
 * estão em alturas diferentes, separados pelo degrau. A faixa do fundo NÃO sobe
 * para o piso da prainha — são regiões cortadas em separado, cada uma com o
 * sentido de faixa que der menos emenda.
 */
export function regioesChao(comp, larg, praiComp = 0, cfg = MANTA) {
  const R = cfg.rebarbaParede, D = cfg.rebarbaDescida;
  if (!(praiComp > 0 && praiComp < comp)) {
    return [{ nome: "Chão", comp, larg, bordas: { comp: [R, R], larg: [R, R] } }];
  }
  return [
    // fundo: testeira funda de um lado, pé do espelho do outro (rente, sem rebarba)
    { nome: "Chão · fundo", comp: comp - praiComp, larg,
      bordas: { comp: [R, D], larg: [R, R] } },
    // piso da prainha: testeira rasa de um lado, topo do espelho do outro
    { nome: "Chão · prainha", comp: praiComp, larg,
      bordas: { comp: [R, D], larg: [R, R] } },
  ];
}

/** Corta cada região do chão e soma. */
export function cortarChaoRegioes(regioes, cfg = MANTA) {
  const partes = regioes.map(r => cortarChao(r.comp, r.larg, cfg, r.nome, r.bordas));
  return {
    partes,
    metrosLineares: arred(partes.reduce((s, p) => s + p.metrosLineares, 0)),
    emendas: partes.reduce((s, p) => s + p.emendas, 0),
    soldaLinear: arred(partes.reduce((s, p) => s + p.soldaLinear, 0)),
  };
}

/**
 * Uma peça de parede. A manta NÃO corre contínua no perímetro: cada face vira
 * uma peça, e ela sai maior que a face nos dois eixos.
 *   comprimento = face + 5 cm em CADA ponta vertical, para montar sobre a peça
 *                 vizinha e soldar o canto (uma face de 5,00 m sai com 5,10)
 *   altura      = profundidade + 5 cm de arremate no topo + 5 cm dobrados para
 *                 dentro no pé (uma parede de 1,40 sai com 1,50)
 */
export function cortarPeca(face, cfg = MANTA) {
  const { dobraPe, dobraTopo, solda: S, larguraBobina: B } = cfg;
  const comp = (face.comp || 0) + 2 * S;
  const altura = (face.prof || 0) + dobraPe + dobraTopo;
  // Parede mais alta que a largura da bobina NÃO vira duas passadas inteiras.
  // A peça principal sai com a bobina cheia e o que falta é uma FAIXINHA
  // soldada no pé: numa bobina de 1,40 com parede de 1,60, uma tira de 0,20
  // (mais os 5 cm que montam sobre a peça de cima) resolve.
  const complementos = faixinhasPara(altura, comp, cfg);
  return {
    nome: face.nome || "face",
    faceComp: arred(face.comp || 0),
    faceProf: arred(face.prof || 0),
    comp: arred(comp),
    altura: arred(altura),
    alturaPrincipal: arred(Math.min(altura, B)),
    complementos,
    complemento: complementos[0] || null, // compatibilidade
    // largura de bobina que sobra ao lado desta peça
    aparo: complementos.length ? 0 : arred(B - altura),
    // a peça principal consome UMA passada; as faixinhas são contadas à parte,
    // porque várias saem lado a lado da mesma passada
    metrosLineares: arred(comp),
    // 2 cantos verticais + uma costura horizontal por faixinha
    soldaLinear: arred(2 * altura + complementos.length * comp),
  };
}

/**
 * Faixinhas que completam a altura de uma peça.
 *
 * NENHUMA faixinha pode ser mais larga que a bobina — quando falta mais do que
 * uma tira dá conta, entram várias, cada uma cobrindo no máximo (bobina − solda)
 * porque monta 5 cm sobre a de cima. A última leva só o que sobrou.
 */
export function faixinhasPara(altura, comp, cfg = MANTA) {
  const { larguraBobina: B, solda: S } = cfg;
  const lista = [];
  let restante = arred(altura - B);
  let guarda = 0;
  while (restante > 1e-9 && guarda++ < 200) {
    const cobre = arred(Math.min(B - S, restante));
    lista.push({ largura: arred(cobre + S), comp: arred(comp), coberto: cobre });
    restante = arred(restante - cobre);
  }
  return lista;
}

/**
 * As faixinhas de complemento saem NINHADAS: numa passada da bobina cabem
 * várias lado a lado, porque cada uma tem poucos centímetros de largura.
 * Prateleira simples — maior largura primeiro, fecha a passada quando a
 * largura acumulada não couber mais, e a passada custa o comprimento da
 * faixinha mais longa que ela carrega.
 */
export function ninharComplementos(complementos, cfg = MANTA) {
  const B = cfg.larguraBobina;
  const fila = (complementos || []).filter(Boolean).slice()
    .sort((a, b) => b.largura - a.largura || b.comp - a.comp);
  const passadas = [];
  for (const c of fila) {
    let p = passadas.find(x => x.largura + c.largura <= B + 1e-9);
    if (!p) { p = { largura: 0, comp: 0, itens: [] }; passadas.push(p); }
    p.itens.push(c);
    p.largura = arred(p.largura + c.largura);
    p.comp = arred(Math.max(p.comp, c.comp));
  }
  return {
    passadas,
    qtd: fila.length,
    metrosLineares: arred(passadas.reduce((s, p) => s + p.comp, 0)),
  };
}

/**
 * CORRIDA: faces vizinhas de mesma altura saem numa peça só, VINCADA no canto
 * em vez de soldada. O canto dobrado não gasta material nem vira solda — só as
 * duas pontas da corrida levam os 5 cm.
 *
 * Na prainha isso troca 3 peças (1,10 + 3,60 + 1,10) e 4 soldas por uma peça
 * de 1,05 + 3,50 + 1,05 e 2 soldas.
 */
export function cortarCorrida(faces, cfg = MANTA, nome) {
  const { dobraPe, dobraTopo, solda: S } = cfg;
  const somaFaces = faces.reduce((s, f) => s + (f.comp || 0), 0);
  const prof = Math.max(...faces.map(f => f.prof || 0));
  const comp = somaFaces + 2 * S;
  const altura = prof + dobraPe + dobraTopo;
  const complementos = faixinhasPara(altura, comp, cfg);
  const complemento = complementos[0] || null;
  return {
    nome: nome || faces.map(f => f.nome).join(" + "),
    corrida: true,
    trechos: faces.map(f => ({ nome: f.nome, comp: arred(f.comp || 0) })),
    faceComp: arred(somaFaces),
    faceProf: arred(prof),
    comp: arred(comp),
    altura: arred(altura),
    alturaPrincipal: arred(Math.min(altura, cfg.larguraBobina)),
    complementos,
    complemento,
    vincos: faces.length - 1, // cantos dobrados: sem material extra, sem solda
    aparo: complementos.length ? 0 : arred(cfg.larguraBobina - altura),
    metrosLineares: arred(comp),
    // só as duas pontas soldam, mais uma costura por faixinha
    soldaLinear: arred(2 * altura + complementos.length * comp),
  };
}

/**
 * Paredes = soma das peças. Face com o mesmo `grupo` sai numa corrida vincada;
 * o resto vira uma peça por face.
 * `faces` é [{nome, comp, prof, grupo?}].
 */
export function cortarParedes(faces, cfg = MANTA) {
  const soltas = (faces || []).filter(f => !f.grupo);
  const grupos = new Map();
  for (const f of (faces || [])) {
    if (!f.grupo) continue;
    if (!grupos.has(f.grupo)) grupos.set(f.grupo, []);
    grupos.get(f.grupo).push(f);
  }
  const lista = [
    ...soltas.map(f => cortarPeca(f, cfg)),
    ...[...grupos.entries()].map(([nome, fs]) => cortarCorrida(fs, cfg, nome)),
  ];
  const complementos = ninharComplementos(
    lista.flatMap(p => (p.complementos || []).map(c => ({ ...c, de: p.nome }))), cfg);
  return {
    pecas: lista,
    qtdPecas: lista.length,
    complementos,
    metrosLineares: arred(lista.reduce((s, p) => s + p.metrosLineares, 0) + complementos.metrosLineares),
    soldaLinear: arred(lista.reduce((s, p) => s + p.soldaLinear, 0)),
    alturaMax: arred(Math.max(0, ...lista.map(p => p.altura))),
  };
}

/** As 4 faces de uma piscina retangular de profundidade única. */
export function facesRetangulo(comp, larg, prof) {
  return [
    { nome: "Lateral 1", comp, prof },
    { nome: "Lateral 2", comp, prof },
    { nome: "Testeira 1", comp: larg, prof },
    { nome: "Testeira 2", comp: larg, prof },
  ];
}

/**
 * Faces de uma retangular com prainha: as laterais quebram em dois níveis,
 * entram as duas testeiras (funda e rasa) e o degrau, que também é parede.
 */
export function facesComPrainha(comp, larg, prof, praiComp, praiProf, opcoes = {}) {
  const fundo = comp - praiComp;
  // A cinta da prainha é baixa e curta: sai numa peça só, vincada nos dois
  // cantos — 1,00 + 3,50 + 1,00 com 5 cm de solda em cada ponta. Trocar as 3
  // peças soltas por essa corrida elimina 2 soldas.
  //
  // ATENÇÃO — a corrida vale SÓ para a prainha, e só quando a estrutura está no
  // esquadro. A manta de 1,5 mm é rígida: em piscina grande, e em qualquer
  // parede fora de esquadro, ela não se acomoda no vinco. Aí é cortar e soldar
  // canto a canto, sempre. Por isso `facesRetangulo` nunca agrupa, e quem
  // orçar piscina fora de esquadro deve passar { prainhaCorrida: false }.
  const corrida = opcoes.prainhaCorrida !== false ? "Cinta da prainha" : undefined;
  return [
    { nome: "Lateral 1 · fundo", comp: fundo, prof },
    { nome: "Lateral 2 · fundo", comp: fundo, prof },
    { nome: "Testeira funda", comp: larg, prof },
    { nome: "Degrau da prainha", comp: larg, prof: prof - praiProf },
    { nome: "Lateral 1 · prainha", comp: praiComp, prof: praiProf, grupo: corrida },
    { nome: "Testeira rasa", comp: larg, prof: praiProf, grupo: corrida },
    { nome: "Lateral 2 · prainha", comp: praiComp, prof: praiProf, grupo: corrida },
  ];
}

/**
 * A última faixa de uma região quase nunca é usada inteira: ela só precisa
 * cobrir o que faltou, e o resto da largura da bobina segue junto, do
 * comprimento inteiro da faixa. Esta função mede essa tira e diz quais outras
 * peças caberiam dentro dela.
 *
 * Não muda o preço sozinha — quem decide aproveitar é quem corta.
 */
export function analisarSobra(parte, candidatas = [], cfg = MANTA) {
  const { larguraBobina: B, solda: S } = cfg;
  if (!parte || parte.faixas < 1) return null;
  const jaCoberto = coberturaDe(parte.faixas - 1, cfg);
  const faltava = Math.max(0, parte.alvo - jaCoberto);
  // a última faixa ainda monta 5 cm sobre a anterior (quando existe anterior)
  const usadaNaUltima = Math.min(B, faltava + (parte.faixas > 1 ? S : 0));
  const tira = { largura: arred(B - usadaNaUltima), comp: parte.compFaixa };
  return {
    de: parte.nome,
    usadaNaUltima: arred(usadaNaUltima),
    tira,
    cabem: candidatas.filter(c => c.largura <= tira.largura + 1e-9 && c.comp <= tira.comp + 1e-9)
      .map(c => ({ ...c, folgaLargura: arred(tira.largura - c.largura) })),
  };
}

/**
 * Encaixe das peças em bobinas de 25 m.
 *
 * Não adianta dividir o total por 25: as peças são cortadas inteiras, então o
 * que sobra na ponta de uma bobina só serve se couber uma peça inteira ali.
 * Heurística first-fit decreasing — corta as maiores primeiro, que é como se
 * faz na bancada e é o que menos desperdiça.
 *
 * `pecas` = [{nome, comp}] em metros lineares de bobina.
 */
export function encaixarBobinas(pecas, cfg = MANTA) {
  const L = cfg.comprimentoBobina, S = cfg.solda;
  // Peça mais comprida que o rolo NÃO some da conta: ela é fatiada em trechos
  // que cabem, cada emenda montando 5 cm sobre a anterior. Descartar em silêncio
  // fazia a ferramenta pedir MENOS bobina quanto maior a piscina.
  const grandes = pecas.filter(p => p.comp > L);
  const fatiadas = [];
  for (const p of pecas) {
    if (p.comp <= L) { fatiadas.push(p); continue; }
    const n = Math.max(2, Math.ceil((p.comp - S) / (L - S)));
    let resta = p.comp;
    for (let i = 0; i < n && resta > 1e-9; i++) {
      const trecho = arred(Math.min(L, resta + (i > 0 ? S : 0)));
      fatiadas.push({ ...p, nome: `${p.nome} · trecho ${i + 1}/${n}`, comp: trecho, fatiado: true });
      resta = arred(resta - (trecho - (i > 0 ? S : 0)));
    }
  }
  const fila = fatiadas.slice().sort((a, b) => b.comp - a.comp);
  const bobinas = [];
  for (const p of fila) {
    let b = bobinas.find(x => x.sobra >= p.comp - 1e-9);
    if (!b) { b = { pecas: [], usado: 0, sobra: L }; bobinas.push(b); }
    b.pecas.push(p);
    b.usado = arred(b.usado + p.comp);
    b.sobra = arred(L - b.usado);
  }
  const usado = arred(fila.reduce((s, p) => s + p.comp, 0));
  const comprado = bobinas.length * L;
  // cada peça fatiada ganha (n−1) emendas transversais
  const emendasFatia = grandes.length
    ? arred(fatiadas.filter(p => p.fatiado).length - grandes.length) : 0;
  return {
    bobinas: bobinas.map((b, i) => ({ n: i + 1, ...b })),
    qtd: bobinas.length,
    metrosComprados: comprado,
    metrosUsados: usado,
    // ponta de bobina que ninguém aproveita — entra no orçamento do cliente
    sobraLinear: arred(comprado - usado),
    aproveitamento: comprado ? arred((usado / comprado) * 100, 1) : 0,
    // peças que passaram do rolo e tiveram de ser fatiadas (a conta já as inclui)
    naoCabem: grandes,
    emendasFatia,
  };
}

/**
 * Plano de corte completo. `areaReal` é a área da piscina (chão + paredes) vinda
 * do calcA — serve para medir quanto de sobra o método impõe.
 */
/**
 * ANEXO EXTERNO RETANGULAR — prainha externa, banco, plataforma.
 *
 * Fica FORA do corpo da piscina, encostado nele, então SOMA: traz piso próprio
 * e as paredes que ficam expostas. A face que encosta na piscina não é parede —
 * mas é linha de solda, e por isso entra na conta de mão de obra.
 *
 *   encaixe "lado"  → encostado por um lado só: sobram 3 paredes
 *   encaixe "canto" → encostado por dois lados:  sobram 2 paredes
 *
 * `comp` é sempre o lado que encosta na piscina.
 */
export function anexoExterno(a, cfg = MANTA) {
  const nome = a.nome || "Anexo";
  const comp = a.comp || 0, larg = a.larg || 0, prof = a.prof || 0;
  const canto = a.encaixe === "canto";
  if (!(comp > 0 && larg > 0 && prof > 0)) return null;

  const piso = cortarChao(comp, larg, cfg, `${nome} · piso`);
  const faces = canto
    ? [{ nome: `${nome} · parede oposta`, comp, prof },
       { nome: `${nome} · lateral`, comp: larg, prof }]
    : [{ nome: `${nome} · parede oposta`, comp, prof },
       { nome: `${nome} · lateral 1`, comp: larg, prof },
       { nome: `${nome} · lateral 2`, comp: larg, prof }];
  const paredes = cortarParedes(faces, cfg);
  // onde ele encosta na piscina: não vira parede, vira solda
  const contato = arred(canto ? comp + larg : comp);

  return {
    nome, encaixe: canto ? "canto" : "lado",
    medidas: { comp: arred(comp), larg: arred(larg), prof: arred(prof) },
    piso, paredes, contato,
    // peças para entrar na ninhagem junto com as faixinhas
    itens: [
      ...Array.from({ length: piso.faixas }, (_, i) => ({
        nome: piso.faixas > 1 ? `${piso.nome} · faixa ${i + 1}` : piso.nome,
        largura: cfg.larguraBobina, comp: piso.compFaixa, tipo: "chao",
      })),
      ...paredes.pecas.map(p => ({ nome: p.nome, largura: p.altura, comp: p.comp, tipo: "parede" })),
    ],
    areaUtil: arred(comp * larg + (canto ? (comp + larg) : (comp + 2 * larg)) * prof),
    solda: {
      // volta do piso + cantos verticais entre as paredes + encontro com a piscina
      total: arred(2 * (comp + larg) + paredes.pecas.reduce((s, p) => s + p.altura, 0) + contato),
      contato,
    },
  };
}

/* ═══ ANEXOS DE CANTO ═══
 * Regra da obra: no CANTO, com a piscina integrada, o bico da parte funda
 * entra ate a metade do anexo. O anexo e dividido em quatro: UM QUARTO e
 * piscina, TRES QUARTOS sao o anexo.
 *   retangular -> L de seis lados: 4 paredes retas expostas, depois vira
 *                 duas vezes e volta para a piscina
 *   redondo    -> tres quartos de circulo; os dois raios do corte fazem a juncao
 */
/**
 * Contorno em L de um anexo de canto retangular.
 * O bico da piscina ocupa o quadrante da origem (comp/2 × larg/2).
 * Devolve o polígono e quais lados são parede exposta e quais são contato.
 */
export function contornoCantoRetangular(comp, larg) {
  const cm = comp / 2, lm = larg / 2;
  return {
    poligono: [
      { x: cm, y: 0 }, { x: comp, y: 0 }, { x: comp, y: larg },
      { x: 0, y: larg }, { x: 0, y: lm }, { x: cm, y: lm },
    ],
    // quatro paredes retas que ficam de fora
    expostas: [
      { nome: "frente curta", comp: arred(cm) },
      { nome: "lateral longa", comp: arred(larg) },
      { nome: "fundo", comp: arred(comp) },
      { nome: "lateral curta", comp: arred(lm) },
    ],
    // os dois lados que voltam para a piscina — solda, não parede
    contato: arred(cm + lm),
  };
}

/** Polígono de três quartos de círculo, com o quadrante da piscina removido. */
export function contornoCantoRedondo(diametro, passos = 36) {
  const R = diametro / 2, p = [{ x: R, y: R }];
  // varre de 0 a 270°, deixando o quadrante do bico da piscina de fora
  for (let i = 0; i <= passos; i++) {
    const t = (Math.PI / 2) + (i / passos) * (3 * Math.PI / 2);
    p.push({ x: R + R * Math.cos(t), y: R + R * Math.sin(t) });
  }
  return p;
}

/**
 * Anexo de canto — prainha, spa ou banco encaixado no bico da piscina.
 * `forma`: "retangular" (padrão) ou "redondo".
 */
export function anexoCanto(a, cfg = MANTA) {
  const nome = a.nome || "Anexo de canto";
  const prof = a.prof || 0;
  if (!(prof > 0)) return null;

  if (a.forma === "redondo") {
    const D = a.diametro || 0;
    if (!(D > 0)) return null;
    const poligono = contornoCantoRedondo(D);
    const piso = cortarChaoContorno(poligono, cfg, `${nome} · piso`);
    // A cinta é um cilindro: superfície desenvolvível, a manta CURVA sem vincar.
    // Sai numa peça só de 3/4 da circunferência.
    const arco = arred((3 / 4) * Math.PI * D);
    const cinta = cortarCorrida([{ nome: "cinta", comp: arco, prof }], cfg, `${nome} · cinta curva`);
    const contato = arred(D); // os dois raios do corte
    return {
      nome, forma: "redondo", encaixe: "canto",
      medidas: { diametro: arred(D), prof: arred(prof) },
      piso, paredes: { pecas: [cinta], qtdPecas: 1, metrosLineares: cinta.metrosLineares },
      contato, poligono,
      itens: [
        ...piso.pecas.map((f, i) => ({
          nome: `${nome} · piso · faixa ${i + 1}`,
          largura: cfg.larguraBobina, comp: f.comp, tipo: "chao",
        })),
        { nome: cinta.nome, largura: cinta.altura, comp: cinta.comp, tipo: "parede" },
      ],
      areaUtil: arred((3 / 4) * Math.PI * (D / 2) ** 2 + arco * prof),
      solda: {
        total: arred(piso.soldaLinear + 2 * cinta.altura + contato),
        contato,
      },
    };
  }

  const comp = a.comp || 0, larg = a.larg || 0;
  if (!(comp > 0 && larg > 0)) return null;
  const c = contornoCantoRetangular(comp, larg);
  const piso = cortarChaoContorno(c.poligono, cfg, `${nome} · piso`);
  const paredes = cortarParedes(c.expostas.map(f => ({ nome: `${nome} · ${f.nome}`, comp: f.comp, prof })), cfg);
  return {
    nome, forma: "retangular", encaixe: "canto",
    medidas: { comp: arred(comp), larg: arred(larg), prof: arred(prof) },
    piso, paredes, contato: c.contato, poligono: c.poligono,
    itens: [
      ...piso.pecas.map((f, i) => ({
        nome: `${nome} · piso · faixa ${i + 1}`,
        largura: cfg.larguraBobina, comp: f.comp, tipo: "chao",
      })),
      ...paredes.pecas.map(p => ({ nome: p.nome, largura: p.altura, comp: p.comp, tipo: "parede" })),
    ],
    // três quartos do retângulo, mais as quatro paredes expostas
    areaUtil: arred((3 / 4) * comp * larg + c.expostas.reduce((s, f) => s + f.comp, 0) * prof),
    solda: {
      total: arred(piso.soldaLinear + paredes.pecas.reduce((s, p) => s + p.altura, 0) + c.contato),
      contato: c.contato,
    },
  };
}

export function planoManta({ comp, larg, prof, perimetro, areaReal, faces, praiComp = 0,
                             aproveitarSobra = false, anexos = [] }, cfg = MANTA) {
  const chao = cortarChaoRegioes(regioesChao(comp, larg, praiComp, cfg), cfg);
  const paredes = cortarParedes(faces || facesRetangulo(comp, larg, prof), cfg);

  // APROVEITAMENTO — desligado por padrão, e é para ficar desligado mesmo.
  // A tira que sobra da última faixa depende do formato de cada piscina; em
  // muitas ela não bate e o corte vira sucata. Quem projeta é que sabe olhar a
  // peça e decidir, então isto só entra quando alguém pedir explicitamente.
  const oportunidades = [];
  const reaproveitadas = new Set();
  for (let i = 0; i < chao.partes.length; i++) {
    const candidatas = chao.partes.slice(i + 1)
      .filter(c => !reaproveitadas.has(c.nome) && c.faixas === 1)
      .map(c => ({ nome: c.nome, largura: c.alvo, comp: c.compFaixa, metros: c.metrosLineares }));
    const a = analisarSobra(chao.partes[i], candidatas, cfg);
    if (a?.cabem.length) {
      oportunidades.push(a);
      if (aproveitarSobra) a.cabem.forEach(c => reaproveitadas.add(c.nome));
    }
  }
  const economia = arred(chao.partes
    .filter(p => reaproveitadas.has(p.nome))
    .reduce((s, p) => s + p.metrosLineares, 0));
  // ── anexos externos (prainha externa, banco): peça própria, ninhada junto ──
  // canto usa o modelo de tres quartos (bico da piscina entra ate a metade);
  // lado usa o retangulo encostado
  const anexosCalc = (anexos || [])
    .map(a => (a.encaixe === "canto" ? anexoCanto(a, cfg) : anexoExterno(a, cfg)))
    .filter(Boolean);
  const itensAnexo = anexosCalc.flatMap(a => a.itens);
  const anexoNinho = ninharComplementos(itensAnexo, cfg);
  const soldaAnexos = arred(anexosCalc.reduce((s, a) => s + a.solda.total, 0));

  const metrosLineares = arred(
    chao.metrosLineares + paredes.metrosLineares - economia + anexoNinho.metrosLineares);
  // O que se COBRA do cliente: a manta cortada para esta piscina, largura cheia
  // da bobina, porque o retalho ao lado de peça baixa não se aproveita. A ponta
  // que sobra da bobina NÃO entra — ela volta para a prateleira.
  const areaCobravel = arred(metrosLineares * cfg.larguraBobina);
  const real = areaReal ?? comp * larg + (perimetro ?? 2 * (comp + larg)) * prof;
  // lista de corte: cada faixa de chão e cada peça de parede vira um pedaço
  const lista = [
    ...chao.partes.filter(p => !reaproveitadas.has(p.nome)).flatMap(p =>
      Array.from({ length: p.faixas }, (_, i) => ({
        nome: p.faixas > 1 ? `${p.nome} · faixa ${i + 1}` : p.nome,
        comp: p.compFaixa,
      }))),
    ...paredes.pecas.map(p => ({ nome: p.nome, comp: p.comp })),
    // cada passada de faixinha também sai da bobina
    ...paredes.complementos.passadas.map((p, i) => ({
      nome: `Faixinhas de complemento ${i + 1}`, comp: p.comp,
    })),
    ...anexoNinho.passadas.map((p, i) => ({
      nome: `Anexos · passada ${i + 1}`, comp: p.comp,
    })),
  ];
  const pedido = encaixarBobinas(lista, cfg);
  const solda = {
    emendaChao: arred(chao.partes.reduce((s, p) => s + p.soldaEmenda, 0)),
    chaoNaParede: arred(chao.partes.reduce((s, p) => s + p.soldaBorda, 0)),
    cantosParede: arred(paredes.pecas.reduce((s, p) => s + p.altura, 0)),
  };
  solda.anexos = soldaAnexos;
  solda.total = arred(solda.emendaChao + solda.chaoNaParede + solda.cantosParede + soldaAnexos);
  return {
    chao,
    paredes,
    anexos: anexosCalc,
    anexoNinho,
    lista,
    pedido,
    solda,
    // o que caberia numa tira que sobra — sempre calculado, aplicado só sob pedido
    oportunidades,
    aproveitado: [...reaproveitadas],
    economiaAproveitamento: economia,
    metrosLineares,
    areaCobravel,
    areaReal: arred(real),
    sobra: arred(areaCobravel - real),
    sobraPct: arred((areaCobravel / real - 1) * 100, 1),
    cfg,
  };
}
