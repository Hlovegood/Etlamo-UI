// ==========================================================================
// WEDDO — ReactBits Experience Enhancement Engine
// High-Fashion Interactive Micro-Interactions:
// 1. SpotlightCard (mouse-following ambient illumination)
// 2. Magnet (fluid physics gravitational pull on buttons and pills)
// 3. CountUp (architectural metric interpolation)
// ==========================================================================

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Initializes ReactBits SpotlightCard on cards and media containers.
 */
export function initSpotlightCards(root = document) {
  if (prefersReducedMotion()) return;
  const cards = root.querySelectorAll?.('.venue-card, .space-card, .package-card, .detail-art, .step, .planner-spotlight');
  if (!cards || !cards.length) return;

  cards.forEach(card => {
    if (card._spotlightInitialized) return;
    card._spotlightInitialized = true;
    card.classList.add('spotlight-card');

    const handlePointerMove = e => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      card.style.setProperty('--mouse-x', `${x}px`);
      card.style.setProperty('--mouse-y', `${y}px`);
      card.style.setProperty('--spotlight-opacity', '1');
    };

    const handlePointerLeave = () => {
      card.style.setProperty('--spotlight-opacity', '0');
    };

    card.addEventListener('pointermove', handlePointerMove, { passive: true });
    card.addEventListener('pointerleave', handlePointerLeave, { passive: true });
  });
}

/**
 * Initializes ReactBits Magnet attraction on interactive buttons and pills.
 */
export function initMagnets(root = document) {
  if (prefersReducedMotion()) return;
  const targets = root.querySelectorAll?.('.bubble-menu .bubble, .save-button, .cookie-accept-btn, .category-tab, .drift-lang-pill');
  if (!targets || !targets.length) return;

  targets.forEach(target => {
    if (target._magnetInitialized) return;
    target._magnetInitialized = true;
    target.classList.add('magnet-target');

    const maxDistance = 35; // activation radius
    const maxPull = 5;      // maximum pixel displacement

    const handlePointerMove = e => {
      const rect = target.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const dx = e.clientX - centerX;
      const dy = e.clientY - centerY;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < maxDistance) {
        const pullX = (dx / maxDistance) * maxPull;
        const pullY = (dy / maxDistance) * maxPull;
        target.style.transform = `translate(${pullX.toFixed(2)}px, ${pullY.toFixed(2)}px)`;
      } else {
        target.style.transform = '';
      }
    };

    const handlePointerLeave = () => {
      target.style.transform = '';
    };

    target.addEventListener('pointermove', handlePointerMove, { passive: true });
    target.addEventListener('pointerleave', handlePointerLeave, { passive: true });
  });
}

/**
 * Initializes ReactBits CountUp animation on numerical milestones.
 */
export function initCountUp(root = document) {
  if (prefersReducedMotion()) return;
  const countElements = root.querySelectorAll?.('.result-count bdi, .nav-count bdi');
  if (!countElements || !countElements.length) return;

  if (typeof IntersectionObserver === 'undefined') return;

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        observer.unobserve(el);
        const raw = el.textContent.replace(/[^\d]/g, '');
        const targetNum = parseInt(raw, 10);
        if (isNaN(targetNum) || targetNum <= 0) return;

        let startTime = null;
        const duration = 650; // ms

        const animateCount = ts => {
          if (!startTime) startTime = ts;
          const progress = Math.min((ts - startTime) / duration, 1);
          // Ease out exponential
          const easeOut = 1 - Math.pow(1 - progress, 3);
          const current = Math.floor(easeOut * targetNum);
          el.textContent = current.toLocaleString();
          if (progress < 1) {
            requestAnimationFrame(animateCount);
          } else {
            el.textContent = targetNum.toLocaleString();
          }
        };

        requestAnimationFrame(animateCount);
      }
    });
  }, { threshold: 0.2 });

  countElements.forEach(el => observer.observe(el));
}

/**
 * Master initializer for all ReactBits experiential enhancements.
 */
export function initReactBits(root = document) {
  initSpotlightCards(root);
  initMagnets(root);
  initCountUp(root);
}

export default initReactBits;
