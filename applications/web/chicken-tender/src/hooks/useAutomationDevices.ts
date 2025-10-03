import { useState, useEffect } from 'react';
import { AutomationDevicesService } from '../services/automationDevicesService';
import type { 
  Device, 
  DeviceGroup, 
  DeviceStats, 
  DeviceEvent,
  DeviceFilter,
  DeviceSortOptions,
  DeviceReading
} from '../types/automationDevices';

/**
 * Custom hook for managing automation devices
 */
export function useAutomationDevices() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [deviceGroups, setDeviceGroups] = useState<DeviceGroup[]>([]);
  const [stats, setStats] = useState<DeviceStats | null>(null);
  const [events, setEvents] = useState<DeviceEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDevices = async (filter?: DeviceFilter, sort?: DeviceSortOptions) => {
    try {
      setLoading(true);
      setError(null);
      const data = await AutomationDevicesService.getDevices(filter, sort);
      setDevices(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch devices');
    } finally {
      setLoading(false);
    }
  };

  const fetchDeviceGroups = async () => {
    try {
      const data = await AutomationDevicesService.getDeviceGroups();
      setDeviceGroups(data);
    } catch (err) {
      console.error('Failed to fetch device groups:', err);
    }
  };

  const fetchDeviceStats = async () => {
    try {
      const data = await AutomationDevicesService.getDeviceStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to fetch device stats:', err);
    }
  };

  const fetchDeviceEvents = async (deviceId?: string, limit?: number) => {
    try {
      if (deviceId) {
        const data = await AutomationDevicesService.getDeviceEvents(deviceId, limit);
        setEvents(data);
      } else {
        // Fetch events for all devices (this would be a separate endpoint in a real API)
        const allEvents: DeviceEvent[] = [];
        for (const device of devices) {
          const deviceEvents = await AutomationDevicesService.getDeviceEvents(device.id, limit);
          allEvents.push(...deviceEvents);
        }
        // Sort by timestamp, most recent first
        allEvents.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        setEvents(allEvents.slice(0, limit || 100));
      }
    } catch (err) {
      console.error('Failed to fetch device events:', err);
    }
  };

  const createDevice = async (device: Omit<Device, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const newDevice = await AutomationDevicesService.createDevice(device);
      setDevices(prev => [newDevice, ...prev]);
      await fetchDeviceStats(); // Refresh stats
      return newDevice;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create device');
      throw err;
    }
  };

  const updateDevice = async (id: string, updates: Partial<Device>) => {
    try {
      const updatedDevice = await AutomationDevicesService.updateDevice(id, updates);
      setDevices(prev => prev.map(device => device.id === id ? updatedDevice : device));
      await fetchDeviceStats(); // Refresh stats
      return updatedDevice;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update device');
      throw err;
    }
  };

  const deleteDevice = async (id: string) => {
    try {
      await AutomationDevicesService.deleteDevice(id);
      setDevices(prev => prev.filter(device => device.id !== id));
      await fetchDeviceStats(); // Refresh stats
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete device');
      throw err;
    }
  };

  const executeDeviceAction = async (deviceId: string, actionId: string, parameters?: Record<string, any>) => {
    try {
      await AutomationDevicesService.executeDeviceAction(deviceId, actionId, parameters);
      // Refresh the device to get updated state
      const updatedDevice = await AutomationDevicesService.getDeviceById(deviceId);
      setDevices(prev => prev.map(device => device.id === deviceId ? updatedDevice : device));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to execute device action');
      throw err;
    }
  };

  const updateDeviceFirmware = async (deviceId: string) => {
    try {
      await AutomationDevicesService.updateDeviceFirmware(deviceId);
      // Refresh the device to get updated firmware info
      const updatedDevice = await AutomationDevicesService.getDeviceById(deviceId);
      setDevices(prev => prev.map(device => device.id === deviceId ? updatedDevice : device));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update device firmware');
      throw err;
    }
  };

  const updateDeviceSettings = async (deviceId: string, settings: Record<string, any>) => {
    try {
      await AutomationDevicesService.updateDeviceSettings(deviceId, settings);
      // Refresh the device to get updated settings
      const updatedDevice = await AutomationDevicesService.getDeviceById(deviceId);
      setDevices(prev => prev.map(device => device.id === deviceId ? updatedDevice : device));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update device settings');
      throw err;
    }
  };

  const createDeviceGroup = async (group: Omit<DeviceGroup, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const newGroup = await AutomationDevicesService.createDeviceGroup(group);
      setDeviceGroups(prev => [newGroup, ...prev]);
      return newGroup;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create device group');
      throw err;
    }
  };

  const updateDeviceGroup = async (id: string, updates: Partial<DeviceGroup>) => {
    try {
      const updatedGroup = await AutomationDevicesService.updateDeviceGroup(id, updates);
      setDeviceGroups(prev => prev.map(group => group.id === id ? updatedGroup : group));
      return updatedGroup;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update device group');
      throw err;
    }
  };

  const deleteDeviceGroup = async (id: string) => {
    try {
      await AutomationDevicesService.deleteDeviceGroup(id);
      setDeviceGroups(prev => prev.filter(group => group.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete device group');
      throw err;
    }
  };

  const startDeviceDiscovery = async () => {
    try {
      await AutomationDevicesService.startDeviceDiscovery();
      // Wait a bit for discovery to find devices
      setTimeout(async () => {
        const discoveredDevices = await AutomationDevicesService.getDiscoveredDevices();
        // Add newly discovered devices to the list
        setDevices(prev => {
          const existingIds = new Set(prev.map(d => d.id));
          const newDevices = discoveredDevices.filter(d => !existingIds.has(d.id));
          return [...prev, ...newDevices];
        });
      }, 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start device discovery');
      throw err;
    }
  };

  useEffect(() => {
    fetchDevices();
    fetchDeviceGroups();
    fetchDeviceStats();
  }, []);

  return {
    // State
    devices,
    deviceGroups,
    stats,
    events,
    loading,
    error,
    
    // Fetch functions
    fetchDevices,
    fetchDeviceGroups,
    fetchDeviceStats,
    fetchDeviceEvents,
    
    // Device operations
    createDevice,
    updateDevice,
    deleteDevice,
    executeDeviceAction,
    updateDeviceFirmware,
    updateDeviceSettings,
    
    // Device group operations
    createDeviceGroup,
    updateDeviceGroup,
    deleteDeviceGroup,
    
    // Discovery
    startDeviceDiscovery,
    
    // Utilities
    clearError: () => setError(null),
    refreshAll: async () => {
      await Promise.all([
        fetchDevices(),
        fetchDeviceGroups(),
        fetchDeviceStats()
      ]);
    }
  };
}