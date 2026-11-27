import { describe, expect, it } from 'vitest';
import { SECRET_TITLE, bandFor, buildSkillTree, conditionLines, missingChips, nextBandPlaces, nodePicture, type ServerBuilding } from './skillTree';

const b = (key: string, track: ServerBuilding['track'], step: number, status: ServerBuilding['status'], extra: Partial<ServerBuilding> = {}): ServerBuilding => ({
  key,
  name: key,
  track,
  step,
  stage: 0,
  landmark_order: null,
  tiles: [2, 2],
  site: 'park',
  status,
  level: 1,
  progress: status === 'built' ? 1 : 0,
  remaining: status === 'locked' ? { residents: 0, streak_days: 0, land_residents: 0, requires: [] } : null,
  ...extra,
});

/** A lake community's map with the real keys of supabase/data/build_map.json. */
function lakeMap(): ServerBuilding[] {
  return [
    b('welcome-sign', 'root', 0, 'built'),
    b('fire-pit', 'community', 1, 'built'),
    b('warming-hut', 'community', 2, 'building', { progress: 0.4 }),
    b('skating-rink', 'community', 3, 'locked', { remaining: { residents: 1, streak_days: 0, land_residents: 0, requires: ['warming-hut'] } }),
    b('community-hall', 'community', 4, 'locked'),
    b('neighbourhood-park', 'community', 5, 'locked'),
    b('place.lake.sailing-dock', 'persona', 1, 'opened'),
    b('place.lake.boardwalk', 'persona', 2, 'locked'),
    b('place.lake.beach-house', 'persona', 3, 'locked'),
    b('place.lake.lighthouse', 'persona', 4, 'locked'),
    b('landmark-2', 'persona', 5, 'locked', { landmark_order: 2 }),
    b('landmark-3', 'persona', 6, 'locked', { landmark_order: 3 }),
    b('playground', 'nature', 1, 'built'),
    b('sledding-hill', 'nature', 2, 'locked'),
    b('dog-park', 'nature', 3, 'locked'),
    b('community-garden', 'nature', 4, 'locked'),
    b('pathway-lights', 'nature', 5, 'locked'),
    ...Array.from({ length: 10 }, (_, i) => b(`decoration-${i + 1}`, 'nature', 6 + i, 'locked')),
  ];
}

describe('skill tree bands (requirement.md v1.48 §7.6a)', () => {
  it('puts a resident count in the largest band at or below it', () => {
    expect(bandFor(0)).toBe(1);
    expect(bandFor(1)).toBe(1);
    expect(bandFor(2)).toBe(1);
    expect(bandFor(3)).toBe(3);
    expect(bandFor(10)).toBe(6);
    expect(bandFor(20)).toBe(11);
    expect(bandFor(51)).toBe(51);
    expect(bandFor(500)).toBe(51);
  });

  it('places steps in the bands of their resident conditions, lane by lane, top to bottom', () => {
    const t = buildSkillTree(lakeMap(), 2);
    expect(t.root?.key).toBe('welcome-sign');
    const where = (key: string) => t.bands.find((band) => Object.values(band.lanes).some((l) => l.some((n) => n.key === key)))?.residents;
    expect(where('fire-pit')).toBe(1);
    expect(where('warming-hut')).toBe(1); // streak only
    expect(where('skating-rink')).toBe(3);
    expect(where('community-hall')).toBe(6);
    expect(where('neighbourhood-park')).toBe(6); // 10 neighbours
    expect(where('place.lake.lighthouse')).toBe(11); // the persona landmark
    expect(where('landmark-2')).toBe(26);
    expect(where('landmark-3')).toBe(51);
    expect(where('decoration-1')).toBe(11); // nature step 6: 20 neighbours; the one "Decorations" node sits there
  });

  it('never lists a lane step in a band above an earlier step of the same lane', () => {
    const t = buildSkillTree(lakeMap(), 0);
    for (const lane of ['community', 'persona', 'nature'] as const) {
      const steps = t.bands.flatMap((band) => band.lanes[lane].map((n) => n.step));
      expect(steps).toEqual([...steps].sort((x, y) => x - y));
    }
  });

  it('marks reached bands and how many neighbours the next one needs', () => {
    const t = buildSkillTree(lakeMap(), 4);
    expect(t.bands.filter((x) => x.reached).map((x) => x.residents)).toEqual([1, 3]);
    expect(t.nextBand).toEqual({ residents: 6, more: 2 });
    expect(buildSkillTree(lakeMap(), 51).nextBand).toBeNull();
    expect(buildSkillTree(lakeMap(), 0).nextBand).toEqual({ residents: 1, more: 1 });
  });
});

