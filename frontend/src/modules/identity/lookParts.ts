/** Labels for the villager look parts (requirement.md v1.52 §10.2), in the order the look indexes them. */
import { AGE_CHILD, fixLook, type AvatarLook } from '../common';

export const AGE_LABELS = ['Adult', 'Child', 'Elder'] as const;
export const HAIR_LABELS = ['Short', 'Long', 'Bun', 'Curly', 'Ponytail', 'Bald', 'Headscarf'] as const;

/** A look with one part changed, the rules applied (choosing Child takes the beard off). */
export function withPart<K extends keyof AvatarLook>(look: AvatarLook, key: K, value: AvatarLook[K]): AvatarLook {
  return fixLook({ ...look, [key]: value });
}

/** Whether a beard can be chosen for this look. */
export function beardAllowed(look: AvatarLook): boolean {
  return look.age !== AGE_CHILD;
}
