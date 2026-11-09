// ==========================================================================
// WEDDO Custom Royal Select Dropdown Engine
// Bespoke luxury dropdown menu popover for selects matching Apollo Design System
// ==========================================================================

/**
 * Mounts a bespoke custom dropdown menu on a native <select> element.
 */
export function mountCustomSelect(nativeSelect, options = {}) {
  if (!nativeSelect || nativeSelect.dataset.customSelectMounted === 'true') {
    return () => {};
  }

  // Mark native select as mounted and hide visually while keeping it fully operational
  nativeSelect.dataset.customSelectMounted = 'true';
  nativeSelect.classList.add('custom-select-native-hidden');
  nativeSelect.setAttribute('tabindex', '-1');
  nativeSelect.setAttribute('aria-hidden', 'true');

  const inSearchField = !!nativeSelect.closest('.search-field');
  const inFormField = !!nativeSelect.closest('.form-field');
  const parent = nativeSelect.parentElement;

  // Create wrapper element
  const wrap = document.createElement('div');
  wrap.className = `custom-select-wrap ${inSearchField ? 'in-search-field' : ''} ${inFormField ? 'in-form-field' : ''}`;
  wrap.dataset.selectId = nativeSelect.id || '';

  // Insert wrapper right after native select
  parent.insertBefore(wrap, nativeSelect.nextSibling);

  // Trigger button
  const trigger = document.createElement('button');
  trigger.type = 'button';
  trigger.className = 'custom-select-trigger';
  if (nativeSelect.id) {
    trigger.id = `${nativeSelect.id}-custom-trigger`;
    trigger.setAttribute('aria-controls', `${nativeSelect.id}-custom-menu`);
  }
  trigger.setAttribute('role', 'combobox');
  trigger.setAttribute('aria-haspopup', 'listbox');
  trigger.setAttribute('aria-expanded', 'false');

  const labelSpan = document.createElement('span');
  labelSpan.className = 'custom-select-label';

  const chevronSpan = document.createElement('span');
  chevronSpan.className = 'custom-select-chevron';
  chevronSpan.setAttribute('aria-hidden', 'true');
  chevronSpan.innerHTML = `
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
      <path d="m6 9 6 6 6-6"/>
    </svg>
  `;

  trigger.appendChild(labelSpan);
  trigger.appendChild(chevronSpan);
  wrap.appendChild(trigger);

  // Menu popup
  const menu = document.createElement('div');
  menu.className = 'custom-select-menu';
  if (nativeSelect.id) {
    menu.id = `${nativeSelect.id}-custom-menu`;
  }
  menu.setAttribute('role', 'listbox');
  menu.hidden = true;

  const ambient = document.createElement('div');
  ambient.className = 'custom-select-ambient';
  ambient.setAttribute('aria-hidden', 'true');
  menu.appendChild(ambient);

  const scrollContainer = document.createElement('div');
  scrollContainer.className = 'custom-select-options-scroll';
  menu.appendChild(scrollContainer);
  wrap.appendChild(menu);

  let isOpen = false;
  let focusedIndex = -1;

  // Render options from native select
  function buildMenu() {
    scrollContainer.innerHTML = '';
    const selectedVal = String(nativeSelect.value);
    let selectedText = '';

    const children = Array.from(nativeSelect.children);
    children.forEach((child) => {
      if (child.tagName === 'OPTGROUP') {
        const groupEl = document.createElement('div');
        groupEl.className = 'custom-select-group';

        const groupLabel = document.createElement('span');
        groupLabel.className = 'custom-select-group-label';
        groupLabel.textContent = child.label || '';
        groupEl.appendChild(groupLabel);

        Array.from(child.children).forEach((opt) => {
          if (opt.tagName === 'OPTION') {
            const optEl = createOptionElement(opt, selectedVal);
            groupEl.appendChild(optEl);
            if (String(opt.value) === selectedVal && !selectedText) {
              selectedText = opt.textContent;
            }
          }
        });
        scrollContainer.appendChild(groupEl);
      } else if (child.tagName === 'OPTION') {
        const optEl = createOptionElement(child, selectedVal);
        scrollContainer.appendChild(optEl);
        if (String(child.value) === selectedVal && !selectedText) {
          selectedText = child.textContent;
        }
      }
    });

    if (!selectedText) {
      const selectedOpt = nativeSelect.options[nativeSelect.selectedIndex];
      selectedText = selectedOpt ? selectedOpt.textContent : '';
    }

    labelSpan.textContent = selectedText;
    if (nativeSelect.value) {
      trigger.classList.add('has-value');
    } else {
      trigger.classList.remove('has-value');
    }
  }

  function createOptionElement(opt, selectedVal) {
    const isSelected = String(opt.value) === selectedVal;
    const isDisabled = opt.disabled;

    const optEl = document.createElement('div');
    optEl.className = `custom-select-option ${isSelected ? 'is-selected' : ''} ${isDisabled ? 'is-disabled' : ''}`;
    optEl.setAttribute('role', 'option');
    optEl.setAttribute('aria-selected', String(isSelected));
    optEl.dataset.value = opt.value;
    optEl.tabIndex = -1;

    const textSpan = document.createElement('span');
    textSpan.className = 'custom-select-option-text';
    textSpan.textContent = opt.textContent;

    const checkSpan = document.createElement('span');
    checkSpan.className = 'custom-select-option-check';
    checkSpan.setAttribute('aria-hidden', 'true');
    checkSpan.innerHTML = `
      <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="m5 12 4 4L19 6"/>
      </svg>
    `;

    optEl.appendChild(textSpan);
    optEl.appendChild(checkSpan);
    return optEl;
  }

  function openMenu() {
    if (isOpen) return;
    document.dispatchEvent(new CustomEvent('custom-menu-opened', { detail: { trigger } }));
    buildMenu();
    menu.hidden = false;
    trigger.setAttribute('aria-expanded', 'true');
    trigger.classList.add('is-open');
    isOpen = true;

    // Scroll to selected option
    const activeOpt = menu.querySelector('.custom-select-option.is-selected');
    if (activeOpt) {
      requestAnimationFrame(() => {
        activeOpt.scrollIntoView({ block: 'nearest' });
      });
    }
  }

  function closeMenu(returnFocus = true) {
    if (!isOpen) return;
    menu.hidden = true;
    trigger.setAttribute('aria-expanded', 'false');
    trigger.classList.remove('is-open');
    isOpen = false;
    focusedIndex = -1;
    clearOptionFocus();
    if (returnFocus) trigger.focus();
  }

  function selectOption(val) {
    if (nativeSelect.value !== val) {
      nativeSelect.value = val;
      nativeSelect.dispatchEvent(new Event('input', { bubbles: true }));
      nativeSelect.dispatchEvent(new Event('change', { bubbles: true }));
    }
    buildMenu();
    closeMenu(true);
  }

  function getEnabledOptions() {
    return Array.from(menu.querySelectorAll('.custom-select-option:not(.is-disabled)'));
  }

  function clearOptionFocus() {
    menu.querySelectorAll('.custom-select-option.is-focused').forEach(el => el.classList.remove('is-focused'));
  }

  function setOptionFocus(index) {
    const options = getEnabledOptions();
    if (!options.length) return;
    clearOptionFocus();
    if (index < 0) index = options.length - 1;
    if (index >= options.length) index = 0;
    focusedIndex = index;
    const target = options[focusedIndex];
    if (target) {
      target.classList.add('is-focused');
      target.scrollIntoView({ block: 'nearest' });
    }
  }

  // Trigger handlers
  const onTriggerClick = (e) => {
    e.preventDefault();
    if (isOpen) closeMenu(false);
    else openMenu();
  };

  const onTriggerKeyDown = (e) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (!isOpen) {
        openMenu();
        const options = getEnabledOptions();
        const selectedIdx = options.findIndex(el => el.classList.contains('is-selected'));
        setOptionFocus(selectedIdx !== -1 ? selectedIdx : 0);
      } else {
        if (e.key === 'ArrowDown') setOptionFocus(focusedIndex + 1);
        else if (e.key === 'ArrowUp') setOptionFocus(focusedIndex - 1);
        else if (e.key === 'Enter' || e.key === ' ') {
          const options = getEnabledOptions();
          if (focusedIndex >= 0 && options[focusedIndex]) {
            selectOption(options[focusedIndex].dataset.value);
          } else {
            closeMenu(true);
          }
        }
      }
    } else if (e.key === 'Escape' && isOpen) {
      e.preventDefault();
      closeMenu(true);
    }
  };

  trigger.addEventListener('click', onTriggerClick);
  trigger.addEventListener('keydown', onTriggerKeyDown);

  // Label click handler
  const label = (wrap.closest('.form-field, .search-field') || parent)?.querySelector(`label[for="${nativeSelect.id}"]`);
  const onLabelClick = (e) => {
    e.preventDefault();
    trigger.focus();
    if (!isOpen) openMenu();
  };
  if (label) label.addEventListener('click', onLabelClick);

  // Option click inside menu
  const onMenuClick = (e) => {
    const opt = e.target.closest('.custom-select-option:not(.is-disabled)');
    if (opt) {
      e.preventDefault();
      selectOption(opt.dataset.value);
    }
  };
  menu.addEventListener('click', onMenuClick);

  // Native select external change listener
  const onNativeChange = () => {
    buildMenu();
  };
  nativeSelect.addEventListener('change', onNativeChange);

  // Forward focus from native select to trigger if focused programmatically
  const onNativeFocus = () => {
    trigger.focus();
  };
  nativeSelect.addEventListener('focus', onNativeFocus);

  // Close when another custom menu or datepicker opens
  const onOtherMenuOpen = (e) => {
    if (e.detail?.trigger !== trigger && isOpen) {
      closeMenu(false);
    }
  };
  document.addEventListener('custom-menu-opened', onOtherMenuOpen);

  // Observe option changes inside native select
  const observer = new MutationObserver(() => {
    buildMenu();
  });
  observer.observe(nativeSelect, { childList: true, subtree: true, characterData: true });

  // Outside click listener
  const onDocumentClick = (e) => {
    if (!isOpen) return;
    if (!wrap.contains(e.target)) {
      closeMenu(false);
    }
  };
  document.addEventListener('pointerdown', onDocumentClick);

  // Initial build
  buildMenu();

  return () => {
    trigger.removeEventListener('click', onTriggerClick);
    trigger.removeEventListener('keydown', onTriggerKeyDown);
    if (label) label.removeEventListener('click', onLabelClick);
    menu.removeEventListener('click', onMenuClick);
    nativeSelect.removeEventListener('change', onNativeChange);
    nativeSelect.removeEventListener('focus', onNativeFocus);
    document.removeEventListener('custom-menu-opened', onOtherMenuOpen);
    document.removeEventListener('pointerdown', onDocumentClick);
    observer.disconnect();
    nativeSelect.dataset.customSelectMounted = 'false';
    nativeSelect.classList.remove('custom-select-native-hidden');
    nativeSelect.removeAttribute('tabindex');
    nativeSelect.removeAttribute('aria-hidden');
    if (wrap.parentElement) {
      wrap.parentElement.removeChild(wrap);
    }
  };
}

/**
 * Mounts custom select dropdowns on all matching selects in a root container.
 */
export function mountAllCustomSelects(root = document) {
  if (!root) return () => {};
  const selects = root.querySelectorAll('select:not([data-custom-select-mounted="true"]):not([data-custom-select-ignore])');
  const disposes = [];
  selects.forEach((sel) => {
    disposes.push(mountCustomSelect(sel));
  });
  return () => {
    disposes.forEach(d => d());
  };
}
