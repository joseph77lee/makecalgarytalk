import { Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useRef, useState, type ReactNode } from 'react';
import type { PlacedObject } from '../layout';
import { useIslandUi } from '../uiStore';
import { BUBBLE_Z, LABEL_Z, remainingText } from './labelText';

/** HTML overlays (crisp text, any language) positioned over 3D objects (requirement.md §10.1). */

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
  communityName: string;
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

export function IslandLabels({ objects, houseBubbles, communityName }: Props) {
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
                  <div className={`whitespace-nowrap rounded-lg px-2 py-0.5 text-center text-[10px] leading-tight text-white ${o.ready ? 'bg-emerald-600/85' : 'bg-slate-800/75'}`}>
                    <div className="font-semibold">
                      {o.ready ? '✨' : '🔒'} {o.title}
                    </div>
                    {o.ready ? <div className="opacity-90">Ready to build</div> : o.remaining && <div className="opacity-85">{remainingText(o.remaining)}</div>}
                  </div>
                ) : (
                  <span className={`rounded-full px-1.5 py-px text-[10px] text-white ${o.ready ? 'bg-emerald-600/80' : 'bg-slate-800/70'}`}>{o.ready ? '✨' : '🔒'}</span>
                )}
              </Overlay>
            );
          case 'construction-site':
            return (
              <Overlay key={o.id} x={o.x} y={1.55} z={o.z}>
                <div
                  className={`${detailed ? 'w-28 px-2 py-1' : 'w-10 p-0.5'} rounded-lg bg-white/90 text-center text-[10px] font-semibold leading-tight text-slate-700 shadow-sm`}
                >
                  {detailed && (
                    <div className="mb-1 truncate">
                      {o.title}
                      {o.level > 1 && <span className="ml-1 text-amber-600">Lv {o.level}</span>}
                    </div>
                  )}
                  <div className="h-1.5 overflow-hidden rounded-full bg-slate-200">
                    <div className="h-full rounded-full bg-emerald-400 transition-[width] duration-700" style={{ width: `${Math.round(o.progress * 100)}%` }} />
                  </div>
                </div>
              </Overlay>
            );
          default:
            if (o.assetKey === 'building.welcome-sign' || o.assetKey === 'building.gateway-arch') {
              return (
                <Overlay key={o.id} x={o.x} y={o.assetKey === 'building.gateway-arch' ? 1.95 : 1.4} z={o.z + 0.3}>
                  <span className="whitespace-nowrap rounded-md border border-amber-800/30 bg-amber-50 px-2 py-0.5 text-xs font-bold tracking-wide text-amber-900 shadow-sm">
                    {communityName}
                  </span>
                </Overlay>
              );
            }
            if (o.assetKey.startsWith('building.') && 'next' in o && detailed && o.next && o.next.status !== 'built') {
              // Built building: what it grows into next (growth chain, §7.6).
              return (
                <Overlay key={o.id} x={o.x} y={1.6} z={o.z}>
                  <div className="whitespace-nowrap rounded-lg bg-white/85 px-2 py-0.5 text-center text-[10px] leading-tight text-slate-600 shadow-sm">
                    <div className="font-semibold">
                      {o.level > 1 ? `${o.title} Lv ${o.level}` : o.title} → {o.next.title}
                    </div>
                    {o.next.status === 'opened' ? <div>Ready to build</div> : o.next.remaining && <div>{remainingText(o.next.remaining)}</div>}
                  </div>
                </Overlay>
              );
            }
            return null;
        }
      })}
    </>
  );
}
