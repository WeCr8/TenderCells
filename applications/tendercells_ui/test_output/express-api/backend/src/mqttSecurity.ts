import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

export interface MqttCredential {
  clientId: string;
  username: string;
  passwordHash: string;
  publishPrefixes: string[];
  subscribePrefixes: string[];
}

interface CredentialFile { version: 1; clients: MqttCredential[] }

/** Same `scrypt:<salt>:<hex>` shape `verifyScryptSecret` below checks. */
export function hashScryptSecret(secret: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(secret, salt, 32).toString('hex');
  return `scrypt:${salt}:${hash}`;
}

export function verifyScryptSecret(secret: string, encoded: string): boolean {
  const [algorithm, salt, expectedHex] = encoded.split(':');
  if (algorithm !== 'scrypt' || !salt || !/^[a-f0-9]{64}$/.test(expectedHex || '')) return false;
  const actual = scryptSync(secret, salt, 32);
  const expected = Buffer.from(expectedHex, 'hex');
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export function topicAllowed(topic: string, prefixes: string[]): boolean {
  return prefixes.some((prefix) => {
    if (!prefix.startsWith('tc/') || prefix.includes('+')) return false;
    return prefix.endsWith('/#') ? topic.startsWith(prefix.slice(0, -1)) : topic === prefix;
  });
}

export function loadMqttCredentials(path: string): Map<string, MqttCredential> {
  const parsed = JSON.parse(readFileSync(path, 'utf8')) as Partial<CredentialFile>;
  if (parsed.version !== 1 || !Array.isArray(parsed.clients)) throw new Error('Invalid MQTT credential file');
  const result = new Map<string, MqttCredential>();
  for (const value of parsed.clients) {
    if (!value || typeof value.clientId !== 'string' || typeof value.username !== 'string' ||
        typeof value.passwordHash !== 'string' || !Array.isArray(value.publishPrefixes) ||
        !Array.isArray(value.subscribePrefixes) || result.has(value.clientId)) {
      throw new Error('Invalid or duplicate MQTT client credential');
    }
    result.set(value.clientId, value);
  }
  return result;
}

/**
 * Add or replace one device's credential in the file `loadMqttCredentials`
 * reads, creating it if this is the first enrollment. Used by edge-bridge
 * claim exchange — never called with a plaintext secret already hashed
 * elsewhere; callers pass the raw secret and this hashes it here.
 */
export function upsertMqttCredential(path: string, credential: Omit<MqttCredential, 'passwordHash'> & { secret: string }): void {
  const existing: CredentialFile = existsSync(path)
    ? (JSON.parse(readFileSync(path, 'utf8')) as CredentialFile)
    : { version: 1, clients: [] };
  const { secret, ...rest } = credential;
  const record: MqttCredential = { ...rest, passwordHash: hashScryptSecret(secret) };
  const clients = existing.clients.filter((c) => c.clientId !== record.clientId);
  clients.push(record);
  writeFileSync(path, JSON.stringify({ version: 1, clients }, null, 2), { mode: 0o600 });
}
