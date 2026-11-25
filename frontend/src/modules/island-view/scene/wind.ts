/**
 * Wind for swaying leaves and flags (requirement.md v1.40 §10.4). One shared set of shader
 * uniforms: the island writes time and wind once per frame, every `sway` box batch reads them on
 * the GPU, so instanced trees stay one draw call and nothing re-renders.
 */
import { Vector3, type WebGLProgramParametersWithUniforms } from 'three';

export const WIND_UNIFORMS = {
  uWindTime: { value: 0 },
  /** x, z = push towards where the wind blows (scaled by strength); y = strength 0..1. */
  uWind: { value: new Vector3(0.18, 0.18, 0) },
};

export function setWind(time: number, x: number, z: number, strength: number): void {
  WIND_UNIFORMS.uWindTime.value = time;
  WIND_UNIFORMS.uWind.value.set(x, strength, z);
}

/** Bends instanced boxes with the wind: the higher above the ground, the more they move. */
export function swayCompile(shader: WebGLProgramParametersWithUniforms): void {
  Object.assign(shader.uniforms, WIND_UNIFORMS);
  shader.vertexShader = shader.vertexShader
    .replace('#include <common>', '#include <common>\nuniform float uWindTime;\nuniform vec3 uWind;')
    .replace(
      '#include <project_vertex>',
      `vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_INSTANCING
  mvPosition = instanceMatrix * mvPosition;
#endif
  float swayH = max( mvPosition.y, 0.0 );
  float swayPh = mvPosition.x * 0.9 + mvPosition.z * 0.7;
  float gust = sin( uWindTime * ( 1.2 + 1.4 * uWind.y ) + swayPh ) * 0.6 + sin( uWindTime * 2.9 + swayPh * 1.3 ) * 0.4;
  vec2 dir = uWind.y > 0.0 ? uWind.xz / uWind.y : vec2( 1.0, 0.0 );
  mvPosition.xz += dir * ( uWind.y * ( 0.5 + 0.5 * gust ) ) * swayH * 0.09;
  mvPosition = modelViewMatrix * mvPosition;
  gl_Position = projectionMatrix * mvPosition;`,
    );
}
