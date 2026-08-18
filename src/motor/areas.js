// Motor de áreas do orçamento — chão, paredes, perímetro e volume da piscina.
// Saiu do App.jsx para poder ser testado sem React (ver __tests__/areas.test.mjs).
//
// Convenção das "buckets":
// - chao    = superfície HORIZONTAL (fundo). Vinil de fundo.
// - par     = superfície VERTICAL (paredes do contorno + degraus internos).
// - tot     = chao + par + spa. É o que puxa o metro de vinil no orçamento.
// Toda face vertical entra em `par`, mesmo quando é interna (degrau da prainha).
import { calcDesenho } from "./formas.js";

export const calcA=(pool,spa,wMode,walls,poolFmt,extras,spaType,desenho)=>{
  const L=parseFloat(pool.length)||0,W=parseFloat(pool.width)||0;
  const dMin=parseFloat(pool.depthMin)||0,dMax=parseFloat(pool.depthMax)||0;
  const D=(dMin>0&&dMax>0)?(dMin+dMax)/2:parseFloat(pool.depth)||0;
  const realDMin=(dMin>0)?dMin:D,realDMax=(dMax>0)?dMax:D;
  const isOval=poolFmt==="Oval";
  const isOitavada=poolFmt==="Oitavada";
  const a=L/2,b=W/2;
  const ch=isOitavada?(parseFloat(pool.chanfro)||1):0;
  // Se raso+fundo preenchidos e diferentes, usa comprimento inclinado real da rampa (√(L² + (dMax−dMin)²))
  const sloped=dMin>0&&dMax>0&&dMin!==dMax;
  const Linc=sloped?Math.sqrt(L*L+(dMax-dMin)*(dMax-dMin)):L;
  // Oitavada: retângulo - 4 triângulos dos cantos + 4 chanfros diagonais
  const chanfroDiag=Math.sqrt(ch*ch+ch*ch); // diagonal do chanfro (hipotenusa)
  const oitChao=isOitavada?(Linc*W-4*(ch*ch/2)):0; // retângulo - 4 triângulos
  const oitPerim=isOitavada?(2*(L-2*ch)+2*(W-2*ch)+4*chanfroDiag):0;
  let chao=isOval?(Math.PI*a*b):isOitavada?oitChao:Linc*W;
  const ovalPerim=isOval?(Math.PI*(3*(a+b)-Math.sqrt((3*a+b)*(a+3*b)))):0;
  let par=wMode==="irregular"&&walls.length>0
    ?walls.reduce((s,w)=>s+(parseFloat(w.l)||0)*(parseFloat(w.h)||D),0)
    :(isOval?(ovalPerim*D):isOitavada?(oitPerim*D):(L*realDMin+L*realDMax+2*W*D));
  let perim=wMode==="irregular"&&walls.length>0
    ?walls.reduce((s,w)=>s+(parseFloat(w.l)||0),0)
    :(isOval?ovalPerim:isOitavada?oitPerim:(2*L+2*W));
  // "Com prainha" com medida informada: platô raso na ponta + degrau de descida.
  // Sem medida (campo vazio) a prainha segue só ilustrativa e nada muda no cálculo.
  const praiC=parseFloat(String(pool?.prainhaComp??"").replace(",","."))||0;
  const praiP=parseFloat(String(pool?.prainhaProf??"").replace(",","."))||0;
  const temPrainha=poolFmt==="Com prainha"&&praiC>0&&praiC<L;
  let praiVol=0;
  if(temPrainha){
    const pp=Math.min(praiP>0?praiP:D*0.25,Math.max(D-0.05,0.05)); // lâmina sobre a prainha
    const Lf=L-praiC;                                             // trecho fundo
    // O degrau prainha → fundo é uma face VERTICAL (W × desnível): é parede, não chão.
    // Ficava somado em `chao` e inflava o fundo — numa 6,00×3,50×1,40 com prainha
    // de 1,00×0,50 o chão aparecia como 24,1 m² em vez dos 21,0 m² reais.
    const degrau=W*(D-pp);
    // paredes: laterais em dois níveis + testeira funda cheia + testeira rasa só na prainha
    // (parede fora de esquadro tem medida própria digitada — não sobrescreve o contorno,
    //  mas o degrau é interno e soma de qualquer jeito)
    if(!(wMode==="irregular"&&walls.length>0))par=2*(Lf*D+praiC*pp)+W*D+W*pp;
    par+=degrau;
    praiVol=Lf*W*D+praiC*W*pp;
  }
  // Desenho livre (modelos/editor): áreas e perímetro REAIS do formato desenhado
  const dM=desenho&&desenho.vertices&&desenho.vertices.length>=3?calcDesenho(desenho,D):null;
  if(dM){chao=dM.chao;par=dM.paredes;perim=dM.perim;}
  // Extras (prainha, degrau, banco — cada peça: topo=L×W, face=L×H)
  const pf=v=>parseFloat(String(v||"").replace(",","."))||0;
  let extraChao=0,extraPar=0;
  if(Array.isArray(extras)){
    extras.forEach(e=>{
      const l=pf(e.l),w=pf(e.w),h=pf(e.h);
      if(e.mode==="peca"){extraChao+=l*w;extraPar+=l*h;}
      else if(e.mode==="topo_add")extraChao+=l*w;
      else if(e.mode==="chao_sub")extraChao-=l*w;
      else if(e.mode==="face_add")extraPar+=l*h;
      else if(e.mode==="parede_sub")extraPar-=l*h;
    });
  }
  chao+=extraChao;par+=extraPar;
  const sL=parseFloat(spa.length)||0,sW=parseFloat(spa.width)||0,sD=parseFloat(spa.depth)||0;
  const sChao=spa.on?sL*sW:0,sPar=spa.on?(2*sL*sD+2*sW*sD):0;
  const sPerim=spa.on?(2*sL+2*sW):0;
  // Spa do formato "Com Spa"
  const st=spaType||{};
  const sqC=parseFloat(st.qComp)||0,sqL=parseFloat(st.qLarg)||0,sqP=parseFloat(st.qProf)||0;
  const sqChao=st.quadrado?sqC*sqL:0,sqPar=st.quadrado?(2*sqC*sqP+2*sqL*sqP):0;
  const srR=(parseFloat(st.rDiam)||0)/2,srP=parseFloat(st.rProf)||0;
  const srC2=parseFloat(st.rComp)||0,srL2=parseFloat(st.rLarg)||0;
  const isRndSq=st.rFormato==="quadrado";
  const srChao=st.redondo?(isRndSq?srC2*srL2:Math.PI*srR*srR):0;
  const srPar=st.redondo?(isRndSq?(2*srC2*srP+2*srL2*srP):Math.PI*(srR*2)*srP):0;
  const fmtSpaChao=sqChao+srChao,fmtSpaPar=sqPar+srPar;
  const srVol=st.redondo?(isRndSq?srC2*srL2*srP:Math.PI*srR*srR*srP):0;
  const vol=(dM?dM.vol:(temPrainha?praiVol:(isOval?(Math.PI*a*b):isOitavada?(L*W-4*(ch*ch/2)):L*W)*D))+(spa.on?sL*sW*sD:0)+(st.quadrado?sqC*sqL*sqP:0)+srVol;
  const depthInfo={avg:D,min:realDMin,max:realDMax,sloped:dMin>0&&dMax>0&&dMin!==dMax};
  return{chao:chao.toFixed(1),par:par.toFixed(1),sChao:(sChao+fmtSpaChao).toFixed(1),sPar:(sPar+fmtSpaPar).toFixed(1),tot:(chao+par+sChao+sPar+fmtSpaChao+fmtSpaPar).toFixed(1),vol:vol.toFixed(1),perim:(perim+sPerim).toFixed(1),chaoTot:(chao+sChao+fmtSpaChao).toFixed(1),depthInfo,extraChao:extraChao.toFixed(1),extraPar:extraPar.toFixed(1),sqChao:sqChao.toFixed(1),sqPar:sqPar.toFixed(1),srChao:srChao.toFixed(1),srPar:srPar.toFixed(1)};
};
