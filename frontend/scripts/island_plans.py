#!/usr/bin/env python3
"""
Island plan generator (requirement.md 7.8): one stored plan per community.

  python3 -I frontend/scripts/island_plans.py            # write plans that do not exist yet
  python3 -I frontend/scripts/island_plans.py --force    # regenerate all (PRE-LAUNCH ONLY)
  python3 -I frontend/scripts/island_plans.py MAH BLN    # only these communities
  python3 -I frontend/scripts/island_plans.py --rail      # regenerate only plans with CTrain track (PRE-LAUNCH ONLY)

Inputs:  supabase/data/calgary_boundaries.json, supabase/data/calgary_water.json,
         supabase/data/calgary_ctrain.json (track and stations at their real position, v3),
         supabase/data/calgary_communities.csv, supabase/data/building_tree.json (lots)
Output:  frontend/public/islands/<CODE>.json

Positions must never change after launch, so existing plans are never overwritten
without --force. Standard library only. The plans are validated by
frontend/src/modules/island-view/plan/islandPlans.test.ts.
"""
import csv
import json
import math
import sys
from collections import deque
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DATA = ROOT / "supabase" / "data"
OUT = ROOT / "frontend" / "public" / "islands"

TREE = json.loads((DATA / "building_tree.json").read_text())
BASE_TIERS = [t["tiles"] for t in TREE["landTiers"]]  # last is None = all
TIERS = list(BASE_TIERS)  # current tiers; the first stage may be enlarged for water (see main)
# If the first buildings (or Main Street) do not fit next to central water, the first two
# stages get a little more dry land, smallest change first.
EARLY_STAGE_TRIES = [(64, 144), (80, 144), (96, 144), (112, 144), (112, 160), (112, 176)]
TARGET_TILES = 1024
N4 = ((1, 0), (-1, 0), (0, 1), (0, -1))
RING8 = ((1, 0), (1, 1), (0, 1), (-1, 1), (-1, 0), (-1, -1), (0, -1), (1, -1))
MAX_HOUSES = 150
# Houses each land stage must hold at least (most residents a stage can have, requirement 7.8).
MIN_HOUSES = [2, 5, 10, 25, 50, 80]
PLAN_VERSION = 3
CTRAIN = json.loads((DATA / "calgary_ctrain.json").read_text())
# A station inside the community or this close to its boundary (metres) is drawn on the track.
STATION_NEAR_M = 150
MIN_RAIL_RUN = 4  # shorter track pieces (a corner clipped by the outline) are not drawn


# ---------------------------------------------------------------- rasterize

def project(lon, lat):
    return (lon * math.cos(math.radians(51.05)) * 111320.0, lat * 110540.0)


def ring_area(r):
    return abs(sum(r[i][0] * r[i - 1][1] - r[i - 1][0] * r[i][1] for i in range(len(r)))) / 2


def origin_of(rings):
    pts = [p for r in rings for p in r]
    return (min(p[0] for p in pts), max(p[1] for p in pts))


def scanline(rings, scale, origin=None):
    """Cells (x, z) whose centre is inside the polygon. z grows to the south."""
    minx, maxy = origin or origin_of(rings)
    rs = [[((x - minx) / scale, (maxy - y) / scale) for x, y in r] for r in rings]
    height = int(max(p[1] for r in rs for p in r)) + 2
    cells = set()
    for z in range(height):
        yc = z + 0.5
        xs = []
        for r in rs:
            for i in range(len(r)):
                (x1, y1), (x2, y2) = r[i - 1], r[i]
                if (y1 > yc) != (y2 > yc):
                    xs.append(x1 + (yc - y1) * (x2 - x1) / (y2 - y1))
        xs.sort()
        for a, b in zip(xs[0::2], xs[1::2]):
            for x in range(math.ceil(a - 0.5), math.floor(b - 0.5) + 1):
                cells.add((x, z))
    return cells


