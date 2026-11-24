/**
 * Life over and on the island (M19 Art Pass, "busier communities"): drifting clouds, a circling
 * flock, Canada geese passing in a V, planes (more often over NE communities, near the airport),
 * sometimes a hot-air balloon, and wildlife that sometimes visits: jackrabbits anywhere, deer where
 * there is a park, hill, creek or water, rarely a cougar near parks and hills, geese by the water.
 * Pure decoration; positions change in useFrame through refs only.
 */
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef, useState, type ReactNode } from 'react';
import type { Group } from 'three';
import type { BoxPart } from '../assets/boxes';
import { airplane, birdBody, birdWing, cloud, cougar, deer, gooseFlyingBody, gooseStanding, gooseWing, hotAirBalloon, jackrabbit } from '../assets/voxel/samples';
import type { FeatureKey } from '../plan/features';
import { lifePlan } from './lifePlan';
import { BoxBatch } from './BoxBatch';
import { useIslandCtx } from './islandContext';

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

/** An animal wandering slowly on walkable tiles of the risen land (model faces +x). */
function Wanderer({ parts, speed, hop, seed }: { parts: BoxPart[]; speed: number; hop: boolean; seed: number }) {
  const { walkable, walkableKeys } = useIslandCtx();
  const start = walkable[Math.floor(((seed * 9301 + 49297) % 233280) / 233280 * walkable.length)] ?? { x: 0, z: 0 };
  const sim = useRef({ from: start, to: start, t: 1, pause: 1 + (seed % 3), rng: seed * 16807 });
  const ref = useRef<Group>(null);
  useFrame(({ clock }, rawDt) => {
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
        const opts = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dx, dz]) => ({ x: s.to.x + dx, z: s.to.z + dz })).filter((n) => walkableKeys.has(`${n.x},${n.z}`));
        if (opts.length > 0) {
          s.from = s.to;
          s.to = opts[Math.floor(rnd() * opts.length)];
          s.t = 0;
        }
        if (rnd() < 0.35) s.pause = 1 + rnd() * 4;
      }
    } else s.t = Math.min(1, s.t + dt * speed);
    const x = s.from.x + (s.to.x - s.from.x) * s.t + 0.5;
    const z = s.from.z + (s.to.z - s.from.z) * s.t + 0.5;
    const moving = s.t < 1;
    g.position.set(x, hop && moving ? Math.abs(Math.sin(clock.elapsedTime * 7 + seed)) * 0.12 : 0, z);
    if (moving) g.rotation.y = Math.atan2(s.to.x - s.from.x, s.to.z - s.from.z) - Math.PI / 2;
  });
  return (
    <group ref={ref}>
      <group scale={0.85}>
        <Batch parts={parts} />
      </group>
    </group>
  );
}

export function IslandLife({ code, features, hasWater, radius }: { code: string; features: FeatureKey[]; hasWater: boolean; radius: number }) {
  // Visitors are picked once per visit (a new chance every time the island is opened).
  const [plan] = useState(() => lifePlan(code, features, hasWater, Math.random));
  const clouds = useMemo(() => [cloud(1), cloud(2), cloud(3)], []);
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
        // Clouds float beside the island (never over it, so they never hide houses or labels).
        <Mover
          key={`c${i}`}
          move={(t, g) => {
            const along = ((t * 0.3 + i * span * 0.37) % span) - span / 2;
            const off = radius + 6 + i * 2;
            if (i === 1) g.position.set(off, 3 + i, along);
            else g.position.set(along, 2 + i * 1.5, i === 0 ? -off : off);
          }}
        >
          <group scale={1.4}>
            <Batch parts={c} />
          </group>
        </Mover>
      ))}

      {[0, 1, 2, 3, 4].map((i) => (
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
      {[0, 1, 2, 3, 4, 5, 6].map((i) => {
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

      {plan.balloon && (
        <Mover move={(t, g) => g.position.set(Math.sin(t * 0.03) * radius * 0.8, 8 + Math.sin(t * 0.5) * 0.4, -radius * 0.7 + Math.cos(t * 0.04) * 2)}>
          <group scale={1.3}>
            <Batch parts={balloon} />
          </group>
        </Mover>
      )}

      {Array.from({ length: plan.rabbits }, (_, i) => (
        <Wanderer key={`r${i}`} parts={jackrabbit(false)} speed={0.9} hop seed={11 + i} />
      ))}
      {Array.from({ length: plan.deer }, (_, i) => (
        <Wanderer key={`d${i}`} parts={deer(i === 0)} speed={0.35} hop={false} seed={23 + i} />
      ))}
      {plan.cougar && <Wanderer parts={cougar()} speed={0.3} hop={false} seed={37} />}
      {Array.from({ length: plan.geeseOnGround }, (_, i) => (
        <Wanderer key={`gs${i}`} parts={gooseStanding()} speed={0.4} hop={false} seed={41 + i} />
      ))}
    </>
  );
}
