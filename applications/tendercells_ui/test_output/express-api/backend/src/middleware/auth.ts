// auth.ts
// Account ownership gate for hardware actuation.
//
// Dual-mode, mirroring the app's FIREBASE_ENABLED pattern:
//   - No Firebase service account configured → API stays OPEN. This keeps the
//     offline classroom / science-fair LAN flow working with no accounts.
//   - Service account present (a "true logged-in instance") → every actuation
//     requires a valid Firebase ID token AND device ownership. Users can only
//     control devices they have claimed. Set TC_REQUIRE_AUTH=1 to force-enable.
//
// Safety note: motion still travels local MQTT only (never the cloud). This layer
// adds *access control* — the other half of "actuate in their own instance with
// safety" alongside the firmware E-STOP.

import type { Request, Response, NextFunction } from "express";
import {
  getAuthAdmin,
  getFirestoreAdmin,
  initializeFirebaseAdmin,
} from "../config/firebase-admin.js";
import { deviceOwner } from "../ownership.js";
import {
  looksLikeApiKey, scopeRefusal, verifyApiKey,
  type ApiKeyPrincipal, type ApiKeyRecord, type ApiKeyScope,
} from "../apiKeys.js";

const HAS_ADMIN = Boolean(
  process.env.FIREBASE_ADMIN_SDK_PATH || process.env.GOOGLE_APPLICATION_CREDENTIALS,
);

/** True when ownership is enforced. */
export const AUTH_ENABLED = HAS_ADMIN || process.env.TC_REQUIRE_AUTH === "1";

export interface AuthedRequest extends Request {
  uid?: string;
  /** Set when the caller used a Tender Cells API key instead of a Firebase ID token. */
  apiKey?: ApiKeyPrincipal;
}

// ── API keys (apiKeys.ts) ─────────────────────────────────────────────────────
// Records are cached briefly so a robot polling every few seconds does not read Firestore
// on every request. A revoked key stops working within KEY_CACHE_MS.
export const KEY_CACHE_MS = 30_000;
const keyCache = new Map<string, { at: number; record: ApiKeyRecord | null }>();
const lastUsedWrite = new Map<string, number>();

/** Test seam: replace how key records are loaded (default: Firestore apiKeys/{keyId}). */
export let loadApiKeyRecord = async (keyId: string): Promise<ApiKeyRecord | null> => {
  const hit = keyCache.get(keyId);
  if (hit && Date.now() - hit.at < KEY_CACHE_MS) return hit.record;
  ensureAdmin();
  const snap = await getFirestoreAdmin().collection("apiKeys").doc(keyId).get();
  const record = snap.exists ? (snap.data() as ApiKeyRecord) : null;
  keyCache.set(keyId, { at: Date.now(), record });
  return record;
};
export function setApiKeyLoader(fn: (keyId: string) => Promise<ApiKeyRecord | null>) { loadApiKeyRecord = fn; }
/** Test seam: device documents (default: Firestore devices/{id}). */
export let loadDeviceDoc = async (deviceId: string): Promise<Record<string, unknown> | undefined> => {
  ensureAdmin();
  const snap = await getFirestoreAdmin().collection("devices").doc(deviceId).get();
  return snap.exists ? snap.data() : undefined;
};
export function setDeviceLoader(fn: (deviceId: string) => Promise<Record<string, unknown> | undefined>) { loadDeviceDoc = fn; }

function touchKey(keyId: string) {
  if (!HAS_ADMIN) return;
  const last = lastUsedWrite.get(keyId) ?? 0;
  if (Date.now() - last < 5 * 60_000) return;
  lastUsedWrite.set(keyId, Date.now());
  try {
    void getFirestoreAdmin().collection("apiKeys").doc(keyId).set({ lastUsedAt: Date.now() }, { merge: true }).catch(() => {});
  } catch { /* admin not ready (tests) */ }
}

/** The API key a request carries: `Authorization: Bearer tck_…` or `X-TC-Api-Key: tck_…`. */
export function presentedApiKey(req: Request): string | null {
  const header = req.headers.authorization || "";
  const bearer = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (looksLikeApiKey(bearer)) return bearer;
  const x = req.headers["x-tc-api-key"];
  const v = Array.isArray(x) ? x[0] : x;
  return looksLikeApiKey(v) ? v : null;
}

