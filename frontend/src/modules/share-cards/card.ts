/** Share cards (requirement.md v1.31 §12.2): made on the phone, always naming the community. */

export type ShareCardKind = 'weekly' | 'built' | 'revival';

export interface ShareCard {
  kind: ShareCardKind;
  communityName: string;
  /** Big line, e.g. "#2 in Calgary this week" or "Fire pit was built". */
  title: string;
}

export const CARD_WIDTH = 1080;
export const CARD_HEIGHT = 1350;

const THEMES: Record<ShareCardKind, { emoji: string; top: string; bottom: string; accent: string }> = {
  weekly: { emoji: '🏆', top: '#fde68a', bottom: '#e0e7ff', accent: '#b45309' },
  built: { emoji: '🎉', top: '#bae6fd', bottom: '#ede9fe', accent: '#4338ca' },
  revival: { emoji: '🌸', top: '#fbcfe8', bottom: '#dcfce7', accent: '#be185d' },
};

export function cardTheme(kind: ShareCardKind) {
  return THEMES[kind];
}

/** The text that goes with the image (the image itself carries the community name too). */
export function cardShareText(card: ShareCard, siteUrl: string): string {
  const lead = { weekly: `${card.communityName}: ${card.title}`, built: `${card.communityName}: ${card.title}!`, revival: `${card.communityName} woke up!` }[card.kind];
  return `${lead} Help our community grow on MakeCalgaryTalk: ${siteUrl}`;
}

export function cardFileName(card: ShareCard): string {
  const slug = card.communityName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return `makecalgarytalk-${slug || 'community'}-${card.kind}.png`;
}

/** Splits text into lines that fit `maxWidth` (by words). */
export function wrapLines(text: string, maxWidth: number, measure: (s: string) => number): string[] {
  const lines: string[] = [];
  let line = '';
  for (const word of text.split(/\s+/).filter(Boolean)) {
    const next = line ? `${line} ${word}` : word;
    if (line && measure(next) > maxWidth) {
      lines.push(line);
      line = word;
    } else line = next;
  }
  if (line) lines.push(line);
  return lines;
}

/** Draws the card. `island` is a picture of the island (optional; the card still works without). */
export function drawCard(ctx: CanvasRenderingContext2D, card: ShareCard, island: CanvasImageSource | null, islandSize: [number, number] | null): void {
  const W = CARD_WIDTH;
  const H = CARD_HEIGHT;
  const t = THEMES[card.kind];
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, t.top);
  g.addColorStop(1, t.bottom);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  const font = (weight: number, px: number) => `${weight} ${px}px system-ui, -apple-system, "Segoe UI", sans-serif`;

  // Community name (always on the card)
  ctx.fillStyle = '#1e293b';
  let px = 104;
  ctx.font = font(800, px);
  while (px > 56 && ctx.measureText(card.communityName).width > W - 120) ctx.font = font(800, (px -= 4));
  ctx.fillText(card.communityName, W / 2, 170);
  ctx.font = font(600, 40);
  ctx.fillStyle = '#475569';
  ctx.fillText('Calgary', W / 2, 228);

  // Island picture, fitted into the middle area
  const box = { x: 60, y: 270, w: W - 120, h: 700 };
  if (island && islandSize && islandSize[0] > 0 && islandSize[1] > 0) {
    const k = Math.min(box.w / islandSize[0], box.h / islandSize[1]);
    const w = islandSize[0] * k;
    const h = islandSize[1] * k;
    ctx.drawImage(island, box.x + (box.w - w) / 2, box.y + (box.h - h) / 2, w, h);
  } else {
    ctx.font = font(400, 260);
    ctx.fillText(t.emoji, W / 2, box.y + box.h / 2 + 90);
  }

  // Event line
  ctx.font = font(800, 72);
  ctx.fillStyle = t.accent;
  const lines = wrapLines(`${t.emoji} ${card.title}`, W - 140, (s) => ctx.measureText(s).width).slice(0, 2);
  lines.forEach((l, i) => ctx.fillText(l, W / 2, 1060 + i * 86));

  // Footer
  ctx.font = font(600, 38);
  ctx.fillStyle = '#334155';
  ctx.fillText('Build your community together', W / 2, H - 120);
  ctx.font = font(800, 44);
  ctx.fillStyle = '#4f46e5';
  ctx.fillText('makecalgarytalk.com', W / 2, H - 62);
}
