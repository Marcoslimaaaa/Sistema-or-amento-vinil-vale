import React, { Suspense, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Line, Html, GizmoHelper, GizmoViewcube } from '@react-three/drei';
import * as THREE from 'three';

const DEVICE_COLORS = {
  retorno:   '#ef4444',
  aspiracao: '#ec4899',
  dreno:     '#8b5cf6',
  skimmer:   '#f59e0b',
  refletor:  '#f97316',
  nivelador: '#06b6d4',
  hidro:     '#14b8a6',
  casa:      '#475569',
};

// Converte posição 2D (px, py em [0,1]) para coordenada 3D
function toWorld3D(p, L, W, D) {
  const px = p.x, py = p.y;
  const wx = px * L - L / 2;
  const wz = py * W - W / 2;

  if (p.floor) return [wx, 0.08, wz];

  // Detecta qual parede pelo valor da posição
  if (px < 0.08) return [-L / 2, D * 0.5, wz];
  if (px > 0.92) return [L / 2, D * 0.5, wz];
  if (py < 0.06) return [wx, p.type === 'refletor' ? D * 0.3 : D * 0.5, -W / 2];
  if (py > 0.94) return [wx, p.type === 'refletor' ? D * 0.3 : D * 0.5, W / 2];

  // Fallback: parede mais próxima
  const dists = [px, 1 - px, py, 1 - py];
  const min = Math.min(...dists);
  if (min === dists[0]) return [-L / 2, D * 0.5, wz];
  if (min === dists[1]) return [L / 2, D * 0.5, wz];
  if (min === dists[2]) return [wx, D * 0.5, -W / 2];
  return [wx, D * 0.5, W / 2];
}

function getCMPos(L, D, invertSide) {
  return invertSide ? [-L / 2 - 1.0, D * 0.4, 0] : [L / 2 + 1.0, D * 0.4, 0];
}

// Rota o tubo: dispositivo → ponto fora da parede → casa de máquinas
function getPipePoints(devPos, cmPos, L, W) {
  const [dx, dy, dz] = devPos;
  const [cx, cy, cz] = cmPos;

  // Ponto intermediário: sai para fora da piscina pelo caminho mais curto, desce ao nível da CM
  let midX = dx, midZ = dz;
  if (Math.abs(dx) >= L / 2 - 0.2) midX = dx < 0 ? -L / 2 - 0.4 : L / 2 + 0.4;
  if (Math.abs(dz) >= W / 2 - 0.2) midZ = dz < 0 ? -W / 2 - 0.4 : W / 2 + 0.4;

  return [
    devPos,
    [midX, 0.15, midZ],
    [cx, 0.15, cz],
    cmPos,
  ];
}

// ── Paredes da piscina ──────────────────────────────────────────────────────
function PoolWalls({ L, W, D }) {
  const wt = 0.14;
  const mat = <meshStandardMaterial color="#94a3b8" roughness={0.85} metalness={0.05} />;
  return (
    <group>
      {/* Piso */}
      <mesh position={[0, -wt / 2, 0]} receiveShadow>
        <boxGeometry args={[L + wt * 2, wt, W + wt * 2]} />
        <meshStandardMaterial color="#64748b" roughness={0.95} />
      </mesh>
      {/* Parede frontal */}
      <mesh position={[0, D / 2, -W / 2 - wt / 2]}>{React.createElement('boxGeometry',{args:[L+wt*2,D,wt]})||null}<meshStandardMaterial color="#94a3b8" roughness={0.85}/></mesh>
      <mesh position={[0, D / 2, -W / 2 - wt / 2]}>
        <boxGeometry args={[L + wt * 2, D, wt]} />
        {mat}
      </mesh>
      {/* Parede traseira */}
      <mesh position={[0, D / 2, W / 2 + wt / 2]}>
        <boxGeometry args={[L + wt * 2, D, wt]} />
        {mat}
      </mesh>
      {/* Parede esquerda */}
      <mesh position={[-L / 2 - wt / 2, D / 2, 0]}>
        <boxGeometry args={[wt, D, W]} />
        {mat}
      </mesh>
      {/* Parede direita */}
      <mesh position={[L / 2 + wt / 2, D / 2, 0]}>
        <boxGeometry args={[wt, D, W]} />
        {mat}
      </mesh>
      {/* Borda superior */}
      {[
        [[0, D, -W / 2], [L + wt * 2, 0.08, wt + 0.1]],
        [[0, D, W / 2],  [L + wt * 2, 0.08, wt + 0.1]],
        [[-L / 2, D, 0], [wt + 0.1, 0.08, W]],
        [[L / 2, D, 0],  [wt + 0.1, 0.08, W]],
      ].map(([pos, size], i) => (
        <mesh key={i} position={pos}>
          <boxGeometry args={size} />
          <meshStandardMaterial color="#cbd5e1" roughness={0.7} />
        </mesh>
      ))}
    </group>
  );
}

