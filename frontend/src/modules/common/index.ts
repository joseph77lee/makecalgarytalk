// Public API of the `common` module. Other modules import ONLY from here.
export { readSupabaseConfig, type ConfigResult, type SupabaseConfig } from './env';
export { getSupabaseClient } from './supabase';
export { formatCountdown, msUntil } from './time';
export { useNow } from './useNow';
export { AGE_ADULT, AGE_CHILD, AGE_ELDER, FIRST_GREY, LOOK_MAX, fixLook, isAvatarLook, randomLook, type AvatarLook } from './avatarLook';
