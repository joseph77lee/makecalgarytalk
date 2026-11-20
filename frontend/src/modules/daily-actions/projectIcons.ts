/** Icons for building keys in the action bar; unknown keys get a generic one. */
const ICONS: Record<string, string> = {
  'welcome-sign': '🪧',
  'gateway-arch': '🏛️',
  'fire-pit': '🔥',
  'warming-hut': '🛖',
  'community-hall': '🏛',
  'frozen-pond': '🧊',
  'skating-rink': '⛸️',
  'hockey-rink': '🏒',
  playground: '🛝',
  'sledding-hill': '🛷',
  'dog-park': '🐕',
  'pathway-lights': '🏮',
  'community-garden': '🥕',
  'neighbourhood-park': '🌳',
};

export const projectIcon = (key: string): string => ICONS[key] ?? '🏗️';
