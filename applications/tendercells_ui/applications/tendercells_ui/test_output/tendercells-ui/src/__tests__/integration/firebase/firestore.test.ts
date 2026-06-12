import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mockFirestore, resetFirebaseMocks, addMockProduct, getMockProducts } from '../../../../tests/mocks/firebase';
import type { Product, RegisterProductData } from '../../../../types/products';
import { mockProducts, mockRegisterProductData } from '../../../../tests/fixtures/products';

describe('Firebase Firestore Integration', () => {
  beforeEach(() => {
    resetFirebaseMocks();
  });

  describe('CRUD Operations', () => {
    it('creates a product in Firestore', async () => {
      const collection = mockFirestore.collection('products');
      const docRef = collection.doc('new-product-id');
      
      const newProduct: Product = {
        ...mockProducts[0],
        id: 'new-product-id',
      };

      await docRef.set(newProduct);

      const products = getMockProducts();
      expect(products).toContainEqual(expect.objectContaining({ id: 'new-product-id' }));
    });

    it('reads a product from Firestore', async () => {
      addMockProduct(mockProducts[0]);

      const collection = mockFirestore.collection('products');
      const docRef = collection.doc(mockProducts[0].id);
      const doc = await docRef.get();

      expect(doc.exists).toBe(true);
      expect(doc.data()).toEqual(mockProducts[0]);
    });

    it('updates a product in Firestore', async () => {
      addMockProduct(mockProducts[0]);

      const collection = mockFirestore.collection('products');
      const docRef = collection.doc(mockProducts[0].id);
      
      const updateData = {
        product_name: 'Updated Product Name',
        location: 'Updated Location',
      };

      await docRef.update(updateData);

      const products = getMockProducts();
      const updatedProduct = products.find(p => p.id === mockProducts[0].id);
      expect(updatedProduct?.product_name).toBe('Updated Product Name');
      expect(updatedProduct?.location).toBe('Updated Location');
    });

    it('deletes a product from Firestore', async () => {
      addMockProduct(mockProducts[0]);

      const collection = mockFirestore.collection('products');
      const docRef = collection.doc(mockProducts[0].id);
      
      await docRef.delete();

      const products = getMockProducts();
      expect(products.find(p => p.id === mockProducts[0].id)).toBeUndefined();
    });

    it('queries products with filters', async () => {
      mockProducts.forEach(product => addMockProduct(product));

      const collection = mockFirestore.collection('products');
      const query = collection
        .where('product_type', '==', 'hardware_unit')
        .where('status', '==', 'connected')
        .orderBy('created_at')
        .limit(10);

      const snapshot = await query.get();
      const results = snapshot.docs.map(doc => doc.data());

      expect(results.length).toBeGreaterThan(0);
      expect(results.every(p => p.product_type === 'hardware_unit')).toBe(true);
    });
  });

  describe('Real-time Subscriptions', () => {
    it('subscribes to product changes', async () => {
      const collection = mockFirestore.collection('products');
      const docRef = collection.doc('test-product');
      
      const unsubscribe = docRef.onSnapshot((snapshot) => {
        expect(snapshot.docs).toBeDefined();
      });

      expect(typeof unsubscribe).toBe('function');
      
      // Cleanup
      unsubscribe();
    });

    it('receives real-time updates', async () => {
      const collection = mockFirestore.collection('products');
      const callback = vi.fn();

      const unsubscribe = collection.onSnapshot(callback);

      // Simulate data change
      addMockProduct(mockProducts[0]);

      // Callback should be called
      expect(callback).toHaveBeenCalled();

      unsubscribe();
    });
  });
});





