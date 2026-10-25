// discoveryService.ts - bounded discovery job orchestrator.
//
// M1: every adapter returned a fixed SIMULATED fixture set, zero network I/O. M2 added a real
// Home Assistant adapter (hub-wide HA_URL/HA_TOKEN, see homeAssistantAdapter.ts). M3 adds
// generic MQTT import - a bounded preview scan of an owner-supplied broker, see
// mqttImportAdapter.ts. onvif/rtsp/mjpeg (camera) are still simulated-only pending M4. No
// gateway/credentials configured -> same simulated fixture as before, so the public demo and
// any not-yet-authorized caller still touch zero real devices.

import { randomUUID } from "node:crypto";
import type { AdapterKind, DiscoveryCandidate, DiscoveryJob } from "./types.js";
import { dedupeByIdentity } from "./deviceIdentity.js";
import { HA_CONFIGURED, discoverCandidates as discoverHaCandidates } from "./homeAssistantAdapter.js";
import { discoverCandidates as discoverMqttCandidates, type MqttConnectOptions } from "./mqttImportAdapter.js";

const jobs = new Map<string, DiscoveryJob>();

// Bounded: jobs are never kept forever, and there is a hard cap on how many can be in
// flight per process, so this can't be used to exhaust gateway memory.
const JOB_TTL_MS = 5 * 60 * 1000;
const MAX_ACTIVE_JOBS = 20;

function simulatedFixture(adapter: AdapterKind, ownerId: string, gatewayId: string): DiscoveryCandidate[] {
  const foundAt = new Date().toISOString();
  const base = (externalId: string, displayName: string, sourceLabel: string): DiscoveryCandidate => ({
    tempId: randomUUID(),
    identity: { adapter, gatewayId, sourceSystemId: `${adapter}-simulated`, externalId },
    displayName,
    capabilities: [{ id: "observe.demo", mode: "read", tier: "observe", installed: true, enabled: false, provenance: "simulated" }],
    sourceLabel,
    foundAt,
  });
  switch (adapter) {
    case "home_assistant":
      return [
        base("sensor.demo_coop_temp", "Coop Temperature (demo)", "Simulated Home Assistant"),
        base("switch.demo_coop_light", "Coop Light (demo)", "Simulated Home Assistant"),
      ];
    case "mqtt":
      return [base("demo/sensor/soil-moisture", "Soil Moisture (demo)", "Simulated MQTT broker")];
    case "onvif":
    case "rtsp":
    case "mjpeg":
      return [base("demo-camera-1", "Yard Camera (demo)", "Simulated camera")];
    default:
      return [];
  }
}

function pruneExpired(now: number): void {
  for (const [id, job] of jobs) {
    const age = now - new Date(job.startedAt).getTime();
    if (age > JOB_TTL_MS) jobs.delete(id);
  }
}

export interface StartDiscoveryResult {
  ok: true;
  job: DiscoveryJob;
}
export interface StartDiscoveryError {
  ok: false;
  error: "TOO_MANY_JOBS";
}

/** Shared tail for any adapter that makes a real, awaited network call: mark the job
 *  "running" immediately, resolve it to complete/error once the call settles. */
function runAsyncJob(id: string, ownerId: string, call: () => Promise<{ ok: true; value: { candidates: DiscoveryCandidate[] } } | { ok: false; error: string }>): void {
  void call().then((result) => {
    const current = jobs.get(id);
    if (!current) return; // pruned/removed while the call was in flight
    if (!result.ok) {
      current.status = "error";
      current.error = result.error;
      current.completedAt = new Date().toISOString();
      return;
    }
    current.candidates = dedupeByIdentity(ownerId, result.value.candidates);
    current.status = "complete";
    current.completedAt = new Date().toISOString();
  });
}

export function startDiscovery(
  ownerId: string,
  gatewayId: string,
  adapter: AdapterKind,
  mqttOptions?: MqttConnectOptions,
): StartDiscoveryResult | StartDiscoveryError {
  const now = Date.now();
  pruneExpired(now);
  const activeForOwner = [...jobs.values()].filter((j) => j.ownerId === ownerId).length;
  if (activeForOwner >= MAX_ACTIVE_JOBS) return { ok: false, error: "TOO_MANY_JOBS" };

  const id = randomUUID();
  const useRealHa = adapter === "home_assistant" && HA_CONFIGURED;
  const useRealMqtt = adapter === "mqtt" && !!mqttOptions;

  if (!useRealHa && !useRealMqtt) {
    const candidates = dedupeByIdentity(ownerId, simulatedFixture(adapter, ownerId, gatewayId));
    const job: DiscoveryJob = {
      id, ownerId, adapter, status: "complete",
      startedAt: new Date(now).toISOString(), completedAt: new Date(now).toISOString(), candidates,
    };
    jobs.set(id, job);
    return { ok: true, job };
  }

  // Real network call: the job starts "running" and the route polls it, same contract the
  // simulated path already promised (DiscoveryJob.status was always running|complete|error).
  const job: DiscoveryJob = { id, ownerId, adapter, status: "running", startedAt: new Date(now).toISOString(), candidates: [] };
  jobs.set(id, job);
  if (useRealHa) runAsyncJob(id, ownerId, () => discoverHaCandidates(gatewayId));
  else runAsyncJob(id, ownerId, () => discoverMqttCandidates(gatewayId, mqttOptions!));
  return { ok: true, job };
}

/** Only returns a job to its own owner - never leak another owner's discovery candidates. */
export function getDiscoveryJob(ownerId: string, jobId: string): DiscoveryJob | null {
  pruneExpired(Date.now());
  const job = jobs.get(jobId);
  if (!job || job.ownerId !== ownerId) return null;
  return job;
}

/** Test/ops hook: clears all in-memory jobs. Never call this from a route. */
export function __resetDiscoveryJobsForTests(): void {
  jobs.clear();
}
