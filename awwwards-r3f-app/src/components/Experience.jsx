import { Suspense } from 'react';
import { Sparkles } from '@react-three/drei';
import CustomLighting from './CustomLighting';
import HeroMonolith from './HeroMonolith';
import KineticPhysics from './KineticPhysics';
import CameraRig from './CameraRig';
import PostProcessingEffects from './PostProcessingEffects';

export default function Experience({ activeChapter = 0 }) {
  return (
    <>
      {/* Dynamic Lighting & Environment */}
      <CustomLighting />

      {/* Atmospheric Stardust Particles */}
      <Sparkles
        count={80}
        scale={16}
        size={2.2}
        speed={0.4}
        opacity={0.45}
        color="#d4af37"
      />

      {/* Main 3D Kinetic Hero Monolith */}
      <Suspense fallback={null}>
        <HeroMonolith activeChapter={activeChapter} />
      </Suspense>

      {/* Interactive Rapier Rigid Bodies */}
      <Suspense fallback={null}>
        <KineticPhysics />
      </Suspense>

      {/* Smooth Cinematic Camera Rig */}
      <CameraRig activeChapter={activeChapter} />

      {/* Post-Processing Pipeline */}
      <PostProcessingEffects />
    </>
  );
}
