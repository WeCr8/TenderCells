// farmbotCloud.ts - talk to FarmBot's hosted service (my.farm.bot) from the OS.
//
// Option 2 of the FarmBot review (2026-09-27): instead of forking FarmBot's web
// app, gardens connect to FarmBot Inc's always-current instance. REST for sign-in
// and the sequence list; live status + commands go over MQTT via FarmBot's own
// MIT-licensed `farmbot` client (see FarmBotLivePanel).
//
// Contract (FarmBot/Farmbot-Web-App, app/controllers/api/tokens_controller.rb,
// app/lib/session_token.rb):
//   POST /api/tokens {user:{email,password}}
//     -> {token:{encoded, unencoded:{bot, mqtt_ws, exp, ...}}, user}
//   Tokens last 60 days. /api/* allows any origin (CORS "*").
//
// Security: the password is sent to FarmBot only and never stored. The token
// grants full control of the user's FarmBot, so it lives in sessionStorage (gone
// when the tab closes) and is removed on Disconnect.

export const FARMBOT_CLOUD_URL = 'https://my.farm.bot';

export interface FarmBotToken {
  encoded: string;
  unencoded: { bot: string; mqtt_ws: string; exp: number; [key: string]: unknown };
}

export interface FarmBotSequence {
  id: number;
  name: string;
}

export interface FarmBotPosition {
  x: number | null;
  y: number | null;
  z: number | null;
}

/** Window event carrying a garden's live FarmBot tool position for the 3D twin. */
export const FARMBOT_POSITION_EVENT = 'tc-farmbot-position';
export interface FarmBotPositionDetail {
  itemId: string;
  position: FarmBotPosition | null; // null = disconnected, hide the marker
}

/** Latest position per garden item, so a viewport mounted later can catch up. */
export const latestFarmBotPositions = new Map<string, FarmBotPosition>();

/**
 * Publish a garden's live tool position (or null to clear it).
 *
 * @param itemId   - Property-layout item the FarmBot is linked to
 * @param position - Tool position in mm, or null when disconnected
 */
export function publishFarmBotPosition(itemId: string, position: FarmBotPosition | null): void {
  if (position) latestFarmBotPositions.set(itemId, position);
  else latestFarmBotPositions.delete(itemId);
  window.dispatchEvent(new CustomEvent<FarmBotPositionDetail>(FARMBOT_POSITION_EVENT, { detail: { itemId, position } }));
}

/** Readable text for FarmBot API failures. */
async function farmbotError(res: Response): Promise<string> {
  const body = await res.json().catch(() => ({})) as Record<string, unknown>;
  const detail = Object.values(body).filter((v) => typeof v === 'string').join(' ');
  if (res.status === 401 || res.status === 422) return detail || 'The FarmBot email or password is incorrect.';
  if (res.status === 403 || res.status === 451) {
    return `${detail || 'FarmBot needs something first.'} Sign in once at my.farm.bot to verify your email and accept FarmBot's terms, then try again.`;
  }
  return detail || `FarmBot returned an error (${res.status}).`;
}

/**
 * Sign in to FarmBot and get an API token. The password is not kept.
 *
 * @param email    - FarmBot account email
 * @param password - FarmBot account password (sent to FarmBot only)
 * @returns The session token FarmBot issued
 * @throws {Error} with a user-facing message on bad credentials / unaccepted terms / network failure
 */
export async function requestFarmBotToken(email: string, password: string): Promise<FarmBotToken> {
  let res: Response;
  try {
    res = await fetch(`${FARMBOT_CLOUD_URL}/api/tokens`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user: { email, password } }),
    });
  } catch {
    throw new Error('Could not reach my.farm.bot. Check your connection and try again.');
  }
  if (!res.ok) throw new Error(await farmbotError(res));
  const data = await res.json() as { token?: FarmBotToken };
  if (!data.token?.encoded || !data.token.unencoded?.mqtt_ws) throw new Error('FarmBot sent an unexpected sign-in response.');
  return data.token;
}

/**
 * List the user's saved FarmBot sequences.
 *
 * @param token - Encoded API token
 * @returns Sequences sorted by name
 * @throws {Error} when FarmBot rejects the request
 */
export async function listFarmBotSequences(token: string): Promise<FarmBotSequence[]> {
  const res = await fetch(`${FARMBOT_CLOUD_URL}/api/sequences`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(await farmbotError(res));
  const rows = await res.json() as Array<{ id: number; name: string }>;
  return rows.map(({ id, name }) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name));
}

const sessionKey = (itemId: string) => `tc_farmbot_session_${itemId}`;

/** Token for this garden in this tab, if still valid. */
export function loadFarmBotSession(itemId: string): FarmBotToken | null {
  try {
    const token = JSON.parse(sessionStorage.getItem(sessionKey(itemId)) || 'null') as FarmBotToken | null;
    if (!token?.encoded || !token.unencoded?.exp) return null;
    if (token.unencoded.exp * 1000 < Date.now()) { sessionStorage.removeItem(sessionKey(itemId)); return null; }
    return token;
  } catch {
    return null;
  }
}

/** Remember the token for this tab only. */
export function saveFarmBotSession(itemId: string, token: FarmBotToken): void {
  try { sessionStorage.setItem(sessionKey(itemId), JSON.stringify(token)); } catch { /* storage disabled */ }
}

/** Forget the token (Disconnect). */
export function clearFarmBotSession(itemId: string): void {
  try { sessionStorage.removeItem(sessionKey(itemId)); } catch { /* storage disabled */ }
}
