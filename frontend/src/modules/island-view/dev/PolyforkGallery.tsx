/**
 * Asset gallery, Polyfork side (M23): every Polyfork model on its own grass plates beside the
 * box-model diorama, so the two styles can be judged under the same sun, shadows and weather.
 *   Compare houses — per house type: our box house, then every Polyfork model of that type
 *   Houses / Towers / Nature & street / People / Lots A–B — every catalogue model and design
 * Labels show only for the section being viewed, so they do not pile up.
 */
import { Html } from '@react-three/drei';
import { useMemo, useRef } from 'react';
import { translate, type BoxPart } from '../assets/boxes';
import { withLights, withSnow } from '../assets/environmentParts';
import { buildingPieces, featurePieces, placePieces } from '../assets/lowpoly/buildingModels';
import { LP_MODELS, type LpCategory, type LpName } from '../assets/lowpoly/catalogue';
import { HOUSE_MODELS } from '../assets/lowpoly/islandModels';
import { LowpolyMeshes } from '../assets/lowpoly/LowpolyMeshes';
import type { LpPlacement } from '../assets/lowpoly/placement';
import { RIGGED, VILLAGER_MODELS } from '../assets/lowpoly/rigged';
import { Animal, Person } from '../assets/lowpoly/RiggedFigures';
import type { AnimalMotion } from '../assets/VoxelAnimal';
import type { PersonMotion } from '../assets/VoxelPerson';
import { buildingSurroundings, featureSurroundings } from '../assets/models';
import { HOUSE_TYPES, houseParts } from '../assets/voxel/houses';
import { ART } from '../assets/voxel/samples';
import { rnd, shade } from '../assets/voxel/voxel';
import type { BuildingObject, ObjectOf } from '../layout';
import { MOOD_PALETTES } from '../mood';
import { BoxBatch } from '../scene/BoxBatch';
import { useHtmlPortal } from '../scene/htmlPortal';
import { PF_SECTIONS, type PfSection } from './polyforkSections';

interface Label {
  section: PfSection;
  text: string;
  at: [number, number, number];
  strong?: boolean;
}

const CTX = { palette: MOOD_PALETTES.lively, snow: false };
const STEP = 1.5;

/** A grass plate with a dirt rim, like the box diorama's ground. */
function plate(x0: number, z0: number, w: number, d: number): BoxPart[] {
  const parts: BoxPart[] = [];
  for (let x = 0; x < w; x++)
    for (let z = 0; z < d; z++) {
      const c = shade(ART.grass[(x + z) & 1], (rnd(x0 + x, z0 + z, 1) - 0.5) * 0.08);
      parts.push({ layer: 'solid', p: [x0 + x + 0.5, -0.25, z0 + z + 0.5], s: [1, 0.5, 1], c });
    }
  for (let x = 0; x < w; x++) parts.push({ layer: 'solid', p: [x0 + x + 0.5, -1.0, z0 + d - 0.5], s: [1, 1, 1], c: x % 2 ? '#9b7653' : '#8d6b4b' });
  for (let z = 0; z < d; z++) parts.push({ layer: 'solid', p: [x0 + w - 0.5, -1.0, z0 + z + 0.5], s: [1, 1, 1], c: z % 2 ? '#8d6b4b' : '#9b7653' });
  return parts;
}

const named = (cat: LpCategory) => (Object.keys(LP_MODELS) as LpName[]).filter((n) => LP_MODELS[n].cat === cat);
const colours = (i: number) => ({ roof: ART.roofs[(i * 3) % ART.roofs.length], wall: ART.walls[(i * 5) % ART.walls.length] });

