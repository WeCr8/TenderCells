import { useState, useEffect, useCallback } from 'react';
import { ProductsService } from '../services/productsService';
import { logger } from '../utils/logger';
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
      logger.debug('useProducts: Fetching products', { filter });
      setLoading(true);
      setError(null);
      const data = await ProductsService.getUserProducts(filter);
      
      // Ensure data is an array before setting state
      const productArray = Array.isArray(data) ? data : [];
      setProducts(productArray);
      logger.info('useProducts: Products fetched successfully', { count: productArray.length });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch products';
      logger.error('useProducts: Failed to fetch products', { error: err, filter });
      setError(errorMessage);
      // Set empty array on error to prevent map errors
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      logger.debug('useProducts: Fetching product stats');
      const statsData = await ProductsService.getProductStats();
      setStats(statsData);
      logger.info('useProducts: Product stats fetched successfully');
    } catch (err) {
      logger.error('useProducts: Failed to fetch product stats', { error: err });
      console.error('Failed to fetch product stats:', err);
    }
  }, []);

  const registerProduct = useCallback(async (data: RegisterProductData): Promise<Product> => {
    try {
      logger.info('useProducts: Registering product', { productName: data.product_name });
      setError(null);
      const newProduct = await ProductsService.registerProduct(data);
      setProducts(prev => [...prev, newProduct]);
      await fetchStats(); // Refresh stats
      logger.success('useProducts: Product registered successfully', { productId: newProduct.id });
      return newProduct;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to register product';
      logger.error('useProducts: Failed to register product', { error: err, data });
      setError(errorMessage);
      throw err;
    }
  }, [fetchStats]);

  const updateProduct = useCallback(async (id: string, updates: UpdateProductData): Promise<Product> => {
    try {
      logger.info('useProducts: Updating product', { productId: id, updates });
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
      logger.success('useProducts: Product updated successfully', { productId: id });
      return updatedProduct;
    } catch (err) {
      logger.error('useProducts: Failed to update product', { error: err, productId: id, updates });
      // Revert on error
      await fetchProducts();
      const errorMessage = err instanceof Error ? err.message : 'Failed to update product';
      setError(errorMessage);
      throw err;
    }
  }, [products, fetchProducts, fetchStats]);

  const deleteProduct = useCallback(async (id: string): Promise<void> => {
    try {
      logger.info('useProducts: Deleting product', { productId: id });
      setError(null);
      await ProductsService.deleteProduct(id);
      setProducts(prev => prev.filter(product => product.id !== id));
      await fetchStats(); // Refresh stats
      logger.success('useProducts: Product deleted successfully', { productId: id });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete product';
      logger.error('useProducts: Failed to delete product', { error: err, productId: id });
      setError(errorMessage);
      throw err;
    }
  }, [fetchStats]);

  const connectProduct = useCallback(async (id: string, data: ConnectProductData): Promise<Product> => {
    try {
      logger.info('useProducts: Connecting product', { productId: id });
      setError(null);
      const connectedProduct = await ProductsService.connectProduct(id, data);
      setProducts(prev =>
        prev.map(product =>
          product.id === id ? connectedProduct : product
        )
      );
      await fetchStats(); // Refresh stats
      logger.success('useProducts: Product connected successfully', { productId: id });
      return connectedProduct;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to connect product';
      logger.error('useProducts: Failed to connect product', { error: err, productId: id });
      setError(errorMessage);
      throw err;
    }
  }, [fetchStats]);

  const disconnectProduct = useCallback(async (id: string): Promise<Product> => {
    try {
      logger.info('useProducts: Disconnecting product', { productId: id });
      setError(null);
      const disconnectedProduct = await ProductsService.disconnectProduct(id);
      setProducts(prev =>
        prev.map(product =>
          product.id === id ? disconnectedProduct : product
        )
      );
      await fetchStats(); // Refresh stats
      logger.success('useProducts: Product disconnected successfully', { productId: id });
      return disconnectedProduct;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to disconnect product';
      logger.error('useProducts: Failed to disconnect product', { error: err, productId: id });
      setError(errorMessage);
      throw err;
    }
  }, [fetchStats]);

  const linkDeviceToProduct = useCallback(async (productId: string, deviceId: string): Promise<Product> => {
    try {
      logger.info('useProducts: Linking device to product', { productId, deviceId });
      setError(null);
      const updatedProduct = await ProductsService.linkDeviceToProduct(productId, deviceId);
      setProducts(prev =>
        prev.map(product =>
          product.id === productId ? updatedProduct : product
        )
      );
      logger.success('useProducts: Device linked successfully', { productId, deviceId });
      return updatedProduct;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to link device to product';
      logger.error('useProducts: Failed to link device to product', { error: err, productId, deviceId });
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
