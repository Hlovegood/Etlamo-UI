import { EffectComposer, Bloom, N8AO, ChromaticAberration, Noise, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';

export default function PostProcessingEffects() {
  const isMobile = window.innerWidth < 768;

  return (
    <EffectComposer
      disableNormalPass
      multisampling={isMobile ? 0 : 4}
    >
      {/* N8AO: State-of-the-art contact ambient occlusion */}
      <N8AO
        aoRadius={1.1}
        intensity={2.2}
        color="#07070a"
        quality={isMobile ? 'low' : 'medium'}
      />

      {/* Cinematic Specular Bloom */}
      <Bloom
        luminanceThreshold={0.72}
        luminanceSmoothing={0.4}
        intensity={0.85}
        mipmapBlur
      />

      {/* Subtle Awwwards Chromatic Aberration Rim Dispersion */}
      <ChromaticAberration
        offset={new THREE.Vector2(0.0008, 0.0008)}
        radialModulation={true}
        modulationOffset={0.25}
      />

      {/* Subtle Analog 35mm Film Grain */}
      <Noise opacity={0.024} />

      {/* Vignette Depth Framing */}
      <Vignette
        eskil={false}
        offset={0.12}
        darkness={0.9}
      />
    </EffectComposer>
  );
}
