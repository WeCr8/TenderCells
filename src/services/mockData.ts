// Mock data service for demo/testing
// Last updated: 2026-06-11

import { Device, TelemetryReading, Property } from '../types';

export const mockProperty: Property = {
  id: 'property_001',
  userId: 'demo_user',
  name: 'Sunrise Farm',
  address: '123 Farm Lane, Rural County',
  gridSize: 4,
  gridScale: 100,
  createdAt: Date.now() - 365 * 24 * 60 * 60 * 1000,
  updatedAt: Date.now(),
};

export const mockDevices: Device[] = [
  {
    id: 'chicken_tender_001',
    productType: 'chicken-tender',
    nickname: 'Main Coop',
    propertyId: 'property_001',
    location: { x: 0, y: 0 },
    animalCount: 6,
    hardwareConnected: true,
    simOnly: false,
    createdAt: Date.now() - 180 * 24 * 60 * 60 * 1000,
    updatedAt: Date.now(),
  },
  {
    id: 'chicken_tender_002',
    productType: 'chicken-tender',
    nickname: 'Secondary Coop',
    propertyId: 'property_001',
    location: { x: 200, y: 0 },
    animalCount: 3,
    hardwareConnected: false,
    simOnly: true,
    createdAt: Date.now() - 90 * 24 * 60 * 60 * 1000,
    updatedAt: Date.now(),
  },
  {
    id: 'watchtower_001',
    productType: 'watchtower',
    nickname: 'North Perimeter',
    propertyId: 'property_001',
    location: { x: 400, y: 100 },
    animalCount: 0,
    hardwareConnected: true,
    simOnly: false,
    createdAt: Date.now() - 60 * 24 * 60 * 60 * 1000,
    updatedAt: Date.now(),
  },
];

export const mockTelemetry: TelemetryReading[] = [
  {
    deviceId: 'chicken_tender_001',
    timestamp: Date.now(),
    temperature: 72.5,
    humidity: 65,
    ammonia: 3.2,
    feedLevel: 85,
    waterLevel: 92,
    chickenCount: 6,
    doorState: 'closed',
    systemState: 'idle',
  },
  {
    deviceId: 'chicken_tender_002',
    timestamp: Date.now() - 60000,
    temperature: 68.1,
    humidity: 58,
    ammonia: 2.1,
    feedLevel: 45,
    waterLevel: 78,
    chickenCount: 3,
    doorState: 'open',
    systemState: 'running',
  },
  {
    deviceId: 'watchtower_001',
    timestamp: Date.now() - 120000,
    temperature: 71.0,
    humidity: 52,
    ammonia: 0,
    feedLevel: 0,
    waterLevel: 0,
    chickenCount: 0,
    doorState: 'closed',
    systemState: 'idle',
  },
];

export function getMockDeviceForProperty(propertyId: string): Device[] {
  return mockDevices.filter((d) => d.propertyId === propertyId);
}

export function getMockTelemetryForDevice(deviceId: string): TelemetryReading[] {
  return mockTelemetry.filter((t) => t.deviceId === deviceId);
}