let initialized = false;
function ensureAdmin() {
  if (!initialized) {
    initializeFirebaseAdmin();
    initialized = true;
  }
}

/**
 * Verify the caller: a Firebase ID token (Authorization: Bearer <token>) or a Tender Cells
 * API key (Bearer tck_… or X-TC-Api-Key). An API key acts as its owner, limited to its
 * scopes (requireScope) and, when bound, to its one device.
 * No-op when auth is disabled (demo/LAN mode). 401 on missing/invalid credentials.
 */
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!AUTH_ENABLED) return next();

  const key = presentedApiKey(req);
  if (key) {
    try {
      const out = await verifyApiKey(key, (id) => loadApiKeyRecord(id));
      if ("error" in out) return res.status(401).json({ error: out.error });
      (req as AuthedRequest).uid = out.uid;
      (req as AuthedRequest).apiKey = out;
      touchKey(out.keyId);
      return next();
    } catch {
      return res.status(503).json({ error: "Could not check the API key right now" });
    }
  }

  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!token) return res.status(401).json({ error: "Missing bearer token" });

  try {
    ensureAdmin();
    const decoded = await getAuthAdmin().verifyIdToken(token);
    (req as AuthedRequest).uid = decoded.uid;
    return next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

/**
 * Reject if the signed-in user does not own the target device. Run AFTER
 * requireAuth. Unclaimed devices are not actuatable once auth is on — claim first.
 * No-op when auth is disabled.
 */
export async function requireDeviceOwner(req: Request, res: Response, next: NextFunction) {
  if (!AUTH_ENABLED) return next();

  const uid = (req as AuthedRequest).uid;
  const { deviceId } = req.params;

  try {
    const data = await loadDeviceDoc(deviceId);
    // ownerId, or userId for devices registered from the app (see ownership.ts).
    const ownerId = deviceOwner(data);

    if (!ownerId) {
      return res
        .status(403)
        .json({ error: "Device not claimed. Claim it to your account first." });
    }
    // A simulation document the app created can't drive hardware that happens to use its id;
    // the real board is claimed with its claim code or a hub pairing token (claim.ts).
    if (data?.simOnly === true) {
      return res.status(403).json({ error: "This is a simulation-only device. Claim the real board with its claim code first." });
    }
    if (ownerId !== uid) {
      return res.status(403).json({ error: "You do not own this device" });
    }
    return next();
  } catch {
    return res.status(500).json({ error: "Ownership check failed" });
  }
}

/**
 * Device ids owned by a user (for listings such as /api/state.xml).
 *
 * @returns null when auth is disabled (every device is visible on a LAN/demo hub)
 */
export async function ownedDeviceIds(uid: string | undefined): Promise<Set<string> | null> {
  if (!AUTH_ENABLED) return null;
  if (!uid) return new Set();
  ensureAdmin();
  const devices = getFirestoreAdmin().collection("devices");
  // Both owner fields: app-registered devices carry userId, hub claims carry both.
  const [byOwner, byUser] = await Promise.all([
    devices.where("ownerId", "==", uid).get(),
    devices.where("userId", "==", uid).get(),
  ]);
  const ids = new Set<string>();
  for (const d of byOwner.docs) ids.add(d.id);
  for (const d of byUser.docs) if (deviceOwner(d.data()) === uid) ids.add(d.id);
  return ids;
}

/**
 * Route guard for API keys: the key must carry `scope` and, when bound to a device, be bound to
 * this route's :deviceId. Firebase ID-token callers pass (ownership is checked separately).
 * No-op when auth is disabled.
 */
export function requireScope(scope: ApiKeyScope) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!AUTH_ENABLED) return next();
    const why = scopeRefusal((req as AuthedRequest).apiKey, scope, req.params.deviceId);
    if (why) return res.status(403).json({ error: why });
    return next();
  };
}

/**
 * Only a signed-in person (Firebase ID token), never an API key: claiming devices, clearing an
 * E-STOP, linking mowers. No-op when auth is disabled.
 */
export function requirePerson(req: Request, res: Response, next: NextFunction) {
  if (AUTH_ENABLED && (req as AuthedRequest).apiKey) {
    return res.status(403).json({ error: "Sign in to the Tender Cells app for this; API keys cannot do it" });
  }
  return next();
}