function buildScene() {
  const placements: LpPlacement[] = [];
  const parts: BoxPart[] = [];
  const labels: Label[] = [];
  for (const s of Object.values(PF_SECTIONS)) parts.push(...plate(s.x0, s.z0, s.w, s.d));

  // Compare houses: our box house (first), then each Polyfork model of that type, same colours
  {
    const s = PF_SECTIONS['Compare houses'];
    HOUSE_TYPES.forEach((type, r) => {
      const z = s.z0 + 1 + r * 1.6;
      const x = s.x0 + 1;
      parts.push(...translate(houseParts(type, 11 + r, 0, false), x, z));
      labels.push({ section: 'Compare houses', text: `${type} · now`, at: [x, 1.35, z], strong: true });
      [...new Set(HOUSE_MODELS[type])].forEach((model, i) => {
        const px = x + 1.8 + i * STEP;
        placements.push({ model, x: px, z, turn: 0, lit: 1, ...colours(r + i) });
        labels.push({ section: 'Compare houses', text: model, at: [px, 1.35, z] });
      });
    });
  }
  // Houses and towers: every model with a pastel roof and wall, and its own colours behind it
  const row = (section: PfSection, cat: LpCategory, perRow: number) => {
    const s = PF_SECTIONS[section];
    named(cat).forEach((model, i) => {
      const x = s.x0 + 1 + (i % perRow) * STEP + (Math.floor(i / perRow) % 2) * 0.75;
      const z = s.z0 + 1.2 + Math.floor(i / perRow) * 2;
      placements.push({ model, x, z, turn: 0, lit: 1, ...colours(i) });
      labels.push({ section, text: model, at: [x, (cat === 'tower' ? 3.4 : 1.4), z] });
    });
  };
  row('Polyfork houses', 'house', 8);
  row('Polyfork towers', 'tower', 9);
  // Nature & street: trees, cars, props, one row each
  {
    const s = PF_SECTIONS['Polyfork nature & street'];
    (['tree', 'car', 'prop'] as const).forEach((cat, r) => {
      const list = named(cat);
      list.forEach((model, i) => {
        const x = s.x0 + 0.8 + i * (cat === 'prop' ? 0.9 : STEP);
        const z = s.z0 + 1.2 + r * 2.4 + (cat === 'prop' ? (i % 2) * 0.9 : 0);
        placements.push({ model, x, z, turn: cat === 'car' ? -Math.PI / 4 : 0, lit: 1 });
        labels.push({ section: 'Polyfork nature & street', text: model, at: [x, cat === 'tree' ? 1.6 : 0.9, z] });
      });
    });
  }
  // Lots: every design of each building and feature
  const lot = (section: PfSection, key: string, w: number, d: number, z: number, feature: boolean) => {
    const s = PF_SECTIONS[section];
    for (let v = 0; v < 4; v++) {
      const x = s.x0 + 2 + v * 4;
      const item = feature
        ? ({ assetKey: 'feature', id: key, featureKey: key, x, z, stage: 0, w, d, facing: 0, variant: v, name: null } as unknown as ObjectOf<'feature'>)
        : ({ assetKey: `building.${key}`, id: key, buildingKey: key, x, z, stage: 0, w, d, facing: 0, variant: v, level: 1, title: key, next: null } as unknown as BuildingObject);
      const pieces = feature ? featurePieces(key as ObjectOf<'feature'>['featureKey'], v) : buildingPieces(key, v);
      placements.push(...(placePieces(pieces, item) ?? []));
      parts.push(...translate(feature ? featureSurroundings(item as ObjectOf<'feature'>, CTX) : buildingSurroundings(item as BuildingObject, CTX), x, z));
      labels.push({ section, text: `${key} ${v + 1}`, at: [x, 2.2, z] });
    }
  };
  let z = PF_SECTIONS['Polyfork lots A'].z0 + 2;
  for (const [key, w, d] of [['gateway-arch', 1, 1], ['fire-pit', 3, 3], ['warming-hut', 3, 3], ['community-hall', 3, 3]] as const) {
    lot('Polyfork lots A', key, w, d, z, false);
    z += d + 0.6;
  }
  z = PF_SECTIONS['Polyfork lots B'].z0 + 2;
  for (const [key, w, d, f] of [['playground', 2, 2, false], ['community-garden', 2, 2, false], ['neighbourhood-park', 3, 3, false], ['school', 2, 2, true], ['big-park', 2, 2, true]] as const) {
    lot('Polyfork lots B', key, w, d, z, f);
    z += d + 1.2;
  }
  return { placements, parts, labels };
}

/** People (standing and walking) and animals (resting and trotting). */
function Figures({ showLabels }: { showLabels: boolean }) {
  const portal = useHtmlPortal();
  const still = useRef<PersonMotion>({ speed: 0 });
  const walk = useRef<PersonMotion>({ speed: 0.6 });
  const rest = useRef<AnimalMotion>({ speed: 0, running: false });
  const trot = useRef<AnimalMotion>({ speed: 0.5, running: false });
  const s = PF_SECTIONS['Polyfork people'];
  return (
    <>
      {VILLAGER_MODELS.map((m, i) => {
        const x = s.x0 + 1 + i * 1.2;
        return (
          <group key={m}>
            <group position={[x - 0.25, 0, s.z0 + 1.2]}>
              <Person model={m} seed={i} shirt="#e3a1a6" motion={still} />
            </group>
            <group position={[x + 0.25, 0, s.z0 + 1.2]}>
              <Person model={m} seed={i} shirt="#93b8db" motion={walk} />
            </group>
            {showLabels && (
              <Html portal={portal} position={[x, 0.9, s.z0 + 1.2]} center style={{ pointerEvents: 'none' }}>
                <Tag text={RIGGED[m].file.replace(/-[0-9a-f]{6}$/, '')} />
              </Html>
            )}
          </group>
        );
      })}
      {(['deer', 'buck', 'jackrabbit'] as const).flatMap((kind, i) =>
        [0, 1].map((seed) => (
          <group key={`${kind}${seed}`} position={[s.x0 + 1.5 + i * 3 + seed * 1.3, 0, s.z0 + 2.9]}>
            <Animal kind={kind} motion={seed ? trot : rest} seed={seed} />
          </group>
        )),
      )}
    </>
  );
}

function Tag({ text, strong }: { text: string; strong?: boolean }) {
  return <span className={`whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-semibold shadow-sm ${strong ? 'bg-indigo-500 text-white' : 'bg-white/90 text-slate-700'}`}>{text}</span>;
}

export function PolyforkGallery({ snow, lightsOn, section }: { snow: boolean; lightsOn: boolean; section: PfSection | null }) {
  const portal = useHtmlPortal();
  const scene = useMemo(() => buildScene(), []);
  const parts = useMemo(() => withLights(withSnow(scene.parts, snow), lightsOn), [scene, snow, lightsOn]);
  return (
    <>
      <BoxBatch parts={parts} />
      <LowpolyMeshes placements={scene.placements} snow={snow} lightsOn={lightsOn} />
      <Figures showLabels={section === 'Polyfork people'} />
      {scene.labels
        .filter((l) => l.section === section)
        .map((l) => (
          <Html key={`${l.text}@${l.at.join(',')}`} portal={portal} position={l.at} center style={{ pointerEvents: 'none' }}>
            <Tag text={l.text} strong={l.strong} />
          </Html>
        ))}
    </>
  );
}
