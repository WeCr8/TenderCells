/**
 * Type definitions for products
 */

export type ProductType = 'hardware_unit' | 'automation_device' | 'custom_product' | 'software_only';

export type ProductFamily =
  | 'chicken-tender'
  | 'roaming-roost'
  | 'duck-dock'
  | 'goat-guardian'
  | 'bunny-burrow'
  | 'turkey-tower'
  | 'predator-monitor'
  | 'rail-system'
  | 'rail-system-modules'
  | 'tendercells-cloud'
  | 'pigeon-palace'
  | 'door-system'
  | 'latch-system'
  | 'waterer'
  | 'feeder'
  | 'sensor-pod'
  | 'camera-kit'
  | 'motor-axis-kit'
  | 'controller-board'
  | 'printed-part'
  | 'community-custom';

export type BuildSource = 'tendercells-kit' | 'prebuilt-unit' | 'open-source-diy' | 'third-party' | 'prototype';

export type HardwareSetupMode = 'sim_only' | 'connect_now';

export type SimulationBackend = 'browser_threejs' | 'nvidia_isaac' | 'ros_gazebo' | 'hardware_in_loop' | 'none';

export type TelemetryConsent = 'not_requested' | 'local_only' | 'share_anonymized' | 'share_with_support';

export type SafetyValidationStatus = 'not_started' | 'simulated' | 'bench_tested' | 'field_tested' | 'blocked';

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
  owner_email?: string;
  product_family?: ProductFamily | string;
  build_source?: BuildSource | string;
  custom_product_name?: string;
  custom_product_url?: string;
  hardware_revision?: string;
  firmware_target?: string;
  firmware_version?: string;
  mqtt_base_topic?: string;
  api_health_url?: string;
  repo_url?: string;
  schematic_url?: string;
  bom_url?: string;
  enclosure_width_ft?: number;
  enclosure_depth_ft?: number;
  enclosure_height_ft?: number;
  yard_width_ft?: number;
  yard_depth_ft?: number;
  animal_count?: number;
  hardware_setup_mode?: HardwareSetupMode | string;
  setup_intent?: string;
  simulation_backend?: SimulationBackend | string;
  simulation_profile?: string;
  simulation_scene_url?: string;
  robotics_middleware?: 'none' | 'ros2' | 'mqtt_bridge' | string;
  synthetic_data_enabled?: boolean;
  nvidia_isaac_enabled?: boolean;
  nvidia_isaac_scene?: string;
  nvidia_isaac_robot_asset?: string;
  property_simulation_enabled?: boolean;
  property_scene_url?: string;
  terrain_source?: 'manual_layout' | 'device_telemetry' | 'depth_camera' | 'lidar' | 'photogrammetry' | string;
  terrain_capture_device_id?: string;
  terrain_detail_status?: 'not_started' | 'manual' | 'collecting' | 'generated' | string;
  custom_device_asset_url?: string;
  telemetry_learning_enabled?: boolean;
  telemetry_consent?: TelemetryConsent | string;
  telemetry_retention_days?: number;
  telemetry_export_enabled?: boolean;
  safety_validation_status?: SafetyValidationStatus | string;
  safety_notes?: string;
  asset_license?: string;
  asset_source?: string;
  cad_revision?: string;
  firmware_contract_version?: string;
  pinout_revision?: string;
  open_source_release_ready?: boolean;
  kit_release_ready?: boolean;
  commercial_sale_ready?: boolean;
  parent_product_id?: string;
  compatible_product_families?: string[];
  printable_part_id?: string;
  print_material?: string;
  print_revision?: string;
  mounting_location?: string;
  module_count?: number;
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
  device_id?: string;
  location?: string;
  metadata?: ProductMetadata;
}

export interface UpdateProductData {
  product_name?: string;
  model?: string;
  location?: string;
  device_id?: string;
  network_config?: NetworkConfig;
  metadata?: ProductMetadata;
  status?: ProductStatus;
  connection_status?: ConnectionStatus;
  last_seen?: string;
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

