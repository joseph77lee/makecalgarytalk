import { decodePlan, type IslandPlan } from './islandPlan';

const cache = new Map<string, Promise<IslandPlan>>();

/** Loads a community's stored island plan (static file, cacheable by the CDN). */
export function loadIslandPlan(code: string): Promise<IslandPlan> {
  let p = cache.get(code);
  if (!p) {
    p = fetch(`${import.meta.env.BASE_URL}islands/${encodeURIComponent(code)}.json`)
      .then((r) => {
        if (!r.ok) throw new Error(`No island plan for community ${code} (${r.status})`);
        return r.json();
      })
      .then(decodePlan);
    p.catch(() => cache.delete(code));
    cache.set(code, p);
  }
  return p;
}
