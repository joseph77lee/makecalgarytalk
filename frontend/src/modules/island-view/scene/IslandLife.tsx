/**
 * Life over and on the island (M19 Art Pass, "busier communities"): drifting clouds, a circling
 * flock, Canada geese passing in a V, planes (more often over NE communities, near the airport),
 * sometimes a hot-air balloon, and wildlife that sometimes visits: jackrabbits anywhere, deer where
 * there is a park, hill, creek or water, rarely a cougar near parks and hills, geese by the water.
 * Pure decoration; positions change in useFrame through refs only.
 */
import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { Group } from 'three';
import type { BoxPart } from '../assets/boxes';
import { VoxelAnimal, type AnimalMotion } from '../assets/VoxelAnimal';
import { ANIMAL_STYLE } from '../assets/voxel/gaits';
import type { AnimalKind } from '../assets/voxel/rigs';
import { airplane, birdBody, birdWing, cloud, gooseFlyingBody, gooseWing, hotAirBalloon } from '../assets/voxel/samples';
import type { FeatureKey } from '../plan/features';
import type { LandExtent } from './camera';
import { lifePlan } from './lifePlan';
import { claimedTiles, freeSteps } from './steps';
import { BoxBatch } from './BoxBatch';
import { mixHex } from './sky';
import { useIslandCtx } from './islandContext';

/** Peak cloud drift speed in tiles per second (slow, but visibly moving). */
const CLOUD_SPEED = 0.3;

function Batch({ parts, shadow = true }: { parts: BoxPart[]; shadow?: boolean }) {
  return <BoxBatch parts={parts} castShadow={shadow} receiveShadow={false} />;
}

function Mover({ move, children }: { move: (t: number, g: Group) => void; children: ReactNode }) {
  const ref = useRef<Group>(null);
  useFrame(({ clock }) => {
    if (ref.current) move(clock.elapsedTime, ref.current);
  });
  return <group ref={ref}>{children}</group>;
}

/**
 * An animal wandering on walkable tiles of the risen land (model faces +x). Each step it may
 * break into a run if its kind does (deer bound, cougars dash); its legs follow its gait.
 */
function Wanderer({ kind, speed, seed }: { kind: AnimalKind; speed: number; seed: number }) {
  const { walkable, walkableKeys, crowd } = useIslandCtx();
  const meId = `animal:${kind}:${seed}`;
  useEffect(() => () => crowd.release(meId), [crowd, meId]);
  const start = walkable[Math.floor(((seed * 9301 + 49297) % 233280) / 233280 * walkable.length)] ?? { x: 0, z: 0 };
  const sim = useRef({ from: start, to: start, t: 1, pause: 1 + (seed % 3), rng: seed * 16807, running: false });
  const motion = useRef<AnimalMotion>({ speed: 0, running: false });
  const style = ANIMAL_STYLE[kind];
  const ref = useRef<Group>(null);
  useFrame((_, rawDt) => {
    const g = ref.current;
    if (!g) return;
    const dt = Math.min(rawDt, 0.1);
    const s = sim.current;
    const rnd = () => {
      s.rng = (s.rng * 16807) % 2147483647;
      return s.rng / 2147483647;
    };
    if (s.t >= 1) {
      if (s.pause > 0) s.pause -= dt;
      else {
        const opts = freeSteps(s.to, walkableKeys, crowd, meId);
        if (opts.length > 0) {
          s.from = s.to;
          s.to = opts[Math.floor(rnd() * opts.length)];
          s.t = 0;
          // a run lasts a few tiles: keep running with a good chance, else maybe start one
          s.running = style.run !== undefined && rnd() < (s.running ? 0.7 : style.run.chance);
        }
        if (!s.running && rnd() < 0.35) s.pause = 1 + rnd() * 4;
      }
    }
    const pace = s.running && style.run ? speed * style.run.speedUp : speed;
    const moving = s.t < 1;
    if (moving) s.t = Math.min(1, s.t + dt * pace);
    crowd.claim(meId, claimedTiles(s.from, s.to, moving));
    const x = s.from.x + (s.to.x - s.from.x) * s.t + 0.5;
    const z = s.from.z + (s.to.z - s.from.z) * s.t + 0.5;
    g.position.set(x, 0, z);
    if (moving) g.rotation.y = Math.atan2(s.to.x - s.from.x, s.to.z - s.from.z) - Math.PI / 2;
    motion.current.speed = moving ? pace : 0;
    motion.current.running = moving && s.running;
  });
  return (
    <group ref={ref}>
      <group scale={0.85}>
        <VoxelAnimal kind={kind} motion={motion} seed={seed} />
      </group>
    </group>
  );
}

