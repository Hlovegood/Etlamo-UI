// ==========================================================================
// WEDDO Zoom Parallax Hero Component
// Native ESM Engine for React <ZoomParallax />
// Spatial 300vh Scroll-Driven Zoom Parallax
// ==========================================================================

import { renderBlurOutUp, mountBlurOutUp } from './BlurOutUp.js';

export const DEFAULT_PARALLAX_IMAGES = [
  {
    src: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=3840&q=95',
    alt: 'Grand Sovereign Palace Ballroom & Ornate Chandeliers',
  },
  {
    src: 'https://images.unsplash.com/photo-1541971875076-8f970d573be6?auto=format&fit=crop&w=2560&q=90',
    alt: 'Royal Heritage Palace Château Architecture',
  },
  {
    src: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=2560&q=90',
    alt: 'Royal Wedding Hall Celebration',
  },
  {
    src: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=2560&q=90',
    alt: 'Nile Riverfront Palace Terrace',
  },
  {
    src: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=2560&q=90',
    alt: 'Couture Wedding Floral Installation',
  },
  {
    src: 'https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=2560&q=90',
    alt: 'Twilight Palace Garden Aisle',
  },
  {
    src: 'https://images.unsplash.com/photo-1572252009286-268acec5ca0a?auto=format&fit=crop&w=2560&q=90',
    alt: 'Historic Landmark Domes & Citadel',
  },
  {
    src: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=2560&q=90',
    alt: 'Classical Marble Columns & Portico',
  },
  {
    src: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=2560&q=90',
    alt: 'Sunlit Gilded Royal Conservatory',
  },
  {
    src: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=2560&q=90',
    alt: 'Presidential Waterfront Estate',
  },
  {
    src: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?auto=format&fit=crop&w=2560&q=90',
    alt: 'Royal Evening Gala Courtyard',
  },
  {
    src: 'https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=2560&q=90',
    alt: 'Haute Banquet Table & Crystal Sommelier',
  },
  {
    src: 'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?auto=format&fit=crop&w=2560&q=90',
    alt: 'Executive Plenary & Diplomatic Summit Hall',
  },
  {
    src: 'https://images.unsplash.com/photo-1539650116574-8efeb43e2750?auto=format&fit=crop&w=2560&q=90',
    alt: 'Sunset Heritage Minarets & Domes',
  },
  {
    src: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=2560&q=90',
    alt: 'Grand Interactive Amphitheater Suite',
  },
];

/**
 * Renders the ZoomParallax HTML structure.
 * Supports dual-phase hero presentation:
 * Phase 1: Pre-scroll guidance capsule informing the user to scroll to experience the full view.
 * Phase 2: Post-scroll hero revelation (with BlurOutUp and CTA) appearing once the parallax zoom completes.
 */
