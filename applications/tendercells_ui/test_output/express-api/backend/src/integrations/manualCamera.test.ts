// Tests for manually-entered RTSP/ONVIF camera URLs: validation never connects to anything,
// only checks shape and that the host is private/local. Run: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { validateManualCameraUrl, manualCameraCandidate } from "./manualCamera.js";

test("rtsp URLs must use the rtsp:// scheme", () => {
  assert.equal(validateManualCameraUrl("rtsp", "rtsp://192.168.1.50/stream1"), null);
  assert.match(validateManualCameraUrl("rtsp", "http://192.168.1.50/stream1") ?? "", /rtsp:\/\//);
});

test("onvif host URLs must use http(s)://", () => {
  assert.equal(validateManualCameraUrl("onvif", "http://192.168.1.50/onvif/device_service"), null);
  assert.equal(validateManualCameraUrl("onvif", "https://camera.local/onvif/device_service"), null);
  assert.match(validateManualCameraUrl("onvif", "rtsp://192.168.1.50") ?? "", /http:\/\/ or https:\/\//);
});

test("a public host is refused for both kinds", () => {
  assert.match(validateManualCameraUrl("rtsp", "rtsp://some-public-camera.example.com/stream") ?? "", /private\/local/);
  assert.match(validateManualCameraUrl("onvif", "https://some-public-camera.example.com/onvif") ?? "", /private\/local/);
});

test("an empty or malformed url is rejected", () => {
  assert.ok(validateManualCameraUrl("rtsp", ""));
  assert.ok(validateManualCameraUrl("onvif", "not a url"));
});

test("manualCameraCandidate is always read-only, observe-tier, not enabled, provenance manual", () => {
  const c = manualCameraCandidate("gw-1", "rtsp", "rtsp://192.168.1.50/stream1");
  assert.equal(c.identity.adapter, "rtsp");
  assert.equal(c.identity.sourceSystemId, "rtsp://192.168.1.50/stream1");
  assert.equal(c.capabilities[0].mode, "read");
  assert.equal(c.capabilities[0].tier, "observe");
  assert.equal(c.capabilities[0].enabled, false);
  assert.equal(c.capabilities[0].provenance, "manual");
});

test("manualCameraCandidate uses the supplied displayName when given, else a sensible default", () => {
  const named = manualCameraCandidate("gw-1", "onvif", "http://192.168.1.60/onvif", "Barn Camera");
  assert.equal(named.displayName, "Barn Camera");
  const unnamed = manualCameraCandidate("gw-1", "onvif", "http://192.168.1.60/onvif");
  assert.match(unnamed.displayName, /ONVIF camera/);
});
