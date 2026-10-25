// Tests for the local integrations registry: persistence, owner isolation, no duplicate
// imports on rescan/restart, and read-only-by-construction import. Run: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";

process.env.INTEGRATIONS_FILE = join(mkdtempSync(join(tmpdir(), "tc-integrations-")), "integrations.json");

const { importCandidate, listForOwner, getForOwner, disable, __resetRegistryForTests } = await import("./registry.js");
const { identityKey } = await import("./types.js");
import type { DiscoveryCandidate } from "./types.js";

function candidate(externalId: string): DiscoveryCandidate {
  return {
    tempId: randomUUID(),
    identity: { adapter: "home_assistant", gatewayId: "gw-1", sourceSystemId: "ha-1", externalId },
    displayName: "Coop Temp",
    capabilities: [{ id: "temperature", mode: "read", tier: "observe", installed: true, enabled: false, provenance: "real" }],
    sourceLabel: "Home Assistant",
    foundAt: new Date().toISOString(),
  };
}

test("the record's own provenance reflects the candidate's, not a hardcoded value", () => {
  // Regression test: this was hardcoded to "simulated" for every import regardless of the
  // actual candidate - found live-testing M4's manual camera route, where a real manual
  // import showed up mislabeled as simulated.
  __resetRegistryForTests();
  const real = candidate("sensor.real_one");
  const manual: DiscoveryCandidate = {
    ...candidate("manual.cam_one"),
    capabilities: [{ id: "camera.stream", mode: "read", tier: "observe", installed: true, enabled: false, provenance: "manual" }],
  };
  assert.equal(importCandidate("owner-a", "prop-1", real).record?.provenance, "real");
  assert.equal(importCandidate("owner-a", "prop-1", manual).record?.provenance, "manual");
});

test("import creates a read-only record; controlEnabled is always false", () => {
  __resetRegistryForTests();
  const result = importCandidate("owner-a", "prop-1", candidate("sensor.coop_temp"));
  assert.equal(result.ok, true);
  assert.equal(result.record?.controlEnabled, false);
  assert.equal(result.record?.importState, "candidate");
  for (const cap of result.record?.capabilities ?? []) assert.equal(cap.enabled, false);
});

test("re-importing the same identity does not create a duplicate", () => {
  __resetRegistryForTests();
  const first = importCandidate("owner-a", "prop-1", candidate("sensor.coop_temp"));
  const second = importCandidate("owner-a", "prop-1", candidate("sensor.coop_temp"));
  assert.equal(first.ok, true);
  assert.equal(second.ok, false);
  assert.equal(second.error, "ALREADY_IMPORTED");
  assert.equal(listForOwner("owner-a").length, 1);
});

test("one owner cannot see or import into another owner's records", () => {
  __resetRegistryForTests();
  const imported = importCandidate("owner-a", "prop-1", candidate("sensor.coop_temp"));
  assert.equal(imported.ok, true);
  assert.equal(listForOwner("owner-b").length, 0);
  assert.equal(getForOwner("owner-b", imported.record!.id), null);
  assert.equal(getForOwner("owner-a", imported.record!.id)?.id, imported.record!.id);
});

test("disable only affects the owner's own record and never re-enables control", () => {
  __resetRegistryForTests();
  const imported = importCandidate("owner-a", "prop-1", candidate("sensor.coop_temp"));
  assert.equal(disable("owner-b", imported.record!.id), false, "wrong owner must not be able to disable it");
  assert.equal(disable("owner-a", imported.record!.id), true);
  assert.equal(getForOwner("owner-a", imported.record!.id)?.importState, "disabled");
  assert.equal(getForOwner("owner-a", imported.record!.id)?.controlEnabled, false);
});

test("identityKey distinguishes same externalId across different gateways", () => {
  const a = { adapter: "mqtt" as const, gatewayId: "gw-1", sourceSystemId: "broker-1", externalId: "x" };
  const b = { ...a, gatewayId: "gw-2" };
  assert.notEqual(identityKey("owner-a", a), identityKey("owner-a", b));
});
