// deviceService.ts - Device registration and management
import { db } from '../lib/firebase/firebaseApp';
import { collection, doc, setDoc, getDoc, query, where, getDocs, Timestamp } from 'firebase/firestore';

export interface Device {
  id: string;
  // ownerId is the canonical owner field — MUST match the backend claim/ownership
  // gate (mqtt.controller claimDevice + middleware/auth requireDeviceOwner), so a
  // claimed or app-registered device resolves the same on the server. userId kept
  // for back-compat with older docs.
  ownerId: string;
  userId?: string;
  productType: 'chicken-tender' | 'roaming-roost' | 'watchtower' | 'duck-dock' | 'bunny-burrow' | 'goat-guardian' | 'turkey-tower' | 'pigeon-palace';
  nickname: string;
  size: '3x3x5' | '4x4x6' | '6x6x8' | 'custom';
  tier: 'BASE' | 'AUTO' | 'PRO';
  location?: { x: number; y: number };
  animalCount?: number;
  hardwareConnected: boolean;
  simOnly: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  mqttDeviceId: string; // e.g., "ct_001", "wr_001"
}

// Register new device for user
export async function registerDevice(
  userId: string,
  deviceData: Omit<Device, 'id' | 'createdAt' | 'updatedAt' | 'ownerId'> & { ownerId?: string }
): Promise<Device> {
  try {
    // Doc id IS the MQTT device id, so control/telemetry/ownership all key on the
    // same id the board publishes under (tc/{id}/...). Fall back to a generated id
    // only if no mqtt id was supplied.
    const deviceId = deviceData.mqttDeviceId
      || `${deviceData.productType.substring(0, 2)}_${Date.now()}`;
    const now = Timestamp.now();

    const newDevice: Device = {
      ...deviceData,
      id: deviceId,
      ownerId: deviceData.ownerId || userId,  // canonical owner field
      userId,                                  // back-compat
      createdAt: now,
      updatedAt: now,
    };

    // Save to Firestore (merge so a prior unclaimed/claimed doc isn't clobbered)
    await setDoc(doc(db, 'devices', deviceId), newDevice, { merge: true });

    console.log(`✓ Device registered: ${deviceId}`);
    return newDevice;
  } catch (error) {
    console.error('Failed to register device:', error);
    throw error;
  }
}

// Get all devices for user
export async function getUserDevices(userId: string): Promise<Device[]> {
  try {
    // Query the canonical owner field so claimed devices (set by the backend) and
    // app-registered devices both appear for the signed-in user.
    const q = query(collection(db, 'devices'), where('ownerId', '==', userId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => doc.data() as Device);
  } catch (error) {
    console.error('Failed to fetch devices:', error);
    return [];
  }
}

// Get single device by ID
export async function getDevice(deviceId: string): Promise<Device | null> {
  try {
    const snapshot = await getDoc(doc(db, 'devices', deviceId));
    return snapshot.exists() ? (snapshot.data() as Device) : null;
  } catch (error) {
    console.error('Failed to fetch device:', error);
    return null;
  }
}

// Create test device (for hardware testing)
export async function createTestDevice(userId: string): Promise<Device> {
  return registerDevice(userId, {
    userId,
    productType: 'chicken-tender',
    nickname: 'Test Coop - Motor Testing',
    size: '4x4x6',
    tier: 'PRO',
    location: { x: 0, y: 0 },
    animalCount: 0,
    hardwareConnected: true,
    simOnly: false,
    mqttDeviceId: 'ct_test_001',
  });
}

// Create sim-only device (for UI testing without hardware)
export async function createSimDevice(userId: string): Promise<Device> {
  return registerDevice(userId, {
    userId,
    productType: 'chicken-tender',
    nickname: 'Simulation Device',
    size: '4x4x6',
    tier: 'AUTO',
    location: { x: 1, y: 1 },
    animalCount: 6,
    hardwareConnected: false,
    simOnly: true,
    mqttDeviceId: 'ct_sim_001',
  });
}
