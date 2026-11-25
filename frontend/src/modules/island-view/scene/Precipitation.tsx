/**
 * Falling rain and snow (requirement.md v1.40 §10.4): one Points draw call per kind, moved
 * entirely on the GPU (a time uniform), so the CPU cost per frame is a few uniform writes.
 * Particle counts are capped by `precipitation()` (§20.3a).
 */
import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import { BufferAttribute, BufferGeometry, ShaderMaterial } from 'three';
import type { PrecipKind } from './sky';

const VERTEX = /* glsl */ `
attribute vec3 aSeed;
uniform float uTime;
uniform float uSpeed;
uniform float uR;
uniform float uH;
uniform float uSize;
uniform float uSnow;
uniform vec2 uWind;
varying float vFade;
void main() {
  float fall = mod(aSeed.y * uH - uTime * uSpeed * (0.8 + 0.4 * aSeed.z), uH);
  vec3 p = vec3((aSeed.x * 2.0 - 1.0) * uR, fall - 3.0, (aSeed.z * 2.0 - 1.0) * uR);
  // slanted by the wind: higher drops are further upwind
  p.xz -= uWind * (fall - uH * 0.5) * (uSnow > 0.5 ? 0.9 : 0.35);
  if (uSnow > 0.5) {
    p.x += sin(uTime * 1.3 + aSeed.x * 40.0) * 0.22;
    p.z += cos(uTime * 1.1 + aSeed.z * 40.0) * 0.22;
  }
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = uSize * (uSnow > 0.5 ? 0.6 + 0.6 * aSeed.x : 1.0);
  vFade = smoothstep(0.0, 1.5, fall) * smoothstep(uH, uH - 2.0, fall);
}`;

const FRAGMENT = /* glsl */ `
uniform float uSnow;
uniform vec3 uColor;
uniform float uOpacity;
varying float vFade;
void main() {
  vec2 c = gl_PointCoord - 0.5;
  float a;
  if (uSnow > 0.5) a = 1.0 - smoothstep(0.22, 0.5, length(c));
  else a = (1.0 - smoothstep(0.03, 0.09, abs(c.x))) * (1.0 - smoothstep(0.3, 0.5, abs(c.y)));
  a *= vFade * uOpacity;
  if (a < 0.02) discard;
  gl_FragColor = vec4(uColor, a);
}`;

interface LayerProps {
  snow: boolean;
  count: number;
  radius: number;
  wind: { x: number; z: number };
  seed: number;
}

function PrecipLayer({ snow, count, radius, wind, seed }: LayerProps) {
  const geometry = useMemo(() => {
    let s = seed * 9301 + 49297;
    const r = () => {
      s = (s * 16807) % 2147483647;
      return s / 2147483647;
    };
    const g = new BufferGeometry();
    const seeds = new Float32Array(count * 3);
    for (let i = 0; i < seeds.length; i++) seeds[i] = r();
    g.setAttribute('aSeed', new BufferAttribute(seeds, 3));
    // positions are computed in the shader; a dummy attribute keeps three.js happy
    g.setAttribute('position', new BufferAttribute(new Float32Array(count * 3), 3));
    return g;
  }, [count, seed]);
  const material = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: VERTEX,
        fragmentShader: FRAGMENT,
        transparent: true,
        depthWrite: false,
        uniforms: {
          uTime: { value: 0 },
          uSpeed: { value: snow ? 1.3 : 14 },
          uR: { value: radius },
          uH: { value: 16 },
          uSize: { value: 8 },
          uSnow: { value: snow ? 1 : 0 },
          uWind: { value: [wind.x, wind.z] },
          uColor: { value: snow ? [1, 1, 1] : [0.62, 0.72, 0.86] },
          uOpacity: { value: snow ? 0.95 : 0.55 },
        },
      }),
    [snow, radius, wind.x, wind.z],
  );
  useEffect(() => () => geometry.dispose(), [geometry]);
  useEffect(() => () => material.dispose(), [material]);
  const mat = useRef<ShaderMaterial>(null);
  useFrame(({ clock, camera, gl }) => {
    if (!mat.current) return;
    const u = mat.current.uniforms;
    u.uTime.value = clock.elapsedTime;
    // orthographic zoom = pixels per world unit: rain streaks ~0.55 tiles tall, snowflakes ~0.13
    u.uSize.value = (snow ? 0.13 : 0.55) * camera.zoom * gl.getPixelRatio();
  });
  return (
    <points geometry={geometry} frustumCulled={false}>
      <primitive object={material} ref={mat} attach="material" />
    </points>
  );
}

export function Precipitation({ kind, count, radius, wind }: { kind: PrecipKind; count: number; radius: number; wind: { x: number; z: number } }) {
  if (kind === 'mix') {
    return (
      <>
        <PrecipLayer snow={false} count={Math.round(count / 2)} radius={radius} wind={wind} seed={1} />
        <PrecipLayer snow count={Math.round(count / 2)} radius={radius} wind={wind} seed={2} />
      </>
    );
  }
  return <PrecipLayer snow={kind === 'snow'} count={count} radius={radius} wind={wind} seed={kind === 'snow' ? 2 : 1} />;
}
