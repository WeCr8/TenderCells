// firestoreStores.ts - Firestore (Admin SDK) implementations of the stores used by deviceApi.ts
// and scheduleRunner.ts. Collections: apiKeys/{keyId}, devices/{id}, device-states/{id},
// schedules/{deviceId}/items/{id}, deviceCommands/{deviceId}/queue/{cmdId},
// users/{uid}/settings/prefs. All server-only except what firestore.rules opens to owners.
import * as admin from "firebase-admin";
import type { ApiKeyRecord } from "./apiKeyCore";
import type { DeviceApiStore, KeyAdminStore } from "./deviceApi";
import type { ScheduleRunStore } from "./scheduleRunner";
import type { CloudSchedule } from "./scheduleExec";

type Db = admin.firestore.Firestore;

const ALREADY_EXISTS = 6;

export function keyAdminStore(db: Db): KeyAdminStore {
  return {
    putKey: async (r) => { await db.collection("apiKeys").doc(r.keyId).create({ ...r }); },
    loadKey: async (id) => { const s = await db.collection("apiKeys").doc(id).get(); return s.exists ? (s.data() as ApiKeyRecord) : null; },
    listKeys: async (uid) => (await db.collection("apiKeys").where("ownerId", "==", uid).get()).docs.map((d) => d.data() as ApiKeyRecord),
    revokeKey: async (id, now) => { await db.collection("apiKeys").doc(id).update({ revokedAt: now }); },
    getDevice: async (id) => { const s = await db.collection("devices").doc(id).get(); return s.exists ? s.data() : undefined; },
  };
}

export function deviceApiStore(db: Db): DeviceApiStore {
  const keys = keyAdminStore(db);
  const queue = (deviceId: string) => db.collection("deviceCommands").doc(deviceId).collection("queue");
  return {
    loadKey: keys.loadKey,
    touchKey: async (id, now) => { await db.collection("apiKeys").doc(id).set({ lastUsedAt: now }, { merge: true }); },
    getDevice: keys.getDevice,
    getDeviceState: async (id) => { const s = await db.doc(`device-states/${id}`).get(); return s.exists ? s.data() : undefined; },
    writeTelemetry: async (id, telemetry, state, now) => {
      // Same fields a hub mirrors (mqtt.controller mirrorToFirestore), so the app and the hosted
      // connector read API-key devices exactly like hub devices.
      const batch = db.batch();
      batch.set(db.collection("devices").doc(id), { telemetry, telemetryAt: now, ...(state ? { state, stateAt: now } : {}) }, { merge: true });
      batch.set(db.doc(`device-states/${id}`), { lastSeen: now, hardwareConnected: true, ...(state ? { systemState: state.state } : {}) }, { merge: true });
      await batch.commit();
    },
    listSchedules: async (id) => (await db.collection(`schedules/${id}/items`).get()).docs.map((d) => ({ id: d.id, ...d.data() })),
    pendingCommands: async (id) => (await queue(id).where("status", "==", "pending").limit(20).get()).docs.map((d) => ({ id: d.id, ...d.data() })),
    settleCommand: (deviceId, cmdId, status, extra) => db.runTransaction(async (tx) => {
      const ref = queue(deviceId).doc(cmdId);
      const s = await tx.get(ref);
      if (!s.exists || s.data()?.status !== "pending") return false;
      tx.update(ref, { status, ...extra });
      return true;
    }),
  };
}

export function scheduleRunStore(db: Db): ScheduleRunStore {
  return {
    listDevices: async () => (await db.collection("devices").get()).docs.map((d) => ({ id: d.id, data: d.data() })),
    listEnabledSchedules: async (id) =>
      (await db.collection(`schedules/${id}/items`).where("enabled", "==", true).get()).docs.map((d) => ({ id: d.id, data: d.data() as CloudSchedule })),
    getDeviceState: async (id) => { const s = await db.doc(`device-states/${id}`).get(); return s.exists ? s.data() : undefined; },
    getOwnerTimeZone: async (uid) => {
      const s = await db.doc(`users/${uid}/settings/prefs`).get();
      const tz = (s.data()?.preferences as { timezone?: unknown } | undefined)?.timezone;
      return typeof tz === "string" ? tz : undefined;
    },
    enqueue: async (deviceId, cmdId, doc) => {
      try {
        await db.collection("deviceCommands").doc(deviceId).collection("queue").doc(cmdId).create(doc);
        return true;
      } catch (err) {
        if ((err as { code?: number }).code === ALREADY_EXISTS) return false;
        throw err;
      }
    },
    markRan: async (deviceId, scheduleId, atMs) => {
      // A Timestamp, like the app and the hub write, so SchedulesPage can show "Last: …".
      await db.doc(`schedules/${deviceId}/items/${scheduleId}`).set({ lastRun: admin.firestore.Timestamp.fromMillis(atMs) }, { merge: true });
    },
  };
}
