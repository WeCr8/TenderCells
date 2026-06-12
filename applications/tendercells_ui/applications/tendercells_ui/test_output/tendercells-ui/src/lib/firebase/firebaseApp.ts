/**
 * Firebase App Configuration
 * Initializes Firebase services for the application
 */

import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Check if Firebase config is valid
const hasValidConfig = 
  firebaseConfig.apiKey && 
  firebaseConfig.apiKey !== '' &&
  firebaseConfig.projectId && 
  firebaseConfig.projectId !== '';

// Initialize Firebase only if we have valid configuration
let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;

if (hasValidConfig) {
  try {
    // Initialize Firebase only if not already initialized
    if (getApps().length === 0) {
      app = initializeApp(firebaseConfig);
    } else {
      app = getApps()[0];
    }

    // Initialize services
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
  } catch (error) {
    console.error('Error initializing Firebase:', error);
    console.warn('Firebase services will not be available. Please check your Firebase configuration.');
  }
} else {
  // Only log Firebase warning once (check if already logged)
  if (!(window as any).__firebaseConfigWarningShown) {
    console.warn('Firebase configuration is missing or incomplete.');
    console.warn('To enable Firebase features, add your Firebase credentials to .env file:');
    console.warn('  VITE_FIREBASE_API_KEY=your-api-key');
    console.warn('  VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com');
    console.warn('  VITE_FIREBASE_PROJECT_ID=your-project-id');
    console.warn('  VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com');
    console.warn('  VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id');
    console.warn('  VITE_FIREBASE_APP_ID=your-app-id');
    console.warn('App will run in demo mode without Firebase features.');
    (window as any).__firebaseConfigWarningShown = true;
  }
}

// Check if Firebase is initialized and ready
export const isFirebaseReady = (): boolean => {
  return hasValidConfig && app !== null;
};

// Export services (may be null if Firebase is not configured)
export { auth, db, storage };
export default app;
