import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Environment, AccumulativeShadows, RandomizedLight } from '@react-three/drei';

export default function CustomLighting() {
  const spotRef = useRef();
  const rimLightRef = useRef();

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    // Subtle kinetic breathing of rim and spotlight
    if (spotRef.current) {
      spotRef.current.position.x = Math.sin(time * 0.4) * 2 + 4;
      spotRef.current.position.z = Math.cos(time * 0.4) * 2 + 5;
    }
    if (rimLightRef.current) {
      rimLightRef.current.intensity = 2.4 + Math.sin(time * 1.5) * 0.5;
    }
  });

  return (
    <>
      {/* Cinematic Studio Environment Map */}
      <Environment preset="city" background={false} blur={0.85} />

      {/* Atmospheric Fill Hemisphere */}
      <hemisphereLight
        color="#ffffff"
        groundColor="#0a0a10"
        intensity={0.65}
      />

      {/* Main Directional Sun / Key Light with High-Resolution Soft Shadows */}
      <directionalLight
        position={[6, 12, 8]}
        intensity={1.8}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-near={0.5}
        shadow-camera-far={35}
        shadow-camera-left={-8}
        shadow-camera-right={8}
        shadow-camera-top={8}
        shadow-camera-bottom={-8}
        shadow-bias={-0.0001}
        shadow-radius={4}
      />

      {/* Dynamic Key Spotlight Focused on Monolith Core */}
      <spotLight
        ref={spotRef}
        position={[5, 8, 6]}
        target-position={[0, 0, 0]}
        intensity={4.0}
        angle={0.55}
        penumbra={0.85}
        color="#fff4e0"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0001}
      />

      {/* Cyan Rim Accent Light for Silhouette Separation */}
      <pointLight
        ref={rimLightRef}
        position={[-6, 2, -4]}
        intensity={2.8}
        distance={18}
        color="#00e5ff"
      />

      {/* Warm Imperial Gold Fill Light */}
      <pointLight
        position={[5, -2, -3]}
        intensity={2.2}
        distance={16}
        color="#d4af37"
      />

      {/* Soft Contact Floor Shadows */}
      <AccumulativeShadows
        temporal
        frames={60}
        alphaTest={0.85}
        scale={24}
        rotation={[0, 0, 0]}
        position={[0, -2.6, 0]}
        color="#050508"
        colorBlend={1.5}
        opacity={0.8}
      >
        <RandomizedLight
          amount={8}
          radius={5}
          ambient={0.5}
          intensity={1}
          position={[5, 8, -5]}
          bias={0.001}
        />
      </AccumulativeShadows>
    </>
  );
}
