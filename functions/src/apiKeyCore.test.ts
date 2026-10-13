import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { AddressInfo } from "node:net";
import { mintApiKey, type ApiKeyRecord } from "./apiKeyCore";
import { createDeviceApi, issueKey, KeyAdminError, listKeys, revokeKey, type DeviceApiStore, type KeyAdminStore } from "./deviceApi";

describe("API key core", () => {
  it("is the same code the hub runs (no drift between hub and Cloud Functions)", () => {
    const core = (src: string) => src.slice(src.indexOf("// ---- shared core (begin) ----"), src.indexOf("// ---- shared core (end) ----"));
    const mine = readFileSync(join(__dirname, "apiKeyCore.ts"), "utf8");
    const hub = readFileSync(join(__dirname, "../../applications/tendercells_ui/test_output/express-api/backend/src/apiKeys.ts"), "utf8");
    expect(core(mine).length).toBeGreaterThan(1000);
    expect(core(mine).replace(/\r\n/g, "\n")).toBe(core(hub).replace(/\r\n/g, "\n"));
  });
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const json = async (r: Response): Promise<any> => r.json();

// ── fakes ─────────────────────────────────────────────────────────────────────
function fakeStores() {
  const keys = new Map<string, ApiKeyRecord>();
  const devices: Record<string, Record<string, unknown>> = {
    ct_001: { ownerId: "owner-a", userId: "owner-a" },
    ct_002: { ownerId: "owner-a", userId: "owner-a" },
    ct_b: { ownerId: "owner-b", userId: "owner-b" },
  };
  const states: Record<string, Record<string, unknown>> = {};
  const queue = new Map<string, Record<string, unknown> & { id: string }>();
  const telemetry: Array<{ id: string; telemetry: Record<string, unknown> }> = [];
  const admin: KeyAdminStore = {
    putKey: async (r) => { keys.set(r.keyId, { ...r }); },
    loadKey: async (id) => keys.get(id) ?? null,
    listKeys: async (uid) => [...keys.values()].filter((k) => k.ownerId === uid),
    revokeKey: async (id, now) => { const k = keys.get(id); if (k) k.revokedAt = now; },
    getDevice: async (id) => devices[id],
  };
  const api: DeviceApiStore = {
    loadKey: admin.loadKey,
    touchKey: async () => {},
    getDevice: admin.getDevice,
    getDeviceState: async (id) => states[id],
    writeTelemetry: async (id, t) => { telemetry.push({ id, telemetry: t }); },
    listSchedules: async () => [{ id: "s1", action: "door", cronExpression: "0 6 * * *", enabled: true, timeZone: "America/Los_Angeles", state: "open" }],
    pendingCommands: async (id) => [...queue.values()].filter((c) => c.deviceId === id && c.status === "pending"),
    settleCommand: async (_d, cmdId, status, extra) => {
      const c = queue.get(cmdId);
      if (!c || c.status !== "pending") return false;
      Object.assign(c, { status }, extra);
      return true;
    },
  };
  return { keys, devices, states, queue, telemetry, admin, api };
}

async function serve(api: DeviceApiStore, fn: (base: string) => Promise<void>) {
  const app = createDeviceApi({
    store: api,
    verifyIdToken: async (t) => { if (t === "id-token-owner-a") return { uid: "owner-a" }; throw new Error("bad"); },
  });
  const server = app.listen(0);
  try {
    await fn(`http://127.0.0.1:${(server.address() as AddressInfo).port}`);
  } finally {
    server.close();
  }
}

describe("key management (callables)", () => {
  it("issues a key once, lists it without the secret, and revokes only the owner's keys", async () => {
    const f = fakeStores();
    const issued = await issueKey(f.admin, "owner-a", { name: "Coop robot", scopes: ["device:telemetry"], deviceId: "ct_001", expiresInDays: 90 });
    expect(issued.key).toMatch(/^tck_[A-Za-z0-9]{12}_/);
    const stored = f.keys.get(issued.keyId)!;
    expect(JSON.stringify(stored)).not.toContain(issued.key);
    const listed = await listKeys(f.admin, "owner-a");
    expect(listed.keys).toHaveLength(1);
    expect(JSON.stringify(listed)).not.toContain(issued.key);
    expect(JSON.stringify(listed)).not.toContain(stored.hash);
    await expect(revokeKey(f.admin, "owner-b", issued.keyId)).rejects.toThrow(KeyAdminError);
    await revokeKey(f.admin, "owner-a", issued.keyId);
    expect(f.keys.get(issued.keyId)!.revokedAt).toBeTruthy();
  });

  it("refuses binding a key to someone else's device and bad scopes", async () => {
    const f = fakeStores();
    await expect(issueKey(f.admin, "owner-a", { name: "x", scopes: ["device:telemetry"], deviceId: "ct_b" })).rejects.toThrow(/do not own/);
    await expect(issueKey(f.admin, "owner-a", { name: "x", scopes: ["root"] })).rejects.toThrow(/Unknown scope/);
  });
});

describe("deviceApi middleware: API keys alongside Firebase ID tokens", () => {
  const put = (f: ReturnType<typeof fakeStores>, uid: string, scopes: string[], extra: Partial<ApiKeyRecord> = {}, deviceId?: string) => {
    const { key, record } = mintApiKey(uid, { name: "k", scopes: scopes as never, deviceId });
    f.keys.set(record.keyId, { ...record, ...extra });
    return key;
  };

  it("accepts a live key and a Firebase ID token; refuses revoked, expired, wrong-owner, missing-scope and wrong-device", async () => {
    const f = fakeStores();
    const live = put(f, "owner-a", ["device:telemetry", "device:commands", "schedules:read"]);
    const revoked = put(f, "owner-a", ["device:telemetry"], { revokedAt: Date.now() - 1 });
    const expired = put(f, "owner-a", ["device:telemetry"], { expiresAt: Date.now() - 1 });
    const theirs = put(f, "owner-b", ["device:telemetry"]);
    const readOnly = put(f, "owner-a", ["device:telemetry"]);
    const bound = put(f, "owner-a", ["device:telemetry"], {}, "ct_001");

    await serve(f.api, async (base) => {
      const post = (path: string, auth: Record<string, string>, body: unknown = { temp: 71.5, chickenCount: 0 }) =>
        fetch(base + path, { method: "POST", headers: { "Content-Type": "application/json", ...auth }, body: JSON.stringify(body) });
      const bearer = (k: string) => ({ Authorization: `Bearer ${k}` });

      expect((await post("/v1/devices/ct_001/telemetry", bearer(live))).status).toBe(202);
      expect((await post("/v1/devices/ct_001/telemetry", { "X-TC-Api-Key": live })).status).toBe(202);
      expect((await post("/v1/devices/ct_001/telemetry", bearer("id-token-owner-a"))).status).toBe(202);
      expect(f.telemetry[0]).toEqual({ id: "ct_001", telemetry: { temp: 71.5, chickenCount: 0 } });

      expect((await post("/v1/devices/ct_001/telemetry", {})).status).toBe(401);
      const r1 = await post("/v1/devices/ct_001/telemetry", bearer(revoked));
      expect(r1.status).toBe(401);
      expect((await json(r1)).error).toMatch(/revoked/);
      const r2 = await post("/v1/devices/ct_001/telemetry", bearer(expired));
      expect(r2.status).toBe(401);
      expect((await json(r2)).error).toMatch(/expired/);
      const r3 = await post("/v1/devices/ct_001/telemetry", bearer(theirs));
      expect(r3.status).toBe(403);
      expect((await json(r3)).error).toMatch(/do not own/);
      const r4 = await fetch(`${base}/v1/devices/ct_001/commands`, { headers: bearer(readOnly) });
      expect(r4.status).toBe(403);
      expect((await json(r4)).error).toMatch(/device:commands/);
      expect((await post("/v1/devices/ct_001/telemetry", bearer(bound))).status).toBe(202);
      const r5 = await post("/v1/devices/ct_002/telemetry", bearer(bound));
      expect(r5.status).toBe(403);
      expect((await json(r5)).error).toMatch(/bound to device ct_001/);

      const sch = await fetch(`${base}/v1/devices/ct_001/schedules`, { headers: bearer(live) });
      expect(sch.status).toBe(200);
      expect((await json(sch)).schedules[0]).toMatchObject({ id: "s1", action: "door", state: "open", timeZone: "America/Los_Angeles" });
    });
  });

  it("hands each queued command out once, holds them during E-STOP, never sends motion, drops expired", async () => {
    const f = fakeStores();
    const key = put(f, "owner-a", ["device:commands"], {}, "ct_001");
    const now = Date.now();
    const q = (id: string, extra: Record<string, unknown>) => f.queue.set(id, { id, deviceId: "ct_001", status: "pending", command: "door", payload: { state: "open" }, expiresAt: now + 60_000, ...extra });
    q("a", {});
    q("b", { command: "clean", payload: { action: "start" }, motion: true });
    q("c", { expiresAt: now - 1 });
    await serve(f.api, async (base) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const pull = async (): Promise<any> => (await fetch(`${base}/v1/devices/ct_001/commands`, { headers: { Authorization: `Bearer ${key}` } })).json();

      f.states.ct_001 = { systemState: "estop" };
      const held = await pull();
      expect(held.estop).toBe(true);
      expect(held.commands).toEqual([]);
      expect(f.queue.get("a")!.status).toBe("blocked");

      q("a2", {});
      delete f.states.ct_001;
      const got = await pull();
      expect(got.commands.map((c: { id: string }) => c.id)).toEqual(["a2"]);
      expect(f.queue.get("b")!.status).toBe("blocked");
      expect(f.queue.get("c")!.status).toBe("expired");
      expect((await pull()).commands).toEqual([]);
    });
  });
});
