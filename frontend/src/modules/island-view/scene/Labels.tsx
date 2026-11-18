import { Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useRef, useState, type ReactNode } from 'react';
import type { PlacedObject } from '../layout';
import type { BuildingKind } from '../types';
import { useIslandUi } from '../uiStore';
import { BUBBLE_Z, LABEL_Z, remainingText } from './labelText';

/** HTML overlays (crisp text, any language) positioned over 3D objects (requirement.md §10.1). */

const BUILDING_NAMES: Record<BuildingKind, string> = {
  playground: 'Playground',
  'community-centre': 'Community Centre',
  park: 'Park',
};


function Overlay({ x, y, z, children, front = false }: { x: number; y: number; z: number; children: ReactNode; front?: boolean }) {
  return (
    <Html position={[x, y, z]} center zIndexRange={front ? BUBBLE_Z : LABEL_Z} style={{ pointerEvents: 'none' }}>
      {children}
    </Html>
  );
}

export function SpeechBubbleLabel({ text }: { text: string }) {
  return (
    <div className="relative w-max max-w-36 rounded-2xl border-2 border-slate-800 bg-white px-2 py-0.5 text-center text-[11px] font-semibold leading-tight text-slate-800 shadow-sm">
      {text}
      <span className="absolute -bottom-[7px] left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 border-b-2 border-r-2 border-slate-800 bg-white" />
    </div>
  );
}

interface Props {
  objects: PlacedObject[];
  houseBubbles: Map<string, string>;
}

/** Camera zoom (screen px per world unit) above which labels show full text. */
const DETAIL_ZOOM = 40;
/** Above this many houses, name tags show only when zoomed in. */
const MAX_NAMES_ZOOMED_OUT = 12;

/**
 * True when zoomed in enough for detailed labels. Re-renders only when the
 * threshold is crossed, not every frame. Phones start compact; pinch to see more.
 */
function useDetailedLabels(): boolean {
  const [detailed, setDetailed] = useState(false);
  const current = useRef(detailed);
  useFrame(({ camera }) => {
    const next = camera.zoom >= DETAIL_ZOOM;
    if (next !== current.current) {
      current.current = next;
      setDetailed(next);
    }
  });
  return detailed;
}

export function IslandLabels({ objects, houseBubbles }: Props) {
  const detailed = useDetailedLabels();
  const showLabels = useIslandUi((u) => u.showLabels);
  // Busy villages: names appear when zoomed in, so tags never cover the whole island.
  const houseCount = objects.filter((o) => o.assetKey === 'house').length;
  const showNames = detailed || houseCount <= MAX_NAMES_ZOOMED_OUT;
  if (!showLabels) return null;
  return (
    <>
      {objects.map((o) => {
        switch (o.assetKey) {
          case 'house': {
            const bubble = houseBubbles.get(o.houseId);
            return [
              bubble && (
                <Overlay key={`${o.id}:bubble`} x={o.x} y={1.75} z={o.z} front>
                  <SpeechBubbleLabel text={bubble} />
                </Overlay>
              ),
              showNames && (
              <Overlay key={o.id} x={o.x} y={1.15} z={o.z}>
                <span className="flex items-center gap-1 whitespace-nowrap rounded-full bg-white/85 px-1.5 py-px text-[10px] font-semibold text-slate-700 shadow-sm">
                    <span className={`h-1.5 w-1.5 rounded-full ${o.activeToday ? 'bg-amber-400' : 'bg-slate-300'}`} />
                  {o.nickname}
                </span>
              </Overlay>
              ),
            ];
          }
          case 'silhouette':
            return (
              <Overlay key={o.id} x={o.x} y={1.35} z={o.z}>
                {detailed ? (
                  <div className="whitespace-nowrap rounded-lg bg-slate-800/75 px-2 py-0.5 text-center text-[10px] leading-tight text-white">
                    <div className="font-semibold">🔒 {BUILDING_NAMES[o.target]}</div>
                    <div className="opacity-85">{remainingText(o.remaining)}</div>
                  </div>
                ) : (
                  <span className="rounded-full bg-slate-800/70 px-1.5 py-px text-[10px] text-white">🔒</span>
                )}
              </Overlay>
            );
          case 'construction-site':
            return (
              <Overlay key={o.id} x={o.x} y={1.55} z={o.z}>
                <div
                  className={`${detailed ? 'w-28 px-2 py-1' : 'w-10 p-0.5'} rounded-lg bg-white/90 text-center text-[10px] font-semibold leading-tight text-slate-700 shadow-sm`}
                >
                  {detailed && <div className="mb-1 truncate">{o.title}</div>}
                  <div className="h-1.5 overflow-hidden rounded-full bg-slate-200">
                    <div className="h-full rounded-full bg-emerald-400" style={{ width: `${Math.round(o.progress * 100)}%` }} />
                  </div>
                </div>
              </Overlay>
            );
          case 'sign':
            return (
              <Overlay key={o.id} x={o.x} y={1.75} z={o.z + 0.32}>
                <span className="whitespace-nowrap rounded-md border border-amber-800/30 bg-amber-50 px-2 py-0.5 text-xs font-bold tracking-wide text-amber-900 shadow-sm">
                  {o.name}
                </span>
              </Overlay>
            );
          default:
            return null;
        }
      })}
    </>
  );
}
