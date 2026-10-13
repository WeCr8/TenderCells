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
