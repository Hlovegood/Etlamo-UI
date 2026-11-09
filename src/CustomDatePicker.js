// ==========================================================================
// WEDDO Custom Royal Calendar & DatePicker Engine
// Sovereign bespoke date-picker popup for luxury palace bookings
// Matches the Apollo design system: Terracotta Ember, Warm Linen & Frosted Glass
// ==========================================================================

import { today, blockedSlot } from './domain.js';

/**
 * Format a YYYY-MM-DD string into localized human-readable date.
 */
export function formatCalendarDate(dateString, lang = 'ar') {
  if (!dateString || typeof dateString !== 'string') return '';
  try {
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day, 12, 0, 0);
    return new Intl.DateTimeFormat(lang === 'ar' ? 'ar-EG' : 'en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(date);
  } catch (_) {
    return dateString;
  }
}

/**
 * Renders the custom DatePicker trigger & popover host markup.
 */
export function renderCustomDatePicker({
  id = 'request-date',
  name = 'date',
  value = '',
  min = '',
  required = true,
  lang = 'ar',
  placeholder = '',
  venueId = '',
} = {}) {
  const isAr = lang === 'ar';
  const displayPlaceholder = placeholder || (isAr ? 'اختر تاريخ الفعالية الملكية...' : 'Select royal event date...');
  const formattedDisplay = value ? formatCalendarDate(value, lang) : '';
  const minDate = min || today();

  return `
    <div 
      class="custom-datepicker-wrap" 
      id="${id}-datepicker-wrap" 
      data-datepicker-wrap="true" 
      data-min="${minDate}" 
      data-value="${value || ''}" 
      data-venue-id="${venueId || ''}"
      data-placeholder="${displayPlaceholder}"
      data-required="${required ? 'true' : 'false'}"
    >
      <div 
        class="custom-datepicker-trigger ${value ? 'has-value' : ''}" 
        id="${id}-trigger" 
        tabindex="0" 
        role="combobox" 
        aria-haspopup="dialog" 
        aria-expanded="false" 
        aria-controls="${id}-popup" 
        aria-label="${isAr ? 'تاريخ الحجز' : 'Booking date'}"
      >
        <span class="custom-datepicker-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="5" width="18" height="16" rx="3"/>
            <path d="M3 10h18M7 3v4m10-4v4"/>
          </svg>
        </span>
        <span class="custom-datepicker-label" id="${id}-display">
          ${formattedDisplay || `<span class="custom-datepicker-placeholder">${displayPlaceholder}</span>`}
        </span>
        <span class="custom-datepicker-chevron" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
            <path d="m6 9 6 6 6-6"/>
          </svg>
        </span>
      </div>

      <input 
        id="${id}" 
        type="text" 
        name="${name}" 
        min="${minDate}" 
        value="${value || ''}" 
        ${required ? 'required' : ''} 
        class="custom-datepicker-native-input" 
        tabindex="-1" 
        aria-hidden="true"
        readonly
      >

      <!-- Royal Themed Calendar Popup Window -->
      <div 
        class="custom-calendar-popup" 
        id="${id}-popup" 
        role="dialog" 
        aria-modal="true" 
        aria-label="${isAr ? 'تقويم مواعيد الحجوزات الملكية' : 'Royal Booking Calendar'}" 
        hidden
      >
        <!-- Popover DOM dynamically rendered and updated by mountCustomDatePicker -->
      </div>
    </div>
  `;
}

/**
 * Mounts the custom interactive calendar popover.
 */
