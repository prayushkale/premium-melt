import * as THREE from 'three';
import { X_PER_POINT, Y_PER_RUPEE } from '../model/constants';

export interface TerrainUniforms {
  [uniform: string]: THREE.IUniform<unknown>;
  uSpot: THREE.IUniform<number>;
  uCentre: THREE.IUniform<number>;
  uXPerPoint: THREE.IUniform<number>;
  uYPerRupee: THREE.IUniform<number>;
  uFogColor: THREE.IUniform<THREE.Color>;
  uFogNear: THREE.IUniform<number>;
  uFogFar: THREE.IUniform<number>;
  uC0: THREE.IUniform<THREE.Color>;
  uC1: THREE.IUniform<THREE.Color>;
  uC2: THREE.IUniform<THREE.Color>;
  uC3: THREE.IUniform<THREE.Color>;
  uC4: THREE.IUniform<THREE.Color>;
}

export function createTerrainUniforms(spot: number, centre: number): TerrainUniforms {
  return {
    uSpot: { value: spot },
    uCentre: { value: centre },
    uXPerPoint: { value: X_PER_POINT },
    uYPerRupee: { value: Y_PER_RUPEE },
    uFogColor: { value: new THREE.Color('#07090c') },
    uFogNear: { value: 52 },
    uFogFar: { value: 105 },
    uC0: { value: new THREE.Color('#10242b') },
    uC1: { value: new THREE.Color('#1f5a5e') },
    uC2: { value: new THREE.Color('#c2491d') },
    uC3: { value: new THREE.Color('#ff9a3c') },
    uC4: { value: new THREE.Color('#fff0c9') },
  };
}

export const terrainVertexShader = /* glsl */ `
varying vec3 vWorldPos;
varying vec3 vWorldNormal;
varying float vFogDepth;

void main() {
  vec4 worldPos = modelMatrix * vec4(position, 1.0);
  vWorldPos = worldPos.xyz;
  vWorldNormal = normalize(mat3(modelMatrix) * normal);

  vec4 mvPosition = viewMatrix * worldPos;
  vFogDepth = -mvPosition.z;
  gl_Position = projectionMatrix * mvPosition;
}
`;

export const terrainFragmentShader = /* glsl */ `
uniform float uSpot;
uniform float uCentre;
uniform float uXPerPoint;
uniform float uYPerRupee;
uniform vec3 uFogColor;
uniform float uFogNear;
uniform float uFogFar;
uniform vec3 uC0;
uniform vec3 uC1;
uniform vec3 uC2;
uniform vec3 uC3;
uniform vec3 uC4;

varying vec3 vWorldPos;
varying vec3 vWorldNormal;
varying float vFogDepth;

vec3 heatRamp(float t) {
  float x = clamp(t, 0.0, 1.0);
  if (x < 0.22) {
    return mix(uC0, uC1, x / 0.22);
  }
  if (x < 0.52) {
    return mix(uC1, uC2, (x - 0.22) / 0.30);
  }
  if (x < 0.80) {
    return mix(uC2, uC3, (x - 0.52) / 0.28);
  }
  return mix(uC3, uC4, (x - 0.80) / 0.20);
}

float gridLine(float coord, float stepSize, float widthPx) {
  float p = coord / stepSize;
  float fw = max(fwidth(p), 1e-5);
  float dist = abs(fract(p - 0.5) - 0.5) / fw;
  return 1.0 - smoothstep(0.0, widthPx, dist);
}

void main() {
  float rupees = max(vWorldPos.y / uYPerRupee, 0.0);
  float heat = clamp(rupees / 250.0, 0.0, 1.0);
  vec3 baseColor = heatRamp(heat);

  // Soft directional light from terrain normals
  vec3 n = normalize(vWorldNormal);
  vec3 keyDir = normalize(vec3(-0.42, 0.82, 0.39));
  vec3 fillDir = normalize(vec3(0.55, 0.45, -0.70));
  float keyLight = max(dot(n, keyDir), 0.0);
  float fillLight = max(dot(n, fillDir), 0.0);
  float shade = mix(0.62 + 0.42 * keyLight + 0.14 * fillLight, 1.04, smoothstep(0.55, 1.0, heat));
  vec3 color = baseColor * shade;

  // Subtle warm sheen on tall crests without washing out into white under Bloom
  float crestGlow = smoothstep(180.0, 360.0, rupees) * 0.08;
  color += uC4 * crestGlow;

  // Strike lines every 100 and brighter lines every 500
  float strike = uCentre + vWorldPos.x / uXPerPoint;
  float line100 = gridLine(strike, 100.0, 1.05);
  float line500 = gridLine(strike, 500.0, 1.45);
  vec3 minorTint = mix(vec3(0.18, 0.34, 0.38), vec3(0.95, 0.78, 0.56), heat * 0.55);
  vec3 majorTint = mix(vec3(0.32, 0.56, 0.58), vec3(1.0, 0.90, 0.72), heat * 0.65);
  color = mix(color, minorTint, line100 * 0.22);
  color = mix(color, majorTint, line500 * 0.42);

  // Contour lines every 25 rupees, fading cleanly to zero on the flat floor
  float contourMask = smoothstep(3.0, 14.0, rupees);
  float contour = gridLine(rupees, 25.0, 1.15) * contourMask;
  color = mix(color, mix(uC4, vec3(1.0), 0.2), contour * 0.24);

  // Hot seam along x = spot
  float spotX = (uSpot - uCentre) * uXPerPoint;
  float spotDist = abs(vWorldPos.x - spotX);
  float spotPx = spotDist / max(fwidth(vWorldPos.x), 0.015);
  float spotCore = 1.0 - smoothstep(0.0, 2.2, spotPx);
  float spotHalo = exp(-pow(spotDist / 0.16, 2.0));
  vec3 spotColor = mix(uC3 * 0.95, uC4 * 1.25, smoothstep(10.0, 180.0, rupees));
  color = mix(color, spotColor, spotCore * 0.85);
  color += uC3 * spotHalo * (0.12 + 0.18 * heat);

  // Distance fog matching scene background #07090c
  float fogFactor = smoothstep(uFogNear, uFogFar, vFogDepth);
  color = mix(color, uFogColor, fogFactor);

  gl_FragColor = vec4(color, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`;
