import { describe, expect, it } from 'vitest';
import { API_KEY_SCOPES, keyStatus, type ApiKeyView } from '../../services/apiKeysService';
import { browserTimeZone, lastRunMillis } from '../../services/schedulesService';

const key = (over: Partial<ApiKeyView> = {}): ApiKeyView => ({
  keyId: 'abcdefghijkl', name: 'coop', scopes: ['device:telemetry'], deviceId: null,
  createdAt: 1, expiresAt: null, revokedAt: null, lastUsedAt: null, preview: 'tck_abcdefghijkl_…', ...over,
});

describe('API keys (Settings)', () => {
  it('uses the same scopes as functions/src/apiKeyCore.ts', () => {
    expect([...API_KEY_SCOPES]).toEqual(['device:telemetry', 'device:commands', 'schedules:read']);
  });
  it('reports revoked before expired, and active otherwise', () => {
    expect(keyStatus(key(), 10)).toBe('active');
    expect(keyStatus(key({ expiresAt: 5 }), 10)).toBe('expired');
    expect(keyStatus(key({ expiresAt: 5, revokedAt: 3 }), 10)).toBe('revoked');
    expect(keyStatus(key({ expiresAt: 50 }), 10)).toBe('active');
  });
});

describe('schedules', () => {
  it('reads lastRun from the hub (epoch ms) and the app (Timestamp)', () => {
    expect(lastRunMillis(null)).toBeNull();
    expect(lastRunMillis(undefined)).toBeNull();
    expect(lastRunMillis(1234)).toBe(1234);
    expect(lastRunMillis({ toMillis: () => 99 } as never)).toBe(99);
  });
  it('stamps an IANA time zone', () => {
    const tz = browserTimeZone();
    expect(typeof tz === 'string' && tz.length > 0).toBe(true);
  });
});
