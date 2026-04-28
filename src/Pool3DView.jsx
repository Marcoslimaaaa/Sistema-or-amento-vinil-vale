import React, { Suspense, useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Line, GizmoHelper, GizmoViewcube, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { getEstampaByNome, swatchSizeMeters } from './data/estampas';

const SWATCH_SLUG={"Marmo Carrara Azul":"marmo-carrara-azul","Marmo Carrara Verde":"marmo-carrara-verde","Marmo Carrara Cinza":"marmo-carrara-cinza","Travertino":"travertino","Travertino Gris":"travertino-gris","Travertino Verde":"travertino-verde","Travertino Azul":"travertino-azul","Bali Hijau":"bali-hijau","Bali Blue":"bali-blue","Santorini":"santorini","Malibu Azul":"malibu-azul","Malibu Verde":"malibu-verde","Punta Cana":"punta-cana","Porto Vecchio Azul":"porto-vecchio-azul","Porto Vecchio Verde":"porto-vecchio-verde","Batu Blue":"batu-blue","Batu Vert":"batu-vert","Sukabumi Azul":"sukabumi-azul","Sukabumi Verde":"sukabumi-verde","Petra Natural Azul":"petra-natural-azul","Petra Natural Verde":"petra-natural-verde","Montblanc":"montblanc","Montblanc Block":"montblanc-block","Mid Blue Liso":"mid-blue-liso","Aquática Azul":"aquatica-azul"};
const STAMP_COLOR={"Marmo Carrara Azul":"#a8cce8","Marmo Carrara Verde":"#a8d4c0","Marmo Carrara Cinza":"#b0bcc8","Travertino":"#c8b89a","Travertino Gris":"#b0a898","Travertino Verde":"#98b4a0","Travertino Azul":"#8ab0c8","Bali Hijau":"#5aaa88","Bali Blue":"#5090c0","Santorini":"#6aaccc","Malibu Azul":"#4a98d8","Malibu Verde":"#4aac7a","Porto Vecchio Azul":"#3d8fc0","Porto Vecchio Verde":"#3da878","Batu Blue":"#4a90c0","Batu Vert":"#4aa880","Sukabumi Azul":"#3aa8d0","Sukabumi Verde":"#3ab080","Petra Natural Azul":"#6aa8c0","Petra Natural Verde":"#6ab090","Montblanc":"#7ab8e0","Montblanc Block":"#5aa0c8","Mid Blue Liso":"#3a96d0","Aquática Azul":"#3aacdc","Punta Cana":"#50c0b0"};

const C = {
  retorno:   '#3b82f6',
  aspiracao: '#ec4899',
  dreno:     '#8b5cf6',
  skimmer:   '#f97316',
  refletor:  '#eab308',
  nivelador: '#06b6d4',
  hidro:     '#10b981',
};

function devZ(type, isFloor, D, devHeights) {
  if (isFloor) return 0;
  if (type === 'skimmer')   return D;
  if (type === 'nivelador') return D * 0.88;
  if (type === 'refletor')  return D * 0.5;
  if (type === 'aspiracao') return D * 0.5;
  if (type === 'retorno' && devHeights?.retorno) return Math.min(parseFloat(devHeights.retorno) || D*0.55, D);
  if (type === 'hidro'   && devHeights?.hidro)   return Math.min(parseFloat(devHeights.hidro)   || D*0.55, D);
  return D * 0.55;
}

// iso coords (ix=0..L, iy=0..W, iz=0..D) → Three.js [x, y, z]
function i2t(ix, iy, iz, L, W) {
  return [ix - L/2, iz, iy - W/2];
}

function buildScene(allPos, L, W, D, invertSide, customPos, devHeights) {
  const lo = 0.32;
  const pZ = Math.max(0, D - 0.30); // height for floor-drain runs

  const sysOrder = ['retorno', 'hidro', 'dreno', 'aspiracao', 'skimmer', 'nivelador', 'refletor'];

  const casaFrac = customPos?.casa || (invertSide ? { x: -0.15, y: 0.5 } : { x: 1.12, y: 0.5 });
  const cmX0   = casaFrac.x * L;
  const cmMidY = W * 0.5;
  const cmWw   = Math.min(1.4, W * 0.5);
  const cmWd   = W * 0.8;

  const byType = {};
  Object.entries(allPos).filter(([,p]) => !p.special).forEach(([key, p]) => {
    if (!byType[p.type]) byType[p.type] = [];
    byType[p.type].push([key, p]);
  });

  const devices = [];
  const pipes   = [];
  const toP = pts => pts.map(([rx,ry,rz]) => i2t(rx, ry, rz, L, W));

  sysOrder.forEach((sysType, sysIdx) => {
    const devs = byType[sysType];
    if (!devs || devs.length === 0) return;
    const col     = C[sysType] || '#999';
    const laneOff = lo + sysIdx * 0.16;

    const exitPts = [];

    devs.forEach(([key, p]) => {
      const ix = p.x * L;
      const iy = p.y * W;
      const iz = devZ(sysType, p.floor, D, devHeights);

      devices.push({ key, pos: i2t(ix, iy, iz, L, W), color: col, type: sysType });

      // Same routing logic as IsometricView
      let route;
      if (p.floor) {
        route = [[ix,iy,0],[L,iy,0],[L+laneOff,iy,0],[L+laneOff,iy,pZ]];
        exitPts.push([L+laneOff, iy, pZ]);
      } else if (p.x < 0.12) {
        route = [[0,iy,iz],[-laneOff,iy,iz]];
        exitPts.push([-laneOff, iy, iz]);
      } else if (p.x > 0.88) {
        route = [[L,iy,iz],[L+laneOff,iy,iz]];
        exitPts.push([L+laneOff, iy, iz]);
      } else if (p.y < 0.08) {
        route = [[ix,0,iz],[ix,-laneOff,iz]];
        exitPts.push([ix, -laneOff, iz]);
      } else if (p.y > 0.88) {
        route = [[ix,W,iz],[ix,W+laneOff,iz]];
        exitPts.push([ix, W+laneOff, iz]);
      } else {
        // Oval/intermediate wall: route by system type to keep collector unified
        if (sysType==='retorno'||sysType==='hidro') {
          route = [[ix,iy,iz],[0,iy,iz],[-laneOff,iy,iz]]; exitPts.push([-laneOff,iy,iz]);
        } else if (sysType==='skimmer'||sysType==='nivelador') {
          route = [[ix,iy,iz],[L,iy,iz],[L+laneOff,iy,iz]]; exitPts.push([L+laneOff,iy,iz]);
        } else if (sysType==='aspiracao') {
          route = [[ix,iy,iz],[ix,W,iz],[ix,W+laneOff,iz]]; exitPts.push([ix,W+laneOff,iz]);
        } else if (iy < W/2) {
          route = [[ix,iy,iz],[ix,0,iz],[ix,-laneOff,iz]]; exitPts.push([ix,-laneOff,iz]);
        } else {
          route = [[ix,iy,iz],[ix,W,iz],[ix,W+laneOff,iz]]; exitPts.push([ix,W+laneOff,iz]);
        }
      }
      pipes.push({ points: toP(route), color: col, width: 2 });
    });

    if (exitPts.length === 0) return;
    const eZ = exitPts[0][2];
    const isLeftExit  = exitPts[0][0] < 0;
    const isFrontExit = exitPts[0][1] < 0;
    const isBackExit  = exitPts[0][1] > W;

    if (isLeftExit) {
      if (exitPts.length > 1) {
        const ys = exitPts.map(p => p[1]).sort((a,b) => a-b);
        pipes.push({ points: toP([[-laneOff,ys[0],eZ],[-laneOff,ys[ys.length-1],eZ]]), color: col, width: 3 });
      }
      const midY = exitPts.reduce((s,p) => s+p[1], 0) / exitPts.length;
      // Route via front of pool to avoid crossing structure
      pipes.push({ points: toP([[-laneOff,midY,eZ],[-laneOff,-laneOff,eZ],[cmX0,-laneOff,eZ],[cmX0,cmMidY,eZ]]), color: col, width: 3 });
    } else if (isFrontExit) {
      if (exitPts.length > 1) {
        const xs = exitPts.map(p => p[0]).sort((a,b) => a-b);
        pipes.push({ points: toP([[xs[0],-laneOff,eZ],[xs[xs.length-1],-laneOff,eZ]]), color: col, width: 3 });
      }
      const midX = exitPts.reduce((s,p) => s+p[0], 0) / exitPts.length;
      pipes.push({ points: toP([[midX,-laneOff,eZ],[cmX0,-laneOff,eZ],[cmX0,cmMidY,eZ]]), color: col, width: 3 });
    } else if (isBackExit) {
      if (exitPts.length > 1) {
        const xs = exitPts.map(p => p[0]).sort((a,b) => a-b);
        pipes.push({ points: toP([[xs[0],W+laneOff,eZ],[xs[xs.length-1],W+laneOff,eZ]]), color: col, width: 3 });
      }
      const midX = exitPts.reduce((s,p) => s+p[0], 0) / exitPts.length;
      // Route via right wall to avoid crossing structure
      pipes.push({ points: toP([[midX,W+laneOff,eZ],[L+laneOff,W+laneOff,eZ],[L+laneOff,cmMidY,eZ],[cmX0,cmMidY,eZ]]), color: col, width: 3 });
    } else {
      if (exitPts.length > 1) {
        const ys = exitPts.map(p => p[1]).sort((a,b) => a-b);
        pipes.push({ points: toP([[L+laneOff,ys[0],eZ],[L+laneOff,ys[ys.length-1],eZ]]), color: col, width: 3 });
      }
      const midY = exitPts.reduce((s,p) => s+p[1], 0) / exitPts.length;
      pipes.push({ points: toP([[L+laneOff,midY,eZ],[cmX0,midY,eZ],[cmX0,cmMidY,eZ]]), color: col, width: 3 });
    }
  });

  // Machine room at ground level
  const cmPos3 = i2t(cmX0 + cmWw/2, cmMidY, 0, L, W);
  return { devices, pipes, cmPos3, cmWw, cmWd };
}

// ── Pool walls ───────────────────────────────────────────────────────────────
function PoolWalls({ L, W, D, poolFmt }) {
  const wt = 0.14;
  const isOval = poolFmt === 'Oval' || poolFmt === 'Feijão';
  const isL    = poolFmt === 'Formato L';

  if (isOval) {
    const scX = L / W;
    return (
      <group>
        <mesh position={[0, -wt/2, 0]} scale={[scX, 1, 1]}>
          <cylinderGeometry args={[W/2, W/2, wt, 48]} />
          <meshStandardMaterial color="#64748b" roughness={0.95} />
        </mesh>
        <mesh position={[0, D/2, 0]} scale={[scX, 1, 1]}>
          <cylinderGeometry args={[W/2+wt, W/2+wt, D, 48, 1, true]} />
          <meshStandardMaterial color="#94a3b8" roughness={0.85} side={2} />
        </mesh>
        <mesh position={[0, D+0.04, 0]} scale={[scX, 1, 1]} rotation={[Math.PI/2, 0, 0]}>
          <torusGeometry args={[W/2+wt/2, 0.06, 8, 48]} />
          <meshStandardMaterial color="#cbd5e1" roughness={0.7} />
        </mesh>
      </group>
    );
  }

  if (isL) {
    const W1 = W * 0.6, W2 = W - W1, L2 = L * 0.6;
    const offX = (L - L2) / 2;
    return (
      <group>
        <mesh position={[0, -wt/2, -(W2)/2]}>
          <boxGeometry args={[L+wt*2, wt, W1+wt]} />
          <meshStandardMaterial color="#64748b" roughness={0.95} />
        </mesh>
        <mesh position={[-offX, -wt/2, W1/2]}>
          <boxGeometry args={[L2, wt, W2+wt]} />
          <meshStandardMaterial color="#64748b" roughness={0.95} />
        </mesh>
        <mesh position={[0, D/2, -W/2-wt/2]}>
          <boxGeometry args={[L+wt*2, D, wt]} />
          <meshStandardMaterial color="#94a3b8" roughness={0.85} />
        </mesh>
        <mesh position={[-offX, D/2, W/2+wt/2]}>
          <boxGeometry args={[L2, D, wt]} />
          <meshStandardMaterial color="#94a3b8" roughness={0.85} />
        </mesh>
        <mesh position={[-L/2-wt/2, D/2, 0]}>
          <boxGeometry args={[wt, D, W+wt*2]} />
          <meshStandardMaterial color="#8ca5b8" roughness={0.85} />
        </mesh>
        <mesh position={[L/2+wt/2, D/2, -(W2)/2]}>
          <boxGeometry args={[wt, D, W1+wt]} />
          <meshStandardMaterial color="#8ca5b8" roughness={0.85} />
        </mesh>
        <mesh position={[-offX+L2/2+wt/2, D/2, W1/2]}>
          <boxGeometry args={[wt, D, W2+wt]} />
          <meshStandardMaterial color="#8ca5b8" roughness={0.85} />
        </mesh>
        <mesh position={[-offX, D/2, W1/2-wt/2]}>
          <boxGeometry args={[L-L2+wt, D, wt]} />
          <meshStandardMaterial color="#8ca5b8" roughness={0.85} />
        </mesh>
      </group>
    );
  }

  // Rectangular (default)
  return (
    <group>
      <mesh position={[0, -wt/2, 0]}>
        <boxGeometry args={[L+wt*2, wt, W+wt*2]} />
        <meshStandardMaterial color="#64748b" roughness={0.95} />
      </mesh>
      <mesh position={[0, D/2, -W/2-wt/2]}>
        <boxGeometry args={[L+wt*2, D, wt]} />
        <meshStandardMaterial color="#94a3b8" roughness={0.85} />
      </mesh>
      <mesh position={[0, D/2, W/2+wt/2]}>
        <boxGeometry args={[L+wt*2, D, wt]} />
        <meshStandardMaterial color="#94a3b8" roughness={0.85} />
      </mesh>
      <mesh position={[-L/2-wt/2, D/2, 0]}>
        <boxGeometry args={[wt, D, W]} />
        <meshStandardMaterial color="#8ca5b8" roughness={0.85} />
      </mesh>
      <mesh position={[L/2+wt/2, D/2, 0]}>
        <boxGeometry args={[wt, D, W]} />
        <meshStandardMaterial color="#8ca5b8" roughness={0.85} />
      </mesh>
      <mesh position={[0, D+0.04, -W/2]}><boxGeometry args={[L+wt*2, 0.08, wt+0.12]}/><meshStandardMaterial color="#cbd5e1" roughness={0.7}/></mesh>
      <mesh position={[0, D+0.04,  W/2]}><boxGeometry args={[L+wt*2, 0.08, wt+0.12]}/><meshStandardMaterial color="#cbd5e1" roughness={0.7}/></mesh>
      <mesh position={[-L/2, D+0.04, 0]}><boxGeometry args={[wt+0.12, 0.08, W]}/><meshStandardMaterial color="#cbd5e1" roughness={0.7}/></mesh>
      <mesh position={[ L/2, D+0.04, 0]}><boxGeometry args={[wt+0.12, 0.08, W]}/><meshStandardMaterial color="#cbd5e1" roughness={0.7}/></mesh>
    </group>
  );
}

// ── Vinyl interior (stamp texture on floor + walls) ──────────────────────────
function VinylInterior({ L, W, D, texUrl, poolFmt, swatchM }) {
  // swatchM = tamanho real em metros que uma cópia do swatch representa.
  // repeat = dimensão da parede / swatchM  → escala 1:1 real.
  const sm = swatchM > 0 ? swatchM : 0.5;
  const base = useTexture(texUrl);
  const texFloor = useMemo(() => {
    const t = base.clone(); t.needsUpdate = true;
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(L / sm, W / sm);
    return t;
  }, [base, L, W, sm]);
  const texHwall = useMemo(() => {
    const t = base.clone(); t.needsUpdate = true;
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(L / sm, D / sm);
    return t;
  }, [base, L, D, sm]);
  const texVwall = useMemo(() => {
    const t = base.clone(); t.needsUpdate = true;
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(W / sm, D / sm);
    return t;
  }, [base, W, D, sm]);
  const isOval = poolFmt === 'Oval' || poolFmt === 'Feijão';
  if (isOval) return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} scale={[L / W, 1, 1]}>
        <circleGeometry args={[W / 2 - 0.07, 48]} />
        <meshStandardMaterial map={texFloor} roughness={0.75} />
      </mesh>
      <mesh position={[0, D / 2, 0]} scale={[L / W, 1, 1]}>
        <cylinderGeometry args={[W / 2 - 0.07, W / 2 - 0.07, D, 48, 1, true]} />
        <meshStandardMaterial map={texHwall} side={THREE.BackSide} roughness={0.75} />
      </mesh>
    </group>
  );
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <planeGeometry args={[L - 0.12, W - 0.12]} />
        <meshStandardMaterial map={texFloor} roughness={0.75} />
      </mesh>
      <mesh position={[0, D / 2, -W / 2 + 0.07]}>
        <planeGeometry args={[L - 0.12, D]} />
        <meshStandardMaterial map={texHwall} roughness={0.75} />
      </mesh>
      <mesh position={[0, D / 2, W / 2 - 0.07]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[L - 0.12, D]} />
        <meshStandardMaterial map={texHwall} roughness={0.75} />
      </mesh>
      <mesh position={[-L / 2 + 0.07, D / 2, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[W - 0.12, D]} />
        <meshStandardMaterial map={texVwall} roughness={0.75} />
      </mesh>
      <mesh position={[L / 2 - 0.07, D / 2, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[W - 0.12, D]} />
        <meshStandardMaterial map={texVwall} roughness={0.75} />
      </mesh>
    </group>
  );
}

