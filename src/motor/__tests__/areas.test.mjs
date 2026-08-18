// Teste do motor de áreas — trava a separação chão × paredes × volume.
// Caso de origem: orçamento 6,00 × 3,50 × 1,40 com prainha de 1,00 m a 0,50 m,
// que mostrava "Chão 24,1 m²" — 3,15 m² de degrau vertical contados como fundo,
// o que numericamente equivalia a alongar a piscina em 0,90 m.
import { calcA } from "../areas.js";

let falhas=0,total=0;
const perto=(a,b,tol=0.06)=>Math.abs(parseFloat(a)-b)<=tol;
const ok=(nome,cond,obtido,esperado)=>{
  total++;
  if(cond)console.log(`  ok  ${nome}`);
  else{falhas++;console.log(`  FALHOU  ${nome}: obtido ${obtido}, esperado ${esperado}`);}
};
const SPA_OFF={on:false,length:"0",width:"0",depth:"0"};

console.log("\ncalcA — retangular simples 6,00 × 3,50 × 1,40");
{
  const r=calcA({length:"6.00",width:"3.50",depth:"1.40"},SPA_OFF,"regular",[],"Retangular",[],{},null);
  ok("chão = 6,00 × 3,50",           perto(r.chao,21.0),  r.chao,  21.0);
  ok("paredes = 19,00 × 1,40",       perto(r.par,26.6),   r.par,   26.6);
  ok("perímetro = 2×(6,00+3,50)",    perto(r.perim,19.0), r.perim, 19.0);
  ok("volume = 21,00 × 1,40",        perto(r.vol,29.4),   r.vol,   29.4);
  ok("total = chão + paredes",       perto(r.tot,47.6),   r.tot,   47.6);
}

console.log("\ncalcA — 6,00 × 3,50 × 1,40 com prainha de 1,00 m a 0,50 m");
{
  const pool={length:"6.00",width:"3.50",depth:"1.40",prainhaComp:"1.00",prainhaProf:"0.50"};
  const r=calcA(pool,SPA_OFF,"regular",[],"Com prainha",[],{},null);
  // o fundo é a planta inteira: 1,00 m de prainha + 5,00 m de parte funda
  ok("chão = planta real, sem o degrau",       perto(r.chao,21.0),  r.chao,  21.0);
  // 2 laterais em dois níveis + testeira funda + testeira rasa + degrau interno
  ok("paredes incluem o degrau (3,15 m²)",     perto(r.par,24.8),   r.par,   24.8);
  ok("perímetro não muda com a prainha",       perto(r.perim,19.0), r.perim, 19.0);
  // 5,00×3,50×1,40 (fundo) + 1,00×3,50×0,50 (lâmina sobre a prainha)
  ok("volume desconta a parte rasa",           perto(r.vol,26.25),  r.vol,   26.25);
  ok("área total preserva o valor do vinil",   perto(r.tot,45.8),   r.tot,   45.8);
  ok("chão não vaza para fora da piscina",     parseFloat(r.chao)<=21.01, r.chao, "≤ 21,00");
}

console.log("\ncalcA — prainha sem medida segue só ilustrativa");
{
  const r=calcA({length:"6.00",width:"3.50",depth:"1.40",prainhaComp:"",prainhaProf:""},SPA_OFF,"regular",[],"Com prainha",[],{},null);
  ok("chão igual ao retangular",    perto(r.chao,21.0), r.chao, 21.0);
  ok("paredes iguais ao retangular",perto(r.par,26.6),  r.par,  26.6);
  ok("volume igual ao retangular",  perto(r.vol,29.4),  r.vol,  29.4);
}

console.log("\ncalcA — largura maior tem de crescer proporcional (6,00 × 3,00 → 6,00 × 3,50)");
{
  const base={length:"6.00",depth:"1.40",prainhaComp:"1.00",prainhaProf:"0.50"};
  const a=calcA({...base,width:"3.00"},SPA_OFF,"regular",[],"Com prainha",[],{},null);
  const b=calcA({...base,width:"3.50"},SPA_OFF,"regular",[],"Com prainha",[],{},null);
  ok("chão 6,00×3,00 = 18,00",        perto(a.chao,18.0), a.chao, 18.0);
  ok("chão 6,00×3,50 = 21,00",        perto(b.chao,21.0), b.chao, 21.0);
  ok("+0,50 m de largura = +3,00 m²", perto(parseFloat(b.chao)-parseFloat(a.chao),3.0),
     (parseFloat(b.chao)-parseFloat(a.chao)).toFixed(2), 3.0);
}

console.log(`\n${total-falhas}/${total} passaram`);
process.exit(falhas?1:0);
