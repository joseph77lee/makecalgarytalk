#!/usr/bin/env python3
"""
Builds supabase/data/community_features.json: the signature features (feature library,
requirement.md §7.9) of every residential community, at most MAX_FEATURES each, in priority order.

Suggestions come from OpenStreetMap (© OpenStreetMap contributors, ODbL) via the Overpass API;
only the derived mapping is stored (feature key + public place name), never OSM geometry.
community_features_override.csv (operator) then adds or removes features per community.
Features are symbolic: presence only, not real size or position (the island draws them on
spare lots of its stored plan).

Rules (all distances in metres, local flat projection):
  ctrain-station  a CTrain station inside the community or within 150 m of its boundary, only when
                  the island has no real track (plans with CTrain track draw the line and its
                  stations at their real position, island_plans.py)
  pond            a lake/pond of at least 2 ha within 250 m, and the island shows little real water
                  (fewer than 20 water tiles; real water inside the boundary is already drawn, §7.8)
  hill            a named hill/peak within 300 m, a park named ...Hill/Ridge/Bluff/Coulee/Escarpment
                  overlapping the community, or a community name containing hill/heights/ridge/mount/crest
  creek           a river, stream or canal running at least 250 m inside the community, only when the
                  island shows little real water (fewer than 20 water tiles, as for ponds)
  big-park        a park or nature reserve overlapping the community by at least 6 ha (not the
                  park already named as the hill)
  school          a school inside the community (no name shown)

Run: python3 -I supabase/data/build_features.py [--cache <file.json>]
(--cache reuses a saved Overpass answer, or saves it there on the first run.)
"""
import csv
import json
import math
import re
import sys
import urllib.parse
import urllib.request
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent.parent
PLANS = ROOT / 'frontend' / 'public' / 'islands'
OUT = HERE / 'community_features.json'
OVERRIDE = HERE / 'community_features_override.csv'
# Operating Red/Blue stations only (OSM also maps planned Green Line stations).
OPEN_STATIONS = set(json.loads((HERE / 'calgary_ctrain.json').read_text())['stations'])

FEATURES = ['ctrain-station', 'pond', 'hill', 'creek', 'big-park', 'school']  # priority order
MAX_FEATURES = 3
BBOX = (50.84, -114.32, 51.22, -113.85)  # south, west, north, east (Calgary)
LAT0 = 51.05
KX = math.cos(math.radians(LAT0)) * 111320
KY = 110540
HILL_NAME = re.compile(r'\b(hill|hills|ridge|bluff|bluffs|coulee|escarpment)\b', re.I)
HILL_COMMUNITY = re.compile(r'(hill|heights|ridge|mount|crest)', re.I)

QUERY = f"""
[out:json][timeout:180];
(
  nwr["railway"="station"]["station"="light_rail"]({','.join(map(str, BBOX))});
  nwr["railway"="station"]["network"="CTrain"]({','.join(map(str, BBOX))});
)->.stations;
.stations out center tags;
(
  way["natural"="water"]({','.join(map(str, BBOX))});
  relation["natural"="water"]({','.join(map(str, BBOX))});
)->.water;
.water out geom tags;
way["waterway"~"^(river|stream|canal)$"]({','.join(map(str, BBOX))});
out geom tags;
(
  way["leisure"~"^(park|nature_reserve)$"]({','.join(map(str, BBOX))});
  relation["leisure"~"^(park|nature_reserve)$"]({','.join(map(str, BBOX))});
)->.parks;
.parks out geom tags;
nwr["amenity"="school"]({','.join(map(str, BBOX))});
out center tags;
node["natural"~"^(peak|hill)$"]({','.join(map(str, BBOX))});
out center tags;
"""


def xy(lon, lat):
    return ((lon + 114.07) * KX, (lat - LAT0) * KY)


def ring_xy(ring):
    return [xy(lon, lat) for lon, lat in ring]


def area(ring):
    return abs(sum(ring[i][0] * ring[i - 1][1] - ring[i - 1][0] * ring[i][1] for i in range(len(ring)))) / 2


def bbox(points):
    xs = [p[0] for p in points]
    ys = [p[1] for p in points]
    return min(xs), min(ys), max(xs), max(ys)


def grow(b, m):
    return b[0] - m, b[1] - m, b[2] + m, b[3] + m


def overlaps(a, b):
    return not (a[2] < b[0] or b[2] < a[0] or a[3] < b[1] or b[3] < a[1])


def inside(p, ring):
    x, y = p
    hit = False
    j = len(ring) - 1
    for i in range(len(ring)):
        xi, yi = ring[i]
        xj, yj = ring[j]
        if (yi > y) != (yj > y) and x < (xj - xi) * (y - yi) / (yj - yi) + xi:
            hit = not hit
        j = i
    return hit


