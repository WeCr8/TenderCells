// Tests for the robot zones payload (tc/{id}/cfg/zones), including the property boundary.
// Run: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { validateZones } from "./schemas.js";

const base = { v: 1, units: "ft", self: { x: 0, y: 0, width: 3, depth: 3 }, zones: [] };
const square = [[0, 0], [100, 0], [100, 80], [0, 80]];

test("zones payload without a boundary is still valid", () => {
  assert.equal(validateZones(base), null);
});

test("a property boundary is accepted with a polygon and margin", () => {
  assert.equal(validateZones({ ...base, boundary: { poly: square, marginFt: 2, source: "survey" } }), null);
});

test("a bad boundary is refused with the reason", () => {
  assert.match(validateZones({ ...base, boundary: { poly: [[0, 0], [1, 1]], marginFt: 2 } })!, /3-256 points/);
  assert.match(validateZones({ ...base, boundary: { poly: [[0, 0], [1, "x"], [2, 2]], marginFt: 2 } })!, /\[x, y\] numbers/);
  assert.match(validateZones({ ...base, boundary: { poly: square, marginFt: -1 } })!, /marginFt/);
  assert.match(validateZones({ ...base, boundary: { poly: square } })!, /marginFt/);
  assert.match(validateZones({ ...base, boundary: null })!, /boundary must be an object/);
});
