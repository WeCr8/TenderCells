/**
 * Product type definitions
 */

export type ProductType = 'hardware_unit' | 'automation_device';

export type ProductStatus = 'connected' | 'disconnected' | 'setup_required';

export type ConnectionStatus = 'online' | 'offline' | 'connecting' | 'error';

export interface Product {
  id: string;
  product_type: ProductType;
  product_name: string;
  model?: string;
  location: string;
  serial_number?: string;
  qr_code?: string;
  activation_code?: string;
  status: ProductStatus;
  connection_status: ConnectionStatus;
  device_id?: string;
  created_at: string;
  updated_at: string;
  last_seen?: string;
  network_config?: {
    wifi_ssid?: string;
    mqtt_broker?: string;
    mqtt_port?: number;
    mqtt_username?: string;
  };
}

export interface RegisterProductData {
  product_type: ProductType;
  product_name: string;
  model?: string;
  location: string;
  serial_number?: string;
  qr_code?: string;
  activation_code?: string;
}

export interface UpdateProductData {
  product_name?: string;
  model?: string;
  location?: string;
  serial_number?: string;
}

export interface ConnectProductData {
  network_config?: {
    wifi_ssid?: string;
    wifi_password?: string;
    mqtt_broker?: string;
    mqtt_port?: number;
    mqtt_username?: string;
    mqtt_password?: string;
  };
  device_id?: string;
}

export interface ProductStats {
  total: number;
  connected: number;
  disconnected: number;
  setup_required: number;
  by_type: {
    hardware_unit: number;
    automation_device: number;
  };
}

export interface ProductFilter {
  product_type?: ProductType;
  status?: ProductStatus;
  connection_status?: ConnectionStatus;
  location?: string;
}
