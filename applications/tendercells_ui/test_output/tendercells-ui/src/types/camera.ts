// camera.ts - Coop camera management types

export type CameraLocation = 'main-feed' | 'roost' | 'nest-box' | 'water' | 'perch' | 'pen-west' | 'pen-east' | 'pen-north';

export interface CameraFeed {
  id: string;
  deviceId: string;
  name: string;
  location: CameraLocation;
  streamUrl?: string;
  // Optional. firmware/camera-node now reports its target `fps` (and `frameSize`,
  // e.g. "VGA") in the heartbeat and the Pi node reports `fps` + `resolution`
  // ("720p"); older firmware reports neither. Omit rather than guess;
  // CameraFeedViewer shows "Not reporting" instead of a fabricated value.
  resolution?: '1080p' | '720p' | '480p';
  fps?: number;
  connected: boolean;
  lastSeen?: string;
  signal?: number; // WiFi signal -100 to 0 dBm
  latitude?: number;
  longitude?: number;
  // Timing health from the node's heartbeat (see docs/CAMERA_TIMING.md).
  clockSynced?: boolean;
  statusUrl?: string;
}

export interface CameraSetup {
  cameraId: string;
  location: CameraLocation;
  angle?: number; // degrees 0-360
  tilt?: number; // degrees -90 to 90
  resolution: '1080p' | '720p' | '480p';
  fps: number;
  motionDetection: boolean;
  recordingEnabled: boolean;
}

export const CAMERA_LOCATIONS: Record<CameraLocation, string> = {
  'main-feed': 'Main Feed Area',
  'roost': 'Roost/Sleeping Area',
  'nest-box': 'Nest Box',
  'water': 'Water Station',
  'perch': 'Perch Area',
  'pen-west': 'Pen - West',
  'pen-east': 'Pen - East',
  'pen-north': 'Pen - North',
};

export const WATCHTOWER_CAMERA_LOCATIONS: CameraLocation[] = ['pen-west', 'pen-north', 'pen-east'];
