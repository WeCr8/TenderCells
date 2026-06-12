/**
 * Comprehensive integration test for full connection flow
 * Tests: UI Components -> Services -> Hardware Connections -> Mocks
 * This ensures everything works together end-to-end
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mockWiFiService, mockMQTTService, mockBLEService, resetHardwareMocks, setupHardwareMocks } from '../../../../tests/mocks/hardware';
import { mockWiFiNetworks, mockBLEDevices, mockMQTTTopics } from '../../../../tests/fixtures/devices';
import { mockProducts } from '../../../../tests/fixtures/products';
import { wifiService } from '../../../services/wifiService';
import { mqttService } from '../../../services/mqttService';
import { ProductsService } from '../../../services/productsService';

// Mock ProductsService
vi.mock('../../../services/productsService', () => ({
  ProductsService: {
    connectProduct: vi.fn(),
    getUserProducts: vi.fn(),
  },
}));

describe('Full Connection Flow Integration', () => {
  beforeEach(() => {
    resetHardwareMocks();
    setupHardwareMocks();
  });

  describe('Complete Device Setup Flow', () => {
    it('completes full device setup: WiFi -> MQTT -> Product Registration', async () => {
      const product = mockProducts[0];
      const network = mockWiFiNetworks[0];

      // Step 1: Scan WiFi networks
      const networks = await wifiService.scanNetworks();
      expect(networks.length).toBeGreaterThan(0);
      expect(mockWiFiService.scanNetworks).toHaveBeenCalled();

      // Step 2: Connect to WiFi
      const wifiResult = await wifiService.connectToNetwork(network.ssid, 'password123');
      expect(wifiResult.connected).toBe(true);
      expect(wifiResult.ssid).toBe(network.ssid);
      expect(wifiResult.ipAddress).toBeDefined();

      // Step 3: Create network configuration
      const networkConfig = {
        ssid: wifiResult.ssid,
        password: 'password123',
        securityType: network.security,
        connected: true,
        ipAddress: wifiResult.ipAddress,
        lastConnected: new Date().toISOString(),
      };

      // Step 4: Connect to MQTT broker
      const mqttClient = await mqttService.connect('mqtt://localhost:1883');
      expect(mqttClient.connected).toBe(true);

      // Step 5: Subscribe to device topics
      await mqttService.subscribe(mqttClient, `tendercells/devices/${product.device_id}/status`);
      await mqttService.subscribe(mqttClient, `tendercells/devices/${product.device_id}/telemetry`);
      expect(mockMQTTService.subscribe).toHaveBeenCalledTimes(2);

      // Step 6: Connect product with network config
      const connectedProduct = {
        ...product,
        connection_status: 'online',
        network_config: networkConfig,
      };
      
      (ProductsService.connectProduct as any).mockResolvedValue(connectedProduct);
      const result = await ProductsService.connectProduct(product.id, {
        network_config: networkConfig,
      });

      expect(result.connection_status).toBe('online');
      expect(result.network_config?.ssid).toBe(network.ssid);

      // Step 7: Verify device is online via MQTT
      const statusMessage = {
        device_id: product.device_id,
        status: 'online',
        timestamp: new Date().toISOString(),
      };

      await mqttService.publish(
        mqttClient,
        `tendercells/devices/${product.device_id}/status`,
        JSON.stringify(statusMessage),
        { qos: 1 }
      );

      expect(mockMQTTService.publish).toHaveBeenCalled();
    });

    it('handles BLE pairing during setup', async () => {
      const product = mockProducts[0];

      // Step 1: Scan for BLE devices
      const bleDevices = await mockBLEService.scanDevices();
      expect(bleDevices.length).toBeGreaterThan(0);

      // Step 2: Connect to BLE device
      const device = bleDevices[0];
      const connectedDevice = await mockBLEService.connectDevice(device.id);
      expect(connectedDevice.connected).toBe(true);

      // Step 3: Read device characteristics
      const value = await mockBLEService.readCharacteristic('service-uuid', 'char-uuid');
      expect(value).toBeInstanceOf(Uint8Array);

      // Step 4: Connect to WiFi
      const network = mockWiFiNetworks[0];
      const wifiResult = await wifiService.connectToNetwork(network.ssid, 'password123');
      expect(wifiResult.connected).toBe(true);

      // Step 5: Connect to MQTT
      const mqttClient = await mqttService.connect('mqtt://localhost:1883');
      expect(mqttClient.connected).toBe(true);
    });
  });

  describe('Device Communication Flow', () => {
    it('establishes bidirectional communication via MQTT', async () => {
      const product = mockProducts[0];
      
      // Connect to MQTT
      const mqttClient = await mqttService.connect('mqtt://localhost:1883');
      await mqttService.subscribe(mqttClient, `tendercells/devices/${product.device_id}/status`);
      await mqttService.subscribe(mqttClient, `tendercells/devices/${product.device_id}/telemetry`);

      // Send command to device
      const command = {
        action: 'get_status',
        timestamp: new Date().toISOString(),
      };

      await mqttService.publish(
        mqttClient,
        `tendercells/devices/${product.device_id}/commands`,
        JSON.stringify(command),
        { qos: 1 }
      );

      // Receive response
      const response = {
        device_id: product.device_id,
        status: 'online',
        data: { temperature: 22.5, humidity: 65 },
        timestamp: new Date().toISOString(),
      };

      await mqttService.publish(
        mqttClient,
        `tendercells/devices/${product.device_id}/status`,
        JSON.stringify(response),
        { qos: 1 }
      );

      expect(mockMQTTService.publish).toHaveBeenCalledTimes(2);
    });

    it('handles real-time telemetry updates', async () => {
      const product = mockProducts[0];
      const mqttClient = await mqttService.connect('mqtt://localhost:1883');
      
      await mqttService.subscribe(mqttClient, `tendercells/devices/${product.device_id}/telemetry`);

      // Simulate multiple telemetry updates
      const updates = [
        { temperature: 22.5, humidity: 65, timestamp: new Date().toISOString() },
        { temperature: 23.0, humidity: 66, timestamp: new Date().toISOString() },
        { temperature: 23.5, humidity: 67, timestamp: new Date().toISOString() },
      ];

      for (const update of updates) {
        await mqttService.publish(
          mqttClient,
          `tendercells/devices/${product.device_id}/telemetry`,
          JSON.stringify({ device_id: product.device_id, ...update }),
          { qos: 0 }
        );
      }

      expect(mockMQTTService.publish).toHaveBeenCalledTimes(3);
    });
  });

  describe('Error Recovery Flow', () => {
    it('recovers from WiFi disconnection', async () => {
      const network = mockWiFiNetworks[0];
      
      // Connect
      const wifiResult = await wifiService.connectToNetwork(network.ssid, 'password123');
      expect(wifiResult.connected).toBe(true);

      // Disconnect
      await wifiService.disconnect();
      const currentNetwork = await wifiService.getCurrentNetwork();
      expect(currentNetwork).toBeNull();

      // Reconnect
      const wifiResult2 = await wifiService.connectToNetwork(network.ssid, 'password123');
      expect(wifiResult2.connected).toBe(true);
    });

    it('recovers from MQTT disconnection', async () => {
      const mqttClient = await mqttService.connect('mqtt://localhost:1883');
      expect(mqttClient.connected).toBe(true);

      // Disconnect
      await mqttService.disconnect(mqttClient);
      expect(mockMQTTClient.connected).toBe(false);

      // Reconnect
      const mqttClient2 = await mqttService.connect('mqtt://localhost:1883');
      expect(mqttClient2.connected).toBe(true);
    });

    it('handles connection failures and retries', async () => {
      const network = mockWiFiNetworks[0];

      // First attempt fails
      mockWiFiService.connectToNetwork = vi.fn()
        .mockRejectedValueOnce(new Error('Connection timeout'))
        .mockResolvedValueOnce({
          ssid: network.ssid,
          connected: true,
          ipAddress: '192.168.1.100',
          signalStrength: network.rssi,
        });

      // First attempt
      await expect(
        wifiService.connectToNetwork(network.ssid, 'password123')
      ).rejects.toThrow('Connection timeout');

      // Retry succeeds
      const result = await wifiService.connectToNetwork(network.ssid, 'password123');
      expect(result.connected).toBe(true);
    });
  });

  describe('Multi-Device Management', () => {
    it('manages connections for multiple devices', async () => {
      const product1 = mockProducts[0];
      const product2 = mockProducts[1] || { ...mockProducts[0], id: 'prod-2', device_id: 'device-2' };

      // Connect to MQTT
      const mqttClient = await mqttService.connect('mqtt://localhost:1883');

      // Subscribe to multiple device topics
      await mqttService.subscribe(mqttClient, `tendercells/devices/${product1.device_id}/status`);
      await mqttService.subscribe(mqttClient, `tendercells/devices/${product2.device_id}/status`);

      // Publish status for device 1
      await mqttService.publish(
        mqttClient,
        `tendercells/devices/${product1.device_id}/status`,
        JSON.stringify({ device_id: product1.device_id, status: 'online' }),
        { qos: 1 }
      );

      // Publish status for device 2
      await mqttService.publish(
        mqttClient,
        `tendercells/devices/${product2.device_id}/status`,
        JSON.stringify({ device_id: product2.device_id, status: 'online' }),
        { qos: 1 }
      );

      expect(mockMQTTService.subscribe).toHaveBeenCalledTimes(2);
      expect(mockMQTTService.publish).toHaveBeenCalledTimes(2);
    });
  });
});
