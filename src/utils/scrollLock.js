const MODAL_SELECTORS = ['#authModal', '#cartModal', '#productModal', '.modal'];

function hasVisibleModal() {
  return MODAL_SELECTORS.some((selector) => {
    return Array.from(document.querySelectorAll(selector)).some((element) => {
      const computedStyle = window.getComputedStyle(element);
      return computedStyle.display !== 'none' && computedStyle.visibility !== 'hidden';
    });
  });
}

function applyBodyScrollLock(locked) {
  document.documentElement.style.overflow = locked ? 'hidden' : '';
  document.body.style.overflow = locked ? 'hidden' : '';
}

export function lockBodyScroll() {
  applyBodyScrollLock(true);
}

export function unlockBodyScroll() {
  if (!hasVisibleModal()) {
    applyBodyScrollLock(false);
  }
}

export function resetBodyScroll() {
  applyBodyScrollLock(false);
}