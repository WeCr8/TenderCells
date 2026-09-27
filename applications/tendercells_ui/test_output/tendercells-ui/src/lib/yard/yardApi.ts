// yardApi.ts - express-api calls for station flags and the weed patrol robot.
// Every hardware call goes through a confirm dialog in the UI first (CLAUDE.md).
import { MQTT_API_BASE, apiErrorMessage, hardwareAuthHeaders } from '../api/hardwareApi';
import type { WeedRobotState, YardEvent } from './yardTypes';

export interface Presence { online: boolean; lastSeen: number; since: number; stale: boolean }

/** Command result: acked=false means sent but the device has not confirmed yet. */
export interface CommandResult { acked: boolean; message?: string }

const url = (deviceId: string, path: string) => `${MQTT_API_BASE}/devices/${encodeURIComponent(deviceId)}/${path}`;

async function post(deviceId: string, path: string, body: Record<string, unknown> = {}): Promise<CommandResult> {
  const res = await fetch(url(deviceId, path), { method: 'POST', headers: await hardwareAuthHeaders(), body: JSON.stringify(body) });
  if (!res.ok) throw new Error(await apiErrorMessage(res));
  const data = (await res.json().catch(() => ({}))) as { acked?: boolean; message?: string };
  return { acked: !!data.acked, message: data.message };
}

/**
 * Station flags + presence for one device.
 *
 * @param deviceId - Device id (e.g. ct_001)
 * @returns Events newest first and whether the device is online
 */
export async function fetchYardEvents(deviceId: string): Promise<{ events: YardEvent[]; presence: Presence }> {
  const res = await fetch(url(deviceId, 'events'), { headers: await hardwareAuthHeaders() });
  if (!res.ok) throw new Error(await apiErrorMessage(res));
  const data = (await res.json()) as { events?: YardEvent[]; presence?: Presence };
  return { events: data.events ?? [], presence: data.presence ?? { online: false, lastSeen: 0, since: 0, stale: true } };
}

/** Mark a flag handled (eggs picked up); the device clears it. */
export const ackYardEvent = (deviceId: string, eventId: string) => post(deviceId, `events/${encodeURIComponent(eventId)}/ack`);

/** Start 1-10 detection passes over the bed (robot motion). */
export const startWeedPass = (deviceId: string, passes: number) => post(deviceId, 'weeds/pass', { passes });

/** Human approval for one weed: 'aim' points the aiming dot, 'burn' fires the laser (interlocked on the robot). */
export const approveWeed = (deviceId: string, eventId: string, mode: 'aim' | 'burn') =>
  post(deviceId, `weeds/${encodeURIComponent(eventId)}/approve`, { mode });

/** Not a weed / leave it. */
export const rejectWeed = (deviceId: string, eventId: string) => post(deviceId, `weeds/${encodeURIComponent(eventId)}/reject`);

/** Latest tc/{id}/state/weed from the robot, or null if it has not reported. */
export async function fetchWeedState(deviceId: string): Promise<WeedRobotState | null> {
  const res = await fetch(url(deviceId, 'state/weed'), { headers: await hardwareAuthHeaders() });
  if (!res.ok) return null;
  return ((await res.json()) as { data?: WeedRobotState }).data ?? null;
}

/** Trigger the device E-STOP (QoS 2, retained). */
export const sendEstop = (deviceId: string) => post(deviceId, 'estop', { active: true });
