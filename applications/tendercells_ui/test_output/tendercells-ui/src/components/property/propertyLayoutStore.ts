import type { TerrainLayers } from './terrain';
import type { DrainageFix } from './watershed';
import type { CameraMount } from '../../lib/yard/cameraMounts';
import { auth } from '../../lib/firebase/firebaseApp';

export type PropertyItemKind = 'hardware' | 'obstacle';
export type HardwareType =
  | 'chicken-tender'
  | 'roaming-roost'
  | 'duck-dock'
  | 'goat-guardian'
  | 'bunny-burrow'
  | 'turkey-tower'
  | 'pigeon-palace'
  | 'watchtower'
  | 'rail-module'
  | 'sensor'
  // Gardens category — FarmBot-aligned automated growing systems. "Genesis" mirrors
  // FarmBot Genesis: a CNC gantry (X/Y rails + Z leadscrew + tool head) over a raised
  // bed. Other garden types automate growing in different ways (aquaponics, hydroponics)
  // or shelter it (greenhouse). A garden item may carry a full uploaded 3D scene via
  // PropertyItem.modelUrl (import a complete "genesis" world model).
  | 'farmbot-genesis'
  | 'farmbot-genesis-xl'
  | 'aquaponics'
  | 'hydroponics'
  | 'greenhouse'
  // A user's own registered device with no built-in product family (Product
  // Registration Modal's "DIY RC Vehicle" / "Community Custom" templates, or
  // anything else with property_simulation_enabled checked). Renders its own
  // uploaded GLB when the product has one (see Viewport3D's product glbCache,
  // keyed by product.id - same path already used for a linked built-in
  // product's custom_device_asset_url), otherwise a plain placeholder box.
  | 'community-custom'
  // A registered "DIY ESP32 Camera Node" (docs/CAMERA_NODE_FIRST_BUILD.md,
  // productFamily 'camera-kit') - a fixed camera, not a mobile robot. Always
  // placeable/visible on the property map once registered (no
  // property_simulation_enabled opt-in needed, unlike community-custom -
  // a camera has no ambiguous non-ground-placement case to guard against).
  | 'camera-kit'
  // A small camera rover that drives the whole property finding weeds (weed patrol on a
  // rover): camera-only scout, or the laser build with human approval per weed.
  | 'weed-rover'
  // A spigot, trough, tank or irrigation valve. Rovers check the ground around it for
  // leaks (standing water / wet soil) on every pass.
  | 'water-point'
  // A robot mower the owner already has (Robot Mowers page: Home Assistant lawn_mower entity or
  // the Tender Cells MQTT contract). Tender Cells keeps it docked while the flock is out.
  | 'robot-mower';
export type ObstacleType =
  | 'tree' | 'fence' | 'pond' | 'rock' | 'building' | 'garden' | 'no-go-zone'
  | 'bush' | 'crop-row';

// Garden-category hardware types (FarmBot-aligned). Grouped for the editor palette.
export const GARDEN_TYPES: HardwareType[] = [
  'farmbot-genesis',
  'farmbot-genesis-xl',
  'aquaponics',
  'hydroponics',
  'greenhouse',
];
export type ItemShape = 'rect' | 'circle' | 'hexagon' | 'octagon' | 'diamond' | 'rounded';

// Terrain zones, elevation points and a robot-mapped elevation grid (see terrain.ts)
// ride on the property config; all optional so older saved layouts still load.
export interface PropertyConfig extends TerrainLayers {
  name: string;
  widthFt: number;
  depthFt: number;
  gridStepFt: number;
  // Base ground look in the 3D view (lawn | pasture | dry | snow) wherever no terrain
  // zone covers the ground. Optional: older saved layouts default to lawn.
  terrain?: 'lawn' | 'pasture' | 'dry' | 'snow';
  // Drainage changes the user is trying in Watershed & Drainage (planned, not built).
  drainagePlan?: DrainageFix[];
}

