// watchtower.ts - WatchTower AI Predator Monitor specs

export interface WatchTowerHardwareSpec {
  name: string;
  description: string;
  specs: {
    processor: string;
    cameras: number;
    resolution: string;
    fieldOfView: string;
    power: string;
    battery: string;
    solarPanel: string;
    connectivity: string;
    range: string;
  };
}

export const WATCHTOWER_SPECS: WatchTowerHardwareSpec = {
  name: 'WatchTower AI™',
  description: 'Solar-powered 360° predator detection system with LoRa mesh networking',
  specs: {
    processor: 'ESP32-S3',
    cameras: 3,
    resolution: '2MP per camera (Full HD)',
    fieldOfView: '360° coverage (120° per camera)',
    power: 'Solar panel (5W nominal)',
    battery: '18650 × 3 (11.1V 6Ah)',
    solarPanel: '5W 6V polycrystalline',
    connectivity: 'LoRa SX1276 915MHz (500m+ range)',
    range: '500m+ with LoRa mesh',
  },
};

export interface PredatorAlert {
  id: string;
  type: 'predator' | 'motion' | 'unknown';
  confidence: number; // 0-1
  timestamp: number;
  cameraId: number;
  imageUrl?: string;
  location: {
    lat?: number;
    lng?: number;
    deviceId: string;
  };
  acknowledged: boolean;
}

export interface WatchTowerDevice {
  id: string;
  name: string;
  location: string;
  installed: string;
  battery: number; // 0-100%
  solar: number; // 0-100% charge rate
  connected: boolean;
  lastSeen: number;
  alerts: PredatorAlert[];
}
