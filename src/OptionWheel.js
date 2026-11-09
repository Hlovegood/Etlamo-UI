// OptionWheel - Native Vanilla ESM Engine for React Bits OptionWheel
// Frame-rate independent exponential smoothing & circular 3D trigonometric layout along an arc

import { sound } from './sound.js';

const DEFAULT_ITEMS = [
  'Weddings',
  'Conferences'
];

export function createOptionWheel(container, {
  items = DEFAULT_ITEMS,
  defaultSelected = 0,
  onChange,
  textColor = '#a6a6a6',
  activeColor = '#ffffff',
  side = 'left',
  fontSize = 3,
  spacing = 1.4,
  curve = 1,
  tilt = 6,
  blur = 2,
  fade = 0.25,
  minOpacity = 0.05,
  smoothing = 200,
  inset = 80,
  loop = false,
  draggable = true,
  soundUrl = '',
  soundVolume = 0.5,
  className = ''
} = {}) {
  if (!container) return { destroy: () => {} };

  let isDestroyed = false;
  let rafId = null;
  let lastTime = performance.now();
  let pos = defaultSelected;
  let target = defaultSelected;
  let selectedIndex = defaultSelected;
  let isDragging = false;
  let wheelTimer = null;
  let dragData = null;
  let dragMoved = false;
  let lastTickTime = 0;
  let audioEl = null;

  const remPx = typeof window !== 'undefined'
    ? parseFloat(getComputedStyle(document.documentElement).fontSize) || 16
    : 16;

  const cfg = {
    count: items.length,
    items,
    rowH: Math.max(fontSize * spacing * remPx, 1),
    curve,
    tilt,
    blur,
    fade,
    minOpacity,
    side,
    loop,
    smoothing,
    draggable,
    soundUrl,
    soundVolume
  };

  // Build DOM Structure
  const root = document.createElement('div');
  root.setAttribute('role', 'listbox');
  root.setAttribute('tabindex', '0');
  root.setAttribute('aria-label', 'Option wheel');
  root.className = `option-wheel${side === 'right' ? ' option-wheel--right' : ''}${className ? ` ${className}` : ''}`;
  root.style.setProperty('--ow-text-color', textColor);
  root.style.setProperty('--ow-active-color', activeColor);
  root.style.setProperty('--ow-font-size', `${fontSize}rem`);
  root.style.setProperty('--ow-inset', `${inset}px`);

  const itemEls = items.map((label, index) => {
    const el = document.createElement('div');
    el.setAttribute('role', 'option');
    el.setAttribute('aria-selected', String(selectedIndex === index));
    el.className = `option-wheel__item${selectedIndex === index ? ' option-wheel__item--selected' : ''}`;
    el.textContent = label;
    root.appendChild(el);
    return el;
  });

  container.appendChild(root);

  function playTick() {
    const now = performance.now();
    if (now - lastTickTime < 70) return;
    lastTickTime = now;

    // Use synthesized tactile sound haptics or audio
    sound.tap();

    if (cfg.soundUrl) {
      if (!audioEl) {
        audioEl = new Audio(cfg.soundUrl);
        audioEl.preload = 'auto';
      }
      audioEl.volume = Math.min(Math.max(cfg.soundVolume, 0), 1);
      audioEl.currentTime = 0;
      audioEl.play()?.catch(() => {});
    }
  }

  function runFrame(now) {
    if (isDestroyed) return;
    const dt = Math.min((now - lastTime) / 1000, 0.05);
    lastTime = now;

    const tau = Math.max(cfg.smoothing, 1) / 1000;
    const k = 1 - Math.exp(-dt / tau);

    let next = pos + (target - pos) * k;
    const settled = Math.abs(target - next) < 0.001;
    if (settled) next = target;
    pos = next;

    const n = cfg.count;
    const mirror = cfg.side === 'right' ? -1 : 1;
    const tiltRad = (cfg.tilt * Math.PI) / 180;
    const R = tiltRad > 0.0005 ? cfg.rowH / tiltRad : 0;

    for (let i = 0; i < n; i++) {
      const el = itemEls[i];
      if (!el) continue;
      let d = i - next;
      if (cfg.loop && n > 1) {
        d = ((d % n) + n) % n;
        if (d > n / 2) d -= n;
      }
      const dist = Math.abs(d);
      let x = 0;
      let y = d * cfg.rowH;
      let rot = 0;
      if (R > 0) {
        const ang = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, d * tiltRad));
        y = R * Math.sin(ang);
        x = -mirror * R * (1 - Math.cos(ang)) * cfg.curve;
        rot = (mirror * ang * 180) / Math.PI;
      }

      el.style.transform = `translate(${x.toFixed(2)}px, calc(${y.toFixed(2)}px - 50%)) rotate(${rot.toFixed(3)}deg)`;
      el.style.opacity = String(Math.max(cfg.minOpacity, 1 - dist * cfg.fade));
      el.style.filter = cfg.blur > 0 ? `blur(${(dist * cfg.blur).toFixed(2)}px)` : 'none';
      el.style.setProperty('--ow-p', Math.max(0, 1 - Math.min(dist, 1)).toFixed(4));
    }

    if (!settled) {
      rafId = requestAnimationFrame(runFrame);
    } else {
      rafId = null;
    }
  }

  function startLoop() {
    if (rafId != null) {
      cancelAnimationFrame(rafId);
    }
    lastTime = performance.now();
    rafId = requestAnimationFrame(runFrame);
  }

  function applyTarget(value, snap) {
    let v = value;
    if (!cfg.loop) v = Math.min(Math.max(v, 0), Math.max(cfg.count - 1, 0));
    if (snap) v = Math.round(v);
    target = v;

    const idx = ((Math.round(v) % cfg.count) + cfg.count) % cfg.count;
    if (idx !== selectedIndex) {
      selectedIndex = idx;
      itemEls.forEach((el, i) => {
        const isSel = i === idx;
        el.setAttribute('aria-selected', String(isSel));
        el.classList.toggle('option-wheel__item--selected', isSel);
      });
      onChange?.(idx, cfg.items[idx]);
      playTick();
    }
    startLoop();
  }

  // Wheel listener
  const onWheel = e => {
    e.preventDefault();
    const delta = e.deltaMode === 1 ? e.deltaY * 24 : e.deltaY;
    const step = Math.max(-1, Math.min(1, delta / cfg.rowH));
    applyTarget(target + step, false);
    if (wheelTimer) clearTimeout(wheelTimer);
    wheelTimer = setTimeout(() => applyTarget(target, true), 140);
  };
  root.addEventListener('wheel', onWheel, { passive: false });

  // Pointer Drag listeners
  const onPointerDown = e => {
    if (!cfg.draggable) return;
    dragData = { y: e.clientY, start: target, id: e.pointerId };
    dragMoved = false;
    isDragging = true;
    root.classList.add('option-wheel--dragging');
  };

  const onPointerMove = e => {
    if (!dragData) return;
    const dy = e.clientY - dragData.y;
    if (!dragMoved && Math.abs(dy) > 4) {
      dragMoved = true;
      root.setPointerCapture?.(dragData.id);
    }
    if (dragMoved) {
      applyTarget(dragData.start - dy / cfg.rowH, false);
    }
  };

  const onPointerEnd = () => {
    if (!dragData) return;
    dragData = null;
    isDragging = false;
    root.classList.remove('option-wheel--dragging');
    if (dragMoved) {
      applyTarget(target, true);
    }
  };

  root.addEventListener('pointerdown', onPointerDown);
  root.addEventListener('pointermove', onPointerMove);
  root.addEventListener('pointerup', onPointerEnd);
  root.addEventListener('pointercancel', onPointerEnd);

  // Item click listeners
  itemEls.forEach((el, index) => {
    el.addEventListener('click', () => {
      if (dragMoved) return;
      const cur = target;
      let d = index - (((cur % cfg.count) + cfg.count) % cfg.count);
      if (cfg.loop && cfg.count > 1) {
        if (d > cfg.count / 2) d -= cfg.count;
        else if (d < -cfg.count / 2) d += cfg.count;
      }
      applyTarget(cur + d, true);
    });
  });

  // Keyboard navigation
  const onKeyDown = e => {
    let delta = null;
    if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') delta = -1;
    else if (e.key === 'ArrowDown' || e.key === 'ArrowRight') delta = 1;
    if (delta == null) return;
    e.preventDefault();
    applyTarget(Math.round(target) + delta, true);
  };
  root.addEventListener('keydown', onKeyDown);

  // Initial trigger
  applyTarget(defaultSelected, true);

  return {
    root,
    destroy() {
      isDestroyed = true;
      if (rafId != null) cancelAnimationFrame(rafId);
      if (wheelTimer) clearTimeout(wheelTimer);
      root.removeEventListener('wheel', onWheel);
      root.removeEventListener('pointerdown', onPointerDown);
      root.removeEventListener('pointermove', onPointerMove);
      root.removeEventListener('pointerup', onPointerEnd);
      root.removeEventListener('pointercancel', onPointerEnd);
      root.removeEventListener('keydown', onKeyDown);
      root.remove();
    },
    setTarget(val, snap = true) {
      applyTarget(val, snap);
    },
    getSelected() {
      return selectedIndex;
    },
    next() {
      applyTarget(Math.round(target) + 1, true);
    },
    prev() {
      applyTarget(Math.round(target) - 1, true);
    }
  };
}

export default createOptionWheel;
