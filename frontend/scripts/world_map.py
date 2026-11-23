#!/usr/bin/env python3
"""
Writes the World Map shapes (requirement.md v1.29 §9) from supabase/data/calgary_boundaries.json:
residential community outlines projected to metres (x east, y south), simplified for drawing, with
each community's area and a label point well inside it.

  python3 -I frontend/scripts/world_map.py

Output: frontend/public/worldmap/calgary.json (static, served from the CDN).
"""
import csv
import json
import math
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "supabase/data/calgary_boundaries.json"
NAMES = ROOT / "supabase/data/calgary_communities.csv"
OUT = ROOT / "frontend/public/worldmap/calgary.json"
TOLERANCE_M = 20


def simplify(points, tol):
    """Douglas–Peucker on a closed ring (first point == last point): split at the point farthest
    from the start, simplify both halves as open lines."""
    if len(points) < 5:
        return points
    x0, y0 = points[0]
    m = max(range(len(points)), key=lambda i: math.hypot(points[i][0] - x0, points[i][1] - y0))
    out = simplify_open(points[: m + 1], tol)[:-1] + simplify_open(points[m:], tol)
    return out if len(out) >= 4 else points


def simplify_open(points, tol):
    """Douglas–Peucker on an open polyline (keeps both ends)."""
    if len(points) < 3:
        return points
    keep = [False] * len(points)
    keep[0] = keep[-1] = True
    stack = [(0, len(points) - 1)]
    while stack:
        a, b = stack.pop()
        ax, ay = points[a]
        bx, by = points[b]
        dx, dy = bx - ax, by - ay
        norm = math.hypot(dx, dy) or 1e-9
        best, idx = 0.0, None
        for i in range(a + 1, b):
            px, py = points[i]
            d = abs(dy * (px - ax) - dx * (py - ay)) / norm
            if d > best:
                best, idx = d, i
        if idx is not None and best > tol:
            keep[idx] = True
            stack += [(a, idx), (idx, b)]
    return [p for p, k in zip(points, keep) if k]


def area(ring):
    s = 0.0
    for (x1, y1), (x2, y2) in zip(ring, ring[1:] + ring[:1]):
        s += x1 * y2 - x2 * y1
    return abs(s) / 2


def inside(ring, x, y):
    hit = False
    j = len(ring) - 1
    for i in range(len(ring)):
        xi, yi = ring[i]
        xj, yj = ring[j]
        if (yi > y) != (yj > y) and x < (xj - xi) * (y - yi) / (yj - yi) + xi:
            hit = not hit
        j = i
    return hit


def edge_distance(ring, x, y):
    best = float("inf")
    for (x1, y1), (x2, y2) in zip(ring, ring[1:] + ring[:1]):
        dx, dy = x2 - x1, y2 - y1
        t = max(0.0, min(1.0, ((x - x1) * dx + (y - y1) * dy) / (dx * dx + dy * dy or 1e-9)))
        best = min(best, math.hypot(x - (x1 + t * dx), y - (y1 + t * dy)))
    return best


def label_point(ring):
    """Grid point inside the ring that is farthest from its edge."""
    xs = [p[0] for p in ring]
    ys = [p[1] for p in ring]
    best, at = -1.0, (sum(xs) / len(xs), sum(ys) / len(ys))
    n = 18
    for i in range(1, n):
        for j in range(1, n):
            x = min(xs) + (max(xs) - min(xs)) * i / n
            y = min(ys) + (max(ys) - min(ys)) * j / n
            if inside(ring, x, y):
                d = edge_distance(ring, x, y)
                if d > best:
                    best, at = d, (x, y)
    return [round(at[0]), round(at[1])]


def main():
    data = json.loads(SRC.read_text())["communities"]
    names = {r["code"]: r["name"] for r in csv.DictReader(NAMES.open())}
    all_pts = [p for rings in data.values() for ring in rings for p in ring]
    lon0 = sum(p[0] for p in all_pts) / len(all_pts)
    lat0 = sum(p[1] for p in all_pts) / len(all_pts)
    kx = 111320 * math.cos(math.radians(lat0))
    ky = 110540

    def proj(p):
        return (p[0] - lon0) * kx, (lat0 - p[1]) * ky

    communities = []
    minx = miny = float("inf")
    maxx = maxy = float("-inf")
    for code, rings in sorted(data.items()):
        out_rings = []
        total = 0.0
        biggest = None
        for ring in rings:
            pts = [proj(p) for p in ring]
            if pts[0] == pts[-1]:
                pts = pts[:-1]
            pts = simplify(pts + [pts[0]], TOLERANCE_M)[:-1]
            pts = [(round(x), round(y)) for x, y in pts]
            a = area(pts)
            total += a
            if biggest is None or a > area(biggest):
                biggest = pts
            out_rings.append([v for p in pts for v in p])
            for x, y in pts:
                minx, maxx, miny, maxy = min(minx, x), max(maxx, x), min(miny, y), max(maxy, y)
        communities.append({"code": code, "name": names.get(code, code), "area": round(total), "label": label_point(biggest), "rings": out_rings})
    for c in communities:
        c["label"] = [c["label"][0] - round(minx), c["label"][1] - round(miny)]
        c["rings"] = [[v - (round(minx) if i % 2 == 0 else round(miny)) for i, v in enumerate(r)] for r in c["rings"]]
    out = {
        "about": "Calgary residential community outlines in metres (x east, y south), simplified for the World Map. "
        "City of Calgary Open Data (Community District Boundaries), Open Government Licence - City of Calgary.",
        "width": round(maxx - minx),
        "height": round(maxy - miny),
        "communities": communities,
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(out, separators=(",", ":")))
    print(f"wrote {len(communities)} communities, {OUT.stat().st_size // 1024} KB, {out['width']}x{out['height']} m")


if __name__ == "__main__":
    main()
