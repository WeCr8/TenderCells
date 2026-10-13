// deviceApi.ts - the cloud API for robots, hubs and starter nodes, plus API-key management.
//
// Machines authenticate with a Tender Cells API key (Authorization: Bearer tck_… or
// X-TC-Api-Key), people with a Firebase ID token; both act as one account (machineAuth below).
//   POST /v1/devices/:deviceId/telemetry   device:telemetry   latest reading → devices/{id}
//   GET  /v1/devices/:deviceId/schedules   schedules:read     the device's schedules
//   GET  /v1/devices/:deviceId/commands    device:commands    queued commands (executeSchedules)
// Keys are issued, listed and revoked only by a signed-in person (callables at the bottom,
// used by the app's Settings → API keys). The cloud never sends robot motion to a hubless
// device and holds every command while the device reports E-STOP.
import express, { type Request, type Response } from "express";
import {
  API_KEY_SCOPES, mintApiKey, publicKeyView, scopeRefusal, validateKeyRequest, verifyApiKey, looksLikeApiKey,
  type ApiKeyPrincipal, type ApiKeyRecord, type ApiKeyScope,
} from "./apiKeyCore";
import { estopLatched, pullRefusal } from "./scheduleExec";

export interface Caller { uid: string; apiKey?: ApiKeyPrincipal }

const dev = (req: Request) => String(req.params.deviceId);

/** Everything the device API reads or writes (Firestore in production, a fake in tests). */
export interface DeviceApiStore {
  loadKey(keyId: string): Promise<ApiKeyRecord | null>;
  touchKey(keyId: string, now: number): Promise<void>;
  getDevice(deviceId: string): Promise<Record<string, unknown> | undefined>;
  getDeviceState(deviceId: string): Promise<Record<string, unknown> | undefined>;
  writeTelemetry(deviceId: string, telemetry: Record<string, unknown>, state: Record<string, unknown> | null, now: number): Promise<void>;
  listSchedules(deviceId: string): Promise<Array<Record<string, unknown> & { id: string }>>;
  pendingCommands(deviceId: string): Promise<Array<Record<string, unknown> & { id: string }>>;
  /** pending → status, atomically. false when someone else already took it. */
  settleCommand(deviceId: string, cmdId: string, status: string, extra: Record<string, unknown>): Promise<boolean>;
}

export interface DeviceApiDeps {
  store: DeviceApiStore;
  verifyIdToken: (token: string) => Promise<{ uid: string }>;
  now?: () => number;
}

const ownerOf = (d: Record<string, unknown> | undefined) => {
  const o = d?.ownerId ?? d?.userId;
  return typeof o === "string" && o ? o : undefined;
};

/**
 * Who is calling: an API key (checked: hash, revoked, expired) or a Firebase ID token.
 *
 * @returns The caller, or an HTTP status and error
 */
export async function machineAuth(req: Request, deps: DeviceApiDeps): Promise<Caller | { status: number; error: string }> {
  const now = (deps.now ?? Date.now)();
  const header = String(req.headers.authorization ?? "");
  const bearer = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  const xKey = req.headers["x-tc-api-key"];
  const key = looksLikeApiKey(bearer) ? bearer : looksLikeApiKey(Array.isArray(xKey) ? xKey[0] : xKey) ? String(Array.isArray(xKey) ? xKey[0] : xKey) : "";
  if (key) {
    const out = await verifyApiKey(key, (id) => deps.store.loadKey(id), now);
    if ("error" in out) return { status: 401, error: out.error };
    void deps.store.touchKey(out.keyId, now).catch(() => {});
    return { uid: out.uid, apiKey: out };
  }
  if (!bearer) return { status: 401, error: "Send a Tender Cells API key (Authorization: Bearer tck_…) or a Firebase ID token" };
  try {
    return { uid: (await deps.verifyIdToken(bearer)).uid };
  } catch {
    return { status: 401, error: "Invalid or expired token" };
  }
}

/**
 * The device API as an Express app (served by the deviceApi function).
 *
 * @param deps - Store, ID-token verifier and clock
 */
