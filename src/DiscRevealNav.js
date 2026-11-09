// ==========================================================================
// WEDDO Disc Reveal Navigation System
// Native ESM Engine for React Bits <DiscRevealList />
// Tactile Luxury Navigation: Scattering Titles, Spinning Vinyl Discs & Polaroids
// ==========================================================================

import { sound } from './sound.js';
import { renderThemeToggle } from './ThemeToggle.js';

const HUES = ["#ff6f59", "#2f5bea", "#e2a417", "#7fa37a", "#8e4585"];
const PAD = 16;

/** Deterministic pseudo-random in [-1, 1) from an index */
function rand(i, seed) {
  const x = Math.sin(i * 12.9898 + seed * 78.233) * 43758.5453;
  return (x - Math.floor(x)) * 2 - 1;
}

/** Largest item width (height = width * aspect) that fits a band */
function fit(b, aspect) {
  return Math.min(
    b.bleed ? (b.width - PAD) / 0.55 : b.width - 2 * PAD,
    (b.height - 2 * PAD) / aspect
  );
}

/** Layout algorithm calculating coordinates for scattered discs/polaroids */
function computeSlots(n, photo, bands, spots) {
  const aspect = photo ? 1.22 : 1;
  const free = bands.filter(b => fit(b, aspect) >= 90);
  if (!free.length) return [];

  if (n === 1) {
    const near = spots.filter(s => fit(s, aspect) >= 90);
    const b = (near.length ? near : free).reduce((a, c) =>
      fit(c, aspect) > fit(a, aspect) ? c : a
    );
    const width = Math.min(fit(b, aspect), 440);
    return [
      {
        left: b.bleed ? b.left + PAD : b.left + (b.width - width) / 2,
        top: b.top + (b.height - width * aspect) / 2,
        width,
        rotate: 0,
      },
    ];
  }

  const area = b => b.width * b.height;
  const total = free.reduce((s, b) => s + area(b), 0);
  const groups = free.map(() => []);
  for (let i = 0; i < n; i++) {
    let at = ((i + 0.5) / n) * total;
    let k = 0;
    while (k < free.length - 1 && at > area(free[k])) at -= area(free[k++]);
    groups[k].push(i);
  }

  const slots = [];
  groups.forEach((ids, k) => {
    const b = free[k];
    const wide = b.width >= b.height;
    ids.forEach((i, c) => {
      const step = (wide ? b.width : b.height) / ids.length;
      const cell = wide
        ? { ...b, left: b.left + c * step, width: step }
        : { ...b, top: b.top + c * step, height: step };
      const width =
        Math.min(fit(cell, aspect), photo ? 300 : 210) *
        (0.86 + 0.14 * rand(i, 3)) *
        (photo ? 0.86 : 1);
      const slackX = cell.width - 2 * PAD - width;
      const slackY = cell.height - 2 * PAD - width * aspect;
      const alt = (c % 2 ? 0.75 : 0.25) + 0.25 * rand(i, 5);
      const mid = 0.5 + 0.5 * rand(i, 4);
      slots[i] = {
        left: cell.left + PAD + slackX * (wide ? mid : alt),
        top: cell.top + PAD + slackY * (wide ? alt : mid),
        width,
        rotate: rand(i, 6) * (photo ? 9 : 14),
      };
    });
  });
  return slots;
}

