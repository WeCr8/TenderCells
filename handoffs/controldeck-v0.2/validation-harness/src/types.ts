export type AxisName =
  | 'x' | 'y' | 'z'
  | 'throttle' | 'steering' | 'strafe'
  | 'yaw' | 'pitch' | 'roll'
  | 'leftTrack' | 'rightTrack';

export type InputSource = 'touch' | 'gamepad' | 'keyboard' | 'hid' | 'ble' | 'serial' | 'sim';

export interface RawInput {
  source: InputSource;
  axes: Partial<Record<AxisName, number>>;
  buttons?: Record<string, boolean>;
  active: boolean;
  timestampMs: number;
}

export interface ControlFrame {
  v: 1;
  sessionId: string;
  deviceId: string;
  profileId: string;
  seq: number;
  sentAtMs: number;
  deadman: boolean;
  axes: Partial<Record<AxisName, number>>;
  actions?: string[];
}

export type Kinematics =
  | 'differential'
  | 'tank'
  | 'ackermann'
  | 'mecanum'
  | 'drone'
  | 'gantry'
  | 'arm';

export interface DeviceControlCapabilities {
  motion: boolean;
  kinematics?: Kinematics;
  camera?: boolean;
  telemetry?: boolean;
  estop?: boolean;
  maxCommandHz?: number;
  allowedProfiles: string[];
}

export interface ControlProfile {
  id: string;
  label: string;
  kinematics: Kinematics;
  inputAxes: AxisName[];
  defaultRateHz: number;
  deadzone: number;
  expo: number;
  speedLimit: number;
}

export interface LinkMetrics {
  state: 'idle' | 'connecting' | 'connected' | 'degraded' | 'closed' | 'error';
  lastSendAtMs?: number;
  lastAckAtMs?: number;
  rttMs?: number;
  droppedFrames?: number;
}
