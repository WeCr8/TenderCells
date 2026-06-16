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

const HAS_ADMIN = Boolean(
  process.env.FIREBASE_ADMIN_SDK_PATH || process.env.GOOGLE_APPLICATION_CREDENTIALS,
);

/** True when ownership is enforced. */
export const AUTH_ENABLED = HAS_ADMIN || process.env.TC_REQUIRE_AUTH === "1";

export interface AuthedRequest extends Request {
  uid?: string;
}

let initialized = false;
function ensureAdmin() {
  if (!initialized) {
    initializeFirebaseAdmin();
    initialized = true;
  }
}

/**
 * Verify the caller's Firebase ID token (Authorization: Bearer <token>).
 * No-op when auth is disabled (demo/LAN mode). 401 on missing/invalid token.
 */
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!AUTH_ENABLED) return next();

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
    ensureAdmin();
    const snap = await getFirestoreAdmin().collection("devices").doc(deviceId).get();
    const ownerId = snap.exists ? (snap.data()?.ownerId as string | undefined) : undefined;

    if (!ownerId) {
      return res
        .status(403)
        .json({ error: "Device not claimed. Claim it to your account first." });
    }
    if (ownerId !== uid) {
      return res.status(403).json({ error: "You do not own this device" });
    }
    return next();
  } catch {
    return res.status(500).json({ error: "Ownership check failed" });
  }
}
