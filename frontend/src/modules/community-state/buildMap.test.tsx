// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { BuildMap } from './BuildMap';

const community = {
  id: 'c1',
  code: 'VAR',
  name: 'Varsity',
  residents: 2,
  land_stage: 0,
  settled: true,
  vitality: 70,
  mini_villagers: 3,
  next_land_residents: 1,
} as Parameters<typeof BuildMap>[0]['community'];

afterEach(cleanup);

describe('build map: what the next land brings (requirement.md §7.9)', () => {
  it('lists the features and stations that arrive with the next land stage', () => {
    render(
      <BuildMap community={community} streakDays={1} buildings={[]} onClose={() => {}} onShowExample={() => {}} upcoming={{ landStage: 2, labels: ['🚉 Dalhousie', '🌳 Dale Hodges Park'] }} />,
    );
    expect(screen.getByText(/Coming at 6 neighbours:/)).toBeTruthy();
    expect(screen.getByText('🚉 Dalhousie, 🌳 Dale Hodges Park')).toBeTruthy();
  });

  it('shows nothing when everything is already there', () => {
    render(<BuildMap community={community} streakDays={1} buildings={[]} onClose={() => {}} onShowExample={() => {}} upcoming={null} />);
    expect(screen.queryByText(/Coming at/)).toBeNull();
  });
});
