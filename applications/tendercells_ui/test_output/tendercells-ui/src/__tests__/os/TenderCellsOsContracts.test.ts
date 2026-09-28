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

  it('keeps the in-app resource library available without registered products', () => {
    const routes = readProjectFile('src/routes/AppRoutes.tsx');
    const menu = readProjectFile('src/components/navigation/SideMenu.tsx');
    const resources = readProjectFile('src/pages/ResourcesPage.tsx');
    expect(routes).toContain('path="/resources"');
    expect(menu).toContain('label: "Resources"');
    expect(menu).toContain('path: "/resources"');
    ['Animals', 'Plants', 'Rodents', 'Wildlife', 'Health & safety', 'Data libraries'].forEach((section) => expect(resources).toContain(section));
    const libraries = readProjectFile('src/data/resourceLibraries.ts');
    ['ENVO', 'Plant Ontology', 'PECO', 'AgrO', 'NCBI Taxonomy', 'AGROVOC', 'GBIF'].forEach((library) => expect(libraries).toContain(library));
    expect(libraries).toContain("formats: ['OWL'");
  });

  it('keeps fresh accounts free of simulated products and alerts', () => {
    const topNav = readProjectFile('src/components/layout/TopNavBar.tsx');
    const dashboard = readProjectFile('src/pages/DashboardPage.tsx');
    expect(topNav).toContain('No products registered');
    expect(topNav).toContain('products.map');
    expect(topNav).not.toContain('<MenuItem value="chicken-tender">');
    expect(dashboard).not.toContain('SIM_ALERTS');
    expect(dashboard).toContain('No active alerts');
  });

  it('shows account and billing status while unavailable SSO stays disabled', () => {
    const account = readProjectFile('src/pages/AccountPage.tsx');
    expect(account).toContain('<Tab label="Billing"');
    expect(account).toContain('No active subscription or payment method');
    expect(account).toContain('School or district SSO');
    expect(account).toContain('<Button disabled variant="outlined"');
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
      'barn-brain',
      'printed-part',
      'custom_product',
    ].forEach((marker) => expect(registration).toContain(marker));
  });

  it('keeps the basic camera independent from the multi-camera WatchTower product', () => {
    const registration = readProjectFile('src/components/products/ProductRegistrationModal.tsx');
    const products = readProjectFile('src/pages/ProductsPage.tsx');
    const dashboard = readProjectFile('src/pages/ProductDashboardPage.tsx');
    const flasher = readProjectFile('../website/public/flash/index.html');
    const manifest = readProjectFile('../website/public/flash/manifest-camera-node.json');

    expect(registration).toContain("useState('firmware/camera-node')");
    expect(registration).toContain('1. Flash Camera');
    expect(registration).toContain('2. Register Camera');
    expect(registration).toContain('Use available board features');
    expect(registration).toContain('Unavailable features are disabled for this board profile');
    ['Camera only', 'Camera + sound events', 'Camera + microSD recording', 'Full Sense board'].forEach((preset) => {
      expect(registration).toContain(preset);
    });
    ['camera', 'microphone', 'microsd', 'wifi', 'ble', 'gpio', 'battery_power'].forEach((capability) => {
      expect(registration).toContain(capability);
    });
    expect(products).toContain("return 'camera-node'");
    expect(products).toContain('camera_stream_url');
    expect(dashboard).toContain('<CameraFeedViewer');
    expect(dashboard).toContain('Board Controls');
    expect(dashboard).toContain('Not available on the registered board.');
    expect(dashboard).toContain('hardware.configureCamera(next)');
    expect(flasher).toContain('/flash/manifest-camera-node.json');
    expect(manifest).toContain('firmware/camera-node/firmware.bin');
    [registration, products, dashboard, flasher, manifest].forEach((source) => {
      expect(source).not.toContain('watchtower-cam');
    });
  });

  it('keeps device flashing inside the registration workflow', () => {
    const registration = readProjectFile('src/components/products/ProductRegistrationModal.tsx');
    const firebaseConfig = readProjectFile('../../../../firebase.json');

    expect(registration).toContain('setFlasherUrl(`/flash/?${params.toString()}`)');
    expect(registration).toContain('title="Tender Cells device flasher"');
    expect(registration).toContain('allow="serial; usb"');
    expect(registration).not.toContain("window.open(`/flash/");
    expect(firebaseConfig).toContain("frame-ancestors 'self'");
  });

  it('uses the real cross-platform device provisioning flow', () => {
    const wizard = readProjectFile('src/components/products/ConnectionSetupWizard.tsx');

    ['TenderCam-Setup', 'ChickenTender-Setup', 'TenderNode-Setup', 'Windows:', 'macOS:'].forEach((marker) => {
      expect(wizard).toContain(marker);
    });
    expect(wizard).toContain("window.open('http://192.168.4.1'");
    expect(wizard).toContain('camera_stream_url: streamUrl.trim()');
    expect(wizard).toContain('TC_PROVISION:');
    expect(wizard).toContain('never saved by TenderCells');
    expect(wizard).not.toContain('password: password.trim()');
    expect(wizard).not.toContain('Simulate pairing process');
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

  it('supports general animal profiles and camera identity enrollment', () => {
    const animals = readProjectFile('src/services/birdsService.ts');
    const roster = readProjectFile('src/pages/BirdManagementPage.tsx');
    const menu = readProjectFile('src/components/navigation/SideMenu.tsx');
    ['Great Pyrenees', 'Pygmy', "'dog'", "'goat'", "'chicken'", 'profileImage', 'cameraTracking']
      .forEach((marker) => expect(animals).toContain(marker));
    expect(roster).toContain('Tag / band / microchip ID');
    expect(roster).toContain('Use this profile as a camera identity reference');
    expect(menu).toContain('label: "Animal Roster"');
  });

  it('reconnects a suspended camera stream when its tab becomes visible', () => {
    const viewer = readProjectFile('src/components/camera/CameraFeedViewer.tsx');
    expect(viewer).toContain("document.addEventListener('visibilitychange', reconnect)");
    expect(viewer).toContain("window.addEventListener('focus', reconnect)");
    expect(viewer).toContain('setStreamAttempt((value) => value + 1)');
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

  it('keeps mobile packaging honest about PWA and native readiness', () => {
    const docs = readProjectFile('docs/mobile-packaging.md');
    const audit = readProjectFile('scripts/mobile-package-audit.mjs');
    expect(docs).toContain('PWA install/testing is ready');
    expect(docs).toContain('native Android/iOS packages are not scaffolded yet');
    expect(audit).toContain('TenderCells mobile package audit');
    expect(audit).toContain('android');
    expect(audit).toContain('ios');
  });

  it('keeps non-commercial weed datasets out of production guidance', () => {
    const weedDocs = readProjectFile('../../../../docs/WEED_PATROL.md');
    expect(weedDocs).toContain('CottonWeedDet12');
    expect(weedDocs).toContain('CC BY-NC 4.0 prohibits commercial use');
    expect(weedDocs).toContain('do not bundle it or train production TenderCells models from it');
  });
});
