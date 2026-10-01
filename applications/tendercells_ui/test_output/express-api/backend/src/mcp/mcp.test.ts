// mcp.test.ts - the Tender Cells MCP server against a fake hub: read tools, E-STOP, the
// confirm-twice action flow (nothing moves on request; codes are single-use and expire;
// E-STOP blocks and cancels), the allow-list, and the HTTP key / bind guards.
import { test } from "node:test";
import assert from "node:assert/strict";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { ConfirmStore } from "./confirm.js";
import type { HubFetch } from "./hubClient.js";
import { createTenderCellsMcp, type ActionRequest } from "./server.js";
import { checkBind, createMcpHttpApp, hasKey } from "./http.js";

interface Call { method: string; path: string; body?: unknown }

function fakeHub(state = "idle") {
  const calls: Call[] = [];
  const hub: HubFetch = async (path, init = {}) => {
    calls.push({ method: init.method ?? "GET", path, body: init.body });
    // Real hub shape: { deviceId, timestamp, data: { state, ... } }.
    if (path.endsWith("/state")) return { ok: true, status: 200, body: { deviceId: "ct_001", timestamp: 1, data: { state, doorState: "closed" } } };
    if (path.endsWith("/telemetry")) return { ok: true, status: 200, body: { temp: 67.2, waterLevel: 56 } };
    if (path.endsWith("/presence")) return { ok: true, status: 200, body: { online: true } };
    if (path.includes("/nope/")) return { ok: false, status: 403, body: { error: "not yours" } };
    return { ok: true, status: 200, body: { success: true } };
  };
  return { hub, calls, posts: () => calls.filter((c) => c.method === "POST") };
}

async function connect(hub: HubFetch, allowActions: boolean, confirmations?: ConfirmStore<ActionRequest>) {
  const server = createTenderCellsMcp({ hub, allowActions, confirmations });
  const [a, b] = InMemoryTransport.createLinkedPair();
  const client = new Client({ name: "test", version: "1" });
  await Promise.all([server.connect(a), client.connect(b)]);
  return client;
}

const json = (r: unknown) => JSON.parse((r as { content: Array<{ text: string }> }).content[0].text);

test("read-only by default: no action tools, E-STOP always there", async () => {
  const { hub } = fakeHub();
  const client = await connect(hub, false);
  const names = (await client.listTools()).tools.map((t) => t.name).sort();
  assert.deepEqual(names, ["emergency_stop", "get_alerts", "get_device", "get_farm_snapshot", "get_hub_status", "get_yard_events"]);
  const tools = (await client.listTools()).tools;
  for (const t of tools.filter((t) => t.name.startsWith("get_"))) assert.equal(t.annotations?.readOnlyHint, true, t.name);
});

test("get_device combines telemetry, state and presence", async () => {
  const { hub, calls } = fakeHub();
  const client = await connect(hub, false);
  const out = json(await client.callTool({ name: "get_device", arguments: { deviceId: "ct_001" } }));
  assert.equal(out.telemetry.temp, 67.2);
  assert.equal(out.state.data.state, "idle");
  assert.ok(calls.every((c) => c.method === "GET"));
});

test("hub errors come back as tool errors; bad ids are rejected", async () => {
  const { hub } = fakeHub();
  const client = await connect(hub, false);
  const r = await client.callTool({ name: "get_alerts", arguments: { deviceId: "nope" } });
  assert.equal(r.isError, true);
  const bad = await client.callTool({ name: "get_alerts", arguments: { deviceId: "../../etc" } });
  assert.equal(bad.isError, true);
});

test("emergency stop posts at once and cancels pending actions for that device", async () => {
  const { hub, posts } = fakeHub();
  const store = new ConfirmStore<ActionRequest>();
  const client = await connect(hub, true, store);
  const req = json(await client.callTool({ name: "request_action", arguments: { deviceId: "ct_001", action: "door_close" } }));
  const stop = json(await client.callTool({ name: "emergency_stop", arguments: { deviceId: "ct_001" } }));
  assert.equal(stop.cancelledPendingActions, 1);
  assert.deepEqual(posts().map((p) => p.path), ["/api/mqtt/devices/ct_001/estop"]);
  const late = await client.callTool({ name: "confirm_action", arguments: { confirmationCode: req.confirmationCode } });
  assert.equal(late.isError, true);
});

test("request touches nothing; confirm runs once with the right payload", async () => {
  const { hub, posts } = fakeHub();
  const client = await connect(hub, true);
  const req = json(await client.callTool({ name: "request_action", arguments: { deviceId: "ct_001", action: "feed", grams: 100 } }));
  assert.match(req.confirmationCode, /^\d{6}$/);
  assert.match(req.summary, /100 g/);
  assert.equal(posts().length, 0, "nothing sent before confirmation");
  const ok = await client.callTool({ name: "confirm_action", arguments: { confirmationCode: req.confirmationCode } });
  assert.notEqual(ok.isError, true);
  assert.deepEqual(posts(), [{ method: "POST", path: "/api/mqtt/devices/ct_001/feed", body: { amount: 100 } }]);
  const again = await client.callTool({ name: "confirm_action", arguments: { confirmationCode: req.confirmationCode } });
  assert.equal(again.isError, true, "codes are single-use");
  assert.equal(posts().length, 1);
});

