// Manta armada 1,5 mm — plano de corte de bobina.
// Regras ditadas pela obra: bobina de 1,55 m; a parede NÃO corre contínua — cada
// face é uma peça, com 5 cm em cada ponta vertical para montar sobre a vizinha e
// soldar o canto, e altura = profundidade + 5 cm de arremate no topo + 5 cm
// dobrados para dentro no pé. No chão, quem arremata a quina é a parede (a peça
// do chão sobe só ~1 cm ali), mas na horizontal ela monta os 5 cm de sempre por
// cima da dobra da parede. Chão com prainha sai em DUAS regiões: a faixa do
// fundo não sobe para o piso da prainha. Bobina de 25 m; a ponta volta para a
// prateleira e não é cobrada do cliente.
// Vale SÓ para a manta armada 1,5 mm: o vinil 0,7/0,8 (bolsão) segue por área.
import { faixasPara, coberturaDe, cortarChao, cortarPeca, cortarParedes,
         facesRetangulo, facesComPrainha, regioesChao, cortarChaoRegioes,
         cortarCorrida, ninharComplementos, cortarChaoContorno, facesDoContorno,
         encaixarBobinas, analisarSobra, planoManta, MANTA } from "../manta.js";

let falhas=0,total=0;
const perto=(a,b,tol=0.011)=>Math.abs(a-b)<=tol;
const arredondar=v=>Math.round(v*100)/100;
const ok=(nome,cond,obtido,esperado)=>{
  total++;
  if(cond)console.log(`  ok  ${nome}`);
  else{falhas++;console.log(`  FALHOU  ${nome}: obtido ${obtido}, esperado ${esperado}`);}
};

console.log("\nfaixasPara — quantas faixas de 1,55 m cobrem a largura");
ok("1,00 m cabe em 1 faixa",      faixasPara(1.00)===1, faixasPara(1.00), 1);
ok("1,55 m cabe em 1 faixa",      faixasPara(1.55)===1, faixasPara(1.55), 1);
ok("1,56 m já pede 2 faixas",     faixasPara(1.56)===2, faixasPara(1.56), 2);
ok("3,05 m = 2 faixas no limite", faixasPara(3.05)===2, faixasPara(3.05), 2);
ok("3,06 m pede 3 faixas",        faixasPara(3.06)===3, faixasPara(3.06), 3);
ok("4,10 m pede 3 faixas",        faixasPara(4.10)===3, faixasPara(4.10), 3);
ok("2 faixas cobrem 3,05 m",      perto(coberturaDe(2),3.05), coberturaDe(2), 3.05);
ok("3 faixas cobrem 4,55 m",      perto(coberturaDe(3),4.55), coberturaDe(3), 4.55);

console.log("\ncortarChao — piscina 6,00 × 4,00 (o exemplo da obra)");
{
  const c=cortarChao(6.00,4.00);
  ok("3 faixas, como o Marcos contou",  c.faixas===3,               c.faixas,    3);
  ok("faixas correm no comprimento",    c.sentido==="comprimento",  c.sentido,   "comprimento");
  ok("alvo = 4,00 + 2 rebarbas = 4,02", perto(c.alvo,4.02),         c.alvo,      4.02);
  ok("3 faixas cobrem 4,55 ≥ 4,02",     perto(c.cobertura,4.55),    c.cobertura, 4.55);
  ok("cada faixa = 6,00 + 2 rebarbas",  perto(c.compFaixa,6.02),    c.compFaixa, 6.02);
  ok("bobina = 3 × 6,02 = 18,06 m",     perto(c.metrosLineares,18.06), c.metrosLineares, 18.06);
  ok("2 emendas para soldar",           c.emendas===2,              c.emendas,   2);
  ok("correr na largura daria mais emenda", c.alternativa.emendas>c.emendas,
     c.alternativa.metrosLineares, "mais faixas");
}

console.log("\ncortarPeca — cada face é uma peça, com 5 cm em cada ponta");
{
  // regra ditada na obra: face de 5,00 m sai com 5,10; a de 3,50 sai com 3,60
  const a=cortarPeca({nome:"lateral funda",comp:5.00,prof:1.40});
  ok("face de 5,00 vira peça de 5,10",  perto(a.comp,5.10),   a.comp,   5.10);
  ok("parede de 1,40 sai com 1,50",     perto(a.altura,1.50), a.altura, 1.50);
  ok("cabe na largura da bobina",       a.complemento===null, a.complemento,  null);
  const b=cortarPeca({nome:"testeira",comp:3.50,prof:1.40});
  ok("face de 3,50 vira peça de 3,60",  perto(b.comp,3.60),   b.comp,   3.60);
  const c=cortarPeca({nome:"prainha",comp:1.00,prof:0.50});
  ok("prainha: 5 para cima e 5 para baixo", perto(c.altura,0.60), c.altura, 0.60);
  ok("prainha de 1,00 vira 1,10",       perto(c.comp,1.10),   c.comp,   1.10);
}

