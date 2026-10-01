// demoHub.ts - a small simulated farm that answers like the hub, so the MCP server works
// with no hub and no hardware (TC_MCP_DEMO=1): try-it installs, app-directory reviewers,
// classrooms. Every device id ends in _demo and every response says simulated: true.
// Actions change the simulated state (door, feed, relay, E-STOP) exactly as the hub
// routes would, so the confirm-twice flow can be tried end to end.
import type { HubFetch, HubResponse } from "./hubClient.js";

interface DemoDevice {
  id: string;
  kind: "chicken-tender" | "duck-dock" | "watchtower";
  name: string;
  state: "idle" | "running" | "error" | "estop";
  reading: Record<string, number | string>;
  relayOn?: boolean;
  alerts: Array<Record<string, unknown>>;
  events: Array<Record<string, unknown>>;
}

/**
 * Build a fresh simulated farm.
 *
 * @param now - Clock (tests)
 * @returns A hub-shaped fetch over the simulated devices
 */
export function demoHub(now: () => number = Date.now): HubFetch {
  const t0 = now();
  const devices: DemoDevice[] = [
    {
      id: "ct_demo", kind: "chicken-tender", name: "Backyard coop", state: "idle",
      reading: { temp: 71.4, humidity: 58, ammonia: 6.2, feedLevel: 64, waterLevel: 12, chickenCount: 6, doorState: "open" },
      alerts: [],
      events: [{ id: "eggs-today", type: "egg_ready", status: "active", title: "Eggs ready", detail: "4 waiting for pickup", count: 4, station: "nest boxes", ts: t0 - 3_600_000 }],
    },
    {
      id: "dd_demo", kind: "duck-dock", name: "Duck Dock", state: "idle",
      reading: { temp: 68.9, humidity: 74, feedLevel: 41, waterLevel: 88, chickenCount: 3, doorState: "open" },
      alerts: [], events: [],
    },
    {
      id: "wt_demo", kind: "watchtower", name: "WatchTower by the fence", state: "idle",
      reading: { battery: 82 },
      alerts: [{ type: "predator", label: "raccoon", confidence: 0.91, camera: 2, bearingDeg: 210, distanceFt: 34, ts: t0 - 20 * 60_000 }],
      events: [],
    },
  ];
  const find = (id: string) => devices.find((d) => d.id === id);
  const ok = (body: unknown): HubResponse => ({ ok: true, status: 200, body });
  const notFound = (id: string): HubResponse => ({ ok: false, status: 404, body: { error: `No simulated device ${id}. Demo devices: ${devices.map((d) => d.id).join(", ")}` } });
  const presence = () => ({ online: true, lastSeen: now() - 4_000, since: t0, stale: false });

  return async (path, init = {}) => {
    const method = init.method ?? "GET";
    if (path === "/api/mqtt/mqtt/status") return ok({ connected: true, broker: "simulated", devices: devices.map((d) => d.id), simulated: true });
    if (path === "/api/describe.xml") return ok("<tendercells-backend simulated=\"true\">Demo farm: see https://tendercells.com/api/tendercells-backend.xml for the real hub description.</tendercells-backend>");
    if (path === "/api/state.xml") {
      const xml = devices.map((d) => `  <device id="${d.id}" kind="${d.kind}" state="${d.state}" simulated="true">${Object.entries(d.reading).map(([k, v]) => `<${k}>${v}</${k}>`).join("")}</device>`).join("\n");
      return ok(`<?xml version="1.0" encoding="UTF-8"?>\n<tendercells-state simulated="true">\n${xml}\n</tendercells-state>`);
    }
    const m = path.match(/^\/api\/mqtt\/devices\/([^/]+)\/(.+)$/);
    if (!m) return { ok: false, status: 404, body: { error: `Not in the demo farm: ${path}` } };
    const d = find(decodeURIComponent(m[1]));
    if (!d) return notFound(decodeURIComponent(m[1]));
    const sub = m[2];
    const stamp = { deviceId: d.id, timestamp: now(), simulated: true };
    if (method === "GET") {
      if (sub === "telemetry") return ok({ ...stamp, data: { ...d.reading, ts: now() } });
      if (sub === "state") return ok({ ...stamp, data: { state: d.state, doorState: d.reading.doorState } });
      if (sub === "presence") return ok({ deviceId: d.id, ...presence(), simulated: true });
      if (sub === "alerts") return ok({ deviceId: d.id, count: d.alerts.length, alerts: d.alerts, simulated: true });
      if (sub === "events") return ok({ deviceId: d.id, presence: presence(), events: d.events, simulated: true });
    }
    if (method === "POST") {
      const body = (init.body ?? {}) as Record<string, unknown>;
      if (sub === "estop") { d.state = "estop"; return ok({ success: true, deviceId: d.id, command: "estop", message: "E-STOP activated (simulated)" }); }
      if (d.state === "estop") return { ok: false, status: 409, body: { error: "E-STOP latched (simulated)" } };
      if (sub === "door") { d.reading.doorState = body.state === "close" ? "closed" : "open"; return ok({ success: true, deviceId: d.id, command: "door", state: body.state, message: "Door command sent (simulated)" }); }
      if (sub === "feed") {
        const pct = Math.min(100, Number(d.reading.feedLevel ?? 0) + Math.round(Number(body.amount) / 20));
        d.reading.feedLevel = pct;
        return ok({ success: true, deviceId: d.id, command: "feed", amount: body.amount, message: "Feed command sent (simulated)" });
      }
      if (sub === "light") { d.relayOn = body.on === true; return ok({ success: true, deviceId: d.id, command: "light", on: d.relayOn, message: "Relay command sent (simulated)" }); }
      if (sub === "clean") { d.state = "idle"; return ok({ success: true, deviceId: d.id, command: "clean", action: body.action, message: "Clean command sent (simulated)" }); }
      const ack = sub.match(/^events\/([^/]+)\/ack$/);
      if (ack) {
        const ev = d.events.find((e) => e.id === decodeURIComponent(ack[1]));
        if (!ev) return { ok: false, status: 404, body: { error: "No such event" } };
        ev.status = "handled";
        return ok({ success: true, deviceId: d.id, event: ev });
      }
    }
    return { ok: false, status: 404, body: { error: `Not in the demo farm: ${method} ${path}` } };
  };
}
