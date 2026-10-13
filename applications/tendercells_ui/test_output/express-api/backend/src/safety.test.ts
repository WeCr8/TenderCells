// E-STOP latch and work-area gate for the plain actuator routes. Run: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { actuatorRefusal, isStopOnly } from "./safety.js";

const clear = () => null;
const chickens = () => "3 chickens detected in the coop.";

test("during E-STOP, door / feed / drive / relay-on / gantry moves are refused (firmware ignores them)", () => {
  assert.match(actuatorRefusal("door", { state: "close" }, true, clear) ?? "", /E-STOP/);
  assert.match(actuatorRefusal("feed", { amount: 50 }, true, clear) ?? "", /E-STOP/);
  assert.match(actuatorRefusal("drive", { dir: "forward" }, true, clear) ?? "", /E-STOP/);
  assert.match(actuatorRefusal("light", { on: true }, true, clear) ?? "", /E-STOP/);
  assert.match(actuatorRefusal("gantry", { x: 10, y: 5 }, true, clear) ?? "", /E-STOP/);
});

test("stop / off commands always go through, even during E-STOP", () => {
  assert.equal(actuatorRefusal("drive", { dir: "stop" }, true, clear), null);
  assert.equal(actuatorRefusal("light", { on: false }, true, clear), null);
  assert.equal(actuatorRefusal("gantry", { cmd: "hold" }, true, chickens), null);
  assert.equal(actuatorRefusal("gantry", { cmd: "stop" }, true, chickens), null);
  assert.ok(!isStopOnly("gantry", { cmd: "stop", x: 3 }), "a stop with coordinates is a move");
});

test("gantry moves need a clear work area like the arm; door and feed do not", () => {
  assert.match(actuatorRefusal("gantry", { x: 10, y: 10 }, false, chickens) ?? "", /chickens/);
  assert.match(actuatorRefusal("gantry", { cmd: "home" }, false, chickens) ?? "", /chickens/);
  assert.equal(actuatorRefusal("gantry", { cmd: "unlock" }, false, chickens), null);
  assert.equal(actuatorRefusal("gantry", { x: 10, y: 10 }, false, clear), null);
  assert.equal(actuatorRefusal("door", { state: "open" }, false, chickens), null);
  assert.equal(actuatorRefusal("feed", { amount: 50 }, false, chickens), null);
});
