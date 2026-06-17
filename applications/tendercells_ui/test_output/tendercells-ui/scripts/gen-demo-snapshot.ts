// gen-demo-snapshot.ts — serialize the real demo seed to a static JSON file so
// non-JS AI tools / crawlers can read literal values (animals, devices, layout)
// without running the app. Source of truth = demoEnvironment.ts (no duplication).
//
// Output: public/demo/snapshot.json  → served at /app/demo/snapshot.json after build.
// Run: npx tsx scripts/gen-demo-snapshot.ts  (wired into build:public-demo)

import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DEMO_SPECS, DEMO_DEVICES, DEMO_SOURCE } from '../src/services/demo/demoEnvironment';

const here = dirname(fileURLToPath(import.meta.url));
const out = resolve(here, '../public/demo/snapshot.json');

interface AnimalLike {
  name?: string; breed?: string; species?: string;
  ageWeeks?: number; age?: number; avgEggsPerWeek?: number;
}

const snapshot = {
  source: DEMO_SOURCE,
  generatedAt: new Date().toISOString(),
  note: 'Literal seeded demo data for non-JS AI tools. The browser demo seeds these locally (localStorage). No real farm, no accounts, no private data.',
  do_not_claim: [
    'Do not claim these control a real farm — they are local seed values.',
    'Counts/values here are the seed; a live session may add the user\'s own edits.',
  ],
  deviceIds: DEMO_DEVICES,
  deviceCount: DEMO_SPECS.length,
  devices: DEMO_SPECS.map((d) => ({
    deviceId: d.deviceId,
    family: d.family,
    hardwareType: d.hardwareType,
    label: d.label,
    placement: d.grid,
    layingEggs: d.laying,
    animalCount: d.animals.length,
    animals: (d.animals as AnimalLike[]).map((a) => ({
      name: a.name,
      breed: a.breed,
      species: a.species,
      ageWeeks: a.ageWeeks ?? a.age,
      avgEggsPerWeek: a.avgEggsPerWeek,
    })),
  })),
};

mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, JSON.stringify(snapshot, null, 2));
console.log(`✓ demo snapshot: ${out} — ${snapshot.devices.length} devices, ` +
  `${snapshot.devices.reduce((n, d) => n + d.animalCount, 0)} animals`);
