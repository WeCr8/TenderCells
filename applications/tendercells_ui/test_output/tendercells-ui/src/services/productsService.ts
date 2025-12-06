import type {
  Product,
  RegisterProductData,
  UpdateProductData,
  ConnectProductData,
  ProductStats,
  ProductFilter,
  RegistrationMethod,
} from '../types/products';

/**
 * Service for managing products
 * Uses Supabase client or API endpoints
 */
export class ProductsService {
  private static readonly ENDPOINTS = {
    PRODUCTS: '/products',
    PRODUCT_BY_ID: (id: string) => `/products/${id}`,
    PRODUCT_VALIDATE: '/products/validate',
    PRODUCT_CONNECT: (id: string) => `/products/${id}/connect`,
    PRODUCT_DISCONNECT: (id: string) => `/products/${id}/disconnect`,
    PRODUCT_STATS: '/products/stats',
    PRODUCT_LINK_DEVICE: (id: string) => `/products/${id}/link-device`,
  };

  private static async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    // TODO: Replace with actual API client (Supabase or custom API)
    const response = await fetch(endpoint, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  }

  /**
   * Register a new product
   */
  static async registerProduct(data: RegisterProductData): Promise<Product> {
    return this.request<Product>(this.ENDPOINTS.PRODUCTS, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Get all products for the current user with optional filtering
   */
  static async getUserProducts(filter?: ProductFilter): Promise<Product[]> {
    const params = new URLSearchParams();
    
    if (filter) {
      if (filter.product_type) params.append('product_type', filter.product_type.join(','));
      if (filter.status) params.append('status', filter.status.join(','));
      if (filter.connection_status) params.append('connection_status', filter.connection_status.join(','));
      if (filter.location) params.append('location', filter.location.join(','));
      if (filter.search) params.append('search', filter.search);
    }

    const queryString = params.toString();
    const endpoint = queryString ? `${this.ENDPOINTS.PRODUCTS}?${queryString}` : this.ENDPOINTS.PRODUCTS;
    
    return this.request<Product[]>(endpoint);
  }

  /**
   * Get a specific product by ID
   */
  static async getProduct(id: string): Promise<Product> {
    return this.request<Product>(this.ENDPOINTS.PRODUCT_BY_ID(id));
  }

  /**
   * Update a product
   */
  static async updateProduct(id: string, data: UpdateProductData): Promise<Product> {
    return this.request<Product>(this.ENDPOINTS.PRODUCT_BY_ID(id), {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  /**
   * Delete a product
   */
  static async deleteProduct(id: string): Promise<void> {
    return this.request<void>(this.ENDPOINTS.PRODUCT_BY_ID(id), {
      method: 'DELETE',
    });
  }

  /**
   * Validate a registration code (serial number, QR code, or activation code)
   */
  static async validateRegistrationCode(
    code: string,
    method: RegistrationMethod
  ): Promise<{ valid: boolean; productInfo?: Partial<Product>; error?: string }> {
    return this.request<{ valid: boolean; productInfo?: Partial<Product>; error?: string }>(
      this.ENDPOINTS.PRODUCT_VALIDATE,
      {
        method: 'POST',
        body: JSON.stringify({ code, method }),
      }
    );
  }

  /**
   * Connect a product (initiate connection setup)
   */
  static async connectProduct(id: string, data: ConnectProductData): Promise<Product> {
    return this.request<Product>(this.ENDPOINTS.PRODUCT_CONNECT(id), {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Disconnect a product
   */
  static async disconnectProduct(id: string): Promise<Product> {
    return this.request<Product>(this.ENDPOINTS.PRODUCT_DISCONNECT(id), {
      method: 'POST',
      body: JSON.stringify({}),
    });
  }

  /**
   * Get product statistics
   */
  static async getProductStats(): Promise<ProductStats> {
    return this.request<ProductStats>(this.ENDPOINTS.PRODUCT_STATS);
  }

  /**
   * Link an automation device to a product
   */
  static async linkDeviceToProduct(productId: string, deviceId: string): Promise<Product> {
    return this.request<Product>(this.ENDPOINTS.PRODUCT_LINK_DEVICE(productId), {
      method: 'POST',
      body: JSON.stringify({ deviceId }),
    });
  }
}

