// apiKeysService.ts - robot / hub API keys (Settings → Robot & hub API keys).
// Backed by the createApiKey / listApiKeys / revokeApiKey callables (functions/src/deviceApi.ts).
// The plaintext key is returned once by createApiKey and never stored in the app.
import firebaseApp, { FIREBASE_ENABLED } from '../lib/firebase/firebaseApp';

export const API_KEY_SCOPES = ['device:telemetry', 'device:commands', 'schedules:read'] as const;
export type ApiKeyScope = (typeof API_KEY_SCOPES)[number];

export const SCOPE_LABELS: Record<ApiKeyScope, string> = {
  'device:telemetry': 'Send and read telemetry',
  'device:commands': 'Send commands (door, feed, drive …) and receive scheduled commands',
  'schedules:read': 'Read schedules',
};

export interface ApiKeyView {
  keyId: string;
  name: string;
  scopes: ApiKeyScope[];
  deviceId: string | null;
  createdAt: number;
  expiresAt: number | null;
  revokedAt: number | null;
  lastUsedAt: number | null;
  preview: string;
}

export interface NewApiKey { name: string; scopes: ApiKeyScope[]; deviceId?: string; expiresInDays?: number }

/** Key management needs Firebase (a signed-in account). */
export const API_KEYS_AVAILABLE = FIREBASE_ENABLED;

async function call<T>(name: string, data: Record<string, unknown>): Promise<T> {
  if (!firebaseApp) throw new Error('Sign-in is not configured in this build, so API keys are unavailable.');
  const { getFunctions, httpsCallable } = await import('firebase/functions');
  const result = await httpsCallable(getFunctions(firebaseApp), name)(data);
  return result.data as T;
}

/** Key status for display. */
export function keyStatus(k: ApiKeyView, now = Date.now()): 'active' | 'revoked' | 'expired' {
  if (k.revokedAt) return 'revoked';
  if (k.expiresAt && k.expiresAt <= now) return 'expired';
  return 'active';
}

export const apiKeysService = {
  list: () => call<{ keys: ApiKeyView[] }>('listApiKeys', {}).then((r) => r.keys),
  create: (req: NewApiKey) => call<ApiKeyView & { key: string }>('createApiKey', { ...req }),
  revoke: (keyId: string) => call<{ keyId: string; revoked: boolean }>('revokeApiKey', { keyId }),
};