describe('skill tree nodes', () => {
  it('maps server statuses to node states and keeps the server progress', () => {
    const t = buildSkillTree(lakeMap(), 2);
    const all = t.bands.flatMap((x) => Object.values(x.lanes).flat());
    const byKey = Object.fromEntries(all.map((n) => [n.key, n]));
    expect(byKey['fire-pit']!.state).toBe('built');
    expect(byKey['warming-hut']!.state).toBe('building');
    expect(byKey['warming-hut']!.progress).toBe(0.4);
    expect(byKey['place.lake.sailing-dock']!.state).toBe('ready');
    expect(byKey['skating-rink']!.state).toBe('locked');
  });

  it('makes the persona landmarks gold, and nothing else', () => {
    const t = buildSkillTree(lakeMap(), 2);
    const gold = t.bands.flatMap((x) => Object.values(x.lanes).flat()).filter((n) => n.landmark).map((n) => n.key);
    expect(gold).toEqual(['place.lake.lighthouse', 'landmark-2', 'landmark-3']);
  });

  it('draws the endless decorations as one node, placed by the next one to build', () => {
    const t = buildSkillTree(lakeMap(), 2);
    const deco = t.bands.flatMap((x) => x.lanes.nature).filter((n) => n.key.startsWith('decoration-'));
    expect(deco).toHaveLength(1);
    expect(deco[0]).toMatchObject({ key: 'decoration-1', title: 'Decorations (10)', group: { built: 0, total: 10 } });
    const map = lakeMap().map((x) => (['decoration-1', 'decoration-2', 'decoration-3'].includes(x.key) ? { ...x, status: 'built' as const, remaining: null } : x));
    const d2 = buildSkillTree(map, 2).bands.flatMap((x) => x.lanes.nature).filter((n) => n.group);
    expect(d2).toHaveLength(1);
    expect(d2[0]).toMatchObject({ key: 'decoration-4', group: { built: 3, total: 10 } });
    const all = lakeMap().map((x) => ({ ...x, status: 'built' as const, remaining: null }));
    expect(buildSkillTree(all, 60).bands.flatMap((x) => x.lanes.nature).find((n) => n.group)).toMatchObject({ state: 'built', group: { built: 10, total: 10 } });
  });

  it('keeps the 2nd and 3rd landmarks a secret until they are ready to build (v1.53)', () => {
    const t = buildSkillTree(lakeMap(), 2);
    const persona = t.bands.flatMap((x) => x.lanes.persona);
    expect(persona.find((n) => n.key === 'landmark-2')).toMatchObject({ secret: true, title: SECRET_TITLE });
    expect(persona.find((n) => n.key === 'place.lake.lighthouse')).toMatchObject({ secret: false }); // the signature landmark keeps its name
    const opened = lakeMap().map((x) => (x.key === 'landmark-2' ? { ...x, status: 'opened' as const, remaining: null } : x));
    expect(buildSkillTree(opened, 30).bands.flatMap((x) => x.lanes.persona).find((n) => n.key === 'landmark-2')).toMatchObject({ secret: false, title: 'landmark-2' });
  });

  it('names the next band\'s places for the banner', () => {
    expect(nextBandPlaces(buildSkillTree(lakeMap(), 2))).toEqual({ residents: 3, names: ['skating-rink', 'place.lake.beach-house', 'dog-park'] });
    const all = lakeMap().map((x) => ({ ...x, status: 'built' as const, remaining: null }));
    expect(nextBandPlaces(buildSkillTree(all, 60))).toBeNull();
  });

  it('counts completion without the endless decorations; an empty map is 0%', () => {
    // built: welcome-sign, fire-pit, playground = 3 of 17
    expect(buildSkillTree(lakeMap(), 2).percent).toBe(Math.round((3 / 17) * 100));
    expect(buildSkillTree([], 0).percent).toBe(0);
    const allBuilt = lakeMap().map((x) => ({ ...x, status: 'built' as const, remaining: null }));
    expect(buildSkillTree(allBuilt, 60).percent).toBe(100);
  });

  it('lists what a locked node is missing as chips, most important first', () => {
    const t = buildSkillTree(
      [b('skating-rink', 'community', 3, 'locked', { remaining: { residents: 2, streak_days: 5, land_residents: 4, requires: ['warming-hut'] } })],
      1,
    );
    const n = t.bands[0]!.lanes.community[0]!;
    expect(missingChips(n)).toEqual(['🔒 previous step', '👥 2', '🔥 5', '🗺️ 4']);
    expect(missingChips({ ...n, missing: null })).toEqual([]);
  });

  it('writes each condition with its progress for the node detail', () => {
    const t = buildSkillTree(
      [b('community-hall', 'community', 4, 'locked', { remaining: { residents: 2, streak_days: 0, land_residents: 1, requires: ['skating-rink'] } })],
      4,
    );
    const n = t.bands[0]!.lanes.community[0]!;
    const lines = conditionLines(n, { residents: 4, streakDays: 9 }, (k) => (k === 'skating-rink' ? 'Skating rink' : k));
    expect(lines).toEqual([
      { icon: '🔒', text: 'Build the Skating rink first', met: false },
      { icon: '👥', text: '4 / 6 neighbours', met: false },
      { icon: '🔥', text: '7 / 7 streak days', met: true },
      { icon: '🗺️', text: 'Its land rises with 1 more neighbour', met: false },
    ]);
    // a built step shows every condition as met
    const built = conditionLines({ ...n, state: 'built', missing: null }, { residents: 1, streakDays: 0 }, (k) => k);
    expect(built.every((l) => l.met)).toBe(true);
  });
});

describe('node pictures', () => {
  it('the hall and park show the community\'s persona design; other places one picture', () => {
    expect(nodePicture('community-hall', 'hill_view')).toBe('/places/community-hall.hill-view.png');
    expect(nodePicture('neighbourhood-park', 'lake')).toBe('/places/neighbourhood-park.lake.png');
    expect(nodePicture('community-hall', null)).toBe('/places/community-hall.png');
    expect(nodePicture('fire-pit', 'lake')).toBe('/places/fire-pit.png');
  });
});
