// Zustand store for device state management
// Last updated: 2026-06-11

import { create } from 'zustand';
import type { Device, TelemetryReading, Schedule, Alert } from '../types';
import {
  getDevices,
  getDevice,
  getTelemetry,
  getSchedules,
  getAlerts,
  subscribeToDevice,
  subscribeToTelemetry,
  subscribeToAlerts,
} from '../services/firebase';

interface DeviceStore {
  // State
  devices: Device[];
  selectedDeviceId: string | null;
  selectedDevice: Device | null;
  telemetryReadings: TelemetryReading[];
  schedules: Schedule[];
  alerts: Alert[];
  loading: boolean;
  error: string | null;

  // Actions
  loadDevices: (propertyId: string) => Promise<void>;
  selectDevice: (deviceId: string) => Promise<void>;
  subscribeToSelectedDevice: (deviceId: string) => () => void;
  subscribeToSelectedTelemetry: (deviceId: string) => () => void;
  subscribeToSelectedAlerts: (deviceId: string) => () => void;
  loadSchedules: (deviceId: string) => Promise<void>;
  clearError: () => void;
}

export const useDeviceStore = create<DeviceStore>((set) => ({
  devices: [],
  selectedDeviceId: null,
  selectedDevice: null,
  telemetryReadings: [],
  schedules: [],
  alerts: [],
  loading: false,
  error: null,

  loadDevices: async (propertyId: string) => {
    set({ loading: true, error: null });
    try {
      const devices = await getDevices(propertyId);
      set({ devices, loading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to load devices',
        loading: false,
      });
    }
  },

  selectDevice: async (deviceId: string) => {
    set({ loading: true, selectedDeviceId: deviceId });
    try {
      const device = await getDevice(deviceId);
      const telemetry = await getTelemetry(deviceId);
      const schedules = await getSchedules(deviceId);
      const alerts = await getAlerts(deviceId);

      set({
        selectedDevice: device,
        telemetryReadings: telemetry,
        schedules,
        alerts,
        loading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to load device',
        loading: false,
      });
    }
  },

  subscribeToSelectedDevice: (deviceId: string) => {
    const unsubscribe = subscribeToDevice(deviceId, (device) => {
      set({ selectedDevice: device });
    });
    return unsubscribe;
  },

  subscribeToSelectedTelemetry: (deviceId: string) => {
    const unsubscribe = subscribeToTelemetry(deviceId, (readings) => {
      set({ telemetryReadings: readings });
    });
    return unsubscribe;
  },

  subscribeToSelectedAlerts: (deviceId: string) => {
    const unsubscribe = subscribeToAlerts(deviceId, (alerts) => {
      set({ alerts });
    });
    return unsubscribe;
  },

  loadSchedules: async (deviceId: string) => {
    try {
      const schedules = await getSchedules(deviceId);
      set({ schedules });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to load schedules',
      });
    }
  },

  clearError: () => set({ error: null }),
}));
