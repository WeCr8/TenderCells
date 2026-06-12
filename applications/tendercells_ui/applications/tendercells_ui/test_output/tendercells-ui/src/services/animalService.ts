/**
 * Animal Service
 * Handles saving and retrieving animals/birds from Firestore
 * Links animals to properties and products
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase/firebaseApp';

const ANIMALS_COLLECTION = 'animals';

export type AnimalType = 'chicken' | 'duck' | 'goat' | 'rabbit' | 'turkey' | 'pigeon' | 'other';
export type AnimalStatus = 'active' | 'sick' | 'quarantine' | 'deceased' | 'sold';

export interface Animal {
  id?: string;
  userId: string;
  propertyId: string;
  productId?: string; // Optional link to product/coop
  name: string;
  type: AnimalType;
  breed?: string;
  age?: number; // in months
  status: AnimalStatus;
  gender?: 'male' | 'female' | 'unknown';
  rfidTag?: string;
  notes?: string;
  health?: {
    score?: number; // 0-100
    lastCheckup?: string;
    vaccinations?: string[];
  };
  metadata?: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateAnimalData {
  propertyId: string;
  productId?: string;
  name: string;
  type: AnimalType;
  breed?: string;
  age?: number;
  status?: AnimalStatus;
  gender?: 'male' | 'female' | 'unknown';
  rfidTag?: string;
  notes?: string;
  health?: {
    score?: number;
    lastCheckup?: string;
    vaccinations?: string[];
  };
  metadata?: Record<string, any>;
}

export interface UpdateAnimalData {
  name?: string;
  breed?: string;
  age?: number;
  status?: AnimalStatus;
  gender?: 'male' | 'female' | 'unknown';
  rfidTag?: string;
  notes?: string;
  health?: {
    score?: number;
    lastCheckup?: string;
    vaccinations?: string[];
  };
  productId?: string;
  metadata?: Record<string, any>;
}

class AnimalService {
  /**
   * Get all animals for a user
   */
  static async getUserAnimals(userId: string, filter?: {
    propertyId?: string;
    productId?: string;
    type?: AnimalType;
    status?: AnimalStatus;
  }): Promise<Animal[]> {
    try {
      // Check if db is available
      if (!db) {
        console.warn('Firestore database is not available. Cannot fetch animals.');
        return [];
      }

      const animalsRef = collection(db, ANIMALS_COLLECTION);
      let q = query(animalsRef, where('userId', '==', userId));

      // Apply filters if provided
      if (filter?.propertyId) {
        q = query(q, where('propertyId', '==', filter.propertyId));
      }
      if (filter?.productId) {
        q = query(q, where('productId', '==', filter.productId));
      }
      if (filter?.type) {
        q = query(q, where('type', '==', filter.type));
      }
      if (filter?.status) {
        q = query(q, where('status', '==', filter.status));
      }

      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt || new Date().toISOString(),
          updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt || new Date().toISOString(),
        } as Animal;
      });
    } catch (error: any) {
      // Handle permission errors gracefully
      if (error?.code === 'permission-denied' || error?.code === 'PERMISSION_DENIED') {
        console.warn('Permission denied when fetching animals. This may be due to Firestore security rules. Returning empty array.');
        return [];
      }
      console.error('Error fetching animals:', error);
      return [];
    }
  }

  /**
   * Get animals for a property
   */
  static async getPropertyAnimals(propertyId: string, userId: string): Promise<Animal[]> {
    return this.getUserAnimals(userId, { propertyId });
  }

  /**
   * Get animals for a product/coop
   */
  static async getProductAnimals(productId: string, userId: string): Promise<Animal[]> {
    return this.getUserAnimals(userId, { productId });
  }

  /**
   * Get a single animal by ID
   */
  static async getAnimal(animalId: string): Promise<Animal | null> {
    try {
      // Check if db is available
      if (!db) {
        console.warn('Firestore database is not available. Cannot fetch animal.');
        return null;
      }

      const animalRef = doc(db, ANIMALS_COLLECTION, animalId);
      const animalSnap = await getDoc(animalRef);

      if (!animalSnap.exists()) {
        return null;
      }

      const data = animalSnap.data();
      return {
        id: animalSnap.id,
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt || new Date().toISOString(),
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt || new Date().toISOString(),
      } as Animal;
    } catch (error: any) {
      // Handle permission errors gracefully
      if (error?.code === 'permission-denied' || error?.code === 'PERMISSION_DENIED') {
        console.warn('Permission denied when fetching animal. This may be due to Firestore security rules.');
        return null;
      }
      console.error('Error fetching animal:', error);
      return null;
    }
  }

  /**
   * Create a new animal
   */
  static async createAnimal(userId: string, data: CreateAnimalData): Promise<Animal> {
    try {
      // Check if db is available
      if (!db) {
        const errorMsg = 'Firestore database is not available. Cannot create animal.';
        console.error(errorMsg);
        throw new Error(errorMsg);
      }

      const animalsRef = collection(db, ANIMALS_COLLECTION);
      const now = Timestamp.now();

      const animalData = {
        ...data,
        userId,
        status: data.status || 'active',
        createdAt: now,
        updatedAt: now,
      };

      const docRef = await addDoc(animalsRef, animalData);

      return {
        id: docRef.id,
        ...data,
        userId,
        status: data.status || 'active',
        createdAt: now.toDate().toISOString(),
        updatedAt: now.toDate().toISOString(),
      };
    } catch (error: any) {
      // Handle permission errors with more specific messages
      if (error?.code === 'permission-denied' || error?.code === 'PERMISSION_DENIED') {
        const errorMsg = 'Permission denied. Please check your Firestore security rules to allow animal creation.';
        console.error(errorMsg, error);
        throw new Error(errorMsg);
      }
      console.error('Error creating animal:', error);
      const errorMessage = error?.message || 'Failed to create animal';
      throw new Error(errorMessage);
    }
  }

  /**
   * Update an existing animal
   */
  static async updateAnimal(animalId: string, data: UpdateAnimalData): Promise<void> {
    try {
      // Check if db is available
      if (!db) {
        const errorMsg = 'Firestore database is not available. Cannot update animal.';
        console.error(errorMsg);
        throw new Error(errorMsg);
      }

      const animalRef = doc(db, ANIMALS_COLLECTION, animalId);
      await updateDoc(animalRef, {
        ...data,
        updatedAt: Timestamp.now(),
      });
    } catch (error: any) {
      // Handle permission errors with more specific messages
      if (error?.code === 'permission-denied' || error?.code === 'PERMISSION_DENIED') {
        const errorMsg = 'Permission denied. Please check your Firestore security rules to allow animal updates.';
        console.error(errorMsg, error);
        throw new Error(errorMsg);
      }
      console.error('Error updating animal:', error);
      const errorMessage = error?.message || 'Failed to update animal';
      throw new Error(errorMessage);
    }
  }

  /**
   * Delete an animal
   */
  static async deleteAnimal(animalId: string): Promise<void> {
    try {
      // Check if db is available
      if (!db) {
        const errorMsg = 'Firestore database is not available. Cannot delete animal.';
        console.error(errorMsg);
        throw new Error(errorMsg);
      }

      const animalRef = doc(db, ANIMALS_COLLECTION, animalId);
      await deleteDoc(animalRef);
    } catch (error: any) {
      // Handle permission errors with more specific messages
      if (error?.code === 'permission-denied' || error?.code === 'PERMISSION_DENIED') {
        const errorMsg = 'Permission denied. Please check your Firestore security rules to allow animal deletion.';
        console.error(errorMsg, error);
        throw new Error(errorMsg);
      }
      console.error('Error deleting animal:', error);
      const errorMessage = error?.message || 'Failed to delete animal';
      throw new Error(errorMessage);
    }
  }

  /**
   * Move animal to a different product/coop
   */
  static async moveAnimalToProduct(animalId: string, productId: string): Promise<void> {
    await this.updateAnimal(animalId, { productId });
  }

  /**
   * Get animal count for a property
   */
  static async getPropertyAnimalCount(propertyId: string, userId: string): Promise<number> {
    const animals = await this.getPropertyAnimals(propertyId, userId);
    return animals.length;
  }

  /**
   * Get animal count for a product/coop
   */
  static async getProductAnimalCount(productId: string, userId: string): Promise<number> {
    const animals = await this.getProductAnimals(productId, userId);
    return animals.length;
  }
}

export { AnimalService };

