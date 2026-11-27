#!/usr/bin/env python3
"""
Island plan generator (requirement.md v1.48 7.2, 7.6, 7.8): one stored plan per community.

Plan v4 (M24): lots for every step of the community's build map (supabase/data/build_map.json
and community_personas.csv, the same "most specific step wins" rule as the server), placed by
meaning: water places on the shore facing the water, street places along a path, plaza places by
the plaza, the rest spread over the newly grown land. Each lot is [x, z, w, d, face] (face 0..3 =
the model turned that many quarter turns: 0 faces +z, 1 +x, 2 -z, 3 -x). A lot rises with the
land stage that fits it; the server waits for that land (gamecore.place_lots, seeded by
supabase/data/place_lots_seed.py from these plans). Houses stand in 2-4 residential zones.
Lake and river communities with (almost) no water inside the boundary get a small lake at the
edge facing the nearest real water.

  python3 -I frontend/scripts/island_plans.py            # write plans that do not exist yet
  python3 -I frontend/scripts/island_plans.py --force    # regenerate all (PRE-LAUNCH ONLY)
  python3 -I frontend/scripts/island_plans.py MAH BLN    # only these communities
  python3 -I frontend/scripts/island_plans.py --rail      # regenerate only plans with CTrain track (PRE-LAUNCH ONLY)

Inputs:  supabase/data/calgary_boundaries.json, supabase/data/calgary_water.json,
         supabase/data/calgary_ctrain.json (track and stations at their real position, v3),
         supabase/data/calgary_communities.csv, supabase/data/build_map.json,
         supabase/data/community_personas.csv, supabase/data/building_tree.json (Main Street and spare lots)
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
BUILD = json.loads((DATA / "build_map.json").read_text())
PERSONAS = {r["code"]: r["persona"] for r in csv.DictReader(open(DATA / "community_personas.csv"))}
LAND_MIN = [t["minResidents"] for t in BUILD["landTiers"]]
TRACK_ORDER = {"root": 0, "community": 1, "persona": 2, "nature": 3}
WATER_SITES = ("shore", "riverbank")
# a bridge place laid across the water, both ends on dry land (requirement v1.50 7.6b, 7.8)
CROSSING = "crossing"
# Lake and river islands with less water than this get a small lake (POND_W x POND_D) at the edge.
MIN_WATER = 12
POND_SIZES = [(8, 4), (6, 4), (6, 3), (5, 3), (4, 3)]
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
PLAN_VERSION = 4
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


def step_residents(step):
    """Cumulative residents a step needs (the same conditions as supabase/data/build_map_seed.py)."""
    common = {c["step"]: c for c in BUILD["conditions"]["common"]}
    landmarks = {c["order"]: c for c in BUILD["conditions"]["landmarks"]}
    if step["track"] == "root":
        return 0
    if step["track"] == "persona" and step["step"] >= 4:
        return landmarks[step["step"] - 3].get("residents", 0)
    return common.get(step["step"], common[max(common)]).get("residents", 0)


def land_stage_for(residents):
    return max(i for i, m in enumerate(LAND_MIN) if m <= residents)


def community_steps(code):
    """The community's build map steps that need a lot: per (track, step) the most specific row."""
    persona = PERSONAS.get(code)
    best = {}
    for s in BUILD["steps"]:
        if s.get("persona") not in (None, persona) or s.get("community") not in (None, code):
            continue
        rank = (s.get("community") is not None, s.get("persona") is not None)
        k = (s["track"], s["step"])
        if k not in best or rank > best[k][0]:
            best[k] = (rank, s)
    return [s for _, s in sorted(best.values(), key=lambda v: (TRACK_ORDER[v[1]["track"]], v[1]["step"])) if s["tiles"][0] > 0]


