import { useEffect, useMemo, useRef, useState } from 'react';
import { MOOD_PALETTES, vitalityMood } from '../island-view';
import { getSupabaseClient, readSupabaseConfig } from '../common';
import { fetchStatuses, loadShapes, type CommunityStatus } from './api';
import { drawIcon, type MoodColours } from './draw';
import { bbox, codeSeed, communityAt, fitView, frameBox, iconPlan, iconSpots, type MapCommunity, type MapShapes, type View } from './geometry';
import { levelText, searchCommunities } from './mapText';

interface Props {
  /** The community I play in (highlighted), if any. */
  myCommunityId: string | null;
  onEnter: (communityId: string) => void;
  onInvite: (communityName: string) => void;
  onClose: () => void;
}

interface Prepared {
  c: MapCommunity;
  box: ReturnType<typeof bbox>;
  path: Path2D;
  spots: [number, number][];
  seed: number;
}

const TAP_PX = 8;
const ICON_ROOM_PX = 15;
const MAX_SCALE = 0.3;
/** A community's name shows once it covers this many screen px² (and does not overlap a bigger one). */
const NAME_MIN_PX2 = 1200;

function moodColours(vitality: number | null): { fill: string; edge: string; c: MoodColours } {
  const mood = vitality === null ? 'normal' : vitalityMood(vitality);
  const p = MOOD_PALETTES[mood];
  return { fill: p.grass[0], edge: p.grass[1], c: { ground: p.grass[0], ground2: p.grass[1], roofSnow: mood === 'sleepy', lights: mood === 'lively' } };
}

