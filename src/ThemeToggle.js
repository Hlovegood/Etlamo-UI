// ==========================================================================
// ThemeToggle - Native Engine for SunMoonThemeToggle
// Celestial Sky Dome with Arc Trajectory & Page Color Cross-Fade
// ==========================================================================

import { sound } from './sound.js';

export const MOON = { side: -1, spin: 25 };
export const SUN = { side: 1, spin: 120 };
export const ARC_RADIUS = 115;
export const QUARTER_TURN = Math.PI / 2;
export const KEYFRAME_STEPS = 30;
export const NIGHT_SKY = "linear-gradient(180deg, #090f2a 0%, #16204b 60%, #2a2f66 100%)";
export const DAY_SKY = "linear-gradient(180deg, #4ea8ff 0%, #9fd3ff 60%, #e3f3ff 100%)";
export const STARS = [
  { x: 24, y: 22, r: 1.6, t: 2100 },
  { x: 66, y: 16, r: 1.2, t: 2600 },
  { x: 80, y: 42, r: 1.8, t: 1900 },
  { x: 38, y: 58, r: 1.1, t: 2900 },
  { x: 58, y: 74, r: 1.4, t: 2300 },
  { x: 14, y: 72, r: 1.2, t: 2500 },
];
export const SKY_EASING = "cubic-bezier(0.65, 0, 0.35, 1)";
export const PAGE_FADE_STYLE_ID = "sun-moon-theme-fade";
export const PAGE_FADE_PROPERTIES = "color, background-color, border-color, outline-color, text-decoration-color, fill, stroke";

let pageFadeCleanup = 0;
const activeFlight = { current: [] };

function arcPoint(side, angle) {
  return { x: side * ARC_RADIUS * Math.sin(angle), y: ARC_RADIUS * (1 - Math.cos(angle)) };
}

function easeInCubic(t) {
  return t * t * t;
}

function easeOutBack(t) {
  const overshoot = 1.4;
  return 1 + (overshoot + 1) * Math.pow(t - 1, 3) + overshoot * Math.pow(t - 1, 2);
}

function settingKeyframes({ side, spin }) {
  return Array.from({ length: KEYFRAME_STEPS + 1 }, (_, i) => {
    const t = i / KEYFRAME_STEPS;
    const travelled = easeInCubic(t);
    const { x, y } = arcPoint(side, travelled * QUARTER_TURN);
    return {
      offset: t,
      transform: `translate(${x}%, ${y}%) rotate(${side * spin * travelled}deg)`,
      opacity: t < 0.55 ? 1 : (1 - t) / 0.45,
    };
  });
}

function risingKeyframes({ side, spin }) {
  return Array.from({ length: KEYFRAME_STEPS + 1 }, (_, i) => {
    const t = i / KEYFRAME_STEPS;
    const remaining = 1 - easeOutBack(t);
    const { x, y } = arcPoint(side, remaining * QUARTER_TURN);
    return {
      offset: t,
      transform: `translate(${x}%, ${y}%) rotate(${side * spin * remaining}deg) scale(${1 - 0.28 * remaining})`,
      opacity: Math.min(1, t / 0.3),
    };
  });
}

const KEYFRAMES = {
  moonSets: settingKeyframes(MOON),
  moonRises: risingKeyframes(MOON),
  sunSets: settingKeyframes(SUN),
  sunRises: risingKeyframes(SUN),
};

