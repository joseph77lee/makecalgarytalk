import { Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import type { Group, Mesh } from 'three';
import type { Tile } from '../layout';
import { ACCENTS } from '../mood';
import { useIslandCtx, useSceneFx } from '../scene/islandContext';
import type { AssetProps } from './BoxAsset';
import { SpeechBubbleLabel } from '../scene/Labels';
import { BUBBLE_Z } from '../scene/labelText';

/** Ambient mini villagers wandering the walkable tiles (requirement.md §7.3). */
export function MiniVillagers({ items }: AssetProps<'mini-villager'>) {
  return (
    <>
      {items.map((v) => (
        <MiniVillager key={v.id} index={v.index} startTile={v.startTile} colorIndex={v.colorIndex} />
      ))}
    </>
  );
}

/** Small seeded PRNG so each villager walks its own but repeatable way. */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const STEPS: Tile[] = [
  { x: 1, z: 0 },
  { x: -1, z: 0 },
  { x: 0, z: 1 },
  { x: 0, z: -1 },
];

function MiniVillager({ index, startTile, colorIndex }: { index: number; startTile: Tile; colorIndex: number }) {
  const { palette, mood, walkableKeys, villagerBubbles } = useIslandCtx();
  const group = useRef<Group>(null);
  const head = useRef<Mesh>(null);
  const body = useRef<Group>(null);
  const sim = useRef({ from: startTile, to: startTile, t: 1, pause: 0, rng: mulberry32(index * 7919 + 17) });
  const bubble = villagerBubbles.get(index);

  useFrame(({ clock }, rawDt) => {
    const g = group.current;
    if (!g) return;
    const dt = Math.min(rawDt, 0.1);
    const s = sim.current;
    const time = clock.elapsedTime;
    const cheering = performance.now() < useSceneFx.getState().celebrateUntil;

    if (!walkableKeys.has(`${s.to.x},${s.to.z}`)) {
      // The tile became blocked (e.g. a new house): hop back to the start.
      s.from = s.to = startTile;
      s.t = 1;
    }
    if (s.t >= 1) {
      if (s.pause > 0 || cheering) {
        s.pause -= dt;
      } else {
        const options = STEPS.map((d) => ({ x: s.to.x + d.x, z: s.to.z + d.z })).filter((n) =>
          walkableKeys.has(`${n.x},${n.z}`),
        );
        const forward = options.filter((n) => n.x !== s.from.x || n.z !== s.from.z);
        const pool = forward.length > 0 ? forward : options;
        if (pool.length > 0) {
          s.from = s.to;
          s.to = pool[Math.floor(s.rng() * pool.length)];
          s.t = 0;
        }
        const restChance = mood === 'gloomy' ? 0.45 : mood === 'normal' ? 0.2 : 0.1;
        if (s.rng() < restChance) s.pause = 0.8 + s.rng() * (mood === 'gloomy' ? 4 : 2);
      }
    } else {
      s.t = Math.min(1, s.t + dt * palette.villagerSpeed);
    }

    const x = s.from.x + (s.to.x - s.from.x) * s.t + 0.5;
    const z = s.from.z + (s.to.z - s.from.z) * s.t + 0.5;
    const moving = s.t < 1;
    let y = 0;
    if (cheering) y = Math.abs(Math.sin(time * 9 + index)) * 0.35;
    else if (moving && mood === 'lively') y = Math.abs(Math.sin(time * 12 + index)) * 0.1;
    else if (moving) y = Math.abs(Math.sin(time * 10 + index)) * 0.03;
    g.position.set(x, y, z);
    if (moving) g.rotation.y = Math.atan2(s.to.x - s.from.x, s.to.z - s.from.z);

    // Gloomy: heads down, sits when resting. Lively: looks up.
    const sitting = mood === 'gloomy' && !moving && !cheering;
    if (head.current) head.current.rotation.x = mood === 'gloomy' && !cheering ? 0.45 : mood === 'lively' ? -0.12 : 0;
    if (body.current) body.current.position.y = sitting ? -0.08 : 0;
  });

  return (
    <group ref={group} position={[startTile.x + 0.5, 0, startTile.z + 0.5]}>
      <group ref={body}>
        <mesh position={[0, 0.16, 0]} castShadow>
          <boxGeometry args={[0.22, 0.26, 0.16]} />
          <meshStandardMaterial color={ACCENTS[colorIndex % ACCENTS.length]} roughness={0.95} />
        </mesh>
        <mesh ref={head} position={[0, 0.4, 0]} castShadow>
          <boxGeometry args={[0.2, 0.2, 0.2]} />
          <meshStandardMaterial color="#f5d3b5" roughness={0.95} />
        </mesh>
      </group>
      {bubble && (
        <Html position={[0, 0.85, 0]} center zIndexRange={BUBBLE_Z} style={{ pointerEvents: 'none' }}>
          <SpeechBubbleLabel text={bubble} />
        </Html>
      )}
    </group>
  );
}
