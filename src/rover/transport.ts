// Transports for the rover control pad.
//  - MqttWsTransport: MQTT over WebSocket to the farm's local Mosquitto broker
//    (mosquitto.conf: `listener 9001` / `protocol websockets`). Motion stays on
//    the LAN, never through the cloud (same rule as the classroom docs).
//  - DemoTransport: no hardware; records what would be sent (for demos/tests).
import type { MqttClient } from 'mqtt';
import type { LinkStatus, PublishOptions, RoverTransport } from './session';

type Listener = (s: LinkStatus, detail?: string) => void;

class StatusHub {
  private ls = new Set<Listener>();
  on(cb: Listener) {
    this.ls.add(cb);
    return () => {
      this.ls.delete(cb);
    };
  }
  emit(s: LinkStatus, d?: string) {
    this.ls.forEach((l) => l(s, d));
  }
}

export interface MqttSettings {
  url: string; // ws://192.168.1.100:9001 or wss://...
  username?: string;
  password?: string;
}

export function normalizeBrokerUrl(input: string): string {
  let u = (input || '').trim();
  if (!u) return '';
  if (!/^wss?:\/\//i.test(u)) u = `ws://${u}`;
  // Default Mosquitto websockets port from mosquitto.conf.
  const m = u.match(/^(wss?:\/\/)([^/:]+)(:\d+)?(\/.*)?$/i);
  if (m && !m[3]) u = `${m[1]}${m[2]}:9001${m[4] || ''}`;
  return u;
}

export class MqttWsTransport implements RoverTransport {
  readonly kind = 'mqtt';
  private client: MqttClient | null = null;
  private hub = new StatusHub();
  private connected = false;

  private settings: MqttSettings;
  constructor(settings: MqttSettings) {
    this.settings = settings;
  }

  async connect(): Promise<void> {
    const url = normalizeBrokerUrl(this.settings.url);
    if (!url) throw new Error('Enter the broker address (e.g. 192.168.1.100)');
    this.hub.emit('connecting');
    const mod = await import('mqtt');
    const mqtt = (mod as unknown as { default?: typeof mod }).default ?? mod;
    await new Promise<void>((resolve, reject) => {
      const c = mqtt.connect(url, {
        username: this.settings.username || undefined,
        password: this.settings.password || undefined,
        clientId: `tc_pad_${Math.random().toString(16).slice(2, 10)}`,
        keepalive: 5, // seconds; broker drops us fast if the phone vanishes
        reconnectPeriod: 2000,
        connectTimeout: 5000,
        clean: true,
      });
      this.client = c;
      let settled = false;
      c.on('connect', () => {
        this.connected = true;
        this.hub.emit('connected');
        if (!settled) {
          settled = true;
          resolve();
        }
      });
      const down = (s: LinkStatus, d?: string) => {
        if (this.connected || s === 'error') {
          this.connected = false;
          this.hub.emit(s, d);
        }
      };
      c.on('close', () => down('disconnected'));
      c.on('offline', () => down('disconnected'));
      c.on('reconnect', () => this.hub.emit('connecting'));
      c.on('error', (e: Error) => {
        down('error', e?.message);
        if (!settled) {
          settled = true;
          reject(e);
        }
      });
    });
  }

  async disconnect(): Promise<void> {
    const c = this.client;
    this.client = null;
    this.connected = false;
    if (c) await new Promise<void>((r) => c.end(false, {}, () => r()));
    this.hub.emit('disconnected');
  }

  isConnected(): boolean {
    return this.connected && !!this.client?.connected;
  }

  publish(topic: string, payload: Record<string, unknown>, opts: PublishOptions = {}): boolean {
    if (!this.isConnected() || !this.client) return false;
    this.client.publish(topic, JSON.stringify(payload), { qos: opts.qos ?? 0, retain: !!opts.retain });
    return true;
  }

  onStatus(cb: Listener): () => void {
    return this.hub.on(cb);
  }
}

export interface SentRecord {
  t: number;
  topic: string;
  payload: Record<string, unknown>;
  opts: PublishOptions;
}

export class DemoTransport implements RoverTransport {
  readonly kind = 'demo';
  private hub = new StatusHub();
  private connected = false;
  readonly sent: SentRecord[] = [];

  private now: () => number;
  constructor(now: () => number = () => Date.now()) {
    this.now = now;
  }

  async connect(): Promise<void> {
    this.connected = true;
    this.hub.emit('connected');
  }
  async disconnect(): Promise<void> {
    this.connected = false;
    this.hub.emit('disconnected');
  }
  /** Simulate a dropped link (tests). */
  drop(): void {
    this.connected = false;
    this.hub.emit('disconnected');
  }
  isConnected(): boolean {
    return this.connected;
  }
  publish(topic: string, payload: Record<string, unknown>, opts: PublishOptions = {}): boolean {
    if (!this.connected) return false;
    this.sent.push({ t: this.now(), topic, payload, opts });
    if (this.sent.length > 500) this.sent.splice(0, this.sent.length - 500);
    return true;
  }
  onStatus(cb: Listener): () => void {
    return this.hub.on(cb);
  }
}
