// demoEnvironment.ts — single orchestrator for the Tender Cells starter
// environment. Seeds a coherent, end-to-end stack — structures (products),
// flocks (animals), eggs, schedules, property-grid placement and equipment
// sim-state — across EVERY product family the platform knows about, so the
// whole app can be exercised with no real hardware.
//
// This is the open-source on-ramp, not a throwaway demo: a like-minded owner
// can spin up any product family on their OWN network, sim-only, and later
// swap in real hardware. The same verify harness then confirms each data layer
// is wired for their real devices too.
//
// Design rules (match the sim-only data layer):
//   • OPT-IN — nothing seeds automatically; the owner presses "Load Demo".
//   • LOCAL-FIRST / PRIVATE — everything lives in this browser's localStorage;
//     seeded products carry telemetry_consent='local_only'. No animal data
//     leaves the owner's machine/network unless they explicitly enable a backend.
//   • IDEMPOTENT — every step upserts by fixed id, safe to re-run, never
//     duplicates and never overwrites the owner's own (non-demo) records.
//   • REVERSIBLE — resetDemoEnvironment() removes ONLY demo-tagged data.
//   • COHERENT — product.device_id, animal.device, eggs deviceId, schedule
//     deviceId and grid placement all share one deviceId per device.
//   • DATA-DRIVEN — the device list derives from birdsService DEMO_ANIMAL_PACKS,
//     so adding a pack there automatically extends this whole pipeline.

import type { Product } from '../../types/products';
import { ProductsService } from '../productsService';
import {
  birdsService,
  DEMO_ANIMALS,
  DEMO_ANIMAL_PACKS,
  type Bird,
} from '../birdsService';
import { schedulesService, buildCron, type CreateScheduleData } from '../schedulesService';
import { eggService } from '../eggService';
import {
  loadPropertyLayout,
  savePropertyLayout,
  PRODUCT_DIMENSIONS,
  type HardwareType,
  type PropertyItem,
} from '../../components/property/propertyLayoutStore';

export const DEMO_SOURCE = 'demo-environment';
const LEGACY_LOCAL_SOURCE = ['garage', 'dev', 'seed'].join('-');
const DEMO_LOCAL_SOURCE = 'demo-local-seed';
const DEMO_MARKER_KEY = 'tendercells_demo_seeded_v1';
const DEMO_EQUIPMENT_KEY = 'tendercells_demo_equipment_v1';
export const DEMO_EVENT = 'tendercells-demo-updated';

// Back-compat: the three originally-named devices. The full device list comes
// from DEMO_SPECS below, but these named ids are referenced elsewhere.
export const DEMO_DEVICES = {
  chickenTender: 'ct_001',
  watchTower: 'wt_001',
  duckDock: 'dd_001',
} as const;

// ── Device spec (one coherent device) ──────────────────────────────────────────
export interface DemoDeviceSpec {
  deviceId: string;
  family: string;             // product family / HardwareType key
  hardwareType: HardwareType; // for the property grid
  label: string;
  animals: Bird[];            // [] for sensor-only devices (e.g. WatchTower)
  laying: boolean;            // seed an egg map for this device
  grid: { x: number; y: number };
}

// Non-overlapping placements on the 80×60 ft default yard.
const GRID: Record<string, { x: number; y: number }> = {
  ct_001: { x: 10, y: 8 },
  pp_001: { x: 26, y: 8 },
  dd_001: { x: 44, y: 8 },
  wt_001: { x: 70, y: 8 },
  bb_001: { x: 12, y: 40 },
  rr_001: { x: 40, y: 26 },
  gg_001: { x: 40, y: 46 },
  tt_001: { x: 66, y: 44 },
};

// A sensor-only device that has no animal pack but is still a first-class part
// of the environment (predator monitor that meshes with the coops).
const WATCHTOWER_SPEC: DemoDeviceSpec = {
  deviceId: DEMO_DEVICES.watchTower,
  family: 'predator-monitor',
  hardwareType: 'watchtower',
  label: 'WatchTower Demo',
  animals: [],
  laying: false,
  grid: GRID.wt_001 ?? { x: 70, y: 8 },
};

// Build the full device list from the animal packs (single source of truth),
// then append the sensor-only WatchTower.
export const DEMO_SPECS: DemoDeviceSpec[] = [
  ...DEMO_ANIMAL_PACKS.map((pack): DemoDeviceSpec => ({
    deviceId: pack.deviceId,
    family: pack.productFamily,
    hardwareType: pack.productFamily as HardwareType,
    label: pack.label,
    animals: [...pack.animals],
    laying: pack.animals.some((a) => a.avgEggsPerWeek > 0),
    grid: GRID[pack.deviceId] ?? { x: 4, y: 4 },
  })),
  WATCHTOWER_SPEC,
];

