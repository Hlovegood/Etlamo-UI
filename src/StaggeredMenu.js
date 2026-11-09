// =============================================================================
// ETLAMO (اتلموا) — StaggeredMenu Native ESM Module
// React Bits StaggeredMenu integration with GSAP animations
// =============================================================================

import { sound } from './sound.js';
import { renderThemeToggle } from './ThemeToggle.js';

let isOpen = false;
let openTimeline = null;
let closeTween = null;
let spinTween = null;
let textAnim = null;
let isBusy = false;
let currentCtx = null;

function getGSAP() {
  if (typeof window !== 'undefined' && window.gsap) return window.gsap;
  return null;
}

export function getMenuItems({ lang = 'ar', savedCount = 0, account = null } = {}) {
  const isAr = lang === 'ar';
  return [
    {
      label: isAr ? 'القصور والقاعات الملكية' : 'Venues & Royal Estates',
      ariaLabel: isAr ? 'استعراض القصور والقاعات' : 'Browse royal venues and estates',
      link: '#/discover',
    },
    {
      label: isAr ? 'مخطط المساحات والمقاعد' : 'Spatial Planner & Seating',
      ariaLabel: isAr ? 'الانتقال إلى مخطط المساحات' : 'Open 2D/3D spatial seating planner',
      link: '#/plans',
    },
    {
      label: isAr ? (savedCount > 0 ? `المحفوظات (${savedCount})` : 'المحفوظات الملكية') : (savedCount > 0 ? `Saved Estates (${savedCount})` : 'Saved Estates'),
      ariaLabel: isAr ? 'عرض القصور المحفوظة' : 'View saved venues',
      link: '#/saved',
    },
    {
      label: isAr ? (account?.isAdmin ? 'لوحة الإدارة' : 'حساب العميل والكونسيرج') : (account?.isAdmin ? 'Administration' : 'Client & Concierge Portal'),
      ariaLabel: isAr ? 'لوحة التحكم والكونسيرج' : 'Open client portal and VIP concierge',
      link: account?.isAdmin ? '#/admin' : '#/account',
    },
    {
      label: isAr ? 'بوابة البداية الرئيسية' : 'Home Portal',
      ariaLabel: isAr ? 'العودة للصفحة الرئيسية' : 'Return to main start portal',
      link: '#/',
    },
  ];
}

export function getSocialItems({ lang = 'ar' } = {}) {
  return [
    { label: 'LinkedIn', link: 'https://linkedin.com' },
    { label: 'Instagram', link: 'https://instagram.com' },
    { label: 'X', link: 'https://x.com' },
    { label: 'Facebook', link: 'https://facebook.com' },
  ];
}

/**
 * Renders the StaggeredMenu HTML markup
 */
