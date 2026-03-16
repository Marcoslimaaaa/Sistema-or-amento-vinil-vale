import React, { Suspense, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Line, GizmoHelper, GizmoViewcube } from '@react-three/drei';

// Mesmas cores do isométrico e 2D
const C = {
  retorno:   '#3b82f6',
  aspiracao: '#ec4899',
  dreno:     '#8b5cf6',
  skimmer:   '#f97316',
  refletor:  '#eab308',
  nivelador: '#06b6d4',
  hidro:     '#10b981',
};

// Mesma lógica de altura por tipo (igual ao IsometricView typeZ)
function devZ(type, isFloor, D) {
  if (isFloor) return 0;
  if (type === 'skimmer')   return D;
  if (type === 'nivelador') return D * 0.88;
  if (type === 'refletor')  return D * 0.5;
  if (type === 'aspiracao') return D * 0.5;
  return D * 0.55; // retorno, hidro
}

// Converte coordenadas isométricas (ix=0..L, iy=0..W, iz=0..D)
// para Three.js (X=-L/2..L/2, Y=iz, Z=-W/2..W/2)
function iso2three(ix, iy, iz, L, W) {
  return [ix - L / 2, iz, iy - W / 2];
}

// Constrói dispositivos e tubulações com a MESMA lógica do IsometricView
function buildScene(allPos, L, W, D, invertSide, customPos) {
  const lo  = 0.32;
  const pZ  = Math.max(0, D - 0.30);
  const sysOrder = ['retorno', 'hidro', 'dreno', 'aspiracao', 'skimmer', 'nivelador', 'refletor'];

  // Posição da casa de máquinas (igual ao IsometricView)
  const casaFrac = customPos?.casa || (invertSide ? { x: -0.15, y: 0.5 } : { x: 1.12, y: 0.5 });
  const cmX0  = casaFrac.x * L;
  const cmBY0 = W * 0.1;
  const cmWd  = W * 0.8;
  const cmWw  = Math.min(1.4, W * 0.5);
  const cmMidY = cmBY0 + cmWd / 2;

  // Agrupar dispositivos por tipo
  const byType = {};
  Object.entries(allPos).filter(([, p]) => !p.special).forEach(([key, p]) => {
    if (!byType[p.type]) byType[p.type] = [];
    byType[p.type].push([key, p]);
  });

  const devices = [];
  const pipes   = [];

  sysOrder.forEach((sysType, sysIdx) => {
    const devs = byType[sysType];
    if (!devs || devs.length === 0) return;
    const col      = C[sysType] || '#999';
    const laneOff  = lo + sysIdx * 0.16;
    const exitIso  = []; // pontos de saída em coords iso

    devs.forEach(([key, p]) => {
      const ix = p.x * L;
      const iy = p.y * W;
      const iz = devZ(sysType, p.floor, D);

      // Dispositivo em Three.js
      devices.push({ key, pos: iso2three(ix, iy, iz, L, W), color: col, type: sysType, label: p.label });

      // Roteamento (mesma lógica do isométrico)
      let route; // array de [ix,iy,iz] em coordenadas iso
      if (p.floor) {
        route = [[ix,iy,0],[L,iy,0],[L+laneOff,iy,0],[L+laneOff,iy,pZ]];
        exitIso.push([L+laneOff, iy, pZ]);
      } else if (p.x < 0.12) {
        route = [[0,iy,iz],[-laneOff,iy,iz]];
        exitIso.push([-laneOff, iy, iz]);
      } else if (p.x > 0.88) {
        route = [[L,iy,iz],[L+laneOff,iy,iz]];
        exitIso.push([L+laneOff, iy, iz]);
      } else if (p.y < 0.08) {
        route = [[ix,0,iz],[ix,-laneOff,iz]];
        exitIso.push([ix, -laneOff, iz]);
      } else if (p.y > 0.88) {
        route = [[ix,W,iz],[ix,W+laneOff,iz]];
        exitIso.push([ix, W+laneOff, iz]);
      } else {
        route = [[ix,iy,iz],[L,iy,iz],[L+laneOff,iy,iz]];
        exitIso.push([L+laneOff, iy, iz]);
      }

      pipes.push({ points: route.map(([rx,ry,rz]) => iso2three(rx,ry,rz,L,W)), color: col, width: 2 });
    });

    // Coletor até a casa de máquinas (mesma lógica do isométrico)
    if (exitIso.length === 0) return;
    const eZ          = exitIso[0][2];
    const isLeftExit  = exitIso[0][0] < 0;
    const isFrontExit = exitIso[0][1] < 0;
    const isBackExit  = exitIso[0][1] > W;

    let col3;
    if (isLeftExit) {
      const midY = exitIso.reduce((s,p)=>s+p[1],0)/exitIso.length;
      col3 = [[-laneOff,midY,eZ],[-laneOff,W+laneOff,eZ],[cmX0,W+laneOff,eZ],[cmX0,cmMidY,eZ]];
    } else if (isFrontExit) {
      const midX = exitIso.reduce((s,p)=>s+p[0],0)/exitIso.length;
      col3 = [[midX,-laneOff,eZ],[cmX0,-laneOff,eZ],[cmX0,cmMidY,eZ]];
    } else if (isBackExit) {
      const midX = exitIso.reduce((s,p)=>s+p[0],0)/exitIso.length;
      col3 = [[midX,W+laneOff,eZ],[cmX0,W+laneOff,eZ],[cmX0,cmMidY,eZ]];
    } else {
      const midY = exitIso.reduce((s,p)=>s+p[1],0)/exitIso.length;
      col3 = [[L+laneOff,midY,eZ],[cmX0,midY,eZ],[cmX0,cmMidY,eZ]];
    }

    pipes.push({ points: col3.map(([rx,ry,rz])=>iso2three(rx,ry,rz,L,W)), color: col, width: 3 });
  });

  // Casa de máquinas: centro em Three.js
  const cmPos3 = iso2three(cmX0 + cmWw/2, cmMidY, pZ, L, W);

  return { devices, pipes, cmPos3, cmWw, cmWd };
}

