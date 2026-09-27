// useYardEvents.ts - station flags for every item on the property map.
//
// Live (VITE_MQTT_API_BASE_URL set): polls express-api GET /devices/:id/events,
// which devices feed over MQTT tc/{id}/event (eggs ready, weeds detected, roost
// headcount ...).
// Demo: derives the same flags in the browser - eggs from the egg map, roost
// headcount from the flock roster, weeds from the simulated weed patrol robot.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { PropertyItem } from '../components/property/propertyLayoutStore';
import { eggService, EGGS_UPDATED_EVENT, todayKey } from '../services/eggService';
import { birdsService, BIRDS_UPDATED_EVENT } from '../services/birdsService';
import { ackYardEvent, approveWeed, fetchYardEvents, rejectWeed, type Presence } from '../lib/yard/yardApi';
import { decideSimWeed, simBed, simWeeds, WEED_SIM_EVENT } from '../lib/yard/weedSim';
import {
  DEFAULT_DEVICE_BY_TYPE, WEED_BED_TYPES, YARD_LIVE, weedDeviceFor,
  type YardFlag,
} from '../lib/yard/yardTypes';

const POLL_MS = 5000;
const EGG_TYPES = new Set(['chicken-tender', 'duck-dock', 'turkey-tower', 'pigeon-palace']);
const DEMO_ROOST_FLOCK = 6;
const PREDATOR_SLOT_MS = 150_000; // demo: at most one detection per 2.5 min per tower
const PREDATORS = ['Fox', 'Raccoon', 'Coyote', 'Hawk', 'Opossum'];
const ACKED_KEY = 'tendercells_predator_acked_v1';

function readAcked(): Set<string> {
  try { return new Set(JSON.parse(localStorage.getItem(ACKED_KEY) || '[]') as string[]); } catch { return new Set(); }
}
function writeAcked(ids: Set<string>): void {
  try { localStorage.setItem(ACKED_KEY, JSON.stringify([...ids].slice(-200))); } catch { /* private mode */ }
}

/** Deterministic 0..1 values from a string (stable across refreshes). */
function rand(seed: string): () => number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  return () => { h = Math.imul(h ^ (h >>> 15), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909); return ((h ^= h >>> 16) >>> 0) / 4294967296; };
}

/**
 * Demo WatchTower detections for the last ~10 minutes, located by bearing/distance
 * from the tower (the same fields a real tower's alert carries).
 */
function demoPredators(deviceId: string, itemId: string, now: number): YardFlag[] {
  const acked = readAcked();
  const out: YardFlag[] = [];
  const slot = Math.floor(now / PREDATOR_SLOT_MS);
  for (let s = slot - 3; s <= slot; s++) {
    const r = rand(`${deviceId}:${s}`);
    if (r() > 0.55) continue;
    const ts = s * PREDATOR_SLOT_MS + Math.floor(r() * PREDATOR_SLOT_MS * 0.5);
    if (ts > now) continue;
    const id = `predator-${ts}`;
    const label = PREDATORS[Math.floor(r() * PREDATORS.length)];
    const camera = Math.floor(r() * 3);
    const distanceFt = Math.round(8 + r() * 30); // inside the default 40 ft camera range
    out.push({
      id, deviceId, itemId, source: 'demo', type: 'alert', status: acked.has(`${deviceId}:${id}`) ? 'cleared' : 'active',
      title: `${label} detected`, label, confidence: Math.round((0.76 + r() * 0.22) * 100) / 100,
      bearingDeg: Math.round((camera * 120 + (r() - 0.5) * 120 + 360) % 360), distanceFt,
      detail: `camera ${camera + 1} · ~${distanceFt} ft away`, station: 'WatchTower', ts, updatedAt: ts,
    });
  }
  return out;
}

export type YardAction = 'ack' | 'aim' | 'burn' | 'reject';

/** Device id for a layout item (explicit deviceId, else the demo default for its type). */
export function deviceForItem(item: PropertyItem): string | undefined {
  if (WEED_BED_TYPES.has(item.type)) return weedDeviceFor(item);
  return item.deviceId || DEFAULT_DEVICE_BY_TYPE[item.type];
}

