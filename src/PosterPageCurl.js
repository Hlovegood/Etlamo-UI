// ==========================================================================
// PosterPageCurl — Native ESM Engine for OriginKit poster-page-curl
// Apollo Editorial Design • Full-Width Edge-to-Edge Hero
// Supports Full Paper Folding (0% to 100% full reveal) with pointer drag & click
// ==========================================================================

import { sound } from './sound.js';

/**
 * Returns destination-specific imagery and editorial copy matching user choice.
 * Styled in Apollo Design System (paradigm-pro serif + MonaSans uppercase).
 */
export function getPosterCategoryData(category = 'all', lang = 'en', t = (k) => k) {
  const isAr = lang === 'ar';

  if (category === 'wedding') {
    return {
      category: 'wedding',
      frontImage: '/public/images/hero-estate.jpg',
      frontAlt: isAr ? 'قصر البارون وقصور الإسكندرية التراثية' : 'Baron Palace & Heritage Royal Estates',
      backImage: '/public/images/celebration-portal.jpg',
      backAlt: isAr ? 'قصر عابدين صالون المرايا الإمبراطوري' : 'Abdeen Palace Imperial Mirror Ballroom',
      kicker: isAr ? 'قصور تاريخية وأفراح ملكية' : 'Royal Weddings & Sovereign Palaces',
      title: isAr ? 'أفراح ملكية في أعرق قصور مصر التاريخية' : "Royal Weddings in Egypt's Sovereign Historic Palaces",
      intro: isAr
        ? 'استكشف قصور الإسكندرية والقاهرة الأسطورية، حدائق المانسترلي وضفاف النيل العتيقة، بتجهيزات ملكية متكاملة وقاعات مصممة لأعظم الاحتفالات الأسطورية.'
        : 'Explore legendary heritage palaces, Nile waterfront salons, and open-air botanical groves curated for unforgettable royal celebrations.',
      tags: isAr
        ? ['قصور ملكية نادرة', 'ضفاف النيل الساحرة', 'أجنحة زفاف خاصة']
        : ['Historic Royal Estates', 'Nile Waterfront Salons', 'Private Bridal Suites'],
      revealed: {
        kicker: isAr ? 'الأرشيف الملكي المستور' : 'Revealed Royal Archive',
        title: isAr ? 'قصر عابدين • صالون المرايا الإمبراطوري' : 'Abdeen Palace • Imperial Mirror Gallery',
        desc: isAr
          ? 'تحفة معمارية بطراز إيطالي فاخر، ثريات كريستال عتيقة، وتجهيزات تسع حتى ٨٠٠ ضيف مع أجنحة ملكية مستقلة.'
          : 'Grand Italian Renaissance ballroom featuring antique crystal chandeliers accommodating up to 800 guests with private royal suites.',
        location: isAr ? 'وسط البلد، القاهرة' : 'Downtown Cairo',
        capacity: isAr ? '٨٠٠ ضيف' : '800 Guests'
      }
    };
  }

  if (category === 'conference') {
    return {
      category: 'conference',
      frontImage: '/public/images/conference-portal.jpg',
      frontAlt: isAr ? 'قاعة القمة الرئاسية الكبرى' : 'Presidential Plenary Hall',
      backImage: '/public/images/summit-ballroom.jpg',
      backAlt: isAr ? 'مركز المؤتمرات الدولي وقاعة الوفود' : 'International Summit Center & Plenary',
      kicker: isAr ? 'قمم دبلوماسية ومؤتمرات تنفيذية' : 'Executive Summits & Diplomatic Forums',
      title: isAr ? 'مراكز المؤتمرات والقمم الدبلوماسية الرفيعة' : 'Presidential Plenary Halls & Diplomatic Summits',
      intro: isAr
        ? 'قاعات مؤتمرات دولية متطورة، مدرجات تفاعلية بدقة 8K، وأنظمة ترجمة فورية مصممة للقمم السيادية والمؤتمرات الاقتصادية الكبرى.'
        : 'High-security international plenaries, 8K interactive amphitheaters, and simultaneous interpretation for sovereign assemblies.',
      tags: isAr
        ? ['مدرجات 8K تفاعلية', 'ترجمة فورية متعددة', 'شبكات أمنية مشفرة']
        : ['8K Interactive Plenaries', 'Multi-channel Interpretation', 'Encrypted Networks'],
      revealed: {
        kicker: isAr ? 'الأرشيف الدبلوماسي المستور' : 'Revealed Diplomatic Archive',
        title: isAr ? 'مركز المؤتمرات الدولي • قاعة الوفود' : 'International Summit Center • Delegation Hall',
        desc: isAr
          ? 'تجهيزات أمنية وتقنية متقدمة وشبكات مشفرة تسع حتى ١٥٠٠ وفد دولي مع مركز صحفي مستقل.'
          : 'Encrypted communications, broadcast infrastructure, and tiered seating for up to 1,500 diplomatic delegates with an independent media hub.',
        location: isAr ? 'القاهرة الجديدة، مصر' : 'New Cairo, Egypt',
        capacity: isAr ? '١٥٠٠ وفد' : '1,500 Delegates'
      }
    };
  }

  // Default / All
  return {
    category: 'all',
    frontImage: '/public/images/hero-estate.jpg',
    frontAlt: isAr ? 'قصور ومراكز فعاليات تاريخية' : 'Curated Sovereign Estates in Egypt',
    backImage: '/public/images/conference-portal.jpg',
    backAlt: isAr ? 'قاعة القمة السيادية' : 'Sovereign Plenary Hall',
    kicker: isAr ? 'قصور تاريخية ومراكز مؤتمرات' : 'Curated Historic Palaces & Summits',
    title: t('headline'),
    intro: t('intro'),
    tags: isAr
      ? ['قصور ملكية وقاعات تاريخية', 'مراكز مؤتمرات وقمم', 'تخطيط ثلاثي الأبعاد']
      : ['Historic Palaces', 'Summit Centers', '3D Walkthrough Planning'],
    revealed: {
      kicker: isAr ? 'الأرشيف السيادي المستور' : 'Revealed Sovereign Archive',
      title: isAr ? 'قاعة القمة الرئاسية • القاهرة' : 'Presidential Plenary Hall • Cairo',
      desc: isAr
        ? 'تجهيزات متقدمة وقاعات تاريخية ساحرة تليق بأهم الفعاليات الملكية والدبلوماسية.'
        : 'Advanced technical infrastructure and historic architecture curated for sovereign assemblies.',
      location: isAr ? 'القاهرة والإسكندرية' : 'Cairo & Alexandria',
      capacity: isAr ? '١٥٠ - ١٥٠٠ ضيف' : '150 - 1,500 Guests'
    }
  };
}

