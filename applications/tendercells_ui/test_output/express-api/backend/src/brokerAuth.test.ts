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

test("an API-key broker client is fenced to its own device topics and scopes", async () => {
  const { keyTopicRefusal } = await import("./brokerAuth.js");
  const bound = { kind: "apiKey" as const, uid: "a", keyId: "k", scopes: ["device:telemetry" as const, "device:commands" as const], deviceId: "node_1" };
  const owns = async (id: string) => id === "node_1" || id === "node_2";
  assert.equal(await keyTopicRefusal(bound, "publish", "tc/node_1/sensors", owns), null);
  assert.equal(await keyTopicRefusal(bound, "publish", "tc/node_1/state/arm", owns), null);
  assert.equal(await keyTopicRefusal(bound, "subscribe", "tc/node_1/cmd/door", owns), null);
  assert.equal(await keyTopicRefusal(bound, "subscribe", "tc/node_1/cmd/#", owns), null);
  assert.match(await keyTopicRefusal(bound, "publish", "tc/node_2/sensors", owns) ?? "", /bound to node_1/, "wrong device");
  assert.match(await keyTopicRefusal(bound, "publish", "tc/node_1/cmd/door", owns) ?? "", /not allowed/, "a device cannot publish commands");
  assert.match(await keyTopicRefusal(bound, "subscribe", "tc/+/cmd/+", owns) ?? "", /not allowed/, "no wildcard over devices");
  assert.match(await keyTopicRefusal(bound, "subscribe", "#", owns) ?? "", /not allowed/);
  const telemetryOnly = { ...bound, scopes: ["device:telemetry" as const] };
  assert.match(await keyTopicRefusal(telemetryOnly, "subscribe", "tc/node_1/cmd/door", owns) ?? "", /device:commands/, "missing scope");
  const unbound = { ...bound, deviceId: null };
  assert.equal(await keyTopicRefusal(unbound, "publish", "tc/node_2/sensors", owns), null, "unbound key: any device the owner owns");
  assert.match(await keyTopicRefusal(unbound, "publish", "tc/ct_999/sensors", owns) ?? "", /does not own/, "wrong owner");
});
