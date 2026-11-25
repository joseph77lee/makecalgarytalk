/**
 * Asset gallery: every Polyfork model in the catalogue (M23), one row per kind. The first copy
 * keeps the model's own (pastelised) colours; the second wears a pastel roof and wall, mirrored,
 * so the repaint and the mirroring can be checked under every weather and time.
 */
import { Html } from '@react-three/drei';
import { useMemo, useRef } from 'react';
import { Animal, Person } from '../assets/lowpoly/RiggedFigures';
import { VILLAGER_MODELS } from '../assets/lowpoly/rigged';
import type { AnimalMotion } from '../assets/VoxelAnimal';
import type { PersonMotion } from '../assets/VoxelPerson';
import { LP_HEIGHTS, LP_MODELS, type LpCategory, type LpName } from '../assets/lowpoly/catalogue';
import { LowpolyMeshes } from '../assets/lowpoly/LowpolyMeshes';
import type { LpPlacement } from '../assets/lowpoly/placement';
import { ART } from '../assets/voxel/samples';
import { useHtmlPortal } from '../scene/htmlPortal';

const SHOWCASE_ORIGIN: [number, number] = [40, 0];
const ROWS: [LpCategory, number][] = [
  ['house', 0],
  ['tower', 3.5],
  ['tree', 7],
  ['car', 9],
  ['prop', 10.5],
];
const STEP = 2.4;

export function LowpolyShowcase({ snow, lightsOn }: { snow: boolean; lightsOn: boolean }) {
  const portal = useHtmlPortal();
  const { placements, labels } = useMemo(() => {
    const placements: LpPlacement[] = [];
    const labels: { text: string; at: [number, number, number] }[] = [];
    for (const [cat, z] of ROWS) {
      const names = (Object.keys(LP_MODELS) as LpName[]).filter((n) => LP_MODELS[n].cat === cat);
      names.forEach((model, i) => {
        const x = SHOWCASE_ORIGIN[0] + (i - (names.length - 1) / 2) * STEP;
        const zz = SHOWCASE_ORIGIN[1] + z;
        placements.push({ model, x: x - 0.55, z: zz, turn: 0, lit: 1 });
        placements.push({ model, x: x + 0.55, z: zz, turn: 0, mirror: true, lit: 2, roof: ART.roofs[i % ART.roofs.length], wall: ART.walls[i % ART.walls.length] });
        labels.push({ text: model, at: [x, (LP_HEIGHTS[model] ?? 1) + 0.25, zz] });
      });
    }
    return { placements, labels };
  }, []);
  return (
    <>
      <Figures />
      <LowpolyMeshes placements={placements} snow={snow} lightsOn={lightsOn} />
      {labels.map((l) => (
        <Html key={l.text} portal={portal} position={l.at} center style={{ pointerEvents: 'none' }}>
          <span className="whitespace-nowrap rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-semibold text-slate-700 shadow-sm">{l.text}</span>
        </Html>
      ))}
    </>
  );
}

/** Every Polyfork person (standing, then walking on the spot) and animal, in a row. */
function Figures() {
  const still = useRef<PersonMotion>({ speed: 0 });
  const walk = useRef<PersonMotion>({ speed: 0.6 });
  const rest = useRef<AnimalMotion>({ speed: 0, running: false });
  const trot = useRef<AnimalMotion>({ speed: 0.5, running: false });
  const z = SHOWCASE_ORIGIN[1] + 12.5;
  return (
    <>
      {VILLAGER_MODELS.map((m, i) => (
        <group key={m}>
          <group position={[SHOWCASE_ORIGIN[0] - 6 + i * 1.6, 0, z]}>
            <Person model={m} seed={i} shirt="#e3a1a6" motion={still} />
          </group>
          <group position={[SHOWCASE_ORIGIN[0] - 5.4 + i * 1.6, 0, z]}>
            <Person model={m} seed={i} shirt="#93b8db" motion={walk} />
          </group>
        </group>
      ))}
      {(['deer', 'buck', 'jackrabbit'] as const).flatMap((kind, i) =>
        [0, 1].map((seed) => (
          <group key={`${kind}${seed}`} position={[SHOWCASE_ORIGIN[0] - 6 + i * 2.4 + seed * 1.1, 0, z + 1.6]}>
            <Animal kind={kind} motion={seed ? trot : rest} seed={seed} />
          </group>
        )),
      )}
    </>
  );
}
