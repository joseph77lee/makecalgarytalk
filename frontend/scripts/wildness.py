"""How close each community is to the city edge, for wildlife on the islands (requirement.md v1.41 §7.3).

Reads the World Map shapes (public/worldmap/calgary.json, metres, label point per community) and
writes src/modules/island-view/plan/wildness.json: code -> 0..1, where 0 = within 4 km of the
city centre (Downtown Commercial Core label) and 1 = 18 km or more away. Rerun when the World Map
data changes:  python3 -I scripts/wildness.py  (from frontend/)
"""
import json
import math
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SHAPES = ROOT / 'public' / 'worldmap' / 'calgary.json'
OUT = ROOT / 'src' / 'modules' / 'island-view' / 'plan' / 'wildness.json'
CENTRE_CODE = 'DNC'
NEAR_M = 4000
FAR_M = 18000


def main() -> None:
    data = json.loads(SHAPES.read_text())
    labels = {c['code']: c['label'] for c in data['communities']}
    cx, cy = labels[CENTRE_CODE]
    out = {}
    for code, (x, y) in sorted(labels.items()):
        d = math.hypot(x - cx, y - cy)
        out[code] = round(min(1.0, max(0.0, (d - NEAR_M) / (FAR_M - NEAR_M))), 2)
    OUT.write_text(json.dumps(out, separators=(',', ':')) + '\n')
    print(f'{len(out)} communities -> {OUT.relative_to(ROOT)}')


if __name__ == '__main__':
    main()
