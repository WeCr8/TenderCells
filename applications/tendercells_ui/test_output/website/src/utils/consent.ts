const CONSENT_KEY = 'tendercells_cookie_consent_v1';

export type ConsentChoice = 'accepted' | 'rejected';

declare global {
  interface Window {
    gtag: (...args: unknown[]) => void;
    dataLayer: unknown[];
  }
}

export function getConsentChoice(): ConsentChoice | null {
  try {
    const value = window.localStorage.getItem(CONSENT_KEY);
    return value === 'accepted' || value === 'rejected' ? value : null;
  } catch {
    return null;
  }
}

export function setConsentChoice(choice: ConsentChoice) {
  try {
    window.localStorage.setItem(CONSENT_KEY, choice);
  } catch {
    // Consent mode still updates in-memory if storage is unavailable.
  }
  applyConsentChoice(choice);
  window.dispatchEvent(new CustomEvent('tendercells-consent-updated', { detail: { choice } }));
}

export function resetConsentChoice() {
  try {
    window.localStorage.removeItem(CONSENT_KEY);
  } catch {
    // Ignore localStorage failures.
  }
  applyConsentChoice('rejected');
  window.dispatchEvent(new CustomEvent('tendercells-consent-updated', { detail: { choice: null } }));
}

export function applyConsentChoice(choice: ConsentChoice) {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') return;

  const granted = choice === 'accepted' ? 'granted' : 'denied';
  window.gtag('consent', 'update', {
    ad_storage: granted,
    ad_user_data: granted,
    ad_personalization: granted,
    analytics_storage: granted,
  });
}
