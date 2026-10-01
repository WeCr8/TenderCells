// hosted.test.ts - the customer-facing connector end to end over HTTP: discovery, dynamic
// client registration, authorize → consent → code (PKCE) → tokens, refresh rotation,
// revocation, /mcp scoped to the signed-in person's devices (read-only, no E-STOP or
// actions in the cloud) and the no-sign-in demo farm.
import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash, randomBytes } from "node:crypto";
import type { AddressInfo } from "node:net";
import { createHostedApp } from "./hosted.js";
import { firestoreHub, type FirestoreLike } from "./firestoreHub.js";
import { MemoryOAuthStore, allowedRedirect, pkceOk } from "./oauth.js";

const NOW = 1_800_000_000_000;

/** Minimal fake of the Firestore calls firestoreHub makes. */
function fakeDb(devices: Record<string, Record<string, unknown>>, alerts: Record<string, Array<Record<string, unknown>>> = {}): FirestoreLike {
  return {
    collection: () => ({
      where: (_f: string, _op: "==", v: unknown) => ({ limit: () => ({ get: async () => ({ docs: Object.entries(devices).filter(([, d]) => d.ownerId === v).map(([id, d]) => ({ id, data: () => d })) }) }) }),
      doc: (id: string) => ({
        get: async () => ({ exists: id in devices, id, data: () => devices[id] }),
        collection: () => ({ orderBy: () => ({ limit: () => ({ get: async () => ({ docs: (alerts[id] ?? []).map((a) => ({ data: () => a })) }) }) }) }),
      }),
    }),
  } as FirestoreLike;
}

const DEVICES = {
  ct_100: { ownerId: "alice", productType: "chicken-tender", telemetry: { temp: 31, ammonia: 4, waterLevel: 70, feedLevel: 50, doorState: "closed" }, telemetryAt: NOW - 10_000, state: { state: "idle" } },
  ct_200: { ownerId: "bob", telemetry: { temp: 70 }, telemetryAt: NOW - 10_000 },
};

async function start() {
  const store = new MemoryOAuthStore();
  const app = createHostedApp({
    store, issuer: "https://tendercells.example", now: () => NOW,
    verifyIdToken: async (t) => { if (t !== "good-id-token") throw new Error("bad"); return { uid: "alice" }; },
    hubFor: (uid) => firestoreHub(fakeDb(DEVICES, { ct_100: [{ type: "predator", label: "fox", confidence: 0.8, ts: NOW - 60_000 }] }), uid, () => NOW),
  });
  const srv = app.listen(0);
  const base = `http://127.0.0.1:${(srv.address() as AddressInfo).port}`;
  return { store, srv, base };
}

