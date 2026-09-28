// hardwareApi.ts - one base URL + auth headers for every express-api (MQTT bridge) call.
//
// FIX(2026-09-27): Schedules, Setup Wizard and Diagnostics hard-coded
// http://localhost:3001 while the API listens on PORT 4000 (and the control hook
// used 4000), so "Run now" and routines always failed; Schedules also sent no
// Firebase token, so an auth-enabled API rejected them with 401.
import { auth } from '../firebase/firebaseApp';

export const HARDWARE_API_CONFIGURED = Boolean(import.meta.env.VITE_MQTT_API_BASE_URL);

/** express-api MQTT routes base, e.g. http://192.168.1.50:4000/api/mqtt. */
export const MQTT_API_BASE: string =
  import.meta.env.VITE_MQTT_API_BASE_URL || 'http://localhost:4000/api/mqtt';

/** Origin of the express-api server (for display and /health). */
export const HARDWARE_API_ORIGIN: string = (() => {
  try { return new URL(MQTT_API_BASE).origin; } catch { return MQTT_API_BASE; }
})();

/**
 * JSON headers plus the signed-in user's Firebase ID token, when there is one.
 * In demo/LAN mode (no user) only the content type is sent.
 *
 * @returns Headers for fetch()
 */
export async function hardwareAuthHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  try {
    const token = await auth.currentUser?.getIdToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  } catch {
    /* no auth available - demo mode */
  }
  return headers;
}

/**
 * Read the API's error text so safety refusals (E-STOP, chickens present) reach the user.
 *
 * @param res - Non-OK response
 * @returns The server's `error` message or the HTTP status
 */
export async function apiErrorMessage(res: Response): Promise<string> {
  const body = await res.json().catch(() => ({} as { error?: string }));
  return (body as { error?: string }).error || `API ${res.status}`;
}
