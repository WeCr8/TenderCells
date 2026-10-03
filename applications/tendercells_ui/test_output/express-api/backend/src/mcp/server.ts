// server.ts - the Tender Cells MCP server: one tool set for Claude (connectors, Claude
// Desktop, Claude Code) and ChatGPT (apps / developer-mode connectors), which both speak
// the Model Context Protocol. Transports live in stdio.ts (local) and http.ts (remote).
//
// What an assistant can do:
//   read      hub status, a device's telemetry / state / presence, alerts, yard events,
//             the whole-farm snapshot and the farm overview (structured, with animal-health
//             flags, shown as an inline farm card) - always available
//   prompts   farm_check, evening_lockup
//   stop      emergency_stop - always available; stopping is never gated
//   act       request_action → (person agrees) → confirm_action, only when actions are
//             enabled (TC_MCP_ALLOW_ACTIONS=1). A short allow-list: door, feed, relay,
//             stop cleaning, mark a yard flag handled.
// What it can never do here: move the arm, gantry or Roaming Roost, run routines or
// policies, approve a laser burn, drive a mower, change zones or clear an E-STOP. Those
// stay in the OS, behind its own confirmations and the chicken-presence interlocks.
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { RESOURCE_MIME_TYPE, registerAppResource, registerAppTool } from "@modelcontextprotocol/ext-apps/server";
import { z } from "zod";
import { ConfirmStore } from "./confirm.js";
import { farmCardHtml } from "./farmCard.js";
import { assessReading, type HealthFlag, type Reading } from "./health.js";
import type { HubFetch, HubResponse } from "./hubClient.js";

import { registerV2ReadTools } from "./v2/registerV2.js";

export const MCP_NAME = "tendercells";
export const MCP_VERSION = "0.4.0";
export const SITE = "https://tendercells.com";
/** Store / client icons (the Tender Cells mark), served by the website. */
export const MCP_ICONS = [
  { src: `${SITE}/brand/tendercells-icon-512.png`, mimeType: "image/png", sizes: ["512x512"] },
  { src: `${SITE}/brand/tendercells-icon-128.png`, mimeType: "image/png", sizes: ["128x128"] },
  { src: `${SITE}/brand/tendercells-icon.svg`, mimeType: "image/svg+xml", sizes: ["any"] },
];

/**
 * Where the server runs, which decides what it may do:
 *   local        on the farm network, talking to the hub: reads, E-STOP, optional actions
 *   hosted       tendercells.com connector for signed-in customers: reads only (the cloud
 *                never moves hardware; E-STOP and actions stay on the farm network)
 *   hosted-demo  tendercells.com demo connector: the simulated farm, reads only
 */
export type McpMode = "local" | "hosted" | "hosted-demo";
/** The farm card (MCP Apps view) rendered inline by Claude and ChatGPT. */
export const FARM_CARD_URI = "ui://tendercells/farm-card.html";
const MAX_OVERVIEW_DEVICES = 20;

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

export interface DeviceOverview {
  id: string;
  online: boolean | null;
  state: string | null;
  reading: Reading & Record<string, unknown>;
  flags: HealthFlag[];
  openEvents: Array<{ id: string; title: string; detail?: string }>;
  recentAlerts: Array<{ type: string; label?: string; confidence?: number; ts?: number }>;
}

export interface FarmOverview {
  simulated: boolean;
  generatedAt: string;
  devices: DeviceOverview[];
  attention: Array<HealthFlag & { deviceId: string }>;
  hubError?: string;
}

const unwrap = (body: unknown): Record<string, unknown> => {
  const b = (body ?? {}) as { data?: unknown };
  return (b.data && typeof b.data === "object" ? b.data : body ?? {}) as Record<string, unknown>;
};

/**
 * Read every device the hub knows (up to 20) and flag what needs attention.
 *
 * @param hub - Hub client
 * @returns The overview; `hubError` is set when the hub could not be reached
 */
