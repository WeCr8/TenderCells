/**
 * User Settings Service
 * Handles saving and retrieving user settings from Firestore
 */

import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase/firebaseApp';

const SETTINGS_COLLECTION = 'user_settings';

export interface UserSettings {
  userId: string;
  theme?: 'light' | 'dark' | 'auto';
  language?: string;
  timezone?: string;
  temperatureUnit?: 'celsius' | 'fahrenheit';
  notifications?: {
    email?: boolean;
    push?: boolean;
    sms?: boolean;
  };
  dataRetention?: string;
  autoBackup?: boolean;
  offlineMode?: boolean;
  syncFrequency?: string;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: any; // Allow additional settings
}

class UserSettingsService {
  /**
   * Get user settings
   */
  static async getUserSettings(userId: string): Promise<UserSettings | null> {
    try {
      // Check if db is available
      if (!db) {
        console.warn('Firestore database is not available. Cannot fetch user settings.');
        return null;
      }

      const settingsRef = doc(db, SETTINGS_COLLECTION, userId);
      const settingsSnap = await getDoc(settingsRef);

      if (!settingsSnap.exists()) {
        return null;
      }

      const data = settingsSnap.data();
      return {
        userId: settingsSnap.id,
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
      } as UserSettings;
    } catch (error: any) {
      // Handle permission errors gracefully
      if (error?.code === 'permission-denied' || error?.code === 'PERMISSION_DENIED') {
        console.warn('Permission denied when fetching user settings. This may be due to Firestore security rules.');
        return null;
      }
      console.error('Error fetching user settings:', error);
      return null;
    }
  }

  /**
   * Save user settings (creates or updates)
   */
  static async saveUserSettings(userId: string, settings: Partial<UserSettings>): Promise<void> {
    try {
      // Check if db is available
      if (!db) {
        const errorMsg = 'Firestore database is not available. Cannot save user settings.';
        console.error(errorMsg);
        throw new Error(errorMsg);
      }

      const settingsRef = doc(db, SETTINGS_COLLECTION, userId);
      const now = Timestamp.now();

      // Get existing settings to merge
      const existingSettings = await this.getUserSettings(userId);
      
      const settingsData = {
        userId,
        ...existingSettings,
        ...settings,
        updatedAt: now,
        createdAt: existingSettings?.createdAt ? Timestamp.fromDate(new Date(existingSettings.createdAt)) : now,
      };

      // Remove undefined values
      Object.keys(settingsData).forEach(key => {
        if (settingsData[key] === undefined) {
          delete settingsData[key];
        }
      });

      await setDoc(settingsRef, settingsData, { merge: true });
    } catch (error: any) {
      // Handle permission errors with more specific messages
      if (error?.code === 'permission-denied' || error?.code === 'PERMISSION_DENIED') {
        const errorMsg = 'Permission denied. Please check your Firestore security rules to allow settings updates.';
        console.error(errorMsg, error);
        throw new Error(errorMsg);
      }
      console.error('Error saving user settings:', error);
      const errorMessage = error?.message || 'Failed to save user settings';
      throw new Error(errorMessage);
    }
  }

  /**
   * Update a specific setting
   */
  static async updateSetting(userId: string, key: string, value: any): Promise<void> {
    await this.saveUserSettings(userId, { [key]: value });
  }
}

export { UserSettingsService };

