// analytics.ts - GA4 and Google Tag Manager event helpers for TenderCells.
// GA4 measurement ID: G-KSY2D1YGSL
// AdSense publisher: ca-pub-3639153716376265

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
    adsbygoogle: unknown[];
  }
}

const GA_ID = 'G-KSY2D1YGSL';

// Pseudonymous, non-PII visitor id. The public site has no login, so there is no
// real account to key on. Instead we mint a random UUID and reuse it across visits
// so GA4 can stitch a single person's events (user_id) without ever storing a name,
// email, or anything identifying. Created ONLY after analytics consent is granted
// (see consent.ts) and removed when consent is withdrawn — keeps us COPPA/GDPR-safe
// for the student/classroom audience.
const CLIENT_ID_KEY = 'tendercells_client_id_v1';

function pushDataLayer(eventName: string, params?: Record<string, unknown>) {
  if (typeof window !== 'undefined') {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event: eventName, ...params });
  }
}

function safeGtag(...args: unknown[]) {
  if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
    window.gtag(...args);
  }
}

export function trackPageView(path: string, title?: string) {
  const params = {
    page_path: path,
    page_title: title || document.title,
    page_location: window.location.href,
  };
  pushDataLayer('page_view', params);
  safeGtag('event', 'page_view', {
    ...params,
    send_to: GA_ID,
  });
}

export function trackEvent(eventName: string, params?: Record<string, unknown>) {
  pushDataLayer(eventName, params);
  safeGtag('event', eventName, { send_to: GA_ID, ...params });
}

/**
 * Return the stable pseudonymous visitor id, creating it on first call.
 * Returns null if localStorage is unavailable. No PII — a random UUID only.
 */
export function getOrCreateClientId(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    let id = window.localStorage.getItem(CLIENT_ID_KEY);
    if (!id) {
      id =
        typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
          ? crypto.randomUUID()
          : `tc_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      window.localStorage.setItem(CLIENT_ID_KEY, id);
    }
    return id;
  } catch {
    return null;
  }
}

/** Set (or clear) the GA4 user_id so events from this visitor are attributed together. */
export function setUserId(userId: string | null) {
  safeGtag('set', { user_id: userId ?? undefined });
  safeGtag('config', GA_ID, { user_id: userId ?? undefined });
  pushDataLayer('set_user_id', { user_id: userId });
}

/** Attach non-PII user properties (e.g. audience: '4-h', consent_level) to the visitor. */
export function setUserProperties(props: Record<string, unknown>) {
  safeGtag('set', 'user_properties', props);
  pushDataLayer('set_user_properties', { user_properties: props });
}

/** Give the visitor a stable pseudonymous id. Call after analytics consent is granted. */
export function identifyVisitor() {
  const id = getOrCreateClientId();
  if (id) setUserId(id);
}

/** Forget the visitor id. Call when analytics consent is withdrawn. */
export function clearVisitorId() {
  try {
    window.localStorage.removeItem(CLIENT_ID_KEY);
  } catch {
    // ignore storage failures
  }
  setUserId(null);
}

export function trackCTAClick(ctaLabel: string, destination?: string) {
  trackEvent('cta_click', { cta_label: ctaLabel, destination });
}

export function trackWaitlistSignup(source: string) {
  trackEvent('waitlist_signup', { source });
}

export function trackProductView(productName: string, productId?: string) {
  trackEvent('view_item', { item_name: productName, item_id: productId });
}

export function trackProductInterest(productName: string, productId?: string, source?: string) {
  trackEvent('product_interest', {
    item_name: productName,
    item_id: productId,
    source,
  });
}

export function trackFormSubmit(formName: string) {
  trackEvent('form_submit', { form_name: formName });
}

export function trackButtonClick(buttonName: string, section?: string) {
  trackEvent('button_click', { button_name: buttonName, section });
}

export function trackAnchorClick(anchorId: string) {
  trackEvent('anchor_click', { anchor_id: anchorId });
}

export function trackOutboundLink(url: string, label?: string) {
  trackEvent('click', {
    link_url: url,
    link_domain: new URL(url).hostname,
    link_text: label,
    outbound: true,
  });
}

export function trackVideoPlay(videoTitle: string) {
  trackEvent('video_start', { video_title: videoTitle });
}

export function trackDownload(fileName: string) {
  trackEvent('file_download', { file_name: fileName });
}

export function trackSearch(searchTerm: string) {
  trackEvent('search', { search_term: searchTerm });
}

export function trackReadDepth(percent: number, path: string) {
  trackEvent('read_depth', {
    percent_scrolled: percent,
    page_path: path,
  });
}

export function trackInternalLink(label: string, destination: string, section?: string) {
  trackEvent('internal_link_click', {
    link_text: label,
    destination,
    section,
  });
}

export function trackResourceClick(label: string, destination: string, resourceType: string) {
  trackEvent('resource_click', {
    link_text: label,
    destination,
    resource_type: resourceType,
  });
}
