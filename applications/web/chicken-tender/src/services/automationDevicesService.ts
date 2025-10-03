import { apiService } from './api';
import type { 
  Device, 
  DeviceGroup, 
  DeviceStats, 
  DeviceEvent,
  DeviceFilter,
  DeviceSortOptions,
  DeviceReading,
  DeviceAction
} from '../types/automationDevices';

/**
 * Service for managing automation devices
 */
export class AutomationDevicesService {
  private static readonly ENDPOINTS = {
    DEVICES: '/automation/devices',
    DEVICE_BY_ID: (id: string) => `/automation/devices/${id}`,
    DEVICE_ACTIONS: (id: string) => `/automation/devices/${id}/actions`,
    DEVICE_READINGS: (id: string) => `/automation/devices/${id}/readings`,
    DEVICE_EVENTS: (id: string) => `/automation/devices/${id}/events`,
    DEVICE_FIRMWARE: (id: string) => `/automation/devices/${id}/firmware`,
    DEVICE_SETTINGS: (id: string) => `/automation/devices/${id}/settings`,
    DEVICE_GROUPS: '/automation/device-groups',
    DEVICE_GROUP_BY_ID: (id: string) => `/automation/device-groups/${id}`,
    DEVICE_STATS: '/automation/devices/stats',
    DEVICE_DISCOVERY: '/automation/devices/discovery',
  };

  /**
   * Get all devices with optional filtering and sorting
   */
  static async getDevices(filter?: DeviceFilter, sort?: DeviceSortOptions): Promise<Device[]> {
    const params = new URLSearchParams();
    
    if (filter) {
      if (filter.types) params.append('types', filter.types.join(','));
      if (filter.status) params.append('status', filter.status.join(','));
      if (filter.locations) params.append('locations', filter.locations.join(','));
      if (filter.capabilities) params.append('capabilities', filter.capabilities.join(','));
      if (filter.search) params.append('search', filter.search);
    }
    
    if (sort) {
      params.append('sortBy', sort.field);
      params.append('sortOrder', sort.direction);
    }

    const queryString = params.toString();
    const endpoint = queryString ? `${this.ENDPOINTS.DEVICES}?${queryString}` : this.ENDPOINTS.DEVICES;
    
    return apiService.get<Device[]>(endpoint);
  }

  /**
   * Get a specific device by ID
   */
  static async getDeviceById(id: string): Promise<Device> {
    return apiService.get<Device>(this.ENDPOINTS.DEVICE_BY_ID(id));
  }

  /**
   * Create a new device
   */
  static async createDevice(device: Omit<Device, 'id' | 'createdAt' | 'updatedAt'>): Promise<Device> {
    return apiService.post<Device>(this.ENDPOINTS.DEVICES, device);
  }

  /**
   * Update an existing device
   */
  static async updateDevice(id: string, updates: Partial<Device>): Promise<Device> {
    return apiService.put<Device>(this.ENDPOINTS.DEVICE_BY_ID(id), updates);
  }

  /**
   * Delete a device
   */
  static async deleteDevice(id: string): Promise<void> {
    return apiService.delete<void>(this.ENDPOINTS.DEVICE_BY_ID(id));
  }

  /**
   * Execute a device action
   */
  static async executeDeviceAction(deviceId: string, actionId: string, parameters?: Record<string, any>): Promise<void> {
    return apiService.post<void>(`${this.ENDPOINTS.DEVICE_ACTIONS(deviceId)}/${actionId}`, { parameters });
  }

  /**
   * Get device readings
   */
  static async getDeviceReadings(deviceId: string, limit?: number): Promise<DeviceReading[]> {
    const params = limit ? `?limit=${limit}` : '';
    return apiService.get<DeviceReading[]>(`${this.ENDPOINTS.DEVICE_READINGS(deviceId)}${params}`);
  }

  /**
   * Get device events
   */
  static async getDeviceEvents(deviceId: string, limit?: number): Promise<DeviceEvent[]> {
    const params = limit ? `?limit=${limit}` : '';
    return apiService.get<DeviceEvent[]>(`${this.ENDPOINTS.DEVICE_EVENTS(deviceId)}${params}`);
  }

  /**
   * Update device firmware
   */
  static async updateDeviceFirmware(deviceId: string): Promise<void> {
    return apiService.post<void>(this.ENDPOINTS.DEVICE_FIRMWARE(deviceId));
  }

  /**
   * Update device settings
   */
  static async updateDeviceSettings(deviceId: string, settings: Record<string, any>): Promise<void> {
    return apiService.put<void>(this.ENDPOINTS.DEVICE_SETTINGS(deviceId), settings);
  }

  /**
   * Get all device groups
   */
  static async getDeviceGroups(): Promise<DeviceGroup[]> {
    return apiService.get<DeviceGroup[]>(this.ENDPOINTS.DEVICE_GROUPS);
  }

  /**
   * Get a specific device group by ID
   */
  static async getDeviceGroupById(id: string): Promise<DeviceGroup> {
    return apiService.get<DeviceGroup>(this.ENDPOINTS.DEVICE_GROUP_BY_ID(id));
  }

  /**
   * Create a new device group
   */
  static async createDeviceGroup(group: Omit<DeviceGroup, 'id' | 'createdAt' | 'updatedAt'>): Promise<DeviceGroup> {
    return apiService.post<DeviceGroup>(this.ENDPOINTS.DEVICE_GROUPS, group);
  }

  /**
   * Update an existing device group
   */
  static async updateDeviceGroup(id: string, updates: Partial<DeviceGroup>): Promise<DeviceGroup> {
    return apiService.put<DeviceGroup>(this.ENDPOINTS.DEVICE_GROUP_BY_ID(id), updates);
  }

  /**
   * Delete a device group
   */
  static async deleteDeviceGroup(id: string): Promise<void> {
    return apiService.delete<void>(this.ENDPOINTS.DEVICE_GROUP_BY_ID(id));
  }

  /**
   * Get device statistics
   */
  static async getDeviceStats(): Promise<DeviceStats> {
    return apiService.get<DeviceStats>(this.ENDPOINTS.DEVICE_STATS);
  }

  /**
   * Start device discovery
   */
  static async startDeviceDiscovery(): Promise<void> {
    return apiService.post<void>(this.ENDPOINTS.DEVICE_DISCOVERY);
  }

  /**
   * Get discovered devices
   */
  static async getDiscoveredDevices(): Promise<Device[]> {
    return apiService.get<Device[]>(this.ENDPOINTS.DEVICE_DISCOVERY);
  }
}