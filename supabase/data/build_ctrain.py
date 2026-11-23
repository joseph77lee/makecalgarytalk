#!/usr/bin/env python3
"""
Builds supabase/data/calgary_ctrain.json: the CTrain Red and Blue lines (one track centreline per
line, in stop order) and their stations, from OpenStreetMap route relations
(© OpenStreetMap contributors, ODbL). Used by the island plan generator (track and stations at
their real position, requirement.md 7.9) and the World Map (lines and stations).

Run: python3 -I supabase/data/build_ctrain.py [--cache <file.json>]
"""
import json
import math
import sys
import time
import urllib.parse
import urllib.request
from pathlib import Path

HERE = Path(__file__).resolve().parent
OUT = HERE / 'calgary_ctrain.json'
BBOX = '50.84,-114.32,51.22,-113.85'
QUERY = f'[out:json][timeout:150];relation["route"="light_rail"]["network"="CTrain"]({BBOX});out geom;'
LINES = {'201': ('Red', '#d94a4a'), '202': ('Blue', '#3f7fd6')}
SIMPLIFY_M = 8.0


def fetch(cache):
    if cache and cache.exists():
        return json.loads(cache.read_text())
    wait = 10
    for attempt in range(6):
        try:
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
        except Exception as e:  # server busy: back off and retry
            print(f'overpass attempt {attempt + 1} failed: {e}; retrying in {wait}s', file=sys.stderr)
            time.sleep(wait)
            wait *= 2
    raise SystemExit('Overpass API unavailable')


def xy(p):
    return (p[0] * math.cos(math.radians(51.05)) * 111320, p[1] * 110540)


def stitch(ways):
    """Joins ordered member ways into one line, flipping ways as needed."""
    line = []
    for w in ways:
        if not line:
            line = list(w)
            continue
        ends = [(0, False), (len(w) - 1, True)]
        # attach w to the end of line (flip w if its last point is the joint)
        d_head = min((math.dist(xy(line[-1]), xy(w[i])), flip) for i, flip in ends)
        d_tail = min((math.dist(xy(line[0]), xy(w[i])), flip) for i, flip in ends)
        if len(line) == len(ways[0]) and d_tail[0] < d_head[0]:
            line.reverse()  # the first way was stored backwards
            d_head = min((math.dist(xy(line[-1]), xy(w[i])), flip) for i, flip in ends)
        seg = w[::-1] if d_head[1] else w
        line += seg[1:] if math.dist(xy(line[-1]), xy(seg[0])) < 1 else seg
    return line


def simplify(points, tol):
    """Douglas–Peucker in metres."""
    if len(points) < 3:
        return points
    P = [xy(p) for p in points]
    keep = [False] * len(P)
    keep[0] = keep[-1] = True
    stack = [(0, len(P) - 1)]
    while stack:
        a, b = stack.pop()
        best, idx = 0.0, -1
        ax, ay = P[a]
        bx, by = P[b]
        L = math.hypot(bx - ax, by - ay) or 1e-9
        for i in range(a + 1, b):
            d = abs((bx - ax) * (ay - P[i][1]) - (ax - P[i][0]) * (by - ay)) / L
            if d > best:
                best, idx = d, i
        if best > tol:
            keep[idx] = True
            stack += [(a, idx), (idx, b)]
    return [p for p, k in zip(points, keep) if k]


def main():
    cache = Path(sys.argv[sys.argv.index('--cache') + 1]) if '--cache' in sys.argv else None
    data = fetch(cache)
    lines = []
    done = set()
    for rel in sorted(data['elements'], key=lambda r: r['id']):
        ref = rel.get('tags', {}).get('ref')
        if ref not in LINES or ref in done:
            continue  # one direction per line is enough for the track and the stop order
        done.add(ref)
        name, colour = LINES[ref]
        ways = [[(p['lon'], p['lat']) for p in m['geometry']] for m in rel['members']
                if m['type'] == 'way' and m['role'] in ('', 'forward', 'backward') and m.get('geometry')]
        track = simplify(stitch(ways), SIMPLIFY_M)
        stops = []
        for m in rel['members']:
            if m['type'] == 'node' and m['role'].startswith('stop'):
                stops.append((m['lon'], m['lat'], m['ref']))
        # Stop nodes carry no tags in `out geom`; they are named after the nearest station below.
        order = [(lon, lat) for lon, lat, _ in stops]
        lines.append({'line': name, 'colour': colour, 'track': [[round(a, 5), round(b, 5)] for a, b in track], 'stops': order})
    return lines


def station_names(cache):
    q = f'[out:json][timeout:60];nwr["railway"="station"]["network"="CTrain"]({BBOX});out center tags;'
    if cache and cache.exists():
        return json.loads(cache.read_text())
    req = urllib.request.Request('https://overpass-api.de/api/interpreter', data=urllib.parse.urlencode({'data': q}).encode(),
                                 headers={'User-Agent': 'MakeCalgaryTalk-data-build/1.0'})
    with urllib.request.urlopen(req, timeout=120) as r:
        data = json.loads(r.read())
    if cache:
        cache.write_text(json.dumps(data))
    return data


if __name__ == '__main__':
    lines = main()
    scache = None
    if '--cache' in sys.argv:
        c = Path(sys.argv[sys.argv.index('--cache') + 1])
        scache = c.with_name(c.stem + '_stations.json')
    named = []
    for el in station_names(scache)['elements']:
        c = el.get('center') or ({'lon': el['lon'], 'lat': el['lat']} if 'lon' in el else None)
        if c and el.get('tags', {}).get('name'):
            named.append((c['lon'], c['lat'], el['tags']['name']))
    out_lines = []
    stations = {}
    for ln in lines:
        seq = []
        for lon, lat in ln['stops']:
            best = min(named, key=lambda s: math.dist(xy((lon, lat)), xy((s[0], s[1]))))
            if math.dist(xy((lon, lat)), xy((best[0], best[1]))) > 400:
                continue
            if not seq or seq[-1] != best[2]:
                seq.append(best[2])
            stations.setdefault(best[2], [round(best[0], 5), round(best[1], 5)])
        out_lines.append({'line': ln['line'], 'colour': ln['colour'], 'track': ln['track'], 'stations': seq})
    doc = {
        'about': 'CTrain Red and Blue lines (one track centreline per line, simplified to 8 m) and stations in stop order, '
        'from OpenStreetMap route relations, (c) OpenStreetMap contributors, ODbL. Generated by build_ctrain.py.',
        'lines': out_lines,
        'stations': dict(sorted(stations.items())),
    }
    OUT.write_text(json.dumps(doc, separators=(',', ':')) + '\n')
    for ln in out_lines:
        L = sum(math.dist(xy(ln['track'][i - 1]), xy(ln['track'][i])) for i in range(1, len(ln['track'])))
        print(f"{ln['line']}: {len(ln['track'])} points, {L / 1000:.1f} km, {len(ln['stations'])} stations: {ln['stations'][0]} … {ln['stations'][-1]}")
    print(f'{len(stations)} stations, {OUT.stat().st_size // 1024} KB')
