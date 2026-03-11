import React, { useState, useEffect, useRef } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";

// Firebase config
const FB_CFG = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Firebase lazy loader — works on Vercel (npm), falls back to local on artifact
let fb = { ready: false, db: null, auth: null, storage: null };
let fbFns = {};
const initFB = async () => {
  if (fb.ready) return fb.ready;
  try {
    const app = await import("firebase/app");
    const fs = await import("firebase/firestore");
    const au = await import("firebase/auth");
    const st = await import("firebase/storage");
    const fbApp = app.initializeApp(FB_CFG);
    fb = { ready: true, db: fs.getFirestore(fbApp), auth: au.getAuth(fbApp), storage: st.getStorage(fbApp), GoogleProvider: au.GoogleAuthProvider };
    fbFns = { ...fs, ...au, ...st };
    return true;
  } catch (e) { console.log("Firebase não disponível, usando modo local"); return false; }
};

const VER="v4.5";
if(typeof document!=="undefined"&&!document.getElementById("vv-styles")){const s=document.createElement("style");s.id="vv-styles";s.textContent=`
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
@media(max-width:600px){
  .vv-g2{grid-template-columns:1fr!important}
  .vv-g3{grid-template-columns:1fr 1fr!important}
  .vv-g4{grid-template-columns:1fr 1fr!important}
  .vv-header-actions{flex-direction:column!important;gap:6px!important}
  .vv-tab-bar{gap:0!important}
  .vv-tab-bar button{padding:6px 7px!important;font-size:9px!important}
  .vv-card{padding:12px!important}
  .vv-pool-grid{grid-template-columns:1fr 1fr!important}
  .vv-cost-row{grid-template-columns:20px 1fr 40px 55px 36px 65px 20px!important;gap:2px!important}
}
@media(max-width:400px){
  .vv-tab-bar button span:last-child{display:none}
  .vv-tab-bar button{padding:8px 6px!important}
}
`;document.head.appendChild(s)}
const PIPE=[
  {id:"lead",label:"Lead",icon:"📊",color:"#f59e0b"},
  {id:"orcamento",label:"Orçamento",icon:"📄",color:"#3b82f6"},
  {id:"negociacao",label:"Negociação",icon:"🤝",color:"#8b5cf6"},
  {id:"fechou",label:"Fechou",icon:"✅",color:"#16a34a"},
  {id:"execucao",label:"Em Execução",icon:"🔨",color:"#f97316"},
  {id:"concluido",label:"Concluído",icon:"🏁",color:"#06b6d4"},
  {id:"perdido",label:"Perdido",icon:"❌",color:"#dc2626"},
];
const CO={name:"Vinil Vale Revestimentos e Capas para Piscinas Ltda",short:"Vinil Vale",addr:"Rodovia SP 139, KM 3, s/n, Jardim Hatori II, Registro-SP",cnpj:"42.749.688/0001-57",ie:"574.128.060.119",ph1:"(13) 99730-5949",ph2:"(13) 99678-1966",email:"vinilvale@hotmail.com",insta:"@vinilvaleoficial"};
const SVC=[{id:"construcao",label:"Construção de Piscina",icon:"🏗️"},{id:"revestimento",label:"Revestimento em Vinil",icon:"🎨"},{id:"reforma",label:"Reforma de Piscina",icon:"🔧"}];
const PFMT=["Retangular","Retangular irregular","Formato L","Oval","Feijão","Com prainha","Com Spa","Personalizado"];
const VOPTS=[{t:"0,7mm",w:3},{t:"0,8mm",w:4}];
const STAMPS=[{c:"Marmo Carrara",i:["Marmo Carrara Azul","Marmo Carrara Verde","Marmo Carrara Cinza"]},{c:"Travertino",i:["Travertino","Travertino Gris","Travertino Verde","Travertino Azul"]},{c:"Bali",i:["Bali Hijau","Bali Blue"]},{c:"Malibu",i:["Malibu Azul","Malibu Verde"]},{c:"Porto Vecchio",i:["Porto Vecchio Azul","Porto Vecchio Verde"]},{c:"Batu",i:["Batu Blue","Batu Vert"]},{c:"Sukabumi",i:["Sukabumi Azul","Sukabumi Verde"]},{c:"Petra Natural",i:["Petra Natural Azul","Petra Natural Verde"]},{c:"Montblanc",i:["Montblanc","Montblanc Block"]},{c:"Liso",i:["Mid Blue Liso"]},{c:"Aquática",i:["Aquática Azul"]},{c:"Santorini",i:["Santorini"]},{c:"Punta Cana",i:["Punta Cana"]}];
const ALLST=STAMPS.flatMap(s=>s.i);
const CAT=[
  {id:"m06",c:"Mantas",n:"Manta Acrílica 0,6mm",s:"R$4,65/m² (só chão)",p:4.65,un:"chao"},{id:"m04",c:"Mantas",n:"Manta Acrílica 0,4mm",s:"R$3,50/m² (só chão)",p:3.50,un:"chao"},{id:"eva",c:"Mantas",n:"Bobina EVA 0,30mm",s:"R$11,88/m² (só chão)",p:11.88,un:"chao"},
  {id:"pR",c:"Perfis",n:"Perfil Rígido",s:"R$379/60m = R$6,32/m",p:6.32,un:"ml"},{id:"pF",c:"Perfis",n:"Perfil Flangeamento",s:"R$119/3m = R$39,67/m",p:39.67,un:"ml"},
  {id:"ip20",c:"Filtros",n:"Filtro Império IP20",s:"1/3CV,28m³",p:890,un:"un"},{id:"ip30",c:"Filtros",n:"Filtro Império IP30",s:"1/3CV,28m³",p:920,un:"un"},{id:"ip40",c:"Filtros",n:"Filtro Império IP40",s:"1/2CV,44m³",p:990,un:"un"},{id:"ip50",c:"Filtros",n:"Filtro Império IP50",s:"3/4CV,68m³",p:1307,un:"un"},{id:"ip60",c:"Filtros",n:"Filtro Império IP60",s:"1.0CV,104m³",p:1586,un:"un"},
  {id:"f35",c:"Filtros",n:"Filtro Nautilus F350P",s:"1/3CV,29m³",p:1298.47,un:"un"},{id:"f45",c:"Filtros",n:"Filtro Nautilus F450P",s:"1/2CV,52m³",p:1388.07,un:"un"},{id:"f55",c:"Filtros",n:"Filtro Nautilus F550P",s:"3/4CV,76m³",p:1689.99,un:"un"},{id:"f65",c:"Filtros",n:"Filtro Nautilus F650P",s:"1.0CV,100m³",p:1990.41,un:"un"},{id:"v70",c:"Filtros",n:"Filtro Veico V70",s:"1.25CV,112m³",p:2298,un:"un"},
  {id:"asp",c:"Dispositivos",n:"Disp. Aspiração 2pol",s:"50/60mm",p:22.90,un:"un"},{id:"niv",c:"Dispositivos",n:"Disp. Nível 2pol",s:"50/60mm",p:22.90,un:"un"},{id:"ret",c:"Dispositivos",n:"Disp. Retorno 2pol",s:"6m³/h",p:22.90,un:"un"},{id:"hid",c:"Dispositivos",n:"Disp. Hidro 2pol",s:"3m³/h",p:39.90,un:"un"},
  {id:"nP",c:"Dispositivos",n:"Nicho LED Premium",s:"50/60mm",p:17.90,un:"un"},{id:"nS",c:"Dispositivos",n:"Nicho LED Summer's",s:"50/60mm",p:21.90,un:"un"},
  {id:"dS",c:"Dispositivos",n:"Dreno Fundo Sibrape",s:"Sucção",p:74.90,un:"un"},{id:"dF",c:"Dispositivos",n:"Dreno Fundo Fluidra",s:"Sucção",p:69.90,un:"un"},
  {id:"cx",c:"Dispositivos",n:"Cx Passagem Inox",s:"Proteção",p:19.90,un:"un"},{id:"cxR",c:"Dispositivos",n:"Cx Passagem Reg. Inox",s:"Ajustável",p:19.90,un:"un"},
  {id:"rI",c:"Iluminação",n:"Refletor Império RGB 9W",s:"12m²",p:59.99,un:"un"},{id:"rL",c:"Iluminação",n:"Refletor LuxPool 4W",s:"12m²",p:74.90,un:"un"},{id:"rS",c:"Iluminação",n:"Refletor Cristal 13W",s:"18m²",p:69.99,un:"un"},{id:"rB",c:"Iluminação",n:"Hiper LED 9W Brustec",s:"20m²",p:119,un:"un"},
  {id:"cL",c:"Iluminação",n:"Controladora LuxPool",s:"90W",p:199,un:"un"},{id:"cL2",c:"Iluminação",n:"Controladora LuxPool 2S",s:"90W, 2 aux",p:249,un:"un"},
  {id:"sk30",c:"Skimmers",n:"Skimmer Reto Boca Estreita 30cm",s:"Sibrape",p:194.90,un:"un"},{id:"sk38",c:"Skimmers",n:"Skimmer Reto Boca Estreita 38cm",s:"Sibrape",p:229.90,un:"un"},{id:"skVE",c:"Skimmers",n:"Skimmer Boca Estreita Veico",s:"Veico",p:249.90,un:"un"},{id:"skVL",c:"Skimmers",n:"Skimmer Reto Boca Larga Veico",s:"Veico",p:299.00,un:"un"},
  {id:"mca7",c:"Vinil 0,7mm",n:"Marmo Carrara Azul 0,7mm",s:"ACQUALINER",p:45,un:"m2"},{id:"mca8",c:"Vinil 0,8mm",n:"Marmo Carrara Azul 0,8mm",s:"ACQUALINER",p:55,un:"m2"},{id:"mcv7",c:"Vinil 0,7mm",n:"Marmo Carrara Verde 0,7mm",s:"ACQUALINER",p:45,un:"m2"},{id:"mcv8",c:"Vinil 0,8mm",n:"Marmo Carrara Verde 0,8mm",s:"ACQUALINER",p:55,un:"m2"},{id:"mcc7",c:"Vinil 0,7mm",n:"Marmo Carrara Cinza 0,7mm",s:"ACQUALINER",p:45,un:"m2"},{id:"mcc8",c:"Vinil 0,8mm",n:"Marmo Carrara Cinza 0,8mm",s:"ACQUALINER",p:55,un:"m2"},{id:"tr7",c:"Vinil 0,7mm",n:"Travertino 0,7mm",s:"ACQUALINER",p:45,un:"m2"},{id:"tr8",c:"Vinil 0,8mm",n:"Travertino 0,8mm",s:"ACQUALINER",p:55,un:"m2"},{id:"trg7",c:"Vinil 0,7mm",n:"Travertino Gris 0,7mm",s:"ACQUALINER",p:45,un:"m2"},{id:"trg8",c:"Vinil 0,8mm",n:"Travertino Gris 0,8mm",s:"ACQUALINER",p:55,un:"m2"},{id:"trv7",c:"Vinil 0,7mm",n:"Travertino Verde 0,7mm",s:"ACQUALINER",p:45,un:"m2"},{id:"trv8",c:"Vinil 0,8mm",n:"Travertino Verde 0,8mm",s:"ACQUALINER",p:55,un:"m2"},{id:"tra7",c:"Vinil 0,7mm",n:"Travertino Azul 0,7mm",s:"ACQUALINER",p:45,un:"m2"},{id:"tra8",c:"Vinil 0,8mm",n:"Travertino Azul 0,8mm",s:"ACQUALINER",p:55,un:"m2"},{id:"bh7",c:"Vinil 0,7mm",n:"Bali Hijau 0,7mm",s:"ACQUALINER",p:45,un:"m2"},{id:"bh8",c:"Vinil 0,8mm",n:"Bali Hijau 0,8mm",s:"ACQUALINER",p:55,un:"m2"},{id:"bb7",c:"Vinil 0,7mm",n:"Bali Blue 0,7mm",s:"ACQUALINER",p:45,un:"m2"},{id:"bb8",c:"Vinil 0,8mm",n:"Bali Blue 0,8mm",s:"ACQUALINER",p:55,un:"m2"},{id:"mla7",c:"Vinil 0,7mm",n:"Malibu Azul 0,7mm",s:"ACQUALINER",p:45,un:"m2"},{id:"mla8",c:"Vinil 0,8mm",n:"Malibu Azul 0,8mm",s:"ACQUALINER",p:55,un:"m2"},{id:"mlv7",c:"Vinil 0,7mm",n:"Malibu Verde 0,7mm",s:"ACQUALINER",p:45,un:"m2"},{id:"mlv8",c:"Vinil 0,8mm",n:"Malibu Verde 0,8mm",s:"ACQUALINER",p:55,un:"m2"},{id:"pva7",c:"Vinil 0,7mm",n:"Porto Vecchio Azul 0,7mm",s:"ACQUALINER",p:45,un:"m2"},{id:"pva8",c:"Vinil 0,8mm",n:"Porto Vecchio Azul 0,8mm",s:"ACQUALINER",p:55,un:"m2"},{id:"pvv7",c:"Vinil 0,7mm",n:"Porto Vecchio Verde 0,7mm",s:"ACQUALINER",p:45,un:"m2"},{id:"pvv8",c:"Vinil 0,8mm",n:"Porto Vecchio Verde 0,8mm",s:"ACQUALINER",p:55,un:"m2"},{id:"btb7",c:"Vinil 0,7mm",n:"Batu Blue 0,7mm",s:"ACQUALINER",p:45,un:"m2"},{id:"btb8",c:"Vinil 0,8mm",n:"Batu Blue 0,8mm",s:"ACQUALINER",p:55,un:"m2"},{id:"btv7",c:"Vinil 0,7mm",n:"Batu Vert 0,7mm",s:"ACQUALINER",p:45,un:"m2"},{id:"btv8",c:"Vinil 0,8mm",n:"Batu Vert 0,8mm",s:"ACQUALINER",p:55,un:"m2"},{id:"ska7",c:"Vinil 0,7mm",n:"Sukabumi Azul 0,7mm",s:"ACQUALINER",p:45,un:"m2"},{id:"ska8",c:"Vinil 0,8mm",n:"Sukabumi Azul 0,8mm",s:"ACQUALINER",p:55,un:"m2"},{id:"skv7",c:"Vinil 0,7mm",n:"Sukabumi Verde 0,7mm",s:"ACQUALINER",p:45,un:"m2"},{id:"skv8",c:"Vinil 0,8mm",n:"Sukabumi Verde 0,8mm",s:"ACQUALINER",p:55,un:"m2"},{id:"pna7",c:"Vinil 0,7mm",n:"Petra Natural Azul 0,7mm",s:"ACQUALINER",p:45,un:"m2"},{id:"pna8",c:"Vinil 0,8mm",n:"Petra Natural Azul 0,8mm",s:"ACQUALINER",p:55,un:"m2"},{id:"pnv7",c:"Vinil 0,7mm",n:"Petra Natural Verde 0,7mm",s:"ACQUALINER",p:45,un:"m2"},{id:"pnv8",c:"Vinil 0,8mm",n:"Petra Natural Verde 0,8mm",s:"ACQUALINER",p:55,un:"m2"},{id:"mb7",c:"Vinil 0,7mm",n:"Montblanc 0,7mm",s:"ACQUALINER",p:45,un:"m2"},{id:"mb8",c:"Vinil 0,8mm",n:"Montblanc 0,8mm",s:"ACQUALINER",p:55,un:"m2"},{id:"mbb7",c:"Vinil 0,7mm",n:"Montblanc Block 0,7mm",s:"ACQUALINER",p:45,un:"m2"},{id:"mbb8",c:"Vinil 0,8mm",n:"Montblanc Block 0,8mm",s:"ACQUALINER",p:55,un:"m2"},{id:"mbl7",c:"Vinil 0,7mm",n:"Mid Blue Liso 0,7mm",s:"ACQUALINER",p:45,un:"m2"},{id:"mbl8",c:"Vinil 0,8mm",n:"Mid Blue Liso 0,8mm",s:"ACQUALINER",p:55,un:"m2"},{id:"aqa7",c:"Vinil 0,7mm",n:"Aquatica Azul 0,7mm",s:"ACQUALINER",p:45,un:"m2"},{id:"aqa8",c:"Vinil 0,8mm",n:"Aquatica Azul 0,8mm",s:"ACQUALINER",p:55,un:"m2"},{id:"san7",c:"Vinil 0,7mm",n:"Santorini 0,7mm",s:"ACQUALINER",p:45,un:"m2"},{id:"san8",c:"Vinil 0,8mm",n:"Santorini 0,8mm",s:"ACQUALINER",p:55,un:"m2"},{id:"pc7",c:"Vinil 0,7mm",n:"Punta Cana 0,7mm",s:"ACQUALINER",p:45,un:"m2"},{id:"pc8",c:"Vinil 0,8mm",n:"Punta Cana 0,8mm",s:"ACQUALINER",p:55,un:"m2"},{id:"sold",c:"Acessorios Vinil",n:"Solda Vinil (cola)",s:"Frasco 500ml",p:35,un:"un"},{id:"cantn",c:"Acessorios Vinil",n:"Cantoneira PVC",s:"Barra 3m",p:18,un:"un"},{id:"tubo50",c:"Hidraulica",n:"Tubo PVC 50mm",s:"Barra 6m",p:32,un:"un"},{id:"tubo60",c:"Hidraulica",n:"Tubo PVC 60mm",s:"Barra 6m",p:45,un:"un"},{id:"cola",c:"Hidraulica",n:"Cola PVC",s:"Frasco 175g",p:12,un:"un"},{id:"veda",c:"Hidraulica",n:"Veda Rosca",s:"Rolo 18mm",p:5,un:"un"},{id:"areia",c:"Filtros",n:"Areia p/ Filtro",s:"Saco 25kg",p:35,un:"un"},{id:"bomba",c:"Equipamentos",n:"Motobomba 1/3CV",s:"Dancor/Weg",p:450,un:"un"},
  {id:"lona14",c:"Lona Aquatica",n:"Lona Aquatica 14 Azul",s:"1,40m larg.",p:14.83,un:"m2"},{id:"lona10",c:"Lona Aquatica",n:"Lona Aquatica 10 Azul",s:"1,00m larg.",p:12,un:"m2"},
];
// un: "m²" = custo por m² (usa área total), "ml" = custo por metro linear (usa perímetro), "un" = custo unitário