export interface PropertyItem {
  id: string;
  kind: PropertyItemKind;
  name: string;
  type: HardwareType | ObstacleType;
  shape?: ItemShape;
  x: number;
  y: number;
  width: number;
  depth: number;
  productId?: string;   // Firestore product.id — set by sync, used for 1:1 matching
  deviceId?: string;    // hardware device_id label (e.g. 'ct_001')
  // Full 3D scene/model to render in place of the procedural mesh. Set when a user
  // imports a complete model (e.g. a FarmBot "Genesis" world) as a garden device.
  // Object URL (session) or uploaded GLB URL (persisted). GLB only — runtime-loadable.
  modelUrl?: string;
  // Terrain map reported by a terrain-tracking robot (e.g. Roaming Roost) from its
  // drive/boundary/obstacle sensors. radiusFt = patrolled/mapped extent; boundary =
  // the scanned polygon (property coords). Used to draw + adjust terrain in 3D.
  scan?: { radiusFt?: number; boundary?: Array<{ x: number; y: number }> };
  // User-authored route for a mobile robot (e.g. Roaming Roost) to follow - the
  // opposite direction of `scan`: this is drawn BY a person FOR the robot, not
  // reported by it. Same {x,y} property-coordinate shape as scan.boundary on
  // purpose (one rendering/animation path can consume either), but a distinct
  // field since the two never mean the same thing at the same time.
  patrolPath?: Array<{ x: number; y: number }>;
  // Camera mounts for a custom build (inside / outside views). Empty = product defaults
  // (lib/yard/cameraMounts.ts).
  cameras?: CameraMount[];
}

export type PropertyLayoutState = {
  property: PropertyConfig;
  items: PropertyItem[];
};

export const PROPERTY_LAYOUT_STORAGE_KEY = 'tendercells_property_layout_v5';
export const PROPERTY_LAYOUT_EVENT = 'tendercells-property-layout-updated';

export const HARDWARE_TYPES: HardwareType[] = [
  'chicken-tender',
  'roaming-roost',
  'duck-dock',
  'goat-guardian',
  'bunny-burrow',
  'turkey-tower',
  'pigeon-palace',
  'watchtower',
  'rail-module',
  'sensor',
  ...GARDEN_TYPES,
  'community-custom',
  'weed-rover',
  'camera-kit',
  'water-point',
  'robot-mower',
];

// Mobile ground robots that can be given a hand-drawn patrol route and driven
// through it in the 3D viewport (Draw Path / Simulate Route). A one-line
// addition here is all a *new* mobile robot type needs to pick up that whole
// feature - see PropertyLayoutBuilder.tsx and Viewport3D.tsx for the consumers.
export const MOBILE_ROBOT_TYPES = new Set<HardwareType>(['roaming-roost', 'community-custom', 'weed-rover', 'robot-mower']);

// Real-world footprint dimensions from product specs (CLAUDE.md)
// width × depth in feet; height not used on 2D map
export const PRODUCT_DIMENSIONS: Record<HardwareType, { width: number; depth: number; shape: ItemShape }> = {
  'chicken-tender': { width: 4, depth: 4, shape: 'rect'    }, // 4×4×5 ft
  'roaming-roost':  { width: 5, depth: 5, shape: 'octagon' }, // 4 ft inner octagon + 3-4" wheel channel → ~5 ft OD
  'duck-dock':      { width: 4, depth: 4, shape: 'rect'    }, // 4×4×6 ft
  'goat-guardian':  { width: 6, depth: 6, shape: 'rect'    }, // 6×6×8 ft
  'bunny-burrow':   { width: 3, depth: 3, shape: 'rounded' }, // 3×3×5 ft
  'turkey-tower':   { width: 4, depth: 4, shape: 'rect'    }, // 4×4×6 ft
  'pigeon-palace':  { width: 4, depth: 4, shape: 'rect'    }, // 4×4×6 ft
  'watchtower':     { width: 3, depth: 3, shape: 'hexagon' }, // 3×3×5 ft dome
  'rail-module':    { width: 4, depth: 2, shape: 'rect'    }, // linear rail segment
  'sensor':         { width: 1, depth: 1, shape: 'circle'  }, // point sensor
  'camera-kit':     { width: 2, depth: 2, shape: 'hexagon' }, // Seeed XIAO ESP32-S3 Sense on a small pole
  // Gardens — FarmBot-aligned footprints (converted from FarmBot bed specs to ft)
  'farmbot-genesis':    { width: 5,  depth: 10, shape: 'rect' }, // FarmBot Genesis ~1.5×3 m bed
  'farmbot-genesis-xl': { width: 9,  depth: 20, shape: 'rect' }, // Genesis XL ~2.86×6 m bed
  'aquaponics':         { width: 4,  depth: 8,  shape: 'rect' }, // tank + grow bed
  'hydroponics':        { width: 2,  depth: 2,  shape: 'circle' }, // vertical tower
  'greenhouse':         { width: 8,  depth: 12, shape: 'rect' }, // enclosed grow house
  'community-custom':   { width: 4,  depth: 4,  shape: 'rect' }, // arbitrary - resize after adding
  'weed-rover':         { width: 3,  depth: 2,  shape: 'rect' }, // small camera rover (LiteWeed-class)
  'water-point':        { width: 1,  depth: 1,  shape: 'circle' }, // spigot / trough / tank
  'robot-mower':        { width: 2,  depth: 3,  shape: 'rounded' }, // consumer robot mower (~0.6 x 0.9 m)
};