export function renderZoomParallax({
  images = DEFAULT_PARALLAX_IMAGES,
  lang = 'ar',
  title,
  subtitle,
  preScrollTitle,
  preScrollSubtitle,
  preScrollKicker,
  heroKicker,
} = {}) {
  const isAr = lang === 'ar';

  // Hero text (revealed after scrolling down through the parallax section)
  const displayTitle = title || (isAr ? 'قصور تاريخية ومراكز قمم ملكية' : 'Historic Palaces & Sovereign Venues');
  const displaySubtitle = subtitle || (isAr ? 'الأرشيف الملكي الاستثنائي لأرقى القصور والحدائق التاريخية ومقار القمم الدبلوماسية في مصر' : 'The sovereign archive of Egypt’s premier royal palaces, Nile heritage waterfronts, and presidential diplomatic estates');
  const displayHeroKicker = heroKicker || (isAr ? 'سوق القصور التراثية الفاخرة' : 'Curated Luxury Landmark Venues');

  // Pre-scroll guidance (displayed before scrolling to inform the user)
  const displayPreScrollTitle = preScrollTitle || (isAr ? 'مرر للأسفل لخوض التجربة الكاملة' : 'Scroll Down to Reveal the Full Experience');
  const displayPreScrollSubtitle = preScrollSubtitle || (isAr ? 'مرر لفتح أروقة القصور الملكية والغوص في الأرشيف الاستثنائي' : 'Scroll down to zoom through the palatial grounds and step inside the sovereign archive');
  const displayPreScrollKicker = preScrollKicker || (isAr ? 'التجربة التفاعلية الملكية' : 'Interactive Heritage Discovery');

  const scrollCueText = isAr ? 'مرر للبدء ↓' : 'Scroll down to begin ↓';
  const ctaText = isAr ? 'استكشف القصور الملكية' : 'Explore Royal Venues';

  const list = images.length ? images : DEFAULT_PARALLAX_IMAGES;

  return `
    <section class="zoom-parallax-container" id="zoom-parallax-hero" aria-label="${isAr ? 'عرض بارالاكس التكبير للقاعات الملكية' : 'Zoom Parallax Venue Showcase'}">
      <div class="zoom-parallax-sticky">
        <div class="zoom-parallax-ambient" aria-hidden="true"></div>

        <!-- 1. Pre-Scroll Guidance Capsule (Informs the user to scroll to view the full experience) -->
        <div class="zoom-parallax-pre-scroll" aria-live="polite">
          <div class="zoom-parallax-pre-scroll-backdrop" aria-hidden="true"></div>
          <div class="zoom-parallax-pre-scroll-content">
            <span class="zoom-parallax-kicker pre-scroll-kicker">${displayPreScrollKicker}</span>
            <h2 class="zoom-parallax-pre-title">${displayPreScrollTitle}</h2>
            <p class="zoom-parallax-pre-subtitle">${displayPreScrollSubtitle}</p>
          </div>
        </div>

        <!-- 2. Parallax Spatial Image Layers (15 layers covering all 4 corners and center focal point) -->
        ${list.map(({ src, alt }, index) => `
          <div
            class="zoom-parallax-layer zoom-parallax-layer-${index}"
            data-layer-index="${index}"
            aria-hidden="${index !== 0}"
          >
            <div class="zoom-parallax-img-box">
              <img
                src="${src || '/placeholder.svg'}"
                ${index === 0 ? `srcset="${src} 3840w, ${src.replace('w=3840', 'w=2560')} 2560w, ${src.replace('w=3840', 'w=1920')} 1920w" sizes="100vw" fetchpriority="high"` : ''}
                alt="${alt || `Parallax image ${index + 1}`}"
                class="zoom-parallax-img"
                loading="${index < 4 ? 'eager' : 'lazy'}"
                draggable="false"
              />
            </div>
          </div>
        `).join('')}

        <!-- 3. Post-Scroll Hero Reveal (Grand Title with BlurOutUp, Subtitle & Explore Action) -->
        <div class="zoom-parallax-post-scroll" aria-live="polite">
          <div class="zoom-parallax-post-scroll-backdrop" aria-hidden="true"></div>
          <div class="zoom-parallax-post-scroll-content">
            <span class="zoom-parallax-kicker hero-kicker">${displayHeroKicker}</span>
            <h1 class="zoom-parallax-title">
              ${renderBlurOutUp({ text: displayTitle, delay: 0.08, wordStagger: 0.032, duration: 0.58 })}
            </h1>
            <p class="zoom-parallax-subtitle">
              ${renderBlurOutUp({ text: displaySubtitle, delay: 0.32, wordStagger: 0.02, duration: 0.52 })}
            </p>
            <div class="zoom-parallax-hero-actions">
              <a href="#explore-venues" class="zoom-parallax-hero-cta">
                <span>${ctaText}</span>
                <span class="cta-arrow" aria-hidden="true">${isAr ? '←' : '→'}</span>
              </a>
            </div>
          </div>
        </div>

        <!-- 4. Floating Scroll Cue Indicator -->
        <a href="#explore-venues" class="zoom-parallax-scroll-cue" aria-label="${scrollCueText}">
          <div class="zoom-parallax-mouse-icon" aria-hidden="true">
            <span class="zoom-parallax-mouse-wheel"></span>
          </div>
          <span>${scrollCueText}</span>
        </a>
      </div>
    </section>
    <div id="explore-venues" class="zoom-parallax-complete-anchor" tabindex="-1"></div>
  `;
}

