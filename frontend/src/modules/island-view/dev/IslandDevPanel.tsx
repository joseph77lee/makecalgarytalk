import { useState } from 'react';
import { useMockCommunityStore } from '../mockStore';
import { vitalityMood } from '../mood';
import { reviveIsland } from '../scene/islandContext';
import { BUILDING_TREE, LAND_STAGE_COUNT } from '../plan/buildingTree';
import { BUILDING_STATUSES, MAX_MINI_VILLAGERS, type BuildingStatus, type BuildingView, type CommunityViewState } from '../types';

const NAMES = ['Ava', 'Noah', 'Jisoo', 'Liam', 'Mei', 'Omar', 'Chloe', 'Arjun', 'Emma', 'Lucas', 'Sofia', 'Ethan'];
const STAGE_RESIDENTS = ['1–2', '3–5', '6–10', '11–25', '26–50', '51+'];

/** Dev-only panel to edit the mock community state and watch the island react. */
export function IslandDevPanel() {
  const [open, setOpen] = useState(false);
  const state = useMockCommunityStore((s) => s.state);
  const update = useMockCommunityStore((s) => s.update);
  const reset = useMockCommunityStore((s) => s.reset);
  const set = (patch: Partial<CommunityViewState>) => update((s) => ({ ...s, ...patch }));

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="absolute bottom-4 left-4 z-30 rounded-full bg-slate-900/80 px-3 py-1.5 text-xs font-semibold text-white shadow"
      >
        Dev tools
      </button>
    );
  }

  const addHouses = (count: number) =>
    update((s) => {
      const added = Array.from({ length: count }, (_, i) => {
        const n = s.houses.length + i;
        return { id: `dev${Date.now()}-${n}`, nickname: NAMES[n % NAMES.length], activeToday: n % 3 !== 2 };
      });
      return { ...s, houses: [...s.houses, ...added] };
    });

  const viewOf = (key: string): BuildingView => {
    const spec = BUILDING_TREE.buildings.find((b) => b.key === key);
    return (
      state.buildings.find((b) => b.key === key) ?? {
        key,
        status: 'locked',
        level: 1,
        progress: 0,
        title: spec?.name ?? key,
        remaining: spec ? { residents: spec.residents, streakDays: spec.streakDays, requires: spec.requires } : null,
      }
    );
  };
  const setBuilding = (key: string, patch: Partial<BuildingView>) =>
    update((s) => ({ ...s, buildings: [...s.buildings.filter((b) => b.key !== key), { ...viewOf(key), ...patch }] }));

  return (
    <div className="absolute inset-x-2 bottom-2 z-30 max-h-[60dvh] overflow-y-auto rounded-2xl bg-white/95 p-3 text-xs text-slate-700 shadow-lg sm:inset-x-auto sm:bottom-4 sm:left-4 sm:w-96">
      <div className="mb-2 flex items-center justify-between">
        <span className="font-bold">Mock community state</span>
        <div className="flex gap-1">
          <button type="button" className="rounded bg-slate-100 px-2 py-0.5" onClick={() => reviveIsland()}>
            Revive fx
          </button>
          <button type="button" className="rounded bg-slate-100 px-2 py-0.5" onClick={reset}>
            Reset
          </button>
          <button type="button" className="rounded bg-slate-100 px-2 py-0.5" onClick={() => setOpen(false)}>
            Close
          </button>
        </div>
      </div>

      <Row label="Land stage (cumulative residents)">
        <div className="flex flex-wrap gap-1">
          {Array.from({ length: LAND_STAGE_COUNT }, (_, stage) => (
            <button
              key={stage}
              type="button"
              onClick={() => set({ landStage: stage })}
              className={`rounded px-1.5 py-0.5 ${state.landStage === stage ? 'bg-sky-500 text-white' : 'bg-slate-100'}`}
            >
              {STAGE_RESIDENTS[stage]}
            </button>
          ))}
        </div>
      </Row>

      <Row label={state.vitality === null ? 'Vitality (not set)' : `Vitality ${state.vitality} (${vitalityMood(state.vitality)})`}>
        <input type="range" min={0} max={100} value={state.vitality ?? 50} onChange={(e) => set({ vitality: Number(e.target.value) })} className="w-full" />
      </Row>

      <Row label={`Houses ${state.houses.length}`}>
        <div className="flex gap-1">
          <button type="button" className="rounded bg-slate-100 px-2" onClick={() => set({ houses: state.houses.slice(0, -1) })}>
            −
          </button>
          <button type="button" className="rounded bg-slate-100 px-2" onClick={() => addHouses(1)}>
            +
          </button>
          <button type="button" className="rounded bg-slate-100 px-2" onClick={() => addHouses(10)}>
            +10
          </button>
          <button
            type="button"
            className="rounded bg-slate-100 px-2"
            onClick={() => set({ houses: state.houses.map((h) => ({ ...h, activeToday: !h.activeToday })) })}
          >
            Toggle lights
          </button>
        </div>
      </Row>

      <Row label={`Mini villagers ${state.miniVillagerCount}`}>
        <input
          type="range"
          min={0}
          max={MAX_MINI_VILLAGERS}
          value={state.miniVillagerCount}
          onChange={(e) => set({ miniVillagerCount: Number(e.target.value) })}
          className="w-full"
        />
      </Row>

      <Row label="Buildings (tree)">
        <div className="flex flex-col gap-1">
          {BUILDING_TREE.buildings.map((spec) => {
            const v = viewOf(spec.key);
            return (
              <div key={spec.key} className="flex items-center gap-1">
                <span className="w-28 truncate">{spec.name}</span>
                <select value={v.status} className="rounded bg-slate-100 px-1" onChange={(e) => setBuilding(spec.key, { status: e.target.value as BuildingStatus })}>
                  {BUILDING_STATUSES.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
                <button type="button" className="rounded bg-slate-100 px-1" onClick={() => setBuilding(spec.key, { level: v.level + 1 })} title="Upgrade level">
                  Lv {v.level}+
                </button>
                {v.status === 'building' && (
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={Math.round(v.progress * 100)}
                    onChange={(e) => setBuilding(spec.key, { progress: Number(e.target.value) / 100 })}
                    className="w-16"
                  />
                )}
              </div>
            );
          })}
        </div>
      </Row>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-slate-100 py-1.5">
      <div className="mb-1 font-semibold">{label}</div>
      {children}
    </div>
  );
}
