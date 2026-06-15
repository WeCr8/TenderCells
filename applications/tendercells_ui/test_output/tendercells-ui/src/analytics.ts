// analytics.ts
// User + interaction tracking for the app. Backed by Firebase Analytics, which only
// activates when a deployment provides VITE_FIREBASE_MEASUREMENT_ID. In the sim-only
// public demo there is no Firebase env, so every call below is a safe no-op — no data
// leaves the browser. Tracking turns on automatically for real, configured deployments.
import {
  getAnalytics,
  isSupported,
  logEvent,
  setUserId,
  setUserProperties,
  type Analytics,
} from 'firebase/analytics';
import app from './lib/firebase/firebaseApp';

let analyticsInstance: Analytics | null = null;

export async function initAnalytics(): Promise<Analytics | null> {
  if (analyticsInstance) {
    return analyticsInstance;
  }

  if (!import.meta.env.VITE_FIREBASE_MEASUREMENT_ID) {
    return null;
  }

  try {
    if (!(await isSupported())) {
      return null;
    }

    analyticsInstance = getAnalytics(app);
    return analyticsInstance;
  } catch (error) {
    console.info('Firebase Analytics unavailable in this environment.', error);
    return null;
  }
}

/**
 * Attribute subsequent events to a signed-in user (Firebase Auth uid) — or clear
 * attribution on sign-out. The uid is an opaque Firebase id, not PII. No-op when
 * analytics is unavailable.
 */
export async function setAnalyticsUser(uid: string | null): Promise<void> {
  const a = await initAnalytics();
  if (!a) return;
  setUserId(a, uid);
}

/** Attach non-PII user properties (e.g. plan tier, device count) to the current user. */
export async function setAnalyticsUserProperties(props: Record<string, unknown>): Promise<void> {
  const a = await initAnalytics();
  if (!a) return;
  setUserProperties(a, props as { [key: string]: unknown });
}

/** Log a user interaction. No-op when analytics is unavailable (e.g. sim-only demo). */
export async function trackEvent(name: string, params?: Record<string, unknown>): Promise<void> {
  const a = await initAnalytics();
  if (!a) return;
  logEvent(a, name as string, params);
}

/** Log a route/screen view. */
export async function trackPageView(path: string, title?: string): Promise<void> {
  await trackEvent('page_view', {
    page_path: path,
    page_title: title ?? (typeof document !== 'undefined' ? document.title : undefined),
    page_location: typeof window !== 'undefined' ? window.location.href : undefined,
  });
}
