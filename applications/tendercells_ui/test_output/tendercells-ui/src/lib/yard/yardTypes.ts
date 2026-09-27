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

/** Weed robot builds: FarmBot Genesis laser head, LiteWeed-style rover, arm-mounted laser. */
export type WeedRobotType = 'genesis-laser' | 'rover-laser' | 'arm-laser';

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
  pass: { running: boolean; pass: number; passes: number; waypoint: number; waypoints: number };
  /** Tool head position in bed mm (x along, y across, z down) + aiming dot / laser output. */
  tool?: { x: number; y: number; z: number; aim: boolean; laser: boolean };
  /** Robot build (demo robots; live robots may report it too). */
  robotType?: WeedRobotType;
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
};

/** Detection radius drawn for a WatchTower when its item has no mapped radius (ft). */
export const WATCHTOWER_RANGE_FT = 40;

/** Layout item types a weed-patrol robot (FarmBot-style gantry) works over. */
export const WEED_BED_TYPES = new Set(['farmbot-genesis', 'farmbot-genesis-xl', 'greenhouse', 'aquaponics', 'hydroponics']);

/** Default weed robot device id for a garden item. */
export const weedDeviceFor = (item: { id: string; deviceId?: string }): string => item.deviceId || 'garden_weeder';

/** Roaming birds from a headcount flag ("2 roaming outside" in its detail). */
export function roamingFrom(e: Pick<YardEvent, 'detail'>): number {
  const m = /(\d+)\s+roaming/.exec(e.detail ?? '');
  return m ? Number(m[1]) : 0;
}