export const OBSTACLE_TYPES: ObstacleType[] = ['tree', 'bush', 'crop-row', 'fence', 'pond', 'rock', 'building', 'garden', 'no-go-zone'];

// Default shapes per obstacle type
export const OBSTACLE_DEFAULT_SHAPES: Partial<Record<ObstacleType, ItemShape>> = {
  tree: 'circle',
  bush: 'circle',
  'crop-row': 'rect',
  rock: 'circle',
  pond: 'rounded',
  garden: 'rounded',
  'no-go-zone': 'rect',
  fence: 'rect',
  building: 'rect',
};

export const ITEM_COLORS: Record<string, string> = {
  'chicken-tender': '#D4A574',
  'roaming-roost':  '#C8B882',
  'duck-dock':      '#4A90E2',
  'goat-guardian':  '#D0A34E',
  'bunny-burrow':   '#B9D7A3',
  'turkey-tower':   '#C97D4B',
  'pigeon-palace':  '#D6D9C8',
  watchtower:       '#8DD47A',
  'rail-module':    '#A5B1A9',
  sensor:           '#D0A34E',
  // Gardens
  'farmbot-genesis':    '#7CB342',
  'farmbot-genesis-xl': '#689F38',
  aquaponics:           '#26A69A',
  hydroponics:          '#42A5B5',
  greenhouse:           '#9CCC65',
  'community-custom':   '#5AC8C8',
  'weed-rover':         '#9CCC65',
  'camera-kit':         '#8AACC8',
  'water-point':        '#4FC3F7',
  'robot-mower':        '#FF8A65',
  tree:             '#2F7D32',
  bush:             '#4C9A4C',
  'crop-row':       '#6B8E23',
  fence:            '#8B6F47',
  pond:             '#3F8FD2',
  rock:             '#777D82',
  building:         '#6A5D4D',
  garden:           '#4A7C59',
  'no-go-zone':     '#C62828',
};

export const SHAPE_LABELS: Record<ItemShape, string> = {
  rect:    'Rectangle',
  circle:  'Circle',
  hexagon: 'Hexagon',
  octagon: 'Octagon',
  diamond: 'Diamond',
  rounded: 'Rounded Rect',
};

export const ALL_SHAPES: ItemShape[] = ['rect', 'rounded', 'circle', 'octagon', 'hexagon', 'diamond'];

export const DEFAULT_PROPERTY: PropertyConfig = {
  name: 'Home Yard',
  widthFt: 80,
  depthFt: 60,
  gridStepFt: 1,
  // A starter set so the demo shows varied ground; users edit these in Property Layout → Terrain.
  terrainZones: [
    { id: 'zone-garden', name: 'Garden soil', kind: 'garden-soil', x: 9, y: 27, width: 11, depth: 16, source: 'user' },
    { id: 'zone-path', name: 'Gravel path', kind: 'gravel', x: 20, y: 34, width: 36, depth: 3, source: 'user' },
    { id: 'zone-coop', name: 'Coop run mulch', kind: 'mulch', x: 7, y: 5, width: 11, depth: 10, source: 'user' },
  ],
  elevationPoints: [
    { id: 'elev-knoll', x: 72, y: 44, heightFt: 3, radiusFt: 14, label: 'Back knoll', source: 'user' },
    { id: 'elev-swale', x: 46, y: 20, heightFt: -1, radiusFt: 8, label: 'Swale by the pond', source: 'user' },
  ],
};

