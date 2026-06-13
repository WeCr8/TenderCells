// demoEnvironment.ts — single orchestrator for the Tender Cells demo/test
// environment. Seeds structures (products), flocks (birds), eggs, schedules,
// property-grid placement and equipment sim-state across THREE coherent demo
// devices so the whole app can be exercised end-to-end without real hardware.
//
// Design rules (match the sim-only data layer):
//   • OPT-IN — nothing seeds automatically; the user/test presses "Load Demo".
//   • IDEMPOTENT — every step upserts by fixed id, safe to re-run, never
//     duplicates and never overwrites the user's own (non-demo) records.
//   • REVERSIBLE — resetDemoEnvironment() removes ONLY demo-tagged data.
//   • COHERENT — product.device_id, bird.device, eggs deviceId, schedule
//     deviceId and grid placement all share the DEMO_DEVICES ids below.
//
// Live-use swap point: when real devices register, the same verify harness
// (verifyDemoEnvironment) confirms each data layer wired through for them too.

import type { Product } from '../../types/products';
import { ProductsService } from '../productsService';
import { birdsService, DEMO_ANIMALS, DEMO_BIRDS, DEMO_DUCKS } from '../birdsService';
import { schedulesService, buildCron, type CreateScheduleData } from '../schedulesService';
import { eggService } from '../eggService';
import {
  loadPropertyLayout,
  savePropertyLayout,
  PROPERTY_LAYOUT_STORAGE_KEY,
  type HardwareType,
  type PropertyItem,
} from '../../components/property/propertyLayoutStore';

// ── Canonical demo device ids (single source of truth) ─────────────────────────
export const DEMO_DEVICES = {
  chickenTender: 'ct_001',
  watchTower: 'wt_001',
  duckDock: 'dd_001',
} as const;
export type DemoDeviceId = (typeof DEMO_DEVICES)[keyof typeof DEMO_DEVICES];

export const DEMO_SOURCE = 'demo-environment';
const DEMO_MARKER_KEY = 'tendercells_demo_seeded_v1';
const DEMO_EQUIPMENT_KEY = 'tendercells_demo_equipment_v1';
export const DEMO_EVENT = 'tendercells-demo-updated';

// ── Equipment sim state ────────────────────────────────────────────────────────
export interface DemoEquipment {
  deviceId: string;
  door: 'open' | 'closed';
  feedLevelPct: number;
  waterLevelPct: number;
  gantry?: { x: number; y: number; z: number }; // mm, 9DOF gantry (coop only)
  sensors: { tempF: number; humidityPct: number; ammoniaPpm: number };
  updatedAt: string;
}

const DEMO_EQUIPMENT: Record<DemoDeviceId, Omit<DemoEquipment, 'updatedAt'>> = {
  ct_001: {
    deviceId: 'ct_001',
    door: 'closed',
    feedLevelPct: 78,
    waterLevelPct: 64,
    gantry: { x: 0, y: 0, z: 0 },
    sensors: { tempF: 67, humidityPct: 72, ammoniaPpm: 4 },
  },
  wt_001: {
    deviceId: 'wt_001',
    door: 'closed', // n/a — watchtower has no door; kept for shape uniformity
    feedLevelPct: 0,
    waterLevelPct: 0,
    sensors: { tempF: 64, humidityPct: 70, ammoniaPpm: 0 },
  },
  dd_001: {
    deviceId: 'dd_001',
    door: 'open',
    feedLevelPct: 55,
    waterLevelPct: 88, // pond top-up
    sensors: { tempF: 63, humidityPct: 80, ammoniaPpm: 3 },
  },
};

// ── Schedules per device (deterministic demo set) ──────────────────────────────
const DEMO_SCHEDULES: Record<string, CreateScheduleData[]> = {
  ct_001: [
    { deviceId: 'ct_001', action: 'door',  cronExpression: buildCron({ hour: 6,  minute: 0,  days: [] }), enabled: true,  label: 'Open coop door' },
    { deviceId: 'ct_001', action: 'feed',  cronExpression: buildCron({ hour: 7,  minute: 0,  days: [] }), enabled: true,  label: 'Morning feed', amount: 100 },
    { deviceId: 'ct_001', action: 'clean', cronExpression: buildCron({ hour: 8,  minute: 30, days: [] }), enabled: true,  label: 'Daily clean sweep' },
    { deviceId: 'ct_001', action: 'door',  cronExpression: buildCron({ hour: 20, minute: 0,  days: [] }), enabled: true,  label: 'Close coop door' },
  ],
  dd_001: [
    { deviceId: 'dd_001', action: 'feed',  cronExpression: buildCron({ hour: 7,  minute: 30, days: [] }), enabled: true,  label: 'Duck morning feed', amount: 120 },
    { deviceId: 'dd_001', action: 'water', cronExpression: buildCron({ hour: 9,  minute: 0,  days: [] }), enabled: true,  label: 'Pond top-up' },
  ],
};