def cleanup(cells):
    changed = True
    while changed:  # remove thin spurs (cells with fewer than 2 neighbours)
        changed = False
        for c in list(cells):
            if sum((c[0] + dx, c[1] + dz) in cells for dx, dz in N4) < 2:
                cells.discard(c)
                changed = True
    best, seen = set(), set()
    for c in cells:  # keep the largest connected part
        if c in seen:
            continue
        comp, q = {c}, deque([c])
        seen.add(c)
        while q:
            x, z = q.popleft()
            for dx, dz in N4:
                n = (x + dx, z + dz)
                if n in cells and n not in seen:
                    seen.add(n)
                    comp.add(n)
                    q.append(n)
        if len(comp) > len(best):
            best = comp
    return best


def island_cells(lonlat_rings, water_rings):
    """Island cells and the water cells inside it (same projection and scale)."""
    rings = [[project(lon, lat) for lon, lat in r] for r in lonlat_rings]
    origin = origin_of(rings)
    scale = math.sqrt(sum(map(ring_area, rings)) / TARGET_TILES)
    cells = set()
    for _ in range(10):
        cells = cleanup(scanline(rings, scale, origin))
        ratio = len(cells) / TARGET_TILES
        if abs(ratio - 1) < 0.02:
            break
        scale *= math.sqrt(ratio)
    water = set()
    for wr in water_rings:
        water |= scanline([[project(lon, lat) for lon, lat in wr]], scale, origin)
    return cells, water & cells, origin, scale


def to_cell_space(origin, scale):
    minx, maxy = origin
    return lambda lon, lat: ((project(lon, lat)[0] - minx) / scale, (maxy - project(lon, lat)[1]) / scale)


def rail_runs(track_xy, cells):
    """Cells along a track polyline (cell space) as ordered, 4-connected runs inside the island.
    CTrain lines often run in road medians, which are community boundaries: track within one
    tile of the land snaps to the edge row instead of slipping in and out of the outline."""

    def snap(x, y):
        c = (math.floor(x), math.floor(y))
        if c in cells:
            return c
        near = [(math.hypot(c[0] + dx + 0.5 - x, c[1] + dz + 0.5 - y), (c[0] + dx, c[1] + dz)) for dx, dz in RING8 if (c[0] + dx, c[1] + dz) in cells]
        near = [n for n in near if n[0] <= 1.05]
        return min(near)[1] if near else None

    seq = []  # (cell or None, track position)
    for i in range(1, len(track_xy)):
        (ax, ay), (bx, by) = track_xy[i - 1], track_xy[i]
        n = max(1, int(math.hypot(bx - ax, by - ay) / 0.2))
        for k in range(n + 1):
            x, y = ax + (bx - ax) * k / n, ay + (by - ay) * k / n
            t = i - 1 + k / n
            c = snap(x, y)
            prev = seq[-1][0] if seq else None
            if c is not None and prev is not None and c != prev:
                d = abs(c[0] - prev[0]) + abs(c[1] - prev[1])
                if d == 2 and abs(c[0] - prev[0]) == 1:
                    # diagonal step: add the corner the line passes closest to (4-connected track)
                    corners = [q for q in ((c[0], prev[1]), (prev[0], c[1])) if q in cells]
                    if corners:
                        q = min(corners, key=lambda q: math.hypot(q[0] + 0.5 - x, q[1] + 0.5 - y))
                        seq.append((q, t))
                    else:
                        seq.append((None, t))
                elif d > 1:
                    seq.append((None, t))  # snapping jumped: start a new run
            if not seq or c != seq[-1][0]:
                seq.append((c, t))
    runs, cur, seen = [], [], set()
    for c, t in seq:
        if c is None:
            if cur:
                runs.append(cur)
            cur = []
            continue
        if c in seen:
            continue  # the line came back over cells it already used (sharp curves)
        if cur and abs(c[0] - cur[-1][0][0]) + abs(c[1] - cur[-1][0][1]) != 1:
            runs.append(cur)
            cur = []
        seen.add(c)
        cur.append((c, t))
    if cur:
        runs.append(cur)
    return [r for r in runs if len(r) >= MIN_RAIL_RUN]


def track_param(track_xy, pt):
    """Position of the point projected onto the polyline, as segment index + fraction."""
    best = None
    for i in range(1, len(track_xy)):
        (ax, ay), (bx, by) = track_xy[i - 1], track_xy[i]
        dx, dy = bx - ax, by - ay
        L = dx * dx + dy * dy
        t = 0 if L == 0 else max(0.0, min(1.0, ((pt[0] - ax) * dx + (pt[1] - ay) * dy) / L))
        d = math.hypot(pt[0] - ax - t * dx, pt[1] - ay - t * dy)
        if best is None or d < best[0]:
            best = (d, i - 1 + t)
    return best[1], best[0]