console.log("\ncortarParedes — retangular 6,00 × 3,50 × 1,40");
{
  const p=cortarParedes(facesRetangulo(6.00,3.50,1.40));
  ok("4 peças, uma por face",        p.qtdPecas===4,                p.qtdPecas,       4);
  // 2×6,10 + 2×3,60 = 19,40 → perímetro 19,00 + 10 cm por face
  ok("2×6,10 + 2×3,60 = 19,40 m",    perto(p.metrosLineares,19.40), p.metrosLineares, 19.40);
  ok("0,40 m a mais que o perímetro", perto(p.metrosLineares-19.00,0.40),
     arredondar(p.metrosLineares-19.00), 0.40);
}

console.log("\ncortarParedes — 6,00 × 3,50 × 1,40 com prainha de 1,00 a 0,50");
{
  const p=cortarParedes(facesComPrainha(6.00,3.50,1.40,1.00,0.50));
  const nome=n=>p.pecas.find(x=>x.nome===n);
  // a cinta da prainha sai numa peça só → 4 peças soltas + 1 corrida
  ok("5 peças, com a prainha em corrida", p.qtdPecas===5, p.qtdPecas, 5);
  ok("lateral funda = 5,10",    perto(nome("Lateral 1 · fundo").comp,5.10),     nome("Lateral 1 · fundo").comp,     5.10);
  ok("testeira funda = 3,60",   perto(nome("Testeira funda").comp,3.60),        nome("Testeira funda").comp,        3.60);
  ok("espelho tem 90 cm de face", perto(nome("Degrau da prainha").faceProf,0.90), nome("Degrau da prainha").faceProf, 0.90);
  // 2×5,10 + 3,60 + 3,60 + 5,60 = 23,00
  ok("total = 23,00 m lineares", perto(p.metrosLineares,23.00), p.metrosLineares, 23.00);
}

console.log("\ncortarCorrida — a cinta da prainha inteira, vincada nos cantos");
{
  const c=cortarCorrida([{nome:"lat 1",comp:1.00,prof:0.50},
                         {nome:"testeira rasa",comp:3.50,prof:0.50},
                         {nome:"lat 2",comp:1.00,prof:0.50}],undefined,"Cinta da prainha");
  // 1,00 + 3,50 + 1,00 = 5,50, mais 5 cm de solda em cada ponta
  ok("peça de 5,60 m",               perto(c.comp,5.60),   c.comp,   5.60);
  ok("altura 0,50 + 10 cm = 0,60",   perto(c.altura,0.60), c.altura, 0.60);
  ok("2 cantos vincados, sem solda", c.vincos===2,         c.vincos, 2);
  ok("3 trechos numa peça só",       c.trechos.length===3, c.trechos.length, 3);
  ok("solda só nas 2 pontas",        perto(c.soldaLinear,1.20), c.soldaLinear, 1.20);
}

console.log("\ncorrida × peças soltas — e o caso fora de esquadro");
{
  const com=cortarParedes(facesComPrainha(6.00,3.50,1.40,1.00,0.50,{prainhaCorrida:true}));
  const sem=cortarParedes(facesComPrainha(6.00,3.50,1.40,1.00,0.50,{prainhaCorrida:false}));
  ok("soltas dão 7 peças",         sem.qtdPecas===7,                sem.qtdPecas,       7);
  ok("soltas gastam 23,20",        perto(sem.metrosLineares,23.20), sem.metrosLineares, 23.20);
  ok("a corrida economiza 0,20 m", perto(sem.metrosLineares-com.metrosLineares,0.20),
     arredondar(sem.metrosLineares-com.metrosLineares), 0.20);
  ok("e faz menos solda",          sem.soldaLinear>com.soldaLinear, sem.soldaLinear, "> "+com.soldaLinear);
  // parede fora de esquadro: a manta de 1,5 mm não acomoda no vinco, tem que cortar e soldar
  ok("fora de esquadro volta a soldar canto a canto", sem.qtdPecas>com.qtdPecas, sem.qtdPecas, "> "+com.qtdPecas);
}