test("an action requested before E-STOP cannot be confirmed after it, and a new one is refused at once", async () => {
  const { hub, posts } = fakeHub();
  const client = await connect(hub, true);
  await client.callTool({ name: "emergency_stop", arguments: { deviceId: "ct_001" } });
  const r = await client.callTool({ name: "request_action", arguments: { deviceId: "ct_001", action: "door_close" } });
  assert.equal(r.isError, true, "local latch covers the gap before the device reports estop");
  assert.equal(posts().length, 1);
});

test("confirm re-checks E-STOP (device stopped between request and confirm)", async () => {
  let state = "idle";
  const base = fakeHub();
  const hub: HubFetch = async (path, init) => (path.endsWith("/state") ? { ok: true, status: 200, body: { data: { state } } } : base.hub(path, init));
  const client = await connect(hub, true);
  const req = json(await client.callTool({ name: "request_action", arguments: { deviceId: "ct_001", action: "door_open" } }));
  state = "estop";
  const r = await client.callTool({ name: "confirm_action", arguments: { confirmationCode: req.confirmationCode } });
  assert.equal(r.isError, true);
  assert.equal(base.posts().length, 0);
});

test("actions are refused while E-STOP is latched", async () => {
  const { hub, posts } = fakeHub("estop");
  const client = await connect(hub, true);
  const r = await client.callTool({ name: "request_action", arguments: { deviceId: "ct_001", action: "door_open" } });
  assert.equal(r.isError, true);
  assert.equal(posts().length, 0);
});

test("only allow-listed actions exist; motion is not reachable", async () => {
  const { hub } = fakeHub();
  const client = await connect(hub, true);
  for (const action of ["arm", "drive", "gantry", "routine", "laser", "estop_clear", "clean_start"]) {
    const r = await client.callTool({ name: "request_action", arguments: { deviceId: "ct_001", action } });
    assert.equal(r.isError, true, action);
  }
  const big = await client.callTool({ name: "request_action", arguments: { deviceId: "ct_001", action: "feed", grams: 5000 } });
  assert.equal(big.isError, true, "feed is capped at 500 g");
  const noGrams = await client.callTool({ name: "request_action", arguments: { deviceId: "ct_001", action: "feed" } });
  assert.equal(noGrams.isError, true);
});

test("confirmation codes expire", () => {
  let t = 0;
  const store = new ConfirmStore<ActionRequest>(() => t, 1000);
  const p = store.request({ deviceId: "ct_001", kind: "door_open" });
  t = 1001;
  assert.ok("error" in store.take(p.code));
});

test("http: key guard and bind guard", async () => {
  assert.equal(hasKey({ headers: {}, params: {} } as never, undefined), true);
  const key = "k".repeat(32);
  assert.equal(hasKey({ headers: { authorization: `Bearer ${key}` }, params: {} } as never, key), true);
  assert.equal(hasKey({ headers: {}, params: { key } } as never, key), true);
  assert.equal(hasKey({ headers: { authorization: "Bearer wrong" }, params: {} } as never, key), false);
  assert.equal(checkBind("127.0.0.1", undefined), null);
  assert.match(String(checkBind("0.0.0.0", undefined)), /without TC_MCP_KEY/);
  assert.match(String(checkBind("0.0.0.0", "short")), /24 characters/);
  assert.equal(checkBind("0.0.0.0", key), null);

  const { hub } = fakeHub();
  const srv = createMcpHttpApp({ hub, key }).listen(0);
  const port = (srv.address() as { port: number }).port;
  const body = JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/list", params: {} });
  const headers = { "Content-Type": "application/json", Accept: "application/json, text/event-stream" };
  try {
    const denied = await fetch(`http://127.0.0.1:${port}/mcp`, { method: "POST", headers, body });
    assert.equal(denied.status, 401);
    const init = JSON.stringify({ jsonrpc: "2.0", id: 0, method: "initialize", params: { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "t", version: "1" } } });
    const ok = await fetch(`http://127.0.0.1:${port}/mcp/${key}`, { method: "POST", headers, body: init });
    assert.equal(ok.status, 200);
    const list = await fetch(`http://127.0.0.1:${port}/mcp`, { method: "POST", headers: { ...headers, Authorization: `Bearer ${key}` }, body });
    const names = ((await list.json()) as { result: { tools: Array<{ name: string }> } }).result.tools.map((t) => t.name);
    assert.ok(names.includes("get_device") && !names.includes("confirm_action"));
  } finally {
    srv.close();
  }
});
