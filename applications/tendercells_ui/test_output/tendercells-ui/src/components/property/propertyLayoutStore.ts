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
  x: number;
  y: number;
  width: number;
  depth: number;
}

export type PropertyLayoutState = {
  property: PropertyConfig;
  items: PropertyItem[];
};

export const PROPERTY_LAYOUT_STORAGE_KEY = 'tendercells_property_layout_v2';
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

export const OBSTACLE_TYPES: ObstacleType[] = ['tree', 'fence', 'pond', 'rock', 'building', 'garden', 'no-go-zone'];

export const ITEM_COLORS: Record<string, string> = {
  'chicken-tender': '#D4A574',
  'roaming-roost': '#C8B882',
  'duck-dock': '#4A90E2',
  'goat-guardian': '#D0A34E',
  'bunny-burrow': '#B9D7A3',
  'turkey-tower': '#C97D4B',
  'pigeon-palace': '#D6D9C8',
  watchtower: '#8DD47A',
  'rail-module': '#A5B1A9',
  sensor: '#D0A34E',
  tree: '#2F7D32',
  fence: '#8B6F47',
  pond: '#3F8FD2',
  rock: '#777D82',
  building: '#6A5D4D',
  garden: '#4A7C59',
  'no-go-zone': '#C62828',
};

export const DEFAULT_PROPERTY: PropertyConfig = {
  name: 'Home Yard',
  widthFt: 120,
  depthFt: 90,
  gridStepFt: 10,
};

export const DEFAULT_ITEMS: PropertyItem[] = [
  { id: 'item-chicken-tender', kind: 'hardware', name: 'Chicken Tender', type: 'chicken-tender', x: 15, y: 14, width: 14, depth: 12 },
  { id: 'item-roaming-roost', kind: 'hardware', name: 'Roaming Roost', type: 'roaming-roost', x: 62, y: 46, width: 12, depth: 10 },
  { id: 'item-duck-dock', kind: 'hardware', name: 'Duck Dock', type: 'duck-dock', x: 88, y: 42, width: 16, depth: 12 },
  { id: 'item-watchtower', kind: 'hardware', name: 'WatchTower', type: 'watchtower', x: 105, y: 12, width: 7, depth: 7 },
  { id: 'item-tree', kind: 'obstacle', name: 'Oak Tree', type: 'tree', x: 42, y: 18, width: 12, depth: 12 },
  { id: 'item-pond', kind: 'obstacle', name: 'Pond', type: 'pond', x: 84, y: 20, width: 20, depth: 14 },
  { id: 'item-fence', kind: 'obstacle', name: 'Fence Line', type: 'fence', x: 8, y: 72, width: 92, depth: 4 },
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