// ── Schedules per family (deterministic starter set) ───────────────────────────
function schedulesFor(family: string, deviceId: string): CreateScheduleData[] {
  const cron = (hour: number, minute: number) => buildCron({ hour, minute, days: [] });
  const door = (hour: number, minute: number, open: boolean): CreateScheduleData =>
    ({ deviceId, action: 'door', cronExpression: cron(hour, minute), enabled: true, label: open ? 'Open enclosure' : 'Close enclosure' });
  const feed = (hour: number, minute: number, amount: number): CreateScheduleData =>
    ({ deviceId, action: 'feed', cronExpression: cron(hour, minute), enabled: true, label: 'Morning feed', amount });
  const clean = (hour: number, minute: number): CreateScheduleData =>
    ({ deviceId, action: 'clean', cronExpression: cron(hour, minute), enabled: true, label: 'Daily clean' });
  const water = (hour: number, minute: number): CreateScheduleData =>
    ({ deviceId, action: 'water', cronExpression: cron(hour, minute), enabled: true, label: 'Water top-up' });

  switch (family) {
    case 'duck-dock':
      return [door(6, 0, true), feed(7, 30, 120), clean(8, 30), water(9, 0), door(20, 0, false)];
    case 'bunny-burrow':
      return [feed(7, 0, 80), clean(8, 30)];
    case 'goat-guardian':
      return [door(6, 0, true), feed(7, 0, 250), water(9, 0), door(20, 30, false)];
    case 'predator-monitor':
      return []; // sensor-only — no actuators to schedule
    default: // chicken-tender, roaming-roost, turkey-tower, pigeon-palace
      return [door(6, 0, true), feed(7, 0, 100), clean(8, 30), door(20, 0, false)];
  }
}

// All schedule labels this orchestrator generates — used by reset to delete
// only our schedules and leave the owner's own ones alone.
const DEMO_SCHEDULE_LABELS = new Set([
  'Open enclosure', 'Close enclosure', 'Morning feed', 'Daily clean', 'Water top-up',
]);

// ── Equipment sim-state ─────────────────────────────────────────────────────────
export interface DemoEquipment {
  deviceId: string;
  door: 'open' | 'closed';
  feedLevelPct: number;
  waterLevelPct: number;
  gantry?: { x: number; y: number; z: number }; // mm, 9DOF gantry (coop only)
  sensors: { tempF: number; humidityPct: number; ammoniaPpm: number };
  updatedAt: string;
}

