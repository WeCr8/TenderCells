// analytics.ts
import { getAnalytics, isSupported, type Analytics } from 'firebase/analytics';
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