// ── Paredes ─────────────────────────────────────────────────────────────────
function PoolWalls({ L, W, D }) {
  const wt = 0.14;
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
      {/* Bordas superiores */}
      <mesh position={[0, D+0.04, -W/2]}><boxGeometry args={[L+wt*2, 0.08, wt+0.12]}/><meshStandardMaterial color="#cbd5e1" roughness={0.7}/></mesh>
      <mesh position={[0, D+0.04,  W/2]}><boxGeometry args={[L+wt*2, 0.08, wt+0.12]}/><meshStandardMaterial color="#cbd5e1" roughness={0.7}/></mesh>
      <mesh position={[-L/2, D+0.04, 0]}><boxGeometry args={[wt+0.12, 0.08, W]}/><meshStandardMaterial color="#cbd5e1" roughness={0.7}/></mesh>
      <mesh position={[ L/2, D+0.04, 0]}><boxGeometry args={[wt+0.12, 0.08, W]}/><meshStandardMaterial color="#cbd5e1" roughness={0.7}/></mesh>
    </group>
  );
}

// ── Água animada ─────────────────────────────────────────────────────────────
function Water({ L, W, D }) {
  const ref = useRef();
  const wl  = D * 0.91;
  useFrame(({ clock }) => {
    if (ref.current) ref.current.position.y = wl/2 + Math.sin(clock.elapsedTime*0.6)*0.006;
  });
  return (
    <mesh ref={ref} position={[0, wl/2, 0]}>
      <boxGeometry args={[L-0.03, wl, W-0.03]} />
      <meshStandardMaterial color="#38bdf8" transparent opacity={0.38} roughness={0.05} metalness={0.15} />
    </mesh>
  );
}

// ── Dispositivo ──────────────────────────────────────────────────────────────
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

// ── Casa de Máquinas ─────────────────────────────────────────────────────────
function MachineRoom({ pos, cmWw, cmWd }) {
  const [mx, my, mz] = pos;
  return (
    <group position={[mx, my, mz]}>
      <mesh castShadow>
        <boxGeometry args={[cmWw, 0.55, cmWd]} />
        <meshStandardMaterial color="#334155" roughness={0.85} />
      </mesh>
      {/* Filtro */}
      <mesh position={[0, 0.35, -cmWd*0.25]}>
        <cylinderGeometry args={[0.14, 0.14, 0.45, 16]} />
        <meshStandardMaterial color="#15803d" roughness={0.5} metalness={0.4} />
      </mesh>
      {/* Bomba */}
      <mesh position={[0, 0.18, cmWd*0.2]} rotation={[Math.PI/2,0,0]}>
        <cylinderGeometry args={[0.16, 0.16, 0.32, 16]} />
        <meshStandardMaterial color="#2563eb" roughness={0.4} metalness={0.7} />
      </mesh>
    </group>
  );
}

// ── Chão ─────────────────────────────────────────────────────────────────────
function Ground({ L, W }) {
  return (
    <mesh position={[0, -0.22, 0]} receiveShadow>
      <boxGeometry args={[L+12, 0.2, W+12]} />
      <meshStandardMaterial color="#e2e8f0" roughness={1} />
    </mesh>
  );
}

// ── Cena principal ────────────────────────────────────────────────────────────
function Scene({ pool, disps, customPos, poolFmt, autoPositions, invertSide }) {
  const L = parseFloat(pool?.length) || 6;
  const W = parseFloat(pool?.width)  || 3;
  const D = parseFloat(pool?.depth)  || 1.4;

  const allPos = autoPositions
    ? { ...autoPositions(L, W, disps, invertSide, poolFmt), ...(customPos || {}) }
    : {};

  // Filtra apenas dispositivos ativos (não especiais e existentes no autoPositions)
  const active = {};
  Object.entries(allPos).forEach(([k, p]) => {
    if (p.special) return;
    if (autoPositions && !autoPositions(L, W, disps, invertSide, poolFmt)[k]) return;
    active[k] = p;
  });

  const { devices, pipes, cmPos3, cmWw, cmWd } = buildScene(active, L, W, D, invertSide, customPos);

  return (
    <>
      <ambientLight intensity={0.7} />
      <directionalLight position={[L*1.5, D*5, W*2]} intensity={1.4} castShadow shadow-mapSize={[1024,1024]} />
      <directionalLight position={[-L, D*2, -W]} intensity={0.35} />
      <pointLight position={[0, D*0.6, 0]} intensity={0.4} color="#38bdf8" />

      <Ground L={L} W={W} />
      <PoolWalls L={L} W={W} D={D} />
      <Water L={L} W={W} D={D} />
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

// ── Legenda ───────────────────────────────────────────────────────────────────
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

// ── Export ────────────────────────────────────────────────────────────────────
export default function Pool3DView({ pool, disps, customPos, poolFmt, autoPositions, invertSide, dark }) {
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
            disps={disps}
            customPos={customPos}
            poolFmt={poolFmt}
            autoPositions={autoPositions}
            invertSide={invertSide}
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