export function renderStaggeredMenu({
  lang = 'ar',
  savedCount = 0,
  isDark = false,
  account = null,
  weddoLogoSvg,
  icon,
  showBar = true,
  position = 'right',
  colors,
  accentColor,
} = {}) {
  const isAr = lang === 'ar';
  const pos = isAr ? 'left' : position;
  const items = getMenuItems({ lang, savedCount, account });
  const socials = getSocialItems({ lang });
  const resolvedColors = colors || (isDark ? ['#070d09', '#142018', '#eed8a6'] : ['#1b190d', '#2c2514', '#c5a880']);
  const resolvedAccent = accentColor || (isDark ? '#eed8a6' : '#c5a880');

  const globeIcon = `<svg class="icon globe-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="width:1.15rem;height:1.15rem;display:inline-block;vertical-align:middle;"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20M12 2a14.5 14.5 0 0 1 0 20M2 12h20"/></svg>`;
  const renderedLogo = weddoLogoSvg ? weddoLogoSvg({ size: 'sm', iconOnly: true, lang }) : '<span class="weddo-logo-mark" style="font-weight:700">E</span>';

  return `
  <div
    class="staggered-menu-wrapper fixed-wrapper"
    data-position="${pos}"
    style="--sm-accent: ${resolvedAccent};"
  >
    <div class="sm-prelayers" aria-hidden="true">
      ${resolvedColors.map(c => `<div class="sm-prelayer" style="background: ${c};"></div>`).join('')}
    </div>

    <header class="staggered-menu-header ${showBar ? '' : 'sm-header-hidden'}" aria-label="${isAr ? 'ترويسة التنقل الرئيسية' : 'Main navigation header'}">
      <div class="sm-logo" aria-label="Logo">
        <a href="#/" class="sm-logo-link" aria-label="Etlamo Home" title="Etlamo (اتلموا)">
          ${renderedLogo}
        </a>
      </div>

      <div class="sm-header-actions">
        ${renderThemeToggle({ isDark, className: 'sm-header-btn' })}

        <button type="button" class="sm-header-btn" data-action="language" lang="${isAr ? 'en' : 'ar'}" aria-label="${isAr ? 'Switch to English' : 'التغيير إلى العربية'}" title="${isAr ? 'Switch to English' : 'التغيير إلى العربية'}">
          ${globeIcon}
        </button>

        ${savedCount > 0 && icon ? `
          <a href="#/saved" class="sm-header-btn" aria-label="${isAr ? 'المحفوظات' : 'Saved venues'}" title="${isAr ? 'المحفوظات' : 'Saved venues'}">
            ${icon('heart')}
            <span class="sm-header-badge">${savedCount}</span>
          </a>
        ` : ''}

        <button
          class="sm-toggle"
          data-action="toggle-staggered-menu"
          aria-label="${isAr ? 'القائمة الرئيسية' : 'Open menu'}"
          aria-expanded="false"
          aria-controls="staggered-menu-panel"
          type="button"
        >
          <span class="sm-toggle-textWrap" aria-hidden="true">
            <span class="sm-toggle-textInner">
              <span class="sm-toggle-line">${isAr ? 'القائمة' : 'Menu'}</span>
            </span>
          </span>
          <span class="sm-icon" aria-hidden="true">
            <span class="sm-icon-line"></span>
            <span class="sm-icon-line sm-icon-line-v"></span>
          </span>
        </button>
      </div>
    </header>

    <aside id="staggered-menu-panel" class="staggered-menu-panel" aria-hidden="true">
      <div class="sm-panel-inner">
        <ul class="sm-panel-list" role="list" data-numbering="true">
          ${items.map((it, idx) => `
            <li class="sm-panel-itemWrap">
              <a class="sm-panel-item" href="${it.link}" aria-label="${it.ariaLabel || it.label}" data-index="${idx + 1}" data-action="navigate-staggered">
                <span class="sm-panel-itemLabel">${it.label}</span>
              </a>
            </li>
          `).join('')}
        </ul>

        <div class="sm-socials" aria-label="${isAr ? 'وسائل التواصل' : 'Social links'}">
          <h3 class="sm-socials-title">${isAr ? 'المراسم والتواصل' : 'Socials'}</h3>
          <ul class="sm-socials-list" role="list">
            ${socials.map(s => `
              <li class="sm-socials-item">
                <a href="${s.link}" target="_blank" rel="noopener noreferrer" class="sm-socials-link">
                  ${s.label}
                </a>
              </li>
            `).join('')}
          </ul>
        </div>
      </div>
    </aside>
  </div>
  `;
}

/**
 * Builds the GSAP timeline for opening the StaggeredMenu
 */
