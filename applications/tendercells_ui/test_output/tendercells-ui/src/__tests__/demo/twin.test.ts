import { describe, expect, it } from "vitest";
import { DEMO_PROPERTY_ID, deviceTwinId, twinId } from "../../lib/twin/twin";

describe("twin ids", () => {
  it("builds tc:{kind}:{type}:{id}", () => {
    expect(twinId("animal", "Chicken", "Pepper")).toBe("tc:animal:chicken:pepper");
  });
  it("maps demo devices to the right twin kind", () => {
    expect(deviceTwinId("ct_001")).toBe("tc:habitat:chicken-tender:ct_001");
    expect(deviceTwinId("wt_001")).toBe("tc:device:watchtower:wt_001");
    expect(deviceTwinId("rr_001")).toBe("tc:robot:roaming-roost:rr_001");
    expect(deviceTwinId("zz_9")).toBe("tc:device:device:zz_9");
  });
  it("has a property twin", () => {
    expect(DEMO_PROPERTY_ID).toBe("tc:property:demo-farm");
  });
});
