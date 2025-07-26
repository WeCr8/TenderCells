// Firebase Configuration
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: "AIzaSyDummyKeyForDevelopment-Replace-With-Real-Key",
  authDomain: "tender-cells.firebaseapp.com",
  projectId: "tender-cells",
  storageBucket: "tender-cells.appspot.com",
  messagingSenderId: "987654321",
  appId: "1:987654321:web:abcdef123456789",
  measurementId: "G-ABCDEF1234"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const analytics = getAnalytics(app);

export default app;