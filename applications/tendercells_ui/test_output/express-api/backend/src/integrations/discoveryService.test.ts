// Tests that discovery is simulated-only in M1 and bounded per owner. Run: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { __resetDiscoveryJobsForTests, getDiscoveryJob, startDiscovery } from "./discoveryService.js";

test("discovery never performs real network I/O in M1 - every candidate is explicitly simulated", () => {
  __resetDiscoveryJobsForTests();
  const result = startDiscovery("owner-a", "gw-1", "home_assistant");
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.ok(result.job.candidates.length > 0, "fixture should return at least one candidate");
  for (const candidate of result.job.candidates) {
    assert.equal(candidate.identity.sourceSystemId, "home_assistant-simulated");
    for (const cap of candidate.capabilities) assert.equal(cap.provenance, "simulated");
  }
});

test("a discovery job belongs to its owner only - no cross-owner leakage", () => {
  __resetDiscoveryJobsForTests();
  const result = startDiscovery("owner-a", "gw-1", "mqtt");
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(getDiscoveryJob("owner-a", result.job.id)?.id, result.job.id);
  assert.equal(getDiscoveryJob("owner-b", result.job.id), null);
  assert.equal(getDiscoveryJob("owner-a", "nonexistent-job-id"), null);
});

test("discovery is bounded per owner - cannot exhaust gateway memory with job spam", () => {
  __resetDiscoveryJobsForTests();
  for (let i = 0; i < 20; i++) {
    const r = startDiscovery("owner-spam", "gw-1", "mqtt");
    assert.equal(r.ok, true);
  }
  const blocked = startDiscovery("owner-spam", "gw-1", "mqtt");
  assert.equal(blocked.ok, false);
  if (blocked.ok) return;
  assert.equal(blocked.error, "TOO_MANY_JOBS");
  // A different owner is unaffected by owner-spam's bound.
  const other = startDiscovery("owner-b", "gw-1", "mqtt");
  assert.equal(other.ok, true);
});

test("candidates from the same fixture never duplicate by identity", () => {
  __resetDiscoveryJobsForTests();
  const result = startDiscovery("owner-a", "gw-1", "home_assistant");
  assert.equal(result.ok, true);
  if (!result.ok) return;
  const keys = result.job.candidates.map((c) => c.identity.externalId);
  assert.equal(keys.length, new Set(keys).size);
});