async function demoFlags(items: PropertyItem[]): Promise<YardFlag[]> {
  const flags: YardFlag[] = [];
  const now = Date.now();
  for (const item of items) {
    if (item.kind !== 'hardware') continue;
    const deviceId = deviceForItem(item);
    if (!deviceId) continue;
    if (EGG_TYPES.has(item.type)) {
      const day = await eggService.getDay(deviceId, todayKey());
      const waiting = day.nestBoxes.filter((b) => b.hasEgg && b.collectedAt == null);
      if (!waiting.length) continue;
      const duck = item.type === 'duck-dock';
      flags.push({
        id: 'eggs-today', deviceId, itemId: item.id, source: 'demo', type: 'egg_ready', status: 'active',
        title: duck ? 'Duck eggs ready' : 'Eggs ready', count: waiting.length,
        station: waiting.map((b) => b.label.replace('Nest Box ', '')).join(', '),
        detail: `${waiting.length} waiting in ${duck ? 'the nesting shelf' : 'nest boxes'} ${waiting.map((b) => b.label.replace('Nest Box ', '')).join(', ')}`,
        ts: Math.min(...waiting.map((b) => b.laidAt ?? now)), updatedAt: now,
      });
    } else if (item.type === 'roaming-roost') {
      const birds = await birdsService.getBirds(deviceId);
      const total = birds.length || DEMO_ROOST_FLOCK;
      // Birds drift in and out over a ~4 minute cycle so the map shows movement.
      const phase = (Math.sin(now / 38_000) + 1) / 2;
      const roaming = Math.min(total, Math.round(total * phase * 0.8));
      flags.push({
        id: 'headcount', deviceId, itemId: item.id, source: 'demo', type: 'headcount', status: 'active',
        title: `${total - roaming} of ${total} in roost`, count: total - roaming,
        detail: roaming ? `${roaming} roaming outside` : 'All birds inside', ts: now, updatedAt: now,
      });
    } else if (item.type === 'watchtower') {
      flags.push(...demoPredators(deviceId, item.id, now));
    } else if (WEED_BED_TYPES.has(item.type)) {
      simBed(item, deviceId);
      simWeeds(item.id).forEach((w) => flags.push({ ...w, itemId: item.id, source: 'demo' }));
    }
  }
  return flags;
}

/**
 * Station flags for the given layout items, refreshed live or from the demo sims.
 *
 * @param items - Property layout items (hardware items get flags)
 * @returns flags, presence per device, and `act` to acknowledge / review a flag
 */
export function useYardEvents(items: PropertyItem[]) {
  const [flags, setFlags] = useState<YardFlag[]>([]);
  const [presence, setPresence] = useState<Record<string, Presence>>({});
  const [error, setError] = useState<string | null>(null);
  const itemsKey = useMemo(() => JSON.stringify(items.map((i) => [i.id, i.type, i.kind, i.deviceId, i.width, i.depth])), [items]);
  const itemsRef = useRef(items);
  itemsRef.current = items;

  const refresh = useCallback(async () => {
    const list = itemsRef.current;
    if (!YARD_LIVE) {
      setFlags(await demoFlags(list));
      return;
    }
    const byDevice = new Map<string, PropertyItem>();
    list.forEach((i) => { const d = i.kind === 'hardware' ? deviceForItem(i) : undefined; if (d && !byDevice.has(d)) byDevice.set(d, i); });
    const next: YardFlag[] = [];
    const pres: Record<string, Presence> = {};
    let firstError: string | null = null;
    await Promise.all([...byDevice].map(async ([deviceId, owner]) => {
      try {
        const { events, presence: p } = await fetchYardEvents(deviceId);
        pres[deviceId] = p;
        events.forEach((e) => {
          const itemId = e.itemId && list.some((i) => i.id === e.itemId) ? e.itemId : owner.id;
          next.push({ ...e, itemId, source: 'live' });
        });
      } catch (err) {
        firstError ??= err instanceof Error ? err.message : String(err);
      }
    }));
    setFlags(next);
    setPresence(pres);
    setError(firstError);
  }, []);

  useEffect(() => {
    void refresh();
    const timer = setInterval(() => void refresh(), POLL_MS);
    const onLocal = () => void refresh();
    if (!YARD_LIVE) {
      [EGGS_UPDATED_EVENT, BIRDS_UPDATED_EVENT, WEED_SIM_EVENT].forEach((e) => window.addEventListener(e, onLocal));
    }
    return () => {
      clearInterval(timer);
      [EGGS_UPDATED_EVENT, BIRDS_UPDATED_EVENT, WEED_SIM_EVENT].forEach((e) => window.removeEventListener(e, onLocal));
    };
  }, [refresh, itemsKey]);

  /**
   * Act on a flag. Callers must confirm with the user first (hardware action).
   *
   * @returns A short result message for a snackbar
   */
  const act = useCallback(async (flag: YardFlag, action: YardAction): Promise<string> => {
    let message: string;
    if (flag.source === 'demo') {
      if (action === 'ack' && flag.type === 'alert') {
        const acked = readAcked();
        acked.add(`${flag.deviceId}:${flag.id}`);
        writeAcked(acked);
        message = 'Marked as seen';
      } else if (action === 'ack') {
        const day = await eggService.getDay(flag.deviceId, todayKey());
        await Promise.all(day.nestBoxes.filter((b) => b.hasEgg && b.collectedAt == null).map((b) => eggService.collectEgg(flag.deviceId, b.id)));
        message = 'Marked as picked up';
      } else {
        message = decideSimWeed(flag.itemId, flag.id, action);
      }
    } else {
      const res = action === 'ack' ? await ackYardEvent(flag.deviceId, flag.id)
        : action === 'reject' ? await rejectWeed(flag.deviceId, flag.id)
          : await approveWeed(flag.deviceId, flag.id, action);
      message = res.acked ? 'Robot confirmed' : (res.message ?? 'Sent');
    }
    await refresh();
    return message;
  }, [refresh]);

  return { flags, presence, error, live: YARD_LIVE, refresh, act };
}
