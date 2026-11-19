#!/usr/bin/env python3
"""
Island plan generator (requirement.md 7.8): one stored plan per community.

  python3 -I frontend/scripts/island_plans.py            # write plans that do not exist yet
  python3 -I frontend/scripts/island_plans.py --force    # regenerate all (PRE-LAUNCH ONLY)
  python3 -I frontend/scripts/island_plans.py MAH BLN    # only these communities

Inputs:  supabase/data/calgary_boundaries.json, supabase/data/calgary_communities.csv,
         supabase/data/building_tree.json (lots)
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
TIERS = [t["tiles"] for t in TREE["landTiers"]]  # last is None = all
TARGET_TILES = 1024
N4 = ((1, 0), (-1, 0), (0, 1), (0, -1))
RING8 = ((1, 0), (1, 1), (0, 1), (-1, 1), (-1, 0), (-1, -1), (0, -1), (1, -1))
MAX_HOUSES = 150
# Houses each land stage must hold at least (most residents a stage can have, requirement 7.8).
MIN_HOUSES = [2, 5, 10, 25, 50, 80]
PLAN_VERSION = 1


# ---------------------------------------------------------------- rasterize

def project(lon, lat):
    return (lon * math.cos(math.radians(51.05)) * 111320.0, lat * 110540.0)


def ring_area(r):
    return abs(sum(r[i][0] * r[i - 1][1] - r[i - 1][0] * r[i][1] for i in range(len(r)))) / 2


def scanline(rings, scale):
    """Cells (x, z) whose centre is inside the polygon. z grows to the south."""
    pts = [p for r in rings for p in r]
    minx = min(p[0] for p in pts)
    maxy = max(p[1] for p in pts)
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


def island_cells(lonlat_rings):
    rings = [[project(lon, lat) for lon, lat in r] for r in lonlat_rings]
    scale = math.sqrt(sum(map(ring_area, rings)) / TARGET_TILES)
    cells = set()
    for _ in range(10):
        cells = cleanup(scanline(rings, scale))
        ratio = len(cells) / TARGET_TILES
        if abs(ratio - 1) < 0.02:
            break
        scale *= math.sqrt(ratio)
    return cells


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


def stages_for(cells):
    edge = [c for c in cells if any((c[0] + dx, c[1] + dz) not in cells for dx, dz in N4)]
    depth = bfs(edge, cells)
    cx = sum(c[0] for c in cells) / len(cells)
    cz = sum(c[1] for c in cells) / len(cells)
    # Plaza: a 2x2 block of deep cells, as deep and central as possible.
    best = None
    for (x, z) in cells:
        block = [(x, z), (x + 1, z), (x, z + 1), (x + 1, z + 1)]
        if all(b in cells for b in block):
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
    stage = {}
    for rank, c in enumerate(order):
        s = len(TIERS) - 1
        for i, t in enumerate(TIERS):
            if t is not None and rank < t:
                s = i
                break
        stage[c] = s
    return (px, pz), plaza, g, stage


# ---------------------------------------------------------------- paths

def road(start_cells, target, cells, blocked):
    """Path from the plaza to target, preferring straight runs (Dijkstra with a turn cost)."""
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
            nc = cost + 1 + (0.4 if nd != d else 0)
            if nc < best.get((n, nd), 1e18):
                best[(n, nd)] = nc
                prev[(n, nd)] = (c, d)
                heapq.heappush(pq, (nc, n, nd))
    return []


# ---------------------------------------------------------------- reachability

class Walk:
    def __init__(self, cells, stage, plaza):
        self.cells = cells
        self.stage = stage
        self.plaza = plaza
        self.blocked = set()
        self.lots = []  # (tiles, landStage) that need a reachable neighbour

    def land(self, k, c):
        return c in self.cells and self.stage[c] <= k

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
            open_count = sum(1 for c in self.cells if self.stage[c] <= k and c not in blocked)
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


def make_plan(code, name, lonlat_rings):
    cells = island_cells(lonlat_rings)
    (px, pz), plaza, g, stage = stages_for(cells)
    pc = (px + 1, pz + 1)
    walk = Walk(cells, stage, plaza)

    # Two main paths across the shape.
    t1 = far_target(g, stage)
    path1 = road(plaza, t1, cells, set(plaza))
    d1 = (t1[0] - pc[0], t1[1] - pc[1])
    n1 = math.hypot(*d1) or 1
    t2 = far_target(g, stage, (d1[0] / n1, d1[1] / n1), pc)
    path2 = road(plaza, t2, cells, set(plaza) | set(path1)) if t2 else []
    paths = [c for c in path1 + path2 if c not in plaza]
    path_set = set(paths)
    used = set(plaza) | path_set
    lots = {}

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
                dist = math.hypot(x + w / 2 - pc[0], z + d / 2 - pc[1])
                # Prefer the lot's own land ring, so later lots do not eat early land.
                early = land_stage - min(stage[t] for t in tiles)
                cands.append((dist - (3 if touch else 0) + early * 12, x, z, w, d, tiles))
        cands.sort(key=lambda c: (c[0], c[1], c[2]))
        for _, x, z, w, d, tiles in cands[:400]:
            if walk.full_ok(tiles, tiles, land_stage):
                walk.blocked |= set(tiles)
                walk.lots.append((tiles, land_stage))
                used.update(tiles)
                lots[key] = [x, z, w, d]
                return True
        return False

    houses = []
    house_set = set()

    def add_houses(max_stage, limit):
        for c in sorted(cells, key=lambda c: (stage[c], g[c], c[0], c[1])):
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

    # House lots: centre outward, never touching another house, door kept free.
    add_houses(len(TIERS) - 1, MAX_HOUSES)
    houses.sort(key=lambda c: (stage[c], g[c], c[0], c[1]))

    # Trees: decoration on leftover tiles, off path edges and house doors, never cutting a path.
    trees = []
    for c in sorted(cells, key=lambda c: (stage[c], g[c], c[0], c[1])):
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

    # Camera: long side of the shape vertical on a portrait phone.
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
    for c in sorted(cells, key=lambda c: (stage[c], g[c], c[0], c[1])):
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
        "cameraAzimuth": round(azimuth, 4),
    }


def main(argv):
    force = "--force" in argv
    only = [a for a in argv if not a.startswith("--")]
    bounds = json.loads((DATA / "calgary_boundaries.json").read_text())["communities"]
    names = {r["code"]: r["name"] for r in csv.DictReader(open(DATA / "calgary_communities.csv"))}
    OUT.mkdir(parents=True, exist_ok=True)
    written = skipped = 0
    failed = []
    for code in sorted(bounds):
        if only and code not in only:
            continue
        path = OUT / f"{code}.json"
        if path.exists() and not force:
            skipped += 1
            continue
        try:
            plan = make_plan(code, names.get(code, code.title()), bounds[code])
        except RuntimeError as e:
            failed.append(str(e))
            continue
        path.write_text(json.dumps(plan, separators=(",", ":")))
        written += 1
    print(f"written {written}, kept {skipped}, failed {len(failed)}")
    for f in failed:
        print("  FAILED", f)
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
