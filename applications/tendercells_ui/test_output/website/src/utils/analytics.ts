// Google Analytics helper functions
declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
  }
}

export const trackPageView = (path: string) => {
  if (window.gtag) {
    window.gtag('event', 'page_view', {
      page_path: path,
    });
  }
};

export const trackEvent = (
  eventName: string,
  eventData?: Record<string, any>
) => {
  if (window.gtag) {
    window.gtag('event', eventName, eventData);
  }
};

export const trackConversion = (conversionId: string, value?: number) => {
  if (window.gtag) {
    window.gtag('event', 'conversion', {
      conversion_id: conversionId,
      value: value || 0,
    });
  }
};

// Track button clicks
export const trackButtonClick = (buttonName: string) => {
  trackEvent('button_click', { button_name: buttonName });
};

// Track navigation to anchor sections
export const trackAnchorClick = (anchorId: string) => {
  trackEvent('anchor_click', { anchor_id: anchorId });
};