console.log("\nretangular grande — NUNCA vira corrida, sempre solda no canto");
{
  const p=cortarParedes(facesRetangulo(12.00,6.00,1.60));
  ok("4 peças soltas, uma por face", p.qtdPecas===4, p.qtdPecas, 4);
  ok("nenhuma corrida",              p.pecas.every(x=>!x.corrida), p.pecas.filter(x=>x.corrida).length, 0);
}

console.log("\ncortarPeca — parede mais alta que a bobina leva FAIXINHA no pé");
{
  // regra da obra: bobina de 1,40 com parede de 1,60 → solda-se uma tira no pé
  // para completar a altura, e NÃO outra passada inteira da bobina
  const cfg={...MANTA,larguraBobina:1.40};
  const p=cortarPeca({comp:6.00,prof:1.60},cfg);
  ok("altura de corte = 1,70",              perto(p.altura,1.70),              p.altura,           1.70);
  ok("peça principal cobre a bobina cheia", perto(p.alturaPrincipal,1.40),     p.alturaPrincipal,  1.40);
  ok("falta 0,30 → faixinha de 0,35",       perto(p.complemento.largura,0.35), p.complemento.largura, 0.35);
  ok("a faixinha corre o mesmo comprimento",perto(p.complemento.comp,6.10),    p.complemento.comp, 6.10);
  ok("principal gasta UMA passada",         perto(p.metrosLineares,6.10),      p.metrosLineares,   6.10);
  ok("a costura da faixinha entra na solda",perto(p.soldaLinear,9.50),         p.soldaLinear,      9.50);
  const r=cortarPeca({comp:6.00,prof:1.40});
  ok("parede de 1,50 na bobina de 1,55 não pede faixinha", r.complemento===null, r.complemento, null);
}

console.log("\nninharComplementos — as faixinhas saem lado a lado da mesma passada");
{
  const cfg={...MANTA,larguraBobina:1.40};
  const w=cortarParedes(facesRetangulo(10.00,4.00,1.60),cfg);
  ok("4 faixinhas, uma por parede",       w.complementos.qtd===4,             w.complementos.qtd,             4);
  ok("cabem todas numa passada só",       w.complementos.passadas.length===1, w.complementos.passadas.length, 1);
  ok("4 × 0,35 fecha a bobina de 1,40",   perto(w.complementos.passadas[0].largura,1.40),
     w.complementos.passadas[0].largura, 1.40);
  ok("a passada custa a faixinha mais longa", perto(w.complementos.metrosLineares,10.10),
     w.complementos.metrosLineares, 10.10);
  // antes da regra da faixinha isto dobrava tudo: 2 × 28,40 = 56,80
  ok("total = 28,40 + 10,10 = 38,50",     perto(w.metrosLineares,38.50),      w.metrosLineares,   38.50);
  ok("bem menos que duas passadas inteiras", w.metrosLineares<56.80,          w.metrosLineares,   "< 56,80");
}

console.log("\nplanoManta — 6,00 × 4,00 × 1,40 completo");
{
  const r=planoManta({comp:6.00,larg:4.00,prof:1.40,perimetro:20.00});
  // chão 3×6,02 = 18,06 + paredes (2×6,10 + 2×4,10) = 20,40
  ok("bobina total = 18,06 + 20,40", perto(r.metrosLineares,38.46),  r.metrosLineares, 38.46);
  ok("cobrável = 38,46 × 1,55",      perto(r.areaCobravel,59.61,0.02), r.areaCobravel, 59.61);
  ok("área real = 24 + 28",          perto(r.areaReal,52.00),        r.areaReal,       52.00);
  ok("sobra do método",              perto(r.sobra,7.61,0.02),       r.sobra,          7.61);
  ok("sobra sempre positiva",        r.sobra>0,                      r.sobra,          "> 0");
  ok("percentual de sobra ~14,6%",   perto(r.sobraPct,14.6,0.1),     r.sobraPct,       14.6);
}

console.log("\nencaixarBobinas — bobina de 25 m, peça sai inteira");
{
  const p=encaixarBobinas([{nome:"a",comp:20},{nome:"b",comp:10}]);
  ok("20 + 10 não cabe numa bobina só", p.qtd===2,                p.qtd,             2);
  ok("compra 50 m",                     p.metrosComprados===50,   p.metrosComprados, 50);
  ok("usa 30 m",                        perto(p.metrosUsados,30), p.metrosUsados,    30);
  ok("20 m de ponta perdida",           perto(p.sobraLinear,20),  p.sobraLinear,     20);
}
{
  const p=encaixarBobinas([{nome:"a",comp:12.5},{nome:"b",comp:12.5}]);
  ok("12,5 + 12,5 fecha uma bobina", p.qtd===1,                   p.qtd,             1);
  ok("aproveitamento de 100%",       perto(p.aproveitamento,100), p.aproveitamento,  100);
}
{
  const p=encaixarBobinas([{nome:"grande",comp:30}]);
  ok("peça maior que a bobina é sinalizada", p.naoCabem.length===1, p.naoCabem.length, 1);
}

