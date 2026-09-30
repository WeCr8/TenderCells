import { createHash, createPublicKey, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import * as admin from "firebase-admin";
import * as functions from "firebase-functions";

if (!admin.apps.length) admin.initializeApp();
const db = admin.firestore();
const FieldValue = admin.firestore.FieldValue;
const CODE_TTL_MS = 10 * 60_000;

function cleanDeviceId(value: unknown): string {
  const id = String(value || "").trim();
  if (!/^[A-Za-z0-9_-]{2,80}$/.test(id)) {
    throw new functions.https.HttpsError("invalid-argument", "deviceId is invalid");
  }
  return id;
}

export function hashEnrollmentCode(code: string): string {
  return createHash("sha256").update(code.trim()).digest("hex");
}

export function hashMqttSecret(secret: string, salt = randomBytes(16).toString("hex")): string {
  const derived = scryptSync(secret, salt, 32).toString("hex");
  return `scrypt:${salt}:${derived}`;
}

export function verifyMqttSecret(secret: string, encoded: string): boolean {
  const [algorithm, salt, expectedHex] = encoded.split(":");
  if (algorithm !== "scrypt" || !salt || !/^[a-f0-9]{64}$/.test(expectedHex || "")) return false;
  const actual = scryptSync(secret, salt, 32);
  const expected = Buffer.from(expectedHex, "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

async function ownerCanEnroll(uid: string, deviceId: string): Promise<boolean> {
  const deviceRef = db.doc(`devices/${deviceId}`);
  let device = await deviceRef.get();
  if (!device.exists) {
    const products = await db.collection("products").where("userId", "==", uid).limit(100).get();
    const product = products.docs.find((candidate) => candidate.data().device_id === deviceId);
    if (!product) return false;
    await deviceRef.set({
      userId: uid,
      ownerId: uid,
      productId: product.id,
      enrollmentStatus: "pending",
      createdAt: FieldValue.serverTimestamp(),
    }, { merge: true });
    device = await deviceRef.get();
  }
  const data = device.data() || {};
  if (data.userId === uid || data.ownerId === uid) return true;
  const organizationId = String(data.organizationId || "");
  if (!organizationId) return false;
  const member = await db.doc(`organizations/${organizationId}/members/${uid}`).get();
  if (!member.exists || member.data()?.status !== "active") return false;
  const role = String(member.data()?.role || "");
  return ["district-admin", "school-admin"].includes(role) ||
    member.data()?.allDeviceAccess === true ||
    (Array.isArray(member.data()?.deviceIds) && member.data()?.deviceIds.includes(deviceId));
}

/** Create a short-lived, single-use code. The code itself is returned once and never stored. */
export const createEdgeEnrollmentCode = functions.https.onCall(async (data: { deviceId?: string }, context) => {
  if (!context.auth) throw new functions.https.HttpsError("unauthenticated", "Authentication required");
  const deviceId = cleanDeviceId(data?.deviceId);
  if (!(await ownerCanEnroll(context.auth.uid, deviceId))) {
    throw new functions.https.HttpsError("permission-denied", "Device enrollment access denied");
  }
  const code = randomBytes(18).toString("base64url");
  const expiresAt = admin.firestore.Timestamp.fromMillis(Date.now() + CODE_TTL_MS);
  await db.doc(`deviceEnrollmentCodes/${hashEnrollmentCode(code)}`).set({
    deviceId,
    ownerUid: context.auth.uid,
    status: "created",
    expiresAt,
    createdAt: FieldValue.serverTimestamp(),
  });
  return { code, deviceId, expiresAt: expiresAt.toMillis() };
});

/** Redeem from the bridge after it generates its own key. Returns the MQTT secret exactly once. */
export const redeemEdgeEnrollmentCode = functions.https.onRequest(async (req, res) => {
  res.set("Cache-Control", "no-store");
  if (req.method !== "POST") {
    res.set("Allow", "POST");
    res.status(405).json({ error: "method_not_allowed" });
    return;
  }
  const code = String(req.body?.code || "").trim();
  let deviceId: string;
  try {
    deviceId = cleanDeviceId(req.body?.deviceId);
  } catch {
    res.status(400).json({ error: "invalid_enrollment_request" });
    return;
  }
  const publicKeyInput = String(req.body?.publicKey || "").trim();
  if (!/^[A-Za-z0-9_-]{20,80}$/.test(code) || publicKeyInput.length < 40 || publicKeyInput.length > 4096) {
    res.status(400).json({ error: "invalid_enrollment_request" });
    return;
  }
  let publicKey: string;
  try {
    const parsedKey = createPublicKey(publicKeyInput);
    if (parsedKey.asymmetricKeyType !== "ed25519") throw new Error("wrong key type");
    publicKey = parsedKey.export({ type: "spki", format: "pem" }).toString();
  } catch {
    res.status(400).json({ error: "ed25519_public_key_required" });
    return;
  }
  const codeRef = db.doc(`deviceEnrollmentCodes/${hashEnrollmentCode(code)}`);
  const deviceRef = db.doc(`devices/${deviceId}`);
  const credentialRef = db.doc(`deviceCredentials/${deviceId}`);
  const mqttSecret = randomBytes(32).toString("base64url");
  const mqttSecretHash = hashMqttSecret(mqttSecret);
  try {
    await db.runTransaction(async (transaction) => {
      const enrollment = await transaction.get(codeRef);
      const value = enrollment.data();
      if (!enrollment.exists || value?.status !== "created" || value.deviceId !== deviceId ||
          value.expiresAt?.toMillis?.() <= Date.now()) {
        throw new Error("invalid_or_expired");
      }
      transaction.update(codeRef, { status: "redeemed", redeemedAt: FieldValue.serverTimestamp() });
      transaction.set(deviceRef, {
        edgePublicKey: publicKey,
        mqttUsername: `device-${deviceId}`,
        enrollmentStatus: "active",
        enrolledAt: FieldValue.serverTimestamp(),
      }, { merge: true });
      transaction.set(credentialRef, {
        deviceId,
        mqttUsername: `device-${deviceId}`,
        mqttSecretHash,
        status: "active",
        rotatedAt: FieldValue.serverTimestamp(),
      });
    });
  } catch {
    res.status(409).json({ error: "enrollment_code_invalid_expired_or_used" });
    return;
  }
  res.status(201).json({
    deviceId,
    mqttUsername: `device-${deviceId}`,
    mqttPassword: mqttSecret,
    mqttTopicPrefix: `tc/${deviceId}/`,
    mqttBroker: process.env.MANAGED_MQTT_URL || null,
  });
});
