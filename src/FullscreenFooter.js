// ==========================================================================
// FullscreenFooter - Native ESM Engine with GSAP & ScrollTrigger
// Fullscreen 100vh / 100dvh viewport height and smooth staggered scroll reveal.
// ==========================================================================

function getGSAP() {
  if (typeof window !== 'undefined' && window.gsap) return window.gsap;
  return null;
}

function getScrollTrigger() {
  if (typeof window !== 'undefined') {
    return window.ScrollTrigger || (window.gsap && window.gsap.ScrollTrigger) || null;
  }
  return null;
}

/**
 * Mounts the fullscreen footer reveal animation via GSAP ScrollTrigger.
 * Scoped with gsap.context() for clean unmounting without leaks.
 */
export function mountFullscreenFooter(footerElement) {
  const footer = footerElement || document.querySelector('.site-footer');
  if (!footer) return () => {};

  const gsap = getGSAP();
  const ScrollTrigger = getScrollTrigger();

  if (gsap && ScrollTrigger) {
    try {
      gsap.registerPlugin(ScrollTrigger);
    } catch (_) {}
  }

  const prefersReduced = typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (prefersReduced) return () => {};

  if (!gsap || !ScrollTrigger) return () => {};

  const ctx = gsap.context(() => {
    // Reveal timeline tied to scroll position as user reaches the footer
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: footer,
        start: 'top 85%',
        end: 'bottom bottom',
        toggleActions: 'play none none reverse',
      },
    });

    const hasRichStructure = footer.querySelector('.site-footer-hero-band');

    if (hasRichStructure) {
      tl.from('.site-footer-hero-band', {
        y: 40,
        opacity: 0,
        duration: 0.85,
        ease: 'power3.out',
      })
        .from(
          '.footer-dir-col',
          {
            y: 35,
            opacity: 0,
            stagger: 0.1,
            duration: 0.75,
            ease: 'power3.out',
          },
          '-=0.5'
        )
        .from(
          '.site-footer-trust-strip .trust-badge-item',
          {
            y: 20,
            opacity: 0,
            stagger: 0.08,
            duration: 0.6,
            ease: 'power2.out',
          },
          '-=0.4'
        )
        .from(
          '.site-footer-bottom-bar',
          {
            y: 15,
            opacity: 0,
            duration: 0.6,
            ease: 'power2.out',
          },
          '-=0.3'
        );
    } else {
      tl.from('.site-footer-brand', {
        y: 45,
        opacity: 0,
        duration: 0.9,
        ease: 'power3.out',
      })
        .from(
          '.footer-address-col',
          {
            y: 35,
            opacity: 0,
            stagger: 0.12,
            duration: 0.8,
            ease: 'power3.out',
          },
          '-=0.55'
        )
        .from(
          '.site-footer-links a, .site-footer-links button',
          {
            y: 20,
            opacity: 0,
            stagger: 0.05,
            duration: 0.6,
            ease: 'power2.out',
          },
          '-=0.45'
        )
        .from(
          '.site-footer-legal',
          {
            opacity: 0,
            y: 15,
            duration: 0.65,
            ease: 'power2.out',
          },
          '-=0.35'
        );
    }
  }, footer);

  return () => {
    ctx.revert();
  };
}
