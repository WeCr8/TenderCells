import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();

function readProjectFile(path: string) {
  return readFileSync(resolve(root, path), 'utf8');
}

describe('TenderCells OS contracts', () => {
  it('keeps all first-wave product routes registered', () => {
    const routes = readProjectFile('src/routes/AppRoutes.tsx');
    [
      '/chicken-tender',
      '/roaming-roost',
      '/duck-dock',
      '/goat-guardian',
      '/bunny-burrow',
      '/turkey-tower',
      '/predator-monitor',
      '/rail-system-modules',
      '/tender-cells-cloud',
      '/pigeon-palace',
    ].forEach((route) => expect(routes).toContain(route));
  });

  it('keeps product registration open to full products, modules, and custom builds', () => {
    const registration = readProjectFile('src/components/products/ProductRegistrationModal.tsx');
    [
      'chicken-tender',
      'roaming-roost',
      'duck-dock',
      'predator-monitor',
      'door-system',
      'waterer',
      'feeder',
      'sensor-pod',
      'camera-kit',
      'controller-board',
      'printed-part',
      'custom_product',
    ].forEach((marker) => expect(registration).toContain(marker));
  });

  it('keeps FarmBot attribution and reuse policy visible in repo docs', () => {
    const attribution = readProjectFile('docs/third-party-attribution.md');
    expect(attribution).toContain('FarmBot');
    expect(attribution).toContain('Code Reuse Policy');
    expect(attribution).toContain('https://farm.bot/');
    expect(attribution).toContain('https://github.com/FarmBot');
    expect(attribution).toContain('https://licensing.farm.bot/');
  });

  it('keeps hardware control ready for door, feed, water, cleaning, arm, and E-stop flows', () => {
    const controls = readProjectFile('src/hooks/useHardwareControl.ts');
    [
      'openDoor',
      'closeDoor',
      'dispenseFeed',
      'primeWater',
      'stopWater',
      'setWaterValve',
      'startCleaning',
      'stopCleaning',
      'controlArm',
      'emergencyStop',
    ].forEach((marker) => expect(controls).toContain(marker));
  });

  it('keeps demo animal packs product-aware beyond Chicken Tender', () => {
    const birds = readProjectFile('src/services/birdsService.ts');
    [
      'DEMO_ANIMAL_PACKS',
      'chicken-tender',
      'roaming-roost',
      'duck-dock',
      'bunny-burrow',
      'goat-guardian',
      'turkey-tower',
      'pigeon-palace',
      'seedDemoAnimalsForProduct',
    ].forEach((marker) => expect(birds).toContain(marker));
  });

  it('ships a TenderCells CLI for terminal-first contributors', () => {
    const pkg = readProjectFile('package.json');
    const cli = readProjectFile('scripts/tendercells-cli.mjs');
    expect(pkg).toContain('"tc"');
    expect(pkg).toContain('"tendercells"');
    expect(cli).toContain('field-ready animal care OS CLI');
    expect(cli).toContain('demo:watch');
    expect(cli).toContain('status');
  });
});
