/** Canvas drawing for the World Map: community fills and the small development icons. */
import type { IconKind } from './geometry';

export type Mood = 'lively' | 'normal' | 'sleepy';

export interface MoodColours {
  ground: string;
  ground2: string;
  roofSnow: boolean;
  lights: boolean;
}

const ROOFS = ['#f4978e', '#b8a9e8', '#8ec5ea', '#9ad9c2', '#f6d37a', '#f2a6c8'];

/** Draws one icon centred at (x, y) on screen, `s` = size in px. */
export function drawIcon(ctx: CanvasRenderingContext2D, kind: IconKind, x: number, y: number, s: number, colours: MoodColours, n: number) {
  const roof = ROOFS[n % ROOFS.length]!;
  ctx.save();
  ctx.translate(x, y);
  switch (kind) {
    case 'house': {
      ctx.fillStyle = '#fbf3e4';
      ctx.fillRect(-s * 0.4, -s * 0.15, s * 0.8, s * 0.55);
      ctx.fillStyle = roof;
      ctx.beginPath();
      ctx.moveTo(-s * 0.52, -s * 0.12);
      ctx.lineTo(0, -s * 0.55);
      ctx.lineTo(s * 0.52, -s * 0.12);
      ctx.closePath();
      ctx.fill();
      if (colours.roofSnow) {
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(-s * 0.2, -s * 0.38);
        ctx.lineTo(0, -s * 0.55);
        ctx.lineTo(s * 0.2, -s * 0.38);
        ctx.closePath();
        ctx.fill();
      }
      ctx.fillStyle = colours.lights ? '#ffd98a' : '#8a94a6';
      ctx.fillRect(-s * 0.12, s * 0.02, s * 0.24, s * 0.18);
      break;
    }
    case 'sign': {
      ctx.fillStyle = '#8a6343';
      ctx.fillRect(-s * 0.05, -s * 0.3, s * 0.1, s * 0.7);
      ctx.fillStyle = '#f6d37a';
      ctx.fillRect(-s * 0.4, -s * 0.5, s * 0.8, s * 0.32);
      ctx.strokeStyle = '#8a6343';
      ctx.lineWidth = Math.max(1, s * 0.06);
      ctx.strokeRect(-s * 0.4, -s * 0.5, s * 0.8, s * 0.32);
      break;
    }
    case 'playground': {
      ctx.strokeStyle = '#e8735a';
      ctx.lineWidth = Math.max(1.5, s * 0.1);
      ctx.beginPath();
      ctx.moveTo(-s * 0.4, s * 0.35);
      ctx.lineTo(-s * 0.1, -s * 0.35);
      ctx.lineTo(s * 0.45, s * 0.35);
      ctx.stroke();
      ctx.fillStyle = '#f6d37a';
      ctx.fillRect(-s * 0.2, -s * 0.42, s * 0.2, s * 0.14);
      break;
    }
    case 'rink': {
      ctx.fillStyle = '#cfeaf8';
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = Math.max(1, s * 0.08);
      ctx.beginPath();
      ctx.ellipse(0, 0, s * 0.55, s * 0.32, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      break;
    }
    case 'hall': {
      ctx.fillStyle = '#fbf3e4';
      ctx.fillRect(-s * 0.6, -s * 0.2, s * 1.2, s * 0.6);
      ctx.fillStyle = '#c9785b';
      ctx.beginPath();
      ctx.moveTo(-s * 0.7, -s * 0.18);
      ctx.lineTo(0, -s * 0.6);
      ctx.lineTo(s * 0.7, -s * 0.18);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#5d6470';
      ctx.lineWidth = Math.max(1, s * 0.06);
      ctx.beginPath();
      ctx.moveTo(s * 0.5, -s * 0.3);
      ctx.lineTo(s * 0.5, -s * 1.0);
      ctx.stroke();
      ctx.fillStyle = '#e8735a';
      ctx.fillRect(s * 0.5, -s * 1.0, s * 0.35, s * 0.22);
      ctx.fillStyle = colours.lights ? '#ffd98a' : '#8a94a6';
      ctx.fillRect(-s * 0.15, s * 0.05, s * 0.3, s * 0.35);
      break;
    }
    case 'park': {
      for (const [dx, dy, r] of [
        [-s * 0.35, 0, s * 0.32],
        [s * 0.3, -s * 0.1, s * 0.38],
        [s * 0.05, s * 0.2, s * 0.26],
      ] as const) {
        ctx.fillStyle = '#8a6343';
        ctx.fillRect(dx - s * 0.04, dy, s * 0.08, s * 0.3);
        ctx.fillStyle = colours.roofSnow ? '#7cbb9b' : '#7cc46a';
        ctx.beginPath();
        ctx.arc(dx, dy - s * 0.05, r, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }
    case 'landmark': {
      // stand-in while the community's own landmark picture loads: a gold tower with a star
      ctx.fillStyle = '#f2c14e';
      ctx.fillRect(-s * 0.22, -s * 0.9, s * 0.44, s * 1.3);
      ctx.fillStyle = '#c98f1c';
      ctx.fillRect(-s * 0.4, s * 0.25, s * 0.8, s * 0.15);
      ctx.fillStyle = '#fff4c2';
      ctx.font = `${Math.round(s * 0.5)}px system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText('★', 0, -s * 0.35);
      break;
    }
    case 'cloud': {
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.strokeStyle = 'rgba(148,163,184,0.6)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(-s * 0.35, s * 0.05, s * 0.3, 0, Math.PI * 2);
      ctx.arc(0, -s * 0.12, s * 0.4, 0, Math.PI * 2);
      ctx.arc(s * 0.38, s * 0.05, s * 0.3, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
  }
  ctx.restore();
}
