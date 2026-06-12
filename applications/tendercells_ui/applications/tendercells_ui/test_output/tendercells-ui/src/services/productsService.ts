/**
 * Products Service
 * Handles all product-related API calls
 */

import type {
  Product,
  RegisterProductData,
  UpdateProductData,
  ConnectProductData,
  ProductStats,
  ProductFilter,
} from '../types/products';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

class ProductsService {
  private static getAuthHeaders(): HeadersInit {
    // In a real app, you'd get the token from auth context or storage
    const token = localStorage.getItem('auth_token');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  /**
   * Get all products for the current user
   */
  static async getUserProducts(filter?: ProductFilter): Promise<Product[]> {
    try {
      const params = new URLSearchParams();
      if (filter?.product_type) params.append('product_type', filter.product_type);
      if (filter?.status) params.append('status', filter.status);
      if (filter?.connection_status) params.append('connection_status', filter.connection_status);
      if (filter?.location) params.append('location', filter.location);

      const url = `${API_BASE_URL}/products${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        // If API endpoint doesn't exist, return empty array silently
        if (response.status === 404) {
          return [];
        }
        throw new Error(`Failed to fetch products: ${response.statusText}`);
      }

      // Check if response is JSON before parsing
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        // Response is not JSON (probably HTML error page)
        return [];
      }

      const data = await response.json();
      return Array.isArray(data) ? data : data.products || [];
    } catch (error) {
      // Only log if it's not a JSON parse error (which means API doesn't exist)
      if (error instanceof SyntaxError && error.message.includes('JSON')) {
        // API endpoint doesn't exist or returned HTML - this is expected in dev mode
        return [];
      }
      console.error('Error fetching products:', error);
      // Return empty array on error to prevent crashes
      return [];
    }
  }

  /**
   * Get product statistics
   */
  static async getProductStats(): Promise<ProductStats> {
    try {
      const response = await fetch(`${API_BASE_URL}/products/stats`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        // If API endpoint doesn't exist, return default stats
        if (response.status === 404) {
          return this.getDefaultStats();
        }
        throw new Error(`Failed to fetch product stats: ${response.statusText}`);
      }

      // Check if response is JSON before parsing
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        // Response is not JSON (probably HTML error page)
        return this.getDefaultStats();
      }

      return await response.json();
    } catch (error) {
      // Only log if it's not a JSON parse error (which means API doesn't exist)
      if (error instanceof SyntaxError && error.message.includes('JSON')) {
        // API endpoint doesn't exist or returned HTML - this is expected in dev mode
        return this.getDefaultStats();
      }
      console.error('Error fetching product stats:', error);
      // Return default stats on error
      return this.getDefaultStats();
    }
  }

  /**
   * Get default product stats
   */
  private static getDefaultStats(): ProductStats {
    return {
      total: 0,
      connected: 0,
      disconnected: 0,
      setup_required: 0,
      by_type: {
        hardware_unit: 0,
        automation_device: 0,
      },
    };
  }

  /**
   * Register a new product
   */
  static async registerProduct(data: RegisterProductData): Promise<Product> {
    const response = await fetch(`${API_BASE_URL}/products`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(error.message || 'Failed to register product');
    }

    return await response.json();
  }

  /**
   * Update an existing product
   */
  static async updateProduct(id: string, updates: UpdateProductData): Promise<Product> {
    const response = await fetch(`${API_BASE_URL}/products/${id}`, {
      method: 'PATCH',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(error.message || 'Failed to update product');
    }

    return await response.json();
  }

  /**
   * Delete a product
   */
  static async deleteProduct(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/products/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(error.message || 'Failed to delete product');
    }
  }

  /**
   * Connect a product (setup network and MQTT)
   */
  static async connectProduct(id: string, data: ConnectProductData): Promise<Product> {
    const response = await fetch(`${API_BASE_URL}/products/${id}/connect`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(error.message || 'Failed to connect product');
    }

    return await response.json();
  }

  /**
   * Disconnect a product
   */
  static async disconnectProduct(id: string): Promise<Product> {
    const response = await fetch(`${API_BASE_URL}/products/${id}/disconnect`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(error.message || 'Failed to disconnect product');
    }

    return await response.json();
  }

  /**
   * Link a device to a product
   */
  static async linkDeviceToProduct(productId: string, deviceId: string): Promise<Product> {
    const response = await fetch(`${API_BASE_URL}/products/${productId}/link-device`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ device_id: deviceId }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(error.message || 'Failed to link device to product');
    }

    return await response.json();
  }
}

export { ProductsService };
