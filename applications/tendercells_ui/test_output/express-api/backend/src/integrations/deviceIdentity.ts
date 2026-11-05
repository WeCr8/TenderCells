// deviceIdentity.ts - pure matching/dedup for discovered candidates against already-imported
// integrations. Ambiguous matches must never silently merge: default to separate staged
// candidates, per CONNECT_MY_PROPERTY_IMPLEMENTATION_SPEC.md §4.1.

import { identityKey, type ExternalIdentity, type IntegrationRecord } from "./types.js";

/** True only when adapter, gateway and source system and external id all match exactly. */
export function sameIdentity(a: ExternalIdentity, b: ExternalIdentity): boolean {
  return (
    a.adapter === b.adapter &&
    a.gatewayId === b.gatewayId &&
    a.sourceSystemId === b.sourceSystemId &&
    a.externalId === b.externalId
  );
}

/**
 * Find an existing import that exactly matches this candidate's identity for this owner.
 * Returns null (never a guess) when nothing matches exactly - the caller stages it as a
 * new candidate rather than merging into something that might be a different device.
 */
export function findExistingImport(
  ownerId: string,
  candidate: ExternalIdentity,
  existing: IntegrationRecord[],
): IntegrationRecord | null {
  const key = identityKey(ownerId, candidate);
  return existing.find((rec) => rec.ownerId === ownerId && identityKey(rec.ownerId, rec.identity) === key) ?? null;
}

/** Dedupe a raw discovery result list by identity key, keeping the first occurrence. */
export function dedupeByIdentity<T extends { identity: ExternalIdentity }>(ownerId: string, items: T[]): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const item of items) {
    const key = identityKey(ownerId, item.identity);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}