// ── Água ────────────────────────────────────────────────────────────────────
function Water({ L, W, D }) {
  const meshRef = useRef();
  const wl = D * 0.88;
  useFrame(({ clock }) => {
    if (meshRef.current) {
      meshRef.current.position.y = wl / 2 + Math.sin(clock.elapsedTime * 0.5) * 0.008;
    }
  });
  return (
    <mesh ref={meshRef} position={[0, wl / 2, 0]}>
      <boxGeometry args={[L - 0.03, wl, W - 0.03]} />
      <meshStandardMaterial
        color="#38bdf8"
        transparent
        opacity={0.42}
        roughness={0.05}
        metalness={0.15}
      />
    </mesh>
  );
}

// ── Dispositivo ─────────────────────────────────────────────────────────────
function Device({ position, color, label, type }) {
  const isFloor = type === 'dreno';
  const r = isFloor ? 0.13 : type === 'skimmer' ? 0.09 : 0.1;
  return (
    <group position={position}>
      {isFloor ? (
        <mesh>
          <cylinderGeometry args={[r, r, 0.08, 16]} />
          <meshStandardMaterial color={color} roughness={0.3} metalness={0.5} emissive={color} emissiveIntensity={0.3} />
        </mesh>
      ) : (
        <mesh>
          <sphereGeometry args={[r, 14, 10]} />
          <meshStandardMaterial color={color} roughness={0.25} metalness={0.6} emissive={color} emissiveIntensity={0.25} />
        </mesh>
      )}
      <Html distanceFactor={8} position={[0, r + 0.15, 0]} center>
        <div style={{ fontSize: '9px', fontWeight: '700', color, background: 'rgba(255,255,255,0.85)', padding: '1px 4px', borderRadius: '3px', whiteSpace: 'nowrap', pointerEvents: 'none' }}>
          {label}
        </div>
      </Html>
    </group>
  );
}

// ── Casa de Máquinas ────────────────────────────────────────────────────────
function MachineRoom({ L, D, invertSide }) {
  const [mx, my, mz] = getCMPos(L, D, invertSide);
  return (
    <group position={[mx, my, mz]}>
      {/* Caixa principal */}
      <mesh castShadow>
        <boxGeometry args={[0.75, 0.9, 1.1]} />
        <meshStandardMaterial color="#334155" roughness={0.85} />
      </mesh>
      {/* Motor */}
      <mesh position={[invertSide ? -0.28 : 0.28, -0.05, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.18, 0.18, 0.35, 16]} />
        <meshStandardMaterial color="#64748b" roughness={0.4} metalness={0.8} />
      </mesh>
      {/* Tampa */}
      <mesh position={[0, 0.48, 0]}>
        <boxGeometry args={[0.8, 0.06, 1.15]} />
        <meshStandardMaterial color="#475569" roughness={0.9} />
      </mesh>
      <Html distanceFactor={8} position={[0, 0.7, 0]} center>
        <div style={{ fontSize: '9px', fontWeight: '800', color: '#fff', background: '#334155', padding: '2px 6px', borderRadius: '4px', whiteSpace: 'nowrap', pointerEvents: 'none' }}>
          Casa de Máquinas
        </div>
      </Html>
    </group>
  );
}

// ── Tubo ────────────────────────────────────────────────────────────────────
function Pipe({ points, color }) {
  return (
    <Line
      points={points}
      color={color}
      lineWidth={2.5}
      dashed={false}
    />
  );
}

// ── Chão externo ────────────────────────────────────────────────────────────
function Ground({ L, W }) {
  return (
    <mesh position={[0, -0.25, 0]} receiveShadow>
      <boxGeometry args={[L + 10, 0.2, W + 10]} />
      <meshStandardMaterial color="#e2e8f0" roughness={1} />
    </mesh>
  );
}

