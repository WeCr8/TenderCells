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
import { RESOURCE_MIME_TYPE } from "@modelcontextprotocol/ext-apps/server";
import { demoHub } from "./demoHub.js";
import { mcpEnv } from "./env.js";
import { assessReading } from "./health.js";
import { FARM_CARD_URI } from "./server.js";

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
  assert.deepEqual(names, ["emergency_stop", "get_alerts", "get_device", "get_farm_overview", "get_farm_snapshot", "get_hub_status", "get_yard_events"]);
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

test("health flags: thresholds from CLAUDE.md, critical first", () => {
  assert.deepEqual(assessReading({ temp: 70, ammonia: 4, feedLevel: 60, waterLevel: 60 }), []);
  const f = assessReading({ temp: 33, ammonia: 30, waterLevel: 10, feedLevel: 5 }, "estop");
  assert.equal(f[0].level, "critical");
  assert.ok(f.some((x) => /E-STOP/.test(x.text)) && f.some((x) => /Ammonia 30/.test(x.text)));
  assert.ok(f.some((x) => x.level === "warning" && /Cold: 33/.test(x.text)));
  assert.ok(f.some((x) => /Water low/.test(x.text)) && f.some((x) => /Feed low/.test(x.text)));
  assert.ok(assessReading({ temp: 95 }).some((x) => x.level === "critical"));
  assert.ok(assessReading({ ammonia: 12 }).some((x) => x.level === "warning"));
});

test("demo farm: overview is structured, simulated, flags low water, and links the farm card", async () => {
  const client = await connect(demoHub(), true);
  const tool = (await client.listTools()).tools.find((t) => t.name === "get_farm_overview")!;
  assert.equal((tool._meta as { ui?: { resourceUri?: string } }).ui?.resourceUri, FARM_CARD_URI);
  assert.ok(tool.outputSchema, "declares an output schema");
  const r = await client.callTool({ name: "get_farm_overview", arguments: {} });
  const o = r.structuredContent as { simulated: boolean; devices: Array<{ id: string; openEvents: unknown[]; recentAlerts: unknown[] }>; attention: Array<{ deviceId: string; text: string }> };
  assert.equal(o.simulated, true);
  assert.deepEqual(o.devices.map((d) => d.id), ["ct_demo", "dd_demo", "wt_demo"]);
  assert.ok(o.attention.some((a) => a.deviceId === "ct_demo" && /Water low: 12%/.test(a.text)));
  assert.equal(o.devices[0].openEvents.length, 1);
  assert.equal(o.devices[2].recentAlerts.length, 1);
  assert.match((r.content as Array<{ text: string }>)[0].text, /3 devices \(simulated\)/);
});

test("demo farm: confirm-twice really changes the simulated door, E-STOP latches", async () => {
  const client = await connect(demoHub(), true);
  const req = json(await client.callTool({ name: "request_action", arguments: { deviceId: "ct_demo", action: "door_close" } }));
  await client.callTool({ name: "confirm_action", arguments: { confirmationCode: req.confirmationCode } });
  const dev = json(await client.callTool({ name: "get_device", arguments: { deviceId: "ct_demo" } }));
  assert.equal(dev.telemetry.data.doorState, "closed");
  await client.callTool({ name: "emergency_stop", arguments: { deviceId: "dd_demo" } });
  const o = (await client.callTool({ name: "get_farm_overview", arguments: {} })).structuredContent as { attention: Array<{ deviceId: string; level: string }> };
  assert.deepEqual(o.attention[0], { ...o.attention[0], deviceId: "dd_demo", level: "critical" });
  const unknown = await client.callTool({ name: "get_device", arguments: { deviceId: "nope_demo" } });
  assert.equal(unknown.isError, true);
});

test("farm card resource is a self-contained MCP Apps page", async () => {
  const client = await connect(demoHub(), false);
  const res = await client.readResource({ uri: FARM_CARD_URI });
  const c = res.contents[0] as { mimeType?: string; text?: string };
  assert.equal(c.mimeType, RESOURCE_MIME_TYPE);
  assert.match(String(c.text), /^<!doctype html>/);
  assert.match(String(c.text), /Tender Cells farm/);
  assert.doesNotMatch(String(c.text), /<script src=/, "no external scripts");
});

test("prompts: farm_check and evening_lockup", async () => {
  const client = await connect(demoHub(), false);
  const names = (await client.listPrompts()).prompts.map((p) => p.name).sort();
  assert.deepEqual(names, ["evening_lockup", "farm_check"]);
  const p = await client.getPrompt({ name: "evening_lockup", arguments: { deviceId: "ct_demo" } });
  const text = (p.messages[0].content as { text: string }).text;
  assert.match(text, /ct_demo/);
  assert.match(text, /Never close the door without my yes/);
});

test("env: demo mode turns actions on (simulated only) unless switched off; real hub keeps them off", () => {
  assert.equal(mcpEnv({}, ["node", "x"]).allowActions, false);
  assert.equal(mcpEnv({}, ["node", "x"]).demo, false);
  assert.equal(mcpEnv({}, ["node", "x", "--demo"]).allowActions, true);
  assert.equal(mcpEnv({ TC_MCP_DEMO: "1", TC_MCP_ALLOW_ACTIONS: "0" }, []).allowActions, false);
  assert.equal(mcpEnv({ TC_MCP_ALLOW_ACTIONS: "1" }, []).allowActions, true);
});
