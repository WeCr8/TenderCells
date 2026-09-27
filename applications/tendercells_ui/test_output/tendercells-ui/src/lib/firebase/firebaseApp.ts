/// <reference types="vite/client" />

// firebaseApp.ts - Firebase initialization
import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import type { Auth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import type { Firestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import type { FirebaseStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// FIX(2026-09-27): Auth and the sim data backend are gated separately. The hosted
// public build (tendercells.com/app) used to blank every Firebase key, so Login and
// Sign-up always failed with "Authentication is disabled". It now ships the web config
// so accounts work, while VITE_SIM_DATA_ONLY keeps demo data (birds/eggs/schedules) in
// each visitor's localStorage sandbox instead of Firestore.
/** True when the web config is present, so Firebase Auth (login / sign-up) is usable. */
export const FIREBASE_ENABLED = Boolean(
  firebaseConfig.apiKey && firebaseConfig.authDomain && firebaseConfig.projectId,
);

/** True when sim-data services should read/write Firestore instead of localStorage. */
export const FIRESTORE_DATA_ENABLED =
  FIREBASE_ENABLED && import.meta.env.VITE_SIM_DATA_ONLY !== 'true';

// Initialize Firebase
const app: FirebaseApp | undefined = FIREBASE_ENABLED ? initializeApp(firebaseConfig) : undefined;

// Initialize Firebase services
export const auth = app ? getAuth(app) : ({ currentUser: null } as Auth);
export const db = app ? getFirestore(app) : (undefined as unknown as Firestore);
export const storage = app ? getStorage(app) : (undefined as unknown as FirebaseStorage);

export default app;
