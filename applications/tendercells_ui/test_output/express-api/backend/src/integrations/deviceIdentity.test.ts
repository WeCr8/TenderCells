// Tests for discovered-device identity matching and dedup. Run: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { dedupeByIdentity, findExistingImport, sameIdentity } from "./deviceIdentity.js";
import type { ExternalIdentity, IntegrationRecord } from "./types.js";

const haEntity: ExternalIdentity = {
  adapter: "home_assistant",
  gatewayId: "gw-1",
  sourceSystemId: "ha-instance-abc",
  externalId: "sensor.coop_temp",
};

test("sameIdentity requires every field to match", () => {
  assert.equal(sameIdentity(haEntity, { ...haEntity }), true);
  assert.equal(sameIdentity(haEntity, { ...haEntity, externalId: "sensor.other" }), false);
  assert.equal(sameIdentity(haEntity, { ...haEntity, gatewayId: "gw-2" }), false);
  assert.equal(sameIdentity(haEntity, { ...haEntity, sourceSystemId: "ha-instance-xyz" }), false);
  assert.equal(sameIdentity(haEntity, { ...haEntity, adapter: "mqtt" }), false);
});

test("findExistingImport matches only the exact owner + identity, never a guess", () => {
  const rec: IntegrationRecord = {
    id: "int-1",
    ownerId: "owner-a",
    identity: haEntity,
    displayName: "Coop Temp",
    capabilities: [],
    connection: { state: "online" },
    provenance: "real",
    importState: "approved",
    controlEnabled: false,
    schemaVersion: 1,
    createdAt: "2026-10-24T00:00:00Z",
    updatedAt: "2026-10-24T00:00:00Z",
  };
  assert.equal(findExistingImport("owner-a", haEntity, [rec]), rec);
  // Same identity, different owner: must NOT match - no cross-tenant leakage.
  assert.equal(findExistingImport("owner-b", haEntity, [rec]), null);
  // Different external id on the same source: a different candidate, not a match.
  assert.equal(findExistingImport("owner-a", { ...haEntity, externalId: "sensor.other" }, [rec]), null);
});

test("dedupeByIdentity keeps the first occurrence and drops exact repeats only", () => {
  const items = [
    { identity: haEntity, tag: "first" },
    { identity: { ...haEntity }, tag: "duplicate" },
    { identity: { ...haEntity, externalId: "sensor.humidity" }, tag: "different-entity" },
  ];
  const out = dedupeByIdentity("owner-a", items);
  assert.equal(out.length, 2);
  assert.equal(out[0].tag, "first");
  assert.equal(out[1].tag, "different-entity");
});

test("dedupeByIdentity never merges across owners (same identity, different scope key)", () => {
  const a = dedupeByIdentity("owner-a", [{ identity: haEntity }]);
  const b = dedupeByIdentity("owner-b", [{ identity: haEntity }]);
  assert.equal(a.length, 1);
  assert.equal(b.length, 1);
});
