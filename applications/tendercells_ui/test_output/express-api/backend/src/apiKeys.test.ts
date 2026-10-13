// Robot / hub API keys: format, hashing, scopes, device binding, and the hub middleware that
// accepts them alongside Firebase ID tokens. Run: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import express from "express";
import {
  apiKeyId, hashApiKey, keyRejection, looksLikeApiKey, mintApiKey, publicKeyView, scopeRefusal, validateKeyRequest, verifyApiKey,
  type ApiKeyRecord,
} from "./apiKeys.js";

// The middleware reads AUTH_ENABLED at import time, so turn accounts on first.
process.env.TC_REQUIRE_AUTH = "1";
const auth = await import("./middleware/auth.js");

const NOW = 1_800_000_000_000;
const errOf = async (r: Response) => ((await r.json()) as { error: string }).error;

test("minted keys have the documented shape and only their hash is stored", () => {
  const { key, record } = mintApiKey("owner-a", { name: " Coop robot ", scopes: ["device:telemetry", "device:telemetry"], deviceId: "ct_001", expiresInDays: 30 }, NOW);
  assert.ok(looksLikeApiKey(key), key.replace(/_[^_]+$/, "_<secret>"));
  assert.equal(apiKeyId(key), record.keyId);
  assert.equal(record.hash, hashApiKey(key));
  assert.ok(!JSON.stringify(record).includes(key.slice(17)), "record must not contain the secret");
  assert.deepEqual(record.scopes, ["device:telemetry"]);
  assert.equal(record.name, "Coop robot");
  assert.equal(record.deviceId, "ct_001");
  assert.equal(record.expiresAt, NOW + 30 * 86_400_000);
  assert.ok(!("hash" in publicKeyView(record)));
});

test("create requests are validated", () => {
  assert.equal(validateKeyRequest({ name: "x", scopes: ["device:commands"] }), null);
  assert.match(validateKeyRequest({ name: "", scopes: ["device:commands"] }) ?? "", /name/);
  assert.match(validateKeyRequest({ name: "x", scopes: [] }) ?? "", /scopes/);
  assert.match(validateKeyRequest({ name: "x", scopes: ["admin"] }) ?? "", /Unknown scope/);
  assert.match(validateKeyRequest({ name: "x", scopes: ["device:telemetry"], deviceId: "../x" }) ?? "", /deviceId/);
  assert.match(validateKeyRequest({ name: "x", scopes: ["device:telemetry"], expiresInDays: 9999 }) ?? "", /expiresInDays/);
});

test("revoked, expired, unknown and tampered keys are refused", async () => {
  const { key, record } = mintApiKey("owner-a", { name: "k", scopes: ["device:telemetry"], expiresInDays: 1 }, NOW);
  assert.equal(keyRejection(record, key, NOW), null);
  assert.match(keyRejection({ ...record, revokedAt: NOW }, key, NOW) ?? "", /revoked/);
  assert.match(keyRejection(record, key, NOW + 2 * 86_400_000) ?? "", /expired/);
  assert.match(keyRejection(null, key, NOW) ?? "", /Unknown/);
  const tampered = key.slice(0, -1) + (key.endsWith("A") ? "B" : "A");
  assert.match(keyRejection(record, tampered, NOW) ?? "", /Unknown/);
  assert.deepEqual(await verifyApiKey("tck_short", async () => record, NOW), { error: "Malformed API key" });
  const ok = await verifyApiKey(key, async (id) => (id === record.keyId ? record : null), NOW);
  assert.deepEqual(ok, { kind: "apiKey", uid: "owner-a", keyId: record.keyId, scopes: ["device:telemetry"], deviceId: null });
});

test("scopes and device binding", () => {
  const p = { kind: "apiKey" as const, uid: "u", keyId: "k", scopes: ["device:telemetry" as const], deviceId: "ct_001" };
  assert.equal(scopeRefusal(undefined, "device:commands", "ct_001"), null, "ID-token users are not scope-limited");
  assert.equal(scopeRefusal(p, "device:telemetry", "ct_001"), null);
  assert.match(scopeRefusal(p, "device:commands", "ct_001") ?? "", /device:commands scope/);
  assert.match(scopeRefusal(p, "device:telemetry", "ct_002") ?? "", /bound to device ct_001/);
  assert.match(scopeRefusal(p, "device:telemetry") ?? "", /account-wide/);
  assert.equal(scopeRefusal({ ...p, deviceId: null }, "device:telemetry"), null);
});

