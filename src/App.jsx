import { useState } from "react";

const VER="v4.0";
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
  {id:"asp",c:"Dispositivos",n:"Disp. Aspiração 2\"",s:"50/60mm",p:22.90,un:"un"},{id:"niv",c:"Dispositivos",n:"Disp. Nível 2\"",s:"50/60mm",p:22.90,un:"un"},{id:"ret",c:"Dispositivos",n:"Disp. Retorno 2\"",s:"6m³/h",p:22.90,un:"un"},{id:"hid",c:"Dispositivos",n:"Disp. Hidro 2\"",s:"3m³/h",p:39.90,un:"un"},
  {id:"nP",c:"Dispositivos",n:"Nicho LED Premium",s:"50/60mm",p:17.90,un:"un"},{id:"nS",c:"Dispositivos",n:"Nicho LED Summer's",s:"50/60mm",p:21.90,un:"un"},
  {id:"dS",c:"Dispositivos",n:"Dreno Fundo Sibrape",s:"Sucção",p:74.90,un:"un"},{id:"dF",c:"Dispositivos",n:"Dreno Fundo Fluidra",s:"Sucção",p:69.90,un:"un"},
  {id:"cx",c:"Dispositivos",n:"Cx Passagem Inox",s:"Proteção",p:19.90,un:"un"},{id:"cxR",c:"Dispositivos",n:"Cx Passagem Reg. Inox",s:"Ajustável",p:19.90,un:"un"},
  {id:"rI",c:"Iluminação",n:"Refletor Império RGB 9W",s:"12m²",p:59.99,un:"un"},{id:"rL",c:"Iluminação",n:"Refletor LuxPool 4W",s:"12m²",p:74.90,un:"un"},{id:"rS",c:"Iluminação",n:"Refletor Cristal 13W",s:"18m²",p:69.99,un:"un"},{id:"rB",c:"Iluminação",n:"Hiper LED 9W Brustec",s:"20m²",p:119,un:"un"},
  {id:"cL",c:"Iluminação",n:"Controladora LuxPool",s:"90W",p:199,un:"un"},{id:"cL2",c:"Iluminação",n:"Controladora LuxPool 2S",s:"90W, 2 aux",p:249,un:"un"},
];
// un: "m²" = custo por m² (usa área total), "ml" = custo por metro linear (usa perímetro), "un" = custo unitário
const mkItems=()=>[
  {id:1,n:"Vinil ACQUALINER",q:1,c:0,m:0,nt:"Estampa à escolha",on:true,un:"m²"},
  {id:2,n:"Manta Acrílica 0,6mm",q:1,c:4.65,m:40,nt:"só chão",on:true,un:"chao"},
  {id:3,n:"Perfil Rígido",q:1,c:6.32,m:40,nt:"R$379/60m",on:true,un:"ml"},
  {id:4,n:"Filtro Império IP60",q:1,c:1586,m:35,nt:"1.0CV",on:true,un:"un"},
  {id:5,n:"Dreno Fundo",q:2,c:74.90,m:40,nt:"Sibrape",on:true,un:"un"},
  {id:6,n:"Disp. Retorno 2\"",q:2,c:22.90,m:40,nt:"",on:true,un:"un"},
  {id:7,n:"Disp. Aspiração 2\"",q:1,c:22.90,m:40,nt:"",on:true,un:"un"},
  {id:8,n:"Skimmer",q:1,c:0,m:0,nt:"",on:true,un:"un"},
  {id:9,n:"Refletor Império RGB",q:4,c:59.99,m:40,nt:"",on:true,un:"un"},
  {id:10,n:"Nicho LED",q:4,c:17.90,m:40,nt:"",on:true,un:"un"},
  {id:11,n:"Controladora LuxPool",q:1,c:199,m:35,nt:"",on:true,un:"un"},
  {id:12,n:"Kit aspiração completo",q:1,c:0,m:0,nt:"",on:true,un:"un"},
  {id:13,n:"Projeto 3D",q:1,c:0,m:0,nt:"",on:true,un:"un"},
  {id:14,n:"Mão de obra completa",q:1,c:0,m:0,nt:"Início ao acabamento",on:true,un:"un"},
];
const mkG=t=>{if(t==="revestimento")return[{id:2,it:"Mão de obra/Soldas",y:3,on:true},{id:3,it:"Vinil (fabricação)",y:3,on:true}];if(t==="reforma")return[{id:2,it:"Mão de obra/Soldas",y:3,on:true},{id:3,it:"Vinil (fabricação)",y:3,on:true},{id:4,it:"Kit Filtrante",y:1,on:true}];return[{id:1,it:"Alvenaria",y:5,on:true},{id:2,it:"Mão de obra/Soldas",y:3,on:true},{id:3,it:"Vinil (fabricação)",y:3,on:true},{id:4,it:"Kit Filtrante",y:1,on:true}]};
const ICI=["Materiais de alvenaria e hidráulico","Pedra de borda de acabamento","Água para enchimento","Remoção de entulho"];
const IPAY={pixD:5,entPct:50,balPct:50,noFee:5,wFee:12,btcD:15};
const fmt=v=>new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(v);

// ═══ AREA CALCULATION ═══
const calcA=(pool,spa,wMode,walls)=>{
  const L=parseFloat(pool.length)||0,W=parseFloat(pool.width)||0,D=parseFloat(pool.depth)||0;
  const chao=L*W;
  let par=wMode==="irregular"&&walls.length>0?walls.reduce((s,w)=>s+(parseFloat(w.l)||0)*(parseFloat(w.h)||D),0):(2*L*D+2*W*D);
  // Perimeter: sum of wall lengths (for perfil)
  let perim=wMode==="irregular"&&walls.length>0?walls.reduce((s,w)=>s+(parseFloat(w.l)||0),0):(2*L+2*W);
  const sL=parseFloat(spa.length)||0,sW=parseFloat(spa.width)||0,sD=parseFloat(spa.depth)||0;
  const sChao=spa.on?sL*sW:0,sPar=spa.on?(2*sL*sD+2*sW*sD):0;
  const sPerim=spa.on?(2*sL+2*sW):0;
  const vol=L*W*D+(spa.on?sL*sW*sD:0);
  return{chao:chao.toFixed(1),par:par.toFixed(1),sChao:sChao.toFixed(1),sPar:sPar.toFixed(1),tot:(chao+par+sChao+sPar).toFixed(1),vol:vol.toFixed(1),perim:(perim+sPerim).toFixed(1),chaoTot:(chao+sChao).toFixed(1)};
};

