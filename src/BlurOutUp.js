// ==========================================================================
// @smoothui/blur-out-up - Native ESM Engine
// Words lift out of a soft blur and drift upward into place with a subtle stagger.
// ==========================================================================

function getGSAP() {
  if (typeof window !== 'undefined' && window.gsap) return window.gsap;
  return null;
}

/**
 * Renders HTML markup for BlurOutUp text entrance.
 */
export function renderBlurOutUp({
  text = '',
  className = '',
  wordStagger = 0.028,
  duration = 0.56,
  delay = 0,
  tag = 'span',
} = {}) {
  if (!text) return '';

  const words = text.trim().split(/\s+/);

  const wordsHtml = words.map((word, index) => {
    const itemDelay = (delay + index * wordStagger).toFixed(3);
    return `<span class="blur-out-up-word" style="--blur-delay: ${itemDelay}s; animation-duration: ${duration}s;" data-word-index="${index}">${word}</span>`;
  }).join(' ');

  return `<${tag} class="blur-out-up-container ${className}" data-blur-out-up="true" data-stagger="${wordStagger}" data-duration="${duration}" data-delay="${delay}">${wordsHtml}</${tag}>`;
}

/**
 * Mounts/triggers dynamic GSAP enhancement if available and requested.
 */
export function mountBlurOutUp(rootElement) {
  const container = rootElement || document.querySelector('[data-blur-out-up="true"]');
  if (!container) return () => {};

  const prefersReduced = typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (prefersReduced) return () => {};

  const words = container.querySelectorAll('.blur-out-up-word');
  if (!words.length) return () => {};

  const gsap = getGSAP();
  if (!gsap) return () => {};

  const wordStagger = parseFloat(container.dataset.stagger || '0.028');
  const duration = parseFloat(container.dataset.duration || '0.56');
  const delay = parseFloat(container.dataset.delay || '0');

  // GSAP context for guaranteed cleanup and smooth cubic-bezier easing
  const ctx = gsap.context(() => {
    gsap.fromTo(words, 
      {
        opacity: 0,
        filter: 'blur(14px)',
        y: 22,
      },
      {
        opacity: 1,
        filter: 'blur(0px)',
        y: 0,
        duration,
        delay,
        stagger: wordStagger,
        ease: 'power3.out',
        overwrite: 'auto',
      }
    );
  }, container);

  return () => {
    ctx.revert();
  };
}