export function mountCustomDatePicker(rootElement, options = {}) {
  const wrap = rootElement || document.querySelector('[data-datepicker-wrap="true"]');
  if (!wrap) return () => {};

  const input = wrap.querySelector('.custom-datepicker-native-input');
  const trigger = wrap.querySelector('.custom-datepicker-trigger');
  const display = wrap.querySelector('.custom-datepicker-label');
  const popup = wrap.querySelector('.custom-calendar-popup');
  if (!input || !trigger || !popup) return () => {};

  const lang = options.lang || (document.documentElement.lang === 'ar' ? 'ar' : 'en');
  const isAr = lang === 'ar';
  const minDate = wrap.dataset.min || today();
  const venue = options.venue || null;

  // Selected date parsed into state
  let selectedDate = input.value || '';
  
  // View Month and Year
  let viewYear, viewMonth;
  if (selectedDate && /^\d{4}-\d{2}-\d{2}$/.test(selectedDate)) {
    const [y, m] = selectedDate.split('-').map(Number);
    viewYear = y;
    viewMonth = m - 1;
  } else {
    const [y, m] = minDate.split('-').map(Number);
    viewYear = y;
    viewMonth = m - 1;
  }

  let isOpen = false;

  // Month Names & Weekdays
  const weekdaysAr = ['أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'];
  const weekdaysEn = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  const weekdays = isAr ? weekdaysAr : weekdaysEn;

  function renderCalendarGrid() {
    const todayStr = today();
    const firstDayIndex = new Date(viewYear, viewMonth, 1).getDay();
    const daysInCurrentMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

    // Localized Month/Year Header
    const monthHeader = new Intl.DateTimeFormat(isAr ? 'ar-EG' : 'en-US', {
      month: 'long',
      year: 'numeric',
    }).format(new Date(viewYear, viewMonth, 1));

    // Determine if previous month is navigable (cannot go before minDate's month)
    const [minY, minM] = minDate.split('-').map(Number);
    const isPrevDisabled = viewYear < minY || (viewYear === minY && viewMonth <= minM - 1);

    // Build days
    let daysHtml = '';

    // Leading days from previous month
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const dayNum = daysInPrevMonth - i;
      daysHtml += `<div class="custom-cal-day is-outside" aria-hidden="true">${isAr ? Number(dayNum).toLocaleString('ar-EG') : dayNum}</div>`;
    }

    // Days in current month
    for (let d = 1; d <= daysInCurrentMonth; d++) {
      const monthStr = String(viewMonth + 1).padStart(2, '0');
      const dayStr = String(d).padStart(2, '0');
      const fullDate = `${viewYear}-${monthStr}-${dayStr}`;

      const isPast = fullDate < minDate;
      const isToday = fullDate === todayStr;
      const isSelected = fullDate === selectedDate;

      // Check if blocked in venue availability
      let isBlocked = false;
      if (venue && options.spaceId) {
        isBlocked = blockedSlot(venue, options.spaceId, fullDate, options.session || 'evening');
      }

      const classes = [
        'custom-cal-day',
        isPast ? 'is-disabled' : '',
        isToday ? 'is-today' : '',
        isSelected ? 'is-selected' : '',
        isBlocked ? 'is-blocked' : '',
      ].filter(Boolean).join(' ');

      const dayNumberDisplay = isAr ? Number(d).toLocaleString('ar-EG') : d;
      const ariaLabel = `${formatCalendarDate(fullDate, lang)}${isBlocked ? (isAr ? ' (محجوز)' : ' (Reserved)') : ''}`;

      daysHtml += `
        <button 
          type="button" 
          class="${classes}" 
          data-date="${fullDate}" 
          ${isPast ? 'disabled aria-disabled="true"' : ''}
          aria-label="${ariaLabel}"
          aria-pressed="${isSelected}"
        >
          <span class="custom-cal-day-num">${dayNumberDisplay}</span>
          ${isToday ? '<span class="custom-cal-today-dot" aria-hidden="true"></span>' : ''}
          ${isBlocked ? '<span class="custom-cal-blocked-badge" aria-hidden="true"></span>' : ''}
        </button>
      `;
    }

    // Trailing days to fill 35 or 42 grid slots
    const totalSlots = firstDayIndex + daysInCurrentMonth;
    const remainingSlots = (totalSlots % 7 === 0) ? 0 : 7 - (totalSlots % 7);
    for (let i = 1; i <= remainingSlots; i++) {
      daysHtml += `<div class="custom-cal-day is-outside" aria-hidden="true">${isAr ? Number(i).toLocaleString('ar-EG') : i}</div>`;
    }

    popup.innerHTML = `
      <div class="custom-cal-container" dir="${isAr ? 'rtl' : 'ltr'}">
        <!-- Calendar Ambient Vignette Glow -->
        <div class="custom-cal-ambient" aria-hidden="true"></div>

        <!-- Header: Month Navigator -->
        <div class="custom-cal-header">
          <div class="custom-cal-title-wrap">
            <span class="custom-cal-kicker">${isAr ? 'الحجز الملكي المباشر' : 'ROYAL RESERVATION DESK'}</span>
            <h3 class="custom-cal-month-title">${monthHeader}</h3>
          </div>
          <div class="custom-cal-nav-group">
            <button 
              type="button" 
              class="custom-cal-nav-btn custom-cal-prev-btn" 
              data-nav="prev" 
              ${isPrevDisabled ? 'disabled aria-disabled="true"' : ''}
              aria-label="${isAr ? 'الشهر السابق' : 'Previous Month'}"
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">
                <path d="${isAr ? 'm9 18 6-6-6-6' : 'm15 18-6-6 6-6'}"/>
              </svg>
            </button>
            <button 
              type="button" 
              class="custom-cal-nav-btn custom-cal-next-btn" 
              data-nav="next" 
              aria-label="${isAr ? 'الشهر القادم' : 'Next Month'}"
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">
                <path d="${isAr ? 'm15 18-6-6 6-6' : 'm9 18 6-6-6-6'}"/>
              </svg>
            </button>
          </div>
        </div>

        <!-- Weekday Headers -->
        <div class="custom-cal-weekdays">
          ${weekdays.map(w => `<span class="custom-cal-weekday">${w}</span>`).join('')}
        </div>

        <!-- Days Grid -->
        <div class="custom-cal-grid" role="grid">
          ${daysHtml}
        </div>

        <!-- Footer Bar: Quick Shortcuts & Live Status Indicator -->
        <div class="custom-cal-footer">
          <div class="custom-cal-status-pill">
            <span class="custom-cal-pulse-dot" aria-hidden="true"></span>
            <span>${isAr ? 'مواعيد القصور محدثة لحظياً' : 'Live Palace Calendar'}</span>
          </div>
          <div class="custom-cal-actions">
            ${selectedDate || wrap.dataset.required === 'false' ? `
              <button type="button" class="custom-cal-clear-action" data-action="clear">
                ${isAr ? 'مسح' : 'Clear'}
              </button>
            ` : ''}
            <button type="button" class="custom-cal-today-action" data-action="today">
              ${isAr ? 'اليوم' : 'Today'}
            </button>
            <button type="button" class="custom-cal-close-action" data-action="close">
              ${isAr ? 'إغلاق' : 'Close'}
            </button>
          </div>
        </div>
      </div>
    `;
  }

  function openPopup() {
    if (isOpen) return;
    document.dispatchEvent(new CustomEvent('custom-menu-opened', { detail: { trigger } }));
    renderCalendarGrid();
    popup.hidden = false;
    trigger.setAttribute('aria-expanded', 'true');
    trigger.classList.add('is-open');
    isOpen = true;

    // Focus selected day or first available day
    requestAnimationFrame(() => {
      const activeBtn = popup.querySelector('.custom-cal-day.is-selected') || 
                        popup.querySelector('.custom-cal-day.is-today:not([disabled])') ||
                        popup.querySelector('.custom-cal-day:not([disabled]):not(.is-outside)');
      if (activeBtn) activeBtn.focus();
    });
  }

  function closePopup(returnFocus = true) {
    if (!isOpen) return;
    popup.hidden = true;
    trigger.setAttribute('aria-expanded', 'false');
    trigger.classList.remove('is-open');
    isOpen = false;
    if (returnFocus) trigger.focus();
  }

  function selectDate(dateStr) {
    selectedDate = dateStr;
    input.value = dateStr;
    wrap.dataset.value = dateStr;

    // Update trigger UI label
    if (display) {
      if (dateStr) {
        display.textContent = formatCalendarDate(dateStr, lang);
        trigger.classList.add('has-value');
      } else {
        const ph = wrap.dataset.placeholder || (isAr ? 'اختر تاريخ الفعالية...' : 'Select date...');
        display.innerHTML = `<span class="custom-datepicker-placeholder">${ph}</span>`;
        trigger.classList.remove('has-value');
      }
    }

    // Notify form listeners
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));

    if (typeof options.onSelect === 'function') {
      options.onSelect(dateStr);
    }

    closePopup(true);
  }

  // Trigger click & keydown handlers
  const onTriggerClick = (e) => {
    e.preventDefault();
    if (isOpen) closePopup(false);
    else openPopup();
  };

  const onTriggerKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
      e.preventDefault();
      openPopup();
    }
  };

  trigger.addEventListener('click', onTriggerClick);
  trigger.addEventListener('keydown', onTriggerKeyDown);

  // Label click focusing and opening trigger
  const label = (wrap.closest('.form-field, .search-field') || wrap.parentElement)?.querySelector(`label[for="${input.id}"]`);
  const onLabelClick = (e) => {
    e.preventDefault();
    trigger.focus();
    if (!isOpen) openPopup();
  };
  if (label) {
    label.addEventListener('click', onLabelClick);
  }

  // Handle external value changes (e.g. form reset or programmatic updates)
  const onExternalChange = () => {
    if (input.value !== selectedDate) {
      selectedDate = input.value;
      wrap.dataset.value = selectedDate;
      if (display) {
        if (selectedDate) {
          display.textContent = formatCalendarDate(selectedDate, lang);
          trigger.classList.add('has-value');
        } else {
          const ph = wrap.dataset.placeholder || (isAr ? 'اختر تاريخ الفعالية...' : 'Select date...');
          display.innerHTML = `<span class="custom-datepicker-placeholder">${ph}</span>`;
          trigger.classList.remove('has-value');
        }
      }
    }
  };
  input.addEventListener('change', onExternalChange);

  // Handle browser validation gracefully by opening custom picker
  const onInputInvalid = (e) => {
    e.preventDefault();
    trigger.focus();
    if (!isOpen) openPopup();
  };
  input.addEventListener('invalid', onInputInvalid);

  // Popup navigation & date selection delegation
  const onPopupClick = (e) => {
    const navBtn = e.target.closest('[data-nav]');
    if (navBtn) {
      e.preventDefault();
      const dir = navBtn.dataset.nav;
      if (dir === 'prev') {
        viewMonth--;
        if (viewMonth < 0) {
          viewMonth = 11;
          viewYear--;
        }
      } else {
        viewMonth++;
        if (viewMonth > 11) {
          viewMonth = 0;
          viewYear++;
        }
      }
      renderCalendarGrid();
      return;
    }

    const dayBtn = e.target.closest('.custom-cal-day[data-date]:not([disabled])');
    if (dayBtn) {
      e.preventDefault();
      selectDate(dayBtn.dataset.date);
      return;
    }

    const actionBtn = e.target.closest('[data-action]');
    if (actionBtn) {
      e.preventDefault();
      const act = actionBtn.dataset.action;
      if (act === 'clear') {
        selectDate('');
      } else if (act === 'today') {
        const todayStr = today();
        const [y, m] = todayStr.split('-').map(Number);
        viewYear = y;
        viewMonth = m - 1;
        selectDate(todayStr);
      } else if (act === 'close') {
        closePopup(true);
      }
    }
  };

  popup.addEventListener('click', onPopupClick);

  // Keyboard navigation inside popup
  const onPopupKeyDown = (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      closePopup(true);
      return;
    }

    const active = document.activeElement;
    if (active && active.classList.contains('custom-cal-day')) {
      const days = Array.from(popup.querySelectorAll('.custom-cal-day:not([disabled]):not(.is-outside)'));
      const currentIndex = days.indexOf(active);
      if (currentIndex !== -1) {
        if (e.key === 'ArrowRight') {
          e.preventDefault();
          const next = isAr ? days[currentIndex - 1] : days[currentIndex + 1];
          if (next) next.focus();
        } else if (e.key === 'ArrowLeft') {
          e.preventDefault();
          const prev = isAr ? days[currentIndex + 1] : days[currentIndex - 1];
          if (prev) prev.focus();
        } else if (e.key === 'ArrowDown') {
          e.preventDefault();
          const down = days[currentIndex + 7];
          if (down) down.focus();
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          const up = days[currentIndex - 7];
          if (up) up.focus();
        }
      }
    }
  };

  popup.addEventListener('keydown', onPopupKeyDown);

  // Close when another custom menu or datepicker opens
  const onOtherMenuOpen = (e) => {
    if (e.detail?.trigger !== trigger && isOpen) {
      closePopup(false);
    }
  };
  document.addEventListener('custom-menu-opened', onOtherMenuOpen);

  // Outside click listener
  const onDocumentClick = (e) => {
    if (!isOpen) return;
    if (!wrap.contains(e.target)) {
      closePopup(false);
    }
  };

  document.addEventListener('pointerdown', onDocumentClick);

  return () => {
    trigger.removeEventListener('click', onTriggerClick);
    trigger.removeEventListener('keydown', onTriggerKeyDown);
    if (label) label.removeEventListener('click', onLabelClick);
    input.removeEventListener('invalid', onInputInvalid);
    input.removeEventListener('change', onExternalChange);
    popup.removeEventListener('click', onPopupClick);
    popup.removeEventListener('keydown', onPopupKeyDown);
    document.removeEventListener('custom-menu-opened', onOtherMenuOpen);
    document.removeEventListener('pointerdown', onDocumentClick);
  };
}
