import { useState, useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import Experience from './components/Experience';
import Overlay from './components/Overlay';
import Loader from './components/Loader';
import { audio } from './utils/audio';

export default function App() {
  const [activeChapter, setActiveChapter] = useState(0);
  const wheelTimeout = useRef(null);

  // Wheel / Touch Scroll Chapter Navigation
  useEffect(() => {
    const handleWheel = (e) => {
      if (wheelTimeout.current) return;
      if (Math.abs(e.deltaY) > 30) {
        wheelTimeout.current = setTimeout(() => {
          wheelTimeout.current = null;
        }, 800);

        setActiveChapter((prev) => {
          const next = e.deltaY > 0 ? (prev + 1) % 3 : (prev - 1 + 3) % 3;
          audio.playTick(1000 + next * 100);
          return next;
        });
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: true });
    return () => window.removeEventListener('wheel', handleWheel);
  }, []);

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden' }}>
      {/* Background Film Grain Texture */}
      <div className="grain-overlay" />

      {/* R3F 3D WebGL Canvas */}
      <Canvas
        shadows
        dpr={[1, 2]} // Capped to max 2 for high-DPI retina screens without GPU melting
        gl={{
          powerPreference: 'high-performance',
          antialias: false, // Handled by postprocessing multisampling
          stencil: false,
          depth: true
        }}
        camera={{
          position: [0, 1.8, 7.2],
          fov: 48,
          near: 0.1,
          far: 100
        }}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: '#070709'
        }}
      >
        <Experience activeChapter={activeChapter} />
      </Canvas>

      {/* Awwwards HTML/CSS Glassmorphic Overlay */}
      <Overlay
        activeChapter={activeChapter}
        onSelectChapter={setActiveChapter}
      />

      {/* 3D Asset Stream Progress Loader */}
      <Loader />
    </div>
  );
}
