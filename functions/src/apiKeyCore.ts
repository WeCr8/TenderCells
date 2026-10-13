// apiKeyCore.ts - robot / hub API keys for Cloud Functions (deviceApi, key management callables).
//
// The shared section below is a byte-for-byte copy of
// applications/tendercells_ui/test_output/express-api/backend/src/apiKeys.ts (the hub), so a key
// the app issues works on both the hub and Cloud Functions. apiKeyCore.test.ts fails if the two
// copies drift. Format, storage and rules are documented in the hub file.
// ---- shared core (begin) ----
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

export const API_KEY_SCOPES = ["device:telemetry", "device:commands", "schedules:read"] as const;
export type ApiKeyScope = (typeof API_KEY_SCOPES)[number];

export const API_KEY_PREFIX = "tck_";
export const MAX_KEY_LIFETIME_MS = 2 * 365 * 24 * 60 * 60_000; // 2 years

/** What is stored at apiKeys/{keyId}. Never contains the key itself. */
export interface ApiKeyRecord {
  keyId: string;
  hash: string;
  ownerId: string;
  name: string;
  scopes: ApiKeyScope[];
  deviceId: string | null;
  createdAt: number;
  expiresAt: number | null;
  revokedAt: number | null;
  lastUsedAt?: number | null;
}

/** Who a verified key acts as. */
export interface ApiKeyPrincipal {
  kind: "apiKey";
  uid: string;
  keyId: string;
  scopes: ApiKeyScope[];
  deviceId: string | null;
}

export const hashApiKey = (key: string) => createHash("sha256").update(key).digest("hex");

/** True for anything shaped like a Tender Cells API key (cheap check before a lookup). */
export function looksLikeApiKey(value: string | undefined | null): value is string {
  return typeof value === "string" && /^tck_[A-Za-z0-9]{12}_[A-Za-z0-9_-]{43}$/.test(value);
}

/** The public key id inside a key, or null when the key is malformed. */
export function apiKeyId(key: string): string | null {
  return looksLikeApiKey(key) ? key.slice(4, 16) : null;
}

const ALNUM = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
function randomId(n: number): string {
  const bytes = randomBytes(n * 2);
  let out = "";
  for (let i = 0; i < bytes.length && out.length < n; i++) {
    if (bytes[i] < 248) out += ALNUM[bytes[i] % 62]; // 248 = 4*62: no modulo bias
  }
  return out.length === n ? out : randomId(n);
}

/** Validate a create request. Returns an error message, or null when it is acceptable. */
export function validateKeyRequest(body: { name?: unknown; scopes?: unknown; deviceId?: unknown; expiresInDays?: unknown }): string | null {
  if (typeof body.name !== "string" || !body.name.trim() || body.name.length > 80) return "name is required (1-80 characters)";
  if (!Array.isArray(body.scopes) || body.scopes.length === 0) return `scopes must list at least one of: ${API_KEY_SCOPES.join(", ")}`;
  for (const s of body.scopes) {
    if (!(API_KEY_SCOPES as readonly string[]).includes(String(s))) return `Unknown scope "${String(s)}". Use: ${API_KEY_SCOPES.join(", ")}`;
  }
  if (body.deviceId != null && body.deviceId !== "" && (typeof body.deviceId !== "string" || !/^[A-Za-z0-9_-]{1,64}$/.test(body.deviceId))) {
    return "deviceId must be a device id (letters, digits, _ or -)";
  }
  if (body.expiresInDays != null && body.expiresInDays !== "") {
    const d = Number(body.expiresInDays);
    if (!Number.isFinite(d) || d <= 0 || d * 24 * 60 * 60_000 > MAX_KEY_LIFETIME_MS) return "expiresInDays must be between 1 and 730";
  }
  return null;
}

/**
 * Mint a new key. The caller stores `record` and shows `key` to the person exactly once.
 *
 * @param ownerId - The signed-in account the key will act as
 * @param req - name, scopes, optional deviceId and expiresInDays (already validated)
 * @param now - Clock (tests)
 */
export function mintApiKey(
  ownerId: string,
  req: { name: string; scopes: ApiKeyScope[]; deviceId?: string | null; expiresInDays?: number | null },
  now = Date.now(),
): { key: string; record: ApiKeyRecord } {
  const keyId = randomId(12);
  const key = `${API_KEY_PREFIX}${keyId}_${randomBytes(32).toString("base64url")}`;
  const days = req.expiresInDays ? Number(req.expiresInDays) : 0;
  return {
    key,
    record: {
      keyId,
      hash: hashApiKey(key),
      ownerId,
      name: req.name.trim(),
      scopes: [...new Set(req.scopes)].sort() as ApiKeyScope[],
      deviceId: req.deviceId ? req.deviceId : null,
      createdAt: now,
      expiresAt: days > 0 ? now + days * 24 * 60 * 60_000 : null,
      revokedAt: null,
      lastUsedAt: null,
    },
  };
}

/** Why a stored key cannot be used now, or null when it is live. */
export function keyRejection(record: ApiKeyRecord | null | undefined, key: string, now = Date.now()): string | null {
  if (!record) return "Unknown API key";
  const a = Buffer.from(hashApiKey(key), "hex");
  const b = Buffer.from(String(record.hash ?? ""), "hex");
  if (a.length !== b.length || !timingSafeEqual(a, b)) return "Unknown API key";
  if (record.revokedAt) return "API key has been revoked";
  if (record.expiresAt && record.expiresAt <= now) return "API key has expired";
  if (!record.ownerId) return "API key has no owner";
  return null;
}

/**
 * Look up and check a presented key.
 *
 * @param key - What the machine sent
 * @param load - Reads apiKeys/{keyId} (null when missing)
 * @returns The principal, or { error } with a reason safe to show the caller
 */
export async function verifyApiKey(
  key: string,
  load: (keyId: string) => Promise<ApiKeyRecord | null>,
  now = Date.now(),
): Promise<ApiKeyPrincipal | { error: string }> {
  const keyId = apiKeyId(key);
  if (!keyId) return { error: "Malformed API key" };
  const record = await load(keyId);
  const why = keyRejection(record, key, now);
  if (why || !record) return { error: why ?? "Unknown API key" };
  return { kind: "apiKey", uid: record.ownerId, keyId, scopes: record.scopes ?? [], deviceId: record.deviceId ?? null };
}

/**
 * May this principal use `scope` on `deviceId`? Firebase ID-token users (no principal) always may;
 * device ownership is checked separately.
 *
 * @returns null when allowed, otherwise the reason (HTTP 403)
 */
export function scopeRefusal(principal: ApiKeyPrincipal | undefined, scope: ApiKeyScope, deviceId?: string): string | null {
  if (!principal) return null;
  if (!principal.scopes.includes(scope)) return `This API key does not have the ${scope} scope`;
  if (principal.deviceId && deviceId !== undefined && principal.deviceId !== deviceId) {
    return `This API key is bound to device ${principal.deviceId}`;
  }
  if (principal.deviceId && deviceId === undefined) return `This API key is bound to device ${principal.deviceId} and cannot be used for account-wide calls`;
  return null;
}

/** The record as shown in a key list (no hash). */
export function publicKeyView(r: ApiKeyRecord) {
  return {
    keyId: r.keyId, name: r.name, scopes: r.scopes, deviceId: r.deviceId, createdAt: r.createdAt,
    expiresAt: r.expiresAt, revokedAt: r.revokedAt, lastUsedAt: r.lastUsedAt ?? null, preview: `${API_KEY_PREFIX}${r.keyId}_…`,
  };
}
// ---- shared core (end) ----