export async function farmOverview(hub: HubFetch): Promise<FarmOverview> {
  const status = await hub(`${M}/mqtt/status`);
  const generatedAt = new Date().toISOString();
  if (!status.ok) return { simulated: false, generatedAt, devices: [], attention: [], hubError: JSON.stringify(status.body) };
  const sb = status.body as { devices?: Array<string | { id: string }>; simulated?: boolean };
  const ids = (sb.devices ?? []).map((d) => (typeof d === "string" ? d : d.id)).slice(0, MAX_OVERVIEW_DEVICES);
  const devices = await Promise.all(ids.map(async (id): Promise<DeviceOverview> => {
    const [tel, st, pres, al, ev] = await Promise.all(["telemetry", "state", "presence", "alerts", "events"].map((s) => hub(`${dev(id)}/${s}`)));
    const reading = (tel.ok ? unwrap(tel.body) : {}) as DeviceOverview["reading"];
    delete reading.ts;
    const state = st.ok ? String(unwrap(st.body).state ?? "") || null : null;
    const online = pres.ok ? Boolean((pres.body as { online?: boolean }).online) : null;
    const flags = assessReading(reading, state ?? undefined);
    if (online === false) flags.push({ level: "warning", text: "Offline - no data recently" });
    const alerts = al.ok ? ((al.body as { alerts?: Array<Record<string, unknown>> }).alerts ?? []) : [];
    const events = ev.ok ? ((ev.body as { events?: Array<Record<string, unknown>> }).events ?? []) : [];
    return {
      id, online, state, reading, flags,
      openEvents: events.filter((e) => e.status !== "handled").slice(0, 5).map((e) => ({ id: String(e.id), title: String(e.title ?? e.type), detail: e.detail as string | undefined })),
      recentAlerts: alerts.slice(-3).reverse().map((a) => ({ type: String(a.type), label: a.label as string | undefined, confidence: a.confidence as number | undefined, ts: a.ts as number | undefined })),
    };
  }));
  const attention = devices.flatMap((d) => d.flags.map((f) => ({ ...f, deviceId: d.id })))
    .sort((a, b) => (a.level === b.level ? 0 : a.level === "critical" ? -1 : 1));
  return { simulated: Boolean(sb.simulated) || ids.length > 0 && ids.every((i) => i.startsWith("sim_") || i.endsWith("_demo")), generatedAt, devices, attention };
}

/** Plain-language summary of an overview (what the model reads; the card shows the rest). */
export function overviewSummary(o: FarmOverview): string {
  if (o.hubError) return `The hub is not reachable: ${o.hubError}`;
  if (!o.devices.length) return "The hub is up but has not heard from any device yet.";
  const head = `${o.devices.length} device${o.devices.length > 1 ? "s" : ""}${o.simulated ? " (simulated)" : ""}.`;
  const need = o.attention.length ? ` Needs attention: ${o.attention.map((a) => `[${a.level}] ${a.deviceId}: ${a.text}`).join("; ")}.` : " Nothing needs attention.";
  const flagsOpen = o.devices.flatMap((d) => d.openEvents.map((e) => `${d.id}: ${e.title}${e.detail ? ` (${e.detail})` : ""}`));
  const alerts = o.devices.flatMap((d) => d.recentAlerts.map((a) => `${d.id}: ${a.label ?? a.type}${a.confidence ? ` ${Math.round(a.confidence * 100)}%` : ""}`));
  return `${head}${need}${flagsOpen.length ? ` Open flags: ${flagsOpen.join("; ")}.` : ""}${alerts.length ? ` Recent alerts: ${alerts.join("; ")}.` : ""}`;
}

const flagSchema = z.object({ level: z.enum(["critical", "warning"]), text: z.string() });
const OVERVIEW_SHAPE = {
  simulated: z.boolean(),
  generatedAt: z.string(),
  hubError: z.string().optional(),
  attention: z.array(flagSchema.extend({ deviceId: z.string() })),
  devices: z.array(z.object({
    id: z.string(),
    online: z.boolean().nullable(),
    state: z.string().nullable(),
    reading: z.record(z.string(), z.unknown()),
    flags: z.array(flagSchema),
    openEvents: z.array(z.object({ id: z.string(), title: z.string(), detail: z.string().optional() })),
    recentAlerts: z.array(z.object({ type: z.string(), label: z.string().optional(), confidence: z.number().optional(), ts: z.number().optional() })),
  })),
};

const RULES_COMMON = [
  "- Animal safety first. If readings suggest a health risk (temperature below 35°F or above 85°F, ammonia above 10 ppm, water below 15%), say so before anything else.",
  "- Say \"simulated\" when a device id starts with sim_ or ends with _demo, or the data says it is simulated.",
  "- For \"how is the farm?\" questions, start with get_farm_overview: it flags animal-health issues and shows a farm card.",
  "- For learning, list existing missions or Builder projects, then fetch one mission/project step at a time. Preserve its safety gates and checkpoint; cite its source references.",
  "- Never execute a Builder demo binding or hardware action. A project marked concept is not verified for construction; never treat its art as an authoritative wiring or pinout source.",
  "- Builder tools and their inline card are read-only and have no hardware controls.",
];
const RULES_LOCAL = [
  "- If anything looks dangerous to an animal or a person, call emergency_stop. Stopping never needs confirmation.",
  "- You can never actuate in one step. Use request_action, show the person the summary and the \"check first\" list, and call confirm_action only after they clearly agree. Never confirm on your own.",
  "- Arm, gantry, Roaming Roost driving, routines, laser weeding, mowers, zones and clearing an E-STOP are not available here. Send the person to the Tender Cells OS for those.",
];
const RULES_HOSTED = [
  "- This connector runs in the cloud and is read-only: it can never move hardware or stop it. If anything looks dangerous to an animal or a person, tell the person to press E-STOP in the Tender Cells app or on the device right away.",
  "- For door, feed or any other action, send the person to the Tender Cells app (https://tendercells.com/app) or the local plugin on their farm network.",
];

