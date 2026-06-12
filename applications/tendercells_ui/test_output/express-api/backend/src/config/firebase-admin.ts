// Firebase Admin SDK Configuration
import admin from 'firebase-admin';

// Path to the Firebase Admin SDK credentials file
// Default path: C:\Users\zach\Documents\Secrets\tender-cells\firebase-adminsdk-fbsvc.json
// Can be overridden with FIREBASE_ADMIN_SDK_PATH environment variable
const serviceAccountPath = process.env.FIREBASE_ADMIN_SDK_PATH || 
  'C:\\Users\\zach\\Documents\\Secrets\\tender-cells\\firebase-adminsdk-fbsvc.json';

let adminApp: admin.app.App | null = null;

/**
 * Initialize Firebase Admin SDK
 */
export function initializeFirebaseAdmin(): admin.app.App {
  if (adminApp) {
    return adminApp;
  }

  try {
    // Initialize Firebase Admin with service account
    adminApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccountPath),
    });

    console.log('Firebase Admin SDK initialized successfully');
    console.log(`Using service account: ${serviceAccountPath}`);
    return adminApp;
  } catch (error) {
    console.error('Error initializing Firebase Admin SDK:', error);
    console.error(`Failed to load service account from: ${serviceAccountPath}`);
    throw error;
  }
}

/**
 * Get Firebase Admin instance
 */
export function getFirebaseAdmin(): admin.app.App {
  if (!adminApp) {
    return initializeFirebaseAdmin();
  }
  return adminApp;
}

/**
 * Get Firestore Admin instance
 */
export function getFirestoreAdmin(): admin.firestore.Firestore {
  const app = getFirebaseAdmin();
  return admin.firestore(app);
}

/**
 * Get Auth Admin instance
 */
export function getAuthAdmin(): admin.auth.Auth {
  const app = getFirebaseAdmin();
  return admin.auth(app);
}

export default adminApp;

