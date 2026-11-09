// ==========================================================================
// ExpandableScreen - Native Vanilla ESM Engine for @cult-ui/expandable-screen
// Full-screen morphing overlay with shared layout IDs, backdrop blur,
// spring easing, focus management, and body scroll lock.
// ==========================================================================

let activeOverlay = null;
let lastFocusedElement = null;
let keydownListener = null;

export function openExpandableScreen({
  title = '',
  contentHtml = '',
  layoutId = 'expandable-card',
  triggerRadius = '100px',
  contentRadius = '24px',
  animationDuration = 0.35,
  showCloseButton = true,
  onClose = null,
  sourceElement = null,
  lang = 'en'
} = {}) {
  closeExpandableScreen();

  lastFocusedElement = document.activeElement;

  const isAr = lang === 'ar' || document.documentElement.lang === 'ar' || document.documentElement.dir === 'rtl';

  const overlay = document.createElement('div');
  overlay.id = 'expandable-screen-host';
  overlay.className = 'expandable-screen-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', title || (isAr ? 'نافذة تعبئة النموذج' : 'Form modal'));

  const closeLabel = isAr ? 'إغلاق' : 'Close';

  overlay.innerHTML = `
    <div class="expandable-screen-backdrop" data-action="close-expandable-screen" tabindex="-1"></div>
    <div
      class="expandable-screen-card"
      style="--trigger-radius: ${triggerRadius}; --content-radius: ${contentRadius};"
      data-layout-id="${layoutId}"
    >
      ${title || showCloseButton ? `
        <div class="expandable-screen-header">
          ${title ? `<h2 class="expandable-screen-title">${title}</h2>` : '<span aria-hidden="true"></span>'}
          ${showCloseButton ? `
            <button
              type="button"
              class="expandable-screen-close"
              data-action="close-expandable-screen"
              aria-label="${closeLabel}"
              title="${closeLabel}"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 18px; height: 18px;">
                <path d="M18 6 6 18M6 6l12 12"/>
              </svg>
            </button>
          ` : ''}
        </div>
      ` : ''}
      <div class="expandable-screen-content">
        ${contentHtml}
      </div>
    </div>
  `;

  document.body.appendChild(overlay);
  document.body.style.overflow = 'hidden';
  activeOverlay = { overlay, onClose };

  // Trigger smooth entrance animation
  requestAnimationFrame(() => {
    overlay.classList.add('is-active');
    const firstInput = overlay.querySelector('input:not([type="hidden"]), select, textarea, button[type="submit"]');
    if (firstInput) {
      firstInput.focus();
    }
  });

  // Event handlers
  const handleOverlayClick = (e) => {
    if (e.target.closest('[data-action="close-expandable-screen"]')) {
      closeExpandableScreen();
    }
  };
  overlay.addEventListener('click', handleOverlayClick);

  keydownListener = (e) => {
    if (e.key === 'Escape') {
      closeExpandableScreen();
    }
  };
  window.addEventListener('keydown', keydownListener);

  return {
    close: closeExpandableScreen,
    card: overlay.querySelector('.expandable-screen-card'),
    content: overlay.querySelector('.expandable-screen-content')
  };
}

export function closeExpandableScreen() {
  if (!activeOverlay) return;
  const { overlay, onClose } = activeOverlay;
  activeOverlay = null;

  overlay.classList.remove('is-active');
  document.body.style.overflow = '';

  if (keydownListener) {
    window.removeEventListener('keydown', keydownListener);
    keydownListener = null;
  }

  setTimeout(() => {
    if (overlay.parentNode) {
      overlay.parentNode.removeChild(overlay);
    }
    if (onClose) onClose();
    if (lastFocusedElement && typeof lastFocusedElement.focus === 'function') {
      lastFocusedElement.focus();
      lastFocusedElement = null;
    }
  }, 260);
}

export function isExpandableScreenOpen() {
  return !!activeOverlay;
}

export function wrapFormWithExpandableScreen(formHtml, {
  title = '',
  layoutId = 'expandable-form',
  contentRadius = '24px',
  closeUrl = '',
  closeAction = '',
  lang = 'en'
} = {}) {
  const isAr = lang === 'ar';
  const closeLabel = isAr ? 'إغلاق' : 'Close';

  return `
    <div class="expandable-screen-wrap" data-expandable-screen="true" data-layout-id="${layoutId}">
      <div class="expandable-screen-card is-embedded" style="--content-radius: ${contentRadius};">
        <div class="expandable-screen-header">
          ${title ? `<h2 class="expandable-screen-title">${title}</h2>` : '<span></span>'}
          ${closeUrl ? `
            <a href="${closeUrl}" class="expandable-screen-close" aria-label="${closeLabel}" title="${closeLabel}">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 18px; height: 18px;">
                <path d="M18 6 6 18M6 6l12 12"/>
              </svg>
            </a>
          ` : closeAction ? `
            <button type="button" class="expandable-screen-close" data-action="${closeAction}" aria-label="${closeLabel}" title="${closeLabel}">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 18px; height: 18px;">
                <path d="M18 6 6 18M6 6l12 12"/>
              </svg>
            </button>
          ` : ''}
        </div>
        <div class="expandable-screen-content">
          ${formHtml}
        </div>
      </div>
    </div>
  `;
}
