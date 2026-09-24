// Motor de áreas do orçamento — chão, paredes, perímetro e volume da piscina.
// Saiu do App.jsx para poder ser testado sem React (ver __tests__/areas.test.mjs).
//
// Convenção das "buckets":
// - chao    = superfície HORIZONTAL (fundo). Vinil de fundo.
// - par     = superfície VERTICAL (paredes do contorno + degraus internos).
// - tot     = chao + par + spa. É o que puxa o metro de vinil no orçamento.
// Toda face vertical entra em `par`, mesmo quando é interna (degrau da prainha).
import { calcDesenho } from "./formas.js";
import { bancoCfg, ajusteBanco } from "./banco.js";
import { geometriaTriangular, geometriaComBanco } from "./triangular.js";
import { contornoOitavada, medidasCirculo, erroBancoRedondo } from "./formatos.js";

export const calcA=(pool,spa,wMode,walls,poolFmt,extras,spaType,desenho)=>{
  const pf2=v=>parseFloat(String(v??"").replace(",","."))||0;
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
  // ── MEDIDA QUE NAO FECHA ─────────────────────────────────────────────────
  // Circular e triangular escondem comprimento e largura da tela, mas o estado
  // do editor continua com eles (nasce 10,00 x 4,00). Quando o diametro falta
  // ou os lados nao fecham, a conta caia no retangulo la de baixo e cobrava
  // uma piscina que nao existe: circular sem diametro saia com 79,2 m², um
  // triangulo com banco grande demais com 68,0 m² (medido em 24/09). Agora
  // devolve zero e diz por que — o editor trava o salvar e o PDF em cima disso.
  const invalido=(motivo)=>({chao:"0.0",par:"0.0",sChao:"0.0",sPar:"0.0",tot:"0.0",vol:"0.0",perim:"0.0",chaoTot:"0.0",
    depthInfo:{avg:D,min:realDMin,max:realDMax,sloped:false},banco:null,invalido:motivo,
    extraChao:"0.0",extraPar:"0.0",sqChao:"0.0",sqPar:"0.0",srChao:"0.0",srPar:"0.0"});

  // ── CIRCULAR ─────────────────────────────────────────────────────────────
  // Area, perimetro e volume saem da CONTA EXATA (pi r2), nao do poligono que
  // o desenho usa: 48 gomos erram 0,29%, e numero de orcamento nao se aproxima
  // quando existe a formula.
  if(poolFmt==="Circular"){
    const bLarg=pool?.bancoOn?pf2(pool?.bancoLarg):0,bProf=pool?.bancoOn?pf2(pool?.bancoProf):0;
    // Banco que nao cabe (largo demais, ou assento no fundo): o medidasCirculo
    // descartava em silencio e cobrava a redonda sem banco. Agora e erro com
    // o motivo, igual ao triangulo.
    const erroB=erroBancoRedondo(pf2(pool?.diametro),bLarg,bProf,D);
    if(erroB)return invalido(erroB);
    const cir=medidasCirculo(pf2(pool?.diametro),{bancoLarg:bLarg,bancoProf:bProf,prof:D});
    if(cir){
      const chaoC=cir.fundo+cir.assento;
      const parC=cir.espelho+cir.costas+cir.parede;
      return{chao:chaoC.toFixed(1),par:parC.toFixed(1),sChao:"0.0",sPar:"0.0",
        tot:(chaoC+parC).toFixed(1),vol:cir.volume.toFixed(1),perim:cir.perimetro.toFixed(1),
        chaoTot:chaoC.toFixed(1),depthInfo:{avg:D,min:realDMin,max:realDMax,sloped:false},
        banco:null,circular:cir,extraChao:"0.0",extraPar:"0.0",sqChao:"0.0",sqPar:"0.0",srChao:"0.0",srPar:"0.0"};
    }
    return invalido("Falta o DIÂMETRO da piscina redonda");
  }

  // ── OITAVADA COM BANCO ───────────────────────────────────────────────────
  // Sem banco segue a conta antiga (retangulo menos os 4 cantos), para nao
  // mexer em orcamento que ja existe. Com banco, a mesma conta do triangular
  // sobre o contorno de 8 lados.
  if(poolFmt==="Oitavada"&&pool?.bancoOn){
    const cont=contornoOitavada(L,W,pf2(pool?.chanfro));
    const gO=cont?geometriaComBanco({contorno:cont,prof:D,banco:{larg:pf2(pool?.bancoLarg),prof:pf2(pool?.bancoProf)}}):null;
    if(gO&&!gO.erro&&gO.temBanco){
      const chaoO=gO.areas.fundo+gO.areas.assento;
      const parO=gO.areas.espelho+gO.areas.costas;
      return{chao:chaoO.toFixed(1),par:parO.toFixed(1),sChao:"0.0",sPar:"0.0",
        tot:(chaoO+parO).toFixed(1),vol:gO.volume.toFixed(1),perim:gO.perimetro.toFixed(1),
        chaoTot:chaoO.toFixed(1),depthInfo:{avg:D,min:realDMin,max:realDMax,sloped:false},
        banco:null,triangular:gO,extraChao:"0.0",extraPar:"0.0",sqChao:"0.0",sqPar:"0.0",srChao:"0.0",srPar:"0.0"};
    }
    // Banco que nao cabe: antes caia na conta da oitavada SEM banco, sem aviso
    // (e, com o assento no fundo, a planta ainda desenhava o banco — medido
    // em 24/09: 8 faixas).
    if(gO?.erro)return invalido(gO.erro);
  }

  // ── TRIANGULAR ───────────────────────────────────────────────────────────
  // Formato proprio: o motor mede o triangulo e, quando tem banco nos tres
  // lados, separa fundo / assento / espelho / costas. Nada aqui depende de
  // comprimento x largura, que num triangulo nao querem dizer nada.
  if(poolFmt==="Triangular"){
    const gT=geometriaTriangular({a:pf2(pool?.triA),b:pf2(pool?.triB),c:pf2(pool?.triC),prof:D,
      banco:pool?.bancoOn?{larg:pf2(pool?.bancoLarg),prof:pf2(pool?.bancoProf)}:null});
    if(gT&&!gT.erro){
      const chaoT=gT.areas.fundo+gT.areas.assento;
      const parT=gT.areas.espelho+gT.areas.costas+gT.areas.parede;
      const depthInfoT={avg:D,min:realDMin,max:realDMax,sloped:false};
      return{chao:chaoT.toFixed(1),par:parT.toFixed(1),sChao:"0.0",sPar:"0.0",
        tot:(chaoT+parT).toFixed(1),vol:gT.volume.toFixed(1),perim:gT.perimetro.toFixed(1),
        chaoTot:chaoT.toFixed(1),depthInfo:depthInfoT,banco:null,triangular:gT,
        extraChao:"0.0",extraPar:"0.0",sqChao:"0.0",sqPar:"0.0",srChao:"0.0",srPar:"0.0"};
    }
    if(gT?.erro)return invalido(gT.erro);
    const lados=[pool?.triA,pool?.triB,pool?.triC].map(pf2);
    return invalido(lados.every(v=>v>0)
      ?"Esses três lados não fecham um triângulo — confira a medida"
      :"Faltam os TRÊS LADOS do triângulo");
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
  // ── SPA EXTERNO (toggle) ────────────────────────────────────────────────
  // Dois modelos de obra, e a diferença entre eles é dinheiro de verdade:
  //   integrado = MESMO tanque. O spa é uma região com o fundo em outro nível,
  //     igual à prainha: no encontro NÃO existe parede, existe um DEGRAU
  //     (contato × |D − sD|). A face do spa que encosta não existe, e a parede
  //     da piscina naquele trecho também não.
  //   separado  = tanque próprio, parede de alvenaria entre os dois, revestida
  //     dos dois lados (D de um lado, sD do outro). É o que o sistema sempre
  //     fez, e continua sendo o padrão para orçamento salvo sem o campo — quem
  //     já mandou PDF para o cliente não pode ver o número mudar sozinho.
  // A MESMA piscina pelos dois caminhos: 6,00×2,70×1,40 + spa 2,70×1,50×0,50
  // dá 46,1 m² integrada (idêntico ao formato "Com prainha") e 48,8 separada —
  // os 2,7 m² de diferença são exatamente a parede divisória contada em dobro.
  // Na planta quem ENCOSTA é sempre spa.length; spa.width é o quanto o spa
  // avança para fora da piscina (ver PlantaView, bloco "spaExt").
  const sL=parseFloat(spa.length)||0,sW=parseFloat(spa.width)||0,sD=parseFloat(spa.depth)||0;
  const sInteg=!!spa.on&&spa.integrado===true;
  const sLado=(spa.side==="left"||spa.side==="right")?W:L; // parede em que ele encosta
  const sCont=spa.on?Math.min(sL,sLado||sL):0;             // trecho de contato
  const sChao=spa.on?sL*sW:0;
  // integrado: 3 faces livres (+ o que sobra da face colada, se o spa for mais
  // largo que a parede em que encosta). separado: as 4 faces.
  const sPar=spa.on?(sInteg?(sL*sD+2*sW*sD+(sL-sCont)*sD):(2*sL*sD+2*sW*sD)):0;
  // perímetro é borda: no integrado sai o trecho de contato e entra o contorno
  // do spa; no separado a divisória também leva borda, mas UMA vez só.
  const sPerim=spa.on?(sInteg?(2*sW+sL-sCont):(2*sW+sL)):0;
  // degrau interno entre os dois níveis — face vertical, entra em `par`
  if(sInteg)par=Math.max(0,par-sCont*D)+sCont*Math.abs(D-sD);
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
  // ── BANCO LATERAL ────────────────────────────────────────────────────────
  // Bloco de assento correndo a lateral inteira. Entra por ultimo, sobre o que
  // ja foi calculado, e so quando tem medida — sem os campos o resultado e
  // identico ao de antes (travado por teste, para nao mexer em orcamento
  // antigo). No desenho livre nao entra: ali o contorno e outro.
  const bco=dM?null:bancoCfg(pool,poolFmt,L,W,D);
  const ajB=ajusteBanco(bco,{D,prainhaProf:temPrainha?Math.min(praiP>0?praiP:D*0.25,Math.max(D-0.05,0.05)):0});
  chao+=ajB.chao;par+=ajB.parede;
  const srVol=st.redondo?(isRndSq?srC2*srL2*srP:Math.PI*srR*srR*srP):0;
  const vol=(dM?dM.vol:(temPrainha?praiVol:(isOval?(Math.PI*a*b):isOitavada?(L*W-4*(ch*ch/2)):L*W)*D))+(spa.on?sL*sW*sD:0)+(st.quadrado?sqC*sqL*sqP:0)+srVol+ajB.volume;
  const depthInfo={avg:D,min:realDMin,max:realDMax,sloped:dMin>0&&dMax>0&&dMin!==dMax};
  return{chao:chao.toFixed(1),par:par.toFixed(1),sChao:(sChao+fmtSpaChao).toFixed(1),sPar:(sPar+fmtSpaPar).toFixed(1),tot:(chao+par+sChao+sPar+fmtSpaChao+fmtSpaPar).toFixed(1),vol:vol.toFixed(1),perim:(perim+sPerim).toFixed(1),chaoTot:(chao+sChao+fmtSpaChao).toFixed(1),depthInfo,banco:bco,extraChao:extraChao.toFixed(1),extraPar:extraPar.toFixed(1),sqChao:sqChao.toFixed(1),sqPar:sqPar.toFixed(1),srChao:srChao.toFixed(1),srPar:srPar.toFixed(1)};
};