// ═══ COMPONENTS ═══
const navy="#0a1f44",blue="#0055a4",gold="#e8b100",goldL="#fdf3d1",lBg="#f4f7fc";
const Tab=({a,onClick,children,icon})=><button onClick={onClick} style={{padding:"8px 12px",border:"none",borderBottom:a?"3px solid "+blue:"3px solid transparent",background:a?"rgba(0,85,164,.07)":"transparent",color:a?blue:"#64748b",fontWeight:a?"700":"500",fontSize:"11px",cursor:"pointer",display:"flex",alignItems:"center",gap:"4px",borderRadius:"6px 6px 0 0",whiteSpace:"nowrap"}}><span style={{fontSize:"13px"}}>{icon}</span>{children}</button>;
const Inp=({label,value,onChange,placeholder,style:sx})=><div style={{display:"flex",flexDirection:"column",gap:"2px",...sx}}>{label&&<label style={{fontSize:"9px",fontWeight:"600",color:"#64748b",textTransform:"uppercase",letterSpacing:".4px"}}>{label}</label>}<input value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} style={{padding:"8px 10px",border:"1.5px solid #e2e8f0",borderRadius:"6px",fontSize:"12px",color:"#1e293b",background:"#fff",outline:"none",width:"100%"}} onFocus={e=>e.target.style.borderColor=blue} onBlur={e=>e.target.style.borderColor="#e2e8f0"}/></div>;
const Sel=({label,value,onChange,options,style:sx})=><div style={{display:"flex",flexDirection:"column",gap:"2px",...sx}}>{label&&<label style={{fontSize:"9px",fontWeight:"600",color:"#64748b",textTransform:"uppercase",letterSpacing:".4px"}}>{label}</label>}<select value={value} onChange={e=>onChange(e.target.value)} style={{padding:"8px 10px",border:"1.5px solid #e2e8f0",borderRadius:"6px",fontSize:"12px",color:"#1e293b",background:"#fff"}}>{options.map(o=><option key={typeof o==="string"?o:o.value} value={typeof o==="string"?o:o.value}>{typeof o==="string"?o:o.label}</option>)}</select></div>;
const Card=({children})=><div style={{background:"#fff",borderRadius:"10px",padding:"20px",boxShadow:"0 1px 3px rgba(0,0,0,.05)",border:"1px solid #e2e8f0"}}>{children}</div>;
const ST=({icon,children})=><h3 style={{fontSize:"14px",fontWeight:"700",color:blue,marginBottom:"14px",display:"flex",alignItems:"center",gap:"6px"}}><span>{icon}</span>{children}</h3>;
const Btn=({children,onClick,style:sx})=><button onClick={onClick} style={{padding:"6px 12px",background:"#f1f5f9",color:"#475569",border:"1.5px solid #e2e8f0",borderRadius:"6px",fontWeight:"600",fontSize:"11px",cursor:"pointer",display:"flex",alignItems:"center",gap:"4px",...sx}}>{children}</button>;

