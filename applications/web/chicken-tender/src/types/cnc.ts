/**
 * Type definitions for GRBL CNC automation system
 */

export type GRBLState = 'Idle' | 'Run' | 'Hold' | 'Jog' | 'Alarm' | 'Door' | 'Check' | 'Home' | 'Sleep';

export type CoordinateSystem = 'G54' | 'G55' | 'G56' | 'G57' | 'G58' | 'G59';

export interface Position {
  x: number;
  y: number;
  z: number;
}

export interface MachineStatus {
  state: GRBLState;
  position: {
    work: Position;
    machine: Position;
  };
  feedRate: number;
  spindleSpeed: number;
  toolNumber: number;
  coordinateSystem: CoordinateSystem;
  overrides: {
    feed: number;
    rapid: number;
    spindle: number;
  };
  pins: {
    probe: boolean;
    door: boolean;
    hold: boolean;
    softReset: boolean;
    cycleStart: boolean;
  };
  lastUpdate: string;
}

export interface GCodeFile {
  id: string;
  name: string;
  content: string;
  size: number;
  lineCount: number;
  estimatedTime: number;
  material: string;
  toolsRequired: number[];
  boundingBox: {
    min: Position;
    max: Position;
  };
  createdAt: string;
  lastModified: string;
}

export interface JobProgress {
  currentLine: number;
  totalLines: number;
  elapsedTime: number;
  estimatedTimeRemaining: number;
  percentComplete: number;
  currentOperation: string;
}

export interface CNCAlarm {
  code: number;
  message: string;
  description: string;
  severity: 'warning' | 'error' | 'critical';
  timestamp: string;
}

export interface ToolOffset {
  number: number;
  length: number;
  diameter: number;
  description: string;
}

export interface WorkEnvelope {
  min: Position;
  max: Position;
  safeHeight: number;
}

export interface CNCSettings {
  units: 'mm' | 'inch';
  maxFeedRate: Position;
  maxSpindleSpeed: number;
  acceleration: Position;
  stepResolution: Position;
  workEnvelope: WorkEnvelope;
  homingEnabled: boolean;
  softLimitsEnabled: boolean;
}