// discoveryService.ts - bounded discovery job orchestrator.
//
// M1 scope only: every adapter returns a fixed SIMULATED fixture set. No mDNS/SSDP, no real
// Home Assistant/MQTT/ONVIF scanning, no network I/O of any kind happens here yet - that is
// real work for later milestones (M2 Home Assistant, M3 MQTT, M4 camera/ONVIF), each adding
// its own adapter behind its own feature flag per CONNECT_MY_PROPERTY_IMPLEMENTATION_SPEC.md.
// Keeping this module simulated-only for now is deliberate: it means the public demo and any
// not-yet-authorized caller can exercise the whole discover -> stage -> import flow with zero
// risk of touching a real device, by construction, not by a flag someone could flip wrong.

import { randomUUID } from "node:crypto";
import type { AdapterKind, DiscoveryCandidate, DiscoveryJob } from "./types.js";
import { dedupeByIdentity } from "./deviceIdentity.js";

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

export function startDiscovery(ownerId: string, gatewayId: string, adapter: AdapterKind): StartDiscoveryResult | StartDiscoveryError {
  const now = Date.now();
  pruneExpired(now);
  const activeForOwner = [...jobs.values()].filter((j) => j.ownerId === ownerId).length;
  if (activeForOwner >= MAX_ACTIVE_JOBS) return { ok: false, error: "TOO_MANY_JOBS" };

  const id = randomUUID();
  const candidates = dedupeByIdentity(ownerId, simulatedFixture(adapter, ownerId, gatewayId));
  const job: DiscoveryJob = {
    id,
    ownerId,
    adapter,
    status: "complete",
    startedAt: new Date(now).toISOString(),
    completedAt: new Date(now).toISOString(),
    candidates,
  };
  jobs.set(id, job);
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
