/** Labels stack by depth inside their band; speech bubbles use a higher band than name tags. */
export const LABEL_Z: [number, number] = [20, 0];
export const BUBBLE_Z: [number, number] = [29, 21];

import { buildingSpec } from '../plan/buildingTree';

const plural = (n: number, one: string, many: string) => `${n} more ${n === 1 ? one : many}`;

/**
 * What is still missing to open a building (§7.6), e.g.
 * "Build the Fire pit first · 2 more neighbours · 1 more streak day".
 */
export function remainingText({ streakDays, residents, requires, landResidents = 0 }: { streakDays: number; residents: number; requires: string[]; landResidents?: number }): string {
  const parts: string[] = requires.map((k) => `Build the ${buildingSpec(k)?.name ?? k} first`);
  if (residents > 0) parts.push(plural(residents, 'neighbour', 'neighbours'));
  else if (landResidents > 0) parts.push(`Needs more land: ${plural(landResidents, 'neighbour', 'neighbours')}`);
  if (streakDays > 0) parts.push(plural(streakDays, 'streak day', 'streak days'));
  return parts.length > 0 ? parts.join(' · ') : 'Opens tomorrow';
}