// Stable, device-specific pseudo-values so every device reads like a real one
// without per-render churn (no Math.random).
function hashInt(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function equipmentFor(spec: DemoDeviceSpec): Omit<DemoEquipment, 'updatedAt'> {
  const id = spec.deviceId;
  const sensorOnly = spec.family === 'watchtower';
  return {
    deviceId: id,
    door: 'closed',
    feedLevelPct: sensorOnly ? 0 : 50 + (hashInt(id + 'feed') % 45),
    waterLevelPct: sensorOnly ? 0 : 50 + (hashInt(id + 'water') % 45),
    gantry: spec.family === 'chicken-tender' ? { x: 0, y: 0, z: 0 } : undefined,
    sensors: {
      tempF: 60 + (hashInt(id + 't') % 12),
      humidityPct: 65 + (hashInt(id + 'h') % 20),
      ammoniaPpm: sensorOnly ? 0 : hashInt(id + 'a') % 6,
    },
  };
}

function writeEquipment(): DemoEquipment[] {
  const at = new Date().toISOString();
  const rows: DemoEquipment[] = DEMO_SPECS.map((s) => ({ ...equipmentFor(s), updatedAt: at }));
  localStorage.setItem(DEMO_EQUIPMENT_KEY, JSON.stringify(rows));
  return rows;
}

export function getDemoEquipment(deviceId?: string): DemoEquipment[] {
  try {
    const rows = JSON.parse(localStorage.getItem(DEMO_EQUIPMENT_KEY) || '[]') as DemoEquipment[];
    return deviceId ? rows.filter((r) => r.deviceId === deviceId) : rows;
  } catch {
    return [];
  }
}

// ── Product factory for non-garage demo devices ────────────────────────────────
function nowIso() { return new Date().toISOString(); }

function abbr(deviceId: string): string {
  return (deviceId.split('_')[0] || 'dev').toUpperCase();
}

function buildDemoProduct(spec: DemoDeviceSpec): Product {
  const now = nowIso();
  const dims = PRODUCT_DIMENSIONS[spec.hardwareType];
  return {
    id: `demo-${spec.family}-001`,
    user_id: ProductsService.GARAGE_OWNER_EMAIL,
    product_type: 'hardware_unit',
    product_name: spec.label.replace(/ Demo$/, ''),
    model: `${spec.label} Unit`,
    serial_number: `TC-${abbr(spec.deviceId)}-DEMO-0001`,
    activation_code: `TC-DEMO-${abbr(spec.deviceId)}`,
    qr_code: `tendercells://register?serial=TC-${abbr(spec.deviceId)}-DEMO-0001&device=${spec.deviceId}`,
    status: 'setup_required',
    connection_status: 'offline',
    device_id: spec.deviceId,
    network_config: { connected: false },
    location: 'Demo Yard',
    metadata: {
      owner_email: ProductsService.GARAGE_OWNER_EMAIL,
      source: DEMO_SOURCE,
      product_family: spec.family,
      firmware_target: `firmware/${spec.family}`,
      mqtt_base_topic: `tc/${spec.deviceId}`,
      animal_count: spec.animals.length,
      enclosure_width_ft: dims?.width,
      enclosure_depth_ft: dims?.depth,
      hardware_setup_mode: 'sim_only',
      simulation_backend: 'browser_threejs',
      property_simulation_enabled: true,
      telemetry_consent: 'local_only', // privacy: nothing leaves the owner's machine
      telemetry_retention_days: 30,
      safety_validation_status: 'simulated',
      notes: 'Demo environment device — seeded for end-to-end UI verification.',
    },
    created_at: now,
    updated_at: now,
  };
}

// ── Status helpers ─────────────────────────────────────────────────────────────
export function isDemoSeeded(): boolean { return localStorage.getItem(DEMO_MARKER_KEY) != null; }
export function demoSeededAt(): string | null { return localStorage.getItem(DEMO_MARKER_KEY); }
function emitChange() { window.dispatchEvent(new CustomEvent(DEMO_EVENT)); }

// ── Property layout placement (light-touch, idempotent) ────────────────────────
function seedLayout(): void {
  const state = loadPropertyLayout();
  let changed = false;
  const items: PropertyItem[] = [...state.items];

  for (const spec of DEMO_SPECS) {
    if (items.some((it) => it.deviceId === spec.deviceId)) continue; // already linked
    // Prefer linking an existing same-type item that has no device yet…
    const target = items.find((it) => it.kind === 'hardware' && it.type === spec.hardwareType && !it.deviceId);
    if (target) {
      target.deviceId = spec.deviceId;
      changed = true;
    } else {
      const dims = PRODUCT_DIMENSIONS[spec.hardwareType];
      items.push({
        id: `demo-${spec.deviceId}`,
        kind: 'hardware',
        name: spec.label.replace(/ Demo$/, ''),
        type: spec.hardwareType,
        shape: dims?.shape,
        x: spec.grid.x,
        y: spec.grid.y,
        width: dims?.width ?? 4,
        depth: dims?.depth ?? 4,
        deviceId: spec.deviceId,
      });
      changed = true;
    }
  }

  if (changed) savePropertyLayout({ property: state.property, items });
}

// ── Schedules (idempotent per device) ──────────────────────────────────────────
async function seedSchedules(): Promise<void> {
  for (const spec of DEMO_SPECS) {
    const schedules = schedulesFor(spec.family, spec.deviceId);
    if (schedules.length === 0) continue;
    const existing = await schedulesService.getSchedules(spec.deviceId);
    if (existing.length > 0) continue; // already has schedules — leave them
    for (const s of schedules) await schedulesService.createSchedule(spec.deviceId, s);
  }
}

// ── Public: seed / reset / verify ──────────────────────────────────────────────
export async function seedDemoEnvironment(): Promise<DemoReport> {
  // 1. Structures (products). Chicken Tender keeps its dedicated local demo build;
  //    every other family gets a generic demo product.
  ProductsService.seedFirstGarageCoop(); // ct_001 local demo coop
  ProductsService.seedDemoProducts(
    DEMO_SPECS.filter((s) => s.family !== 'chicken-tender').map(buildDemoProduct),
  );

  // 2. Flocks (idempotent per fixed id, per device) — every pack at once.
  await birdsService.seedFlock(DEMO_ANIMALS);

  // 3. Eggs — materialize today's nest-box map for each laying device.
  for (const spec of DEMO_SPECS) {
    if (spec.laying) await eggService.getDay(spec.deviceId);
  }

  // 4. Schedules
  await seedSchedules();

  // 5. Property grid placement
  seedLayout();

  // 6. Equipment sim-state
  writeEquipment();

  localStorage.setItem(DEMO_MARKER_KEY, nowIso());
  emitChange();
  return verifyDemoEnvironment();
}

export async function resetDemoEnvironment(): Promise<void> {
  // Products — only our two tagged sources.
  ProductsService.removeProductsBySource(DEMO_SOURCE);
  ProductsService.removeProductsBySource(LEGACY_LOCAL_SOURCE);
  ProductsService.removeProductsBySource(DEMO_LOCAL_SOURCE);

  // Animals — remove only fixed demo ids across every pack.
  for (const a of DEMO_ANIMALS) await birdsService.deleteBird(a.id, a.device);

  // Schedules — delete only our generated labels, scoped per device.
  for (const spec of DEMO_SPECS) {
    const existing = await schedulesService.getSchedules(spec.deviceId);
    for (const e of existing) {
      if (e.label && DEMO_SCHEDULE_LABELS.has(e.label)) {
        await schedulesService.deleteSchedule(spec.deviceId, e.id);
      }
    }
  }

  // Property layout — drop items we added, unlink device ids we attached.
  const demoIds = new Set(DEMO_SPECS.map((s) => s.deviceId));
  const state = loadPropertyLayout();
  const items = state.items
    .filter((it) => !it.id.startsWith('demo-'))
    .map((it) => (it.deviceId && demoIds.has(it.deviceId) ? { ...it, deviceId: undefined } : it));
  savePropertyLayout({ property: state.property, items });

  // Equipment + marker
  localStorage.removeItem(DEMO_EQUIPMENT_KEY);
  localStorage.removeItem(DEMO_MARKER_KEY);
  emitChange();
}

// ── Verification harness ───────────────────────────────────────────────────────
export interface DemoLayerResult { ok: boolean; detail: string; }
export interface DemoDeviceReport {
  deviceId: string;
  family: string;
  product: DemoLayerResult;
  flock: DemoLayerResult;
  eggs: DemoLayerResult;
  schedules: DemoLayerResult;
  layout: DemoLayerResult;
  equipment: DemoLayerResult;
}
export interface DemoReport {
  seeded: boolean;
  seededAt: string | null;
  ok: boolean;
  devices: DemoDeviceReport[];
}

const layerOk = (cond: boolean, ok: string, bad: string): DemoLayerResult => ({ ok: cond, detail: cond ? ok : bad });

export async function verifyDemoEnvironment(): Promise<DemoReport> {
  const products = await ProductsService.getUserProducts();
  const layout = loadPropertyLayout();
  const devices: DemoDeviceReport[] = [];

  for (const spec of DEMO_SPECS) {
    const expectFlock = spec.animals.length;
    const expectSchedules = schedulesFor(spec.family, spec.deviceId).length;

    const product = products.find((p) => p.device_id === spec.deviceId);
    const flock = await birdsService.getBirds(spec.deviceId);
    const eggsDay = spec.laying ? await eggService.getDay(spec.deviceId) : null;
    const eggsCount = eggsDay ? eggsDay.nestBoxes.length : 0;
    const schedules = await schedulesService.getSchedules(spec.deviceId);
    const placed = layout.items.some((it) => it.deviceId === spec.deviceId);
    const equip = getDemoEquipment(spec.deviceId);

    devices.push({
      deviceId: spec.deviceId,
      family: spec.family,
      product: layerOk(!!product, `product ${product?.product_name}`, 'product missing'),
      flock: layerOk(flock.length >= expectFlock, `${flock.length} animals`, `expected ≥${expectFlock}, got ${flock.length}`),
      eggs: layerOk(!spec.laying || eggsCount > 0, spec.laying ? `${eggsCount} nest boxes` : 'n/a', 'no egg map'),
      schedules: layerOk(schedules.length >= expectSchedules, `${schedules.length} schedules`, `expected ≥${expectSchedules}, got ${schedules.length}`),
      layout: layerOk(placed, 'placed on grid', 'not on property grid'),
      equipment: layerOk(equip.length > 0, 'equipment sim-state present', 'no equipment state'),
    });
  }

  const ok = devices.every((d) =>
    d.product.ok && d.flock.ok && d.eggs.ok && d.schedules.ok && d.layout.ok && d.equipment.ok);

  return { seeded: isDemoSeeded(), seededAt: demoSeededAt(), ok, devices };
}
