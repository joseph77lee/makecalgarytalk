#!/usr/bin/env python3
"""
Builds supabase/data/calgary_water.json: water bodies (lakes, ponds, wetlands, water courses)
that overlap residential communities, from City of Calgary Open Data "Hydrology" (47bt-eefd),
Open Government Licence – City of Calgary. Each piece is stored once, its outline simplified
to 5 m (an island tile is 60–80 m); pieces under 800 m² are dropped. The island plan generator
picks the pieces overlapping each community. Run: python3 -I supabase/data/build_water.py
"""
import json
import math
import urllib.request
from pathlib import Path

HERE = Path(__file__).resolve().parent
MIN_AREA = 800.0


def area(ring):
    pts = [(lon * math.cos(math.radians(51.05)) * 111320, lat * 110540) for lon, lat in ring]
    return abs(sum(pts[i][0] * pts[i - 1][1] - pts[i - 1][0] * pts[i][1] for i in range(len(pts)))) / 2


def bbox(ring):
    xs = [p[0] for p in ring]
    ys = [p[1] for p in ring]
    return min(xs), min(ys), max(xs), max(ys)


def overlaps(a, b):
    return not (a[2] < b[0] or b[2] < a[0] or a[3] < b[1] or b[3] < a[1])


TOLERANCE_M = 5.0
KX = math.cos(math.radians(51.05)) * 111320
KY = 110540


def simplify(ring):
    """Douglas-Peucker in metres."""
    pts = [(x * KX, y * KY) for x, y in ring]

    def rec(a, b):
        (x1, y1), (x2, y2) = pts[a], pts[b]
        dx, dy = x2 - x1, y2 - y1
        n = math.hypot(dx, dy) or 1e-9
        best, idx = 0.0, -1
        for i in range(a + 1, b):
            d = abs(dy * pts[i][0] - dx * pts[i][1] + x2 * y1 - y2 * x1) / n
            if d > best:
                best, idx = d, i
        if best > TOLERANCE_M:
            return rec(a, idx)[:-1] + rec(idx, b)
        return [a, b]

    if len(pts) <= 4:
        return ring
    # A closed ring starts and ends on the same point: split it at the farthest point first.
    far = max(range(len(pts)), key=lambda i: math.hypot(pts[i][0] - pts[0][0], pts[i][1] - pts[0][1]))
    keep = rec(0, far)[:-1] + rec(far, len(pts) - 1)
    return [ring[i] for i in keep] if len(keep) >= 4 else ring


def main():
    with urllib.request.urlopen("https://data.calgary.ca/resource/47bt-eefd.json?$limit=50000", timeout=120) as r:
        features = json.load(r)
    communities = json.loads((HERE / "calgary_boundaries.json").read_text())["communities"]
    boxes = [bbox(rings[0]) for rings in communities.values()]
    out = []
    for f in features:
        g = f.get("multipolygon")
        if not g:
            continue
        for poly in g["coordinates"]:
            ring = poly[0]
            if area(ring) < MIN_AREA or not any(overlaps(bbox(ring), cb) for cb in boxes):
                continue
            out.append({
                "type": f.get("feature_type"),
                "name": f.get("lake_name"),
                "ring": [[round(x, 5), round(y, 5)] for x, y in simplify(ring)],
            })
    meta = "City of Calgary Open Data: Hydrology (47bt-eefd), Open Government Licence - City of Calgary. Fetched 2026-11-19. Pieces under 800 m2 dropped."
    (HERE / "calgary_water.json").write_text(json.dumps({"about": meta, "water": out}, separators=(",", ":")))
    print(len(out), "water pieces,", sum(len(w["ring"]) for w in out), "points")


if __name__ == "__main__":
    main()