// ── Property grid placement (ft) per demo device ───────────────────────────────
const DEMO_PLACEMENT: Record<DemoDeviceId, { type: HardwareType; name: string; x: number; y: number }> = {
  ct_001: { type: 'chicken-tender', name: 'Chicken Tender 001', x: 10, y: 8 },
  wt_001: { type: 'watchtower',     name: 'WatchTower 001',     x: 70, y: 6 },
  dd_001: { type: 'duck-dock',      name: 'Duck Dock 001',      x: 58, y: 26 },
};

// ── Product factories for the secondary demo devices ───────────────────────────
function nowIso() { return new Date().toISOString(); }

function buildDemoProduct(opts: {
  id: string; deviceId: string; name: string; model: string; serial: string;
  family: string; animalCount: number; firmwareTarget: string;
}): Product {
  const now = nowIso();
  return {
    id: opts.id,
    user_id: ProductsService.GARAGE_OWNER_EMAIL,
    product_type: 'hardware_unit',
    product_name: opts.name,
    model: opts.model,
    serial_number: opts.serial,
    activation_code: `TC-DEMO-${opts.deviceId.toUpperCase()}`,
    qr_code: `tendercells://register?serial=${opts.serial}&device=${opts.deviceId}`,
    status: 'setup_required',
    connection_status: 'offline',
    device_id: opts.deviceId,
    network_config: { connected: false },
    location: 'Demo Yard',
    metadata: {
      owner_email: ProductsService.GARAGE_OWNER_EMAIL,
      source: DEMO_SOURCE,
      product_family: opts.family,
      firmware_target: opts.firmwareTarget,
      mqtt_base_topic: `tc/${opts.deviceId}`,
      animal_count: opts.animalCount,
      hardware_setup_mode: 'sim_only',
      simulation_backend: 'browser_threejs',
      property_simulation_enabled: true,
      telemetry_consent: 'local_only',
      telemetry_retention_days: 30,
      safety_validation_status: 'simulated',
      notes: 'Demo environment device — seeded for end-to-end UI verification.',
    },
    created_at: now,
    updated_at: now,
  };
}

function secondaryDemoProducts(): Product[] {
  return [
    buildDemoProduct({
      id: 'demo-watchtower-001', deviceId: DEMO_DEVICES.watchTower, name: 'WatchTower 001',
      model: 'WatchTower AI - Demo', serial: 'TC-WT-DEMO-0001', family: 'predator-monitor',
      animalCount: 0, firmwareTarget: 'firmware/watchtower',
    }),
    buildDemoProduct({
      id: 'demo-duck-dock-001', deviceId: DEMO_DEVICES.duckDock, name: 'Duck Dock 001',
      model: 'Duck Dock - Demo', serial: 'TC-DD-DEMO-0001', family: 'duck-dock',
      animalCount: DEMO_DUCKS.length, firmwareTarget: 'firmware/duck-dock',
    }),
  ];
}

