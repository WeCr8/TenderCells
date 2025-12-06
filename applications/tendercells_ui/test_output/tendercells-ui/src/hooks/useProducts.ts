import { useState, useEffect, useCallback } from 'react';
import { ProductsService } from '../services/productsService';
import type {
  Product,
  RegisterProductData,
  UpdateProductData,
  ConnectProductData,
  ProductStats,
  ProductFilter,
} from '../types/products';

/**
 * Custom hook for managing product data
 */
export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [stats, setStats] = useState<ProductStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async (filter?: ProductFilter) => {
    try {
      setLoading(true);
      setError(null);
      const data = await ProductsService.getUserProducts(filter);
      
      // Ensure data is an array before setting state
      const productArray = Array.isArray(data) ? data : [];
      setProducts(productArray);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch products');
      // Set empty array on error to prevent map errors
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const statsData = await ProductsService.getProductStats();
      setStats(statsData);
    } catch (err) {
      console.error('Failed to fetch product stats:', err);
    }
  }, []);

  const registerProduct = useCallback(async (data: RegisterProductData): Promise<Product> => {
    try {
      setError(null);
      const newProduct = await ProductsService.registerProduct(data);
      setProducts(prev => [...prev, newProduct]);
      await fetchStats(); // Refresh stats
      return newProduct;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to register product';
      setError(errorMessage);
      throw err;
    }
  }, [fetchStats]);

  const updateProduct = useCallback(async (id: string, updates: UpdateProductData): Promise<Product> => {
    try {
      setError(null);
      // Optimistic update
      const existingProduct = products.find(p => p.id === id);
      if (existingProduct) {
        setProducts(prev =>
          prev.map(product =>
            product.id === id ? { ...product, ...updates } : product
          )
        );
      }

      const updatedProduct = await ProductsService.updateProduct(id, updates);
      setProducts(prev =>
        prev.map(product =>
          product.id === id ? updatedProduct : product
        )
      );
      await fetchStats(); // Refresh stats
      return updatedProduct;
    } catch (err) {
      // Revert on error
      await fetchProducts();
      const errorMessage = err instanceof Error ? err.message : 'Failed to update product';
      setError(errorMessage);
      throw err;
    }
  }, [products, fetchProducts, fetchStats]);

  const deleteProduct = useCallback(async (id: string): Promise<void> => {
    try {
      setError(null);
      await ProductsService.deleteProduct(id);
      setProducts(prev => prev.filter(product => product.id !== id));
      await fetchStats(); // Refresh stats
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete product';
      setError(errorMessage);
      throw err;
    }
  }, [fetchStats]);

  const connectProduct = useCallback(async (id: string, data: ConnectProductData): Promise<Product> => {
    try {
      setError(null);
      const connectedProduct = await ProductsService.connectProduct(id, data);
      setProducts(prev =>
        prev.map(product =>
          product.id === id ? connectedProduct : product
        )
      );
      await fetchStats(); // Refresh stats
      return connectedProduct;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to connect product';
      setError(errorMessage);
      throw err;
    }
  }, [fetchStats]);

  const disconnectProduct = useCallback(async (id: string): Promise<Product> => {
    try {
      setError(null);
      const disconnectedProduct = await ProductsService.disconnectProduct(id);
      setProducts(prev =>
        prev.map(product =>
          product.id === id ? disconnectedProduct : product
        )
      );
      await fetchStats(); // Refresh stats
      return disconnectedProduct;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to disconnect product';
      setError(errorMessage);
      throw err;
    }
  }, [fetchStats]);

  const linkDeviceToProduct = useCallback(async (productId: string, deviceId: string): Promise<Product> => {
    try {
      setError(null);
      const updatedProduct = await ProductsService.linkDeviceToProduct(productId, deviceId);
      setProducts(prev =>
        prev.map(product =>
          product.id === productId ? updatedProduct : product
        )
      );
      return updatedProduct;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to link device to product';
      setError(errorMessage);
      throw err;
    }
  }, []);

  useEffect(() => {
    fetchProducts();
    fetchStats();
  }, [fetchProducts, fetchStats]);

  return {
    products,
    stats,
    loading,
    error,
    refetch: fetchProducts,
    registerProduct,
    updateProduct,
    deleteProduct,
    connectProduct,
    disconnectProduct,
    linkDeviceToProduct,
  };
}

