import { useState, useEffect, useCallback } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../lib/firebase/firebaseApp';
import { ProductsFirebaseService } from '../services/productsFirebaseService';
import { logger } from '../utils/logger';
import type {
  FirebaseProduct,
  CreateProductData,
  UpdateProductData,
} from '../services/productsFirebaseService';

interface ProductFilter {
  productType?: string;
  status?: string;
  connectionStatus?: string;
  propertyId?: string;
}

/**
 * Custom hook for managing product data using Firebase
 */
export function useProductsFirebase() {
  const [products, setProducts] = useState<FirebaseProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // Get userId from auth
  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid);
      } else {
        setUserId(null);
        setProducts([]);
      }
    });

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  const fetchProducts = useCallback(async (filter?: ProductFilter) => {
    if (!userId) {
      setProducts([]);
      setLoading(false);
      return;
    }

    try {
      logger.debug('useProductsFirebase: Fetching products', { filter, userId });
      setLoading(true);
      setError(null);
      const data = await ProductsFirebaseService.getUserProducts(userId, filter);
      
      // Ensure data is an array before setting state
      const productArray = Array.isArray(data) ? data : [];
      setProducts(productArray);
      logger.info('useProductsFirebase: Products fetched successfully', { count: productArray.length });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch products';
      logger.error('useProductsFirebase: Failed to fetch products', { error: err, filter });
      setError(errorMessage);
      // Set empty array on error to prevent map errors
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const createProduct = useCallback(async (data: CreateProductData): Promise<FirebaseProduct> => {
    if (!userId) {
      throw new Error('User must be authenticated to create products');
    }

    try {
      logger.info('useProductsFirebase: Creating product', { productName: data.productName });
      setError(null);
      const newProduct = await ProductsFirebaseService.createProduct(userId, data);
      setProducts(prev => [...prev, newProduct]);
      logger.success('useProductsFirebase: Product created successfully', { productId: newProduct.id });
      return newProduct;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create product';
      logger.error('useProductsFirebase: Failed to create product', { error: err, data });
      setError(errorMessage);
      throw err;
    }
  }, [userId]);

  const updateProduct = useCallback(async (id: string, updates: UpdateProductData): Promise<void> => {
    try {
      logger.info('useProductsFirebase: Updating product', { productId: id, updates });
      setError(null);
      // Optimistic update
      setProducts(prev =>
        prev.map(product =>
          product.id === id ? { ...product, ...updates } : product
        )
      );

      await ProductsFirebaseService.updateProduct(id, updates);
      
      // Refresh to get updated data
      await fetchProducts();
      logger.success('useProductsFirebase: Product updated successfully', { productId: id });
    } catch (err) {
      logger.error('useProductsFirebase: Failed to update product', { error: err, productId: id, updates });
      // Revert on error
      await fetchProducts();
      const errorMessage = err instanceof Error ? err.message : 'Failed to update product';
      setError(errorMessage);
      throw err;
    }
  }, [fetchProducts]);

  const deleteProduct = useCallback(async (id: string): Promise<void> => {
    try {
      logger.info('useProductsFirebase: Deleting product', { productId: id });
      setError(null);
      await ProductsFirebaseService.deleteProduct(id);
      setProducts(prev => prev.filter(product => product.id !== id));
      logger.success('useProductsFirebase: Product deleted successfully', { productId: id });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete product';
      logger.error('useProductsFirebase: Failed to delete product', { error: err, productId: id });
      setError(errorMessage);
      throw err;
    }
  }, []);

  const getProduct = useCallback(async (id: string): Promise<FirebaseProduct | null> => {
    try {
      return await ProductsFirebaseService.getProduct(id);
    } catch (err) {
      logger.error('useProductsFirebase: Failed to get product', { error: err, productId: id });
      return null;
    }
  }, []);

  const linkProductToProperty = useCallback(async (productId: string, propertyId: string): Promise<void> => {
    try {
      logger.info('useProductsFirebase: Linking product to property', { productId, propertyId });
      setError(null);
      await ProductsFirebaseService.linkProductToProperty(productId, propertyId);
      await fetchProducts();
      logger.success('useProductsFirebase: Product linked successfully', { productId, propertyId });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to link product to property';
      logger.error('useProductsFirebase: Failed to link product', { error: err, productId, propertyId });
      setError(errorMessage);
      throw err;
    }
  }, [fetchProducts]);

  const updateConnectionStatus = useCallback(async (
    productId: string,
    status: 'connected' | 'disconnected' | 'setup_required'
  ): Promise<void> => {
    try {
      logger.info('useProductsFirebase: Updating connection status', { productId, status });
      setError(null);
      await ProductsFirebaseService.updateConnectionStatus(productId, status);
      await fetchProducts();
      logger.success('useProductsFirebase: Connection status updated successfully', { productId, status });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update connection status';
      logger.error('useProductsFirebase: Failed to update connection status', { error: err, productId, status });
      setError(errorMessage);
      throw err;
    }
  }, [fetchProducts]);

  useEffect(() => {
    if (userId) {
      fetchProducts();
    }
  }, [userId, fetchProducts]);

  return {
    products,
    loading,
    error,
    userId,
    refetch: fetchProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    getProduct,
    linkProductToProperty,
    updateConnectionStatus,
  };
}

