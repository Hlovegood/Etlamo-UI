// ==========================================================================
// CutoutCard - Native ESM Engine for @cult-ui/cutout-card
// High-Fashion Architectural Corner Cutout Venue Card
// Preserves 100% of venue data, links, favorites, and comparisons.
// ==========================================================================

export const CUTOUT_FILLET_SVG = `<svg class="cutout-corner-fillet-svg" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <path d="M0 0 V20 H20 A20 20 0 0 1 0 0 Z" fill="currentColor"/>
</svg>`;

/**
 * Renders an accessible CutoutCard component string for a venue.
 */
export function renderCutoutCard({
  venue,
  t,
  local,
  escape,
  icon,
  number,
  money,
  areaName,
  capacityOf,
  startingPrice,
  compareButton,
  saveButton,
  photo
}) {
  const isApproved = venue.isSample === false;
  const sampleText = t(isApproved ? 'approvedListing' : 'sample');
  const venueTitle = escape(local(venue.name));
  const venueKind = t(venue.kind);
  const venueArea = escape(areaName(venue.area));
  const venueCapacity = number(capacityOf(venue));
  const venuePrice = money(startingPrice(venue));
  const viewVenueText = t('viewVenue');
  const guestsUnitText = t('guestsUnit');
  const capacityText = t('capacity');
  const fromText = t('from');

  return `
    <article class="cutout-card venue-card" data-id="${venue.id}">
      <!-- Cult UI CutoutCardMedia -->
      <div class="cutout-card-media card-art">
        <a class="cutout-card-image-link" href="#/venues/${venue.id}" aria-label="${venueTitle}">
          ${photo(venue)}
        </a>
        <div class="cutout-card-overlay" aria-hidden="true"></div>

        <!-- Cult UI CutoutCardInsetLabel with inverted corner fillets -->
        <div class="cutout-card-inset-label sample-label-wrap">
          <span class="sample-label cutout-label-text">${sampleText}</span>
          <!-- Top-start edge inverted concave fillet -->
          <span class="cutout-corner cutout-corner-top-edge" aria-hidden="true">
            ${CUTOUT_FILLET_SVG}
          </span>
          <!-- Bottom-end edge inverted concave fillet -->
          <span class="cutout-corner cutout-corner-bottom-edge" aria-hidden="true">
            ${CUTOUT_FILLET_SVG}
          </span>
        </div>

        <!-- Cult UI CutoutCardPin / Action: Save Venue Button -->
        <div class="cutout-card-pin">
          ${saveButton(venue)}
        </div>
      </div>

      <!-- Cult UI CutoutCardContent -->
      <div class="cutout-card-content card-content">
        <span class="venue-kind-pill">${venueKind}</span>
        <h3 class="cutout-card-title">
          <a href="#/venues/${venue.id}">${venueTitle}</a>
        </h3>
        <p class="location">
          ${icon('pin')}${venueArea}
        </p>

        <div class="card-facts">
          <span>${icon('people')}${capacityText} ${venueCapacity} ${guestsUnitText}</span>
          <span>${fromText}<strong>${venuePrice}</strong></span>
        </div>

        <!-- Cult UI CutoutCardFooter / Actions Grid -->
        <div class="card-actions-grid">
          <a class="button button-outline full-width" href="#/venues/${venue.id}">
            ${viewVenueText}
          </a>
          ${compareButton(venue)}
        </div>
      </div>
    </article>
  `;
}
