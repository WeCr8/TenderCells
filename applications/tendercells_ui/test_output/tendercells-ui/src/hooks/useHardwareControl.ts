// useHardwareControl.ts
// Hook for controlling Chicken Tender hardware via MQTT bridge
// Generated with qwen2.5-coder via Ollama (port 18789)

import { useState, useCallback } from 'react';

interface HardwareControlState {
  isLoading: boolean;
  error: string | null;
  success: boolean;
}

const API_BASE = 'http://localhost:4000/api/mqtt';

export const useHardwareControl = (deviceId: string) => {
  const [state, setState] = useState<HardwareControlState>({
    isLoading: false,
    error: null,
    success: false,
  });

  const sendCommand = useCallback(
    async (endpoint: string, body: Record<string, any> = {}) => {
      setState({ isLoading: true, error: null, success: false });
      try {
        const response = await fetch(`${API_BASE}/devices/${deviceId}/${endpoint}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });

        if (!response.ok) {
          throw new Error(`API error: ${response.statusText}`);
        }

        const data = await response.json();
        setState({ isLoading: false, error: null, success: true });
        return data;
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        setState({ isLoading: false, error: errorMsg, success: false });
        throw error;
      }
    },
    [deviceId]
  );

  return {
    ...state,
    // Hardware control methods
    openDoor: () => sendCommand('door', { state: 'open' }),
    closeDoor: () => sendCommand('door', { state: 'close' }),
    dispenseFeed: (amount: number) => sendCommand('feed', { amount }),
    startCleaning: () => sendCommand('clean', { action: 'start' }),
    stopCleaning: () => sendCommand('clean', { action: 'stop' }),
    controlArm: (joints: number[], speed = 0.5) =>
      sendCommand('arm', { joints, speed }),
    emergencyStop: () => sendCommand('estop'),
  };
};
