import { useMemo, useState } from 'react';
import { filterCommunities } from './filterCommunities';
import { useDailyActions } from './liveStore';

/** TEMPORARY until Residency (M7): choose a community from the list. */
export function CommunityPicker() {
  const communities = useDailyActions((s) => s.communities);
  const choose = useDailyActions((s) => s.chooseCommunity);
  const hasCommunity = useDailyActions((s) => s.server !== null);
  const refresh = useDailyActions((s) => s.refresh);
  const [query, setQuery] = useState('');
  const shown = useMemo(() => filterCommunities(communities ?? [], query), [communities, query]);

  return (
    <div className="absolute inset-0 z-40 flex items-end justify-center bg-slate-900/30 p-3 sm:items-center">
      <div className="flex max-h-[85dvh] w-full max-w-md flex-col rounded-3xl bg-white p-4 shadow-xl">
        <h2 className="text-lg font-bold text-slate-800">Choose your community</h2>
        <p className="mb-3 text-xs text-slate-500">For now you pick from the list. Later your community is confirmed by location.</p>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search, e.g. Mahogany"
          className="mb-2 rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400"
          autoFocus
        />
        <ul className="-mx-1 flex-1 overflow-y-auto">
          {shown.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => void choose(c.id)}
                className="flex w-full items-center justify-between rounded-xl px-2 py-2 text-left text-sm hover:bg-sky-50"
              >
                <span className="font-medium text-slate-700">{c.name}</span>
                <span className="text-[11px] text-slate-400">{c.sector}</span>
              </button>
            </li>
          ))}
          {shown.length === 0 && <li className="px-2 py-4 text-center text-sm text-slate-400">No community found</li>}
        </ul>
        {hasCommunity && (
          <button type="button" onClick={() => void refresh()} className="mt-2 rounded-xl bg-slate-100 py-2 text-sm text-slate-600">
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}
