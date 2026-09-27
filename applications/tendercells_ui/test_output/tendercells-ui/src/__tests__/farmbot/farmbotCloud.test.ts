// farmbotCloud.test.ts - my.farm.bot sign-in, sequences and session handling.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  FARMBOT_CLOUD_URL, clearFarmBotSession, listFarmBotSequences, loadFarmBotSession,
  requestFarmBotToken, saveFarmBotSession, type FarmBotToken,
} from '../../lib/farmbot/farmbotCloud';

const token = (expSecondsFromNow: number): FarmBotToken => ({
  encoded: 'a.b.c',
  unencoded: { bot: 'device_7', mqtt_ws: 'wss://mqtt.example/ws', exp: Math.floor(Date.now() / 1000) + expSecondsFromNow },
});

const json = (status: number, body: unknown) =>
  Promise.resolve(new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } }));

beforeEach(() => {
  const store = new Map<string, string>();
  vi.stubGlobal('sessionStorage', {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => { store.set(k, v); },
    removeItem: (k: string) => { store.delete(k); },
  });
});
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe('requestFarmBotToken', () => {
  it('posts {user:{email,password}} to my.farm.bot and returns the token', async () => {
    const fetchMock = vi.fn(() => json(200, { token: token(3600), user: { id: 1 } }));
    vi.stubGlobal('fetch', fetchMock);
    const t = await requestFarmBotToken('a@b.co', 'pw');
    expect(t.unencoded.bot).toBe('device_7');
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe(`${FARMBOT_CLOUD_URL}/api/tokens`);
    expect(JSON.parse(String(init.body))).toEqual({ user: { email: 'a@b.co', password: 'pw' } });
  });

  it('explains bad credentials and unaccepted terms', async () => {
    vi.stubGlobal('fetch', vi.fn(() => json(401, { auth: 'Bad email or password.' })));
    await expect(requestFarmBotToken('a@b.co', 'x')).rejects.toThrow('Bad email or password.');
    vi.stubGlobal('fetch', vi.fn(() => json(451, { consent: 'Please accept the terms.' })));
    await expect(requestFarmBotToken('a@b.co', 'x')).rejects.toThrow(/accept FarmBot's terms/);
  });

  it('reports network failures plainly', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new TypeError('Failed to fetch'))));
    await expect(requestFarmBotToken('a@b.co', 'x')).rejects.toThrow(/Could not reach my\.farm\.bot/);
  });
});

describe('listFarmBotSequences', () => {
  it('sends the bearer token and sorts by name', async () => {
    const fetchMock = vi.fn(() => json(200, [{ id: 2, name: 'Water', body: [] }, { id: 1, name: 'Mow', body: [] }]));
    vi.stubGlobal('fetch', fetchMock);
    expect(await listFarmBotSequences('tok')).toEqual([{ id: 1, name: 'Mow' }, { id: 2, name: 'Water' }]);
    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer tok');
  });
});

describe('FarmBot session', () => {
  it('keeps a valid token per garden and forgets it on clear', () => {
    saveFarmBotSession('g1', token(3600));
    expect(loadFarmBotSession('g1')?.encoded).toBe('a.b.c');
    expect(loadFarmBotSession('g2')).toBeNull();
    clearFarmBotSession('g1');
    expect(loadFarmBotSession('g1')).toBeNull();
  });

  it('drops expired tokens', () => {
    saveFarmBotSession('g1', token(-10));
    expect(loadFarmBotSession('g1')).toBeNull();
  });
});
