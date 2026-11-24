/**
 * Moving samples for the Art Pass gallery (M19): sky (clouds, birds, hot-air balloon, airplane)
 * and wildlife (deer, jackrabbit, cougar). Positions change in useFrame through refs only.
 */
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef, type ReactNode } from 'react';
import type { Group } from 'three';
import type { BoxPart } from '../assets/boxes';
import { airplane, birdBody, birdWing, cloud, cougar, deer, gooseFlyingBody, gooseStanding, gooseWing, hotAirBalloon, jackrabbit } from '../assets/voxel/samples';
import { BoxBatch } from '../scene/BoxBatch';

function Batch({ parts, shadow = true }: { parts: BoxPart[]; shadow?: boolean }) {
  return <BoxBatch parts={parts} castShadow={shadow} receiveShadow={false} />;
}

/** A group moved every frame by `move(t, group)`. */
function Mover({ move, children }: { move: (t: number, g: Group) => void; children: ReactNode }) {
  const ref = useRef<Group>(null);
  useFrame(({ clock }) => {
    if (ref.current) move(clock.elapsedTime, ref.current);
  });
  return <group ref={ref}>{children}</group>;
}

export function GalleryLife() {
  const clouds = useMemo(() => [cloud(1), cloud(2), cloud(3)], []);
  const body = useMemo(() => birdBody(), []);
  const wing = useMemo(() => birdWing(), []);
  const balloon = useMemo(() => hotAirBalloon(2), []);
  const plane = useMemo(() => airplane(), []);
  const buck = useMemo(() => deer(true), []);
  const doe = useMemo(() => deer(false), []);
  const rabbit = useMemo(() => jackrabbit(false), []);
  const cat = useMemo(() => cougar(), []);
  const gBody = useMemo(() => gooseFlyingBody(), []);
  const gWing = useMemo(() => gooseWing(), []);
  const goose = useMemo(() => gooseStanding(), []);

  return (
    <>
      {/* Clouds drift east and wrap around. */}
      {clouds.map((c, i) => (
        <Mover
          key={i}
          move={(t, g) => {
            const span = 34;
            const x = ((t * 0.35 + i * 11) % span) - span / 2;
            g.position.set(x, 13 + i * 1.5, -6 + i * 5);
          }}
        >
          <Batch parts={c} shadow={false} />
        </Mover>
      ))}

      {/* A small flock circling, wings flapping. */}
      {[0, 1, 2, 3, 4].map((i) => (
        <Mover
          key={i}
          move={(t, g) => {
            const a = t * 0.45 + i * 0.35;
            const r = 6 + (i % 2) * 0.8;
            g.position.set(Math.cos(a) * r, 9 + Math.sin(t * 1.3 + i) * 0.3, Math.sin(a) * r - 1);
            g.rotation.y = -a - Math.PI / 2;
            const flap = Math.sin(t * 9 + i) * 0.7;
            const [l, rw] = g.children[1].children as Group[];
            if (l && rw) {
              l.rotation.x = flap;
              rw.rotation.x = -flap;
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

      {/* Canada geese flying across in a V (every 20 s), wings flapping slowly. */}
      {[0, 1, 2, 3, 4, 5, 6].map((i) => {
        const rank = Math.ceil(i / 2);
        const side = i === 0 ? 0 : i % 2 ? 1 : -1;
        return (
          <Mover
            key={`g${i}`}
            move={(t, g) => {
              const k = (t % 20) / 20;
              g.position.set(-30 + k * 60 - rank * 1.1, 11 + rank * 0.1, -4 + side * rank * 0.9);
              g.visible = k < 0.97;
              const flap = Math.sin(t * 4 + i * 0.6) * 0.5;
              const [l, r] = g.children[1].children as Group[];
              if (l && r) {
                l.rotation.x = flap;
                r.rotation.x = -flap;
              }
            }}
          >
            <group scale={0.9}>
              <Batch parts={gBody} shadow={false} />
            </group>
            <group scale={0.9}>
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

      {/* Two geese walking on the grass. */}
      {[0, 1].map((i) => (
        <Mover
          key={`gs${i}`}
          move={(t, g) => {
            const s = Math.sin(t * 0.3 + i * 2);
            g.position.set(-1.2 + s * 1.0 + i * 0.9, 0, 4.7 + i * 0.6);
            g.rotation.y = Math.cos(t * 0.3 + i * 2) >= 0 ? 0 : Math.PI;
          }}
        >
          <Batch parts={goose} />
        </Mover>
      ))}

      {/* Hot-air balloon bobbing and drifting slowly. */}
      <Mover move={(t, g) => g.position.set(-9 + Math.sin(t * 0.08) * 3, 7 + Math.sin(t * 0.6) * 0.4, -8)}>
        <Batch parts={balloon} />
      </Mover>

      {/* A plane crossing high up every 16 s (NE communities would see it more often). */}
      <Mover
        move={(t, g) => {
          const k = (t % 16) / 16;
          g.position.set(-40 + k * 80, 22, 14 - k * 28);
          g.rotation.y = Math.atan2(28, 80);
          g.visible = k < 0.95;
        }}
      >
        <group scale={2}>
          <Batch parts={plane} shadow={false} />
        </group>
      </Mover>

      {/* Wildlife: two deer grazing back and forth, a hopping jackrabbit, a prowling cougar. */}
      {[buck, doe].map((d, i) => (
        <Mover
          key={i}
          move={(t, g) => {
            const s = Math.sin(t * 0.25 + i * 1.7);
            g.position.set(0.5 + s * 1.6 + i * 1.2, 0, 5.4 + i * 0.9);
            g.rotation.y = Math.cos(t * 0.25 + i * 1.7) >= 0 ? 0 : Math.PI;
          }}
        >
          <Batch parts={d} />
        </Mover>
      ))}
      <Mover
        move={(t, g) => {
          const s = (t * 0.6) % 4;
          g.position.set(-1.5 + s, Math.abs(Math.sin(t * 6)) * 0.18, 7.2);
        }}
      >
        <Batch parts={rabbit} />
      </Mover>
      <Mover
        move={(t, g) => {
          const s = Math.sin(t * 0.15);
          g.position.set(3.4 + s * 1.2, 0, 7);
          g.rotation.y = Math.cos(t * 0.15) >= 0 ? 0 : Math.PI;
        }}
      >
        <Batch parts={cat} />
      </Mover>
    </>
  );
}
