/**
 * Type definitions for automation devices
 */

export type DeviceType = 
  | 'feeder' 
  | 'water_dispenser' 
  | 'door' 
  | 'light' 
  | 'heater' 
  | 'fan' 
  | 'camera' 
  | 'sensor' 
  | 'motor' 
  | 'custom';

export type DeviceStatus = 
  | 'online' 
  | 'offline' 
  | 'maintenance' 
  | 'error' 
  | 'disabled';

export type DeviceCapability = 
  | 'power' 
  | 'toggle' 
  | 'level' 
  | 'temperature' 
  | 'humidity' 
  | 'motion' 
  | 'open_close' 
  | 'dispense' 
  | 'record' 
  | 'custom';

export interface DeviceAction {
  id: string;
  name: string;
  description: string;
  capability: DeviceCapability;
  parameters: DeviceActionParameter[];
}

export interface DeviceActionParameter {
  id: string;
  name: string;
  description: string;
  type: 'boolean' | 'number' | 'string' | 'enum';
  required: boolean;
  defaultValue?: any;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  options?: { label: string; value: any }[];
}

export interface DeviceReading {
  id: string;
  name: string;
  description: string;
  type: 'temperature' | 'humidity' | 'motion' | 'light' | 'power' | 'level' | 'custom';
  value: any;
  unit?: string;
  timestamp: string;
  min?: number;
  max?: number;
  status: 'normal' | 'warning' | 'critical';
}

export interface Device {
  id: string;
  name: string;
  description: string;
  type: DeviceType;
  status: DeviceStatus;
  location: string;
  capabilities: DeviceCapability[];
  actions: DeviceAction[];
  readings: DeviceReading[];
  lastSeen: string;
  firmware: {
    version: string;
    lastUpdated: string;
    updateAvailable: boolean;
  };
  battery?: {
    level: number;
    charging: boolean;
    lastCharged?: string;
  };
  network?: {
    type: 'wifi' | 'bluetooth' | 'zigbee' | 'zwave' | 'ethernet';
    signalStrength: number;
    ipAddress?: string;
    macAddress?: string;
  };
  metadata: {
    manufacturer: string;
    model: string;
    serialNumber: string;
    purchaseDate?: string;
    installDate: string;
    tags: string[];
  };
  settings: Record<string, any>;
  schedule?: {
    enabled: boolean;
    activeHours?: {
      start: string;
      end: string;
    };
    activeDays?: string[];
  };
  createdAt: string;
  updatedAt: string;
}

export interface DeviceGroup {
  id: string;
  name: string;
  description: string;
  devices: string[]; // Device IDs
  location: string;
  icon?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DeviceStats {
  totalDevices: number;
  onlineDevices: number;
  offlineDevices: number;
  maintenanceDevices: number;
  errorDevices: number;
  batteryLowDevices: number;
  firmwareOutdatedDevices: number;
  byType: Record<DeviceType, number>;
  byLocation: Record<string, number>;
  lastUpdated: string;
}

export interface DeviceEvent {
  id: string;
  deviceId: string;
  deviceName: string;
  eventType: 'status_change' | 'reading' | 'action' | 'error' | 'connection' | 'maintenance';
  description: string;
  value?: any;
  previousValue?: any;
  timestamp: string;
  source: 'device' | 'system' | 'user' | 'automation';
  severity: 'info' | 'warning' | 'error' | 'critical';
}

export interface DeviceFilter {
  types?: DeviceType[];
  status?: DeviceStatus[];
  locations?: string[];
  capabilities?: DeviceCapability[];
  search?: string;
}

export interface DeviceSortOptions {
  field: 'name' | 'type' | 'status' | 'lastSeen' | 'location';
  direction: 'asc' | 'desc';
}