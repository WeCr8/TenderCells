// server.ts - the Tender Cells MCP server: one tool set for Claude (connectors, Claude
// Desktop, Claude Code) and ChatGPT (apps / developer-mode connectors), which both speak
// the Model Context Protocol. Transports live in stdio.ts (local) and http.ts (remote).
//
// What an assistant can do:
//   read      hub status, a device's telemetry / state / presence, alerts, yard events and
//             the whole-farm snapshot - always available
//   stop      emergency_stop - always available; stopping is never gated
//   act       request_action → (person agrees) → confirm_action, only when actions are
//             enabled (TC_MCP_ALLOW_ACTIONS=1). A short allow-list: door, feed, relay,
//             stop cleaning, mark a yard flag handled.
// What it can never do here: move the arm, gantry or Roaming Roost, run routines or
// policies, approve a laser burn, drive a mower, change zones or clear an E-STOP. Those
// stay in the OS, behind its own confirmations and the chicken-presence interlocks.
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ConfirmStore } from "./confirm.js";
import type { HubFetch, HubResponse } from "./hubClient.js";

export const MCP_NAME = "tendercells";
export const MCP_VERSION = "0.1.0";

export const ACTIONS = ["door_open", "door_close", "feed", "relay_on", "relay_off", "cleaning_stop", "mark_event_handled"] as const;
export type ActionKind = (typeof ACTIONS)[number];

export interface ActionRequest {
  deviceId: string;
  kind: ActionKind;
  grams?: number;
  eventId?: string;
}

const M = "/api/mqtt";
const dev = (id: string) => `${M}/devices/${encodeURIComponent(id)}`;

/** Hub call for an allowed action. */
export function actionCall(a: ActionRequest): { method: "POST"; path: string; body?: unknown } {
  switch (a.kind) {
    case "door_open": return { method: "POST", path: `${dev(a.deviceId)}/door`, body: { state: "open" } };
    case "door_close": return { method: "POST", path: `${dev(a.deviceId)}/door`, body: { state: "close" } };
    case "feed": return { method: "POST", path: `${dev(a.deviceId)}/feed`, body: { amount: a.grams } };
    case "relay_on": return { method: "POST", path: `${dev(a.deviceId)}/light`, body: { on: true } };
    case "relay_off": return { method: "POST", path: `${dev(a.deviceId)}/light`, body: { on: false } };
    case "cleaning_stop": return { method: "POST", path: `${dev(a.deviceId)}/clean`, body: { action: "stop" } };
    case "mark_event_handled": return { method: "POST", path: `${dev(a.deviceId)}/events/${encodeURIComponent(a.eventId ?? "")}/ack` };
  }
}

/** What the person is agreeing to, in plain words, plus what to check first. */
export function actionPreview(a: ActionRequest): { summary: string; checkFirst: string[] } {
  switch (a.kind) {
    case "door_open": return { summary: `Open the coop door on ${a.deviceId}.`, checkFirst: ["It is a safe time for the flock to be out (daylight, no predator alerts)."] };
    case "door_close": return { summary: `Close the coop door on ${a.deviceId}.`, checkFirst: ["No chicken is standing in the doorway.", "Every bird you expect is inside."] };
    case "feed": return { summary: `Dispense ${a.grams} g of feed on ${a.deviceId}.`, checkFirst: ["The feeder has feed and the chute is clear."] };
    case "relay_on": return { summary: `Switch ON the relay load on ${a.deviceId} (heat lamp, fan, pump or grow light - whatever is wired to it).`, checkFirst: ["You know what is wired to this relay.", "A heat lamp is secured and clear of bedding."] };
    case "relay_off": return { summary: `Switch OFF the relay load on ${a.deviceId}.`, checkFirst: ["Turning it off will not chill or overheat the animals."] };
    case "cleaning_stop": return { summary: `Stop the cleaning cycle on ${a.deviceId}.`, checkFirst: [] };
    case "mark_event_handled": return { summary: `Mark yard flag ${a.eventId} on ${a.deviceId} as handled.`, checkFirst: ["You really did deal with it (eggs collected, predator checked)."] };
  }
}

/** E-STOP as the hub reports it: GET /devices/{id}/state → { data: { state } }. */
export function isEstop(body: unknown): boolean {
  const b = body as { state?: string; systemState?: string; data?: { state?: string; systemState?: string } } | null;
  const s = b?.data ?? b;
  return s?.state === "estop" || s?.systemState === "estop";
}

/** How long a just-sent E-STOP blocks actions locally, before the device has reported it. */
export const ESTOP_LOCAL_LATCH_MS = 30_000;

