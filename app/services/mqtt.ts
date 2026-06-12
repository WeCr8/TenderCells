// MQTT service — hardware control via local broker
// Last updated: 2026-06-11

import mqtt from 'mqtt';

interface MQTTConfig {
  broker: string;
  port: number;
  username?: string;
  password?: string;
}

class MQTTService {
  private client: mqtt.MqttClient | null = null;
  private config: MQTTConfig;
  private connected = false;
  private subscriptions: Map<string, (message: any) => void> = new Map();

  constructor(config: MQTTConfig) {
    this.config = config;
  }

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      const url = `mqtt://${this.config.broker}:${this.config.port}`;

      this.client = mqtt.connect(url, {
        username: this.config.username,
        password: this.config.password,
        clientId: `tender_cells_${Date.now()}`,
        reconnectPeriod: 5000,
        keepalive: 60,
      });

      this.client.on('connect', () => {
        console.log('✓ MQTT connected to', url);
        this.connected = true;
        resolve();
      });

      this.client.on('error', (error) => {
        console.error('✗ MQTT error:', error);
        reject(error);
      });

      this.client.on('message', (topic, message) => {
        this.handleMessage(topic, message);
      });
    });
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      return new Promise((resolve) => {
        this.client!.end(() => {
          this.connected = false;
          resolve();
        });
      });
    }
  }

  isConnected(): boolean {
    return this.connected;
  }

  private handleMessage(topic: string, message: Buffer) {
    try {
      const payload = JSON.parse(message.toString());
      const handler = this.subscriptions.get(topic);
      if (handler) {
        handler(payload);
      }
    } catch (error) {
      console.error('Failed to parse MQTT message:', error);
    }
  }

  subscribe(topic: string, handler: (message: any) => void) {
    if (!this.client) return;
    this.subscriptions.set(topic, handler);
    this.client.subscribe(topic, { qos: 1 }, (error) => {
      if (error) console.error(`Failed to subscribe to ${topic}:`, error);
      else console.log(`✓ Subscribed to ${topic}`);
    });
  }

  unsubscribe(topic: string) {
    if (!this.client) return;
    this.subscriptions.delete(topic);
    this.client.unsubscribe(topic, (error) => {
      if (error) console.error(`Failed to unsubscribe from ${topic}:`, error);
      else console.log(`✓ Unsubscribed from ${topic}`);
    });
  }

  publish(topic: string, payload: any, qos: 0 | 1 | 2 = 1): boolean {
    if (!this.client || !this.connected) {
      console.warn('MQTT not connected');
      return false;
    }

    this.client.publish(topic, JSON.stringify(payload), { qos }, (error) => {
      if (error) console.error(`Failed to publish to ${topic}:`, error);
      else console.log(`→ Published to ${topic}`);
    });

    return true;
  }
}

// Hardware command helpers
export const createMQTTService = (broker: string = 'localhost', port: number = 1883) => {
  return new MQTTService({ broker, port });
};

export const sendArmCommand = async (mqtt: MQTTService, deviceId: string, command: {
  joints: number[];
  speed: number;
  waitForAck?: boolean;
}) => {
  const topic = `tc/${deviceId}/cmd/arm`;
  const payload = {
    seq: Date.now(),
    ...command,
  };
  mqtt.publish(topic, payload, 1);
};

export const sendDoorCommand = async (mqtt: MQTTService, deviceId: string, state: 'open' | 'close') => {
  const topic = `tc/${deviceId}/cmd/door`;
  mqtt.publish(topic, { state }, 1);
};

export const sendFeedCommand = async (mqtt: MQTTService, deviceId: string, amount: number) => {
  const topic = `tc/${deviceId}/cmd/feed`;
  mqtt.publish(topic, { amount }, 1);
};

export const sendCleanCommand = async (mqtt: MQTTService, deviceId: string, action: 'start' | 'stop') => {
  const topic = `tc/${deviceId}/cmd/clean`;
  mqtt.publish(topic, { action }, 1);
};

export const sendEstop = async (mqtt: MQTTService, deviceId: string) => {
  const topic = `tc/${deviceId}/cmd/estop`;
  mqtt.publish(topic, { active: true }, 2); // QoS 2, retained
};

export const subscribeTelemetry = (mqtt: MQTTService, deviceId: string, handler: (data: any) => void) => {
  const topic = `tc/${deviceId}/sensors`;
  mqtt.subscribe(topic, handler);
  return () => mqtt.unsubscribe(topic);
};

export const subscribeState = (mqtt: MQTTService, deviceId: string, handler: (data: any) => void) => {
  const topic = `tc/${deviceId}/state`;
  mqtt.subscribe(topic, handler);
  return () => mqtt.unsubscribe(topic);
};

export const subscribeAlerts = (mqtt: MQTTService, deviceId: string, handler: (data: any) => void) => {
  const topic = `tc/${deviceId}/alert`;
  mqtt.subscribe(topic, handler);
  return () => mqtt.unsubscribe(topic);
};

export default MQTTService;
