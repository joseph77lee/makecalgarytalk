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
  // project kinds the server still sends until the building tree (M3 rework)
  'ice-rink': '⛸️',
  'flower-path': '🌷',
  'holiday-decorations': '🎄',
  'snowman-garden': '⛄',
  'lantern-street': '🏮',
  'bird-feeders': '🐦',
};

export const projectIcon = (key: string): string => ICONS[key] ?? '🏗️';
