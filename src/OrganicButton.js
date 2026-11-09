// ==========================================================================
// OrganicButton - Native ESM Engine for @cult-ui/organic-button
// Precision SVG-capped architectural CTA button with diagonal negative space,
// micro-hover animations, active press compression (0.96), and RTL mirroring.
// ==========================================================================

export const SVG_SHAPES = {
  // Left Rounded End Cap (viewBox 0 0 10 40)
  capLeft: `<svg aria-hidden="true" class="organic-svg-end organic-svg-cap-left" viewBox="0 0 10 40" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">
    <path d="M10 40V0H6C2.68629 0 0 2.68629 0 6V34C0 37.3137 2.68629 40 6 40H10Z"/>
  </svg>`,

  // Descending Diagonal Wall (viewBox 0 0 18 40)
  wallDescending: `<svg aria-hidden="true" class="organic-svg-end organic-svg-wall-descending" viewBox="0 0 18 40" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">
    <path d="M10.899 0H0V40H2C4.40603 40 6.55968 38.5075 7.4045 36.2547L17.4533 9.45786C19.1694 4.88161 15.7864 0 10.899 0Z"/>
  </svg>`,

  // Ascending Diagonal Wall (viewBox 0 0 18 40)
  wallAscending: `<svg aria-hidden="true" class="organic-svg-end organic-svg-wall-ascending" viewBox="0 0 18 40" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">
    <path d="M7.101 40H18V0H16C13.594 0 11.4403 1.49249 10.5955 3.74532L0.546698 30.5421C-1.1694 35.1184 2.21356 40 7.101 40Z"/>
  </svg>`,

  // Right Rounded End Cap (viewBox 0 0 10 40)
  capRight: `<svg aria-hidden="true" class="organic-svg-end organic-svg-cap-right" viewBox="0 0 10 40" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">
    <path d="M0 40V0H4C7.31371 0 10 2.68629 10 6V34C10 37.3137 7.31371 40 4 40H0Z"/>
  </svg>`
};

export const DEFAULT_ARROW_ICON = `<svg class="organic-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
  <line x1="7" y1="17" x2="17" y2="7"/>
  <polyline points="7 7 17 7 17 17"/>
</svg>`;

/**
 * Renders an accessible OrganicButton HTML string.
 */
export function renderOrganicButton({
  label = '',
  href = '',
  choice = 'wedding',
  action = 'confirm-selection',
  size = 'md', // 'sm' | 'md' | 'lg'
  variant = 'primary', // 'primary' | 'ghost' | 'wedding' | 'conference'
  speed = 'normal', // 'slow' | 'normal' | 'fast'
  className = '',
  isAr = false,
  id = '',
  icon = DEFAULT_ARROW_ICON,
  type = 'button'
} = {}) {
  const isLink = Boolean(href);
  const tag = isLink ? 'a' : 'button';
  const tagAttrs = isLink
    ? `href="${href}"`
    : `type="${type}"`;

  const safeLabel = String(label || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  return `
    <div class="organic-btn-wrap organic-btn-wrap--${variant} organic-btn-wrap--${size} organic-btn-wrap--${speed}${isAr ? ' organic-btn-wrap--rtl' : ''}${className ? ` ${className}` : ''}" data-choice="${choice}">
      <${tag}
        ${id ? `id="${id}"` : ''}
        class="organic-btn"
        data-choice="${choice}"
        data-action="${action}"
        ${tagAttrs}
        aria-label="${safeLabel}"
      >
        <div class="organic-btn-inner">
          <!-- Label Segment -->
          <div class="organic-btn-label-part">
            ${SVG_SHAPES.capLeft}
            <div class="organic-btn-label-body">
              <span class="organic-btn-label-wrap">
                <span class="organic-btn-label">${safeLabel}</span>
              </span>
            </div>
            ${SVG_SHAPES.wallDescending}
          </div>

          <!-- Icon Segment -->
          <div class="organic-btn-icon-part">
            ${SVG_SHAPES.wallAscending}
            <div class="organic-btn-icon-body">
              <span class="organic-btn-icon-wrap">
                ${icon}
              </span>
            </div>
            ${SVG_SHAPES.capRight}
          </div>
        </div>
      </${tag}>
    </div>
  `;
}

export default renderOrganicButton;