// ── Cena principal ──────────────────────────────────────────────────────────
function Scene({ pool, spa, disps, customPos, poolFmt, autoPositions, invertSide }) {
  const L = parseFloat(pool?.length) || 6;
  const W = parseFloat(pool?.width)  || 3;
  const D = parseFloat(pool?.depth)  || 1.4;

  const allPos = autoPositions
    ? { ...autoPositions(L, W, disps, invertSide, poolFmt), ...customPos }
    : {};

  const activeDevices = Object.entries(allPos).filter(([k, p]) => {
    if (p.special) return false;
    if (!autoPositions) return false;
    return !!autoPositions(L, W, disps, invertSide, poolFmt)[k];
  });

  const cmPos = getCMPos(L, D, invertSide);

  return (
    <>
      <ambientLight intensity={0.65} />
      <directionalLight position={[L * 1.2, D * 4, W * 1.5]} intensity={1.4} castShadow shadow-mapSize={[1024, 1024]} />
      <directionalLight position={[-L, D * 2, -W]} intensity={0.4} />
      <pointLight position={[0, D * 0.7, 0]} intensity={0.6} color="#38bdf8" />

      <Ground L={L} W={W} />
      <PoolWalls L={L} W={W} D={D} />
      <Water L={L} W={W} D={D} />
      <MachineRoom L={L} D={D} invertSide={invertSide} />

      {activeDevices.map(([key, p]) => {
        const pos3D = toWorld3D(p, L, W, D);
        const color = DEVICE_COLORS[p.type] || '#94a3b8';
        const pipePoints = getPipePoints(pos3D, cmPos, L, W);
        return (
          <React.Fragment key={key}>
            <Device position={pos3D} color={color} label={p.label} type={p.type} />
            <Pipe points={pipePoints} color={color} />
          </React.Fragment>
        );
      })}

      <OrbitControls
        enablePan
        minDistance={2}
        maxDistance={L * 4}
        target={[0, D / 2, 0]}
      />

      <GizmoHelper alignment="bottom-right" margin={[60, 60]}>
        <GizmoViewcube />
      </GizmoHelper>
    </>
  );
}

// ── Legenda ─────────────────────────────────────────────────────────────────
function Legend({ disps }) {
  const items = [
    ['retorno',   'Retorno',   '#ef4444'],
    ['aspiracao', 'Aspiração', '#ec4899'],
    ['dreno',     'Dreno',     '#8b5cf6'],
    ['skimmer',   'Skimmer',   '#f59e0b'],
    ['refletor',  'Refletor',  '#f97316'],
    ['nivelador', 'Nivelador', '#06b6d4'],
    ['hidro',     'Hidro',     '#14b8a6'],
  ].filter(([k]) => (disps[k] || 0) > 0);

  return (
    <div style={{ position: 'absolute', top: 8, left: 8, display: 'flex', flexDirection: 'column', gap: '3px', pointerEvents: 'none' }}>
      {items.map(([k, lb, color]) => (
        <div key={k} style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'rgba(255,255,255,0.85)', padding: '2px 7px', borderRadius: '4px' }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
          <span style={{ fontSize: '9px', fontWeight: '600', color: '#1a1a2e' }}>{lb} ({disps[k]})</span>
        </div>
      ))}
    </div>
  );
}

// ── Componente exportado ─────────────────────────────────────────────────────
export default function Pool3DView({ pool, spa, disps, customPos, poolFmt, autoPositions, invertSide, dark }) {
  const L = parseFloat(pool?.length) || 6;
  const D = parseFloat(pool?.depth)  || 1.4;
  const bg = dark ? '#0f172a' : '#bfdbfe';

  return (
    <div style={{ position: 'relative', width: '100%', height: '440px', borderRadius: '12px', overflow: 'hidden', background: bg }}>
      <Canvas
        camera={{ position: [L * 1.1, D * 2.8, L * 0.9], fov: 48 }}
        shadows
        gl={{ antialias: true }}
      >
        <color attach="background" args={[bg]} />
        <fog attach="fog" args={[bg, L * 5, L * 12]} />
        <Suspense fallback={null}>
          <Scene
            pool={pool}
            spa={spa}
            disps={disps}
            customPos={customPos}
            poolFmt={poolFmt}
            autoPositions={autoPositions}
            invertSide={invertSide}
          />
        </Suspense>
      </Canvas>
      <Legend disps={disps} />
      <div style={{ position: 'absolute', bottom: 8, right: 8, fontSize: '9px', color: dark ? '#94a3b8' : '#1e40af', background: 'rgba(255,255,255,0.7)', padding: '2px 8px', borderRadius: '4px', pointerEvents: 'none' }}>
        🖱 Arraste para rotacionar · Scroll para zoom · Clique direito para mover
      </div>
    </div>
  );
}
