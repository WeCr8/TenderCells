// mowerSim.ts - the demo's robot mowers (no hub). Same interlock as the hub: a mower may not
// start - and a mowing mower is sent home and held - during E-STOP, quiet hours, or while a
// guarded coop's door is open. The coop door comes from the demo equipment state, so the event
// simulator ("Hens let out while the mower runs") and the Chicken Tender page drive it.
//
// Two demo mowers show every control:
//   mw_demo   a native (Tender Cells MQTT) mower - custom patterns, angle, edges, overlap, area
//   mw_demo2  a simulated vendor-style connection - work areas (pattern set in the vendor app),
//             cutting height, headlight, weekly schedule, stay-out zones, park modes, errors
// Everything lives in this browser (localStorage) and is labelled simulated.
import { DEMO_DEVICES, getDemoEquipment, isDemoSeeded } from "../../services/demo/demoEnvironment";
import { loadPropertyLayout } from "../../components/property/propertyLayoutStore";
import {
  ADAPTER_CAPABILITIES, DEFAULT_QUIET_HOURS, GO_ACTIONS, mowingBlockedReason, workAreaOccupants,
  type MowerAction, type MowerLink, type MowerSettingsPatch, type MowerState, type MowerView, type ScheduleTask, type StartOptions,
} from "./mower";
import type { NewMower } from "./mowerApi";

export const MOWER_SIM_EVENT = "tendercells-demo-mowers";
const KEY = "tendercells_demo_mowers_v2";
export const DEMO_MOWER_ID = "mw_demo";
export const DEMO_VENDOR_MOWER_ID = "mw_demo2";
/** How long "Returning to dock" shows before the simulated mower is docked. */
const RETURN_MS = 4_000;

interface Store { links: MowerLink[]; states: Record<string, MowerState>; estop: string[] }

const weekdays = (start: number, duration: number): ScheduleTask =>
  ({ start, duration, monday: true, tuesday: false, wednesday: true, thursday: false, friday: true, saturday: false, sunday: false });

function fresh(): Store {
  const now = Date.now();
  if (!isDemoSeeded()) return { links: [], states: {}, estop: [] };
  const native: MowerLink = {
    deviceId: DEMO_MOWER_ID, name: "Demo robot mower", adapter: "mqtt",
    guardHabitats: [DEMO_DEVICES.chickenTender], noAnimalsConfirmed: false, quietHours: DEFAULT_QUIET_HOURS, createdAt: now, updatedAt: now,
  };
  const vendor: MowerLink = {
    deviceId: DEMO_VENDOR_MOWER_ID, name: "Front lawn mower (vendor app style)", adapter: "husqvarna", vendorId: "demo-vendor-1",
    guardHabitats: [], noAnimalsConfirmed: true, quietHours: DEFAULT_QUIET_HOURS, autoResume: false, createdAt: now, updatedAt: now,
  };
  return {
    links: [native, vendor],
    states: {
      [DEMO_MOWER_ID]: { activity: "docked", battery: 86, online: true, source: "simulator", capabilities: ADAPTER_CAPABILITIES.mqtt, ts: now },
      [DEMO_VENDOR_MOWER_ID]: {
        activity: "docked", battery: 72, online: true, source: "simulator", capabilities: ADAPTER_CAPABILITIES.husqvarna, ts: now,
        details: {
          model: "Simulated", mode: "MAIN_AREA", cuttingHeight: 5, headlight: "EVENING_ONLY",
          schedule: [weekdays(9 * 60, 180), { ...weekdays(14 * 60, 120), monday: false, wednesday: false, friday: false, saturday: true }],
          stayOutZones: [{ id: "z-coop", name: "Coop run", enabled: true }, { id: "z-beds", name: "Vegetable beds", enabled: true }],
          workAreas: [{ id: 1, name: "Front lawn (stripes)", cuttingHeight: 50 }, { id: 2, name: "Orchard (checkerboard)", cuttingHeight: 60 }],
        },
      },
    },
    estop: [],
  };
}