/** Server instructions for a mode. */
export function instructionsFor(mode: McpMode): string {
  const intro = mode === "hosted-demo"
    ? "Tender Cells runs backyard farms: coops, sensors, robots and cameras. This is the simulated demo farm - nothing here is real."
    : "Tender Cells runs a backyard farm: coops, sensors, robots and cameras, controlled by a local hub.";
  return [intro, "Rules for assistants:", ...RULES_COMMON.slice(0, 1), ...(mode === "local" ? RULES_LOCAL : RULES_HOSTED), ...RULES_COMMON.slice(1)].join("\n");
}

export interface McpOptions {
  hub: HubFetch;
  /** Register request_action / confirm_action (TC_MCP_ALLOW_ACTIONS=1). */
  allowActions?: boolean;
  confirmations?: ConfirmStore<ActionRequest>;
  /** E-STOPs sent through this server (shared across HTTP requests). */
  estopSentAt?: Map<string, number>;
  /** Where the server runs (default local). Hosted modes are read-only. */
  mode?: McpMode;
}

/**
 * Build the Tender Cells MCP server.
 *
 * @param opts - Hub client, whether actions are enabled, and an optional confirmation store
 * @returns An MCP server ready to connect to a transport
 */
export function createTenderCellsMcp(opts: McpOptions): McpServer {
  const { hub, mode = "local" } = opts;
  const hosted = mode !== "local";
  const allowActions = !hosted && (opts.allowActions ?? false);
  const confirmations = opts.confirmations ?? new ConfirmStore<ActionRequest>();
  const estopSentAt = opts.estopSentAt ?? new Map<string, number>();
  const server = new McpServer(
    { name: MCP_NAME, title: mode === "hosted-demo" ? "Tender Cells (demo farm)" : "Tender Cells", version: MCP_VERSION, websiteUrl: SITE, icons: MCP_ICONS },
    { instructions: instructionsFor(mode) },
  );
  registerV2ReadTools(server, () => farmOverview(hub), hosted ? "cloud mirror" : "local hub");
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

  registerAppTool(server, "get_farm_overview", {
    title: "Farm overview",
    description: "Every device with its key readings, online / state, open yard flags, recent alerts and animal-health flags (critical first). Shows a farm card in apps that support it. Best first call for 'how is the farm doing?'.",
    outputSchema: OVERVIEW_SHAPE,
    annotations: READ,
    _meta: { ui: { resourceUri: FARM_CARD_URI } },
  }, async () => {
    const o = await farmOverview(hub);
    return { content: [{ type: "text" as const, text: overviewSummary(o) }], structuredContent: o as unknown as Record<string, unknown>, isError: Boolean(o.hubError) || undefined };
  });

  registerAppResource(server, "farm-card", FARM_CARD_URI, {
    title: "Tender Cells farm card",
    description: "Inline view of the farm overview: readings, health flags, yard flags and alerts. Read-only.",
    mimeType: RESOURCE_MIME_TYPE,
  }, async () => ({ contents: [{ uri: FARM_CARD_URI, mimeType: RESOURCE_MIME_TYPE, text: await farmCardHtml() }] }));

  server.registerPrompt("farm_check", {
    title: "Farm check",
    description: "Daily check: animal-health risks first, then open flags and alerts, then up to three suggested next steps. Read-only.",
  }, () => ({ messages: [{ role: "user", content: { type: "text", text: "Run a Tender Cells farm check. Call get_farm_overview. Report animal-health risks first (device and number), then open yard flags and predator alerts from the last 24 hours, then up to three plain-language next steps. Do not request or confirm any hardware action during the check." } }] }));

  server.registerPrompt("evening_lockup", {
    title: "Evening lock-up",
    description: "Before closing a coop for the night: headcount, door, water, temperature and predator check, then offer to close the door (confirm-twice).",
    argsSchema: { deviceId: z.string().describe("Coop device id, e.g. ct_001") },
  }, ({ deviceId: id }) => ({ messages: [{ role: "user", content: { type: "text", text: `Help me lock up coop ${id} for the night. 1) Call get_device for ${id}: report the chicken count, door state, water and temperature. 2) Call get_alerts for ${id} and mention any predator alerts from the last hour. 3) If the door is open, ask whether every bird is inside; only if I say yes, call request_action with door_close, show me the summary and the check-first list, and wait for my yes before confirm_action. If request_action is not available (actions are off), tell me to close it in the Tender Cells OS instead. Never close the door without my yes.` } }] }));

  if (!hosted) server.registerTool("emergency_stop", {
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
