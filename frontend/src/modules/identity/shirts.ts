/** Avatar shirt palette (requirement.md §10.2). The server stores the index (0–7). */
export const SHIRT_COLORS = ['#ff8a5c', '#f2c94c', '#6fcf97', '#56ccf2', '#6c8cff', '#bb6bd9', '#f78fb3', '#4f5d75'] as const;

export const DEFAULT_SHIRT = 0;

export function shirtColor(index: number | null | undefined): string {
  return SHIRT_COLORS[index ?? DEFAULT_SHIRT] ?? SHIRT_COLORS[DEFAULT_SHIRT];
}
