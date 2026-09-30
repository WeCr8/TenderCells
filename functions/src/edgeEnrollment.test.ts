import { hashEnrollmentCode, hashMqttSecret, verifyMqttSecret } from "./edgeEnrollment";

describe("edge enrollment credentials", () => {
  it("stores enrollment codes by a one-way digest", () => {
    expect(hashEnrollmentCode("sample-code")).toHaveLength(64);
    expect(hashEnrollmentCode("sample-code")).not.toContain("sample-code");
  });

  it("stores MQTT secrets as salted scrypt hashes", () => {
    const encoded = hashMqttSecret("mqtt-secret", "00112233445566778899aabbccddeeff");
    expect(encoded).not.toContain("mqtt-secret");
    expect(verifyMqttSecret("mqtt-secret", encoded)).toBe(true);
    expect(verifyMqttSecret("wrong-secret", encoded)).toBe(false);
  });

  it("keeps product ownership lookup on the canonical userId field", () => {
    const source = require("node:fs").readFileSync(__filename.replace("edgeEnrollment.test.ts", "edgeEnrollment.ts"), "utf8");
    expect(source).toContain('.where("userId", "==", uid)');
    expect(source).toContain('candidate.data().device_id === deviceId');
  });
});