function prefersReducedMotion() {
  return typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function applyDocumentThemeFade(duration = 1740) {
  if (duration > 0 && !prefersReducedMotion() && typeof document !== 'undefined') {
    document.documentElement.classList.add('theme-transitioning');
    const style =
      document.getElementById(PAGE_FADE_STYLE_ID) ??
      document.head.appendChild(Object.assign(document.createElement("style"), { id: PAGE_FADE_STYLE_ID }));
    style.textContent = `html, body, #app, *, *::before, *::after { transition-property: ${PAGE_FADE_PROPERTIES} !important; transition-duration: ${duration}ms !important; transition-timing-function: cubic-bezier(0.65, 0, 0.35, 1) !important; transition-delay: 0s !important; }`;
    // Force style & layout recalculation so all text, surfaces, and divs register the transition before theme classes change
    void document.documentElement.offsetHeight;
    window.clearTimeout(pageFadeCleanup);
    pageFadeCleanup = window.setTimeout(() => {
      document.documentElement.classList.remove('theme-transitioning');
      style.remove();
    }, duration + 50);
  }
}

/**
 * Executes the WAAPI arc trajectory swap across all active SunMoonThemeToggle buttons on the page.
 */
function animateAllToggles(nextTheme, duration = 1740) {
  if (prefersReducedMotion()) return;

  const buttons = document.querySelectorAll('[data-slot="theme-toggle"], .sun-moon-toggle, .smoothui-theme-toggle');
  buttons.forEach(button => {
    const moon = button.querySelector('[data-body="moon"]');
    const sun = button.querySelector('[data-body="sun"]');
    const night = button.querySelector('[data-sky="night"]');
    const day = button.querySelector('[data-sky="day"]');

    if (!moon || !sun || typeof moon.animate !== 'function') return;

    const flight = button._sunMoonFlight = button._sunMoonFlight || { current: [] };

    // Toggling again mid-flight asks for the previous theme, which is exactly
    // the running swap played backwards from where it is now.
    if (flight.current.length > 0) {
      for (const animation of flight.current) animation.reverse();
      return;
    }

    const toLight = nextTheme === 'light';
    const setting = (toLight ? moon : sun).animate(toLight ? KEYFRAMES.moonSets : KEYFRAMES.sunSets, {
      duration: duration * 0.65,
      fill: 'both',
    });
    const rising = (toLight ? sun : moon).animate(toLight ? KEYFRAMES.sunRises : KEYFRAMES.moonRises, {
      duration: duration * 0.64,
      delay: duration * 0.36,
      fill: 'both',
    });
    const pair = [setting, rising];

    if (night && day) {
      const skyOptions = { duration, easing: SKY_EASING, fill: 'both' };
      pair.push(
        night.animate([{ opacity: toLight ? 1 : 0 }, { opacity: toLight ? 0 : 1 }], skyOptions),
        day.animate([{ opacity: toLight ? 0 : 1 }, { opacity: toLight ? 1 : 0 }], skyOptions)
      );
    }

    flight.current = pair;
    Promise.all(pair.map(anim => anim.finished)).then(() => {
      if (flight.current !== pair) return;
      flight.current = [];
      if (moon) {
        moon.style.transform = toLight ? 'translate(-115%, 115%)' : 'none';
        moon.style.opacity = toLight ? '0' : '1';
      }
      if (sun) {
        sun.style.transform = toLight ? 'none' : 'translate(115%, 115%)';
        sun.style.opacity = toLight ? '1' : '0';
      }
      if (night) night.style.opacity = toLight ? '0' : '1';
      if (day) day.style.opacity = toLight ? '1' : '0';
      for (const anim of pair) anim.cancel();
    }).catch(err => {
      if (!(err instanceof DOMException && err.name === 'AbortError')) throw err;
    });
  });
}

/**
 * Renders the HTML markup for SunMoonThemeToggle.
 */
export function renderThemeToggle({
  isDark = false,
  className = '',
  id = '',
  size = 42,
  lang = 'ar'
} = {}) {
  const isAr = lang === 'ar' || (typeof document !== 'undefined' && document.documentElement.lang === 'ar');
  const label = isDark
    ? (isAr ? 'التبديل إلى الوضع النهاري' : 'Switch to light theme')
    : (isAr ? 'التبديل إلى الوضع الليلي' : 'Switch to dark theme');
  const title = isDark
    ? (isAr ? 'الوضع النهاري' : 'Light theme')
    : (isAr ? 'الوضع الليلي' : 'Dark theme');

  const currentTheme = isDark ? 'dark' : 'light';

  return `
    <button
      type="button"
      data-action="theme"
      data-slot="theme-toggle"
      data-state="${currentTheme}"
      aria-label="${label}"
      title="${title}"
      class="sun-moon-toggle smoothui-theme-toggle ${className}"
      style="width: ${size}px; height: ${size}px;"
      ${id ? `id="${id}"` : ''}
    >
      <span
        aria-hidden="true"
        data-sky="night"
        class="sun-moon-sky sun-moon-sky--night"
        style="background: ${NIGHT_SKY}; opacity: ${isDark ? 1 : 0};"
      >
        ${STARS.map((star, idx) => `
          <span
            data-star
            class="sun-moon-star"
            style="left: ${star.x}%; top: ${star.y}%; width: ${star.r * 2}px; height: ${star.r * 2}px; animation-duration: ${star.t}ms; animation-delay: ${-idx * 530}ms;"
          ></span>
        `).join('')}
      </span>
      <span
        aria-hidden="true"
        data-sky="day"
        class="sun-moon-sky sun-moon-sky--day"
        style="background: ${DAY_SKY}; opacity: ${isDark ? 0 : 1};"
      ></span>
      <span
        aria-hidden="true"
        data-body="moon"
        class="sun-moon-body sun-moon-body--moon text-amber-200"
        style="transform: ${isDark ? 'none' : 'translate(-115%, 115%)'}; opacity: ${isDark ? 1 : 0};"
      >
        <svg class="sun-moon-svg" viewBox="0 0 24 24" fill="currentColor" stroke="none" aria-hidden="true">
          <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>
        </svg>
      </span>
      <span
        aria-hidden="true"
        data-body="sun"
        class="sun-moon-body sun-moon-body--sun text-orange-400"
        style="transform: ${isDark ? 'translate(115%, 115%)' : 'none'}; opacity: ${isDark ? 0 : 1};"
      >
        <svg class="sun-moon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="4"/>
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2m-17.07 7.07 1.41-1.41m11.32-11.32 1.41-1.41"/>
        </svg>
      </span>
    </button>
  `;
}

/**
 * Toggles the theme across the document with SunMoon celestial trajectory and page color cross-fade.
 */
export function toggleSmoothTheme(event, onComplete) {
  sound.tap();

  const isDarkNow = document.documentElement.classList.contains('dark');
  const nextIsDark = !isDarkNow;
  const nextTheme = nextIsDark ? 'dark' : 'light';
  const duration = 1740;

  // 1. Trigger the celestial bodies and sky dome animation
  animateAllToggles(nextTheme, duration);

  // 2. Smoothly fade the entire page colors over duration
  applyDocumentThemeFade(duration);

  // 3. Toggle document classes and state
  document.documentElement.classList.toggle('dark', nextIsDark);
  document.documentElement.setAttribute('data-theme', nextTheme);
  try {
    localStorage.setItem('weddo_theme', nextTheme);
  } catch (_) {}

  const meta = document.getElementById('theme-color-meta');
  if (meta) meta.setAttribute('content', nextIsDark ? '#070d09' : '#fcf8f2');

  // 4. Update data-state on all buttons
  document.querySelectorAll('[data-slot="theme-toggle"], .sun-moon-toggle').forEach(btn => {
    btn.setAttribute('data-state', nextTheme);
    btn.setAttribute('aria-label', nextIsDark ? 'Switch to light theme' : 'Switch to dark theme');
  });

  if (typeof onComplete === 'function') {
    setTimeout(() => {
      onComplete(nextIsDark);
    }, duration);
  }
}

export default { renderThemeToggle, toggleSmoothTheme };