export function createDeviceApi(deps: DeviceApiDeps) {
  const now = deps.now ?? Date.now;
  const { store } = deps;
  const app = express();
  app.disable("x-powered-by");
  app.use(express.json({ limit: "16kb" }));
  app.use((_req, res, next) => { res.set("Cache-Control", "no-store"); next(); });

  // Auth + scope + ownership for every /v1/devices/:deviceId/* route.
  const guard = (scope: ApiKeyScope) => async (req: Request, res: Response): Promise<Caller | null> => {
    const caller = await machineAuth(req, deps);
    if ("error" in caller) { res.status(caller.status).json({ error: caller.error }); return null; }
    const deviceId = dev(req);
    const why = scopeRefusal(caller.apiKey, scope, deviceId);
    if (why) { res.status(403).json({ error: why }); return null; }
    const owner = ownerOf(await store.getDevice(deviceId));
    if (!owner) { res.status(403).json({ error: "Device not claimed. Claim it to your account first." }); return null; }
    if (owner !== caller.uid) { res.status(403).json({ error: "You do not own this device" }); return null; }
    return caller;
  };
  const safe = (fn: (req: Request, res: Response) => Promise<void>) => (req: Request, res: Response) => {
    fn(req, res).catch((err) => {
      console.error(`[deviceApi] ${req.method} ${req.path} failed: ${(err as { code?: unknown })?.code ?? ""} ${(err as Error)?.message ?? err}`);
      if (!res.headersSent) res.status(503).json({ error: "Temporarily unavailable. Try again in a minute." });
    });
  };

  app.post("/v1/devices/:deviceId/telemetry", safe(async (req, res) => {
    if (!(await guard("device:telemetry")(req, res))) return;
    const body = req.body as Record<string, unknown> | undefined;
    if (!body || typeof body !== "object" || Array.isArray(body)) { res.status(400).json({ error: "Send the reading as a JSON object" }); return; }
    const telemetry: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(body)) {
      if (!/^[A-Za-z][A-Za-z0-9_]{0,39}$/.test(k) || k === "state") continue;
      if (typeof v === "number" ? Number.isFinite(v) : typeof v === "boolean" || (typeof v === "string" && v.length <= 200)) telemetry[k] = v;
    }
    const state = typeof body.state === "string" ? { state: body.state.slice(0, 40) } : null;
    await store.writeTelemetry(dev(req), telemetry, state, now());
    res.status(202).json({ ok: true, accepted: Object.keys(telemetry).length });
  }));

  app.get("/v1/devices/:deviceId/schedules", safe(async (req, res) => {
    if (!(await guard("schedules:read")(req, res))) return;
    const items = await store.listSchedules(dev(req));
    res.json({
      deviceId: dev(req),
      schedules: items.map((s) => ({
        id: s.id, action: s.action, cronExpression: s.cronExpression, enabled: s.enabled === true, timeZone: s.timeZone ?? null,
        amount: s.amount ?? null, state: s.state ?? null, on: s.on ?? null, label: s.label ?? null,
      })),
    });
  }));

  // A hubless device polls this and runs what it gets. Each command is handed out once.
  app.get("/v1/devices/:deviceId/commands", safe(async (req, res) => {
    if (!(await guard("device:commands")(req, res))) return;
    const id = dev(req);
    const t = now();
    const [device, state] = await Promise.all([store.getDevice(id), store.getDeviceState(id)]);
    const estop = estopLatched(state, device?.state as Record<string, unknown> | undefined, device);
    const out: Array<Record<string, unknown>> = [];
    for (const c of await store.pendingCommands(id)) {
      const why = pullRefusal(c as { motion?: boolean; expiresAt?: number }, estop, t);
      if (why) {
        // Expired commands are dropped; E-STOP / motion holds are recorded so the app can say why.
        await store.settleCommand(id, c.id, why === "expired" ? "expired" : "blocked", { reason: why, settledAt: t });
        continue;
      }
      if (await store.settleCommand(id, c.id, "delivered", { deliveredAt: t, deliveredBy: "deviceApi" })) {
        out.push({ id: c.id, command: c.command, payload: c.payload ?? {}, dueAt: c.dueAt ?? null, source: c.source ?? "schedule" });
      }
    }
    res.json({ deviceId: id, estop, commands: out });
  }));

  app.use((_req, res) => { res.status(404).json({ error: "Not found" }); });
  return app;
}

// ── key management (callables; a signed-in person only) ─────────────────────────────────────
export const MAX_ACTIVE_KEYS = 50;

export interface KeyAdminStore {
  putKey(r: ApiKeyRecord): Promise<void>;
  loadKey(keyId: string): Promise<ApiKeyRecord | null>;
  listKeys(ownerId: string): Promise<ApiKeyRecord[]>;
  revokeKey(keyId: string, now: number): Promise<void>;
  getDevice(deviceId: string): Promise<Record<string, unknown> | undefined>;
}

export class KeyAdminError extends Error {
  constructor(public code: "invalid-argument" | "permission-denied" | "not-found" | "resource-exhausted", message: string) { super(message); }
}

/** Issue a key. The plaintext key is in the result and nowhere else. */
export async function issueKey(store: KeyAdminStore, uid: string, data: Record<string, unknown>, now = Date.now()) {
  const err = validateKeyRequest(data);
  if (err) throw new KeyAdminError("invalid-argument", err);
  const deviceId = typeof data.deviceId === "string" && data.deviceId ? data.deviceId : null;
  if (deviceId && ownerOf(await store.getDevice(deviceId)) !== uid) throw new KeyAdminError("permission-denied", `You do not own device ${deviceId}`);
  const live = (await store.listKeys(uid)).filter((k) => !k.revokedAt && (!k.expiresAt || k.expiresAt > now));
  if (live.length >= MAX_ACTIVE_KEYS) throw new KeyAdminError("resource-exhausted", `You already have ${MAX_ACTIVE_KEYS} active keys. Revoke one first.`);
  const { key, record } = mintApiKey(uid, {
    name: String(data.name), scopes: data.scopes as ApiKeyScope[], deviceId,
    expiresInDays: data.expiresInDays ? Number(data.expiresInDays) : null,
  }, now);
  await store.putKey(record);
  return { key, ...publicKeyView(record) };
}

export async function listKeys(store: KeyAdminStore, uid: string) {
  const keys = await store.listKeys(uid);
  return { scopes: API_KEY_SCOPES, keys: keys.sort((a, b) => b.createdAt - a.createdAt).map(publicKeyView) };
}

export async function revokeKey(store: KeyAdminStore, uid: string, keyId: unknown, now = Date.now()) {
  if (typeof keyId !== "string" || !/^[A-Za-z0-9]{12}$/.test(keyId)) throw new KeyAdminError("invalid-argument", "keyId is required");
  const r = await store.loadKey(keyId);
  // Same answer for "not yours" and "no such key", so key ids can't be probed.
  if (!r || r.ownerId !== uid) throw new KeyAdminError("not-found", "No such key on your account");
  if (!r.revokedAt) await store.revokeKey(keyId, now);
  return { keyId, revoked: true };
}