// ── Animated water ───────────────────────────────────────────────────────────
function Water({ L, W, D, poolFmt, color="#38bdf8" }) {
  const ref = useRef();
  const wl  = D * 0.91;
  const isOval = poolFmt === 'Oval' || poolFmt === 'Feijão';
  useFrame(({ clock }) => {
    if (ref.current) ref.current.position.y = wl/2 + Math.sin(clock.elapsedTime*0.6)*0.006;
  });
  if (isOval) {
    return (
      <mesh ref={ref} position={[0, wl/2, 0]} scale={[L/W, 1, 1]}>
        <cylinderGeometry args={[W/2-0.02, W/2-0.02, wl, 48]} />
        <meshStandardMaterial color={color} transparent opacity={0.38} roughness={0.05} metalness={0.15} />
      </mesh>
    );
  }
  return (
    <mesh ref={ref} position={[0, wl/2, 0]}>
      <boxGeometry args={[L-0.03, wl, W-0.03]} />
      <meshStandardMaterial color={color} transparent opacity={0.38} roughness={0.05} metalness={0.15} />
    </mesh>
  );
}

// ── Device ───────────────────────────────────────────────────────────────────
function Device({ position, color, type }) {
  return (
    <mesh position={position} castShadow>
      {type === 'dreno'
        ? <cylinderGeometry args={[0.11, 0.11, 0.07, 16]} />
        : <sphereGeometry args={[0.1, 14, 10]} />}
      <meshStandardMaterial color={color} roughness={0.25} metalness={0.6} emissive={color} emissiveIntensity={0.35} />
    </mesh>
  );
}

