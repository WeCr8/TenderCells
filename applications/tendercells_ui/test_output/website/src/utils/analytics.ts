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
