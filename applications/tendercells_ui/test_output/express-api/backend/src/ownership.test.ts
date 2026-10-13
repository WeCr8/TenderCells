// Device ownership rules shared by the hub routes. Run: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { deviceOwner, mowerLinkConflict, ownerFields } from "./ownership.js";

test("owner is ownerId, falling back to userId (app-registered devices)", () => {
  assert.equal(deviceOwner({ ownerId: "a", userId: "b" }), "a");
  assert.equal(deviceOwner({ userId: "b" }), "b");
  assert.equal(deviceOwner({ unclaimed: true }), undefined);
  assert.equal(deviceOwner({ ownerId: "" }), undefined);
  assert.equal(deviceOwner(undefined), undefined);
});

test("hub claims write both owner fields so firestore.rules let the owner read the device", () => {
  assert.deepEqual(ownerFields("u1"), { ownerId: "u1", userId: "u1" });
});

test("linking a mower can never take over another account's device", () => {
  assert.match(mowerLinkConflict({ ownerId: "victim", productType: "chicken-tender" }, "attacker") ?? "", /another account/);
  assert.match(mowerLinkConflict({ userId: "victim" }, "attacker") ?? "", /another account/);
});

test("linking a mower can not repurpose an existing coop, even an unclaimed or own one", () => {
  assert.match(mowerLinkConflict({ unclaimed: true, productType: "starter" }, "u1") ?? "", /already a starter/);
  assert.match(mowerLinkConflict({ ownerId: "u1", productType: "chicken-tender" }, "u1") ?? "", /already a chicken-tender/);
});

test("a new id, or re-linking your own mower, is allowed", () => {
  assert.equal(mowerLinkConflict(undefined, "u1"), null);
  assert.equal(mowerLinkConflict({ ownerId: "u1", productType: "robot-mower" }, "u1"), null);
});
