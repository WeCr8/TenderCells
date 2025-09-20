// Firebase Configuration
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics, isSupported } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Validate required environment variables
const requiredEnvVars = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID'
];

const missingEnvVars = requiredEnvVars.filter(varName => !import.meta.env[varName]);

if (missingEnvVars.length > 0) {
  console.error('Missing required Firebase environment variables:', missingEnvVars);
  console.warn('Please check your .env file and ensure all Firebase credentials are set.');
  console.warn('Using placeholder configuration for development. Some features may not work.');
}

// Use placeholder config if environment variables are missing
const developmentConfig = {
  apiKey: "demo-api-key",
  authDomain: "demo-project.firebaseapp.com",
  projectId: "demo-project",
  storageBucket: "demo-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "demo-app-id"
};

// Use actual config if available, otherwise use development config
const config = missingEnvVars.length === 0 ? firebaseConfig : developmentConfig;

// Initialize Firebase only if we have valid configuration
let app = null;
let auth = null;
let db = null;
let analytics = null;

// Only initialize if we have real Firebase credentials (not placeholders)
const hasValidCredentials = missingEnvVars.length === 0 && 
  config.apiKey !== "demo-api-key" && 
  config.projectId !== "demo-project";

if (hasValidCredentials) {
  // Initialize Firebase with real config
  app = initializeApp(config);
  auth = getAuth(app);
  db = getFirestore(app);
  
  // Initialize analytics only if supported and measurement ID is provided
  if (import.meta.env.VITE_FIREBASE_MEASUREMENT_ID) {
    isSupported().then((supported) => {
      if (supported) {
        analytics = getAnalytics(app);
      }
    });
  }
} else {
  console.warn('Firebase not initialized due to missing or placeholder environment variables');
  console.warn('Authentication and database features will not work until Firebase is properly configured');
}

export { auth, db, analytics };
export default app;