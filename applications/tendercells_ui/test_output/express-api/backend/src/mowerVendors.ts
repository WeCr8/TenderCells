// mowerVendors.ts - official vendor cloud clients for linked robot mowers (hub only).
//
// Husqvarna Automower Connect and the GARDENA smart system share the Husqvarna Group
// developer portal (developer.husqvarnagroup.cloud): the owner creates an application,
// connects the Authentication API plus the Automower Connect API and/or the GARDENA smart
// system API, and puts the application key + secret on the hub:
//
//   HUSQVARNA_APP_KEY=...      HUSQVARNA_APP_SECRET=...
//
// The hub gets a token with the OAuth2 client_credentials grant - no user password is ever
// asked for or stored, and neither secret leaves the hub. The APIs are rate limited, so
// state is polled slowly (MOWER_CLOUD_POLL_MS, default 5 min) plus once after each command;
// safety holds never wait for a poll.
import {
  gardenaCommand, gardenaMowers, gardenaToState, husqvarnaActionBody, husqvarnaToState, mammotionActionBody, mammotionToState,
  type MowerAction, type MowerSettingsPatch, type MowerState, type StartOptions,
} from "./mower.js";

const AUTH_URL = "https://api.authentication.husqvarnagroup.dev/v1/oauth2/token";
const AMC_URL = (process.env.HUSQVARNA_AMC_URL || "https://api.amc.husqvarna.dev/v1").replace(/\/+$/, "");
const GARDENA_URL = (process.env.GARDENA_API_URL || "https://api.smart.gardena.dev/v2").replace(/\/+$/, "");
const APP_KEY = process.env.HUSQVARNA_APP_KEY || "";
const APP_SECRET = process.env.HUSQVARNA_APP_SECRET || "";

export const HUSQVARNA_CONFIGURED = Boolean(APP_KEY && APP_SECRET);

type HttpError = Error & { status?: number };
const fail = (message: string, status: number): HttpError => Object.assign(new Error(message), { status });

let token: { value: string; expires: number } | null = null;

/** client_credentials token, cached until a minute before it expires. */
async function accessToken(): Promise<string> {
  if (!HUSQVARNA_CONFIGURED) {
    throw fail("Husqvarna / GARDENA is not configured on this hub: set HUSQVARNA_APP_KEY and HUSQVARNA_APP_SECRET", 503);
  }
  if (token && Date.now() < token.expires) return token.value;
  const res = await fetch(AUTH_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "client_credentials", client_id: APP_KEY, client_secret: APP_SECRET }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) throw fail(`Husqvarna sign-in failed (${res.status}) - check the application key and secret`, 502);
  const body = (await res.json()) as { access_token?: string; expires_in?: number };
  if (!body.access_token) throw fail("Husqvarna sign-in returned no token", 502);
  token = { value: body.access_token, expires: Date.now() + Math.max(60, (body.expires_in ?? 3600) - 60) * 1000 };
  return token.value;
}

async function call(base: string, path: string, init: RequestInit = {}): Promise<unknown> {
  const t = await accessToken();
  const res = await fetch(`${base}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${t}`, "X-Api-Key": APP_KEY, "Authorization-Provider": "husqvarna",
      "Content-Type": "application/vnd.api+json", ...(init.headers ?? {}),
    },
    signal: AbortSignal.timeout(10_000),
  });
  if (res.status === 401) token = null; // expired early - next call signs in again
  if (res.status === 429) throw fail("The mower cloud is rate limiting requests - try again in a minute", 429);
  if (!res.ok) throw fail(`The mower cloud replied ${res.status} for ${path.split("?")[0]}`, 502);
  const text = await res.text();
  return text ? JSON.parse(text) : {};
}

