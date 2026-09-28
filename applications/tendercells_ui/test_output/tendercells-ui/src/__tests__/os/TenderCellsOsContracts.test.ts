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

  it('shows truthful account billing and links to configured school sign-in', () => {
    const account = readProjectFile('src/pages/AccountPage.tsx');
    expect(account).toContain('<Tab label="Billing"');
    expect(account).toContain('No active subscription or payment method');
    expect(account).toContain('School or district SSO');
    expect(account).toContain('Connect School Account');
    expect(account).toContain('Submit Purchase Order');
  });

  it('keeps school roles, roster, billing, and camera sessions server-authoritative', () => {
    const backend = readProjectFile('../../../../functions/src/schoolPlatform.ts');
    const functionsIndex = readProjectFile('../../../../functions/src/index.ts');
    const rules = readProjectFile('../../../../firestore.rules');
    const websiteAccount = readProjectFile('../website/src/pages/AccountPage.tsx');
    ['getSchoolLoginOptions', 'syncSchoolRoster', 'claimSchoolMembership', 'configureSchoolOrganization',
      'createPurchaseOrder', 'createOrganizationInvoice', 'createCameraRelaySession', 'cameraRelaySignal']
      .forEach((marker) => expect(backend).toContain(marker));
    expect(functionsIndex).not.toContain('door-open-morning');
    expect(rules).toContain('schoolDeviceAccess');
    expect(rules).toContain('match /organizations/{organizationId}');
    expect(rules).toContain('match /cameraRelaySessions/{sessionId}');
    expect(websiteAccount).toContain('Find my school');
    expect(websiteAccount).toContain('auth.tenantId = provider.tenantId');
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
    expect(wizard).toContain('Network Already Set by Teacher or IT');
    expect(wizard).toContain('network_managed_by_it: managedNetwork');
    expect(wizard).toContain("setWifiPassword('')");
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
    const chickenEye = readProjectFile('src/pages/ChickenEyeDashboardPage.tsx');
    expect(viewer).toContain("document.addEventListener('visibilitychange', reconnect)");
    expect(viewer).toContain("window.addEventListener('focus', reconnect)");
    expect(viewer).toContain('setStreamAttempt((value) => value + 1)');
    expect(chickenEye).toContain('camera_stream_url');
    expect(chickenEye).toContain("classifyCameraStream(registeredStream || flashedUrl || '')");
    expect(chickenEye).toContain("document.addEventListener('visibilitychange', reconnect)");
    expect(chickenEye).toContain('Registered camera - live video');
  });

  it('keeps camera controls, transport labels, and telemetry truthful', () => {
    const viewer = readProjectFile('src/components/camera/CameraFeedViewer.tsx');
    const dashboard = readProjectFile('src/pages/ProductDashboardPage.tsx');
    const telemetry = readProjectFile('src/hooks/useTelemetry.ts');
    ['Refresh camera stream', 'Rotate camera clockwise', 'Flip camera horizontally', 'Flip camera vertically', 'LOCAL ONLY', 'Remote unencrypted video was blocked']
      .forEach((marker) => expect(viewer).toContain(marker));
    ['No temperature sensor registered', 'Battery configured; level is not reporting', 'No microphone registered']
      .forEach((marker) => expect(dashboard).toContain(marker));
    expect(telemetry).toContain("localStorage.getItem('tendercells_demo_seeded_v1') != null");
  });

  it('keeps setup and support tools discoverable from settings', () => {
    const settings = readProjectFile('src/pages/SettingsPage.tsx');
    ['Flash a Device', 'Register Devices', 'Diagnostics', 'Build Guides']
      .forEach((marker) => expect(settings).toContain(marker));
  });

  it('does not show or run routines for unregistered products', () => {
    const schedules = readProjectFile('src/pages/SchedulesPage.tsx');
    expect(schedules).toContain('No registered products. Register a device before creating schedules or running routines.');
    expect(schedules).toContain('products.some((product) => product.id === selectedDeviceId)');
    expect(schedules).toContain('selectedProduct.connection_status === \'online\'');
    expect(schedules).toContain('{selectedProduct && (');
    expect(schedules).not.toContain('verified via live headcount sensor');
  });

  it('shows the account animal roster count on the main dashboard', () => {
    const dashboard = readProjectFile('src/pages/DashboardPage.tsx');
    expect(dashboard).toContain('useBirds()');
    expect(dashboard).toContain("label: 'Animal Roster', value: animalsLoading ? '...' : animals.length");
    expect(dashboard).toContain("path: '/animals'");
    expect(dashboard).not.toContain('product.metadata?.animal_count');
  });

  it('uses an account-level animal roster with legacy route redirects', () => {
    const animals = readProjectFile('src/services/birdsService.ts');
    const routes = readProjectFile('src/routes/AppRoutes.tsx');
    expect(animals).toContain("collection(db, 'animals')");
    expect(animals).toContain("where('userId', '==', uid)");
    expect(animals).toContain('subscribe(onChange');
    expect(routes).toContain('path="/animals"');
    expect(routes).toContain('path="/birds" element={<Navigate to="/animals"');
  });

  it('ships low-cost waterer, feeder, RC vehicle, and drone monitor profiles', () => {
    const registration = readProjectFile('src/components/products/ProductRegistrationModal.tsx');
    ['DIY ESP32 Waterer', 'DIY ESP32 Feeder', 'DIY RC Vehicle', 'Drone Monitor', 'route_monitoring', 'task_schedules']
      .forEach((marker) => expect(registration).toContain(marker));
  });

  it('does not present simulated analytics or yard events outside Demo Mode', () => {
    const analytics = readProjectFile('src/pages/AnalyticsPage.tsx');
    const yard = readProjectFile('src/hooks/useYardEvents.ts');
    expect(analytics).toContain('if (!demoMode) return []');
    expect(analytics).toContain('No recorded telemetry yet');
    expect(yard).toContain("localStorage.getItem('tendercells_demo_seeded_v1') != null");
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