def carve_pond(cells, water, stage, plaza, toward):
    """A small lake at the island edge (largest size that fits), towards the nearest real water."""
    # at the edge in early land if possible; on compact islands (edge only in late land) a pond inside
    for at_edge, max_stage in ((True, 2), (True, 3), (False, 2), (False, 3)):
        for size in POND_SIZES:
            pond = carve_pond_sized(cells, water, stage, plaza, toward, size, max_stage, at_edge)
            if pond:
                return pond
    return set()


def carve_pond_sized(cells, water, stage, plaza, toward, size, max_stage, at_edge=True):
    edge = {c for c in cells if any((c[0] + dx, c[1] + dz) not in cells for dx, dz in N4)}
    near_plaza = {(p[0] + dx, p[1] + dz) for p in plaza for dx in range(-3, 4) for dz in range(-3, 4)}
    pcx = sum(p[0] for p in plaza) / 4
    pcz = sum(p[1] for p in plaza) / 4
    best = None
    for (x, z) in cells:
        for w, d in (size, size[::-1]):
            block = [(x + i, z + j) for i in range(w) for j in range(d)]
            if not all(b in cells and b not in water and b not in near_plaza and stage[b] <= max_stage for b in block):
                continue
            if at_edge and not any(b in edge for b in block):
                continue
            bx, bz = x + w / 2 - pcx, z + d / 2 - pcz
            n = math.hypot(bx, bz) or 1
            aim = 0 if toward is None else -((bx * toward[0] + bz * toward[1]) / n)
            score = (aim, max(stage[b] for b in block), math.hypot(bx, bz), x, z)
            dry = cells - water - set(block)
            if best is not None and score >= best[0]:
                continue
            if len(bfs(plaza, dry)) != len(dry):
                continue  # the lake must not cut the land apart
            best = (score, block)
    return set(best[1]) if best else set()


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


