import type { ReactNode } from 'react';
import type { AvatarLook } from '../common';
import { personLookFrom } from '../island-view';

const EYE = '#2a2d36';

/** One "voxel" square of the face (a 16 × 16 grid). */
const px = (x: number, y: number, w: number, h: number, fill: string, key: string) => <rect key={key} x={x} y={y} width={w} height={h} fill={fill} />;

/**
 * My villager's face as a small flat picture (the profile button, requirement.md v1.52 §10.2):
 * the same skin, hair, scarf, glasses, beard and shirt as the 3D figure, drawn front-on in 2D so
 * a button never needs its own 3D canvas.
 */
export function AvatarFace({ look, shirt, className = '' }: { look: AvatarLook; shirt: string; className?: string }) {
  const p = personLookFrom(look, shirt);
  const hair = p.hair;
  const back: ReactNode[] = [];
  const front: ReactNode[] = [];
  switch (p.style) {
    case 'short':
      front.push(px(3, 2, 10, 2, hair, 'top'), px(3, 4, 1, 2, hair, 'l'), px(12, 4, 1, 2, hair, 'r'));
      break;
    case 'long':
      back.push(px(2, 4, 2, 8, hair, 'bl'), px(12, 4, 2, 8, hair, 'br'));
      front.push(px(3, 2, 10, 2, hair, 'top'), px(3, 4, 1, 3, hair, 'l'), px(12, 4, 1, 3, hair, 'r'));
      break;
    case 'bun':
      front.push(px(6, 0, 4, 2, hair, 'bun'), px(3, 2, 10, 2, hair, 'top'), px(3, 4, 1, 1, hair, 'l'), px(12, 4, 1, 1, hair, 'r'));
      break;
    case 'curly':
      front.push(px(4, 0.8, 8, 1.2, hair, 'crown'), px(2.5, 2, 11, 2.6, hair, 'top'), px(2.5, 4.6, 1.5, 2.4, hair, 'l'), px(12, 4.6, 1.5, 2.4, hair, 'r'));
      break;
    case 'ponytail':
      back.push(px(12.5, 4, 2, 5, hair, 'tail'));
      front.push(px(3, 2, 10, 2, hair, 'top'), px(3, 4, 1, 2, hair, 'l'), px(12, 4, 1, 2, hair, 'r'));
      break;
    case 'bald':
      front.push(px(3, 5, 0.8, 2, hair, 'l'), px(12.2, 5, 0.8, 2, hair, 'r'));
      break;
    case 'headscarf': {
      const scarf = p.scarf ?? hair;
      back.push(px(2.4, 1.6, 11.2, 10.6, scarf, 'scarf'));
      front.push(px(2.4, 1.6, 11.2, 2.6, scarf, 'top'), px(2.4, 4, 1.2, 8, scarf, 'l'), px(12.4, 4, 1.2, 8, scarf, 'r'));
      break;
    }
  }
  return (
    <svg viewBox="0 0 16 16" className={className} shapeRendering="crispEdges" aria-hidden>
      {px(1, 13, 14, 3, p.top, 'shoulders')}
      {back}
      {px(6, 11, 4, 2, p.skin, 'neck')}
      {px(3, 3, 10, 9, p.skin, 'head')}
      {p.beard && px(3.5, 9.2, 9, 2.8, hair, 'beard')}
      {p.beard && px(6.5, 9.6, 3, 0.8, p.skin, 'mouth')}
      {px(5.2, 6.6, 1.4, 1.6, EYE, 'eyeL')}
      {px(9.4, 6.6, 1.4, 1.6, EYE, 'eyeR')}
      {p.glasses && (
        <g fill="none" stroke={EYE} strokeWidth={0.45}>
          <rect x={4.4} y={6} width={3} height={2.8} />
          <rect x={8.6} y={6} width={3} height={2.8} />
          <line x1={7.4} y1={7} x2={8.6} y2={7} />
        </g>
      )}
      {front}
    </svg>
  );
}