const SYSTEMS=["dreno","aspiracao","skimmer","retorno","hidro"];
const PlantaView=({pool,spa,disps,customPos,setCustomPos,dragging,setDragging,dark,poolFmt,ar,autoPositions,blue,t,tubeOffsets={},setTubeOffsets=()=>{},invertSide=false})=>{
    // const SYSTEMS=["retorno","hidro","aspiracao","dreno","skimmer","nivelador"];
  const L=parseFloat(pool.length)||6,W=parseFloat(pool.width)||3,D=parseFloat(pool.depth)||1.4;
  const svgW=340,svgH=200,pad=30;
  const scale=Math.min((svgW-pad*2-50)/L,(svgH-pad*2)/W);
  const pw=L*scale,ph=W*scale,ox=pad,oy=pad;
  const cmW=pw*0.1,cmH=ph*0.5;
  const casaP=customPos["casa"]||(invertSide?{x:-0.15,y:0.5}:{x:1.12,y:0.5});
  const cmX=ox+casaP.x*pw,cmY=oy+casaP.y*ph-cmH/2;
  const hasSpa2=spa?.on,sL=parseFloat(spa?.length||2)*scale,sW=parseFloat(spa?.width||2)*scale;
  const positions={...autoPositions(L,W,disps,invertSide),...customPos};
  const tubeColors={retorno:"#ef4444",aspiracao:"#ec4899",dreno:"#8b5cf6",skimmer:"#f59e0b",refletor:"#f97316",nivelador:"#06b6d4",hidro:"#14b8a6"};
  const onDown=(key,e)=>{e.preventDefault();setDragging(key)};
  const onMove=(e)=>{if(!dragging)return;const svg=e.currentTarget;const r=svg.getBoundingClientRect();const mx=(e.clientX||e.touches?.[0]?.clientX||0)-r.left;const my=(e.clientY||e.touches?.[0]?.clientY||0)-r.top;const rx=(mx-ox)/pw,ry=(my-oy)/ph;if(dragging==="casa"){setCustomPos(p=>({...p,casa:{x:Math.max(0.3,Math.min(1.8,rx)),y:Math.max(-0.3,Math.min(1.3,ry)),label:"CM",type:"casa",special:true}}))}else{setCustomPos(p=>({...p,[dragging]:{...positions[dragging],x:Math.max(0,Math.min(1,rx)),y:Math.max(0,Math.min(1,ry))}}))}};
  const onUp=()=>setDragging(null);
  const dist=L*0.1;
  const retQ=disps.retorno||0,aspQ=disps.aspiracao||0,drQ=disps.dreno||0,skQ=disps.skimmer||0,nivQ=disps.nivelador||0,hidQ=disps.hidro||0;
  const retT=retQ>0?retQ*(D+0.5)+dist+(retQ>1?(retQ-1)*W*(1/(retQ+1)):0):0;
  const aspT=aspQ>0?aspQ*(L*0.5+D+0.5)+dist:0;
  const drT=drQ>0?drQ*(D+0.3)+dist+(drQ>1?L*0.4:0):0;
  const skT=skQ>0?skQ*(D+0.5)+dist:0;
  const nivT=nivQ>0?nivQ*1.5+dist:0;
  const hidT=hidQ>0?hidQ*(D+0.5)+dist+(hidQ>1?(hidQ-1)*L*(1/(hidQ+1)):0):0;
  const totalT=Math.ceil(retT+aspT+drT+skT+nivT+hidT);
  const barras=Math.floor(totalT/6)+1;
  const curvas=retQ*2+aspQ*3+drQ*2+skQ*2+nivQ+hidQ*2+(retQ>1?(retQ-1)*2:0)+(drQ>1?(drQ-1)*2:0)+(hidQ>1?(hidQ-1)*2:0);
  const joelhos=Math.ceil(curvas*0.15);
  const dMin=parseFloat(pool.depthMin)||D,dMax=parseFloat(pool.depthMax)||D;
  const sloped=parseFloat(pool.depthMin)>0&&parseFloat(pool.depthMax)>0&&pool.depthMin!==pool.depthMax;
  const cutH=80,cutScale=Math.min((svgW-50)/L,(cutH-25)/Math.max(D,dMax));
  const cpw2=L*cutScale,cph2=D*cutScale,cox2=30,coy2=12;
  const hMin2=dMin*cutScale,hMax2=dMax*cutScale;
  return <div>
    <div style={{fontSize:"9px",fontWeight:"600",color:t.textMuted,marginBottom:"4px"}}>Planta Baixa</div>
    <svg width={svgW} height={svgH} style={{background:dark?"#0f172a":"#f8fafc",borderRadius:"6px",border:"1px solid "+(dark?"#334155":"#e2e8f0"),cursor:dragging?"grabbing":"default",touchAction:"none"}} onMouseMove={onMove} onMouseUp={onUp} onMouseLeave={onUp} onTouchMove={e=>{onMove({currentTarget:e.currentTarget,clientX:e.touches[0].clientX,clientY:e.touches[0].clientY})}} onTouchEnd={onUp}>
      <defs><pattern id="grd" width="10" height="10" patternUnits="userSpaceOnUse"><path d="M 10 0 L 0 0 0 10" fill="none" stroke={dark?"#1e293b":"#e2e8f0"} strokeWidth="0.3"/></pattern></defs>
      <rect width={svgW} height={svgH} fill="url(#grd)"/>
      {poolFmt==="Formato L"?<polygon points={ox+","+oy+" "+(ox+pw)+","+oy+" "+(ox+pw)+","+(oy+ph*0.6)+" "+(ox+pw*0.6)+","+(oy+ph*0.6)+" "+(ox+pw*0.6)+","+(oy+ph)+" "+ox+","+(oy+ph)} fill={dark?"#1e3a5f":"#dbeafe"} stroke="#2563eb" strokeWidth="2"/>:poolFmt==="Oval"||poolFmt==="Feijao"?<ellipse cx={ox+pw/2} cy={oy+ph/2} rx={pw/2} ry={ph/2} fill={dark?"#1e3a5f":"#dbeafe"} stroke="#2563eb" strokeWidth="2"/>:<rect x={ox} y={oy} width={pw} height={ph} rx="1" fill={dark?"#1e3a5f":"#dbeafe"} stroke="#2563eb" strokeWidth="2"/>}
      {poolFmt==="Com prainha"&&<rect x={ox} y={oy} width={pw*0.25} height={ph} rx="1" fill={dark?"#1e4d7a":"#bfdbfe"} stroke="#2563eb" strokeWidth="0.5"/>}
      {hasSpa2&&<rect x={ox+pw-sL} y={oy-sW+2} width={sL} height={sW} rx="3" fill={dark?"#1e3a5f":"#93c5fd"} stroke="#3b82f6" strokeWidth="1.5" strokeDasharray="4,2"/>}
      {hasSpa2&&<text x={ox+pw-sL/2} y={oy-sW/2+5} textAnchor="middle" fontSize="7" fill="#1d4ed8" fontWeight="700">SPA</text>}
      <text x={ox+pw/2} y={oy+ph/2-3} textAnchor="middle" fontSize="8" fill={dark?"#94a3b8":"#64748b"} fontWeight="600">PISCINA</text>
      <text x={ox+pw/2} y={oy+ph/2+7} textAnchor="middle" fontSize="7" fill={dark?"#94a3b8":"#64748b"}>A= {ar.total}m2</text>
      <text x={ox+pw/2} y={oy-10} textAnchor="middle" fontSize="7" fontWeight="600" fill="#64748b">{L}m</text>
      <text x={ox+pw+16} y={oy+ph/2+3} textAnchor="middle" fontSize="7" fontWeight="600" fill="#64748b">{W}m</text>
      <rect x={cmX} y={cmY} width={cmW+8} height={cmH} rx="2" fill={dark?"#1e293b":"#f1f5f9"} stroke="#475569" strokeWidth="1.5" style={{cursor:"grab"}} onMouseDown={e=>{e.preventDefault();setDragging("casa")}} onTouchStart={e=>{e.preventDefault();setDragging("casa")}}/>
      <text x={cmX+(cmW+8)/2} y={cmY+cmH/2} textAnchor="middle" fontSize="5" fontWeight="700" fill="#475569">CM</text>
      {(() => {
        const pipes=[];
        const systems=SYSTEMS;
        const cmMid=cmY+cmH/2;
        let sysIdx=0;
        const sysData={};
        const totalSys=systems.filter(s=>Object.entries(positions).some(([k,p])=>p.type===s&&!p.special&&autoPositions(L,W,disps,invertSide)[k])).length;
        systems.forEach(sysType=>{
          const devs=Object.entries(positions).filter(([k,p])=>p.type===sysType&&!p.special&&autoPositions(L,W,disps,invertSide)[k]);
          if(devs.length===0)return;
          const col=tubeColors[sysType]||"#999";
          const arriveY=cmY+8+sysIdx*((cmH-16)/Math.max(totalSys-1,1));
          const lane=3+sysIdx*2;
          sysData[sysType]={devs,col,arriveY,lane,curvas:0,tes:0,tuboM:0};
          const sd=sysData[sysType];
          sysIdx++;
          const isLeft=invertSide?(sysType==="dreno"||sysType==="skimmer"):(sysType==="retorno"||sysType==="hidro");
          const sorted=[...devs].sort((a,b)=>(oy+a[1].y*ph)-(oy+b[1].y*ph));
          if(sysType==="dreno"){
            const eX=invertSide?ox-3-sysIdx*3:ox+pw+4+sysIdx*3;
            if(devs.length>1){
              sorted.forEach(([k,p2],di)=>{
                const cx2=ox+p2.x*pw,cy2=oy+p2.y*ph;
                pipes.push(<line key={"h_"+k} x1={cx2} y1={cy2} x2={eX} y2={cy2} stroke={col} strokeWidth="2" strokeLinecap="round" opacity="0.6"/>);
                sd.tuboM+=Math.abs(cx2-eX)/scale;
                if(di<sorted.length-1){const ny=oy+sorted[di+1][1].y*ph;pipes.push(<line key={"v_"+k} x1={eX} y1={cy2} x2={eX} y2={ny} stroke={col} strokeWidth="2.5" strokeLinecap="round" opacity="0.7"/>);sd.tes+=1;sd.tuboM+=Math.abs(ny-cy2)/scale;}
              });
              const midY=oy+(sorted[0][1].y*ph+sorted[sorted.length-1][1].y*ph)/2;
              sd.curvas+=2;sd.tuboM+=(Math.abs(arriveY-midY)+Math.abs(cmX-eX))/scale;
              pipes.push(<path key={"hEnd_drn"} d={"M"+eX+","+midY+" L"+eX+","+arriveY+" L"+cmX+","+arriveY} fill="none" stroke={col} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.7"/>);
            }else{
              const cx2=ox+devs[0][1].x*pw,cy2=oy+devs[0][1].y*ph;
              pipes.push(<path key={"tb_drn"} d={"M"+cx2+","+cy2+" L"+(ox+pw+4+sysIdx*3)+","+cy2+" L"+(ox+pw+4+sysIdx*3)+","+arriveY+" L"+cmX+","+arriveY} fill="none" stroke={col} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.65"/>);
              sd.curvas+=2;sd.tuboM+=(Math.abs(cx2-(ox+pw+4+sysIdx*3))+Math.abs(arriveY-cy2)+Math.abs(cmX-(ox+pw+4+sysIdx*3)))/scale;
            }
          }else if(isLeft&&devs.length>1){
            const eX=ox-lane;
            sorted.forEach(([k,p2],di)=>{
              const cx2=ox+p2.x*pw,cy2=oy+p2.y*ph;
              pipes.push(<line key={"h_"+k} x1={cx2} y1={cy2} x2={eX} y2={cy2} stroke={col} strokeWidth="2" strokeLinecap="round" opacity="0.6"/>);
              sd.tuboM+=Math.abs(cx2-eX)/scale;
              if(di<sorted.length-1){const ny=oy+sorted[di+1][1].y*ph;pipes.push(<line key={"v_"+k} x1={eX} y1={cy2} x2={eX} y2={ny} stroke={col} strokeWidth="2.5" strokeLinecap="round" opacity="0.7"/>);sd.tes+=1;sd.tuboM+=Math.abs(ny-cy2)/scale;}else{sd.curvas+=1;}
            });
            const lastCy=oy+sorted[sorted.length-1][1].y*ph;
            const belowY=oy+ph+6+lane;const rightX=ox+pw+4+sysIdx*3;
            sd.curvas+=3;sd.tuboM+=(Math.abs(belowY-lastCy)+Math.abs(rightX-eX)+Math.abs(arriveY-belowY)+Math.abs(cmX-rightX))/scale;
            pipes.push(<path key={"m_"+sysType} d={"M"+eX+","+lastCy+" L"+eX+","+belowY+" L"+rightX+","+belowY+" L"+rightX+","+arriveY+" L"+cmX+","+arriveY} fill="none" stroke={col} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.7"/>);
          }else{
            sorted.forEach(([k,p2])=>{
              const cx2=ox+p2.x*pw,cy2=oy+p2.y*ph;
              const eX2=p2.x<0.3?ox-lane:ox+pw+4+sysIdx*3;
              if(eX2<ox){
                const bY=oy+ph+8+lane;const rX=ox+pw+4+sysIdx*3;
                pipes.push(<path key={"tb_"+k} d={"M"+cx2+","+cy2+" L"+eX2+","+cy2+" L"+eX2+","+bY+" L"+rX+","+bY+" L"+rX+","+arriveY+" L"+cmX+","+arriveY} fill="none" stroke={col} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.65"/>);
                sd.curvas+=4;sd.tuboM+=(Math.abs(cx2-eX2)+Math.abs(bY-cy2)+Math.abs(rX-eX2)+Math.abs(arriveY-bY)+Math.abs(cmX-rX))/scale;
              }else if(p2.y>0.7||p2.floor){
                pipes.push(<path key={"tb_"+k} d={"M"+cx2+","+cy2+" L"+cx2+","+(oy+ph+4)+" L"+eX2+","+(oy+ph+4)+" L"+eX2+","+arriveY+" L"+cmX+","+arriveY} fill="none" stroke={col} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.65"/>);
                sd.curvas+=3;sd.tuboM+=(Math.abs(oy+ph+4-cy2)+Math.abs(eX2-cx2)+Math.abs(arriveY-(oy+ph+4))+Math.abs(cmX-eX2))/scale;
              }else{
                pipes.push(<path key={"tb_"+k} d={"M"+cx2+","+cy2+" L"+eX2+","+cy2+" L"+eX2+","+arriveY+" L"+cmX+","+arriveY} fill="none" stroke={col} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.65"/>);
                sd.curvas+=2;sd.tuboM+=(Math.abs(cx2-eX2)+Math.abs(arriveY-cy2)+Math.abs(cmX-eX2))/scale;
              }
            });
          }
          const lblX=(isLeft?ox-lane:ox+pw+4+sysIdx*3);const lblMX=(lblX+cmX)/2;
          
          pipes.push(<rect key={"cm_"+sysType} x={cmX-1} y={arriveY-3} width="6" height="6" rx="1" fill={col} opacity="0.9"/>);
        });
        window._sysData=sysData;
        return pipes;
      })()}
      {Object.entries(positions).filter(([k,p])=>!p.special&&autoPositions(L,W,disps,invertSide)[k]).map(([key,p])=>{const cx2=ox+p.x*pw,cy2=oy+p.y*ph,col=tubeColors[p.type]||"#666";return <g key={key} onMouseDown={e=>onDown(key,e)} onTouchStart={e=>{e.preventDefault();setDragging(key)}} style={{cursor:"grab"}}>{p.floor?<><circle cx={cx2} cy={cy2} r="6" fill="none" stroke={col} strokeWidth="1.5"/><line x1={cx2-3} y1={cy2-3} x2={cx2+3} y2={cy2+3} stroke={col} strokeWidth="1"/><line x1={cx2+3} y1={cy2-3} x2={cx2-3} y2={cy2+3} stroke={col} strokeWidth="1"/></>:p.type==="skimmer"?<rect x={cx2-3} y={cy2-6} width="6" height="12" rx="1" fill="none" stroke={col} strokeWidth="1.5"/>:(p.type==="retorno"||p.type==="hidro")?<rect x={cx2-3} y={cy2-5} width="6" height="10" rx="5" fill={col} opacity="0.3" stroke={col} strokeWidth="1.5"/>:p.type==="aspiracao"?<rect x={cx2-5} y={cy2-3} width="10" height="6" rx="5" fill={col} opacity="0.3" stroke={col} strokeWidth="1.5"/>:<circle cx={cx2} cy={cy2} r="5" fill={col} opacity="0.3" stroke={col} strokeWidth="1.5"/>}<text x={cx2} y={cy2+(p.floor?12:p.type==="skimmer"?10:12)} textAnchor="middle" fontSize="5" fontWeight="700" fill={col}>{p.label}</text></g>})}
    </svg>
    <div style={{display:"flex",gap:"6px",marginTop:"6px",flexWrap:"wrap"}}>
      {[["R","Retorno","#ef4444"],["A","Asp.","#ec4899"],["D","Dreno","#8b5cf6"],["SK","Skim.","#f59e0b"],["L","LED","#f97316"],["N","Niv.","#06b6d4"],["H","Hidro","#14b8a6"],["CM","Casa M.","#475569"]].map(([s,lb,c])=><div key={s} style={{display:"flex",alignItems:"center",gap:"2px"}}><div style={{width:"8px",height:"3px",borderRadius:"1px",background:c}}/><span style={{fontSize:"6px",color:t.textMuted}}>{lb}</span></div>)}
      <button onClick={()=>{setCustomPos({});setTubeOffsets({})}} style={{fontSize:"6px",padding:"1px 4px",borderRadius:"3px",border:"1px solid "+(dark?"#334155":"#e2e8f0"),background:"transparent",color:t.textMuted,cursor:"pointer",marginLeft:"auto"}}>Reset</button>
    </div>
    <div style={{fontSize:"9px",fontWeight:"600",color:t.textMuted,marginTop:"10px",marginBottom:"4px"}}>Corte Lateral</div>
    <svg width={svgW} height={cutH} style={{background:dark?"#0f172a":"#f8fafc",borderRadius:"6px",border:"1px solid "+(dark?"#334155":"#e2e8f0")}}>
      <polygon points={sloped?(cox2+","+coy2+" "+(cox2+cpw2)+","+coy2+" "+(cox2+cpw2)+","+(coy2+hMax2)+" "+cox2+","+(coy2+hMin2)):(cox2+","+coy2+" "+(cox2+cpw2)+","+coy2+" "+(cox2+cpw2)+","+(coy2+cph2)+" "+cox2+","+(coy2+cph2))} fill={dark?"#1e3a5f":"#dbeafe"} stroke="#2563eb" strokeWidth="2"/>
      <line x1={cox2+2} y1={coy2+3} x2={cox2+cpw2-2} y2={coy2+3} stroke="#0ea5e9" strokeWidth="0.6" strokeDasharray="4,2"/>
      <text x={cox2+cpw2/2} y={coy2+13} textAnchor="middle" fontSize="6" fill="#0ea5e9">N.A.</text>
      <text x={cox2+cpw2/2} y={(sloped?Math.max(coy2+hMax2,coy2+hMin2):coy2+cph2)+14} textAnchor="middle" fontSize="7" fontWeight="600" fill="#64748b">{L}m</text>
      <text x={cox2-14} y={coy2+(sloped?hMin2:cph2)/2+3} textAnchor="middle" fontSize="7" fontWeight="600" fill="#64748b">{sloped?dMin:D}m</text>
      {sloped&&<text x={cox2+cpw2+16} y={coy2+hMax2/2+3} textAnchor="middle" fontSize="7" fontWeight="600" fill="#64748b">{dMax}m</text>}
    </svg>
    <div style={{marginTop:"8px",background:dark?"#1e293b":"#fff",borderRadius:"6px",padding:"8px",border:"1px solid "+(dark?"#334155":"#e2e8f0")}}>
      <div style={{fontSize:"9px",fontWeight:"700",color:blue,marginBottom:"6px"}}>MATERIAL HIDRAULICO - PVC 50mm</div>
      {SYSTEMS.filter(s=>window._sysData?.[s]).map(sysType=>{const sd=window._sysData[sysType];const col=tubeColors[sysType];const barras=Math.ceil(sd.tuboM/6);return <div key={"mat_"+sysType} style={{marginBottom:"6px",padding:"4px 6px",background:dark?"#0f172a":"#f8fafc",borderRadius:"4px",borderLeft:"3px solid "+col}}>
        <div style={{fontSize:"8px",fontWeight:"700",color:col,marginBottom:"2px"}}>{sysType.charAt(0).toUpperCase()+sysType.slice(1)} ({sd.devs.length}x)</div>
        <div style={{display:"flex",gap:"8px",fontSize:"8px",color:t.text}}>
          <span>Tubo: <b>{sd.tuboM.toFixed(1)}m</b> ({barras} barras)</span>
          <span>Curva Longa: <b>{sd.curvas}</b></span>
          {sd.tes>0&&<span>Te: <b>{sd.tes}</b></span>}
        </div>
      </div>})}
      <div style={{borderTop:"1px solid "+(dark?"#334155":"#e2e8f0"),marginTop:"4px",paddingTop:"4px",fontSize:"8px",color:t.text}}>
        {(()=>{const all=Object.values(window._sysData||{});const tT=all.reduce((s,d)=>s+d.tuboM,0);const tC=all.reduce((s,d)=>s+d.curvas,0);const tTe=all.reduce((s,d)=>s+d.tes,0);return <><b>TOTAL: </b>Tubo: <b>{tT.toFixed(1)}m</b> ({Math.ceil(tT/6)} barras) | Curva Longa: <b>{tC}</b> | Te: <b>{tTe}</b></>})()}
      </div>
    </div>
    <div style={{display:"flex",gap:"8px",marginTop:"6px",flexWrap:"wrap",fontSize:"7px",color:t.textMuted}}>
      <span>Area: {ar.total}m2</span><span>Chao: {ar.chao}m2</span><span>Paredes: {ar.paredes}m2</span><span>Perim: {ar.perim}m</span><span>Vol: {ar.vol}m3</span>
    </div>
  </div>;
};

// ═══ ISOMETRIC VIEW ═══
const IsometricView=React.forwardRef(({pool,spa,disps,dark,t,poolFmt,clientName,autoPositions,customPos={},invertSide=false},ref)=>{
  const L=parseFloat(pool.length)||6,W=parseFloat(pool.width)||3,D=parseFloat(pool.depth)||1.4;
  const svgW=640,svgH=440,cos30=Math.cos(Math.PI/6),sin30=0.5;
  const mX=28,mYt=54,mYb=90;
  const totalX=L+2.9;
  const s=Math.min((svgW-2*mX)/((totalX+W)*cos30),(svgH-mYt-mYb)/(D+(totalX+W)*sin30));
  const ox=mX+W*cos30*s,oy=mYt+D*s;
  const iso=(x,y,z)=>({x:ox+(x-y)*cos30*s,y:oy+(x+y)*sin30*s-z*s});
  const pt=(x,y,z)=>{const p=iso(x,y,z);return`${p.x.toFixed(1)},${p.y.toFixed(1)}`};
  const pts=arr=>arr.map(([x,y,z])=>pt(x,y,z)).join(' ');
  const pth=arr=>arr.map(([x,y,z],i)=>{const p=iso(x,y,z);return(i?'L':'M')+`${p.x.toFixed(1)} ${p.y.toFixed(1)}`}).join(' ');
  const retQ=disps.retorno||0,aspQ=disps.aspiracao||0,drQ=disps.dreno||0;
  const skQ=disps.skimmer||0,ledQ=disps.refletor||0,nivQ=disps.nivelador||0,hidQ=disps.hidro||0;
  const C={retorno:"#3b82f6",aspiracao:"#ec4899",dreno:"#8b5cf6",skimmer:"#f97316",refletor:"#eab308",nivelador:"#06b6d4",hidro:"#10b981"};
  const dk=dark;const els=[];
  // Background
  els.push(<rect key="bg" x="0" y="0" width={svgW} height={svgH} fill={dk?"#0f172a":"#f8fafc"}/>);
  // Pool floor
  els.push(<polygon key="fl" points={pts([[0,0,0],[L,0,0],[L,W,0],[0,W,0]])} fill={dk?"#1e3a5f":"#bfdbfe"} opacity="0.7"/>);
  // Far walls (drawn first - behind)
  els.push(<polygon key="wL" points={pts([[0,0,0],[0,W,0],[0,W,D],[0,0,D]])} fill={dk?"#1a3060":"#7dd3fc"} opacity="0.25"/>);
  els.push(<polygon key="wB" points={pts([[0,W,0],[L,W,0],[L,W,D],[0,W,D]])} fill={dk?"#1a3060":"#7dd3fc"} opacity="0.25"/>);
  // Water surface
  const wZ=D*0.91;
  els.push(<polygon key="wtr" points={pts([[0,0,wZ],[L,0,wZ],[L,W,wZ],[0,W,wZ]])} fill={dk?"#1d4ed8":"#3b82f6"} opacity="0.22" stroke={dk?"#3b82f6":"#2563eb"} strokeWidth="0.5"/>);
  [0.25,0.5,0.75].forEach((f,i)=>els.push(<line key={`sh${i}`} x1={iso(L*0.1,W*f,wZ).x} y1={iso(L*0.1,W*f,wZ).y} x2={iso(L*0.9,W*f,wZ).x} y2={iso(L*0.9,W*f,wZ).y} stroke="#93c5fd" strokeWidth="0.5" opacity="0.45" strokeDasharray="5,4"/>));
  // Near walls (drawn after water)
  els.push(<polygon key="wF" points={pts([[0,0,0],[L,0,0],[L,0,D],[0,0,D]])} fill={dk?"#1e4080":"#93c5fd"} stroke="#2563eb" strokeWidth="1"/>);
  els.push(<polygon key="wR" points={pts([[L,0,0],[L,W,0],[L,W,D],[L,0,D]])} fill={dk?"#1a3570":"#7dd3fc"} stroke="#2563eb" strokeWidth="1"/>);
  // Pool rim
  els.push(<polygon key="rim" points={pts([[0,0,D],[L,0,D],[L,W,D],[0,W,D]])} fill="none" stroke="#2563eb" strokeWidth="2.5"/>);
  [[0,0],[L,0],[L,W],[0,W]].forEach(([x,y],i)=>{const a=iso(x,y,0),b=iso(x,y,D);els.push(<line key={`cv${i}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#2563eb" strokeWidth="1" opacity="0.35"/>);});
  // Pool labels
  const pm=iso(L/2,W/2,wZ*0.5);els.push(<text key="plbl" x={pm.x} y={pm.y} textAnchor="middle" fontSize="9" fontWeight="700" fill={dk?"#93c5fd":"#1d4ed8"} opacity="0.85">PISCINA</text>);
  const pd=iso(L/2,W/2,wZ*0.2);els.push(<text key="pdim" x={pd.x} y={pd.y} textAnchor="middle" fontSize="7" fill={dk?"#60a5fa":"#3b82f6"} opacity="0.8">{L}×{W}m · {D}m prof.</text>);
  // Dimension lines
  const dA=iso(-0.15,-0.4,D),dB=iso(L+0.15,-0.4,D);
  els.push(<line key="dL" x1={dA.x} y1={dA.y} x2={dB.x} y2={dB.y} stroke="#64748b" strokeWidth="0.8" strokeDasharray="3,2"/>);
  const dM=iso(L/2,-0.4,D);els.push(<text key="dLt" x={dM.x} y={dM.y-4} textAnchor="middle" fontSize="8" fontWeight="700" fill="#64748b">{L}m</text>);
  const dC=iso(L+0.4,0,D),dDp=iso(L+0.4,W,D);
  els.push(<line key="dW" x1={dC.x} y1={dC.y} x2={dDp.x} y2={dDp.y} stroke="#64748b" strokeWidth="0.8" strokeDasharray="3,2"/>);
  const dWm=iso(L+0.4,W/2,D);els.push(<text key="dWt" x={dWm.x+6} y={dWm.y+3} textAnchor="start" fontSize="8" fontWeight="700" fill="#64748b">{W}m</text>);
  const depA=iso(L,0,0),depB=iso(L,0,D);
  els.push(<line key="dD" x1={depA.x+7} y1={depA.y} x2={depB.x+7} y2={depB.y} stroke="#64748b" strokeWidth="0.8" strokeDasharray="3,2"/>);
  const depM=iso(L,0,D/2);els.push(<text key="dDt" x={depM.x+11} y={depM.y+3} textAnchor="start" fontSize="8" fontWeight="700" fill="#64748b">{D}m</text>);
  // Device & pipe helpers
  const dev=(key,x,y,z,lbl,col,isFloor)=>{
    const p=iso(x,y,z);const out=[];
    if(isFloor){
      out.push(<circle key={`${key}c`} cx={p.x} cy={p.y} r="5" fill={col} opacity="0.25" stroke={col} strokeWidth="1.5"/>);
      out.push(<line key={`${key}h`} x1={p.x-3.5} y1={p.y} x2={p.x+3.5} y2={p.y} stroke={col} strokeWidth="1.5"/>);
      out.push(<line key={`${key}v`} x1={p.x} y1={p.y-3.5} x2={p.x} y2={p.y+3.5} stroke={col} strokeWidth="1.5"/>);
    }else{out.push(<circle key={`${key}c`} cx={p.x} cy={p.y} r="5" fill={col} opacity="0.25" stroke={col} strokeWidth="1.5"/>);}
    out.push(<text key={`${key}t`} x={p.x} y={p.y+13} textAnchor="middle" fontSize="7" fontWeight="800" fill={col}>{lbl}</text>);
    return out;
  };
  const pip=(key,arr,col,sw=2.5,dash=false)=><path key={key} d={pth(arr)} fill="none" stroke={col} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={dash?"6,3":undefined} opacity="0.85"/>;
  const lo=0.32;
  // Z height per device type
  const typeZ=(type,isFloor)=>{
    if(isFloor)return 0;
    if(type==='skimmer')return D;
    if(type==='nivelador')return D*0.88;
    if(type==='refletor')return D*0.62;
    if(type==='aspiracao')return D*0.5;
    return D*0.55;
  };
  // CM position (same as 2D autoPositions default)
  const casaFrac=customPos?.casa||(invertSide?{x:-0.15,y:0.5}:{x:1.12,y:0.5});
  const cmX0=casaFrac.x*L,cmBY0=W*0.1,cmWw=Math.min(1.4,W*0.5),cmWd=W*0.8,cmBoxH=0.45;
  // Lane offsets per system to avoid overlapping pipes
  const sysOrder=['retorno','hidro','dreno','aspiracao','skimmer','nivelador','refletor'];
  // CM entry y per system
  const cmEntryY=(sysType,idx)=>cmBY0+cmWd*(0.1+idx*0.12);
  // Get actual device positions from autoPositions (same as 2D PlantaView)
  const allPos=autoPositions?{...autoPositions(L,W,disps,invertSide),...(customPos||{})}:{};
  const activeDevs=Object.entries(allPos).filter(([k,p])=>!p.special&&autoPositions&&autoPositions(L,W,disps,invertSide)[k]);
  // Group by system type
  const byType={};
  activeDevs.forEach(([key,p])=>{if(!byType[p.type])byType[p.type]=[];byType[p.type].push([key,p]);});
  // Draw each system
  sysOrder.forEach((sysType,sysIdx)=>{
    const devs=byType[sysType];if(!devs||devs.length===0)return;
    const col=C[sysType]||'#999';
    const laneOff=lo+sysIdx*0.16; // unique lane per system
    const cmEY=cmEntryY(sysType,sysIdx);
    const exitPts=[];
    devs.forEach(([key,p])=>{
      const ix=p.x*L,iy=p.y*W,iz=typeZ(sysType,p.floor);
      els.push(...dev(key,ix,iy,iz,p.label,col,p.floor));
      // Route pipe from device to a ground-level exit point
      let route;
      if(p.floor){
        // Floor device → go along floor to right wall, then up
        route=[[ix,iy,0],[L,iy,0],[L+laneOff,iy,0],[L+laneOff,iy,D]];
        exitPts.push([L+laneOff,iy,D]);
      } else if(p.x<0.12){
        // Left short wall (retorno, hidro)
        route=[[0,iy,iz],[-laneOff,iy,iz],[-laneOff,iy,D]];
        exitPts.push([-laneOff,iy,D]);
      } else if(p.x>0.88){
        // Right short wall (skimmer, nivelador)
        route=[[L,iy,iz],[L+laneOff,iy,iz],[L+laneOff,iy,D]];
        exitPts.push([L+laneOff,iy,D]);
      } else if(p.y<0.08){
        // Front long wall (refletor front)
        route=[[ix,0,iz],[ix,-laneOff,iz],[ix,-laneOff,D]];
        exitPts.push([ix,-laneOff,D]);
      } else if(p.y>0.88){
        // Back long wall (aspiracao y=0.95, refletor back)
        route=[[ix,W,iz],[ix,W+laneOff,iz],[ix,W+laneOff,D]];
        exitPts.push([ix,W+laneOff,D]);
      } else {
        route=[[ix,iy,iz],[L,iy,iz],[L+laneOff,iy,iz],[L+laneOff,iy,D]];
        exitPts.push([L+laneOff,iy,D]);
      }
      els.push(pip(`${key}-pipe`,route,col));
    });
    // Collector pipe: connect all exits → to CM
    if(exitPts.length===0)return;
    // Determine routing strategy based on exit type
    const isLeftExit=exitPts[0][0]<0;
    const isFrontExit=exitPts[0][1]<0;
    const isBackExit=exitPts[0][1]>W;
    if(isLeftExit){
      // Left exits: collect along x=-laneOff, route below pool (y=W+laneOff), then to CM
      if(exitPts.length>1){const ys=exitPts.map(p=>p[1]).sort((a,b)=>a-b);els.push(pip(`${sysType}-col`,[[-laneOff,ys[0],D],[-laneOff,ys[ys.length-1],D]],col,3));}
      const midY=exitPts.reduce((s,p)=>s+p[1],0)/exitPts.length;
      els.push(pip(`${sysType}-tocm`,[[-laneOff,midY,D],[-laneOff,W+laneOff,D],[cmX0,W+laneOff,D],[cmX0,cmEY,D]],col,3));
    } else if(isFrontExit){
      // Front exits: collect along y=-laneOff, route right to CM
      if(exitPts.length>1){const xs=exitPts.map(p=>p[0]).sort((a,b)=>a-b);els.push(pip(`${sysType}-col`,[[xs[0],-laneOff,D],[xs[xs.length-1],-laneOff,D]],col,3));}
      const midX=exitPts.reduce((s,p)=>s+p[0],0)/exitPts.length;
      els.push(pip(`${sysType}-tocm`,[[midX,-laneOff,D],[cmX0,-laneOff,D],[cmX0,cmEY,D]],col,3));
    } else if(isBackExit){
      // Back exits: collect along y=W+laneOff, route right to CM
      if(exitPts.length>1){const xs=exitPts.map(p=>p[0]).sort((a,b)=>a-b);els.push(pip(`${sysType}-col`,[[xs[0],W+laneOff,D],[xs[xs.length-1],W+laneOff,D]],col,3));}
      const midX=exitPts.reduce((s,p)=>s+p[0],0)/exitPts.length;
      els.push(pip(`${sysType}-tocm`,[[midX,W+laneOff,D],[cmX0,W+laneOff,D],[cmX0,cmEY,D]],col,3));
    } else {
      // Right-side exits: collect along x=L+laneOff, then to CM
      if(exitPts.length>1){const ys=exitPts.map(p=>p[1]).sort((a,b)=>a-b);els.push(pip(`${sysType}-col`,[[L+laneOff,ys[0],D],[L+laneOff,ys[ys.length-1],D]],col,3));}
      const midY=exitPts.reduce((s,p)=>s+p[1],0)/exitPts.length;
      els.push(pip(`${sysType}-tocm`,[[L+laneOff,midY,D],[cmX0,midY,D],[cmX0,cmEY,D]],col,3));
    }
    // Diameter label mid-route
    if(exitPts.length>0){const ep=exitPts[0];const mp=iso(ep[0]+(cmX0-ep[0])*0.4,ep[1],D);els.push(<text key={`${sysType}-diam`} x={mp.x} y={mp.y-5} textAnchor="middle" fontSize="6" fontWeight="700" fill={col} opacity="0.9">Ø50</text>);}
  });
  // CASA DE MÁQUINAS
  els.push(<polygon key="cmt" points={pts([[cmX0,cmBY0,D],[cmX0+cmWw,cmBY0,D],[cmX0+cmWw,cmBY0+cmWd,D],[cmX0,cmBY0+cmWd,D]])} fill={dk?"#334155":"#e2e8f0"} stroke="#475569" strokeWidth="1.5"/>);
  els.push(<polygon key="cmf" points={pts([[cmX0,cmBY0,D-cmBoxH],[cmX0+cmWw,cmBY0,D-cmBoxH],[cmX0+cmWw,cmBY0,D],[cmX0,cmBY0,D]])} fill={dk?"#1e293b":"#f1f5f9"} stroke="#475569" strokeWidth="1.5"/>);
  els.push(<polygon key="cmr" points={pts([[cmX0+cmWw,cmBY0,D-cmBoxH],[cmX0+cmWw,cmBY0+cmWd,D-cmBoxH],[cmX0+cmWw,cmBY0+cmWd,D],[cmX0+cmWw,cmBY0,D]])} fill={dk?"#334155":"#cbd5e1"} stroke="#475569" strokeWidth="1.5"/>);
  const cmCtr=iso(cmX0+cmWw/2,cmBY0+cmWd/2,D+0.08);
  els.push(<text key="cmlbl" x={cmCtr.x} y={cmCtr.y} textAnchor="middle" fontSize="7" fontWeight="800" fill="#475569">CASA DE</text>);
  els.push(<text key="cmlbl2" x={cmCtr.x} y={cmCtr.y+9} textAnchor="middle" fontSize="7" fontWeight="800" fill="#475569">MÁQUINAS</text>);
  const fp=iso(cmX0+0.22,cmBY0+cmWd*0.25,D+0.06);
  els.push(<ellipse key="filt" cx={fp.x} cy={fp.y} rx="8" ry="4.5" fill={dk?"#064e3b":"#86efac"} stroke="#15803d" strokeWidth="1.5"/>);
  els.push(<text key="ftlbl" x={fp.x} y={fp.y+13} textAnchor="middle" fontSize="6" fontWeight="700" fill="#15803d">Filtro</text>);
  const pp=iso(cmX0+0.22,cmBY0+cmWd*0.72,D+0.06);
  els.push(<circle key="pump" cx={pp.x} cy={pp.y} r="7" fill={dk?"#1e3a5f":"#dbeafe"} stroke="#2563eb" strokeWidth="1.5"/>);
  els.push(<line key="pumpL" x1={pp.x-4} y1={pp.y} x2={pp.x+4} y2={pp.y} stroke="#2563eb" strokeWidth="1.5"/>);
  els.push(<line key="pumpV" x1={pp.x} y1={pp.y-4} x2={pp.x} y2={pp.y+4} stroke="#2563eb" strokeWidth="1.5"/>);
  els.push(<text key="pumplbl" x={pp.x} y={pp.y+16} textAnchor="middle" fontSize="6" fontWeight="700" fill="#2563eb">Bomba</text>);
  // Title
  els.push(<text key="ttl" x={svgW/2} y={22} textAnchor="middle" fontSize="14" fontWeight="800" fill={dk?"#e2e8f0":"#0a1f44"}>IMPLANTAÇÃO HIDRÁULICA</text>);
  if(clientName)els.push(<text key="cli" x={svgW/2} y={37} textAnchor="middle" fontSize="9" fill={dk?"#94a3b8":"#64748b"}>Cliente: {clientName}</text>);
  els.push(<text key="co" x={svgW-10} y={svgH-5} textAnchor="end" fontSize="7" fill={dk?"#475569":"#94a3b8"}>{CO.short} · {CO.ph1}</text>);
  // Legend
  const lgSys=[[retQ,'Retorno',C.retorno],[aspQ,'Aspiração',C.aspiracao],[drQ,'Dreno Fundo',C.dreno],[skQ,'Skimmer',C.skimmer],[ledQ,'Refletor LED',C.refletor],[nivQ,'Nivelador',C.nivelador],[hidQ,'Hidrojet',C.hidro]].filter(x=>x[0]>0);
  const lx=12,ly=svgH-mYb+4;
  els.push(<rect key="lgbg" x={lx-4} y={ly-14} width={205} height={lgSys.length*13+20} rx="4" fill={dk?"#1e293b":"#fff"} stroke={dk?"#334155":"#e2e8f0"} strokeWidth="1" opacity="0.92"/>);
  els.push(<text key="lgtit" x={lx+98} y={ly} textAnchor="middle" fontSize="8" fontWeight="800" fill={dk?"#e2e8f0":"#0a1f44"}>LEGENDA HIDRÁULICA</text>);
  lgSys.forEach(([qty,lbl,col],i)=>{const lyi=ly+12+i*13;els.push(<line key={`lg${i}`} x1={lx} y1={lyi} x2={lx+18} y2={lyi} stroke={col} strokeWidth="3" strokeLinecap="round"/>);els.push(<text key={`lgt${i}`} x={lx+23} y={lyi+4} fontSize="8" fill={dk?"#e2e8f0":"#334155"} fontWeight="600">{lbl} ({qty}x) — Ø50mm</text>);});
  // Scale bar
  const sb1=iso(0,W+0.4,D),sb2=iso(1,W+0.4,D);
  els.push(<line key="sb" x1={sb1.x} y1={sb1.y} x2={sb2.x} y2={sb2.y} stroke="#64748b" strokeWidth="2" strokeLinecap="round"/>);
  els.push(<line key="sb1" x1={sb1.x} y1={sb1.y-3} x2={sb1.x} y2={sb1.y+3} stroke="#64748b" strokeWidth="1.5"/>);
  els.push(<line key="sb2" x1={sb2.x} y1={sb2.y-3} x2={sb2.x} y2={sb2.y+3} stroke="#64748b" strokeWidth="1.5"/>);
  els.push(<text key="sbt" x={(sb1.x+sb2.x)/2} y={sb1.y+12} textAnchor="middle" fontSize="7" fill="#64748b">1m</text>);
  return <svg ref={ref} width={svgW} height={svgH} viewBox={`0 0 ${svgW} ${svgH}`} style={{maxWidth:"100%",height:"auto",display:"block",borderRadius:"8px",border:`1px solid ${dk?"#334155":"#e2e8f0"}`}}>{els}</svg>;
});

const mkItems=(tipo)=>{
  if(tipo==="revestimento")return[
    {id:1,n:"Vinil ACQUALINER",q:1,c:0,m:0,nt:"Resistência até 32°C · Estampa à escolha",on:true,un:"m²"},
    {id:2,n:"Manta Acrílica 0,6mm",q:1,c:4.65,m:40,nt:"só chão",on:true,un:"chao"},
    {id:3,n:"Perfil Rígido",q:1,c:6.32,m:40,nt:"R$379/60m",on:true,un:"ml"},
    {id:15,n:"Kit Flangeamento",q:1,c:39.67,m:40,nt:"Perfil p/ dispositivos",on:true,un:"un"},
    {id:14,n:"Mão de obra completa",q:1,c:0,m:0,nt:"Revestimento vinílico",on:true,un:"un"},
  ];
  if(tipo==="reforma")return[
    {id:1,n:"Vinil ACQUALINER",q:1,c:0,m:0,nt:"Resistência até 32°C · Estampa à escolha",on:true,un:"m²"},
    {id:2,n:"Manta Acrílica 0,6mm",q:1,c:4.65,m:40,nt:"só chão",on:true,un:"chao"},
    {id:3,n:"Perfil Rígido",q:1,c:6.32,m:40,nt:"R$379/60m",on:true,un:"ml"},
    {id:15,n:"Kit Flangeamento",q:1,c:39.67,m:40,nt:"Perfil p/ dispositivos",on:true,un:"un"},
    {id:4,n:"Filtro Império IP60",q:1,c:1586,m:35,nt:"1.0CV",on:true,un:"un"},
    {id:5,n:"Dreno Fundo",q:2,c:74.90,m:40,nt:"Sibrape",on:true,un:"un"},
    {id:6,n:"Disp. Retorno 2pol",q:2,c:22.90,m:40,nt:"",on:true,un:"un"},
    {id:7,n:"Disp. Aspiração 2pol",q:1,c:22.90,m:40,nt:"",on:true,un:"un"},
    {id:14,n:"Mão de obra completa",q:1,c:0,m:0,nt:"Reforma completa",on:true,un:"un"},
  ];
  // construcao (default)
  return[
    {id:1,n:"Vinil ACQUALINER",q:1,c:0,m:0,nt:"Resistência até 32°C · Estampa à escolha",on:true,un:"m²"},
    {id:2,n:"Manta Acrílica 0,6mm",q:1,c:4.65,m:40,nt:"só chão",on:true,un:"chao"},
    {id:3,n:"Perfil Rígido",q:1,c:6.32,m:40,nt:"R$379/60m",on:true,un:"ml"},
    {id:15,n:"Kit Flangeamento",q:1,c:39.67,m:40,nt:"Perfil p/ dispositivos",on:true,un:"un"},
    {id:4,n:"Filtro Império IP60",q:1,c:1586,m:35,nt:"1.0CV",on:true,un:"un"},
    {id:5,n:"Dreno Fundo",q:2,c:74.90,m:40,nt:"Sibrape",on:true,un:"un"},
    {id:6,n:"Disp. Retorno 2pol",q:2,c:22.90,m:40,nt:"",on:true,un:"un"},
    {id:7,n:"Disp. Aspiração 2pol",q:1,c:22.90,m:40,nt:"",on:true,un:"un"},
    {id:8,n:"Skimmer Reto 30cm",q:1,c:194.90,m:40,nt:"Sibrape",on:true,un:"un"},
    {id:9,n:"Refletor Império RGB",q:4,c:59.99,m:40,nt:"",on:true,un:"un"},
    {id:10,n:"Nicho LED",q:4,c:17.90,m:40,nt:"",on:true,un:"un"},
    {id:11,n:"Controladora LuxPool",q:1,c:199,m:35,nt:"",on:true,un:"un"},
    {id:12,n:"Kit aspiração completo",q:1,c:0,m:0,nt:"",on:true,un:"un"},
    {id:13,n:"Projeto 3D",q:1,c:0,m:0,nt:"",on:true,un:"un"},
    {id:16,n:"Mão de obra pedreiro",q:1,c:0,m:0,nt:"Alvenaria da piscina",on:true,un:"un"},
    {id:17,n:"Escavação com máquina",q:1,c:0,m:0,nt:"Retroescavadeira",on:true,un:"un"},
    {id:14,n:"Mão de obra completa",q:1,c:0,m:0,nt:"Início ao acabamento",on:true,un:"un"},
  ];
};
const mkCI=(tipo)=>{
  if(tipo==="revestimento")return["Água para enchimento / Caminhão pipa"];
  if(tipo==="reforma")return["Materiais de alvenaria e hidráulico","Água para enchimento / Caminhão pipa","Remoção de entulho"];
  return["Materiais de alvenaria e hidráulico","Pedra de borda de acabamento","Água para enchimento","Remoção de entulho"];
};
const mkG=t=>{if(t==="revestimento")return[{id:2,it:"Mão de obra/Soldas",y:3,on:true},{id:3,it:"Vinil (fabricação)",y:3,on:true}];if(t==="reforma")return[{id:2,it:"Mão de obra/Soldas",y:3,on:true},{id:3,it:"Vinil (fabricação)",y:3,on:true},{id:4,it:"Kit Filtrante",y:1,on:true}];return[{id:1,it:"Alvenaria",y:5,on:true},{id:2,it:"Mão de obra/Soldas",y:3,on:true},{id:3,it:"Vinil (fabricação)",y:3,on:true},{id:4,it:"Kit Filtrante",y:1,on:true}]};
const IPAY={pixD:5,entPct:50,balPct:50,noFee:5,wFee:12,btcD:15};
const fmt=v=>new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(v);

// ═══ AREA CALCULATION ═══
const calcA=(pool,spa,wMode,walls)=>{
  const L=parseFloat(pool.length)||0,W=parseFloat(pool.width)||0;
  const dMin=parseFloat(pool.depthMin)||0,dMax=parseFloat(pool.depthMax)||0;
  const D=(dMin>0&&dMax>0)?(dMin+dMax)/2:parseFloat(pool.depth)||0;
  const realDMin=(dMin>0)?dMin:D,realDMax=(dMax>0)?dMax:D;
  const chao=L*W;
  let par=wMode==="irregular"&&walls.length>0?walls.reduce((s,w)=>s+(parseFloat(w.l)||0)*(parseFloat(w.h)||D),0):(L*realDMin+L*realDMax+2*W*D);
  // Perimeter: sum of wall lengths (for perfil)
  let perim=wMode==="irregular"&&walls.length>0?walls.reduce((s,w)=>s+(parseFloat(w.l)||0),0):(2*L+2*W);
  const sL=parseFloat(spa.length)||0,sW=parseFloat(spa.width)||0,sD=parseFloat(spa.depth)||0;
  const sChao=spa.on?sL*sW:0,sPar=spa.on?(2*sL*sD+2*sW*sD):0;
  const sPerim=spa.on?(2*sL+2*sW):0;
  const vol=L*W*D+(spa.on?sL*sW*sD:0);
  const depthInfo={avg:D,min:realDMin,max:realDMax,sloped:dMin>0&&dMax>0&&dMin!==dMax};
  return{chao:chao.toFixed(1),par:par.toFixed(1),sChao:sChao.toFixed(1),sPar:sPar.toFixed(1),tot:(chao+par+sChao+sPar).toFixed(1),vol:vol.toFixed(1),perim:(perim+sPerim).toFixed(1),chaoTot:(chao+sChao).toFixed(1),depthInfo};
};

// ═══ CRM CONSTANTS ═══
const TAGS_OPTS=["Interessado","Aguardando","Sem resposta","Retornar","Urgente","Visita agendada"];
const TIPO_ICONS={
  whatsapp:{icon:"📱",color:"#25d366",label:"WhatsApp"},
  ligacao:{icon:"📞",color:"#3b82f6",label:"Ligação"},
  visita:{icon:"🏠",color:"#8b5cf6",label:"Visita"},
  email:{icon:"📧",color:"#f59e0b",label:"Email"},
  nota:{icon:"📝",color:"#64748b",label:"Nota"},
  orcamento:{icon:"📄",color:"#0055a4",label:"Orçamento"},
};

// ═══ COMPONENTS ═══
const navy="#0a1f44",blue="#0055a4",gold="#e8b100",goldL="#fdf3d1",lBg="#f4f7fc";

// ═══ THEME ═══
const themes={
  light:{bg:"#f1f5f9",card:"#fff",cardBorder:"#e2e8f0",text:"#1e293b",textSec:"#64748b",textMuted:"#94a3b8",inputBg:"#fff",inputBorder:"#e2e8f0",lBg:"#f4f7fc",tabBg:"#fff",tabActive:"rgba(0,85,164,.07)",sectionBg:"#f8fafc",stampBg:"#edf2ff",stampBorder:"#c7d2fe",areaBg:"linear-gradient(135deg,#edf2ff,#f0f4ff)",costRed:"#fef2f2",costGreen:"#f0fdf4",costBlue:"#eff6ff",shadow:"0 1px 3px rgba(0,0,0,.05)"},
  dark:{bg:"#0f172a",card:"#1e293b",cardBorder:"#334155",text:"#e2e8f0",textSec:"#94a3b8",textMuted:"#64748b",inputBg:"#0f172a",inputBorder:"#475569",lBg:"#1e293b",tabBg:"#1e293b",tabActive:"rgba(0,85,164,.25)",sectionBg:"#1e293b",stampBg:"#1e3a5f",stampBorder:"#2563eb",areaBg:"linear-gradient(135deg,#1e293b,#0f172a)",costRed:"#2d1b1b",costGreen:"#1b2d1b",costBlue:"#1b1b2d",shadow:"0 1px 3px rgba(0,0,0,.3)"}
};

const Tab=({a,onClick,children,icon,badge,t:th})=>{const t=th||themes.light;return <button onClick={onClick} style={{padding:"8px 12px",border:"none",borderBottom:a?"3px solid "+blue:"3px solid transparent",background:a?t.tabActive:"transparent",color:a?blue:t.textSec,fontWeight:a?"700":"500",fontSize:"11px",cursor:"pointer",display:"flex",alignItems:"center",gap:"4px",borderRadius:"6px 6px 0 0",whiteSpace:"nowrap"}}><span style={{fontSize:"13px"}}>{icon}</span>{children}{badge>0&&<span style={{background:"#dc2626",color:"#fff",borderRadius:"9px",padding:"0 4px",fontSize:"8px",fontWeight:"800",lineHeight:"15px",minWidth:"15px",textAlign:"center",marginLeft:"1px"}}>{badge}</span>}</button>};
const Inp=({label,value,onChange,placeholder,style:sx,t:th,error})=>{const t=th||themes.light;return <div style={{display:"flex",flexDirection:"column",gap:"2px",...sx}}>{label&&<label style={{fontSize:"9px",fontWeight:"600",color:error?"#dc2626":t.textSec,textTransform:"uppercase",letterSpacing:".4px"}}>{label}{error&&<span style={{marginLeft:"4px",fontWeight:"700"}}>⚠</span>}</label>}<input value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} style={{padding:"8px 10px",border:`1.5px solid ${error?"#dc2626":t.inputBorder}`,borderRadius:"6px",fontSize:"12px",color:t.text,background:error?"#fef2f2":t.inputBg,outline:"none",width:"100%"}} onFocus={e=>e.target.style.borderColor=error?"#dc2626":blue} onBlur={e=>e.target.style.borderColor=error?"#dc2626":t.inputBorder}/>{error&&<span style={{fontSize:"8px",color:"#dc2626",fontWeight:"600"}}>{error}</span>}</div>};
const Sel=({label,value,onChange,options,style:sx,t:th})=>{const t=th||themes.light;return <div style={{display:"flex",flexDirection:"column",gap:"2px",...sx}}>{label&&<label style={{fontSize:"9px",fontWeight:"600",color:t.textSec,textTransform:"uppercase",letterSpacing:".4px"}}>{label}</label>}<select value={value} onChange={e=>onChange(e.target.value)} style={{padding:"8px 10px",border:`1.5px solid ${t.inputBorder}`,borderRadius:"6px",fontSize:"12px",color:t.text,background:t.inputBg}}>{options.map(o=><option key={typeof o==="string"?o:o.value} value={typeof o==="string"?o:o.value}>{typeof o==="string"?o:o.label}</option>)}</select></div>};
const Card=({children,t:th})=>{const t=th||themes.light;return <div style={{background:t.card,borderRadius:"10px",padding:"20px",boxShadow:t.shadow,border:`1px solid ${t.cardBorder}`}}>{children}</div>};
const ST=({icon,children})=><h3 style={{fontSize:"14px",fontWeight:"700",color:blue,marginBottom:"14px",display:"flex",alignItems:"center",gap:"6px"}}><span>{icon}</span>{children}</h3>;
const Btn=({children,onClick,style:sx})=><button onClick={onClick} style={{padding:"6px 12px",background:"#f1f5f9",color:"#475569",border:"1.5px solid #e2e8f0",borderRadius:"6px",fontWeight:"600",fontSize:"11px",cursor:"pointer",display:"flex",alignItems:"center",gap:"4px",...sx}}>{children}</button>;
const DarkToggle=({dark,onToggle})=><button onClick={onToggle} style={{width:"38px",height:"22px",borderRadius:"11px",border:"none",background:dark?"#475569":"#cbd5e1",cursor:"pointer",position:"relative",transition:"background .3s"}}><div style={{width:"18px",height:"18px",borderRadius:"50%",background:dark?"#0f172a":"#fff",position:"absolute",top:"2px",left:dark?"18px":"2px",transition:"left .3s",boxShadow:"0 1px 3px rgba(0,0,0,.3)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"10px"}}>{dark?"🌙":"☀️"}</div></button>;

// ═══ PDF PREVIEW ═══
const QP=({d,onBack,onSave})=>{
  const inc=(d.items||[]).filter(i=>i.on);
  const pool=d.pool||{length:"0",width:"0",depth:"0"};
  const spa=d.spa||{on:false,length:"0",width:"0",depth:"0"};
  const pay=d.pay||{pixD:5,entPct:50,balPct:50,noFee:5,wFee:12,btcD:15};
  const ar=calcA(pool,spa,d.wMode||"regular",d.walls||[]);
  const effQ=(i)=>{
    if(i.un==="m²")return parseFloat(ar.tot)||0;
    if(i.un==="chao")return parseFloat(ar.chaoTot)||0;
    if(i.un==="ml")return parseFloat(ar.perim)||0;
    return i.q||0;
  };
  const total=parseFloat(d.totOv)||inc.reduce((s,i)=>s+effQ(i)*(i.c||0)*(1+(i.m||0)/100),0)+(parseFloat(d.mo)||0);
  const today=new Date().toLocaleDateString("pt-BR",{day:"2-digit",month:"long",year:"numeric"});
  const pix=total*(1-(pay.pixD||0)/100),btc=total*(1-(pay.btcD||0)/100);
  const ent=total*(pay.entPct||50)/100,bal=total*(pay.balPct||50)/100,inst=total/(pay.noFee||1);

  const [pdfStatus,setPdfStatus]=useState("");

  const getHTML=()=>{
    const el=document.getElementById("pq");if(!el)return null;
    return`<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Orcamento VinilVale - ${d.client.name||"Cliente"}</title><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;background:#fff;display:flex;justify-content:center;-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;color-adjust:exact!important}@page{size:A4;margin:6mm 8mm}#pq{box-shadow:none!important;border-radius:0!important;max-width:780px!important;margin:0 auto}</style></head><body>${el.outerHTML}<script>window.onload=function(){setTimeout(function(){window.print()},800)}<\/script></body></html>`;
  };

  const gerarPDF=async()=>{
    setPdfStatus("Gerando...");
    try{
      const html=getHTML();if(!html){setPdfStatus("Erro");return}
      const clientName=(d.client.name||"Cliente").replace(/\s+/g,"_").replace(/[^\w\-]/g,"");
      const blob=new Blob([html],{type:"text/html;charset=utf-8"});
      const fileName=`Orcamento_VinilVale_${clientName}.html`;

      // Detectar mobile
      const isMobile=/Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

      // Mobile: tentar Web Share API
      if(isMobile&&navigator.canShare){
        try{
          const file=new File([blob],fileName,{type:"text/html"});
          if(navigator.canShare({files:[file]})){
            await navigator.share({files:[file],title:"Orçamento Vinil Vale",text:`Orçamento - ${d.client.name||"Cliente"}`});
            setPdfStatus("✅ Compartilhado!");
            if(onSave)onSave();
            setTimeout(()=>setPdfStatus(""),3000);
            return;
          }
        }catch{}
      }

      // Desktop e fallback: download direto
      const url=URL.createObjectURL(blob);
      const a=document.createElement("a");
      a.href=url;a.download=fileName;a.style.display="none";
      document.body.appendChild(a);a.click();
      setTimeout(()=>{document.body.removeChild(a);URL.revokeObjectURL(url)},1000);
      setPdfStatus("✅ Baixado! Abra e salve como PDF");
      if(onSave)onSave();
      setTimeout(()=>setPdfStatus(""),5000);
    }catch(e){
      try{
        const html=getHTML();
        const w=window.open("","_blank");
        if(w){w.document.write(html);w.document.close();setPdfStatus("✅ Aberto! Use Ctrl+P");}
        else{setPdfStatus("❌ Popup bloqueado");}
        setTimeout(()=>setPdfStatus(""),5000);
      }catch{setPdfStatus("❌ Erro: "+String(e));setTimeout(()=>setPdfStatus(""),5000)}
    }
  };

  const Sec=({title,children})=><div style={{marginBottom:"14px"}}><div style={{display:"flex",alignItems:"center",gap:"6px",marginBottom:"8px"}}><div style={{width:"3px",height:"14px",background:gold,borderRadius:"2px"}}/><div style={{fontSize:"11px",fontWeight:"700",color:navy,textTransform:"uppercase",letterSpacing:".5px"}}>{title}</div></div>{children}</div>;

  return(
    <div style={{fontFamily:"'Segoe UI',sans-serif",maxWidth:"900px",margin:"0 auto",padding:"20px",background:"#eef1f6",minHeight:"100vh"}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:"12px",flexWrap:"wrap",gap:"8px"}}>
        <Btn onClick={onBack}>← Voltar</Btn>
        <div style={{display:"flex",gap:"6px",alignItems:"center"}}>
          {pdfStatus&&<span style={{fontSize:"11px",fontWeight:"600",color:pdfStatus.includes("Erro")?"#ef4444":"#16a34a",background:pdfStatus.includes("Erro")?"#fef2f2":"#f0fdf4",padding:"4px 10px",borderRadius:"6px"}}>{pdfStatus}</span>}
          <Btn onClick={gerarPDF} style={{background:`linear-gradient(135deg,#16a34a,#15803d)`,color:"#fff",border:"none",padding:"10px 24px",fontSize:"13px",fontWeight:"700",boxShadow:"0 2px 8px rgba(22,163,74,.3)"}}>📥 Baixar PDF</Btn>
        </div>
      </div>
      <div style={{textAlign:"center",fontSize:"9.5px",color:"#64748b",marginBottom:"10px",background:"#fff",padding:"8px 14px",borderRadius:"8px",border:"1px solid #e2e8f0"}}>💡 <b>Celular:</b> toca em "Baixar PDF" → compartilha ou salva → abre no navegador → salva como PDF</div>

      <div id="pq" style={{fontFamily:"'Helvetica Neue',Helvetica,Arial,sans-serif",color:"#1a1a2e",fontSize:"10px",lineHeight:"1.5",maxWidth:"780px",margin:"0 auto",background:"#fff",borderRadius:"8px",boxShadow:"0 4px 20px rgba(0,0,0,.1)",overflow:"hidden"}}>
        {/* Header */}
        <div style={{background:`linear-gradient(135deg,${navy},${blue})`,padding:"18px 28px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div style={{display:"flex",alignItems:"center",gap:"10px"}}><div style={{width:"40px",height:"40px",borderRadius:"50%",background:gold,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"18px",fontWeight:"800",color:navy}}>V</div><div><div style={{fontSize:"20px",fontWeight:"800",color:"#fff"}}>VINIL VALE</div><div style={{fontSize:"7.5px",color:"rgba(255,255,255,.7)",letterSpacing:"1.5px",textTransform:"uppercase"}}>Revestimentos e Capas para Piscinas</div></div></div>
          <div style={{background:"rgba(255,255,255,.12)",border:"1px solid rgba(255,255,255,.2)",borderRadius:"8px",padding:"6px 14px",textAlign:"right"}}><div style={{fontSize:"6.5px",textTransform:"uppercase",letterSpacing:"1px",color:"rgba(255,255,255,.6)"}}>Proposta</div><div style={{fontSize:"18px",fontWeight:"800",color:"#fff"}}>{d.propNum||"—"}</div><div style={{fontSize:"7px",color:"rgba(255,255,255,.6)"}}>{today}</div></div>
        </div>
        <div style={{background:gold,padding:"5px 28px",display:"flex",justifyContent:"space-between",flexWrap:"wrap",gap:"3px",fontSize:"7.5px",color:navy,fontWeight:"600"}}><span>CNPJ: {CO.cnpj}</span><span>IE: {CO.ie}</span><span>{CO.ph1} / {CO.ph2}</span><span>{CO.email}</span><span>{CO.insta}</span></div>

        <div style={{padding:"20px 28px"}}>
          <div style={{display:"flex",justifyContent:"center",marginBottom:"14px"}}><div style={{background:lBg,border:`1.5px solid ${blue}`,borderRadius:"20px",padding:"4px 16px",fontSize:"9.5px",fontWeight:"700",color:blue,textTransform:"uppercase",letterSpacing:"1px"}}>{SVC.find(sv=>sv.id===d.svcType)?.icon} {SVC.find(sv=>sv.id===d.svcType)?.label}</div></div>

          <Sec title="Dados do Cliente"><div style={{background:lBg,borderRadius:"8px",padding:"10px 12px",display:"grid",gridTemplateColumns:"1fr 1fr",gap:"3px 14px",fontSize:"9.5px",border:"1px solid #e8ecf3"}}><div><span style={{color:"#888",fontWeight:"600"}}>Nome:</span> <b>{d.client.name||"—"}</b></div><div><span style={{color:"#888",fontWeight:"600"}}>Tel:</span> {d.client.phone||"—"}</div><div><span style={{color:"#888",fontWeight:"600"}}>End:</span> {d.client.address||"—"}</div><div><span style={{color:"#888",fontWeight:"600"}}>Cidade:</span> {d.client.city||"—"}</div><div><span style={{color:"#888",fontWeight:"600"}}>CPF:</span> {d.client.cpf||"—"}</div><div><span style={{color:"#888",fontWeight:"600"}}>Email:</span> {d.client.email||"—"}</div></div></Sec>

          <Sec title="Detalhamento Técnico"><div style={{background:`linear-gradient(135deg,${lBg},#e8edf5)`,borderRadius:"10px",padding:"14px",border:"1px solid #dce3ee"}}>
            <div style={{display:"flex",gap:"12px",alignItems:"center",justifyContent:"center",flexWrap:"wrap",marginBottom:"6px"}}>
              {[{v:pool.length+"m",l:"Comp."},{v:pool.width+"m",l:"Larg."},{v:pool.depth+"m",l:"Prof."},{v:ar.tot+"m²",l:"Área Total"},{v:ar.perim+"m",l:"Perímetro"},{v:ar.vol+"m³",l:"Volume"}].map((p,i)=><div key={i} style={{textAlign:"center",minWidth:"50px"}}><div style={{fontSize:"16px",fontWeight:"800",color:i===3?navy:blue}}>{p.v}</div><div style={{fontSize:"6.5px",textTransform:"uppercase",letterSpacing:".5px",color:"#777",fontWeight:"600"}}>{p.l}</div></div>)}
            </div>
            <div style={{display:"flex",justifyContent:"center",gap:"8px",flexWrap:"wrap",fontSize:"8.5px"}}>
              <span style={{background:"#fff",padding:"2px 7px",borderRadius:"10px",border:"1px solid #dce3ee"}}><b>Formato:</b> {d.poolFmt}</span>
              <span style={{background:"#fff",padding:"2px 7px",borderRadius:"10px",border:"1px solid #dce3ee"}}><b>Vinil:</b> ACQUALINER {d.vinilT} · Resist. até 32°C</span>
              <span style={{background:goldL,padding:"2px 7px",borderRadius:"10px",border:`1px solid ${gold}`}}><b>Estampa:</b> {d.stamp||"À escolha"}</span>
              <span style={{background:"#fff",padding:"2px 7px",borderRadius:"10px",border:"1px solid #dce3ee"}}><b>Chão:</b> {ar.chao}m² <b>Paredes:</b> {ar.par}m²</span>
            </div>
            {spa.on&&<div style={{marginTop:"6px",background:goldL,borderRadius:"6px",padding:"6px 8px",border:`1px solid ${gold}44`,fontSize:"8.5px"}}><b style={{color:navy}}>🌊 SPA Externo:</b> {spa.length}×{spa.width}×{spa.depth}m — Chão: {ar.sChao}m² | Paredes: {ar.sPar}m²</div>}
            {(d.wMode||"")==="irregular"&&(d.walls||[]).length>0&&<div style={{marginTop:"6px",background:"#eef2ff",borderRadius:"6px",padding:"6px 8px",border:"1px solid #c7d2fe",fontSize:"8.5px"}}><b style={{color:navy}}>📐 Paredes fora de esquadro:</b> {(d.walls||[]).map((w,i)=>`P${i+1}: ${w.l}×${w.h}m`).join(" | ")}</div>}
          </div></Sec>

          <Sec title="Serviços Inclusos"><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"2px"}}>{inc.map((s,i)=><div key={i} style={{padding:"4px 7px",background:i%2===0?lBg:"#fff",borderRadius:"4px",fontSize:"9.5px"}}><span style={{color:gold,fontWeight:"800"}}>✓ </span><b style={{color:navy}}>{s.n}</b>{s.q>1?` (${s.q}x)`:""}{s.nt?<span style={{color:"#888",fontStyle:"italic"}}> — {s.nt}</span>:""}</div>)}</div></Sec>

          <Sec title="Garantias"><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(85px,1fr))",gap:"5px"}}>{(d.guar||[]).filter(g=>g.on).map((g,i)=><div key={i} style={{background:lBg,border:`1px solid ${blue}22`,borderRadius:"8px",padding:"8px 4px",textAlign:"center"}}><div style={{fontSize:"22px",fontWeight:"800",color:blue,lineHeight:1}}>{g.y}</div><div style={{fontSize:"6.5px",color:"#999",textTransform:"uppercase"}}>anos</div><div style={{fontSize:"8px",color:navy,fontWeight:"600"}}>{g.it}</div></div>)}</div></Sec>

          <Sec title="Por Conta do Cliente"><div style={{background:goldL,borderRadius:"8px",padding:"8px 12px",border:`1px solid ${gold}44`}}>{(d.ci||[]).map((c,i)=><div key={i} style={{padding:"1px 0",fontSize:"9.5px"}}><span style={{color:gold,fontWeight:"800"}}>▸</span> <span style={{color:navy}}>{c}</span></div>)}</div></Sec>

          <div style={{background:`linear-gradient(135deg,${navy},${blue})`,borderRadius:"12px",padding:"18px",textAlign:"center",margin:"14px 0",position:"relative",overflow:"hidden"}}><div style={{position:"absolute",top:"-20px",right:"-20px",width:"70px",height:"70px",borderRadius:"50%",background:"rgba(232,177,0,.15)"}}/><div style={{fontSize:"7.5px",textTransform:"uppercase",letterSpacing:"3px",color:"rgba(255,255,255,.6)"}}>Valor Total</div><div style={{fontSize:"30px",fontWeight:"800",color:"#fff"}}>{fmt(total)}</div><div style={{width:"36px",height:"3px",background:gold,margin:"6px auto 0",borderRadius:"2px"}}/></div>

          <Sec title="Condições de Pagamento"><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"6px"}}>
            <div style={{background:lBg,borderRadius:"8px",padding:"10px",borderLeft:"3px solid #22c55e"}}><div style={{fontSize:"9.5px",fontWeight:"700",color:navy}}>💰 Pix / Dinheiro</div><div style={{fontSize:"8.5px",color:"#666"}}>{pay.pixD}% desc.</div><div style={{fontSize:"15px",fontWeight:"800",color:"#16a34a",marginTop:"2px"}}>{fmt(pix)}</div></div>
            <div style={{background:lBg,borderRadius:"8px",padding:"10px",borderLeft:`3px solid ${gold}`}}><div style={{fontSize:"9.5px",fontWeight:"700",color:navy}}>📋 Parcelado</div><div style={{fontSize:"8.5px",color:"#666"}}>{pay.entPct}% + {pay.balPct}%</div><div style={{fontSize:"12px",fontWeight:"700",color:navy,marginTop:"2px"}}>{fmt(ent)} + {fmt(bal)}</div></div>
            <div style={{background:lBg,borderRadius:"8px",padding:"10px",borderLeft:`3px solid ${blue}`}}><div style={{fontSize:"9.5px",fontWeight:"700",color:navy}}>💳 Cartão</div><div style={{fontSize:"8.5px",color:"#666"}}>Até {pay.noFee}x s/juros</div><div style={{fontSize:"12px",fontWeight:"700",color:blue,marginTop:"2px"}}>{pay.noFee}x {fmt(inst)}</div><div style={{fontSize:"7.5px",color:"#999"}}>Ou {pay.wFee}x c/juros</div></div>
            <div style={{background:lBg,borderRadius:"8px",padding:"10px",borderLeft:"3px solid #f59e0b"}}><div style={{fontSize:"9.5px",fontWeight:"700",color:navy}}>₿ Bitcoin</div><div style={{fontSize:"8.5px",color:"#666"}}>{pay.btcD}% desc.</div><div style={{fontSize:"15px",fontWeight:"800",color:"#d97706",marginTop:"2px"}}>{fmt(btc)}</div></div>
          </div></Sec>
        </div>

        <div style={{background:navy,padding:"12px 28px",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap"}}><div><div style={{fontSize:"8.5px",fontWeight:"700",color:gold}}>Válido por 15 dias</div><div style={{fontSize:"7px",color:"rgba(255,255,255,.5)"}}>{CO.name}</div></div><div style={{textAlign:"right",fontSize:"7.5px",color:"rgba(255,255,255,.6)"}}><div>{CO.ph1} / {CO.ph2}</div><div>{CO.email} | {CO.insta}</div></div></div>
      </div>
    </div>
  );
};

// ═══ NOTE PANEL (definido fora do App para evitar remount a cada render) ═══
const NotePanel=({q,t,crmNoteType,setCrmNoteType,noteInputRef,newNote,setNewNote,addInteracao,crmNextContact,isNextContactOverdue,setNextContact,crmTags,setLeadTag,interacoes})=>{
  const ti=TIPO_ICONS[crmNoteType]||TIPO_ICONS.nota;
  return <div style={{marginTop:"8px",borderTop:`1px solid ${t.cardBorder}`,paddingTop:"8px"}}>
    <div style={{display:"flex",gap:"3px",marginBottom:"8px",flexWrap:"wrap"}}>
      {Object.entries(TIPO_ICONS).map(([k,v])=><button key={k} title={v.label} onClick={()=>{setCrmNoteType(k);setTimeout(()=>noteInputRef.current?.focus(),30)}} style={{fontSize:"9px",padding:"3px 8px",borderRadius:"6px",border:`1.5px solid ${crmNoteType===k?v.color:t.cardBorder}`,background:crmNoteType===k?v.color+"22":"transparent",color:crmNoteType===k?v.color:t.textMuted,cursor:"pointer",fontWeight:"600",display:"flex",alignItems:"center",gap:"3px"}}>{v.icon} <span style={{fontSize:"8px"}}>{v.label}</span></button>)}
    </div>
    <div style={{display:"flex",gap:"4px",marginBottom:"8px"}}>
      <input
        ref={noteInputRef}
        value={newNote}
        onChange={e=>setNewNote(e.target.value)}
        placeholder={`Registrar ${ti.label}...`}
        autoFocus
        onKeyDown={e=>{if(e.key==="Enter"&&newNote.trim()){addInteracao(q.id,crmNoteType,newNote.trim());setNewNote("");setTimeout(()=>noteInputRef.current?.focus(),30)}}}
        style={{flex:1,padding:"7px 10px",border:`1.5px solid ${ti.color}`,borderRadius:"6px",fontSize:"10px",background:t.inputBg,color:t.text,outline:"none"}}
      />
      <button onClick={()=>{if(newNote.trim()){addInteracao(q.id,crmNoteType,newNote.trim());setNewNote("");setTimeout(()=>noteInputRef.current?.focus(),30)}}} style={{padding:"7px 12px",borderRadius:"6px",border:"none",background:ti.color,color:"#fff",fontSize:"10px",cursor:"pointer",fontWeight:"700"}}>+</button>
    </div>
    <div style={{display:"flex",alignItems:"center",gap:"6px",marginBottom:"8px",background:isNextContactOverdue(q.id)?"#fef2f2":t.sectionBg,padding:"6px 8px",borderRadius:"6px",border:`1px solid ${isNextContactOverdue(q.id)?"#fecaca":t.cardBorder}`}}>
      <span style={{fontSize:"9px",fontWeight:"700",color:isNextContactOverdue(q.id)?"#dc2626":t.textSec}}>📅 Próximo contato:</span>
      <input type="date" value={crmNextContact[q.id]||""} onChange={e=>setNextContact(q.id,e.target.value)} style={{fontSize:"9px",border:"none",background:"transparent",color:isNextContactOverdue(q.id)?"#dc2626":t.text,cursor:"pointer",flex:1}}/>
      {crmNextContact[q.id]&&<button title="Remover data" onClick={()=>setNextContact(q.id,"")} style={{fontSize:"9px",background:"none",border:"none",color:t.textMuted,cursor:"pointer"}}>✕</button>}
    </div>
    <div style={{display:"flex",gap:"3px",flexWrap:"wrap",marginBottom:"8px"}}>
      {TAGS_OPTS.map(tag=>{const active=(crmTags[q.id]||[]).includes(tag);return <button key={tag} title={active?"Remover tag":"Adicionar tag"} onClick={()=>setLeadTag(q.id,tag)} style={{fontSize:"8px",padding:"2px 8px",borderRadius:"10px",border:`1px solid ${active?blue:t.cardBorder}`,background:active?blue+"22":"transparent",color:active?blue:t.textMuted,cursor:"pointer",fontWeight:active?"700":"400"}}>{active?"✓ ":""}{tag}</button>})}
    </div>
    <div style={{maxHeight:"130px",overflow:"auto",display:"flex",flexDirection:"column",gap:"3px"}}>
      {(interacoes[q.id]||[]).map((it,i)=>{const tip=TIPO_ICONS[it.tipo]||TIPO_ICONS.nota;return <div key={i} style={{fontSize:"8px",display:"flex",gap:"5px",alignItems:"flex-start",padding:"4px 6px",borderRadius:"5px",background:t.sectionBg,border:`1px solid ${t.cardBorder}`}}><span style={{color:tip.color,flexShrink:0,fontSize:"10px"}}>{tip.icon}</span><div style={{flex:1}}><span style={{fontWeight:"700",color:t.textSec}}>{it.data} {it.hora} · </span><span style={{color:t.text}}>{it.texto}</span></div></div>})}
      {(!interacoes[q.id]||interacoes[q.id].length===0)&&<div style={{fontSize:"9px",color:t.textMuted,textAlign:"center",padding:"12px"}}>Nenhuma interação registrada ainda</div>}
    </div>
  </div>;
};

// ═══ MAIN ═══
export default function App(){
  const [view,setView]=useState("editor");
  const [dark,setDark]=useState(false);
  const t=themes[dark?"dark":"light"];
  const [tab,setTab]=useState("cliente");
  const [svcType,setST2]=useState("construcao");
  const [propNum,setPN]=useState(()=>{const d=new Date();return String(d.getMonth()+1).padStart(2,"0")+"/"+d.getFullYear()});
  const [poolFmt,setPF]=useState("Retangular");
  const [vinilT,setVT]=useState("0,7mm");
  const [stamp,setSt]=useState("");
  const [execDays,setED]=useState("60 a 90");
  const [gM,setGM]=useState(40);
  const [client,setCl]=useState({name:"",phone:"",address:"",city:"",cpf:"",rg:"",email:""});
  const uc=f=>v=>setCl(p=>({...p,[f]:v}));
  const [pool,setPool]=useState({length:"10.00",width:"4.00",depth:"1.40",depthMin:"",depthMax:""});
  const [fieldErrors,setFieldErrors]=useState({});
  const up=f=>v=>{setPool(p=>({...p,[f]:v}));if(parseFloat(v)>0)setFieldErrors(e=>({...e,[f]:false}));};

  // DISPOSITIVOS HIDRAULICOS
  const [disps,setDisps]=useState({retorno:2,aspiracao:1,dreno:2,skimmer:1,refletor:6,nivelador:1,hidro:4});
  const [invertSide,setInvertSide]=useState(false);
  const [includePlanta,setIncludePlanta]=useState(true);
  const [isoView,setIsoView]=useState(false);
  const isoRef=useRef(null);
  const downloadISO=(asPng=false)=>{
    const svg=isoRef.current;if(!svg)return;
    const fname=`planta-isometrica-${(client.name||'piscina').replace(/\s+/g,'-').toLowerCase()}`;
    const raw=new XMLSerializer().serializeToString(svg);
    const svgStr=raw.includes('xmlns=')?raw:raw.replace('<svg','<svg xmlns="http://www.w3.org/2000/svg"');
    if(!asPng){const a=document.createElement('a');a.href='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svgStr);a.download=fname+'.svg';a.click();return;}
    const img=new Image();const canvas=document.createElement('canvas');
    canvas.width=1280;canvas.height=880;
    const ctx=canvas.getContext('2d');ctx.fillStyle='#ffffff';ctx.fillRect(0,0,1280,880);
    const blob2=new Blob([svgStr],{type:'image/svg+xml;charset=utf-8'});
    const url2=URL.createObjectURL(blob2);
    img.onload=()=>{ctx.scale(2,2);ctx.drawImage(img,0,0);URL.revokeObjectURL(url2);canvas.toBlob(b=>{const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=fname+'.png';document.body.appendChild(a);a.click();document.body.removeChild(a);},'image/png');};
    img.src=url2;
  };
  const [dispPos,setDispPos]=useState(null);
  const [dragging,setDragging]=useState(null);
  const [customPos,setCustomPos]=useState({});
  const [tubeOffsets,setTubeOffsets]=useState({});

  const autoPositions=(L,W,d,inv)=>{
    const pos={};const r=d.retorno||0;const refs=d.refletor||0;
    // Retornos: lado esquerdo (lado da prainha)
    for(let i=0;i<r;i++){pos["ret_"+i]={x:inv?0.95:0.05,y:(i+1)/(r+1),label:"R"+(i+1),type:"retorno"}}
    // Aspiracao: parede inferior meio, mas rota pela esquerda
    for(let i=0;i<(d.aspiracao||0);i++){pos["asp_"+i]={x:0.5,y:0.95,label:"A"+(i+1),type:"aspiracao"}}
    // Drenos de fundo: 50cm da parede direita, 1.50m separacao, centrados na largura
    const drQty=d.dreno||0;
    if(drQty>0){const drX=inv?(0.5/(L||10)):L>0?(L-0.5)/L:0.9;const sepDr=1.5;const totalSep=(drQty-1)*sepDr;const startY=W>0?(W/2-totalSep/2)/W:0.5;for(let i=0;i<drQty;i++){const yPos=drQty===1?0.5:startY+(i*sepDr)/W;pos["drn_"+i]={x:drX,y:Math.max(0.15,Math.min(0.85,yPos)),label:"DF"+(i+1),type:"dreno",floor:true}}}
    // Skimmer: parede direita (oposta aos retornos)
    for(let i=0;i<(d.skimmer||0);i++){pos["skm_"+i]={x:inv?0.05:0.95,y:(i+1)/((d.skimmer||1)+1),label:"SK"+(i+1),type:"skimmer"}}
    // Refletores: distribuidos nas paredes laterais (superior e inferior)
    for(let i=0;i<refs;i++){if(i%2===0){pos["ref_"+i]={x:(Math.floor(i/2)+1)/(Math.ceil(refs/2)+1),y:0.03,label:"L"+(i+1),type:"refletor"}}else{pos["ref_"+i]={x:(Math.floor(i/2)+1)/(Math.ceil(refs/2)+1),y:0.97,label:"L"+(i+1),type:"refletor"}}}
    // Nivelador: parede direita, proximo ao skimmer
    for(let i=0;i<(d.nivelador||0);i++){pos["niv_"+i]={x:inv?0.05:0.95,y:0.12,label:"N"+(i+1),type:"nivelador"}}
    // Hidro: mesma parede dos retornos (esquerda), distribuidos iguais
    const hQty=d.hidro||0;
    for(let i=0;i<hQty;i++){pos["hid_"+i]={x:inv?0.95:0.05,y:(i+1)/(hQty+1),label:"H"+(i+1),type:"hidro"}}
    // Casa de maquinas: 10% do comprimento, fora da piscina
    pos["casa"]={x:1.12,y:0.5,label:"CM",type:"casa",special:true};
    return pos;
  };

  // SPA
  const [spa,setSpa]=useState({on:false,length:"2.00",width:"2.00",depth:"0.80"});
  const uSpa=f=>v=>setSpa(p=>({...p,[f]:v}));

  // WALLS irregular
  const [wMode,setWM]=useState("regular"); // "regular" | "irregular"
  const [walls,setWalls]=useState([{l:"10",h:"1.40"},{l:"4",h:"1.40"},{l:"10",h:"1.40"},{l:"4",h:"1.40"}]);
  const addWall=()=>setWalls(p=>[...p,{l:"",h:pool.depth||"1.40"}]);
  const rmWall=i=>setWalls(p=>p.filter((_,x)=>x!==i));
  const uWall=(i,f,v)=>setWalls(p=>p.map((w,x)=>x===i?{...w,[f]:v}:w));

  const [items,setItems]=useState(()=>mkItems("construcao"));
  const [guar,setG]=useState(()=>mkG("construcao"));
  const [ci,setCI]=useState(()=>mkCI("construcao"));
  const [newCI,setNCI]=useState("");
  const [pay,setPay]=useState(IPAY);
  const [mo,setMO]=useState("15000");
  const [totOv,setTO]=useState("");
  const [hist,setHist]=useState(()=>{try{const s=localStorage.getItem("vv_hist");return s?JSON.parse(s):[];}catch{return[]}});
  const [histLoaded,setHL]=useState(false);
  const [user,setUser]=useState(null);
  const [authLoading,setAL]=useState(true);
  const [fbReady,setFBR]=useState(false);
  const [loginEmail,setLE]=useState("");
  const [loginPass,setLP]=useState("");
  const [loginErr,setLErr]=useState("");
  const [loginMode,setLM]=useState("login");

  // Init Firebase on mount
  useEffect(()=>{
    initFB().then(ok=>{
      setFBR(ok);
      if(ok&&fb.auth){
        fbFns.onAuthStateChanged(fb.auth,(u)=>{setUser(u);setAL(false)});
      } else {
        setUser({uid:"local",email:"local@vinilvale"});setAL(false);
      }
    });
  },[]);

  // Firestore sync when user logs in
  useEffect(()=>{
    if(!user||!fbReady||!fb.db||user.uid==="local")return;
    try{
      const colRef=fbFns.collection(fb.db,"users",user.uid,"orcamentos");
      const unsub=fbFns.onSnapshot(colRef,(snap)=>{
        const cloudData=snap.docs.map(d=>({id:d.id,...d.data()}));
        if(cloudData.length>0){
          setHist(cloudData);setHL(true);
          try{localStorage.setItem("vv_hist",JSON.stringify(cloudData))}catch{}
        } else {
          // Cloud empty — migrate localStorage data to Firestore
          const localData=hist.length>0?hist:(()=>{try{const s=localStorage.getItem("vv_hist");return s?JSON.parse(s):[];}catch{return[]}})();
          if(localData.length>0){
            localData.forEach(item=>{
              try{fbFns.setDoc(fbFns.doc(fb.db,"users",user.uid,"orcamentos",String(item.id)),JSON.parse(JSON.stringify(item)))}catch{}
            });
            setHist(localData);setHL(true);
          } else {
            setHL(true);
          }
        }
      });
      return ()=>unsub();
    }catch(e){console.error("Firestore sync error:",e)}
  },[user,fbReady]);

  // Save helpers
  const saveFS=async(item)=>{if(!fbReady||!fb.db||!user||user.uid==="local")return;try{await fbFns.setDoc(fbFns.doc(fb.db,"users",user.uid,"orcamentos",String(item.id)),JSON.parse(JSON.stringify(item)))}catch(e){console.error("saveFS:",e)}};
  const delFS=async(id)=>{if(!fbReady||!fb.db||!user||user.uid==="local")return;try{await fbFns.deleteDoc(fbFns.doc(fb.db,"users",user.uid,"orcamentos",String(id)))}catch(e){console.error("delFS:",e)}};
  const saveLS=(h)=>{try{localStorage.setItem("vv_hist",JSON.stringify(h))}catch{}};

  // Auth handlers
  const doLogin=async()=>{if(!fbReady||!fb.auth)return;setLErr("");try{await fbFns.signInWithEmailAndPassword(fb.auth,loginEmail,loginPass)}catch(e){setLErr(e.code==="auth/invalid-credential"?"Email ou senha incorretos":e.code==="auth/user-not-found"?"Usuário não encontrado":"Erro: "+e.message)}};
  const doRegister=async()=>{if(!fbReady||!fb.auth)return;setLErr("");try{await fbFns.createUserWithEmailAndPassword(fb.auth,loginEmail,loginPass)}catch(e){setLErr(e.code==="auth/email-already-in-use"?"Email já cadastrado":e.code==="auth/weak-password"?"Senha fraca (mín. 6 caracteres)":"Erro: "+e.message)}};
  const doGoogle=async()=>{if(!fbReady||!fb.auth||!fb.GoogleProvider)return;setLErr("");try{const provider=new fb.GoogleProvider();await fbFns.signInWithPopup(fb.auth,provider)}catch(e){if(e.code!=="auth/popup-closed-by-user")setLErr("Erro Google: "+e.message)}};
  const doLogout=()=>{if(fbReady&&fb.auth)fbFns.signOut(fb.auth);else setUser(null)};
  const [fbMsg,setFbMsg]=useState("");
  // ═══ ESTOQUE ═══
  const [stk,setStk]=useState(()=>{
    const init={};CAT.forEach(p=>{init[p.id]={qty:0,minQty:2,lastCost:p.p}});return init;
  });
  const [stkLog,setStkLog]=useState([]);
  const [stkFilter,setStkF]=useState("");
  const [stkCat,setStkCat]=useState("todos");
  const stkOrderRef=React.useRef([]);
  const [stkTab,setStkTab]=useState("dashboard");
  const [entItems,setEntItems]=useState([{catId:"",qty:"",cost:""}]);
  const [fornecedores,setFornec]=useState([]);
  const [interacoes,setInteracoes]=useState({});
  const [crmDetail,setCrmDetail]=useState(null);
  const [newNote,setNewNote]=useState("");
  const [crmView,setCrmView]=useState("pipeline");
  const [crmSearch,setCrmSearch]=useState("");
  const [crmSvcF,setCrmSvcF]=useState("todos");
  const [crmShowLost,setCrmShowLost]=useState(false);
  const [crmNextContact,setCrmNextContact]=useState({});
  const [crmTags,setCrmTags]=useState({});
  const [crmNoteType,setCrmNoteType]=useState("nota");
  const [crmSort,setCrmSort]=useState("data");
  const crmNoteInputRef=useRef(null);

  useEffect(()=>{
    if(!user||!fbReady||!fb.db||user.uid==="local")return;
    try{
      const iRef=fbFns.doc(fb.db,"users",user.uid,"config","interacoes");
      const unsub=fbFns.onSnapshot(iRef,(snap)=>{
        if(snap.exists()&&snap.data().data)setInteracoes(snap.data().data);
      });
      return ()=>unsub();
    }catch{}
  },[user,fbReady]);

  const saveInteracoes=async(data)=>{
    setInteracoes(data);
    if(fbReady&&fb.db&&user&&user.uid!=="local"){
      try{await fbFns.setDoc(fbFns.doc(fb.db,"users",user.uid,"config","interacoes"),{data})}catch{}
    }
  };

  useEffect(()=>{
    if(!user||!fbReady||!fb.db||user.uid==="local")return;
    try{
      const ref=fbFns.doc(fb.db,"users",user.uid,"config","crmMeta");
      const unsub=fbFns.onSnapshot(ref,(snap)=>{
        if(snap.exists()){const d=snap.data();if(d.nextContact)setCrmNextContact(d.nextContact);if(d.tags)setCrmTags(d.tags);}
      });
      return ()=>unsub();
    }catch{}
  },[user,fbReady]);

  const saveCrmMeta=(nc,tags)=>{
    setCrmNextContact(nc);setCrmTags(tags);
    if(fbReady&&fb.db&&user&&user.uid!=="local"){
      try{fbFns.setDoc(fbFns.doc(fb.db,"users",user.uid,"config","crmMeta"),{nextContact:nc,tags})}catch{}
    }
  };

  const addInteracao=(qId,tipo,texto)=>{
    const ni={...interacoes};
    if(!ni[qId])ni[qId]=[];
    ni[qId]=[{tipo,texto,data:new Date().toLocaleDateString("pt-BR"),hora:new Date().toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"}),ts:Date.now()},...ni[qId]];
    saveInteracoes(ni);
  };

  const getLastContact=(qId)=>{
    const list=interacoes[qId]||[];
    if(list.length===0)return null;
    return list[0];
  };

  const getDaysSince=(qId)=>{
    const last=getLastContact(qId);
    if(!last)return 999;
    const parts=last.data.split("/");
    const d=new Date(parts[2],parts[1]-1,parts[0]);
    const diff=Math.floor((Date.now()-d.getTime())/(1000*60*60*24));
    return diff;
  };

  const needsFollowUp=(qId,status)=>{
    if(["concluido","perdido"].includes(status))return false;
    return getDaysSince(qId)>=5;
  };

  const getTemp=(qId,status)=>{
    if(["concluido","perdido"].includes(status))return null;
    const d=getDaysSince(qId);
    if(d<=2)return{icon:"🔥",label:"Quente",color:"#ef4444",bg:"#fef2f2"};
    if(d<=7)return{icon:"🌡️",label:"Morno",color:"#f97316",bg:"#fff7ed"};
    if(d<=14)return{icon:"❄️",label:"Frio",color:"#06b6d4",bg:"#ecfeff"};
    return{icon:"🧊",label:"Gelado",color:"#64748b",bg:"#f1f5f9"};
  };

  const setLeadTag=(qId,tag)=>{
    const cur=crmTags[qId]||[];
    const updated=cur.includes(tag)?cur.filter(t=>t!==tag):[...cur,tag];
    const nt={...crmTags,[qId]:updated};
    saveCrmMeta(crmNextContact,nt);
  };

  const setNextContact=(qId,date)=>{
    const nn={...crmNextContact,[qId]:date};
    saveCrmMeta(nn,crmTags);
  };

  const isNextContactOverdue=(qId)=>{
    const d=crmNextContact[qId];if(!d)return false;
    const parts=d.split("-");
    return new Date(parts[0],parts[1]-1,parts[2])<new Date();
  };
  const [newFornec,setNF2]=useState({name:"",phone:"",products:""});

  // Firestore fornecedores sync
  useEffect(()=>{
    if(!user||!fbReady||!fb.db||user.uid==="local")return;
    try{
      const fRef=fbFns.doc(fb.db,"users",user.uid,"config","fornecedores");
      const unsub=fbFns.onSnapshot(fRef,(snap)=>{
        if(snap.exists()&&snap.data().list)setFornec(snap.data().list);
      });
      return ()=>unsub();
    }catch{}
  },[user,fbReady]);

  const saveFornec=async(list)=>{
    setFornec(list);
    if(fbReady&&fb.db&&user&&user.uid!=="local"){
      try{await fbFns.setDoc(fbFns.doc(fb.db,"users",user.uid,"config","fornecedores"),{list})}catch{}
    }
  };

  useEffect(()=>{
    if(!user||!fbReady||!fb.db||user.uid==="local")return;
    try{
      const stkRef=fbFns.doc(fb.db,"users",user.uid,"config","estoque");
      const unsub=fbFns.onSnapshot(stkRef,(snap)=>{
        if(snap.exists()){const d=snap.data();if(d.items)setStk(d.items);if(d.log)setStkLog(d.log)}
      });
      return ()=>unsub();
    }catch{}
  },[user,fbReady]);

  const saveStk=async(newStk,newLog)=>{
    setStk(newStk);if(newLog)setStkLog(newLog);
    if(fbReady&&fb.db&&user&&user.uid!=="local"){
      try{await fbFns.setDoc(fbFns.doc(fb.db,"users",user.uid,"config","estoque"),{items:newStk,log:newLog||stkLog})}catch(e){console.error("saveStk:",e)}
    }
  };

  const addStock=(entries,nfRef)=>{
    const ns={...stk};const nl=[...stkLog];
    entries.forEach(e=>{
      if(!e.catId||!e.qty)return;
      const q=parseFloat(e.qty)||0;const c=parseFloat(e.cost)||0;
      if(!ns[e.catId])ns[e.catId]={qty:0,minQty:2,lastCost:c};
      ns[e.catId].qty=(ns[e.catId].qty||0)+q;
      if(c>0)ns[e.catId].lastCost=c;
      const item=CAT.find(p=>p.id===e.catId);
      nl.unshift({type:"entrada",catId:e.catId,name:item?.n||e.catId,qty:q,cost:c,nf:nfRef||"",date:new Date().toLocaleDateString("pt-BR"),ts:Date.now()});
    });
    saveStk(ns,nl);setFbMsg("📦 Estoque atualizado!");setTimeout(()=>setFbMsg(""),2000);
  };

  const removeStock=(items2,clientName,mode)=>{
    const ns={...stk};const nl=[...stkLog];
    items2.forEach(i=>{
      if(!i.catId)return;
      const q=parseFloat(i.qty)||0;
      if(!ns[i.catId])ns[i.catId]={qty:0,minQty:2,lastCost:0};
      ns[i.catId].qty=Math.max(0,(ns[i.catId].qty||0)-q);
      const item=CAT.find(p=>p.id===i.catId);
      nl.unshift({type:"saida",catId:i.catId,name:item?.n||i.catId,qty:q,client:clientName,mode,date:new Date().toLocaleDateString("pt-BR"),ts:Date.now()});
    });
    saveStk(ns,nl);
  };

  const autoStockOut=(q)=>{
    const d=q.data;if(!d||!d.items)return;
    const inc=d.items.filter(i=>i.on);
    const pool=d.pool||{};
    const L=parseFloat(pool.length)||0;const W=parseFloat(pool.width)||0;const D=parseFloat(pool.depth)||0;
    const areaChao=L*W;const areaParede=2*(L+W)*D;const areaTotal=areaChao+areaParede;
    const perim=2*(L+W);
    const stamp=d.stamp||"";const vinilT=d.vinilT||"0,7mm";
    const thick=vinilT.includes("0,8")?"8":"7";
    const stkItems=[];
    const unmatched=[];
    inc.forEach(i=>{
      const nm=i.n||"";
      if(nm.includes("Vinil ACQUALINER")){
        const stampClean=stamp.replace(/\s+/g," ").trim();
        const vinilMatch=CAT.find(p=>p.c==="Vinil 0,"+thick+"mm"&&p.n.toUpperCase().includes(stampClean.toUpperCase()));
        if(vinilMatch)stkItems.push({catId:vinilMatch.id,qty:Math.ceil(areaTotal*1.1),name:vinilMatch.n,matched:true});
        else unmatched.push({name:nm,reason:"Estampa '"+stampClean+"' não encontrada no catálogo"});
      }else if(nm.includes("Manta")){
        const nmLow=nm.toLowerCase();
        const mantaMatch=CAT.find(p=>p.c==="Mantas"&&(
          (nmLow.includes("0,6")||nmLow.includes("0.6"))&&p.id==="m06"||
          (nmLow.includes("0,4")||nmLow.includes("0.4"))&&p.id==="m04"||
          nmLow.includes("eva")&&p.id==="eva"
        ));
        if(mantaMatch)stkItems.push({catId:mantaMatch.id,qty:Math.ceil(i.un==="chao"?areaChao:areaTotal),name:mantaMatch.n,matched:true});
        else unmatched.push({name:nm,reason:"Tipo de manta não identificado"});
      }else if(nm.includes("Perfil")){
        const isFlangeamento=nm.toLowerCase().includes("flangeamento");
        const perfilMatch=CAT.find(p=>p.c==="Perfis"&&(isFlangeamento?p.id==="pF":p.id==="pR"));
        if(perfilMatch)stkItems.push({catId:perfilMatch.id,qty:Math.ceil(perim),name:perfilMatch.n,matched:true});
        else unmatched.push({name:nm,reason:"Tipo de perfil não identificado"});
      }else{
        const nmWords=nm.toLowerCase().split(" ").filter(w=>w.length>3);
        const match=CAT.find(p=>{
          const pWords=p.n.toLowerCase().split(" ").filter(w=>w.length>3);
          const score=pWords.filter(pw=>nmWords.some(iw=>iw===pw||iw.includes(pw)||pw.includes(iw))).length;
          return score>=2||(score===1&&pWords.length<=2);
        });
        if(match)stkItems.push({catId:match.id,qty:i.q||1,name:match.n,matched:true});
        else unmatched.push({name:nm,reason:"Produto não encontrado no catálogo"});
      }
    });
    setStkReview({items:stkItems.map(s=>({...s,selected:true,editQty:String(s.qty)})),unmatched,clientName:q.cN||"Cliente",quoteId:q.id});
  };
  const [stkReview,setStkReview]=useState(null); // {items:[{catId,qty,name,matched}], clientName}
  const exportStkCSV=()=>{
    const rows=[["Produto","Categoria","Qtd em Estoque","Qtd Mínima","Custo Unit. (R$)","Valor Total (R$)","Status"]];
    CAT.forEach(p=>{const s=stk[p.id]||{qty:0,minQty:2,lastCost:p.p};const status=s.qty<=0?"Zerado":s.qty<=(s.minQty||2)?"Baixo":"OK";rows.push([p.n,p.c,s.qty,s.minQty||2,(s.lastCost||p.p).toFixed(2),(s.qty*(s.lastCost||p.p)).toFixed(2),status])});
    const csv=rows.map(r=>r.map(c=>'"'+String(c).replace(/"/g,'""')+'"').join(",")).join("\n");
    const blob=new Blob(["\uFEFF"+csv],{type:"text/csv;charset=utf-8"});
    const url=URL.createObjectURL(blob);const a=document.createElement("a");
    a.href=url;a.download="estoque_vinilvale_"+new Date().toLocaleDateString("pt-BR").replace(/\//g,"-")+".csv";
    document.body.appendChild(a);a.click();setTimeout(()=>{document.body.removeChild(a);URL.revokeObjectURL(url)},1000);
    setFbMsg("CSV exportado!");setTimeout(()=>setFbMsg(""),2000);
  };
  const exportStkLogCSV=()=>{
    const rows=[["Data","Tipo","Produto","Qtd","NF/Cliente","Modo"]];
    stkLog.forEach(l=>rows.push([l.date||"",l.type||"",l.name||"",l.qty||0,l.nf||l.client||"",l.mode||""]));
    const csv=rows.map(r=>r.map(c=>'"'+String(c).replace(/"/g,'""')+'"').join(",")).join("\n");
    const blob=new Blob(["\uFEFF"+csv],{type:"text/csv;charset=utf-8"});
    const url=URL.createObjectURL(blob);const a=document.createElement("a");
    a.href=url;a.download="movimentacoes_vinilvale_"+new Date().toLocaleDateString("pt-BR").replace(/\//g,"-")+".csv";
    document.body.appendChild(a);a.click();setTimeout(()=>{document.body.removeChild(a);URL.revokeObjectURL(url)},1000);
    setFbMsg("Movimentações exportadas!");setTimeout(()=>setFbMsg(""),2000);
  };
  const [catO,setCatO]=useState(false);
  const [catQ,setCatQ]=useState("");
  const [viewContract,setVC]=useState(null);
  const [ce,setCE]=useState({servicos:[],obs:"",garantias:"",valor:"",prazo:"20",data:"",novoServico:""});
  const uce=f=>v=>setCE(p=>({...p,[f]:v}));
  const initCE=(q)=>{const d=q.data;const inc=(d.items||[]).filter(i=>i.on);const p=d.pool||{};const pay2=d.pay||{pixD:5,entPct:50,balPct:50,noFee:5,wFee:12,btcD:15};const tot=parseFloat(q.tot)||0;const svcLabel=SVC.find(s=>s.id===d.svcType)?.label||"Serviço";setCE({servicos:inc.map(it=>it.n+(it.q>1?" ("+it.q+"x)":"")+(it.nt?" - "+it.nt:"")),obs:(d.ci||[]).join(", ")||"Materiais de alvenaria e hidráulico, pedra de borda, água para enchimento, remoção de entulho",garantias:(d.guar||[]).filter(g=>g.on).map(g=>g.y+" anos para "+g.it).join(", "),valor:fmt(tot),prazo:d.execDays||"20",data:new Date().toLocaleDateString("pt-BR",{day:"2-digit",month:"long",year:"numeric"}),novoServico:"",tipoServico:svcLabel,piscina:p.length+"x"+p.width+"x"+p.depth+"m"+(d.poolFmt?" - "+d.poolFmt:""),vinil:"ACQUALINER "+(d.vinilT||"0,7mm"),estampa:d.stamp||"",pagPix:fmt(tot*(1-pay2.pixD/100))+" ("+pay2.pixD+"% desc.)",pagCartao:"até "+(pay2.noFee||5)+"x sem juros ou "+(pay2.wFee||12)+"x com juros",pagParcelado:pay2.entPct+"% entrada + "+pay2.balPct+"% no término",pagBtc:fmt(tot*(1-pay2.btcD/100))+" ("+pay2.btcD+"% desc.)",propNum:d.propNum||""})};
  // Auto-init contract when switching to contratos tab
  const [ceInit,setCeInit]=useState(null);
  useEffect(()=>{
    if(tab==="contratos"){
      const clientes=hist.filter(q=>["cliente","fechou","execucao","concluido"].includes(q.status));
      const sel=viewContract||clientes[0];
      if(sel&&ceInit!==sel.id){initCE(sel);setCeInit(sel.id)}
    }else{setCeInit(null)}
  },[tab,viewContract,hist.length]);

  const exportCSV=()=>{
    const rows=[["Status","Nome","Telefone","Cidade"]];
    hist.forEach(q=>{const c=q.data?.client||{};rows.push([["cliente","fechou","execucao","concluido"].includes(q.status)?"Cliente":"Lead",c.name||"",c.phone||"",c.city||""])});
    const csv=rows.map(r=>r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(",")).join("\n");
    const blob=new Blob(["\uFEFF"+csv],{type:"text/csv;charset=utf-8"});
    const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=`vinil_vale_dados_${new Date().toISOString().slice(0,10)}.csv`;document.body.appendChild(a);a.click();document.body.removeChild(a);setTimeout(()=>URL.revokeObjectURL(url),1000);
    setFbMsg("📊 CSV exportado!");setTimeout(()=>setFbMsg(""),2000);
  };

  const inc=items.filter(i=>i.on);
  // Calculate effective quantity based on unit type
  const ar=calcA(pool,spa,wMode,walls);
  const lowStockCount=Object.entries(stk).filter(([,s])=>s.qty>0&&s.qty<=(s.minQty||2)).length;

  const effQ=(i)=>{
    if(i.un==="m²")return parseFloat(ar.tot)||0; // area total m²
    if(i.un==="ml")return parseFloat(ar.perim)||0; // perimetro linear
    return i.q||0; // unidade
  };
  const matC=inc.reduce((s,i)=>s+effQ(i)*(i.c||0),0);
  const matS=inc.reduce((s,i)=>s+effQ(i)*(i.c||0)*(1+(i.m||0)/100),0);
  const tCalc=matS+(parseFloat(mo)||0);
  const total=parseFloat(totOv)||tCalc;

  const ui=(id,f,v)=>setItems(p=>p.map(i=>i.id===id?{...i,[f]:v}:i));
  const ti=id=>setItems(p=>p.map(i=>i.id===id?{...i,on:!i.on}:i));
  const ri=id=>setItems(p=>p.filter(i=>i.id!==id));
  const addC=pr=>setItems(p=>[...p,{id:Date.now(),n:pr.n,q:1,c:pr.p,m:gM,nt:pr.s,on:true,un:pr.un||"un"}]);
  const addM=()=>setItems(p=>[...p,{id:Date.now(),n:"Novo item",q:1,c:0,m:gM,nt:"",on:true,un:"un"}]);
  const apM=()=>{setItems(p=>p.map(i=>({...i,m:gM})));setFbMsg("Margem aplicada!");setTimeout(()=>setFbMsg(""),1500)};

  const gData=()=>({client,pool,items,guar,ci,pay,totOv:String(total),vinilT,svcType,propNum,poolFmt,mo,gM,execDays,stamp,spa,wMode,walls});
  const save=()=>{
    const errs={};
    if(!client.name||client.name.trim()==="")errs.clientName="Nome obrigatório";
    if(!(parseFloat(pool.length)>0))errs.length="Informe o comprimento";
    if(!(parseFloat(pool.width)>0))errs.width="Informe a largura";
    if(!(parseFloat(pool.depth)>0))errs.depth="Informe a profundidade";
    if(Object.keys(errs).length>0){setFieldErrors(errs);setFbMsg("Preencha os campos obrigatórios");setTimeout(()=>setFbMsg(""),3000);return;}
    setFieldErrors({});
    const d=gData();const item={id:Date.now(),date:new Date().toLocaleDateString("pt-BR"),data:d,cN:client.name,cC:client.city,tot:String(total),ps:`${pool.length}x${pool.width}x${pool.depth}`,type:svcType,stamp,status:"lead"};const nh=[item,...hist];setHist(nh);saveLS(nh);saveFS(item);setFbMsg("Salvo!");setTimeout(()=>setFbMsg(""),2000);
  };
  const toClient=(id)=>{const nh=hist.map(q=>q.id===id?{...q,status:"fechou",closedDate:new Date().toLocaleDateString("pt-BR")}:q);setHist(nh);saveLS(nh);const item=nh.find(q=>q.id===id);if(item){saveFS(item);autoStockOut(item)}setFbMsg("✅ Cliente fechado!");setTimeout(()=>setFbMsg(""),2000)};
  const toBack=id=>{const nh=hist.map(q=>q.id===id?{...q,status:"lead",closedDate:undefined}:q);setHist(nh);saveLS(nh);const item=nh.find(q=>q.id===id);if(item)saveFS(item);setFbMsg("Voltou p/ lead");setTimeout(()=>setFbMsg(""),2000)};
  const load=q=>{const d=q.data;setCl(d.client);setPool(d.pool);setItems(d.items);setG(d.guar);setCI(d.ci);setPay(d.pay);setTO(d.totOv);setVT(d.vinilT);setST2(d.svcType);setPN(d.propNum);setPF(d.poolFmt);setMO(d.mo);setGM(d.gM);setED(d.execDays);setSt(d.stamp||"");setSpa(d.spa||{on:false,length:"2",width:"2",depth:"0.8"});setWM(d.wMode||"regular");setWalls(d.walls||[]);setTab("cliente");setFbMsg("Carregado!");setTimeout(()=>setFbMsg(""),1500)};
  const delQ=id=>{const nh=hist.filter(q=>q.id!==id);setHist(nh);saveLS(nh);delFS(id);setFbMsg("Excluído!");setTimeout(()=>setFbMsg(""),1500)};
  const movePipe=(id,stage)=>{const nh=hist.map(q=>q.id===id?{...q,status:stage,closedDate:stage==="fechou"?new Date().toLocaleDateString("pt-BR"):q.closedDate}:q);setHist(nh);saveLS(nh);const item=nh.find(q=>q.id===id);if(item)saveFS(item);setFbMsg(`Movido → ${PIPE.find(p=>p.id===stage)?.label}`);setTimeout(()=>setFbMsg(""),2000)};
  const openWA=(phone,msg)=>{const num=(phone||"").replace(/\D/g,"");if(!num){setFbMsg("⚠️ Sem telefone");setTimeout(()=>setFbMsg(""),2000);return}const url=`https://wa.me/55${num}${msg?`?text=${encodeURIComponent(msg)}`:""}`;window.open(url,"_blank")};
  const sendOrcWA=(q)=>{
    const d=q.data;const c=d?.client||{};const inc=(d?.items||[]).filter(i=>i.on);
    const p=d?.pool||{};const pay2=d?.pay||{pixD:5,entPct:50,balPct:50,noFee:5,wFee:12,btcD:15};
    const tot=parseFloat(q.tot)||0;
    const clientName=(c.name||"Cliente").replace(/\s+/g,"_").replace(/[^\w\-]/g,"");
    const html=`<!DOCTYPE html><html><head><meta charset="utf-8"><style>*{margin:0;box-sizing:border-box;-webkit-print-color-adjust:exact!important}body{font-family:'Segoe UI',Arial,sans-serif;background:#fff;padding:16mm;font-size:13px;line-height:1.7;color:#111}@page{size:A4;margin:10mm}.hdr{background:#0a1f44;color:#fff;padding:16px 24px;border-radius:8px;text-align:center;margin-bottom:16px}.hdr h1{font-size:22px;color:#e8b100;margin:0}.info{background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:14px;margin-bottom:12px;font-size:13px}.tbl{width:100%;border-collapse:collapse;margin:12px 0}.tbl th{background:#0055a4;color:#fff;padding:6px 10px;text-align:left;font-size:11px}.tbl td{padding:5px 10px;border-bottom:1px solid #e2e8f0;font-size:12px}.tot{background:linear-gradient(135deg,#0055a4,#003d7a);color:#fff;border-radius:8px;padding:16px;text-align:center;font-size:26px;font-weight:800;margin:16px 0}.ft{text-align:center;font-size:10px;color:#888;margin-top:24px;border-top:1px solid #e2e8f0;padding-top:12px}</style></head><body>
<div class="hdr"><h1>VINIL VALE</h1><div style="font-size:11px;margin-top:4px">Revestimentos e Capas para Piscinas</div><div style="font-size:10px;opacity:.7;margin-top:2px">CNPJ: ${CO.cnpj} · ${CO.ph1} / ${CO.ph2}</div></div>
<div style="font-size:11px;text-align:right;color:#666;margin-bottom:8px">Proposta nº ${d?.propNum||"—"} · Válido por 15 dias</div>
<div class="info"><b>Cliente:</b> ${c.name||"—"}<br><b>Tel:</b> ${c.phone||"—"} · <b>Email:</b> ${c.email||"—"}<br><b>End:</b> ${c.address||"—"} – ${c.city||"—"}</div>
<div class="info"><b>Piscina:</b> ${p.length||0}×${p.width||0}×${p.depth||0}m · ${d?.poolFmt||""}<br><b>Vinil:</b> ACQUALINER ${d?.vinilT||""} · Resist. até 32°C${d?.stamp?` · <b>Estampa:</b> ${d.stamp}`:""}</div>
<div style="font-size:14px;font-weight:700;margin:14px 0 8px">Serviços Inclusos</div>
<table class="tbl"><tr><th>Item</th><th>Obs</th><th>Qtd</th></tr>${inc.map(i=>`<tr><td><b>${i.n}</b></td><td style="color:#666;font-style:italic">${i.nt||""}</td><td>${i.q>1?i.q+"x":"1"}</td></tr>`).join("")}</table>
<div class="tot">${fmt(tot)}</div>
<div class="info" style="font-size:12px"><b>Formas de Pagamento:</b><br>💚 Pix/Dinheiro: ${pay2.pixD}% desc. = <b>${fmt(tot*(1-pay2.pixD/100))}</b><br>💳 Cartão: até ${pay2.noFee}x s/juros<br>📋 Parcelado: ${pay2.entPct}% + ${pay2.balPct}%<br>₿ Bitcoin: ${pay2.btcD}% desc. = <b>${fmt(tot*(1-pay2.btcD/100))}</b></div>
<div style="margin-top:12px;font-size:12px"><b>Prazo de execução:</b> ${d?.execDays||"20"} dias úteis</div>
<div class="ft">${CO.name}<br>${CO.addr} · ${CO.ph1} / ${CO.ph2}<br>${CO.email} · ${CO.insta}</div>
<script>window.onload=function(){setTimeout(function(){window.print()},800)}<\/script></body></html>`;
    const blob=new Blob([html],{type:"text/html;charset=utf-8"});
    const url=URL.createObjectURL(blob);
    const a=document.createElement("a");a.href=url;a.download=`Orcamento_VinilVale_${clientName}.html`;a.style.display="none";
    document.body.appendChild(a);a.click();
    setTimeout(()=>{document.body.removeChild(a);URL.revokeObjectURL(url)},1000);
    setFbMsg("📥 PDF baixado! Agora clique 📱Zap p/ enviar");setTimeout(()=>setFbMsg(""),4000);
  };
  const msgWA=(q)=>{
    const c=q.data?.client||{};const tot=parseFloat(q.tot)||0;
    const msg=`Olá ${c.name||""}! 😊\n\nSegue seu orçamento da *Vinil Vale*:\n\n🏊 *${SVC.find(s=>s.id===q.type)?.label||"Serviço"}*\n📐 Piscina: ${q.ps}m\n${q.stamp?`🎨 Estampa: ${q.stamp}\n`:""}💰 *Valor: ${fmt(tot)}*\n\n📋 Proposta nº ${q.data?.propNum||""}\n⏰ Válido por 15 dias\n\n📎 *Segue o PDF em anexo!*\n\nQualquer dúvida estamos à disposição! 🤙`;
    openWA(c.phone,msg);
  };

  // Auth loading
  if(authLoading)return <div style={{display:"flex",justifyContent:"center",alignItems:"center",minHeight:"100vh",background:"#0a1f44"}}><div style={{textAlign:"center",color:"#fff"}}><div style={{fontSize:"32px",marginBottom:"12px"}}>🏊</div><div style={{fontSize:"18px",fontWeight:"700"}}>VINIL VALE</div><div style={{fontSize:"11px",opacity:.6,marginTop:"4px"}}>Carregando...</div></div></div>;

  // Login screen
  if(!user)return <div style={{display:"flex",justifyContent:"center",alignItems:"center",minHeight:"100vh",background:"linear-gradient(135deg,#001d3d,#0055a4 60%,#0077cc)",padding:"20px"}}>
    <div style={{background:"#fff",borderRadius:"16px",padding:"32px",maxWidth:"360px",width:"100%",boxShadow:"0 20px 60px rgba(0,0,0,.3)"}}>
      <div style={{textAlign:"center",marginBottom:"24px"}}><div style={{fontSize:"36px"}}>🏊</div><div style={{fontSize:"22px",fontWeight:"800",color:"#0a1f44",marginTop:"8px"}}>VINIL VALE</div><div style={{fontSize:"11px",color:"#666"}}>Sistema de Orçamentos v4.4</div></div>
      <div style={{display:"flex",gap:"8px",marginBottom:"16px"}}><button onClick={()=>setLM("login")} style={{flex:1,padding:"8px",borderRadius:"8px",border:"none",background:loginMode==="login"?"#0055a4":"#f1f5f9",color:loginMode==="login"?"#fff":"#666",fontWeight:"700",fontSize:"12px",cursor:"pointer"}}>Entrar</button><button onClick={()=>setLM("register")} style={{flex:1,padding:"8px",borderRadius:"8px",border:"none",background:loginMode==="register"?"#0055a4":"#f1f5f9",color:loginMode==="register"?"#fff":"#666",fontWeight:"700",fontSize:"12px",cursor:"pointer"}}>Criar Conta</button></div>
      <div style={{display:"flex",flexDirection:"column",gap:"10px"}}>
        <input value={loginEmail} onChange={e=>setLE(e.target.value)} placeholder="E-mail" type="email" style={{padding:"10px 14px",border:"1.5px solid #e2e8f0",borderRadius:"8px",fontSize:"14px",outline:"none"}}/>
        <input value={loginPass} onChange={e=>setLP(e.target.value)} placeholder="Senha" type="password" onKeyDown={e=>e.key==="Enter"&&(loginMode==="login"?doLogin():doRegister())} style={{padding:"10px 14px",border:"1.5px solid #e2e8f0",borderRadius:"8px",fontSize:"14px",outline:"none"}}/>
        {loginErr&&<div style={{fontSize:"11px",color:"#dc2626",background:"#fef2f2",padding:"8px",borderRadius:"6px"}}>{loginErr}</div>}
        <button onClick={loginMode==="login"?doLogin:doRegister} style={{padding:"12px",background:"linear-gradient(135deg,#0055a4,#003d7a)",color:"#fff",border:"none",borderRadius:"8px",fontSize:"14px",fontWeight:"700",cursor:"pointer"}}>{loginMode==="login"?"🔑 Entrar":"📝 Criar Conta"}</button>
        <div style={{display:"flex",alignItems:"center",gap:"10px",margin:"4px 0"}}><div style={{flex:1,height:"1px",background:"#e2e8f0"}}/><span style={{fontSize:"10px",color:"#999"}}>ou</span><div style={{flex:1,height:"1px",background:"#e2e8f0"}}/></div>
        <button onClick={doGoogle} style={{padding:"12px",background:"#fff",color:"#333",border:"1.5px solid #e2e8f0",borderRadius:"8px",fontSize:"13px",fontWeight:"600",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:"8px",width:"100%"}}>
          <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
          Entrar com Google
        </button>
      </div>
      <div style={{textAlign:"center",marginTop:"16px",fontSize:"10px",color:"#999"}}>Seus dados ficam sincronizados na nuvem ☁️</div>
    </div>
  </div>;



  if(view==="quote")return <QP d={gData()} onBack={()=>setView("editor")} onSave={()=>{const d=gData();const item={id:Date.now(),date:new Date().toLocaleDateString("pt-BR"),data:d,cN:client.name,cC:client.city,tot:String(total),ps:`${pool.length}x${pool.width}x${pool.depth}`,type:svcType,stamp,status:"lead"};const nh=[item,...hist];setHist(nh);saveLS(nh);saveFS(item)}}/>;

  const g2={display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px"};// use className="vv-g2" for responsive

  return(
    <div style={{fontFamily:"'Segoe UI',sans-serif",maxWidth:"920px",margin:"0 auto",background:t.bg,minHeight:"100vh",color:t.text,transition:"background .3s,color .3s"}}>
      <div style={{background:`linear-gradient(135deg,#001d3d,${blue} 60%,#0077cc)`,padding:"14px 18px",color:"#fff"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:"6px"}}>
          <div style={{display:"flex",alignItems:"center",gap:"10px"}}><div><div style={{fontSize:"17px",fontWeight:"800"}}>💧 VINIL VALE</div><div style={{fontSize:"9px",opacity:.7}}>{user?.email?.split("@")[0]} · {VER}</div></div><DarkToggle dark={dark} onToggle={()=>setDark(p=>!p)}/><button onClick={doLogout} style={{background:"rgba(255,255,255,.15)",border:"none",borderRadius:"6px",padding:"4px 8px",color:"#fff",fontSize:"9px",cursor:"pointer",fontWeight:"600"}}>Sair</button></div>
          <div style={{display:"flex",gap:"5px",alignItems:"center",flexWrap:"wrap"}}>
            {fbMsg&&<span style={{background:"rgba(255,255,255,.2)",padding:"4px 8px",borderRadius:"5px",fontSize:"10px",fontWeight:"600"}}>✅ {fbMsg}</span>}
            <Btn onClick={save} style={{background:"rgba(255,255,255,.12)",color:"#fff",border:"1px solid rgba(255,255,255,.25)"}}>💾 Salvar</Btn>
            <Btn onClick={()=>setView("quote")} style={{background:"#fff",color:blue,fontWeight:"700"}}>📄 Orçamento</Btn>
          </div>
        </div>
        <div style={{display:"flex",gap:"5px",marginTop:"10px",flexWrap:"wrap"}}>{SVC.map(sv=><button key={sv.id} onClick={()=>{setST2(sv.id);setItems(mkItems(sv.id));setG(mkG(sv.id));setCI(mkCI(sv.id));setED(sv.id==="construcao"?"60 a 90":sv.id==="reforma"?"30 a 45":"15 a 20")}} style={{padding:"5px 10px",borderRadius:"16px",border:"1.5px solid rgba(255,255,255,.3)",background:svcType===sv.id?"rgba(255,255,255,.2)":"transparent",color:"#fff",fontSize:"10px",fontWeight:svcType===sv.id?"700":"400",cursor:"pointer"}}>{sv.icon} {sv.label}</button>)}</div>
      </div>

      <div className="vv-tab-bar" style={{display:"flex",padding:"0 14px",background:t.tabBg,borderBottom:`1px solid ${t.cardBorder}`,overflowX:"auto"}}>
        {[["cliente","👤","Cliente",0],["piscina","🏊","Piscina",0],["itens","🛒","Custos",0],["garantias","🛡","Garantias",0],["pagamento","💰","Valor",0],["historico","📋","Salvos",0],["crm","📈","CRM",0],["estoque","📦","Estoque",lowStockCount],["planta","📐","Planta",0],["contratos","📝","Contratos",0]].map(([k,ic,lb,badge])=><Tab key={k} a={tab===k} onClick={()=>setTab(k)} icon={ic} badge={badge} t={t}>{lb}</Tab>)}
      </div>

      <div style={{padding:"14px"}}>
        {/* CLIENTE */}
        {tab==="cliente"&&<Card t={t}><ST icon="👤">Dados do Cliente</ST>
          <div style={{display:"flex",gap:"10px",marginBottom:"10px"}}><Inp label="Proposta" value={propNum} onChange={setPN} placeholder="03/26" style={{flex:"0 0 90px"}} t={t}/><Inp label="Nome completo *" value={client.name} onChange={v=>{uc("name")(v);if(v.trim())setFieldErrors(e=>({...e,clientName:false}))}} placeholder="Nome" style={{flex:1}} t={t} error={fieldErrors.clientName}/></div>
          <div className="vv-g2" style={g2}><Inp label="WhatsApp" value={client.phone} onChange={uc("phone")} placeholder="(13) 99999-9999" t={t}/><Inp label="Email" value={client.email} onChange={uc("email")} placeholder="email@email.com" t={t}/><Inp label="Endereço" value={client.address} onChange={uc("address")} placeholder="Rua, nº, bairro" t={t}/><Inp label="Cidade" value={client.city} onChange={uc("city")} placeholder="Registro-SP" t={t}/><Inp label="CPF/CNPJ" value={client.cpf} onChange={uc("cpf")} placeholder="000.000.000-00" t={t}/><Inp label="RG" value={client.rg} onChange={uc("rg")} t={t}/></div>
        </Card>}

        {/* PISCINA */}
        {tab==="piscina"&&<Card t={t}><ST icon="🏊">Piscina</ST>
          <div className="vv-pool-grid" style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:"10px"}}><Inp label="Comp. (m) *" value={pool.length} onChange={up("length")} t={t} error={fieldErrors.length}/><Inp label="Larg. (m) *" value={pool.width} onChange={up("width")} t={t} error={fieldErrors.width}/><Inp label="Prof. (m) *" value={pool.depth} onChange={up("depth")} t={t} error={fieldErrors.depth}/><Inp label="Raso (m)" value={pool.depthMin||""} onChange={up("depthMin")} t={t}/><Inp label="Fundo (m)" value={pool.depthMax||""} onChange={up("depthMax")} t={t}/></div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:"10px",marginTop:"10px"}}><Sel label="Formato" value={poolFmt} onChange={setPF} options={PFMT} t={t}/></div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"10px",marginTop:"10px"}}><Sel label="Vinil" value={vinilT} onChange={setVT} options={VOPTS.map(v=>({value:v.t,label:`${v.t} (${v.w}a)`}))} t={t}/><Sel label="Estampa" value={stamp} onChange={setSt} options={[{value:"",label:"— Escolha —"},...ALLST.map(s=>({value:s,label:s}))]} t={t}/><Inp label="Prazo (dias)" value={execDays} onChange={setED} t={t}/></div>

          {/* MODO PAREDES */}
          <div style={{marginTop:"14px",background:t.sectionBg,borderRadius:"8px",padding:"12px",border:`1px solid ${t.cardBorder}`}}>
            <div style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"8px"}}>
              <span style={{fontSize:"11px",fontWeight:"700",color:blue}}>📐 Cálculo das Paredes:</span>
              <button onClick={()=>setWM("regular")} style={{padding:"4px 10px",borderRadius:"14px",border:`1.5px solid ${wMode==="regular"?blue:"#cbd5e1"}`,background:wMode==="regular"?blue:"#fff",color:wMode==="regular"?"#fff":"#64748b",fontSize:"10px",fontWeight:"600",cursor:"pointer"}}>Esquadro (padrão)</button>
              <button onClick={()=>setWM("irregular")} style={{padding:"4px 10px",borderRadius:"14px",border:`1.5px solid ${wMode==="irregular"?blue:"#cbd5e1"}`,background:wMode==="irregular"?blue:"#fff",color:wMode==="irregular"?"#fff":"#64748b",fontSize:"10px",fontWeight:"600",cursor:"pointer"}}>Fora de Esquadro</button>
            </div>
            {wMode==="irregular"&&<div>
              <div style={{fontSize:"9px",color:t.textSec,marginBottom:"6px"}}>Defina cada parede com comprimento e altura diferentes:</div>
              {walls.map((w,i)=><div key={i} style={{display:"flex",gap:"6px",alignItems:"center",marginBottom:"4px"}}>
                <span style={{fontSize:"10px",fontWeight:"600",color:blue,minWidth:"30px"}}>P{i+1}</span>
                <Inp label="" value={w.l} onChange={v=>uWall(i,"l",v)} placeholder="Comp." style={{flex:1}} t={t}/>
                <span style={{fontSize:"10px",color:t.textMuted}}>×</span>
                <Inp label="" value={w.h} onChange={v=>uWall(i,"h",v)} placeholder="Alt." style={{flex:1}} t={t}/>
                <span style={{fontSize:"9px",color:t.textMuted}}>m</span>
                <span style={{fontSize:"10px",color:blue,fontWeight:"700"}}>{((parseFloat(w.l)||0)*(parseFloat(w.h)||0)).toFixed(1)}m²</span>
                {walls.length>2&&<button onClick={()=>rmWall(i)} style={{background:"none",border:"none",color:"#ef4444",cursor:"pointer",fontSize:"12px"}}>✕</button>}
              </div>)}
              <Btn onClick={addWall} style={{marginTop:"4px",fontSize:"9px"}}>+ Parede</Btn>
            </div>}
            {wMode==="regular"&&<div style={{fontSize:"10px",color:t.textSec}}>Paredes calculadas automaticamente: 2×({pool.length}×{pool.depth}) + 2×({pool.width}×{pool.depth})</div>}
          </div>

          {/* SPA */}
          <div style={{marginTop:"14px",background:spa.on?"#fef9e7":"#f8fafc",borderRadius:"8px",padding:"12px",border:`1px solid ${spa.on?gold+"55":"#e2e8f0"}`}}>
            <div style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:spa.on?"10px":"0"}}>
              <button onClick={()=>setSpa(p=>({...p,on:!p.on}))} style={{width:"36px",height:"20px",borderRadius:"10px",border:"none",background:spa.on?gold:"#cbd5e1",cursor:"pointer",position:"relative"}}><div style={{width:"16px",height:"16px",borderRadius:"50%",background:"#fff",position:"absolute",top:"2px",left:spa.on?"18px":"2px",transition:"left .2s",boxShadow:"0 1px 3px rgba(0,0,0,.2)"}}/></button>
              <span style={{fontSize:"11px",fontWeight:"700",color:blue}}>🌊 Spa Externo</span>
              {!spa.on&&<span style={{fontSize:"9px",color:t.textMuted}}>— Clique para adicionar</span>}
            </div>
            {spa.on&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"8px"}}><Inp label="Comp. Spa (m)" value={spa.length} onChange={uSpa("length")} t={t}/><Inp label="Larg. Spa (m)" value={spa.width} onChange={uSpa("width")} t={t}/><Inp label="Prof. Spa (m)" value={spa.depth} onChange={uSpa("depth")} t={t}/></div>}
          </div>

          {/* Stamp catalog */}
          {stamp===""&&<div style={{marginTop:"14px",background:t.sectionBg,borderRadius:"8px",padding:"12px",border:`1px solid ${t.cardBorder}`}}><div style={{fontSize:"11px",fontWeight:"700",color:blue,marginBottom:"8px"}}>🎨 Estampas ACQUALINER</div>{STAMPS.map((cat,ci2)=><div key={ci2} style={{marginBottom:"6px"}}><div style={{fontSize:"10px",fontWeight:"700",color:t.text,marginBottom:"3px"}}>{cat.c}</div><div style={{display:"flex",gap:"3px",flexWrap:"wrap"}}>{cat.i.map((s,si)=><button key={si} onClick={()=>setSt(s)} style={{padding:"3px 8px",borderRadius:"12px",border:"1.5px solid #c7d2fe",background:t.stampBg,color:blue,fontSize:"9px",fontWeight:"600",cursor:"pointer"}}>{s}</button>)}</div></div>)}</div>}
          {stamp&&<div style={{marginTop:"10px",background:t.stampBg,borderRadius:"8px",padding:"8px 10px",display:"flex",alignItems:"center",justifyContent:"space-between"}}><div><span style={{fontSize:"10px",color:t.textSec}}>Estampa:</span> <b style={{color:blue,fontSize:"13px"}}>{stamp}</b></div><Btn onClick={()=>setSt("")} style={{fontSize:"9px",padding:"3px 6px"}}>✕</Btn></div>}

          {/* SUMMARY */}
          <div style={{marginTop:"14px",background:t.areaBg,borderRadius:"10px",padding:"14px"}}>
            <div style={{display:"flex",justifyContent:"center",gap:"12px",flexWrap:"wrap",alignItems:"center"}}>
              <div style={{textAlign:"center"}}><div style={{fontSize:"15px",fontWeight:"800",color:blue}}>{pool.length}×{pool.width}×{pool.depth}m</div><div style={{fontSize:"8px",color:t.textSec}}>Piscina</div></div>
              <div style={{width:"1px",height:"24px",background:"#cbd5e1"}}/>
              <div style={{textAlign:"center"}}><div style={{fontSize:"15px",fontWeight:"800",color:blue}}>{ar.chao} m²</div><div style={{fontSize:"8px",color:t.textSec}}>Chão</div></div>
              <div style={{width:"1px",height:"24px",background:"#cbd5e1"}}/>
              <div style={{textAlign:"center"}}><div style={{fontSize:"15px",fontWeight:"800",color:blue}}>{ar.par} m²</div><div style={{fontSize:"8px",color:t.textSec}}>Paredes{wMode==="irregular"?" ⚠️":""}</div></div>
              {spa.on&&<><div style={{width:"1px",height:"24px",background:"#cbd5e1"}}/><div style={{textAlign:"center"}}><div style={{fontSize:"15px",fontWeight:"800",color:"#b45309"}}>{(parseFloat(ar.sChao)+parseFloat(ar.sPar)).toFixed(1)} m²</div><div style={{fontSize:"8px",color:t.textSec}}>Spa</div></div></>}
              <div style={{width:"1px",height:"24px",background:"#cbd5e1"}}/>
              <div style={{textAlign:"center",background:gold,borderRadius:"8px",padding:"4px 12px"}}><div style={{fontSize:"18px",fontWeight:"800",color:navy}}>{ar.tot} m²</div><div style={{fontSize:"8px",color:"#1a1a2e",fontWeight:"600"}}>Área Total</div></div>
              <div style={{width:"1px",height:"24px",background:"#cbd5e1"}}/>
              <div style={{textAlign:"center"}}><div style={{fontSize:"14px",fontWeight:"800",color:blue}}>{ar.perim} m</div><div style={{fontSize:"8px",color:t.textSec}}>Perímetro</div></div>
              <div style={{width:"1px",height:"24px",background:"#cbd5e1"}}/>
              <div style={{textAlign:"center"}}><div style={{fontSize:"14px",fontWeight:"800",color:blue}}>{ar.vol} m³</div><div style={{fontSize:"8px",color:t.textSec}}>Volume</div></div>
            </div>
          </div>

          <div style={{marginTop:"14px",background:t.sectionBg,borderRadius:"8px",padding:"12px",border:"1px solid "+t.cardBorder}}>
            <div style={{fontSize:"11px",fontWeight:"700",color:blue,marginBottom:"10px"}}>PLANTA HIDRAULICA</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"6px",marginBottom:"12px"}}>
              {[["retorno","Retorno","#ef4444"],["aspiracao","Aspiracao","#ec4899"],["dreno","Dreno Fundo","#8b5cf6"],["skimmer","Skimmer","#f59e0b"],["refletor","LED","#f97316"],["nivelador","Nivelador","#06b6d4"],["hidro","Hidro","#14b8a6"]].map(([k,lb,cor])=><div key={k} style={{display:"flex",alignItems:"center",gap:"4px",background:t.card,padding:"5px 8px",borderRadius:"6px",border:"1px solid "+t.cardBorder}}>
                <div style={{width:"8px",height:"4px",borderRadius:"1px",background:cor}}/>
                <span style={{fontSize:"8px",fontWeight:"600",color:t.text,flex:1}}>{lb}</span>
                <button onClick={()=>{setDisps(p=>({...p,[k]:Math.max(0,p[k]-1)}));setCustomPos(p=>{const n={...p};Object.keys(n).forEach(key=>{if(key.startsWith(k.substring(0,3)))delete n[key]});return n})}} style={{width:"16px",height:"16px",borderRadius:"3px",border:"none",background:"#fee2e2",color:"#dc2626",fontSize:"10px",cursor:"pointer",fontWeight:"700"}}>-</button>
                <span style={{fontSize:"10px",fontWeight:"800",color:t.text,minWidth:"14px",textAlign:"center"}}>{disps[k]}</span>
                <button onClick={()=>{setDisps(p=>({...p,[k]:p[k]+1}));setCustomPos(p=>{const n={...p};Object.keys(n).forEach(key=>{if(key.startsWith(k.substring(0,3)))delete n[key]});return n})}} style={{width:"16px",height:"16px",borderRadius:"3px",border:"none",background:"#dcfce7",color:"#16a34a",fontSize:"10px",cursor:"pointer",fontWeight:"700"}}>+</button>
              </div>)}
            </div>
            <PlantaView pool={pool} spa={spa} disps={disps} customPos={customPos} setCustomPos={setCustomPos} dragging={dragging} setDragging={setDragging} dark={dark} poolFmt={poolFmt} ar={ar} autoPositions={autoPositions} blue={blue} t={t} tubeOffsets={tubeOffsets} setTubeOffsets={setTubeOffsets} invertSide={invertSide}/>
          </div>
        </Card>}

        {/* ITENS */}
        {tab==="itens"&&<Card t={t}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"12px",flexWrap:"wrap",gap:"6px"}}><ST icon="🛒">Custos</ST><div style={{display:"flex",gap:"5px",alignItems:"center"}}><span style={{fontSize:"9px",color:t.textSec,fontWeight:"600"}}>Margem:</span><input value={gM} onChange={e=>setGM(parseFloat(e.target.value)||0)} style={{width:"38px",padding:"3px",border:`1px solid ${t.cardBorder}`,borderRadius:"4px",textAlign:"center",fontSize:"11px",fontWeight:"700"}}/><span style={{fontSize:"9px",color:t.text}}>%</span><Btn onClick={apM} style={{fontSize:"9px",padding:"3px 6px"}}>Aplicar</Btn></div></div>
          <div style={{display:"grid",gridTemplateColumns:"24px 1fr 50px 68px 44px 78px 24px",gap:"3px",padding:"4px 0",borderBottom:"2px solid #e2e8f0",fontSize:"7.5px",fontWeight:"700",color:t.textSec,textTransform:"uppercase"}}><div/><div>Item</div><div>Qtd</div><div>R$/un</div><div>%</div><div>Total</div><div/></div>
          {items.map(it=>{const eQ=it.un==="m²"?parseFloat(ar.tot)||0:it.un==="chao"?parseFloat(ar.chaoTot)||0:it.un==="ml"?parseFloat(ar.perim)||0:it.q||0;const sell=(it.c||0)*(1+(it.m||0)/100);const lt=eQ*sell;const unLabel=it.un==="m²"?"m²":it.un==="chao"?"chão":it.un==="ml"?"ml":"un";const unBg=it.un==="m²"?"#dbeafe":it.un==="chao"?"#d1fae5":it.un==="ml"?"#fef3c7":"";const unColor=it.un==="m²"?"#1e40af":it.un==="chao"?"#065f46":it.un==="ml"?"#92400e":"";return(
            <div key={it.id} style={{display:"grid",gridTemplateColumns:"24px 1fr 50px 68px 44px 78px 24px",gap:"3px",padding:"4px 0",borderBottom:`1px solid ${t.cardBorder}`,alignItems:"center",opacity:it.on?1:.35}}>
              <button onClick={()=>ti(it.id)} style={{width:"16px",height:"16px",borderRadius:"3px",border:`2px solid ${it.on?blue:"#cbd5e1"}`,background:it.on?blue:"#fff",color:"#fff",fontSize:"9px",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>{it.on?"✓":""}</button>
              <div><input value={it.n} onChange={e=>ui(it.id,"n",e.target.value)} style={{border:"none",fontSize:"11px",fontWeight:"600",width:"100%",outline:"none",background:"transparent",color:t.text}}/><div style={{display:"flex",alignItems:"center",gap:"4px"}}><input value={it.nt||""} onChange={e=>ui(it.id,"nt",e.target.value)} placeholder="obs" style={{border:"none",fontSize:"9px",color:t.textMuted,width:"calc(100% - 35px)",outline:"none",fontStyle:"italic",background:"transparent",color:t.textMuted}}/>{it.un!=="un"&&<span style={{fontSize:"7px",background:unBg,color:unColor,padding:"1px 4px",borderRadius:"3px",fontWeight:"700",whiteSpace:"nowrap"}}>{unLabel}</span>}</div></div>
              {it.un==="un"?<input value={it.q} onChange={e=>ui(it.id,"q",parseInt(e.target.value)||0)} style={{width:"100%",padding:"2px",border:`1px solid ${t.cardBorder}`,borderRadius:"3px",textAlign:"center",fontSize:"10px",background:t.inputBg,color:t.text}}/>:<div style={{fontSize:"9px",color:blue,fontWeight:"700",textAlign:"center"}}>{eQ.toFixed(1)}</div>}
              <input value={it.c} onChange={e=>ui(it.id,"c",parseFloat(e.target.value)||0)} type="number" step="0.01" style={{width:"100%",padding:"2px",border:`1px solid ${t.cardBorder}`,borderRadius:"3px",textAlign:"right",fontSize:"10px",background:t.inputBg,color:t.text}}/>
              <div style={{display:"flex",alignItems:"center"}}><input value={it.m} onChange={e=>ui(it.id,"m",parseFloat(e.target.value)||0)} style={{width:"28px",padding:"2px",border:`1px solid ${t.cardBorder}`,borderRadius:"3px",textAlign:"center",fontSize:"10px",background:t.inputBg,color:t.text}}/><span style={{fontSize:"8px",color:t.textMuted}}>%</span></div>
              <div style={{fontSize:"10px",fontWeight:"600",color:blue,textAlign:"right"}}>{fmt(lt)}</div>
              <button onClick={()=>ri(it.id)} style={{background:"none",border:"none",color:"#ef4444",cursor:"pointer",fontSize:"11px"}}>✕</button>
            </div>
          )})}
          <div style={{display:"flex",gap:"5px",marginTop:"10px"}}><Btn onClick={()=>setCatO(!catO)} style={{background:blue,color:"#fff",border:"none"}}>📦 Catálogo</Btn><Btn onClick={addM}>+ Manual</Btn></div>
          {catO&&<div style={{marginTop:"10px",background:t.sectionBg,borderRadius:"8px",padding:"10px",border:`1px solid ${t.cardBorder}`}}><input value={catQ} onChange={e=>setCatQ(e.target.value)} placeholder="Buscar..." style={{width:"100%",padding:"6px 8px",border:"1.5px solid #e2e8f0",borderRadius:"5px",fontSize:"11px",marginBottom:"8px",outline:"none",background:t.inputBg,color:t.text}}/><div style={{maxHeight:"200px",overflow:"auto"}}>{CAT.filter(p=>!catQ||p.n.toLowerCase().includes(catQ.toLowerCase())||p.c.toLowerCase().includes(catQ.toLowerCase())).map(p=><div key={p.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"4px 6px",background:t.card,borderRadius:"4px",border:`1px solid ${t.cardBorder}`,marginBottom:"2px"}}><div><span style={{fontSize:"7px",background:t.stampBg,color:blue,padding:"1px 4px",borderRadius:"3px",fontWeight:"600",marginRight:"3px"}}>{p.c}</span><span onClick={()=>{const nn=prompt("Editar nome:",p.n);if(nn&&nn!==p.n){const idx=CAT.findIndex(x=>x.id===p.id);if(idx>=0)CAT[idx].n=nn;setFbMsg("Nome editado (temporario)");setTimeout(()=>setFbMsg(""),2000)}}} style={{fontSize:"11px",fontWeight:"600",color:t.text,cursor:"pointer"}} title="Clique para editar">{p.n}</span>{p.un!=="un"&&<span style={{fontSize:"7px",background:p.un==="m²"?"#dbeafe":"#fef3c7",color:p.un==="m²"?"#1e40af":"#92400e",padding:"1px 4px",borderRadius:"3px",fontWeight:"700",marginLeft:"4px"}}>/{p.un}</span>}<div style={{fontSize:"9px",color:t.textMuted}}>{p.s}</div></div><div style={{display:"flex",alignItems:"center",gap:"5px"}}><span style={{fontSize:"11px",fontWeight:"700",color:blue}}>{fmt(p.p)}{p.un!=="un"?"/"+p.un:""}</span><Btn onClick={()=>addC(p)} style={{fontSize:"9px",padding:"2px 5px",background:blue,color:"#fff",border:"none"}}>+</Btn></div></div>)}</div></div>}
          <div style={{marginTop:"14px",borderTop:"2px solid #e2e8f0",paddingTop:"12px",display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"8px"}}>
            <div style={{background:"#fef2f2",borderRadius:"8px",padding:"10px",textAlign:"center",border:"1px solid #fecaca"}}><div style={{fontSize:"8px",color:"#991b1b",fontWeight:"600",textTransform:"uppercase"}}>Custo</div><div style={{fontSize:"16px",fontWeight:"800",color:"#dc2626"}}>{fmt(matC)}</div></div>
            <div style={{background:"#f0fdf4",borderRadius:"8px",padding:"10px",textAlign:"center",border:"1px solid #bbf7d0"}}><div style={{fontSize:"8px",color:"#166534",fontWeight:"600",textTransform:"uppercase"}}>Venda</div><div style={{fontSize:"16px",fontWeight:"800",color:"#16a34a"}}>{fmt(matS)}</div></div>
            <div style={{background:"#eff6ff",borderRadius:"8px",padding:"10px",textAlign:"center",border:"1px solid #bfdbfe"}}><div style={{fontSize:"8px",color:"#1e40af",fontWeight:"600",textTransform:"uppercase"}}>Lucro</div><div style={{fontSize:"16px",fontWeight:"800",color:"#2563eb"}}>{fmt(matS-matC)}</div></div>
          </div>
          <div style={{marginTop:"16px",borderTop:"1px solid #e2e8f0",paddingTop:"12px"}}><ST icon="⚠️">Por conta do cliente</ST>
            {ci.map((c,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:"5px",padding:"3px 0",borderBottom:`1px solid ${t.cardBorder}`}}><span style={{color:"#f59e0b"}}>▸</span><span style={{flex:1,fontSize:"11px",color:t.text}}>{c}</span><button onClick={()=>setCI(p=>p.filter((_,x)=>x!==i))} style={{background:"none",border:"none",color:"#ef4444",cursor:"pointer"}}>✕</button></div>)}
            <div style={{display:"flex",gap:"5px",marginTop:"5px"}}><input value={newCI} onChange={e=>setNCI(e.target.value)} placeholder="Adicionar..." onKeyDown={e=>{if(e.key==="Enter"&&newCI.trim()){setCI(p=>[...p,newCI.trim()]);setNCI("")}}} style={{flex:1,padding:"5px 7px",border:"1.5px solid #e2e8f0",borderRadius:"5px",fontSize:"10px",outline:"none",background:t.inputBg,color:t.text}}/><Btn onClick={()=>{if(newCI.trim()){setCI(p=>[...p,newCI.trim()]);setNCI("")}}}>+</Btn></div>
          </div>
        </Card>}

        {/* GARANTIAS */}
        {tab==="garantias"&&<Card t={t}><ST icon="🛡">Garantias</ST>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(130px,1fr))",gap:"10px"}}>{guar.map(g=>(
            <div key={g.id} style={{textAlign:"center",background:g.on?"linear-gradient(135deg,#edf2ff,#f0f4ff)":"#f9fafb",borderRadius:"10px",padding:"12px",border:`1.5px solid ${g.on?"#93c5fd":"#e5e7eb"}`,opacity:g.on?1:.5}}>
              <button onClick={()=>setG(p=>p.map(gg=>gg.id===g.id?{...gg,on:!gg.on}:gg))} style={{background:g.on?blue:"#d1d5db",color:"#fff",border:"none",borderRadius:"8px",padding:"1px 7px",fontSize:"8px",cursor:"pointer",marginBottom:"4px"}}>{g.on?"Ativo":"Off"}</button>
              <div style={{fontSize:"26px",fontWeight:"800",color:blue}}>{g.y}</div><div style={{fontSize:"9px",color:t.textSec}}>anos</div>
              <input value={g.it} onChange={e=>setG(p=>p.map(gg=>gg.id===g.id?{...gg,it:e.target.value}:gg))} style={{marginTop:"3px",textAlign:"center",border:`1px solid ${t.cardBorder}`,borderRadius:"4px",padding:"2px",fontSize:"10px",width:"100%",fontWeight:"600",background:t.inputBg,color:t.text}}/>
              <div style={{display:"flex",justifyContent:"center",gap:"3px",marginTop:"4px"}}><Btn onClick={()=>setG(p=>p.map(gg=>gg.id===g.id?{...gg,y:Math.max(1,gg.y-1)}:gg))}>−</Btn><Btn onClick={()=>setG(p=>p.map(gg=>gg.id===g.id?{...gg,y:gg.y+1}:gg))}>+</Btn></div>
            </div>
          ))}</div>
        </Card>}

        {/* PAGAMENTO */}
        {tab==="pagamento"&&<Card t={t}><ST icon="💰">Valor Final</ST>
          <div style={g2}>
            <div style={{background:"#fefce8",borderRadius:"8px",padding:"12px",border:"1.5px solid #fde68a"}}><div style={{fontSize:"9px",fontWeight:"700",color:"#92400e",marginBottom:"4px"}}>🔨 MÃO DE OBRA</div><div style={{display:"flex",alignItems:"center",gap:"3px"}}><span style={{fontSize:"12px",color:"#92400e"}}>R$</span><input value={mo} onChange={e=>setMO(e.target.value.replace(/[^\d]/g,""))} style={{flex:1,padding:"5px",border:"1.5px solid #fde68a",borderRadius:"5px",fontSize:"16px",fontWeight:"700",textAlign:"center",outline:"none",background:"#fffbeb",color:"#92400e"}}/></div></div>
            <div style={{background:`linear-gradient(135deg,${blue},#003d7a)`,borderRadius:"8px",padding:"12px",color:"#fff",textAlign:"center"}}><div style={{fontSize:"8px",textTransform:"uppercase",letterSpacing:"1px",opacity:.8}}>Total Calculado</div><div style={{fontSize:"22px",fontWeight:"800"}}>{fmt(tCalc)}</div><div style={{fontSize:"8px",opacity:.6}}>Material + M.O.</div></div>
          </div>
          <div style={{background:"#faf5ff",borderRadius:"8px",padding:"10px",border:"1.5px solid #e9d5ff",marginTop:"12px",marginBottom:"14px"}}><div style={{fontSize:"9px",fontWeight:"700",color:"#7e22ce",marginBottom:"4px"}}>✏️ VALOR FINAL (sobrescrever)</div><div style={{display:"flex",alignItems:"center",gap:"4px"}}><span style={{fontSize:"12px",color:"#7e22ce"}}>R$</span><input value={totOv} onChange={e=>setTO(e.target.value.replace(/[^\d.,]/g,""))} placeholder={String(Math.round(tCalc))} style={{flex:1,padding:"6px",border:"1.5px solid #e9d5ff",borderRadius:"5px",fontSize:"20px",fontWeight:"800",textAlign:"center",outline:"none",color:"#7e22ce",background:"#faf5ff"}}/></div><div style={{fontSize:"8px",color:t.textMuted,textAlign:"center",marginTop:"3px"}}>Vazio = calculado</div></div>
          <div style={g2}>
            <div style={{background:"#f0fdf4",borderRadius:"8px",padding:"10px",border:"1.5px solid #86efac"}}><div style={{fontSize:"10px",fontWeight:"700",color:"#166534",marginBottom:"5px"}}>🟢 Pix</div><div style={{display:"flex",alignItems:"center",gap:"3px"}}><input value={pay.pixD} onChange={e=>setPay(p=>({...p,pixD:parseFloat(e.target.value)||0}))} style={{width:"35px",padding:"2px",border:`1px solid ${t.cardBorder}`,borderRadius:"3px",textAlign:"center",fontSize:"11px",fontWeight:"700",background:"#fff",color:"#111"}}/><span style={{fontSize:"9px",color:t.text}}>%</span></div><div style={{fontSize:"14px",fontWeight:"800",color:blue,marginTop:"3px"}}>{fmt(total*(1-pay.pixD/100))}</div></div>
            <div style={{background:"#fefce8",borderRadius:"8px",padding:"10px",border:"1.5px solid #fde68a"}}><div style={{fontSize:"10px",fontWeight:"700",color:"#92400e",marginBottom:"5px"}}>🟡 Parcelado</div><div style={{display:"flex",alignItems:"center",gap:"3px"}}><input value={pay.entPct} onChange={e=>{const v=parseFloat(e.target.value)||0;setPay(p=>({...p,entPct:v,balPct:100-v}))}} style={{width:"35px",padding:"2px",border:`1px solid ${t.cardBorder}`,borderRadius:"3px",textAlign:"center",fontSize:"11px",fontWeight:"700",background:"#fff",color:"#111"}}/><span style={{fontSize:"9px",color:t.text}}>%+{pay.balPct}%</span></div><div style={{fontSize:"11px",color:"#78350f",marginTop:"3px"}}>{fmt(total*pay.entPct/100)}+{fmt(total*pay.balPct/100)}</div></div>
            <div style={{background:"#eef2ff",borderRadius:"8px",padding:"10px",border:"1.5px solid #c7d2fe"}}><div style={{fontSize:"10px",fontWeight:"700",color:"#3730a3",marginBottom:"5px"}}>🔵 Cartão</div><div style={{display:"flex",alignItems:"center",gap:"3px",marginBottom:"2px"}}><input value={pay.noFee} onChange={e=>setPay(p=>({...p,noFee:parseInt(e.target.value)||0}))} style={{width:"28px",padding:"2px",border:`1px solid ${t.cardBorder}`,borderRadius:"3px",textAlign:"center",fontSize:"11px",fontWeight:"700",background:"#fff",color:"#111"}}/><span style={{fontSize:"9px",color:t.text}}>x s/juros</span></div><div style={{display:"flex",alignItems:"center",gap:"3px"}}><input value={pay.wFee} onChange={e=>setPay(p=>({...p,wFee:parseInt(e.target.value)||0}))} style={{width:"28px",padding:"2px",border:`1px solid ${t.cardBorder}`,borderRadius:"3px",textAlign:"center",fontSize:"11px",fontWeight:"700",background:"#fff",color:"#111"}}/><span style={{fontSize:"9px",color:t.text}}>x c/juros</span></div></div>
            <div style={{background:"#fdf4ff",borderRadius:"8px",padding:"10px",border:"1.5px solid #e9d5ff"}}><div style={{fontSize:"10px",fontWeight:"700",color:"#7e22ce",marginBottom:"5px"}}>🟣 Bitcoin</div><div style={{display:"flex",alignItems:"center",gap:"3px"}}><input value={pay.btcD} onChange={e=>setPay(p=>({...p,btcD:parseFloat(e.target.value)||0}))} style={{width:"35px",padding:"2px",border:`1px solid ${t.cardBorder}`,borderRadius:"3px",textAlign:"center",fontSize:"11px",fontWeight:"700",background:"#fff",color:"#111"}}/><span style={{fontSize:"9px",color:t.text}}>%</span></div><div style={{fontSize:"14px",fontWeight:"800",color:"#7e22ce",marginTop:"3px"}}>{fmt(total*(1-pay.btcD/100))}</div></div>
          </div>
        </Card>}

        {/* HISTÓRICO - LEADS vs CLIENTES */}
        {tab==="historico"&&<Card t={t}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"12px"}}><ST icon="📋">Orçamentos</ST>{hist.length>0&&<Btn onClick={exportCSV} style={{fontSize:"9px",padding:"4px 10px",background:"#16a34a",color:"#fff",border:"none"}}>📊 Exportar CSV</Btn>}</div>
          {hist.length===0?<div style={{textAlign:"center",padding:"24px",color:t.textMuted}}><div style={{fontSize:"28px"}}>📭</div><div style={{fontSize:"11px"}}>Nenhum salvo.</div></div>:<>
          {/* LEADS */}
          <div style={{marginBottom:"16px"}}>
            <div style={{display:"flex",alignItems:"center",gap:"6px",marginBottom:"8px"}}><span style={{fontSize:"16px"}}>📊</span><span style={{fontSize:"12px",fontWeight:"700",color:"#f59e0b"}}>Leads / Orçamentos ({hist.filter(q=>!["cliente","fechou","execucao","concluido"].includes(q.status)).length})</span></div>
            {hist.filter(q=>!["cliente","fechou","execucao","concluido"].includes(q.status)).length===0?<div style={{fontSize:"10px",color:t.textMuted,padding:"8px",textAlign:"center"}}>Nenhum lead</div>:
            <div style={{display:"flex",flexDirection:"column",gap:"4px"}}>{hist.filter(q=>!["cliente","fechou","execucao","concluido"].includes(q.status)).map(q=>(
              <div key={q.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 10px",background:t.sectionBg,borderRadius:"7px",border:`1.5px solid ${t.cardBorder}`,borderLeft:"3px solid #f59e0b"}}>
                <div onClick={()=>load(q)} style={{flex:1,cursor:"pointer"}}><div style={{fontSize:"11px",fontWeight:"700",color:t.text}}>{q.cN||"Sem nome"} {q.stamp?`· ${q.stamp}`:""}</div><div style={{fontSize:"8.5px",color:t.textMuted}}>{q.date} · {SVC.find(s=>s.id===q.type)?.label} · {q.ps}m · {q.cC}</div></div>
                <div style={{display:"flex",alignItems:"center",gap:"5px"}}><div style={{fontSize:"13px",fontWeight:"800",color:blue}}>{fmt(parseFloat(q.tot)||0)}</div>
                  <Btn onClick={()=>sendOrcWA(q)} style={{fontSize:"8px",padding:"3px 7px",background:"#128c7e",color:"#fff",border:"none"}}>📨 PDF</Btn>
                  <Btn onClick={()=>msgWA(q)} style={{fontSize:"8px",padding:"3px 7px",background:"#25d366",color:"#fff",border:"none"}}>📱 Zap</Btn>
                  <Btn onClick={()=>toClient(q.id)} style={{fontSize:"8px",padding:"3px 7px",background:"#16a34a",color:"#fff",border:"none"}}>✅ Fechou</Btn>
                  <Btn onClick={()=>load(q)} style={{fontSize:"8px",padding:"3px 5px",background:blue,color:"#fff",border:"none"}}>Abrir</Btn>
                  <button onClick={e=>{e.stopPropagation();delQ(q.id)}} style={{background:"none",border:"none",color:"#ef4444",cursor:"pointer",fontSize:"12px"}}>🗑</button>
                </div>
              </div>
            ))}</div>}
          </div>
          {/* CLIENTES */}
          <div>
            <div style={{display:"flex",alignItems:"center",gap:"6px",marginBottom:"8px"}}><span style={{fontSize:"16px"}}>🤝</span><span style={{fontSize:"12px",fontWeight:"700",color:"#16a34a"}}>Clientes Fechados ({hist.filter(q=>["cliente","fechou","execucao","concluido"].includes(q.status)).length})</span></div>
            {hist.filter(q=>["cliente","fechou","execucao","concluido"].includes(q.status)).length===0?<div style={{fontSize:"10px",color:t.textMuted,padding:"8px",textAlign:"center"}}>Nenhum cliente fechado</div>:
            <div style={{display:"flex",flexDirection:"column",gap:"4px"}}>{hist.filter(q=>["cliente","fechou","execucao","concluido"].includes(q.status)).map(q=>(
              <div key={q.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 10px",background:t.sectionBg,borderRadius:"7px",border:`1.5px solid ${t.cardBorder}`,borderLeft:"3px solid #16a34a"}}>
                <div onClick={()=>load(q)} style={{flex:1,cursor:"pointer"}}><div style={{fontSize:"11px",fontWeight:"700",color:t.text}}>🤝 {q.cN||"Sem nome"} {q.stamp?`· ${q.stamp}`:""}</div><div style={{fontSize:"8.5px",color:t.textMuted}}>{q.date} · Fechou: {q.closedDate||"—"} · {q.ps}m · {q.cC}</div><div style={{fontSize:"8px",color:t.textMuted}}>CPF: {q.data?.client?.cpf||"—"} · RG: {q.data?.client?.rg||"—"} · Tel: {q.data?.client?.phone||"—"}</div></div>
                <div style={{display:"flex",alignItems:"center",gap:"5px"}}><div style={{fontSize:"13px",fontWeight:"800",color:"#16a34a"}}>{fmt(parseFloat(q.tot)||0)}</div>
                  <Btn onClick={()=>{setVC(q);initCE(q);setTab("contratos")}} style={{fontSize:"8px",padding:"3px 7px",background:"#7c3aed",color:"#fff",border:"none"}}>📝 Contrato</Btn>
                  <Btn onClick={()=>toBack(q.id)} style={{fontSize:"8px",padding:"3px 5px",background:"#f59e0b",color:"#fff",border:"none"}}>↩ Lead</Btn>
                  <Btn onClick={()=>load(q)} style={{fontSize:"8px",padding:"3px 5px",background:blue,color:"#fff",border:"none"}}>Abrir</Btn>
                </div>
              </div>
            ))}</div>}
          </div>
          </>}
        </Card>}

        {/* CRM */}
        {tab==="crm"&&<Card t={t}>{(()=>{
          const activePipe=PIPE.filter(p=>p.id!=="perdido");
          const fechados=hist.filter(q=>["fechou","execucao","concluido"].includes(q.status));
          const ativos=hist.filter(q=>!["concluido","perdido"].includes(q.status));
          const perdidos=hist.filter(q=>q.status==="perdido");
          const receita=fechados.reduce((s,q)=>s+(parseFloat(q.tot)||0),0);
          const txConv=hist.length>0?Math.round((fechados.length/hist.length)*100):0;
          const ticketMedio=fechados.length>0?receita/fechados.length:0;
          const followUps=hist.filter(q=>needsFollowUp(q.id,q.status||"lead"));
          const overdueNC=Object.keys(crmNextContact).filter(id=>isNextContactOverdue(id)&&hist.find(q=>q.id==id&&!["concluido","perdido"].includes(q.status)));

          const filteredHist=hist.filter(q=>{
            if(!crmShowLost&&q.status==="perdido")return false;
            if(crmSearch&&!q.cN?.toLowerCase().includes(crmSearch.toLowerCase())&&!q.data?.client?.city?.toLowerCase().includes(crmSearch.toLowerCase()))return false;
            if(crmSvcF!=="todos"&&q.type!==crmSvcF)return false;
            return true;
          });

          const notePanelProps={t,crmNoteType,setCrmNoteType,noteInputRef:crmNoteInputRef,newNote,setNewNote,addInteracao,crmNextContact,isNextContactOverdue,setNextContact,crmTags,setLeadTag,interacoes};

          return <>
          {/* HEADER */}
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"14px",flexWrap:"wrap",gap:"8px"}}>
            <div style={{fontSize:"14px",fontWeight:"800",color:blue}}>📈 CRM — Pipeline de Vendas</div>
            <div style={{display:"flex",gap:"4px"}}>
              {[["pipeline","🗂️","Pipeline"],["lista","☰","Lista"],["dashboard","📊","Analytics"]].map(([k,ic,lb])=><button key={k} onClick={()=>setCrmView(k)} style={{padding:"5px 10px",borderRadius:"6px",border:`1.5px solid ${crmView===k?blue:t.cardBorder}`,background:crmView===k?blue:"transparent",color:crmView===k?"#fff":t.textSec,fontSize:"9px",fontWeight:"700",cursor:"pointer"}}>{ic} {lb}</button>)}
            </div>
          </div>

          {hist.length===0?<div style={{textAlign:"center",padding:"32px",color:t.textMuted}}><div style={{fontSize:"40px"}}>📈</div><div style={{fontSize:"12px",marginTop:"8px"}}>Salve orçamentos para gerenciar no CRM</div></div>:<>

          {/* ── ANALYTICS ── */}
          {crmView==="dashboard"&&<>
            {/* KPIs */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"8px",marginBottom:"14px"}}>
              {[
                {label:"Total",val:hist.length,color:blue,bg:"linear-gradient(135deg,#0055a4,#003d7a)"},
                {label:"Ativos",val:ativos.length,color:"#f97316",bg:"linear-gradient(135deg,#f97316,#ea580c)"},
                {label:"Fechados",val:fechados.length,color:"#16a34a",bg:"linear-gradient(135deg,#16a34a,#15803d)"},
                {label:"Conversão",val:txConv+"%",color:"#8b5cf6",bg:"linear-gradient(135deg,#8b5cf6,#7c3aed)"},
                {label:"Ticket Médio",val:fmt(ticketMedio),color:"#f59e0b",bg:"linear-gradient(135deg,#f59e0b,#d97706)"},
                {label:"Follow-up",val:followUps.length+(overdueNC.length>0?"  ⏰"+overdueNC.length:""),color:"#dc2626",bg:"linear-gradient(135deg,#dc2626,#991b1b)"},
              ].map((k,i)=><div key={i} style={{borderRadius:"10px",padding:"12px",color:"#fff",background:k.bg}}><div style={{fontSize:"18px",fontWeight:"800"}}>{k.val}</div><div style={{fontSize:"8px",opacity:.85,marginTop:"2px",fontWeight:"600",textTransform:"uppercase",letterSpacing:".5px"}}>{k.label}</div></div>)}
            </div>
            {/* Receita total */}
            <div style={{background:"linear-gradient(135deg,#001d3d,#0055a4)",borderRadius:"10px",padding:"14px",marginBottom:"14px",color:"#fff",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div><div style={{fontSize:"9px",opacity:.7,fontWeight:"600",textTransform:"uppercase",letterSpacing:"1px"}}>Receita Total Fechada</div><div style={{fontSize:"26px",fontWeight:"800"}}>{fmt(receita)}</div></div>
              <div style={{textAlign:"right"}}><div style={{fontSize:"9px",opacity:.7}}>Perdidos</div><div style={{fontSize:"16px",fontWeight:"700",color:"#fca5a5"}}>{perdidos.length} leads</div></div>
            </div>
            {/* Funil */}
            <div style={{background:t.sectionBg,borderRadius:"10px",padding:"12px",border:`1px solid ${t.cardBorder}`,marginBottom:"14px"}}>
              <div style={{fontSize:"11px",fontWeight:"700",color:t.text,marginBottom:"10px"}}>Funil de Vendas</div>
              {activePipe.map(stage=>{const cnt=hist.filter(q=>(q.status||"lead")===stage.id).length;const pct=hist.length>0?Math.round((cnt/hist.length)*100):0;const val=hist.filter(q=>(q.status||"lead")===stage.id).reduce((s,q)=>s+(parseFloat(q.tot)||0),0);return <div key={stage.id} style={{marginBottom:"6px"}}><div style={{display:"flex",justifyContent:"space-between",fontSize:"9px",marginBottom:"2px"}}><span style={{fontWeight:"700",color:stage.color}}>{stage.icon} {stage.label}</span><span style={{color:t.textSec}}>{cnt} leads · {fmt(val)}</span></div><div style={{height:"10px",background:t.cardBorder,borderRadius:"5px",overflow:"hidden"}}><div style={{height:"100%",width:pct+"%",background:stage.color,borderRadius:"5px",transition:"width .5s"}}/></div></div>})}
            </div>
            {/* Por tipo de serviço */}
            <div style={{background:t.sectionBg,borderRadius:"10px",padding:"12px",border:`1px solid ${t.cardBorder}`,marginBottom:"14px"}}>
              <div style={{fontSize:"11px",fontWeight:"700",color:t.text,marginBottom:"10px"}}>Receita por Tipo de Serviço</div>
              {SVC.map(sv=>{const items=fechados.filter(q=>q.type===sv.id);const val=items.reduce((s,q)=>s+(parseFloat(q.tot)||0),0);const pct=receita>0?Math.round((val/receita)*100):0;return <div key={sv.id} style={{marginBottom:"6px"}}><div style={{display:"flex",justifyContent:"space-between",fontSize:"9px",marginBottom:"2px"}}><span style={{fontWeight:"600",color:t.text}}>{sv.icon} {sv.label}</span><span style={{color:t.textSec}}>{items.length}x · {fmt(val)} ({pct}%)</span></div><div style={{height:"8px",background:t.cardBorder,borderRadius:"4px",overflow:"hidden"}}><div style={{height:"100%",width:pct+"%",background:blue,borderRadius:"4px"}}/></div></div>})}
            </div>
            {/* Top cidades */}
            <div style={{background:t.sectionBg,borderRadius:"10px",padding:"12px",border:`1px solid ${t.cardBorder}`}}>
              <div style={{fontSize:"11px",fontWeight:"700",color:t.text,marginBottom:"10px"}}>Top Cidades</div>
              {(()=>{const cc={};hist.forEach(q=>{const c=q.data?.client?.city||q.cC||"Não informada";cc[c]=(cc[c]||0)+1});return Object.entries(cc).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([c,n])=><div key={c} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"4px 0",borderBottom:`1px solid ${t.cardBorder}`}}><span style={{fontSize:"10px",fontWeight:"600",color:t.text}}>📍 {c}</span><span style={{fontSize:"10px",fontWeight:"800",color:blue,background:blue+"15",padding:"1px 7px",borderRadius:"9px"}}>{n}</span></div>)})()}
            </div>
          </>}

          {/* ── PIPELINE ── */}
          {crmView==="pipeline"&&<>
            {/* Filtros */}
            <div style={{display:"flex",gap:"6px",marginBottom:"10px",flexWrap:"wrap",alignItems:"center"}}>
              <input value={crmSearch} onChange={e=>setCrmSearch(e.target.value)} placeholder="🔍 Buscar cliente ou cidade..." style={{flex:1,minWidth:"140px",padding:"6px 10px",border:`1.5px solid ${t.cardBorder}`,borderRadius:"6px",fontSize:"10px",background:t.inputBg,color:t.text,outline:"none"}}/>
              <select value={crmSvcF} onChange={e=>setCrmSvcF(e.target.value)} style={{padding:"6px 8px",border:`1.5px solid ${t.cardBorder}`,borderRadius:"6px",fontSize:"9px",background:t.inputBg,color:t.text}}>
                <option value="todos">Todos serviços</option>
                {SVC.map(sv=><option key={sv.id} value={sv.id}>{sv.label}</option>)}
              </select>
              <button onClick={()=>setCrmShowLost(p=>!p)} style={{padding:"6px 10px",borderRadius:"6px",border:`1.5px solid ${crmShowLost?"#dc2626":t.cardBorder}`,background:crmShowLost?"#fef2f2":"transparent",color:crmShowLost?"#dc2626":t.textSec,fontSize:"9px",fontWeight:"700",cursor:"pointer"}}>❌ Perdidos</button>
            </div>
            {/* Follow-up banner */}
            {(followUps.length>0||overdueNC.length>0)&&<div style={{background:"#fef2f2",borderRadius:"8px",padding:"8px 12px",marginBottom:"10px",border:"1px solid #fecaca",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <span style={{fontSize:"10px",fontWeight:"700",color:"#dc2626"}}>⚠️ {followUps.length} leads precisam de follow-up{overdueNC.length>0?` · ${overdueNC.length} contatos atrasados`:""}</span>
              <button onClick={()=>{setCrmSearch("");setCrmSvcF("todos")}} style={{fontSize:"8px",background:"none",border:"none",color:"#dc2626",cursor:"pointer",fontWeight:"700"}}>Ver todos</button>
            </div>}
            {/* Pipeline columns */}
            <div style={{display:"flex",gap:"8px",overflowX:"auto",paddingBottom:"8px"}}>
              {(crmShowLost?PIPE:activePipe).map(stage=>{
                const items=filteredHist.filter(q=>(q.status||"lead")===stage.id||(stage.id==="lead"&&!PIPE.find(p=>p.id===(q.status||"lead"))));
                const stageVal=items.reduce((s,q)=>s+(parseFloat(q.tot)||0),0);
                return <div key={stage.id} style={{minWidth:"175px",flex:1}}>
                  <div style={{background:stage.color+"22",borderRadius:"8px 8px 0 0",padding:"8px 10px",borderBottom:`3px solid ${stage.color}`}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                      <div style={{fontSize:"11px",fontWeight:"700",color:stage.color}}>{stage.icon} {stage.label}</div>
                      <div style={{fontSize:"10px",fontWeight:"800",color:stage.color,background:stage.color+"22",borderRadius:"10px",padding:"1px 6px"}}>{items.length}</div>
                    </div>
                    <div style={{fontSize:"8px",color:stage.color,opacity:.8,fontWeight:"600",marginTop:"2px"}}>{fmt(stageVal)}</div>
                  </div>
                  <div style={{background:t.sectionBg,borderRadius:"0 0 8px 8px",padding:"6px",minHeight:"80px",border:`1px solid ${t.cardBorder}`,borderTop:"none",display:"flex",flexDirection:"column",gap:"5px"}}>
                    {items.length===0?<div style={{fontSize:"9px",color:t.textMuted,textAlign:"center",padding:"16px"}}>—</div>:
                    items.map(q=>{
                      const temp=getTemp(q.id,q.status||"lead");
                      const overdue=isNextContactOverdue(q.id);
                      const tags=crmTags[q.id]||[];
                      const days=getDaysSince(q.id);
                      return <div key={q.id} style={{background:t.card,borderRadius:"8px",padding:"9px",border:`1px solid ${overdue?"#fca5a5":t.cardBorder}`,boxShadow:"0 1px 4px rgba(0,0,0,.06)"}}>
                        {/* Header do card */}
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"3px"}}>
                          <div style={{fontSize:"11px",fontWeight:"700",color:t.text,lineHeight:"1.2"}}>{q.cN||"Sem nome"}</div>
                          <div style={{display:"flex",gap:"3px",alignItems:"center"}}>
                            {temp&&<span title={temp.label} style={{fontSize:"12px"}}>{temp.icon}</span>}
                            {needsFollowUp(q.id,q.status)&&<span style={{fontSize:"7px",background:"#fef2f2",color:"#dc2626",padding:"1px 4px",borderRadius:"3px",fontWeight:"700",animation:"pulse 2s infinite"}}>UP!</span>}
                          </div>
                        </div>
                        {/* Infos */}
                        <div style={{fontSize:"8px",color:t.textMuted,marginBottom:"3px"}}>
                          {q.data?.client?.city&&<span>📍{q.data.client.city} · </span>}
                          <span>{q.ps}m · </span>
                          {days<999?<span style={{color:days<=5?"#16a34a":days<=10?"#f59e0b":"#dc2626"}}>{days}d atrás</span>:<span>Sem contato</span>}
                        </div>
                        {/* Valor */}
                        <div style={{fontSize:"13px",fontWeight:"800",color:stage.color,marginBottom:"5px"}}>{fmt(parseFloat(q.tot)||0)}</div>
                        {/* Tags */}
                        {tags.length>0&&<div style={{display:"flex",gap:"2px",flexWrap:"wrap",marginBottom:"5px"}}>
                          {tags.map(tg=><span key={tg} style={{fontSize:"6px",padding:"1px 5px",borderRadius:"9px",background:blue+"15",color:blue,fontWeight:"700"}}>{tg}</span>)}
                        </div>}
                        {/* Próximo contato */}
                        {crmNextContact[q.id]&&<div style={{fontSize:"7px",marginBottom:"5px",color:overdue?"#dc2626":"#16a34a",fontWeight:"600"}}>📅 {overdue?"Atrasado:":"Próx:"} {new Date(crmNextContact[q.id]+"T12:00").toLocaleDateString("pt-BR")}</div>}
                        {/* Ações */}
                        <div style={{display:"flex",gap:"3px",flexWrap:"wrap"}}>
                          <button title="Enviar mensagem WhatsApp" onClick={()=>{msgWA(q);addInteracao(q.id,"whatsapp","Mensagem enviada via WhatsApp")}} style={{fontSize:"8px",padding:"3px 6px",borderRadius:"4px",border:"none",background:"#25d366",color:"#fff",cursor:"pointer",fontWeight:"600"}}>📱 Zap</button>
                          <button title="Enviar orçamento via WhatsApp" onClick={()=>{sendOrcWA(q);addInteracao(q.id,"orcamento","Orçamento enviado via WhatsApp")}} style={{fontSize:"8px",padding:"3px 6px",borderRadius:"4px",border:"none",background:"#128c7e",color:"#fff",cursor:"pointer",fontWeight:"600"}}>📄 PDF</button>
                          {!["concluido","perdido"].includes(stage.id)&&<select title="Mover para outra etapa" value="" onChange={e=>{if(e.target.value)movePipe(q.id,e.target.value);e.target.value=""}} style={{fontSize:"8px",padding:"2px",borderRadius:"4px",border:`1px solid ${t.cardBorder}`,background:t.inputBg,color:t.text,cursor:"pointer",flex:1}}>
                            <option value="">Mover →</option>
                            {PIPE.filter(p=>p.id!==(q.status||"lead")).map(p=><option key={p.id} value={p.id}>{p.icon} {p.label}</option>)}
                          </select>}
                          <button title="Abrir notas, tags e próximo contato" onClick={()=>setCrmDetail(crmDetail===q.id?null:q.id)} style={{fontSize:"8px",padding:"3px 6px",borderRadius:"4px",border:`1px solid ${crmDetail===q.id?blue:t.cardBorder}`,background:crmDetail===q.id?blue:"transparent",color:crmDetail===q.id?"#fff":t.text,cursor:"pointer",fontWeight:"600"}}>📋 Notas</button>
                        </div>
                        {crmDetail===q.id&&<NotePanel q={q} {...notePanelProps}/>}
                      </div>
                    })}
                  </div>
                </div>
              })}
            </div>
          </>}

          {/* ── LISTA ── */}
          {crmView==="lista"&&<>
            <div style={{display:"flex",gap:"6px",marginBottom:"10px",flexWrap:"wrap",alignItems:"center"}}>
              <input value={crmSearch} onChange={e=>setCrmSearch(e.target.value)} placeholder="🔍 Buscar..." style={{flex:1,minWidth:"130px",padding:"6px 10px",border:`1.5px solid ${t.cardBorder}`,borderRadius:"6px",fontSize:"10px",background:t.inputBg,color:t.text,outline:"none"}}/>
              <select value={crmSvcF} onChange={e=>setCrmSvcF(e.target.value)} style={{padding:"6px 8px",border:`1.5px solid ${t.cardBorder}`,borderRadius:"6px",fontSize:"9px",background:t.inputBg,color:t.text}}>
                <option value="todos">Todos serviços</option>
                {SVC.map(sv=><option key={sv.id} value={sv.id}>{sv.label}</option>)}
              </select>
              <select value={crmSort} onChange={e=>setCrmSort(e.target.value)} style={{padding:"6px 8px",border:`1.5px solid ${t.cardBorder}`,borderRadius:"6px",fontSize:"9px",background:t.inputBg,color:t.text}}>
                <option value="data">Mais recentes</option>
                <option value="valor">Maior valor</option>
                <option value="nome">Nome A-Z</option>
                <option value="followup">Follow-up</option>
              </select>
              <button onClick={()=>setCrmShowLost(p=>!p)} style={{padding:"6px 8px",borderRadius:"6px",border:`1.5px solid ${crmShowLost?"#dc2626":t.cardBorder}`,background:crmShowLost?"#fef2f2":"transparent",color:crmShowLost?"#dc2626":t.textSec,fontSize:"9px",fontWeight:"700",cursor:"pointer"}}>❌</button>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:"4px"}}>
              {[...filteredHist].sort((a,b)=>{
                if(crmSort==="valor")return (parseFloat(b.tot)||0)-(parseFloat(a.tot)||0);
                if(crmSort==="nome")return (a.cN||"").localeCompare(b.cN||"");
                if(crmSort==="followup")return getDaysSince(a.id)-getDaysSince(b.id);
                return b.id-a.id;
              }).map(q=>{
                const stage=PIPE.find(p=>p.id===(q.status||"lead"))||PIPE[0];
                const temp=getTemp(q.id,q.status||"lead");
                const days=getDaysSince(q.id);
                const tags=crmTags[q.id]||[];
                return <div key={q.id}>
                  <div onClick={()=>setCrmDetail(crmDetail===q.id?null:q.id)} style={{display:"grid",gridTemplateColumns:"1fr auto auto auto auto",gap:"8px",alignItems:"center",padding:"8px 10px",background:t.card,borderRadius:"8px",border:`1px solid ${t.cardBorder}`,cursor:"pointer",transition:"background .15s"}}>
                    <div>
                      <div style={{display:"flex",alignItems:"center",gap:"5px"}}><span style={{fontSize:"11px",fontWeight:"700",color:t.text}}>{q.cN||"Sem nome"}</span>{temp&&<span style={{fontSize:"11px"}}>{temp.icon}</span>}{needsFollowUp(q.id,q.status)&&<span style={{fontSize:"7px",background:"#fef2f2",color:"#dc2626",padding:"1px 4px",borderRadius:"3px",fontWeight:"700"}}>UP!</span>}</div>
                      <div style={{fontSize:"8px",color:t.textMuted}}>{q.data?.client?.city||""} · {SVC.find(s=>s.id===q.type)?.label||""} · {q.ps}m</div>
                      {tags.length>0&&<div style={{display:"flex",gap:"2px",marginTop:"2px"}}>{tags.map(tg=><span key={tg} style={{fontSize:"6px",padding:"1px 4px",borderRadius:"8px",background:blue+"15",color:blue,fontWeight:"700"}}>{tg}</span>)}</div>}
                    </div>
                    <div style={{textAlign:"right"}}><div style={{fontSize:"12px",fontWeight:"800",color:stage.color}}>{fmt(parseFloat(q.tot)||0)}</div><div style={{fontSize:"8px",color:t.textMuted}}>{q.date||""}</div></div>
                    <div style={{textAlign:"center"}}><span style={{fontSize:"9px",background:stage.color+"22",color:stage.color,padding:"2px 7px",borderRadius:"9px",fontWeight:"700",whiteSpace:"nowrap"}}>{stage.icon} {stage.label}</span></div>
                    <div style={{fontSize:"9px",textAlign:"center",color:days<=5?"#16a34a":days<=10?"#f59e0b":"#dc2626",fontWeight:"700"}}>{days<999?days+"d":"—"}</div>
                    <div style={{display:"flex",gap:"3px"}}>
                      <button title="Enviar mensagem WhatsApp" onClick={e=>{e.stopPropagation();msgWA(q);addInteracao(q.id,"whatsapp","Mensagem enviada via WhatsApp")}} style={{fontSize:"9px",padding:"3px 6px",borderRadius:"4px",border:"none",background:"#25d366",color:"#fff",cursor:"pointer"}}>📱</button>
                      <button title="Enviar orçamento via WhatsApp" onClick={e=>{e.stopPropagation();sendOrcWA(q);addInteracao(q.id,"orcamento","Orçamento enviado")}} style={{fontSize:"9px",padding:"3px 6px",borderRadius:"4px",border:"none",background:"#128c7e",color:"#fff",cursor:"pointer"}}>📄</button>
                    </div>
                  </div>
                  {crmDetail===q.id&&<div style={{padding:"0 10px 8px",background:t.card,borderRadius:"0 0 8px 8px",borderLeft:`1px solid ${t.cardBorder}`,borderRight:`1px solid ${t.cardBorder}`,borderBottom:`1px solid ${t.cardBorder}`,marginTop:"-4px"}}><NotePanel q={q} {...notePanelProps}/></div>}
                </div>
              })}
              {filteredHist.length===0&&<div style={{textAlign:"center",padding:"24px",color:t.textMuted,fontSize:"11px"}}>Nenhum lead encontrado</div>}
            </div>
          </>}

          </>}
          </>;
        })()}</Card>}

        {/* ESTOQUE */}
        {tab==="estoque"&&<Card t={t}><ST icon="📦">Estoque</ST>
          <div style={{display:"flex",gap:"5px",marginBottom:"12px"}}>
            {[["dashboard","📊","Dashboard"],["estoque","📦","Estoque"],["entrada","📥","Entrada"],["historico","📜","Movim."],["fornec","🏢","Fornecedores"]].map(([k,ic,lb])=><button key={k} onClick={()=>setStkTab(k)} style={{padding:"5px 10px",borderRadius:"8px",border:`1.5px solid ${stkTab===k?blue:"#e2e8f0"}`,background:stkTab===k?blue+"15":"transparent",color:stkTab===k?blue:t.textSec,fontSize:"10px",fontWeight:"700",cursor:"pointer"}}>{ic} {lb}</button>)}
          </div>
          {stkTab==="dashboard"&&<>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px",marginBottom:"12px"}}>
              <div style={{background:"linear-gradient(135deg,#0055a4,#003d7a)",borderRadius:"10px",padding:"12px",color:"#fff"}}><div style={{fontSize:"20px",fontWeight:"800"}}>{CAT.length}</div><div style={{fontSize:"9px",opacity:.8}}>Produtos Cadastrados</div><div style={{fontSize:"12px",fontWeight:"700",marginTop:"2px"}}>{Object.values(stk).reduce((a,s)=>a+s.qty,0)} un. em estoque</div></div>
              <div style={{background:Object.values(stk).filter(s=>s.qty<=0).length>0?"linear-gradient(135deg,#dc2626,#991b1b)":"linear-gradient(135deg,#16a34a,#15803d)",borderRadius:"10px",padding:"12px",color:"#fff"}}><div style={{fontSize:"20px",fontWeight:"800"}}>{CAT.filter(p=>!stk[p.id]||stk[p.id].qty<=0).length}</div><div style={{fontSize:"9px",opacity:.8}}>Estoque Zerado</div><div style={{fontSize:"12px",fontWeight:"700",marginTop:"2px"}}>{Object.values(stk).filter(s=>s.qty<=0).length===0?"Tudo OK!":"Reabastecer"}</div></div>
              <div style={{background:"linear-gradient(135deg,#f59e0b,#d97706)",borderRadius:"10px",padding:"12px",color:"#fff"}}><div style={{fontSize:"20px",fontWeight:"800"}}>{Object.entries(stk).filter(([k,s])=>s.qty>0&&s.qty<=s.minQty).length}</div><div style={{fontSize:"9px",opacity:.8}}>Estoque Minimo</div><div style={{fontSize:"12px",fontWeight:"700",marginTop:"2px"}}>Abaixo do minimo</div></div>
              <div style={{background:"linear-gradient(135deg,#7c3aed,#6d28d9)",borderRadius:"10px",padding:"12px",color:"#fff"}}><div style={{fontSize:"20px",fontWeight:"800"}}>{fmt(Object.entries(stk).reduce((a,[k,s])=>a+(s.qty*(s.lastCost||0)),0))}</div><div style={{fontSize:"9px",opacity:.8}}>Investimento Total</div><div style={{fontSize:"12px",fontWeight:"700",marginTop:"2px"}}>Valor em estoque</div></div>
            </div>
            <div style={{background:t.sectionBg,borderRadius:"10px",padding:"12px",border:`1px solid ${t.cardBorder}`,marginBottom:"12px"}}>
              <div style={{fontSize:"11px",fontWeight:"700",color:t.text,marginBottom:"8px"}}>Entradas vs Saidas - Ultimos 10 dias</div>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={(() => {const days=[];for(let i=9;i>=0;i--){const d=new Date();d.setDate(d.getDate()-i);const ds=d.toLocaleDateString("pt-BR");const ent=stkLog.filter(l=>l.type==="entrada"&&l.date===ds).reduce((a,l)=>a+l.qty,0);const sai=stkLog.filter(l=>l.type==="saida"&&l.date===ds).reduce((a,l)=>a+l.qty,0);days.push({dia:ds.substring(0,5),entradas:ent,saidas:sai})}return days})() }>
                  <XAxis dataKey="dia" tick={{fontSize:8}} />
                  <YAxis tick={{fontSize:8}} />
                  <Tooltip contentStyle={{fontSize:10}} />
                  <Legend wrapperStyle={{fontSize:9}} />
                  <Bar dataKey="entradas" fill="#16a34a" radius={[3,3,0,0]} />
                  <Bar dataKey="saidas" fill="#dc2626" radius={[3,3,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{fontSize:"11px",fontWeight:"700",color:t.text,marginBottom:"6px"}}>Produtos com Estoque Baixo</div>
            <div style={{display:"flex",flexDirection:"column",gap:"3px"}}>
              {CAT.filter(p=>{const s=stk[p.id];return s&&s.qty>0&&s.qty<=s.minQty}).map(p=>{const s=stk[p.id];return <div key={p.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"6px 8px",background:"#fffbeb",borderRadius:"5px",border:"1px solid #fde68a"}}><div><span style={{fontSize:"10px",fontWeight:"600"}}>{p.n}</span><span style={{fontSize:"8px",color:"#92400e",marginLeft:"4px"}}>Min: {s.minQty}</span></div><div style={{fontSize:"14px",fontWeight:"800",color:"#f59e0b"}}>{s.qty}</div></div>})}
              {CAT.filter(p=>{const s=stk[p.id];return s&&s.qty>0&&s.qty<=s.minQty}).length===0&&<div style={{textAlign:"center",padding:"12px",color:t.textMuted,fontSize:"10px"}}>Nenhum produto abaixo do minimo</div>}
            </div>
          </>}

          {stkTab==="estoque"&&<>
            <div style={{display:"flex",gap:"3px",marginBottom:"8px",flexWrap:"wrap"}}>{["todos","Vinil 0,7mm","Vinil 0,8mm","Mantas","Perfis","Filtros","Dispositivos","Skimmers","Iluminação","Hidraulica","Acessorios Vinil","Lona Aquatica","Equipamentos"].map(c=><button key={c} onClick={()=>setStkCat(c)} style={{padding:"3px 7px",borderRadius:"5px",border:"none",background:stkCat===c?blue:"#f1f5f9",color:stkCat===c?"#fff":"#666",fontSize:"8px",fontWeight:"600",cursor:"pointer"}}>{c==="todos"?"Todos":c}</button>)}</div>
            <input value={stkFilter} onChange={e=>setStkF(e.target.value)} placeholder="Buscar produto..." style={{width:"100%",padding:"6px 10px",border:`1.5px solid ${t.cardBorder}`,borderRadius:"6px",fontSize:"11px",marginBottom:"10px",background:t.inputBg,color:t.text,outline:"none"}}/>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"6px",flexWrap:"wrap",gap:"4px"}}>
              <div style={{fontSize:"9px",color:t.textMuted}}>{Object.values(stk).filter(s=>s.qty>0).length} itens em estoque</div>
              <div style={{display:"flex",gap:"3px"}}>
                
                <Btn onClick={exportStkCSV} style={{fontSize:"7px",padding:"2px 6px",background:"#16a34a",color:"#fff",border:"none"}}>📊 CSV</Btn>
                <Btn onClick={()=>{saveStk(stk);stkOrderRef.current._key="";setFbMsg("Salvo!");setTimeout(()=>setFbMsg(""),2000)}} style={{fontSize:"7px",padding:"2px 6px",background:"#0055a4",color:"#fff",border:"none"}}>Salvar</Btn>
                <Btn onClick={()=>{if(confirm("Zerar TODO o estoque?")){const ns={};CAT.forEach(p=>{ns[p.id]={qty:0,minQty:2,lastCost:stk[p.id]?.lastCost||p.p}});saveStk(ns,[...stkLog,{type:"saida",name:"ZERADO",qty:0,date:new Date().toLocaleDateString("pt-BR"),ts:Date.now(),mode:"zerar"}]);setFbMsg("Estoque zerado!");setTimeout(()=>setFbMsg(""),2000)}}} style={{fontSize:"7px",padding:"2px 6px",background:"#dc2626",color:"#fff",border:"none"}}>Zerar Tudo</Btn>
              </div>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:"3px",maxHeight:"400px",overflow:"auto"}}>
              {(() => {const filtered=CAT.filter(p=>(stkCat==="todos"||p.c===stkCat)&&(!stkFilter||p.n.toLowerCase().includes(stkFilter.toLowerCase())));const key=stkCat+"|"+stkFilter;if(stkOrderRef.current._key!==key){stkOrderRef.current={_key:key,ids:filtered.map(p=>p.id).sort((a,b)=>(stk[b]?.qty||0)-(stk[a]?.qty||0))};};return stkOrderRef.current.ids.map(id=>filtered.find(p=>p.id===id)).filter(Boolean)})().map(p=>{const s=stk[p.id]||{qty:0,minQty:2,lastCost:p.p};const low=s.qty>0&&s.qty<=s.minQty;const zero=s.qty<=0;return <div key={p.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"6px 8px",background:zero?"#fef2f2":low?"#fffbeb":t.sectionBg,borderRadius:"6px",border:`1px solid ${zero?"#fecaca":low?"#fde68a":t.cardBorder}`}}>
                <div style={{flex:1}}><span style={{fontSize:"7px",background:t.stampBg,color:blue,padding:"1px 4px",borderRadius:"3px",fontWeight:"600",marginRight:"4px"}}>{p.c}</span><span style={{fontSize:"11px",fontWeight:"600",color:t.text}}>{p.n}</span><div style={{fontSize:"8px",color:t.textMuted}}>Custo: {fmt(s.lastCost)}</div></div>
                <div style={{display:"flex",alignItems:"center",gap:"6px"}}><div style={{fontSize:"16px",fontWeight:"800",color:zero?"#dc2626":low?"#f59e0b":"#16a34a",minWidth:"35px",textAlign:"right"}}>{s.qty}</div><span style={{fontSize:"8px",color:t.textMuted}}>{p.un}</span>
                  <div style={{display:"flex",gap:"2px"}}><button onClick={(ev)=>{ev.stopPropagation();setStk(prev=>{const ns={...prev};if(!ns[p.id])ns[p.id]={qty:0,minQty:2,lastCost:p.p};ns[p.id]={...ns[p.id],qty:ns[p.id].qty+1};return ns})}} style={{width:"20px",height:"20px",borderRadius:"4px",border:"none",background:"#16a34a",color:"#fff",fontSize:"11px",cursor:"pointer",fontWeight:"700"}}>+</button><button onClick={(ev)=>{ev.stopPropagation();setStk(prev=>{const ns={...prev};if(!ns[p.id])ns[p.id]={qty:0,minQty:2,lastCost:p.p};ns[p.id]={...ns[p.id],qty:Math.max(0,ns[p.id].qty-1)};return ns})}} style={{width:"20px",height:"20px",borderRadius:"4px",border:"none",background:"#dc2626",color:"#fff",fontSize:"11px",cursor:"pointer",fontWeight:"700"}}>-</button></div>
                </div></div>})}
            </div></>}
          {stkTab==="entrada"&&<>
            <div style={{fontSize:"11px",fontWeight:"700",color:t.text,marginBottom:"8px"}}>Entrada de Mercadoria</div>
            <div style={{display:"flex",flexDirection:"column",gap:"6px"}}>
              {entItems.map((ei,idx)=><div key={idx} style={{display:"flex",gap:"5px",alignItems:"center"}}>
                <select value={ei.catId} onChange={e=>{const n=[...entItems];n[idx].catId=e.target.value;setEntItems(n)}} style={{flex:2,padding:"5px",border:`1px solid ${t.cardBorder}`,borderRadius:"5px",fontSize:"10px",background:ei.catId?"#f0fdf4":ei._desc?"#fef2f2":t.inputBg,color:t.text}}><option value="">{ei._desc?ei._desc.substring(0,40)+"...":"Selecionar..."}</option>{CAT.map(p=><option key={p.id} value={p.id}>{p.c} - {p.n}</option>)}</select>
                <input value={ei.qty} onChange={e=>{const n=[...entItems];n[idx].qty=e.target.value;setEntItems(n)}} placeholder="Qtd" style={{width:"50px",padding:"5px",border:`1px solid ${t.cardBorder}`,borderRadius:"5px",fontSize:"10px",textAlign:"center",background:t.inputBg,color:t.text}}/>
                <input value={ei.cost} onChange={e=>{const n=[...entItems];n[idx].cost=e.target.value;setEntItems(n)}} placeholder="R$ un." style={{width:"70px",padding:"5px",border:`1px solid ${t.cardBorder}`,borderRadius:"5px",fontSize:"10px",textAlign:"center",background:t.inputBg,color:t.text}}/>
                <button onClick={()=>setEntItems(p=>p.filter((_,i)=>i!==idx))} style={{background:"none",border:"none",color:"#ef4444",cursor:"pointer",fontSize:"12px"}}>X</button>
              </div>)}
            </div>
            <div style={{display:"flex",gap:"5px",marginTop:"8px"}}><Btn onClick={()=>setEntItems(p=>[...p,{catId:"",qty:"",cost:""}])}>+ Item</Btn><Btn onClick={()=>{const valid=entItems.filter(e=>e.catId&&e.qty);if(valid.length===0){setFbMsg("Adicione itens");setTimeout(()=>setFbMsg(""),2000);return}addStock(valid,"Manual");setEntItems([{catId:"",qty:"",cost:""}])}} style={{background:"#16a34a",color:"#fff",border:"none"}}>Dar Entrada</Btn></div>
            <div style={{marginTop:"16px",padding:"12px",background:t.sectionBg,borderRadius:"8px",border:`1px solid ${t.cardBorder}`}}>
              <div style={{fontSize:"11px",fontWeight:"700",color:t.text,marginBottom:"8px"}}>Importar Nota Fiscal (XML ou PDF)</div>
              <div style={{fontSize:"9px",color:t.textMuted,marginBottom:"6px"}}>Selecione o XML ou PDF da NFe</div>
              <input type="file" accept=".xml,.pdf" onChange={async(e)=>{const file=e.target.files?.[0];if(!file)return;const fname=file.name.toLowerCase();setFbMsg("Lendo arquivo...");try{let rawItems=[];if(fname.endsWith(".xml")){const txt=await file.text();const parser=new DOMParser();const xml=parser.parseFromString(txt,"text/xml");const dets=xml.getElementsByTagName("det");for(let i=0;i<dets.length;i++){const det=dets[i];const xProd=(det.getElementsByTagName("xProd")[0]?.textContent||"");const qCom=parseFloat(det.getElementsByTagName("qCom")[0]?.textContent||"0");const vUnCom=parseFloat(det.getElementsByTagName("vUnCom")[0]?.textContent||"0");rawItems.push({desc:xProd,qty:qCom,cost:vUnCom})}}else if(fname.endsWith(".pdf")){if(!window.pdfjsLib){const sc=document.createElement("script");sc.src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";document.head.appendChild(sc);await new Promise(r=>{sc.onload=r;setTimeout(r,5000)})}if(window.pdfjsLib){window.pdfjsLib.GlobalWorkerOptions.workerSrc="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";const ab=await file.arrayBuffer();const pdf=await window.pdfjsLib.getDocument({data:ab}).promise;let ft="";for(let pg=1;pg<=pdf.numPages;pg++){const page=await pdf.getPage(pg);const tc=await page.getTextContent();ft+=tc.items.map(z=>z.str).join(" ")+"\n"}ft.split("\n").forEach(row=>{const u=row.toUpperCase();if(u.includes("VINIL")||u.includes("LONA")||u.includes("MANTA")||u.includes("FILTRO")||u.includes("REFLETOR")||u.includes("SKIMMER")||u.includes("PERFIL")){const nums=row.match(/[\d]+[.,]?[\d]*/g);if(nums&&nums.length>=2){rawItems.push({desc:row,qty:parseFloat(nums[nums.length-3]?.replace(",",".")||nums[0].replace(",","."))||1,cost:parseFloat(nums[nums.length-2]?.replace(",",".")||"0")||0})}}})}else{setFbMsg("Erro leitor PDF")}}const entries=[];rawItems.forEach(it=>{const d=it.desc.toUpperCase();const is073=d.includes("0,73")||d.includes("0.73");const thick=is073?"8":"7";let matchId="";if(d.includes("LONA AQUATICA")||d.includes("LONA AQUÁTICA")){matchId=d.includes("14")?"lona14":"lona10"}else if(d.includes("VINIL")||d.includes("REVESTIMENTO")){const vinilCat=CAT.filter(p=>p.c==="Vinil 0,"+thick+"mm");for(const vc of vinilCat){const stampName=vc.n.replace(/ 0,[78]mm/,"").toUpperCase();const words=stampName.split(" ").filter(w=>w.length>2);if(words.length>0&&words.every(w=>d.includes(w))){matchId=vc.id;break}}}else{for(const p of CAT){const words=p.n.toUpperCase().split(" ").filter(w=>w.length>3);if(words.length>0&&words.every(w=>d.includes(w))){matchId=p.id;break}}}entries.push({catId:matchId,qty:String(it.qty),cost:String(it.cost),_desc:it.desc})});if(entries.length>0){setEntItems(entries);const ok=entries.filter(x=>x.catId).length;const nok=entries.filter(x=>!x.catId).length;setFbMsg(ok+" reconhecidos"+(nok>0?", "+nok+" para selecionar manual":"")+" - Confira e clique Dar Entrada")}else{setFbMsg("Nenhum item encontrado")}setTimeout(()=>setFbMsg(""),8000)}catch(err){console.error(err);setFbMsg("Erro: "+(err.message||err));setTimeout(()=>setFbMsg(""),4000)}e.target.value=""}} style={{fontSize:"11px",color:t.text}}/>
            </div></>}
          {stkTab==="historico"&&<>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"8px"}}>
              <div style={{fontSize:"11px",fontWeight:"700",color:t.text}}>Movimentações</div>
              {stkLog.length>0&&<Btn onClick={exportStkLogCSV} style={{fontSize:"7px",padding:"2px 6px",background:"#16a34a",color:"#fff",border:"none"}}>📊 Exportar CSV</Btn>}
            </div>
            {stkLog.length===0?<div style={{textAlign:"center",padding:"16px",color:t.textMuted,fontSize:"11px"}}>Nenhuma movimentacao</div>:
            <div style={{display:"flex",flexDirection:"column",gap:"3px",maxHeight:"400px",overflow:"auto"}}>
              {stkLog.slice(0,50).map((log,i)=><div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"6px 8px",background:t.sectionBg,borderRadius:"5px",border:`1px solid ${t.cardBorder}`,borderLeft:`3px solid ${log.type==="entrada"?"#16a34a":"#dc2626"}`}}>
                <div><div style={{fontSize:"10px",fontWeight:"700",color:t.text}}>{log.type==="entrada"?"IN":"OUT"} {log.name}</div><div style={{fontSize:"8px",color:t.textMuted}}>{log.date} {log.nf?" - "+log.nf:""} {log.client?" - "+log.client:""} {log.mode==="auto"?"(auto)":""}</div></div>
                <div style={{fontSize:"13px",fontWeight:"800",color:log.type==="entrada"?"#16a34a":"#dc2626"}}>{log.type==="entrada"?"+":"-"}{log.qty}</div>
              </div>)}
            </div>}
          </>}
          {stkTab==="fornec"&&<>
            <div style={{fontSize:"11px",fontWeight:"700",color:t.text,marginBottom:"8px"}}>Cadastro de Fornecedores</div>
            <div style={{display:"flex",gap:"5px",marginBottom:"10px",flexWrap:"wrap"}}>
              <input value={newFornec.name} onChange={e=>setNF2(p=>({...p,name:e.target.value}))} placeholder="Nome do fornecedor" style={{flex:2,padding:"6px 8px",border:`1px solid ${t.cardBorder}`,borderRadius:"5px",fontSize:"10px",background:t.inputBg,color:t.text}}/>
              <input value={newFornec.phone} onChange={e=>setNF2(p=>({...p,phone:e.target.value}))} placeholder="Telefone" style={{flex:1,padding:"6px 8px",border:`1px solid ${t.cardBorder}`,borderRadius:"5px",fontSize:"10px",background:t.inputBg,color:t.text}}/>
              <input value={newFornec.products} onChange={e=>setNF2(p=>({...p,products:e.target.value}))} placeholder="Produtos (ex: Vinil, Filtros)" style={{flex:2,padding:"6px 8px",border:`1px solid ${t.cardBorder}`,borderRadius:"5px",fontSize:"10px",background:t.inputBg,color:t.text}}/>
              <Btn onClick={()=>{if(!newFornec.name)return;saveFornec([...fornecedores,{id:Date.now(),...newFornec}]);setNF2({name:"",phone:"",products:""})}} style={{background:"#16a34a",color:"#fff",border:"none",fontSize:"9px"}}>+ Adicionar</Btn>
            </div>
            {fornecedores.length===0?<div style={{textAlign:"center",padding:"16px",color:t.textMuted,fontSize:"11px"}}>Nenhum fornecedor cadastrado</div>:
            <div style={{display:"flex",flexDirection:"column",gap:"4px"}}>
              {fornecedores.map(f=><div key={f.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 10px",background:t.sectionBg,borderRadius:"6px",border:`1px solid ${t.cardBorder}`}}>
                <div><div style={{fontSize:"11px",fontWeight:"700",color:t.text}}>{f.name}</div><div style={{fontSize:"9px",color:t.textMuted}}>{f.phone} {f.products?" | "+f.products:""}</div></div>
                <div style={{display:"flex",gap:"4px"}}>
                  <button onClick={()=>openWA(f.phone)} style={{fontSize:"8px",padding:"3px 6px",borderRadius:"4px",border:"none",background:"#25d366",color:"#fff",cursor:"pointer",fontWeight:"600"}}>Zap</button>
                  <button onClick={()=>saveFornec(fornecedores.filter(x=>x.id!==f.id))} style={{background:"none",border:"none",color:"#ef4444",cursor:"pointer",fontSize:"11px"}}>X</button>
                </div>
              </div>)}
            </div>}
          </>}

        </Card>}

        {/* PLANTA */}
        {tab==="planta"&&<Card t={t}><ST icon="📐">Planta Hidraulica</ST>
          <div style={{display:"flex",gap:"8px",marginBottom:"10px",alignItems:"center",flexWrap:"wrap"}}>
            <label style={{display:"flex",alignItems:"center",gap:"4px",fontSize:"10px",color:t.text,cursor:"pointer"}}><input type="checkbox" checked={includePlanta} onChange={e=>setIncludePlanta(e.target.checked)}/> Incluir no PDF</label>
            {!isoView&&<label style={{display:"flex",alignItems:"center",gap:"4px",fontSize:"10px",color:t.text,cursor:"pointer"}}><input type="checkbox" checked={invertSide} onChange={e=>{setInvertSide(e.target.checked);setCustomPos({})}}/> Inverter lado</label>}
            <div style={{marginLeft:"auto",display:"flex",gap:"6px",alignItems:"center"}}>
              <div style={{display:"flex",borderRadius:"6px",overflow:"hidden",border:"1.5px solid "+t.cardBorder}}>
                <button onClick={()=>setIsoView(false)} title="Planta baixa 2D" style={{padding:"4px 10px",fontSize:"10px",fontWeight:"700",border:"none",cursor:"pointer",background:!isoView?blue:"transparent",color:!isoView?"#fff":t.textSec}}>2D</button>
                <button onClick={()=>setIsoView(true)} title="Vista isométrica 3D" style={{padding:"4px 10px",fontSize:"10px",fontWeight:"700",border:"none",cursor:"pointer",background:isoView?blue:"transparent",color:isoView?"#fff":t.textSec}}>Isométrico</button>
              </div>
              {isoView&&<>
                <button onClick={()=>downloadISO(false)} title="Baixar como SVG (vetorial)" style={{padding:"4px 10px",fontSize:"10px",fontWeight:"700",borderRadius:"6px",border:"1.5px solid #16a34a",background:"#f0fdf4",color:"#16a34a",cursor:"pointer",display:"flex",alignItems:"center",gap:"4px"}}>⬇ SVG</button>
                <button onClick={()=>downloadISO(true)} title="Baixar como PNG (imagem)" style={{padding:"4px 10px",fontSize:"10px",fontWeight:"700",borderRadius:"6px",border:"1.5px solid "+blue,background:"#eff6ff",color:blue,cursor:"pointer",display:"flex",alignItems:"center",gap:"4px"}}>⬇ PNG</button>
              </>}
            </div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:"5px",marginBottom:"10px"}}>
            {[["retorno","Retorno","#3b82f6"],["aspiracao","Asp.","#ec4899"],["dreno","Dreno","#8b5cf6"],["skimmer","Skim.","#f97316"],["refletor","LED","#eab308"],["nivelador","Niv.","#06b6d4"],["hidro","Hidro","#10b981"]].map(([k,lb,cor])=><div key={k} style={{display:"flex",alignItems:"center",gap:"3px",background:t.card,padding:"4px 6px",borderRadius:"5px",border:"1px solid "+t.cardBorder}}>
              <div style={{width:"6px",height:"3px",background:cor,borderRadius:"2px"}}/>
              <span style={{fontSize:"7px",fontWeight:"600",color:t.text,flex:1}}>{lb}</span>
              <button onClick={()=>{setDisps(p=>({...p,[k]:Math.max(0,p[k]-1)}));setCustomPos(p=>{const n={...p};Object.keys(n).forEach(key=>{if(key.startsWith(k.substring(0,3)))delete n[key]});return n})}} style={{width:"14px",height:"14px",borderRadius:"3px",border:"none",background:"#fee2e2",color:"#dc2626",fontSize:"9px",cursor:"pointer",fontWeight:"700"}}>-</button>
              <span style={{fontSize:"9px",fontWeight:"800",color:t.text,minWidth:"12px",textAlign:"center"}}>{disps[k]}</span>
              <button onClick={()=>{setDisps(p=>({...p,[k]:p[k]+1}));setCustomPos(p=>{const n={...p};Object.keys(n).forEach(key=>{if(key.startsWith(k.substring(0,3)))delete n[key]});return n})}} style={{width:"14px",height:"14px",borderRadius:"3px",border:"none",background:"#dcfce7",color:"#16a34a",fontSize:"9px",cursor:"pointer",fontWeight:"700"}}>+</button>
            </div>)}
          </div>
          {isoView
            ?<IsometricView ref={isoRef} pool={pool} spa={spa} disps={disps} dark={dark} t={t} poolFmt={poolFmt} clientName={client.name} autoPositions={autoPositions} customPos={customPos} invertSide={invertSide}/>
            :<PlantaView pool={pool} spa={spa} disps={disps} customPos={customPos} setCustomPos={setCustomPos} dragging={dragging} setDragging={setDragging} dark={dark} poolFmt={poolFmt} ar={ar} autoPositions={autoPositions} blue={blue} t={t} tubeOffsets={tubeOffsets} setTubeOffsets={setTubeOffsets} invertSide={invertSide}/>}
        </Card>}

        {/* CONTRATOS */}
        {tab==="contratos"&&<Card t={t}><ST icon="📝">Contratos</ST>
          {(() => {
            const clientes=hist.filter(q=>["cliente","fechou","execucao","concluido"].includes(q.status));
            if(clientes.length===0)return <div style={{textAlign:"center",padding:"24px",color:t.textMuted}}><div style={{fontSize:"28px"}}>📝</div><div style={{fontSize:"11px"}}>Nenhum cliente fechado ainda.</div><div style={{fontSize:"10px",color:t.textMuted,marginTop:"4px"}}>Vá em "Salvos" e clique "Fechou" em um orçamento.</div></div>;

            const sel=viewContract||clientes[0];
            const d=sel.data;
            const incItems=(d.items||[]).filter(i=>i.on);
            const totalVal=parseFloat(sel.tot)||0;
            const today=new Date().toLocaleDateString("pt-BR",{day:"2-digit",month:"long",year:"numeric"});


            const dlContract=()=>{
              const el=document.getElementById("contract-doc");if(!el)return;
              const html=`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Contrato - ${d.client.name||"Cliente"}</title><style>*{margin:0;box-sizing:border-box;-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}body{font-family:'Segoe UI',Arial,sans-serif;background:#fff;padding:15mm 20mm;font-size:14px;line-height:1.8;color:#111}@page{size:A4;margin:12mm 18mm}p{text-align:justify;margin-bottom:10px}[contenteditable]{outline:none}</style></head><body>${el.innerHTML}<script>window.onload=function(){setTimeout(function(){window.print()},600)}<\/script></body></html>`;
              const blob=new Blob([html],{type:"text/html;charset=utf-8"});
              const url=URL.createObjectURL(blob);
              const a=document.createElement("a");a.href=url;a.download=`Contrato_${(d.client.name||"Cliente").replace(/\s+/g,"_")}.html`;document.body.appendChild(a);a.click();document.body.removeChild(a);setTimeout(()=>URL.revokeObjectURL(url),1000);
            };

            const cs={p:{fontSize:"14px",lineHeight:"1.9",textAlign:"justify",marginBottom:"12px",color:"#222"},h:{fontSize:"15px",fontWeight:"700",color:"#111",marginTop:"20px",marginBottom:"8px"},li:{fontSize:"14px",lineHeight:"1.8",marginBottom:"6px",paddingLeft:"8px",color:"#222"},sep:{borderTop:"1px solid #ccc",margin:"16px 0"},ed:{background:"#fffff0",border:"1px dashed #e8b100",borderRadius:"4px",padding:"2px 6px",outline:"none",fontSize:"14px"}};

            return <>
              {clientes.length>1&&<div style={{display:"flex",gap:"4px",marginBottom:"12px",flexWrap:"wrap"}}>{clientes.map(c=><button key={c.id} onClick={()=>{setVC(c);setCeInit(null);setTimeout(()=>initCE(c),50)}} style={{padding:"4px 10px",borderRadius:"14px",border:`1.5px solid ${sel.id===c.id?blue:t.cardBorder}`,background:sel.id===c.id?blue:"transparent",color:sel.id===c.id?"#fff":t.text,fontSize:"10px",fontWeight:"600",cursor:"pointer"}}>{c.cN||"Sem nome"}</button>)}</div>}

              {/* EDITOR DE SERVIÇOS */}
              <div style={{background:t.sectionBg,borderRadius:"8px",padding:"12px",marginBottom:"12px",border:`1px solid ${t.cardBorder}`}}>
                <div style={{fontSize:"11px",fontWeight:"700",color:blue,marginBottom:"8px"}}>✏️ Editar Serviços do Contrato</div>
                <div style={{display:"flex",flexDirection:"column",gap:"4px"}}>
                  {ce.servicos.map((s,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:"4px"}}>
                    <span style={{fontSize:"12px",color:t.textMuted}}>•</span>
                    <input value={s} onChange={e=>{const n=[...ce.servicos];n[i]=e.target.value;setCE(p=>({...p,servicos:n}))}} style={{flex:1,padding:"4px 8px",border:`1px solid ${t.cardBorder}`,borderRadius:"4px",fontSize:"12px",background:t.inputBg,color:t.text,outline:"none"}}/>
                    <button onClick={()=>setCE(p=>({...p,servicos:p.servicos.filter((_,x)=>x!==i)}))} style={{background:"none",border:"none",color:"#ef4444",cursor:"pointer",fontSize:"14px"}}>✕</button>
                  </div>)}
                  <div style={{display:"flex",gap:"4px",marginTop:"4px"}}>
                    <input value={ce.novoServico} onChange={e=>setCE(p=>({...p,novoServico:e.target.value}))} placeholder="Novo serviço..." style={{flex:1,padding:"4px 8px",border:`1px solid ${t.cardBorder}`,borderRadius:"4px",fontSize:"12px",background:t.inputBg,color:t.text,outline:"none"}}/>
                    <Btn onClick={()=>{if(ce.novoServico.trim()){setCE(p=>({...p,servicos:[...p.servicos,p.novoServico.trim()],novoServico:""}))}}} style={{fontSize:"10px",padding:"3px 8px",background:blue,color:"#fff",border:"none"}}>+ Adicionar</Btn>
                  </div>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"8px",marginTop:"10px"}}>
                  <div><label style={{fontSize:"9px",fontWeight:"600",color:t.textSec}}>VALOR</label><input value={ce.valor} onChange={uce("valor")} style={{width:"100%",padding:"4px 8px",border:`1px solid ${t.cardBorder}`,borderRadius:"4px",fontSize:"12px",background:t.inputBg,color:t.text,outline:"none",fontWeight:"700"}}/></div>
                  <div><label style={{fontSize:"9px",fontWeight:"600",color:t.textSec}}>PRAZO (DIAS)</label><input value={ce.prazo} onChange={uce("prazo")} style={{width:"100%",padding:"4px 8px",border:`1px solid ${t.cardBorder}`,borderRadius:"4px",fontSize:"12px",background:t.inputBg,color:t.text,outline:"none"}}/></div>
                  <div><label style={{fontSize:"9px",fontWeight:"600",color:t.textSec}}>DATA</label><input value={ce.data} onChange={uce("data")} style={{width:"100%",padding:"4px 8px",border:`1px solid ${t.cardBorder}`,borderRadius:"4px",fontSize:"12px",background:t.inputBg,color:t.text,outline:"none"}}/></div>
                </div>
                <div style={{marginTop:"8px"}}><label style={{fontSize:"9px",fontWeight:"600",color:t.textSec}}>OBS (POR CONTA DO CLIENTE)</label><input value={ce.obs} onChange={uce("obs")} style={{width:"100%",padding:"4px 8px",border:`1px solid ${t.cardBorder}`,borderRadius:"4px",fontSize:"12px",background:t.inputBg,color:t.text,outline:"none"}}/></div>
                <div style={{marginTop:"8px"}}><label style={{fontSize:"9px",fontWeight:"600",color:t.textSec}}>GARANTIAS</label><input value={ce.garantias} onChange={uce("garantias")} style={{width:"100%",padding:"4px 8px",border:`1px solid ${t.cardBorder}`,borderRadius:"4px",fontSize:"12px",background:t.inputBg,color:t.text,outline:"none"}}/></div>
              </div>

              <div style={{display:"flex",justifyContent:"flex-end",gap:"6px",marginBottom:"10px"}}>
                <Btn onClick={dlContract} style={{background:"linear-gradient(135deg,#16a34a,#15803d)",color:"#fff",border:"none",padding:"8px 16px",fontSize:"12px",fontWeight:"700"}}>📥 Baixar Contrato</Btn>
              </div>

              {/* PREVIEW DO CONTRATO */}
              <div id="contract-doc" style={{background:"#fff",color:"#111",padding:"32px",borderRadius:"10px",border:`1px solid ${t.cardBorder}`,fontFamily:"'Segoe UI','Helvetica Neue',Arial,sans-serif",fontSize:"14px",lineHeight:"1.9"}}>
                
                <div style={{textAlign:"center",marginBottom:"24px",paddingBottom:"16px",borderBottom:"2px solid #0055a4"}}>
                  <div style={{fontSize:"22px",fontWeight:"800",color:"#0055a4",letterSpacing:"2px"}}>VINIL VALE</div>
                  <div style={{fontSize:"13px",fontWeight:"600",color:"#333",marginTop:"2px"}}>REVESTIMENTOS E CAPAS PARA PISCINAS LTDA</div>
                  <div style={{fontSize:"12px",color:"#666",marginTop:"6px"}}>{CO.addr}</div>
                  <div style={{fontSize:"12px",color:"#666"}}>Fones: {CO.ph1} / {CO.ph2} · {CO.email}</div>
                  <div style={{fontSize:"12px",color:"#666"}}>CNPJ: {CO.cnpj} · IE: {CO.ie}</div>
                  {d.propNum&&<div style={{fontSize:"13px",fontWeight:"700",color:"#0055a4",marginTop:"8px"}}>PROPOSTA Nº {d.propNum}</div>}
                </div>

                <div style={{textAlign:"center",fontSize:"18px",fontWeight:"800",margin:"20px 0",color:"#111"}}>CONTRATO DE PRESTAÇÃO DE SERVIÇOS</div>

                <div style={{background:"#f8fafc",borderRadius:"8px",padding:"16px",marginBottom:"16px",border:"1px solid #e2e8f0"}}>
                  <div style={{fontSize:"13px",fontWeight:"700",color:"#0055a4",marginBottom:"8px"}}>CONTRATADA</div>
                  <div style={{fontSize:"14px",lineHeight:"1.8"}}>
                    <b>Vinil Vale Revestimentos e Capas para Piscinas Ltda.</b><br/>
                    Endereço: {CO.addr}<br/>
                    CNPJ: {CO.cnpj}<br/>
                    Inscrição Estadual: {CO.ie}<br/>
                    Telefone: {CO.ph1} / {CO.ph2}<br/>
                    E-mail: {CO.email}
                  </div>
                </div>

                <div style={{background:"#f8fafc",borderRadius:"8px",padding:"16px",marginBottom:"20px",border:"1px solid #e2e8f0"}}>
                  <div style={{fontSize:"13px",fontWeight:"700",color:"#0055a4",marginBottom:"8px"}}>CONTRATANTE</div>
                  <div style={{fontSize:"14px",lineHeight:"1.8"}}>
                    <b>{d.client.name||"_______________________________"}</b><br/>
                    Endereço: {d.client.address||"_______________________________"} – {d.client.city||"_______________"}<br/>
                    RG: {d.client.rg||"_______________"}<br/>
                    CPF/CNPJ: {d.client.cpf||"_______________"}<br/>
                    Fone: {d.client.phone||"_______________"}<br/>
                    E-mail: {d.client.email||"_______________"}
                  </div>
                </div>

                <div style={cs.sep}/>

                <div style={cs.h}>1. SERVIÇOS CONTRATADOS</div>
                <p style={cs.p}>A CONTRATADA compromete-se a realizar os seguintes serviços de <b>{ce.tipoServico||SVC.find(s=>s.id===d.svcType)?.label||""}</b> no endereço: {d.client.address||"___"} – {d.client.city||"___"}</p>

                <div style={{background:"#f0f7ff",borderRadius:"6px",padding:"12px",marginBottom:"14px",border:"1px solid #c5d9f0"}}>
                  <div style={{fontSize:"12px",fontWeight:"700",color:"#0055a4",marginBottom:"6px"}}>ESPECIFICAÇÕES DA PISCINA</div>
                  <div style={{fontSize:"13px",lineHeight:"1.8"}}>
                    Dimensões: <b>{ce.piscina||((d.pool?.length||0)+"x"+(d.pool?.width||0)+"x"+(d.pool?.depth||0)+"m")}</b><br/>
                    Revestimento: <b>{ce.vinil||"ACQUALINER"}</b><br/>
                    {(ce.estampa||d.stamp)?<>Estampa: <b>{ce.estampa||d.stamp}</b><br/></>:null}
                    Proposta nº: <b>{ce.propNum||d.propNum||""}</b>
                  </div>
                </div>

                <p style={{...cs.p,fontWeight:"600"}}>Itens e Serviços Inclusos:</p>
                <div style={{paddingLeft:"20px",marginBottom:"14px"}}>{ce.servicos.map((s,i)=><div key={i} style={cs.li}>• {s}</div>)}</div>
                <p style={cs.p}><b>Obs:</b> Ficando fora desse orçamento: {ce.obs}.</p>

                <div style={cs.sep}/>

                <div style={cs.h}>2. GARANTIA E ASSISTÊNCIA TÉCNICA</div>
                <p style={cs.p}><b>2.1. Da Garantia:</b> A CONTRATADA oferece garantia de {ce.garantias}. A garantia do material (bolsão de vinil) é de 3 anos contra defeitos de fabricação, conforme termos do fabricante ACQUALINER.</p>
                <p style={cs.p}><b>2.2. Da Assistência Técnica:</b> Em caso de chamado para assistência, a CONTRATADA terá um prazo de até 10 (dez) dias úteis para realizar a vistoria técnica no local. A garantia cobre apenas defeitos de instalação quando a instalação seja feita pela fabricante Vinil Vale Revestimentos. Caso a vistoria identifique que o problema decorre de fatores externos (infiltração, mau uso, intervenção de terceiros, desequilíbrio químico, etc.), será apresentado orçamento separado para o reparo.</p>
                <p style={cs.p}><b>2.3. Exclusões de Revestimento:</b> A garantia não cobre:</p>
                <div style={{paddingLeft:"20px",marginBottom:"14px"}}>
                  <div style={cs.li}>• Levantamento de manta ou bolsão causado por infiltração de água externa (lençol freático ou falta de drenagem adequada).</div>
                  <div style={cs.li}>• Rugas ou manchas causadas por desequilíbrio químico da água (pH fora do padrão ou excesso de cloro).</div>
                  <div style={cs.li}>• Danos causados pelo esvaziamento da piscina sem supervisão da CONTRATADA.</div>
                  <div style={cs.li}>• Intervenções ou reparos realizados por terceiros não autorizados, o que acarretará a extinção automática da cobertura.</div>
                </div>

                <div style={cs.sep}/>

                <div style={cs.h}>3. OBRIGAÇÕES DO CONTRATANTE</div>
                <div style={{paddingLeft:"20px",marginBottom:"14px"}}>
                  <div style={cs.li}>3.1. Realizar o pagamento dos serviços conforme cláusula "4 – Pagamento";</div>
                  <div style={cs.li}>3.2. Garantir o acesso livre ao local durante o período acordado;</div>
                  <div style={cs.li}>3.3. Cumprir integralmente as recomendações técnicas para conservação do produto;</div>
                  <div style={cs.li}>3.4. Enviar o contrato assinado com testemunhas para: <b>{CO.email}</b></div>
                </div>

                <div style={cs.sep}/>

                <div style={cs.h}>4. PAGAMENTO</div>
                <p style={cs.p}>4.1. O valor total acordado é de <b style={{fontSize:"16px",color:"#0055a4"}}>{ce.valor}</b>, conforme condições de pagamento definidas no orçamento.</p>

                <div style={cs.sep}/>

                <div style={cs.h}>5. PRAZO DE EXECUÇÃO</div>
                <p style={cs.p}>5.1. Os serviços serão executados no prazo máximo de <b>{ce.prazo} dias úteis</b> da alvenaria, e o vinil para instalação 10 dias úteis contados a partir da medição detalhada da piscina.</p>
                <p style={cs.p}>5.2. Caso ocorram atrasos decorrentes de fatores climáticos, dificuldades técnicas não previstas ou situações excepcionais, haverá negociação imediata de novo prazo entre as partes.</p>

                <div style={cs.sep}/>

                <div style={cs.h}>6. CONFIDENCIALIDADE</div>
                <p style={cs.p}>6.1. A CONTRATADA compromete-se a manter sigilo absoluto de todas as informações e documentos aos quais tiver acesso durante a execução do contrato.</p>

                <div style={cs.sep}/>

                <div style={cs.h}>7. PENALIDADES</div>
                <p style={cs.p}>7.1. O descumprimento das obrigações contratuais sujeitará a parte infratora ao pagamento de multa equivalente a <b>10% do valor total do contrato</b>, acrescidos de juros e correção monetária aplicáveis.</p>

                <div style={cs.sep}/>

                <div style={cs.h}>8. DISPOSIÇÕES GERAIS</div>
                <p style={cs.p}>8.1. Este documento representa o acordo integral entre as partes, revogando quaisquer acordos prévios verbais ou escritos.</p>
                <p style={cs.p}>8.2. Qualquer alteração deverá ser formalizada por escrito e assinada pelas partes.</p>
                <p style={cs.p}>8.3. Este contrato é regido pelas leis brasileiras, sendo eleito o Foro da Comarca de <b>Registro-SP</b> para dirimir quaisquer controvérsias.</p>

                <div style={{textAlign:"center",margin:"30px 0 20px",fontSize:"15px",fontWeight:"600"}}>{ce.data}</div>

                <div style={{marginTop:"40px"}}>
                  <div style={{borderTop:"2px solid #333",width:"55%",margin:"0 auto",textAlign:"center",paddingTop:"8px"}}><div style={{fontSize:"14px",fontWeight:"700"}}>Vinil Vale Revestimentos e Capas para Piscinas Ltda.</div><div style={{fontSize:"12px",color:"#666"}}>CNPJ: {CO.cnpj}</div></div>
                </div>
                <div style={{marginTop:"40px"}}>
                  <div style={{borderTop:"2px solid #333",width:"55%",margin:"0 auto",textAlign:"center",paddingTop:"8px"}}><div style={{fontSize:"14px",fontWeight:"700"}}>{d.client.name||"________________________"}</div><div style={{fontSize:"12px",color:"#666"}}>CPF: {d.client.cpf||"________________________"}</div></div>
                </div>
                <div style={{marginTop:"36px"}}>
                  <div style={{fontSize:"14px",fontWeight:"700",marginBottom:"24px"}}>TESTEMUNHAS:</div>
                  <div style={{display:"flex",justifyContent:"space-between"}}>
                    <div style={{borderTop:"2px solid #333",width:"42%",textAlign:"center",paddingTop:"8px",fontSize:"12px"}}>Nome: _________________<br/>CPF: _________________</div>
                    <div style={{borderTop:"2px solid #333",width:"42%",textAlign:"center",paddingTop:"8px",fontSize:"12px"}}>Nome: _________________<br/>CPF: _________________</div>
                  </div>
                </div>
              </div>
            </>;
          })() }
        </Card>}

      {/* MODAL REVISÃO DE BAIXA NO ESTOQUE */}
      {stkReview&&<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.55)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",padding:"16px"}}>
        <div style={{background:t.card,borderRadius:"14px",padding:"20px",width:"100%",maxWidth:"500px",maxHeight:"85vh",overflowY:"auto",boxShadow:"0 20px 60px rgba(0,0,0,.3)"}}>
          <div style={{fontSize:"15px",fontWeight:"800",color:t.text,marginBottom:"4px"}}>📦 Revisão de Baixa no Estoque</div>
          <div style={{fontSize:"11px",color:t.textSec,marginBottom:"16px"}}>Cliente: <b>{stkReview.clientName}</b> — revise e ajuste as quantidades antes de confirmar</div>

          {stkReview.items.length>0&&<>
            <div style={{fontSize:"11px",fontWeight:"700",color:"#16a34a",marginBottom:"8px"}}>✅ Itens vinculados ({stkReview.items.length})</div>
            {stkReview.items.map((s,idx)=><div key={idx} style={{display:"grid",gridTemplateColumns:"24px 1fr 70px",gap:"8px",alignItems:"center",padding:"6px 8px",borderRadius:"8px",background:s.selected?t.sectionBg:"transparent",marginBottom:"4px",border:`1px solid ${s.selected?t.cardBorder:"transparent"}`}}>
              <input type="checkbox" checked={s.selected} onChange={e=>{const ni=[...stkReview.items];ni[idx]={...ni[idx],selected:e.target.checked};setStkReview(p=>({...p,items:ni}))}} style={{cursor:"pointer"}}/>
              <div>
                <div style={{fontSize:"11px",fontWeight:"600",color:t.text}}>{s.name}</div>
                <div style={{fontSize:"9px",color:t.textMuted}}>{s.catId.startsWith("v")?"m²":"unidade(s)"}</div>
              </div>
              <input type="number" min="0" value={s.editQty} onChange={e=>{const ni=[...stkReview.items];ni[idx]={...ni[idx],editQty:e.target.value};setStkReview(p=>({...p,items:ni}))}} style={{padding:"4px 6px",borderRadius:"6px",border:`1.5px solid ${t.cardBorder}`,background:t.inputBg,color:t.text,fontSize:"11px",fontWeight:"700",textAlign:"center",width:"100%"}}/>
            </div>)}
          </>}

          {stkReview.unmatched.length>0&&<>
            <div style={{fontSize:"11px",fontWeight:"700",color:"#dc2626",marginBottom:"8px",marginTop:"12px"}}>⚠️ Não vinculados ({stkReview.unmatched.length})</div>
            {stkReview.unmatched.map((u,idx)=><div key={idx} style={{padding:"6px 8px",borderRadius:"8px",background:"#fef2f2",border:"1px solid #fecaca",marginBottom:"4px"}}>
              <div style={{fontSize:"11px",fontWeight:"600",color:"#991b1b"}}>{u.name}</div>
              <div style={{fontSize:"9px",color:"#dc2626"}}>{u.reason}</div>
            </div>)}
          </>}

          <div style={{display:"flex",gap:"8px",marginTop:"16px"}}>
            <Btn onClick={()=>setStkReview(null)} style={{flex:1,background:"transparent",border:`1.5px solid ${t.cardBorder}`,color:t.textSec}}>Cancelar</Btn>
            <Btn onClick={()=>{
              const toRemove=stkReview.items.filter(s=>s.selected&&parseFloat(s.editQty)>0).map(s=>({...s,qty:parseFloat(s.editQty)}));
              if(toRemove.length===0){setFbMsg("Nenhum item selecionado");setTimeout(()=>setFbMsg(""),2000);return}
              removeStock(toRemove,stkReview.clientName,"auto");
              setFbMsg("Estoque atualizado! "+toRemove.length+" itens");
              setTimeout(()=>setFbMsg(""),3000);
              setStkReview(null);
            }} style={{flex:2,background:"#16a34a",color:"#fff",border:"none",fontWeight:"700"}}>Confirmar Baixa</Btn>
          </div>
        </div>
      </div>}

      </div>
    </div>
  );
}
