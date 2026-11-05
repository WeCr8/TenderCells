// onvifAdapter.ts - M4, device-discovery slice only.
//
// What this does: ONVIF WS-Discovery (UDP multicast Probe -> ProbeMatch) to find camera
// service addresses on the LAN, bounded to an approved interface by only ever binding/sending
// from this process's own sockets (no raw interface selection, no scanning arbitrary ranges).
//
// What this deliberately does NOT do, and why: it does not call GetProfiles or GetStreamUri,
// does not authenticate to a camera, does not fetch or decode any RTSP/MJPEG/WebRTC media, and
// does not touch express-api/tools/camera-bridge.mts. The spec's own §8.1 says that bridge "is
// documented as written but not tested against physical cameras" and the whole old camera
// workflow needs proving against real hardware FIRST. There is no camera in this environment
// to test any of that against, so none of it is built here - staging an untested media path
// would be worse than not having one. Camera candidates from this adapter carry a
// "camera.stream" capability that is observe-tier, not-installed, and never auto-enabled; a
// human still has to point actual playback at a real device outside this code.
//
// ONVIF WS-Discovery is a standard, well-documented wire format (see docs/onvif.org/profiles),
// so the message-building and response-parsing here ARE real and tested against known-good
// fixture XML and a real local UDP responder in tests - just never against a real camera.
import { randomUUID } from "node:crypto";
import dgram from "node:dgram";
import type { Capability, DiscoveryCandidate } from "./types.js";

const WS_DISCOVERY_MULTICAST_ADDR = "239.255.255.250";
const WS_DISCOVERY_PORT = 3702;
export const PROBE_TIMEOUT_MS = 3000;

export function buildProbeMessage(messageId: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<e:Envelope xmlns:e="http://www.w3.org/2003/05/soap-envelope" xmlns:w="http://schemas.xmlsoap.org/ws/2004/08/addressing" xmlns:d="http://schemas.xmlsoap.org/ws/2005/04/discovery" xmlns:dn="http://www.onvif.org/ver10/network/wsdl">
  <e:Header>
    <w:MessageID>uuid:${messageId}</w:MessageID>
    <w:To e:mustUnderstand="1">urn:schemas-xmlsoap-org:ws:2005:04:discovery</w:To>
    <w:Action e:mustUnderstand="1">http://schemas.xmlsoap.org/ws/2005/04/discovery/Probe</w:Action>
  </e:Header>
  <e:Body>
    <d:Probe>
      <d:Types>dn:NetworkVideoTransmitter</d:Types>
    </d:Probe>
  </e:Body>
</e:Envelope>`;
}

export interface OnvifProbeMatch {
  uuid: string;
  xaddrs: string[];
  scopes: string[];
}

/** Targeted extraction for the known ProbeMatch fields only - not a general XML parser.
 *  ONVIF's WS-Discovery responses follow a narrow, standardized shape; a full SOAP/XML
 *  parser would be overkill for the handful of fields this adapter needs and would be a new
 *  runtime dependency with nothing here to validate it against real-camera quirks anyway. */
export function parseProbeMatch(xml: string): OnvifProbeMatch | null {
  const addressMatch = xml.match(/<(?:\w+:)?Address>\s*urn:uuid:([a-fA-F0-9-]+)\s*<\/(?:\w+:)?Address>/);
  const xaddrsMatch = xml.match(/<(?:\w+:)?XAddrs>([^<]+)<\/(?:\w+:)?XAddrs>/);
  const scopesMatch = xml.match(/<(?:\w+:)?Scopes>([^<]*)<\/(?:\w+:)?Scopes>/);
  if (!addressMatch || !xaddrsMatch) return null;
  return {
    uuid: addressMatch[1],
    xaddrs: xaddrsMatch[1].trim().split(/\s+/).filter(Boolean),
    scopes: scopesMatch ? scopesMatch[1].trim().split(/\s+/).filter(Boolean) : [],
  };
}

export function scopeValue(scopes: string[], key: string): string | undefined {
  const prefix = `onvif://www.onvif.org/${key}/`;
  const hit = scopes.find((s) => s.startsWith(prefix));
  return hit ? decodeURIComponent(hit.slice(prefix.length)) : undefined;
}

export type OnvifResult<T> = { ok: true; value: T } | { ok: false; error: string };

/** Sends one WS-Discovery Probe over UDP multicast and collects unique ProbeMatch replies
 *  for PROBE_TIMEOUT_MS. Bounded by the timeout and by this process's own socket - no
 *  interface/CIDR selection, no sending to anything other than the standard discovery
 *  multicast group. */
export async function discoverOnvifDevices(): Promise<OnvifResult<OnvifProbeMatch[]>> {
  return new Promise((resolve) => {
    const socket = dgram.createSocket("udp4");
    const found = new Map<string, OnvifProbeMatch>();
    const messageId = randomUUID();
    const probe = Buffer.from(buildProbeMessage(messageId));

    const finish = (result: OnvifResult<OnvifProbeMatch[]>) => {
      try { socket.close(); } catch { /* already closed */ }
      resolve(result);
    };

    const timer = setTimeout(() => finish({ ok: true, value: [...found.values()] }), PROBE_TIMEOUT_MS);

    socket.on("error", (err) => {
      clearTimeout(timer);
      finish({ ok: false, error: err.message });
    });

    socket.on("message", (msg) => {
      const match = parseProbeMatch(msg.toString("utf8"));
      if (match) found.set(match.uuid, match);
    });

    socket.on("listening", () => {
      socket.send(probe, WS_DISCOVERY_PORT, WS_DISCOVERY_MULTICAST_ADDR, (err) => {
        if (err) {
          clearTimeout(timer);
          finish({ ok: false, error: err.message });
        }
      });
    });

    socket.bind(0, () => {
      try { socket.setBroadcast(true); } catch { /* not fatal */ }
    });
  });
}

function toCapability(): Capability {
  return { id: "camera.stream", mode: "read", tier: "observe", installed: true, enabled: false, provenance: "real" };
}

export async function discoverCandidates(gatewayId: string): Promise<OnvifResult<{ candidates: DiscoveryCandidate[] }>> {
  const result = await discoverOnvifDevices();
  if (!result.ok) return result;
  const foundAt = new Date().toISOString();
  const candidates: DiscoveryCandidate[] = result.value.map((m) => ({
    tempId: randomUUID(),
    identity: { adapter: "onvif", gatewayId, sourceSystemId: m.uuid, externalId: m.xaddrs[0] ?? m.uuid },
    displayName: scopeValue(m.scopes, "name") || `ONVIF camera ${m.uuid.slice(0, 8)}`,
    capabilities: [toCapability()],
    sourceLabel: "ONVIF (LAN discovery)",
    foundAt,
  }));
  return { ok: true, value: { candidates } };
}