// ── Equipment store ────────────────────────────────────────────────────────────
function writeEquipment(): DemoEquipment[] {
  const at = nowIso();
  const rows: DemoEquipment[] = (Object.values(DEMO_EQUIPMENT) as Omit<DemoEquipment, 'updatedAt'>[])
    .map((e) => ({ ...e, updatedAt: at }));
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

// ── Status helpers ─────────────────────────────────────────────────────────────
export function isDemoSeeded(): boolean {
  return localStorage.getItem(DEMO_MARKER_KEY) != null;
}
export function demoSeededAt(): string | null {
  return localStorage.getItem(DEMO_MARKER_KEY);
}
function emitChange() {
  window.dispatchEvent(new CustomEvent(DEMO_EVENT));
}

// ── Property layout placement (light-touch, idempotent) ────────────────────────
async function seedLayout(): Promise<void> {
  const state = loadPropertyLayout();
  let changed = false;
  const items: PropertyItem[] = [...state.items];

  for (const id of Object.values(DEMO_DEVICES)) {
    const place = DEMO_PLACEMENT[id];
    // already linked?
    if (items.some((it) => it.deviceId === id)) continue;
    // link the first matching hardware item that has no device yet…
    const target = items.find((it) => it.kind === 'hardware' && it.type === place.type && !it.deviceId);
    if (target) {
      target.deviceId = id;
      changed = true;
    } else {
      // …otherwise drop a new placed item for it.
      items.push({
        id: `demo-${id}`,
        kind: 'hardware',
        name: place.name,
        type: place.type,
        x: place.x,
        y: place.y,
        width: place.type === 'watchtower' ? 3 : place.type === 'roaming-roost' ? 5 : 4,
        depth: place.type === 'watchtower' ? 3 : place.type === 'roaming-roost' ? 5 : 4,
        deviceId: id,
      });
      changed = true;
    }
  }

  if (changed) savePropertyLayout({ property: state.property, items });
}

// ── Schedules (idempotent per device) ──────────────────────────────────────────
async function seedSchedules(): Promise<void> {
  for (const [deviceId, schedules] of Object.entries(DEMO_SCHEDULES)) {
    const existing = await schedulesService.getSchedules(deviceId);
    if (existing.length > 0) continue; // already has schedules — leave them
    for (const s of schedules) {
      await schedulesService.createSchedule(deviceId, s);
    }
  }
}

// ── Public: seed / reset / verify ──────────────────────────────────────────────
export async function seedDemoEnvironment(): Promise<DemoReport> {
  // 1. Structures (products)
  ProductsService.seedFirstGarageCoop();          // ct_001 garage coop
  ProductsService.seedDemoProducts(secondaryDemoProducts()); // wt_001, dd_001

  // 2. Flocks (idempotent per fixed id, per device)
  await birdsService.seedFlock(DEMO_BIRDS); // ct_001 hens
  await birdsService.seedFlock(DEMO_DUCKS); // dd_001 ducks

  // 3. Eggs (materialize today's nest-box map per laying device)
  await eggService.getDay(DEMO_DEVICES.chickenTender);
  await eggService.getDay(DEMO_DEVICES.duckDock);

  // 4. Schedules
  await seedSchedules();

  // 5. Property grid placement
  await seedLayout();

  // 6. Equipment sim-state
  writeEquipment();

  localStorage.setItem(DEMO_MARKER_KEY, nowIso());
  emitChange();
  return verifyDemoEnvironment();
}

export async function resetDemoEnvironment(): Promise<void> {
  // Products tagged with our source only
  ProductsService.removeProductsBySource(DEMO_SOURCE);
  ProductsService.removeProductsBySource('garage-dev-seed'); // ct_001 garage coop

  // Birds — remove only fixed demo ids
  for (const b of DEMO_ANIMALS) {
    await birdsService.deleteBird(b.id, b.device);
  }

  // Schedules — delete only the demo-labelled ones we created
  for (const [deviceId, schedules] of Object.entries(DEMO_SCHEDULES)) {
    const labels = new Set(schedules.map((s) => s.label));
    const existing = await schedulesService.getSchedules(deviceId);
    for (const e of existing) {
      if (e.label && labels.has(e.label)) await schedulesService.deleteSchedule(deviceId, e.id);
    }
  }

  // Property layout — unlink demo device ids (and remove items we added)
  const state = loadPropertyLayout();
  const items = state.items
    .filter((it) => !it.id.startsWith('demo-'))
    .map((it) => (it.deviceId && (Object.values(DEMO_DEVICES) as string[]).includes(it.deviceId)
      ? { ...it, deviceId: undefined }
      : it));
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

interface DeviceExpectation {
  deviceId: DemoDeviceId;
  family: string;
  expectFlock: number;
  expectEggs: boolean;
  expectSchedules: number;
}

const EXPECTATIONS: DeviceExpectation[] = [
  { deviceId: DEMO_DEVICES.chickenTender, family: 'chicken-tender',    expectFlock: DEMO_BIRDS.length, expectEggs: true,  expectSchedules: DEMO_SCHEDULES.ct_001.length },
  { deviceId: DEMO_DEVICES.watchTower,    family: 'predator-monitor',  expectFlock: 0,                 expectEggs: false, expectSchedules: 0 },
  { deviceId: DEMO_DEVICES.duckDock,      family: 'duck-dock',         expectFlock: DEMO_DUCKS.length, expectEggs: true,  expectSchedules: DEMO_SCHEDULES.dd_001.length },
];

export async function verifyDemoEnvironment(): Promise<DemoReport> {
  const products = await ProductsService.getUserProducts();
  const layout = loadPropertyLayout();
  const devices: DemoDeviceReport[] = [];

  for (const exp of EXPECTATIONS) {
    const product = products.find((p) => p.device_id === exp.deviceId);
    const flock = await birdsService.getBirds(exp.deviceId);
    const eggsDay = exp.expectEggs ? await eggService.getDay(exp.deviceId) : null;
    const eggsCount = eggsDay ? eggsDay.nestBoxes.length : 0;
    const schedules = await schedulesService.getSchedules(exp.deviceId);
    const placed = layout.items.some((it) => it.deviceId === exp.deviceId);
    const equip = getDemoEquipment(exp.deviceId);

    devices.push({
      deviceId: exp.deviceId,
      family: exp.family,
      product: layerOk(!!product, `product ${product?.product_name}`, 'product missing'),
      flock: layerOk(flock.length >= exp.expectFlock, `${flock.length} animals`, `expected ≥${exp.expectFlock}, got ${flock.length}`),
      eggs: layerOk(!exp.expectEggs || eggsCount > 0, exp.expectEggs ? `${eggsCount} nest boxes` : 'n/a', 'no egg map'),
      schedules: layerOk(schedules.length >= exp.expectSchedules, `${schedules.length} schedules`, `expected ≥${exp.expectSchedules}, got ${schedules.length}`),
      layout: layerOk(placed, 'placed on grid', 'not on property grid'),
      equipment: layerOk(equip.length > 0, 'equipment sim-state present', 'no equipment state'),
    });
  }

  const ok = devices.every((d) =>
    d.product.ok && d.flock.ok && d.eggs.ok && d.schedules.ok && d.layout.ok && d.equipment.ok);

  return { seeded: isDemoSeeded(), seededAt: demoSeededAt(), ok, devices };
}
