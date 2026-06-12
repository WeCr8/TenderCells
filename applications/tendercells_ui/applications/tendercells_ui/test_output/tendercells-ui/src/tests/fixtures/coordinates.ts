/**
 * Test fixtures for CNC/GRBL coordinate systems
 */

export type CoordinateSystem = 'G54' | 'G55' | 'G56' | 'G57' | 'G58' | 'G59';

export interface Position {
  x: number;
  y: number;
  z: number;
}

export interface MachineStatus {
  state: 'Idle' | 'Run' | 'Hold' | 'Jog' | 'Alarm' | 'Door' | 'Check' | 'Home' | 'Sleep';
  position: {
    work: Position;
    machine: Position;
  };
  coordinateSystem: CoordinateSystem;
  feedRate: number;
  spindleSpeed: number;
  bufferState: {
    available: number;
    planned: number;
  };
}

export const mockPositions: Record<string, Position> = {
  home: { x: 0, y: 0, z: 0 },
  center: { x: 100, y: 100, z: 50 },
  corner1: { x: 0, y: 0, z: 25 },
  corner2: { x: 200, y: 0, z: 25 },
  corner3: { x: 200, y: 200, z: 25 },
  corner4: { x: 0, y: 200, z: 25 },
  elevated: { x: 100, y: 100, z: 100 },
};

export const mockCoordinateSystems: CoordinateSystem[] = ['G54', 'G55', 'G56', 'G57', 'G58', 'G59'];

export const mockMachineStatuses: MachineStatus[] = [
  {
    state: 'Idle',
    position: {
      work: mockPositions.center,
      machine: mockPositions.center,
    },
    coordinateSystem: 'G54',
    feedRate: 1000,
    spindleSpeed: 0,
    bufferState: {
      available: 127,
      planned: 0,
    },
  },
  {
    state: 'Run',
    position: {
      work: mockPositions.corner1,
      machine: mockPositions.corner1,
    },
    coordinateSystem: 'G55',
    feedRate: 500,
    spindleSpeed: 10000,
    bufferState: {
      available: 100,
      planned: 27,
    },
  },
  {
    state: 'Hold',
    position: {
      work: mockPositions.elevated,
      machine: mockPositions.elevated,
    },
    coordinateSystem: 'G54',
    feedRate: 0,
    spindleSpeed: 0,
    bufferState: {
      available: 127,
      planned: 0,
    },
  },
];

export const mockGRBLCommands = {
  status: '?',
  home: '$H',
  unlock: '$X',
  reset: 0x18, // Ctrl-X
  getSettings: '$$',
  getParameters: '$#',
  setCoordinateSystem: (system: CoordinateSystem) => system,
  move: (x?: number, y?: number, z?: number) => {
    const parts: string[] = [];
    if (x !== undefined) parts.push(`X${x}`);
    if (y !== undefined) parts.push(`Y${y}`);
    if (z !== undefined) parts.push(`Z${z}`);
    return `G0 ${parts.join(' ')}`;
  },
  setFeedRate: (rate: number) => `F${rate}`,
};

export const mockGRBLResponses = {
  ok: 'ok',
  error: 'error:1',
  alarm: 'ALARM:1',
  status: '<Idle|MPos:100.000,100.000,50.000|FS:1000,0|WCO:0.000,0.000,0.000>',
  settings: [
    '$0=10',
    '$1=25',
    '$2=0',
    '$3=10',
    '$4=0',
    '$5=0',
    '$6=0',
  ],
};

export const mockHomingSequence = [
  { x: 0, y: 0, z: 0 },
  { x: 0, y: 0, z: 10 },
  { x: 0, y: 0, z: 0 },
];