// ── Machine room ─────────────────────────────────────────────────────────────
function MachineRoom({ pos, cmWw, cmWd }) {
  const [mx, , mz] = pos;
  return (
    <group position={[mx, 0.275, mz]}>
      <mesh castShadow>
        <boxGeometry args={[cmWw, 0.55, cmWd]} />
        <meshStandardMaterial color="#334155" roughness={0.85} />
      </mesh>
      <mesh position={[0, 0.35, -cmWd*0.25]}>
        <cylinderGeometry args={[0.14, 0.14, 0.45, 16]} />
        <meshStandardMaterial color="#15803d" roughness={0.5} metalness={0.4} />
      </mesh>
      <mesh position={[0, 0.18, cmWd*0.2]} rotation={[Math.PI/2,0,0]}>
        <cylinderGeometry args={[0.16, 0.16, 0.32, 16]} />
        <meshStandardMaterial color="#2563eb" roughness={0.4} metalness={0.7} />
      </mesh>
    </group>
  );
}

// ── Ground ───────────────────────────────────────────────────────────────────
function Ground({ L, W }) {
  return (
    <mesh position={[0, -0.22, 0]} receiveShadow>
      <boxGeometry args={[L+12, 0.2, W+12]} />
      <meshStandardMaterial color="#e2e8f0" roughness={1} />
    </mesh>
  );
}