const text = (v: unknown) => ({ content: [{ type: "text" as const, text: typeof v === "string" ? v : JSON.stringify(v, null, 2) }] });
const fail = (msg: string) => ({ ...text(msg), isError: true });
const hubResult = (r: HubResponse) => (r.ok ? text(r.body) : fail(`Hub answered ${r.status || "nothing"}: ${JSON.stringify(r.body)}`));

const INSTRUCTIONS = `Tender Cells runs a backyard farm: coops, sensors, robots and cameras, controlled by a local hub.
Rules for assistants:
- Animal safety first. If readings suggest a health risk (temperature below 35°F or above 85°F, ammonia above 10 ppm, water below 15%), say so before anything else.
- If anything looks dangerous to an animal or a person, call emergency_stop. Stopping never needs confirmation.
- You can never actuate in one step. Use request_action, show the person the summary and the "check first" list, and call confirm_action only after they clearly agree. Never confirm on your own.
- Arm, gantry, Roaming Roost driving, routines, laser weeding, mowers, zones and clearing an E-STOP are not available here. Send the person to the Tender Cells OS for those.
- Say "simulated" when a device id starts with sim_ or the data says it is simulated.`;

export interface McpOptions {
  hub: HubFetch;
  /** Register request_action / confirm_action (TC_MCP_ALLOW_ACTIONS=1). */
  allowActions?: boolean;
  confirmations?: ConfirmStore<ActionRequest>;
  /** E-STOPs sent through this server (shared across HTTP requests). */
  estopSentAt?: Map<string, number>;
}

/**
 * Build the Tender Cells MCP server.
 *
 * @param opts - Hub client, whether actions are enabled, and an optional confirmation store
 * @returns An MCP server ready to connect to a transport
 */
