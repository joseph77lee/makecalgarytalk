import { describe, expect, it } from 'vitest';
import { cardFileName, cardShareText, drawCard, wrapLines, type ShareCard } from './card';
import { imageShareOutcomeText, shareImage } from './share';

const card: ShareCard = { kind: 'built', communityName: 'Mahogany', title: 'Fire pit was built' };

describe('share card text', () => {
  it('always names the community and links the site', () => {
    expect(cardShareText(card, 'https://makecalgarytalk.com')).toBe(
      'Mahogany: Fire pit was built! Help our community grow on MakeCalgaryTalk: https://makecalgarytalk.com',
    );
    expect(cardShareText({ ...card, kind: 'weekly', title: '#2 in Calgary last week' }, 'x')).toContain('Mahogany: #2 in Calgary last week');
  });
  it('file names are safe', () => {
    expect(cardFileName(card)).toBe('makecalgarytalk-mahogany-built.png');
    expect(cardFileName({ ...card, communityName: "Mount Royal (Upper) / Lower's" })).toBe('makecalgarytalk-mount-royal-upper-lower-s-built.png');
    expect(cardFileName({ ...card, communityName: '???' })).toBe('makecalgarytalk-community-built.png');
  });
  it('wraps by words', () => {
    const measure = (s: string) => s.length * 10;
    expect(wrapLines('one two three four', 100, measure)).toEqual(['one two', 'three four']);
    expect(wrapLines('supercalifragilistic', 50, measure)).toEqual(['supercalifragilistic']); // a long word stays whole
    expect(wrapLines('  ', 50, measure)).toEqual([]);
  });
});

describe('drawing a card', () => {
  function fakeCtx() {
    const texts: string[] = [];
    const images: number[][] = [];
    const ctx = {
      font: '',
      fillStyle: '',
      textAlign: '',
      textBaseline: '',
      createLinearGradient: () => ({ addColorStop: () => {} }),
      fillRect: () => {},
      fillText: (t: string) => texts.push(t),
      measureText: (t: string) => ({ width: t.length * 40 }),
      drawImage: (_img: unknown, x: number, y: number, w: number, h: number) => images.push([x, y, w, h]),
    };
    return { ctx: ctx as unknown as CanvasRenderingContext2D, texts, images };
  }
  it('community name, event line and site; the island fitted into the middle', () => {
    const f = fakeCtx();
    drawCard(f.ctx, card, {} as CanvasImageSource, [2000, 1000]);
    expect(f.texts).toContain('Mahogany');
    expect(f.texts).toContain('makecalgarytalk.com');
    expect(f.texts.some((t) => t.includes('Fire pit was built'))).toBe(true);
    const [x, , w, h] = f.images[0]!;
    expect(w).toBeCloseTo(960); // fitted by width
    expect(h).toBeCloseTo(480);
    expect(x).toBeCloseTo(60);
  });
  it('without an island picture it shows the event emoji', () => {
    const f = fakeCtx();
    drawCard(f.ctx, { ...card, kind: 'weekly', title: '#2 in Calgary last week' }, null, null);
    expect(f.images).toHaveLength(0);
    expect(f.texts).toContain('🏆');
  });
});

describe('sharing the image', () => {
  const blob = new Blob(['png'], { type: 'image/png' });
  it('uses the share sheet when files can be shared', async () => {
    let shared: ShareData | null = null;
    const nav = { canShare: () => true, share: async (d: ShareData) => void (shared = d) };
    expect(await shareImage(blob, 'a.png', 'hello', nav, () => {})).toBe('shared');
    expect((shared as ShareData | null)?.text).toBe('hello');
    expect((shared as ShareData | null)?.files?.[0]?.name).toBe('a.png');
  });
  it('cancelled share is quiet; other errors fail', async () => {
    const cancel = { canShare: () => true, share: async () => Promise.reject(new DOMException('x', 'AbortError')) };
    expect(await shareImage(blob, 'a.png', '', cancel, () => {})).toBe('cancelled');
    const broken = { canShare: () => true, share: async () => Promise.reject(new Error('x')) };
    expect(await shareImage(blob, 'a.png', '', broken, () => {})).toBe('failed');
  });
  it('saves the image when files cannot be shared', async () => {
    const saved: string[] = [];
    expect(await shareImage(blob, 'a.png', '', { canShare: () => false, share: async () => {} }, (_b, n) => saved.push(n))).toBe('saved');
    expect(await shareImage(blob, 'b.png', '', {}, (_b, n) => saved.push(n))).toBe('saved');
    expect(saved).toEqual(['a.png', 'b.png']);
  });
  it('messages', () => {
    expect(imageShareOutcomeText('cancelled')).toBeNull();
    expect(imageShareOutcomeText('saved')).toContain('saved');
  });
});