// ── Main scene ───────────────────────────────────────────────────────────────
function Scene({ pool, spa, disps, customPos, poolFmt, autoPositions, invertSide, devHeights, stamp="", spaType={}, extras=[] }) {
  const L = parseFloat(pool?.length) || 6;
  const W = parseFloat(pool?.width)  || 3;
  const D = parseFloat(pool?.depth)  || 1.4;

  const allPos = autoPositions
    ? { ...autoPositions(L, W, disps, invertSide, poolFmt), ...(customPos || {}) }
    : {};

  const active = {};
  Object.entries(allPos).forEach(([k, p]) => {
    if (!p.special) active[k] = p;
  });

  const { devices, pipes, cmPos3, cmWw, cmWd } = buildScene(active, L, W, D, invertSide, customPos, devHeights);

  return (
    <>
      <ambientLight intensity={0.7} />
      <directionalLight position={[L*1.5, D*5, W*2]} intensity={1.4} castShadow shadow-mapSize={[1024,1024]} />
      <directionalLight position={[-L, D*2, -W]} intensity={0.35} />
      <pointLight position={[0, D*0.6, 0]} intensity={0.4} color={STAMP_COLOR[stamp]||"#38bdf8"} />

      <Ground L={L} W={W} />
      <PoolWalls L={L} W={W} D={D} poolFmt={poolFmt} />
      {SWATCH_SLUG[stamp] && <VinylInterior L={L} W={W} D={D} texUrl={`/swatches/${SWATCH_SLUG[stamp]}.png`} poolFmt={poolFmt} swatchM={swatchSizeMeters(getEstampaByNome(stamp))} />}
      <Water L={L} W={W} D={D} poolFmt={poolFmt} color={STAMP_COLOR[stamp]||"#38bdf8"} />

      {/* Prainha — plataforma rasa */}
      {poolFmt==="Com prainha"&&<mesh position={[-L/2+L*0.125, D*0.2, 0]}>
        <boxGeometry args={[L*0.25, D*0.4, W-0.1]} />
        <meshStandardMaterial color="#7dd3fc" roughness={0.8} transparent opacity={0.6} />
      </mesh>}

      {/* Spa do formato "Com Spa" */}
      {poolFmt==="Com Spa"&&spaType.quadrado&&(()=>{
        const sc=parseFloat(spaType.qComp)||2,sl=parseFloat(spaType.qLarg)||2,sp=parseFloat(spaType.qProf)||D;
        const c=spaType.qCanto||"bottom-right";
        const sx=(c.includes("left")?(-L/2+sc/2):(L/2-sc/2));
        const sz=(c.includes("top")?(-W/2-sl/2):(W/2+sl/2));
        return<group>
          <mesh position={[sx,sp/2,sz]}><boxGeometry args={[sc,sp,sl]}/><meshStandardMaterial color="#7dd3fc" roughness={0.8} transparent opacity={0.35} side={2}/></mesh>
          <mesh position={[sx,-0.07,sz]}><boxGeometry args={[sc,0.14,sl]}/><meshStandardMaterial color="#64748b" roughness={0.95}/></mesh>
        </group>
      })()}
      {poolFmt==="Com Spa"&&spaType.redondo&&(()=>{
        const isRSq=spaType.rFormato==="quadrado";
        const rc=isRSq?(parseFloat(spaType.rComp)||2):(parseFloat(spaType.rDiam)||2);
        const rl=isRSq?(parseFloat(spaType.rLarg)||2):rc;
        const rp=parseFloat(spaType.rProf)||D;
        const c=spaType.rCanto||"bottom-right";
        const sx=(c.includes("left")?(-L/2):(L/2));
        const sz=(c.includes("top")?(-W/2):(W/2));
        if(isRSq)return<group>
          <mesh position={[sx,rp/2,sz]}><boxGeometry args={[rc,rp,rl]}/><meshStandardMaterial color="#7dd3fc" roughness={0.8} transparent opacity={0.35} side={2}/></mesh>
          <mesh position={[sx,-0.07,sz]}><boxGeometry args={[rc,0.14,rl]}/><meshStandardMaterial color="#64748b" roughness={0.95}/></mesh>
        </group>;
        return<group>
          <mesh position={[sx,rp/2,sz]}><cylinderGeometry args={[rc/2,rc/2,rp,24]}/><meshStandardMaterial color="#7dd3fc" roughness={0.8} transparent opacity={0.35} side={2}/></mesh>
          <mesh position={[sx,-0.07,sz]}><cylinderGeometry args={[rc/2,rc/2,0.14,24]}/><meshStandardMaterial color="#64748b" roughness={0.95}/></mesh>
        </group>
      })()}

      {/* Extras (prainha, banco, degrau) */}
      {extras.map((e,i)=>{
        const pf=v=>parseFloat(String(v||"").replace(",","."))||0;
        const el=pf(e.l),ew=pf(e.w),eh=pf(e.h);
        if(el<=0||ew<=0)return null;
        const desc=(e.desc||"").toLowerCase();
        const isPrainha=desc.includes("prainha"),isBank=desc.includes("banco");
        const eH=eh>0?eh:D*0.4;
        const ex=isPrainha?(-L/2+el/2):isBank?(-L/2+el/2):(L/2-el/2);
        const ez=isPrainha?0:isBank?(W/2-ew/2):(-W/2+ew/2);
        const color=isPrainha?"#7dd3fc":isBank?"#a5b4fc":"#c4b5fd";
        return<mesh key={`ext3d${i}`} position={[ex,eH/2,ez]}>
          <boxGeometry args={[el,eH,ew]}/>
          <meshStandardMaterial color={color} roughness={0.8} transparent opacity={0.55}/>
        </mesh>
      })}

      <MachineRoom pos={cmPos3} cmWw={cmWw} cmWd={cmWd} />

      {devices.map(d => (
        <Device key={d.key} position={d.pos} color={d.color} type={d.type} />
      ))}

      {pipes.map((p, i) => (
        <Line key={i} points={p.points} color={p.color} lineWidth={p.width || 2} />
      ))}

      <OrbitControls enablePan minDistance={2} maxDistance={L*5} target={[0, D/2, 0]} />

      <GizmoHelper alignment="bottom-right" margin={[60, 60]}>
        <GizmoViewcube />
      </GizmoHelper>
    </>
  );
}

