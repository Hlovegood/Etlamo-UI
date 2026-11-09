// ==========================================================================
// BubbleMenu - Native ESM Engine for React Bits <BubbleMenu />
// High-Fashion Floating Bubble Capsule Navigation with GSAP Physics
// ==========================================================================

import { sound } from './sound.js';
import { renderThemeToggle } from './ThemeToggle.js';

let resizeListenerAttached = false;
let currentMenuItems = [];

function getGSAP() {
  if (typeof window !== 'undefined' && window.gsap) {
    return window.gsap;
  }
  return null;
}

/**
 * Executes the React Bits GSAP open/close animations.
 */
export function animateBubbleMenu(isOpen, {
  animationEase = 'back.out(1.5)',
  animationDuration = 0.5,
  staggerDelay = 0.12
} = {}) {
  const gsap = getGSAP();
  const overlay = document.querySelector('.bubble-menu-items');
  const toggleBtn = document.querySelector('.bubble-menu .toggle-bubble');
  if (!overlay) return;

  const bubbles = Array.from(overlay.querySelectorAll('.pill-link'));
  const labels = Array.from(overlay.querySelectorAll('.pill-label'));

  if (toggleBtn) {
    toggleBtn.classList.toggle('open', isOpen);
    toggleBtn.setAttribute('aria-pressed', String(isOpen));
  }
  overlay.setAttribute('aria-hidden', String(!isOpen));

  if (!gsap) {
    overlay.style.display = isOpen ? 'flex' : 'none';
    return;
  }

  if (isOpen) {
    gsap.set(overlay, { display: 'flex' });
    gsap.killTweensOf([...bubbles, ...labels]);
    gsap.set(bubbles, { scale: 0, transformOrigin: '50% 50%' });
    gsap.set(labels, { y: 24, autoAlpha: 0 });

    const isDesktop = window.innerWidth >= 900;

    bubbles.forEach((bubble, i) => {
      const item = currentMenuItems[i];
      if (item) {
        const rotation = isDesktop ? (item.rotation ?? 0) : 0;
        gsap.set(bubble, { rotation });
      }

      const delay = i * staggerDelay + gsap.utils.random(-0.05, 0.05);
      const tl = gsap.timeline({ delay });

      tl.to(bubble, {
        scale: 1,
        duration: animationDuration,
        ease: animationEase
      });

      if (labels[i]) {
        tl.to(
          labels[i],
          {
            y: 0,
            autoAlpha: 1,
            duration: animationDuration,
            ease: 'power3.out'
          },
          `-=${animationDuration * 0.9}`
        );
      }
    });

    if (!resizeListenerAttached) {
      resizeListenerAttached = true;
      window.addEventListener('resize', () => {
        const activeOverlay = document.querySelector('.bubble-menu-items');
        if (!activeOverlay || activeOverlay.style.display === 'none') return;
        const activeBubbles = Array.from(activeOverlay.querySelectorAll('.pill-link'));
        const desktop = window.innerWidth >= 900;
        activeBubbles.forEach((b, idx) => {
          const it = currentMenuItems[idx];
          if (b && it) {
            gsap.set(b, { rotation: desktop ? (it.rotation ?? 0) : 0 });
          }
        });
      });
    }
  } else {
    gsap.killTweensOf([...bubbles, ...labels]);
    gsap.to(labels, {
      y: 24,
      autoAlpha: 0,
      duration: 0.2,
      ease: 'power3.in'
    });
    gsap.to(bubbles, {
      scale: 0,
      duration: 0.2,
      ease: 'power3.in',
      onComplete: () => {
        gsap.set(overlay, { display: 'none' });
      }
    });
  }
}

export function closeBubbleMenu() {
  animateBubbleMenu(false);
}

export function toggleBubbleMenu(state) {
  const next = typeof state === 'boolean' ? state : !document.querySelector('.bubble-menu .toggle-bubble')?.classList.contains('open');
  animateBubbleMenu(next);
}