def make_plan(code, name, lonlat_rings, water_rings, spread_weight=8, report=None):
    cells, water, origin, scale = island_cells(lonlat_rings, water_rings)
    runs, rail, station_specs, rail_ends = ctrain_for(cells, origin, scale, lonlat_rings)
    steps = community_steps(code)
    pond = set()
    if any(st["site"] in WATER_SITES + (CROSSING,) for st in steps) and len(water) < MIN_WATER:
        (qx, qz), q_plaza, _, q_stage = stages_for(cells, water)
        toward = None
        if water_rings:
            to_cell = to_cell_space(origin, scale)
            pts = [to_cell(lon, lat) for r in water_rings for lon, lat in r]
            wx, wz = sum(q[0] for q in pts) / len(pts) - (qx + 1), sum(q[1] for q in pts) / len(pts) - (qz + 1)
            nn = math.hypot(wx, wz) or 1
            toward = (wx / nn, wz / nn)
        pond = carve_pond(cells, water, q_stage, q_plaza, toward)
        water = water | pond
        if report is not None:
            report.append(f"{code}: small lake added ({len(pond)} tiles)")
    # stages count dry land only, so they are computed with the lake in place
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
    lots["welcome-sign"] = [entrance[0], entrance[1], 1, 1, 0] if entrance else None
    plaza_set = set(plaza)
    lot_stage = {}
    lot_cells = set()  # houses and trees never stand right beside a lot, so its door stays free

    # Residential zones (requirement 7.2): 2-4 clusters of houses, the first one near the centre.
    n_dry = len(cells - water)
    n_zones = 2 if n_dry < 500 else 3 if n_dry < 850 else 4
    zone_centres = []
    zone_stages = [1, 3, 4, 2][:n_zones]
    for zi, zs in enumerate(zone_stages):
        ring = [c for c in cells if c not in used and stage[c] == zs]
        if not ring:
            continue
        def zscore(c):
            ang = math.atan2(c[1] - pc[1], c[0] - pc[0])
            near = min((abs(math.atan2(math.sin(ang - a), math.cos(ang - a))) for a in zone_centres_ang), default=math.pi)
            return (-near, abs(math.hypot(c[0] - pc[0], c[1] - pc[1]) - ring_radius[zs] * 0.75), c[0], c[1])
        zone_centres_ang = [math.atan2(c[1] - pc[1], c[0] - pc[0]) for c in zone_centres]
        zone_centres.append(min(ring, key=zscore))
    ZONE_R = 4.5
    zone_cells = {c for c in cells if any(math.hypot(c[0] - zc[0], c[1] - zc[1]) <= ZONE_R for zc in zone_centres)}

    def touches_path(tiles):
        return any((t[0] + dx, t[1] + dz) in path_set or (t[0] + dx, t[1] + dz) in plaza_set for t in tiles for dx, dz in N4)

    def side_cells(x, z, w, d, face):
        """The cells just outside one side of the lot: 0 = +z, 1 = +x, 2 = -z, 3 = -x."""
        if face == 0:
            return [(x + i, z + d) for i in range(w)]
        if face == 1:
            return [(x + w, z + j) for j in range(d)]
        if face == 2:
            return [(x + i, z - 1) for i in range(w)]
        return [(x - 1, z + j) for j in range(d)]

    crossing_used = set()

    def place_crossing(key, size, land_stage):
        """A bridge across the water: a straight lot whose two end tiles are free dry land and whose
        middle crosses at least one water tile (never a path bridge or the CTrain); water tiles under
        it stay water. Prefers lots that span more water, near the island's middle."""
        n = max(size)
        cands = []
        for (x, z) in cells:
            for along_x in (True, False):
                tiles = [(x + i, z) for i in range(n)] if along_x else [(x, z + i) for i in range(n)]
                if not all(t in cells and stage[t] <= land_stage for t in tiles):
                    continue
                ends, mid = [tiles[0], tiles[-1]], tiles[1:-1]
                if any(e in water or e in used for e in ends):
                    continue
                wet_mid = [m for m in mid if m in water]
                if not wet_mid or any(m in rail or m in crossing_used for m in wet_mid):
                    continue
                if any(m not in water and m in used for m in mid):
                    continue
                cx, cz = x + (n / 2 if along_x else 0.5) - pc[0], z + (0.5 if along_x else n / 2) - pc[1]
                early = land_stage - min(stage[t] for t in tiles)
                score = -4 * len(wet_mid) + 0.3 * math.hypot(cx, cz) + early * 12
                cands.append((score, x, z, along_x, tiles))
        cands.sort(key=lambda c: (c[0], c[1], c[2]))
        for _, x, z, along_x, tiles in cands[:400]:
            dry = [t for t in tiles if t not in water]
            real = max(stage[t] for t in tiles)
            if walk.full_ok(dry, dry, real):
                walk.blocked |= set(dry)
                walk.lots.append((dry, real))
                used.update(tiles)
                crossing_used.update(tiles)
                # spans along x: canonical size, front +z; along z: turned (an odd facing swaps the footprint)
                lots[key] = [x, z, n, 1, 0] if along_x else [x, z, 1, n, 1]
                lot_stage[key] = real
                lot_cells.update(dry)
                if land_stage > 0:
                    later_angles.append(math.atan2(z + (0.5 if along_x else n / 2) - pc[1], x + (n / 2 if along_x else 0.5) - pc[0]))
                return True
        return False

    def place(key, size, land_stage, kind, site="park", strict=True):
        w0, d0 = size
        options = [(w0, d0, (0, 2))] if w0 == d0 else [(w0, d0, (0, 2)), (d0, w0, (1, 3))]
        if w0 == d0:
            options = [(w0, d0, (0, 1, 2, 3))]
        wet = site in WATER_SITES and bool(water)
        shore_d = (lambda t: min(abs(t[0] - w_[0]) + abs(t[1] - w_[1]) for w_ in water)) if (wet and not strict) else None
        if not strict:
            wet = False
        cands = []
        for (x, z) in cells:
            for (w, d, faces) in options:
                tiles = [(x + i, z + j) for i in range(w) for j in range(d)]
                if not all(t in cells and stage[t] <= land_stage and t not in used for t in tiles):
                    continue
                touch = touches_path(tiles)
                if kind == "main-street" and not touch:
                    continue
                def feature(c):
                    if wet:
                        return c in water
                    return c in path_set or c in plaza_set
                counts = {f: sum(1 for c in side_cells(x, z, w, d, f) if feature(c)) for f in range(4)}
                if wet and max(counts.values()) == 0:
                    continue  # water places stand on the shore
                face = max(faces, key=lambda f: (counts[f], -f))
                best_any = max(counts.values())
                cx, cz = x + w / 2 - pc[0], z + d / 2 - pc[1]
                dist = math.hypot(cx, cz)
                early = land_stage - min(stage[t] for t in tiles)
                in_zone = sum(1 for t in tiles if t in zone_cells)
                if land_stage == 0 or kind == "main-street":
                    score = dist - (3 if touch else 0) + early * 12
                else:
                    target = ring_radius[land_stage] * 0.8
                    ang = math.atan2(cz, cx)
                    near = min((abs(math.atan2(math.sin(ang - a), math.cos(ang - a))) for a in later_angles), default=math.pi)
                    spread = spread_weight * max(0.0, 1 - near / (math.pi / 3))
                    score = abs(dist - target) - (1.5 if touch else 0) + early * 12 + spread
                if site == "plaza":
                    score += dist * 0.8
                if site == "street" and not touch:
                    score += 6
                score += 2.5 * (best_any - counts[face]) + 3 * in_zone / max(1, len(tiles)) * 4
                if shore_d is not None:
                    score += 2 * min(shore_d(t) for t in tiles)
                cands.append((score, x, z, w, d, face, tiles))
        cands.sort(key=lambda c: (c[0], c[1], c[2]))
        for _, x, z, w, d, face, tiles in cands[:400]:
            real = max(stage[t] for t in tiles)  # the lot exists (and blocks) from the stage its land rises
            if walk.full_ok(tiles, tiles, real):
                walk.blocked |= set(tiles)
                walk.lots.append((tiles, real))
                used.update(tiles)
                lots[key] = [x, z, w, d, face]
                lot_stage[key] = max(stage[t] for t in tiles)
                lot_cells.update(tiles)
                if land_stage > 0 and kind != "main-street":
                    later_angles.append(math.atan2(z + d / 2 - pc[1], x + w / 2 - pc[0]))
                return True
        return False

    houses = []
    house_set = set()

    def add_houses(max_stage, limit, zoned=True, beside_lots=False):
        for c in sorted(cells, key=lambda c: (stage[c], g.get(c, 1 << 20), c[0], c[1])):
            if len(houses) >= limit:
                return
            if stage[c] > max_stage or c in used or (zoned and c not in zone_cells):
                continue
            beside = any((c[0] + dx, c[1] + dz) in lot_cells for dx, dz in N4)
            if beside and not beside_lots:
                continue
            if any((c[0] + dx, c[1] + dz) in house_set for dx, dz in RING8):
                continue
            doors = [(c[0] + dx, c[1] + dz) for dx, dz in N4]
            if not any(n in cells and stage[n] <= stage[c] and n not in used for n in doors):
                continue
            if not walk.simple_ok(c) or (beside and not walk.full_ok([c], [c], stage[c])):
                continue
            walk.blocked.add(c)
            walk.lots.append(([c], stage[c]))  # a house keeps a reachable door like a lot
            used.add(c)
            house_set.add(c)
            houses.append(c)

    # The build map's lots in the order they can open (land first, then step, taking turns between
    # the tracks), a few early houses after the first lots, then Main Street and spare lots.
    place_steps = [st for st in steps if st["track"] != "root"]
    # scarce sites first: each track's first place (a founder builds them in the first days), then the
    # signature landmark (its shore or street spot must exist by 11 residents), then the rest
    def priority(st):
        if st["step"] == 1:
            return 0  # every track's first place (taking turns between tracks below)
        return 1 if st.get("landmarkOrder") == 1 else 2
    # among first places the persona one goes first: its site (a shore, a street) is the scarcest
    first_order = {"persona": 0, "community": 1, "nature": 2}
    place_steps.sort(key=lambda st: (priority(st), first_order.get(st["track"], 3) if st["step"] == 1 else 0,
                                     land_stage_for(step_residents(st)), st["step"], TRACK_ORDER[st["track"]]))
    early_houses_done = False
    for st in place_steps:
        want = land_stage_for(step_residents(st))
        if not early_houses_done and want > 0:
            for k, need in enumerate(MIN_HOUSES[:3]):
                add_houses(k, need)
                if len([h for h in houses if stage[h] <= k]) < need:
                    add_houses(k, need, zoned=False)
                if len([h for h in houses if stage[h] <= k]) < need:
                    add_houses(k, need, zoned=False, beside_lots=True)
            early_houses_done = True
        kind = "building"
        if st["site"] == CROSSING:
            if water and any(place_crossing(st["key"], st["tiles"], k) for k in range(want, len(TIERS))):
                continue
            # no water a bridge can span: it stands on the riverbank instead (the report lists these)
            if report is not None:
                report.append(f"{code}: {st['key']} on the riverbank, no water to cross")
            st = {**st, "site": "riverbank"}
        if not any(place(st["key"], st["tiles"], k, kind, st["site"]) for k in range(want, len(TIERS))):
            # no shore left: the land nearest the water (the report lists these)
            if not any(place(st["key"], st["tiles"], k, kind, st["site"], strict=False) for k in range(want, len(TIERS))):
                raise RuntimeError(f"{code}: no room for {st['key']}")
            if report is not None and st["site"] in WATER_SITES:
                report.append(f"{code}: {st['key']} near the water, not on the shore")
    for key, spec in TREE["lots"].items():
        if spec["kind"] in ("main-street", "spare") and not any(place(key, spec["size"], k, spec["kind"]) for k in range(spec["landStage"], len(TIERS))):
            raise RuntimeError(f"{code}: no room for lot {key}")

    # Later lots must not leave a direction empty for more than 150° (validated by the tests).
    later = [k for k in lots if lots[k] and k in lot_stage and lot_stage[k] > 0 and not k.startswith("main-street")]
    angles = sorted(math.atan2(lots[k][1] + lots[k][3] / 2 - pc[1], lots[k][0] + lots[k][2] / 2 - pc[0]) for k in later)
    gaps = [(angles[(i + 1) % len(angles)] - a) % (2 * math.pi) for i, a in enumerate(angles)]
    if angles and max(gaps) >= math.radians(150):
        raise RuntimeError(f"{code}: later lots leave a {math.degrees(max(gaps)):.0f}° gap")

    # House lots: in the residential zones, centre outward, never touching another house, door kept free.
    add_houses(len(TIERS) - 1, MAX_HOUSES)
    houses.sort(key=lambda c: (stage[c], g.get(c, 1 << 20), c[0], c[1]))

    # Trees: decoration on leftover tiles, off path edges and house doors, never cutting a path.
    trees = []
    for c in sorted(cells, key=lambda c: (stage[c], g.get(c, 1 << 20), c[0], c[1])):
        if c in used or hash01(c[0], c[1], 1) >= 0.28:
            continue
        near = [(c[0] + dx, c[1] + dz) for dx, dz in N4]
        if any(n in path_set or n in house_set or n in lot_cells for n in near):
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
        "persona": PERSONAS.get(code),
        "lots": {k: [v[0] - ox, v[1] - oz, v[2], v[3], v[4] if len(v) > 4 else 0] for k, v in lots.items() if v},
        "pond": flat(sorted(pond)),
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
    report = []
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
                        notes = []
                        plan = make_plan(code, names.get(code, code.title()), bounds[code], water_rings, weight, notes)
                        report += notes
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
    for r in sorted(set(report)):
        print("  NOTE", r)
    for f in failed:
        print("  FAILED", f)
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
