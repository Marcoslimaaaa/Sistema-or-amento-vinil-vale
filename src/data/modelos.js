// Biblioteca de modelos de piscina — cada modelo gera um "desenho"
// ({ vertices, formas }) parametrizado por comprimento L × largura W (metros).
// Convenção: x ao longo de L, y ao longo de W, origem (0,0), y para baixo.
// Formatos são dados geométricos próprios (inspirados nos formatos clássicos
// do mercado); o editor permite ajustar qualquer um depois de aplicado.

const rect = (L, W) => [{ x: 0, y: 0 }, { x: L, y: 0 }, { x: L, y: W }, { x: 0, y: W }];
const arco = (cx, cy, r, a0, a1, n) => {
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const a = a0 + ((a1 - a0) * i) / n;
    pts.push({ x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) });
  }
  return pts;
};
const arredonda = pts => pts.map(p => ({ x: Math.round(p.x * 100) / 100, y: Math.round(p.y * 100) / 100 }));
let seq = 0;
const forma = (tipo, props) => ({
  id: `m${Date.now().toString(36)}${seq++}`,
  tipo,
  operacao: tipo === "recorte" ? "subtracao" : "uniao",
  rotacaoGraus: 0,
  ...props,
});

export const MODELOS = [
  { id: "retangular", nome: "Retangular", build: (L, W) => ({ vertices: rect(L, W), formas: [] }) },
  {
    id: "retangular-prainha", nome: "Retangular + Prainha",
    build: (L, W) => ({
      vertices: rect(L, W),
      formas: [forma("prainha", { larguraM: Math.max(2, L * 0.45), comprimentoM: Math.max(1.2, W * 0.35), cxM: L * 0.25, cyM: W, profundidadeM: 0.3 })],
    }),
  },
  {
    id: "retangular-escada", nome: "Retangular + Escada",
    build: (L, W) => ({
      vertices: rect(L, W),
      formas: [forma("escada", { larguraM: Math.min(2.5, W * 0.8), comprimentoM: 1.2, cxM: L, cyM: W / 2, rotacaoGraus: 90, degrausQtd: 3, profundidadeM: 0.75 })],
    }),
  },
  {
    id: "prainha-escada", nome: "Prainha + Escada",
    build: (L, W) => ({
      vertices: rect(L, W),
      formas: [
        forma("prainha", { larguraM: Math.max(2, L * 0.4), comprimentoM: Math.max(1.2, W * 0.35), cxM: L * 0.22, cyM: W, profundidadeM: 0.3 }),
        forma("escada", { larguraM: Math.min(2.2, W * 0.6), comprimentoM: 1.1, cxM: L, cyM: W * 0.4, rotacaoGraus: 90, degrausQtd: 3, profundidadeM: 0.75 }),
      ],
    }),
  },
  {
    id: "spa-canto", nome: "Com Spa no canto",
    build: (L, W) => ({
      vertices: rect(L, W),
      formas: [forma("spa", { larguraM: 2.4, comprimentoM: 2.4, cxM: L, cyM: W, profundidadeM: 0.9 })],
    }),
  },
  {
    id: "spa-lateral", nome: "Spa lateral (hidro)",
    build: (L, W) => ({
      vertices: rect(L, W),
      formas: [forma("spa", { larguraM: 2.6, comprimentoM: 2, cxM: L / 2, cyM: 0, profundidadeM: 0.9 })],
    }),
  },
  {
    id: "em-l", nome: "Em L",
    build: (L, W) => ({
      vertices: [
        { x: 0, y: 0 }, { x: L, y: 0 }, { x: L, y: W * 0.55 },
        { x: L * 0.55, y: W * 0.55 }, { x: L * 0.55, y: W }, { x: 0, y: W },
      ],
      formas: [],
    }),
  },
  {
    id: "em-l-prainha", nome: "Em L + Prainha",
    build: (L, W) => ({
      vertices: [
        { x: 0, y: 0 }, { x: L, y: 0 }, { x: L, y: W * 0.55 },
        { x: L * 0.55, y: W * 0.55 }, { x: L * 0.55, y: W }, { x: 0, y: W },
      ],
      formas: [forma("prainha", { larguraM: Math.max(1.8, L * 0.35), comprimentoM: Math.max(1, W * 0.3), cxM: L * 0.22, cyM: W, profundidadeM: 0.3 })],
    }),
  },
  {
    id: "em-t", nome: "Em T",
    build: (L, W) => ({
      vertices: [
        { x: 0, y: 0 }, { x: L, y: 0 }, { x: L, y: W * 0.5 },
        { x: L * 0.68, y: W * 0.5 }, { x: L * 0.68, y: W }, { x: L * 0.32, y: W },
        { x: L * 0.32, y: W * 0.5 }, { x: 0, y: W * 0.5 },
      ],
      formas: [],
    }),
  },
  {
    id: "oval", nome: "Oval",
    build: (L, W) => {
      const pts = [];
      const n = 28;
      for (let i = 0; i < n; i++) {
        const t = (2 * Math.PI * i) / n;
        pts.push({ x: L / 2 + (L / 2) * Math.cos(t), y: W / 2 + (W / 2) * Math.sin(t) });
      }
      return { vertices: arredonda(pts), formas: [] };
    },
  },
  {
    id: "feijao", nome: "Feijão",
    build: (L, W) => {
      // curva kidney: elipse com "mordida" côncava no lado de cima
      const pts = [];
      const n = 32;
      for (let i = 0; i < n; i++) {
        const t = (2 * Math.PI * i) / n;
        let rx = (L / 2) * Math.cos(t);
        let ry = (W / 2) * Math.sin(t);
        // mordida: puxa para dentro a faixa superior central
        if (ry < 0 && Math.abs(rx) < L * 0.28) {
          const k = 1 - Math.abs(rx) / (L * 0.28);
          ry += W * 0.32 * k;
        }
        pts.push({ x: L / 2 + rx, y: W / 2 + ry });
      }
      return { vertices: arredonda(pts), formas: [] };
    },
  },
  {
    id: "romana", nome: "Romana (ponta curva)",
    build: (L, W) => {
      const r = W / 2;
      const corpo = [{ x: 0, y: 0 }, { x: L - r, y: 0 }];
      const ponta = arco(L - r, W / 2, r, -Math.PI / 2, Math.PI / 2, 10);
      return { vertices: arredonda([...corpo, ...ponta, { x: 0, y: W }]), formas: [] };
    },
  },
  {
    id: "romana-dupla", nome: "Romana dupla",
    build: (L, W) => {
      const r = W / 2;
      const dir = arco(L - r, W / 2, r, -Math.PI / 2, Math.PI / 2, 10);
      const esq = arco(r, W / 2, r, Math.PI / 2, (3 * Math.PI) / 2, 10);
      return { vertices: arredonda([{ x: r, y: 0 }, { x: L - r, y: 0 }, ...dir, { x: r, y: W }, ...esq.slice(1)]), formas: [] };
    },
  },
  {
    id: "redonda", nome: "Redonda",
    build: (L, W) => {
      const r = Math.min(L, W) / 2;
      return { vertices: arredonda(arco(r, r, r, 0, 2 * Math.PI, 28).slice(0, 28)), formas: [] };
    },
  },
  {
    id: "oitavada", nome: "Oitavada",
    build: (L, W) => {
      const c = Math.min(1, L * 0.18, W * 0.3);
      return {
        vertices: [
          { x: c, y: 0 }, { x: L - c, y: 0 }, { x: L, y: c }, { x: L, y: W - c },
          { x: L - c, y: W }, { x: c, y: W }, { x: 0, y: W - c }, { x: 0, y: c },
        ],
        formas: [],
      };
    },
  },
  {
    id: "canto-curvo", nome: "Cantos arredondados",
    build: (L, W) => {
      const r = Math.min(0.8, L * 0.15, W * 0.25);
      return {
        vertices: arredonda([
          ...arco(L - r, r, r, -Math.PI / 2, 0, 5),
          ...arco(L - r, W - r, r, 0, Math.PI / 2, 5),
          ...arco(r, W - r, r, Math.PI / 2, Math.PI, 5),
          ...arco(r, r, r, Math.PI, (3 * Math.PI) / 2, 5),
        ]),
        formas: [],
      };
    },
  },
];

export const getModelo = id => MODELOS.find(m => m.id === id);
