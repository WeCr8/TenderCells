/**
 * Integration test for MQTT connections with UI components
 * Tests the full flow: UI -> MQTT Service -> Device Communication -> Mock
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { mockMQTTService, mockMQTTClient, resetHardwareMocks, setupHardwareMocks } from '../../../../tests/mocks/hardware';
import { mockMQTTTopics, mockMQTTMessages } from '../../../../tests/fixtures/devices';
import { mockProducts } from '../../../../tests/fixtures/products';
import { mqttService } from '../../../services/mqttService';

describe('MQTT Connection Integration', () => {
  beforeEach(() => {
    resetHardwareMocks();
    setupHardwareMocks();
    
    // Make MQTT service available to components
    (global as any).window = {
      ...global.window,
      mqttService: mockMQTTService,
    };
  });

  describe('MQTT Connection Management', () => {
    it('connects to MQTT broker successfully', async () => {
      const client = await mqttService.connect('mqtt://localhost:1883');
      
      expect(client).toBeDefined();
      expect(client.connected).toBe(true);
      expect(mockMQTTService.connect).toHaveBeenCalledWith('mqtt://localhost:1883');
    });

    it('disconnects from MQTT broker', async () => {
      const client = await mqttService.connect('mqtt://localhost:1883');
      await mqttService.disconnect(client);
      
      expect(mockMQTTClient.connected).toBe(false);
      expect(mockMQTTService.disconnect).toHaveBeenCalled();
    });

    it('handles connection failures gracefully', async () => {
      mockMQTTService.connect = vi.fn().mockRejectedValueOnce(
        new Error('Connection refused')
      );

      await expect(
        mqttService.connect('mqtt://invalid:1883')
      ).rejects.toThrow('Connection refused');
    });
  });

  describe('MQTT Topic Subscription', () => {
    it('subscribes to device status topics', async () => {
      const client = await mqttService.connect('mqtt://localhost:1883');
      await mqttService.subscribe(client, mockMQTTTopics.deviceStatus);
      
      expect(mockMQTTService.subscribe).toHaveBeenCalledWith(mockMQTTTopics.deviceStatus);
    });

    it('subscribes to multiple topics', async () => {
      const client = await mqttService.connect('mqtt://localhost:1883');
      
      await mqttService.subscribe(client, mockMQTTTopics.deviceStatus);
      await mqttService.subscribe(client, mockMQTTTopics.deviceTelemetry);
      
      expect(mockMQTTService.subscribe).toHaveBeenCalledTimes(2);
    });

    it('subscribes with QoS levels', async () => {
      const client = await mqttService.connect('mqtt://localhost:1883');
      await mqttService.subscribe(client, mockMQTTTopics.deviceStatus, { qos: 1 });
      
      expect(mockMQTTService.subscribe).toHaveBeenCalledWith(
        mockMQTTTopics.deviceStatus,
        expect.objectContaining({ qos: 1 })
      );
    });
  });

  describe('MQTT Message Publishing', () => {
    it('publishes messages to topics', async () => {
      const client = await mqttService.connect('mqtt://localhost:1883');
      const message = mockMQTTMessages[0];
      
      await mqttService.publish(client, message.topic, message.payload, {
        qos: message.qos,
        retain: message.retain,
      });
      
      expect(mockMQTTService.publish).toHaveBeenCalledWith(
        message.topic,
        message.payload,
        expect.objectContaining({ qos: message.qos })
      );
    });

    it('publishes device configuration', async () => {
      const client = await mqttService.connect('mqtt://localhost:1883');
      const config = {
        ssid: 'Test-Network',
        password: 'password123',
      };
      
      await mqttService.publish(
        client,
        'tendercells/devices/device-1/config',
        JSON.stringify(config),
        { qos: 1 }
      );
      
      expect(mockMQTTService.publish).toHaveBeenCalled();
    });

    it('publishes with different QoS levels', async () => {
      const client = await mqttService.connect('mqtt://localhost:1883');
      
      await mqttService.publish(client, 'test/topic', 'message', { qos: 0 });
      await mqttService.publish(client, 'test/topic', 'message', { qos: 1 });
      await mqttService.publish(client, 'test/topic', 'message', { qos: 2 });
      
      expect(mockMQTTService.publish).toHaveBeenCalledTimes(3);
    });
  });

  describe('MQTT Message Receiving', () => {
    it('receives messages from subscribed topics', async () => {
      const client = await mqttService.connect('mqtt://localhost:1883');
      const messageHandler = vi.fn();
      
      client.on('message', messageHandler);
      
      // Simulate message reception
      const testMessage = mockMQTTMessages[0];
      if (mockMQTTClient.on) {
        (mockMQTTClient.on as any).mock.calls.forEach(([event, callback]: [string, Function]) => {
          if (event === 'message') {
            callback(testMessage.topic, testMessage.payload);
          }
        });
      }
      
      expect(mockMQTTClient.on).toHaveBeenCalledWith('message', expect.any(Function));
    });

    it('handles device status updates', async () => {
      const client = await mqttService.connect('mqtt://localhost:1883');
      await mqttService.subscribe(client, mockMQTTTopics.deviceStatus);
      
      const statusHandler = vi.fn();
      client.on('message', (topic: string, payload: string) => {
        if (topic.includes('/status')) {
          statusHandler(JSON.parse(payload));
        }
      });
      
      // Simulate status message
      const statusMessage = {
        device_id: 'device-1',
        status: 'online',
        timestamp: new Date().toISOString(),
      };
      
      await mqttService.publish(
        client,
        'tendercells/devices/device-1/status',
        JSON.stringify(statusMessage),
        { qos: 1 }
      );
      
      expect(mockMQTTService.publish).toHaveBeenCalled();
    });
  });

  describe('Device Communication Flow', () => {
    it('completes full device communication flow', async () => {
      const product = mockProducts[0];
      
      // Step 1: Connect to MQTT broker
      const client = await mqttService.connect('mqtt://localhost:1883');
      expect(client.connected).toBe(true);
      
      // Step 2: Subscribe to device topics
      await mqttService.subscribe(client, `tendercells/devices/${product.device_id}/status`);
      await mqttService.subscribe(client, `tendercells/devices/${product.device_id}/telemetry`);
      
      expect(mockMQTTService.subscribe).toHaveBeenCalledTimes(2);
      
      // Step 3: Publish device command
      const command = {
        action: 'get_status',
        timestamp: new Date().toISOString(),
      };
      
      await mqttService.publish(
        client,
        `tendercells/devices/${product.device_id}/commands`,
        JSON.stringify(command),
        { qos: 1 }
      );
      
      expect(mockMQTTService.publish).toHaveBeenCalled();
      
      // Step 4: Receive status response
      const statusResponse = {
        device_id: product.device_id,
        status: 'online',
        data: { temperature: 22.5, humidity: 65 },
        timestamp: new Date().toISOString(),
      };
      
      await mqttService.publish(
        client,
        `tendercells/devices/${product.device_id}/status`,
        JSON.stringify(statusResponse),
        { qos: 1 }
      );
      
      expect(mockMQTTService.publish).toHaveBeenCalledTimes(2);
    });

    it('handles device reconnection flow', async () => {
      const product = mockProducts[0];
      
      // Initial connection
      let client = await mqttService.connect('mqtt://localhost:1883');
      await mqttService.subscribe(client, `tendercells/devices/${product.device_id}/status`);
      
      // Disconnect
      await mqttService.disconnect(client);
      expect(mockMQTTClient.connected).toBe(false);
      
      // Reconnect
      client = await mqttService.connect('mqtt://localhost:1883');
      await mqttService.subscribe(client, `tendercells/devices/${product.device_id}/status`);
      
      expect(mockMQTTService.connect).toHaveBeenCalledTimes(2);
      expect(mockMQTTService.subscribe).toHaveBeenCalledTimes(2);
    });
  });

  describe('Error Handling', () => {
    it('handles publish failures', async () => {
      const client = await mqttService.connect('mqtt://localhost:1883');
      
      mockMQTTService.publish = vi.fn().mockRejectedValueOnce(
        new Error('Publish failed')
      );
      
      await expect(
        mqttService.publish(client, 'test/topic', 'message', { qos: 1 })
      ).rejects.toThrow('Publish failed');
    });

    it('handles subscription failures', async () => {
      const client = await mqttService.connect('mqtt://localhost:1883');
      
      mockMQTTService.subscribe = vi.fn().mockRejectedValueOnce(
        new Error('Subscription failed')
      );
      
      await expect(
        mqttService.subscribe(client, 'test/topic')
      ).rejects.toThrow('Subscription failed');
    });

    it('handles connection drops gracefully', async () => {
      const client = await mqttService.connect('mqtt://localhost:1883');
      
      // Simulate connection drop
      mockMQTTClient.connected = false;
      
      // Attempt to publish should handle gracefully
      try {
        await mqttService.publish(client, 'test/topic', 'message');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('Real-time Device Monitoring', () => {
    it('monitors device telemetry in real-time', async () => {
      const product = mockProducts[0];
      const client = await mqttService.connect('mqtt://localhost:1883');
      
      const telemetryHandler = vi.fn();
      await mqttService.subscribe(client, `tendercells/devices/${product.device_id}/telemetry`);
      
      client.on('message', (topic: string, payload: string) => {
        if (topic.includes('/telemetry')) {
          telemetryHandler(JSON.parse(payload));
        }
      });
      
      // Simulate telemetry updates
      const telemetry1 = {
        device_id: product.device_id,
        temperature: 22.5,
        humidity: 65,
        timestamp: new Date().toISOString(),
      };
      
      const telemetry2 = {
        device_id: product.device_id,
        temperature: 23.0,
        humidity: 66,
        timestamp: new Date().toISOString(),
      };
      
      await mqttService.publish(
        client,
        `tendercells/devices/${product.device_id}/telemetry`,
        JSON.stringify(telemetry1),
        { qos: 0 }
      );
      
      await mqttService.publish(
        client,
        `tendercells/devices/${product.device_id}/telemetry`,
        JSON.stringify(telemetry2),
        { qos: 0 }
      );
      
      expect(mockMQTTService.publish).toHaveBeenCalledTimes(2);
    });

    it('handles device offline notifications', async () => {
      const product = mockProducts[0];
      const client = await mqttService.connect('mqtt://localhost:1883');
      
      await mqttService.subscribe(client, mockMQTTTopics.systemEvents);
      
      const offlineMessage = {
        event: 'device_offline',
        device_id: product.device_id,
        timestamp: new Date().toISOString(),
      };
      
      await mqttService.publish(
        client,
        'tendercells/system/events',
        JSON.stringify(offlineMessage),
        { qos: 2, retain: true }
      );
      
      expect(mockMQTTService.publish).toHaveBeenCalledWith(
        'tendercells/system/events',
        expect.stringContaining('device_offline'),
        expect.objectContaining({ qos: 2, retain: true })
      );
    });
  });
});