# ---------------------------------------------------------------- stages

def bfs(start_cells, allowed):
    dist, q = {}, deque()
    for c in start_cells:
        dist[c] = 0
        q.append(c)
    while q:
        x, z = q.popleft()
        for dx, dz in N4:
            n = (x + dx, z + dz)
            if n in allowed and n not in dist:
                dist[n] = dist[(x, z)] + 1
                q.append(n)
    return dist


def stages_for(cells, water):
    edge = [c for c in cells if any((c[0] + dx, c[1] + dz) not in cells for dx, dz in N4)]
    depth = bfs(edge, cells)
    cx = sum(c[0] for c in cells) / len(cells)
    cz = sum(c[1] for c in cells) / len(cells)
    # Plaza: a 2x2 block of deep cells, as deep and central as possible.
    best = None
    for (x, z) in cells:
        block = [(x, z), (x + 1, z), (x, z + 1), (x + 1, z + 1)]
        if all(b in cells and b not in water for b in block) and not any(
            (b[0] + dx, b[1] + dz) in water for b in block for dx, dz in N4
        ):
            score = (min(depth[b] for b in block), -math.hypot(x + 1 - cx, z + 1 - cz))
            if best is None or score > best[0]:
                best = (score, (x, z))
    px, pz = best[1]
    plaza = [(px, pz), (px + 1, pz), (px, pz + 1), (px + 1, pz + 1)]
    g = bfs(plaza, cells)
    # Reveal order: grow from the plaza, always taking the nearest (straight-line) tile that
    # touches land already shown. Every prefix is connected and close to a disc.
    import heapq
    centre = (px + 1, pz + 1)
    key = lambda c: (math.hypot(c[0] + 0.5 - centre[0], c[1] + 0.5 - centre[1]), c[0], c[1])
    order, seen, heap = [], set(plaza), []
    for c in plaza:
        heapq.heappush(heap, (key(c), c))
    while heap:
        _, c = heapq.heappop(heap)
        order.append(c)
        for dx, dz in N4:
            n = (c[0] + dx, c[1] + dz)
            if n in cells and n not in seen:
                seen.add(n)
                heapq.heappush(heap, (key(n), n))
    # Tiers count DRY land only: water revealed along the way does not use up a stage's land.
    stage = {}
    dry_rank = 0
    for c in order:
        s = len(TIERS) - 1
        for i, t in enumerate(TIERS):
            if t is not None and dry_rank < t:
                s = i
                break
        stage[c] = s
        if c not in water:
            dry_rank += 1
    return (px, pz), plaza, g, stage


# ---------------------------------------------------------------- paths

def road(start_cells, target, cells, blocked, costly=frozenset()):
    """Path from the plaza to target, preferring straight runs (Dijkstra with a turn cost).
    `costly` cells (the CTrain track) may be crossed but not followed."""
    import heapq
    pq, best, prev = [], {}, {}
    for c in start_cells:
        for d in range(4):
            heapq.heappush(pq, (0.0, c, d))
            best[(c, d)] = 0.0
    while pq:
        cost, c, d = heapq.heappop(pq)
        if c == target:
            path = []
            key = (c, d)
            while key in prev:
                path.append(key[0])
                key = prev[key]
            return list(reversed(path))
        if cost > best.get((c, d), 1e18):
            continue
        for nd, (dx, dz) in enumerate(N4):
            n = (c[0] + dx, c[1] + dz)
            if n not in cells or n in blocked:
                continue
            nc = cost + 1 + (0.4 if nd != d else 0) + (4 if n in costly else 0)
            if nc < best.get((n, nd), 1e18):
                best[(n, nd)] = nc
                prev[(n, nd)] = (c, d)
                heapq.heappush(pq, (nc, n, nd))
    return []


# ---------------------------------------------------------------- reachability

