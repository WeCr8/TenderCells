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
  private static readonly API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';
  private static readonly DEV_PRODUCTS_KEY = 'tendercells_dev_products';
  static readonly GARAGE_OWNER_EMAIL = 'zgoodbody@gmail.com';
  static readonly FIRST_COOP_PRODUCT_ID = 'garage-chicken-tender-001';
  static readonly FIRST_COOP_DEVICE_ID = 'ct_001';
  static readonly FIRST_COOP_SERIAL = 'TC-CT-GARAGE-0001';

  private static readonly ENDPOINTS = {
    PRODUCTS: '/products',
    PRODUCT_BY_ID: (id: string) => `/products/${id}`,
    PRODUCT_VALIDATE: '/products/validate',
    PRODUCT_CONNECT: (id: string) => `/products/${id}/connect`,
    PRODUCT_DISCONNECT: (id: string) => `/products/${id}/disconnect`,
    PRODUCT_STATS: '/products/stats',
    PRODUCT_LINK_DEVICE: (id: string) => `/products/${id}/link-device`,
  };

  private static getDevProducts(): Product[] {
    try {
      return JSON.parse(localStorage.getItem(this.DEV_PRODUCTS_KEY) || '[]');
    } catch {
      return [];
    }
  }

  private static setDevProducts(products: Product[]) {
    localStorage.setItem(this.DEV_PRODUCTS_KEY, JSON.stringify(products));
  }

  private static createFirstCoopProduct(): Product {
    const now = new Date().toISOString();
    return {
      id: this.FIRST_COOP_PRODUCT_ID,
      user_id: this.GARAGE_OWNER_EMAIL,
      product_type: 'hardware_unit',
      product_name: 'Garage Chicken Tender 001',
      model: 'Chicken Tender Coop - Garage Dev Build',
      serial_number: this.FIRST_COOP_SERIAL,
      activation_code: 'TC-GARAGE-001',
      qr_code: `tendercells://register?serial=${this.FIRST_COOP_SERIAL}&device=${this.FIRST_COOP_DEVICE_ID}`,
      status: 'setup_required',
      connection_status: 'offline',
      device_id: this.FIRST_COOP_DEVICE_ID,
      network_config: {
        connected: false,
      },
      location: 'Garage Electronics Bench',
      metadata: {
        owner_email: this.GARAGE_OWNER_EMAIL,
        source: 'garage-dev-seed',
        product_family: 'chicken-tender',
        hardware_revision: 'garage-dev-r0',
        firmware_target: 'firmware/chicken-tender',
        mqtt_base_topic: `tc/${this.FIRST_COOP_DEVICE_ID}`,
        api_health_url: 'http://localhost:4000/health',
        animal_count: 4,
        hardware_setup_mode: 'connect_now',
        setup_intent: 'Connect hardware during registration for garage motor and axis testing.',
        simulation_backend: 'hardware_in_loop',
        simulation_profile: 'garage-axis-and-door-bringup',
        robotics_middleware: 'mqtt_bridge',
        synthetic_data_enabled: false,
        nvidia_isaac_enabled: false,
        property_simulation_enabled: true,
        terrain_source: 'manual_layout',
        terrain_detail_status: 'manual',
        telemetry_learning_enabled: true,
        telemetry_consent: 'local_only',
        telemetry_retention_days: 30,
        telemetry_export_enabled: true,
        safety_validation_status: 'bench_tested',
        safety_notes: 'Garage build requires verified E-stop, limit switches, and low-speed axis testing before animal proximity.',
        asset_license: 'TenderCells prototype assets',
        asset_source: 'local garage dev build',
        cad_revision: 'garage-dev-cad-r0',
        firmware_contract_version: 'garage-dev-api-r0',
        pinout_revision: 'garage-dev-pinout-r0',
        open_source_release_ready: false,
        kit_release_ready: false,
        commercial_sale_ready: false,
        notes: 'First local coop device for garage electronics bring-up and community kit validation.',
      },
      created_at: now,
      updated_at: now,
    };
  }

  static seedFirstGarageCoop(): Product {
    const products = this.getDevProducts();
    const seed = this.createFirstCoopProduct();
    const existing = products.find((product) => product.serial_number === seed.serial_number || product.id === seed.id);

    if (existing) {
      const updated = {
        ...existing,
        ...seed,
        metadata: { ...existing.metadata, ...seed.metadata },
        created_at: existing.created_at,
        updated_at: new Date().toISOString(),
      };
      this.setDevProducts(products.map((product) => (product.id === existing.id ? updated : product)));
      return updated;
    }

    this.setDevProducts([seed, ...products]);
    return seed;
  }

  static resetFirstGarageCoop(): Product {
    const seed = this.createFirstCoopProduct();
    const products = this.getDevProducts().filter(
      (product) => product.serial_number !== seed.serial_number && product.id !== seed.id
    );
    this.setDevProducts([seed, ...products]);
    return seed;
  }

  /**
   * Idempotent upsert of demo/seed products into the local dev store. Matches on
   * id or serial_number so re-running never duplicates. User-registered products
   * (different ids) are untouched. Used by the demo environment orchestrator.
   */
  static seedDemoProducts(seeds: Product[]): Product[] {
    let products = this.getDevProducts();
    for (const seed of seeds) {
      const existing = products.find((p) => p.id === seed.id || p.serial_number === seed.serial_number);
      if (existing) {
        const merged = {
          ...existing,
          ...seed,
          metadata: { ...existing.metadata, ...seed.metadata },
          created_at: existing.created_at,
          updated_at: new Date().toISOString(),
        };
        products = products.map((p) => (p.id === existing.id ? merged : p));
      } else {
        products = [seed, ...products];
      }
    }
    this.setDevProducts(products);
    return products;
  }

  /** Remove only products that carry a given metadata.source tag (demo reset). */
  static removeProductsBySource(source: string): void {
    this.setDevProducts(this.getDevProducts().filter((p) => p.metadata?.source !== source));
  }

  private static createDevProduct(data: RegisterProductData): Product {
    const now = new Date().toISOString();
    const serial = data.serial_number || `DEV-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    const deviceId = data.device_id || serial.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const metadata = data.metadata || {};

    return {
      id: `dev-${Date.now()}`,
      user_id: metadata.owner_email || 'local-dev',
      product_type: data.product_type,
      product_name: data.product_name,
      model: data.model,
      serial_number: serial,
      activation_code: data.activation_code,
      qr_code: data.qr_code,
      status: 'setup_required',
      connection_status: 'offline',
      device_id: deviceId,
      network_config: {},
      location: data.location,
      metadata: {
        product_family: data.product_type === 'custom_product' ? 'community-custom' : undefined,
        mqtt_base_topic: deviceId ? `tc/${deviceId}` : undefined,
        ...metadata,
        source: 'local-dev-fallback',
      },
      created_at: now,
      updated_at: now,
    };
  }

  private static getDevStats(products = this.getDevProducts()): ProductStats {
    return {
      totalProducts: products.length,
      hardwareUnits: products.filter((product) => product.product_type === 'hardware_unit').length,
      automationDevices: products.filter((product) => product.product_type === 'automation_device').length,
      connectedProducts: products.filter((product) => product.status === 'connected').length,
      disconnectedProducts: products.filter((product) => product.status === 'disconnected').length,
      setupRequired: products.filter((product) => product.status === 'setup_required').length,
      onlineProducts: products.filter((product) => product.connection_status === 'online').length,
      offlineProducts: products.filter((product) => product.connection_status === 'offline').length,
    };
  }

  private static async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const response = await fetch(`${this.API_BASE_URL}${endpoint}`, {
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
    try {
      return await this.request<Product>(this.ENDPOINTS.PRODUCTS, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch {
      const products = this.getDevProducts();
      const product = this.createDevProduct(data);
      this.setDevProducts([...products, product]);
      return product;
    }
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
    
    try {
      return await this.request<Product[]>(endpoint);
    } catch {
      return this.getDevProducts();
    }
  }

  /**
   * Get a specific product by ID
   */
  static async getProduct(id: string): Promise<Product> {
    try {
      return await this.request<Product>(this.ENDPOINTS.PRODUCT_BY_ID(id));
    } catch {
      const product = this.getDevProducts().find((item) => item.id === id);
      if (!product) throw new Error('Product not found in local dev store');
      return product;
    }
  }

  /**
   * Update a product
   */
  static async updateProduct(id: string, data: UpdateProductData): Promise<Product> {
    try {
      return await this.request<Product>(this.ENDPOINTS.PRODUCT_BY_ID(id), {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    } catch {
      const products = this.getDevProducts();
      const updated = products.map((product) =>
        product.id === id ? { ...product, ...data, updated_at: new Date().toISOString() } : product
      );
      this.setDevProducts(updated);
      const product = updated.find((item) => item.id === id);
      if (!product) throw new Error('Product not found in local dev store');
      return product;
    }
  }

  /**
   * Delete a product
   */
  static async deleteProduct(id: string): Promise<void> {
    try {
      return await this.request<void>(this.ENDPOINTS.PRODUCT_BY_ID(id), {
        method: 'DELETE',
      });
    } catch {
      this.setDevProducts(this.getDevProducts().filter((product) => product.id !== id));
    }
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
    try {
      return await this.request<Product>(this.ENDPOINTS.PRODUCT_CONNECT(id), {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch {
      const products = this.getDevProducts();
      const now = new Date().toISOString();
      const updated = products.map((product) =>
        product.id === id
          ? {
              ...product,
              status: 'connected' as const,
              connection_status: 'online' as const,
              network_config: {
                ...product.network_config,
                ...data.network_config,
                connected: true,
                lastConnected: now,
              },
              last_seen: now,
              metadata: {
                ...product.metadata,
                network_config: data.network_config,
              },
              updated_at: now,
            }
          : product
      );
      this.setDevProducts(updated);
      const product = updated.find((item) => item.id === id);
      if (!product) throw new Error('Product not found in local dev store');
      return product;
    }
  }

  /**
   * Disconnect a product
   */
  static async disconnectProduct(id: string): Promise<Product> {
    try {
      return await this.request<Product>(this.ENDPOINTS.PRODUCT_DISCONNECT(id), {
        method: 'POST',
        body: JSON.stringify({}),
      });
    } catch {
      const products = this.getDevProducts();
      const updated = products.map((product) =>
        product.id === id
          ? { ...product, status: 'disconnected' as const, connection_status: 'offline' as const, updated_at: new Date().toISOString() }
          : product
      );
      this.setDevProducts(updated);
      const product = updated.find((item) => item.id === id);
      if (!product) throw new Error('Product not found in local dev store');
      return product;
    }
  }

  /**
   * Get product statistics
   */
  static async getProductStats(): Promise<ProductStats> {
    try {
      return await this.request<ProductStats>(this.ENDPOINTS.PRODUCT_STATS);
    } catch {
      return this.getDevStats();
    }
  }

  /**
   * Link an automation device to a product
   */
  static async linkDeviceToProduct(productId: string, deviceId: string): Promise<Product> {
    try {
      return await this.request<Product>(this.ENDPOINTS.PRODUCT_LINK_DEVICE(productId), {
        method: 'POST',
        body: JSON.stringify({ deviceId }),
      });
    } catch {
      const products = this.getDevProducts();
      const updated = products.map((product) =>
        product.id === productId ? { ...product, device_id: deviceId, updated_at: new Date().toISOString() } : product
      );
      this.setDevProducts(updated);
      const product = updated.find((item) => item.id === productId);
      if (!product) throw new Error('Product not found in local dev store');
      return product;
    }
  }
}

