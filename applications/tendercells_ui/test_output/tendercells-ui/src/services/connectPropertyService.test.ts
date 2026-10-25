// connectPropertyService.test.ts - the hub API client shapes requests/responses correctly
// and surfaces the hub's own error codes/messages rather than swallowing them.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ConnectPropertyApiError, ConnectPropertyService } from './connectPropertyService';

const json = (status: number, body: unknown) =>
  Promise.resolve(new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } }));

afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe('discover', () => {
  it('posts gatewayId/adapter and returns the job', async () => {
    const fetchMock = vi.fn(() => json(200, { job: { id: 'job-1', status: 'complete', candidates: [] } }));
    vi.stubGlobal('fetch', fetchMock);
    const { job } = await ConnectPropertyService.discover('gw-1', 'home_assistant');
    expect(job.id).toBe('job-1');
    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(JSON.parse(String(init.body))).toEqual({ gatewayId: 'gw-1', adapter: 'home_assistant' });
  });

  it('includes MQTT connect options only for the mqtt adapter', async () => {
    const fetchMock = vi.fn(() => json(200, { job: { id: 'job-2', status: 'running', candidates: [] } }));
    vi.stubGlobal('fetch', fetchMock);
    await ConnectPropertyService.discover('gw-1', 'mqtt', { brokerUrl: 'mqtt://192.168.1.10', topics: ['home/#'] });
    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(JSON.parse(String(init.body))).toEqual({ gatewayId: 'gw-1', adapter: 'mqtt', brokerUrl: 'mqtt://192.168.1.10', topics: ['home/#'] });
  });
});

describe('error handling', () => {
  it('surfaces the hub error code and message, not a generic failure', async () => {
    vi.stubGlobal('fetch', vi.fn(() => json(409, { error: 'ALREADY_IMPORTED', message: 'That device is already imported.' })));
    await expect(ConnectPropertyService.import('job-1', 'temp-1')).rejects.toThrow('That device is already imported.');
    try {
      await ConnectPropertyService.import('job-1', 'temp-1');
    } catch (e) {
      expect(e).toBeInstanceOf(ConnectPropertyApiError);
      expect((e as ConnectPropertyApiError).code).toBe('ALREADY_IMPORTED');
    }
  });

  it('a feature-disabled hub (404) surfaces cleanly', async () => {
    vi.stubGlobal('fetch', vi.fn(() => json(404, { error: 'FEATURE_DISABLED', message: 'Connect My Property is not enabled on this gateway.' })));
    await expect(ConnectPropertyService.list()).rejects.toThrow('not enabled on this gateway');
  });
});

describe('awaitJob', () => {
  it('polls until the job leaves running, then returns it', async () => {
    let calls = 0;
    vi.stubGlobal('fetch', vi.fn(() => {
      calls += 1;
      const status = calls < 3 ? 'running' : 'complete';
      return json(200, { job: { id: 'job-3', status, candidates: status === 'complete' ? [{ tempId: 't1' }] : [] } });
    }));
    const job = await ConnectPropertyService.awaitJob('job-3', 5000, 1);
    expect(job.status).toBe('complete');
    expect(calls).toBe(3);
  });

  it('gives up and returns the still-running job after the timeout, rather than hanging forever', async () => {
    vi.stubGlobal('fetch', vi.fn(() => json(200, { job: { id: 'job-4', status: 'running', candidates: [] } })));
    const job = await ConnectPropertyService.awaitJob('job-4', 5, 2);
    expect(job.status).toBe('running');
  });
});

describe('importManual', () => {
  it('sends kind/gatewayId/url for manual camera entry', async () => {
    const fetchMock = vi.fn(() => json(201, { integration: { id: 'int-1' } }));
    vi.stubGlobal('fetch', fetchMock);
    await ConnectPropertyService.importManual('rtsp', 'gw-1', 'rtsp://192.168.1.50/stream1', 'Barn Cam');
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toMatch(/\/integrations\/manual$/);
    expect(JSON.parse(String(init.body))).toMatchObject({ kind: 'rtsp', gatewayId: 'gw-1', url: 'rtsp://192.168.1.50/stream1', displayName: 'Barn Cam' });
  });
});