const rpc = (base: string, path: string, method: string, token?: string, params: unknown = {}) =>
  fetch(`${base}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json, text/event-stream", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  });

const INIT = { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "t", version: "1" } };

test("redirect URI and PKCE helpers", () => {
  assert.ok(allowedRedirect("https://claude.ai/api/mcp/auth_callback"));
  assert.ok(allowedRedirect("https://chatgpt.com/connector_platform_oauth_redirect"));
  assert.ok(allowedRedirect("http://localhost:6274/cb"));
  assert.ok(!allowedRedirect("http://evil.example/cb"));
  assert.ok(!allowedRedirect("javascript:alert(1)"));
  const v = randomBytes(32).toString("base64url");
  assert.ok(pkceOk(v, createHash("sha256").update(v).digest("base64url")));
  assert.ok(!pkceOk(v, "nope"));
  assert.ok(!pkceOk("short", "x"));
});

test("full OAuth flow, then /mcp sees only my devices, read-only", async () => {
  const { srv, base } = await start();
  try {
    const prm = await (await fetch(`${base}/.well-known/oauth-protected-resource/mcp`)).json() as { resource: string; authorization_servers: string[] };
    assert.equal(prm.resource, "https://tendercells.example/mcp");
    const asm = await (await fetch(`${base}/.well-known/oauth-authorization-server`)).json() as { code_challenge_methods_supported: string[]; registration_endpoint: string };
    assert.deepEqual(asm.code_challenge_methods_supported, ["S256"]);
    assert.match(asm.registration_endpoint, /\/oauth\/register$/);

    const unauth = await rpc(base, "/mcp", "initialize", undefined, INIT);
    assert.equal(unauth.status, 401);
    assert.match(String(unauth.headers.get("www-authenticate")), /resource_metadata="https:\/\/tendercells\.example\/\.well-known\/oauth-protected-resource\/mcp"/);

    const badReg = await fetch(`${base}/oauth/register`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ redirect_uris: ["http://evil.example/cb"] }) });
    assert.equal(badReg.status, 400);
    const redirect = "https://claude.ai/api/mcp/auth_callback";
    const reg = await (await fetch(`${base}/oauth/register`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ client_name: "Claude", redirect_uris: [redirect] }) })).json() as { client_id: string };

    const verifier = randomBytes(32).toString("base64url");
    const challenge = createHash("sha256").update(verifier).digest("base64url");
    const q = new URLSearchParams({ response_type: "code", client_id: reg.client_id, redirect_uri: redirect, code_challenge: challenge, code_challenge_method: "S256", state: "xyz", scope: "farm:read", resource: "https://tendercells.example/mcp" });
    const wrongRedirect = await fetch(`${base}/oauth/authorize?${q.toString().replace(encodeURIComponent(redirect), encodeURIComponent("https://evil.example/cb"))}`, { redirect: "manual" });
    assert.equal(wrongRedirect.status, 400, "never redirects to an unregistered URI");
    const auth = await fetch(`${base}/oauth/authorize?${q}`, { redirect: "manual" });
    assert.equal(auth.status, 302);
    const consent = new URL(String(auth.headers.get("location")));
    assert.equal(consent.pathname, "/connect");
    const requestId = String(consent.searchParams.get("request"));
    const info = await (await fetch(`${base}/oauth/request/${requestId}`)).json() as { clientName: string; redirectHost: string };
    assert.deepEqual(info, { ...info, clientName: "Claude", redirectHost: "claude.ai" });

    const denied = await fetch(`${base}/oauth/approve`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ request: requestId, idToken: "forged", approve: true }) });
    assert.equal(denied.status, 401);
    const approved = await (await fetch(`${base}/oauth/approve`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ request: requestId, idToken: "good-id-token", approve: true }) })).json() as { redirect: string };
    const back = new URL(approved.redirect);
    assert.equal(back.origin + back.pathname, redirect);
    assert.equal(back.searchParams.get("state"), "xyz");
    const code = String(back.searchParams.get("code"));

    const tokenReq = (body: Record<string, string>) => fetch(`${base}/oauth/token`, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams(body) });
    const wrongVerifier = await tokenReq({ grant_type: "authorization_code", code, client_id: reg.client_id, redirect_uri: redirect, code_verifier: randomBytes(32).toString("base64url") });
    assert.equal(wrongVerifier.status, 400);
    // The failed attempt consumed the code (single use) - authorize again.
    const auth2 = await fetch(`${base}/oauth/authorize?${q}`, { redirect: "manual" });
    const req2 = String(new URL(String(auth2.headers.get("location"))).searchParams.get("request"));
    const ok2 = await (await fetch(`${base}/oauth/approve`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ request: req2, idToken: "good-id-token", approve: true }) })).json() as { redirect: string };
    const code2 = String(new URL(ok2.redirect).searchParams.get("code"));
    const tokens = await (await tokenReq({ grant_type: "authorization_code", code: code2, client_id: reg.client_id, redirect_uri: redirect, code_verifier: verifier })).json() as { access_token: string; refresh_token: string; token_type: string };
    assert.equal(tokens.token_type, "Bearer");
    assert.equal((await tokenReq({ grant_type: "authorization_code", code: code2, client_id: reg.client_id, redirect_uri: redirect, code_verifier: verifier })).status, 400, "code is single-use");

    const init = await rpc(base, "/mcp", "initialize", tokens.access_token, INIT);
    assert.equal(init.status, 200);
    const initBody = await init.json() as { result: { serverInfo: { name: string; icons?: Array<{ src: string }> }; instructions: string } };
    assert.ok(initBody.result.serverInfo.icons?.some((i) => /tendercells-icon-512\.png$/.test(i.src)), "server advertises the Tender Cells icon");
    assert.match(initBody.result.instructions, /read-only/);
    const list = await (await rpc(base, "/mcp", "tools/list", tokens.access_token)).json() as { result: { tools: Array<{ name: string }> } };
    const names = list.result.tools.map((t) => t.name);
    assert.ok(names.includes("get_farm_overview"));
    for (const n of ["emergency_stop", "request_action", "confirm_action"]) assert.ok(!names.includes(n), `${n} is never in the cloud`);
    const ov = await (await rpc(base, "/mcp", "tools/call", tokens.access_token, { name: "get_farm_overview", arguments: {} })).json() as { result: { structuredContent: { devices: Array<{ id: string; recentAlerts: unknown[] }>; attention: Array<{ text: string; level: string }> } } };
    assert.deepEqual(ov.result.structuredContent.devices.map((d) => d.id), ["ct_100"], "only my devices");
    assert.ok(ov.result.structuredContent.attention.some((a) => a.level === "critical" && /31°F/.test(a.text)));
    assert.equal(ov.result.structuredContent.devices[0].recentAlerts.length, 1);
    const other = await (await rpc(base, "/mcp", "tools/call", tokens.access_token, { name: "get_device", arguments: { deviceId: "ct_200" } })).json() as { result: { isError?: boolean } };
    assert.equal(other.result.isError, true, "someone else's device is invisible");

    // Refresh rotation: the old refresh token works once.
    const r1 = await (await tokenReq({ grant_type: "refresh_token", refresh_token: tokens.refresh_token, client_id: reg.client_id })).json() as { access_token: string };
    assert.ok(r1.access_token);
    assert.equal((await tokenReq({ grant_type: "refresh_token", refresh_token: tokens.refresh_token, client_id: reg.client_id })).status, 400);

    // Revocation.
    await fetch(`${base}/oauth/revoke`, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ token: r1.access_token }) });
    assert.equal((await rpc(base, "/mcp", "tools/list", r1.access_token)).status, 401);
  } finally {
    srv.close();
  }
});

test("declining sends access_denied back to the assistant", async () => {
  const { srv, base, store } = await start();
  try {
    await store.putClient({ id: "c1", name: "ChatGPT", redirectUris: ["https://chatgpt.com/connector_platform_oauth_redirect"], createdAt: NOW });
    const q = new URLSearchParams({ response_type: "code", client_id: "c1", redirect_uri: "https://chatgpt.com/connector_platform_oauth_redirect", code_challenge: "x".repeat(43), code_challenge_method: "S256", state: "s" });
    const loc = new URL(String((await fetch(`${base}/oauth/authorize?${q}`, { redirect: "manual" })).headers.get("location")));
    const r = await (await fetch(`${base}/oauth/approve`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ request: loc.searchParams.get("request"), idToken: "good-id-token", approve: false }) })).json() as { redirect: string };
    assert.equal(new URL(r.redirect).searchParams.get("error"), "access_denied");
    const plain = new URLSearchParams({ ...Object.fromEntries(q), code_challenge_method: "plain" });
    const noPkce = await fetch(`${base}/oauth/authorize?${plain}`, { redirect: "manual" });
    assert.equal(new URL(String(noPkce.headers.get("location"))).searchParams.get("error"), "invalid_request", "S256 only");
  } finally {
    srv.close();
  }
});

test("demo endpoint works without sign-in and is labelled simulated", async () => {
  const { srv, base } = await start();
  try {
    const init = await (await rpc(base, "/mcp/demo", "initialize", undefined, INIT)).json() as { result: { serverInfo: { title?: string } } };
    assert.match(String(init.result.serverInfo.title), /demo farm/);
    const ov = await (await rpc(base, "/mcp/demo", "tools/call", undefined, { name: "get_farm_overview", arguments: {} })).json() as { result: { structuredContent: { simulated: boolean } } };
    assert.equal(ov.result.structuredContent.simulated, true);
    assert.equal((await fetch(`${base}/mcp/demo`)).status, 405);
  } finally {
    srv.close();
  }
});

test("Firestore source refuses writes", async () => {
  const hub = firestoreHub(fakeDb(DEVICES), "alice", () => NOW);
  const r = await hub("/api/mqtt/devices/ct_100/door", { method: "POST", body: { state: "open" } });
  assert.equal(r.status, 405);
  assert.equal((await hub("/api/mqtt/devices/ct_100/presence")).body && ((await hub("/api/mqtt/devices/ct_100/presence")).body as { online: boolean }).online, true);
});
