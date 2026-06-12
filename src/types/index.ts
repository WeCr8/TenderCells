// Tender Cells data types
// Last updated: 2026-06-11

export type ProductType =
  | 'chicken-tender'
  | 'roaming-roost'
  | 'watchtower'
  | 'duck-dock'
  | 'bunny-burrow'
  | 'goat-guardian'
  | 'turkey-tower'
  | 'pigeon-palace';

export type SystemState = 'idle' | 'running' | 'error' | 'estop';
export type DoorState = 'open' | 'closed' | 'unknown';

export interface Device {
  id: string;
  productType: ProductType;
  nickname: string;
  propertyId: string;
  location: { x: number; y: number };
  animalCount: number;
  hardwareConnected: boolean;
  simOnly: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface TelemetryReading {
  deviceId: string;
  timestamp: number;
  temperature: number;    // °F
  humidity: number;       // %
  ammonia: number;        // ppm
  feedLevel: number;      // % 0-100
  waterLevel: number;     // % 0-100
  chickenCount: number;
  doorState: DoorState;
  systemState: SystemState;
}

export interface Schedule {
  id: string;
  deviceId: string;
  action: 'feed' | 'clean' | 'door' | 'water';
  cronExpression: string;
  enabled: boolean;
  lastRun?: number;
  nextRun?: number;
}

export interface Alert {
  id: string;
  deviceId: string;
  type: 'predator' | 'fault' | 'health';
  severity: 'info' | 'warning' | 'critical';
  message: string;
  acknowledged: boolean;
  timestamp: number;
}

export interface Property {
  id: string;
  userId: string;
  name: string;
  address: string;
  gridSize: number;
  gridScale: number;
  createdAt: number;
  updatedAt: number;
}

export interface User {
  uid: string;
  email: string;
  displayName?: string;
  createdAt: number;
  lastLogin: number;
}