export function renderBubbleMenu({
  logo,
  path = '/',
  lang = 'en',
  savedCount = 0,
  isMenuOpen = false,
  isDark = false,
  account = null,
  t = k => k,
  weddoLogoSvg,
  icon,
  menuAriaLabel = 'Toggle menu',
  useFixedPosition = true
} = {}) {
  const isAr = lang === 'ar';
  const menuBg = isDark ? '#271e18' : '#f9f8f0';
  const menuContentColor = isDark ? '#f9f8f0' : '#3c261c';

  const menuItems = [
    {
      label: isAr ? 'الرئيسية' : 'home',
      href: '#/',
      ariaLabel: isAr ? 'الرئيسية' : 'Home',
      rotation: -6,
      hoverStyles: { bgColor: '#b38234', textColor: '#ffffff' }
    },
    {
      label: isAr ? 'القصور والقاعات' : 'venues',
      href: '#/discover',
      ariaLabel: isAr ? 'استكشاف القاعات والقصور' : 'Venues',
      rotation: 6,
      hoverStyles: { bgColor: '#b38234', textColor: '#ffffff' }
    },
    {
      label: isAr ? 'الخدمات' : 'services',
      href: '#/services',
      ariaLabel: isAr ? 'الخدمات المعتمدة' : 'Curated Services',
      rotation: 6,
      hoverStyles: { bgColor: '#b38234', textColor: '#ffffff' }
    },
    {
      label: isAr ? 'مخطط 3D' : 'planner',
      href: '#/plans',
      ariaLabel: isAr ? 'مخطط الفعاليات و 3D' : '3D Planner',
      rotation: -6,
      hoverStyles: { bgColor: '#b38234', textColor: '#ffffff' }
    },
    {
      label: isAr ? 'طلبات الحجز' : 'inquiries',
      href: '#/requests',
      ariaLabel: isAr ? 'طلبات الحجز والاستفسارات' : 'Inquiries',
      rotation: 6,
      hoverStyles: { bgColor: '#b38234', textColor: '#ffffff' }
    },
    {
      label: isAr ? (savedCount > 0 ? `المحفوظات (${savedCount})` : 'المحفوظات') : (savedCount > 0 ? `saved (${savedCount})` : 'saved'),
      href: '#/saved',
      ariaLabel: isAr ? 'المجموعات المحفوظة' : 'Saved Estates',
      rotation: -4,
      hoverStyles: { bgColor: '#b38234', textColor: '#ffffff' }
    },
    {
      label: isAr ? (account?.isAdmin ? 'لوحة الإدارة' : 'حساب العميل') : (account?.isAdmin ? 'admin' : 'account'),
      href: account?.isAdmin ? '#/admin' : '#/account',
      ariaLabel: isAr ? 'الحساب' : 'Account',
      rotation: 4,
      hoverStyles: { bgColor: '#b38234', textColor: '#ffffff' }
    }
  ];

  currentMenuItems = menuItems;

  const isLanding = path === '/' || path === '';

  const globeIcon = `<svg class="icon globe-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="width:1.25rem;height:1.25rem;display:inline-block;vertical-align:middle;"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20M12 2a14.5 14.5 0 0 1 0 20M2 12h20"/></svg>`;

  const themeIcon = isDark
    ? `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2M6.34 17.66l-1.41 1.41m14.14-14.14-1.41 1.41"/></svg>`
    : `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M12 3a6 6 0 0 0 9 9 9 0 1 1-9-9Z"/></svg>`;

  const renderedLogo = logo || (weddoLogoSvg ? weddoLogoSvg({ size: 'sm', lang }) : '<span style="font-weight:700">ETLAMO</span>');

  if (isLanding) {
    return `
      <nav class="bubble-menu ${useFixedPosition ? 'fixed' : 'absolute'}" aria-label="Main navigation">
        <div class="bubble logo-bubble" aria-label="Logo" style="background: ${menuBg}">
          <a href="#/" class="logo-content" aria-label="Etlamo Home">
            ${renderedLogo}
          </a>
        </div>
        <div class="bubble-right-cluster">
          <button type="button" class="bubble util-bubble lang-bubble" data-action="language" lang="${isAr ? 'en' : 'ar'}" aria-label="${isAr ? 'Switch to English' : 'التغيير إلى العربية'}" title="${isAr ? 'Switch to English' : 'التغيير إلى العربية'}" style="background: ${menuBg}; color: ${menuContentColor}">
            ${globeIcon}
          </button>
        </div>
      </nav>
    `;
  }

  return `
    <nav class="bubble-menu ${useFixedPosition ? 'fixed' : 'absolute'}" aria-label="Main navigation">
      <div class="bubble logo-bubble" aria-label="Logo" style="background: ${menuBg}">
        <a href="#/" class="logo-content" aria-label="Etlamo Home">
          ${renderedLogo}
        </a>
      </div>

      <div class="bubble-right-cluster" style="display: flex; align-items: center; gap: 8px; pointer-events: auto;">
        ${renderThemeToggle({ isDark })}

        <button type="button" class="bubble util-bubble lang-bubble" data-action="language" lang="${isAr ? 'en' : 'ar'}" aria-label="${isAr ? 'Switch to English' : 'التغيير إلى العربية'}" title="${isAr ? 'Switch to English' : 'التغيير إلى العربية'}" style="background: ${menuBg}; color: ${menuContentColor}">
          ${globeIcon}
        </button>

        ${savedCount > 0 && icon ? `
          <a href="#/saved" class="bubble util-bubble saved-bubble" aria-label="Saved venues" title="Saved venues" style="background: ${menuBg}; color: ${menuContentColor}; position: relative; text-decoration: none;">
            ${icon('heart')}
            <span class="bubble-saved-badge">${savedCount}</span>
          </a>
        ` : ''}

        <button
          type="button"
          class="bubble toggle-bubble menu-btn ${isMenuOpen ? 'open' : ''}"
          data-action="toggle-bubble-menu"
          aria-label="${menuAriaLabel}"
          aria-pressed="${isMenuOpen}"
          style="background: ${menuBg}"
        >
          <span class="menu-line" style="background: ${menuContentColor}"></span>
          <span class="menu-line short" style="background: ${menuContentColor}"></span>
        </button>
      </div>
    </nav>

    <div
      class="bubble-menu-items ${useFixedPosition ? 'fixed' : 'absolute'}"
      aria-hidden="${!isMenuOpen}"
      style="display: ${isMenuOpen ? 'flex' : 'none'};"
    >
      <div class="bubble-menu-backdrop" data-action="close-bubble-menu" tabindex="-1"></div>
      <ul class="pill-list" role="menu" aria-label="Menu links">
        ${menuItems.map((item, idx) => `
          <li role="none" class="pill-col">
            <a
              role="menuitem"
              href="${item.href}"
              aria-label="${item.ariaLabel || item.label}"
              class="pill-link"
              data-action="navigate-bubble"
              style="
                --item-rot: ${item.rotation ?? 0}deg;
                --pill-bg: ${menuBg};
                --pill-color: ${menuContentColor};
                --hover-bg: ${item.hoverStyles?.bgColor || '#f3f4f6'};
                --hover-color: ${item.hoverStyles?.textColor || menuContentColor};
              "
            >
              <span class="pill-label">${item.label}</span>
            </a>
          </li>
        `).join('')}
      </ul>
    </div>
  `;
}