// ── Husqvarna Automower Connect ───────────────────────────────────────────────
export const husqvarna = {
  /** Mowers on the account (for the link picker). */
  async list(): Promise<{ vendorId: string; name: string; model?: string }[]> {
    const r = (await call(AMC_URL, "/mowers")) as { data?: Record<string, any>[] }; // eslint-disable-line @typescript-eslint/no-explicit-any
    return (r.data ?? []).map((m) => ({ vendorId: String(m.id), name: String(m.attributes?.system?.name ?? m.id), model: m.attributes?.system?.model }));
  },
  async read(vendorId: string): Promise<MowerState> {
    const r = (await call(AMC_URL, `/mowers/${encodeURIComponent(vendorId)}`)) as { data?: Record<string, unknown> };
    if (!r.data) throw fail("Husqvarna returned no mower data", 502);
    return husqvarnaToState(r.data);
  },
  async act(vendorId: string, action: MowerAction, opts: StartOptions = {}): Promise<void> {
    await call(AMC_URL, `/mowers/${encodeURIComponent(vendorId)}/actions`, { method: "POST", body: JSON.stringify(husqvarnaActionBody(action, opts)) });
  },
  async settings(vendorId: string, p: MowerSettingsPatch): Promise<void> {
    const id = encodeURIComponent(vendorId);
    const attrs: Record<string, unknown> = {};
    if (p.cuttingHeight !== undefined) attrs.cuttingHeight = p.cuttingHeight;
    if (p.headlight !== undefined) attrs.headlight = { mode: p.headlight };
    if (Object.keys(attrs).length) {
      await call(AMC_URL, `/mowers/${id}/settings`, { method: "POST", body: JSON.stringify({ data: { type: "settings", attributes: attrs } }) });
    }
    if (p.schedule) {
      await call(AMC_URL, `/mowers/${id}/calendar`, { method: "POST", body: JSON.stringify({ data: { type: "calendar", attributes: { tasks: p.schedule } } }) });
    }
    if (p.stayOutZone) {
      const z = encodeURIComponent(p.stayOutZone.id);
      await call(AMC_URL, `/mowers/${id}/stayOutZones/${z}`, {
        method: "PATCH", body: JSON.stringify({ data: { type: "stayOutZone", id: p.stayOutZone.id, attributes: { enable: p.stayOutZone.enabled } } }),
      });
    }
    if (p.confirmError) await call(AMC_URL, `/mowers/${id}/errors/confirm`, { method: "POST", body: "{}" });
  },
};

// ── GARDENA smart system ──────────────────────────────────────────────────────
async function gardenaLocation(locationId: string): Promise<Record<string, unknown>[]> {
  const r = (await call(GARDENA_URL, `/locations/${encodeURIComponent(locationId)}`)) as { included?: Record<string, unknown>[] };
  return r.included ?? [];
}

export const gardena = {
  /** SILENO mowers across the account's locations (for the link picker). */
  async list(): Promise<{ vendorId: string; locationId: string; name: string }[]> {
    const r = (await call(GARDENA_URL, "/locations")) as { data?: { id: string }[] };
    const out: { vendorId: string; locationId: string; name: string }[] = [];
    for (const loc of r.data ?? []) {
      for (const m of gardenaMowers(await gardenaLocation(loc.id))) out.push({ vendorId: m.serviceId, locationId: loc.id, name: m.name });
    }
    return out;
  },
  async read(locationId: string, serviceId: string): Promise<MowerState> {
    const s = gardenaToState(await gardenaLocation(locationId), serviceId);
    if (!s) throw fail("That mower is no longer in the GARDENA location", 404);
    return s;
  },
  async act(serviceId: string, action: MowerAction, opts: StartOptions = {}): Promise<void> {
    const c = gardenaCommand(action, opts);
    await call(GARDENA_URL, `/command/${encodeURIComponent(serviceId)}`, {
      method: "PUT",
      body: JSON.stringify({ data: { id: `tc-${Date.now()}`, type: "MOWER_CONTROL", attributes: { command: c.command, ...(c.seconds ? { seconds: c.seconds } : {}) } } }),
    });
  },
};