class Walk:
    def __init__(self, cells, stage, plaza, water=frozenset()):
        self.cells = cells
        self.water = water
        self.stage = stage
        self.plaza = plaza
        self.blocked = set()
        self.lots = []  # (tiles, landStage) that need a reachable neighbour

    def land(self, k, c):
        return c in self.cells and self.stage[c] <= k and c not in self.water

    def full_ok(self, extra, lot_tiles, lot_stage):
        """Full check: every open tile of every stage >= lot_stage reachable, every lot has a door."""
        blocked = self.blocked | set(extra)
        lots = self.lots + ([(lot_tiles, lot_stage)] if lot_tiles else [])
        # Lot tiles block walking as soon as they are land (reserved plot), so check from there.
        first = min([lot_stage] + [self.stage[t] for t in extra if t in self.stage])
        for k in range(first, len(TIERS)):
            seen = set(self.plaza)
            q = deque(self.plaza)
            while q:
                x, z = q.popleft()
                for dx, dz in N4:
                    n = (x + dx, z + dz)
                    if n not in seen and self.land(k, n) and n not in blocked:
                        seen.add(n)
                        q.append(n)
            open_count = sum(1 for c in self.cells if self.stage[c] <= k and c not in blocked and c not in self.water)
            if len(seen) != open_count:
                return False
            for tiles, s in lots:
                if s <= k and not any((t[0] + dx, t[1] + dz) in seen for t in tiles for dx, dz in N4):
                    return False
        return True

    def simple_ok(self, c):
        """Fast check for blocking one tile: its free neighbours stay connected around it, on every stage."""
        for k in range(self.stage[c], len(TIERS)):
            free = [self.land(k, (c[0] + dx, c[1] + dz)) and (c[0] + dx, c[1] + dz) not in self.blocked for dx, dz in RING8]
            # components of free ring cells, 4-connected via the ring (corners join neighbouring edges)
            comps = 0
            visited = [False] * 8
            for i in range(0, 8, 2):  # start from edge (orthogonal) neighbours only
                if free[i] and not visited[i]:
                    comps += 1
                    stack = [i]
                    while stack:
                        j = stack.pop()
                        if visited[j]:
                            continue
                        visited[j] = True
                        for nb in ((j + 1) % 8, (j - 1) % 8):
                            if free[nb] and not visited[nb] and (j % 2 == 0 or nb % 2 == 0):
                                stack.append(nb)
            if comps > 1:
                return False
        return True


# ---------------------------------------------------------------- plan

def hash01(x, z, salt):
    h = (x * 374761393) ^ (z * 668265263) ^ (salt * 1442695041)
    h &= 0xFFFFFFFF
    h = ((h ^ (h >> 13)) * 1274126177) & 0xFFFFFFFF
    h ^= h >> 16
    return h / 4294967296


def far_target(g, stage, avoid_dir=None, centre=(0, 0)):
    best = None
    for c, d in g.items():
        if avoid_dir is not None:
            vx, vz = c[0] - centre[0], c[1] - centre[1]
            n = math.hypot(vx, vz) or 1
            if (vx * avoid_dir[0] + vz * avoid_dir[1]) / n > math.cos(math.radians(110)):
                continue
        key = (d, -c[0], -c[1])
        if best is None or key > best[0]:
            best = (key, c)
    return best[1] if best else None


def add_bridges(cells, water, stage, plaza):
    """Where water would cut a stage's land apart, turn the shortest water crossing into a bridge."""
    bridges = set()
    for k in range(len(TIERS)):
        while True:
            land = {c for c in cells if stage[c] <= k and c not in water}
            main = bfs(plaza, land)
            rest = land - set(main)
            if not rest:
                break
            # shortest way from the main land to any other land through this stage's water
            allowed = {c for c in cells if stage[c] <= k}
            prev, q, seen, hit = {}, deque(main), set(main), None
            while q and hit is None:
                c = q.popleft()
                for dx, dz in N4:
                    n = (c[0] + dx, c[1] + dz)
                    if n in allowed and n not in seen:
                        seen.add(n)
                        prev[n] = c
                        if n in rest:
                            hit = n
                            break
                        q.append(n)
            if hit is None:
                raise RuntimeError("land cannot be connected")
            c = prev[hit]
            while c not in main:
                water.discard(c)
                bridges.add(c)
                c = prev[c]
    return bridges


