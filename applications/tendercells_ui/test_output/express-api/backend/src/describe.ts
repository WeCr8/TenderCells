// describe.ts - machine-readable (XML) description of the Tender Cells backend, so an LLM
// or any tool can learn the API, MQTT topics, payloads, robots and safety rules without
// scraping web pages.
//
//   GET /api/describe.xml   this spec (public; no device data)
//   GET /api/state.xml      live devices, telemetry, state and yard events (auth when enabled)
//   tendercells.com/api/tendercells-backend.xml   static copy, written by
//                           `npm run describe:xml` (CI fails if it is out of date)
//
// Request bodies come from schemas.ts - the same schemas the API validates with.
import { SCHEMAS, KNOWN_ROUTINES, type Schema } from "./schemas.js";

export const DESCRIBE_VERSION = "1";

type Auth = "public" | "signed-in" | "device-owner";

export interface EndpointDoc {
  method: "GET" | "POST" | "PUT" | "DELETE";
  path: string;
  auth: Auth;
  summary: string;
  body?: keyof typeof SCHEMAS;
  /** MQTT publish the endpoint triggers. */
  mqtt?: { topic: string; qos: 0 | 1 | 2; retain?: boolean };
  /** Refused while E-STOP is latched / chickens are in the work area (see <safety>). */
  gated?: "arm" | "weed";
  /** Waits up to 3 s for the device ack: 200 accepted, 409 refused (with reason), 202 no ack yet. */
  ack?: boolean;
}

