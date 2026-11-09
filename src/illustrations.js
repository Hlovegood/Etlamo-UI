// WEDDO Sovereign Architectural Photography & Portals
// Authentic high-resolution Egyptian estates, royal ballrooms & diplomatic summit convention centers

const VENUE_PHOTOS = {
  'olive-garden': {
    src: '/public/images/olive-garden.jpg',
    alt: 'The Olive Garden Estate — Century-Old Botanical Olive Groves & Royal Bridal Pavilions'
  },
  'nile-salon': {
    src: '/public/images/nile-salon.jpg',
    alt: 'Nile Royal Waterfront Ballroom — Panoramic Nile Views & Gilded Stucco Ceilings'
  },
  'azure-court': {
    src: '/public/images/azure-court.jpg',
    alt: 'Azure Fountain Court — Aristocratic Marble Colonnades & Cascading Fountains'
  },
  'cairo-meeting-house': {
    src: '/public/images/cairo-meeting-house.jpg',
    alt: 'Cairo Executive Meeting House — Hybrid Diplomatic Boardroom & 4K Plenary'
  },
  'summit-ballroom': {
    src: '/public/images/summit-ballroom.jpg',
    alt: 'Summit Plenary Convention Center — Curved 8K LED Wall & UN Protocol Hall'
  },
  'pyramids-terrace': {
    src: '/public/images/pyramids-terrace.jpg',
    alt: 'Pyramids Heritage Terrace — Panoramic Plateau View of the Giza Pyramids'
  }
};

const THEME_PHOTOS = {
  conference: {
    src: '/public/images/conference-portal.jpg',
    alt: 'Executive Plenary & Diplomatic Convention Hall'
  },
  conferenceRoom: {
    src: '/public/images/cairo-meeting-house.jpg',
    alt: 'Executive Diplomatic Boardroom'
  },
  conferenceHall: {
    src: '/public/images/summit-ballroom.jpg',
    alt: 'Summit Plenary Convention Hall'
  },
  coral: {
    src: '/public/images/nile-salon.jpg',
    alt: 'Grand Imperial Nile Waterfront Ballroom'
  },
  ballroom: {
    src: '/public/images/nile-salon.jpg',
    alt: 'Grand Imperial Nile Waterfront Ballroom'
  },
  blue: {
    src: '/public/images/azure-court.jpg',
    alt: 'Azure Fountain Court & Colonnades'
  },
  courtyard: {
    src: '/public/images/azure-court.jpg',
    alt: 'Azure Fountain Court & Colonnades'
  },
  garden: {
    src: '/public/images/olive-garden.jpg',
    alt: 'Heritage Olive Groves & Botanical Garden'
  }
};

export function venueArt(theme = 'garden', id = null, customAlt = '') {
  let photo = null;
  if (id && VENUE_PHOTOS[id]) {
    photo = VENUE_PHOTOS[id];
  } else if (theme && THEME_PHOTOS[theme]) {
    photo = THEME_PHOTOS[theme];
  } else {
    photo = {
      src: '/public/images/hero-estate.jpg',
      alt: 'Weddo Heritage Egyptian Estate'
    };
  }

  const alt = customAlt || photo.alt;
  return `<img class="venue-photo" src="${photo.src}" alt="${alt}" loading="lazy" width="800" height="500">`;
}

export function celebrationPortalArt() {
  return `<div class="portal-art celebration-portal-art">
    <img class="portal-photo" src="/public/images/celebration-portal.jpg" alt="Royal Celebrations & Wedding Venues" loading="lazy" width="800" height="500">
    <div class="portal-badge-chip">
      <span class="portal-dot emerald"></span>
      <span>ROYAL CELEBRATIONS & WEDDINGS</span>
    </div>
  </div>`;
}

export function conferencePortalArt() {
  return `<div class="portal-art conference-portal-art">
    <img class="portal-photo" src="/public/images/conference-portal.jpg" alt="Executive Summits & Diplomatic Conferences" loading="lazy" width="800" height="500">
    <div class="portal-badge-chip">
      <span class="portal-dot azure"></span>
      <span>EXECUTIVE SUMMITS & CONFERENCES</span>
    </div>
  </div>`;
}

export const heroArt = () => `<div class="hero-art">
  <img class="hero-photo" src="/public/images/hero-estate.jpg" alt="Weddo Sovereign Estate" loading="eager" width="1200" height="700">
  <span class="hero-seal-badge" aria-hidden="true">★ EGYPT</span>
</div>`;
