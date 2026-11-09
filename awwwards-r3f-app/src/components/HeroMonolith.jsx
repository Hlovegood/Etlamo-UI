import { useRef, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Float, MeshTransmissionMaterial } from '@react-three/drei';
import * as THREE from 'three';
import '../materials/IridescentShaderMaterial';
import { audio } from '../utils/audio';

export default function HeroMonolith({ activeChapter = 0 }) {
  const groupRef = useRef();
  const coreRef = useRef();
  const ring1Ref = useRef();
  const ring2Ref = useRef();
  const shaderMatRef = useRef();

  const [hovered, setHovered] = useState(false);

  // High-performance procedural normal & roughness textures for titanium rings
  const ringMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: '#d4af37',
      metalness: 0.92,
      roughness: 0.22,
      envMapIntensity: 1.8
    });
  }, []);

  const chromeMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: '#ffffff',
      metalness: 0.98,
      roughness: 0.08,
      envMapIntensity: 2.2
    });
  }, []);

  useFrame((state, delta) => {
    const time = state.clock.getElapsedTime();

    // Update custom shader uniforms
    if (shaderMatRef.current) {
      shaderMatRef.current.uTime = time;
    }

    // Dynamic rotation speed based on hover and active chapter
    const speedMultiplier = hovered ? 2.5 : 1.0;
    const chapterBias = activeChapter === 1 ? 1.8 : 1.0;

    if (coreRef.current) {
      coreRef.current.rotation.x += delta * 0.4 * speedMultiplier * chapterBias;
      coreRef.current.rotation.y += delta * 0.6 * speedMultiplier * chapterBias;
    }

    if (ring1Ref.current) {
      ring1Ref.current.rotation.x = Math.sin(time * 0.5) * 0.4 + time * 0.2;
      ring1Ref.current.rotation.y += delta * 0.35;
    }

    if (ring2Ref.current) {
      ring2Ref.current.rotation.y = Math.cos(time * 0.4) * 0.5 - time * 0.25;
      ring2Ref.current.rotation.z += delta * 0.3;
    }
  });

  const handlePointerOver = (e) => {
    e.stopPropagation();
    setHovered(true);
    document.body.style.cursor = 'pointer';
    audio.playTick(1200);
  };

  const handlePointerOut = () => {
    setHovered(false);
    document.body.style.cursor = 'auto';
  };

  const handleClick = (e) => {
    e.stopPropagation();
    audio.playChime();
  };

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {/* Floating Gentle Levitation */}
      <Float
        speed={1.8}
        rotationIntensity={0.6}
        floatIntensity={0.8}
        floatingRange={[-0.15, 0.15]}
      >
        {/* Core Interactive Monolith */}
        <mesh
          ref={coreRef}
          castShadow
          receiveShadow
          onPointerOver={handlePointerOver}
          onPointerOut={handlePointerOut}
          onClick={handleClick}
        >
          <icosahedronGeometry args={[1.35, 1]} />
          {/* Custom Iridescent Hologram Shader */}
          <iridescentMaterial
            ref={shaderMatRef}
            uColorA={new THREE.Color('#d4af37')}
            uColorB={new THREE.Color('#00e5ff')}
            uColorC={new THREE.Color('#9333ea')}
            uFresnelPower={hovered ? 1.8 : 2.6}
          />
        </mesh>

        {/* Inner Glass Refraction Shield */}
        <mesh scale={1.12}>
          <icosahedronGeometry args={[1.35, 2]} />
          <MeshTransmissionMaterial
            backside
            samples={6}
            thickness={0.4}
            roughness={0.08}
            chromaticAberration={0.06}
            anisotropy={0.3}
            distortion={0.2}
            distortionScale={0.3}
            temporalDistortion={0.1}
            color="#ffffff"
          />
        </mesh>

        {/* Outer Orbital Titanium Ring 1 */}
        <mesh
          ref={ring1Ref}
          material={ringMaterial}
          castShadow
          receiveShadow
        >
          <torusGeometry args={[2.2, 0.045, 24, 80]} />
        </mesh>

        {/* Outer Orbital Titanium Ring 2 */}
        <mesh
          ref={ring2Ref}
          material={ringMaterial}
          castShadow
          receiveShadow
        >
          <torusGeometry args={[2.65, 0.035, 24, 80]} />
        </mesh>

        {/* Floating Chronos Satellite Nodes */}
        {[0, 1, 2, 3].map((idx) => {
          const angle = (idx / 4) * Math.PI * 2;
          const radius = 3.2;
          return (
            <mesh
              key={idx}
              position={[Math.cos(angle) * radius, Math.sin(angle) * 0.4, Math.sin(angle) * radius]}
              material={chromeMaterial}
              castShadow
            >
              <sphereGeometry args={[0.085, 24, 24]} />
            </mesh>
          );
        })}
      </Float>
    </group>
  );
}