console.log("\nplanoManta — pedido de bobinas da piscina real (6,00×3,50×1,40 com prainha)");
{
  const r=planoManta({comp:6.00,larg:3.50,prof:1.40,perimetro:19.00,areaReal:45.80,
                      praiComp:1.00,faces:facesComPrainha(6.00,3.50,1.40,1.00,0.50)});
  // 3 faixas do fundo + 1 do piso da prainha + 7 peças de parede
  // 3 faixas do fundo + 1 do piso da prainha + 5 peças de parede
  ok("9 pedaços na lista de corte",   r.lista.length===9,            r.lista.length,           9);
  ok("2 bobinas de 25 m",             r.pedido.qtd===2,              r.pedido.qtd,             2);
  ok("compra 50 m lineares",          r.pedido.metrosComprados===50, r.pedido.metrosComprados, 50);
  // o fundo tem 5,00 m de comprimento (6,00 − 1,00 de prainha) → faixa de 5,10
  const fundo=r.chao.partes.find(p=>p.nome==="Chão · fundo");
  const prai=r.chao.partes.find(p=>p.nome==="Chão · prainha");
  // 5,00 do fundo + 1 cm de rebarba na testeira + 0 na descida do espelho
  ok("fundo: 3 faixas de 5,01",       fundo.faixas===3&&perto(fundo.compFaixa,5.01), fundo.faixas+"x"+fundo.compFaixa, "3 x 5,01");
  ok("fundo: 2 soldas no meio",       fundo.emendas===2,             fundo.emendas,            2);
  ok("prainha: 1 faixa de 3,52",      prai.faixas===1&&perto(prai.compFaixa,3.52),   prai.faixas+"x"+prai.compFaixa, "1 x 3,52");
  ok("prainha cortada na largura",    prai.sentido==="largura",      prai.sentido,             "largura");
  ok("faixa do fundo não vira piso da prainha", r.chao.partes.length===2, r.chao.partes.length, 2);
  ok("nada estourou a bobina",        r.pedido.naoCabem.length===0,  r.pedido.naoCabem.length, 0);
  ok("encaixe bate com a soma das peças",
     perto(r.pedido.metrosUsados,r.metrosLineares), r.pedido.metrosUsados, r.metrosLineares);
  ok("ponta perdida entra no orçamento", r.pedido.sobraLinear>0, r.pedido.sobraLinear, "> 0");
}

console.log("\nplanoManta — nunca compra menos do que a piscina tem");
{
  for(const [c,l,p] of [[6,3.5,1.4],[8,4,1.5],[10,5,1.6],[4,3,1.2],[12,6,2.0]]){
    const r=planoManta({comp:c,larg:l,prof:p,perimetro:2*(c+l)});
    ok(`${c}×${l}×${p}: cobrável ≥ área real`, r.areaCobravel>r.areaReal,
       `${r.areaCobravel} vs ${r.areaReal}`, "cobrável maior");
  }
}

console.log("\nanalisarSobra — a última faixa do fundo sobra quase inteira");
{
  const r=planoManta({comp:6.00,larg:3.50,prof:1.40,perimetro:19.00,areaReal:45.80,praiComp:1.00,
                      faces:facesComPrainha(6.00,3.50,1.40,1.00,0.50)});
  const fundo=r.chao.partes.find(p=>p.nome==="Chão · fundo");
  const prai =r.chao.partes.find(p=>p.nome==="Chão · prainha");
  const a=analisarSobra(fundo,[{nome:"Chão · prainha",largura:prai.alvo,comp:prai.compFaixa}]);
  // faixas 1+2 cobrem 3,05 de 3,52 → faltam 0,47; a 3ª usa 0,52 (0,47 + 5 cm de solda)
  ok("3ª faixa usa só 0,52 da largura", perto(a.usadaNaUltima,0.52), a.usadaNaUltima, 0.52);
  ok("sobra uma tira de 1,03 × 5,01",   perto(a.tira.largura,1.03)&&perto(a.tira.comp,5.01),
     a.tira.largura+" × "+a.tira.comp, "1,03 × 5,01");
  ok("o piso da prainha cabe na tira",  a.cabem.length===1, a.cabem.length, 1);
  ok("mas com só 2 cm de folga",        perto(a.cabem[0].folgaLargura,0.02), a.cabem[0].folgaLargura, 0.02);
}