def ctrain_for(cells, origin, scale, lonlat_rings):
    """CTrain runs (ordered track cells per line), stations near the community, and run ends with
    the next station beyond the island (requirement.md 7.9)."""
    cs = to_cell_space(origin, scale)
    ring = [project(lon, lat) for lon, lat in max(lonlat_rings, key=len)]

    def inside(pt):
        x, y = pt
        hit, j = False, len(ring) - 1
        for i in range(len(ring)):
            (xi, yi), (xj, yj) = ring[i], ring[j]
            if (yi > y) != (yj > y) and x < (xj - xi) * (y - yi) / (yj - yi) + xi:
                hit = not hit
            j = i
        return hit

    def near_m(lon, lat):
        p = project(lon, lat)
        if inside(p):
            return 0.0
        best = 1e18
        for i in range(len(ring)):
            (ax, ay), (bx, by) = ring[i - 1], ring[i]
            dx, dy = bx - ax, by - ay
            L = dx * dx + dy * dy
            t = 0 if L == 0 else max(0, min(1, ((p[0] - ax) * dx + (p[1] - ay) * dy) / L))
            best = min(best, math.hypot(p[0] - ax - t * dx, p[1] - ay - t * dy))
        return best

    runs, ends, local = [], [], {}
    for ln in CTRAIN["lines"]:
        track = [cs(lon, lat) for lon, lat in ln["track"]]
        params = [(s, track_param(track, cs(*CTRAIN["stations"][s]))[0]) for s in ln["stations"]]
        for run in rail_runs(track, cells):
            runs.append((ln["line"], [c for c, _ in run]))
            t0, t1 = run[0][1], run[-1][1]
            for (c, t), outward in ((run[0], -1), (run[-1], 1)):
                # next station beyond this end, in the direction the track leaves the island
                beyond = [(s, p) for s, p in params if (p - t) * outward > 0 and not (min(t0, t1) <= p <= max(t0, t1))]
                if not beyond:
                    continue
                nxt = min(beyond, key=lambda sp: abs(sp[1] - t))[0]
                inner = run[1][0] if outward == -1 else run[-2][0]
                ends.append({"line": ln["line"], "cell": c, "next": nxt, "dir": (c[0] - inner[0], c[1] - inner[1])})
        for s in ln["stations"]:
            lon, lat = CTRAIN["stations"][s]
            if near_m(lon, lat) <= STATION_NEAR_M:
                local.setdefault(s, {"lines": [], "at": cs(lon, lat)})["lines"].append(ln["line"])
    rail = {c for _, r in runs for c in r}
    # A next-station sign only where the track really leaves the island, once per station.
    seen_next, real = set(), []
    for e in ends:
        out = (e["cell"][0] + e["dir"][0], e["cell"][1] + e["dir"][1])
        if e["next"] in local or out in cells or e["next"] in seen_next:
            continue
        seen_next.add(e["next"])
        real.append(e)
    ends = real
    stations = {s: v for s, v in local.items() if rail}
    return runs, rail, stations, ends