/** Calgary World Map (requirement.md v1.29 §9): every residential community with its development. */
export function WorldMap({ myCommunityId, onEnter, onInvite, onClose }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [shapes, setShapes] = useState<MapShapes | null>(null);
  const [statuses, setStatuses] = useState<Map<string, CommunityStatus>>(new Map());
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const myCode = useMemo(() => [...statuses.values()].find((s) => s.id === myCommunityId)?.code ?? null, [statuses, myCommunityId]);
  const view = useRef<View>({ scale: 0.01, ox: 0, oy: 0 });
  const redraw = useRef<() => void>(() => {});
  const animTo = useRef<(v: View) => void>(() => {});

  useEffect(() => {
    let alive = true;
    void loadShapes().then((s) => alive && setShapes(s), (e: unknown) => alive && setError(String(e)));
    const cfg = readSupabaseConfig();
    if (cfg.ok)
      void fetchStatuses(getSupabaseClient(cfg.config)).then(
        (list) => alive && setStatuses(new Map(list.map((s) => [s.code, s]))),
        () => {}, // the map still works; every community looks unsettled
      );
    return () => {
      alive = false;
    };
  }, []);

  const prepared = useMemo<Prepared[]>(() => {
    if (!shapes) return [];
    return shapes.communities.map((c) => {
      const path = new Path2D();
      for (const r of c.rings) {
        path.moveTo(r[0]!, r[1]!);
        for (let i = 2; i < r.length; i += 2) path.lineTo(r[i]!, r[i + 1]!);
        path.closePath();
      }
      return { c, box: bbox(c), path, spots: iconSpots(c), seed: codeSeed(c.code) };
    });
  }, [shapes]);

  // Drawing + interaction (refs, no React state per frame).
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !shapes) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let frame = 0;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const size = () => {
      const r = canvas.getBoundingClientRect();
      canvas.width = Math.round(r.width * dpr);
      canvas.height = Math.round(r.height * dpr);
      return r;
    };
    let rect = size();
    view.current = fitView(shapes.width, shapes.height, rect.width, rect.height);
    const minScale = view.current.scale * 0.8;

    const draw = () => {
      frame = 0;
      const { scale, ox, oy } = view.current;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, rect.width, rect.height);
      // Community grounds
      for (const p of prepared) {
        const st = statuses.get(p.c.code);
        ctx.setTransform(dpr * scale, 0, 0, dpr * scale, dpr * ox, dpr * oy);
        if (!st || st.level === 0) {
          ctx.fillStyle = '#e6e9ef';
          ctx.fill(p.path);
          ctx.setLineDash([6 / scale, 5 / scale]);
          ctx.strokeStyle = '#a3acbb';
        } else {
          const m = moodColours(st.vitality);
          ctx.fillStyle = m.fill;
          ctx.fill(p.path);
          ctx.setLineDash([]);
          ctx.strokeStyle = m.edge;
        }
        ctx.lineWidth = 1.2 / scale;
        ctx.stroke(p.path);
        ctx.setLineDash([]);
      }
      // Highlights: my community, the selected one
      ctx.setTransform(dpr * scale, 0, 0, dpr * scale, dpr * ox, dpr * oy);
      for (const p of prepared) {
        if (p.c.code !== myCode && p.c.code !== selected) continue;
        ctx.strokeStyle = p.c.code === selected ? '#4f46e5' : '#f97316';
        ctx.lineWidth = 3 / scale;
        ctx.stroke(p.path);
      }
      // Icons (screen space; how many fit depends on the zoom)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const icon = Math.max(9, Math.min(24, scale * 220));
      for (const p of prepared) {
        const sx0 = p.box.minX * scale + ox, sx1 = p.box.maxX * scale + ox, sy0 = p.box.minY * scale + oy, sy1 = p.box.maxY * scale + oy;
        if (sx1 < 0 || sy1 < 0 || sx0 > rect.width || sy0 > rect.height) continue;
        const st = statuses.get(p.c.code);
        const level = st?.level ?? 0;
        const room = Math.floor((p.c.area * scale * scale) / (ICON_ROOM_PX * ICON_ROOM_PX));
        const plan = iconPlan(level, p.c.area, room, p.seed);
        const colours = moodColours(st?.vitality ?? null).c;
        // Unsettled: a small faint cloud, only where it has room (keeps the city view calm).
        if (plan[0] === 'cloud' && room < 3) continue;
        plan.forEach((kind, i) => {
          const spot = p.spots[i];
          if (!spot) return;
          if (kind === 'cloud') ctx.globalAlpha = 0.7;
          drawIcon(ctx, kind, spot[0] * scale + ox, spot[1] * scale + oy, icon, colours, p.seed + i);
          ctx.globalAlpha = 1;
        });
      }
      // Names: mine and the selected one first, then bigger communities first; a name that would
      // overlap one already drawn waits for more zoom.
      ctx.font = '600 11px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.lineJoin = 'round'; // no spikes on the white halo
      const placed: { x0: number; y0: number; x1: number; y1: number }[] = [];
      const order = [...prepared].sort(
        (a, b) =>
          Number(b.c.code === selected || b.c.code === myCode) - Number(a.c.code === selected || a.c.code === myCode) || b.c.area - a.c.area,
      );
      for (const p of order) {
        const forced = p.c.code === myCode || p.c.code === selected;
        if (!forced && p.c.area * scale * scale < NAME_MIN_PX2) continue;
        const x = p.c.label[0] * scale + ox, y = p.c.label[1] * scale + oy + icon * 1.1;
        if (x < -80 || y < -20 || x > rect.width + 80 || y > rect.height + 20) continue;
        const w = ctx.measureText(p.c.name).width;
        const r = { x0: x - w / 2 - 2, y0: y - 10, x1: x + w / 2 + 2, y1: y + 3 };
        if (!forced && placed.some((q) => r.x0 < q.x1 && r.x1 > q.x0 && r.y0 < q.y1 && r.y1 > q.y0)) continue;
        placed.push(r);
        ctx.lineWidth = 3;
        ctx.strokeStyle = 'rgba(255,255,255,0.9)';
        ctx.strokeText(p.c.name, x, y);
        ctx.fillStyle = '#1e293b';
        ctx.fillText(p.c.name, x, y);
      }
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(draw);
    };
    redraw.current = schedule;
    animTo.current = (target: View) => {
      const from = { ...view.current };
      const t0 = performance.now();
      const step = (t: number) => {
        const k = Math.min(1, (t - t0) / 400);
        const e = 1 - (1 - k) ** 3;
        view.current = { scale: from.scale + (target.scale - from.scale) * e, ox: from.ox + (target.ox - from.ox) * e, oy: from.oy + (target.oy - from.oy) * e };
        draw();
        if (k < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };
    schedule();

    // Pan / pinch / wheel / tap
    const pointers = new Map<number, { x: number; y: number }>();
    let moved = 0;
    let pinch: { d: number; scale: number; cx: number; cy: number } | null = null;
    const zoomAt = (sx: number, sy: number, next: number) => {
      const v = view.current;
      const s = Math.max(minScale, Math.min(MAX_SCALE, next));
      const wx = (sx - v.ox) / v.scale, wy = (sy - v.oy) / v.scale;
      view.current = { scale: s, ox: sx - wx * s, oy: sy - wy * s };
      schedule();
    };
    const local = (e: PointerEvent | WheelEvent) => ({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    const down = (e: PointerEvent) => {
      canvas.setPointerCapture(e.pointerId);
      pointers.set(e.pointerId, local(e));
      moved = 0;
      if (pointers.size === 2) {
        const [a, b] = [...pointers.values()];
        pinch = { d: Math.hypot(a!.x - b!.x, a!.y - b!.y), scale: view.current.scale, cx: (a!.x + b!.x) / 2, cy: (a!.y + b!.y) / 2 };
      }
    };
    const move = (e: PointerEvent) => {
      const prev = pointers.get(e.pointerId);
      if (!prev) return;
      const now = local(e);
      pointers.set(e.pointerId, now);
      if (pinch && pointers.size === 2) {
        const [a, b] = [...pointers.values()];
        moved += TAP_PX;
        zoomAt(pinch.cx, pinch.cy, (pinch.scale * Math.hypot(a!.x - b!.x, a!.y - b!.y)) / pinch.d);
        return;
      }
      moved += Math.abs(now.x - prev.x) + Math.abs(now.y - prev.y);
      view.current = { ...view.current, ox: view.current.ox + now.x - prev.x, oy: view.current.oy + now.y - prev.y };
      schedule();
    };
    const up = (e: PointerEvent) => {
      const at = pointers.get(e.pointerId);
      pointers.delete(e.pointerId);
      if (pointers.size < 2) pinch = null;
      if (at && moved < TAP_PX && pointers.size === 0) {
        const v = view.current;
        const hit = communityAt(prepared, (at.x - v.ox) / v.scale, (at.y - v.oy) / v.scale);
        setSelected(hit?.code ?? null);
        if (hit) animTo.current(frameBox(bbox(hit), rect.width, rect.height, MAX_SCALE * 0.5));
      }
    };
    const wheel = (e: WheelEvent) => {
      e.preventDefault();
      const p = local(e);
      zoomAt(p.x, p.y, view.current.scale * Math.exp(-e.deltaY * 0.0015));
    };
    const resize = () => {
      rect = size();
      schedule();
    };
    canvas.addEventListener('pointerdown', down);
    canvas.addEventListener('pointermove', move);
    canvas.addEventListener('pointerup', up);
    canvas.addEventListener('pointercancel', up);
    canvas.addEventListener('wheel', wheel, { passive: false });
    window.addEventListener('resize', resize);
    return () => {
      cancelAnimationFrame(frame);
      canvas.removeEventListener('pointerdown', down);
      canvas.removeEventListener('pointermove', move);
      canvas.removeEventListener('pointerup', up);
      canvas.removeEventListener('pointercancel', up);
      canvas.removeEventListener('wheel', wheel);
      window.removeEventListener('resize', resize);
    };
    // Statuses / selection changes only need a redraw (below), not new listeners.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shapes, prepared]);

  useEffect(() => {
    redraw.current();
  }, [statuses, selected, myCode]);

  const sel = selected ? prepared.find((p) => p.c.code === selected) : undefined;
  const selStatus = selected ? statuses.get(selected) : undefined;
  const results = useMemo(() => searchCommunities(shapes?.communities ?? [], query), [shapes, query]);
  const choose = (c: MapCommunity) => {
    setQuery('');
    setSelected(c.code);
    const r = canvasRef.current?.getBoundingClientRect();
    if (r) animTo.current(frameBox(bbox(c), r.width, r.height, MAX_SCALE * 0.5));
  };

  return (
    <div className="absolute inset-0 z-40 flex flex-col bg-gradient-to-b from-sky-100 to-indigo-50">
      <header className="flex items-center gap-2 p-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <div className="relative min-w-0 flex-1">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="🔎 Find a community"
            className="w-full rounded-full bg-white/95 px-4 py-2 text-sm shadow-sm outline-none focus:ring-2 focus:ring-indigo-300"
          />
          {results.length > 0 && (
            <ul className="absolute inset-x-0 top-11 z-10 overflow-hidden rounded-2xl bg-white shadow-lg">
              {results.map((c) => (
                <li key={c.code}>
                  <button type="button" onClick={() => choose(c)} className="block w-full px-4 py-2 text-left text-sm hover:bg-indigo-50">
                    {c.name}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <button type="button" onClick={onClose} aria-label="Close the map" className="rounded-full bg-white/95 px-3 py-2 text-sm text-slate-700 shadow-sm">
          ✕
        </button>
      </header>
      <div className="relative min-h-0 flex-1">
        <canvas ref={canvasRef} className="h-full w-full touch-none" aria-label="Calgary World Map" />
        {!shapes && <p className="absolute inset-0 flex items-center justify-center text-sm text-slate-500">{error ? `Could not load the map: ${error}` : 'Loading Calgary…'}</p>}
      </div>
      {sel && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <div className="pointer-events-auto w-full max-w-sm rounded-3xl bg-white p-4 shadow-xl">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h2 className="truncate text-lg font-bold text-slate-800">
                  {sel.c.name}
                  {sel.c.code === myCode && <span className="ml-1 text-sm text-orange-500">· my community</span>}
                </h2>
                <p className="text-xs text-slate-500">
                  {levelText(selStatus?.level ?? 0)}
                  {selStatus && selStatus.level > 0 && selStatus.vitality !== null && ` · ${vitalityMood(selStatus.vitality)}`}
                  {` · ${selStatus?.residents ?? 0} ${selStatus?.residents === 1 ? 'resident' : 'residents'}`}
                </p>
              </div>
              <button type="button" onClick={() => setSelected(null)} aria-label="Close" className="rounded-full bg-slate-100 px-2.5 py-1 text-sm text-slate-600">
                ✕
              </button>
            </div>
            {selStatus && (
              <button
                type="button"
                onClick={() => onEnter(selStatus.id)}
                className="mt-3 w-full rounded-2xl bg-indigo-500 py-2.5 text-sm font-semibold text-white active:scale-[0.98]"
              >
                {sel.c.code === myCode ? 'Back to my island' : 'Visit the island'}
              </button>
            )}
            {(!selStatus || selStatus.level === 0) && sel.c.code !== myCode && (
              <>
                <p className="mt-2 text-sm text-slate-600">{sel.c.name} is not settled yet. Know someone who lives here?</p>
                <button
                  type="button"
                  onClick={() => onInvite(sel.c.name)}
                  className="mt-2 w-full rounded-2xl bg-emerald-500 py-2.5 text-sm font-semibold text-white active:scale-[0.98]"
                >
                  👋 Invite a friend from {sel.c.name}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
