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
  | 'sensor';
export type ObstacleType = 'tree' | 'fence' | 'pond' | 'rock' | 'building' | 'garden' | 'no-go-zone';
export type ItemShape = 'rect' | 'circle' | 'hexagon' | 'octagon' | 'diamond' | 'rounded';

export interface PropertyConfig {
  name: string;
  widthFt: number;
  depthFt: number;
  gridStepFt: number;
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
}

export type PropertyLayoutState = {
  property: PropertyConfig;
  items: PropertyItem[];
};

export const PROPERTY_LAYOUT_STORAGE_KEY = 'tendercells_property_layout_v4';
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
];

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
};

export const OBSTACLE_TYPES: ObstacleType[] = ['tree', 'fence', 'pond', 'rock', 'building', 'garden', 'no-go-zone'];

// Default shapes per obstacle type
export const OBSTACLE_DEFAULT_SHAPES: Partial<Record<ObstacleType, ItemShape>> = {
  tree: 'circle',
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
  tree:             '#2F7D32',
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
};

export const DEFAULT_ITEMS: PropertyItem[] = [
  // Dimensions and shapes match PRODUCT_DIMENSIONS — real product footprints
  { id: 'item-chicken-tender', kind: 'hardware', name: 'Chicken Tender', type: 'chicken-tender', shape: 'rect',    x: 10, y: 8,  width: 4,  depth: 4  },
  { id: 'item-roaming-roost',  kind: 'hardware', name: 'Roaming Roost',  type: 'roaming-roost',  shape: 'octagon', x: 40, y: 28, width: 5,  depth: 5  },
  { id: 'item-duck-dock',      kind: 'hardware', name: 'Duck Dock',      type: 'duck-dock',      shape: 'rect',    x: 58, y: 26, width: 4,  depth: 4  },
  { id: 'item-watchtower',     kind: 'hardware', name: 'WatchTower',     type: 'watchtower',     shape: 'hexagon', x: 70, y: 6,  width: 3,  depth: 3  },
  { id: 'item-tree',           kind: 'obstacle', name: 'Oak Tree',       type: 'tree',           shape: 'circle',  x: 28, y: 10, width: 8,  depth: 8  },
  { id: 'item-pond',           kind: 'obstacle', name: 'Pond',           type: 'pond',           shape: 'rounded', x: 52, y: 12, width: 14, depth: 10 },
  { id: 'item-fence',          kind: 'obstacle', name: 'Fence Line',     type: 'fence',          shape: 'rect',    x: 4,  y: 48, width: 60, depth: 3  },
];

export const loadPropertyLayout = (): PropertyLayoutState => {
  try {
    const saved = localStorage.getItem(PROPERTY_LAYOUT_STORAGE_KEY);
    if (!saved) return { property: DEFAULT_PROPERTY, items: DEFAULT_ITEMS };
    const parsed = JSON.parse(saved) as Partial<PropertyLayoutState>;
    return {
      property: parsed.property || DEFAULT_PROPERTY,
      items: Array.isArray(parsed.items) ? parsed.items : DEFAULT_ITEMS,
    };
  } catch {
    return { property: DEFAULT_PROPERTY, items: DEFAULT_ITEMS };
  }
};

export const savePropertyLayout = (state: PropertyLayoutState) => {
  localStorage.setItem(PROPERTY_LAYOUT_STORAGE_KEY, JSON.stringify(state));
  window.dispatchEvent(new CustomEvent<PropertyLayoutState>(PROPERTY_LAYOUT_EVENT, { detail: state }));
};
