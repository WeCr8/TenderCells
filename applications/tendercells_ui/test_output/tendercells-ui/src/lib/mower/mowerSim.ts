// mowerSim.ts - the demo's robot mowers (no hub). Same interlock as the hub: a mower may not
// start - and a mowing mower is sent home - during E-STOP, quiet hours, or while a guarded
// coop's door is open. The coop door comes from the demo equipment state, so the event
// simulator ("Hens let out while the mower runs") and the Chicken Tender page drive it.
// Everything lives in this browser (localStorage) and is labelled simulated.
import { DEMO_DEVICES, getDemoEquipment, isDemoSeeded } from "../../services/demo/demoEnvironment";
import {
  DEFAULT_QUIET_HOURS, mowingBlockedReason,
  type MowerAction, type MowerLink, type MowerState, type MowerView,
} from "./mower";
import type { NewMower } from "./mowerApi";

export const MOWER_SIM_EVENT = "tendercells-demo-mowers";
const KEY = "tendercells_demo_mowers_v1";
export const DEMO_MOWER_ID = "mw_demo";
/** How long "Returning to dock" shows before the simulated mower is docked. */
const RETURN_MS = 4_000;

interface Store { links: MowerLink[]; states: Record<string, MowerState>; estop: string[] }

function fresh(): Store {
  const now = Date.now();
  if (!isDemoSeeded()) return { links: [], states: {}, estop: [] };
  const link: MowerLink = {
    deviceId: DEMO_MOWER_ID, name: "Demo robot mower", adapter: "home-assistant", entityId: "lawn_mower.demo_yard",
    guardHabitats: [DEMO_DEVICES.chickenTender], noAnimalsConfirmed: false, quietHours: DEFAULT_QUIET_HOURS, createdAt: now, updatedAt: now,
  };
  return { links: [link], states: { [DEMO_MOWER_ID]: { activity: "docked", battery: 86, online: true, source: "simulator", entityId: link.entityId, ts: now } }, estop: [] };
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
  });
}

/**
 * Advance the simulation: finish returns, and send any mowing mower home whose interlock
 * has tripped (the hub's watcher does the same for real mowers).
 */
function step(s: Store, now: number): boolean {
  let changed = false;
  for (const link of s.links) {
    const st = s.states[link.deviceId];
    if (!st) continue;
    if (st.activity === "returning" && now - st.ts >= RETURN_MS) {
      s.states[link.deviceId] = { ...st, activity: "docked", ts: now };
      changed = true;
    } else if (st.activity === "mowing") {
      const reason = blocked(s, link, now);
      if (reason) {
        s.states[link.deviceId] = { ...st, activity: "returning", ts: now, lastInterlock: { reason, at: now, action: "sent-home" } };
        changed = true;
      }
    }
  }
  return changed;
}

/** Every simulated mower, after enforcing the interlock. */
export function simMowers(now: number = Date.now()): MowerView[] {
  const s = load();
  if (step(s, now)) save(s);
  return s.links.map((link) => ({ link, state: s.states[link.deviceId] ?? null, blocked: blocked(s, link, now) }));
}

/**
 * start / pause / dock a simulated mower. start is refused (throws the reason) when the
 * interlock is not clear - exactly like the hub's 409.
 */
export function simCommand(deviceId: string, action: MowerAction, now: number = Date.now()): void {
  const s = load();
  const link = s.links.find((l) => l.deviceId === deviceId);
  const st = s.states[deviceId];
  if (!link || !st) throw new Error("This mower is not linked");
  if (action === "start") {
    const reason = blocked(s, link, now);
    if (reason) {
      s.states[deviceId] = { ...st, lastInterlock: { reason, at: now, action: "refused" } };
      save(s);
      throw new Error(reason);
    }
    s.states[deviceId] = { ...st, activity: "mowing", battery: Math.max(10, (st.battery ?? 90) - 3), ts: now };
  } else if (action === "pause") {
    s.states[deviceId] = { ...st, activity: st.activity === "docked" ? "docked" : "paused", ts: now };
  } else {
    s.states[deviceId] = { ...st, activity: st.activity === "docked" ? "docked" : "returning", ts: now };
  }
  save(s);
}

/** E-STOP: latch, stop and send home. */
export function simEstop(deviceId: string, now: number = Date.now()): void {
  const s = load();
  if (!s.estop.includes(deviceId)) s.estop.push(deviceId);
  const st = s.states[deviceId];
  if (st) s.states[deviceId] = { ...st, activity: st.activity === "docked" ? "docked" : "returning", ts: now, lastInterlock: { reason: "E-STOP pressed", at: now, action: "sent-home" } };
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
  s.states[deviceId] = { activity: "docked", battery: 100, online: true, source: "simulator", entityId: m.entityId, ts: now };
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
  s.states[deviceId] = { ...st, activity: "mowing", ts: now };
  save(s);
}

/** Test helper. */
export function _resetMowerSim(): void {
  try { localStorage.removeItem(KEY); } catch { /* storage unavailable */ }
}