function buildOpenTimeline(panel, preLayers, pos) {
  const gsap = getGSAP();
  if (!gsap || !panel) return null;

  if (openTimeline) openTimeline.kill();
  if (closeTween) {
    closeTween.kill();
    closeTween = null;
  }

  const itemEls = Array.from(panel.querySelectorAll('.sm-panel-itemLabel'));
  const numberEls = Array.from(panel.querySelectorAll('.sm-panel-list[data-numbering] .sm-panel-item'));
  const socialTitle = panel.querySelector('.sm-socials-title');
  const socialLinks = Array.from(panel.querySelectorAll('.sm-socials-link'));

  const offscreen = pos === 'left' ? -100 : 100;
  const layerStates = preLayers.map(el => ({ el, start: offscreen }));
  const panelStart = offscreen;

  if (itemEls.length) {
    gsap.set(itemEls, { yPercent: 140, rotate: 10 });
  }
  if (numberEls.length) {
    gsap.set(numberEls, { '--sm-num-opacity': 0 });
  }
  if (socialTitle) {
    gsap.set(socialTitle, { opacity: 0 });
  }
  if (socialLinks.length) {
    gsap.set(socialLinks, { y: 25, opacity: 0 });
  }

  const tl = gsap.timeline({ paused: true });

  layerStates.forEach((ls, i) => {
    tl.fromTo(ls.el, { xPercent: ls.start }, { xPercent: 0, duration: 0.5, ease: 'power4.out' }, i * 0.07);
  });

  const lastTime = layerStates.length ? (layerStates.length - 1) * 0.07 : 0;
  const panelInsertTime = lastTime + (layerStates.length ? 0.08 : 0);
  const panelDuration = 0.65;

  tl.fromTo(
    panel,
    { xPercent: panelStart, opacity: 1 },
    { xPercent: 0, duration: panelDuration, ease: 'power4.out' },
    panelInsertTime
  );

  if (itemEls.length) {
    const itemsStartRatio = 0.15;
    const itemsStart = panelInsertTime + panelDuration * itemsStartRatio;
    tl.to(
      itemEls,
      {
        yPercent: 0,
        rotate: 0,
        duration: 1,
        ease: 'power4.out',
        stagger: { each: 0.1, from: 'start' }
      },
      itemsStart
    );

    if (numberEls.length) {
      tl.to(
        numberEls,
        {
          duration: 0.6,
          ease: 'power2.out',
          '--sm-num-opacity': 1,
          stagger: { each: 0.08, from: 'start' }
        },
        itemsStart + 0.1
      );
    }
  }

  if (socialTitle || socialLinks.length) {
    const socialsStart = panelInsertTime + panelDuration * 0.4;
    if (socialTitle) {
      tl.to(
        socialTitle,
        {
          opacity: 1,
          duration: 0.5,
          ease: 'power2.out'
        },
        socialsStart
      );
    }
    if (socialLinks.length) {
      tl.to(
        socialLinks,
        {
          y: 0,
          opacity: 1,
          duration: 0.55,
          ease: 'power3.out',
          stagger: { each: 0.08, from: 'start' },
          onComplete: () => {
            gsap.set(socialLinks, { clearProps: 'opacity' });
          }
        },
        socialsStart + 0.04
      );
    }
  }

  openTimeline = tl;
  return tl;
}

function animateIcon(opening, iconEl) {
  const gsap = getGSAP();
  if (!gsap || !iconEl) return;
  if (spinTween) spinTween.kill();
  if (opening) {
    spinTween = gsap.to(iconEl, { rotate: 225, duration: 0.8, ease: 'power4.out', overwrite: 'auto' });
  } else {
    spinTween = gsap.to(iconEl, { rotate: 0, duration: 0.35, ease: 'power3.inOut', overwrite: 'auto' });
  }
}