const M = "/api/mqtt";
export const ENDPOINTS: EndpointDoc[] = [
  { method: "GET", path: "/health", auth: "public", summary: "Liveness check." },
  { method: "GET", path: "/api/status", auth: "public", summary: "Service name, version and main endpoints." },
  { method: "GET", path: "/api/describe.xml", auth: "public", summary: "This machine-readable description." },
  { method: "GET", path: "/api/state.xml", auth: "signed-in", summary: "Live snapshot of every device: presence, telemetry, state, yard events." },
  { method: "GET", path: `${M}/mqtt/status`, auth: "public", summary: "Broker connection and known devices." },
  { method: "POST", path: `${M}/mqtt/connect`, auth: "public", summary: "Force a broker reconnect." },
  { method: "GET", path: `${M}/unclaimed`, auth: "signed-in", summary: "Devices heard on the network that no account owns yet." },
  { method: "POST", path: `${M}/devices/{deviceId}/claim`, auth: "signed-in", summary: "Claim a device for the signed-in account." },
  { method: "GET", path: `${M}/devices/{deviceId}/telemetry`, auth: "device-owner", summary: "Latest tc/{id}/sensors payload." },
  { method: "GET", path: `${M}/devices/{deviceId}/state`, auth: "device-owner", summary: "Latest tc/{id}/state payload (idle | running | error | estop)." },
  { method: "GET", path: `${M}/devices/{deviceId}/state/{sub}`, auth: "device-owner", summary: "Latest sub-state: arm | gantry | weed (tc/{id}/state/{sub})." },
  { method: "GET", path: `${M}/devices/{deviceId}/alerts`, auth: "device-owner", summary: "Last 100 alerts (predator, fault, health)." },
  { method: "GET", path: `${M}/devices/{deviceId}/events`, auth: "device-owner", summary: "Yard events / station flags plus presence (see <yard-events>)." },
  { method: "GET", path: `${M}/devices/{deviceId}/presence`, auth: "device-owner", summary: "Online / last seen (stale after 90 s of silence)." },
  { method: "POST", path: `${M}/devices/{deviceId}/events/{eventId}/ack`, auth: "device-owner", summary: "Mark a flag handled (eggs picked up, predator seen).", mqtt: { topic: "tc/{id}/cmd/event", qos: 1 }, ack: true },
  { method: "POST", path: `${M}/devices/{deviceId}/door`, auth: "device-owner", summary: "Open / close the door.", body: "door", mqtt: { topic: "tc/{id}/cmd/door", qos: 1 } },
  { method: "POST", path: `${M}/devices/{deviceId}/drive`, auth: "device-owner", summary: "Roaming Roost differential drive.", body: "drive", mqtt: { topic: "tc/{id}/cmd/drive", qos: 1 } },
  { method: "POST", path: `${M}/devices/{deviceId}/light`, auth: "device-owner", summary: "Relay on/off (heat lamp, pump, fan, grow light).", body: "light", mqtt: { topic: "tc/{id}/cmd/light", qos: 1 } },
  { method: "POST", path: `${M}/devices/{deviceId}/gantry`, auth: "device-owner", summary: "GRBL gantry move or real-time command.", body: "gantry", mqtt: { topic: "tc/{id}/cmd/gantry", qos: 1 } },
  { method: "POST", path: `${M}/devices/{deviceId}/feed`, auth: "device-owner", summary: "Dispense feed (grams).", body: "feed", mqtt: { topic: "tc/{id}/cmd/feed", qos: 1 } },
  { method: "POST", path: `${M}/devices/{deviceId}/clean`, auth: "device-owner", summary: "Start / stop a cleaning cycle.", body: "clean", mqtt: { topic: "tc/{id}/cmd/clean", qos: 1 }, gated: "arm" },
  { method: "POST", path: `${M}/devices/{deviceId}/arm`, auth: "device-owner", summary: "Move arm joints (degrees).", body: "arm", mqtt: { topic: "tc/{id}/cmd/arm", qos: 1 }, gated: "arm" },
  { method: "POST", path: `${M}/devices/{deviceId}/routine`, auth: "device-owner", summary: "Run a predefined gantry + arm routine.", body: "routine", mqtt: { topic: "tc/{id}/cmd/motion", qos: 1 }, gated: "arm" },
  { method: "POST", path: `${M}/devices/{deviceId}/policy`, auth: "device-owner", summary: "Run a Hugging Face LeRobot policy on the arm (live) or in LeRobot sim.", body: "policy", mqtt: { topic: "tc/{id}/cmd/motion", qos: 1 }, gated: "arm" },
  { method: "POST", path: `${M}/devices/{deviceId}/policy/stop`, auth: "device-owner", summary: "Stop a running policy.", mqtt: { topic: "tc/{id}/cmd/motion", qos: 1 } },
  { method: "POST", path: `${M}/devices/{deviceId}/weeds/pass`, auth: "device-owner", summary: "Run 1-10 weed detection passes (detect only).", body: "weedPass", mqtt: { topic: "tc/{id}/cmd/weed", qos: 1 }, gated: "weed", ack: true },
  { method: "POST", path: `${M}/devices/{deviceId}/weeds/{eventId}/approve`, auth: "device-owner", summary: "Human approval for ONE weed: aim (aiming dot) or burn (laser, interlocked on the robot).", body: "weedApprove", mqtt: { topic: "tc/{id}/cmd/weed", qos: 2 }, gated: "weed", ack: true },
  { method: "POST", path: `${M}/devices/{deviceId}/weeds/{eventId}/reject`, auth: "device-owner", summary: "Not a weed / leave it.", mqtt: { topic: "tc/{id}/cmd/weed", qos: 1 }, ack: true },
  { method: "POST", path: `${M}/devices/{deviceId}/estop`, auth: "device-owner", summary: "EMERGENCY STOP: latches on every subscriber.", mqtt: { topic: "tc/{id}/cmd/estop", qos: 2, retain: true } },
  { method: "POST", path: `${M}/devices/{deviceId}/estop/clear`, auth: "device-owner", summary: "Clear a latched E-STOP (replaces the retained stop).", mqtt: { topic: "tc/{id}/cmd/estop", qos: 2, retain: true } },
  { method: "GET", path: "/api/products", auth: "public", summary: "Registered products (demo registry)." },
  { method: "GET", path: "/api/products/stats", auth: "public", summary: "Product counts." },
  { method: "POST", path: "/api/products", auth: "public", summary: "Register a product." },
  { method: "GET", path: "/api/products/{id}", auth: "public", summary: "One product." },
  { method: "PUT", path: "/api/products/{id}", auth: "public", summary: "Update a product." },
  { method: "DELETE", path: "/api/products/{id}", auth: "public", summary: "Remove a product." },
  { method: "POST", path: "/api/products/{id}/connect", auth: "public", summary: "Mark a product connected." },
  { method: "POST", path: "/api/products/{id}/disconnect", auth: "public", summary: "Mark a product disconnected." },
  { method: "POST", path: "/api/products/{id}/link-device", auth: "public", summary: "Link a product to an MQTT device id." },
  { method: "POST", path: "/api/products/validate", auth: "public", summary: "Validate a product payload." },
];

