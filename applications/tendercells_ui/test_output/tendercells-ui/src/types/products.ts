/**
 * Type definitions for products
 */

export type ProductType = 'hardware_unit' | 'automation_device';

export type ProductStatus = 'registered' | 'connected' | 'disconnected' | 'setup_required';

export type ConnectionStatus = 'offline' | 'connecting' | 'online' | 'error';

export type RegistrationMethod = 'serial_number' | 'qr_code' | 'activation_code';

export interface NetworkConfig {
  ssid?: string;
  password?: string;
  securityType?: 'none' | 'WPA' | 'WPA2' | 'WPA3';
  ipAddress?: string;
  macAddress?: string;
  signalStrength?: number;
  connected?: boolean;
  lastConnected?: string;
}

export interface ProductMetadata {
  purchaseDate?: string;
  warrantyExpiry?: string;
  warrantyProvider?: string;
  purchasePrice?: number;
  purchaseLocation?: string;
  notes?: string;
  [key: string]: any;
}

export interface Product {
  id: string;
  user_id: string;
  product_type: ProductType;
  product_name: string;
  model?: string;
  serial_number: string;
  activation_code?: string;
  qr_code?: string;
  status: ProductStatus;
  connection_status: ConnectionStatus;
  device_id?: string;
  network_config: NetworkConfig;
  location?: string;
  metadata: ProductMetadata;
  last_seen?: string;
  created_at: string;
  updated_at: string;
}

export interface RegisterProductData {
  product_type: ProductType;
  product_name: string;
  model?: string;
  serial_number?: string;
  activation_code?: string;
  qr_code?: string;
  location?: string;
  metadata?: ProductMetadata;
}

export interface UpdateProductData {
  product_name?: string;
  model?: string;
  location?: string;
  metadata?: ProductMetadata;
  status?: ProductStatus;
}

export interface ConnectProductData {
  network_config: NetworkConfig;
}

export interface ProductStats {
  totalProducts: number;
  hardwareUnits: number;
  automationDevices: number;
  connectedProducts: number;
  disconnectedProducts: number;
  setupRequired: number;
  onlineProducts: number;
  offlineProducts: number;
}

export interface ProductFilter {
  product_type?: ProductType[];
  status?: ProductStatus[];
  connection_status?: ConnectionStatus[];
  location?: string[];
  search?: string;
}