// ═══ PDF PREVIEW ═══
const QP=({d,onBack})=>{
  const inc=d.items.filter(i=>i.on);
  const ar=calcA(d.pool,d.spa||{on:false},d.wMode||"regular",d.walls||[]);
  const effQ=(i)=>{
    if(i.un==="m²")return parseFloat(ar.tot)||0;
    if(i.un==="chao")return parseFloat(ar.chaoTot)||0;
    if(i.un==="ml")return parseFloat(ar.perim)||0;
    return i.q||0;
  };
  const total=parseFloat(d.totOv)||inc.reduce((s,i)=>s+effQ(i)*(i.c||0)*(1+(i.m||0)/100),0)+(parseFloat(d.mo)||0);
  const today=new Date().toLocaleDateString("pt-BR",{day:"2-digit",month:"long",year:"numeric"});
  const pix=total*(1-(d.pay.pixD||0)/100),btc=total*(1-(d.pay.btcD||0)/100);
  const ent=total*d.pay.entPct/100,bal=total*d.pay.balPct/100,inst=total/(d.pay.noFee||1);

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
      const file=new File([blob],`Orcamento_VinilVale_${clientName}.html`,{type:"text/html"});

      // Tentar Web Share API (funciona bem em celular)
      if(navigator.canShare&&navigator.canShare({files:[file]})){
        await navigator.share({files:[file],title:"Orçamento Vinil Vale",text:`Orçamento - ${d.client.name||"Cliente"}`});
        setPdfStatus("✅ Compartilhado!");
        setTimeout(()=>setPdfStatus(""),3000);
        return;
      }

      // Fallback: download via link
      const url=URL.createObjectURL(blob);
      const a=document.createElement("a");
      a.href=url;
      a.download=file.name;
      a.style.display="none";
      document.body.appendChild(a);
      a.click();
      setTimeout(()=>{document.body.removeChild(a);URL.revokeObjectURL(url)},1000);
      setPdfStatus("✅ Baixado! Abra e salve como PDF");
      setTimeout(()=>setPdfStatus(""),5000);
    }catch(e){
      // Último fallback: abre em data URI
      try{
        const html=getHTML();
        const dataUri="data:text/html;charset=utf-8,"+encodeURIComponent(html);
        window.open(dataUri,"_blank");
        setPdfStatus("✅ Aberto! Use Ctrl+P / ⋮ → Imprimir");
        setTimeout(()=>setPdfStatus(""),5000);
      }catch(e2){
        setPdfStatus("Use: ⋮ menu → Imprimir nesta página");
        setTimeout(()=>setPdfStatus(""),5000);
      }
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
          <div style={{display:"flex",justifyContent:"center",marginBottom:"14px"}}><div style={{background:lBg,border:`1.5px solid ${blue}`,borderRadius:"20px",padding:"4px 16px",fontSize:"9.5px",fontWeight:"700",color:blue,textTransform:"uppercase",letterSpacing:"1px"}}>{SVC.find(t=>t.id===d.svcType)?.icon} {SVC.find(t=>t.id===d.svcType)?.label}</div></div>

          <Sec title="Dados do Cliente"><div style={{background:lBg,borderRadius:"8px",padding:"10px 12px",display:"grid",gridTemplateColumns:"1fr 1fr",gap:"3px 14px",fontSize:"9.5px",border:"1px solid #e8ecf3"}}><div><span style={{color:"#888",fontWeight:"600"}}>Nome:</span> <b>{d.client.name||"—"}</b></div><div><span style={{color:"#888",fontWeight:"600"}}>Tel:</span> {d.client.phone||"—"}</div><div><span style={{color:"#888",fontWeight:"600"}}>End:</span> {d.client.address||"—"}</div><div><span style={{color:"#888",fontWeight:"600"}}>Cidade:</span> {d.client.city||"—"}</div><div><span style={{color:"#888",fontWeight:"600"}}>CPF:</span> {d.client.cpf||"—"}</div><div><span style={{color:"#888",fontWeight:"600"}}>Email:</span> {d.client.email||"—"}</div></div></Sec>

          <Sec title="Detalhamento Técnico"><div style={{background:`linear-gradient(135deg,${lBg},#e8edf5)`,borderRadius:"10px",padding:"14px",border:"1px solid #dce3ee"}}>
            <div style={{display:"flex",gap:"12px",alignItems:"center",justifyContent:"center",flexWrap:"wrap",marginBottom:"6px"}}>
              {[{v:d.pool.length+"m",l:"Comp."},{v:d.pool.width+"m",l:"Larg."},{v:d.pool.depth+"m",l:"Prof."},{v:ar.tot+"m²",l:"Área Total"},{v:ar.perim+"m",l:"Perímetro"},{v:ar.vol+"m³",l:"Volume"}].map((p,i)=><div key={i} style={{textAlign:"center",minWidth:"50px"}}><div style={{fontSize:"16px",fontWeight:"800",color:i===3?navy:blue}}>{p.v}</div><div style={{fontSize:"6.5px",textTransform:"uppercase",letterSpacing:".5px",color:"#777",fontWeight:"600"}}>{p.l}</div></div>)}
            </div>
            <div style={{display:"flex",justifyContent:"center",gap:"8px",flexWrap:"wrap",fontSize:"8.5px"}}>
              <span style={{background:"#fff",padding:"2px 7px",borderRadius:"10px",border:"1px solid #dce3ee"}}><b>Formato:</b> {d.poolFmt}</span>
              <span style={{background:"#fff",padding:"2px 7px",borderRadius:"10px",border:"1px solid #dce3ee"}}><b>Vinil:</b> ACQUALINER {d.vinilT}</span>
              <span style={{background:goldL,padding:"2px 7px",borderRadius:"10px",border:`1px solid ${gold}`}}><b>Estampa:</b> {d.stamp||"À escolha"}</span>
              <span style={{background:"#fff",padding:"2px 7px",borderRadius:"10px",border:"1px solid #dce3ee"}}><b>Chão:</b> {ar.chao}m² <b>Paredes:</b> {ar.par}m²</span>
            </div>
            {d.spa.on&&<div style={{marginTop:"6px",background:goldL,borderRadius:"6px",padding:"6px 8px",border:`1px solid ${gold}44`,fontSize:"8.5px"}}><b style={{color:navy}}>🌊 SPA Externo:</b> {d.spa.length}×{d.spa.width}×{d.spa.depth}m — Chão: {ar.sChao}m² | Paredes: {ar.sPar}m²</div>}
            {d.wMode==="irregular"&&<div style={{marginTop:"6px",background:"#eef2ff",borderRadius:"6px",padding:"6px 8px",border:"1px solid #c7d2fe",fontSize:"8.5px"}}><b style={{color:navy}}>📐 Paredes fora de esquadro:</b> {d.walls.map((w,i)=>`P${i+1}: ${w.l}×${w.h}m`).join(" | ")}</div>}
          </div></Sec>

          <Sec title="Serviços Inclusos"><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"2px"}}>{inc.map((s,i)=><div key={i} style={{padding:"4px 7px",background:i%2===0?lBg:"#fff",borderRadius:"4px",fontSize:"9.5px"}}><span style={{color:gold,fontWeight:"800"}}>✓ </span><b style={{color:navy}}>{s.n}</b>{s.q>1?` (${s.q}x)`:""}{s.nt?<span style={{color:"#888",fontStyle:"italic"}}> — {s.nt}</span>:""}</div>)}</div></Sec>

          <Sec title="Garantias"><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(85px,1fr))",gap:"5px"}}>{d.guar.filter(g=>g.on).map((g,i)=><div key={i} style={{background:lBg,border:`1px solid ${blue}22`,borderRadius:"8px",padding:"8px 4px",textAlign:"center"}}><div style={{fontSize:"22px",fontWeight:"800",color:blue,lineHeight:1}}>{g.y}</div><div style={{fontSize:"6.5px",color:"#999",textTransform:"uppercase"}}>anos</div><div style={{fontSize:"8px",color:navy,fontWeight:"600"}}>{g.it}</div></div>)}</div></Sec>

          <Sec title="Por Conta do Cliente"><div style={{background:goldL,borderRadius:"8px",padding:"8px 12px",border:`1px solid ${gold}44`}}>{d.ci.map((c,i)=><div key={i} style={{padding:"1px 0",fontSize:"9.5px"}}><span style={{color:gold,fontWeight:"800"}}>▸</span> <span style={{color:navy}}>{c}</span></div>)}</div></Sec>

          <div style={{background:`linear-gradient(135deg,${navy},${blue})`,borderRadius:"12px",padding:"18px",textAlign:"center",margin:"14px 0",position:"relative",overflow:"hidden"}}><div style={{position:"absolute",top:"-20px",right:"-20px",width:"70px",height:"70px",borderRadius:"50%",background:"rgba(232,177,0,.15)"}}/><div style={{fontSize:"7.5px",textTransform:"uppercase",letterSpacing:"3px",color:"rgba(255,255,255,.6)"}}>Valor Total</div><div style={{fontSize:"30px",fontWeight:"800",color:"#fff"}}>{fmt(total)}</div><div style={{width:"36px",height:"3px",background:gold,margin:"6px auto 0",borderRadius:"2px"}}/></div>

          <Sec title="Condições de Pagamento"><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"6px"}}>
            <div style={{background:lBg,borderRadius:"8px",padding:"10px",borderLeft:"3px solid #22c55e"}}><div style={{fontSize:"9.5px",fontWeight:"700",color:navy}}>💰 Pix / Dinheiro</div><div style={{fontSize:"8.5px",color:"#666"}}>{d.pay.pixD}% desc.</div><div style={{fontSize:"15px",fontWeight:"800",color:"#16a34a",marginTop:"2px"}}>{fmt(pix)}</div></div>
            <div style={{background:lBg,borderRadius:"8px",padding:"10px",borderLeft:`3px solid ${gold}`}}><div style={{fontSize:"9.5px",fontWeight:"700",color:navy}}>📋 Parcelado</div><div style={{fontSize:"8.5px",color:"#666"}}>{d.pay.entPct}% + {d.pay.balPct}%</div><div style={{fontSize:"12px",fontWeight:"700",color:navy,marginTop:"2px"}}>{fmt(ent)} + {fmt(bal)}</div></div>
            <div style={{background:lBg,borderRadius:"8px",padding:"10px",borderLeft:`3px solid ${blue}`}}><div style={{fontSize:"9.5px",fontWeight:"700",color:navy}}>💳 Cartão</div><div style={{fontSize:"8.5px",color:"#666"}}>Até {d.pay.noFee}x s/juros</div><div style={{fontSize:"12px",fontWeight:"700",color:blue,marginTop:"2px"}}>{d.pay.noFee}x {fmt(inst)}</div><div style={{fontSize:"7.5px",color:"#999"}}>Ou {d.pay.wFee}x c/juros</div></div>
            <div style={{background:lBg,borderRadius:"8px",padding:"10px",borderLeft:"3px solid #f59e0b"}}><div style={{fontSize:"9.5px",fontWeight:"700",color:navy}}>₿ Bitcoin</div><div style={{fontSize:"8.5px",color:"#666"}}>{d.pay.btcD}% desc.</div><div style={{fontSize:"15px",fontWeight:"800",color:"#d97706",marginTop:"2px"}}>{fmt(btc)}</div></div>
          </div></Sec>
        </div>

        <div style={{background:navy,padding:"12px 28px",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap"}}><div><div style={{fontSize:"8.5px",fontWeight:"700",color:gold}}>Válido por 15 dias</div><div style={{fontSize:"7px",color:"rgba(255,255,255,.5)"}}>{CO.name}</div></div><div style={{textAlign:"right",fontSize:"7.5px",color:"rgba(255,255,255,.6)"}}><div>{CO.ph1} / {CO.ph2}</div><div>{CO.email} | {CO.insta}</div></div></div>
      </div>
    </div>
  );
};

