import { Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useRef, useState, type ReactNode } from 'react';
import type { PlacedObject } from '../layout';
import { featureLabel } from '../plan/features';
import { lineColour } from '../plan/ctrain';
import { useIslandUi } from '../uiStore';
import { useHtmlPortal } from './htmlPortal';
import { BUBBLE_Z, LABEL_Z, remainingText } from './labelText';

/** HTML overlays (crisp text, any language) positioned over 3D objects (requirement.md §10.1). */

function Overlay({ x, y, z, children, front = false }: { x: number; y: number; z: number; children: ReactNode; front?: boolean }) {
  const portal = useHtmlPortal();
  return (
    <Html portal={portal} position={[x, y, z]} center zIndexRange={front ? BUBBLE_Z : LABEL_Z} style={{ pointerEvents: 'none' }}>
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
  /** Tapped house: show whose it is (requirement.md v1.26 §7.2). */
  selectedHouseId?: string | null;
  /** Buildings holding the newspaper: the first one shown gets a tappable "📰 News" chip (§11). */
  newsBuildingKeys?: string[];
  onNewsTap?: () => void;
}

/** Camera zoom (screen px per world unit) above which labels show full text. */
const DETAIL_ZOOM = 40;

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

/** My house's marker, a tapped house's info and the news chip show even with labels off. */
function HouseMarks({
  objects,
  selectedHouseId,
  newsBuildingKeys = [],
  onNewsTap,
}: {
  objects: PlacedObject[];
  selectedHouseId?: string | null;
  newsBuildingKeys?: string[];
  onNewsTap?: () => void;
}) {
  const newsHost = onNewsTap
    ? objects.find((o) => (o.assetKey.startsWith('building.') || o.assetKey === 'construction-site') && 'buildingKey' in o && newsBuildingKeys.includes(o.buildingKey))
    : undefined;
  return (
    <>
      {objects.map((o) => {
        if (o === newsHost) {
          return (
            <Overlay key={`${o.id}:news`} x={o.x} y={o.assetKey === 'building.welcome-sign' ? 2.05 : 2.4} z={o.z} front>
              <button
                type="button"
                onClick={onNewsTap}
                style={{ pointerEvents: 'auto' }}
                className="whitespace-nowrap rounded-full bg-sky-600 px-2 py-0.5 text-[11px] font-bold text-white shadow active:scale-95"
              >
                📰 News
              </button>
            </Overlay>
          );
        }
        if (o.assetKey !== 'house') return null;
        const selected = o.houseId === selectedHouseId && o.nickname;
        return [
          o.mine && !selected && (
            <Overlay key={`${o.id}:mine`} x={o.x} y={o.height + 0.25} z={o.z}>
              <span className="whitespace-nowrap rounded-full bg-orange-500 px-1.5 py-px text-[10px] font-bold text-white shadow" title="My house">
                🏠 Me
              </span>
            </Overlay>
          ),
          selected && (
            <Overlay key={`${o.id}:info`} x={o.x} y={o.height + 0.35} z={o.z} front>
              <HouseInfo nickname={o.nickname} activeToday={o.activeToday} founding={o.founding} mine={o.mine} />
            </Overlay>
          ),
        ];
      })}
    </>
  );
}

function HouseInfo({ nickname, activeToday, founding, mine }: { nickname: string; activeToday: boolean; founding: boolean; mine: boolean }) {
  return (
    <div className="relative w-max max-w-48 rounded-2xl bg-white px-3 py-1.5 text-left shadow-lg">
      <div className="text-xs font-bold text-slate-800">{mine ? 'My house' : `${nickname}'s house`}</div>
      <div className="text-[10px] text-slate-500">{activeToday ? '✨ Active today' : 'Not active today'}</div>
      {founding && <div className="text-[10px] font-semibold text-amber-700">🏅 Founding Resident</div>}
      <span className="absolute -bottom-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 bg-white" />
    </div>
  );
}

export function IslandLabels({ objects, houseBubbles, communityName, selectedHouseId, newsBuildingKeys, onNewsTap }: Props) {
  const detailed = useDetailedLabels();
  const showLabels = useIslandUi((u) => u.showLabels);
  // House names float only when labels are on and the player zoomed in (no clutter, §7.2).
  const showNames = detailed;
  const marks = <HouseMarks objects={objects} selectedHouseId={selectedHouseId} newsBuildingKeys={newsBuildingKeys} onNewsTap={onNewsTap} />;
  if (!showLabels) return marks;
  return (
    <>
      {marks}
      {objects.map((o) => {
        switch (o.assetKey) {
          case 'house': {
            const bubble = houseBubbles.get(o.houseId);
            if (o.houseId === selectedHouseId) return null;
            return [
              bubble && (
                <Overlay key={`${o.id}:bubble`} x={o.x} y={o.height + 0.75} z={o.z} front>
                  <SpeechBubbleLabel text={bubble} />
                </Overlay>
              ),
              showNames && o.nickname && !o.mine && (
              <Overlay key={o.id} x={o.x} y={o.height + 0.2} z={o.z}>
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
          case 'feature':
            // Signature feature (§7.9): at most 3 per community, so its name always shows (phones
            // rarely reach the detailed zoom on big islands).
            return (
              <Overlay key={o.id} x={o.x} y={1.45} z={o.z}>
                <span className="block max-w-32 truncate whitespace-nowrap rounded-full bg-white/85 px-1.5 py-px text-[10px] font-semibold text-sky-900 shadow-sm">
                  {featureLabel({ key: o.featureKey, name: o.name })}
                </span>
              </Overlay>
            );
          case 'station':
            return (
              <Overlay key={o.id} x={o.x} y={1.35} z={o.z}>
                <span className="flex max-w-40 items-center gap-1 whitespace-nowrap rounded-full bg-white/90 px-1.5 py-px text-[10px] font-bold text-slate-800 shadow-sm">
                  {o.lines.map((l) => (
                    <span key={l} className="h-2 w-2 shrink-0 rounded-full" style={{ background: lineColour(l) }} />
                  ))}
                  <span className="truncate">🚉 {o.name}</span>
                </span>
              </Overlay>
            );
          case 'rail-end':
            // Where the track leaves the island: the next station along the line (§7.9).
            return (
              <Overlay key={o.id} x={o.x} y={0.95} z={o.z}>
                <span className="block max-w-36 truncate whitespace-nowrap rounded-md bg-slate-800/75 px-1.5 py-px text-[10px] font-semibold text-white shadow-sm">
                  Next: {o.next} ›
                </span>
              </Overlay>
            );
          case 'construction-site':
            return (
              <Overlay key={o.id} x={o.x} y={1.55} z={o.z}>
                <ProgressLabel detailed={detailed} title={o.title} level={o.level} progress={o.progress} />
              </Overlay>
            );
          default: {
            if (!o.assetKey.startsWith('building.') || !('next' in o)) return null;
            const isSign = o.assetKey === 'building.welcome-sign' || o.assetKey === 'building.gateway-arch';
            const signY = o.assetKey === 'building.gateway-arch' ? 1.95 : 1.4;
            const nameTag = (
              <span className="whitespace-nowrap rounded-md border border-amber-800/30 bg-amber-50 px-2 py-0.5 text-xs font-bold tracking-wide text-amber-900 shadow-sm">
                {communityName}
              </span>
            );
            if (o.upgrade) {
              // Upgrade in place (§7.6): the built building stays; the label shows the next level's progress.
              const progress = <ProgressLabel detailed={detailed} title={o.title} level={o.upgrade.level} progress={o.upgrade.progress} />;
              return isSign ? (
                <Overlay key={o.id} x={o.x} y={signY + 0.3} z={o.z + 0.3}>
                  <div className="flex flex-col items-center gap-1">
                    {progress}
                    {nameTag}
                  </div>
                </Overlay>
              ) : (
                <Overlay key={o.id} x={o.x} y={1.6} z={o.z}>
                  {progress}
                </Overlay>
              );
            }
            const sign = isSign && (
              <Overlay key={o.id} x={o.x} y={signY} z={o.z + 0.3}>
                {nameTag}
              </Overlay>
            );
            if (isSign) return sign;
            if (detailed && o.next && o.next.status !== 'built') {
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
        }
      })}
    </>
  );
}

/** Name, level and a progress bar for a construction or an upgrade (compact when zoomed out). */
function ProgressLabel({ detailed, title, level, progress }: { detailed: boolean; title: string; level: number; progress: number }) {
  return (
    <div className={`${detailed ? 'w-28 px-2 py-1' : 'w-10 p-0.5'} rounded-lg bg-white/90 text-center text-[10px] font-semibold leading-tight text-slate-700 shadow-sm`}>
      {detailed && (
        <div className="mb-1 truncate">
          {title}
          {level > 1 && <span className="ml-1 text-amber-600">Lv {level}</span>}
        </div>
      )}
      <div className="h-1.5 overflow-hidden rounded-full bg-slate-200">
        <div className="h-full rounded-full bg-emerald-400 transition-[width] duration-700" style={{ width: `${Math.round(progress * 100)}%` }} />
      </div>
    </div>
  );
}