function load(): Store {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as Store;
  } catch { /* storage unavailable */ }
  return fresh();
}

function save(s: Store): void {
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* storage unavailable */ }
  window.dispatchEvent(new CustomEvent(MOWER_SIM_EVENT));
}

function blocked(s: Store, link: MowerLink, now: number): string | null {
  return mowingBlockedReason(link, {
    now: new Date(now),
    estop: s.estop.includes(link.deviceId),
    habitat: (id) => {
      const eq = getDemoEquipment(id)[0];
      return eq ? { doorState: eq.door, ageMs: 0 } : undefined;
    },
    animalsSeen: [],
    occupiedBy: workAreaOccupants(loadPropertyLayout(), link.deviceId),
  });
}

/**
 * Advance the simulation like the hub's safety loop: finish returns, send a mowing mower home
 * when its interlock trips, release the hold when it clears (and resume if opted in).
 */
function step(s: Store, now: number): boolean {
  let changed = false;
  for (const link of s.links) {
    const st = s.states[link.deviceId];
    if (!st) continue;
    const reason = blocked(s, link, now);
    if (st.activity === "returning" && now - st.ts >= RETURN_MS) {
      s.states[link.deviceId] = { ...st, activity: "docked", ts: now };
      changed = true;
    } else if (reason && (st.activity === "mowing" || st.activity === "leaving")) {
      s.states[link.deviceId] = { ...st, activity: "returning", held: true, ts: now, lastInterlock: { reason, at: now, action: "sent-home" } };
      changed = true;
    } else if (!reason && st.held) {
      s.states[link.deviceId] = { ...st, held: false,
        ...(link.autoResume ? { lastInterlock: { reason: "Animals in and lawn clear - back on its own schedule (auto-resume)", at: now, action: "resumed" as const } } : {}) };
      changed = true;
    } else if (reason && !st.held) {
      s.states[link.deviceId] = { ...st, held: true };
      changed = true;
    }
  }
  return changed;
}

/** Every simulated mower, after enforcing the interlock. */
export function simMowers(now: number = Date.now()): MowerView[] {
  const s = load();
  if (step(s, now)) save(s);
  return s.links.map((link) => ({
    link, state: s.states[link.deviceId] ?? null, blocked: blocked(s, link, now),
    capabilities: s.states[link.deviceId]?.capabilities ?? ADAPTER_CAPABILITIES[link.adapter],
  }));
}

/**
 * Run an action on a simulated mower. start / resume_schedule are refused (throws the reason)
 * while the interlock is not clear - exactly like the hub's 409.
 */
export function simCommand(deviceId: string, action: MowerAction, opts: StartOptions = {}, now: number = Date.now()): void {
  const s = load();
  const link = s.links.find((l) => l.deviceId === deviceId);
  const st = s.states[deviceId];
  if (!link || !st) throw new Error("This mower is not linked");
  const caps = st.capabilities ?? ADAPTER_CAPABILITIES[link.adapter];
  if (!caps.actions.includes(action)) throw new Error(`This mower cannot ${action.replace(/_/g, " ")} through its connection`);
  if (GO_ACTIONS.has(action)) {
    const reason = blocked(s, link, now);
    if (reason) {
      s.states[deviceId] = { ...st, lastInterlock: { reason, at: now, action: "refused" } };
      save(s);
      throw new Error(reason);
    }
  }
  const out = st.activity === "docked" ? "docked" : "returning";
  switch (action) {
    case "start":
      s.states[deviceId] = { ...st, activity: "mowing", held: false, plan: opts, battery: Math.max(10, (st.battery ?? 90) - 3), ts: now };
      break;
    case "resume_schedule":
      s.states[deviceId] = { ...st, held: false, details: { ...st.details, mode: "MAIN_AREA" }, ts: now };
      break;
    case "pause":
      s.states[deviceId] = { ...st, activity: st.activity === "docked" ? "docked" : "paused", ts: now };
      break;
    case "park_until_next_schedule":
    case "dock":
      s.states[deviceId] = { ...st, activity: out, details: st.details ? { ...st.details, mode: action === "dock" ? "HOME" : "MAIN_AREA" } : st.details, ts: now };
      break;
  }
  save(s);
}

