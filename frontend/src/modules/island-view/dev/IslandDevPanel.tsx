import { useState } from 'react';
import { houseCapacity } from '../layout';
import { useMockCommunityStore } from '../mockStore';
import { vitalityMood } from '../mood';
import { BUILDING_KINDS, ISLAND_SIZES, MAX_MINI_VILLAGERS, PROJECT_STAGES, type CommunityViewState } from '../types';

const NAMES = ['Ava', 'Noah', 'Jisoo', 'Liam', 'Mei', 'Omar', 'Chloe', 'Arjun', 'Emma', 'Lucas', 'Sofia', 'Ethan'];

/**
 * Dev-only panel to edit the mock community state and watch the island react
 * (M1 Definition of Done: changing size, buildings, Vitality, silhouettes updates the island).
 */
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

  return (
    <div className="absolute inset-x-2 bottom-2 z-30 max-h-[55dvh] overflow-y-auto rounded-2xl bg-white/95 p-3 text-xs text-slate-700 shadow-lg sm:inset-x-auto sm:left-4 sm:bottom-4 sm:w-80">
      <div className="mb-2 flex items-center justify-between">
        <span className="font-bold">Mock community state</span>
        <div className="flex gap-1">
          <button type="button" className="rounded bg-slate-100 px-2 py-0.5" onClick={reset}>
            Reset
          </button>
          <button type="button" className="rounded bg-slate-100 px-2 py-0.5" onClick={() => setOpen(false)}>
            Close
          </button>
        </div>
      </div>

      <Row label="Island size">
        <div className="flex flex-wrap gap-1">
          {ISLAND_SIZES.map((size) => (
            <button
              key={size}
              type="button"
              onClick={() => set({ islandSize: size })}
              className={`rounded px-1.5 py-0.5 ${state.islandSize === size ? 'bg-sky-500 text-white' : 'bg-slate-100'}`}
            >
              {size}
            </button>
          ))}
        </div>
      </Row>

      <Row label={`Vitality ${state.vitality} (${vitalityMood(state.vitality)})`}>
        <input
          type="range"
          min={0}
          max={100}
          value={state.vitality}
          onChange={(e) => set({ vitality: Number(e.target.value) })}
          className="w-full"
        />
      </Row>

      <Row label={`Houses ${state.houses.length} / ${houseCapacity(state.islandSize)} lots`}>
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

      <Row label="Unlocked buildings">
        <div className="flex flex-wrap gap-2">
          {BUILDING_KINDS.map((kind) => (
            <label key={kind} className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={state.buildings[kind].unlocked}
                onChange={(e) =>
                  set({
                    buildings: {
                      ...state.buildings,
                      [kind]: e.target.checked ? { unlocked: true } : { unlocked: false, remaining: { streakDays: 2, residents: 1 } },
                    },
                  })
                }
              />
              {kind}
            </label>
          ))}
        </div>
      </Row>

      {state.projects.map((p, i) => (
        <Row key={p.id} label={`${p.title} — ${Math.round(p.progress * 100)}%`}>
          <div className="flex items-center gap-1">
            <select
              value={p.stage}
              className="rounded bg-slate-100 px-1"
              onChange={(e) => {
                const stage = e.target.value as (typeof PROJECT_STAGES)[number];
                set({ projects: state.projects.map((q, j) => (j === i ? { ...q, stage } : q)) });
              }}
            >
              {PROJECT_STAGES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round(p.progress * 100)}
              onChange={(e) =>
                set({ projects: state.projects.map((q, j) => (j === i ? { ...q, progress: Number(e.target.value) / 100 } : q)) })
              }
              className="w-full"
            />
          </div>
        </Row>
      ))}
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
