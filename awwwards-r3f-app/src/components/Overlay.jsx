import { useState } from 'react';
import { Volume2, VolumeX, Compass, Sparkles, ArrowRight } from 'lucide-react';
import { audio } from '../utils/audio';

const CHAPTERS = [
  {
    index: '01',
    badge: 'ARCHITECTURAL OVERVIEW',
    title: 'THE CHRONOS MONOLITH',
    desc: 'An avant-garde kinetic sculpture synthesizing quantum mechanics, iridescent refractive materials, and real-time GPU raymarching.'
  },
  {
    index: '02',
    badge: 'OPTICAL REFRACTION',
    title: 'QUANTUM CORE DYNAMICS',
    desc: 'Custom GLSL shaders with multi-spectral Fresnel rim dispersion, anisotropic refraction, and physical contact occlusion.'
  },
  {
    index: '03',
    badge: 'KINETIC SYSTEM',
    title: 'ORBITAL RESTITUTION',
    desc: 'High-frequency Rapier rigid-body collision simulations reacting dynamically to pointer gravitation, physical velocity, and harmonic impulse.'
  }
];

export default function Overlay({ activeChapter = 0, onSelectChapter = () => {} }) {
  const [audioActive, setAudioActive] = useState(false);

  const toggleSound = () => {
    const isNowActive = audio.toggle();
    setAudioActive(isNowActive);
  };

  const currentChapter = CHAPTERS[activeChapter] || CHAPTERS[0];

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: 'clamp(20px, 3.5vw, 44px)',
        zIndex: 10
      }}
    >
      {/* Top Navigation Bar */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          pointerEvents: 'auto'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              background: '#d4af37',
              boxShadow: '0 0 12px #d4af37'
            }}
          />
          <span
            className="font-mono"
            style={{
              fontSize: '12px',
              fontWeight: 600,
              letterSpacing: '0.16em',
              color: '#f5f5f7'
            }}
          >
            CHRONOS // 2026
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            type="button"
            className="glass-pill"
            onClick={toggleSound}
            aria-label="Toggle Spatial Audio"
            style={{
              borderColor: audioActive ? 'var(--accent-gold)' : 'rgba(255, 255, 255, 0.1)',
              color: audioActive ? '#ffffff' : '#8e8d9a'
            }}
          >
            {audioActive ? <Volume2 size={14} color="#d4af37" /> : <VolumeX size={14} />}
            <span>{audioActive ? 'AUDIO ON' : 'AUDIO OFF'}</span>
          </button>

          <a
            href="https://awwwards.com"
            target="_blank"
            rel="noreferrer"
            className="glass-pill"
            style={{ display: 'none', textDecoration: 'none' }}
          >
            <Compass size={14} />
            <span>AWWWARDS SOTD</span>
          </a>
        </div>
      </header>

      {/* Main Chapter Content Info (Floating Left) */}
      <main
        style={{
          maxWidth: '560px',
          pointerEvents: 'auto',
          marginTop: 'auto',
          marginBottom: '28px'
        }}
      >
        <div
          className="glass-panel"
          style={{
            padding: 'clamp(28px, 4vw, 44px)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Sparkles size={14} color="#d4af37" />
            <span
              className="font-mono"
              style={{
                fontSize: '11px',
                fontWeight: 600,
                letterSpacing: '0.18em',
                color: '#d4af37',
                textTransform: 'uppercase'
              }}
            >
              {currentChapter.index} // {currentChapter.badge}
            </span>
          </div>

          <h1
            className="title-serif"
            style={{
              fontSize: 'clamp(32px, 4.2vw, 54px)',
              color: '#ffffff',
              margin: '2px 0 6px'
            }}
          >
            {currentChapter.title}
          </h1>

          <p
            style={{
              fontSize: 'clamp(14px, 1.4vw, 16px)',
              lineHeight: 1.65,
              color: 'var(--text-muted)',
              margin: 0
            }}
          >
            {currentChapter.desc}
          </p>

          <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '14px' }}>
            <button
              type="button"
              className="glass-pill"
              onClick={() => {
                const next = (activeChapter + 1) % CHAPTERS.length;
                onSelectChapter(next);
                audio.playTick(1000);
              }}
              style={{
                background: 'rgba(212, 175, 55, 0.15)',
                borderColor: 'var(--accent-gold)'
              }}
            >
              <span>NEXT STAGE</span>
              <ArrowRight size={13} color="#d4af37" />
            </button>
          </div>
        </div>
      </main>

      {/* Bottom Chapter Switcher Navigation */}
      <footer
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
          pointerEvents: 'auto'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {CHAPTERS.map((ch, idx) => (
            <button
              key={ch.index}
              type="button"
              className={`glass-pill ${activeChapter === idx ? 'active' : ''}`}
              onClick={() => {
                onSelectChapter(idx);
                audio.playTick(1100);
              }}
            >
              <span style={{ color: activeChapter === idx ? '#d4af37' : '#8e8d9a' }}>
                {ch.index}
              </span>
              <span>{ch.badge}</span>
            </button>
          ))}
        </div>

        <div
          className="font-mono"
          style={{
            fontSize: '11px',
            color: 'var(--text-muted)',
            letterSpacing: '0.12em',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <span>INTERACTION // DRAG TO ROTATE · CLICK ORBS TO LAUNCH</span>
        </div>
      </footer>
    </div>
  );
}
