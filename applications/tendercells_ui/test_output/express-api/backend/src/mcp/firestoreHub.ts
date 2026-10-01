// firestoreHub.ts - the hosted connector's view of a customer's farm, read from Firestore.
//
// A hub that is signed in to an account mirrors each device's latest telemetry, state and
// alerts to devices/{id} (mqtt.controller.ts mirrorToFirestore). The hosted connector at
// tendercells.com/mcp answers the same hub-shaped paths from those documents, for the
// signed-in person's devices only (ownerId == uid). It is read-only by construction: every
// POST is refused, so the cloud can never move hardware.
import type { HubFetch, HubResponse } from "./hubClient.js";

/** The slice of the Firestore Admin API this adapter uses (lets tests pass a fake). */
export interface FirestoreLike {
  collection(path: string): {
    where(field: string, op: "==", value: unknown): { limit(n: number): { get(): Promise<{ docs: Array<{ id: string; data(): Record<string, unknown> }> }> } };
    doc(id: string): {
      get(): Promise<{ exists: boolean; id: string; data(): Record<string, unknown> | undefined }>;
      collection(path: string): { orderBy(field: string, dir: "desc"): { limit(n: number): { get(): Promise<{ docs: Array<{ data(): Record<string, unknown> }> }> } } };
    };
  };
}

/** A device is online if its hub mirrored telemetry within this window. */
export const ONLINE_WINDOW_MS = 120_000;
const MAX_DEVICES = 20;

/**
 * Hub-shaped, read-only access to one person's devices in Firestore.
 *
 * @param db  - Firestore (Admin SDK) or a fake with the same shape
 * @param uid - The signed-in person (from the OAuth access token)
 * @param now - Clock (tests)
 * @returns A HubFetch the MCP server can use in hosted mode
 */
export function firestoreHub(db: FirestoreLike, uid: string, now: () => number = Date.now): HubFetch {
  const ok = (body: unknown): HubResponse => ({ ok: true, status: 200, body });
  const owned = async (id: string) => {
    const snap = await db.collection("devices").doc(id).get();
    const data = snap.exists ? snap.data() : undefined;
    return data && data.ownerId === uid ? data : null;
  };
  const presence = (d: Record<string, unknown>) => {
    const lastSeen = Number(d.telemetryAt ?? d.stateAt ?? 0) || null;
    return { online: lastSeen !== null && now() - lastSeen < ONLINE_WINDOW_MS, lastSeen, stale: lastSeen === null || now() - lastSeen >= ONLINE_WINDOW_MS };
  };
  const listOwned = async () => (await db.collection("devices").where("ownerId", "==", uid).limit(MAX_DEVICES).get()).docs;
  const xmlEsc = (v: unknown) => String(v).replace(/[<>&"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;" })[c]!);

  return async (path, init = {}) => {
    if ((init.method ?? "GET") !== "GET") return { ok: false, status: 405, body: { error: "The hosted Tender Cells connector is read-only. Use the Tender Cells app for actions and E-STOP." } };
    try {
      if (path === "/api/mqtt/mqtt/status") {
        const docs = await listOwned();
        return ok({ connected: true, source: "cloud mirror", devices: docs.map((d) => d.id) });
      }
      if (path === "/api/describe.xml") return ok("<tendercells-connector mode=\"hosted\" readOnly=\"true\">Full backend description: https://tendercells.com/api/tendercells-backend.xml</tendercells-connector>");
      if (path === "/api/state.xml") {
        const docs = await listOwned();
        const rows = docs.map((d) => {
          const v = d.data();
          const tel = (v.telemetry ?? {}) as Record<string, unknown>;
          const st = (v.state ?? {}) as Record<string, unknown>;
          return `  <device id="${xmlEsc(d.id)}" productType="${xmlEsc(v.productType ?? "")}" state="${xmlEsc(st.state ?? "")}" online="${presence(v).online}">${Object.entries(tel).map(([k, x]) => `<${k}>${xmlEsc(x)}</${k}>`).join("")}</device>`;
        });
        return ok(`<?xml version="1.0" encoding="UTF-8"?>\n<tendercells-state source="cloud mirror">\n${rows.join("\n")}\n</tendercells-state>`);
      }
      const m = path.match(/^\/api\/mqtt\/devices\/([^/]+)\/([a-z]+)$/);
      if (!m) return { ok: false, status: 404, body: { error: `Not available in the hosted connector: ${path}` } };
      const id = decodeURIComponent(m[1]);
      const d = await owned(id);
      if (!d) return { ok: false, status: 404, body: { error: `No device ${id} on your account.` } };
      switch (m[2]) {
        case "telemetry": return ok({ deviceId: id, timestamp: d.telemetryAt ?? null, data: d.telemetry ?? {} });
        case "state": return ok({ deviceId: id, timestamp: d.stateAt ?? null, data: d.state ?? {} });
        case "presence": return ok({ deviceId: id, ...presence(d) });
        case "alerts": {
          const snap = await db.collection("devices").doc(id).collection("alerts").orderBy("ts", "desc").limit(20).get();
          const alerts = snap.docs.map((a) => a.data()).reverse();
          return ok({ deviceId: id, count: alerts.length, alerts });
        }
        // Yard flags are not mirrored to the cloud yet.
        case "events": return ok({ deviceId: id, presence: presence(d), events: [], note: "Yard flags are only available on the farm network for now." });
        default: return { ok: false, status: 404, body: { error: `Not available in the hosted connector: ${path}` } };
      }
    } catch (err) {
      return { ok: false, status: 502, body: { error: `Could not read your farm: ${(err as Error).message}` } };
    }
  };
}
