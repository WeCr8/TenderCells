// homeAssistantAdapter.ts - M2: a real, read-only Home Assistant client for Connect My
// Property. Deliberately reuses the SAME hub-wide HA_URL / HA_TOKEN env vars that
// mowerBridge.ts already reads - this codebase has no per-owner/per-connector credential
// store anywhere (every vendor adapter - Husqvarna, GARDENA, Mammotion, HA - is a single
// hub-wide env var pair; the deployment model is one hub per property, not multi-tenant
// SaaS). Inventing a new multi-tenant secret store here would be a parallel architecture
// with no precedent and nothing to validate it against. One hub, one HA instance, one token.
//
// Safety boundary, not a style choice: this module NEVER touches the lawn_mower or vacuum
// domains. mower.ts/mowerBridge.ts already owns lawn_mower control, with real animal-safety
// interlocks this module does not have and must not duplicate a path around. See
// CONNECT_MY_PROPERTY_IMPLEMENTATION_SPEC.md §11 ("Duplicate control from multiple
// integrations"). SAFE_DOMAINS is an allowlist, not a denylist, so a new HA domain never
// becomes importable by default.
import { randomUUID } from "node:crypto";
import type { Capability, DiscoveryCandidate } from "./types.js";

const HA_URL = (process.env.HA_URL || "").replace(/\/+$/, "");
const HA_TOKEN = process.env.HA_TOKEN || "";
export const HA_CONFIGURED = Boolean(HA_URL && HA_TOKEN);

/** Read-only domains this adapter will ever stage as candidates. Deliberately excludes
 *  camera (needs its own M4 media hardening) and lawn_mower / vacuum (mower.ts's job). */
export const SAFE_DOMAINS = ["sensor", "binary_sensor", "switch", "light", "climate", "cover", "lock"] as const;
type SafeDomain = (typeof SAFE_DOMAINS)[number];

interface HaState {
  entity_id: string;
  state: string;
  attributes?: { friendly_name?: string; unit_of_measurement?: string; [k: string]: unknown };
  last_changed?: string;
  last_updated?: string;
}

export type HaResult<T> = { ok: true; value: T } | { ok: false; error: string; status?: number };

/** Basic SSRF guard for a hub-configured HA_URL: must be a private/loopback/local address.
 *  First pass only - does not defend against DNS rebinding on a hostname that currently
 *  resolves privately but could be repointed later. Good enough for "the operator typo'd a
 *  public URL into HA_URL"; not a substitute for network-level isolation. */
export function isPrivateHaUrl(url: string): boolean {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return false;
  const host = parsed.hostname.toLowerCase();
  if (host === "localhost" || host === "127.0.0.1" || host === "::1") return true;
  if (host.endsWith(".local") || host.endsWith(".lan") || host.endsWith(".home")) return true;
  // IPv4 literal in a private/link-local range.
  const m = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (m) {
    const [a, b] = [Number(m[1]), Number(m[2])];
    if (a === 10) return true;
    if (a === 192 && b === 168) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 169 && b === 254) return true;
    return false;
  }
  // A bare hostname with no dot (e.g. "homeassistant") is a typical mDNS LAN name.
  if (!host.includes(".")) return true;
  return false;
}

async function ha(path: string): Promise<HaResult<unknown>> {
  if (!HA_CONFIGURED) return { ok: false, error: "HA_URL / HA_TOKEN are not set on this hub" };
  if (!isPrivateHaUrl(HA_URL)) return { ok: false, error: "HA_URL is not a private/local address; refusing to call it" };
  try {
    const res = await fetch(`${HA_URL}${path}`, {
      headers: { Authorization: `Bearer ${HA_TOKEN}`, "Content-Type": "application/json" },
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) return { ok: false, error: `Home Assistant returned ${res.status}`, status: res.status };
    return { ok: true, value: await res.json() };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

/** Auth/reachability check only - never stages or imports anything. */
export async function testConnection(): Promise<HaResult<{ entityCount: number }>> {
  const result = await ha("/api/states");
  if (!result.ok) return result;
  const states = result.value as HaState[];
  return { ok: true, value: { entityCount: Array.isArray(states) ? states.length : 0 } };
}

function domainOf(entityId: string): string {
  return entityId.split(".", 1)[0] ?? "";
}

function toCapability(state: HaState): Capability {
  return {
    id: domainOf(state.entity_id),
    mode: "read",
    tier: "observe",
    installed: true,
    enabled: false,
    unit: state.attributes?.unit_of_measurement,
    observedAt: state.last_updated || state.last_changed,
    value: state.state,
    provenance: "real",
  };
}

/** Fetch every entity and stage only SAFE_DOMAINS as candidates. lawn_mower/vacuum entities
 *  are counted but never returned - verified by a test, not just this comment. */
export async function discoverCandidates(gatewayId: string): Promise<HaResult<{ candidates: DiscoveryCandidate[]; excludedMowerDomainCount: number }>> {
  const result = await ha("/api/states");
  if (!result.ok) return result;
  const states = result.value as HaState[];
  const foundAt = new Date().toISOString();
  let excludedMowerDomainCount = 0;
  const candidates: DiscoveryCandidate[] = [];
  for (const state of states) {
    const domain = domainOf(state.entity_id);
    if (domain === "lawn_mower" || domain === "vacuum") {
      excludedMowerDomainCount++;
      continue;
    }
    if (!SAFE_DOMAINS.includes(domain as SafeDomain)) continue;
    candidates.push({
      tempId: randomUUID(),
      identity: { adapter: "home_assistant", gatewayId, sourceSystemId: HA_URL, externalId: state.entity_id },
      displayName: state.attributes?.friendly_name || state.entity_id,
      capabilities: [toCapability(state)],
      sourceLabel: "Home Assistant",
      foundAt,
    });
  }
  return { ok: true, value: { candidates, excludedMowerDomainCount } };
}
