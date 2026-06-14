// Integration test for the demo-environment orchestrator.
//
// The orchestrator is the open-source on-ramp: it seeds a coherent, end-to-end
// stack (products, flocks, eggs, schedules, property layout, equipment state)
// across EVERY product family, sim-only, in this browser's localStorage. These
// tests run headless with no Firebase env — exactly the sim-only path real
// owners run on their own machines.
//
// Why not a UI/e2e test: the Settings demo panel sits behind Firebase auth,
// which can't sign in headless without an emulator. Driving the orchestrator
// directly verifies the actual data contract the UI buttons call, with no auth.
//
// Runs in the default (node) vitest environment — no jsdom/happy-dom dependency.
// The orchestrator only touches localStorage + window.dispatchEvent/CustomEvent,
// so the shim below provides exactly those, nothing more.
//
// Coverage:
//   1. clean start — nothing seeded
//   2. seed — full report ok, every device/layer wired
//   3. idempotent — re-seed never duplicates
//   4. reset — removes all demo-tagged data, report no longer ok
//   5. reset preserves the owner's own (non-demo) flock, schedules and products

import { beforeAll, beforeEach, describe, expect, it } from 'vitest';

// ── Minimal browser-global shim (node env) ───────────────────────────────────
beforeAll(() => {
  const store = new Map<string, string>();
  const localStorageShim = {
    getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
    setItem: (k: string, v: string) => void store.set(k, String(v)),
    removeItem: (k: string) => void store.delete(k),
    clear: () => store.clear(),
    key: (i: number) => Array.from(store.keys())[i] ?? null,
    get length() { return store.size; },
  };
  const g = globalThis as Record<string, unknown>;
  g.localStorage = localStorageShim;
  if (typeof g.CustomEvent === 'undefined') {
    g.CustomEvent = class { type: string; constructor(type: string) { this.type = type; } };
  }
  g.window = { dispatchEvent: () => true };
});
import {
  seedDemoEnvironment,
  resetDemoEnvironment,
  verifyDemoEnvironment,
  isDemoSeeded,
  getDemoEquipment,
  DEMO_SPECS,
  DEMO_SOURCE,
} from './demoEnvironment';
import { ProductsService } from '../productsService';
import { birdsService, DEMO_ANIMALS, EMPTY_BIRD } from '../birdsService';
import { schedulesService, buildCron } from '../schedulesService';

beforeEach(() => {
  localStorage.clear();
});

describe('demoEnvironment — clean start', () => {
  it('reports nothing seeded before load', async () => {
    expect(isDemoSeeded()).toBe(false);
    const report = await verifyDemoEnvironment();
    expect(report.seeded).toBe(false);
    expect(report.ok).toBe(false);
  });
});

describe('demoEnvironment — seed', () => {
  it('seeds a coherent, fully-verified environment for every device', async () => {
    const report = await seedDemoEnvironment();

    expect(isDemoSeeded()).toBe(true);
    expect(report.seeded).toBe(true);
    expect(report.ok).toBe(true);
    expect(report.seededAt).not.toBeNull();

    // One report row per spec.
    expect(report.devices).toHaveLength(DEMO_SPECS.length);

    // Every layer of every device must pass.
    for (const d of report.devices) {
      expect(d.product.ok, `${d.deviceId} product: ${d.product.detail}`).toBe(true);
      expect(d.flock.ok, `${d.deviceId} flock: ${d.flock.detail}`).toBe(true);
      expect(d.eggs.ok, `${d.deviceId} eggs: ${d.eggs.detail}`).toBe(true);
      expect(d.schedules.ok, `${d.deviceId} schedules: ${d.schedules.detail}`).toBe(true);
      expect(d.layout.ok, `${d.deviceId} layout: ${d.layout.detail}`).toBe(true);
      expect(d.equipment.ok, `${d.deviceId} equipment: ${d.equipment.detail}`).toBe(true);
    }
  });

  it('tags every seeded device product local_only for privacy', async () => {
    await seedDemoEnvironment();
    const products = await ProductsService.getUserProducts();
    const seeded = products.filter((p) => p.metadata?.source === DEMO_SOURCE);
    expect(seeded.length).toBeGreaterThan(0);
    for (const p of seeded) {
      expect(p.metadata?.telemetry_consent).toBe('local_only');
    }
  });

  it('writes equipment sim-state for every device', async () => {
    await seedDemoEnvironment();
    expect(getDemoEquipment()).toHaveLength(DEMO_SPECS.length);
  });
});

describe('demoEnvironment — idempotent', () => {
  it('re-seeding does not duplicate animals, products or schedules', async () => {
    await seedDemoEnvironment();
    const birds1 = await birdsService.getBirds();
    const products1 = await ProductsService.getUserProducts();
    const sched1 = await schedulesService.getSchedules(DEMO_SPECS[0].deviceId);

    await seedDemoEnvironment();
    const birds2 = await birdsService.getBirds();
    const products2 = await ProductsService.getUserProducts();
    const sched2 = await schedulesService.getSchedules(DEMO_SPECS[0].deviceId);

    expect(birds2.length).toBe(birds1.length);
    expect(products2.length).toBe(products1.length);
    expect(sched2.length).toBe(sched1.length);

    const report = await verifyDemoEnvironment();
    expect(report.ok).toBe(true);
  });
});

describe('demoEnvironment — reset', () => {
  it('removes all demo-tagged data and clears the seeded marker', async () => {
    await seedDemoEnvironment();
    await resetDemoEnvironment();

    expect(isDemoSeeded()).toBe(false);
    expect(getDemoEquipment()).toHaveLength(0);

    const products = await ProductsService.getUserProducts();
    expect(products.some((p) => p.metadata?.source === DEMO_SOURCE)).toBe(false);

    // No demo animal id survives.
    const birds = await birdsService.getBirds();
    const demoIds = new Set(DEMO_ANIMALS.map((a) => a.id));
    expect(birds.some((b) => demoIds.has(b.id))).toBe(false);

    const report = await verifyDemoEnvironment();
    expect(report.ok).toBe(false);
  });

  it('preserves the owner’s own flock, schedules and products', async () => {
    const myDevice = 'my_real_coop_001';
    const myBird = await birdsService.createBird({
      ...EMPTY_BIRD,
      name: 'Henrietta',
      device: myDevice,
    });
    const mySchedule = await schedulesService.createSchedule(myDevice, {
      deviceId: myDevice,
      action: 'feed',
      cronExpression: buildCron({ hour: 6, minute: 0, days: [] }),
      enabled: true,
      label: 'My personal feed time',
      amount: 90,
    });
    const myProduct = await ProductsService.registerProduct({
      product_type: 'automation_device',
      product_name: 'My coop door controller',
      serial_number: 'MY-REAL-COOP-DOOR-001',
      device_id: myDevice,
      location: 'Backyard coop',
      metadata: {
        owner_email: 'owner@example.test',
        source: 'owner-created',
      },
    });

    await seedDemoEnvironment();
    await resetDemoEnvironment();

    const birds = await birdsService.getBirds(myDevice);
    expect(birds.find((b) => b.id === myBird.id)?.name).toBe('Henrietta');

    const schedules = await schedulesService.getSchedules(myDevice);
    expect(schedules.find((s) => s.id === mySchedule.id)?.label).toBe('My personal feed time');

    const products = await ProductsService.getUserProducts();
    const foundProduct = products.find((p) => p.id === myProduct.id);
    expect(foundProduct, 'Owner-created product should survive reset').toBeDefined();
    expect(foundProduct?.device_id).toBe(myDevice);
  });
});