// Optional MQTT broker credentials. Run: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { brokerCredentials, credentialsMatch } from "./brokerAuth.js";

test("broker auth is off unless both variables are set (classroom default)", () => {
  assert.equal(brokerCredentials({}), null);
  assert.equal(brokerCredentials({ TC_MQTT_USERNAME: "hub" }), null);
  assert.equal(brokerCredentials({ TC_MQTT_USERNAME: "hub", TC_MQTT_PASSWORD: "" }), null);
  assert.deepEqual(brokerCredentials({ TC_MQTT_USERNAME: "hub", TC_MQTT_PASSWORD: "s3cret-pass" }), { username: "hub", password: "s3cret-pass" });
});

test("only the exact pair connects", () => {
  const c = { username: "hub", password: "s3cret-pass" };
  assert.ok(credentialsMatch(c, "hub", Buffer.from("s3cret-pass")));
  assert.ok(!credentialsMatch(c, "hub", Buffer.from("s3cret-pas")));
  assert.ok(!credentialsMatch(c, "hu", Buffer.from("s3cret-pass")));
  assert.ok(!credentialsMatch(c, undefined, Buffer.from("s3cret-pass")));
  assert.ok(!credentialsMatch(c, "hub", undefined));
});
