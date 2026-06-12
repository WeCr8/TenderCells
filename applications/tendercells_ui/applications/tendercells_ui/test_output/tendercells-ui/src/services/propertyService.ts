/**
 * Property Service
 * Handles all property and placement-related Firebase operations
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
import type {
  Property,
  PropertyPlacement,
  CreatePropertyData,
  UpdatePropertyData,
  CreatePlacementData,
  UpdatePlacementData,
} from '../types/property';

const PROPERTIES_COLLECTION = 'properties';
const PLACEMENTS_COLLECTION = 'placements';

class PropertyService {
  /**
   * Get all properties for a user
   */
  static async getUserProperties(userId: string): Promise<Property[]> {
    try {
      // Check if db is available
      if (!db) {
        console.warn('Firestore database is not available. Returning empty properties array.');
        return [];
      }

      const propertiesRef = collection(db, PROPERTIES_COLLECTION);
      const q = query(propertiesRef, where('userId', '==', userId));
      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt || new Date().toISOString(),
        updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || doc.data().updatedAt || new Date().toISOString(),
      })) as Property[];
    } catch (error: any) {
      // Handle permission errors gracefully
      if (error?.code === 'permission-denied' || error?.code === 'PERMISSION_DENIED') {
        console.warn('Permission denied when fetching user properties. This may be due to Firestore security rules. Returning empty array.');
        return [];
      }
      // Log other errors but still return empty array to prevent app crash
      console.error('Error fetching user properties:', error);
      return [];
    }
  }

  /**
   * Get a single property by ID
   */
  static async getProperty(propertyId: string): Promise<Property | null> {
    try {
      // Check if db is available
      if (!db) {
        console.warn('Firestore database is not available. Cannot fetch property.');
        return null;
      }

      const propertyRef = doc(db, PROPERTIES_COLLECTION, propertyId);
      const propertySnap = await getDoc(propertyRef);

      if (!propertySnap.exists()) {
        return null;
      }

      const data = propertySnap.data();
      return {
        id: propertySnap.id,
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt || new Date().toISOString(),
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt || new Date().toISOString(),
      } as Property;
    } catch (error: any) {
      // Handle permission errors gracefully
      if (error?.code === 'permission-denied' || error?.code === 'PERMISSION_DENIED') {
        console.warn('Permission denied when fetching property. This may be due to Firestore security rules.');
        return null;
      }
      console.error('Error fetching property:', error);
      return null;
    }
  }

  /**
   * Create a new property
   */
  static async createProperty(userId: string, data: CreatePropertyData): Promise<Property> {
    try {
      // Check if db is available
      if (!db) {
        const errorMsg = 'Firestore database is not available. Cannot create property.';
        console.error(errorMsg);
        throw new Error(errorMsg);
      }

      const propertiesRef = collection(db, PROPERTIES_COLLECTION);
      const now = Timestamp.now();

      const propertyData = {
        ...data,
        userId,
        createdAt: now,
        updatedAt: now,
      };

      const docRef = await addDoc(propertiesRef, propertyData);

      return {
        id: docRef.id,
        ...data,
        userId,
        createdAt: now.toDate().toISOString(),
        updatedAt: now.toDate().toISOString(),
      };
    } catch (error: any) {
      // Handle permission errors with more specific messages
      if (error?.code === 'permission-denied' || error?.code === 'PERMISSION_DENIED') {
        const errorMsg = 'Permission denied. Please check your Firestore security rules to allow property creation.';
        console.error(errorMsg, error);
        throw new Error(errorMsg);
      }
      // Log and re-throw with more context
      console.error('Error creating property:', error);
      const errorMessage = error?.message || 'Failed to create property';
      throw new Error(errorMessage);
    }
  }

  /**
   * Update an existing property
   */
  static async updateProperty(propertyId: string, data: UpdatePropertyData): Promise<void> {
    try {
      // Check if db is available
      if (!db) {
        const errorMsg = 'Firestore database is not available. Cannot update property.';
        console.error(errorMsg);
        throw new Error(errorMsg);
      }

      const propertyRef = doc(db, PROPERTIES_COLLECTION, propertyId);
      await updateDoc(propertyRef, {
        ...data,
        updatedAt: Timestamp.now(),
      });
    } catch (error: any) {
      // Handle permission errors with more specific messages
      if (error?.code === 'permission-denied' || error?.code === 'PERMISSION_DENIED') {
        const errorMsg = 'Permission denied. Please check your Firestore security rules to allow property updates.';
        console.error(errorMsg, error);
        throw new Error(errorMsg);
      }
      console.error('Error updating property:', error);
      const errorMessage = error?.message || 'Failed to update property';
      throw new Error(errorMessage);
    }
  }

  /**
   * Delete a property
   */
  static async deleteProperty(propertyId: string): Promise<void> {
    try {
      // Check if db is available
      if (!db) {
        const errorMsg = 'Firestore database is not available. Cannot delete property.';
        console.error(errorMsg);
        throw new Error(errorMsg);
      }

      const propertyRef = doc(db, PROPERTIES_COLLECTION, propertyId);
      await deleteDoc(propertyRef);

      // Also delete all placements for this property
      const placementsRef = collection(db, PLACEMENTS_COLLECTION);
      const q = query(placementsRef, where('propertyId', '==', propertyId));
      const querySnapshot = await getDocs(q);

      const deletePromises = querySnapshot.docs.map((doc) => deleteDoc(doc.ref));
      await Promise.all(deletePromises);
    } catch (error: any) {
      // Handle permission errors with more specific messages
      if (error?.code === 'permission-denied' || error?.code === 'PERMISSION_DENIED') {
        const errorMsg = 'Permission denied. Please check your Firestore security rules to allow property deletion.';
        console.error(errorMsg, error);
        throw new Error(errorMsg);
      }
      console.error('Error deleting property:', error);
      const errorMessage = error?.message || 'Failed to delete property';
      throw new Error(errorMessage);
    }
  }

  /**
   * Get all placements for a property
   */
  static async getPropertyPlacements(propertyId: string): Promise<PropertyPlacement[]> {
    try {
      // Check if db is available
      if (!db) {
        console.warn('Firestore database is not available. Cannot fetch placements.');
        return [];
      }

      const placementsRef = collection(db, PLACEMENTS_COLLECTION);
      const q = query(placementsRef, where('propertyId', '==', propertyId));
      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt || new Date().toISOString(),
          updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
        } as PropertyPlacement;
      });
    } catch (error: any) {
      // Handle permission errors gracefully
      if (error?.code === 'permission-denied' || error?.code === 'PERMISSION_DENIED') {
        console.warn('Permission denied when fetching placements. This may be due to Firestore security rules. Returning empty array.');
        return [];
      }
      console.error('Error fetching placements:', error);
      return [];
    }
  }

  /**
   * Create a new placement
   */
  static async createPlacement(propertyId: string, data: CreatePlacementData): Promise<PropertyPlacement> {
    try {
      // Check if db is available
      if (!db) {
        const errorMsg = 'Firestore database is not available. Cannot create placement.';
        console.error(errorMsg);
        throw new Error(errorMsg);
      }

      const placementsRef = collection(db, PLACEMENTS_COLLECTION);
      const now = Timestamp.now();

      const placementData = {
        ...data,
        propertyId,
        rotation: data.rotation || 0,
        createdAt: now,
        updatedAt: now,
      };

      const docRef = await addDoc(placementsRef, placementData);

      return {
        id: docRef.id,
        ...data,
        propertyId,
        rotation: data.rotation || 0,
        createdAt: now.toDate().toISOString(),
        updatedAt: now.toDate().toISOString(),
      };
    } catch (error: any) {
      // Handle permission errors with more specific messages
      if (error?.code === 'permission-denied' || error?.code === 'PERMISSION_DENIED') {
        const errorMsg = 'Permission denied. Please check your Firestore security rules to allow placement creation.';
        console.error(errorMsg, error);
        throw new Error(errorMsg);
      }
      console.error('Error creating placement:', error);
      const errorMessage = error?.message || 'Failed to create placement';
      throw new Error(errorMessage);
    }
  }

  /**
   * Update an existing placement
   */
  static async updatePlacement(placementId: string, data: UpdatePlacementData): Promise<void> {
    try {
      // Check if db is available
      if (!db) {
        const errorMsg = 'Firestore database is not available. Cannot update placement.';
        console.error(errorMsg);
        throw new Error(errorMsg);
      }

      const placementRef = doc(db, PLACEMENTS_COLLECTION, placementId);
      await updateDoc(placementRef, {
        ...data,
        updatedAt: Timestamp.now(),
      });
    } catch (error: any) {
      // Handle permission errors with more specific messages
      if (error?.code === 'permission-denied' || error?.code === 'PERMISSION_DENIED') {
        const errorMsg = 'Permission denied. Please check your Firestore security rules to allow placement updates.';
        console.error(errorMsg, error);
        throw new Error(errorMsg);
      }
      console.error('Error updating placement:', error);
      const errorMessage = error?.message || 'Failed to update placement';
      throw new Error(errorMessage);
    }
  }

  /**
   * Delete a placement
   */
  static async deletePlacement(placementId: string): Promise<void> {
    try {
      // Check if db is available
      if (!db) {
        const errorMsg = 'Firestore database is not available. Cannot delete placement.';
        console.error(errorMsg);
        throw new Error(errorMsg);
      }

      const placementRef = doc(db, PLACEMENTS_COLLECTION, placementId);
      await deleteDoc(placementRef);
    } catch (error: any) {
      // Handle permission errors with more specific messages
      if (error?.code === 'permission-denied' || error?.code === 'PERMISSION_DENIED') {
        const errorMsg = 'Permission denied. Please check your Firestore security rules to allow placement deletion.';
        console.error(errorMsg, error);
        throw new Error(errorMsg);
      }
      console.error('Error deleting placement:', error);
      const errorMessage = error?.message || 'Failed to delete placement';
      throw new Error(errorMessage);
    }
  }

  /**
   * Place a product on a property (convenience method)
   * Creates both the product and placement in one operation
   */
  static async placeProductOnProperty(
    userId: string,
    propertyId: string,
    productData: {
      productType: string;
      productName: string;
      nickname?: string;
      location?: string;
      x?: number;
      y?: number;
      width?: number;
      height?: number;
      rotation?: number;
      hardwareMode?: 'sim' | 'hardware';
      metadata?: Record<string, any>;
    }
  ): Promise<{ productId: string; placementId: string }> {
    try {
      // Import ProductsFirebaseService dynamically to avoid circular dependencies
      const { ProductsFirebaseService } = await import('./productsFirebaseService');

      // Create product
      const product = await ProductsFirebaseService.createProduct(userId, {
        productType: productData.productType,
        productName: productData.productName,
        nickname: productData.nickname,
        location: productData.location,
        hardwareMode: productData.hardwareMode || 'sim',
        propertyId: propertyId,
        metadata: productData.metadata,
      });

      if (!product.id) {
        throw new Error('Failed to create product: missing product ID');
      }

      // Create placement
      const placement = await this.createPlacement(propertyId, {
        productId: product.id,
        productType: productData.productType,
        x: productData.x || 50,
        y: productData.y || 50,
        width: productData.width || 3,
        height: productData.height || 3,
        rotation: productData.rotation || 0,
        nickname: productData.nickname,
      });

      // Update product with placement ID
      await ProductsFirebaseService.updateProduct(product.id, {
        placementId: placement.id,
      } as any);

      return {
        productId: product.id,
        placementId: placement.id,
      };
    } catch (error: any) {
      console.error('Error placing product on property:', error);
      const errorMessage = error?.message || 'Failed to place product on property';
      throw new Error(errorMessage);
    }
  }
}

export { PropertyService };
