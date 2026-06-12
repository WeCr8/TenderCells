/**
 * Test fixtures for hardware devices (BLE, MQTT, WebSocket)
 */

export interface BLEDevice {
  id: string;
  name: string;
  address: string;
  rssi: number;
  services?: string[];
  characteristics?: Record<string, any>;
  connected?: boolean;
}

export interface MQTTMessage {
  topic: string;
  payload: string | Buffer;
  qos: 0 | 1 | 2;
  retain: boolean;
}

export interface WiFiNetwork {
  ssid: string;
  bssid: string;
  rssi: number;
  security: 'none' | 'WPA' | 'WPA2' | 'WPA3';
  channel: number;
}

export const mockBLEDevices: BLEDevice[] = [
  {
    id: 'ble-1',
    name: 'TenderCells Device 1',
    address: 'AA:BB:CC:DD:EE:01',
    rssi: -45,
    services: ['0000180f-0000-1000-8000-00805f9b34fb'],
    characteristics: {
      '00002a19-0000-1000-8000-00805f9b34fb': {
        properties: ['read', 'notify'],
      },
    },
    connected: false,
  },
  {
    id: 'ble-2',
    name: 'TenderCells Device 2',
    address: 'AA:BB:CC:DD:EE:02',
    rssi: -60,
    services: ['0000180f-0000-1000-8000-00805f9b34fb'],
    connected: false,
  },
  {
    id: 'ble-3',
    name: 'Automation Controller',
    address: 'AA:BB:CC:DD:EE:03',
    rssi: -75,
    services: ['0000180a-0000-1000-8000-00805f9b34fb'],
    connected: true,
  },
];

export const mockWiFiNetworks: WiFiNetwork[] = [
  {
    ssid: 'TenderCells-Network',
    bssid: '00:11:22:33:44:55',
    rssi: -30,
    security: 'WPA2',
    channel: 6,
  },
  {
    ssid: 'Test-Network',
    bssid: '00:11:22:33:44:56',
    rssi: -50,
    security: 'WPA3',
    channel: 11,
  },
  {
    ssid: 'Open-Network',
    bssid: '00:11:22:33:44:57',
    rssi: -70,
    security: 'none',
    channel: 1,
  },
  {
    ssid: 'Weak-Signal-Network',
    bssid: '00:11:22:33:44:58',
    rssi: -85,
    security: 'WPA2',
    channel: 3,
  },
];

export const mockMQTTTopics = {
  deviceStatus: 'tendercells/devices/+/status',
  deviceTelemetry: 'tendercells/devices/+/telemetry',
  deviceCommands: 'tendercells/devices/+/commands',
  systemEvents: 'tendercells/system/events',
};

export const mockMQTTMessages: MQTTMessage[] = [
  {
    topic: 'tendercells/devices/device-1/status',
    payload: JSON.stringify({
      device_id: 'device-1',
      status: 'online',
      timestamp: new Date().toISOString(),
    }),
    qos: 1,
    retain: false,
  },
  {
    topic: 'tendercells/devices/device-1/telemetry',
    payload: JSON.stringify({
      device_id: 'device-1',
      temperature: 22.5,
      humidity: 65,
      timestamp: new Date().toISOString(),
    }),
    qos: 0,
    retain: false,
  },
  {
    topic: 'tendercells/system/events',
    payload: JSON.stringify({
      event: 'device_connected',
      device_id: 'device-2',
      timestamp: new Date().toISOString(),
    }),
    qos: 2,
    retain: true,
  },
];

export const mockWebSocketMessages = {
  connect: { type: 'connect', message: 'Connected to TenderCells WebSocket' },
  deviceStatus: {
    type: 'device_status',
    device_id: 'device-1',
    status: 'online',
    timestamp: new Date().toISOString(),
  },
  telemetry: {
    type: 'telemetry',
    device_id: 'device-1',
    data: {
      temperature: 22.5,
      humidity: 65,
    },
    timestamp: new Date().toISOString(),
  },
  error: {
    type: 'error',
    message: 'Connection error',
    code: 1006,
  },
};

export const mockDeviceCommands = {
  connect: { command: 'connect', device_id: 'device-1' },
  disconnect: { command: 'disconnect', device_id: 'device-1' },
  getStatus: { command: 'get_status', device_id: 'device-1' },
  setConfig: {
    command: 'set_config',
    device_id: 'device-1',
    config: { setting1: 'value1' },
  },
};





