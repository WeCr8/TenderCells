import type { ControlFrame } from './types.js';

export interface MotionPublisher {
  publish(deviceId: string, payload: Record<string, unknown>): boolean;
}

export function neutralMotionPayload(reason: string): Record<string, unknown> {
  return {
    deadman: false,
    vx: 0,
    vy: 0,
    omega: 0,
    speed: 0,
    reason,
    timestamp: Date.now(),
  };
}

export function frameToMqttPayload(frame: ControlFrame): Record<string, unknown> {
  const axes = frame.deadman ? frame.axes : {};
  const toDriveAxis = (value: number | undefined) => Math.round(Math.max(-1, Math.min(1, value ?? 0)) * 100);
  return {
    vx: toDriveAxis(axes.throttle ?? axes.y),
    vy: toDriveAxis(axes.strafe),
    omega: toDriveAxis(axes.steering ?? axes.yaw),
    speed: frame.deadman ? 0.35 : 0,
    sessionId: frame.sessionId,
    profileId: frame.profileId,
    seq: frame.seq,
    deadman: frame.deadman,
    timestamp: Date.now(),
  };
}

/**
 * Adapter for MQTTController.host() without importing the entire controller here.
 * Inject the actual publish function at server composition time.
 */
export function createMotionPublisher(
  mqttPublish: (topic: string, payload: Record<string, unknown>, retain: boolean) => boolean,
): MotionPublisher {
  return {
    publish(deviceId, payload) {
      return mqttPublish(`tc/${deviceId}/cmd/drive`, payload, false);
    },
  };
}