// ── Mammotion Open API (LUBA / YUKA, models released 2025 and later) ──────────
// Official, from Mammotion's developer program: client id + secret on the hub
// (MAMMOTION_CLIENT_ID / MAMMOTION_CLIENT_SECRET), OAuth2 client_credentials. Mowing
// patterns live in the plans the owner saves in the Mammotion app; Tender Cells lists
// them and starts one by name.
const MAMMOTION_TOKEN_URL = "https://id.mammotion.com/oauth2/token";
const MAMMOTION_URL = (process.env.MAMMOTION_API_URL || "https://api-open.mammotion.com/v1").replace(/\/+$/, "");
const MM_ID = process.env.MAMMOTION_CLIENT_ID || "";
const MM_SECRET = process.env.MAMMOTION_CLIENT_SECRET || "";
export const MAMMOTION_CONFIGURED = Boolean(MM_ID && MM_SECRET);
let mmToken: { value: string; expires: number } | null = null;

/** Unwrap Mammotion's optional {code, data, msg} envelope. */
const unwrap = (r: unknown): unknown => (r && typeof r === "object" && "data" in (r as object) && "code" in (r as object) ? (r as { data: unknown }).data : r);

async function mmCall(path: string, init: RequestInit = {}): Promise<unknown> {
  if (!MAMMOTION_CONFIGURED) throw fail("Mammotion is not configured on this hub: set MAMMOTION_CLIENT_ID and MAMMOTION_CLIENT_SECRET", 503);
  if (!mmToken || Date.now() >= mmToken.expires) {
    const res = await fetch(MAMMOTION_TOKEN_URL, {
      method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ grant_type: "client_credentials", client_id: MM_ID, client_secret: MM_SECRET }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) throw fail(`Mammotion sign-in failed (${res.status}) - check the client id and secret`, 502);
    const body = unwrap(await res.json()) as { access_token?: string; expires_in?: number };
    if (!body?.access_token) throw fail("Mammotion sign-in returned no token", 502);
    mmToken = { value: body.access_token, expires: Date.now() + Math.max(60, (body.expires_in ?? 3600) - 60) * 1000 };
  }
  const res = await fetch(`${MAMMOTION_URL}${path}`, {
    ...init, headers: { Authorization: `Bearer ${mmToken.value}`, "Content-Type": "application/json", ...(init.headers ?? {}) },
    signal: AbortSignal.timeout(10_000),
  });
  if (res.status === 401) mmToken = null;
  if (res.status === 429) throw fail("Mammotion is rate limiting requests - try again in a minute", 429);
  if (!res.ok) throw fail(`Mammotion replied ${res.status} for ${path.split("?")[0]}`, 502);
  const text = await res.text();
  return text ? unwrap(JSON.parse(text)) : {};
}

const asList = (v: unknown): Record<string, any>[] => // eslint-disable-line @typescript-eslint/no-explicit-any
  Array.isArray(v) ? v : Array.isArray((v as { list?: unknown })?.list) ? (v as { list: Record<string, unknown>[] }).list : [];

export const mammotion = {
  async list(): Promise<{ vendorId: string; name: string; model?: string }[]> {
    return asList(await mmCall("/mowers")).map((m) => ({ vendorId: String(m.id), name: String(m.nickname || m.name || m.id), model: m.model }));
  },
  async plans(vendorId: string): Promise<{ id: string; name: string }[]> {
    return asList(await mmCall(`/mower/${encodeURIComponent(vendorId)}/plan`))
      .filter((p) => p.taskName).map((p) => ({ id: String(p.taskId ?? p.taskName), name: String(p.taskName) }));
  },
  async read(vendorId: string): Promise<MowerState> {
    const detail = (await mmCall(`/mower/${encodeURIComponent(vendorId)}`)) as Record<string, unknown>;
    const plans = await mammotion.plans(vendorId).catch(() => []);
    return mammotionToState(detail, plans);
  },
  async act(vendorId: string, action: MowerAction, opts: StartOptions = {}): Promise<void> {
    await mmCall("/mower/action", { method: "POST", body: JSON.stringify(mammotionActionBody(vendorId, action, opts)) });
  },
};

/** Test helper. */
export function _resetVendorToken(): void { token = null; mmToken = null; }
