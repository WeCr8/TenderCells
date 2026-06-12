/**
 * MQTT Service for device communication
 * This service provides a clean interface for components to interact with MQTT functionality
 */

export interface MQTTMessage {
  topic: string;
  payload: string | Buffer;
  qos: 0 | 1 | 2;
  retain?: boolean;
}

export interface MQTTClient {
  connected: boolean;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  subscribe(topic: string, options?: { qos?: 0 | 1 | 2 }): Promise<{ messageId: number }>;
  unsubscribe(topic: string): Promise<void>;
  publish(topic: string, message: string | Buffer, options?: { qos?: 0 | 1 | 2; retain?: boolean }): Promise<{ messageId: number }>;
  on(event: string, callback: Function): void;
  off(event: string, callback: Function): void;
}

export interface MQTTService {
  createClient(brokerUrl: string, options?: any): MQTTClient;
  connect(brokerUrl: string, options?: any): Promise<MQTTClient>;
  subscribe(client: MQTTClient, topic: string, options?: { qos?: 0 | 1 | 2 }): Promise<void>;
  publish(client: MQTTClient, topic: string, message: string | Buffer, options?: { qos?: 0 | 1 | 2; retain?: boolean }): Promise<void>;
  disconnect(client: MQTTClient): Promise<void>;
}

// In a real implementation, this would use an MQTT library like mqtt.js
// For now, we'll use a mockable interface
class MQTTServiceImpl implements MQTTService {
  createClient(brokerUrl: string, options?: any): MQTTClient {
    if (typeof window !== 'undefined' && (window as any).mqttService) {
      return (window as any).mqttService.createClient(brokerUrl, options);
    }
    throw new Error('MQTT service not available. Use mockMQTTService in tests.');
  }

  async connect(brokerUrl: string, options?: any): Promise<MQTTClient> {
    if (typeof window !== 'undefined' && (window as any).mqttService) {
      return (window as any).mqttService.connect(brokerUrl, options);
    }
    throw new Error('MQTT service not available. Use mockMQTTService in tests.');
  }

  async subscribe(client: MQTTClient, topic: string, options?: { qos?: 0 | 1 | 2 }): Promise<void> {
    await client.subscribe(topic, options);
  }

  async publish(client: MQTTClient, topic: string, message: string | Buffer, options?: { qos?: 0 | 1 | 2; retain?: boolean }): Promise<void> {
    await client.publish(topic, message, options);
  }

  async disconnect(client: MQTTClient): Promise<void> {
    await client.disconnect();
  }
}

export const mqttService: MQTTService = new MQTTServiceImpl();
