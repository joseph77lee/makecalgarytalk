/**
 * CTrain trains (requirement.md §7.9): a three-car train runs along each visible track run, stops
 * at stations, leaves the island, waits, and comes back the other way. Pure decoration: positions
 * are computed per frame in useFrame with refs (no React state per frame).
 */
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import type { Group } from 'three';
import type { RailRoute } from '../layout';
import { trainPath, type TrainPath } from './trainPath';

const SPEED = 2.4; // tiles per second
const CAR_LENGTH = 0.86;
const CAR_GAP = 0.08;
const CARS = 3;
const STOP_SECONDS = 2.5;
const WAIT_MIN = 5;
const WAIT_MAX = 11;

export function Trains({ routes, landStage }: { routes: RailRoute[]; landStage: number }) {
  const paths = useMemo(() => routes.map((r) => trainPath(r, landStage)).filter((p): p is TrainPath => p !== null), [routes, landStage]);
  return (
    <>
      {paths.map((p, i) => (
        <Train key={`${i}:${p.length}`} path={p} seed={i} />
      ))}
    </>
  );
}

function Train({ path, seed }: { path: TrainPath; seed: number }) {
  const cars = useRef<(Group | null)[]>([]);
  const trainLen = CARS * CAR_LENGTH + (CARS - 1) * CAR_GAP;
  // s = distance of the front of the train along the path in the travel direction.
  const st = useRef({ dir: seed % 2 === 0 ? 1 : -1, s: -trainLen, wait: 1 + seed * 2.5, stopped: 0, nextStop: 0 });

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.1);
    const t = st.current;
    if (t.wait > 0) {
      t.wait -= dt;
      cars.current.forEach((c) => c && (c.visible = false));
      if (t.wait <= 0) {
        t.s = -0.2;
        t.nextStop = 0;
      }
      return;
    }
    const stops = t.dir === 1 ? path.stops : path.stops.map((d) => path.length - d).reverse();
    if (t.stopped > 0) {
      t.stopped -= dt;
    } else {
      const before = t.s;
      t.s += SPEED * dt;
      // stop with the middle of the train at the platform
      const target = stops[t.nextStop];
      if (target !== undefined && before < target + trainLen / 2 && t.s >= target + trainLen / 2) {
        t.s = target + trainLen / 2;
        t.stopped = STOP_SECONDS;
        t.nextStop += 1;
      }
    }
    if (t.s - trainLen > path.length + 0.2) {
      t.dir = -t.dir;
      t.wait = WAIT_MIN + ((seed * 7919 + Math.floor(t.s * 13)) % 1000) / 1000 * (WAIT_MAX - WAIT_MIN);
      return;
    }
    for (let i = 0; i < CARS; i++) {
      const g = cars.current[i];
      if (!g) continue;
      const mid = t.s - CAR_LENGTH / 2 - i * (CAR_LENGTH + CAR_GAP);
      const d = t.dir === 1 ? mid : path.length - mid;
      if (d < 0 || d > path.length) {
        g.visible = false;
        continue;
      }
      const p = path.at(d);
      g.visible = true;
      g.position.set(p.x, 0.1, p.z);
      g.rotation.y = p.heading;
    }
  });

  return (
    <>
      {Array.from({ length: CARS }, (_, i) => (
        <group key={i} ref={(g) => { cars.current[i] = g; }} visible={false}>
          <TrainCar front={i === 0} back={i === CARS - 1} />
        </group>
      ))}
    </>
  );
}

/** One car, built along +z (heading 0): white body, red band, lit windows, dark roof. */
function TrainCar({ front, back }: { front: boolean; back: boolean }) {
  const L = CAR_LENGTH;
  return (
    <group>
      <mesh position={[0, 0.2, 0]} castShadow>
        <boxGeometry args={[0.36, 0.34, L]} />
        <meshStandardMaterial color="#f4f4f4" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.1, 0]}>
        <boxGeometry args={[0.37, 0.1, L + 0.005]} />
        <meshStandardMaterial color="#d94a4a" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.27, 0]}>
        <boxGeometry args={[0.37, 0.1, L * 0.82]} />
        <meshBasicMaterial color="#cfe8f7" toneMapped={false} />
      </mesh>
      <mesh position={[0, 0.39, 0]}>
        <boxGeometry args={[0.3, 0.04, L * 0.9]} />
        <meshStandardMaterial color="#5d6470" roughness={1} />
      </mesh>
      {(front || back) && (
        <mesh position={[0, 0.24, (front ? 1 : -1) * (L / 2 + 0.01)]}>
          <boxGeometry args={[0.26, 0.12, 0.02]} />
          <meshBasicMaterial color={front ? '#ffe7a3' : '#e05a5a'} toneMapped={false} />
        </mesh>
      )}
    </group>
  );
}