console.log("\naproveitarSobra — é opção de quem projeta, nunca automático");
{
  const args={comp:6.00,larg:3.50,prof:1.40,perimetro:19.00,areaReal:45.80,praiComp:1.00,
              faces:facesComPrainha(6.00,3.50,1.40,1.00,0.50)};
  const off=planoManta(args);
  const on =planoManta({...args,aproveitarSobra:true});
  ok("desligado por padrão",            off.aproveitado.length===0, off.aproveitado.length, 0);
  ok("mas a oportunidade é mostrada",   off.oportunidades.length===1, off.oportunidades.length, 1);
  ok("a peça continua na lista",        off.lista.length===9,       off.lista.length,       9);
  ok("ligado, tira a peça da lista",    on.lista.length===8,        on.lista.length,        8);
  ok("e registra o que aproveitou",     on.aproveitado[0]==="Chão · prainha", on.aproveitado[0], "Chão · prainha");
  ok("economia de 3,52 m lineares",     perto(on.economiaAproveitamento,3.52), on.economiaAproveitamento, 3.52);
  ok("cobrável cai de 64,40 para 58,95",perto(off.areaCobravel,64.40,0.02)&&perto(on.areaCobravel,58.95,0.02),
     off.areaCobravel+" → "+on.areaCobravel, "64,40 → 58,95");
  ok("solda não muda com o aproveitamento", perto(off.solda.total,on.solda.total), on.solda.total, off.solda.total);
}

console.log("\ncortarChaoContorno — formato irregular: peça maior no centro");
{
  // Feijão de 6,00 × 3,00
  const feijao=[];
  for(let i=0;i<24;i++){const t=i/24*2*Math.PI;
    feijao.push({x:3+3*Math.cos(t), y:1.5+1.5*Math.sin(t)*(1-0.18*Math.cos(t))});}
  const c=cortarChaoContorno(feijao,undefined,"Chão · feijão");
  ok("faixas correm no comprimento", c.sentido==="comprimento", c.sentido, "comprimento");
  ok("3 faixas para 3,00 de largura", c.faixas===3, c.faixas, 3);
  // o miolo é a faixa mais longa; as das pontas encurtam acompanhando a curva
  const meio=c.pecas[1], p1=c.pecas[0], p2=c.pecas[2];
  ok("a peça maior fica no centro",  meio.comp>p1.comp&&meio.comp>p2.comp, meio.comp, "> "+p1.comp);
  ok("as pontas saem curtas",        p1.comp<c.maior&&p2.comp<c.maior,     p1.comp+"/"+p2.comp, "< "+c.maior);
  ok("simétrico nas duas pontas",    perto(p1.comp,p2.comp),               p1.comp+" vs "+p2.comp, "iguais");
  // tratar como retângulo 6,00 × 3,00 daria 3 × 6,02 = 18,06
  ok("segue o contorno e gasta menos que o retângulo", c.metrosLineares<18.06,
     c.metrosLineares, "< 18,06");
}

console.log("\nfacesDoContorno — a parede acompanha o desenho inteiro");
{
  // Formato L: 6,00 × 4,00 com um recorte de 2,00 × 2,00
  const L=[{x:0,y:0},{x:6,y:0},{x:6,y:2},{x:2,y:2},{x:2,y:4},{x:0,y:4}];
  const faces=facesDoContorno(L,1.40);
  ok("6 faces, uma por lado do L",  faces.length===6, faces.length, 6);
  ok("a soma bate com o perímetro", perto(faces.reduce((s,f)=>s+f.comp,0),20.00),
     arredondar(faces.reduce((s,f)=>s+f.comp,0)), 20.00);
  const p=cortarParedes(faces);
  ok("nenhuma vira corrida",        p.pecas.every(x=>!x.corrida), 0, 0);
  // 6 faces × 10 cm de solda
  ok("perímetro + 10 cm por face",  perto(p.metrosLineares,20.60), p.metrosLineares, 20.60);
  const c=cortarChaoContorno(L,undefined,"Chão · L");
  ok("chão do L corre no comprimento", c.sentido==="comprimento", c.sentido, "comprimento");
  ok("faixas de comprimentos diferentes", new Set(c.pecas.map(x=>x.comp)).size>1,
     c.pecas.map(x=>x.comp).join("/"), "variados");
}

console.log(`\n${total-falhas}/${total} passaram`);
process.exit(falhas?1:0);