// ── hub middleware, end to end over HTTP ─────────────────────────────────────
async function withHub(records: ApiKeyRecord[], devices: Record<string, Record<string, unknown>>, fn: (base: string) => Promise<void>) {
  auth.setApiKeyLoader(async (id) => records.find((r) => r.keyId === id) ?? null);
  auth.setDeviceLoader(async (id) => devices[id]);
  const app = express();
  app.use(express.json());
  const reads = [auth.requireAuth, auth.requireScope("device:telemetry"), auth.requireDeviceOwner];
  const owns = [auth.requireAuth, auth.requireScope("device:commands"), auth.requireDeviceOwner];
  app.get("/devices/:deviceId/telemetry", ...reads, (req, res) => { res.json({ ok: true, uid: (req as { uid?: string }).uid }); });
  app.post("/devices/:deviceId/door", ...owns, (_req, res) => { res.json({ ok: true }); });
  app.post("/devices/:deviceId/estop/clear", auth.requireAuth, auth.requirePerson, auth.requireDeviceOwner, (_req, res) => { res.json({ ok: true }); });
  const server = app.listen(0);
  try {
    await fn(`http://127.0.0.1:${(server.address() as AddressInfo).port}`);
  } finally {
    server.close();
  }
}

test("hub accepts a live key and refuses revoked / expired / wrong-owner / missing-scope / wrong-device", async () => {
  const live = mintApiKey("owner-a", { name: "robot", scopes: ["device:telemetry", "device:commands"] });
  const revoked = mintApiKey("owner-a", { name: "old", scopes: ["device:telemetry"] });
  revoked.record.revokedAt = Date.now() - 1000;
  const expired = mintApiKey("owner-a", { name: "exp", scopes: ["device:telemetry"] });
  expired.record.expiresAt = Date.now() - 1000;
  const readOnly = mintApiKey("owner-a", { name: "ro", scopes: ["device:telemetry"] });
  const bound = mintApiKey("owner-a", { name: "bound", scopes: ["device:telemetry", "device:commands"], deviceId: "ct_001" });
  const stranger = mintApiKey("owner-b", { name: "theirs", scopes: ["device:telemetry", "device:commands"] });
  const devices = { ct_001: { ownerId: "owner-a", userId: "owner-a" }, ct_002: { ownerId: "owner-a", userId: "owner-a" } };
  const all = [live, revoked, expired, readOnly, bound, stranger].map((k) => k.record);

  await withHub(all, devices, async (base) => {
    const call = (path: string, key: string | null, method = "GET", header: "bearer" | "x" = "bearer") => fetch(base + path, {
      method,
      headers: key ? (header === "bearer" ? { Authorization: `Bearer ${key}` } : { "X-TC-Api-Key": key }) : {},
    });
    const ok = await call("/devices/ct_001/telemetry", live.key);
    assert.equal(ok.status, 200);
    assert.equal(((await ok.json()) as { uid: string }).uid, "owner-a", "a key acts as its owner");
    assert.equal((await call("/devices/ct_001/door", live.key, "POST", "x")).status, 200, "X-TC-Api-Key header works too");

    assert.equal((await call("/devices/ct_001/telemetry", null)).status, 401, "missing credentials");
    const rev = await call("/devices/ct_001/telemetry", revoked.key);
    assert.equal(rev.status, 401);
    assert.match(await errOf(rev), /revoked/);
    const exp = await call("/devices/ct_001/telemetry", expired.key);
    assert.equal(exp.status, 401);
    assert.match(await errOf(exp), /expired/);

    const wrongOwner = await call("/devices/ct_001/telemetry", stranger.key);
    assert.equal(wrongOwner.status, 403, "another account's key cannot read this device");
    assert.match(await errOf(wrongOwner), /do not own/);
    assert.equal((await call("/devices/ct_001/door", stranger.key, "POST")).status, 403);

    const noScope = await call("/devices/ct_001/door", readOnly.key, "POST");
    assert.equal(noScope.status, 403, "telemetry-only key cannot actuate");
    assert.match(await errOf(noScope), /device:commands/);

    assert.equal((await call("/devices/ct_001/door", bound.key, "POST")).status, 200);
    const wrongDevice = await call("/devices/ct_002/door", bound.key, "POST");
    assert.equal(wrongDevice.status, 403, "a bound key only works for its device");
    assert.match(await errOf(wrongDevice), /bound to device ct_001/);

    const clear = await call("/devices/ct_001/estop/clear", live.key, "POST");
    assert.equal(clear.status, 403, "clearing an E-STOP needs a signed-in person");
  });
});