/** Cutting height, headlight, schedule, stay-out zone, confirm error (vendor-style demo mower). */
export function simSettings(deviceId: string, patch: MowerSettingsPatch): void {
  const s = load();
  const st = s.states[deviceId];
  if (!st?.details) throw new Error("Settings cannot be changed through this mower's connection");
  const d = { ...st.details };
  if (patch.cuttingHeight !== undefined) d.cuttingHeight = patch.cuttingHeight;
  if (patch.headlight !== undefined) d.headlight = patch.headlight;
  if (patch.schedule !== undefined) d.schedule = patch.schedule;
  if (patch.stayOutZone) d.stayOutZones = d.stayOutZones?.map((z) => (z.id === patch.stayOutZone!.id ? { ...z, enabled: patch.stayOutZone!.enabled } : z));
  if (patch.confirmError) { d.errorCode = undefined; d.errorConfirmable = false; }
  s.states[deviceId] = { ...st, details: d };
  save(s);
}

/** E-STOP: latch, stop and send home. */
export function simEstop(deviceId: string, now: number = Date.now()): void {
  const s = load();
  if (!s.estop.includes(deviceId)) s.estop.push(deviceId);
  const st = s.states[deviceId];
  if (st) s.states[deviceId] = { ...st, activity: st.activity === "docked" ? "docked" : "returning", held: true, ts: now, lastInterlock: { reason: "E-STOP pressed", at: now, action: "sent-home" } };
  save(s);
}

export function simClearEstop(deviceId: string): void {
  const s = load();
  s.estop = s.estop.filter((d) => d !== deviceId);
  save(s);
}

export const simEstopActive = (deviceId: string): boolean => load().estop.includes(deviceId);

/** Link a simulated mower (the demo's version of POST /mowers). */
export function simLink(m: NewMower, now: number = Date.now()): MowerLink {
  const s = load();
  const deviceId = m.deviceId ?? `mw_${Math.random().toString(16).slice(2, 8)}`;
  const link: MowerLink = { ...m, deviceId, createdAt: now, updatedAt: now };
  s.links.push(link);
  s.states[deviceId] = { activity: "docked", battery: 100, online: true, source: "simulator", entityId: m.entityId,
    capabilities: ADAPTER_CAPABILITIES[m.adapter], ts: now };
  save(s);
  return link;
}

export function simUpdate(deviceId: string, patch: Partial<NewMower>): void {
  const s = load();
  s.links = s.links.map((l) => (l.deviceId === deviceId ? { ...l, ...patch, updatedAt: Date.now() } : l));
  save(s);
}

export function simUnlink(deviceId: string): void {
  const s = load();
  s.links = s.links.filter((l) => l.deviceId !== deviceId);
  delete s.states[deviceId];
  s.estop = s.estop.filter((d) => d !== deviceId);
  save(s);
}

/**
 * Event simulator: put the demo mower out mowing regardless of the interlock (its own
 * schedule started it), so the next door change shows Tender Cells sending it home.
 */
export function simForceMowing(deviceId: string = DEMO_MOWER_ID, now: number = Date.now()): void {
  const s = load();
  const st = s.states[deviceId];
  if (!st) return;
  s.states[deviceId] = { ...st, activity: "mowing", held: false, ts: now };
  save(s);
}

/** Test helper. */
export function _resetMowerSim(): void {
  try { localStorage.removeItem(KEY); } catch { /* storage unavailable */ }
}
