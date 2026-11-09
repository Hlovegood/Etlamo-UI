// =============================================================================
// ETLAMO (اتلموا) — Sovereign Identity System
// Concept A: The Sovereign Conclave (المجلس الملكي)
// Four royal vaults converge inward in celebratory assembly around an 8-pointed star
// =============================================================================

export const ETLAMO_MARK_D = "M128,14 A114,114 0 1,0 128,242 A114,114 0 1,0 128,14 Z M128,24 A104,104 0 1,1 128,232 A104,104 0 1,1 128,24 Z M128.0,96.0 L133.17,115.53 L150.63,105.37 L140.47,122.83 L160.0,128.0 L140.47,133.17 L150.63,150.63 L133.17,140.47 L128.0,160.0 L122.83,140.47 L105.37,150.63 L115.53,133.17 L96.0,128.0 L115.53,122.83 L105.37,105.37 L122.83,115.53 Z M106.0,26.0 L150.0,26.0 L150.0,36.0 L142.0,44.0 Q136.0,76.0 128.0,86.0 Q120.0,76.0 114.0,44.0 L106.0,36.0 Z M134.0,36.0 L132.0,54.0 Q128.0,72.0 124.0,54.0 L122.0,36.0 Z M230.0,106.0 L230.0,150.0 L220.0,150.0 L212.0,142.0 Q180.0,136.0 170.0,128.0 Q180.0,120.0 212.0,114.0 L220.0,106.0 Z M220.0,134.0 L202.0,132.0 Q184.0,128.0 202.0,124.0 L220.0,122.0 Z M150.0,230.0 L106.0,230.0 L106.0,220.0 L114.0,212.0 Q120.0,180.0 128.0,170.0 Q136.0,180.0 142.0,212.0 L150.0,220.0 Z M122.0,220.0 L124.0,202.0 Q128.0,184.0 132.0,202.0 L134.0,220.0 Z M26.0,150.0 L26.0,106.0 L36.0,106.0 L44.0,114.0 Q76.0,120.0 86.0,128.0 Q76.0,136.0 44.0,142.0 L36.0,150.0 Z M36.0,122.0 L54.0,124.0 Q72.0,128.0 54.0,132.0 L36.0,134.0 Z M184.57,71.43 L181.74,85.57 L167.6,88.4 L170.43,74.26 Z M184.57,184.57 L170.43,181.74 L167.6,167.6 L181.74,170.43 Z M71.43,184.57 L74.26,170.43 L88.4,167.6 L85.57,181.74 Z M71.43,71.43 L85.57,74.26 L88.4,88.4 L74.26,85.57 Z";

export function etlamoLogoSvg({ size = 'default', iconOnly = false, lang = 'en', className = '' } = {}) {
  const dimensions = {
    sm: { box: 28, text: '16px', sub: '9px' },
    default: { box: 36, text: '18px', sub: '10px' },
    lg: { box: 48, text: '24px', sub: '11px' }
  }[size] || { box: 36, text: '18px', sub: '10px' };

  const isAr = lang === 'ar';
  const brandName = isAr ? 'اتلموا · ETLAMO' : 'ETLAMO';
  const subtext = isAr ? 'قصور وقاعات مصر' : 'Estates & Summits';

  const markSvg = `<svg class="weddo-mark-svg etlamo-mark-svg" viewBox="0 0 256 256" width="${dimensions.box}" height="${dimensions.box}" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
    <path fill="currentColor" fill-rule="evenodd" d="${ETLAMO_MARK_D}"/>
  </svg>`;

  if (iconOnly) {
    return `<span class="weddo-logo-mark etlamo-logo-mark ${className}">${markSvg}</span>`;
  }

  return `<span class="weddo-brand-lockup etlamo-brand-lockup ${className}" dir="ltr">
    <span class="weddo-brand-icon etlamo-brand-icon" aria-hidden="true">${markSvg}</span>
    <span class="weddo-brand-text etlamo-brand-text">
      <span class="weddo-brand-name etlamo-brand-name">${brandName}</span>
      <span class="weddo-brand-tag etlamo-brand-tag" lang="${lang}">${subtext}</span>
    </span>
  </span>`;
}

// Backwards-compatible alias for existing imports
export const weddoLogoSvg = etlamoLogoSvg;
