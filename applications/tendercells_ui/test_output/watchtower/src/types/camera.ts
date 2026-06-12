export interface CameraFeed {
  id: string
  deviceId: string
  name: string
  position: 'north' | 'east' | 'west'
  streamUrl?: string
  resolution: '1080p' | '720p' | '480p'
  fps: number
  connected: boolean
  lastSeen?: string
  signal?: number
  motionDetection: boolean
  recordingEnabled: boolean
}

export interface PredatorAlert {
  id: string
  type: 'predator' | 'motion' | 'unknown'
  confidence: number
  timestamp: number
  cameraId: string
  cameraPosition: 'north' | 'east' | 'west'
  imageUrl?: string
  description: string
  acknowledged: boolean
  notified: boolean
}

export interface WatchTowerDevice {
  id: string
  name: string
  location: string
  installed: string
  battery: number
  solar: number
  connected: boolean
  lastSeen: number
  cameras: CameraFeed[]
  alerts: PredatorAlert[]
  recordingEnabled: boolean
  storageUsed: number
  storageTotal: number
}
