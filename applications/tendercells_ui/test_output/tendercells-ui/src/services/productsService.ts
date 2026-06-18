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
  private static readonly API_BASE_URL = import.meta.env?.VITE_API_BASE_URL || 'http://localhost:4000/api';
  private static readonly API_ENABLED = Boolean(import.meta.env?.VITE_API_BASE_URL);
  private static readonly DEV_PRODUCTS_KEY = 'tendercells_dev_products';
  static readonly GARAGE_OWNER_EMAIL = 'demo-local-owner';
  static readonly FIRST_COOP_PRODUCT_ID = 'demo-chicken-tender-001';
  static readonly FIRST_COOP_DEVICE_ID = 'ct_001';
  static readonly FIRST_COOP_SERIAL = 'TC-CT-DEMO-0001';

  private static readonly ENDPOINTS = {
    PRODUCTS: '/products',
    PRODUCT_BY_ID: (id: string) => `/products/${id}`,
    PRODUCT_VALIDATE: '/products/validate',
    PRODUCT_CONNECT: (id: string) => `/products/${id}/connect`,
    PRODUCT_DISCONNECT: (id: string) => `/products/${id}/disconnect`,
    PRODUCT_STATS: '/products/stats',
    PRODUCT_LINK_DEVICE: (id: string) => `/products/${id}/link-device`,
  };

  private static sanitizeDevProduct(product: Product): Product {
    const metadata = { ...(product.metadata || {}) };
    const hasLegacyGarageSerial = /GARAGE/i.test(product.serial_number || '') || /GARAGE/i.test(product.activation_code || '');
    const isGarageSeed = /garage/i.test(String(metadata.source || ''));
    const isLegacyGarageProduct = product.id === 'garage-chicken-tender-001' || /Garage/i.test(product.product_name);

    if (!hasLegacyGarageSerial && !isGarageSeed && !isLegacyGarageProduct) return product;

    return {
      ...product,
      id: product.id === 'garage-chicken-tender-001' ? this.FIRST_COOP_PRODUCT_ID : product.id,
      user_id: this.GARAGE_OWNER_EMAIL,
      product_name: /garage/i.test(product.product_name) ? 'Demo Chicken Tender 001' : product.product_name,
      model: /garage/i.test(product.model || '') ? 'Chicken Tender Coop - Demo Build' : product.model,
      serial_number: hasLegacyGarageSerial ? this.FIRST_COOP_SERIAL : product.serial_number,
      activation_code: /GARAGE/i.test(product.activation_code || '') ? 'TC-DEMO-001' : product.activation_code,
      qr_code: product.qr_code?.replace(/TC-CT-GARAGE-\d+/g, this.FIRST_COOP_SERIAL),
      location: product.location === 'Garage Electronics Bench' ? 'Demo Workspace' : product.location,
      metadata: {
        ...metadata,
        owner_email: this.GARAGE_OWNER_EMAIL,
        source: isGarageSeed ? 'demo-local-seed' : metadata.source,
        hardware_revision: /^garage/i.test(String(metadata.hardware_revision || '')) ? 'demo-r0' : metadata.hardware_revision,
        setup_intent: metadata.setup_intent === 'Connect hardware during registration for garage motor and axis testing.'
          ? 'Explore a browser-local demo build before hardware kits are available.'
          : metadata.setup_intent,
        simulation_profile: metadata.simulation_profile === 'garage-axis-and-door-bringup'
          ? 'demo-axis-and-door-preview'
          : metadata.simulation_profile,
        safety_validation_status: metadata.safety_validation_status === 'bench_tested'
          ? 'simulated'
          : metadata.safety_validation_status,
        safety_notes: metadata.safety_notes === 'Garage build requires verified E-stop, limit switches, and low-speed axis testing before animal proximity.'
          ? 'Demo build requires verified E-stop, limit switches, and low-speed axis testing before animal proximity.'
          : metadata.safety_notes,
        asset_source: metadata.asset_source === 'local garage dev build' ? 'browser-local demo build' : metadata.asset_source,
        cad_revision: /^garage/i.test(String(metadata.cad_revision || '')) ? 'demo-cad-r0' : metadata.cad_revision,
        firmware_contract_version: /^garage/i.test(String(metadata.firmware_contract_version || '')) ? 'demo-api-r0' : metadata.firmware_contract_version,
        pinout_revision: /^garage/i.test(String(metadata.pinout_revision || '')) ? 'demo-pinout-r0' : metadata.pinout_revision,
        notes: metadata.notes === 'First local coop device for garage electronics bring-up and community kit validation.'
          ? 'Browser-local demo device for UI exploration and community kit planning.'
          : metadata.notes,
      },
    };
  }

  private static getDevProducts(): Product[] {
    try {
      const parsed = JSON.parse(localStorage.getItem(this.DEV_PRODUCTS_KEY) || '[]') as Product[];
      const sanitized = parsed.map((product) => this.sanitizeDevProduct(product));
      if (JSON.stringify(parsed) !== JSON.stringify(sanitized)) {
        this.setDevProducts(sanitized);
      }
      return sanitized;
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
      product_name: 'Demo Chicken Tender 001',
      model: 'Chicken Tender Coop - Demo Build',
      serial_number: this.FIRST_COOP_SERIAL,
      activation_code: 'TC-DEMO-001',
      qr_code: `tendercells://register?serial=${this.FIRST_COOP_SERIAL}&device=${this.FIRST_COOP_DEVICE_ID}`,
      status: 'setup_required',
      connection_status: 'offline',
      device_id: this.FIRST_COOP_DEVICE_ID,
      network_config: {
        connected: false,
      },
      location: 'Demo Workspace',
      metadata: {
        owner_email: this.GARAGE_OWNER_EMAIL,
        source: 'demo-local-seed',
        product_family: 'chicken-tender',
        hardware_revision: 'demo-r0',
        firmware_target: 'firmware/chicken-tender',
        mqtt_base_topic: `tc/${this.FIRST_COOP_DEVICE_ID}`,
        api_health_url: 'http://localhost:4000/health',
        animal_count: 4,
        hardware_setup_mode: 'connect_now',
        setup_intent: 'Explore a browser-local demo build before hardware kits are available.',
        simulation_backend: 'hardware_in_loop',
        simulation_profile: 'demo-axis-and-door-preview',
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
        safety_validation_status: 'simulated',
        safety_notes: 'Demo build requires verified E-stop, limit switches, and low-speed axis testing before animal proximity.',
        asset_license: 'TenderCells prototype assets',
        asset_source: 'browser-local demo build',
        cad_revision: 'demo-cad-r0',
        firmware_contract_version: 'demo-api-r0',
        pinout_revision: 'demo-pinout-r0',
        open_source_release_ready: false,
        kit_release_ready: false,
        commercial_sale_ready: false,
        notes: 'Browser-local demo device for UI exploration and community kit planning.',
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
        source: 'local-dev-fallback',
        ...metadata,
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
    if (!this.API_ENABLED) {
      throw new Error('Products API is not configured');
    }

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
