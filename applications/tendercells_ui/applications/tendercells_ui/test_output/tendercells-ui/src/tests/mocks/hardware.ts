import { vi } from 'vitest';
import type { BLEDevice, MQTTMessage, WiFiNetwork } from '../fixtures/devices';
import { mockBLEDevices, mockWiFiNetworks, mockMQTTMessages } from '../fixtures/devices';

// Mock Web Bluetooth API
export const mockBluetooth = {
  requestDevice: vi.fn().mockResolvedValue({
    id: 'ble-device-1',
    name: 'TenderCells Device',
    gatt: {
      connect: vi.fn().mockResolvedValue({
        getPrimaryService: vi.fn().mockResolvedValue({
          getCharacteristic: vi.fn().mockResolvedValue({
            readValue: vi.fn().mockResolvedValue(new DataView(new ArrayBuffer(4))),
            writeValue: vi.fn().mockResolvedValue(undefined),
            startNotifications: vi.fn().mockResolvedValue(undefined),
            stopNotifications: vi.fn().mockResolvedValue(undefined),
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
          }),
        }),
        disconnect: vi.fn(),
        connected: true,
      }),
    },
  }),
  getAvailability: vi.fn().mockResolvedValue(true),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
};

// Mock BLE Service
export const mockBLEService = {
  scanDevices: vi.fn().mockResolvedValue(mockBLEDevices),
  connectDevice: vi.fn().mockResolvedValue({
    ...mockBLEDevices[0],
    connected: true,
  }),
  disconnectDevice: vi.fn().mockResolvedValue(undefined),
  readCharacteristic: vi.fn().mockResolvedValue(new Uint8Array([0, 1, 2, 3])),
  writeCharacteristic: vi.fn().mockResolvedValue(undefined),
  subscribeToCharacteristic: vi.fn().mockImplementation((callback) => {
    // Simulate periodic updates
    const interval = setInterval(() => {
      callback(new Uint8Array([Math.floor(Math.random() * 255)]));
    }, 1000);
    return () => clearInterval(interval);
  }),
};

// WiFi connection state tracking
let currentWiFiConnection: {
  ssid: string;
  ipAddress: string;
  signalStrength: number;
  connected: boolean;
} | null = null;

// Mock WiFi Service with realistic behavior
export const mockWiFiService = {
  scanNetworks: vi.fn().mockImplementation(async () => {
    // Return a copy of networks to allow modification in tests
    return Promise.resolve([...mockWiFiNetworks]);
  }),
  
  connectToNetwork: vi.fn().mockImplementation(async (ssid: string, password?: string) => {
    // Find the network in the mock list
    const network = mockWiFiNetworks.find(n => n.ssid === ssid);
    
    // Check if network exists
    if (!network) {
      throw new Error(`Network not found: ${ssid}`);
    }
    
    // Check if network requires password
    if (network.security !== 'none' && !password) {
      throw new Error('Password required for secured network');
    }
    
    // Validate password for secured networks (in real world, this would check against actual credentials)
    if (network.security !== 'none' && password) {
      // Simulate password validation - weak passwords fail for WPA3
      if (network.security === 'WPA3' && password.length < 8) {
        throw new Error('Password does not meet WPA3 security requirements');
      }
      
      // Simulate wrong password scenario (can be overridden in tests)
      if (password === 'wrongpassword' || password === 'short') {
        throw new Error('Authentication failed: Incorrect password');
      }
    }
    
    // Check signal strength - reject if too weak
    if (network.rssi < -80) {
      throw new Error(`Connection failed: Signal too weak (RSSI < -80)`);
    }
    
    // Simulate connection delay
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // Set connection state
    currentWiFiConnection = {
      ssid,
      connected: true,
      ipAddress: '192.168.1.100',
      signalStrength: network.rssi,
    };
    
    return currentWiFiConnection;
  }),
  
  disconnect: vi.fn().mockImplementation(async () => {
    // Disconnect should work even if not connected (no error)
    currentWiFiConnection = null;
    return Promise.resolve(undefined);
  }),
  
  getCurrentNetwork: vi.fn().mockImplementation(async () => {
    // Return current connection or null if not connected
    if (currentWiFiConnection) {
      const network = mockWiFiNetworks.find(n => n.ssid === currentWiFiConnection!.ssid);
      return network ? {
        ...network,
        ...currentWiFiConnection,
      } : null;
    }
    // Return null when not connected (realistic behavior)
    return null;
  }),
};

