// manualCamera.ts - a manually entered local RTSP URL or ONVIF host (spec §8.2 items 2-3).
// Metadata staging only: this never connects to, probes, or fetches anything from the URL -
// it validates the URL shape and that it's a private/local address, and stages a candidate.
// Actually ingesting RTSP media (converting to WebRTC/HLS) is explicitly out of scope here;
// see onvifAdapter.ts's header for why - no camera hardware in this environment to test
// ingestion against, and the spec itself gates that behind a real-hardware production pass.
import { randomUUID } from "node:crypto";
import type { AdapterKind, Capability, DiscoveryCandidate } from "./types.js";
import { isPrivateHaUrl } from "./homeAssistantAdapter.js"; // same private/local check, protocol-agnostic enough to reuse

export type ManualCameraKind = Extract<AdapterKind, "rtsp" | "onvif">;

export function validateManualCameraUrl(kind: ManualCameraKind, url: string): string | null {
  if (!url || typeof url !== "string") return "url is required";
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return "url is not a valid URL";
  }
  if (kind === "rtsp" && parsed.protocol !== "rtsp:") return "An RTSP URL must start with rtsp://";
  if (kind === "onvif" && !["http:", "https:"].includes(parsed.protocol)) return "An ONVIF host URL must start with http:// or https://";
  // isPrivateHaUrl only recognizes http(s) - check the hostname directly for rtsp:// instead.
  const hostOk = kind === "onvif" ? isPrivateHaUrl(url) : isPrivateHaUrl(`http://${parsed.hostname}${parsed.port ? `:${parsed.port}` : ""}`);
  if (!hostOk) return "That host is not a private/local address; refusing to add it";
  return null;
}

function toCapability(): Capability {
  return { id: "camera.stream", mode: "read", tier: "observe", installed: true, enabled: false, provenance: "manual" };
}

export function manualCameraCandidate(gatewayId: string, kind: ManualCameraKind, url: string, displayName?: string): DiscoveryCandidate {
  return {
    tempId: randomUUID(),
    identity: { adapter: kind, gatewayId, sourceSystemId: url, externalId: url },
    displayName: displayName || `${kind === "rtsp" ? "RTSP" : "ONVIF"} camera (manual)`,
    capabilities: [toCapability()],
    sourceLabel: kind === "rtsp" ? "Manually entered RTSP URL" : "Manually entered ONVIF host",
    foundAt: new Date().toISOString(),
  };
}
