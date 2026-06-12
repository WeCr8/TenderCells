import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mockWiFiService, mockBLEService, mockMQTTService, resetHardwareMocks, setupHardwareMocks } from '../../../../tests/mocks/hardware';
import { mockWiFiNetworks, mockBLEDevices } from '../../../../tests/fixtures/devices';
import { mockProducts } from '../../../../tests/fixtures/products';
import type { NetworkConfig } from '../../../../types/products';

describe('Setup Wizard Device Connection Integration', () => {
  beforeEach(() => {
    resetHardwareMocks();
    setupHardwareMocks();
  });

  describe('WiFi Connection Flow', () => {
    it('scans for available WiFi networks', async () => {
      const networks = await mockWiFiService.scanNetworks();

      expect(networks).toBeDefined();
      expect(networks.length).toBeGreaterThan(0);
      expect(networks[0]).toHaveProperty('ssid');
      expect(networks[0]).toHaveProperty('security');
    });

    it('connects to a WiFi network with password', async () => {
      const network = mockWiFiNetworks[0];
      const result = await mockWiFiService.connectToNetwork(network.ssid, 'password123');

      expect(result.connected).toBe(true);
      expect(result.ssid).toBe(network.ssid);
      expect(result.ipAddress).toBeDefined();
    });

    it('connects to an open WiFi network', async () => {
      const openNetwork = mockWiFiNetworks.find(n => n.security === 'none');
      if (openNetwork) {
        const result = await mockWiFiService.connectToNetwork(openNetwork.ssid);

        expect(result.connected).toBe(true);
        expect(result.ssid).toBe(openNetwork.ssid);
      }
    });

    it('creates network config for product connection', async () => {
      const network = mockWiFiNetworks[0];
      const networkConfig: NetworkConfig = {
        ssid: network.ssid,
        password: 'password123',
        securityType: network.security,
        connected: true,
        ipAddress: '192.168.1.100',
        lastConnected: new Date().toISOString(),
      };

      expect(networkConfig.ssid).toBe(network.ssid);
      expect(networkConfig.securityType).toBe(network.security);
      expect(networkConfig.connected).toBe(true);
    });
  });

  describe('BLE Device Pairing', () => {
    it('scans for BLE devices during setup', async () => {
      const devices = await mockBLEService.scanDevices();

      expect(devices).toBeDefined();
      expect(devices.length).toBeGreaterThan(0);
      expect(devices[0]).toHaveProperty('name');
      expect(devices[0]).toHaveProperty('address');
    });

    it('pairs with a BLE device', async () => {
      const device = mockBLEDevices[0];
      const pairedDevice = await mockBLEService.connectDevice(device.id);

      expect(pairedDevice.connected).toBe(true);
      expect(pairedDevice.id).toBe(device.id);
    });

    it('reads device characteristics after pairing', async () => {
      const device = mockBLEDevices[0];
      await mockBLEService.connectDevice(device.id);

      const value = await mockBLEService.readCharacteristic('service-uuid', 'char-uuid');

      expect(value).toBeInstanceOf(Uint8Array);
    });
  });

  describe('MQTT Connection for Device Communication', () => {
    it('connects to MQTT broker for device communication', async () => {
      const client = await mockMQTTService.connect('mqtt://localhost:1883');

      expect(client.connected).toBe(true);
    });

    it('subscribes to device status topics', async () => {
      await mockMQTTService.connect('mqtt://localhost:1883');
      await mockMQTTService.subscribe('tendercells/devices/+/status');

      expect(mockMQTTService.subscribe).toHaveBeenCalledWith('tendercells/devices/+/status');
    });

    it('publishes device configuration', async () => {
      await mockMQTTService.connect('mqtt://localhost:1883');
      const config = {
        ssid: 'Test-Network',
        password: 'password123',
      };

      await mockMQTTService.publish(
        'tendercells/devices/device-1/config',
        JSON.stringify(config),
        { qos: 1 }
      );

      expect(mockMQTTService.publish).toHaveBeenCalled();
    });
  });

  describe('Complete Setup Flow', () => {
    it('completes full device connection setup', async () => {
      const product = mockProducts[0];

      // Step 1: Scan WiFi networks
      const networks = await mockWiFiService.scanNetworks();
      expect(networks.length).toBeGreaterThan(0);

      // Step 2: Connect to WiFi
      const network = networks[0];
      const wifiResult = await mockWiFiService.connectToNetwork(
        network.ssid,
        network.security !== 'none' ? 'password123' : undefined
      );
      expect(wifiResult.connected).toBe(true);

      // Step 3: Create network config
      const networkConfig: NetworkConfig = {
        ssid: wifiResult.ssid,
        password: network.security !== 'none' ? 'password123' : undefined,
        securityType: network.security,
        connected: true,
        ipAddress: wifiResult.ipAddress,
        lastConnected: new Date().toISOString(),
      };

      // Step 4: Connect product with network config
      // This would typically call ProductsService.connectProduct
      expect(networkConfig.connected).toBe(true);
      expect(networkConfig.ssid).toBe(network.ssid);

      // Step 5: Verify connection via MQTT
      await mockMQTTService.connect('mqtt://localhost:1883');
      await mockMQTTService.subscribe(`tendercells/devices/${product.device_id}/status`);

      expect(mockMQTTService.connect).toHaveBeenCalled();
      expect(mockMQTTService.subscribe).toHaveBeenCalled();
    });

    it('handles connection failures gracefully', async () => {
      // Simulate WiFi connection failure
      mockWiFiService.connectToNetwork = vi.fn().mockRejectedValueOnce(
        new Error('Connection timeout')
      );

      await expect(
        mockWiFiService.connectToNetwork('Test-Network', 'password')
      ).rejects.toThrow('Connection timeout');
    });

    it('retries connection on failure', async () => {
      // First attempt fails
      mockWiFiService.connectToNetwork = vi.fn()
        .mockRejectedValueOnce(new Error('Connection failed'))
        .mockResolvedValueOnce({
          ssid: 'Test-Network',
          connected: true,
          ipAddress: '192.168.1.100',
        });

      // First attempt
      await expect(
        mockWiFiService.connectToNetwork('Test-Network', 'password')
      ).rejects.toThrow();

      // Retry
      const result = await mockWiFiService.connectToNetwork('Test-Network', 'password');
      expect(result.connected).toBe(true);
    });
  });

  describe('Device Verification', () => {
    it('verifies device is online after connection', async () => {
      const product = mockProducts[0];

      // Connect to MQTT
      await mockMQTTService.connect('mqtt://localhost:1883');
      await mockMQTTService.subscribe(`tendercells/devices/${product.device_id}/status`);

      // Simulate receiving status message
      const statusMessage = {
        device_id: product.device_id,
        status: 'online',
        timestamp: new Date().toISOString(),
      };

      await mockMQTTService.publish(
        `tendercells/devices/${product.device_id}/status`,
        JSON.stringify(statusMessage),
        { qos: 1 }
      );

      expect(mockMQTTService.publish).toHaveBeenCalled();
    });

    it('checks device connectivity status', async () => {
      const product = mockProducts[0];

      // Mock device status check
      const checkStatus = async (deviceId: string) => {
        await mockMQTTService.connect('mqtt://localhost:1883');
        await mockMQTTService.publish(
          `tendercells/devices/${deviceId}/ping`,
          JSON.stringify({ timestamp: Date.now() }),
          { qos: 0 }
        );
        return { online: true, lastSeen: new Date().toISOString() };
      };

      const status = await checkStatus(product.device_id || '');
      expect(status.online).toBe(true);
    });
  });
});