// Mock MQTT Client
export const mockMQTTClient = {
  connected: false,
  connect: vi.fn().mockImplementation(() => {
    mockMQTTClient.connected = true;
    return Promise.resolve();
  }),
  disconnect: vi.fn().mockImplementation(() => {
    mockMQTTClient.connected = false;
    return Promise.resolve();
  }),
  subscribe: vi.fn().mockResolvedValue({ messageId: 1 }),
  unsubscribe: vi.fn().mockResolvedValue(undefined),
  publish: vi.fn().mockResolvedValue({ messageId: 1 }),
  on: vi.fn(),
  off: vi.fn(),
  end: vi.fn().mockResolvedValue(undefined),
};

// Mock MQTT Service
export const mockMQTTService = {
  createClient: vi.fn().mockReturnValue(mockMQTTClient),
  connect: vi.fn().mockResolvedValue(mockMQTTClient),
  subscribe: vi.fn().mockResolvedValue(undefined),
  publish: vi.fn().mockResolvedValue(undefined),
  disconnect: vi.fn().mockResolvedValue(undefined),
};

// Mock WebSocket
export const mockWebSocket = {
  readyState: 0, // CONNECTING
  url: 'ws://localhost:8080',
  send: vi.fn(),
  close: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  CONNECTING: 0,
  OPEN: 1,
  CLOSING: 2,
  CLOSED: 3,
};

// Mock WebSocket Service
export const mockWebSocketService = {
  connect: vi.fn().mockImplementation((url: string) => {
    const ws = { ...mockWebSocket, url };
    setTimeout(() => {
      ws.readyState = 1; // OPEN
      if (ws.addEventListener) {
        ws.addEventListener('open', new Event('open') as any);
      }
    }, 100);
    return Promise.resolve(ws);
  }),
  send: vi.fn().mockResolvedValue(undefined),
  close: vi.fn().mockResolvedValue(undefined),
  onMessage: vi.fn(),
  onError: vi.fn(),
  onClose: vi.fn(),
};

// Reset all hardware mocks
export const resetHardwareMocks = () => {
  mockMQTTClient.connected = false;
  mockWebSocket.readyState = 0;
  currentWiFiConnection = null; // Reset WiFi connection state
  vi.clearAllMocks();
  
  // Restore default mock implementations
  mockWiFiService.scanNetworks.mockResolvedValue([...mockWiFiNetworks]);
  mockWiFiService.connectToNetwork.mockImplementation(async (ssid: string, password?: string) => {
    const network = mockWiFiNetworks.find(n => n.ssid === ssid);
    if (!network) {
      throw new Error(`Network not found: ${ssid}`);
    }
    if (network.security !== 'none' && !password) {
      throw new Error('Password required for secured network');
    }
    if (network.security !== 'none' && password && (password === 'wrongpassword' || password === 'short')) {
      throw new Error('Authentication failed: Incorrect password');
    }
    if (network.rssi < -80) {
      throw new Error(`Connection failed: Signal too weak (RSSI < -80)`);
    }
    currentWiFiConnection = {
      ssid,
      connected: true,
      ipAddress: '192.168.1.100',
      signalStrength: network.rssi,
    };
    return currentWiFiConnection;
  });
  mockWiFiService.disconnect.mockResolvedValue(undefined);
  mockWiFiService.getCurrentNetwork.mockImplementation(async () => {
    if (currentWiFiConnection) {
      const network = mockWiFiNetworks.find(n => n.ssid === currentWiFiConnection!.ssid);
      return network ? { ...network, ...currentWiFiConnection } : null;
    }
    // Return null when not connected (realistic behavior)
    return null;
  });
};

// Global mock setup for browser APIs
export const setupHardwareMocks = () => {
  if (typeof global !== 'undefined') {
    (global as any).navigator = {
      ...global.navigator,
      bluetooth: mockBluetooth,
    };
    (global as any).WebSocket = vi.fn().mockImplementation(() => mockWebSocket);
  }
  
  // Make services available to components via window object
  if (typeof window !== 'undefined') {
    (window as any).wifiService = mockWiFiService;
    (window as any).mqttService = mockMQTTService;
    (window as any).bleService = mockBLEService;
    (window as any).websocketService = mockWebSocketService;
  }
};





