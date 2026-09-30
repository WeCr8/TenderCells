// cameraMounts.ts - where cameras sit on each product (inside / outside views), plus custom
// mounts per layout item for custom builds. The 3D view renders any of them as insets
// (demo); live, a camera node publishes its MJPEG streamUrl on tc/{streamDeviceId}/sensors.

export interface CameraMount {
  id: string;
  label: string;
  /** Position inside the item footprint as fractions of width / depth (-0.5..0.5 from the centre). */
  fx: number;
  fz: number;
  /** Height above the ground, feet. */
  heightFt: number;
  /** Looking direction: degrees clockwise from map north (up), and tilt (negative = down). */
  yawDeg: number;
  pitchDeg: number;
  /** Horizontal field of view, degrees. */
  hfovDeg: number;
  inside: boolean;
  /** Camera node device id for the live stream (default {deviceId}_{mountId}). */
  streamDeviceId?: string;
}

const m = (id: string, label: string, fx: number, fz: number, heightFt: number, yawDeg: number, pitchDeg: number, inside: boolean, hfovDeg = 100): CameraMount =>
  ({ id, label, fx, fz, heightFt, yawDeg, pitchDeg, hfovDeg, inside });

/** Built-in mounts by product type. */
export const DEFAULT_CAMERA_MOUNTS: Record<string, CameraMount[]> = {
  'chicken-tender': [
    m('cam1', 'Roost (inside)', -0.35, -0.35, 3.4, 135, -30, true, 110),
    m('cam2', 'Nest boxes (inside)', 0.35, 0.3, 2.6, 300, -35, true),
    m('cam3', 'Run (outside)', 0, 0.55, 3.2, 180, -18, false),
  ],
  'duck-dock': [
    m('cam1', 'Shelter (inside)', -0.3, -0.3, 3, 135, -30, true, 110),
    m('cam2', 'Pond (outside)', 0, 0.6, 3.5, 180, -20, false),
  ],
  'roaming-roost': [
    m('cam1', 'Dome (inside)', 0, 0, 3.6, 0, -60, true, 120),
    m('cam2', 'Front (outside)', 0, -0.6, 2.2, 0, -8, false),
    m('cam3', 'Rear (outside)', 0, 0.6, 2.2, 180, -8, false),
  ],
  watchtower: [
    m('cam1', 'North', 0, 0, 3.2, 0, -12, false, 120),
    m('cam2', 'South-east', 0, 0, 3.2, 120, -12, false, 120),
    m('cam3', 'South-west', 0, 0, 3.2, 240, -12, false, 120),
  ],
  'weed-rover': [m('cam1', 'Ground camera (weeds)', 0, -0.4, 1.7, 0, -55, false, 80), m('cam2', 'Rear view', 0, 0.45, 1.4, 180, -15, false)],
  'farmbot-genesis': [m('tool', 'Tool camera (down)', 0, 0, 2.5, 0, -89, false, 70), m('overview', 'Bed overview', 0, -0.7, 4, 180, -35, false)],
  'farmbot-genesis-xl': [m('tool', 'Tool camera (down)', 0, 0, 2.5, 0, -89, false, 70)],
  'bunny-burrow': [m('cam1', 'Hutch (inside)', -0.3, -0.3, 2.4, 135, -35, true, 110), m('cam2', 'Run (outside)', 0, 0.6, 2.5, 180, -15, false)],
  'goat-guardian': [m('cam1', 'Shelter (inside)', -0.35, -0.35, 5, 135, -25, true, 110), m('cam2', 'Gate (outside)', 0, 0.6, 5, 180, -12, false)],
  'turkey-tower': [m('cam1', 'Roost (inside)', -0.3, -0.3, 4, 135, -30, true, 110), m('cam2', 'Yard (outside)', 0, 0.6, 4, 180, -15, false)],
  'pigeon-palace': [m('cam1', 'Loft (inside)', -0.3, -0.3, 4, 135, -30, true, 110), m('cam2', 'Landing board', 0, 0.6, 4.5, 180, -10, false)],
};

/** Mounts for an item: its custom list when set, otherwise the product defaults. */
export function mountsFor(item: { type: string; cameras?: CameraMount[] }): CameraMount[] {
  return item.cameras?.length ? item.cameras : (DEFAULT_CAMERA_MOUNTS[item.type] ?? []);
}

/** Stable key for a selected view. */
export const viewKey = (itemId: string, mountId: string) => `${itemId}:${mountId}`;