def make_plan(code, name, lonlat_rings, water_rings, spread_weight=8):
    cells, water, origin, scale = island_cells(lonlat_rings, water_rings)
    runs, rail, station_specs, rail_ends = ctrain_for(cells, origin, scale, lonlat_rings)
    (px, pz), plaza, g, stage = stages_for(cells, water)
    pc = (px + 1, pz + 1)
    # The plaza never sits on the track; if it would, fall back to plans without track there.
    if rail & set(plaza):
        split = []
        for ln, r in runs:
            cur = []
            for c in r + [None]:
                if c is None or c in plaza:
                    if len(cur) >= MIN_RAIL_RUN:
                        split.append((ln, cur))
                    cur = []
                else:
                    cur.append(c)
        runs = split
        rail = {c for _, r in runs for c in r}
        rail_ends = [e for e in rail_ends if e["cell"] in rail]
    bridges = add_bridges(cells, water, stage, plaza)
    dry = cells - water
    g = bfs(plaza, dry)  # walking distance on dry land (roads, targets)
    walk = Walk(cells, stage, plaza, water)

    # Two main paths across the shape (they may cross the track, not run along it).
    t1 = far_target(g, stage)
    path1 = road(plaza, t1, dry, set(plaza), rail)
    d1 = (t1[0] - pc[0], t1[1] - pc[1])
    n1 = math.hypot(*d1) or 1
    t2 = far_target(g, stage, (d1[0] / n1, d1[1] / n1), pc)
    path2 = road(plaza, t2, dry, set(plaza) | set(path1), rail) if t2 else []
    paths = [c for c in path1 + path2 if c not in plaza and c not in bridges]
    paths += [c for c in sorted(bridges) if c not in paths]
    path_set = set(paths)
    # Track cells are walkable (level crossings) but never built on.
    used = set(plaza) | path_set | water | rail
    lots = {}

    # CTrain stations: a 2x1 platform beside the track, nearest the real station.
    stations = []
    for sname, spec in sorted(station_specs.items()):
        ax, ay = spec["at"]
        options = []
        for c in rail:
            if c in water:
                continue
            for w, d, offs in ((2, 1, ((0, -1), (0, 1))), (1, 2, ((-1, 0), (1, 0)))):
                for ox_, oz_ in offs:
                    for sx in range(-(w - 1), 1):
                        for sz in range(-(d - 1), 1):
                            x0, z0 = c[0] + ox_ + sx, c[1] + oz_ + sz
                            tiles = [(x0 + i, z0 + j) for i in range(w) for j in range(d)]
                            if not all(t in cells and t not in used for t in tiles):
                                continue
                            # the platform runs along the track: every tile touches it
                            if not all(any((t[0] + dx, t[1] + dz) in rail for dx, dz in N4) for t in tiles):
                                continue
                            dist = math.hypot(x0 + w / 2 - ax, z0 + d / 2 - ay)
                            options.append((dist, x0, z0, w, d, tiles))
        options.sort(key=lambda o: o[:3])
        for _, x0, z0, w, d, tiles in options[:200]:
            st = max(stage[t] for t in tiles)
            if walk.full_ok(tiles, tiles, st):
                walk.blocked |= set(tiles)
                walk.lots.append((tiles, st))
                used.update(tiles)
                stations.append({"name": sname, "lines": spec["lines"], "rect": [x0, z0, w, d]})
                break
    later_angles = []
    ring_radius = [max((math.hypot(c[0] - pc[0], c[1] - pc[1]) for c in cells if stage[c] == k), default=4) for k in range(len(TIERS))]

    entrance = path1[0] if path1 else None
    lots["entrance"] = [entrance[0], entrance[1], 1, 1] if entrance else None

    def touches_path(tiles):
        return any((t[0] + dx, t[1] + dz) in path_set or (t[0] + dx, t[1] + dz) in set(plaza) for t in tiles for dx, dz in N4)

    def place(key, size, land_stage, kind):
        w0, d0 = size
        options = [(w0, d0)] if w0 == d0 else [(w0, d0), (d0, w0)]
        cands = []
        for (x, z) in cells:
            for (w, d) in options:
                tiles = [(x + i, z + j) for i in range(w) for j in range(d)]
                if not all(t in cells and stage[t] <= land_stage and t not in used for t in tiles):
                    continue
                touch = touches_path(tiles)
                if kind == "main-street" and not touch:
                    continue
                cx, cz = x + w / 2 - pc[0], z + d / 2 - pc[1]
                dist = math.hypot(cx, cz)
                # Prefer the lot's own land ring, so later lots do not eat early land.
                early = land_stage - min(stage[t] for t in tiles)
                if land_stage == 0 or kind == "main-street":
                    score = dist - (3 if touch else 0) + early * 12
                else:
                    # Later lots: outer part of their newly grown land, away from other later lots.
                    target = ring_radius[land_stage] * 0.8
                    ang = math.atan2(cz, cx)
                    near = min((abs(math.atan2(math.sin(ang - a), math.cos(ang - a))) for a in later_angles), default=math.pi)
                    spread = spread_weight * max(0.0, 1 - near / (math.pi / 3))
                    score = abs(dist - target) - (1.5 if touch else 0) + early * 12 + spread
                cands.append((score, x, z, w, d, tiles))
        cands.sort(key=lambda c: (c[0], c[1], c[2]))
        for _, x, z, w, d, tiles in cands[:400]:
            if walk.full_ok(tiles, tiles, land_stage):
                walk.blocked |= set(tiles)
                walk.lots.append((tiles, land_stage))
                used.update(tiles)
                lots[key] = [x, z, w, d]
                if land_stage > 0 and kind != "main-street":
                    later_angles.append(math.atan2(z + d / 2 - pc[1], x + w / 2 - pc[0]))
                return True
        return False

    houses = []
    house_set = set()

    def add_houses(max_stage, limit):
        for c in sorted(cells, key=lambda c: (stage[c], g.get(c, 1 << 20), c[0], c[1])):
            if len(houses) >= limit:
                return
            if stage[c] > max_stage or c in used:
                continue
            if any((c[0] + dx, c[1] + dz) in house_set for dx, dz in RING8):
                continue
            doors = [(c[0] + dx, c[1] + dz) for dx, dz in N4]
            if not any(n in cells and stage[n] <= stage[c] and n not in used for n in doors):
                continue
            if not walk.simple_ok(c):
                continue
            walk.blocked.add(c)
            used.add(c)
            house_set.add(c)
            houses.append(c)

    # Stage-0 building lots first, then the minimum early houses, then Main Street
    # (needs path frontage near the plaza), then the rest.
    keys = [k for k in TREE["lots"] if k != "entrance"]
    order = sorted(keys, key=lambda k: (
        0 if TREE["lots"][k]["kind"] == "building" and TREE["lots"][k]["landStage"] == 0
        else 1 if TREE["lots"][k]["kind"] == "main-street" else 2,
        keys.index(k)))
    reserved_houses = False
    for key in order:
        spec = TREE["lots"][key]
        if not reserved_houses and not (spec["kind"] == "building" and spec["landStage"] == 0):
            for k, need in enumerate(MIN_HOUSES[:3]):
                add_houses(k, need)
            reserved_houses = True
        if not place(key, spec["size"], spec["landStage"], spec["kind"]):
            raise RuntimeError(f"{code}: no room for lot {key}")

    # Later lots must not leave a direction empty for more than 150° (validated by the tests).
    later = [k for k, v in TREE["lots"].items() if v["kind"] in ("building", "spare") and v["landStage"] > 0]
    angles = sorted(math.atan2(lots[k][1] + lots[k][3] / 2 - pc[1], lots[k][0] + lots[k][2] / 2 - pc[0]) for k in later)
    gaps = [(angles[(i + 1) % len(angles)] - a) % (2 * math.pi) for i, a in enumerate(angles)]
    if max(gaps) >= math.radians(150):
        raise RuntimeError(f"{code}: later lots leave a {math.degrees(max(gaps)):.0f}° gap")

    # House lots: centre outward, never touching another house, door kept free.
    add_houses(len(TIERS) - 1, MAX_HOUSES)
    houses.sort(key=lambda c: (stage[c], g.get(c, 1 << 20), c[0], c[1]))

    # Trees: decoration on leftover tiles, off path edges and house doors, never cutting a path.
    trees = []
    for c in sorted(cells, key=lambda c: (stage[c], g.get(c, 1 << 20), c[0], c[1])):
        if c in used or hash01(c[0], c[1], 1) >= 0.28:
            continue
        near = [(c[0] + dx, c[1] + dz) for dx, dz in N4]
        if any(n in path_set or n in house_set for n in near):
            continue
        if not walk.simple_ok(c):
            continue
        walk.blocked.add(c)
        used.add(c)
        trees.append(c)

    # Camera: long side of the shape vertical on a portrait phone. Unused by the app since
    # requirement.md v1.30 (every island uses the World Map orientation); kept in the plan format.
    mx = sum(c[0] for c in cells) / len(cells)
    mz = sum(c[1] for c in cells) / len(cells)
    sxx = sum((c[0] - mx) ** 2 for c in cells)
    szz = sum((c[1] - mz) ** 2 for c in cells)
    sxz = sum((c[0] - mx) * (c[1] - mz) for c in cells)
    phi = 0.5 * math.atan2(2 * sxz, sxx - szz)
    tr = sxx + szz
    det = sxx * szz - sxz * sxz
    l1 = tr / 2 + math.sqrt(max(tr * tr / 4 - det, 0))
    l2 = tr / 2 - math.sqrt(max(tr * tr / 4 - det, 0))
    azimuth = math.pi / 4
    if l2 > 0 and l1 / l2 > 1.6:
        vx, vz = math.cos(phi), math.sin(phi)
        options = [math.atan2(-vx, -vz), math.atan2(vx, vz)]
        azimuth = min(options, key=lambda a: abs(math.atan2(math.sin(a - math.pi / 4), math.cos(a - math.pi / 4))))

    # Shift so the plaza's top-left tile is (-1, -1): the plaza centre is the world origin.
    ox, oz = px + 1, pz + 1
    sh = lambda c: [c[0] - ox, c[1] - oz]
    flat = lambda cs: [v for c in cs for v in sh(c)]
    tiles_flat = []
    for c in sorted(cells, key=lambda c: (stage[c], g.get(c, 1 << 20), c[0], c[1])):
        tiles_flat += sh(c) + [stage[c]]
    return {
        "v": PLAN_VERSION,
        "code": code,
        "name": name,
        "tiles": tiles_flat,
        "paths": flat(paths),
        "lots": {k: [v[0] - ox, v[1] - oz, v[2], v[3]] for k, v in lots.items() if v},
        "houses": flat(houses),
        "trees": flat(trees),
        "water": flat(sorted(water)),
        "bridges": flat(sorted(bridges)),
        "rail": [{"line": ln, "tiles": flat(r)} for ln, r in runs if r],
        "stations": [{"name": s["name"], "lines": s["lines"], "rect": [s["rect"][0] - ox, s["rect"][1] - oz, s["rect"][2], s["rect"][3]]} for s in stations],
        "railEnds": [{"line": e["line"], "next": e["next"], "tile": sh(e["cell"]), "dir": list(e["dir"])} for e in rail_ends if e["cell"] in rail],
        "cameraAzimuth": round(azimuth, 4),
        "tiers": [t if t is not None else len(cells) - len(water) for t in TIERS],
    }