// ── Legend ───────────────────────────────────────────────────────────────────
function Legend({ disps }) {
  const items = [
    ['retorno','Retorno','#3b82f6'],['aspiracao','Aspiração','#ec4899'],
    ['dreno','Dreno','#8b5cf6'],['skimmer','Skimmer','#f97316'],
    ['refletor','Refletor','#eab308'],['nivelador','Nivelador','#06b6d4'],
    ['hidro','Hidro','#10b981'],
  ].filter(([k]) => (disps?.[k] || 0) > 0);

  return (
    <div style={{ position:'absolute', top:8, left:8, display:'flex', flexDirection:'column', gap:'3px', pointerEvents:'none' }}>
      {items.map(([k,lb,color]) => (
        <div key={k} style={{ display:'flex', alignItems:'center', gap:'5px', background:'rgba(255,255,255,0.88)', padding:'2px 8px', borderRadius:'4px' }}>
          <div style={{ width:8, height:8, borderRadius:'50%', background:color, flexShrink:0 }} />
          <span style={{ fontSize:'9px', fontWeight:'600', color:'#1a1a2e' }}>{lb} ({disps[k]})</span>
        </div>
      ))}
    </div>
  );
}

// ── Export ───────────────────────────────────────────────────────────────────
export default function Pool3DView({ pool, spa, disps, customPos, poolFmt, autoPositions, invertSide, dark, devHeights, stamp="", spaType={}, extras=[] }) {
  const L  = parseFloat(pool?.length) || 6;
  const D  = parseFloat(pool?.depth)  || 1.4;
  const bg = dark ? '#0f172a' : '#bfdbfe';

  return (
    <div style={{ position:'relative', width:'100%', height:'440px', borderRadius:'12px', overflow:'hidden', background:bg }}>
      <Canvas camera={{ position:[L*1.2, D*3.2, L*1.0], fov:48 }} shadows gl={{ antialias:true }}>
        <color attach="background" args={[bg]} />
        <Suspense fallback={null}>
          <Scene
            pool={pool}
            spa={spa}
            disps={disps}
            customPos={customPos}
            poolFmt={poolFmt}
            autoPositions={autoPositions}
            invertSide={invertSide}
            devHeights={devHeights}
            stamp={stamp}
            spaType={spaType}
            extras={extras}
          />
        </Suspense>
      </Canvas>
      <Legend disps={disps} />
      <div style={{ position:'absolute', bottom:8, right:8, fontSize:'9px', color:'#1e40af', background:'rgba(255,255,255,0.75)', padding:'2px 8px', borderRadius:'4px', pointerEvents:'none' }}>
        🖱 Arraste · Scroll zoom · Clique direito mover
      </div>
    </div>
  );
}
