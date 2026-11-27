// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { BuildMap } from './BuildMap';

const community = {
  id: 'c1',
  code: 'VAR',
  name: 'Varsity',
  persona: 'lake',
  residents: 2,
  land_stage: 0,
  settled: true,
  vitality: 70,
  mini_villagers: 3,
  next_land_residents: 1,
} as Parameters<typeof BuildMap>[0]['community'];

afterEach(cleanup);

const step = (key: string, name: string, track: 'root' | 'community' | 'persona' | 'nature', n: number, status: 'locked' | 'opened' | 'building' | 'built', remaining: { residents: number; streak_days: number; land_residents: number; requires: string[] } | null = null) => ({
  key,
  name,
  track,
  step: n,
  stage: 0,
  landmark_order: null,
  tiles: [2, 2] as [number, number],
  site: 'plaza',
  status,
  level: 1,
  progress: status === 'built' ? 1 : status === 'building' ? 0.5 : 0,
  remaining,
});

const MAP = [
  step('welcome-sign', 'Welcome sign', 'root', 0, 'built'),
  step('fire-pit', 'Fire pit', 'community', 1, 'building'),
  step('playground', 'Playground', 'nature', 1, 'opened'),
  step('skating-rink', 'Skating rink', 'community', 3, 'locked', { residents: 1, streak_days: 0, land_residents: 0, requires: ['fire-pit'] }),
];

describe('build map as a skill tree (requirement.md v1.48 §7.6a)', () => {
  it('draws the root, the bands and every node with its state', () => {
    render(<BuildMap community={community} streakDays={4} buildings={MAP} onClose={() => {}} />);
    expect(screen.getByRole('button', { name: 'Welcome sign: Built' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Fire pit: Under construction' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Playground: Ready to build' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Skating rink: Locked' })).toBeTruthy();
    expect(screen.getByText('👥 3 neighbours')).toBeTruthy();
    expect(screen.getByText(/1 more neighbour$/)).toBeTruthy();
    expect(screen.getByText('👥 1')).toBeTruthy(); // missing chip on the locked node
  });

  it('offers "Help build it today" on a construction to residents, never to visitors', () => {
    const helped: string[] = [];
    const { unmount } = render(<BuildMap community={community} streakDays={4} buildings={MAP} onClose={() => {}} onHelp={(k) => helped.push(k)} />);
    fireEvent.click(screen.getByRole('button', { name: 'Fire pit: Under construction' }));
    fireEvent.click(screen.getByRole('button', { name: 'Help build it today' }));
    expect(helped).toEqual(['fire-pit']);
    unmount();

    render(<BuildMap community={community} streakDays={4} buildings={MAP} onClose={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: 'Fire pit: Under construction' }));
    expect(screen.queryByRole('button', { name: 'Help build it today' })).toBeNull();
  });

  it('shows a locked node\'s conditions and no "See it on the island" (locked places are not drawn)', () => {
    render(<BuildMap community={community} streakDays={4} buildings={MAP} onClose={() => {}} onSeeOnIsland={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: 'Skating rink: Locked' }));
    expect(screen.getByText('Build the Fire pit first')).toBeTruthy();
    expect(screen.getByText('2 / 3 neighbours')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'See it on the island' })).toBeNull();
  });
});

describe('build map banner (requirement.md v1.53 §7.6a)', () => {
  it('invites to build the community together, with its persona and the next band\'s places by name', () => {
    render(<BuildMap community={community} streakDays={4} buildings={MAP} onClose={() => {}} />);
    expect(screen.getByText("Let's build Varsity together")).toBeTruthy();
    expect(screen.getByText('🛶 Lake life')).toBeTruthy();
    expect(screen.getByText(/Next at 3 neighbours:/)).toBeTruthy();
    expect(screen.getByText(/Next at 3 neighbours:/).textContent).toContain('Skating rink');
  });

  it('shows no finished-island picture and no "See a finished example"', () => {
    const { container } = render(<BuildMap community={community} streakDays={4} buildings={MAP} onClose={() => {}} />);
    expect(container.querySelector('img[src*="/islands/finished/"]')).toBeNull();
    expect(screen.queryByText(/finished example/i)).toBeNull();
    expect(screen.queryByText(/Coming at/)).toBeNull();
  });

  it('keeps the 2nd/3rd landmarks a secret and draws the decorations as one node', () => {
    const map = [
      ...MAP,
      { ...step('landmark.x2', 'Glass Tower', 'persona', 5, 'locked', { residents: 24, streak_days: 20, land_residents: 0, requires: [] }), landmark_order: 2 },
      ...Array.from({ length: 10 }, (_, i) => step(`decoration-${i + 1}`, 'Decoration', 'nature', 6 + i, i < 2 ? 'built' : 'locked')),
    ];
    render(<BuildMap community={community} streakDays={4} buildings={map} onClose={() => {}} />);
    expect(screen.queryByText('Glass Tower')).toBeNull();
    expect(screen.getByRole('button', { name: 'Secret landmark: Locked' })).toBeTruthy();
    expect(screen.getAllByText(/Decorations \(10\)/)).toHaveLength(1);
    expect(screen.getByText('2 / 10 built')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Secret landmark: Locked' }));
    expect(screen.getByText('Revealed when it is ready to build.')).toBeTruthy();
  });
});
