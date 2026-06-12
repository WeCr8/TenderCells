/**
 * Products Firebase Service
 * Handles saving and retrieving products directly from Firestore
 * This is a Firebase-native alternative to the API-based ProductsService
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

const PRODUCTS_COLLECTION = 'products';

export interface FirebaseProduct {
  id?: string;
  userId: string;
  productType: string;
  productName: string;
  model?: string;
  serialNumber?: string;
  location?: string;
  nickname?: string;
  status?: 'active' | 'inactive' | 'maintenance';
  connectionStatus?: 'connected' | 'disconnected' | 'setup_required';
  hardwareMode?: 'sim' | 'hardware';
  propertyId?: string;
  placementId?: string;
  metadata?: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateProductData {
  productType: string;
  productName: string;
  model?: string;
  serialNumber?: string;
  location?: string;
  nickname?: string;
  hardwareMode?: 'sim' | 'hardware';
  propertyId?: string;
  metadata?: Record<string, any>;
}

export interface UpdateProductData {
  productName?: string;
  location?: string;
  nickname?: string;
  status?: 'active' | 'inactive' | 'maintenance';
  connectionStatus?: 'connected' | 'disconnected' | 'setup_required';
  hardwareMode?: 'sim' | 'hardware';
  metadata?: Record<string, any>;
}

class ProductsFirebaseService {
  /**
   * Get all products for a user
   */
  static async getUserProducts(userId: string, filter?: {
    productType?: string;
    status?: string;
    connectionStatus?: string;
    propertyId?: string;
  }): Promise<FirebaseProduct[]> {
    try {
      // Check if db is available
      if (!db) {
        console.warn('Firestore database is not available. Cannot fetch products.');
        return [];
      }

      const productsRef = collection(db, PRODUCTS_COLLECTION);
      let q = query(productsRef, where('userId', '==', userId));

      // Apply filters if provided
      if (filter?.productType) {
        q = query(q, where('productType', '==', filter.productType));
      }
      if (filter?.status) {
        q = query(q, where('status', '==', filter.status));
      }
      if (filter?.connectionStatus) {
        q = query(q, where('connectionStatus', '==', filter.connectionStatus));
      }
      if (filter?.propertyId) {
        q = query(q, where('propertyId', '==', filter.propertyId));
      }

      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt || new Date().toISOString(),
          updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt || new Date().toISOString(),
        } as FirebaseProduct;
      });
    } catch (error: any) {
      // Handle permission errors gracefully
      if (error?.code === 'permission-denied' || error?.code === 'PERMISSION_DENIED') {
        console.warn('Permission denied when fetching user products. This may be due to Firestore security rules. Returning empty array.');
        return [];
      }
      console.error('Error fetching user products:', error);
      return [];
    }
  }

  /**
   * Get a single product by ID
   */
  static async getProduct(productId: string): Promise<FirebaseProduct | null> {
    try {
      // Check if db is available
      if (!db) {
        console.warn('Firestore database is not available. Cannot fetch product.');
        return null;
      }

      const productRef = doc(db, PRODUCTS_COLLECTION, productId);
      const productSnap = await getDoc(productRef);

      if (!productSnap.exists()) {
        return null;
      }

      const data = productSnap.data();
      return {
        id: productSnap.id,
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt || new Date().toISOString(),
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt || new Date().toISOString(),
      } as FirebaseProduct;
    } catch (error: any) {
      // Handle permission errors gracefully
      if (error?.code === 'permission-denied' || error?.code === 'PERMISSION_DENIED') {
        console.warn('Permission denied when fetching product. This may be due to Firestore security rules.');
        return null;
      }
      console.error('Error fetching product:', error);
      return null;
    }
  }

  /**
   * Create a new product
   */
  static async createProduct(userId: string, data: CreateProductData): Promise<FirebaseProduct> {
    try {
      // Check if db is available
      if (!db) {
        const errorMsg = 'Firestore database is not available. Cannot create product.';
        console.error(errorMsg);
        throw new Error(errorMsg);
      }

      const productsRef = collection(db, PRODUCTS_COLLECTION);
      const now = Timestamp.now();

      const productData = {
        ...data,
        userId,
        status: 'active',
        connectionStatus: 'setup_required',
        hardwareMode: data.hardwareMode || 'sim',
        createdAt: now,
        updatedAt: now,
      };

      const docRef = await addDoc(productsRef, productData);

      return {
        id: docRef.id,
        ...data,
        userId,
        status: 'active',
        connectionStatus: 'setup_required',
        hardwareMode: data.hardwareMode || 'sim',
        createdAt: now.toDate().toISOString(),
        updatedAt: now.toDate().toISOString(),
      };
    } catch (error: any) {
      // Handle permission errors with more specific messages
      if (error?.code === 'permission-denied' || error?.code === 'PERMISSION_DENIED') {
        const errorMsg = 'Permission denied. Please check your Firestore security rules to allow product creation.';
        console.error(errorMsg, error);
        throw new Error(errorMsg);
      }
      console.error('Error creating product:', error);
      const errorMessage = error?.message || 'Failed to create product';
      throw new Error(errorMessage);
    }
  }

  /**
   * Update an existing product
   */
  static async updateProduct(productId: string, data: UpdateProductData): Promise<void> {
    try {
      // Check if db is available
      if (!db) {
        const errorMsg = 'Firestore database is not available. Cannot update product.';
        console.error(errorMsg);
        throw new Error(errorMsg);
      }

      const productRef = doc(db, PRODUCTS_COLLECTION, productId);
      await updateDoc(productRef, {
        ...data,
        updatedAt: Timestamp.now(),
      });
    } catch (error: any) {
      // Handle permission errors with more specific messages
      if (error?.code === 'permission-denied' || error?.code === 'PERMISSION_DENIED') {
        const errorMsg = 'Permission denied. Please check your Firestore security rules to allow product updates.';
        console.error(errorMsg, error);
        throw new Error(errorMsg);
      }
      console.error('Error updating product:', error);
      const errorMessage = error?.message || 'Failed to update product';
      throw new Error(errorMessage);
    }
  }

  /**
   * Delete a product
   */
  static async deleteProduct(productId: string): Promise<void> {
    try {
      // Check if db is available
      if (!db) {
        const errorMsg = 'Firestore database is not available. Cannot delete product.';
        console.error(errorMsg);
        throw new Error(errorMsg);
      }

      const productRef = doc(db, PRODUCTS_COLLECTION, productId);
      await deleteDoc(productRef);
    } catch (error: any) {
      // Handle permission errors with more specific messages
      if (error?.code === 'permission-denied' || error?.code === 'PERMISSION_DENIED') {
        const errorMsg = 'Permission denied. Please check your Firestore security rules to allow product deletion.';
        console.error(errorMsg, error);
        throw new Error(errorMsg);
      }
      console.error('Error deleting product:', error);
      const errorMessage = error?.message || 'Failed to delete product';
      throw new Error(errorMessage);
    }
  }

  /**
   * Link a product to a property
   */
  static async linkProductToProperty(productId: string, propertyId: string): Promise<void> {
    await this.updateProduct(productId, { propertyId } as UpdateProductData);
  }

  /**
   * Update product connection status
   */
  static async updateConnectionStatus(
    productId: string,
    connectionStatus: 'connected' | 'disconnected' | 'setup_required'
  ): Promise<void> {
    await this.updateProduct(productId, { connectionStatus });
  }
}

export { ProductsFirebaseService };

