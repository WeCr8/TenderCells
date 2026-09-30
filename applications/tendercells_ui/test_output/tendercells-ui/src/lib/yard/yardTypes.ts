// yardTypes.ts - station flags shown on the 3D property map (mirrors express-api yardEvents.ts).
//
// A flag is anything a person should look at: eggs ready for pickup, a duck-dock
// pickup, a detected weed waiting for human review, how many birds are in the roost.

export type YardEventType = 'egg_ready' | 'pickup_ready' | 'weed_detected' | 'headcount' | 'alert';
export type YardEventStatus = 'active' | 'pending_review' | 'approved' | 'rejected' | 'treated' | 'cleared';

export interface YardEvent {
  id: string;
  deviceId: string;
  type: YardEventType;
  status: YardEventStatus;
  title: string;
  detail?: string;
  count?: number;
  /** 0..1 */
  confidence?: number;
  /** Property-layout item the flag belongs to. */
  itemId?: string;
  /** Position inside the item footprint (weeds): x along the long side, y across. */
  bedMm?: { x: number; y: number };
  station?: string;
  /** What was seen, e.g. "fox" (WatchTower predator alerts). */
  label?: string;
  /** Bearing from the reporting device, degrees clockwise from map north (up). */
  bearingDeg?: number;
  /** Estimated range from the device, feet (when the camera can estimate it). */
  distanceFt?: number;
  /** Property position in feet (detections from mobile robots: weed rovers, Roaming Roost). */
  propFt?: { x: number; y: number };
  /** Found by a camera-only robot: a person pulls it by hand (no aim / burn). */
  scout?: boolean;
  /** What an alert is about (rover findings): an animal on the route, a water leak, a plant. */
  finding?: 'animal' | 'leak' | 'plant';
  /** Animal findings: your own flock/pets, harmless wildlife, or a predator. */
  animalGroup?: 'flock' | 'pet' | 'wildlife' | 'predator';
  ts: number;
  updatedAt: number;
}

/** A flag resolved to the layout item it is drawn on. */
export interface YardFlag extends YardEvent {
  itemId: string;
  /** 'demo' flags come from the in-browser simulators; 'live' from express-api. */
  source: 'demo' | 'live';
}

/** Flags a person still needs to act on (open, not just informational). */
export const needsAttention = (e: YardEvent): boolean =>
  e.type !== 'headcount' && (e.status === 'active' || e.status === 'pending_review');

export const FLAG_COLORS: Record<YardEventType, string> = {
  egg_ready: '#C8B882',
  pickup_ready: '#C8B882',
  weed_detected: '#E8A020',
  headcount: '#4A7C59',
  alert: '#CC3333',
};

export const STATUS_COLORS: Partial<Record<YardEventStatus, string>> = {
  approved: '#2196F3',
  treated: '#4A7C59',
  rejected: '#8A7D55',
  cleared: '#8A7D55',
};

/**
 * What a robot pass looks for. Only weeds are ever offered for laser treatment; plant-health
 * and animal sightings (snakes, predators) are alerts for a person.
 */
export type RobotTask = 'weed' | 'plant_scan' | 'patrol';

export const ROBOT_TASKS: Record<RobotTask, { label: string; help: string }> = {
  weed: { label: 'Weed pass', help: 'Find weeds; you approve each one (aim / burn / not a weed).' },
  plant_scan: { label: 'Plant health scan', help: 'Flags wilting, yellowing or pest-damaged crops to check.' },
  patrol: { label: 'Snake & predator patrol', help: 'Flags snakes and animals it sees. Alerts only - the laser is never used on animals.' },
};

/**
 * Weed robot builds: FarmBot Genesis laser head, LiteWeed-style laser rover, arm-mounted
 * laser, and a camera-only rover scout (finds and maps weeds for a person to pull).
 */
export type WeedRobotType = 'genesis-laser' | 'rover-laser' | 'arm-laser' | 'rover-scout';

/** Weed-patrol robot state published on tc/{id}/state/weed. */
export interface WeedRobotState {
  state: 'idle' | 'scanning' | 'treating' | 'estop' | 'error' | string;
  mode: 'simulation' | 'live' | string;
  estop: boolean;
  laser: {
    burnEnabled: boolean; studentMode: boolean; enclosureClosed: boolean; pulseMs: number; estop: boolean;
    /** Laser profile (fixed | diode-500mw | diode-4w), class and wavelength - newer robots only. */
    profile?: string; laserClass?: string; wavelengthNm?: number; powerW?: number;
  };
  pass: { running: boolean; pass: number; passes: number; waypoint: number; waypoints: number; task?: RobotTask };
  /** Tool head position in bed mm (x along, y across, z down) + aiming dot / laser output. */
  tool?: { x: number; y: number; z: number; aim: boolean; laser: boolean };
  /** Robot build (demo robots; live robots may report it too). */
  robotType?: WeedRobotType;
  /** Mobile robots: where the rover is on the property (feet) and which way it faces. */
  pose?: { xFt: number; yFt: number; headingDeg: number };
  error: string | null;
  ts: number;
}

/** Live mode = an express-api URL is configured (same rule as useTelemetry). */
export const YARD_LIVE: boolean = !!import.meta.env.VITE_MQTT_API_BASE_URL;

/** Default device ids of the demo yard, by layout item type. */
export const DEFAULT_DEVICE_BY_TYPE: Record<string, string> = {
  'chicken-tender': 'ct_001',
  'duck-dock': 'dd_001',
  'roaming-roost': 'rr_001',
  'turkey-tower': 'tt_001',
  'pigeon-palace': 'pp_001',
  watchtower: 'wt_001',
  'weed-rover': 'rover_001',
};

/** Detection radius drawn for a WatchTower when its item has no mapped radius (ft). */
export const WATCHTOWER_RANGE_FT = 40;

/** Layout item types a weed-patrol robot (FarmBot-style gantry) works over. */
export const WEED_BED_TYPES = new Set(['farmbot-genesis', 'farmbot-genesis-xl', 'greenhouse', 'aquaponics', 'hydroponics']);

/**
 * Mobile robots that can run a property-wide weed patrol with their camera. Only the
 * dedicated Weed Rover may carry a laser; robots that house animals (Roaming Roost) and
 * custom builds are camera-only scouts.
 */
export const WEED_ROVER_TYPES = new Set(['weed-rover', 'roaming-roost', 'community-custom']);
export const LASER_ROVER_TYPES = new Set(['weed-rover']);

/** Default weed robot device id for a garden item. */
export const weedDeviceFor = (item: { id: string; deviceId?: string }): string => item.deviceId || 'garden_weeder';

/** Roaming birds from a headcount flag ("2 roaming outside" in its detail). */
export function roamingFrom(e: Pick<YardEvent, 'detail'>): number {
  const m = /(\d+)\s+roaming/.exec(e.detail ?? '');
  return m ? Number(m[1]) : 0;
}