interface Props {
  code: string;
  features: FeatureKey[];
  hasWater: boolean;
  radius: number;
  /** Where the land ends in each screen direction, and the camera orbit angle it was measured for. */
  extent: LandExtent;
  azimuth: number;
  /** Cloud drift speed multiplier (wind, §10.4). */
  cloudSpeed?: number;
  /** 0 = white clouds … 1 = grey storm clouds. */
  cloudGrey?: number;
  /** Night or bad weather: birds, flying geese and the balloon stay away (planes still fly). */
  quiet?: boolean;
}

export function IslandLife({ code, features, hasWater, radius, extent, azimuth, cloudSpeed = 1, cloudGrey = 0, quiet = false }: Props) {
  // screen right and towards-the-camera directions on the ground
  const rx = Math.cos(azimuth);
  const rz = -Math.sin(azimuth);
  const fx = Math.sin(azimuth);
  const fz = Math.cos(azimuth);
  // Visitors are picked once per visit (a new chance every time the island is opened).
  const [plan] = useState(() => lifePlan(code, features, hasWater, Math.random));
  const clouds = useMemo(
    () => [cloud(1), cloud(2), cloud(3)].map((parts) => (cloudGrey > 0 ? parts.map((b) => ({ ...b, c: mixHex(b.c, '#aeb5c3', cloudGrey * 0.75) })) : parts)),
    [cloudGrey],
  );
  const body = useMemo(() => birdBody(), []);
  const wing = useMemo(() => birdWing(), []);
  const gBody = useMemo(() => gooseFlyingBody(), []);
  const gWing = useMemo(() => gooseWing(), []);
  const plane = useMemo(() => airplane(), []);
  const balloon = useMemo(() => hotAirBalloon(code.charCodeAt(0)), [code]);
  const span = radius * 2 + 16;

  return (
    <>
      {clouds.map((c, i) => (
        // Clouds hug the island like it floats on them: tucked against the real left and right
        // edges just below the ground, and one under the front cliff. They drift a little along
        // the edge but never over the land, so they never hide houses or labels.
        <Mover
          key={`c${i}`}
          move={(t, g) => {
            // Each cloud glides back and forth over its own stretch at about CLOUD_SPEED tiles a
            // second (the period follows the stretch length) and bobs gently.
            // a = across the screen, b = towards the camera; clouds stay wide on screen (long side across).
            const reach = i === 0 ? extent.front * 0.35 : i === 1 ? extent.back * 0.35 : 1.6;
            const sway = Math.sin((t * CLOUD_SPEED * cloudSpeed) / Math.max(reach, 1) + i * 2.1);
            const bob = Math.sin(t * 0.45 + i * 1.7) * 0.12;
            const [a, b, y] =
              i === 0 ? [-(extent.left + 2.2), sway * reach, -1.2]
              : i === 1 ? [extent.right + 2.2, sway * reach, -0.4]
              : [-extent.left * 0.55 - (1 + sway) * reach, extent.front * 0.75 + 1.5, -2.6]; // only away from the land
            g.position.set(a * rx + b * fx, y + bob, a * rz + b * fz);
            g.rotation.y = azimuth;
          }}
        >
          <group scale={1.4}>
            <Batch parts={c} />
          </group>
        </Mover>
      ))}

      {!quiet && [0, 1, 2, 3, 4].map((i) => (
        <Mover
          key={`b${i}`}
          move={(t, g) => {
            const a = t * 0.4 + i * 0.35;
            const r = radius * 0.45 + (i % 2) * 0.8;
            g.position.set(Math.cos(a) * r, 6.5 + Math.sin(t * 1.3 + i) * 0.3, Math.sin(a) * r);
            g.rotation.y = -a - Math.PI / 2;
            const flap = Math.sin(t * 9 + i) * 0.7;
            const [l, w] = g.children[1].children as Group[];
            if (l && w) {
              l.rotation.x = flap;
              w.rotation.x = -flap;
            }
          }}
        >
          <Batch parts={body} shadow={false} />
          <group>
            <group>
              <Batch parts={wing} shadow={false} />
            </group>
            <group scale={[1, 1, -1]}>
              <Batch parts={wing} shadow={false} />
            </group>
          </group>
        </Mover>
      ))}

      {/* Canada geese crossing in a V every 45 s */}
      {!quiet && [0, 1, 2, 3, 4, 5, 6].map((i) => {
        const rank = Math.ceil(i / 2);
        const side = i === 0 ? 0 : i % 2 ? 1 : -1;
        return (
          <Mover
            key={`g${i}`}
            move={(t, g) => {
              const k = (t % 45) / 45;
              g.visible = k < 0.4;
              const p = k / 0.4;
              g.position.set(-span / 2 + p * span - rank * 1.1, 9 + rank * 0.1, radius * 0.3 + side * rank * 0.9);
              const flap = Math.sin(t * 4 + i * 0.6) * 0.5;
              const [l, w] = g.children[1].children as Group[];
              if (l && w) {
                l.rotation.x = flap;
                w.rotation.x = -flap;
              }
            }}
          >
            <Batch parts={gBody} shadow={false} />
            <group>
              <group>
                <Batch parts={gWing} shadow={false} />
              </group>
              <group scale={[1, 1, -1]}>
                <Batch parts={gWing} shadow={false} />
              </group>
            </group>
          </Mover>
        );
      })}

      {/* A plane high up; NE communities (near the airport) see one far more often */}
      <Mover
        move={(t, g) => {
          const period = plan.planeEvery;
          const k = (t % period) / period;
          const flying = k < 16 / period;
          g.visible = flying;
          const p = (t % period) / 16;
          g.position.set(-span + p * span * 2, 15, span * 0.5 - p * span);
          g.rotation.y = Math.atan2(span, span * 2);
        }}
      >
        <group scale={2.2}>
          <Batch parts={plane} shadow={false} />
        </group>
      </Mover>

      {plan.balloon && !quiet && (
        <Mover move={(t, g) => g.position.set(Math.sin(t * 0.03) * radius * 0.8, 8 + Math.sin(t * 0.5) * 0.4, -radius * 0.7 + Math.cos(t * 0.04) * 2)}>
          <group scale={1.3}>
            <Batch parts={balloon} />
          </group>
        </Mover>
      )}

      {Array.from({ length: plan.rabbits }, (_, i) => (
        <Wanderer key={`r${i}`} kind="jackrabbit" speed={0.9} seed={11 + i} />
      ))}
      {Array.from({ length: plan.deer }, (_, i) => (
        <Wanderer key={`d${i}`} kind={i === 0 ? 'buck' : 'deer'} speed={0.35} seed={23 + i} />
      ))}
      {plan.cougar && <Wanderer kind="cougar" speed={0.3} seed={37} />}
      {Array.from({ length: plan.geeseOnGround }, (_, i) => (
        <Wanderer key={`gs${i}`} kind="goose" speed={0.3} seed={41 + i} />
      ))}
    </>
  );
}