interface TopicDoc { pattern: string; direction: "device-to-api" | "api-to-device"; qos: 0 | 1 | 2; retain?: boolean; payload: string; note?: string }

export const MQTT_TOPICS: TopicDoc[] = [
  { pattern: "tc/{id}/sensors", direction: "device-to-api", qos: 0, payload: "sensors", note: "Every 10 s. Camera nodes add streamUrl (MJPEG)." },
  { pattern: "tc/{id}/state", direction: "device-to-api", qos: 1, payload: "{state: idle|running|error|estop, uptime, ts}" },
  { pattern: "tc/{id}/state/{sub}", direction: "device-to-api", qos: 1, retain: true, payload: "arm {joints, state, estop, policy} | gantry {x,y,z} | weed {state, laser{...}, pass{...}, tool{x,y,z,aim,laser}, robotType}" },
  { pattern: "tc/{id}/status", direction: "device-to-api", qos: 1, retain: true, payload: "{online: boolean}", note: "Retained, with an MQTT last will of {online:false}." },
  { pattern: "tc/{id}/ack", direction: "device-to-api", qos: 1, payload: "{seq, ok, error?}", note: "Reply to every command that carries seq." },
  { pattern: "tc/{id}/event", direction: "device-to-api", qos: 1, payload: "yard event (see <yard-events>)", note: "Upserted by id." },
  { pattern: "tc/{id}/alert", direction: "device-to-api", qos: 2, payload: "{type: predator|fault|health, label?, confidence, camera?, bearingDeg?, distanceFt?, ts}", note: "Predator alerts become located yard events." },
  { pattern: "tc/broadcast/alert", direction: "device-to-api", qos: 2, payload: "alert", note: "WatchTower broadcast to every device (not stored as an event)." },
  { pattern: "tc/{id}/cmd/{command}", direction: "api-to-device", qos: 1, payload: "command body + {seq, timestamp}", note: "door, feed, clean, arm, motion, drive, light, gantry, weed, event" },
  { pattern: "tc/{id}/cmd/estop", direction: "api-to-device", qos: 2, retain: true, payload: "{active: boolean, source, ts}" },
];

const ROBOT_TYPES = [
  { id: "genesis-laser", motion: "gantry", laser: { profile: "diode-500mw", powerW: 0.5, wavelengthNm: 405, laserClass: "3B", exposureMs: "2000-8000" }, basis: "FarmBot Genesis + laser module (Project Cyclops, CC0)" },
  { id: "rover-laser", motion: "rover", laser: { profile: "diode-4w", powerW: 4, wavelengthNm: 450, laserClass: "4", exposureMs: "500-3000" }, basis: "LiteWeed-style stop-and-align rover" },
  { id: "arm-laser", motion: "arm", laser: { profile: "diode-500mw", powerW: 0.5, wavelengthNm: 405, laserClass: "3B", exposureMs: "2000-8000" }, basis: "Arm service (sim / Universal Robots / LeRobot) carrying the laser module" },
];

