// mowerApi.ts - hub (express-api) calls for linked robot mowers. Vendor credentials (Home
// Assistant token, Husqvarna / GARDENA app key + secret, Mammotion client id + secret) never
// reach the browser: the hub holds them and calls the vendor itself.
// Every start goes through a confirm dialog in the UI first (CLAUDE.md).
import { MQTT_API_BASE, apiErrorMessage, hardwareAuthHeaders } from "../api/hardwareApi";
import type { MowerAction, MowerLink, MowerSettingsPatch, MowerView, StartOptions } from "./mower";

async function call<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${MQTT_API_BASE}${path}`, { ...init, headers: { ...(await hardwareAuthHeaders()), ...(init.headers ?? {}) } });
  if (!res.ok) throw new Error(await apiErrorMessage(res));
  return (await res.json()) as T;
}

/** Which connections the hub is set up for. */
export interface VendorStatus { homeAssistant: boolean; husqvarna: boolean; gardena: boolean; mammotion: boolean }

/** Linked mowers the signed-in owner can see, and which connections the hub has. */
export const fetchMowers = () => call<VendorStatus & { mowers: MowerView[] }>("/mowers");

export type Vendor = "home-assistant" | "husqvarna" | "gardena" | "mammotion";

/** Mowers on the owner's vendor account / Home Assistant, for the link picker. */
export const discoverMowers = (vendor: Vendor) =>
  call<{ mowers: { id: string; name: string; locationId?: string; detail?: string }[] }>(`/mowers/vendors/${vendor}/discover`);

export type NewMower = Pick<MowerLink, "name" | "adapter" | "guardHabitats" | "noAnimalsConfirmed" | "quietHours">
  & { entityId?: string; batteryEntityId?: string; vendorId?: string; locationId?: string; deviceId?: string; autoResume?: boolean };

/** Link a mower (claimed for the caller). */
export const linkMower = (m: NewMower) => call<MowerView & { success: boolean }>("/mowers", { method: "POST", body: JSON.stringify(m) });

/** Change guarded coops, quiet hours, auto-resume, name or entities. */
export const updateMower = (deviceId: string, patch: Partial<NewMower>) =>
  call<{ link: MowerLink }>(`/devices/${encodeURIComponent(deviceId)}/mower`, { method: "PUT", body: JSON.stringify(patch) });

export const unlinkMower = (deviceId: string) =>
  call<{ success: boolean }>(`/devices/${encodeURIComponent(deviceId)}/mower`, { method: "DELETE" });

/** start (interlocked on the hub; basic or advanced options) | resume_schedule | pause | park_until_next_schedule | dock. */
export const commandMower = (deviceId: string, action: MowerAction, opts: StartOptions = {}) =>
  call<{ success: boolean; acked?: boolean; message?: string }>(`/devices/${encodeURIComponent(deviceId)}/mower/command`,
    { method: "POST", body: JSON.stringify({ action, ...opts }) });

/** Cutting height, headlight, schedule, stay-out zones, confirm error - what the mower's own app changes. */
export const updateMowerSettings = (deviceId: string, patch: MowerSettingsPatch) =>
  call<{ success: boolean; message?: string }>(`/devices/${encodeURIComponent(deviceId)}/mower/settings`,
    { method: "POST", body: JSON.stringify(patch) });

/** E-STOP: the hub stops the mower and holds it at home. */
export const estopMower = (deviceId: string) =>
  call<{ success: boolean }>(`/devices/${encodeURIComponent(deviceId)}/estop`, { method: "POST", body: JSON.stringify({ active: true }) });
