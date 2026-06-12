// Firebase initialization and service methods
// Last updated: 2026-06-11

import { initializeApp } from 'firebase/app';
import {
  getAuth,
  Auth,
  signInWithEmailAndPassword,
  signOut,
  User as FirebaseUser,
  createUserWithEmailAndPassword,
} from 'firebase/auth';
import {
  getFirestore,
  Firestore,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';

import { Device, TelemetryReading, Schedule, Alert, Property } from '../types';

// Firebase configuration from .env
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth: Auth = getAuth(app);
export const db: Firestore = getFirestore(app);

// ============================================================================
// AUTHENTICATION
// ============================================================================

export const signIn = async (email: string, password: string) => {
  return signInWithEmailAndPassword(auth, email, password);
};

export const signUp = async (email: string, password: string) => {
  return createUserWithEmailAndPassword(auth, email, password);
};

export const logout = async () => {
  return signOut(auth);
};

// ============================================================================
// DEVICES
// ============================================================================

export const getDevices = async (propertyId: string): Promise<Device[]> => {
  const q = query(
    collection(db, 'devices'),
    where('propertyId', '==', propertyId)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Device));
};

export const getDevice = async (deviceId: string): Promise<Device | null> => {
  const docRef = doc(db, 'devices', deviceId);
  const snapshot = await getDoc(docRef);
  return snapshot.exists()
    ? ({ id: snapshot.id, ...snapshot.data() } as Device)
    : null;
};

export const subscribeToDevice = (
  deviceId: string,
  callback: (device: Device | null) => void
): Unsubscribe => {
  const docRef = doc(db, 'devices', deviceId);
  return onSnapshot(docRef, (snapshot) => {
    if (snapshot.exists()) {
      callback({ id: snapshot.id, ...snapshot.data() } as Device);
    } else {
      callback(null);
    }
  });
};

export const createDevice = async (device: Omit<Device, 'id'>) => {
  const docRef = doc(collection(db, 'devices'));
  await setDoc(docRef, device);
  return docRef.id;
};

export const updateDevice = async (deviceId: string, updates: Partial<Device>) => {
  const docRef = doc(db, 'devices', deviceId);
  await updateDoc(docRef, updates);
};

// ============================================================================
// TELEMETRY
// ============================================================================

export const getTelemetry = async (
  deviceId: string,
  limit: number = 100
): Promise<TelemetryReading[]> => {
  const q = query(
    collection(db, `telemetry/${deviceId}/readings`),
    where('timestamp', '>', Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
  );
  const snapshot = await getDocs(q);
  return snapshot.docs
    .map((doc) => ({ ...doc.data() } as TelemetryReading))
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, limit);
};

export const subscribeToTelemetry = (
  deviceId: string,
  callback: (readings: TelemetryReading[]) => void
): Unsubscribe => {
  const q = query(
    collection(db, `telemetry/${deviceId}/readings`),
    where('timestamp', '>', Date.now() - 1 * 60 * 60 * 1000) // Last hour
  );
  return onSnapshot(q, (snapshot) => {
    const readings = snapshot.docs
      .map((doc) => ({ ...doc.data() } as TelemetryReading))
      .sort((a, b) => b.timestamp - a.timestamp);
    callback(readings);
  });
};

// ============================================================================
// SCHEDULES
// ============================================================================

export const getSchedules = async (deviceId: string): Promise<Schedule[]> => {
  const q = query(
    collection(db, `devices/${deviceId}/schedules`),
    where('enabled', '==', true)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Schedule));
};

export const createSchedule = async (
  deviceId: string,
  schedule: Omit<Schedule, 'id'>
) => {
  const docRef = doc(collection(db, `devices/${deviceId}/schedules`));
  await setDoc(docRef, schedule);
  return docRef.id;
};

export const updateSchedule = async (
  deviceId: string,
  scheduleId: string,
  updates: Partial<Schedule>
) => {
  const docRef = doc(db, `devices/${deviceId}/schedules`, scheduleId);
  await updateDoc(docRef, updates);
};

export const deleteSchedule = async (deviceId: string, scheduleId: string) => {
  const docRef = doc(db, `devices/${deviceId}/schedules`, scheduleId);
  await deleteDoc(docRef);
};

// ============================================================================
// ALERTS
// ============================================================================

export const getAlerts = async (deviceId: string): Promise<Alert[]> => {
  const q = query(
    collection(db, `devices/${deviceId}/alerts`),
    where('acknowledged', '==', false)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Alert));
};

export const subscribeToAlerts = (
  deviceId: string,
  callback: (alerts: Alert[]) => void
): Unsubscribe => {
  const q = query(
    collection(db, `devices/${deviceId}/alerts`),
    where('acknowledged', '==', false)
  );
  return onSnapshot(q, (snapshot) => {
    const alerts = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    } as Alert));
    callback(alerts);
  });
};

export const acknowledgeAlert = async (
  deviceId: string,
  alertId: string
) => {
  const docRef = doc(db, `devices/${deviceId}/alerts`, alertId);
  await updateDoc(docRef, { acknowledged: true });
};

// ============================================================================
// PROPERTIES
// ============================================================================

export const getProperty = async (propertyId: string): Promise<Property | null> => {
  const docRef = doc(db, 'properties', propertyId);
  const snapshot = await getDoc(docRef);
  return snapshot.exists()
    ? ({ id: snapshot.id, ...snapshot.data() } as Property)
    : null;
};

export const getUserProperties = async (userId: string): Promise<Property[]> => {
  const q = query(
    collection(db, 'properties'),
    where('userId', '==', userId)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Property));
};