export function createTenderCellsMcp(opts: McpOptions): McpServer {
  const { hub, allowActions = false } = opts;
  const confirmations = opts.confirmations ?? new ConfirmStore<ActionRequest>();
  const estopSentAt = opts.estopSentAt ?? new Map<string, number>();
  const server = new McpServer({ name: MCP_NAME, version: MCP_VERSION }, { instructions: INSTRUCTIONS });
  const deviceId = z.string().min(1).max(64).regex(/^[A-Za-z0-9_.-]+$/, "letters, digits, _ . - only").describe("Device id, e.g. ct_001 or sim_001");
  const READ = { readOnlyHint: true, openWorldHint: false } as const;

  server.registerTool("get_hub_status", {
    title: "Hub status",
    description: "Is the farm hub connected to its MQTT broker, and which devices has it heard from? Start here to find device ids.",
    annotations: READ,
  }, async () => hubResult(await hub(`${M}/mqtt/status`)));

  server.registerTool("get_device", {
    title: "Device readings",
    description: "Latest telemetry (temperature °F, humidity, ammonia ppm, feed %, water %, chicken count, door), system state (idle | running | error | estop) and online / last seen for one device.",
    inputSchema: { deviceId },
    annotations: READ,
  }, async ({ deviceId: id }) => {
    const [telemetry, state, presence] = await Promise.all([hub(`${dev(id)}/telemetry`), hub(`${dev(id)}/state`), hub(`${dev(id)}/presence`)]);
    if (!telemetry.ok && !state.ok && !presence.ok) return hubResult(telemetry);
    return text({ deviceId: id, telemetry: telemetry.ok ? telemetry.body : null, state: state.ok ? state.body : null, presence: presence.ok ? presence.body : null });
  });

  server.registerTool("get_alerts", {
    title: "Device alerts",
    description: "The device's last 100 alerts: predator, fault and health.",
    inputSchema: { deviceId },
    annotations: READ,
  }, async ({ deviceId: id }) => hubResult(await hub(`${dev(id)}/alerts`)));

  server.registerTool("get_yard_events", {
    title: "Yard events",
    description: "Station flags for a device (eggs ready, pickup ready, weed detected, roost headcount, animal or leak findings) with their ids, plus presence.",
    inputSchema: { deviceId },
    annotations: READ,
  }, async ({ deviceId: id }) => hubResult(await hub(`${dev(id)}/events`)));

  server.registerTool("get_farm_snapshot", {
    title: "Whole-farm snapshot",
    description: "Every device at once (XML): presence, telemetry, state and yard events. Use for 'how is the farm doing?'.",
    annotations: READ,
  }, async () => hubResult(await hub("/api/state.xml")));

  server.registerTool("emergency_stop", {
    title: "EMERGENCY STOP",
    description: "Immediately stop every actuator on a device (QoS 2, retained). Use whenever an animal or person could be hurt. Never needs confirmation. Clearing it is only possible in the Tender Cells OS.",
    inputSchema: { deviceId },
    annotations: { destructiveHint: false, idempotentHint: true, openWorldHint: false },
  }, async ({ deviceId: id }) => {
    estopSentAt.set(id, Date.now());
    const cancelled = confirmations.cancelDevice((a) => a.deviceId === id);
    const r = await hub(`${dev(id)}/estop`, { method: "POST", body: { source: "assistant" } });
    if (!r.ok) return hubResult(r);
    return text({ result: r.body, cancelledPendingActions: cancelled, note: "E-STOP is latched. Clear it in the Tender Cells OS after checking the coop." });
  });

  server.registerResource("backend-description", "tendercells://describe.xml", {
    title: "Tender Cells backend description",
    description: "Machine-readable API, MQTT topics, payloads, robots and safety rules.",
    mimeType: "application/xml",
  }, async (uri) => {
    const r = await hub("/api/describe.xml");
    return { contents: [{ uri: uri.href, mimeType: "application/xml", text: typeof r.body === "string" ? r.body : JSON.stringify(r.body) }] };
  });

  if (!allowActions) return server;

  /** Why an action may not run on this device right now, or null. Checked on request AND on confirm. */
  const blocked = async (id: string): Promise<string | null> => {
    const sent = estopSentAt.get(id);
    if (sent !== undefined && Date.now() - sent < ESTOP_LOCAL_LATCH_MS) return `An E-STOP was just sent to ${id}. Nothing can run until someone checks the coop and clears it in the Tender Cells OS.`;
    const state = await hub(`${dev(id)}/state`);
    if (state.ok && isEstop(state.body)) return `${id} is in E-STOP. Nothing can run until someone checks the coop and clears it in the Tender Cells OS.`;
    return null;
  };

  server.registerTool("request_action", {
    title: "Request a hardware action",
    description: "Step 1 of 2. Prepares an action WITHOUT touching hardware and returns a plain-language summary, a 'check first' list and a confirmation code (single-use, 2 minutes). Show the summary and checks to the person and wait for a clear yes before confirm_action.",
    inputSchema: {
      deviceId,
      action: z.enum(ACTIONS).describe("door_open | door_close | feed (needs grams) | relay_on | relay_off | cleaning_stop | mark_event_handled (needs eventId)"),
      grams: z.number().int().min(1).max(500).optional().describe("Feed amount in grams (feed only, 1-500)"),
      eventId: z.string().min(1).max(128).optional().describe("Yard event id from get_yard_events (mark_event_handled only)"),
    },
    annotations: { readOnlyHint: true, openWorldHint: false },
  }, async ({ deviceId: id, action, grams, eventId }) => {
    if (action === "feed" && grams === undefined) return fail("feed needs grams (1-500).");
    if (action === "mark_event_handled" && !eventId) return fail("mark_event_handled needs eventId (see get_yard_events).");
    const why = await blocked(id);
    if (why) return fail(why);
    const req: ActionRequest = { deviceId: id, kind: action, grams: action === "feed" ? grams : undefined, eventId: action === "mark_event_handled" ? eventId : undefined };
    const pending = confirmations.request(req);
    return text({
      confirmationCode: pending.code,
      expiresInSeconds: Math.round((pending.expiresAt - Date.now()) / 1000),
      ...actionPreview(req),
      next: "Ask the person to confirm. Only after a clear yes, call confirm_action with this code.",
    });
  });

  server.registerTool("confirm_action", {
    title: "Confirm a hardware action",
    description: "Step 2 of 2. Runs an action the person has explicitly agreed to, using the code from request_action. Never call this without the person's clear yes in this conversation.",
    inputSchema: { confirmationCode: z.string().regex(/^\d{6}$/, "6-digit code from request_action") },
    annotations: { destructiveHint: true, idempotentHint: false, openWorldHint: false },
  }, async ({ confirmationCode }) => {
    const taken = confirmations.take(confirmationCode);
    if ("error" in taken) return fail(taken.error);
    const why = await blocked(taken.action.deviceId);
    if (why) return fail(why);
    const call = actionCall(taken.action);
    const r = await hub(call.path, { method: call.method, body: call.body });
    if (!r.ok) return hubResult(r);
    return text({ done: actionPreview(taken.action).summary, hub: r.body, note: "The command is sent; the device confirms it on its state topic. Check get_device in a few seconds." });
  });

  return server;
}