export function getNavItems({ lang = 'ar', savedCount = 0, account = null } = {}) {
  const isAr = lang === 'ar';
  return [
    {
      id: 'venues',
      title: isAr ? 'القصور والقاعات' : 'Venues & Estates',
      subtitle: isAr ? 'قصور تاريخية، قاعات ملكية، وملاذات نيلية فاخرة' : 'Historic palaces, royal ballrooms & Nile sanctuaries',
      href: '#/discover',
      media: {
        kind: 'disc',
        images: [
          'https://images.unsplash.com/photo-1544077960-604201fe74bc?w=600&q=80&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=600&q=80&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=600&q=80&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&q=80&auto=format&fit=crop',
        ],
      },
    },
    {
      id: 'services',
      title: isAr ? 'الخدمات المعتمدة' : 'Curated Services',
      subtitle: isAr ? 'ضيافة راقية، هندسة زهور، وفرق سيمفونية حية' : 'Haute cuisine, bespoke floral artistry & live orchestra',
      href: '#/services',
      media: {
        kind: 'photos',
        images: [
          'https://images.unsplash.com/photo-1519741497674-611481863552?w=600&q=80&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1555244162-803834f70033?w=600&q=80&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=600&q=80&auto=format&fit=crop',
        ],
      },
    },
    {
      id: 'planner',
      title: isAr ? 'مخطط الفعاليات 3D' : '3D Event Planner',
      subtitle: isAr ? 'توزيع مكاني ذكي، محاكاة مقاعد وتصميم تفاعلي' : 'Interactive spatial layouts, seating & decor simulation',
      href: '#/plans',
      media: {
        kind: 'disc',
        images: [
          'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=600&q=80&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&q=80&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600&q=80&auto=format&fit=crop',
        ],
      },
    },
    {
      id: 'inquiries',
      title: isAr ? 'طلبات الحجز' : 'Inquiries & Concierge',
      subtitle: isAr ? 'تواصل مباشر مع إدارات القصور وعروض أسعار خاصة' : 'Direct calendar access, date reservations & bespoke quotes',
      href: '#/requests',
      media: {
        kind: 'photos',
        images: [
          'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?w=600&q=80&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1522071823991-b9671e9d7fbe?w=600&q=80&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=600&q=80&auto=format&fit=crop',
        ],
      },
    },
    {
      id: 'saved',
      title: isAr ? (savedCount > 0 ? `المحفوظات (${savedCount})` : 'المحفوظات') : (savedCount > 0 ? `Saved Estates (${savedCount})` : 'Saved Estates'),
      subtitle: isAr ? 'قائمتك المختارة من القصور والمساحات للمقارنة' : 'Your shortlisted luxury Egyptian landmarks and ballrooms',
      href: '#/saved',
      media: {
        kind: 'disc',
        images: [
          'https://images.unsplash.com/photo-1520854221256-17451cc331bf?w=600&q=80&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1519225424268-2940e4f58c42?w=600&q=80&auto=format&fit=crop',
        ],
      },
    },
    {
      id: 'account',
      title: isAr ? (account?.isAdmin ? 'لوحة الإدارة' : 'حساب العميل') : (account?.isAdmin ? 'Administration' : 'Client Portal'),
      subtitle: isAr ? 'إدارة الحسابات، تفضيلات الحجز، وتفاصيل الكونسيرج' : 'Manage credentials, private bookings & bespoke concierge access',
      href: account?.isAdmin ? '#/admin' : '#/account',
      media: {
        kind: 'photos',
        images: [
          'https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=600&q=80&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&q=80&auto=format&fit=crop',
        ],
      },
    },
    {
      id: 'home',
      title: isAr ? 'الرئيسية' : 'Home Portal',
      subtitle: isAr ? 'سوق القصور التاريخية ومراكز المؤتمرات في مصر' : 'Curated luxury venue marketplace across Cairo & the Nile',
      href: '#/',
      media: {
        kind: 'disc',
        images: [
          'https://images.unsplash.com/photo-1572252009286-268acec5ca0a?w=600&q=80&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1539650116574-8efeb43e2750?w=600&q=80&auto=format&fit=crop',
        ],
      },
    },
  ];
}

/** Render ScatterText HTML */
function renderScatterText(text) {
  let charIndex = 0;
  return text.split(' ').map((word, w) => {
    const charsHtml = Array.from(word).map(ch => {
      const idx = charIndex++;
      return `<span class="disc-char" data-char-index="${idx}">${ch}</span>`;
    }).join('');
    return `${w > 0 ? ' ' : ''}<span class="whitespace-nowrap">${charsHtml}</span>`;
  }).join('');
}

/**
 * Renders the Disc Reveal Navigation top header and full-screen overlay.
 */
