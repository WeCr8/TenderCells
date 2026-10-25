// registry.ts - local gateway-side storage for imported integrations. Survives a hub
// restart; mirrors mowerBridge.ts's own storage pattern. No credentials are ever stored
// here - a later milestone's credentialRef points at the gateway secret store instead,
// never at this file. M1: import only creates `candidate`/`approved` read-only records;
// nothing here can ever set controlEnabled true (that arrives in a later milestone,
// behind its own capability-policy review).
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { randomUUID } from "node:crypto";
import type { DiscoveryCandidate, IntegrationRecord } from "./types.js";
import { findExistingImport } from "./deviceIdentity.js";

const FILE = process.env.INTEGRATIONS_FILE || join(process.cwd(), ".tendercells", "integrations.json");

const records = new Map<string, IntegrationRecord>();
let loaded = false;

function load(): void {
  if (loaded) return;
  loaded = true;
  try {
    if (!existsSync(FILE)) return;
    for (const r of JSON.parse(readFileSync(FILE, "utf8")) as IntegrationRecord[]) records.set(r.id, r);
  } catch (e) {
    console.warn("[integrations] could not read", FILE, (e as Error).message);
  }
}
function save(): void {
  try {
    mkdirSync(dirname(FILE), { recursive: true });
    writeFileSync(FILE, JSON.stringify([...records.values()], null, 2));
  } catch (e) {
    console.warn("[integrations] could not save", FILE, (e as Error).message);
  }
}

export function listForOwner(ownerId: string): IntegrationRecord[] {
  load();
  return [...records.values()].filter((r) => r.ownerId === ownerId);
}

export function getForOwner(ownerId: string, id: string): IntegrationRecord | null {
  load();
  const rec = records.get(id);
  return rec && rec.ownerId === ownerId ? rec : null;
}

export interface ImportResult {
  ok: boolean;
  record?: IntegrationRecord;
  error?: "ALREADY_IMPORTED" | "NOT_FOUND";
}

/**
 * Import one previously-discovered candidate. Explicit selection only - never imports
 * everything found. Read-only (observe tier, controlEnabled: false) by construction.
 */
export function importCandidate(ownerId: string, propertyId: string | undefined, candidate: DiscoveryCandidate): ImportResult {
  load();
  const existing = findExistingImport(ownerId, candidate.identity, [...records.values()]);
  if (existing) return { ok: false, error: "ALREADY_IMPORTED", record: existing };

  const now = new Date().toISOString();
  const record: IntegrationRecord = {
    id: randomUUID(),
    ownerId,
    propertyId,
    identity: candidate.identity,
    displayName: candidate.displayName,
    capabilities: candidate.capabilities.map((c) => ({ ...c, enabled: false })),
    connection: { state: "unconfigured" },
    // FIX: this was hardcoded to "simulated" regardless of the actual candidate - every real
    // (HA/MQTT) and manual (RTSP/ONVIF) import was mislabeled. Found live-testing M4's manual
    // camera route. Reflects the candidate's own capability provenance now.
    provenance: candidate.capabilities[0]?.provenance ?? "simulated",
    importState: "candidate",
    controlEnabled: false,
    schemaVersion: 1,
    createdAt: now,
    updatedAt: now,
  };
  records.set(record.id, record);
  save();
  return { ok: true, record };
}

export function disable(ownerId: string, id: string): boolean {
  load();
  const rec = records.get(id);
  if (!rec || rec.ownerId !== ownerId) return false;
  rec.importState = "disabled";
  rec.controlEnabled = false;
  rec.updatedAt = new Date().toISOString();
  save();
  return true;
}

/** Test hook only. */
export function __resetRegistryForTests(): void {
  records.clear();
  loaded = true;
}