export const esc = (v: unknown): string =>
  String(v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");

const attrs = (o: Record<string, unknown>): string =>
  Object.entries(o).filter(([, v]) => v !== undefined && v !== null && v !== false)
    .map(([k, v]) => ` ${k}="${esc(v === true ? "true" : v)}"`).join("");

function schemaXml(name: string, schema: Schema, indent: string): string {
  return Object.entries(schema).map(([field, r]) =>
    `${indent}<field${attrs({ name: field, type: r.type, required: r.required ?? false, min: r.min, max: r.max, values: r.values?.join("|") })}/>`,
  ).join("\n") || `${indent}<!-- ${esc(name)}: no fields -->`;
}

/**
 * Build the backend description XML.
 *
 * @param opts.routes - Routes actually registered (METHOD + path); any not documented
 *                      above are listed under <undocumented> so gaps are visible
 * @returns XML document (UTF-8)
 */
export function buildBackendXml(opts: { routes?: Array<{ method: string; path: string }> } = {}): string {
  const lines: string[] = [];
  lines.push('<?xml version="1.0" encoding="UTF-8"?>');
  lines.push("<!-- Tender Cells backend description for LLMs and tools. Generated from express-api/backend/src/describe.ts + schemas.ts. -->");
  lines.push(`<tendercells-backend${attrs({ version: DESCRIBE_VERSION, service: "tender-cells-api", site: "https://tendercells.com" })}>`);
  lines.push("  <overview>OS (web app) -> HTTP -> express-api (LAN hub, default port 4000) -> MQTT broker -> devices (ESP32 firmware, Jetson/Pi robot services). Motion commands never go through Firebase.</overview>");

  lines.push('  <http base-default="http://localhost:4000" auth-header="Authorization: Bearer &lt;Firebase ID token&gt;" auth-note="When the API runs without Firebase admin, auth is not enforced (LAN/demo).">');
  for (const e of ENDPOINTS) {
    lines.push(`    <endpoint${attrs({ method: e.method, path: e.path, auth: e.auth, gated: e.gated, "waits-for-ack": e.ack })}>`);
    lines.push(`      <summary>${esc(e.summary)}</summary>`);
    if (e.body) lines.push(`      <body schema="${esc(e.body)}">\n${schemaXml(e.body, SCHEMAS[e.body], "        ")}\n      </body>`);
    if (e.mqtt) lines.push(`      <publishes${attrs({ topic: e.mqtt.topic, qos: e.mqtt.qos, retain: e.mqtt.retain })}/>`);
    lines.push("    </endpoint>");
  }
  lines.push("    <responses>");
  lines.push('      <status code="200">OK (for ack endpoints: the device accepted)</status>');
  lines.push('      <status code="202">Sent; no device acknowledgement within 3 s (offline or older firmware)</status>');
  lines.push('      <status code="400">Body failed schema validation (error says which field)</status>');
  lines.push('      <status code="401">Missing / invalid Firebase ID token (auth enabled)</status>');
  lines.push('      <status code="403">Signed-in user does not own the device</status>');
  lines.push('      <status code="409">Refused for safety (E-STOP, animals present, stale headcount) or by the device (reason in error)</status>');
  lines.push('      <status code="503">MQTT broker not connected</status>');
  lines.push("    </responses>");
  lines.push("  </http>");

  lines.push("  <mqtt topic-prefix=\"tc\">");
  for (const t of MQTT_TOPICS) {
    lines.push(`    <topic${attrs({ pattern: t.pattern, direction: t.direction, qos: t.qos, retain: t.retain })}>`);
    lines.push(`      <payload>${esc(t.payload)}</payload>${t.note ? `\n      <note>${esc(t.note)}</note>` : ""}`);
    lines.push("    </topic>");
  }
  lines.push(`    <payload-schema name="sensors">\n${schemaXml("sensors", SCHEMAS.sensors, "      ")}\n    </payload-schema>`);
  lines.push("  </mqtt>");

  lines.push("  <yard-events source=\"tc/{id}/event, tc/{id}/alert\">");
  lines.push('    <field name="id" type="string" required="true" pattern="[A-Za-z0-9_.:-]{1,64}"/>');
  lines.push('    <field name="type" type="string" required="true" values="egg_ready|pickup_ready|weed_detected|headcount|alert"/>');
  lines.push('    <field name="status" type="string" values="active|pending_review|approved|rejected|treated|cleared"/>');
  for (const f of ["title", "detail", "station", "label", "itemId"]) lines.push(`    <field name="${f}" type="string"/>`);
  for (const f of ["count", "confidence", "bearingDeg", "distanceFt", "ts"]) lines.push(`    <field name="${f}" type="number"/>`);
  lines.push('    <field name="bedMm" type="object" note="{x (along the bed), y (across)} in mm from the bed origin corner"/>');
  lines.push("  </yard-events>");

  lines.push("  <robots>");
  lines.push(`    <routines values="${esc(KNOWN_ROUTINES.join("|"))}"/>`);
  lines.push('    <arm-platforms values="sim|ur|lerobot" service="firmware/jetson-nano/arm_service.py"/>');
  lines.push('    <weed-robots service="firmware/jetson-nano/weed_patrol_service.py">');
  for (const r of ROBOT_TYPES) {
    lines.push(`      <robot-type${attrs({ id: r.id, motion: r.motion, basis: r.basis })}>`);
    lines.push(`        <laser${attrs({ profile: r.laser.profile, "power-w": r.laser.powerW, "wavelength-nm": r.laser.wavelengthNm, "laser-class": r.laser.laserClass, "exposure-ms": r.laser.exposureMs })}/>`);
    lines.push("      </robot-type>");
  }
  lines.push("    </weed-robots>");
  lines.push("  </robots>");

  lines.push("  <safety>");
  lines.push("    <rule>E-STOP (QoS 2, retained) latches on every subscriber; motion is refused until cleared.</rule>");
  lines.push("    <rule>Arm / clean / routine / policy are refused in animal areas while chickens are detected or the headcount is older than 60 s.</rule>");
  lines.push("    <rule>Weed treatment needs a human approval per weed; the laser fires only with burn enabled, student mode off, enclosure closed and no E-STOP.</rule>");
  lines.push("    <rule>Every hardware action in the UI goes through a confirmation dialog.</rule>");
  lines.push("  </safety>");

  lines.push("  <client-analysis>");
  lines.push('    <watershed module="tendercells-ui/src/components/property/watershed.ts" scenarios="light:0.25in/h*1h|heavy:1in/h*1h|storm:2in/h*2h" fixes="drain|rain-garden|swale|berm|fill">Priority-flood depressions, D8 flow accumulation, puddle fill by catchment volume, erosion = erodibility * sqrt(flow) * slope. Uses a robot-measured elevation grid when present.</watershed>');
  lines.push('    <terrain module="tendercells-ui/src/components/property/terrain.ts" zone-kinds="lawn|pasture|dry|snow|garden-soil|mulch|gravel|sand|paved|woods|wetland"/>');
  lines.push("  </client-analysis>");

  if (opts.routes) {
    const known = new Set(ENDPOINTS.map((e) => `${e.method} ${e.path.replace(/\{(\w+)\}/g, ":$1")}`));
    const missing = opts.routes.filter((r) => !known.has(`${r.method} ${r.path}`));
    if (missing.length) {
      lines.push("  <undocumented>");
      for (const r of missing) lines.push(`    <route${attrs({ method: r.method, path: r.path })}/>`);
      lines.push("  </undocumented>");
    }
  }
  lines.push("</tendercells-backend>");
  return lines.join("\n") + "\n";
}

type Payload = Record<string, unknown>;

/** Live snapshot of devices as XML (values are device-reported data). */
export function buildStateXml(devices: Array<{
  deviceId: string; presence: { online: boolean; lastSeen: number }; telemetry?: Payload; state?: Payload;
  subStates: Record<string, Payload>; events: Payload[];
}>): string {
  const kv = (o: Payload | undefined, indent: string) => Object.entries(o ?? {})
    .filter(([, v]) => v === null || ["string", "number", "boolean"].includes(typeof v))
    .map(([k, v]) => `${indent}<value${attrs({ name: k, v: v === null ? "null" : v })}/>`).join("\n");
  const lines = ['<?xml version="1.0" encoding="UTF-8"?>', `<tendercells-state${attrs({ version: DESCRIBE_VERSION, generated: new Date().toISOString() })}>`];
  for (const d of devices) {
    lines.push(`  <device${attrs({ id: d.deviceId, online: d.presence.online, "last-seen": d.presence.lastSeen ? new Date(d.presence.lastSeen).toISOString() : undefined })}>`);
    if (d.telemetry) lines.push(`    <telemetry>\n${kv(d.telemetry, "      ")}\n    </telemetry>`);
    if (d.state) lines.push(`    <state>\n${kv(d.state, "      ")}\n    </state>`);
    for (const [sub, v] of Object.entries(d.subStates)) lines.push(`    <sub-state name="${esc(sub)}">\n${kv(v, "      ")}\n    </sub-state>`);
    for (const e of d.events) {
      lines.push(`    <event${attrs({ id: e.id, type: e.type, status: e.status, "item-id": e.itemId, count: e.count, confidence: e.confidence, "bearing-deg": e.bearingDeg, "distance-ft": e.distanceFt })}>${esc(e.title ?? "")}${e.detail ? ` - ${esc(e.detail)}` : ""}</event>`);
    }
    lines.push("  </device>");
  }
  lines.push("</tendercells-state>");
  return lines.join("\n") + "\n";
}
