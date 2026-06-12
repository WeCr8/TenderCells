// settingsService.ts -- Firestore CRUD for per-user settings
// Document: /users/{uid}/settings
import { db } from "../lib/firebase/firebaseApp";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { auth } from "../lib/firebase/firebaseApp";
import { updateProfile, updatePassword as fbUpdatePassword, EmailAuthProvider, reauthenticateWithCredential, deleteUser } from "firebase/auth";

export interface NotificationSettings {
  predatorAlert: boolean;
  faultAlert: boolean;
  healthNotice: boolean;
  emailNotifications: boolean;
}

export interface ThresholdSettings {
  tempMinF: number;
  tempMaxF: number;
  ammoniaWarningPpm: number;
  ammoniaCriticalPpm: number;
  feedLowPct: number;
  waterLowPct: number;
}

export interface MqttSettings {
  customBrokerUrl: string;
  customPort: number;
}

export interface AppPreferences {
  temperatureUnit: "F" | "C";
  timezone: string;
}

export interface UserSettings {
  notifications: NotificationSettings;
  thresholds: ThresholdSettings;
  mqtt: MqttSettings;
  preferences: AppPreferences;
  updatedAt?: number;
}

export const DEFAULT_SETTINGS: UserSettings = {
  notifications: {
    predatorAlert: true,
    faultAlert: true,
    healthNotice: true,
    emailNotifications: false,
  },
  thresholds: {
    tempMinF: 35,
    tempMaxF: 85,
    ammoniaWarningPpm: 10,
    ammoniaCriticalPpm: 25,
    feedLowPct: 20,
    waterLowPct: 15,
  },
  mqtt: {
    customBrokerUrl: "",
    customPort: 1883,
  },
  preferences: {
    temperatureUnit: "F",
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  },
};

function settingsRef(uid: string) {
  return doc(db, "users", uid, "settings", "prefs");
}

export const settingsService = {
  async getSettings(uid: string): Promise<UserSettings> {
    const snap = await getDoc(settingsRef(uid));
    if (!snap.exists()) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...(snap.data() as UserSettings) };
  },

  async saveSettings(uid: string, settings: UserSettings): Promise<void> {
    await setDoc(settingsRef(uid), { ...settings, updatedAt: Date.now() }, { merge: true });
  },

  async patchSettings(uid: string, patch: Partial<UserSettings>): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await updateDoc(settingsRef(uid), { ...patch, updatedAt: Date.now() } as any);
  },

  async updateDisplayName(displayName: string): Promise<void> {
    const user = auth.currentUser;
    if (!user) throw new Error("Not authenticated");
    await updateProfile(user, { displayName });
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    const user = auth.currentUser;
    if (!user || !user.email) throw new Error("Not authenticated");
    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(user, credential);
    await fbUpdatePassword(user, newPassword);
  },

  async deleteAccount(currentPassword: string): Promise<void> {
    const user = auth.currentUser;
    if (!user || !user.email) throw new Error("Not authenticated");
    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(user, credential);
    await deleteUser(user);
  },
};
