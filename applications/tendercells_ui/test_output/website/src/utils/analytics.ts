// analytics.ts — GA4 event helpers for wecr8.info / TenderCells website
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

function safeGtag(...args: unknown[]) {
  if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
    window.gtag(...args);
  }
}

// ── Page tracking ─────────────────────────────────────────────────────────────
// Call on every React Router route change. GA4 config has send_page_view: false
// so this is the only place page_view events fire.
export function trackPageView(path: string, title?: string) {
  safeGtag('event', 'page_view', {
    page_path: path,
    page_title: title || document.title,
    page_location: window.location.href,
    send_to: GA_ID,
  });
}

// ── Generic event ─────────────────────────────────────────────────────────────
export function trackEvent(eventName: string, params?: Record<string, unknown>) {
  safeGtag('event', eventName, { send_to: GA_ID, ...params });
}

// ── CTA / conversion events ───────────────────────────────────────────────────
export function trackCTAClick(ctaLabel: string, destination?: string) {
  trackEvent('cta_click', { cta_label: ctaLabel, destination });
}

export function trackWaitlistSignup(source: string) {
  trackEvent('waitlist_signup', { source });
}

export function trackProductView(productName: string, productId?: string) {
  trackEvent('view_item', { item_name: productName, item_id: productId });
}

export function trackFormSubmit(formName: string) {
  trackEvent('form_submit', { form_name: formName });
}

// ── Navigation events ─────────────────────────────────────────────────────────
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

// ── Engagement events ─────────────────────────────────────────────────────────
export function trackVideoPlay(videoTitle: string) {
  trackEvent('video_start', { video_title: videoTitle });
}

export function trackDownload(fileName: string) {
  trackEvent('file_download', { file_name: fileName });
}

export function trackSearch(searchTerm: string) {
  trackEvent('search', { search_term: searchTerm });
}
