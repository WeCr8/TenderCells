// mqttImportAdapter.ts - M3: generic MQTT import, read-only.
//
// This is NOT the hub's own embedded broker (broker.ts, Aedes - devices connect INTO that)
// and not the hub's own outbound client (mqtt.controller.ts - one singleton connection to
// the hub's own configured MQTT_BROKER for tc/{id}/* devices). This is a genuinely separate
// capability: the owner points the gateway at a DIFFERENT broker they already run (their own
// Mosquitto, Home Assistant's MQTT integration, whatever), and the gateway connects OUT to it
// as a short-lived read-only client to preview what's there.
//
// Bounded preview scan, not a persistent subscription manager: connect, subscribe to the
// owner-approved topic patterns only, collect messages for a few seconds, disconnect. No
// publish capability exists anywhere in this file. tc/{id}/* topics are always excluded -
// those are this hub's own native device contract (docs/CONNECT_A_DEVICE.md) and must never
// be reinterpreted through a second, generic import path.
import mqtt from "mqtt";
import { randomUUID } from "node:crypto";
import type { Capability, DiscoveryCandidate } from "./types.js";

export const MAX_TOPIC_PATTERNS = 10;
export const MAX_PAYLOAD_BYTES = 16 * 1024;
export const SCAN_WINDOW_MS = 2500;
export const CONNECT_TIMEOUT_MS = 5000;

export interface MqttConnectOptions {
  brokerUrl: string;
  username?: string;
  password?: string;
  topics: string[];
}

export type MqttResult<T> = { ok: true; value: T } | { ok: false; error: string };

/** Same spirit as homeAssistantAdapter's isPrivateHaUrl: the configured broker must be a
 *  private/local address. First pass only, not DNS-rebinding-proof. */
export function isPrivateBrokerUrl(url: string): boolean {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }
  if (!["mqtt:", "mqtts:", "ws:", "wss:", "tcp:", "ssl:"].includes(parsed.protocol)) return false;
  const host = parsed.hostname.toLowerCase();
  if (host === "localhost" || host === "127.0.0.1" || host === "::1") return true;
  if (host.endsWith(".local") || host.endsWith(".lan") || host.endsWith(".home")) return true;
  const m = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (m) {
    const [a, b] = [Number(m[1]), Number(m[2])];
    if (a === 10) return true;
    if (a === 192 && b === 168) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 169 && b === 254) return true;
    return false;
  }
  if (!host.includes(".")) return true;
  return false;
}

/** Never a bare `#`, never anything under tc/ (this hub's own device contract), bounded count. */
export function validateTopicPatterns(topics: string[]): string | null {
  if (!Array.isArray(topics) || topics.length === 0) return "At least one topic pattern is required";
  if (topics.length > MAX_TOPIC_PATTERNS) return `No more than ${MAX_TOPIC_PATTERNS} topic patterns per scan`;
  for (const t of topics) {
    if (typeof t !== "string" || !t.trim()) return "Topic patterns must be non-empty strings";
    if (t.trim() === "#") return 'Subscribing to the bare "#" wildcard is not allowed - use a scoped pattern';
    if (t === "tc" || t.startsWith("tc/")) return 'Topics under "tc/" are this hub\'s own device contract and cannot be imported generically';
  }
  return null;
}

function parsePayload(buf: Buffer): unknown {
  if (buf.length > MAX_PAYLOAD_BYTES) return undefined;
  const text = buf.toString("utf8");
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function toCapability(value: unknown): Capability {
  return {
    id: "mqtt.message",
    mode: "read",
    tier: "observe",
    installed: true,
    enabled: false,
    observedAt: new Date().toISOString(),
    value,
    provenance: "real",
  };
}

/** Connects, subscribes read-only, collects one message per topic for SCAN_WINDOW_MS, then
 *  disconnects. Never publishes. Returns whatever topics produced a message in the window -
 *  a device that only publishes on change may simply not appear in a short scan. */
export async function discoverCandidates(gatewayId: string, opts: MqttConnectOptions): Promise<MqttResult<{ candidates: DiscoveryCandidate[] }>> {
  const topicError = validateTopicPatterns(opts.topics);
  if (topicError) return { ok: false, error: topicError };
  if (!isPrivateBrokerUrl(opts.brokerUrl)) return { ok: false, error: "brokerUrl is not a private/local address; refusing to connect" };

  return new Promise((resolve) => {
    let settled = false;
    const seen = new Map<string, unknown>();
    const client = mqtt.connect(opts.brokerUrl, {
      username: opts.username,
      password: opts.password,
      connectTimeout: CONNECT_TIMEOUT_MS,
      reconnectPeriod: 0, // never auto-reconnect a preview scan
      clientId: `tc-connect-preview-${randomUUID().slice(0, 8)}`,
    });

    const finish = (result: MqttResult<{ candidates: DiscoveryCandidate[] }>) => {
      if (settled) return;
      settled = true;
      client.end(true);
      resolve(result);
    };

    const timer = setTimeout(() => {
      const foundAt = new Date().toISOString();
      const candidates: DiscoveryCandidate[] = [...seen.entries()].map(([topic, value]) => ({
        tempId: randomUUID(),
        identity: { adapter: "mqtt", gatewayId, sourceSystemId: opts.brokerUrl, externalId: topic },
        displayName: topic,
        capabilities: [toCapability(value)],
        sourceLabel: "MQTT broker",
        foundAt,
      }));
      finish({ ok: true, value: { candidates } });
    }, SCAN_WINDOW_MS);

    client.on("connect", () => {
      client.subscribe(opts.topics, { qos: 0 }, (err) => {
        if (err) {
          clearTimeout(timer);
          finish({ ok: false, error: `subscribe failed: ${err.message}` });
        }
      });
    });

    client.on("message", (topic, payload) => {
      // tc/* can never reach here (validateTopicPatterns already rejected those patterns),
      // but a broker that ignores wildcards oddly is not trusted either - check again.
      if (topic === "tc" || topic.startsWith("tc/")) return;
      seen.set(topic, parsePayload(payload));
    });

    client.on("error", (err) => {
      clearTimeout(timer);
      finish({ ok: false, error: err.message });
    });
  });
}

/** Auth/reachability only - connects, waits for the "connect" event or an error, disconnects.
 *  Never subscribes to anything. */
export async function testConnection(opts: Pick<MqttConnectOptions, "brokerUrl" | "username" | "password">): Promise<MqttResult<{ connected: true }>> {
  if (!isPrivateBrokerUrl(opts.brokerUrl)) return { ok: false, error: "brokerUrl is not a private/local address; refusing to connect" };
  return new Promise((resolve) => {
    let settled = false;
    const client = mqtt.connect(opts.brokerUrl, {
      username: opts.username,
      password: opts.password,
      connectTimeout: CONNECT_TIMEOUT_MS,
      reconnectPeriod: 0,
      clientId: `tc-connect-test-${randomUUID().slice(0, 8)}`,
    });
    const finish = (result: MqttResult<{ connected: true }>) => {
      if (settled) return;
      settled = true;
      client.end(true);
      resolve(result);
    };
    client.on("connect", () => finish({ ok: true, value: { connected: true } }));
    client.on("error", (err) => finish({ ok: false, error: err.message }));
    setTimeout(() => finish({ ok: false, error: "connection timed out" }), CONNECT_TIMEOUT_MS + 1000);
  });
}
