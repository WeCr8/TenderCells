/**
 * User Account Service
 * Handles saving and retrieving user account/profile data from Firestore
 */

import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase/firebaseApp';

const ACCOUNTS_COLLECTION = 'accounts';
const USERS_COLLECTION = 'users';

export interface UserAccount {
  userId: string;
  email?: string;
  displayName?: string;
  phone?: string;
  location?: string;
  bio?: string;
  avatarUrl?: string;
  preferences?: {
    notifications?: {
      email?: boolean;
      push?: boolean;
      sms?: boolean;
    };
    privacy?: {
      profileVisible?: boolean;
      dataSharing?: boolean;
    };
  };
  createdAt?: string;
  updatedAt?: string;
  [key: string]: any; // Allow additional account fields
}

class UserAccountService {
  /**
   * Get user account data
   */
  static async getUserAccount(userId: string): Promise<UserAccount | null> {
    try {
      // Check if db is available
      if (!db) {
        console.warn('Firestore database is not available. Cannot fetch user account.');
        return null;
      }

      // Try accounts collection first, then users collection
      let accountRef = doc(db, ACCOUNTS_COLLECTION, userId);
      let accountSnap = await getDoc(accountRef);

      if (!accountSnap.exists()) {
        // Try users collection as fallback
        accountRef = doc(db, USERS_COLLECTION, userId);
        accountSnap = await getDoc(accountRef);
      }

      if (!accountSnap.exists()) {
        return null;
      }

      const data = accountSnap.data();
      return {
        userId: accountSnap.id,
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
      } as UserAccount;
    } catch (error: any) {
      // Handle permission errors gracefully
      if (error?.code === 'permission-denied' || error?.code === 'PERMISSION_DENIED') {
        console.warn('Permission denied when fetching user account. This may be due to Firestore security rules.');
        return null;
      }
      console.error('Error fetching user account:', error);
      return null;
    }
  }

  /**
   * Save user account data (creates or updates)
   */
  static async saveUserAccount(userId: string, accountData: Partial<UserAccount>): Promise<void> {
    try {
      // Check if db is available
      if (!db) {
        const errorMsg = 'Firestore database is not available. Cannot save user account.';
        console.error(errorMsg);
        throw new Error(errorMsg);
      }

      const accountRef = doc(db, ACCOUNTS_COLLECTION, userId);
      const now = Timestamp.now();

      // Get existing account data to merge
      const existingAccount = await this.getUserAccount(userId);
      
      const accountDataToSave = {
        userId,
        ...existingAccount,
        ...accountData,
        updatedAt: now,
        createdAt: existingAccount?.createdAt ? Timestamp.fromDate(new Date(existingAccount.createdAt)) : now,
      };

      // Remove undefined values
      Object.keys(accountDataToSave).forEach(key => {
        if (accountDataToSave[key] === undefined) {
          delete accountDataToSave[key];
        }
      });

      await setDoc(accountRef, accountDataToSave, { merge: true });
    } catch (error: any) {
      // Handle permission errors with more specific messages
      if (error?.code === 'permission-denied' || error?.code === 'PERMISSION_DENIED') {
        const errorMsg = 'Permission denied. Please check your Firestore security rules to allow account updates.';
        console.error(errorMsg, error);
        throw new Error(errorMsg);
      }
      console.error('Error saving user account:', error);
      const errorMessage = error?.message || 'Failed to save user account';
      throw new Error(errorMessage);
    }
  }

  /**
   * Update user profile
   */
  static async updateProfile(userId: string, profile: Partial<UserAccount>): Promise<void> {
    await this.saveUserAccount(userId, profile);
  }
}

export { UserAccountService };

