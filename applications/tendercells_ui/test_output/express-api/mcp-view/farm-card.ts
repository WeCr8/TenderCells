// farm-card.ts - the Tender Cells farm card: an MCP Apps view (inline UI) that Claude and
// ChatGPT render for get_farm_overview. Read-only on purpose: it shows readings, animal-
// health flags, open yard flags and alerts, and can refresh itself, but has no hardware
// buttons - actions go through the assistant's confirm-twice flow.
// Bundled into one HTML page by backend/src/mcp/farmCard.ts when first served.
import { App } from "@modelcontextprotocol/ext-apps/app-with-deps";

interface Flag { level: "critical" | "warning"; text: string }
interface Device {
  id: string;
  online: boolean | null;
  state: string | null;
  reading: Record<string, unknown>;
  flags: Flag[];
  openEvents: Array<{ id: string; title: string; detail?: string }>;
  recentAlerts: Array<{ type: string; label?: string; confidence?: number; ts?: number }>;
}
interface Overview { simulated: boolean; generatedAt: string; devices: Device[]; attention: Array<Flag & { deviceId: string }>; hubError?: string }

const root = document.getElementById("root")!;
const esc = (v: unknown) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

const READINGS: Array<[string, string, (v: number) => string]> = [
  ["temp", "Temp", (v) => `${v}°F`],
  ["humidity", "Humidity", (v) => `${v}%`],
  ["ammonia", "Ammonia", (v) => `${v} ppm`],
  ["feedLevel", "Feed", (v) => `${v}%`],
  ["waterLevel", "Water", (v) => `${v}%`],
  ["chickenCount", "Birds", (v) => `${v}`],
  ["battery", "Battery", (v) => `${v}%`],
];

function ago(ts?: number) {
  if (!ts) return "";
  const m = Math.round((Date.now() - ts) / 60_000);
  return m < 1 ? "just now" : m < 60 ? `${m} min ago` : `${Math.round(m / 60)} h ago`;
}

function render(o: Overview | undefined) {
  if (!o) { root.innerHTML = `<p class="muted">Loading the farm…</p>`; return; }
  if (o.hubError) { root.innerHTML = `<p class="flag critical">Hub not reachable. ${esc(o.hubError)}</p>`; return; }
  const attention = o.attention.length
    ? `<ul class="attention">${o.attention.map((a) => `<li class="flag ${a.level}"><b>${a.level === "critical" ? "Critical" : "Check"}</b> ${esc(a.deviceId)}: ${esc(a.text)}</li>`).join("")}</ul>`
    : `<p class="ok">✓ Nothing needs attention right now.</p>`;
  const cards = o.devices.map((d) => {
    const vals = READINGS.filter(([k]) => typeof d.reading[k] === "number")
      .map(([k, label, fmt]) => `<div class="kv"><span>${label}</span><b>${esc(fmt(d.reading[k] as number))}</b></div>`).join("");
    const door = typeof d.reading.doorState === "string" ? `<div class="kv"><span>Door</span><b>${esc(d.reading.doorState)}</b></div>` : "";
    const events = d.openEvents.map((e) => `<li>🏷 ${esc(e.title)}${e.detail ? ` · ${esc(e.detail)}` : ""}</li>`).join("");
    const alerts = d.recentAlerts.map((a) => `<li>⚠ ${esc(a.label ?? a.type)}${a.confidence ? ` ${Math.round(a.confidence * 100)}%` : ""} <span class="muted">${ago(a.ts)}</span></li>`).join("");
    const status = d.online === false ? "offline" : (d.state ?? "unknown");
    return `<section class="card ${d.flags.some((f) => f.level === "critical") ? "crit" : d.flags.length ? "warn" : ""}">
      <header><h3>${esc(d.id)}</h3><span class="pill ${esc(status)}">${esc(status)}</span></header>
      <div class="grid">${vals}${door}</div>
      ${events || alerts ? `<ul class="list">${events}${alerts}</ul>` : ""}
    </section>`;
  }).join("");
  root.innerHTML = `
    <div class="top"><h2>Tender Cells · farm</h2>${o.simulated ? `<span class="pill sim">SIMULATED</span>` : ""}<button id="refresh" type="button">Refresh</button></div>
    ${attention}
    <div class="cards">${cards}</div>
    <p class="muted foot">Updated ${esc(new Date(o.generatedAt).toLocaleTimeString())}. To open a door or feed, ask in the chat - you will confirm before anything moves.</p>`;
  document.getElementById("refresh")?.addEventListener("click", refresh);
}

const app = new App({ name: "tendercells-farm-card", version: "0.2.0" });
async function refresh() {
  const btn = document.getElementById("refresh") as HTMLButtonElement | null;
  if (btn) { btn.disabled = true; btn.textContent = "Refreshing…"; }
  try {
    const r = await app.callServerTool({ name: "get_farm_overview", arguments: {} });
    render(r.structuredContent as unknown as Overview);
  } catch {
    if (btn) { btn.disabled = false; btn.textContent = "Refresh failed - retry"; }
  }
}
const applyTheme = () => { document.documentElement.dataset.theme = app.getHostContext()?.theme === "light" ? "light" : "dark"; };
app.ontoolresult = (p) => render(p.structuredContent as unknown as Overview);
app.onhostcontextchanged = applyTheme;
render(undefined);
void app.connect().then(applyTheme);
