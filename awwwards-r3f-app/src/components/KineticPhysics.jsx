import { useRef, useMemo } from 'react';
import { Physics, RigidBody, CuboidCollider } from '@react-three/rapier';
import * as THREE from 'three';
import { audio } from '../utils/audio';

function PhysicsOrb({ position, radius = 0.25, color = '#d4af37' }) {
  const rigidRef = useRef();

  const orbMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color,
      metalness: 0.9,
      roughness: 0.15,
      envMapIntensity: 1.5
    });
  }, [color]);

  const handlePointerDown = (e) => {
    e.stopPropagation();
    if (!rigidRef.current) return;

    // Apply tactile physics upward explosion impulse
    const impulse = {
      x: (Math.random() - 0.5) * 3,
      y: 4 + Math.random() * 2,
      z: (Math.random() - 0.5) * 3
    };
    rigidRef.current.applyImpulse(impulse, true);
    rigidRef.current.applyTorqueImpulse({
      x: (Math.random() - 0.5) * 0.5,
      y: (Math.random() - 0.5) * 0.5,
      z: (Math.random() - 0.5) * 0.5
    }, true);

    audio.playTick(900 + Math.random() * 300);
  };

  return (
    <RigidBody
      ref={rigidRef}
      colliders="ball"
      restitution={0.85}
      friction={0.2}
      linearDamping={0.4}
      angularDamping={0.4}
      position={position}
    >
      <mesh
        castShadow
        receiveShadow
        material={orbMaterial}
        onPointerDown={handlePointerDown}
      >
        <sphereGeometry args={[radius, 28, 28]} />
      </mesh>
    </RigidBody>
  );
}

export default function KineticPhysics() {
  const orbs = useMemo(() => {
    return Array.from({ length: 14 }).map((_, i) => ({
      id: i,
      position: [
        (Math.random() - 0.5) * 5,
        -1.5 + Math.random() * 1.5,
        (Math.random() - 0.5) * 4
      ],
      radius: 0.16 + Math.random() * 0.12,
      color: i % 2 === 0 ? '#d4af37' : '#00e5ff'
    }));
  }, []);

  return (
    <Physics gravity={[0, -2.5, 0]}>
      {/* Invisible Floor Boundary */}
      <RigidBody type="fixed" position={[0, -2.5, 0]} restitution={0.8} friction={0.3}>
        <CuboidCollider args={[8, 0.2, 8]} />
      </RigidBody>

      {/* Invisible Lateral Containment Walls */}
      <RigidBody type="fixed" position={[-4.5, 0, 0]}>
        <CuboidCollider args={[0.2, 5, 8]} />
      </RigidBody>
      <RigidBody type="fixed" position={[4.5, 0, 0]}>
        <CuboidCollider args={[0.2, 5, 8]} />
      </RigidBody>
      <RigidBody type="fixed" position={[0, 0, -4.5]}>
        <CuboidCollider args={[8, 5, 0.2]} />
      </RigidBody>
      <RigidBody type="fixed" position={[0, 0, 4.5]}>
        <CuboidCollider args={[8, 5, 0.2]} />
      </RigidBody>

      {/* Interactive Floating Rigid Spheres */}
      {orbs.map((orb) => (
        <PhysicsOrb
          key={orb.id}
          position={orb.position}
          radius={orb.radius}
          color={orb.color}
        />
      ))}
    </Physics>
  );
}