export function renderDiscRevealNav({
  path = '/',
  lang = 'ar',
  savedCount = 0,
  isMenuOpen = false,
  isDark = false,
  account = null,
  weddoLogoSvg,
  icon,
  showBar = true
} = {}) {
  const isAr = lang === 'ar';
  const items = getNavItems({ lang, savedCount, account });

  const globeIcon = `<svg class="icon globe-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="width:1.15rem;height:1.15rem;display:inline-block;vertical-align:middle;"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20M12 2a14.5 14.5 0 0 1 0 20M2 12h20"/></svg>`;
  const renderedLogo = weddoLogoSvg ? weddoLogoSvg({ size: 'sm', iconOnly: true, lang }) : '<span class="weddo-logo-mark" style="font-weight:700">E</span>';

  const headerBarHtml = showBar ? `
    <header class="disc-nav-header is-fullwidth" role="banner">
      <nav class="disc-nav-bar" aria-label="${isAr ? 'شريط التنقل الرئيسي' : 'Main Navigation'}">
        <a href="#/" class="disc-nav-logo-btn" aria-label="Etlamo Home" title="Etlamo (اتلموا)">
          ${renderedLogo}
        </a>

        <div class="disc-nav-actions">
          <span class="disc-nav-divider" aria-hidden="true"></span>

          ${renderThemeToggle({ isDark, className: 'disc-nav-btn' })}

          <button type="button" class="disc-nav-btn" data-action="language" lang="${isAr ? 'en' : 'ar'}" aria-label="${isAr ? 'Switch to English' : 'التغيير إلى العربية'}" title="${isAr ? 'Switch to English' : 'التغيير إلى العربية'}">
            ${globeIcon}
          </button>

          ${savedCount > 0 && icon ? `
            <a href="#/saved" class="disc-nav-btn" aria-label="${isAr ? 'المحفوظات' : 'Saved venues'}" title="${isAr ? 'المحفوظات' : 'Saved venues'}">
              ${icon('heart')}
              <span class="disc-nav-badge">${savedCount}</span>
            </a>
          ` : ''}

          <button
            type="button"
            class="disc-nav-toggle ${isMenuOpen ? 'is-open' : ''}"
            data-action="toggle-disc-nav"
            aria-label="${isAr ? (isMenuOpen ? 'إغلاق القائمة' : 'القائمة الرئيسية') : (isMenuOpen ? 'Close Navigation' : 'Main Menu')}"
            aria-expanded="${isMenuOpen}"
            aria-controls="disc-reveal-nav-overlay"
          >
            <div class="disc-nav-toggle-icon" aria-hidden="true">
              <span></span>
              <span></span>
            </div>
            <span>${isAr ? (isMenuOpen ? 'إغلاق' : 'القائمة') : (isMenuOpen ? 'Close' : 'Menu')}</span>
          </button>
        </div>
      </nav>
    </header>
  ` : '';

  return `
    ${headerBarHtml}

    <div
      id="disc-reveal-nav-overlay"
      class="disc-reveal-overlay ${isMenuOpen ? 'is-open' : ''}"
      aria-hidden="${!isMenuOpen}"
      role="dialog"
      aria-modal="true"
      aria-label="${isAr ? 'قائمة الاستكشاف' : 'Navigation Menu'}"
    >
      <div class="disc-reveal-backdrop" data-action="close-disc-nav" tabindex="-1"></div>

      <div class="disc-reveal-content">
        <div class="disc-reveal-root" id="disc-reveal-root">
          <ul class="disc-reveal-list" id="disc-reveal-list" role="menu">
            ${items.map((item, i) => `
              <li class="disc-reveal-item" data-index="${i}" role="none">
                <a
                  href="${item.href}"
                  class="disc-reveal-link"
                  data-action="navigate-disc"
                  data-index="${i}"
                  role="menuitem"
                >
                  <div class="disc-reveal-text-wrap">
                    <h2 class="disc-reveal-title">
                      <span class="sr-only">${item.title}</span>
                      <span aria-hidden="true" data-text>${renderScatterText(item.title)}</span>
                    </h2>
                    <p class="disc-reveal-subtitle">
                      <span data-text>${item.subtitle}</span>
                    </p>
                  </div>
                  <svg
                    class="disc-reveal-arrow"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.8"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    aria-hidden="true"
                  >
                    <line x1="7" y1="17" x2="17" y2="7"></line>
                    <polyline points="7 7 17 7 17 17"></polyline>
                  </svg>
                </a>
              </li>
            `).join('')}
          </ul>

          <div class="disc-nav-footer">
            <p>
              ${isAr ? 'اتلموا (ETLAMO) — سوق القصور التاريخية ومراكز المؤتمرات في مصر' : 'ETLAMO — Curated Historic Palaces & Sovereign Venues across Egypt'}
            </p>
          </div>

          <div class="disc-reveal-media-stage" id="disc-reveal-media-stage" aria-hidden="true"></div>
        </div>
      </div>
    </div>
  `;
}

/**
 * Activates DiscRevealList interactive hover engine in the DOM.
 */
