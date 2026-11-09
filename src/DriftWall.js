// DriftWall - Native Vanilla ESM Engine for React Bits <DriftWall />
// Full 3D perspective drifting tile wall with alternating column momentum, pointer damping, and smooth dynamic updates

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const columnFactor = (index, variance) => {
  const pseudo = ((index * 0.6180339887 + 0.35) % 1) * 2 - 1;
  return 1 + variance * pseudo;
};

export function createDriftWall(container, {
  items = [],
  columns = 'auto',
  tileWidth = 220,
  tileHeight = 145,
  gap = 18,
  radius = 14,
  tilt = 16,
  turn = -14,
  roll = 0,
  perspective = 1200,
  depth = 100,
  speed = 42,
  direction = 'up',
  variance = 0.45,
  parallax = 0.6,
  pauseOnHover = false,
  lift = 64,
  fade = 0,
  dim = 0.65,
  grayscale = false,
  overlayColor = '#060010',
  className = '',
  onTileClick = () => {}
} = {}) {
  if (!container) return { destroy: () => {}, updateItems: () => {}, setWarp: () => {} };

  let isDestroyed = false;
  let rafId = null;
  let lastTs = null;
  let currentItems = items.length ? items : [];
  let currentOverlayColor = overlayColor;
  let reduced = prefersReducedMotion();

  let containerWidth = container.clientWidth || (typeof window !== 'undefined' ? window.innerWidth : 1200);
  let containerHeight = container.clientHeight || (typeof window !== 'undefined' ? window.innerHeight : 800);

  const autoColumns = columns === 'auto' || typeof columns !== 'number';
  function computeColCount() {
    if (!autoColumns) return columns;
    const unit = tileWidth + gap;
    // Overfill width by 50% so 3D rotation (rotateX & rotateY) never leaves empty borders
    return Math.max(4, Math.ceil((containerWidth * 1.5) / unit));
  }
  let activeColumns = computeColCount();

  const pointer = { x: 0, y: 0 };
  const pointerDamped = { x: 0, y: 0 };
  let wallHovered = false;
  let hoveredCol = -1;
  let activeId = null;

  // Warp transition state
  let isWarping = false;
  let warpProgress = 0;

  // Root Element
  const root = document.createElement('div');
  root.className = ['drift-wall', reduced ? 'drift-wall--reduced' : '', className].filter(Boolean).join(' ');
  root.setAttribute('role', 'group');
  root.setAttribute('aria-label', 'Drifting wall of tiles');

  function applyCssVars() {
    root.style.setProperty('--dw-tile-w', `${tileWidth}px`);
    root.style.setProperty('--dw-tile-h', `${tileHeight}px`);
    root.style.setProperty('--dw-gap', `${gap}px`);
    root.style.setProperty('--dw-radius', `${radius}px`);
    root.style.setProperty('--dw-perspective', `${perspective}px`);
    root.style.setProperty('--dw-lift', `${lift}px`);
    root.style.setProperty('--dw-dim', String(dim));
    root.style.setProperty('--dw-gray', grayscale ? '1' : '0');
    root.style.setProperty('--dw-overlay', currentOverlayColor);
    root.style.setProperty('--dw-edge', `${Math.max(0, (1 - fade) * 100)}%`);

    if (fade === 0) {
      root.style.maskImage = 'none';
      root.style.webkitMaskImage = 'none';
    } else {
      root.style.maskImage = '';
      root.style.webkitMaskImage = '';
    }
  }
  applyCssVars();

  // 3D Plane Element
  const plane = document.createElement('div');
  plane.className = 'drift-wall__plane';
  root.appendChild(plane);
  container.appendChild(root);

  // ResizeObserver to adapt container width and height dynamically
  const ro = new ResizeObserver(([entry]) => {
    if (isDestroyed) return;
    const w = entry.contentRect.width;
    const h = entry.contentRect.height;
    let needsRebuild = false;
    if (h && Math.abs(h - containerHeight) > 15) {
      containerHeight = h;
      needsRebuild = true;
    }
    if (w && Math.abs(w - containerWidth) > 30) {
      containerWidth = w;
      needsRebuild = true;
    }
    if (needsRebuild) {
      rebuildColumns();
    }
  });
  ro.observe(container);

  // Reduced motion listener
  const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
  const handleMq = e => {
    reduced = e.matches;
    root.classList.toggle('drift-wall--reduced', reduced);
  };
  mq.addEventListener('change', handleMq);

  // State structures for columns
  let columnItems = [];
  let columnMeta = [];
  let baseVelocities = [];
  let offsets = [];
  let velocities = [];
  let trackEls = [];

  function rebuildColumns() {
    plane.innerHTML = '';
    trackEls = [];
    activeColumns = computeColCount();

    // Distribute items across columns
    columnItems = Array.from({ length: activeColumns }, () => []);
    if (currentItems.length > 0) {
      currentItems.forEach((item, i) => columnItems[i % activeColumns].push(item));
    }
    columnItems = columnItems.map(col => (col.length ? col : (currentItems.slice(0, 1).length ? currentItems.slice(0, 1) : [{ image: '', title: '' }])));

    const unit = tileHeight + gap;
    columnMeta = columnItems.map(col => {
      const copyHeight = Math.max(unit, col.length * unit);
      const copies = Math.max(3, Math.ceil((containerHeight * 2.8) / copyHeight) + 2);
      return { copyHeight, copies };
    });

    const dirSign = direction === 'up' ? 1 : -1;
    baseVelocities = columnItems.map((_, c) => {
      const altSign = c % 2 === 0 ? 1 : -1;
      return speed * columnFactor(c, variance) * dirSign * altSign;
    });

    offsets = columnMeta.map((meta, c) => meta.copyHeight * ((c * 0.37) % 1));
    velocities = columnItems.map(() => 0);

    // Build DOM for columns & tracks
    for (let c = 0; c < activeColumns; c++) {
      const colEl = document.createElement('div');
      colEl.className = 'drift-wall__col';

      const trackEl = document.createElement('div');
      trackEl.className = 'drift-wall__track';
      trackEls.push(trackEl);

      const colData = columnItems[c];
      const meta = columnMeta[c];

      for (let copyIndex = 0; copyIndex < meta.copies; copyIndex++) {
        colData.forEach((item, itemIndex) => {
          const tileId = `${c}-${copyIndex}-${itemIndex}`;
          const tileEl = document.createElement(item.href ? 'a' : 'div');
          tileEl.className = `drift-wall__tile${activeId === tileId ? ' is-active' : ''}`;
          tileEl.dataset.tileId = tileId;
          tileEl.dataset.col = String(c);

          if (item.href) {
            tileEl.href = item.href;
            tileEl.target = '_blank';
            tileEl.rel = 'noreferrer noopener';
          } else {
            tileEl.setAttribute('tabindex', '0');
            tileEl.setAttribute('role', 'button');
            tileEl.setAttribute('aria-label', item.title || 'Venue tile');
          }

          const innerEl = document.createElement('span');
          innerEl.className = 'drift-wall__inner';

          const img = document.createElement('img');
          img.src = item.image;
          img.alt = item.title || '';
          img.loading = 'lazy';
          img.decoding = 'async';
          img.draggable = false;
          img.onerror = () => {
            img.src = '/public/images/celebration-portal.jpg';
          };

          const overlay = document.createElement('span');
          overlay.className = 'drift-wall__overlay';
          overlay.setAttribute('aria-hidden', 'true');

          innerEl.appendChild(img);
          innerEl.appendChild(overlay);
          tileEl.appendChild(innerEl);

          // Focus / blur handlers
          tileEl.addEventListener('focus', () => {
            activeId = tileId;
            hoveredCol = c;
            tileEl.classList.add('is-active');
          });
          tileEl.addEventListener('blur', () => {
            if (activeId === tileId) {
              activeId = null;
              hoveredCol = -1;
              tileEl.classList.remove('is-active');
            }
          });

          tileEl.addEventListener('click', (e) => {
            onTileClick(item, itemIndex, e);
          });

          trackEl.appendChild(tileEl);
        });
      }

      colEl.appendChild(trackEl);
      plane.appendChild(colEl);
    }
  }

  rebuildColumns();

  function applyPlaneTransform(px, py) {
    if (!plane) return;
    if (isWarping) {
      const currentScale = 1.36 + warpProgress * 1.5;
      const currentTilt = (tilt + py) * (1 - warpProgress * 0.9);
      const currentTurn = (turn + px) * (1 - warpProgress * 0.9);
      const currentZ = -depth + warpProgress * 1800;
      plane.style.transform =
        `translate(-50%, -50%) scale(${currentScale.toFixed(3)}) ` +
        `rotateX(${currentTilt.toFixed(2)}deg) rotateY(${currentTurn.toFixed(2)}deg) rotateZ(${roll}deg) ` +
        `translateZ(${currentZ.toFixed(1)}px)`;
      plane.style.opacity = String(Math.max(0, 1 - warpProgress * 1.35));
    } else {
      plane.style.transform =
        `translate(-50%, -50%) scale(1.36) ` +
        `rotateX(${tilt + py}deg) rotateY(${turn + px}deg) rotateZ(${roll}deg) ` +
        `translateZ(${-depth}px)`;
      plane.style.opacity = '1';
    }
  }

  // Pointer Interaction
  const onPointerMove = e => {
    const rect = container.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    if (parallax > 0 && !reduced && !isWarping) {
      pointer.x = (e.clientX - rect.left) / rect.width - 0.5;
      pointer.y = (e.clientY - rect.top) / rect.height - 0.5;
    }
    const hit = document.elementFromPoint(e.clientX, e.clientY);
    const tile = hit && hit.closest ? hit.closest('[data-tile-id]') : null;
    if (!tile) {
      if (activeId !== null) {
        const prev = root.querySelector(`[data-tile-id="${activeId}"]`);
        prev?.classList.remove('is-active');
        activeId = null;
        hoveredCol = -1;
      }
      return;
    }
    const id = tile.dataset.tileId;
    if (id === activeId) return;
    if (activeId !== null) {
      const prev = root.querySelector(`[data-tile-id="${activeId}"]`);
      prev?.classList.remove('is-active');
    }
    activeId = id;
    hoveredCol = Number(tile.dataset.col);
    tile.classList.add('is-active');
  };

  const onPointerEnter = () => {
    wallHovered = true;
  };

  const onPointerLeave = () => {
    wallHovered = false;
    pointer.x = 0;
    pointer.y = 0;
    if (activeId !== null) {
      const prev = root.querySelector(`[data-tile-id="${activeId}"]`);
      prev?.classList.remove('is-active');
      activeId = null;
      hoveredCol = -1;
    }
  };

  root.addEventListener('pointermove', onPointerMove, { passive: true });
  root.addEventListener('pointerenter', onPointerEnter);
  root.addEventListener('pointerleave', onPointerLeave);

  // Animation Loop
  function animate(ts) {
    if (isDestroyed) return;
    if (lastTs === null) lastTs = ts;
    const dt = Math.min(0.05, Math.max(0, ts - lastTs) / 1000);
    lastTs = ts;

    const maxTilt = parallax * 8;
    const targetX = pointer.x * maxTilt;
    const targetY = -pointer.y * maxTilt;
    const damp = 1 - Math.exp(-dt / 0.12);
    pointerDamped.x += (targetX - pointerDamped.x) * damp;
    pointerDamped.y += (targetY - pointerDamped.y) * damp;
    applyPlaneTransform(pointerDamped.x, pointerDamped.y);

    const speedBoost = isWarping ? (1 + warpProgress * 4.5) : 1;

    if (!reduced) {
      for (let c = 0; c < trackEls.length; c++) {
        const meta = columnMeta[c];
        if (!meta) continue;
        const paused = wallHovered && pauseOnHover && !isWarping;
        const factor = paused || (hoveredCol === c && !isWarping) ? 0 : 1;
        const target = baseVelocities[c] * factor;

        const ease = 1 - Math.exp(-dt / (target === 0 ? 0.16 : 0.28));
        velocities[c] += (target - velocities[c]) * ease;
        let next = (offsets[c] ?? 0) + velocities[c] * speedBoost * dt;
        next = ((next % meta.copyHeight) + meta.copyHeight) % meta.copyHeight;
        offsets[c] = next;

        const el = trackEls[c];
        if (el) el.style.transform = `translate3d(0, ${-next.toFixed(2)}px, 0)`;
      }
    } else {
      for (let c = 0; c < trackEls.length; c++) {
        const el = trackEls[c];
        const meta = columnMeta[c];
        if (el && meta) el.style.transform = `translate3d(0, ${-(offsets[c] ?? 0).toFixed(2)}px, 0)`;
      }
    }

    rafId = requestAnimationFrame(animate);
  }

  rafId = requestAnimationFrame(animate);

  return {
    root,
    plane,
    setWarp(progress) {
      isWarping = progress > 0;
      warpProgress = Math.max(0, Math.min(1, progress));
    },
    updateItems(newItems, newOverlayColor) {
      if (isDestroyed) return;
      if (newItems && newItems.length) {
        currentItems = newItems;
      }
      if (newOverlayColor) {
        currentOverlayColor = newOverlayColor;
        root.style.setProperty('--dw-overlay', currentOverlayColor);
      }
      rebuildColumns();
    },
    destroy() {
      isDestroyed = true;
      if (rafId) cancelAnimationFrame(rafId);
      ro.disconnect();
      mq.removeEventListener('change', handleMq);
      root.removeEventListener('pointermove', onPointerMove);
      root.removeEventListener('pointerenter', onPointerEnter);
      root.removeEventListener('pointerleave', onPointerLeave);
      root.remove();
    }
  };
}

export default createDriftWall;
