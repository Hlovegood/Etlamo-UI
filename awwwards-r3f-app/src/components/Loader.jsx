import { useProgress } from '@react-three/drei';
import { useEffect, useState } from 'react';

export default function Loader() {
  const { active, progress } = useProgress();
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (!active && progress === 100) {
      const timer = setTimeout(() => setVisible(false), 800);
      return () => clearTimeout(timer);
    }
  }, [active, progress]);

  if (!visible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: '#070709',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '24px',
        transition: 'opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
        opacity: active || progress < 100 ? 1 : 0,
        pointerEvents: active ? 'auto' : 'none'
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <span
          className="font-mono"
          style={{
            fontSize: '11px',
            letterSpacing: '0.24em',
            color: '#d4af37',
            textTransform: 'uppercase',
            display: 'block',
            marginBottom: '8px'
          }}
        >
          Sovereign Spatial Core
        </span>
        <h2
          className="title-serif"
          style={{
            fontSize: '32px',
            color: '#f5f5f7',
            letterSpacing: '0.06em'
          }}
        >
          CHRONOS
        </h2>
      </div>

      {/* Progress Bar Container */}
      <div
        style={{
          width: '260px',
          height: '2px',
          background: 'rgba(255, 255, 255, 0.1)',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            height: '100%',
            width: `${progress}%`,
            background: 'linear-gradient(90deg, #d4af37, #00e5ff)',
            boxShadow: '0 0 12px #d4af37',
            transition: 'width 0.3s ease-out'
          }}
        />
      </div>

      <span
        className="font-mono"
        style={{
          fontSize: '12px',
          color: '#8e8d9a',
          letterSpacing: '0.12em'
        }}
      >
        INITIALIZING SHADERS {Math.round(progress)}%
      </span>
    </div>
  );
}