function animateText(opening, textInnerEl, isAr) {
  const gsap = getGSAP();
  if (!gsap || !textInnerEl) return;
  if (textAnim) textAnim.kill();

  const openWord = isAr ? 'إغلاق' : 'Close';
  const closedWord = isAr ? 'القائمة' : 'Menu';

  const currentLabel = opening ? closedWord : openWord;
  const targetLabel = opening ? openWord : closedWord;
  const cycles = 3;
  const seq = [currentLabel];
  let last = currentLabel;
  for (let i = 0; i < cycles; i++) {
    last = last === closedWord ? openWord : closedWord;
    seq.push(last);
  }
  if (last !== targetLabel) seq.push(targetLabel);
  seq.push(targetLabel);

  textInnerEl.innerHTML = seq.map(w => `<span class="sm-toggle-line">${w}</span>`).join('');
  gsap.set(textInnerEl, { yPercent: 0 });

  const lineCount = seq.length;
  const finalShift = ((lineCount - 1) / lineCount) * 100;
  textAnim = gsap.to(textInnerEl, {
    yPercent: -finalShift,
    duration: 0.5 + lineCount * 0.07,
    ease: 'power4.out'
  });
}

/**
 * Mounts the StaggeredMenu controller & event listeners
 */
export function mountStaggeredMenu({ lang = 'ar' } = {}) {
  const gsap = getGSAP();
  const wrapper = document.querySelector('.staggered-menu-wrapper');
  if (!wrapper || !gsap) return () => {};

  const panel = wrapper.querySelector('#staggered-menu-panel');
  const preLayers = Array.from(wrapper.querySelectorAll('.sm-prelayer'));
  const toggleBtn = wrapper.querySelector('.sm-toggle');
  const iconEl = wrapper.querySelector('.sm-icon');
  const textInnerEl = wrapper.querySelector('.sm-toggle-textInner');
  const pos = wrapper.getAttribute('data-position') || (lang === 'ar' ? 'left' : 'right');
  const isAr = lang === 'ar';

  if (!panel || !toggleBtn) return () => {};

  // Always ensure state is clean and unblocked on every mount
  isOpen = false;
  isBusy = false;
  if (openTimeline) { openTimeline.kill(); openTimeline = null; }
  if (closeTween) { closeTween.kill(); closeTween = null; }
  if (spinTween) { spinTween.kill(); spinTween = null; }
  if (textAnim) { textAnim.kill(); textAnim = null; }
  wrapper.removeAttribute('data-open');
  panel.setAttribute('aria-hidden', 'true');
  toggleBtn.setAttribute('aria-expanded', 'false');
  toggleBtn.setAttribute('aria-label', isAr ? 'القائمة الرئيسية' : 'Open menu');

  // Initialize offscreen
  const offscreen = pos === 'left' ? -100 : 100;
  gsap.set([panel, ...preLayers], { xPercent: offscreen, opacity: 1 });
  if (panel.parentElement && panel.parentElement.querySelector('.sm-prelayers')) {
    gsap.set(panel.parentElement.querySelector('.sm-prelayers'), { xPercent: 0, opacity: 1 });
  }

  function openMenu() {
    if (isBusy || isOpen) return;
    isBusy = true;
    isOpen = true;
    wrapper.setAttribute('data-open', 'true');
    panel.setAttribute('aria-hidden', 'false');
    toggleBtn.setAttribute('aria-expanded', 'true');
    toggleBtn.setAttribute('aria-label', isAr ? 'إغلاق القائمة' : 'Close menu');

    const tl = buildOpenTimeline(panel, preLayers, pos);
    if (tl) {
      tl.eventCallback('onComplete', () => {
        isBusy = false;
      });
      tl.play(0);
    } else {
      isBusy = false;
    }

    animateIcon(true, iconEl);
    animateText(true, textInnerEl, isAr);
  }

  function closeMenu(immediate = false) {
    isOpen = false;
    isBusy = false;
    wrapper.removeAttribute('data-open');
    panel.setAttribute('aria-hidden', 'true');
    toggleBtn.setAttribute('aria-expanded', 'false');
    toggleBtn.setAttribute('aria-label', isAr ? 'القائمة الرئيسية' : 'Open menu');

    if (openTimeline) {
      openTimeline.kill();
      openTimeline = null;
    }
    if (closeTween) {
      closeTween.kill();
      closeTween = null;
    }

    const all = [...preLayers, panel];
    if (immediate) {
      gsap.set(all, { xPercent: offscreen });
      const itemEls = Array.from(panel.querySelectorAll('.sm-panel-itemLabel'));
      if (itemEls.length) gsap.set(itemEls, { yPercent: 140, rotate: 10 });

      const numberEls = Array.from(panel.querySelectorAll('.sm-panel-list[data-numbering] .sm-panel-item'));
      if (numberEls.length) gsap.set(numberEls, { '--sm-num-opacity': 0 });

      const socialTitle = panel.querySelector('.sm-socials-title');
      const socialLinks = Array.from(panel.querySelectorAll('.sm-socials-link'));
      if (socialTitle) gsap.set(socialTitle, { opacity: 0 });
      if (socialLinks.length) gsap.set(socialLinks, { y: 25, opacity: 0 });

      animateIcon(false, iconEl);
      animateText(false, textInnerEl, isAr);
      return;
    }

    isBusy = true;
    closeTween = gsap.to(all, {
      xPercent: offscreen,
      duration: 0.32,
      ease: 'power3.in',
      overwrite: 'auto',
      onComplete: () => {
        const itemEls = Array.from(panel.querySelectorAll('.sm-panel-itemLabel'));
        if (itemEls.length) gsap.set(itemEls, { yPercent: 140, rotate: 10 });

        const numberEls = Array.from(panel.querySelectorAll('.sm-panel-list[data-numbering] .sm-panel-item'));
        if (numberEls.length) gsap.set(numberEls, { '--sm-num-opacity': 0 });

        const socialTitle = panel.querySelector('.sm-socials-title');
        const socialLinks = Array.from(panel.querySelectorAll('.sm-socials-link'));
        if (socialTitle) gsap.set(socialTitle, { opacity: 0 });
        if (socialLinks.length) gsap.set(socialLinks, { y: 25, opacity: 0 });

        isBusy = false;
        closeTween = null;
      }
    });

    animateIcon(false, iconEl);
    animateText(false, textInnerEl, isAr);
  }

  function handleToggle() {
    sound.pop();
    if (isOpen) closeMenu();
    else openMenu();
  }

  toggleBtn.onclick = handleToggle;

  // Click outside to close
  const onDocClick = (e) => {
    if (!isOpen) return;
    if (panel.contains(e.target) || toggleBtn.contains(e.target)) return;
    sound.tap();
    closeMenu();
  };
  document.addEventListener('mousedown', onDocClick);

  // Link click to close immediately to prevent transition race conditions
  const onNavClick = (e) => {
    const link = e.target.closest('[data-action="navigate-staggered"]');
    if (link) {
      sound.tap();
      closeMenu(true);
    }
  };
  panel.addEventListener('click', onNavClick);

  // Expose global closer for footer-focus or escape handler
  window.__closeStaggeredMenu = closeMenu;

  return () => {
    isOpen = false;
    isBusy = false;
    document.removeEventListener('mousedown', onDocClick);
    panel.removeEventListener('click', onNavClick);
    if (openTimeline) { openTimeline.kill(); openTimeline = null; }
    if (closeTween) { closeTween.kill(); closeTween = null; }
    if (spinTween) { spinTween.kill(); spinTween = null; }
    if (textAnim) { textAnim.kill(); textAnim = null; }
    delete window.__closeStaggeredMenu;
  };
}

export function closeStaggeredMenu(immediate = false) {
  isOpen = false;
  isBusy = false;
  if (typeof window !== 'undefined' && window.__closeStaggeredMenu) {
    window.__closeStaggeredMenu(immediate);
  }
}

export function toggleStaggeredMenu() {
  const btn = document.querySelector('.sm-toggle');
  if (btn) btn.click();
}

export function isStaggeredMenuOpen() {
  return isOpen;
}