export function mountDiscRevealNav({ lang = 'ar', savedCount = 0, account = null } = {}) {
  const root = document.getElementById('disc-reveal-root');
  const list = document.getElementById('disc-reveal-list');
  const stage = document.getElementById('disc-reveal-media-stage');
  if (!root || !list || !stage) return () => {};

  const items = getNavItems({ lang, savedCount, account });
  let activeIndex = null;
  const rows = Array.from(list.querySelectorAll('.disc-reveal-item'));

  const activate = index => {
    if (activeIndex === index) return;
    activeIndex = index;
    list.classList.add('has-active');

    rows.forEach((r, idx) => {
      const isAct = idx === index;
      r.classList.toggle('is-active', isAct);
      r.classList.toggle('is-dimmed', !isAct);

      // Scatter characters on active row
      const chars = r.querySelectorAll('.disc-char');
      chars.forEach((c, cIdx) => {
        if (isAct) {
          const y = rand(cIdx, 1) * 6;
          const rot = rand(cIdx, 2) * 6;
          c.style.transform = `translateY(${y}px) rotate(${rot}deg)`;
        } else {
          c.style.transform = '';
        }
      });
    });

    // Compute coordinate bands
    const box = root.getBoundingClientRect();
    const run = (from, to) => {
      const rs = rows.slice(from, to);
      const textEls = rs.flatMap(r => Array.from(r.querySelectorAll('[data-text]')));
      const rects = textEls.map(t => t.getBoundingClientRect());
      const last = rs[rs.length - 1];
      const top = rs[0].offsetTop;
      const lefts = rects.map(t => t.left);
      const rights = rects.map(t => t.right);
      return {
        top,
        bottom: last.offsetTop + last.offsetHeight,
        l: Math.min(...lefts) - box.left - PAD,
        r: Math.max(...rights) - box.left + PAD,
      };
    };

    const sides = (from, to) => {
      if (from >= to) return [];
      const { top, bottom, l, r } = run(from, to);
      const height = bottom - top;
      return [
        { top, left: 0, width: Math.max(l, 0), height },
        { top, left: r, width: Math.max(box.width - r, 0), height },
      ];
    };

    const arrow = rows[index].querySelector('.disc-reveal-arrow');
    const arrowRect = arrow ? arrow.getBoundingClientRect() : { left: box.right, top: rows[index].offsetTop, bottom: rows[index].offsetTop + 40 };
    const arrowLeft = arrowRect.left - box.left - PAD;
    const arrowTop = arrowRect.top - box.top - PAD;
    const arrowBottom = arrowRect.bottom - box.top + PAD;

    const spots = [];
    for (let a = Math.max(0, index - 1); a <= index; a++) {
      for (let b = index; b <= Math.min(rows.length - 1, index + 1); b++) {
        const { top, bottom, r } = run(a, b + 1);
        spots.push({ top, left: r, width: Math.max(arrowLeft - r, 0), height: bottom - top });
        if (a === index) {
          spots.push({
            top: arrowBottom,
            left: r,
            width: Math.max(box.width - r, 0),
            height: bottom - arrowBottom,
            bleed: true,
          });
        }
        if (b === index) {
          spots.push({
            top,
            left: r,
            width: Math.max(box.width - r, 0),
            height: arrowTop - top,
            bleed: true,
          });
        }
      }
    }

    const above = Math.min(Math.max(box.top, 0), 280);
    const below = Math.min(Math.max(window.innerHeight - box.bottom, 0), 280);
    const bands = [
      { top: -above, left: 0, width: box.width, height: above },
      ...sides(0, index),
      ...sides(index + 1, rows.length),
      { top: box.height, left: 0, width: box.width, height: below },
    ];

    const currentItem = items[index];
    if (!currentItem) return;

    const slots = computeSlots(
      currentItem.media.images.length,
      currentItem.media.kind === 'photos',
      bands,
      spots
    );

    // Render media elements in stage
    stage.innerHTML = slots.map((slot, i) => {
      const src = currentItem.media.images[i] || currentItem.media.images[0];
      const hue = HUES[(index + i) % HUES.length];
      const isPhoto = currentItem.media.kind === 'photos';

      const mediaHtml = isPhoto ? `
        <div class="polaroid-card">
          <img src="${src}" alt="" class="polaroid-img" loading="eager" draggable="false" />
        </div>
      ` : `
        <div class="vinyl-disc" style="--disc-hue: ${hue};">
          <img src="${src}" alt="" class="vinyl-disc-art" style="animation-delay: ${i * -3}s;" loading="eager" draggable="false" />
          <div class="vinyl-disc-tint"></div>
          <div class="vinyl-disc-grooves"></div>
          <div class="vinyl-disc-sheen"></div>
          <div class="vinyl-disc-center">
            <div class="vinyl-disc-hub">
              <div class="vinyl-disc-label">
                <div class="vinyl-disc-spindle"></div>
              </div>
            </div>
          </div>
        </div>
      `;

      return `
        <div
          class="disc-slot"
          style="
            left: ${slot.left}px;
            top: ${slot.top}px;
            width: ${slot.width}px;
            --target-rot: ${slot.rotate}deg;
            animation-delay: ${i * 0.04}s;
          "
        >
          ${mediaHtml}
        </div>
      `;
    }).join('');
  };

  const deactivate = () => {
    activeIndex = null;
    list.classList.remove('has-active');
    rows.forEach(r => {
      r.classList.remove('is-active', 'is-dimmed');
      const chars = r.querySelectorAll('.disc-char');
      chars.forEach(c => {
        c.style.transform = '';
      });
    });
    stage.innerHTML = '';
  };

  const handleLinkEnter = e => {
    const idx = parseInt(e.currentTarget.dataset.index, 10);
    if (!isNaN(idx)) activate(idx);
  };

  const links = list.querySelectorAll('.disc-reveal-link');
  links.forEach(l => {
    l.addEventListener('mouseenter', handleLinkEnter);
    l.addEventListener('focus', handleLinkEnter);
  });

  list.addEventListener('mouseleave', deactivate);

  // Dynamic measurement of compact pill width to guarantee smooth mathematical interpolation
  const updatePillWidth = () => {
    const navHeader = document.querySelector('.disc-nav-header');
    const navBar = navHeader?.querySelector('.disc-nav-bar');
    const logoBtn = navBar?.querySelector('.disc-nav-logo-btn');
    const actions = navBar?.querySelector('.disc-nav-actions');
    if (!navHeader || !logoBtn || !actions) return;

    const logoRect = logoBtn.getBoundingClientRect();
    const actionsRect = actions.getBoundingClientRect();
    // Pill internal padding: 0.55rem * 2 (~18px), gap: 0.35rem (~6px), border: 2px, comfort buffer: ~4px
    const neededWidth = Math.ceil(logoRect.width + actionsRect.width + 30);
    const pillWidth = Math.max(neededWidth, 310);
    navHeader.style.setProperty('--nav-pill-width', `${pillWidth}px`);
  };

  updatePillWidth();
  requestAnimationFrame(updatePillWidth);
  if (document.fonts?.ready) {
    document.fonts.ready.then(updatePillWidth);
  }
  window.addEventListener('resize', updatePillWidth, { passive: true });

  // General scroll handler for pages without a ZoomParallax hero
  const updateNavForScroll = () => {
    const hasZoomParallax = !!document.getElementById('zoom-parallax-hero') || !!document.querySelector('.zoom-parallax-container');
    if (hasZoomParallax) {
      return; // Timing is managed directly by ZoomParallax engine!
    }
    const navHeader = document.querySelector('.disc-nav-header');
    if (!navHeader) return;
    const scrollY = window.scrollY || window.pageYOffset || 0;
    const isCurrentlyCondensed = navHeader.classList.contains('is-condensed');
    // Hysteresis prevents flickering if user scrolls near boundary
    const shouldCondense = isCurrentlyCondensed ? scrollY > 45 : scrollY > 75;
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
  };

  updateNavForScroll();
  window.addEventListener('scroll', updateNavForScroll, { passive: true });

  return () => {
    links.forEach(l => {
      l.removeEventListener('mouseenter', handleLinkEnter);
      l.removeEventListener('focus', handleLinkEnter);
    });
    list.removeEventListener('mouseleave', deactivate);
    window.removeEventListener('scroll', updateNavForScroll);
    window.removeEventListener('resize', updatePillWidth);
  };
}

/**
 * Toggles the Disc Reveal Navigation overlay.
 */
export function animateDiscRevealNav(isOpen) {
  const overlay = document.getElementById('disc-reveal-nav-overlay');
  const toggleBtn = document.querySelector('.disc-nav-toggle');
  if (!overlay) return;

  overlay.classList.toggle('is-open', isOpen);
  overlay.setAttribute('aria-hidden', String(!isOpen));

  if (toggleBtn) {
    toggleBtn.classList.toggle('is-open', isOpen);
    toggleBtn.setAttribute('aria-expanded', String(isOpen));
    const labelSpan = toggleBtn.querySelector('span:not(.disc-nav-toggle-icon span)');
    if (labelSpan) {
      const isAr = document.documentElement.lang === 'ar';
      labelSpan.textContent = isAr ? (isOpen ? 'إغلاق' : 'القائمة') : (isOpen ? 'Close' : 'Menu');
    }
  }

  if (isOpen) {
    mountDiscRevealNav({
      lang: document.documentElement.lang || 'ar',
      savedCount: window.__weddo_saved_count || 0,
      account: window.__weddo_account || null
    });
  }
}

export function closeDiscRevealNav() {
  animateDiscRevealNav(false);
}
