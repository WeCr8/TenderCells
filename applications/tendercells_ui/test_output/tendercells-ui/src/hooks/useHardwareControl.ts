// useHardwareControl.ts
// Hook for controlling Tender Cells hardware via the express-api MQTT bridge.
//
// Central wiring layer for every control UI (door, drive, relay/light, gantry, arm).
// - Sends the Firebase ID token as a Bearer header so a logged-in instance enforces
//   ownership (no-op in demo/LAN mode where there is no signed-in user).
// - Endpoints + payloads match the express-api routes/schemas exactly.
// - Exposes live arm/gantry sub-state getters for sliders + 3D viewport.

import { useCallback, useState } from 'react';
import { HARDWARE_API_CONFIGURED, MQTT_API_BASE as API_BASE, hardwareAuthHeaders as authHeaders } from '../lib/api/hardwareApi';

interface HardwareControlState {
  isLoading: boolean;
  error: string | null;
  success: boolean;
}

export const useHardwareControl = (deviceId: string) => {
  const [state, setState] = useState<HardwareControlState>({
    isLoading: false,
    error: null,
    success: false,
  });

  const sendCommand = useCallback(
    async (endpoint: string, body: Record<string, unknown> = {}) => {
      setState({ isLoading: true, error: null, success: false });
      try {
        if (!HARDWARE_API_CONFIGURED) throw new Error('Hardware controls are not connected. Configure the TenderCells hardware API for this network.');
        const response = await fetch(`${API_BASE}/devices/${deviceId}/${endpoint}`, {
          method: 'POST',
          headers: await authHeaders(),
          body: JSON.stringify(body),
        });
        if (!response.ok) {
          const msg = await response.json().catch(() => ({}));
          throw new Error(msg.error || `API error: ${response.statusText}`);
        }
        const data = await response.json();
        setState({ isLoading: false, error: null, success: true });
        return data;
      } catch (error) {
        const errorMsg = error instanceof TypeError
          ? 'The hardware service could not be reached. Confirm this device is on the same network and the TenderCells bridge is running.'
          : error instanceof Error ? error.message : 'Unknown error';
        setState({ isLoading: false, error: errorMsg, success: false });
        throw error;
      }
    },
    [deviceId],
  );

  // Live sub-state for the UI (arm joint angles / gantry position).
  const getSubState = useCallback(
    async (sub: 'arm' | 'gantry') => {
      const res = await fetch(`${API_BASE}/devices/${deviceId}/state/${sub}`, {
        headers: await authHeaders(),
      });
      if (!res.ok) return null;
      return (await res.json()).data ?? null;
    },
    [deviceId],
  );

  return {
    ...state,

    // Door (servo)
    openDoor: () => sendCommand('door', { state: 'open' }),
    closeDoor: () => sendCommand('door', { state: 'close' }),

    // Drive (Roaming Roost differential)
    drive: (dir: 'forward' | 'back' | 'left' | 'right' | 'stop', speed = 0.5) =>
      sendCommand('drive', { dir, speed }),
    stopDrive: () => sendCommand('drive', { dir: 'stop' }),

    // Relay / load (heat lamp, water pump, fan, grow light, valve)
    setRelay: (on: boolean) => sendCommand('light', { on }),

    // Camera-node feature configuration. The API validates and publishes this to
    // tc/{deviceId}/cmd/camera/config; unsupported board features never reach here.
    configureCamera: (enabled: string[]) => sendCommand('camera/config', { enabled }),

    // Feed (calibrated dispenser, grams)
    dispenseFeed: (amount: number) => sendCommand('feed', { amount }),

    // Water (waterer is an optional, separately-registered product module - see
    // ProductRegistrationModal's 'waterer' entry - so a device without one simply never
    // has these called; the backend MQTT bridge owns the actual valve/pump safety path,
    // same as every other control below).
    primeWater: () => sendCommand('water', { action: 'prime' }),
    stopWater: () => sendCommand('water', { action: 'stop' }),
    setWaterValve: (open: boolean) => sendCommand('water', { valve: open }),

    // Cleaning
    startCleaning: () => sendCommand('clean', { action: 'start' }),
    stopCleaning: () => sendCommand('clean', { action: 'stop' }),

    // Gantry (GRBL): coordinate move or real-time control
    moveGantry: (x: number, y: number, speed = 0.5) => sendCommand('gantry', { x, y, speed }),
    gantryHome: () => sendCommand('gantry', { cmd: 'home' }),
    gantryUnlock: () => sendCommand('gantry', { cmd: 'unlock' }),
    gantryHold: () => sendCommand('gantry', { cmd: 'hold' }),
    gantryResume: () => sendCommand('gantry', { cmd: 'resume' }),
    gantryStop: () => sendCommand('gantry', { cmd: 'stop' }),

    // 6DOF arm — joints must be an array of 6 angles (matches the backend schema)
    controlArm: (joints: number[], speed = 0.5) => sendCommand('arm', { joints, speed }),

    // Hugging Face LeRobot policy on the arm (arm service runs lerobot-rollout live,
    // lerobot-eval in simulation). Same safety gate as arm motion; stop is never gated.
    runPolicy: (repoId: string, task: string, durationS = 30, simEnv?: string) =>
      sendCommand('policy', { repo_id: repoId, task, duration_s: durationS, ...(simEnv ? { sim_env: simEnv } : {}) }),
    stopPolicy: () => sendCommand('policy/stop'),

    // Emergency stop — the dedicated estop endpoint (QoS 2, retained)
    emergencyStop: () => sendCommand('estop'),
    // Clear a latched E-STOP (replaces the retained stop). UI must confirm first.
    clearEmergencyStop: () => sendCommand('estop/clear'),

    // Live state for sliders / 3D viewport
    getArmState: () => getSubState('arm'),
    getGantryState: () => getSubState('gantry'),

    // Register this device to the signed-in account (first-claim-wins).
    claim: () => sendCommand('claim'),
  };
};

// List devices heard on the network that nobody owns yet (for a claim picker).
export async function listUnclaimedDevices(): Promise<Array<{ id: string }>> {
  try {
    const res = await fetch(`${API_BASE}/unclaimed`, { headers: await authHeaders() });
    if (!res.ok) return [];
    return (await res.json()).devices ?? [];
  } catch {
    return [];
  }
}