def seg_dist(p, a, b):
    ax, ay = a
    bx, by = b
    dx, dy = bx - ax, by - ay
    L = dx * dx + dy * dy
    t = 0 if L == 0 else max(0, min(1, ((p[0] - ax) * dx + (p[1] - ay) * dy) / L))
    return math.hypot(p[0] - ax - t * dx, p[1] - ay - t * dy)


def dist_to_ring(p, ring):
    """0 inside, else the distance to the ring's edge."""
    if inside(p, ring):
        return 0.0
    return min(seg_dist(p, ring[i - 1], ring[i]) for i in range(len(ring)))


def stitch(ways):
    """Joins way coordinate lists that share end points into closed rings."""
    pending = [list(w) for w in ways if len(w) >= 2]
    rings = []
    while pending:
        cur = pending.pop()
        changed = True
        while cur[0] != cur[-1] and changed:
            changed = False
            for i, w in enumerate(pending):
                if w[0] == cur[-1]:
                    cur += w[1:]
                elif w[-1] == cur[-1]:
                    cur += w[::-1][1:]
                elif w[-1] == cur[0]:
                    cur = w[:-1] + cur
                elif w[0] == cur[0]:
                    cur = w[::-1][:-1] + cur
                else:
                    continue
                pending.pop(i)
                changed = True
                break
        if cur[0] == cur[-1] and len(cur) >= 4:
            rings.append(cur)
    return rings


def polygons(el):
    """Outer rings (projected) of a way or multipolygon relation from an `out geom` answer."""
    if el['type'] == 'way':
        g = [(p['lon'], p['lat']) for p in el.get('geometry', [])]
        return [ring_xy(g)] if len(g) >= 4 and g[0] == g[-1] else []
    outers = [[(p['lon'], p['lat']) for p in m.get('geometry', [])] for m in el.get('members', []) if m.get('role') in ('outer', '')]
    return [ring_xy(r) for r in stitch(outers)]


def centre(el):
    if 'lat' in el:
        return xy(el['lon'], el['lat'])
    if 'center' in el:
        return xy(el['center']['lon'], el['center']['lat'])
    return None


def fetch(cache):
    if cache and cache.exists():
        return json.loads(cache.read_text())
    req = urllib.request.Request(
        'https://overpass-api.de/api/interpreter',
        data=urllib.parse.urlencode({'data': QUERY}).encode(),
        headers={'User-Agent': 'MakeCalgaryTalk-data-build/1.0'},
    )
    with urllib.request.urlopen(req, timeout=300) as r:
        data = json.loads(r.read())
    if cache:
        cache.write_text(json.dumps(data))
    return data


def classify(data):
    stations, water, rivers, parks, schools, peaks = [], [], [], [], [], []
    for el in data['elements']:
        t = el.get('tags', {})
        name = t.get('name')
        if t.get('railway') == 'station':
            c = centre(el)
            if c:
                stations.append((c, name))
        elif t.get('natural') == 'water' and t.get('water') not in ('river', 'stream', 'canal', 'wastewater'):
            for r in polygons(el):
                if area(r) >= 20000:
                    water.append((r, bbox(r), name))
        elif t.get('waterway') in ('river', 'stream', 'canal'):
            line = ring_xy([(p['lon'], p['lat']) for p in el.get('geometry', [])])
            if len(line) >= 2:
                rivers.append((line, bbox(line), name))
        elif t.get('leisure') in ('park', 'nature_reserve'):
            for r in polygons(el):
                if area(r) >= 30000:
                    parks.append((r, bbox(r), name))
        elif t.get('amenity') == 'school':
            c = centre(el)
            if c:
                schools.append((c, name))
        elif t.get('natural') in ('peak', 'hill') and name and centre(el):
            peaks.append((centre(el), name))
    return stations, water, rivers, parks, schools, peaks


def samples(ring, step=40.0):
    b = bbox(ring)
    out = []
    y = b[1] + step / 2
    while y < b[3]:
        x = b[0] + step / 2
        while x < b[2]:
            if inside((x, y), ring):
                out.append((x, y))
            x += step
        y += step
    return out, step * step


