import { areas, areaGroups } from './areas.js';
import { venues, findVenue, capacityOf, startingPrice, guestCounts, eventTypes, sessions, conferenceKinds } from './data.js';
import { copy } from './i18n.js';
import { defaultFilters, parseFilters, searchVenues, today, validateRequest, blockedSlot } from './domain.js';
import { getLanguage, saveLanguage, getSaved, saveSaved, getRequests, saveRequest, initializeConnection, refreshRequests, isConnected, sendDemoResponse, getAccount, changeAccount } from './store.js';
import { api, listAll, uploadPhoto, uploadFloorPlan } from './api.js';
import { securityView, notificationsView } from './security-views.js';
import { teamView } from './team-views.js';
import { adminView, reviewSummary } from './admin-views.js';
import { accountView, venueForm } from './account-views.js';
import { venueArt, heroArt, celebrationPortalArt, conferencePortalArt } from './illustrations.js';
import { weddoLogoSvg } from './logo.js';
import { renderBubbleMenu, animateBubbleMenu, closeBubbleMenu } from './BubbleMenu.js';
import { renderDiscRevealNav, animateDiscRevealNav, closeDiscRevealNav, mountDiscRevealNav } from './DiscRevealNav.js';
import { renderStaggeredMenu, mountStaggeredMenu, closeStaggeredMenu, isStaggeredMenuOpen } from './StaggeredMenu.js';
import { mountHallway3D, hallwayHeroSection } from './hallway-3d.js';
import { mountSplitLanding, splitLandingSection } from './split-landing-3d.js';
import { sound } from './sound.js';
import { initPreloader } from './preloader.js';
import { openExpandableScreen, closeExpandableScreen, isExpandableScreenOpen } from './ExpandableScreen.js';
import { initReactBits } from './ReactBits.js';
import { renderCutoutCard } from './CutoutCard.js';
import { toggleSmoothTheme } from './ThemeToggle.js';
import { renderPosterPageCurl, mountPosterPageCurl } from './PosterPageCurl.js';
import { renderZoomParallax, mountZoomParallax } from './ZoomParallax.js';
import { renderMeadowRiseFooter, mountMeadowRiseFooter } from './MeadowRiseFooter.js';
import { renderCustomDatePicker, mountCustomDatePicker } from './CustomDatePicker.js';
import { mountAllCustomSelects } from './CustomSelect.js';
import { mountCircularGallery } from './CircularGallery.js';
import { renderSlitTypeFaq, mountSlitTypeFaq } from './SlitTypeFaq.js';

import { packageName, spaceFields, packageFields, photoChoice, readListing } from './catalog-views.js';
import { compareView, calendarView, conversationView, supportView } from './operations-views.js';
import { planningView, planningWords, originalRoomSection, seatPositions, starterLists } from './planning-views.js';
import { mountRoom3D, previewLayout } from './venue-3d.js';
import { servicePage, vendorServicePage, adminServicePage, serviceWords } from './provider-views.js';

const app = document.querySelector('#app');
function getTheme() {
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
}
function toggleTheme(event) {
  toggleSmoothTheme(event);
}
const state = { isMenuOpen: false, compare:[], providers:{public:[],owned:[],admin:[],inquiries:[],vendorInquiries:[],error:false}, plans:{items:[],loaded:false,error:false,seat:null,scaleMode:false,scalePoints:[],picker:false,pickerCategory:'rect',inspector:'',zoom:1,gridVisible:true,ceremonyMode:'block',ceremonySeat:'',guestSelected:'',seatingGuestPending:'',guestForm:false,createModal:false,suggestion:{planId:'',kind:'saved'},history:{planId:'',undo:[],redo:[]},members:{planId:'',items:[]},inquiries:{planId:'',items:[],options:[],error:false}}, operations:{path:'',loaded:false,error:false,items:[],history:[]}, lang: getLanguage(), filters: defaultFilters(), saved: getSaved(), draft: null, stage: 'details', busy:false, connectionError:false, vendor:{venues:[],requests:[],loaded:false,error:false}, admin:{venues:[],loaded:false,error:false}, adminFilter:'PENDING',team:{venueId:'',members:[],loaded:false,error:false},inbox:{items:[],loaded:false,error:false},security:{mail:[],loaded:false,error:false,result:null} };
const t = key => copy[state.lang][key] || key;
const local = value => value[state.lang];
const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const number = value => new Intl.NumberFormat(state.lang === 'ar' ? 'ar-EG' : 'en-EG').format(value);
const money = value => `<bdi>${escape(number(value))} ${t('currency')}</bdi>`;
const areaName = id => local(areas.find(area => area.id === id)?.name || { en: '', ar: '' });
const formatDate = value => new Intl.DateTimeFormat(state.lang === 'ar' ? 'ar-EG' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(`${value}T12:00:00`));
const formatTimestamp = value => new Intl.DateTimeFormat(state.lang === 'ar' ? 'ar-EG' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(value));
const option = (value, label, selected, disabled = false) => `<option value="${escape(value)}"${String(value) === String(selected) ? ' selected' : ''}${disabled ? ' disabled' : ''}>${escape(label)}</option>`;
const paths = {
  heart: '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/>',
  pin: '<path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M7 3v4m10-4v4"/>',
  people: '<circle cx="9" cy="7" r="3"/><path d="M3 21v-3a6 6 0 0 1 12 0v3m1-17a3 3 0 0 1 0 6m3 11v-3a6 6 0 0 0-3-5"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  bag: '<rect x="4" y="7" width="16" height="14" rx="3"/><path d="M8 7V5a4 4 0 0 1 8 0v2"/>',
  arrow: '<path d="m14 6-6 6 6 6"/>',
};
const icon = name => `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.check}</svg>`;

function route() {
  let raw = location.hash.slice(1) || '/';
  if (!raw.startsWith('/')) {
    raw = '/discover';
  }
  const [path, query = ''] = raw.split('?');
  return { path, parts: path.split('/').filter(Boolean), params: new URLSearchParams(query) };
}
function header(path) {
  const isDark = getTheme() === 'dark';
  const isLanding = path === '' || path === '/';
  if (isLanding) {
    return '';
  }
  const menuHtml = renderStaggeredMenu({
    lang: state.lang,
    savedCount: state.saved.length,
    isDark,
    account: getAccount(),
    weddoLogoSvg,
    icon,
    showBar: true,
    colors: isDark ? ['#070d09', '#142018', '#eed8a6'] : ['#1b190d', '#2c2514', '#c5a880'],
    accentColor: isDark ? '#eed8a6' : '#c5a880',
  });

  const isDiscover = path === '/discover';
  const previewBar = (!isLanding && !isDiscover) ? `<div class="preview-bar"><span class="preview-dot" aria-hidden="true"></span><strong>${t('preview')}</strong><span>${t('previewNote')}</span></div>` : '';

  return `${menuHtml}${previewBar}`;
}
function footer() {
  return renderMeadowRiseFooter({ lang: state.lang });
}

function oldFooterUnused() {
  const isAr = state.lang === 'ar';
  return `<footer class="site-footer" id="site-footer" dir="${isAr ? 'rtl' : 'ltr'}">
    <!-- Seamless Full-Footer Ambient Glow (covers 100% height and width) -->
    <div class="site-footer-ambient-glow" aria-hidden="true"></div>

    <div class="site-footer-inner">
      <!-- Tier 1: Grand Brand Header & Concierge Protocol Desk -->
      <div class="site-footer-hero-band">
        <div class="site-footer-brand-lockup site-footer-brand">
          <a href="#/discover" class="site-footer-brand-link" aria-label="Etlamo Home">
            ${weddoLogoSvg({ size: 'sm', lang: state.lang })}
          </a>
          <p class="site-footer-descriptor site-footer-tagline">
            ${isAr 
              ? 'الأرشيف الملكي المعتمد لأرقى القصور التاريخية، المحميات النيلية، ومقار القمم الدبلوماسية في جمهورية مصر العربية.' 
              : 'The accredited sovereign archive of Egypt’s premier royal palaces, Nile heritage waterfronts, and presidential diplomatic estates.'}
          </p>
        </div>

        <div class="site-footer-concierge-pill">
          <span class="protocol-live-indicator" aria-hidden="true"></span>
          <div class="protocol-pill-content">
            <span class="protocol-pill-eyebrow">${isAr ? 'المراسم الملكية والخدمات الدبلوماسية' : 'ROYAL PROTOCOL & CONCIERGE DESK'}</span>
            <span class="protocol-pill-value">${isAr ? 'متاح ٢٤/٧ · خط المراسم: +20 (2) 2735-ETLAMO' : 'ACTIVE 24/7 · PROTOCOL: +20 (2) 2735-ETLAMO'}</span>
          </div>
        </div>
      </div>

      <!-- Tier 2: 4-Column Editorial Directory Grid -->
      <div class="site-footer-directory-grid">
        <!-- Col 1: Heritage Palaces & Collections -->
        <div class="footer-dir-col">
          <h4 class="footer-dir-title">${isAr ? 'مجموعات القصور الملكية' : 'Heritage Collections'}</h4>
          <ul class="footer-dir-list">
            <li><a href="#/venues?type=palace">${isAr ? 'القصور الملكية والسرايات التاريخية' : 'Royal Palaces & Historic Châteaux'}</a></li>
            <li><a href="#/venues?type=nile">${isAr ? 'تراسات ضفاف النيل والحدائق الملكية' : 'Grand Nile Waterfront Terraces'}</a></li>
            <li><a href="#/venues?type=citadel">${isAr ? 'باحات القلعة والمحميات الأثرية' : 'Citadel Terraces & Heritage Forts'}</a></li>
            <li><a href="#/venues?type=seafront">${isAr ? 'قصور ساحل المنتزه المتوسطية' : 'Mediterranean Seafront Palaces'}</a></li>
            <li><a href="#/venues?type=presidential">${isAr ? 'أجنحة القمم الدبلوماسية والرئاسية' : 'Presidential & Diplomatic Summits'}</a></li>
            <li><a href="#/venues?type=islands">${isAr ? 'جزر النيل الخاصة والملاذات النخبوية' : 'Private Nile Island Sanctuaries'}</a></li>
          </ul>
        </div>

        <!-- Col 2: Spatial Architecture & Platform Tools -->
        <div class="footer-dir-col">
          <h4 class="footer-dir-title">${isAr ? 'تخطيط المساحات والمنصة' : 'Spatial Architecture'}</h4>
          <ul class="footer-dir-list">
            <li><a href="#/venues">${isAr ? 'الجولات الافتراضية ثلاثية الأبعاد 3D' : '3D Spatial Walkthroughs'}</a></li>
            <li><a href="#/venue-workspace">${isAr ? 'مخطط المقاعد والمساحات التفاعلي' : 'Interactive Floor Plan & Seating'}</a></li>
            <li><a href="#/venues">${isAr ? 'فحص التوفر الزمني والبروتوكولي' : 'Real-Time Availability Audit'}</a></li>
            <li><a href="#/venues">${isAr ? 'مقارنة القصور والمواصفات الفنية' : 'Curated Venue Comparison Engine'}</a></li>
            <li><a href="#/vendor">${t('vendorDashboard')}</a></li>
            <li><a href="#/venue-workspace">${t('workspace')}</a></li>
            ${getAccount()?.role === 'vendor' ? `<li><a href="#/vendor/services">${t('manageServices')}</a></li>` : ''}
            ${getAccount()?.isAdmin ? `<li><a href="#/admin/support">${t('adminSupport')}</a></li><li><a href="#/admin/services">${t('reviewServices')}</a></li>` : ''}
          </ul>
        </div>

        <!-- Col 3: Regional Diplomatic Hubs & Consulates -->
        <div class="footer-dir-col site-footer-addresses" aria-label="${isAr ? 'المقرات الإقليمية' : 'Regional Offices'}">
          <h4 class="footer-dir-title">${isAr ? 'المقرات الإقليمية المعتمدة' : 'Regional Embassies & Hubs'}</h4>
          <div class="footer-hub-items">
            <div class="footer-hub-item footer-address-col">
              <span class="footer-hub-city footer-address-city">${isAr ? 'القاهرة — الزمالك التراثي' : 'Cairo — Zamalek Quarter'}</span>
              <p>${isAr ? 'حي الزمالك الدبلوماسي، كورنيش النيل التاريخي' : 'Zamalek Diplomatic Quarter, Historic Nile Corniche'}</p>
              <a href="tel:+20227359330" class="footer-hub-contact" dir="ltr">+20 (2) 2735 9330</a>
            </div>
            <div class="footer-hub-item footer-address-col">
              <span class="footer-hub-city footer-address-city">${isAr ? 'الإسكندرية — ساحل المنتزه' : 'Alexandria — Royal Montaza'}</span>
              <p>${isAr ? 'طريق الكورنيش التاريخي، واجهة قصر المنتزه البحرية' : 'Historic Corniche Way, Montaza Royal Seafront'}</p>
              <a href="tel:+2035448200" class="footer-hub-contact" dir="ltr">+20 (3) 5448 200</a>
            </div>
            <div class="footer-hub-item footer-address-col">
              <span class="footer-hub-city footer-address-city">${isAr ? 'الجيزة — هضبة الأهرامات' : 'Giza — Pyramids Plateau'}</span>
              <p>${isAr ? 'هضبة الأهرامات الملكية، طريق القمم والمواكب' : 'Royal Pyramids Plateau, Presidential Summit Way'}</p>
              <a href="tel:+20233771140" class="footer-hub-contact" dir="ltr">+20 (2) 3377 1140</a>
            </div>
          </div>
        </div>

        <!-- Col 4: Sovereign Registry & Archival Inquiries -->
        <div class="footer-dir-col footer-col-registry">
          <h4 class="footer-dir-title">${isAr ? 'سجل النخبة والمراسم' : 'The Sovereign Registry'}</h4>
          <p class="footer-registry-desc">
            ${isAr 
              ? 'انضم إلى السجل الخاص لتلقي دعوات المعاينة المغلقة للقصور غير المعلنة وحجوزات القمم الدبلوماسية.' 
              : 'Join the private registry for confidential previews of unlisted royal acquisitions and reserved diplomatic gala dates.'}
          </p>
          <div class="footer-registry-box">
            <div class="footer-registry-form">
              <input 
                type="email" 
                class="footer-registry-input" 
                placeholder="${isAr ? 'البريد الدبلوماسي أو المؤسسي...' : 'Diplomatic or private email...'}" 
                aria-label="${isAr ? 'البريد الإلكتروني للانضمام للسجل' : 'Email address for registry'}"
              />
              <button type="button" class="footer-registry-btn">
                ${isAr ? 'طلب دعوة' : 'Request Access'}
              </button>
            </div>
            <span class="footer-registry-note">
              ${isAr ? '● سرية تامة وتشفير بنكي. لا مراسلات ترويجية.' : '● Bank-grade encryption & confidentiality. No solicitation.'}
            </span>
          </div>
          <div class="footer-direct-contacts">
            <div class="footer-direct-contact">
              <span class="direct-contact-label">${isAr ? 'البريد البروتوكولي:' : 'Protocol Inquiries:'}</span>
              <a href="mailto:concierge@etlamo.eg" class="direct-contact-val">concierge@etlamo.eg</a>
            </div>
            <div class="footer-direct-contact">
              <span class="direct-contact-label">${isAr ? 'ساعات المراسم:' : 'Liaison Hours:'}</span>
              <span class="direct-contact-val">${isAr ? '٠٩:٠٠ ص — ١٠:٠٠ م بتوقيت القاهرة' : '09:00 — 22:00 Cairo (EEST)'}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Tier 3: Trust, Security & Heritage Accreditation Strip -->
      <div class="site-footer-trust-strip" aria-label="${isAr ? 'ميثاق الاعتماد الملكي والأمان' : 'Royal Heritage & Security Accreditations'}">
        <div class="trust-badge-item">
          <svg class="trust-badge-icon" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M12 2l7 4v6c0 5-3.5 9.5-7 11-3.5-1.5-7-6-7-11V6l7-4z" />
            <path d="M9 12l2 2 4-4" />
          </svg>
          <div class="trust-badge-text">
            <strong>${isAr ? 'توثيق تاريخي ١٠٠٪ معتمد' : '100% Certified Heritage'}</strong>
            <span>${isAr ? 'قصور مسجلة رسمياً بالتراث المصري' : 'Egyptian Heritage Registry verified'}</span>
          </div>
        </div>

        <div class="trust-badge-item">
          <svg class="trust-badge-icon" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          <div class="trust-badge-text">
            <strong>${isAr ? 'ميثاق السرية الدبلوماسية' : 'Diplomatic Discretion Charter'}</strong>
            <span>${isAr ? 'حماية تامة للبيانات وقوائم الضيوف' : 'Sovereign NDA & private guest list safety'}</span>
          </div>
        </div>

        <div class="trust-badge-item">
          <svg class="trust-badge-icon" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6v6l4 2" />
          </svg>
          <div class="trust-badge-text">
            <strong>${isAr ? 'تأمين المواكب والمراسم' : 'Protocol & Motorcade Clearances'}</strong>
            <span>${isAr ? 'تصاريح أمنية وتنسيق وصول الوفود' : 'VVIP convoy coordination & clearance'}</span>
          </div>
        </div>

        <div class="trust-badge-item">
          <svg class="trust-badge-icon" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
          <div class="trust-badge-text">
            <strong>${isAr ? 'ضيافة ملكية رفيعة المستوى' : 'Master Culinary Alliances'}</strong>
            <span>${isAr ? 'طهاة عالميون ومعايير ضيافة القمم' : 'Haute cuisine & royal banquet sommeliers'}</span>
          </div>
        </div>
      </div>

      <!-- Tier 4: Bottom Legal & Platform Actions Bar -->
      <div class="site-footer-bottom-bar site-footer-legal">
        <div class="site-footer-legal-group">
          <p class="site-footer-copyright">
            ${isAr 
              ? '© ٢٠٢٦ منصة اتلموا للقصور والمناسبات الملكية (ETLAMO). كافة الحقوق محفوظة.' 
              : '© 2026 ETLAMO Sovereign Heritage & Royal Venues Archive. All Sovereign Rights Reserved.'}
          </p>
          <small class="site-footer-legal-notice">${t('footerNote')}</small>
        </div>

        <nav class="site-footer-bottom-actions site-footer-links" aria-label="${isAr ? 'روابط المنصة' : 'Platform Links'}">
          <a class="text-link" href="#/vendor">${t('vendorDashboard')}</a>
          <a class="text-link" href="#/venue-workspace">${t('workspace')}</a>
          <a class="text-link" href="#/support">${t('support')}</a>
          <button class="text-link-btn" type="button" data-action="test-preloader">
            ${isAr ? 'تشغيل شاشة التحميل (Preloader)' : 'Replay Preloader'}
          </button>
        </nav>
      </div>
    </div>
  </footer>`;
}

