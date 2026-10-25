// Tests for ONVIF WS-Discovery: message building and response parsing against known-good
// fixture XML (the standard, documented wire format), plus a real (but response-less) live
// probe to prove the timeout/bounding actually works. No real ONVIF camera is available in
// this environment - full discovery round-trip against a real responder is not tested here;
// see onvifAdapter.ts's header and docs/integrations/CONNECT_MY_PROPERTY.md. Run: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  buildProbeMessage, parseProbeMatch, scopeValue, discoverOnvifDevices, PROBE_TIMEOUT_MS,
} from "./onvifAdapter.js";

const FIXTURE_PROBE_MATCH = `<?xml version="1.0" encoding="UTF-8"?>
<SOAP-ENV:Envelope xmlns:SOAP-ENV="http://www.w3.org/2003/05/soap-envelope" xmlns:wsa="http://schemas.xmlsoap.org/ws/2004/08/addressing" xmlns:d="http://schemas.xmlsoap.org/ws/2005/04/discovery">
  <SOAP-ENV:Header>
    <wsa:MessageID>uuid:aaaa1111-2222-3333-4444-555566667777</wsa:MessageID>
    <wsa:Action>http://schemas.xmlsoap.org/ws/2005/04/discovery/ProbeMatches</wsa:Action>
  </SOAP-ENV:Header>
  <SOAP-ENV:Body>
    <d:ProbeMatches>
      <d:ProbeMatch>
        <wsa:EndpointReference>
          <wsa:Address>urn:uuid:4d454d45-4f52-5950-a0d0-1a2b3c4d5e6f</wsa:Address>
        </wsa:EndpointReference>
        <d:Types>dn:NetworkVideoTransmitter</d:Types>
        <d:Scopes>onvif://www.onvif.org/name/Coop%20Camera onvif://www.onvif.org/location/barn onvif://www.onvif.org/hardware/IPCAM-1080</d:Scopes>
        <d:XAddrs>http://192.168.1.77/onvif/device_service</d:XAddrs>
        <d:MetadataVersion>1</d:MetadataVersion>
      </d:ProbeMatch>
    </d:ProbeMatches>
  </SOAP-ENV:Body>
</SOAP-ENV:Envelope>`;

test("buildProbeMessage produces a well-formed WS-Discovery Probe with the given MessageID", () => {
  const xml = buildProbeMessage("test-message-id-123");
  assert.match(xml, /uuid:test-message-id-123/);
  assert.match(xml, /<d:Probe>/);
  assert.match(xml, /NetworkVideoTransmitter/);
});

test("parseProbeMatch extracts uuid, xaddrs and scopes from a real-shaped ProbeMatch", () => {
  const match = parseProbeMatch(FIXTURE_PROBE_MATCH);
  assert.ok(match);
  assert.equal(match?.uuid, "4d454d45-4f52-5950-a0d0-1a2b3c4d5e6f");
  assert.deepEqual(match?.xaddrs, ["http://192.168.1.77/onvif/device_service"]);
  assert.equal(match?.scopes.length, 3);
});

test("scopeValue reads the name/location/hardware scopes, URL-decoded", () => {
  const match = parseProbeMatch(FIXTURE_PROBE_MATCH);
  assert.ok(match);
  if (!match) return;
  assert.equal(scopeValue(match.scopes, "name"), "Coop Camera");
  assert.equal(scopeValue(match.scopes, "location"), "barn");
  assert.equal(scopeValue(match.scopes, "hardware"), "IPCAM-1080");
  assert.equal(scopeValue(match.scopes, "nonexistent"), undefined);
});

test("parseProbeMatch returns null for XML that isn't a ProbeMatch (no Address or XAddrs)", () => {
  assert.equal(parseProbeMatch("<not-a-probe-match/>"), null);
  assert.equal(parseProbeMatch(""), null);
});

test("live discoverOnvifDevices resolves within the bound and never throws, with no camera present", async () => {
  const start = Date.now();
  const result = await discoverOnvifDevices();
  const elapsed = Date.now() - start;
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.ok(Array.isArray(result.value));
  // No real ONVIF camera in this environment, so an empty list is expected and correct -
  // this test proves the real UDP send + timeout path completes cleanly, not that discovery
  // finds anything.
  assert.ok(elapsed <= PROBE_TIMEOUT_MS + 1000, `took ${elapsed}ms, expected close to the ${PROBE_TIMEOUT_MS}ms bound`);
});
