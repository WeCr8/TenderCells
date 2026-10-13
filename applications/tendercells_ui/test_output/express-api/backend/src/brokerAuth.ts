// brokerAuth.ts - optional username/password for the MQTT broker (devices and the hub bridge).
//
// Off by default so the classroom / science-fair LAN flow keeps working with zero setup.
// Turning on accounts (Firebase admin) only guards the HTTP API: any machine on the LAN could
// still publish tc/<id>/cmd/* straight to the broker and move a door or an arm. Set both
//   TC_MQTT_USERNAME and TC_MQTT_PASSWORD
// to make the embedded broker refuse clients without them; the hub bridge sends the same pair.
// Devices then need the pair in firmware (chicken-tender: MQTT_USER / MQTT_PASS in main.cpp).
import { timingSafeEqual } from "node:crypto";

export interface BrokerCredentials { username: string; password: string }

/** The configured pair, or null when broker auth is off (either variable missing or empty). */
export function brokerCredentials(env: NodeJS.ProcessEnv = process.env): BrokerCredentials | null {
  const username = env.TC_MQTT_USERNAME ?? "";
  const password = env.TC_MQTT_PASSWORD ?? "";
  return username && password ? { username, password } : null;
}

const same = (a: Buffer, b: Buffer) => a.length === b.length && timingSafeEqual(a, b);

/** Constant-time check of what a connecting client sent. */
export function credentialsMatch(expected: BrokerCredentials, username: string | undefined, password: Buffer | undefined): boolean {
  if (typeof username !== "string" || !password) return false;
  // Evaluate both so a wrong username takes as long as a wrong password.
  const u = same(Buffer.from(username), Buffer.from(expected.username));
  const p = same(Buffer.from(password), Buffer.from(expected.password));
  return u && p;
}

// ── per-device API keys on the broker (apiKeys.ts) ──────────────────────────────────────────
// With accounts on, a device may instead connect with username = its device id and
// password = a Tender Cells API key (tck_…). It is then fenced to its own topics:
//   publish   tc/<id>/sensors|state|state/<sub>|alert|event|ack|status   needs device:telemetry
//   subscribe tc/<id>/cmd/<x> (or tc/<id>/cmd/#)                          needs device:commands
// <id> must be the key's bound device, or (unbound key) a device the key's owner owns.
// Wildcards in the device position are refused, so a key never sees another farm's traffic.
// Mesh bridges that relay for several boards keep using the shared TC_MQTT_USERNAME pair.
import type { ApiKeyPrincipal } from "./apiKeys.js";

const DEVICE_PUBLISH = /^tc\/([A-Za-z0-9_-]{1,64})\/(sensors|state|state\/[a-z_]{1,32}|alert|event|ack|status)$/;
const DEVICE_SUBSCRIBE = /^tc\/([A-Za-z0-9_-]{1,64})\/cmd\/([a-z_\/]{1,48}|#)$/;

/**
 * May a key-authenticated broker client use this topic?
 *
 * @param principal - The verified key the client connected with
 * @param action - publish or subscribe
 * @param topic - The topic (or subscription filter)
 * @param owns - Does the key's owner own this device id?
 * @returns null when allowed, otherwise the reason
 */
export async function keyTopicRefusal(
  principal: ApiKeyPrincipal,
  action: "publish" | "subscribe",
  topic: string,
  owns: (deviceId: string) => Promise<boolean>,
): Promise<string | null> {
  const m = (action === "publish" ? DEVICE_PUBLISH : DEVICE_SUBSCRIBE).exec(topic);
  if (!m) return `${action} to ${topic} is not allowed with an API key`;
  const scope = action === "publish" ? "device:telemetry" : "device:commands";
  if (!principal.scopes.includes(scope)) return `API key lacks ${scope}`;
  const deviceId = m[1];
  if (principal.deviceId) return principal.deviceId === deviceId ? null : `API key is bound to ${principal.deviceId}`;
  return (await owns(deviceId)) ? null : `API key owner does not own ${deviceId}`;
}