def main(argv):
    force = "--force" in argv
    rail_only = "--rail" in argv
    only = [a for a in argv if not a.startswith("--")]
    bounds = json.loads((DATA / "calgary_boundaries.json").read_text())["communities"]
    water_all = json.loads((DATA / "calgary_water.json").read_text())["water"]
    names = {r["code"]: r["name"] for r in csv.DictReader(open(DATA / "calgary_communities.csv"))}
    OUT.mkdir(parents=True, exist_ok=True)
    written = skipped = 0
    failed = []
    for code in sorted(bounds):
        if only and code not in only:
            continue
        path = OUT / f"{code}.json"
        if path.exists() and not force and not rail_only:
            skipped += 1
            continue
        try:
            ring = bounds[code][0]
            box = (min(p[0] for p in ring), min(p[1] for p in ring), max(p[0] for p in ring), max(p[1] for p in ring))
            water_rings = [w["ring"] for w in water_all if not (
                max(p[0] for p in w["ring"]) < box[0] or min(p[0] for p in w["ring"]) > box[2]
                or max(p[1] for p in w["ring"]) < box[1] or min(p[1] for p in w["ring"]) > box[3])]
            plan, err = None, None
            for first, second in EARLY_STAGE_TRIES:
                TIERS[0], TIERS[1] = first, second
                for weight in (8, 14, 20):
                    try:
                        plan = make_plan(code, names.get(code, code.title()), bounds[code], water_rings, weight)
                        break
                    except RuntimeError as e:
                        err = e
                if plan is not None:
                    break
            TIERS[0], TIERS[1] = BASE_TIERS[0], BASE_TIERS[1]
            if plan is None:
                raise err
        except RuntimeError as e:
            failed.append(str(e))
            continue
        if rail_only and not plan["rail"]:
            skipped += 1  # no track here: keep the stored plan untouched
            continue
        path.write_text(json.dumps(plan, separators=(",", ":")))
        written += 1
    print(f"written {written}, kept {skipped}, failed {len(failed)}")
    for f in failed:
        print("  FAILED", f)
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
