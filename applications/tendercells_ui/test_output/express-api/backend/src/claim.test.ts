// Device claim needs proof of possession, not first-come. Run: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  checkClaimProof, claimConflict, claimHash, ClaimLimiter, hubAdminOk, isLocalRequest, normalizeClaimCode, PairingTokens,
} from "./claim.js";

test("claim codes are normalised the way people type them", () => {
  assert.equal(normalizeClaimCode("abcd-efgh-jk0o"), "ABCDEFGHJK00");
  assert.equal(normalizeClaimCode(" 7il1 "), "7111");
  assert.equal(claimHash("node_1A2B", "abcd-efgh-jkmn"), claimHash("node_1A2B", "ABCDEFGHJKMN"));
  assert.notEqual(claimHash("node_1A2B", "ABCDEFGHJKMN"), claimHash("node_9999", "ABCDEFGHJKMN"), "hash is bound to the device id");
});

test("the firmware's hash format matches (sha256 of tc-claim:v1:<id>:<CODE>)", () => {
  // Same vector as firmware/starter-node: printf 'tc-claim:v1:node_1A2B:7K3M9QX2RTHP' | sha256sum
  assert.equal(claimHash("node_1A2B", "7K3M-9QX2-RTHP"), "ead7de4687e2840d837d5fcc5644e2c4b1e9ffd2eaa30cdb67fd70c7d54646d4");
});

test("a claim without proof, with a wrong code, or for a device never heard is refused", () => {
  const pairing = new PairingTokens();
  const h = claimHash("node_1", "AAAA-BBBB-CCCC");
  assert.equal((checkClaimProof("node_1", {}, h, pairing) as { status: number }).status, 400, "no proof at all");
  assert.equal((checkClaimProof("node_1", { claimCode: "AAAA-BBBB-CCCD" }, h, pairing) as { status: number }).status, 403);
  assert.equal((checkClaimProof("node_1", { claimCode: "AAAA-BBBB-CCCC" }, undefined, pairing) as { status: number }).status, 409);
  assert.deepEqual(checkClaimProof("node_1", { claimCode: "aaaa bbbb cccc" }, h, pairing), { via: "claim-code" });
});

test("pairing tokens are one-time, expire, and can be pinned to one device", () => {
  let now = 1_000_000;
  const pairing = new PairingTokens(() => now);
  const any = pairing.issue();
  assert.deepEqual(checkClaimProof("ct_001", { pairingToken: any.token }, undefined, pairing), { via: "pairing-token" });
  assert.equal((checkClaimProof("ct_002", { pairingToken: any.token }, undefined, pairing) as { status: number }).status, 403, "single use");
  const pinned = pairing.issue("ct_003");
  assert.equal(pairing.consume(pinned.token, "ct_004"), false, "pinned to ct_003");
  assert.equal(pairing.consume(pinned.token, "ct_003"), true);
  const late = pairing.issue();
  now += 11 * 60_000;
  assert.equal(pairing.consume(late.token, "ct_001"), false, "expired");
});

test("an owned device cannot be taken; a client-made simulation doc can be displaced by the real board", () => {
  assert.equal(claimConflict(undefined, "me"), null);
  assert.equal(claimConflict({ unclaimed: true }, "me"), null);
  assert.equal(claimConflict({ ownerId: "me", userId: "me" }, "me"), null);
  assert.match(claimConflict({ ownerId: "them", userId: "them" }, "me") ?? "", /another account/);
  assert.equal(claimConflict({ ownerId: "squatter", userId: "squatter", simOnly: true }, "me"), null);
});

test("wrong codes are rate-limited per device", () => {
  const lim = new ClaimLimiter(3, 60_000, () => 5);
  for (let i = 0; i < 3; i++) { assert.equal(lim.blocked("d"), false); lim.fail("d"); }
  assert.equal(lim.blocked("d"), true);
  assert.equal(lim.blocked("other"), false);
});

test("pairing tokens are minted only on the hub machine or with the admin key", () => {
  assert.equal(isLocalRequest("127.0.0.1", {}), true);
  assert.equal(isLocalRequest("::ffff:127.0.0.1", {}), true);
  assert.equal(isLocalRequest("127.0.0.1", { "x-forwarded-for": "8.8.8.8" }), false, "proxied requests are not local");
  assert.equal(isLocalRequest("192.168.1.20", {}), false);
  assert.equal(hubAdminOk("a-long-admin-key-123", "a-long-admin-key-123"), true);
  assert.equal(hubAdminOk("wrong-admin-key-1234", "a-long-admin-key-123"), false);
  assert.equal(hubAdminOk("short", "short"), false, "short admin keys are ignored");
  assert.equal(hubAdminOk("anything", undefined), false);
});
