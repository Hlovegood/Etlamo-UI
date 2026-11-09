import { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import gsap from 'gsap';

const CHAPTER_CONFIGS = [
  // 01: Monolith Macro Overview
  {
    position: new THREE.Vector3(0, 1.8, 7.2),
    target: new THREE.Vector3(0, 0, 0),
    duration: 1.8,
    ease: 'power3.inOut'
  },
  // 02: Quantum Core Inspection
  {
    position: new THREE.Vector3(-2.4, 0.6, 3.4),
    target: new THREE.Vector3(-0.3, 0.1, 0),
    duration: 2.0,
    ease: 'power3.inOut'
  },
  // 03: Kinetic Orbital Perspective
  {
    position: new THREE.Vector3(3.8, 2.6, 4.8),
    target: new THREE.Vector3(0, 0.2, 0),
    duration: 2.2,
    ease: 'power3.inOut'
  }
];

export default function CameraRig({ activeChapter = 0 }) {
  const { camera } = useThree();

  // Internal animated coordinates for GSAP to drive
  const rigState = useRef({
    x: CHAPTER_CONFIGS[0].position.x,
    y: CHAPTER_CONFIGS[0].position.y,
    z: CHAPTER_CONFIGS[0].position.z,
    tx: CHAPTER_CONFIGS[0].target.x,
    ty: CHAPTER_CONFIGS[0].target.y,
    tz: CHAPTER_CONFIGS[0].target.z
  });

  const currentLookAt = useRef(new THREE.Vector3(0, 0, 0));

  // Trigger GSAP Timeline on Chapter Change
  useEffect(() => {
    const config = CHAPTER_CONFIGS[activeChapter] || CHAPTER_CONFIGS[0];

    gsap.to(rigState.current, {
      x: config.position.x,
      y: config.position.y,
      z: config.position.z,
      tx: config.target.x,
      ty: config.target.y,
      tz: config.target.z,
      duration: config.duration,
      ease: config.ease,
      overwrite: 'auto'
    });
  }, [activeChapter]);

  useFrame((state) => {
    // Smooth interactive mouse parallax
    const mouseX = state.pointer.x * 0.45;
    const mouseY = state.pointer.y * 0.35;

    // Smooth lerp to animated position + mouse offset
    camera.position.x = THREE.MathUtils.lerp(camera.position.x, rigState.current.x + mouseX, 0.05);
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, rigState.current.y + mouseY, 0.05);
    camera.position.z = THREE.MathUtils.lerp(camera.position.z, rigState.current.z, 0.05);

    // Smooth lerp for target lookAt point
    currentLookAt.current.x = THREE.MathUtils.lerp(currentLookAt.current.x, rigState.current.tx + mouseX * 0.2, 0.05);
    currentLookAt.current.y = THREE.MathUtils.lerp(currentLookAt.current.y, rigState.current.ty + mouseY * 0.2, 0.05);
    currentLookAt.current.z = THREE.MathUtils.lerp(currentLookAt.current.z, rigState.current.tz, 0.05);

    camera.lookAt(currentLookAt.current);
  });

  return null;
}