/**
 * Renders the HTML string for OriginKit PosterPageCurl full-width hero.
 * Styled in Apollo Design System with Full Paper Fold controls.
 */
export function renderPosterPageCurl({
  category = 'all',
  lang = 'en',
  t = (k) => k,
  icon = () => '',
  explore3DText = ''
}) {
  const isAr = lang === 'ar';
  const data = getPosterCategoryData(category, lang, t);
  const planActionText = t('homePlanAction');
  const exploreText = explore3DText || (isAr ? 'جولة القصر ثلاثية الأبعاد' : 'Explore the 3D tour');
  const foldFullLabel = isAr ? 'طي الصفحة بالكامل' : 'Fold Full Poster';
  const unfoldFullLabel = isAr ? 'فرد الصفحة' : 'Unfold Poster';
  const curlAriaLabel = isAr
    ? 'اسحب أو اضغط لطي الصفحة بالكامل والكشف عن الأرشيف المستور'
    : 'Drag or click to fold poster fully and reveal the interior archive';
  const peelHint = isAr ? 'اسحب لطي الصفحة' : 'Drag to Fold';

  return `
    <section class="poster-page-curl-hero" data-category="${data.category}" aria-label="${isAr ? 'القسم الرئيسي: القصور والمؤتمرات' : 'Hero Section: Historic Palaces & Summits'}">
      <div class="poster-curl-container">
        <!-- Back Revealed Layer (Underneath the curled/folded sheet) -->
        <div class="poster-layer poster-layer-back" id="poster-under-layer" aria-label="${isAr ? 'الأرشيف السيادي المكشوف' : 'Revealed Sovereign Archive'}">
          <img class="poster-layer-img" src="${data.backImage}" alt="${data.backAlt}" loading="eager" />
          <div class="poster-back-scrim"></div>

          <!-- Revealed Venue Editorial Card -->
          <div class="poster-back-card">
            <span class="poster-back-kicker">${data.revealed.kicker}</span>
            <h3 class="poster-back-title">${data.revealed.title}</h3>
            <p class="poster-back-desc">${data.revealed.desc}</p>
            <div class="poster-back-meta">
              <span class="poster-back-meta-item">${icon('pin')} ${data.revealed.location}</span>
              <span class="poster-back-meta-item">${icon('user')} ${data.revealed.capacity}</span>
            </div>
            <div class="poster-back-actions">
              <button class="button poster-unfold-btn" type="button" data-action="unfold-poster">
                <span>↩</span> <span>${unfoldFullLabel}</span>
              </button>
              <a class="button button-outline poster-revealed-plan-btn" href="#/plans">
                ${planActionText}
              </a>
            </div>
          </div>
        </div>

        <!-- Front Primary Layer (Clipped dynamically as paper folds) -->
        <div class="poster-layer poster-layer-front">
          <img class="poster-layer-img" src="${data.frontImage}" alt="${data.frontAlt}" loading="eager" />
          <div class="poster-front-scrim"></div>
          <div class="poster-front-vignette"></div>

          <!-- Editorial Foreground Typography & Actions (Apollo Design) -->
          <div class="poster-front-content">
            <div class="poster-category-kicker">
              <span class="poster-category-dot"></span>
              <span>${data.kicker}</span>
            </div>

            <h1 class="poster-main-title">${data.title}</h1>
            <p class="poster-main-intro">${data.intro}</p>

            <div class="poster-action-group">
              <a class="button button-primary hero-plan-button poster-cta-btn" href="#/plans">${planActionText}</a>
              <a class="button button-outline hero-plan-button poster-cta-btn" href="#/walkthrough">${exploreText}</a>
              <!-- Dedicated Button to Fold Paper Fully -->
              <button class="button button-outline poster-cta-btn poster-fold-toggle-btn" type="button" aria-expanded="false" data-action="toggle-fold">
                <span class="poster-fold-btn-icon">📖</span>
                <span class="poster-fold-btn-text">${foldFullLabel}</span>
              </button>
            </div>

            <ul class="poster-tag-list" aria-label="${isAr ? 'مميزات الوجهات' : 'Venue features'}">
              ${data.tags.map((tag) => `<li class="poster-tag-item">${tag}</li>`).join('')}
            </ul>
          </div>
        </div>

        <!-- 3D Paper Curl & Fold Spine (Draggable all the way across screen) -->
        <div class="poster-curl-fold" role="button" tabindex="0" aria-label="${curlAriaLabel}" aria-expanded="false" data-action="corner-fold">
          <div class="poster-curl-shadow"></div>
          <div class="poster-curl-paper">
            <div class="poster-curl-sheen"></div>
          </div>
          <div class="poster-curl-hint">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M7 17L17 7M17 7H9M17 7V15" />
            </svg>
            <span class="poster-hint-text">${peelHint}</span>
          </div>
        </div>
      </div>
    </section>
  `;
}

