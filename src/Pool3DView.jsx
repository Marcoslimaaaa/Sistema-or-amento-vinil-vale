import React, { Suspense, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Line, GizmoHelper, GizmoViewcube } from '@react-three/drei';

const DEVICE_COLORS = {
  retorno:   '#ef4444',
  aspiracao: '#ec4899',
  dreno:     '#8b5cf6',
  skimmer:   '#f59e0b',
  refletor:  '#f97316',
  nivelador: '#06b6d4',
  hidro:     '#14b8a6',
};

function toWorld3D(p, L, W, D) {
  const wx = p.x * L - L / 2;
  const wz = p.y * W - W / 2;
  if (p.floor) return [wx, 0.08, wz];
  if (p.x < 0.08) return [-L / 2, D * 0.5, wz];
  if (p.x > 0.92) return [L / 2, D * 0.5, wz];
  if (p.y < 0.06) return [wx, p.type === 'refletor' ? D * 0.3 : D * 0.5, -W / 2];
  if (p.y > 0.94) return [wx, p.type === 'refletor' ? D * 0.3 : D * 0.5, W / 2];
  const dists = [p.x, 1 - p.x, p.y, 1 - p.y];
  const min = Math.min(...dists);
  if (min === dists[0]) return [-L / 2, D * 0.5, wz];
  if (min === dists[1]) return [L / 2, D * 0.5, wz];
  if (min === dists[2]) return [wx, D * 0.5, -W / 2];
  return [wx, D * 0.5, W / 2];
}

function getCMPos(L, D, invertSide) {
  return invertSide ? [-L / 2 - 1.0, D * 0.4, 0] : [L / 2 + 1.0, D * 0.4, 0];
}

function getPipePoints(devPos, cmPos, L, W) {
  const [dx, , dz] = devPos;
  const [cx, cy, cz] = cmPos;
  let midX = dx > L / 2 - 0.2 ? L / 2 + 0.3 : dx < -L / 2 + 0.2 ? -L / 2 - 0.3 : dx;
  let midZ = dz > W / 2 - 0.2 ? W / 2 + 0.3 : dz < -W / 2 + 0.2 ? -W / 2 - 0.3 : dz;
  return [devPos, [midX, 0.12, midZ], [cx, cy, cz]];
}

// ── Paredes ─────────────────────────────────────────────────────────────────
function PoolWalls({ L, W, D }) {
  const wt = 0.14;
  return (
    <group>
      {/* Piso */}
      <mesh position={[0, -wt / 2, 0]}>
        <boxGeometry args={[L + wt * 2, wt, W + wt * 2]} />
        <meshStandardMaterial color="#64748b" roughness={0.95} />
      </mesh>
      {/* Parede frontal */}
      <mesh position={[0, D / 2, -W / 2 - wt / 2]}>
        <boxGeometry args={[L + wt * 2, D, wt]} />
        <meshStandardMaterial color="#94a3b8" roughness={0.85} />
      </mesh>
      {/* Parede traseira */}
      <mesh position={[0, D / 2, W / 2 + wt / 2]}>
        <boxGeometry args={[L + wt * 2, D, wt]} />
        <meshStandardMaterial color="#94a3b8" roughness={0.85} />
      </mesh>
      {/* Parede esquerda */}
      <mesh position={[-L / 2 - wt / 2, D / 2, 0]}>
        <boxGeometry args={[wt, D, W]} />
        <meshStandardMaterial color="#8ca5b8" roughness={0.85} />
      </mesh>
      {/* Parede direita */}
      <mesh position={[L / 2 + wt / 2, D / 2, 0]}>
        <boxGeometry args={[wt, D, W]} />
        <meshStandardMaterial color="#8ca5b8" roughness={0.85} />
      </mesh>
      {/* Borda superior - frente/trás */}
      <mesh position={[0, D + 0.04, -W / 2]}>
        <boxGeometry args={[L + wt * 2, 0.08, wt + 0.12]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.7} />
      </mesh>
      <mesh position={[0, D + 0.04, W / 2]}>
        <boxGeometry args={[L + wt * 2, 0.08, wt + 0.12]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.7} />
      </mesh>
      {/* Borda superior - esquerda/direita */}
      <mesh position={[-L / 2, D + 0.04, 0]}>
        <boxGeometry args={[wt + 0.12, 0.08, W]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.7} />
      </mesh>
      <mesh position={[L / 2, D + 0.04, 0]}>
        <boxGeometry args={[wt + 0.12, 0.08, W]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.7} />
      </mesh>
    </group>
  );
}

// ── Água animada ─────────────────────────────────────────────────────────────
function Water({ L, W, D }) {
  const ref = useRef();
  const wl = D * 0.88;
  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.position.y = wl / 2 + Math.sin(clock.elapsedTime * 0.6) * 0.007;
    }
  });
  return (
    <mesh ref={ref} position={[0, wl / 2, 0]}>
      <boxGeometry args={[L - 0.03, wl, W - 0.03]} />
      <meshStandardMaterial color="#38bdf8" transparent opacity={0.42} roughness={0.05} metalness={0.15} />
    </mesh>
  );
}

