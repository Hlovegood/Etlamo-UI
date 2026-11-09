import * as THREE from 'three';
import { shaderMaterial } from '@react-three/drei';
import { extend } from '@react-three/fiber';

// Custom Holographic Iridescent Fresnel Material
export const IridescentMaterial = shaderMaterial(
  {
    uTime: 0,
    uColorA: new THREE.Color('#d4af37'), // Imperial Gold
    uColorB: new THREE.Color('#00e5ff'), // Cyan Neon
    uColorC: new THREE.Color('#7928ca'), // Deep Purple
    uFresnelPower: 2.5,
    uRoughness: 0.15,
    uMetalness: 0.85
  },
  // Vertex Shader
  /* glsl */ `
    varying vec3 vNormal;
    varying vec3 vViewPosition;
    varying vec2 vUv;
    varying vec3 vWorldPosition;

    uniform float uTime;

    void main() {
      vUv = uv;
      vNormal = normalize(normalMatrix * normal);

      // Subtle vertex micro-wave
      vec3 pos = position;
      float displacement = sin(pos.y * 3.0 + uTime * 1.5) * cos(pos.x * 3.0 + uTime * 1.2) * 0.025;
      pos += normal * displacement;

      vec4 worldPosition = modelMatrix * vec4(pos, 1.0);
      vWorldPosition = worldPosition.xyz;

      vec4 mvPosition = viewMatrix * worldPosition;
      vViewPosition = -mvPosition.xyz;

      gl_Position = projectionMatrix * mvPosition;
    }
  `,
  // Fragment Shader
  /* glsl */ `
    varying vec3 vNormal;
    varying vec3 vViewPosition;
    varying vec2 vUv;
    varying vec3 vWorldPosition;

    uniform float uTime;
    uniform vec3 uColorA;
    uniform vec3 uColorB;
    uniform vec3 uColorC;
    uniform float uFresnelPower;

    void main() {
      vec3 normal = normalize(vNormal);
      vec3 viewDir = normalize(vViewPosition);

      // Fresnel factor
      float fresnel = 1.0 - clamp(dot(normal, viewDir), 0.0, 1.0);
      fresnel = pow(fresnel, uFresnelPower);

      // Iridescent chromatic gradient based on view angle and world coordinates
      float wave = sin(vWorldPosition.y * 2.0 + uTime * 0.8) * 0.5 + 0.5;
      vec3 iridColor = mix(uColorA, uColorB, fresnel);
      iridColor = mix(iridColor, uColorC, wave * 0.6);

      // Specular highlight simulation
      vec3 lightDir = normalize(vec3(1.0, 2.0, 1.5));
      vec3 halfVector = normalize(lightDir + viewDir);
      float NdotH = max(dot(normal, halfVector), 0.0);
      float specular = pow(NdotH, 64.0) * 1.8;

      // Base Obsidian core with Iridescent Rim Glow
      vec3 baseObsidian = vec3(0.04, 0.04, 0.06);
      vec3 finalColor = baseObsidian + iridColor * (fresnel * 1.6 + 0.15) + vec3(specular);

      gl_FragColor = vec4(finalColor, 1.0);
    }
  `
);

extend({ IridescentMaterial });