/**
 * Mounts interactive pointer, drag, and keyboard handlers for PosterPageCurl.
 * Allows folding the paper fully (0% to 100%) across the entire width of the page.
 * Returns a dispose function to detach all event listeners cleanly.
 */
export function mountPosterPageCurl(host, { lang = 'en', onPeel = () => {} } = {}) {
  const hero = host.matches?.('.poster-page-curl-hero') ? host : host.querySelector('.poster-page-curl-hero');
  if (!hero) return () => {};

  const fold = hero.querySelector('.poster-curl-fold');
  const toggleBtn = hero.querySelector('.poster-fold-toggle-btn');
  const toggleBtnText = hero.querySelector('.poster-fold-btn-text');
  const unfoldBtn = hero.querySelector('.poster-unfold-btn');
  const hintText = hero.querySelector('.poster-hint-text');
  if (!fold) return () => {};

  const isAr = lang === 'ar' || document.documentElement.dir === 'rtl';
  let isDragging = false;
  let isFullyFolded = false;
  let currentProgress = 0.06; // 0.06 = resting corner peel tip, 1.0 = fully folded over

  const foldFullLabel = isAr ? 'طي الصفحة بالكامل' : 'Fold Full Poster';
  const unfoldFullLabel = isAr ? 'فرد الصفحة' : 'Unfold Poster';

  function updateFold(progress, animate = false) {
    currentProgress = Math.max(0.04, Math.min(1.0, progress));
    hero.style.setProperty('--fold-progress', currentProgress.toFixed(4));

    const heroWidth = hero.offsetWidth || window.innerWidth;
    const heroHeight = hero.offsetHeight || 650;
    const isMobile = window.innerWidth <= 768;

    // Corner curl pixels for small progress, transitioning to full screen sweep
    const curlPixels = Math.round(currentProgress * (heroWidth * (isMobile ? 1.0 : 1.15)));
    hero.style.setProperty('--curl-size', `${curlPixels}px`);

    // Diagonal crease percentages
    const creaseX = isAr
      ? (currentProgress * 105).toFixed(2) + '%'
      : ((1 - currentProgress) * 105).toFixed(2) + '%';
    hero.style.setProperty('--crease-x', creaseX);

    if (animate) {
      fold.style.transition = 'width 0.5s cubic-bezier(0.16, 1, 0.3, 1), height 0.5s cubic-bezier(0.16, 1, 0.3, 1), transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)';
    } else {
      fold.style.transition = 'none';
    }

    const foldedNow = currentProgress >= 0.75;
    if (foldedNow !== isFullyFolded) {
      isFullyFolded = foldedNow;
      hero.classList.toggle('is-fully-folded', isFullyFolded);
      hero.classList.toggle('is-curled-expanded', isFullyFolded);
      fold.setAttribute('aria-expanded', String(isFullyFolded));

      if (toggleBtn) {
        toggleBtn.setAttribute('aria-expanded', String(isFullyFolded));
        if (toggleBtnText) {
          toggleBtnText.textContent = isFullyFolded ? unfoldFullLabel : foldFullLabel;
        }
      }
      if (hintText) {
        hintText.textContent = isFullyFolded ? unfoldFullLabel : (isAr ? 'اسحب لطي الصفحة' : 'Drag to Fold');
      }
      onPeel(isFullyFolded);
    }
  }

  function setFullyFolded(folded) {
    isFullyFolded = folded;
    hero.classList.toggle('is-fully-folded', isFullyFolded);
    hero.classList.toggle('is-curled-expanded', isFullyFolded);
    fold.setAttribute('aria-expanded', String(isFullyFolded));

    if (toggleBtn) {
      toggleBtn.setAttribute('aria-expanded', String(isFullyFolded));
      if (toggleBtnText) {
        toggleBtnText.textContent = isFullyFolded ? unfoldFullLabel : foldFullLabel;
      }
    }
    if (hintText) {
      hintText.textContent = isFullyFolded ? unfoldFullLabel : (isAr ? 'اسحب لطي الصفحة' : 'Drag to Fold');
    }

    updateFold(isFullyFolded ? 1.0 : 0.06, true);
    sound?.play('tap');
    onPeel(isFullyFolded);
  }

  // Pointer Drag Handlers — Allows dragging across the entire width of the hero
  function onPointerDown(e) {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    isDragging = true;
    fold.setPointerCapture(e.pointerId);
    fold.style.transition = 'none';
    sound?.play('hover');
  }

  function onPointerMove(e) {
    if (!isDragging) return;
    const heroRect = hero.getBoundingClientRect();
    let progress = 0;

    if (isAr) {
      // In RTL, dragging from left edge (x=0) towards right edge (x=heroRect.width)
      const dx = e.clientX - heroRect.left;
      progress = dx / heroRect.width;
    } else {
      // In LTR, dragging from right edge (x=heroRect.width) towards left edge (x=0)
      const dx = heroRect.right - e.clientX;
      progress = dx / heroRect.width;
    }

    updateFold(progress, false);
  }

  function onPointerUp(e) {
    if (!isDragging) return;
    isDragging = false;
    try {
      fold.releasePointerCapture(e.pointerId);
    } catch {}

    // Snap to fully folded if dragged past 35%, otherwise snap back to resting tip
    if (currentProgress > 0.35) {
      setFullyFolded(true);
    } else {
      setFullyFolded(false);
    }
  }

  function onFoldClick(e) {
    if (isDragging) return;
    setFullyFolded(!isFullyFolded);
  }

  function onKeyDown(e) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setFullyFolded(!isFullyFolded);
    }
  }

  function onMouseEnter() {
    if (!isDragging && !isFullyFolded) {
      updateFold(0.18, true); // Expand on hover as preview
      sound?.play('hover');
    }
  }

  function onMouseLeave() {
    if (!isDragging && !isFullyFolded) {
      updateFold(0.06, true); // Settle back to resting tip
    }
  }

  // Wire event listeners
  fold.addEventListener('pointerdown', onPointerDown);
  fold.addEventListener('pointermove', onPointerMove);
  fold.addEventListener('pointerup', onPointerUp);
  fold.addEventListener('pointercancel', onPointerUp);
  fold.addEventListener('click', onFoldClick);
  fold.addEventListener('keydown', onKeyDown);
  hero.addEventListener('mouseenter', onMouseEnter);
  hero.addEventListener('mouseleave', onMouseLeave);

  if (toggleBtn) {
    toggleBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      setFullyFolded(!isFullyFolded);
    });
  }

  if (unfoldBtn) {
    unfoldBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      setFullyFolded(false);
    });
  }

  // Initialize resting fold state
  updateFold(0.06, false);

  return function dispose() {
    fold.removeEventListener('pointerdown', onPointerDown);
    fold.removeEventListener('pointermove', onPointerMove);
    fold.removeEventListener('pointerup', onPointerUp);
    fold.removeEventListener('pointercancel', onPointerUp);
    fold.removeEventListener('click', onFoldClick);
    fold.removeEventListener('keydown', onKeyDown);
    hero.removeEventListener('mouseenter', onMouseEnter);
    hero.removeEventListener('mouseleave', onMouseLeave);
  };
}
