// Catálogo de estampas: Acqualiner e Locomotiva (linha Aqualona).
// pastilhaCm   → medida real de uma pastilha (lado em cm). null = estampa lisa.
// tilesPerSide → quantas pastilhas por lado aparecem em public/swatches/<id>.png.
//                Usado para calcular a escala real da repetição no 3D.
//                Estimado visualmente a partir do catálogo; ajustar aqui se a proporção parecer errada.
// swatchCm derivado = pastilhaCm * tilesPerSide.

export const ESTAMPAS = [
  { id: 'marmo-carrara-azul',   nome: 'Marmo Carrara Azul',   pastilhaCm: 10, tilesPerSide: 5 },
  { id: 'marmo-carrara-verde',  nome: 'Marmo Carrara Verde',  pastilhaCm: 10, tilesPerSide: 5 },
  { id: 'marmo-carrara-cinza',  nome: 'Marmo Carrara Cinza',  pastilhaCm: 10, tilesPerSide: 5 },
  { id: 'travertino',           nome: 'Travertino',           pastilhaCm: 10, tilesPerSide: 5 },
  { id: 'travertino-gris',      nome: 'Travertino Gris',      pastilhaCm: 10, tilesPerSide: 5 },
  { id: 'travertino-verde',     nome: 'Travertino Verde',     pastilhaCm: 10, tilesPerSide: 5, emBreve: true },
  { id: 'travertino-azul',      nome: 'Travertino Azul',      pastilhaCm: 10, tilesPerSide: 5, emBreve: true },
  { id: 'bali-hijau',           nome: 'Bali Hijau',           pastilhaCm: 10, tilesPerSide: 5 },
  { id: 'bali-blue',            nome: 'Bali Blue',            pastilhaCm: 10, tilesPerSide: 5 },
  { id: 'santorini',            nome: 'Santorini',            pastilhaCm: 10, tilesPerSide: 5 },
  { id: 'malibu-azul',          nome: 'Malibu Azul',          pastilhaCm: 5,  tilesPerSide: 10 },
  { id: 'malibu-verde',         nome: 'Malibu Verde',         pastilhaCm: 5,  tilesPerSide: 10 },
  { id: 'punta-cana',           nome: 'Punta Cana',           pastilhaCm: 5,  tilesPerSide: 6 },
  { id: 'porto-vecchio-azul',   nome: 'Porto Vecchio Azul',   pastilhaCm: 10, tilesPerSide: 6 },
  { id: 'porto-vecchio-verde',  nome: 'Porto Vecchio Verde',  pastilhaCm: 10, tilesPerSide: 6 },
  { id: 'batu-blue',            nome: 'Batu Blue',            pastilhaCm: 7,  tilesPerSide: 5 },
  { id: 'batu-vert',            nome: 'Batu Vert',            pastilhaCm: 7,  tilesPerSide: 5 },
  { id: 'sukabumi-azul',        nome: 'Sukabumi Azul',        pastilhaCm: 7,  tilesPerSide: 6 },
  { id: 'sukabumi-verde',       nome: 'Sukabumi Verde',       pastilhaCm: 7,  tilesPerSide: 6 },
  { id: 'petra-natural-azul',   nome: 'Petra Natural Azul',   pastilhaCm: null, tilesPerSide: 1 },
  { id: 'petra-natural-verde',  nome: 'Petra Natural Verde',  pastilhaCm: null, tilesPerSide: 1 },
  { id: 'montblanc',            nome: 'Montblanc',            pastilhaCm: null, tilesPerSide: 1 },
  { id: 'montblanc-block',      nome: 'Montblanc Block',      pastilhaCm: 10, tilesPerSide: 5 },
  { id: 'mid-blue-liso',        nome: 'Mid Blue Liso',        pastilhaCm: null, tilesPerSide: 1 },
  // Aquática Azul é material de capa no catálogo Acqualiner: saiu do seletor em 01/10/2026 e
  // fica aqui só para os orçamentos salvos com ela.
  { id: 'aquatica-azul',        nome: 'Aquática Azul',        pastilhaCm: null, tilesPerSide: 1 },

  // Locomotiva (linha Aqualona). O catálogo não traz a medida da pastilha: 10 cm é estimativa
  // visual, só para a escala do 3D; as pastilhas por lado foram contadas no swatch.
  { id: 'loc-rock-green', nome: 'Rock Green', pastilhaCm: 10, tilesPerSide: 4, marca: 'LOCOMOTIVA' },
  { id: 'loc-rock-blue', nome: 'Rock Blue', pastilhaCm: 10, tilesPerSide: 4, marca: 'LOCOMOTIVA' },
  { id: 'loc-cayman', nome: 'Cayman', pastilhaCm: 10, tilesPerSide: 5, marca: 'LOCOMOTIVA' },
  { id: 'loc-maldivas-green', nome: 'Maldivas Green', pastilhaCm: 10, tilesPerSide: 4, marca: 'LOCOMOTIVA' },
  { id: 'loc-maldivas-blue', nome: 'Maldivas Blue', pastilhaCm: 10, tilesPerSide: 4, marca: 'LOCOMOTIVA' },
  { id: 'loc-curacao', nome: 'Curaçao', pastilhaCm: 10, tilesPerSide: 5, marca: 'LOCOMOTIVA' },
  { id: 'loc-bali-green', nome: 'Bali Green', pastilhaCm: 10, tilesPerSide: 5, marca: 'LOCOMOTIVA' },
  { id: 'loc-bali-blue', nome: 'Bali Blue (Locomotiva)', pastilhaCm: 10, tilesPerSide: 4, marca: 'LOCOMOTIVA' },
  { id: 'loc-azul-celeste', nome: 'Azul Celeste', pastilhaCm: null, tilesPerSide: 1, marca: 'LOCOMOTIVA' },
  { id: 'loc-ibiza-dark', nome: 'Ibiza Dark', pastilhaCm: 10, tilesPerSide: 7, marca: 'LOCOMOTIVA' },
  { id: 'loc-ibiza-light', nome: 'Ibiza Light', pastilhaCm: 10, tilesPerSide: 7, marca: 'LOCOMOTIVA' },
  { id: 'loc-eagle-green', nome: 'Eagle Green', pastilhaCm: 10, tilesPerSide: 3, marca: 'LOCOMOTIVA' },
  { id: 'loc-eagle-blue', nome: 'Eagle Blue', pastilhaCm: 10, tilesPerSide: 3, marca: 'LOCOMOTIVA' },
  { id: 'loc-diamond-hijau', nome: 'Diamond Hijau', pastilhaCm: 10, tilesPerSide: 4, marca: 'LOCOMOTIVA' },
  { id: 'loc-diamond-hitam', nome: 'Diamond Hitam', pastilhaCm: 10, tilesPerSide: 4, marca: 'LOCOMOTIVA' },
  { id: 'loc-diamond-blue', nome: 'Diamond Blue', pastilhaCm: 10, tilesPerSide: 4, marca: 'LOCOMOTIVA' },
  { id: 'loc-paradise-green', nome: 'Paradise Green', pastilhaCm: 10, tilesPerSide: 4, marca: 'LOCOMOTIVA' },
  { id: 'loc-paradise-blue', nome: 'Paradise Blue', pastilhaCm: 10, tilesPerSide: 5, marca: 'LOCOMOTIVA' },
  { id: 'loc-lazuri-green', nome: 'Lazuri Green', pastilhaCm: 10, tilesPerSide: 3, marca: 'LOCOMOTIVA' },
  { id: 'loc-lazuri-cream', nome: 'Lazuri Cream', pastilhaCm: 10, tilesPerSide: 3, marca: 'LOCOMOTIVA' },
  { id: 'loc-lazuri-blue', nome: 'Lazuri Blue', pastilhaCm: 10, tilesPerSide: 3, marca: 'LOCOMOTIVA' },
];

export const getEstampa = (id) => ESTAMPAS.find(e => e.id === id);
export const getEstampaByNome = (nome) => ESTAMPAS.find(e => e.nome === nome);

// Tamanho em METROS que uma cópia inteira do swatch representa no mundo real.
// Para lisos (pastilhaCm null), assumimos 2m (repetição gentil, sem aparência de azulejo).
export const swatchSizeMeters = (estampa) => {
  if (!estampa) return 2;
  if (estampa.pastilhaCm == null) return 2;
  return (estampa.pastilhaCm * estampa.tilesPerSide) / 100;
};