// ═══ MAIN ═══
export default function App(){
  const [view,setView]=useState("editor");
  const [tab,setTab]=useState("cliente");
  const [svcType,setST2]=useState("construcao");
  const [propNum,setPN]=useState("");
  const [poolFmt,setPF]=useState("Retangular");
  const [vinilT,setVT]=useState("0,7mm");
  const [stamp,setSt]=useState("");
  const [execDays,setED]=useState("20");
  const [gM,setGM]=useState(40);
  const [client,setCl]=useState({name:"",phone:"",address:"",city:"",cpf:"",rg:"",email:""});
  const uc=f=>v=>setCl(p=>({...p,[f]:v}));
  const [pool,setPool]=useState({length:"10.00",width:"4.00",depth:"1.40"});
  const up=f=>v=>setPool(p=>({...p,[f]:v}));

  // SPA
  const [spa,setSpa]=useState({on:false,length:"2.00",width:"2.00",depth:"0.80"});
  const uSpa=f=>v=>setSpa(p=>({...p,[f]:v}));

  // WALLS irregular
  const [wMode,setWM]=useState("regular"); // "regular" | "irregular"
  const [walls,setWalls]=useState([{l:"10",h:"1.40"},{l:"4",h:"1.40"},{l:"10",h:"1.40"},{l:"4",h:"1.40"}]);
  const addWall=()=>setWalls(p=>[...p,{l:"",h:pool.depth||"1.40"}]);
  const rmWall=i=>setWalls(p=>p.filter((_,x)=>x!==i));
  const uWall=(i,f,v)=>setWalls(p=>p.map((w,x)=>x===i?{...w,[f]:v}:w));

  const [items,setItems]=useState(mkItems);
  const [guar,setG]=useState(()=>mkG("construcao"));
  const [ci,setCI]=useState(ICI);
  const [newCI,setNCI]=useState("");
  const [pay,setPay]=useState(IPAY);
  const [mo,setMO]=useState("15000");
  const [totOv,setTO]=useState("");
  const [hist,setHist]=useState([]);
  const [fb,setFb]=useState("");
  const [catO,setCatO]=useState(false);
  const [catQ,setCatQ]=useState("");

  const inc=items.filter(i=>i.on);
  // Calculate effective quantity based on unit type
  const ar=calcA(pool,spa,wMode,walls);

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
  const apM=()=>{setItems(p=>p.map(i=>({...i,m:gM})));setFb("Margem aplicada!");setTimeout(()=>setFb(""),1500)};

  const gData=()=>({client,pool,items,guar,ci,pay,totOv:String(total),vinilT,svcType,propNum,poolFmt,mo,gM,execDays,stamp,spa,wMode,walls});
  const save=()=>{const d=gData();setHist(p=>[{id:Date.now(),date:new Date().toLocaleDateString("pt-BR"),data:d,cN:client.name,cC:client.city,tot:String(total),ps:`${pool.length}x${pool.width}x${pool.depth}`,type:svcType,stamp},...p]);setFb("Salvo!");setTimeout(()=>setFb(""),2000)};
  const load=q=>{const d=q.data;setCl(d.client);setPool(d.pool);setItems(d.items);setG(d.guar);setCI(d.ci);setPay(d.pay);setTO(d.totOv);setVT(d.vinilT);setST2(d.svcType);setPN(d.propNum);setPF(d.poolFmt);setMO(d.mo);setGM(d.gM);setED(d.execDays);setSt(d.stamp||"");setSpa(d.spa||{on:false,length:"2",width:"2",depth:"0.8"});setWM(d.wMode||"regular");setWalls(d.walls||[]);setTab("cliente");setFb("Carregado!");setTimeout(()=>setFb(""),1500)};
  const delQ=id=>{setHist(p=>p.filter(q=>q.id!==id));setFb("Excluído!");setTimeout(()=>setFb(""),1500)};

  if(view==="quote")return <QP d={gData()} onBack={()=>setView("editor")}/>;

  const g2={display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px"};

  return(
    <div style={{fontFamily:"'Segoe UI',sans-serif",maxWidth:"920px",margin:"0 auto",background:"#f1f5f9",minHeight:"100vh"}}>
      <div style={{background:`linear-gradient(135deg,#001d3d,${blue} 60%,#0077cc)`,padding:"14px 18px",color:"#fff"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:"6px"}}>
          <div><div style={{fontSize:"17px",fontWeight:"800"}}>💧 VINIL VALE</div><div style={{fontSize:"9px",opacity:.7}}>{CO.insta} · {VER}</div></div>
          <div style={{display:"flex",gap:"5px",alignItems:"center",flexWrap:"wrap"}}>
            {fb&&<span style={{background:"rgba(255,255,255,.2)",padding:"4px 8px",borderRadius:"5px",fontSize:"10px",fontWeight:"600"}}>✅ {fb}</span>}
            <Btn onClick={save} style={{background:"rgba(255,255,255,.12)",color:"#fff",border:"1px solid rgba(255,255,255,.25)"}}>💾 Salvar</Btn>
            <Btn onClick={()=>setView("quote")} style={{background:"#fff",color:blue,fontWeight:"700"}}>📄 Orçamento</Btn>
          </div>
        </div>
        <div style={{display:"flex",gap:"5px",marginTop:"10px",flexWrap:"wrap"}}>{SVC.map(t=><button key={t.id} onClick={()=>{setST2(t.id);setItems(mkItems());setG(mkG(t.id))}} style={{padding:"5px 10px",borderRadius:"16px",border:"1.5px solid rgba(255,255,255,.3)",background:svcType===t.id?"rgba(255,255,255,.2)":"transparent",color:"#fff",fontSize:"10px",fontWeight:svcType===t.id?"700":"400",cursor:"pointer"}}>{t.icon} {t.label}</button>)}</div>
      </div>

      <div style={{display:"flex",padding:"0 14px",background:"#fff",borderBottom:"1px solid #e2e8f0",overflowX:"auto"}}>
        {[["cliente","👤","Cliente"],["piscina","🏊","Piscina"],["itens","🛒","Custos"],["garantias","🛡","Garantias"],["pagamento","💰","Valor"],["historico","📋","Salvos"]].map(([k,ic,lb])=><Tab key={k} a={tab===k} onClick={()=>setTab(k)} icon={ic}>{lb}</Tab>)}
      </div>

      <div style={{padding:"14px"}}>
        {/* CLIENTE */}
        {tab==="cliente"&&<Card><ST icon="👤">Dados do Cliente</ST>
          <div style={{display:"flex",gap:"10px",marginBottom:"10px"}}><Inp label="Proposta" value={propNum} onChange={setPN} placeholder="03/26" style={{flex:"0 0 90px"}}/><Inp label="Nome completo" value={client.name} onChange={uc("name")} placeholder="Nome" style={{flex:1}}/></div>
          <div style={g2}><Inp label="WhatsApp" value={client.phone} onChange={uc("phone")} placeholder="(13) 99999-9999"/><Inp label="Email" value={client.email} onChange={uc("email")} placeholder="email@email.com"/><Inp label="Endereço" value={client.address} onChange={uc("address")} placeholder="Rua, nº, bairro"/><Inp label="Cidade" value={client.city} onChange={uc("city")} placeholder="Registro-SP"/><Inp label="CPF/CNPJ" value={client.cpf} onChange={uc("cpf")} placeholder="000.000.000-00"/><Inp label="RG" value={client.rg} onChange={uc("rg")}/></div>
        </Card>}

        {/* PISCINA */}
        {tab==="piscina"&&<Card><ST icon="🏊">Piscina</ST>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:"10px"}}><Inp label="Comp. (m)" value={pool.length} onChange={up("length")}/><Inp label="Larg. (m)" value={pool.width} onChange={up("width")}/><Inp label="Prof. (m)" value={pool.depth} onChange={up("depth")}/><Sel label="Formato" value={poolFmt} onChange={setPF} options={PFMT}/></div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"10px",marginTop:"10px"}}><Sel label="Vinil" value={vinilT} onChange={setVT} options={VOPTS.map(v=>({value:v.t,label:`${v.t} (${v.w}a)`}))}/><Sel label="Estampa" value={stamp} onChange={setSt} options={[{value:"",label:"— Escolha —"},...ALLST.map(s=>({value:s,label:s}))]}/><Inp label="Prazo (dias)" value={execDays} onChange={setED}/></div>

          {/* MODO PAREDES */}
          <div style={{marginTop:"14px",background:"#f8fafc",borderRadius:"8px",padding:"12px",border:"1px solid #e2e8f0"}}>
            <div style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"8px"}}>
              <span style={{fontSize:"11px",fontWeight:"700",color:navy}}>📐 Cálculo das Paredes:</span>
              <button onClick={()=>setWM("regular")} style={{padding:"4px 10px",borderRadius:"14px",border:`1.5px solid ${wMode==="regular"?blue:"#cbd5e1"}`,background:wMode==="regular"?blue:"#fff",color:wMode==="regular"?"#fff":"#64748b",fontSize:"10px",fontWeight:"600",cursor:"pointer"}}>Esquadro (padrão)</button>
              <button onClick={()=>setWM("irregular")} style={{padding:"4px 10px",borderRadius:"14px",border:`1.5px solid ${wMode==="irregular"?blue:"#cbd5e1"}`,background:wMode==="irregular"?blue:"#fff",color:wMode==="irregular"?"#fff":"#64748b",fontSize:"10px",fontWeight:"600",cursor:"pointer"}}>Fora de Esquadro</button>
            </div>
            {wMode==="irregular"&&<div>
              <div style={{fontSize:"9px",color:"#64748b",marginBottom:"6px"}}>Defina cada parede com comprimento e altura diferentes:</div>
              {walls.map((w,i)=><div key={i} style={{display:"flex",gap:"6px",alignItems:"center",marginBottom:"4px"}}>
                <span style={{fontSize:"10px",fontWeight:"600",color:navy,minWidth:"30px"}}>P{i+1}</span>
                <Inp label="" value={w.l} onChange={v=>uWall(i,"l",v)} placeholder="Comp." style={{flex:1}}/>
                <span style={{fontSize:"10px",color:"#94a3b8"}}>×</span>
                <Inp label="" value={w.h} onChange={v=>uWall(i,"h",v)} placeholder="Alt." style={{flex:1}}/>
                <span style={{fontSize:"9px",color:"#94a3b8"}}>m</span>
                <span style={{fontSize:"10px",color:blue,fontWeight:"700"}}>{((parseFloat(w.l)||0)*(parseFloat(w.h)||0)).toFixed(1)}m²</span>
                {walls.length>2&&<button onClick={()=>rmWall(i)} style={{background:"none",border:"none",color:"#ef4444",cursor:"pointer",fontSize:"12px"}}>✕</button>}
              </div>)}
              <Btn onClick={addWall} style={{marginTop:"4px",fontSize:"9px"}}>+ Parede</Btn>
            </div>}
            {wMode==="regular"&&<div style={{fontSize:"10px",color:"#64748b"}}>Paredes calculadas automaticamente: 2×({pool.length}×{pool.depth}) + 2×({pool.width}×{pool.depth})</div>}
          </div>

          {/* SPA */}
          <div style={{marginTop:"14px",background:spa.on?"#fef9e7":"#f8fafc",borderRadius:"8px",padding:"12px",border:`1px solid ${spa.on?gold+"55":"#e2e8f0"}`}}>
            <div style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:spa.on?"10px":"0"}}>
              <button onClick={()=>setSpa(p=>({...p,on:!p.on}))} style={{width:"36px",height:"20px",borderRadius:"10px",border:"none",background:spa.on?gold:"#cbd5e1",cursor:"pointer",position:"relative"}}><div style={{width:"16px",height:"16px",borderRadius:"50%",background:"#fff",position:"absolute",top:"2px",left:spa.on?"18px":"2px",transition:"left .2s",boxShadow:"0 1px 3px rgba(0,0,0,.2)"}}/></button>
              <span style={{fontSize:"11px",fontWeight:"700",color:navy}}>🌊 Spa Externo</span>
              {!spa.on&&<span style={{fontSize:"9px",color:"#94a3b8"}}>— Clique para adicionar</span>}
            </div>
            {spa.on&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"8px"}}><Inp label="Comp. Spa (m)" value={spa.length} onChange={uSpa("length")}/><Inp label="Larg. Spa (m)" value={spa.width} onChange={uSpa("width")}/><Inp label="Prof. Spa (m)" value={spa.depth} onChange={uSpa("depth")}/></div>}
          </div>

          {/* Stamp catalog */}
          {stamp===""&&<div style={{marginTop:"14px",background:"#f8fafc",borderRadius:"8px",padding:"12px",border:"1px solid #e2e8f0"}}><div style={{fontSize:"11px",fontWeight:"700",color:blue,marginBottom:"8px"}}>🎨 Estampas ACQUALINER</div>{STAMPS.map((cat,ci2)=><div key={ci2} style={{marginBottom:"6px"}}><div style={{fontSize:"10px",fontWeight:"700",color:"#333",marginBottom:"3px"}}>{cat.c}</div><div style={{display:"flex",gap:"3px",flexWrap:"wrap"}}>{cat.i.map((s,si)=><button key={si} onClick={()=>setSt(s)} style={{padding:"3px 8px",borderRadius:"12px",border:"1.5px solid #c7d2fe",background:"#edf2ff",color:blue,fontSize:"9px",fontWeight:"600",cursor:"pointer"}}>{s}</button>)}</div></div>)}</div>}
          {stamp&&<div style={{marginTop:"10px",background:"#edf2ff",borderRadius:"8px",padding:"8px 10px",display:"flex",alignItems:"center",justifyContent:"space-between"}}><div><span style={{fontSize:"10px",color:"#64748b"}}>Estampa:</span> <b style={{color:blue,fontSize:"13px"}}>{stamp}</b></div><Btn onClick={()=>setSt("")} style={{fontSize:"9px",padding:"3px 6px"}}>✕</Btn></div>}

          {/* SUMMARY */}
          <div style={{marginTop:"14px",background:"linear-gradient(135deg,#edf2ff,#f0f4ff)",borderRadius:"10px",padding:"14px"}}>
            <div style={{display:"flex",justifyContent:"center",gap:"12px",flexWrap:"wrap",alignItems:"center"}}>
              <div style={{textAlign:"center"}}><div style={{fontSize:"15px",fontWeight:"800",color:blue}}>{pool.length}×{pool.width}×{pool.depth}m</div><div style={{fontSize:"8px",color:"#64748b"}}>Piscina</div></div>
              <div style={{width:"1px",height:"24px",background:"#cbd5e1"}}/>
              <div style={{textAlign:"center"}}><div style={{fontSize:"15px",fontWeight:"800",color:"#003d7a"}}>{ar.chao} m²</div><div style={{fontSize:"8px",color:"#64748b"}}>Chão</div></div>
              <div style={{width:"1px",height:"24px",background:"#cbd5e1"}}/>
              <div style={{textAlign:"center"}}><div style={{fontSize:"15px",fontWeight:"800",color:"#003d7a"}}>{ar.par} m²</div><div style={{fontSize:"8px",color:"#64748b"}}>Paredes{wMode==="irregular"?" ⚠️":""}</div></div>
              {spa.on&&<><div style={{width:"1px",height:"24px",background:"#cbd5e1"}}/><div style={{textAlign:"center"}}><div style={{fontSize:"15px",fontWeight:"800",color:"#b45309"}}>{(parseFloat(ar.sChao)+parseFloat(ar.sPar)).toFixed(1)} m²</div><div style={{fontSize:"8px",color:"#64748b"}}>Spa</div></div></>}
              <div style={{width:"1px",height:"24px",background:"#cbd5e1"}}/>
              <div style={{textAlign:"center",background:gold,borderRadius:"8px",padding:"4px 12px"}}><div style={{fontSize:"18px",fontWeight:"800",color:navy}}>{ar.tot} m²</div><div style={{fontSize:"8px",color:navy,fontWeight:"600"}}>Área Total</div></div>
              <div style={{width:"1px",height:"24px",background:"#cbd5e1"}}/>
              <div style={{textAlign:"center"}}><div style={{fontSize:"14px",fontWeight:"800",color:"#003d7a"}}>{ar.perim} m</div><div style={{fontSize:"8px",color:"#64748b"}}>Perímetro</div></div>
              <div style={{width:"1px",height:"24px",background:"#cbd5e1"}}/>
              <div style={{textAlign:"center"}}><div style={{fontSize:"14px",fontWeight:"800",color:"#003d7a"}}>{ar.vol} m³</div><div style={{fontSize:"8px",color:"#64748b"}}>Volume</div></div>
            </div>
          </div>
        </Card>}

        {/* ITENS */}
        {tab==="itens"&&<Card><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"12px",flexWrap:"wrap",gap:"6px"}}><ST icon="🛒">Custos</ST><div style={{display:"flex",gap:"5px",alignItems:"center"}}><span style={{fontSize:"9px",color:"#64748b",fontWeight:"600"}}>Margem:</span><input value={gM} onChange={e=>setGM(parseFloat(e.target.value)||0)} style={{width:"38px",padding:"3px",border:"1px solid #e2e8f0",borderRadius:"4px",textAlign:"center",fontSize:"11px",fontWeight:"700"}}/><span style={{fontSize:"9px"}}>%</span><Btn onClick={apM} style={{fontSize:"9px",padding:"3px 6px"}}>Aplicar</Btn></div></div>
          <div style={{display:"grid",gridTemplateColumns:"24px 1fr 50px 68px 44px 78px 24px",gap:"3px",padding:"4px 0",borderBottom:"2px solid #e2e8f0",fontSize:"7.5px",fontWeight:"700",color:"#64748b",textTransform:"uppercase"}}><div/><div>Item</div><div>Qtd</div><div>R$/un</div><div>%</div><div>Total</div><div/></div>
          {items.map(it=>{const eQ=it.un==="m²"?parseFloat(ar.tot)||0:it.un==="chao"?parseFloat(ar.chaoTot)||0:it.un==="ml"?parseFloat(ar.perim)||0:it.q||0;const sell=(it.c||0)*(1+(it.m||0)/100);const lt=eQ*sell;const unLabel=it.un==="m²"?"m²":it.un==="chao"?"chão":it.un==="ml"?"ml":"un";const unBg=it.un==="m²"?"#dbeafe":it.un==="chao"?"#d1fae5":it.un==="ml"?"#fef3c7":"";const unColor=it.un==="m²"?"#1e40af":it.un==="chao"?"#065f46":it.un==="ml"?"#92400e":"";return(
            <div key={it.id} style={{display:"grid",gridTemplateColumns:"24px 1fr 50px 68px 44px 78px 24px",gap:"3px",padding:"4px 0",borderBottom:"1px solid #f1f5f9",alignItems:"center",opacity:it.on?1:.35}}>
              <button onClick={()=>ti(it.id)} style={{width:"16px",height:"16px",borderRadius:"3px",border:`2px solid ${it.on?blue:"#cbd5e1"}`,background:it.on?blue:"#fff",color:"#fff",fontSize:"9px",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>{it.on?"✓":""}</button>
              <div><input value={it.n} onChange={e=>ui(it.id,"n",e.target.value)} style={{border:"none",fontSize:"11px",fontWeight:"600",width:"100%",outline:"none",background:"transparent"}}/><div style={{display:"flex",alignItems:"center",gap:"4px"}}><input value={it.nt||""} onChange={e=>ui(it.id,"nt",e.target.value)} placeholder="obs" style={{border:"none",fontSize:"9px",color:"#94a3b8",width:"calc(100% - 35px)",outline:"none",fontStyle:"italic",background:"transparent"}}/>{it.un!=="un"&&<span style={{fontSize:"7px",background:unBg,color:unColor,padding:"1px 4px",borderRadius:"3px",fontWeight:"700",whiteSpace:"nowrap"}}>{unLabel}</span>}</div></div>
              {it.un==="un"?<input value={it.q} onChange={e=>ui(it.id,"q",parseInt(e.target.value)||0)} style={{width:"100%",padding:"2px",border:"1px solid #e2e8f0",borderRadius:"3px",textAlign:"center",fontSize:"10px"}}/>:<div style={{fontSize:"9px",color:blue,fontWeight:"700",textAlign:"center"}}>{eQ.toFixed(1)}</div>}
              <input value={it.c} onChange={e=>ui(it.id,"c",parseFloat(e.target.value)||0)} type="number" step="0.01" style={{width:"100%",padding:"2px",border:"1px solid #e2e8f0",borderRadius:"3px",textAlign:"right",fontSize:"10px"}}/>
              <div style={{display:"flex",alignItems:"center"}}><input value={it.m} onChange={e=>ui(it.id,"m",parseFloat(e.target.value)||0)} style={{width:"28px",padding:"2px",border:"1px solid #e2e8f0",borderRadius:"3px",textAlign:"center",fontSize:"10px"}}/><span style={{fontSize:"8px",color:"#94a3b8"}}>%</span></div>
              <div style={{fontSize:"10px",fontWeight:"600",color:blue,textAlign:"right"}}>{fmt(lt)}</div>
              <button onClick={()=>ri(it.id)} style={{background:"none",border:"none",color:"#ef4444",cursor:"pointer",fontSize:"11px"}}>✕</button>
            </div>
          )})}
          <div style={{display:"flex",gap:"5px",marginTop:"10px"}}><Btn onClick={()=>setCatO(!catO)} style={{background:blue,color:"#fff",border:"none"}}>📦 Catálogo</Btn><Btn onClick={addM}>+ Manual</Btn></div>
          {catO&&<div style={{marginTop:"10px",background:"#f8fafc",borderRadius:"8px",padding:"10px",border:"1px solid #e2e8f0"}}><input value={catQ} onChange={e=>setCatQ(e.target.value)} placeholder="Buscar..." style={{width:"100%",padding:"6px 8px",border:"1.5px solid #e2e8f0",borderRadius:"5px",fontSize:"11px",marginBottom:"8px",outline:"none"}}/><div style={{maxHeight:"200px",overflow:"auto"}}>{CAT.filter(p=>!catQ||p.n.toLowerCase().includes(catQ.toLowerCase())||p.c.toLowerCase().includes(catQ.toLowerCase())).map(p=><div key={p.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"4px 6px",background:"#fff",borderRadius:"4px",border:"1px solid #e2e8f0",marginBottom:"2px"}}><div><span style={{fontSize:"7px",background:"#edf2ff",color:blue,padding:"1px 4px",borderRadius:"3px",fontWeight:"600",marginRight:"3px"}}>{p.c}</span><span style={{fontSize:"11px",fontWeight:"600"}}>{p.n}</span>{p.un!=="un"&&<span style={{fontSize:"7px",background:p.un==="m²"?"#dbeafe":"#fef3c7",color:p.un==="m²"?"#1e40af":"#92400e",padding:"1px 4px",borderRadius:"3px",fontWeight:"700",marginLeft:"4px"}}>/{p.un}</span>}<div style={{fontSize:"9px",color:"#94a3b8"}}>{p.s}</div></div><div style={{display:"flex",alignItems:"center",gap:"5px"}}><span style={{fontSize:"11px",fontWeight:"700",color:blue}}>{fmt(p.p)}{p.un!=="un"?"/"+p.un:""}</span><Btn onClick={()=>addC(p)} style={{fontSize:"9px",padding:"2px 5px",background:blue,color:"#fff",border:"none"}}>+</Btn></div></div>)}</div></div>}
          <div style={{marginTop:"14px",borderTop:"2px solid #e2e8f0",paddingTop:"12px",display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"8px"}}>
            <div style={{background:"#fef2f2",borderRadius:"8px",padding:"10px",textAlign:"center",border:"1px solid #fecaca"}}><div style={{fontSize:"8px",color:"#991b1b",fontWeight:"600",textTransform:"uppercase"}}>Custo</div><div style={{fontSize:"16px",fontWeight:"800",color:"#dc2626"}}>{fmt(matC)}</div></div>
            <div style={{background:"#f0fdf4",borderRadius:"8px",padding:"10px",textAlign:"center",border:"1px solid #bbf7d0"}}><div style={{fontSize:"8px",color:"#166534",fontWeight:"600",textTransform:"uppercase"}}>Venda</div><div style={{fontSize:"16px",fontWeight:"800",color:"#16a34a"}}>{fmt(matS)}</div></div>
            <div style={{background:"#eff6ff",borderRadius:"8px",padding:"10px",textAlign:"center",border:"1px solid #bfdbfe"}}><div style={{fontSize:"8px",color:"#1e40af",fontWeight:"600",textTransform:"uppercase"}}>Lucro</div><div style={{fontSize:"16px",fontWeight:"800",color:"#2563eb"}}>{fmt(matS-matC)}</div></div>
          </div>
          <div style={{marginTop:"16px",borderTop:"1px solid #e2e8f0",paddingTop:"12px"}}><ST icon="⚠️">Por conta do cliente</ST>
            {ci.map((c,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:"5px",padding:"3px 0",borderBottom:"1px solid #f1f5f9"}}><span style={{color:"#f59e0b"}}>▸</span><span style={{flex:1,fontSize:"11px"}}>{c}</span><button onClick={()=>setCI(p=>p.filter((_,x)=>x!==i))} style={{background:"none",border:"none",color:"#ef4444",cursor:"pointer"}}>✕</button></div>)}
            <div style={{display:"flex",gap:"5px",marginTop:"5px"}}><input value={newCI} onChange={e=>setNCI(e.target.value)} placeholder="Adicionar..." onKeyDown={e=>{if(e.key==="Enter"&&newCI.trim()){setCI(p=>[...p,newCI.trim()]);setNCI("")}}} style={{flex:1,padding:"5px 7px",border:"1.5px solid #e2e8f0",borderRadius:"5px",fontSize:"10px",outline:"none"}}/><Btn onClick={()=>{if(newCI.trim()){setCI(p=>[...p,newCI.trim()]);setNCI("")}}}>+</Btn></div>
          </div>
        </Card>}

        {/* GARANTIAS */}
        {tab==="garantias"&&<Card><ST icon="🛡">Garantias</ST>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(130px,1fr))",gap:"10px"}}>{guar.map(g=>(
            <div key={g.id} style={{textAlign:"center",background:g.on?"linear-gradient(135deg,#edf2ff,#f0f4ff)":"#f9fafb",borderRadius:"10px",padding:"12px",border:`1.5px solid ${g.on?"#93c5fd":"#e5e7eb"}`,opacity:g.on?1:.5}}>
              <button onClick={()=>setG(p=>p.map(gg=>gg.id===g.id?{...gg,on:!gg.on}:gg))} style={{background:g.on?blue:"#d1d5db",color:"#fff",border:"none",borderRadius:"8px",padding:"1px 7px",fontSize:"8px",cursor:"pointer",marginBottom:"4px"}}>{g.on?"Ativo":"Off"}</button>
              <div style={{fontSize:"26px",fontWeight:"800",color:blue}}>{g.y}</div><div style={{fontSize:"9px",color:"#64748b"}}>anos</div>
              <input value={g.it} onChange={e=>setG(p=>p.map(gg=>gg.id===g.id?{...gg,it:e.target.value}:gg))} style={{marginTop:"3px",textAlign:"center",border:"1px solid #e2e8f0",borderRadius:"4px",padding:"2px",fontSize:"10px",width:"100%",fontWeight:"600"}}/>
              <div style={{display:"flex",justifyContent:"center",gap:"3px",marginTop:"4px"}}><Btn onClick={()=>setG(p=>p.map(gg=>gg.id===g.id?{...gg,y:Math.max(1,gg.y-1)}:gg))}>−</Btn><Btn onClick={()=>setG(p=>p.map(gg=>gg.id===g.id?{...gg,y:gg.y+1}:gg))}>+</Btn></div>
            </div>
          ))}</div>
        </Card>}

        {/* PAGAMENTO */}
        {tab==="pagamento"&&<Card><ST icon="💰">Valor Final</ST>
          <div style={g2}>
            <div style={{background:"#fefce8",borderRadius:"8px",padding:"12px",border:"1.5px solid #fde68a"}}><div style={{fontSize:"9px",fontWeight:"700",color:"#92400e",marginBottom:"4px"}}>🔨 MÃO DE OBRA</div><div style={{display:"flex",alignItems:"center",gap:"3px"}}><span style={{fontSize:"12px",color:"#92400e"}}>R$</span><input value={mo} onChange={e=>setMO(e.target.value.replace(/[^\d]/g,""))} style={{flex:1,padding:"5px",border:"1.5px solid #fde68a",borderRadius:"5px",fontSize:"16px",fontWeight:"700",textAlign:"center",outline:"none"}}/></div></div>
            <div style={{background:`linear-gradient(135deg,${blue},#003d7a)`,borderRadius:"8px",padding:"12px",color:"#fff",textAlign:"center"}}><div style={{fontSize:"8px",textTransform:"uppercase",letterSpacing:"1px",opacity:.8}}>Total Calculado</div><div style={{fontSize:"22px",fontWeight:"800"}}>{fmt(tCalc)}</div><div style={{fontSize:"8px",opacity:.6}}>Material + M.O.</div></div>
          </div>
          <div style={{background:"#faf5ff",borderRadius:"8px",padding:"10px",border:"1.5px solid #e9d5ff",marginTop:"12px",marginBottom:"14px"}}><div style={{fontSize:"9px",fontWeight:"700",color:"#7e22ce",marginBottom:"4px"}}>✏️ VALOR FINAL (sobrescrever)</div><div style={{display:"flex",alignItems:"center",gap:"4px"}}><span style={{fontSize:"12px",color:"#7e22ce"}}>R$</span><input value={totOv} onChange={e=>setTO(e.target.value.replace(/[^\d.,]/g,""))} placeholder={String(Math.round(tCalc))} style={{flex:1,padding:"6px",border:"1.5px solid #e9d5ff",borderRadius:"5px",fontSize:"20px",fontWeight:"800",textAlign:"center",outline:"none",color:"#7e22ce"}}/></div><div style={{fontSize:"8px",color:"#94a3b8",textAlign:"center",marginTop:"3px"}}>Vazio = calculado</div></div>
          <div style={g2}>
            <div style={{background:"#f0fdf4",borderRadius:"8px",padding:"10px",border:"1.5px solid #86efac"}}><div style={{fontSize:"10px",fontWeight:"700",color:"#166534",marginBottom:"5px"}}>🟢 Pix</div><div style={{display:"flex",alignItems:"center",gap:"3px"}}><input value={pay.pixD} onChange={e=>setPay(p=>({...p,pixD:parseFloat(e.target.value)||0}))} style={{width:"35px",padding:"2px",border:"1px solid #e2e8f0",borderRadius:"3px",textAlign:"center",fontSize:"11px",fontWeight:"700"}}/><span style={{fontSize:"9px"}}>%</span></div><div style={{fontSize:"14px",fontWeight:"800",color:blue,marginTop:"3px"}}>{fmt(total*(1-pay.pixD/100))}</div></div>
            <div style={{background:"#fefce8",borderRadius:"8px",padding:"10px",border:"1.5px solid #fde68a"}}><div style={{fontSize:"10px",fontWeight:"700",color:"#92400e",marginBottom:"5px"}}>🟡 Parcelado</div><div style={{display:"flex",alignItems:"center",gap:"3px"}}><input value={pay.entPct} onChange={e=>{const v=parseFloat(e.target.value)||0;setPay(p=>({...p,entPct:v,balPct:100-v}))}} style={{width:"35px",padding:"2px",border:"1px solid #e2e8f0",borderRadius:"3px",textAlign:"center",fontSize:"11px",fontWeight:"700"}}/><span style={{fontSize:"9px"}}>%+{pay.balPct}%</span></div><div style={{fontSize:"11px",color:"#78350f",marginTop:"3px"}}>{fmt(total*pay.entPct/100)}+{fmt(total*pay.balPct/100)}</div></div>
            <div style={{background:"#eef2ff",borderRadius:"8px",padding:"10px",border:"1.5px solid #c7d2fe"}}><div style={{fontSize:"10px",fontWeight:"700",color:"#3730a3",marginBottom:"5px"}}>🔵 Cartão</div><div style={{display:"flex",alignItems:"center",gap:"3px",marginBottom:"2px"}}><input value={pay.noFee} onChange={e=>setPay(p=>({...p,noFee:parseInt(e.target.value)||0}))} style={{width:"28px",padding:"2px",border:"1px solid #e2e8f0",borderRadius:"3px",textAlign:"center",fontSize:"11px",fontWeight:"700"}}/><span style={{fontSize:"9px"}}>x s/juros</span></div><div style={{display:"flex",alignItems:"center",gap:"3px"}}><input value={pay.wFee} onChange={e=>setPay(p=>({...p,wFee:parseInt(e.target.value)||0}))} style={{width:"28px",padding:"2px",border:"1px solid #e2e8f0",borderRadius:"3px",textAlign:"center",fontSize:"11px",fontWeight:"700"}}/><span style={{fontSize:"9px"}}>x c/juros</span></div></div>
            <div style={{background:"#fdf4ff",borderRadius:"8px",padding:"10px",border:"1.5px solid #e9d5ff"}}><div style={{fontSize:"10px",fontWeight:"700",color:"#7e22ce",marginBottom:"5px"}}>🟣 Bitcoin</div><div style={{display:"flex",alignItems:"center",gap:"3px"}}><input value={pay.btcD} onChange={e=>setPay(p=>({...p,btcD:parseFloat(e.target.value)||0}))} style={{width:"35px",padding:"2px",border:"1px solid #e2e8f0",borderRadius:"3px",textAlign:"center",fontSize:"11px",fontWeight:"700"}}/><span style={{fontSize:"9px"}}>%</span></div><div style={{fontSize:"14px",fontWeight:"800",color:"#7e22ce",marginTop:"3px"}}>{fmt(total*(1-pay.btcD/100))}</div></div>
          </div>
        </Card>}

        {/* HISTÓRICO */}
        {tab==="historico"&&<Card><ST icon="📋">Orçamentos Salvos</ST>
          {hist.length===0?<div style={{textAlign:"center",padding:"24px",color:"#94a3b8"}}><div style={{fontSize:"28px"}}>📭</div><div style={{fontSize:"11px"}}>Nenhum salvo.</div></div>:
          <div style={{display:"flex",flexDirection:"column",gap:"5px"}}>{hist.map(q=>(
            <div key={q.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 12px",background:"#f8fafc",borderRadius:"7px",border:"1.5px solid #e2e8f0"}} onMouseEnter={e=>e.currentTarget.style.borderColor=blue} onMouseLeave={e=>e.currentTarget.style.borderColor="#e2e8f0"}>
              <div onClick={()=>load(q)} style={{flex:1,cursor:"pointer"}}><div style={{fontSize:"12px",fontWeight:"700"}}>{q.cN||"Sem nome"} {q.stamp?`· ${q.stamp}`:""}</div><div style={{fontSize:"9px",color:"#94a3b8"}}>{q.date} · {SVC.find(t=>t.id===q.type)?.label} · {q.ps}m · {q.cC}</div></div>
              <div style={{display:"flex",alignItems:"center",gap:"8px"}}><div style={{fontSize:"14px",fontWeight:"800",color:blue}}>{fmt(parseFloat(q.tot)||0)}</div><Btn onClick={()=>load(q)} style={{fontSize:"9px",padding:"3px 6px",background:blue,color:"#fff",border:"none"}}>Abrir</Btn><button onClick={e=>{e.stopPropagation();delQ(q.id)}} style={{background:"none",border:"none",color:"#ef4444",cursor:"pointer",fontSize:"13px"}}>🗑</button></div>
            </div>
          ))}</div>}
        </Card>}
      </div>
    </div>
  );
}
