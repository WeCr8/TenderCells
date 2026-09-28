// firebase.ts - Firebase Auth for the marketing site's own Account page.
//
// The site and the Tender Cells OS (/app) share one origin and one Firebase
// project, so Firebase's per-origin persisted session is shared too: signing in
// here means the OS opens already signed in, without the OS having to load just
// to log in. Only Auth is used on the site - no Firestore, no Storage.
//
// Config comes from the same VITE_FIREBASE_* keys the OS build uses (repo-root
// .env locally; exported by the deploy workflow in CI).
import { initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
};

/** True when the build carries enough Firebase config for sign-in to work. */
export const AUTH_CONFIGURED = Boolean(
  firebaseConfig.apiKey && firebaseConfig.authDomain && firebaseConfig.projectId,
);

export const app: FirebaseApp | undefined = AUTH_CONFIGURED ? initializeApp(firebaseConfig) : undefined;

/** Firebase Auth instance, or undefined when the build has no Firebase config. */
export const auth: Auth | undefined = app ? getAuth(app) : undefined;