// ── Dispositivo ──────────────────────────────────────────────────────────────
function Device({ position, color, type }) {
  return (
    <mesh position={position} castShadow>
      {type === 'dreno'
        ? <cylinderGeometry args={[0.12, 0.12, 0.07, 16]} />
        : <sphereGeometry args={[0.1, 14, 10]} />}
      <meshStandardMaterial
        color={color}
        roughness={0.25}
        metalness={0.6}
        emissive={color}
        emissiveIntensity={0.3}
      />
    </mesh>
  );
}

// ── Casa de Máquinas ─────────────────────────────────────────────────────────
function MachineRoom({ L, D, invertSide }) {
  const [mx, my, mz] = getCMPos(L, D, invertSide);
  return (
    <group position={[mx, my, mz]}>
      <mesh castShadow>
        <boxGeometry args={[0.75, 0.9, 1.1]} />
        <meshStandardMaterial color="#334155" roughness={0.85} />
      </mesh>
      <mesh position={[invertSide ? -0.28 : 0.28, -0.05, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.18, 0.18, 0.35, 16]} />
        <meshStandardMaterial color="#64748b" roughness={0.4} metalness={0.8} />
      </mesh>
      <mesh position={[0, 0.48, 0]}>
        <boxGeometry args={[0.8, 0.06, 1.15]} />
        <meshStandardMaterial color="#475569" roughness={0.9} />
      </mesh>
    </group>
  );
}

// ── Chão externo ─────────────────────────────────────────────────────────────
function Ground({ L, W }) {
  return (
    <mesh position={[0, -0.22, 0]} receiveShadow>
      <boxGeometry args={[L + 10, 0.2, W + 10]} />
      <meshStandardMaterial color="#e2e8f0" roughness={1} />
    </mesh>
  );
}

// ── Cena ─────────────────────────────────────────────────────────────────────
function Scene({ pool, disps, customPos, poolFmt, autoPositions, invertSide }) {
  const L = parseFloat(pool?.length) || 6;
  const W = parseFloat(pool?.width)  || 3;
  const D = parseFloat(pool?.depth)  || 1.4;

  const allPos = autoPositions
    ? { ...autoPositions(L, W, disps, invertSide, poolFmt), ...customPos }
    : {};

  const activeDevices = Object.entries(allPos).filter(([k, p]) => {
    if (p.special) return false;
    return autoPositions ? !!autoPositions(L, W, disps, invertSide, poolFmt)[k] : false;
  });

  const cmPos = getCMPos(L, D, invertSide);

  return (
    <>
      <ambientLight intensity={0.7} />
      <directionalLight position={[L * 1.5, D * 5, W * 2]} intensity={1.4} castShadow />
      <directionalLight position={[-L, D * 2, -W]} intensity={0.35} />
      <pointLight position={[0, D * 0.6, 0]} intensity={0.5} color="#38bdf8" />

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
            <Device position={pos3D} color={color} type={p.type} />
            <Line points={pipePoints} color={color} lineWidth={2} />
          </React.Fragment>
        );
      })}

      <OrbitControls enablePan minDistance={2} maxDistance={L * 4} target={[0, D / 2, 0]} />

      <GizmoHelper alignment="bottom-right" margin={[60, 60]}>
        <GizmoViewcube />
      </GizmoHelper>
    </>
  );
}

// ── Legenda ──────────────────────────────────────────────────────────────────
function Legend({ disps }) {
  const items = [
    ['retorno',   'Retorno',   '#ef4444'],
    ['aspiracao', 'Aspiração', '#ec4899'],
    ['dreno',     'Dreno',     '#8b5cf6'],
    ['skimmer',   'Skimmer',   '#f59e0b'],
    ['refletor',  'Refletor',  '#f97316'],
    ['nivelador', 'Nivelador', '#06b6d4'],
    ['hidro',     'Hidro',     '#14b8a6'],
  ].filter(([k]) => (disps?.[k] || 0) > 0);

  return (
    <div style={{ position: 'absolute', top: 8, left: 8, display: 'flex', flexDirection: 'column', gap: '3px', pointerEvents: 'none' }}>
      {items.map(([k, lb, color]) => (
        <div key={k} style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'rgba(255,255,255,0.88)', padding: '2px 8px', borderRadius: '4px' }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
          <span style={{ fontSize: '9px', fontWeight: '600', color: '#1a1a2e' }}>{lb} ({disps[k]})</span>
        </div>
      ))}
    </div>
  );
}

// ── Export ───────────────────────────────────────────────────────────────────
export default function Pool3DView({ pool, spa, disps, customPos, poolFmt, autoPositions, invertSide, dark }) {
  const L = parseFloat(pool?.length) || 6;
  const D = parseFloat(pool?.depth)  || 1.4;
  const bg = dark ? '#0f172a' : '#bfdbfe';

  return (
    <div style={{ position: 'relative', width: '100%', height: '440px', borderRadius: '12px', overflow: 'hidden', background: bg }}>
      <Canvas
        camera={{ position: [L * 1.2, D * 3, L * 0.9], fov: 48 }}
        shadows
        gl={{ antialias: true }}
      >
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
      <div style={{ position: 'absolute', bottom: 8, right: 8, fontSize: '9px', color: '#1e40af', background: 'rgba(255,255,255,0.75)', padding: '2px 8px', borderRadius: '4px', pointerEvents: 'none' }}>
        🖱 Arraste · Scroll zoom · Clique direito mover
      </div>
    </div>
  );
}
