// Google Analytics and Tracking Utilities
class AnalyticsManager {
  constructor() {
    this.isInitialized = false;
    this.userId = null;
    this.sessionId = this.generateSessionId();
  }

  // Initialize analytics
  init(measurementId) {
    if (typeof gtag !== 'undefined') {
      this.isInitialized = true;
      this.measurementId = measurementId;
      
      // Set default parameters
      gtag('config', measurementId, {
        custom_map: {
          'custom_parameter_1': 'user_type',
          'custom_parameter_2': 'farm_size'
        }
      });
    }
  }

  // Set user properties
  setUser(userId, properties = {}) {
    this.userId = userId;
    
    if (this.isInitialized) {
      gtag('config', this.measurementId, {
        user_id: userId,
        custom_map: properties
      });
    }
  }

  // Track page views
  trackPageView(pagePath, pageTitle) {
    if (this.isInitialized) {
      gtag('event', 'page_view', {
        page_title: pageTitle,
        page_location: window.location.href,
        page_path: pagePath,
        user_id: this.userId,
        session_id: this.sessionId
      });
    }
  }

  // Track custom events
  trackEvent(eventName, parameters = {}) {
    if (this.isInitialized) {
      gtag('event', eventName, {
        ...parameters,
        user_id: this.userId,
        session_id: this.sessionId,
        timestamp: new Date().toISOString()
      });
    }
  }

  // E-commerce tracking
  trackPurchase(transactionId, items, value, currency = 'USD') {
    if (this.isInitialized) {
      gtag('event', 'purchase', {
        transaction_id: transactionId,
        value: value,
        currency: currency,
        items: items.map(item => ({
          item_id: item.id,
          item_name: item.name,
          category: item.category,
          quantity: item.quantity,
          price: item.price
        }))
      });
    }
  }

  // Track add to cart
  trackAddToCart(item, value, currency = 'USD') {
    if (this.isInitialized) {
      gtag('event', 'add_to_cart', {
        currency: currency,
        value: value,
        items: [{
          item_id: item.id,
          item_name: item.name,
          category: item.category,
          quantity: item.quantity,
          price: item.price
        }]
      });
    }
  }

  // Track form submissions
  trackFormSubmission(formName, formData = {}) {
    this.trackEvent('form_submit', {
      form_name: formName,
      form_location: window.location.pathname,
      ...formData
    });
  }

  // Track user engagement
  trackEngagement(action, element, value = null) {
    this.trackEvent('user_engagement', {
      engagement_action: action,
      engagement_element: element,
      engagement_value: value,
      page_path: window.location.pathname
    });
  }

  // Track video interactions
  trackVideo(action, videoTitle, progress = null) {
    this.trackEvent('video_interaction', {
      video_action: action,
      video_title: videoTitle,
      video_progress: progress,
      page_path: window.location.pathname
    });
  }

  // Track search
  trackSearch(searchTerm, searchResults = null) {
    this.trackEvent('search', {
      search_term: searchTerm,
      search_results: searchResults,
      page_path: window.location.pathname
    });
  }

  // Track downloads
  trackDownload(fileName, fileType, fileSize = null) {
    this.trackEvent('file_download', {
      file_name: fileName,
      file_type: fileType,
      file_size: fileSize,
      page_path: window.location.pathname
    });
  }

  // Track social sharing
  trackSocialShare(platform, contentType, contentId) {
    this.trackEvent('share', {
      method: platform,
      content_type: contentType,
      content_id: contentId,
      page_path: window.location.pathname
    });
  }

  // Track newsletter signups
  trackNewsletterSignup(email, source) {
    this.trackEvent('newsletter_signup', {
      email_domain: email.split('@')[1],
      signup_source: source,
      page_path: window.location.pathname
    });
  }

  // Track device interactions
  trackDeviceInteraction(deviceId, action, value = null) {
    this.trackEvent('device_interaction', {
      device_id: deviceId,
      device_action: action,
      device_value: value,
      user_id: this.userId
    });
  }

  // Track educational content
  trackEducationalContent(contentType, contentId, action) {
    this.trackEvent('educational_content', {
      content_type: contentType,
      content_id: contentId,
      content_action: action,
      page_path: window.location.pathname
    });
  }

  // Track support interactions
  trackSupportInteraction(supportType, issue, resolution = null) {
    this.trackEvent('support_interaction', {
      support_type: supportType,
      support_issue: issue,
      support_resolution: resolution,
      user_id: this.userId
    });
  }

  // Generate unique session ID
  generateSessionId() {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  // Track conversion events
  trackConversion(conversionType, value = null, currency = 'USD') {
    this.trackEvent('conversion', {
      conversion_type: conversionType,
      conversion_value: value,
      conversion_currency: currency,
      page_path: window.location.pathname
    });
  }

  // Track user journey
  trackUserJourney(step, funnel, value = null) {
    this.trackEvent('user_journey', {
      journey_step: step,
      journey_funnel: funnel,
      journey_value: value,
      session_id: this.sessionId
    });
  }

  // Track performance metrics
  trackPerformance(metric, value, unit = 'ms') {
    this.trackEvent('performance_metric', {
      metric_name: metric,
      metric_value: value,
      metric_unit: unit,
      page_path: window.location.pathname
    });
  }

  // Track errors
  trackError(errorType, errorMessage, errorStack = null) {
    this.trackEvent('error', {
      error_type: errorType,
      error_message: errorMessage,
      error_stack: errorStack,
      page_path: window.location.pathname,
      user_agent: navigator.userAgent
    });
  }
}

// Create global analytics instance
export const analytics = new AnalyticsManager();

// Initialize analytics when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  analytics.init('GA_MEASUREMENT_ID'); // Replace with actual measurement ID
});

// Track page load performance
window.addEventListener('load', () => {
  const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
  analytics.trackPerformance('page_load_time', loadTime);
});

// Track errors
window.addEventListener('error', (event) => {
  analytics.trackError('javascript_error', event.message, event.error?.stack);
});

// Track unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  analytics.trackError('promise_rejection', event.reason);
});

// Export tracking functions for easy use
export const trackPageView = (path, title) => analytics.trackPageView(path, title);
export const trackEvent = (name, params) => analytics.trackEvent(name, params);
export const trackPurchase = (id, items, value) => analytics.trackPurchase(id, items, value);
export const trackAddToCart = (item, value) => analytics.trackAddToCart(item, value);
export const trackFormSubmit = (name, data) => analytics.trackFormSubmission(name, data);
export const trackEngagement = (action, element, value) => analytics.trackEngagement(action, element, value);
export const trackSearch = (term, results) => analytics.trackSearch(term, results);
export const trackDownload = (file, type, size) => analytics.trackDownload(file, type, size);
export const trackShare = (platform, type, id) => analytics.trackSocialShare(platform, type, id);
export const trackNewsletter = (email, source) => analytics.trackNewsletterSignup(email, source);
export const trackDevice = (id, action, value) => analytics.trackDeviceInteraction(id, action, value);
export const trackEducation = (type, id, action) => analytics.trackEducationalContent(type, id, action);
export const trackSupport = (type, issue, resolution) => analytics.trackSupportInteraction(type, issue, resolution);
export const trackConversion = (type, value) => analytics.trackConversion(type, value);
export const trackJourney = (step, funnel, value) => analytics.trackUserJourney(step, funnel, value);