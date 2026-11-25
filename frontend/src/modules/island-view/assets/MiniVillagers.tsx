import { Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import type { Group } from 'three';
import type { Tile } from '../layout';
import { ACCENTS } from '../mood';
import { useIslandCtx, useSceneFx, pokeHop } from '../scene/islandContext';
import type { ObjectOf } from '../layout';
import type { ItemsProps } from './BoxAsset';
import { villagerPersonality } from './villagerPersonality';
import { useIslandUi } from '../uiStore';
import { SpeechBubbleLabel } from '../scene/Labels';
import type { PersonMotion } from './VoxelPerson';
import { Person } from './lowpoly/RiggedFigures';
import { villagerModel } from './lowpoly/rigged';
import { BUBBLE_Z } from '../scene/labelText';
import { useHtmlPortal } from '../scene/htmlPortal';
import { claimedTiles, freeSteps } from '../scene/steps';

/** Ambient mini villagers wandering the walkable tiles (requirement.md §7.3). */
export function MiniVillagers({ items }: ItemsProps<ObjectOf<'mini-villager'>>) {
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

function MiniVillager({ index, startTile, colorIndex }: { index: number; startTile: Tile; colorIndex: number }) {
  const { villagerSpeed, mood, walkableKeys, villagerBubbles, villagerBubbleTaps, crowd } = useIslandCtx();
  const meId = `villager:${index}`;
  useEffect(() => () => crowd.release(meId), [crowd, meId]);
  const group = useRef<Group>(null);
  const headTilt = useRef(0);
  const motion = useRef<PersonMotion>({ speed: 0 });
  const body = useRef<Group>(null);
  const sim = useRef({ from: startTile, to: startTile, t: 1, pause: 0, rng: mulberry32(index * 7919 + 17) });
  const me = useRef(villagerPersonality(index)).current;
  const showLabels = useIslandUi((u) => u.showLabels);
  const portal = useHtmlPortal();
  const bubble = showLabels ? villagerBubbles.get(index) : undefined;
  const onBubbleTap = bubble ? villagerBubbleTaps.get(index) : undefined;

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
        // never step onto a tile someone else (avatar, villager, animal) stands on or is entering
        const options = freeSteps(s.to, walkableKeys, crowd, meId);
        const forward = options.filter((n) => n.x !== s.from.x || n.z !== s.from.z);
        const pool = forward.length > 0 ? forward : options;
        if (pool.length > 0) {
          s.from = s.to;
          s.to = pool[Math.floor(s.rng() * pool.length)];
          s.t = 0;
        } else s.pause = 0.4; // boxed in for now: wait a moment and look again
        // Villagers stroll and often stop to look around; sleepy ones mostly sit.
        const restChance = (mood === 'sleepy' ? 0.5 : mood === 'normal' ? 0.3 : 0.22) * me.restFactor;
        if (s.rng() < restChance) s.pause = (1.2 + s.rng() * (mood === 'sleepy' ? 5 : 3)) * me.restFactor;
      }
    } else {
      s.t = Math.min(1, s.t + dt * villagerSpeed * me.speedFactor);
    }

    crowd.claim(meId, claimedTiles(s.from, s.to, s.t < 1));
    const x = s.from.x + (s.to.x - s.from.x) * s.t + 0.5;
    const z = s.from.z + (s.to.z - s.from.z) * s.t + 0.5;
    const moving = s.t < 1;
    let y = 0;
    if (cheering) y = Math.abs(Math.sin(time * 7 + index)) * 0.3;
    else if (moving && me.hops && mood === 'lively') y = Math.abs(Math.sin(time * me.bobRate + index)) * 0.05;
    else if (moving) y = Math.abs(Math.sin(time * me.bobRate + index)) * 0.015;
    g.position.set(x, y + pokeHop(meId), z);
    if (moving) g.rotation.y = Math.atan2(s.to.x - s.from.x, s.to.z - s.from.z);

    // Sleepy: heads down, sits when resting. Lively: looks up.
    const sitting = mood === 'sleepy' && !moving && !cheering;
    headTilt.current = mood === 'sleepy' && !cheering ? 0.45 : mood === 'lively' ? -0.12 : 0;
    if (body.current) body.current.position.y = sitting ? -0.16 : 0;
    // arms and legs follow: walking pace, sitting, or both arms up when the community cheers
    const m = motion.current;
    m.speed = moving ? villagerSpeed * me.speedFactor : 0;
    m.sit = sitting;
    m.cheer = cheering;
  });

  return (
    <group ref={group} position={[startTile.x + 0.5, 0, startTile.z + 0.5]}>
      <group ref={body}>
        <Person model={villagerModel(index)} seed={index * 7 + 3} shirt={ACCENTS[colorIndex % ACCENTS.length]} motion={motion} headTilt={headTilt} />
      </group>
      {bubble && (
        <Html portal={portal} position={[0, 0.85, 0]} center zIndexRange={BUBBLE_Z} style={{ pointerEvents: onBubbleTap ? 'auto' : 'none' }}>
          {onBubbleTap ? (
            <button type="button" onClick={onBubbleTap} aria-label={`Open in Community News: ${bubble}`} className="block cursor-pointer">
              <SpeechBubbleLabel text={bubble} />
            </button>
          ) : (
            <SpeechBubbleLabel text={bubble} />
          )}
        </Html>
      )}
    </group>
  );
}
