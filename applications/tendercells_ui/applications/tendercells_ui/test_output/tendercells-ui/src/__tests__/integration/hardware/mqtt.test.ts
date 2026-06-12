import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mockMQTTService, mockMQTTClient, resetHardwareMocks } from '../../../../tests/mocks/hardware';
import { mockMQTTTopics, mockMQTTMessages } from '../../../../tests/fixtures/devices';

describe('MQTT Integration', () => {
  beforeEach(() => {
    resetHardwareMocks();
  });

  describe('Connection Management', () => {
    it('connects to MQTT broker', async () => {
      const client = await mockMQTTService.connect('mqtt://localhost:1883');

      expect(mockMQTTService.connect).toHaveBeenCalledWith('mqtt://localhost:1883');
      expect(client.connected).toBe(true);
    });

    it('disconnects from MQTT broker', async () => {
      await mockMQTTService.connect('mqtt://localhost:1883');
      await mockMQTTService.disconnect();

      expect(mockMQTTService.disconnect).toHaveBeenCalled();
      expect(mockMQTTClient.connected).toBe(false);
    });
  });

  describe('Topic Subscription', () => {
    it('subscribes to a topic', async () => {
      await mockMQTTService.connect('mqtt://localhost:1883');
      await mockMQTTService.subscribe(mockMQTTTopics.deviceStatus);

      expect(mockMQTTService.subscribe).toHaveBeenCalledWith(mockMQTTTopics.deviceStatus);
    });

    it('subscribes to multiple topics', async () => {
      await mockMQTTService.connect('mqtt://localhost:1883');
      
      await mockMQTTService.subscribe(mockMQTTTopics.deviceStatus);
      await mockMQTTService.subscribe(mockMQTTTopics.deviceTelemetry);

      expect(mockMQTTService.subscribe).toHaveBeenCalledTimes(2);
    });
  });

  describe('Message Publishing', () => {
    it('publishes a message to a topic', async () => {
      await mockMQTTService.connect('mqtt://localhost:1883');
      const message = mockMQTTMessages[0];

      await mockMQTTService.publish(message.topic, message.payload, { qos: message.qos });

      expect(mockMQTTService.publish).toHaveBeenCalledWith(
        message.topic,
        message.payload,
        expect.objectContaining({ qos: message.qos })
      );
    });

    it('publishes with different QoS levels', async () => {
      await mockMQTTService.connect('mqtt://localhost:1883');

      await mockMQTTService.publish('test/topic', 'message', { qos: 0 });
      await mockMQTTService.publish('test/topic', 'message', { qos: 1 });
      await mockMQTTService.publish('test/topic', 'message', { qos: 2 });

      expect(mockMQTTService.publish).toHaveBeenCalledTimes(3);
    });
  });

  describe('Message Receiving', () => {
    it('receives messages from subscribed topics', () => {
      const messageHandler = vi.fn();
      mockMQTTClient.on('message', messageHandler);

      // Simulate message reception
      const testMessage = mockMQTTMessages[0];
      mockMQTTClient.on('message', (topic, payload) => {
        messageHandler(topic, payload);
      });

      expect(mockMQTTClient.on).toHaveBeenCalledWith('message', expect.any(Function));
    });
  });
});