export const DEFAULT_ITEMS: PropertyItem[] = [
  // Dimensions and shapes match PRODUCT_DIMENSIONS — real product footprints
  { id: 'item-chicken-tender', kind: 'hardware', name: 'Chicken Tender', type: 'chicken-tender', shape: 'rect',    x: 10, y: 8,  width: 4,  depth: 4  },
  { id: 'item-roaming-roost',  kind: 'hardware', name: 'Roaming Roost',  type: 'roaming-roost',  shape: 'octagon', x: 40, y: 28, width: 5,  depth: 5  },
  { id: 'item-duck-dock',      kind: 'hardware', name: 'Duck Dock',      type: 'duck-dock',      shape: 'rect',    x: 58, y: 26, width: 4,  depth: 4  },
  { id: 'item-watchtower',     kind: 'hardware', name: 'WatchTower',     type: 'watchtower',     shape: 'hexagon', x: 70, y: 6,  width: 3,  depth: 3  },
  { id: 'item-garden-genesis', kind: 'hardware', name: 'Garden (Genesis)', type: 'farmbot-genesis', shape: 'rect',   x: 12, y: 30, width: 5,  depth: 10 },
  { id: 'item-tree',           kind: 'obstacle', name: 'Oak Tree',       type: 'tree',           shape: 'circle',  x: 28, y: 10, width: 8,  depth: 8  },
  { id: 'item-pond',           kind: 'obstacle', name: 'Pond',           type: 'pond',           shape: 'rounded', x: 52, y: 12, width: 14, depth: 10 },
  { id: 'item-spigot',         kind: 'hardware', name: 'Garden spigot',  type: 'water-point',    shape: 'circle',  x: 20, y: 30, width: 1,  depth: 1  },
  { id: 'item-fence',         kind: 'obstacle', name: 'Fence Line',     type: 'fence',          shape: 'rect',    x: 4,  y: 48, width: 60, depth: 3  },
  // Restricted area robots must not enter (sent to them as exclusion zones).
  { id: 'item-septic-nogo',    kind: 'obstacle', name: 'Septic field',   type: 'no-go-zone',     shape: 'rect',    x: 24, y: 40, width: 10, depth: 6  },
];

const getPropertyLayoutStorageKey = () => {
  const uid = auth.currentUser?.uid;
  return uid ? `${PROPERTY_LAYOUT_STORAGE_KEY}:${uid}` : `${PROPERTY_LAYOUT_STORAGE_KEY}:demo`;
};

const emptyAccountLayout = (): PropertyLayoutState => ({
  property: {
    name: 'My Property',
    widthFt: 80,
    depthFt: 60,
    gridStepFt: 1,
    terrainZones: [],
    elevationPoints: [],
  },
  items: [],
});

export const loadPropertyLayout = (): PropertyLayoutState => {
  try {
    const signedIn = Boolean(auth.currentUser?.uid);
    const fallback = signedIn ? emptyAccountLayout() : { property: DEFAULT_PROPERTY, items: DEFAULT_ITEMS };
    const saved = localStorage.getItem(getPropertyLayoutStorageKey());
    if (!saved) return fallback;
    const parsed = JSON.parse(saved) as Partial<PropertyLayoutState>;
    return {
      property: parsed.property || fallback.property,
      items: Array.isArray(parsed.items) ? parsed.items : fallback.items,
    };
  } catch {
    return auth.currentUser?.uid ? emptyAccountLayout() : { property: DEFAULT_PROPERTY, items: DEFAULT_ITEMS };
  }
};

export const savePropertyLayout = (state: PropertyLayoutState) => {
  localStorage.setItem(getPropertyLayoutStorageKey(), JSON.stringify(state));
  window.dispatchEvent(new CustomEvent<PropertyLayoutState>(PROPERTY_LAYOUT_EVENT, { detail: state }));
};

/**
 * Where a camera mounted on another product (metadata.mounted_on_product_id -
 * the "package" registration flow) should sit: the parent's top-right corner,
 * centered on that edge. Pure/no React - PropertyLayoutBuilder's sync effect
 * re-snaps a mounted camera to this every pass instead of remembering a
 * free-standing position, and this function is what makes that math testable
 * without mounting the whole builder.
 */
export function computeMountPosition(
  parent: { x: number; y: number; width: number },
  camera: { width: number; depth: number }
): { x: number; y: number } {
  return {
    x: parent.x + parent.width - camera.width / 2,
    y: parent.y - camera.depth / 2,
  };
}
