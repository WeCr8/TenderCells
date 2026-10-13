// Product registry access rules (dev/LAN mock). Run: npm test
import { test } from "node:test";
import assert from "node:assert/strict";

const { canAccessProduct } = await import("./routes/products.routes.js");

test("LAN/demo mode: every product is visible (unchanged classroom flow)", () => {
  assert.ok(canAccessProduct({ user_id: "local-dev" }, undefined, false));
});

test("accounts on: only the owner sees or changes a product", () => {
  assert.ok(canAccessProduct({ user_id: "u1" }, "u1", true));
  assert.ok(!canAccessProduct({ user_id: "u1" }, "u2", true));
  assert.ok(!canAccessProduct({ user_id: "local-dev" }, undefined, true));
});