function cookieBanner() {
  if (typeof localStorage !== 'undefined' && localStorage.getItem('weddo-cookie-consent') === 'true') {
    return '';
  }
  const isAr = state.lang === 'ar';
  return `<aside class="cookie-banner" role="region" aria-label="${isAr ? 'إشعار ملفات تعريف الارتباط' : 'Cookie Compliance Notice'}">
    <div class="cookie-banner-inner">
      <p class="cookie-banner-text">${isAr 
        ? 'نستخدم ملفات تعريف الارتباط الأساسية لضمان أمان التجربة وخصوصية الجلسة وحفظ اختيارات القصور.' 
        : 'We use essential cookies to maintain sessions, preserve selections, and ensure private portal security.'}</p>
      <button type="button" class="cookie-accept-btn" data-action="accept-cookie-consent">
        ${isAr ? 'قبول' : 'Accept'}
      </button>
    </div>
  </aside>`;
}

function rotatingScrollBadge() {
  const isAr = state.lang === 'ar';
  const text = isAr ? 'استكشف القصور الملكية · انزل للأسفل · ' : 'SCROLL DOWN · EXPLORE HERITAGE · ';
  return `<div class="rotating-scroll-badge" aria-hidden="true">
    <svg class="scroll-badge-svg" viewBox="0 0 100 100" width="84" height="84">
      <path id="scrollTextPath" d="M 50, 50 m -37, 0 a 37,37 0 1,1 74,0 a 37,37 0 1,1 -74,0" fill="none" />
      <text font-size="9" font-family="var(--font-roobert)" letter-spacing="1.5px" fill="currentColor">
        <textPath href="#scrollTextPath" startOffset="0%">
          ${text}
        </textPath>
      </text>
      <circle cx="50" cy="50" r="2.5" fill="currentColor"/>
    </svg>
  </div>`;
}
function saveButton(venue) {
  const saved = state.saved.includes(venue.id);
  return `<button type="button" class="save-button ${saved ? 'is-saved' : ''}" data-action="save" data-id="${venue.id}" aria-pressed="${saved}" aria-label="${escape(t(saved ? 'unsaveVenue' : 'saveVenue') + ': ' + local(venue.name))}">${icon('heart')}</button>`;
}
const pkgName=pkg=>packageName(pkg,t,local);
const photo=(venue)=>venue.media?.length?`<img class="venue-photo" src="/api/media/${escape(venue.media[0])}" alt="${escape(local(venue.name))}" loading="lazy" width="800" height="500">`:venueArt(venue.theme, venue.id, escape(local(venue.name)));
const compareButton=venue=>`<button class="button button-outline" type="button" data-action="compare" data-id="${venue.id}" aria-pressed="${state.compare.includes(venue.id)}">${t(state.compare.includes(venue.id)?'removeCompare':'compare')}</button>`;
function card(venue) {
  return renderCutoutCard({
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
  });
}
function empty(title, help, action = 'discover') {
  return `<div class="empty-state"><span class="empty-art" aria-hidden="true">${icon('pin')}</span><h2>${t(title)}</h2><p>${t(help)}</p>${action === 'reset' ? `<button class="button" data-action="reset">${t('reset')}</button>` : `<a class="button" href="#/discover">${t('findVenues')}</a>`}</div>`;
}
function categoryTabs() {
  const current = state.filters.category || 'all';
  const tabs = [
    { id: 'all', label: t('allSpaceTypes'), count: venues.length },
    { id: 'wedding', label: t('weddingSpaces'), count: venues.filter(v => ['heritage', 'ballroom', 'garden', 'courtyard', 'palace', 'estate', 'terrace'].includes(v.kind)).length },
    { id: 'conference', label: t('conferenceSpaces'), count: venues.filter(v => conferenceKinds.includes(v.kind)).length },
  ];
  return `<div class="category-tab-bar" role="tablist" aria-label="${t('eventSpaceType')}">
    ${tabs.map(tab => `
      <button type="button" class="category-tab ${current === tab.id ? 'is-active' : ''}" role="tab" aria-selected="${current === tab.id}" data-action="filter-category" data-category="${tab.id}">
        <span>${escape(tab.label)}</span> <span class="nav-count"><bdi>${number(tab.count)}</bdi></span>
      </button>
    `).join('')}
  </div>`;
}
function searchForm() {
  const f = state.filters;
  return `<form id="search-form" class="search-form" aria-label="${t('findVenues')}">
    <div class="search-field"><label for="category">${t('eventSpaceType')}</label><select id="category" name="category">${option('all',t('allSpaceTypes'),f.category)}${option('wedding',t('weddingSpaces'),f.category)}${option('conference',t('conferenceSpaces'),f.category)}</select></div>
    <div class="search-field"><label for="area">${icon('pin')}${t('area')}</label><select id="area" name="area">${option('all', t('allAreas'), f.area)}${areaGroups.map(group => `<optgroup label="${escape(local(group.name))}">${group.items.map(area => option(area.id, local(area.name), f.area)).join('')}</optgroup>`).join('')}</select></div>
    <div class="search-field date-search-field"><label for="date">${icon('calendar')}${t('date')}</label>${renderCustomDatePicker({ id: 'date', name: 'date', value: escape(f.date), min: today(), required: false, lang: state.lang, placeholder: t('chooseDate') })}</div>
    <div class="search-field"><label for="guests">${icon('people')}${t('guests')}</label><select id="guests" name="guests">${option('any', t('anyGuests'), f.guests)}${['10-50','50-100','100-200','200-350','350-500','500+'].map(range => option(range, range.split('-').map(n => n.endsWith('+') ? `${number(parseInt(n))}+` : number(Number(n))).join('–'), f.guests)).join('')}</select></div>
    <div class="search-field"><label for="budget">${icon('bag')}${t('budget')}</label><select id="budget" name="budget">${[['any','anyBudget'],['100000','upTo100'],['250000','upTo250'],['250000+','above250']].map(([value,key]) => option(value,t(key),f.budget)).join('')}</select></div>
    <button class="button search-button" type="submit">${t('findVenues')}</button></form><p id="date-note" class="search-note">${t('dateNote')}</p>`;
}
function landing() {
  return splitLandingSection({ lang: state.lang });
}
function home() {
  const results = searchVenues(state.filters);
  const isAr = state.lang === 'ar';
  const sampleTables=[{shape:'round',x:112,y:112,label:'1',seats:8},{shape:'rect',x:304,y:112,label:'2',seats:8}];
  const seatingPreview=`<svg viewBox="0 0 420 230" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"><defs><pattern id="home-grid" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M20 0H0V20" fill="none" stroke="var(--color-vellum, #dfdcd5)"/></pattern></defs><rect width="420" height="230" rx="0" fill="var(--color-chalk, #ebebeb)"/><rect width="420" height="230" rx="0" fill="url(#home-grid)"/>${sampleTables.map(table=>`<g transform="translate(${table.x} ${table.y})">${table.shape==='round'?'<circle r="36" fill="var(--color-bone, white)" stroke="var(--color-graphite, #647987)" stroke-width="2"/>':'<rect x="-60" y="-32" width="120" height="64" rx="0" fill="var(--color-bone, white)" stroke="var(--color-graphite, #647987)" stroke-width="2"/>'}<text text-anchor="middle" dominant-baseline="middle" fill="var(--color-ink, #17263f)" font-size="22" font-weight="700">${table.label}</text>${seatPositions(table).map(({x,y},index)=>`<circle cx="${x}" cy="${y}" r="11" fill="${index===0||index===3?'var(--color-gold, #147a70)':'var(--color-paper, white)'}" stroke="${index===0||index===3?'var(--color-gold, #147a70)':'var(--color-ash, #8294a3)'}"/>`).join('')}</g>`).join('')}</svg>`;
  return `${renderZoomParallax({
    lang: state.lang
  })}
  <div class="homepage-rest-of-site" id="homepage-content">
    <div class="search-wrap">${categoryTabs()}${searchForm()}</div>
    <section class="planner-spotlight" aria-labelledby="planner-spotlight-title"><div class="planner-spotlight-copy"><span class="planner-spotlight-kicker shiny-text">${t('homePlannerKicker')}</span><h2 id="planner-spotlight-title">${t('homePlannerTitle')}</h2><p>${t('homePlannerIntro')}</p><div class="planner-spotlight-tags"><span>${t('homePlannerWedding')}</span><span>${t('homePlannerConference')}</span><span>${t('homePlannerOther')}</span></div><a class="button" href="#/plans">${t('homePlanAction')}</a></div><div class="planner-spotlight-art">${seatingPreview}<span>${t('homePreviewLabel')}</span></div></section>
    <section class="results-section" aria-labelledby="results-title">
      <div class="section-heading">
        <div>
          <h2 id="results-title">${t('resultsTitle')}</h2>
          <p>${t('resultsIntro')}</p>
        </div>
        <span class="result-count" role="status"><bdi>${number(results.length)}</bdi> ${t(results.length===1?'resultSingular':'results')}</span>
      </div>
      ${results.length ? `
        <div class="venue-circular-gallery-wrapper" style="border: none;">
          <div class="circular-gallery-mount" id="venue-circular-gallery" style="position: relative; width: 100%; border: none;"></div>
        </div>
        <p class="fine-print">${t('priceNote')}</p>
      ` : empty('noResults','noResultsHelp','reset')}
    </section>
  </div>
  ${renderSlitTypeFaq({ lang: state.lang })}`;
}
function savedPage() {
  const saved = venues.filter(venue => state.saved.includes(venue.id));
  return `<section class="page-title"><h1>${t('savedTitle')}</h1><p>${t('savedIntro')}</p></section>${saved.length ? `<div class="venue-grid">${saved.map(card).join('')}</div>` : empty('noSaved','noSavedHelp')}`;
}
function detailPage(venue) {
  return `<a class="back-link" href="#/discover">${icon('arrow')}${t('back')}</a><div class="detail-heading"><div><p class="venue-kind">${t(venue.kind)}</p><h1>${escape(local(venue.name))}</h1><p class="location">${icon('pin')}${escape(areaName(venue.area))}</p></div><div class="team-card-actions">${compareButton(venue)}${saveButton(venue)}</div></div>
    <div class="detail-art">${photo(venue)}<span class="sample-label">${venue.media?.length?'':t('illustration')+' · '}${t(venue.isSample===false?'approvedListing':'sample')}</span></div><p><a class="button button-outline" href="#/venues/${venue.id}/3d">${t('view3dExample')}</a></p>${venue.media?.length>1?`<div class="photo-grid">${venue.media.slice(1).map(id=>`<a href="/api/media/${escape(id)}" target="_blank" rel="noopener"><img src="/api/media/${escape(id)}" alt="${escape(local(venue.name))}" width="240" height="160" loading="lazy"></a>`).join('')}</div>`:''}
    <div class="detail-layout"><div class="detail-content"><section><h2>${t('about')}</h2><p>${escape(local(venue.description))}</p><div class="amenities">${venue.amenities.map(key => `<span>${icon('check')}${t(key)}</span>`).join('')}</div></section>
    <section><h2>${t('spaces')}</h2><div class="space-grid">${venue.spaces.map(space => `<article class="space-card">${space.mediaId?`<img class="space-photo" src="/api/media/${escape(space.mediaId)}" alt="${escape(local(space.name))}" width="300" height="180" loading="lazy">`:icon('people')}<h3>${escape(local(space.name))}</h3>${space.kind?`<p>${t(space.kind)}</p>`:''}<p>${t('capacity')} ${number(space.capacity)} ${t('guestsUnit')}</p>${space.amenities?.length?`<p>${space.amenities.map(key=>t(key)).join(' · ')}</p>`:''}${space.enabled===false?`<p class="inline-note">${t('spacePaused')}</p>`:`<a class="text-link" href="#/request/${venue.id}?space=${space.id}" data-expandable-trigger="request-screen-${venue.id}" style="--trigger-radius: 9999px;">${t('checkDate')}</a>`}</article>`).join('')}</div></section>
    <section><h2>${t('packages')}</h2><p class="fine-print">${t('guidePrice')}</p><div class="package-grid">${venue.packages.map(pkg => `<article class="package-card"><h3>${escape(pkgName(pkg))}</h3><p class="package-price">${money(pkg.price)}</p><ul>${pkg.includes.map(key => `<li>${icon('check')}${t(key)}</li>`).join('')}</ul><a class="button button-outline full-width" href="#/request/${venue.id}?package=${pkg.id}" data-expandable-trigger="request-screen-${venue.id}" style="--trigger-radius: 9999px;">${t('checkDate')}</a></article>`).join('')}</div></section></div>
    <aside class="request-aside"><h2>${t('availabilityTitle')}</h2><p>${t('calendarCaveat')}</p>${(venue.availability || []).some(slot=>slot.blocked)?`<ul class="public-blocks">${venue.availability.filter(slot=>slot.blocked).slice(0,6).map(slot=>`<li>${escape(formatDate(slot.date))} · ${escape(local(venue.spaces.find(s=>s.id===slot.spaceId)?.name || {en:slot.spaceId,ar:slot.spaceId}))} · ${t(slot.session)}<br><strong>${t('dateBlocked')}</strong><small>${t('updatedAt')}: ${escape(formatTimestamp(slot.updatedAt))}</small></li>`).join('')}</ul>`:''}<span class="aside-price">${t('from')}<strong>${money(startingPrice(venue))}</strong></span><a class="button full-width" href="#/request/${venue.id}" data-expandable-trigger="request-screen-${venue.id}" style="--trigger-radius: 9999px;">${t('checkDate')}</a><small>${t('guidePrice')}</small></aside></div>`;
}
function venue3dPage(venue){
  const venueTitle = escape(local(venue.name));
  const isAr = state.lang === 'ar';
  const backLabel = isAr ? 'العودة لتفاصيل القاعة' : 'Back to Venue Details';
  const badgeLabel = isAr ? 'استكشاف مكاني ثلاثي الأبعاد' : 'Interactive 3D Spatial Walkthrough';
  return `<div class="venue-3d-theater">
    <header class="venue-3d-topbar">
      <div class="venue-3d-topbar-start">
        <a class="venue-3d-back" href="#/venues/${venue.id}">
          <span aria-hidden="true">${isAr ? '→' : '←'}</span>
          <span>${backLabel}</span>
        </a>
        <div class="venue-3d-title-group">
          <h1 class="venue-3d-title">${venueTitle}</h1>
          <span class="venue-3d-badge">${badgeLabel}</span>
        </div>
      </div>
      <div class="venue-3d-topbar-end">
        <a class="button venue-3d-cta" href="#/request/${venue.id}" data-expandable-trigger="request-screen-${venue.id}" style="--trigger-radius: 9999px;">${t('checkDate')}</a>
      </div>
    </header>
    <section class="room-3d room-3d-hero">
      <div class="room-3d-viewport-stage">
        <div class="room-3d-canvas" role="img" aria-label="${t('view3dExample')}"></div>
        <p class="room-3d-status" role="status">${t('threeDLoading')}</p>
      </div>
      <aside class="room-3d-cockpit" aria-label="${isAr ? 'خيارات وأدوات التحكم' : 'Options & Controls'}">
        <div class="room-3d-cockpit-header">
          <span class="room-3d-cockpit-kicker">${isAr ? 'غرفة التحكم والاستكشاف' : 'STUDIO CONTROLS'}</span>
          <h2>${isAr ? 'إعدادات المشهد' : 'Scene Options'}</h2>
          <p class="venue-3d-caveat">${t('venue3dCaveat')}</p>
        </div>
        <div class="room-3d-cockpit-section">
          <span class="room-3d-cockpit-label">${isAr ? 'زاوية الرؤية' : 'Camera Perspective'}</span>
          <div class="room-3d-controls room-3d-view-controls">
            <button class="button button-outline" type="button" data-scene-view="perspective">${t('threeDPerspective')}</button>
            <button class="button button-outline" type="button" data-scene-view="top">${t('threeDTop')}</button>
          </div>
        </div>
        <div class="room-3d-cockpit-section">
          <span class="room-3d-cockpit-label">${isAr ? 'الإضاءة والأجواء' : 'Lighting & Atmosphere'}</span>
          <div class="room-3d-controls room-3d-atmo-controls">
            ${['golden','sunrise','midnight'].map(mode=>`<button class="button button-outline" type="button" data-scene-atmosphere="${mode}" aria-pressed="${mode==='golden'}">${t(`threeD${mode[0].toUpperCase()+mode.slice(1)}`)}</button>`).join('')}
          </div>
        </div>
        <div class="room-3d-table-info" aria-live="polite">
          <div class="room-3d-table-placeholder">
            <span class="room-3d-table-placeholder-icon" aria-hidden="true">🪑</span>
            <p><strong>${isAr ? 'معاينة المقاعد وتوزيع الضيوف' : 'Table & Seating Inspector'}</strong><br><small>${isAr ? 'اضغط على أي طاولة في المشهد ثلاثي الأبعاد لمعاينة تفاصيلها.' : 'Click any table in the 3D scene to inspect seating and guest details.'}</small></p>
          </div>
        </div>
      </aside>
    </section>
  </div>`;
}
function ensureDraft(venue, params) {
  if (state.draft?.venueId === venue.id && venue.spaces.some(space=>space.id===state.draft.spaceId && space.enabled!==false) && venue.packages.some(pkg=>pkg.id===state.draft.packageId) && (!params.get('space') || params.get('space')===state.draft.spaceId) && (!params.get('package') || params.get('package')===state.draft.packageId)) return;
  const previous=state.draft?.venueId===venue.id?state.draft:null;
  const desired = previous?.guests ?? (state.filters.guests === 'any' ? (conferenceKinds.includes(venue.kind)?20:100) : parseInt(state.filters.guests));
  const availableSpaces=venue.spaces.filter(s=>s.enabled!==false);
  const space = availableSpaces.find(space => space.id === params.get('space')) || availableSpaces.find(s=>s.id===previous?.spaceId) || availableSpaces.find(s=>s.capacity>=desired) || availableSpaces[0];
  state.draft = {
    venueId: venue.id, date: previous?.date || state.filters.date, guests: guestCounts.find(count => count >= desired && count<=space.capacity) || guestCounts.filter(count=>count<=space.capacity).at(-1),
    spaceId: space.id, packageId: venue.packages.find(pkg => pkg.id === params.get('package'))?.id || venue.packages.find(pkg=>pkg.id===previous?.packageId)?.id || venue.packages[0].id, event: previous?.event || (conferenceKinds.includes(venue.kind)?'conference':'wedding'), session: previous?.session || 'evening',
  };
  state.stage = 'details';
}
function requestSummary(request) {
  const venue = findVenue(request.venueId);
  const space = request.snapshot?.space || venue.spaces.find(space => space.id === request.spaceId);
  const pkg = request.snapshot?.package || venue.packages.find(pkg => pkg.id === request.packageId);
  const pairs = [['event', t(request.event)], ['date', formatDate(request.date)], ['session',t(request.session)], ['guests',number(request.guests)], ['space',local(space.name)], ['package',pkgName(pkg)]];
  return `<dl class="summary-list">${pairs.map(([label,value]) => `<div><dt>${t(label)}</dt><dd>${escape(value)}</dd></div>`).join('')}</dl><div class="summary-price"><span>${t('estimated')}</span><strong>${money(pkg.price)}</strong></div><p class="fine-print">${t('guidePrice')}</p>`;
}
function requestPage(venue, params) {
  if(!venue.spaces.some(s=>s.enabled!==false))return `<div class="empty-state"><h1>${t('spacePaused')}</h1><p>${t('spacePausedHelp')}</p><a class="button" href="#/discover">${t('findVenues')}</a></div>`;
  ensureDraft(venue, params);
  const d = state.draft;
  const capacity = venue.spaces.find(space => space.id === d.spaceId).capacity;
  const isAr = state.lang === 'ar';
  return `<div class="expandable-screen-wrap" data-expandable-screen="true" data-layout-id="request-screen-${venue.id}">
    <div class="expandable-screen-card is-embedded" style="--content-radius: 0px;">
      <div class="expandable-screen-header">
        <div>
          <span class="venue-kind-pill">${t(venue.kind)}</span>
          <h1 class="expandable-screen-title">${escape(local(venue.name))} · ${t('requestTitle')}</h1>
        </div>
        <a href="#/venues/${venue.id}" class="expandable-screen-close" aria-label="${isAr?'إغلاق':'Close'}" title="${isAr?'إغلاق':'Close'}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 18px; height: 18px;">
            <path d="M18 6 6 18M6 6l12 12"/>
          </svg>
        </a>
      </div>
      <div class="expandable-screen-content">
        <p class="expandable-screen-intro">${t('requestIntro')}</p>
        <div class="request-layout"><section class="form-panel"><ol class="form-progress"><li ${state.stage === 'details' ? 'aria-current="step"' : ''}><span>${number(1)}</span>${t('detailsStep')}</li><li ${state.stage === 'review' ? 'aria-current="step"' : ''}><span>${number(2)}</span>${t('reviewStep')}</li></ol>
        ${state.stage === 'details' ? `<form id="request-form"><div class="form-grid">
          <div class="form-field"><label for="event">${t('event')}</label><select id="event" name="event">${eventTypes.map(type => option(type,t(type),d.event)).join('')}</select></div>
          <div class="form-field"><label for="request-date">${t('date')} <span class="required">${t('required')}</span></label>${renderCustomDatePicker({ id: 'request-date', name: 'date', value: escape(d.date), min: today(), required: true, lang: state.lang, venueId: venue.id, placeholder: t('chooseDate') })}<small id="date-help">${t('chooseDate')}</small></div>
          <div class="form-field"><label for="session">${t('session')}</label><select id="session" name="session">${sessions.map(session => option(session,t(session),d.session)).join('')}</select></div>
          <div class="form-field"><label for="space">${t('space')}</label><select id="space" name="spaceId">${venue.spaces.map(space => option(space.id, `${local(space.name)} — ${number(space.capacity)} ${t('guestsUnit')}`, d.spaceId,space.enabled===false)).join('')}</select></div>
          <div class="form-field"><label for="request-guests">${t('guests')}</label><select id="request-guests" name="guests" aria-describedby="guest-help capacity-error">${guestCounts.map(count => option(count, `${number(count)} ${t('guestsUnit')}`,d.guests,count>capacity)).join('')}</select><small id="guest-help">${t('guestHelp')}</small><small id="capacity-error" class="field-error" ${d.guests <= capacity ? 'hidden' : ''}>${t('guestCapacityError')}</small></div>
          <div class="form-field"><label for="package">${t('package')}</label><select id="package" name="packageId">${venue.packages.map(pkg => option(pkg.id, `${pkgName(pkg)} — ${number(pkg.price)} ${t('currency')}`,d.packageId)).join('')}</select></div>
        </div><p class="inline-note">${t('localRequestNote')}</p><p id="blocked-error" class="form-error" role="alert" hidden>${t('dateBlockedError')}</p><button class="button full-width" type="submit">${t('review')}</button></form>` : `<h2>${t('requestSummary')}</h2>${requestSummary(d)}<p class="inline-note">${t('localRequestNote')}</p><div class="form-actions"><button class="button button-outline" data-action="edit-request">${t('edit')}</button><button class="button" data-action="save-request">${t('saveRequest')}</button></div>`}
        </section><aside class="request-venue">${photo(venue)}<div><p class="venue-kind">${t(venue.kind)}</p><h2>${escape(local(venue.name))}</h2><p class="location">${icon('pin')}${escape(areaName(venue.area))}</p><p>${t('dateNote')}</p></div></aside></div>
      </div>
    </div>
  </div>`;
}
function successPage(request) {
  const venue = findVenue(request.venueId);
  return `<section class="success-panel"><div class="success-mark">${icon('check')}</div><h1>${t('successTitle')}</h1><p>${t('successNote')}</p><strong>${escape(local(venue.name))}</strong><p>${escape(formatDate(request.date))}</p><div class="form-actions"><a class="button" href="#/requests">${t('viewRequests')}</a><a class="button button-outline" href="#/discover">${t('anotherVenue')}</a></div></section>`;
}
function responseSummary(request) {
  const keys={PENDING:'pending',OFFERED:'offered',DECLINED:'declined',DRAFT:'draftStatus'};
  const reply=request.response;
  return `<span class="local-status status-${request.status.toLowerCase()}">${t(keys[request.status])}</span>${reply ? `<div class="venue-response"><strong>${t(keys[reply.status])}</strong>${reply.status==='OFFERED' ? `<p>${t('offerPrice')}: ${money(reply.price)}</p><small>${t('offerNote')}</small>` : `<p>${t(reply.reason)}</p>`}<p class="fine-print">${t('responseDate')}: ${escape(formatTimestamp(reply.createdAt))}</p></div>` : `<p class="inline-note">${t(request.status==='DRAFT'?'draftNote':'noReply')}</p>`}`;
}
function requestsPage() {
  const requests = getRequests();
  return `<section class="page-title"><h1>${t('requestListTitle')}</h1><p>${t('requestListIntro')}</p><button class="button button-outline" data-action="refresh" ${state.busy?'disabled':''}>${t('refresh')}</button></section>${requests.length ? `<div class="request-list">${requests.map(request => {
    const venue = findVenue(request.venueId);
    return `<article class="request-record"><div class="request-record-head"><div><h2><a href="#/venues/${venue.id}">${escape(local(request.snapshot?.name || venue.name))}</a></h2><p class="location">${icon('pin')}${escape(areaName(request.snapshot?.area || venue.area))}</p></div></div>${requestSummary(request)}${responseSummary(request)}${request.status!=='DRAFT'?`<p><a class="text-link" href="#/conversation/${request.id}">${t('conversation')}</a></p>`:''}<div class="record-footer"><span>${t('created')}: ${escape(formatTimestamp(request.createdAt))}</span><span>${t('reference')}: <bdi>${escape(request.id.slice(0,8).toUpperCase())}</bdi></span></div></article>`;
  }).join('')}</div>` : empty('noRequests','noRequestsHelp')}`;
}
function workspacePage(params,owned=false) {
  const choices=owned?state.vendor.venues.filter(venue=>venue.access?.canReply):venues.filter(venue=>venue.isSample!==false);
  if(!choices.length)return `<p class="inline-note">${t('noReplyAccess')}</p>`;
  const venue=choices.find(item=>item.id===params.get('venue')) || choices[0];
  const queue=(owned?state.vendor.requests:getRequests()).filter(request=>request.venueId===venue.id);
  return `<section class="page-title"><${owned?'h2':'h1'}>${t(owned?'vendorRequests':'workspaceTitle')}</${owned?'h2':'h1'}><p>${t(owned?'vendorIntro':'workspaceNote')}</p></section><div class="workspace-controls"><div class="form-field"><label for="workspace-venue">${t('selectVenue')}</label><select id="workspace-venue" data-owned="${owned}">${choices.map(item=>option(item.id,local(item.name),venue.id)).join('')}</select></div><button class="button button-outline" data-action="refresh" ${state.busy?'disabled':''}>${t('refresh')}</button></div>${queue.length ? `<div class="request-list">${queue.map(request=>{
    const pkg=request.snapshot?.package || venue.packages.find(pkg=>pkg.id===request.packageId);
    return `<article class="request-record"><h2>${t(request.event)} · ${escape(formatDate(request.date))}</h2>${requestSummary(request)}${responseSummary(request)}${owned && request.status!=='DRAFT'?`<p><a class="text-link" href="#/conversation/${request.id}">${t('conversation')}</a></p>`:''}${request.status==='PENDING'?`<form class="response-form" data-owned="${owned}" data-id="${request.id}" data-venue="${venue.id}" data-version="${request.version}"><h3>${t('reply')}</h3><div class="form-field"><label for="type-${request.id}">${t('responseType')}</label><select class="response-type" id="type-${request.id}" name="status">${option('OFFERED',t('makeOffer'),'OFFERED')}${option('DECLINED',t('declineRequest'),'OFFERED')}</select></div><div class="form-field price-field"><label for="price-${request.id}">${t('offerPrice')} (${t('currency')})</label><input id="price-${request.id}" name="price" type="number" value="${pkg.price}" min="1" max="1000000000" step="1" required></div><div class="form-field reason-field" hidden><label for="reason-${request.id}">${t('reason')}</label><select id="reason-${request.id}" name="reason" disabled>${option('DATE_UNAVAILABLE',t('DATE_UNAVAILABLE'),'DATE_UNAVAILABLE')}${option('PACKAGE_UNAVAILABLE',t('PACKAGE_UNAVAILABLE'),'DATE_UNAVAILABLE')}</select></div><p class="fine-print">${t('offerNote')}</p><button class="button full-width" type="submit" ${state.busy?'disabled':''}>${t('sendResponse')}</button></form>`:''}</article>`;
  }).join('')}</div>`:(owned?`<p class="inline-note">${t('noVendorRequests')}</p>`:empty('noDemoRequests','noDemoRequestsHelp'))}`;
}
const viewTools=()=>({...accountTools(),areaName,money,formatDate,formatTimestamp});
const accountTools=()=>({t,escape,option,local,areaGroups,guestCounts,account:getAccount()});
function vendorPage(r) {
  if(getAccount()?.role!=='vendor') return `<section class="page-title"><h1>${t('vendorDashboard')}</h1><p>${t('vendorIntro')}</p></section><a class="button" href="#/account/register">${t('createAccount')}</a> <a class="button button-outline" href="#/account">${t('signIn')}</a>`;
  if(!state.vendor.loaded) return `<section class="page-title"><h1>${t('vendorDashboard')}</h1><p role="status">${t('dashboardLoading')}</p></section>`;
  if(state.vendor.error) return `<p role="alert">${t('connectionFailed')}</p><button class="button" data-action="refresh">${t('retry')}</button>`;
  if(r.path==='/vendor/new') return venueForm(accountTools());
  if(r.parts[1]==='edit') {
    const venue=state.vendor.venues.find(v=>v.id===r.parts[2]);
    return venue?.access?.canEdit?venueForm({...accountTools(),venue}):empty('notFound','notFoundHelp');
  }
  if(r.parts[1]==='calendar') {const venue=state.vendor.venues.find(item=>item.id===r.parts[2]);return venue?.access?.canEdit?operationContent(()=>calendarView(venue,state.operations.items,viewTools())):empty('notFound','notFoundHelp');}
  if(r.parts[1]==='team' && r.parts.length===3) {const venue=state.vendor.venues.find(item=>item.id===r.parts[2]);return teamView({...accountTools(),venue,team:state.team,busy:state.busy});}
  const cards=state.vendor.venues.map(venue=>`<article class="space-card"><h2>${escape(local(venue.name))}</h2><p>${escape(areaName(venue.area))}</p><p class="fine-print">${t(venue.access?.isOwner?'venueOwner':'teamMember')}</p><span class="local-status">${t({PENDING:'reviewPending',APPROVED:'reviewApproved',CHANGES:'reviewChanges'}[venue.status])}</span>${reviewSummary(venue,{t,escape,formatTimestamp})}<div class="team-card-actions">${venue.access?.canEdit?`<a class="text-link" href="#/vendor/edit/${escape(venue.id)}">${t('editVenue')}</a><a class="text-link" href="#/vendor/calendar/${escape(venue.id)}">${t('calendarTitle')}</a>`:''}${venue.access?.canManageTeam?`<a class="text-link" href="#/vendor/team/${escape(venue.id)}">${t('venueTeam')}</a>`:''}</div></article>`).join('');
  return `<section class="page-title"><h1>${t('vendorDashboard')}</h1><p>${t('vendorIntro')}</p><a class="button" href="#/vendor/new">${t('addVenue')}</a></section>${cards?`<div class="space-grid">${cards}</div><section class="vendor-queue">${workspacePage(r.params,true)}</section>`:`<div class="empty-state"><h2>${t('noVendorVenues')}</h2><p>${t('noVendorVenuesHelp')}</p></div>`}`;
}
async function refreshVendor() {
  if(getAccount()?.role!=='vendor') return;
  try {
    const listings=await listAll('/api/vendor/venues');
    const requests=await listAll('/api/vendor/requests');
    state.vendor={venues:listings,requests,loaded:true,error:false};
  } catch {state.vendor.loaded=true;state.vendor.error=true;}
}
async function refreshTeam(venueId) {
  const venue=state.vendor.venues.find(item=>item.id===venueId);
  if(!venue?.access?.canManageTeam){state.team={venueId,members:[],loaded:true,error:true};return;}
  try {const result=await api(`/api/vendor/venues/${venueId}/team`);state.team={venueId,members:result.members,loaded:true,error:false};}
  catch {state.team={venueId,members:[],loaded:true,error:true};}
}
async function refreshAdmin() {
  if(!getAccount()?.isAdmin)return;
  try {state.admin={venues:await listAll('/api/admin/venues'),loaded:true,error:false};}
  catch {state.admin.loaded=true;state.admin.error=true;}
}
async function refreshInbox() {
  if(!getAccount()){state.inbox={items:[],loaded:true,error:false};return;}
  try {state.inbox={items:await listAll('/api/notifications'),loaded:true,error:false};}
  catch {state.inbox.loaded=true;state.inbox.error=true;}
}
async function refreshMail() {
  if(!getAccount())return;
  try {
    const result=await api('/api/account/mail-preview');
    const mail=result.items.filter(item=>{try {const url=new URL(item.url);return url.origin===location.origin && /^#\/account\/(verify|reset)\?token=[a-f0-9]{64}$/.test(url.hash);}catch{return false;}});
    state.security={...state.security,mail,loaded:true,error:false};
  } catch {state.security.loaded=true;state.security.error=true;}
}
function operationContent(view) {return state.operations.path!==route().path || !state.operations.loaded?`<p role="status">${t('loading')}</p>`:state.operations.error?`<p role="alert">${t('connectionFailed')}</p><button class="button" data-action="refresh">${t('retry')}</button>`:view();}
async function refreshOperations() {
  const r=route();let path;
  if(r.parts[0]==='conversation')path=`/api/requests/${encodeURIComponent(r.parts[1])}/messages`;
  else if(r.path==='/support' || r.path==='/admin/support')path=r.path==='/support'?'/api/support':'/api/admin/support';
  else if(r.parts[0]==='vendor' && r.parts[1]==='calendar')path=`/api/vendor/venues/${encodeURIComponent(r.parts[2])}/availability`;
  else return;
  const current=r.path;
  try {const items=path.endsWith('/availability')?(await api(path)).items:await listAll(path);const history=r.parts[0]==='conversation'?(await api(`/api/requests/${encodeURIComponent(r.parts[1])}/history`)).items:[];state.operations={path:current,loaded:true,error:false,items,history};}
  catch {state.operations={path:current,loaded:true,error:true,items:[],history:[]};}
}
async function refreshPlans() {
  if(route().parts[0]!=='plans' || !getAccount())return;
  try {state.plans.items=(await api('/api/plans')).items;state.plans.loaded=true;state.plans.error=false;const plan=currentPlan();if(plan?.access==='OWNER'&&state.plans.members.planId!==plan.id){try{state.plans.members={planId:plan.id,items:(await api(`/api/plans/${plan.id}/members`)).items};}catch{state.plans.members={planId:plan.id,items:[]};}}if(plan)await refreshPlanInquiries(plan.id);}
  catch {state.plans.loaded=true;state.plans.error=true;}
}
async function refreshPlanInquiries(id){
  try{state.plans.inquiries={planId:id,...await api(`/api/plans/${id}/inquiries`),error:false};}
  catch{state.plans.inquiries={planId:id,items:[],options:[],error:true};}
}
function currentPlan(){return state.plans.items.find(plan=>plan.id===route().parts[1]);}
async function assignSeat(tableId,index,guestId){
  const plan=currentPlan();if(!plan||plan.access==='VIEW'||state.busy)return;
  const table=plan.tables.find(item=>item.id===tableId),guest=plan.guests.find(item=>item.id===guestId);
  if(!table||!Number.isInteger(index)||index<0||index>=table.seats||guestId&&(!guest||guest.rsvp==='no'))return;
  const tables=structuredClone(plan.tables),target=tables.find(item=>item.id===tableId);
  if(guestId)for(const item of tables)item.assignments=item.assignments.map(id=>id===guestId?null:id);
  target.assignments[index]=guestId||null;
  await savePlan({...plan,tables});
}
async function assignCeremonySeat(key,guestId){
  const plan=currentPlan();if(!plan||plan.access==='VIEW'||state.busy||!plan.ceremony||guestId&&!plan.guests.some(g=>g.id===guestId&&g.rsvp!=='no'))return;
  const assignments={...plan.ceremony.assignments};
  for(const [seat,id] of Object.entries(assignments))if(id===guestId||seat===key)delete assignments[seat];
  if(guestId)assignments[key]=guestId;
  await savePlan({...plan,ceremony:{...plan.ceremony,assignments}});
}
function parseGuestCsv(text){
  const rows=[],row=[];let field='',quoted=false;
  for(let i=0;i<text.length;i++){
    const ch=text[i];
    if(ch==='"'&&quoted&&text[i+1]==='"'){field+='"';i++;}
    else if(ch==='"')quoted=!quoted;
    else if(ch===','&&!quoted){row.push(field);field='';}
    else if((ch==='\n'||ch==='\r')&&!quoted){row.push(field);rows.push([...row]);row.length=0;field='';if(ch==='\r'&&text[i+1]==='\n')i++;}
    else field+=ch;
  }
  if(quoted)throw new Error('Invalid CSV');
  if(field||row.length){row.push(field);rows.push(row);}
  const headers=rows.shift()?.map(value=>value.replace(/^\ufeff/,'').trim().toLowerCase())||[],nameIndex=headers.indexOf('name');
  if(nameIndex<0)throw new Error('Missing Name column');
  return rows.filter(row=>row.some(value=>value.trim())).map(row=>{
    const get=key=>String(row[headers.indexOf(key)]||'').trim(),name=String(row[nameIndex]||'').trim();
    if(!name||name.length>100)throw new Error('Invalid name');
    const rsvp=get('rsvp').toLowerCase(),meal=get('meal').toLowerCase();
    return {id:crypto.randomUUID(),name,group:get('group').slice(0,60),email:get('email').slice(0,254),phone:get('phone').slice(0,40),address:get('address').slice(0,240),dietary:get('dietary').slice(0,120),notes:get('notes').slice(0,500),rsvp:['yes','no'].includes(rsvp)?rsvp:'pending',meal:['standard','vegetarian','vegan','other'].includes(meal)?meal:'none'};
  });
}
const planSnapshot=plan=>structuredClone(Object.fromEntries(['name','type','date','budget','expenses','tasks','shopping','schedule','links','guests','tables','features','floorPlan','ceremony'].map(key=>[key,plan[key]])));
function planHistory(id){if(state.plans.history.planId!==id)state.plans.history={planId:id,undo:[],redo:[]};return state.plans.history;}
async function savePlan(plan,mode='record') {
  const previous=currentPlan();if(state.busy||!previous||previous.access==='VIEW')return false;
  state.busy=true;
  try {
    const saved=(await api(`/api/plans/${plan.id}`,plan)).plan;
    const history=planHistory(plan.id);
    if(mode==='record'){history.undo.push(planSnapshot(previous));history.undo=history.undo.slice(-20);history.redo=[];}
    else if(mode==='undo'){history.undo.pop();history.redo.push(planSnapshot(previous));}
    else if(mode==='redo'){history.redo.pop();history.undo.push(planSnapshot(previous));}
    state.plans.items=state.plans.items.map(item=>item.id===saved.id?saved:item);
    if(JSON.stringify(previous.links)!==JSON.stringify(saved.links))await refreshPlanInquiries(saved.id);
    state.busy=false;render();return true;
  } catch(error) {
    state.busy=false;
    if(error.code==='CONFLICT'){state.plans.history={planId:'',undo:[],redo:[]};await refreshPlans();}
    render();const warning=document.querySelector('#planner-error');if(warning){warning.textContent=error.code==='CONFLICT'?(state.lang==='ar'?'الخطة اتغيرت. ظهر أحدث إصدار.':'The plan changed. The latest version is shown.'):(state.lang==='ar'?'مش قادرين نحفظ التغيير. جرّب تاني.':'Could not save this change. Try again.');warning.hidden=false;}return false;
  }
}
async function navigate() {
  render(true);
  await refreshOperations();
  await refreshPlans();
  await refreshProviders();
  render();
  if(route().path==='/notifications'){await refreshInbox();render();}
  if(route().path==='/account/mail-preview'){await refreshMail();render();}
  if(route().path==='/admin' && getAccount()?.isAdmin){await refreshAdmin();render();}
  if(route().parts[0]==='vendor' && getAccount()?.role==='vendor') {await refreshVendor();if(route().parts[1]==='team')await refreshTeam(route().parts[2]);render();}
}
async function refreshProviders(){
  const path=route().path;
  if(!path.startsWith('/services') && path!=='/vendor/services' && path!=='/admin/services')return;
  try{
    if(path.startsWith('/services'))state.providers.public=(await api('/api/providers')).items;
    if(path==='/services/requests' && getAccount())state.providers.inquiries=(await api('/api/provider-inquiries')).items;
    if(path==='/vendor/services' && getAccount()?.role==='vendor'){
      state.providers.owned=(await api('/api/vendor/providers')).items;
      state.providers.vendorInquiries=(await api('/api/vendor/provider-inquiries')).items;
    }
    if(path==='/admin/services' && getAccount()?.isAdmin)state.providers.admin=(await api('/api/admin/providers')).items;
    state.providers.error=false;
  }catch{state.providers.error=true;}
}
let disposeRoom3D=()=>{};
let disposeHallway3D=()=>{};
let disposeSplitLanding=()=>{};
let disposePosterCurl=()=>{};
let disposeZoomParallax=()=>{};
let disposeFullscreenFooter=()=>{};
let disposeCustomDatePicker=()=>{};
let disposeSearchDatePicker=()=>{};
let disposeCustomSelects=()=>{};
let disposeStaggeredMenu=()=>{};
let disposeCircularGallery=()=>{};
let disposeSlitTypeFaq=()=>{};
function render(moveFocus = false) {
  document.body.classList.remove('footer-focused', 'footer-ground-active');
  document.documentElement.classList.remove('footer-ground-active');
  disposeRoom3D();disposeRoom3D=()=>{};
  disposeHallway3D();disposeHallway3D=()=>{};
  disposeSplitLanding();disposeSplitLanding=()=>{};
  disposePosterCurl();disposePosterCurl=()=>{};
  disposeZoomParallax();disposeZoomParallax=()=>{};
  disposeFullscreenFooter();disposeFullscreenFooter=()=>{};
  disposeCustomDatePicker();disposeCustomDatePicker=()=>{};
  disposeSearchDatePicker();disposeSearchDatePicker=()=>{};
  disposeCustomSelects();disposeCustomSelects=()=>{};
  disposeStaggeredMenu();disposeStaggeredMenu=()=>{};
  disposeCircularGallery();disposeCircularGallery=()=>{};
  disposeSlitTypeFaq();disposeSlitTypeFaq=()=>{};
  state.saved=getSaved();
  const r = route();
  document.documentElement.lang = state.lang;
  document.documentElement.dir = state.lang === 'ar' ? 'rtl' : 'ltr';
  let content, title = t('discover');
  if (r.path === '/') { content = landing(); title=state.lang==='ar'?'ابدأ هنا':'Start here'; }
  else if (r.path === '/discover') { state.filters = parseFilters(r.params); content = home(); }
  else if(r.path==='/walkthrough'){
    const isAr = state.lang === 'ar';
    const walkthroughTitle = isAr ? 'جولة ويدو ثلاثية الأبعاد' : 'Weddo 3D Spatial Walkthrough';
    const walkthroughCaveat = isAr ? 'تجربة تفاعلية لمشهد فرح نموذجي؛ لا يمثل قاعة حقيقية.' : 'Explore an interactive sample wedding scene. It does not represent a real venue.';
    content = `<div class="venue-3d-theater">
      <header class="venue-3d-topbar">
        <div class="venue-3d-topbar-start">
          <a class="venue-3d-back" href="#/discover">
            <span aria-hidden="true">${isAr ? '→' : '←'}</span>
            <span>${isAr ? 'تصفح القاعات' : 'Explore Venues'}</span>
          </a>
          <div class="venue-3d-title-group">
            <h1 class="venue-3d-title">${walkthroughTitle}</h1>
            <span class="venue-3d-badge">${isAr ? 'مشهد نموذجي تفاعلي' : 'Interactive Sample Scene'}</span>
          </div>
        </div>
        <div class="venue-3d-topbar-end">
          <a class="button venue-3d-cta" href="#/plans">${isAr ? 'مخطط المناسبات' : 'Event Planner'}</a>
        </div>
      </header>
      ${originalRoomSection(state.lang)}
    </div>`;
    title = isAr ? 'الجولة ثلاثية الأبعاد' : '3D walkthrough';
  }
  else if(r.parts[0]==='services'){content=servicePage(r.path,r.params,{state,account:getAccount(),lang:state.lang,escape,local,option,areas,number});title=t('servicesNav');}
  else if(r.path==='/vendor/services'){content=vendorServicePage({state,account:getAccount(),lang:state.lang,escape,local,option,areas,number,editId:r.params.get('edit')});title=t('manageServices');}
  else if(r.path==='/admin/services'){content=adminServicePage({state,account:getAccount(),lang:state.lang,escape,local,number});title=t('reviewServices');}
  else if(r.parts[0]==='plans' && (r.parts.length===1 || (r.parts.length===2 && /^[a-f0-9-]{36}$/.test(r.parts[1])))) {const suggestion=state.plans.suggestion.planId===r.parts[1]?state.plans.suggestion.kind:'saved';content=planningView({items:state.plans.items,plan:currentPlan(),loaded:state.plans.loaded,error:state.plans.error,account:getAccount(),lang:state.lang,escape,selectedSeat:state.plans.seat,scaleMode:state.plans.scaleMode,scalePoints:state.plans.scalePoints,view:r.params.get('view'),taskFilter:r.params.get('filter'),members:state.plans.members,inquiries:state.plans.inquiries,history:state.plans.history.planId===r.parts[1]?state.plans.history:null,suggestion,suggestedLayout:suggestion==='saved'?null:previewLayout(suggestion),picker:state.plans.picker,pickerCategory:state.plans.pickerCategory,inspector:state.plans.inspector,zoom:state.plans.zoom,gridVisible:state.plans.gridVisible,ceremonyMode:state.plans.ceremonyMode,ceremonySeat:state.plans.ceremonySeat,guestSelected:state.plans.guestSelected,seatingGuestPending:state.plans.seatingGuestPending,guestForm:state.plans.guestForm,createModal:state.plans.createModal});title=t('planEvent');}
  else if(r.path==='/compare'){content=compareView(venues.filter(v=>state.compare.includes(v.id)),viewTools());title=t('compareTitle');}
  else if(r.path==='/support' || r.path==='/admin/support'){content=!getAccount() || (r.path==='/admin/support' && !getAccount().isAdmin)?supportView([],r.path==='/admin/support',viewTools()):operationContent(()=>supportView(state.operations.items,r.path==='/admin/support',viewTools()));title=t('support');}
  else if(r.parts[0]==='conversation' && /^[a-f0-9-]{36}$/.test(r.parts[1] || '')){content=operationContent(()=>conversationView(r.parts[1],state.operations.items,state.operations.history,viewTools()));title=t('conversation');}
  else if (r.path === '/admin') {content=adminView({t,escape,local,option,areaName,money,formatTimestamp,account:getAccount(),admin:state.admin,filter:state.adminFilter,busy:state.busy});title=t('adminReview');}
  else if (r.path === '/notifications') {content=notificationsView({t,escape,account:getAccount(),inbox:state.inbox,formatTimestamp});title=t('notifications');}
  else if (['/account/recover','/account/reset','/account/verify','/account/mail-preview'].includes(r.path)) {content=securityView({t,escape,account:getAccount(),path:r.path,params:r.params,security:state.security});title=t('accountTitle');}
  else if (r.parts[0] === 'account') {content=accountView({...accountTools(),register:r.parts[1]==='register',journey:['wedding','conference'].includes(r.params.get('journey'))?r.params.get('journey'):''});title=t('accountTitle');}
  else if (r.parts[0] === 'vendor') {content=vendorPage(r);title=t('vendorDashboard');}
  else if (r.path === '/saved') { content = savedPage(); title = t('saved'); }
  else if (r.path === '/requests') { content = requestsPage(); title = t('requests'); }
  else if (r.path === '/venue-workspace') {content=workspacePage(r.params);title=t('workspace');}
  else if(r.parts[0]==='venues'&&r.parts[2]==='3d'&&r.parts.length===3&&findVenue(r.parts[1])){const venue=findVenue(r.parts[1]);content=venue3dPage(venue);title=t('view3dExample');}
  else if (r.parts.length === 2 && ['venues','request'].includes(r.parts[0]) && findVenue(r.parts[1])) {
    const venue = findVenue(r.parts[1]); title = local(venue.name);
    content = r.parts[0] === 'venues' ? detailPage(venue) : requestPage(venue,r.params);
  } else if (r.parts[0] === 'request-saved' && r.parts.length === 2 && getRequests().some(request => request.id === r.parts[1])) {
    content = successPage(getRequests().find(request => request.id === r.parts[1])); title = t('successTitle');
  } else { content = empty('notFound','notFoundHelp'); title = t('notFound'); }
  document.title = `${title} | Etlamo (اتلموا)`;
  document.body.classList.toggle('planner-mode',content.includes('weddo-workspace'));
  document.body.classList.toggle('planner-modal-active', !!state.plans.createModal);
  const isLanding = r.path === '' || r.path === '/';
  const isDiscover = r.path === '/discover';
  const isVenue3d = (r.parts[0] === 'venues' && r.parts[2] === '3d') || r.path === '/walkthrough' || (r.parts[0] === 'plans' && r.params.get('view') === '3d');
  app.innerHTML = `${header(r.path)}<main id="main" class="container${isLanding ? ' container-landing' : ''}${isDiscover ? ' container-full-hero' : ''}${isVenue3d ? ' container-3d-viewer' : ''}" tabindex="-1">${state.connectionError?`<div class="connection-banner" role="alert">${t('connectionFailed')} <button class="button button-outline" data-action="retry">${t('retry')}</button></div>`:''}${content}</main>${state.compare.length?`
  <aside class="compare-dock" role="region" aria-label="${t('compareTitle')}">
    <span class="compare-dock-count"><bdi>${number(state.compare.length)}/3</bdi> ${t('compareTitle')}</span>
    <a class="compare-dock-cta" href="#/compare">${state.lang==='ar'?'عرض المقارنة':'View Comparison'}</a>
    <button class="compare-dock-clear" type="button" data-action="clear-compare">${state.lang==='ar'?'إفراغ':'Clear'}</button>
  </aside>`:''}${isLanding ? '' : footer()}${cookieBanner()}${rotatingScrollBadge()}`;
  const scene=app.querySelector('.room-3d');
  if(scene){const plan=r.parts[0]==='plans'?currentPlan():null,venue=r.parts[0]==='venues'?findVenue(r.parts[1]):null,suggestion=state.plans.suggestion.planId===plan?.id?state.plans.suggestion.kind:'saved';disposeRoom3D=mountRoom3D(scene,plan&&suggestion!=='saved'&&r.params.get('view')==='3d'?previewLayout(suggestion):plan||previewLayout(conferenceKinds.includes(venue?.kind)?'conference':['garden','courtyard'].includes(venue?.kind)?venue.kind:'wedding'),{lang:state.lang});}
  const hallwayHost=app.querySelector('.hallway-3d-host');
  if(hallwayHost){const signedIn=!!getAccount();disposeHallway3D=mountHallway3D(hallwayHost,{lang:state.lang,onSelectHallway:wing=>{const dest=signedIn?`#/discover?category=${wing}`:`#/account?journey=${wing}`;location.hash=dest;}});}
  const splitHost=app.querySelector('.split-landing-page');
  if(splitHost){
    disposeSplitLanding=mountSplitLanding(splitHost,{
      lang:state.lang,
      onSelect:choice=>{
        const dest=`#/discover?category=${choice}`;
        if (location.hash === dest) {
          state.filters = parseFilters(new URLSearchParams(`category=${choice}`));
          navigate();
        } else {
          location.hash = dest;
        }
      },
      onToggleLanguage:()=>{
        state.lang=state.lang==='ar'?'en':'ar';
        saveLanguage(state.lang);
        render();
      }
    });
  }
  const posterCurlHost = app.querySelector('.poster-page-curl-hero');
  if (posterCurlHost) {
    disposePosterCurl = mountPosterPageCurl(posterCurlHost, {
      lang: state.lang
    });
  }
  const zoomParallaxHost = app.querySelector('.zoom-parallax-container');
  if (zoomParallaxHost) {
    disposeZoomParallax = mountZoomParallax(zoomParallaxHost);
  }
  const footerHost = app.querySelector('.site-footer');
  if (footerHost) {
    disposeFullscreenFooter = mountMeadowRiseFooter(footerHost);
  }
  const datepickerHost = app.querySelector('#request-date-datepicker-wrap');
  if (datepickerHost) {
    const venue = r.parts[0] === 'venues' ? findVenue(r.parts[1]) : (state.draft?.venueId ? findVenue(state.draft.venueId) : null);
    disposeCustomDatePicker = mountCustomDatePicker(datepickerHost, {
      lang: state.lang,
      venue,
      spaceId: state.draft?.spaceId,
      session: state.draft?.session,
      onSelect: () => {
        updateCapacityValidity();
      }
    });
  }
  const searchDatePickerHost = app.querySelector('#date-datepicker-wrap');
  if (searchDatePickerHost) {
    disposeSearchDatePicker = mountCustomDatePicker(searchDatePickerHost, {
      lang: state.lang,
      onSelect: (dateStr) => {
        state.filters.date = dateStr;
      }
    });
  }
  window.__weddo_saved_count = state.saved.length;
  window.__weddo_account = getAccount();
  disposeStaggeredMenu = mountStaggeredMenu({
    lang: state.lang,
    savedCount: state.saved.length,
    account: getAccount()
  });
  if (document.querySelector('#request-guests')) updateCapacityValidity();
  disposeCustomSelects = mountAllCustomSelects(app);
  const circularGalleryMount = app.querySelector('#venue-circular-gallery');
  if (circularGalleryMount) {
    const isAr = state.lang === 'ar';
    const isDark = getTheme() === 'dark';
    const activeCategory = state.filters.category || 'all';
    const galleryVenues = searchVenues(state.filters);
    let galleryItems = [];

    if (activeCategory === 'conference') {
      galleryItems = [
        {
          image: '/public/images/cairo-meeting-house.jpg',
          text: isAr ? 'دار القاهرة للاجتماعات والندوات' : 'Cairo Executive Meeting House',
          description: isAr 
            ? 'وسط البلد · سعة ١٥٠ ضيف · شاشات 4K وإنترنت ألياف · ابتداءً من ١٢٬٠٠٠ ج.م'
            : 'Downtown · Up to 150 guests · 4K projection & high-speed fiber · From EGP 12,000',
          alt: isAr ? 'دار القاهرة للاجتماعات والندوات' : 'Cairo Executive Meeting House',
          id: 'cairo-meeting-house'
        },
        {
          image: '/public/images/summit-ballroom.jpg',
          text: isAr ? 'مركز قمم المؤتمرات الكبرى' : 'Summit Plenary Convention Center',
          description: isAr 
            ? 'الشيخ زايد · سعة ٨٠٠ ضيف · شاشة 8K منحنية وتجهيزات بروتوكول الأمم المتحدة · ابتداءً من ٢٩٠٬٠٠٠ ج.م'
            : 'Sheikh Zayed · Up to 800 guests · 8K curved LED wall & UN protocol · From EGP 290,000',
          alt: isAr ? 'مركز قمم المؤتمرات الكبرى' : 'Summit Plenary Convention Center',
          id: 'summit-ballroom'
        },
        {
          image: '/public/images/conference-portal.jpg',
          text: isAr ? 'قاعة الندوات العامة والدبلوماسية' : 'Diplomatic Seminar & Plenary Hall',
          description: isAr 
            ? 'وسط البلد · دار القاهرة · أجنحة بروتوكولية وترجمة فورية متزامنة'
            : 'Downtown · Cairo House · Diplomatic suites & simultaneous interpretation',
          alt: isAr ? 'قاعة الندوات العامة والدبلوماسية' : 'Diplomatic Seminar & Plenary Hall',
          id: 'cairo-meeting-house'
        },
        {
          image: '/public/images/cairo-meeting-house.jpg',
          text: isAr ? 'قاعة اجتماعات القمة التنفيذية' : 'Executive Summit Boardroom',
          description: isAr 
            ? 'الشيخ زايد · مركز قمم · سعة ٥٠ ضيف لكبار الشخصيات والوفود الدولية'
            : 'Sheikh Zayed · Summit Center · Up to 50 VIP delegates and international missions',
          alt: isAr ? 'قاعة اجتماعات القمة التنفيذية' : 'Executive Summit Boardroom',
          id: 'summit-ballroom'
        },
        {
          image: '/public/images/conference-portal.jpg',
          text: isAr ? 'المدرج الدبلوماسي للمؤتمرات الدولية' : 'International Convention Amphitheater',
          description: isAr 
            ? 'الشيخ زايد · مركز قمم · أسقف خشبية عازلة وهندسة صوتية متقدمة'
            : 'Sheikh Zayed · Summit Center · Acoustic timber wave ceilings & advanced acoustics',
          alt: isAr ? 'المدرج الدبلوماسي للمؤتمرات الدولية' : 'International Convention Amphitheater',
          id: 'summit-ballroom'
        },
        {
          image: '/public/images/cairo-meeting-house.jpg',
          text: isAr ? 'أجنحة الاجتماعات الهجينة وورش العمل' : 'Cairo Hybrid Workshop Suites',
          description: isAr 
            ? 'وسط البلد · دار القاهرة · سعة ٣٠ ضيف · أحدث أنظمة الصوت والمؤتمرات المرئية'
            : 'Downtown · Cairo House · Up to 30 guests · Modern video conferencing & hybrid audio',
          alt: isAr ? 'أجنحة الاجتماعات الهجينة وورش العمل' : 'Cairo Hybrid Workshop Suites',
          id: 'cairo-meeting-house'
        }
      ];
    } else if (activeCategory === 'wedding') {
      galleryItems = [
        {
          image: '/public/images/olive-garden.jpg',
          text: isAr ? 'حدائق الزيتون الملكية' : 'The Olive Garden Estate',
          description: isAr 
            ? 'مدينة نصر · سعة ٢٨٠ ضيف · حدائق زيتون معمرة وأجنحة ملكية · ابتداءً من ١٠٨٬٠٠٠ ج.م'
            : 'Nasr City · Up to 280 guests · Century-old olive groves & royal pavilions · From EGP 108,000',
          alt: isAr ? 'حدائق الزيتون الملكية' : 'The Olive Garden Estate',
          id: 'olive-garden'
        },
        {
          image: '/public/images/nile-salon.jpg',
          text: isAr ? 'قاعة النيل الملكية الكبرى' : 'Nile Royal Waterfront Ballroom',
          description: isAr 
            ? 'جاردن سيتي · سعة ٦٠٠ ضيف · إطلالة بانورامية ساحرة على النيل ومرسى يخوت · ابتداءً من ٧٢٬٠٠٠ ج.م'
            : 'Garden City · Up to 600 guests · Panoramic Nile views & private yacht promenade · From EGP 72,000',
          alt: isAr ? 'قاعة النيل الملكية الكبرى' : 'Nile Royal Waterfront Ballroom',
          id: 'nile-salon'
        },
        {
          image: '/public/images/azure-court.jpg',
          text: isAr ? 'فناء اللازورد والنوافير الملكية' : 'Azure Fountain Court',
          description: isAr 
            ? 'مصر الجديدة · سعة ٢٦٠ ضيف · أعمدة رخامية تاريخية ونوافير متدرجة · ابتداءً من ٩٠٬٠٠٠ ج.م'
            : 'Heliopolis · Up to 260 guests · Marble colonnades & cascading fountains · From EGP 90,000',
          alt: isAr ? 'فناء اللازورد والنوافير الملكية' : 'Azure Fountain Court',
          id: 'azure-court'
        },
        {
          image: '/public/images/pyramids-terrace.jpg',
          text: isAr ? 'شرفة الأهرامات التراثية' : 'Pyramids Heritage Terrace',
          description: isAr 
            ? 'الهرم · سعة ٨٥٠ ضيف · إطلالة مباشرة وغير محجوبة على أهرامات الجيزة · ابتداءً من ٣١٠٬٠٠٠ ج.م'
            : 'Giza Plateau · Up to 850 guests · Uninterrupted panoramic view of Giza Pyramids · From EGP 310,000',
          alt: isAr ? 'شرفة الأهرامات التراثية' : 'Pyramids Heritage Terrace',
          id: 'pyramids-terrace'
        },
        {
          image: '/public/images/hero-estate.jpg',
          text: isAr ? 'صوبة البافيليون الزجاجية' : 'The Glasshouse Pavilion',
          description: isAr 
            ? 'مدينة نصر · حدائق الزيتون · سعة ١٠٠ ضيف · تصميم زجاجي بانورامي مكيف للمناسبات الملكية'
            : 'Nasr City · Olive Estate · Up to 100 guests · Climate-controlled panoramic glasshouse pavilion',
          alt: isAr ? 'صوبة البافيليون الزجاجية' : 'The Glasshouse Pavilion',
          id: 'olive-garden'
        },
        {
          image: '/public/images/celebration-portal.jpg',
          text: isAr ? 'صالون النيل الإمبراطوري الخاص' : 'Royal Nile Imperial Salon',
          description: isAr 
            ? 'جاردن سيتي · قصر النيل · سعة ١٥٠ ضيف · نقوش مذهبة تاريخية ومرسى يخوت ملكي'
            : 'Garden City · Nile Palace · Up to 150 guests · Gilded stucco ceilings & private royal dock',
          alt: isAr ? 'صالون النيل الإمبراطوري الخاص' : 'Royal Nile Imperial Salon',
          id: 'nile-salon'
        }
      ];
    } else {
      galleryItems = galleryVenues.map(venue => {
        const name = isAr ? (venue.name?.ar || venue.name) : (venue.name?.en || venue.name);
        const loc = areaName(venue.area);
        const maxCapacity = capacityOf(venue);
        const price = money(startingPrice(venue));
        const desc = isAr 
          ? `${loc} · سعة ${number(maxCapacity)} ضيف · ابتداءً من ${price}`
          : `${loc} · Up to ${number(maxCapacity)} guests · From ${price}`;
        const imgSrc = venue.media?.[0] ? `/api/media/${venue.media[0]}` : `/public/images/${venue.id}.jpg`;
        return {
          image: imgSrc,
          text: name,
          description: desc,
          alt: name,
          id: venue.id,
          venue
        };
      });

      if (galleryItems.length >= 4) {
        galleryItems.push(
          {
            image: '/public/images/conference-portal.jpg',
            text: isAr ? 'قاعة القمم والمؤتمرات الدولية' : 'International Summit Convention Hall',
            description: isAr 
              ? 'الشيخ زايد · مركز قمم · سعة ٨٠٠ ضيف · شاشة 8K وتجهيزات دبلوماسية كاملة'
              : 'Sheikh Zayed · Summit Center · Up to 800 guests · 8K presentation wall & diplomatic suites',
            alt: isAr ? 'قاعة القمم والمؤتمرات الدولية' : 'International Summit Convention Hall',
            id: 'summit-ballroom'
          },
          {
            image: '/public/images/celebration-portal.jpg',
            text: isAr ? 'بوابة الأفراح والمناسبات الكبرى' : 'Grand Celebrations & Gala Portal',
            description: isAr 
              ? 'القاهرة · أرشيف القصور الملكية التاريخية والمحميات النيلية'
              : 'Cairo · Curated royal palaces, Nile waterfronts & private estates',
            alt: isAr ? 'بوابة الأفراح والمناسبات الكبرى' : 'Grand Celebrations & Gala Portal',
            id: 'nile-salon'
          }
        );
      }
    }

    disposeCircularGallery = mountCircularGallery(circularGalleryMount, {
      items: galleryItems,
      bend: 2.5,
      textColor: isDark ? '#eed8a6' : '#19140b',
      lightTextColor: '#19140b',
      darkTextColor: '#eed8a6',
      borderRadius: 0.05,
      scrollEase: 0.05,
      scrollSpeed: 2,
      shadow: 0.35,
      fadeEdges: 0.12,
      openOnClick: true,
      font: isAr ? 'bold 28px "IBM Plex Sans Arabic", "Amiri", serif' : '600 28px "Cormorant Garamond", "Cinzel", serif',
      fontUrl: 'https://fonts.googleapis.com/css2?family=Amiri:wght@700&family=Cormorant+Garamond:wght@600;700&family=IBM+Plex+Sans+Arabic:wght@600;700&display=swap'
    });
  }
  const faqMount = app.querySelector('#slit-type-faq');
  if (faqMount) {
    disposeSlitTypeFaq = mountSlitTypeFaq(faqMount, {
      lang: state.lang,
      syncHash: false
    });
  }
  if (moveFocus) { document.querySelector('#main')?.focus({ preventScroll: true }); window.scrollTo?.({ top: 0, behavior: 'instant' }); }
  initReactBits(app);
}
let toastTimer;
function toast(key) {
  const node = document.querySelector('#toast'); clearTimeout(toastTimer); node.textContent = t(key); node.hidden = false;
  toastTimer = setTimeout(() => { node.hidden = true; }, 5000);
}
function updateCapacityValidity() {
  const field = document.querySelector('#request-guests');
  const venue = findVenue(state.draft.venueId);
  const capacity = venue.spaces.find(space => space.id === state.draft.spaceId).capacity;
  const invalid = state.draft.guests > capacity;
  const blocked=blockedSlot(venue,state.draft.spaceId,state.draft.date,state.draft.session);
  const dateField=document.querySelector('#request-date');dateField.setCustomValidity(blocked?t('dateBlockedError'):'');document.querySelector('#blocked-error').hidden=!blocked;
  field.setCustomValidity(invalid ? t('guestCapacityError') : '');
  field.setAttribute('aria-invalid', String(invalid));
  document.querySelector('#capacity-error').hidden = !invalid;
}
function readDraft(form) {
  const data = new FormData(form);
  state.draft = { ...state.draft, ...Object.fromEntries(data), guests: data.has('guests') ? Number(data.get('guests')) : state.draft.guests };
}
app.addEventListener('input', event => { const form = event.target.closest('#request-form'); if (form) readDraft(form); });
app.addEventListener('change', async event => {
  if(event.target.id==='planner-ceremony-mode'){state.plans.ceremonyMode=event.target.value;state.plans.ceremonySeat='';render();return;}
  if(event.target.id==='planner-ceremony-guest'){await assignCeremonySeat(event.target.dataset.seat,event.target.value);return;}
  if(event.target.id==='planner-guest-filter'){filterGuestRows();return;}
  if(event.target.id==='planner-csv-import'){
    const plan=currentPlan(),file=event.target.files[0];if(!plan||plan.access==='VIEW'||!file)return;
    try{
      if(file.size>512*1024)throw new Error('CSV too large');
      const guests=parseGuestCsv(await file.text());if(!guests.length||plan.guests.length+guests.length>500)throw new Error('Guest limit');
      await savePlan({...plan,guests:[...plan.guests,...guests]});
    }catch{const warning=document.querySelector('#planner-error');if(warning){warning.textContent=state.lang==='ar'?'تعذر استيراد القائمة. استخدم ملف CSV بعمود Name ولا تتجاوز ٥٠٠ ضيف.':'Could not import the list. Use a CSV with a Name column and up to 500 guests.';warning.hidden=false;}}
    return;
  }
  if(event.target.id==='venue-kind' && !event.target.form?.dataset.id){
    const firstSpace=event.target.form.querySelector('[name="space-kind"]');
    if(firstSpace)firstSpace.value=event.target.value;
    return;
  }
  if(event.target.id==='seat-guest') {
    await assignSeat(event.target.dataset.table,Number(event.target.dataset.index),event.target.value||null);return;
  }
  if(event.target.id==='plan-floor-upload'){
    const plan=currentPlan(),file=event.target.files[0];if(!plan||plan.access==='VIEW'||!file||state.busy)return;
    const status=document.querySelector('#floor-status');
    if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>5*1024*1024){if(status){status.textContent=planningWords(state.lang).floorError;status.hidden=false;}return;}
    state.busy=true;
    try{
      const id=await uploadFloorPlan(plan.id,file);state.busy=false;
      state.plans.scaleMode=false;state.plans.scalePoints=[];
      await savePlan({...plan,floorPlan:{id,points:[{x:100,y:100},{x:200,y:100}],meters:0}});
    }catch{state.busy=false;if(status){status.textContent=planningWords(state.lang).floorError;status.hidden=false;}}
    return;
  }
  if(event.target.id==='provider-category') {
    for(const field of event.target.form.querySelectorAll('.specialty-field')) {const active=field.dataset.category===event.target.value;field.hidden=!active;field.querySelector('select').disabled=!active;}
    return;
  }
  if(event.target.id==='photo-upload' || event.target.id==='provider-photo-upload') {
    const provider=event.target.id==='provider-photo-upload',field=event.target,file=field.files[0],form=field.closest('form'),status=form.querySelector(provider?'#provider-photo-status':'#photo-status'),w=serviceWords(state.lang);
    if(!file || state.busy)return;
    if(form.querySelectorAll('[name="media"]:checked').length>=(provider?3:8)){status.textContent=provider?w.photoLimit:t('photoLimit');field.value='';return;}
    if(!['image/jpeg','image/png','image/webp'].includes(file.type) || file.size>5*1024*1024){status.textContent=provider?w.photoInvalid:t('photoInvalid');field.value='';return;}
    state.busy=true;form.querySelector('[type="submit"]').disabled=true;status.textContent=provider?w.photoUploading:t('photoUploading');
    try {
      const image=await createImageBitmap(file);
      try {
        if(image.width*image.height>40000000)throw new Error();
        const scale=Math.min(1,2400/Math.max(image.width,image.height)),canvas=document.createElement('canvas');
        canvas.width=Math.max(1,Math.round(image.width*scale));canvas.height=Math.max(1,Math.round(image.height*scale));
        const context=canvas.getContext('2d');context.fillStyle='#ffffff';context.fillRect(0,0,canvas.width,canvas.height);context.drawImage(image,0,0,canvas.width,canvas.height);
        const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',.85));
        if(!blob)throw new Error();
        const id=await uploadPhoto(form.dataset.id,blob,provider?'providers':'venues');
        form.querySelector(provider?'#provider-photo-fields':'#photo-fields').insertAdjacentHTML('beforeend',provider?`<label class="photo-choice"><img src="/api/media/${escape(id)}" alt="${w.photos}" width="180" height="120"><span><input type="checkbox" name="media" value="${escape(id)}" checked> ${w.keepPhoto}</span></label>`:photoChoice(id,accountTools()));status.textContent=provider?w.photoUploaded:t('photoUploaded');
      } finally {image.close();}
    } catch {status.textContent=provider?w.photoInvalid:t('photoInvalid');}
    state.busy=false;form.querySelector('[type="submit"]').disabled=false;field.value='';return;
  }
  if(event.target.id==='review-filter'){state.adminFilter=event.target.value;render();document.querySelector('#review-filter')?.focus();return;}
  if(event.target.id==='workspace-venue') {location.hash=`#/${event.target.dataset.owned==='true'?'vendor':'venue-workspace'}?venue=${event.target.value}`;return;}
  if(event.target.classList.contains('response-type')) {
    const form=event.target.closest('form'),offer=event.target.value==='OFFERED';
    form.querySelector('.price-field').hidden=!offer;form.querySelector('[name="price"]').disabled=!offer;
    form.querySelector('.reason-field').hidden=offer;form.querySelector('[name="reason"]').disabled=offer;
    return;
  }
  const form = event.target.closest('#request-form');
  if (!form) return;
  readDraft(form);
  if (event.target.name === 'spaceId') { render(); document.querySelector('#space').focus(); }
  else updateCapacityValidity();
});
function filterGuestRows(){
  const query=document.querySelector('#planner-guest-search')?.value.trim().toLowerCase()||'',filter=document.querySelector('#planner-guest-filter')?.value||'all';
  document.querySelectorAll('.ww-guest-table tbody tr[data-rsvp]').forEach(row=>{row.hidden=!!query&&!row.dataset.search.includes(query)||filter!=='all'&&row.dataset.rsvp!==filter;});
}
app.addEventListener('input',event=>{if(event.target.id==='planner-guest-search')filterGuestRows();});
app.addEventListener('submit', async event => {
  event.preventDefault();
  if(event.target.id==='planner-ceremony-layout'){
    const plan=currentPlan();if(!plan||plan.access==='VIEW')return;
    const data=new FormData(event.target),rows=Number(data.get('rows')),seatsPerSide=Number(data.get('seatsPerSide')),partyLeft=Number(data.get('partyLeft')),partyRight=Number(data.get('partyRight'));
    const valid=key=>{const row=/^(L|R)-(\d+)-(\d+)$/.exec(key);if(row)return Number(row[2])<rows&&Number(row[3])<seatsPerSide;const party=/^(PL|PR)-(\d+)$/.exec(key);return !!party&&Number(party[2])<(party[1]==='PL'?partyLeft:partyRight);};
    const ceremony={rows,seatsPerSide,partyLeft,partyRight,blocked:plan.ceremony.blocked.filter(valid),assignments:Object.fromEntries(Object.entries(plan.ceremony.assignments).filter(([key])=>valid(key)))};
    state.plans.ceremonySeat='';await savePlan({...plan,ceremony});return;
  }
  if(event.target.id==='plan-scale-form'){
    const plan=currentPlan(),meters=Number(new FormData(event.target).get('meters')),points=state.plans.scalePoints;
    if(!plan?.floorPlan||plan.access==='VIEW'||points.length!==2||!Number.isFinite(meters)||meters<0.1||meters>1000||Math.hypot(points[0].x-points[1].x,points[0].y-points[1].y)<2)return;
    if(await savePlan({...plan,floorPlan:{...plan.floorPlan,points,meters}})){state.plans.scaleMode=false;state.plans.scalePoints=[];render();}return;
  }
  if(event.target.id==='provider-filter'){
    location.hash=`#/services?${new URLSearchParams(new FormData(event.target))}`;return;
  }
  if(['provider-form','provider-inquiry-form'].includes(event.target.id)||event.target.classList.contains('provider-review-form')||event.target.classList.contains('provider-reply-form')){
    if(state.busy)return;
    const form=event.target,data=new FormData(form),w=serviceWords(state.lang),warning=form.querySelector('[role="alert"]');
    state.busy=true;
    try{
      if(form.id==='provider-form'){
        const packages=[1,2,3].filter(i=>data.get(`package${i}En`)||data.get(`package${i}Ar`)||data.get(`price${i}`)).map(i=>({id:`package-${i}`,name:{en:data.get(`package${i}En`),ar:data.get(`package${i}Ar`)},price:Number(data.get(`price${i}`))}));
        const input={name:{en:data.get('nameEn'),ar:data.get('nameAr')},description:{en:data.get('descriptionEn'),ar:data.get('descriptionAr')},category:data.get('category'),area:data.get('area'),specialty:data.get('specialty'),packages,media:data.getAll('media')};
        if(form.dataset.id)input.version=Number(form.dataset.version);
        await api(`/api/vendor/providers${form.dataset.id?`/${form.dataset.id}`:''}`,input);
        location.hash='#/vendor/services';
      }else if(form.id==='provider-inquiry-form'){
        await api('/api/provider-inquiries',{providerId:form.dataset.id,packageId:data.get('packageId'),date:data.get('date'),event:data.get('event'),note:data.get('note')||''});
        location.hash='#/services/requests';
      }else if(form.classList.contains('provider-review-form')){
        await api(`/api/admin/providers/${form.dataset.id}/review`,{version:Number(form.dataset.version),decision:event.submitter?.value,note:data.get('note')||''});
      }else{
        await api(`/api/vendor/provider-inquiries/${form.dataset.id}/reply`,{version:Number(form.dataset.version),status:event.submitter?.value,quote:Number(data.get('quote'))});
      }
      state.busy=false;await refreshProviders();render();toast('serviceSaved');
    }catch{state.busy=false;warning.textContent=w.error;warning.hidden=false;}
    return;
  }
  if(event.target.id==='plan-create-form') {
    if(state.busy)return;const form=event.target,input=Object.fromEntries(new FormData(form));state.busy=true;
    try {const plan=(await api('/api/plans',{...input,date:input.date || ''})).plan;state.plans.items.unshift(plan);state.plans.loaded=true;state.plans.createModal=false;state.busy=false;location.hash=`#/plans/${plan.id}?view=seating`;}
    catch(error){state.busy=false;const warning=form.querySelector('[role="alert"]');warning.textContent=error.code==='PLAN_LIMIT'?(state.lang==='ar'?'تقدر تخطط حتى ٢٠ مناسبة.':'You can plan up to 20 events.'):t('connectionFailed');warning.hidden=false;}
    return;
  }
  if(event.target.id==='plan-share-form'||event.target.classList.contains('plan-member-form')){
    const plan=currentPlan(),form=event.target;if(!plan||plan.access!=='OWNER'||state.busy)return;
    const input=Object.fromEntries(new FormData(form));
    if(form.classList.contains('plan-member-form')){input.version=Number(form.dataset.version);input.action=event.submitter?.value||'update';}
    state.busy=true;
    try{state.plans.members={planId:plan.id,items:(await api(`/api/plans/${plan.id}/members${form.dataset.id?`/${form.dataset.id}`:''}`,input)).items};state.busy=false;render();}
    catch{state.busy=false;const warning=document.querySelector('#share-error');if(warning){warning.textContent=state.lang==='ar'?'تعذر تعديل المشاركة. تأكد من البريد والصلاحية.':'Could not update sharing. Check the account email and permission.';warning.hidden=false;}}
    return;
  }
  if(event.target.classList.contains('planner-feature-form')){
    const plan=currentPlan(),form=event.target;if(!plan)return;
    const data=Object.fromEntries(new FormData(form)),item=plan.features.find(feature=>feature.id===form.dataset.id);
    if(!item)return;
    const updated={...item,kind:data.kind,label:data.label.trim(),x:Number(data.x),y:Number(data.y),width:Number(data.width),height:Number(data.height)};
    await savePlan({...plan,features:plan.features.map(feature=>feature.id===item.id?updated:feature)});return;
  }
  if(event.target.id==='plan-inquiry-form'){
    const plan=currentPlan();if(!plan||plan.access!=='OWNER')return;
    const [kind,id]=String(new FormData(event.target).get('inquiry')||'').split(':');
    if(!state.plans.inquiries.options.some(item=>item.kind===kind&&item.id===id))return;
    await savePlan({...plan,links:[...plan.links,{kind,id}]});return;
  }
  if(event.target.id==='plan-date-form'){
    const plan=currentPlan();if(plan)await savePlan({...plan,date:String(new FormData(event.target).get('date')||'')});return;
  }
  if(event.target.id==='plan-guest-form') {
    const plan=currentPlan();if(!plan)return;
    const data=new FormData(event.target),name=String(data.get('name')||'').trim();if(!name)return;
    const fields=Object.fromEntries(['group','email','phone','address','dietary','notes'].map(key=>[key,String(data.get(key)||'').trim()]));
    if(await savePlan({...plan,guests:[...plan.guests,{id:crypto.randomUUID(),name,...fields,rsvp:'pending',meal:String(data.get('meal')||'none')}]})){state.plans.guestForm=false;render();document.querySelector('#guest-name')?.focus();}return;
  }
  if(event.target.classList.contains('plan-guest-edit')) {
    const plan=currentPlan(),form=event.target;if(!plan)return;
    const data=new FormData(form),rsvp=String(data.get('rsvp'));
    const guests=plan.guests.map(g=>{
      if(g.id!==form.dataset.id)return g;
      const details=Object.fromEntries(['email','phone','address','dietary','notes'].map(key=>[key,String(data.get(key)??g[key]).trim()]));
      return {...g,name:String(data.get('name')).trim(),group:String(data.get('group')||'').trim(),rsvp,meal:String(data.get('meal')),...details};
    });
    const tables=rsvp==='no'?plan.tables.map(table=>({...table,assignments:table.assignments.map(id=>id===form.dataset.id?null:id)})):plan.tables;
    const ceremony=rsvp==='no'?{...plan.ceremony,assignments:Object.fromEntries(Object.entries(plan.ceremony.assignments).filter(([,id])=>id!==form.dataset.id))}:plan.ceremony;
    state.plans.seat=null;await savePlan({...plan,guests,tables,ceremony});return;
  }
  if(event.target.id==='plan-budget-form') {
    const plan=currentPlan();if(plan)await savePlan({...plan,budget:Number(new FormData(event.target).get('budget'))});return;
  }
  const planList={ 'plan-expense-form':'expenses','plan-task-form':'tasks','plan-shopping-form':'shopping','plan-schedule-form':'schedule' }[event.target.id];
  if(planList){
    const plan=currentPlan();if(!plan)return;
    const data=new FormData(event.target),item={id:crypto.randomUUID(),title:String(data.get('title')).trim()};
    if(planList==='expenses')Object.assign(item,{amount:Number(data.get('amount')),paid:false,category:String(data.get('category')||'Other'),kind:String(data.get('kind')||'expense'),due:String(data.get('due')||'')});
    if(planList==='tasks')Object.assign(item,{due:String(data.get('due')||''),done:false,category:String(data.get('category')||''),assignee:String(data.get('assignee')||'')});
    if(planList==='shopping')Object.assign(item,{quantity:Number(data.get('quantity')),done:false});
    if(planList==='schedule')Object.assign(item,{date:String(data.get('date')),time:String(data.get('time')),duration:Number(data.get('duration')||30),person:String(data.get('person')||'')});
    await savePlan({...plan,[planList]:[...plan[planList],item]});return;
  }
  if(event.target.classList.contains('planner-table-form')) {
    const plan=currentPlan(),form=event.target;if(!plan)return;
    const input=Object.fromEntries(new FormData(form)),table=plan.tables.find(item=>item.id===form.dataset.id),seats=Number(input.seats);
    if(!table || !Number.isInteger(seats) || seats<2 || seats>20)return;
    const updated={...table,label:input.label.trim(),shape:input.shape,x:Number(input.x),y:Number(input.y),seats,widthInches:Number(input.widthInches),depthInches:Number(input.depthInches),assignments:Array.from({length:seats},(_,index)=>table.assignments[index]||null)};
    state.plans.seat=null;await savePlan({...plan,tables:plan.tables.map(item=>item.id===table.id?updated:item)});return;
  }
  if(['calendar-form','message-form','support-form'].includes(event.target.id) || event.target.classList.contains('support-reply-form')) {
    if(state.busy)return;
    const form=event.target,data=new FormData(form),input=Object.fromEntries(data),warning=form.querySelector('[role="alert"]');
    let path,key;
    if(form.id==='calendar-form') {
      const previous=state.operations.items.find(slot=>slot.spaceId===input.spaceId && slot.date===input.date && slot.session===input.session);
      input.version=previous?.version || 0;input.blocked=input.blocked==='true';
      if(!window.confirm(t('calendarSaveNote')))return;
      path=`/api/vendor/venues/${form.dataset.id}/availability`;key='calendarSaved';
    } else if(form.id==='message-form'){input.nonce=form.dataset.nonce;path=`/api/requests/${form.dataset.id}/messages`;key='messageSent';}
    else if(form.id==='support-form'){path='/api/support';key='supportSent';}
    else {input.version=Number(form.dataset.version);path=`/api/admin/support/${form.dataset.id}`;key='responseSent';}
    state.busy=true;form.querySelectorAll('button').forEach(b=>b.disabled=true);
    try {await api(path,input);await refreshOperations();await refreshRequests();state.busy=false;render();toast(key);}
    catch(error) {
      state.busy=false;
      if(error.code==='CONFLICT'){await refreshOperations();render();toast(form.id==='calendar-form'?'calendarConflict':'supportConflict');}
      else {form.querySelectorAll('button').forEach(b=>b.disabled=false);warning.textContent=t({INVALID_AVAILABILITY:'chooseDate',INVALID_MESSAGE:'messageInvalid',MESSAGE_LIMIT:'messageInvalid',INVALID_TICKET:'ticketInvalid',TICKET_LIMIT:'ticketInvalid'}[error.code] || 'connectionFailed');warning.hidden=false;}
    }
    return;
  }
  if(event.target.classList.contains('security-form')) {
    if(state.busy)return;
    const form=event.target,data=new FormData(form),kind=form.dataset.kind,warning=form.querySelector('[role="alert"]'),button=form.querySelector('button');
    if(kind==='reset' && data.get('password')!==data.get('confirm')){warning.textContent=t('passwordMismatch');warning.hidden=false;return;}
    const input=kind==='recover'?{email:data.get('email')}:{token:route().params.get('token'),...(kind==='reset'?{password:data.get('password')}:{})};
    const path=kind==='recover'?'/api/auth/recovery/request':kind==='verify'?'/api/account/verification/confirm':'/api/auth/recovery/complete';
    state.busy=true;button.disabled=true;
    try {
      await api(path,input);
      if(kind!=='recover'){await initializeConnection();history.replaceState(null,'',`#/account/${kind}`);}
      if(kind==='reset')state.inbox={items:[],loaded:false,error:false};
      state.security.result={path:`/account/${kind}`,key:kind==='recover'?'recoveryPrepared':kind==='verify'?'emailConfirmed':'passwordResetDone'};
      state.busy=false;render();
    } catch(error){state.busy=false;button.disabled=false;const keys={INVALID_LINK:'invalidSecurityLink',INVALID_ACCOUNT:'authInvalid',TOO_MANY_ATTEMPTS:'authLimited'};warning.textContent=t(keys[error.code] || 'connectionFailed');warning.hidden=false;}
    return;
  }
  if(event.target.id==='team-add-form'  || event.target.classList.contains('team-member-form')) {
    if(state.busy)return;
    const form=event.target,data=new FormData(form),adding=form.id==='team-add-form';
    const action=event.submitter?.value;
    if(!adding && !['update','remove'].includes(action))return;
    const input=adding?{email:data.get('email'),permission:data.get('permission')}:{action,permission:data.get('permission'),version:Number(form.dataset.version)};
    state.busy=true;form.querySelectorAll('button').forEach(button=>button.disabled=true);
    try {
      const result=await api(`/api/vendor/venues/${form.dataset.venue}/team${adding?'':`/${form.dataset.member}`}`,input);
      state.team={venueId:form.dataset.venue,members:result.members,loaded:true,error:false};
      state.busy=false;render();toast(adding?'staffAdded':action==='remove'?'staffRemoved':'permissionsSaved');
    } catch(error) {
      state.busy=false;
      if(['CONFLICT','NOT_FOUND'].includes(error.code)){await refreshVendor();await refreshTeam(form.dataset.venue);render();toast('teamConflict');}
      else {form.querySelectorAll('button').forEach(button=>button.disabled=false);const warning=form.querySelector('[role="alert"]');const keys={INVALID_TEAM:'invalidStaff',MEMBER_UNAVAILABLE:'staffUnavailable',MEMBER_EXISTS:'staffExists',TEAM_FULL:'teamFull'};warning.textContent=t(keys[error.code] || 'connectionFailed');warning.hidden=false;}
    }
    return;
  }
  if(event.target.classList.contains('review-form')) {
    if(state.busy)return;
    const form=event.target,data=new FormData(form),decision=event.submitter?.value;
    if(!decision)return;
    const input={decision,version:Number(form.dataset.version),reason:data.get('reason'),note:data.get('note') || ''};
    const warning=form.querySelector('[role="alert"]');
    if(decision==='CHANGES' && input.reason==='OTHER' && !input.note.trim()){warning.textContent=t('reviewNoteRequired');warning.hidden=false;form.querySelector('textarea').focus();return;}
    state.busy=true;form.querySelectorAll('button').forEach(button=>button.disabled=true);
    try {
      await api(`/api/admin/venues/${form.dataset.id}/reviews`,input);
      await refreshRequests();await refreshAdmin();state.busy=false;render();toast(decision==='APPROVED'?'venuePublished':'changesSent');
    } catch(error) {
      state.busy=false;
      if(error.code==='CONFLICT'){await refreshAdmin();render();toast('reviewConflict');}
      else {form.querySelectorAll('button').forEach(button=>button.disabled=false);warning.textContent=t(error.code==='INVALID_REVIEW'?'reviewNoteRequired':error.code==='CAPACITY_CONFLICT'?'reviewCapacityConflict':'connectionFailed');warning.hidden=false;}
    }
    return;
  }
  if(['account-form','venue-form'].includes(event.target.id)) {
    if(state.busy)return;
    const form=event.target,button=form.querySelector('[type="submit"]'),data=new FormData(form),input=Object.fromEntries(data);
    state.busy=true;button.disabled=true;button.textContent=t('sending');
    try {
      if(form.id==='account-form') {
        await changeAccount(form.dataset.mode,input);state.vendor.loaded=false;state.inbox={items:[],loaded:false,error:false};state.security={mail:[],loaded:false,error:false,result:null};
        state.admin.loaded=false;state.saved=getSaved();state.operations={path:'',loaded:false,items:[],history:[]};const journey=route().params.get('journey');location.hash=getAccount()?.isAdmin?'#/admin':getAccount()?.role==='vendor'?'#/vendor':['wedding','conference'].includes(journey)?`#/discover?category=${journey}`:'#/requests';
      } else {
        if(form.dataset.id)input.version=Number(form.dataset.version);
        Object.assign(input,readListing(form));
        await api(`/api/vendor/venues${form.dataset.id?`/${form.dataset.id}`:''}`,input);
        await refreshVendor();location.hash='#/vendor';
      }
      state.busy=false;render();toast(form.id==='account-form'?'signedIn':'submittedVenue');
    } catch(error) {
      state.busy=false;button.disabled=false;button.textContent=t(form.id==='venue-form'?'submitVenue':form.dataset.mode==='register'?'createAccount':'signIn');
      const keys={CONFLICT:'venueEditConflict',INVALID_ACCOUNT:'authInvalid',INVALID_CREDENTIALS:'authFailed',ACCOUNT_UNAVAILABLE:'authUnavailable',TOO_MANY_ATTEMPTS:'authLimited',INVALID_VENUE:'venueInvalid',INQUIRY_DEPENDENCY:'inquiryDependency',INVALID_PHOTO:'photoInvalid'};
      const message=form.querySelector('#account-error');message.textContent=t(keys[error.code] || 'connectionFailed');message.hidden=false;
    }
    return;
  }
  if(event.target.classList.contains('response-form')) {
    if(state.busy)return;
    const form=event.target,data=new FormData(form),button=form.querySelector('[type="submit"]');
    const input={status:data.get('status'),version:Number(form.dataset.version),price:Number(data.get('price')),reason:data.get('reason')};
    state.busy=true;button.disabled=true;button.textContent=t('sending');
    try {if(form.dataset.owned==='true'){await api(`/api/vendor/venues/${form.dataset.venue}/requests/${form.dataset.id}/responses`,input);await refreshVendor();}else await sendDemoResponse(form.dataset.venue,form.dataset.id,input);state.busy=false;render();toast('responseSent');}
    catch(error){state.busy=false;button.disabled=false;button.textContent=t('sendResponse');toast(error.code==='CONFLICT'?'responseConflict':'connectionFailed');}
    return;
  }
  if (event.target.id === 'search-form') {
    const params = new URLSearchParams(new FormData(event.target));
    const next = `#/discover?${params.toString()}`;
    if (location.hash === next) render(); else location.hash = next;
    toast('searchApplied');
  } else if (event.target.id === 'request-form') {
    readDraft(event.target);
    const error = validateRequest(state.draft);
    if (error) { toast(error === 'capacity' ? 'guestCapacityError' : 'chooseDate'); return; }
    state.stage = 'review'; render(); document.querySelector('.form-panel h2').setAttribute('tabindex','-1'); document.querySelector('.form-panel h2').focus();
  }
});
app.addEventListener('click', async event => {
  const button = event.target.closest('[data-action]');
  const link = event.target.closest('a[href^="#/request/"]');
  if (link) { state.draft = null; state.stage = 'details'; }
  if(!button&&state.plans.scaleMode&&state.plans.scalePoints.length<2&&event.target.closest?.('#seating-board')){
    const board=event.target.closest('#seating-board'),point=boardPoint(board,event);
    if(point.x>=0&&point.x<=1000&&point.y>=0&&point.y<=700){state.plans.scalePoints.push({x:Math.round(point.x),y:Math.round(point.y)});render();}
    return;
  }
  if (!button) return;
  const action = button.dataset.action;
  if(action==='toggle-staggered-menu')return;
  if(action==='navigate-staggered'){closeStaggeredMenu(true);return;}
  if(action==='toggle-disc-nav'||action==='toggle-bubble-menu'){sound.pop();state.isMenuOpen=!state.isMenuOpen;animateDiscRevealNav(state.isMenuOpen);return;}
  if(action==='close-disc-nav'||action==='close-bubble-menu'){sound.tap();state.isMenuOpen=false;closeDiscRevealNav();return;}
  if(action==='navigate-disc'||action==='navigate-bubble'){state.isMenuOpen=false;closeDiscRevealNav();return;}
  if(action==='theme'){toggleTheme(event);return;}
  if(action==='clear-compare'){state.compare=[];sound.tap();render();return;}
  if(action==='accept-cookie-consent'){
    sound.tap();
    try { localStorage.setItem('weddo-cookie-consent', 'true'); } catch (e) {}
    document.querySelector('.cookie-banner')?.remove();
    return;
  }
  if(action==='test-preloader'){sound.tap();window.weddoPreloader?.run();return;}
  if(action==='split-toggle-lang'){
    sound.tap();
    state.lang=state.lang==='ar'?'en':'ar';
    saveLanguage(state.lang);
    render();
    return;
  }
  if(action==='filter-category'){
    sound.tap();
    const category=button.dataset.category;
    const currentParams=new URLSearchParams(route().params);
    currentParams.set('category',category);
    const next=`#/discover?${currentParams.toString()}`;
    if(location.hash===next){state.filters.category=category;render();}else{location.hash=next;}
    return;
  }
  if(action==='planner-open-create'){sound.pop();state.plans.createModal=true;render();document.getElementById('plan-name')?.focus();return;}
  if(action==='planner-close-create'){sound.tap();state.plans.createModal=false;render();document.querySelector('[data-action="planner-open-create"]')?.focus();return;}
  if(action==='planner-open-picker'){sound.pop();state.plans.picker=true;state.plans.pickerCategory='rect';render();document.querySelector('.ww-picker-tabs button')?.focus();return;}
  if(action==='planner-close-picker'){state.plans.picker=false;render();document.querySelector('[data-action="planner-open-picker"]')?.focus();return;}
  if(action==='planner-picker-category'){state.plans.pickerCategory=button.dataset.category;render();return;}
  if(action==='planner-show-inspector'){state.plans.inspector=state.plans.inspector===button.dataset.panel?'':button.dataset.panel;render();return;}
  if(action==='planner-close-inspector'){state.plans.inspector='';render();return;}
  if(action==='planner-toggle-grid'){state.plans.gridVisible=!state.plans.gridVisible;document.querySelector('.ww-canvas-surface')?.classList.toggle('ww-no-grid',!state.plans.gridVisible);return;}
  if(['planner-zoom-in','planner-zoom-out','planner-zoom-reset'].includes(action)){
    state.plans.zoom=action==='planner-zoom-reset'?1:Math.max(.5,Math.min(2,state.plans.zoom+(action==='planner-zoom-in'?.25:-.25)));
    const layer=document.querySelector('.ww-canvas-layer');if(layer)layer.style.width=`${Math.round(state.plans.zoom*100)}%`;
    const reset=document.querySelector('[data-action="planner-zoom-reset"]');if(reset)reset.textContent=`${Math.round(state.plans.zoom*100)}%`;return;
  }
  if(action==='planner-pick-table'){
    const plan=currentPlan(),shape=button.dataset.shape,seats=Number(button.dataset.seats),widthInches=Number(button.dataset.width),depthInches=Number(button.dataset.depth);
    if(!plan||plan.access==='VIEW'||plan.tables.length>=80||!['round','rect','long','square','sweetheart','serpentine'].includes(shape))return;
    const count=plan.tables.length+1,table={id:crypto.randomUUID(),label:String(count),shape,x:Math.min(820,160+(count-1)%5*165),y:Math.min(580,160+Math.floor((count-1)/5)*145),seats,widthInches,depthInches,assignments:Array(seats).fill(null)};
    state.plans.picker=false;state.plans.inspector='tables';await savePlan({...plan,tables:[...plan.tables,table]});return;
  }
  if(action==='planner-pick-feature'){
    const plan=currentPlan(),kind=button.dataset.kind;if(!plan||plan.access==='VIEW'||plan.features.length>=30||!['stage','dance','buffet','entrance','aisle','screen'].includes(kind))return;
    const dimensions={stage:[180,80],dance:[160,120],buffet:[150,70],entrance:[110,50],aisle:[70,170],screen:[140,50]},[width,height]=dimensions[kind],count=plan.features.length;
    const item={id:crypto.randomUUID(),kind,label:'',x:Math.min(850,200+(count%4)*180),y:Math.min(580,150+Math.floor(count/4)*120),width,height};
    state.plans.picker=false;state.plans.inspector='tables';await savePlan({...plan,features:[...plan.features,item]});return;
  }
  if(action==='planner-guest-form'){state.plans.guestForm=!state.plans.guestForm;state.plans.guestSelected='';render();document.querySelector('#guest-name')?.focus();return;}
  if(action==='planner-select-guest'){state.plans.guestSelected=button.dataset.id;state.plans.guestForm=false;render();return;}
  if(action==='planner-tap-guest'){
    const gid=button.dataset.guestId;if(!gid)return;
    state.plans.seatingGuestPending=state.plans.seatingGuestPending===gid?'':gid;
    if(state.plans.seatingGuestPending&&window.innerWidth<=800)state.plans.inspector='';
    render();return;
  }
  if(action==='planner-clear-tap-guest'){state.plans.seatingGuestPending='';render();return;}
  if(action==='planner-ceremony-seat'){
    const plan=currentPlan(),key=button.dataset.seat;if(!plan||plan.access==='VIEW')return;
    if(state.plans.ceremonyMode==='block'){
      const blocked=plan.ceremony.blocked.includes(key)?plan.ceremony.blocked.filter(seat=>seat!==key):[...plan.ceremony.blocked,key],assignments={...plan.ceremony.assignments};if(blocked.includes(key))delete assignments[key];
      await savePlan({...plan,ceremony:{...plan.ceremony,blocked,assignments}});
    }else if(!plan.ceremony.blocked.includes(key)){state.plans.ceremonySeat=key;render();document.querySelector('#planner-ceremony-guest')?.focus();}
    return;
  }
  if(action==='select-seat') {
    if(currentPlan()?.access==='VIEW')return;
    if(state.plans.seatingGuestPending){
      const pendingId=state.plans.seatingGuestPending;
      state.plans.seatingGuestPending='';
      await assignSeat(button.dataset.table,Number(button.dataset.index),pendingId);
      return;
    }
    state.plans.seat={tableId:button.dataset.table,index:Number(button.dataset.index)};state.plans.inspector='seat';render();document.querySelector('#seat-guest')?.focus();return;
  }
  if(action==='planner-scale'){
    state.plans.scaleMode=!state.plans.scaleMode;state.plans.scalePoints=[];render();return;
  }
  if(action==='planner-remove-floor'){
    const plan=currentPlan();if(plan?.access!=='VIEW'&&plan?.floorPlan){state.plans.scaleMode=false;state.plans.scalePoints=[];await savePlan({...plan,floorPlan:null});}return;
  }
  if(action==='planner-copy-presentation'){
    const plan=currentPlan(),status=document.querySelector('#presentation-link-status');
    if(!plan||plan.access!=='OWNER'||!status)return;
    try{await navigator.clipboard.writeText(new URL(`#/plans/${plan.id}?view=presentation`,location.href).href);status.textContent=planningWords(state.lang).copiedPresentation;}
    catch{status.textContent=planningWords(state.lang).copyFailed;}
    return;
  }
  if(action==='planner-print'){window.print();return;}
  if(action==='planner-csv'){
    const plan=currentPlan();if(!plan)return;
    const seatOf=new Map(plan.tables.flatMap(table=>table.assignments.map((id,index)=>id?[id,[table.label,index+1]]:null).filter(Boolean)));
    const safe=value=>{const text=String(value??'').replace(/^[\s]*[=+\-@]/,'\u0027$&');return `"${text.replaceAll('"','""')}"`;};
    const rows=[['Name','Group','RSVP','Meal','Table','Seat'],...plan.guests.map(guest=>[guest.name,guest.group,guest.rsvp,guest.meal,...(seatOf.get(guest.id)||['',''])])];
    const url=URL.createObjectURL(new Blob(['\ufeff'+rows.map(row=>row.map(safe).join(',')).join('\r\n')],{type:'text/csv;charset=utf-8'}));
    const link=document.createElement('a');link.href=url;link.download=`${plan.name.replace(/[^a-z0-9_-]+/gi,'-')||'weddo'}-guests.csv`;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);return;
  }
  if(action==='planner-undo'||action==='planner-redo'){
    const plan=currentPlan();if(!plan||plan.access==='VIEW')return;
    const history=planHistory(plan.id),mode=action==='planner-undo'?'undo':'redo',snapshot=history[mode].at(-1);
    if(snapshot)await savePlan({...plan,...snapshot},mode);return;
  }
  if(action==='planner-suggestion'){
    const plan=currentPlan(),kind=button.dataset.suggestion;
    if(!plan||!['saved','wedding','conference','mixed'].includes(kind))return;
    state.plans.suggestion={planId:plan.id,kind};render();return;
  }
  if(action==='planner-template'){
    const plan=currentPlan(),kind=button.dataset.template;
    if(!plan||plan.tables.length||plan.access==='VIEW'||!['wedding','conference','mixed'].includes(kind))return;
    const idea=previewLayout(kind),tables=idea.tables.map(table=>({...table,id:crypto.randomUUID()}));
    const features=plan.features.length?plan.features:idea.features.map(feature=>({...feature,id:crypto.randomUUID(),label:''}));
    if(await savePlan({...plan,tables,features})&&route().params.get('view')==='3d')location.hash=`#/plans/${plan.id}?view=seating`;
    return;
  }
  if(action==='planner-add-feature'){
    const plan=currentPlan(),kind=document.querySelector('#feature-kind')?.value;
    if(!plan||plan.features.length>=30||!['stage','dance','buffet','entrance','aisle','screen'].includes(kind))return;
    const dimensions={stage:[180,80],dance:[160,120],buffet:[150,70],entrance:[110,50],aisle:[70,170],screen:[140,50]};
    const [width,height]=dimensions[kind],count=plan.features.length;
    const item={id:crypto.randomUUID(),kind,label:'',x:Math.min(850,200+(count%4)*180),y:Math.min(580,150+Math.floor(count/4)*120),width,height};
    await savePlan({...plan,features:[...plan.features,item]});return;
  }
  if(action==='planner-remove-feature'){
    const plan=currentPlan();if(plan)await savePlan({...plan,features:plan.features.filter(item=>item.id!==button.dataset.id)});return;
  }
  if(action==='planner-unlink-inquiry'){
    const plan=currentPlan();if(plan?.access==='OWNER')await savePlan({...plan,links:plan.links.filter(link=>link.kind!==button.dataset.kind||link.id!==button.dataset.id)});return;
  }
  if(action==='planner-refresh-inquiries'){
    const plan=currentPlan();if(plan){await refreshPlanInquiries(plan.id);render();}return;
  }
  if(action==='planner-starter'){
    const plan=currentPlan();if(!plan||plan.access==='VIEW')return;
    const preset=starterLists[state.lang][plan.type];
    const tasks=plan.tasks.length?plan.tasks:preset.tasks.map(title=>({id:crypto.randomUUID(),title,due:'',done:false}));
    const shopping=plan.shopping.length?plan.shopping:preset.shopping.map(title=>({id:crypto.randomUUID(),title,quantity:1,done:false}));
    const schedule=plan.schedule.length||!plan.date?plan.schedule:preset.schedule.map(([time,title])=>({id:crypto.randomUUID(),title,date:plan.date,time}));
    if(tasks!==plan.tasks||shopping!==plan.shopping||schedule!==plan.schedule)await savePlan({...plan,tasks,shopping,schedule});return;
  }
  if(action==='planner-add-table') {
    const plan=currentPlan();if(!plan || plan.tables.length>=80)return;
    const count=plan.tables.length+1,table={id:crypto.randomUUID(),label:String(count),shape:'round',x:Math.min(870,160+(count-1)%5*165),y:Math.min(580,160+Math.floor((count-1)/5)*145),seats:8,assignments:Array(8).fill(null)};
    await savePlan({...plan,tables:[...plan.tables,table]});return;
  }
  if(action==='planner-remove-table' || action==='planner-remove-guest') {
    const plan=currentPlan();if(!plan)return;
    if(action==='planner-remove-table'){state.plans.seat=null;await savePlan({...plan,tables:plan.tables.filter(item=>item.id!==button.dataset.id)});}
    else {state.plans.guestSelected='';await savePlan({...plan,guests:plan.guests.filter(item=>item.id!==button.dataset.id),tables:plan.tables.map(table=>({...table,assignments:table.assignments.map(id=>id===button.dataset.id?null:id)})),ceremony:{...plan.ceremony,assignments:Object.fromEntries(Object.entries(plan.ceremony.assignments).filter(([,id])=>id!==button.dataset.id))}});}
    return;
  }
  if(action==='planner-toggle-item' || action==='planner-remove-item'){
    const plan=currentPlan(),kind=button.dataset.kind;
    if(!plan||!['expenses','tasks','shopping','schedule'].includes(kind))return;
    const key=kind==='expenses'?'paid':'done';
    const items=action==='planner-remove-item'?plan[kind].filter(item=>item.id!==button.dataset.id):plan[kind].map(item=>item.id===button.dataset.id?{...item,[key]:!item[key]}:item);
    await savePlan({...plan,[kind]:items});return;
  }
  if(action==='compare') {
    const id=button.dataset.id;
    if(state.compare.includes(id)){state.compare=state.compare.filter(value=>value!==id);sound.tap();}
    else {if(state.compare.length>=3){toast('compareLimit');return;}state.compare.push(id);sound.success();}
    render();document.querySelector(`[data-action="compare"][data-id="${id}"]`)?.focus();return;
  }
  if(action==='add-space' || action==='add-package') {
    const kind=action==='add-space'?'space':'package',container=document.querySelector(`#${kind}-fields`);
    if(container.children.length>=8){toast('rowLimit');return;}
    const item={id:`${kind}-${crypto.randomUUID()}`,name:{en:'',ar:''},capacity:100,includes:['spaceHire']};
    const tools={...accountTools(),venue:{kind:document.querySelector('#venue-kind')?.value}};
    container.insertAdjacentHTML('beforeend',kind==='space'?spaceFields(item,tools):packageFields(item,tools));container.lastElementChild.querySelector('input').focus();return;
  }
  if(action==='remove-row') {
    const row=button.closest('.catalog-row');
    if(row.parentElement.children.length===1){toast('rowLimit');return;}
    const parent=row.parentElement;row.remove();parent.querySelector('input')?.focus();return;
  }
  if(action==='request-verification' || action==='read-notification') {
    if(state.busy)return;state.busy=true;button.disabled=true;
    try {
      if(action==='request-verification'){await api('/api/account/verification/request',{});state.security.loaded=false;location.hash='#/account/mail-preview';}
      else {await api('/api/notifications/read',{id:button.dataset.id});await refreshInbox();}
      state.busy=false;render();
    } catch(error){state.busy=false;button.disabled=false;toast(error.code==='TOO_MANY_ATTEMPTS'?'authLimited':'connectionFailed');}
    return;
  }
  if(action==='logout') {
    if(state.busy)return;state.busy=true;
    try {await changeAccount('logout');state.vendor={venues:[],requests:[],loaded:false,error:false};state.admin={venues:[],loaded:false,error:false};state.team={venueId:'',members:[],loaded:false,error:false};state.inbox={items:[],loaded:false,error:false};state.security={mail:[],loaded:false,error:false,result:null};state.draft=null;state.stage='details';state.saved=getSaved();state.operations={path:'',loaded:false,items:[],history:[]};location.hash='#/account';state.busy=false;render();toast('signedOut');}
    catch {state.busy=false;toast('connectionFailed');}
    return;
  }
  if (action === 'language') {
    sound.tap();
    const formChoices=[...document.forms].map(form=>[...form.elements].filter(field=>field.matches('input:not([type="file"]),select,textarea')).map(field=>({value:field.value,checked:field.checked})));
    const listing=document.querySelector('#venue-form'),listingInput=listing?readListing(listing):null;
    const listingDraft=listingInput?{...listingInput,id:listing.dataset.id,version:Number(listing.dataset.version),name:{en:listingInput.nameEn,ar:listingInput.nameAr},description:{en:listingInput.descriptionEn,ar:listingInput.descriptionAr},media:[...listing.querySelectorAll('[name="media"]')].map(field=>field.value)}:null;
    const search = document.querySelector('#search-form');
    if (search) state.filters = parseFilters(new URLSearchParams(new FormData(search)));
    state.lang = state.lang === 'ar' ? 'en' : 'ar'; saveLanguage(state.lang);
    // Keep unsubmitted search choices while switching language.
    const filters = { ...state.filters }; render();
    if(listingDraft)document.querySelector('#venue-form').outerHTML=venueForm({...accountTools(),venue:listingDraft});
    [...document.forms].forEach((form,index)=>[...form.elements].filter(field=>field.matches('input:not([type="file"]),select,textarea')).forEach((field,position)=>{const previous=formChoices[index]?.[position];if(previous){field.value=previous.value;if(['checkbox','radio'].includes(field.type))field.checked=previous.checked;}}));
    if (search) for (const [name,value] of Object.entries(filters)) document.querySelector(`#search-form [name="${name}"]`).value = value;
    document.querySelector('.language').focus();
  } else if (action === 'save') {
    const search = document.querySelector('#search-form');
    const choices = search ? Object.fromEntries(new FormData(search)) : null;
    const id = button.dataset.id;
    const next = state.saved.includes(id) ? state.saved.filter(value => value !== id) : [...state.saved,id];
    if (next.includes(id)) sound.success(); else sound.tap();
    if (state.busy)return;state.busy=true;button.disabled=true;
    const savedOk=await saveSaved(next);state.busy=false;
    if (!savedOk) {button.disabled=false;toast('storageError');return;}
    state.saved = next; render(); toast(next.includes(id) ? 'venueSaved' : 'venueRemoved');
    if (choices) for (const [name,value] of Object.entries(choices)) document.querySelector(`#search-form [name="${name}"]`).value = value;
    document.querySelector(`[data-action="save"][data-id="${id}"]`)?.focus({ preventScroll: true });
  } else if (action === 'reset') {
    sound.tap();
    if (route().path === '/discover' && !route().params.size) render(); else location.hash = '#/discover';
  } else if (action === 'edit-request') {
    state.stage = 'details'; render(); document.querySelector('#event').focus();
  } else if (action === 'save-request') {
    if(state.busy)return;
    state.busy=true;button.disabled=true;button.textContent=t('sending');
    const result = await saveRequest(state.draft);
    state.busy=false;
    if (!result.ok) {button.disabled=false;button.textContent=t('saveRequest');toast(result.error === 'space' ? 'spacePaused' : result.error === 'blocked' ? 'dateBlockedError' : result.error === 'connection' ? 'connectionFailed' : result.error === 'capacity' ? 'guestCapacityError' : 'chooseDate'); return; }
    sound.success();
    location.hash = `#/request-saved/${result.request.id}`;
    if (result.duplicate) toast('duplicate');
    state.draft = null;
  } else if(action==='refresh' || action==='retry') {
    if(state.busy)return;state.busy=true;button.disabled=true;
    try {if(action==='retry' || !isConnected())await initializeConnection();else await refreshRequests();state.connectionError=false;if(route().parts[0]==='vendor'){await refreshVendor();if(route().parts[1]==='team')await refreshTeam(route().parts[2]);}if(route().path==='/admin')await refreshAdmin();if(route().path==='/notifications')await refreshInbox();if(route().path==='/account/mail-preview')await refreshMail();await refreshOperations();state.saved=getSaved();}
    catch {state.connectionError=true;}
    state.busy=false;render();
  }
});
let tableDrag=null;
function boardPoint(board,event){const point=board.createSVGPoint();point.x=event.clientX;point.y=event.clientY;return point.matrixTransform(board.getScreenCTM().inverse());}
function boardMargin(item,axis){return item.widthInches?Math.min(axis==='x'?180:110,Math.max(55,Math.round((axis==='x'?item.widthInches:item.depthInches)*.675+25))):55;}
app.addEventListener('dragstart',event=>{
  const guest=event.target.closest?.('[data-guest-id]');
  if(guest){event.dataTransfer.effectAllowed='move';event.dataTransfer.setData('text/plain',guest.dataset.guestId);}
});
app.addEventListener('dragover',event=>{if(event.target.closest?.('.planner-seat'))event.preventDefault();});
app.addEventListener('drop',async event=>{
  const seat=event.target.closest?.('.planner-seat');if(!seat)return;
  event.preventDefault();await assignSeat(seat.dataset.table,Number(seat.dataset.index),event.dataTransfer.getData('text/plain'));
});
app.addEventListener('pointerdown',event=>{
  const body=event.target.closest?.('.planner-table-body,.planner-feature-body'),board=body?.closest('#seating-board'),plan=currentPlan();
  if(!board || !plan || plan.access==='VIEW'||state.busy||state.plans.scaleMode)return;
  const kind=body.classList.contains('planner-feature-body')?'features':'tables',group=body.closest(kind==='features'?'.planner-feature':'.planner-table');
  const item=plan[kind].find(value=>value.id===group.dataset[kind==='features'?'featureId':'tableId']),start=boardPoint(board,event);
  if(!item)return;
  tableDrag={board,group,kind,item,start,originX:item.x,originY:item.y,x:item.x,y:item.y,pointerId:event.pointerId};
  board.setPointerCapture(event.pointerId);
});
app.addEventListener('pointermove',event=>{
  if(!tableDrag || event.pointerId!==tableDrag.pointerId)return;
  const point=boardPoint(tableDrag.board,event);
  const marginX=tableDrag.kind==='features'?tableDrag.item.width/2:boardMargin(tableDrag.item,'x'),marginY=tableDrag.kind==='features'?tableDrag.item.height/2:boardMargin(tableDrag.item,'y');
  tableDrag.x=Math.max(marginX,Math.min(1000-marginX,Math.round(tableDrag.originX+point.x-tableDrag.start.x)));
  tableDrag.y=Math.max(marginY,Math.min(700-marginY,Math.round(tableDrag.originY+point.y-tableDrag.start.y)));
  tableDrag.group.setAttribute('transform',`translate(${tableDrag.x} ${tableDrag.y})`);
});
app.addEventListener('pointerup',async event=>{
  if(!tableDrag || event.pointerId!==tableDrag.pointerId)return;
  const drag=tableDrag;tableDrag=null;
  if(drag.x===drag.originX && drag.y===drag.originY)return;
  const plan=currentPlan();if(!plan)return;
  await savePlan({...plan,[drag.kind]:plan[drag.kind].map(item=>item.id===drag.item.id?{...item,x:drag.x,y:drag.y}:item)});
});
app.addEventListener('pointercancel',event=>{if(tableDrag?.pointerId===event.pointerId){tableDrag=null;render();}});
app.addEventListener('keydown',async event=>{
  if(event.key==='Escape'&&isExpandableScreenOpen()){closeExpandableScreen();return;}
  if(event.key==='Escape'&&route().parts[0]==='request'&&route().parts[1]){location.hash=`#/venues/${route().parts[1]}`;return;}
  if(event.key==='Escape'){closeStaggeredMenu();}
  if(event.key==='Escape'&&state.isMenuOpen){state.isMenuOpen=false;closeDiscRevealNav();closeBubbleMenu();document.querySelector('[data-action="toggle-disc-nav"],[data-action="toggle-bubble-menu"]')?.focus();return;}
  if(event.key==='Escape'&&state.plans.picker){state.plans.picker=false;render();document.querySelector('[data-action="planner-open-picker"]')?.focus();return;}
  if(event.key==='Escape'&&state.plans.createModal){state.plans.createModal=false;render();document.querySelector('[data-action="planner-open-create"]')?.focus();return;}
  if((event.key==='Enter' || event.key===' ') && event.target.matches?.('.planner-seat,[data-action="planner-tap-guest"]')){event.preventDefault();event.target.dispatchEvent(new MouseEvent('click',{bubbles:true}));return;}
  if(!['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(event.key) || !event.target.matches?.('.planner-table,.planner-feature'))return;
  const plan=currentPlan();if(!plan||plan.access==='VIEW')return;
  event.preventDefault();const delta={ArrowUp:[0,-10],ArrowDown:[0,10],ArrowLeft:[-10,0],ArrowRight:[10,0]}[event.key];
  const kind=event.target.classList.contains('planner-feature')?'features':'tables',id=event.target.dataset[kind==='features'?'featureId':'tableId'];
  await savePlan({...plan,[kind]:plan[kind].map(item=>item.id===id?{...item,x:Math.max(kind==='features'?item.width/2:55,Math.min(1000-(kind==='features'?item.width/2:55),item.x+delta[0])),y:Math.max(kind==='features'?item.height/2:55,Math.min(700-(kind==='features'?item.height/2:55),item.y+delta[1]))}:item)});
});
window.addEventListener('hashchange', ()=>{closeStaggeredMenu(true);document.body.classList.remove('footer-focused', 'footer-ground-active');document.documentElement.classList.remove('footer-ground-active');state.isMenuOpen=false;state.security.result=null;state.plans.scaleMode=false;state.plans.scalePoints=[];state.plans.seatingGuestPending='';navigate();});
window.addEventListener('popstate', ()=>{closeStaggeredMenu(true);document.body.classList.remove('footer-focused', 'footer-ground-active');document.documentElement.classList.remove('footer-ground-active');state.isMenuOpen=false;});
window.addEventListener('storage', event => { if (!event.key || event.key.startsWith('weddo.')) { state.saved = getSaved(); render(); } });
const preloader = initPreloader({ duration: 1600 });
app.innerHTML=`<main class="container" role="status">${t('loading')}</main>`;
try {await initializeConnection();} catch {state.connectionError=true;}
state.saved=getSaved();
await navigate();
preloader.setProgress(100);
