// physical.ts - "How would this become real?" for every twin on the property.
//
// Each product family maps to the physical path behind its twin: the MQTT topics the OS
// uses, the controller, the sensors / actuators, and the real thing - plus where to build it
// (lesson / guide), its wiring, firmware, the browser flasher and the source. Status is
// factual, from what is in the repo today:
//   flashable  firmware in the repo AND a target in the website's browser flasher (/flash)
//   firmware   firmware in the repo, flashed with PlatformIO
//   adapter    a vendor / third-party device Tender Cells connects to (not our hardware)
//   starter    no dedicated firmware yet - prototype it with a Starter Node
// Nothing here claims a product is shipping; the twin itself is labelled SIMULATED in the demo.

export type HardwareStatus = 'flashable' | 'firmware' | 'adapter' | 'starter';

export interface PhysicalPath {
  /** Twin → topic → controller → … → the real thing. */
  chain: string[];
  status: HardwareStatus;
  /** Website build guide / lesson. */
  build?: { label: string; href: string };
  wiring?: { label: string; href: string };
  /** Path in the repo, e.g. "firmware/chicken-tender". */
  firmware?: string;
  /** Target in the website's browser flasher (/flash?target=…). */
  flash?: string;
  /** Docs page for adapters. */
  docs?: { label: string; href: string };
}

export const REPO = 'https://github.com/WeCr8/TenderCells';
export const STATUS_LABEL: Record<HardwareStatus, string> = {
  flashable: 'Firmware ready · flash in your browser',
  firmware: 'Firmware in the repo (PlatformIO)',
  adapter: 'Connects to equipment you already own',
  starter: 'Concept · prototype it with a Starter Node',
};

const STARTER: PhysicalPath = {
  chain: ['Twin (simulated)', 'MQTT tc/{id}/cmd · tc/{id}/sensors', 'Starter Node (ESP32)', 'Relay, servo or sensor you wire', 'Your build'],
  status: 'starter',
  build: { label: 'Build your own device', href: '/lessons/build-your-own' },
  wiring: { label: 'Starter Node firmware + wiring', href: '/docs/starter-node-firmware' },
  firmware: 'firmware/starter-node',
  flash: 'starter-node',
};

const PATHS: Record<string, PhysicalPath> = {
  'chicken-tender': {
    chain: ['Chicken Tender twin', 'MQTT tc/{id}/cmd/door · tc/{id}/sensors', 'ESP32 coop controller', 'Door reed switch + motor driver', 'Linear actuator', 'Real coop door'],
    status: 'flashable',
    build: { label: 'Build the door', href: '/lessons/door-roaming-roost' },
    wiring: { label: 'Sensors → automation wiring', href: '/lessons/sensors-automation' },
    docs: { label: 'Chicken Tender spec', href: '/docs/chicken-tender' },
    firmware: 'firmware/chicken-tender',
    flash: 'chicken-tender',
  },
  'roaming-roost': {
    chain: ['Roaming Roost twin', 'MQTT tc/{id}/cmd/drive', 'ESP32 drive controller', 'DC motors + encoders in the perimeter channel', 'Mobile coop on the pasture'],
    status: 'firmware',
    build: { label: 'Door + Roaming Roost lesson', href: '/lessons/door-roaming-roost' },
    docs: { label: 'Roaming Roost', href: '/docs/roaming-roost' },
    firmware: 'firmware/roaming-roost',
  },
  watchtower: {
    chain: ['WatchTower twin', 'MQTT tc/{id}/alert · tc/broadcast/alert', 'ESP32-S3 camera nodes ×3 + LoRa', 'On-device predator model', 'Solar dome on a pole'],
    status: 'firmware',
    build: { label: 'Build a camera node', href: '/guides/camera-node-first-build' },
    firmware: 'firmware/watchtower',
  },
  'camera-kit': {
    chain: ['Camera twin', 'Local stream (no upload)', 'Camera Node (XIAO ESP32-S3 Sense)', 'Real camera'],
    status: 'flashable',
    build: { label: 'Camera Node first build', href: '/guides/camera-node-first-build' },
    firmware: 'firmware/camera-node',
    flash: 'camera-node',
  },
  'duck-dock': { ...STARTER, chain: ['Duck Dock twin', 'MQTT tc/{id}/cmd · tc/{id}/sensors', 'Starter Node (ESP32)', 'Float switch, pump relay, door servo', 'Your Duck Dock build'] },
  'feeder-waterer': {
    ...STARTER,
    chain: ['Feeder / waterer twin', 'MQTT tc/{id}/cmd/feed', 'Starter Node (ESP32)', 'Load cell + auger / valve', 'Real feeder'],
    build: { label: 'Feeder & waterer lesson', href: '/lessons/feeder-waterer' },
  },
  'robot-mower': {
    chain: ['Mower twin', 'Hub mower bridge (Home Assistant · vendor API · MQTT)', 'Your mower\'s own app / cloud', 'The robot mower you already own'],
    status: 'adapter',
    docs: { label: 'Bring your own robot mower', href: '/docs/robot-mowers' },
  },
  'weed-rover': {
    chain: ['Rover twin', 'MQTT tc/{id}/cmd/weed · tc/{id}/cfg/zones', 'Jetson Nano rover service', 'Camera + drive (+ laser only with your approval)', 'Rover in the yard'],
    status: 'firmware',
    docs: { label: 'Robot exclusion zones', href: '/docs/robot-exclusion-zones' },
    firmware: 'firmware/jetson-nano',
  },
  'farmbot-genesis': {
    chain: ['Garden twin', 'my.farm.bot (farmbot-js)', 'FarmBot Genesis', 'Your raised bed'],
    status: 'adapter',
    docs: { label: 'Property map layers', href: '/docs/property-map-layers' },
  },
};
PATHS['predator-monitor'] = PATHS.watchtower;
PATHS['farmbot-genesis-xl'] = PATHS['farmbot-genesis'];

/**
 * The physical path behind a twin of this product type.
 *
 * @param type - Layout item / product type, e.g. "chicken-tender"
 * @returns The path; families without dedicated hardware get the Starter Node path
 */
export const physicalPath = (type: string): PhysicalPath => PATHS[type] ?? STARTER;

/** Every link for a path, in the order the UI shows them (only the ones that exist). */
export function physicalLinks(p: PhysicalPath): Array<{ id: 'build' | 'wiring' | 'firmware' | 'flash' | 'source' | 'docs'; label: string; href: string }> {
  const out: Array<{ id: 'build' | 'wiring' | 'firmware' | 'flash' | 'source' | 'docs'; label: string; href: string }> = [];
  if (p.build) out.push({ id: 'build', ...p.build });
  if (p.wiring) out.push({ id: 'wiring', ...p.wiring });
  if (p.docs) out.push({ id: 'docs', ...p.docs });
  if (p.flash) out.push({ id: 'flash', label: 'Flash a board', href: `/flash?target=${p.flash}` });
  if (p.firmware) out.push({ id: 'firmware', label: 'View firmware', href: `${REPO}/tree/main/${p.firmware}` });
  out.push({ id: 'source', label: 'Source on GitHub', href: REPO });
  return out;
}
