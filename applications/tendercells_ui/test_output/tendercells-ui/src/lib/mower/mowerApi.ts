// mowerApi.ts - hub (express-api) calls for linked robot mowers. The Home Assistant token
// never reaches the browser: the hub holds it (HA_URL / HA_TOKEN) and calls HA itself.
// Every start goes through a confirm dialog in the UI first (CLAUDE.md).
import { MQTT_API_BASE, apiErrorMessage, hardwareAuthHeaders } from "../api/hardwareApi";
import type { MowerAction, MowerLink, MowerView } from "./mower";

async function call<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${MQTT_API_BASE}${path}`, { ...init, headers: { ...(await hardwareAuthHeaders()), ...(init.headers ?? {}) } });
  if (!res.ok) throw new Error(await apiErrorMessage(res));
  return (await res.json()) as T;
}

/** Linked mowers the signed-in owner can see, and whether the hub has Home Assistant set up. */
export const fetchMowers = () => call<{ homeAssistant: boolean; mowers: MowerView[] }>("/mowers");

/** lawn_mower entities on the hub's Home Assistant. */
export const fetchHaMowerEntities = () =>
  call<{ entities: { entityId: string; name: string; state: string }[] }>("/mowers/home-assistant/entities");

export type NewMower = Pick<MowerLink, "name" | "adapter" | "guardHabitats" | "noAnimalsConfirmed" | "quietHours">
  & { entityId?: string; batteryEntityId?: string; deviceId?: string };

/** Link a mower (claimed for the caller). */
export const linkMower = (m: NewMower) => call<MowerView & { success: boolean }>("/mowers", { method: "POST", body: JSON.stringify(m) });

/** Change guarded coops, quiet hours, name or entities. */
export const updateMower = (deviceId: string, patch: Partial<NewMower>) =>
  call<{ link: MowerLink }>(`/devices/${encodeURIComponent(deviceId)}/mower`, { method: "PUT", body: JSON.stringify(patch) });

export const unlinkMower = (deviceId: string) =>
  call<{ success: boolean }>(`/devices/${encodeURIComponent(deviceId)}/mower`, { method: "DELETE" });

/** start (interlocked on the hub) | pause | dock. */
export const commandMower = (deviceId: string, action: MowerAction) =>
  call<{ success: boolean; acked?: boolean; message?: string }>(`/devices/${encodeURIComponent(deviceId)}/mower/command`,
    { method: "POST", body: JSON.stringify({ action }) });

/** E-STOP: the hub stops the mower and sends it home. */
export const estopMower = (deviceId: string) =>
  call<{ success: boolean }>(`/devices/${encodeURIComponent(deviceId)}/estop`, { method: "POST", body: JSON.stringify({ active: true }) });
