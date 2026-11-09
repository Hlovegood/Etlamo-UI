// WEDDO — Sovereign Film-Advance Custom Preloader
// Inspired by Slide 6 (Satyam Dubey / thedesignshop.tds / Lusion)
// "Counts up like film advancing before the reveal."

import { weddoLogoSvg } from './logo.js';
import { sound } from './sound.js';
import { getLanguage } from './store.js';

let activePreloader = null;

export function initPreloader({ duration = 1600, onComplete = null, force = false } = {}) {
  // If already active or reduced-motion is requested, handle gracefully
  if (activePreloader) return activePreloader;

  const lang = getLanguage();
  const isAr = lang === 'ar';

  const overlay = document.createElement('div');
  overlay.id = 'weddo-preloader';
  overlay.className = 'weddo-preloader';
  overlay.setAttribute('role', 'progressbar');
  overlay.setAttribute('aria-label', isAr ? 'تحميل الموقع' : 'Loading website');
  overlay.setAttribute('aria-valuemin', '0');
  overlay.setAttribute('aria-valuemax', '100');
  overlay.setAttribute('aria-valuenow', '0');
  overlay.setAttribute('aria-live', 'polite');

  // Monumental 3-column Film Reel Strip
  const digits0to9 = Array.from({ length: 10 }, (_, i) => `<span class="film-digit">${i}</span>`).join('');
  const digits0to1 = `<span class="film-digit">0</span><span class="film-digit">1</span>`;

  overlay.innerHTML = `
    <header class="preloader-header">
      <div class="preloader-header-badge">
        <span class="preloader-pulse-dot" aria-hidden="true"></span>
        <span>${isAr ? 'بروتوكول اتلموا التراثي // ٢٠٢٦' : 'ETLAMO ARCHIVAL PROTOCOL // 2026'}</span>
      </div>
      <div class="preloader-header-coords" dir="ltr">
        <span>${isAr ? 'القاهرة، مصر' : 'CAIRO, EGYPT'} · 30.0444° N, 31.2357° E</span>
      </div>
    </header>

    <div class="preloader-center">
      <div class="preloader-mark-wrap" aria-hidden="true">
        ${weddoLogoSvg({ size: 'lg', iconOnly: true })}
      </div>
      <h1 class="preloader-brand-title">
        ${isAr ? 'اتلموا · قصور وقاعات مصر' : 'ETLAMO · ESTATES & SUMMITS'}
      </h1>
      <p class="preloader-brand-sub">
        ${isAr ? 'أفراح ملكية · قمم دولية · اجتماعات دبلوماسية' : 'ROYAL CELEBRATIONS & EXECUTIVE SUMMITS'}
      </p>
      <div class="preloader-track-wrap" aria-hidden="true">
        <div class="preloader-track">
          <div class="preloader-progress-bar" id="preloader-progress-bar"></div>
        </div>
      </div>
    </div>

    <footer class="preloader-footer">
      <div class="film-advance-counter" aria-hidden="true">
        <div class="film-reel-display" dir="ltr">
          <div class="film-reel-col">
            <div class="film-reel-strip" id="reel-hundreds">
              ${digits0to1}
            </div>
          </div>
          <div class="film-reel-col">
            <div class="film-reel-strip" id="reel-tens">
              ${digits0to9}
            </div>
          </div>
          <div class="film-reel-col">
            <div class="film-reel-strip" id="reel-units">
              ${digits0to9}
            </div>
          </div>
        </div>
        <div class="film-counter-meta">
          <span class="film-counter-percent">%</span>
          <span class="film-counter-label">${isAr ? 'تقديم الشريط' : '// FILM ADVANCE'}</span>
        </div>
      </div>

      <div class="preloader-footer-note">
        <span>${isAr ? 'منظومة المعاينة المعمارية والتوثيق' : 'ARCHITECTURAL PREVIEW & VERIFIED INVENTORY'}</span><br>
        <small style="opacity:0.7;">${isAr ? 'اضغط ESC للتخطي السريع' : 'PRESS ESC TO SKIP'}</small>
      </div>
    </footer>
  `;

  document.body.classList.add('is-preloading');
  document.body.appendChild(overlay);

  const bar = overlay.querySelector('#preloader-progress-bar');
  const reelH = overlay.querySelector('#reel-hundreds');
  const reelT = overlay.querySelector('#reel-tens');
  const reelU = overlay.querySelector('#reel-units');

  let current = 0;
  let target = 0;
  let animId = null;
  let dismissed = false;
  let lastSoundTick = 0;

  function updateVisuals(percent) {
    const clamped = Math.min(100, Math.max(0, Math.round(percent)));
    overlay.setAttribute('aria-valuenow', String(clamped));

    if (bar) bar.style.width = `${clamped}%`;

    const h = Math.floor(clamped / 100);
    const t = Math.floor((clamped % 100) / 10);
    const u = clamped % 10;

    if (reelH) reelH.style.transform = `translateY(-${h * 50}%)`;
    if (reelT) reelT.style.transform = `translateY(-${t * 10}%)`;
    if (reelU) reelU.style.transform = `translateY(-${u * 10}%)`;

    // Tactile sound tick every ~15% step as film advances
    if (clamped - lastSoundTick >= 15 && clamped < 100) {
      sound.tap();
      lastSoundTick = clamped;
    }
  }

  function dismiss() {
    if (dismissed) return;
    dismissed = true;
    cancelAnimationFrame(animId);
    window.removeEventListener('keydown', handleKey);

    updateVisuals(100);
    sound.success();

    setTimeout(() => {
      overlay.classList.add('is-exiting');
      document.body.classList.remove('is-preloading');
      document.body.classList.add('is-revealing');

      setTimeout(() => {
        overlay.remove();
        document.body.classList.remove('is-revealing');
        activePreloader = null;
        window.dispatchEvent(new CustomEvent('weddo:loaded', { detail: { timestamp: Date.now() } }));
        if (typeof onComplete === 'function') onComplete();
      }, 760);
    }, 200);
  }

  function handleKey(e) {
    if (e.key === 'Escape' || e.key === 'Enter') {
      e.preventDefault();
      dismiss();
    }
  }
  window.addEventListener('keydown', handleKey);

  // Check reduced motion
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    setTimeout(dismiss, 100);
    return { dismiss, setProgress: () => {} };
  }

  // Smooth cinematic film-advance ticker
  const startTime = performance.now();
  function tick(now) {
    const elapsed = now - startTime;
    const progress = Math.min(1, elapsed / duration);

    // Ease-in-out advancing curve (simulates physical film reel momentum)
    const eased = progress < 0.5 
      ? 4 * progress * progress * progress 
      : 1 - Math.pow(-2 * progress + 2, 3) / 2;

    current = eased * 100;
    updateVisuals(current);

    if (progress < 1) {
      animId = requestAnimationFrame(tick);
    } else {
      dismiss();
    }
  }

  animId = requestAnimationFrame(tick);

  activePreloader = {
    dismiss,
    setProgress: (val) => {
      target = Math.min(100, Math.max(0, val));
      if (target >= 100) dismiss();
      else updateVisuals(target);
    }
  };

  return activePreloader;
}

// Global hook for development, user testing, or future multi-page experience transitions
if (typeof window !== 'undefined') {
  window.weddoPreloader = {
    run: (opts) => initPreloader({ ...opts, force: true }),
    dismiss: () => activePreloader?.dismiss()
  };
}
