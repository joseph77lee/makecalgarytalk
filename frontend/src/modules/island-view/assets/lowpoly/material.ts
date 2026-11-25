/**
 * The shared low-poly material (M23, requirement.md v1.45 §19.1): flat-shaded pastel colours, and
 * weather and time in the shader so nothing re-renders per frame:
 *   - snow settles on faces that look up (uSnow)
 *   - windows: aLit 2 = lit (active resident), 1 = lit when lights are on (night, storms), 0 = dark
 *   - each house wears its own roof and wall colour (per-instance aRoofColor/aWallColor, w = 1 to paint)
 *   - tree crowns sway with the shared wind uniforms
 * Mirrored placements (negative x scale) use the back-side materials, since one instanced draw
 * cannot flip face culling per instance.
 */
import { useEffect } from 'react';
import { BackSide, FrontSide, MeshStandardMaterial, type Side, type WebGLProgramParametersWithUniforms } from 'three';
import { swayCompile } from '../../scene/wind';

/** Shared by every low-poly material, written from the island context. */
export const LP_UNIFORMS = { uSnow: { value: 0 }, uLights: { value: 0 } };

function lpCompile(sway: boolean) {
  return (shader: WebGLProgramParametersWithUniforms) => {
    if (sway) swayCompile(shader);
    Object.assign(shader.uniforms, LP_UNIFORMS);
    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        `#include <common>
attribute float aGlass;
attribute float aRoof;
attribute float aWall;
attribute float aLit;
attribute vec4 aRoofColor;
attribute vec4 aWallColor;
varying float vGlass;
varying float vLit;
varying float vUp;
varying vec4 vPaint;`,
      )
      .replace(
        '#include <defaultnormal_vertex>',
        `#include <defaultnormal_vertex>
  vUp = normalize(mat3(modelMatrix) * mat3(instanceMatrix) * objectNormal).y;
  vGlass = aGlass;
  vLit = aLit;
  vPaint = aRoof > 0.5 ? aRoofColor : (aWall > 0.5 ? aWallColor : vec4(0.0));`,
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
uniform float uSnow;
uniform float uLights;
varying float vGlass;
varying float vLit;
varying float vUp;
varying vec4 vPaint;`,
      )
      .replace(
        '#include <color_fragment>',
        `#include <color_fragment>
  diffuseColor.rgb = mix(diffuseColor.rgb, vPaint.rgb, step(0.5, vPaint.a));
  float snowK = uSnow * smoothstep(0.45, 0.8, vUp) * (1.0 - vGlass);
  diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.92, 0.94, 0.97), snowK);
  float litK = vGlass * max(step(1.5, vLit), step(0.5, vLit) * uLights);
  diffuseColor.rgb = mix(diffuseColor.rgb, vec3(1.0, 0.72, 0.32), litK);`,
      )
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n  totalEmissiveRadiance += vec3(1.0, 0.7, 0.3) * litK * 0.9;');
  };
}

function material(sway: boolean, side: Side): MeshStandardMaterial {
  const m = new MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.95, metalness: 0, side });
  m.onBeforeCompile = lpCompile(sway);
  m.customProgramCacheKey = () => `lowpoly-${sway ? 'sway' : 'solid'}`;
  return m;
}

export const MATERIALS = {
  solid: material(false, FrontSide),
  sway: material(true, FrontSide),
  solidMirror: material(false, BackSide),
  swayMirror: material(true, BackSide),
};

/** Keeps the shared weather/time uniforms in step with the island. */
export function useLpUniforms(snow: boolean, lightsOn: boolean): void {
  useEffect(() => {
    LP_UNIFORMS.uSnow.value = snow ? 1 : 0;
    LP_UNIFORMS.uLights.value = lightsOn ? 1 : 0;
  }, [snow, lightsOn]);
}