/**
 * Mounts the scroll-driven parallax scaling engine.
 */
export function mountZoomParallax(hostElement) {
  const container = hostElement || document.getElementById('zoom-parallax-hero');
  if (!container) return () => {};

  const layers = Array.from(container.querySelectorAll('.zoom-parallax-layer'));
  const preScroll = container.querySelector('.zoom-parallax-pre-scroll');
  const preBackdrop = container.querySelector('.zoom-parallax-pre-scroll-backdrop');
  const postScroll = container.querySelector('.zoom-parallax-post-scroll');
  const postBackdrop = container.querySelector('.zoom-parallax-post-scroll-backdrop');
  const scrollCue = container.querySelector('.zoom-parallax-scroll-cue');

  let ticking = false;

  const updateTransforms = () => {
    const rect = container.getBoundingClientRect();
    const windowH = window.innerHeight || 1;
    const totalDist = container.offsetHeight - windowH;

    // Progress in [0, 1] as user scrolls through the 300vh container
    const progress = totalDist > 0 ? Math.min(Math.max(-rect.top / totalDist, 0), 1) : 0;

    // Scale mappings matching spatial depth planes:
    const scale4 = 1 + progress * 3;     // [1, 4] Layer 0 center expands to 4 to fill screen
    const scale5 = 1 + progress * 4;     // [1, 5]
    const scale5_5 = 1 + progress * 4.5; // [1, 5.5]
    const scale6 = 1 + progress * 5;     // [1, 6]
    const scale6_5 = 1 + progress * 5.5; // [1, 6.5]
    const scale7 = 1 + progress * 6;     // [1, 7]
    const scale7_5 = 1 + progress * 6.5; // [1, 7.5]
    const scale8 = 1 + progress * 7;     // [1, 8]
    const scale8_5 = 1 + progress * 7.5; // [1, 8.5]
    const scale9 = 1 + progress * 8;     // [1, 9]

    const scales = [
      scale4,    // 0: Center anchor (zooms to 100vw x 100vh)
      scale5,    // 1: Top-Right Inner
      scale6,    // 2: Top-Left Inner
      scale5_5,  // 3: Mid-Right
      scale6_5,  // 4: Bottom-Right Inner
      scale5,    // 5: Bottom-Left Inner
      scale7,    // 6: Bottom-Right Mid
      scale7_5,  // 7: Far Top-Left Corner
      scale6,    // 8: Top-Center Ceiling
      scale8,    // 9: Far Top-Right Corner
      scale6_5,  // 10: Far Mid-Left Edge
      scale8_5,  // 11: Far Mid-Right Upper
      scale5_5,  // 12: Bottom-Center Floor
      scale8,    // 13: Bottom Far-Left Corner
      scale9,    // 14: Bottom Far-Right Edge
    ];

    layers.forEach((layer, idx) => {
      const s = scales[idx % scales.length];
      layer.style.transform = `scale(${s.toFixed(4)})`;
    });

    const box0 = layers[0]?.querySelector('.zoom-parallax-img-box');
    if (box0) {
      const flushProgress = Math.max((progress - 0.75) / 0.25, 0);
      box0.style.borderRadius = `${((1 - flushProgress) * 6).toFixed(1)}px`;
      box0.style.boxShadow = `0 ${((1 - flushProgress) * 20).toFixed(1)}px ${((1 - flushProgress) * 50).toFixed(1)}px rgba(28, 24, 20, ${(0.35 * (1 - flushProgress)).toFixed(2)})`;
    }

    // 1. Pre-scroll guidance animation: visible at top (progress 0), fades out smoothly by progress ~0.25
    if (preScroll) {
      const preFade = Math.min(progress * 4.0, 1);
      const remainingPre = 1 - preFade;
      preScroll.style.opacity = remainingPre.toFixed(3);
      preScroll.style.transform = `translateX(-50%) translateY(${(progress * -35).toFixed(1)}px)`;
      preScroll.style.visibility = remainingPre <= 0.01 ? 'hidden' : 'visible';
      preScroll.style.pointerEvents = remainingPre <= 0.1 ? 'none' : 'auto';

      if (preBackdrop) {
        preBackdrop.style.opacity = remainingPre.toFixed(3);
        preBackdrop.style.filter = `blur(${(remainingPre * 16).toFixed(1)}px)`;
        preBackdrop.style.backdropFilter = `blur(${(remainingPre * 16).toFixed(1)}px)`;
        preBackdrop.style.webkitBackdropFilter = `blur(${(remainingPre * 16).toFixed(1)}px)`;
      }
    }

    // 2. Scroll cue indicator: fades out as user scrolls down
    if (scrollCue) {
      const cueFade = Math.min(progress * 4.5, 1);
      scrollCue.style.opacity = (1 - cueFade).toFixed(3);
      scrollCue.style.pointerEvents = cueFade >= 0.9 ? 'none' : 'auto';
    }

    // 3. Post-scroll hero text animation: appears after scrolling down (progress ~0.58 to 0.92)
    if (postScroll) {
      const postReveal = Math.min(Math.max((progress - 0.58) / 0.34, 0), 1);
      postScroll.style.opacity = postReveal.toFixed(3);
      postScroll.style.transform = `translateX(-50%) translateY(${((1 - postReveal) * 32).toFixed(1)}px)`;
      postScroll.style.visibility = postReveal <= 0.01 ? 'hidden' : 'visible';
      postScroll.style.pointerEvents = postReveal >= 0.85 ? 'auto' : 'none';

      if (postBackdrop) {
        postBackdrop.style.opacity = postReveal.toFixed(3);
        postBackdrop.style.filter = `blur(${(postReveal * 18).toFixed(1)}px)`;
        postBackdrop.style.backdropFilter = `blur(${(postReveal * 18).toFixed(1)}px)`;
        postBackdrop.style.webkitBackdropFilter = `blur(${(postReveal * 18).toFixed(1)}px)`;
      }
    }

    // 4. Synchronize navbar width with ending of parallax scroll animation:
    // The navbar is the full width of the screen until the user scrolls down,
    // and seamlessly morphs into the compact floating pill timed right at the ending of the parallax scroll (~0.84).
    const navHeader = document.querySelector('.disc-nav-header');
    if (navHeader) {
      const isCurrentlyCondensed = navHeader.classList.contains('is-condensed');
      // Smooth hysteresis: condenses when passing 0.84; expands back when scrolling up past 0.79
      const shouldCondense = isCurrentlyCondensed ? progress >= 0.79 : progress >= 0.84;
      if (shouldCondense) {
        if (!isCurrentlyCondensed) {
          navHeader.classList.remove('is-fullwidth');
          navHeader.classList.add('is-condensed');
        }
      } else {
        if (isCurrentlyCondensed || !navHeader.classList.contains('is-fullwidth')) {
          navHeader.classList.add('is-fullwidth');
          navHeader.classList.remove('is-condensed');
        }
      }
    }

    ticking = false;
  };

  const onScroll = () => {
    if (!ticking) {
      requestAnimationFrame(updateTransforms);
      ticking = true;
    }
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });

  // Initial calculation and BlurOutUp mount
  updateTransforms();
  const disposeBlur = mountBlurOutUp(container);

  return () => {
    window.removeEventListener('scroll', onScroll);
    window.removeEventListener('resize', onScroll);
    if (typeof disposeBlur === 'function') disposeBlur();
    const navHeader = document.querySelector('.disc-nav-header');
    if (navHeader) {
      navHeader.classList.remove('is-fullwidth');
      navHeader.classList.remove('is-condensed');
    }
  };
}
