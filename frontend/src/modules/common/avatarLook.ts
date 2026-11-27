/**
 * The villager look a player chooses (requirement.md v1.52 §10.2), as stored with the profile:
 * indexes into the renderer's part lists plus yes/no parts. Shared by identity (stores it) and the
 * avatar / island renderer (draws it). The server checks the same ranges.
 */
export interface AvatarLook {
  /** 0 adult, 1 child, 2 elder */
  age: number;
  /** 0–5, light to deep */
  skin: number;
  /** 0–6: short, long, bun, curly, ponytail, bald, headscarf */
  hair: number;
  /** 0–9: seven colours, then three greys */
  hair_colour: number;
  skirt: boolean;
  beard: boolean;
  glasses: boolean;
}

export const LOOK_MAX = { age: 2, skin: 5, hair: 6, hair_colour: 9 } as const;
export const AGE_ADULT = 0;
export const AGE_CHILD = 1;
export const AGE_ELDER = 2;
/** The greys start here in the hair colour list. */
export const FIRST_GREY = 7;

export function isAvatarLook(v: unknown): v is AvatarLook {
  const o = v as Record<string, unknown> | null;
  if (!o || typeof o !== 'object' || Array.isArray(o)) return false;
  for (const [k, max] of Object.entries(LOOK_MAX)) {
    const n = o[k];
    if (!Number.isInteger(n) || (n as number) < 0 || (n as number) > max) return false;
  }
  if (typeof o.skirt !== 'boolean' || typeof o.beard !== 'boolean' || typeof o.glasses !== 'boolean') return false;
  return !(o.age === AGE_CHILD && o.beard);
}

/** The same look with the rules applied (no beard for children). */
export function fixLook(look: AvatarLook): AvatarLook {
  return look.age === AGE_CHILD && look.beard ? { ...look, beard: false } : look;
}

/** A random look to start from (the 🎲 shuffle): mostly adults; elders usually grey. */
export function randomLook(rand: () => number = Math.random): AvatarLook {
  const int = (n: number) => Math.min(n - 1, Math.floor(rand() * n));
  const a = rand();
  const age = a < 0.7 ? AGE_ADULT : a < 0.85 ? AGE_CHILD : AGE_ELDER;
  const hair_colour = age === AGE_ELDER && rand() < 0.8 ? FIRST_GREY + int(3) : int(FIRST_GREY);
  return fixLook({
    age,
    skin: int(LOOK_MAX.skin + 1),
    hair: int(LOOK_MAX.hair + 1),
    hair_colour,
    skirt: rand() < 0.35,
    beard: age !== AGE_CHILD && rand() < 0.2,
    glasses: rand() < (age === AGE_ELDER ? 0.5 : 0.15),
  });
}