def along(line, step=25.0):
    for i in range(1, len(line)):
        (ax, ay), (bx, by) = line[i - 1], line[i]
        n = max(1, int(math.hypot(bx - ax, by - ay) // step))
        for k in range(n):
            yield (ax + (bx - ax) * k / n, ay + (by - ay) * k / n), math.hypot(bx - ax, by - ay) / n


def plan_of(code):
    p = PLANS / f'{code}.json'
    return json.loads(p.read_text()) if p.exists() else {}


def water_tiles(code):
    return len(plan_of(code).get('water', [])) // 2


def has_track(code):
    return bool(plan_of(code).get('rail'))


def suggest(code, name, ring, layers):
    stations, water, rivers, parks, schools, peaks = layers
    b = bbox(ring)
    found = {}

    def near(p, m):
        return overlaps((p[0], p[1], p[0], p[1]), grow(b, m)) and dist_to_ring(p, ring) <= m

    st = [n for p, n in stations if near(p, 150) and n in OPEN_STATIONS]
    if st and not has_track(code):
        found['ctrain-station'] = st[0]

    if water_tiles(code) < 20:
        best = None
        for r, rb, n in water:
            if not overlaps(rb, grow(b, 250)):
                continue
            if any(dist_to_ring(v, ring) <= 250 for v in r[:: max(1, len(r) // 60)]):
                if best is None or area(r) > best[0]:
                    best = (area(r), n)
        if best:
            found['pond'] = best[1]

    pts, cell = samples(ring)
    park_overlap = []
    for r, rb, n in parks:
        if not overlaps(rb, b):
            continue
        a = sum(cell for p in pts if overlaps((p[0], p[1], p[0], p[1]), rb) and inside(p, r))
        if a > 0:
            park_overlap.append((a, n))
    park_overlap.sort(key=lambda x: -x[0])

    hill = [n for p, n in peaks if near(p, 300)]
    hill += [n for a, n in park_overlap if n and HILL_NAME.search(n) and a >= 20000]
    if hill:
        found['hill'] = hill[0]
    elif HILL_COMMUNITY.search(name):
        found['hill'] = None

    best_river = None
    for line, lb, n in (rivers if water_tiles(code) < 20 else []):
        if not overlaps(lb, b):
            continue
        length = sum(d for p, d in along(line) if inside(p, ring))
        if length >= 250 and (best_river is None or length > best_river[0]):
            best_river = (length, n)
    if best_river:
        found['creek'] = best_river[1]

    big = [(a, n) for a, n in park_overlap if a >= 60000 and not (n and n == found.get('hill'))]
    if big:
        found['big-park'] = big[0][1]

    sc = [n for p, n in schools if overlaps((p[0], p[1], p[0], p[1]), b) and inside(p, ring)]
    if sc:
        found['school'] = None  # school names are long and some are private; the label says "School"
    return found


def clean(name):
    return name.strip() if name and re.search(r'[A-Za-z]', name) else None


def apply_overrides(result):
    if not OVERRIDE.exists():
        return
    with OVERRIDE.open() as f:
        for row in csv.DictReader(r for r in f if not r.startswith('#')):
            code, action, key = row['code'].strip(), row['action'].strip(), row['feature'].strip()
            if key not in FEATURES or action not in ('add', 'remove') or code not in result:
                raise SystemExit(f'bad override row: {row}')
            if action == 'remove':
                result[code].pop(key, None)
            else:
                result[code][key] = (row.get('name') or '').strip() or None
                result[code].setdefault('__forced', set()).add(key)


def main():
    cache = None
    if '--cache' in sys.argv:
        cache = Path(sys.argv[sys.argv.index('--cache') + 1])
    names = {}
    with (HERE / 'calgary_communities.csv').open() as f:
        for row in csv.DictReader(f):
            names[row['code']] = row['name']
    boundaries = json.loads((HERE / 'calgary_boundaries.json').read_text())['communities']
    layers = classify(fetch(cache))
    result = {}
    for code, rings in sorted(boundaries.items()):
        ring = max((ring_xy(r) for r in rings), key=area)
        result[code] = suggest(code, names.get(code, code), ring, layers)
    apply_overrides(result)
    out = {}
    for code, found in result.items():
        forced = found.pop('__forced', set())
        keys = [k for k in FEATURES if k in found]
        # Operator additions always stay; the rest fill up to MAX_FEATURES by priority.
        chosen = [k for k in keys if k in forced] + [k for k in keys if k not in forced]
        chosen = sorted(chosen[:MAX_FEATURES], key=FEATURES.index)
        out[code] = [{'key': k, 'name': clean(found[k])} for k in chosen]
    doc = {
        'about': 'Signature features per residential community (requirement.md 7.9), generated by build_features.py '
        'from OpenStreetMap (c) OpenStreetMap contributors, ODbL, plus community_features_override.csv. '
        'Symbolic: presence only. Keys in priority order; at most 3 per community.',
        'features': FEATURES,
        'communities': out,
    }
    OUT.write_text(json.dumps(doc, indent=1, ensure_ascii=False) + '\n')
    counts = {k: sum(1 for v in out.values() if any(f['key'] == k for f in v)) for k in FEATURES}
    print(f'{len(out)} communities, none: {sum(1 for v in out.values() if not v)}, per feature: {counts}')


if __name__ == '__main__':
    main()
