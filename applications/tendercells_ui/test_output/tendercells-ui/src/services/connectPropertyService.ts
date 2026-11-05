// connectPropertyService.ts - thin client for the hub's Connect My Property API
// (express-api backend/src/routes/integrations.routes.ts). Uses hardwareApi.ts's
// HARDWARE_API_ORIGIN + hardwareAuthHeaders() - NOT productsService.ts's own base-URL/fetch
// pattern, which (per its own FIX comment history) sends no Firebase token at all. This API
// is owner-scoped on the hub (requireAuth/requirePerson), so the token has to actually go.
// The hub is the source of truth for everything here; this file has no business logic of its
// own beyond shaping requests/responses.
import { HARDWARE_API_ORIGIN, hardwareAuthHeaders } from '../lib/api/hardwareApi';

export type AdapterKind = 'home_assistant' | 'mqtt' | 'onvif' | 'rtsp' | 'mjpeg';
export type ControlTier = 'observe' | 'low_risk' | 'supervised' | 'safety_critical';

export interface Capability {
  id: string;
  mode: 'read' | 'write' | 'read_write';
  tier: ControlTier;
  installed: boolean;
  enabled: boolean;
  unit?: string;
  observedAt?: string;
  value?: unknown;
  provenance: 'real' | 'simulated' | 'estimated' | 'manual';
}

export interface ExternalIdentity {
  adapter: AdapterKind;
  gatewayId: string;
  sourceSystemId: string;
  externalId: string;
}

export interface DiscoveryCandidate {
  tempId: string;
  identity: ExternalIdentity;
  displayName: string;
  capabilities: Capability[];
  sourceLabel: string;
  foundAt: string;
}

export interface DiscoveryJob {
  id: string;
  ownerId: string;
  adapter: AdapterKind;
  status: 'running' | 'complete' | 'error';
  startedAt: string;
  completedAt?: string;
  candidates: DiscoveryCandidate[];
  error?: string;
}

export interface IntegrationRecord {
  id: string;
  ownerId: string;
  propertyId?: string;
  identity: ExternalIdentity;
  displayName: string;
  capabilities: Capability[];
  connection: { state: string; lastSeenAt?: string };
  provenance: 'real' | 'simulated' | 'estimated' | 'manual';
  importState: 'candidate' | 'approved' | 'disabled' | 'removed';
  controlEnabled: boolean;
  schemaVersion: number;
  createdAt: string;
  updatedAt: string;
}

export interface MqttDiscoverOptions {
  brokerUrl: string;
  username?: string;
  password?: string;
  topics: string[];
}

export class ConnectPropertyApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

export class ConnectPropertyService {
  private static readonly BASE = `${HARDWARE_API_ORIGIN}/api/integrations`;

  private static async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const authHeaders = await hardwareAuthHeaders();
    const response = await fetch(`${this.BASE}${path}`, { ...options, headers: { ...authHeaders, ...options.headers } });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new ConnectPropertyApiError(body.error || 'UNKNOWN_ERROR', body.message || `HTTP ${response.status}`);
    }
    return body as T;
  }

  static list(): Promise<{ integrations: IntegrationRecord[] }> {
    return this.request('/');
  }

  static discover(gatewayId: string, adapter: AdapterKind, mqtt?: MqttDiscoverOptions): Promise<{ job: DiscoveryJob }> {
    return this.request('/discover', { method: 'POST', body: JSON.stringify({ gatewayId, adapter, ...mqtt }) });
  }

  static pollJob(jobId: string): Promise<{ job: DiscoveryJob }> {
    return this.request(`/discover/${encodeURIComponent(jobId)}`);
  }

  static import(jobId: string, tempId: string, propertyId?: string): Promise<{ integration: IntegrationRecord }> {
    return this.request('/import', { method: 'POST', body: JSON.stringify({ jobId, tempId, propertyId }) });
  }

  static importManual(
    kind: 'rtsp' | 'onvif',
    gatewayId: string,
    url: string,
    displayName?: string,
    propertyId?: string,
  ): Promise<{ integration: IntegrationRecord }> {
    return this.request('/manual', { method: 'POST', body: JSON.stringify({ kind, gatewayId, url, displayName, propertyId }) });
  }

  static testHomeAssistant(): Promise<{ ok: true; entityCount: number }> {
    return this.request('/test', { method: 'POST', body: JSON.stringify({ adapter: 'home_assistant' }) });
  }

  static testMqtt(opts: Pick<MqttDiscoverOptions, 'brokerUrl' | 'username' | 'password'>): Promise<{ ok: true }> {
    return this.request('/test', { method: 'POST', body: JSON.stringify({ adapter: 'mqtt', ...opts }) });
  }

  static disable(id: string): Promise<{ ok: true }> {
    return this.request(`/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify({ action: 'disable' }) });
  }

  /** Polls a running discovery job until it settles (complete/error) or the timeout elapses. */
  static async awaitJob(jobId: string, timeoutMs = 10000, intervalMs = 400): Promise<DiscoveryJob> {
    const start = Date.now();
    for (;;) {
      const { job } = await this.pollJob(jobId);
      if (job.status !== 'running') return job;
      if (Date.now() - start > timeoutMs) return job; // caller decides what to do with a still-running job
      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }
  }
}
