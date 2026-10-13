// claim.ts - proof of possession for claiming a device (unit-tested).
//
// FIX(2026-10-12): claiming was first-come: any signed-in person could claim any unclaimed id
// they saw (or guessed - default ids like ct_001 collide across farms). A claim now needs one of:
//   1. the board's claim code - printed on its serial banner and its setup page (starter-node
//      firmware), never sent over the network. The board only publishes
//      claimHash = sha256("tc-claim:v1:<deviceId>:<CODE>") in its state message;
//   2. a one-time pairing token minted on the hub itself (POST /api/mqtt/pairing-tokens from
//      the hub machine, or with X-TC-Hub-Admin: $TC_HUB_ADMIN_KEY; `tc pair <deviceId>`), for
//      boards whose firmware has no claim code (chicken-tender, watchtower, ...).
// Wrong codes are rate-limited per device. A simulation-only device document (the only kind the
// app may create directly, see firestore.rules) never blocks the real board's owner.
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

/** Upper-case, drop spaces and dashes, map look-alikes (Crockford base32: O→0, I/L→1). */
export function normalizeClaimCode(code: string): string {
  return code.toUpperCase().replace(/[\s-]/g, "").replace(/O/g, "0").replace(/[IL]/g, "1");
}

/** What the board publishes. Firmware computes the same string (starter-node claimHash()). */
export function claimHash(deviceId: string, code: string): string {
  return createHash("sha256").update(`tc-claim:v1:${deviceId}:${normalizeClaimCode(code)}`).digest("hex");
}

export const isClaimHash = (v: unknown): v is string => typeof v === "string" && /^[0-9a-f]{64}$/.test(v);

function sameHex(a: string, b: string): boolean {
  const x = Buffer.from(a, "hex");
  const y = Buffer.from(b, "hex");
  return x.length === y.length && x.length > 0 && timingSafeEqual(x, y);
}

export const PAIRING_TTL_MS = 10 * 60_000;
const sha = (v: string) => createHash("sha256").update(v).digest("hex");

/** One-time pairing tokens, held in hub memory (hash only). */
export class PairingTokens {
  private tokens = new Map<string, { deviceId: string | null; expiresAt: number }>();
  constructor(private now: () => number = Date.now) {}

  /** Mint a token, optionally only valid for one device. Shown once. */
  issue(deviceId: string | null = null): { token: string; deviceId: string | null; expiresAt: number } {
    this.sweep();
    const token = `tcp_${randomBytes(24).toString("base64url")}`;
    const expiresAt = this.now() + PAIRING_TTL_MS;
    this.tokens.set(sha(token), { deviceId, expiresAt });
    return { token, deviceId, expiresAt };
  }

  /** Use a token for a device. Single use: a token is gone after any successful consume. */
  consume(token: string, deviceId: string): boolean {
    this.sweep();
    const h = sha(String(token));
    const t = this.tokens.get(h);
    if (!t || t.expiresAt < this.now()) return false;
    if (t.deviceId && t.deviceId !== deviceId) return false;
    this.tokens.delete(h);
    return true;
  }

  private sweep() {
    const now = this.now();
    for (const [h, t] of this.tokens) if (t.expiresAt < now) this.tokens.delete(h);
  }
}

/** At most `max` wrong proofs per device per window. */
export class ClaimLimiter {
  private fails = new Map<string, number[]>();
  constructor(private max = 5, private windowMs = 10 * 60_000, private now: () => number = Date.now) {}
  blocked(deviceId: string): boolean {
    const t = this.now();
    const recent = (this.fails.get(deviceId) ?? []).filter((x) => t - x < this.windowMs);
    this.fails.set(deviceId, recent);
    return recent.length >= this.max;
  }
  fail(deviceId: string) { this.fails.set(deviceId, [...(this.fails.get(deviceId) ?? []), this.now()]); }
}

export type ClaimVia = "claim-code" | "pairing-token";

/**
 * Check the proof in a claim request.
 *
 * @param deviceId - The device being claimed
 * @param body - { claimCode } or { pairingToken }
 * @param expectedHash - The claimHash this device published (hub memory or devices/{id}.claimHash)
 * @param pairing - The hub's pairing tokens
 * @returns How the claim was proven, or { status, error }
 */
export function checkClaimProof(
  deviceId: string,
  body: { claimCode?: unknown; pairingToken?: unknown } | undefined,
  expectedHash: string | undefined,
  pairing: PairingTokens,
): { via: ClaimVia } | { status: number; error: string } {
  const code = typeof body?.claimCode === "string" ? body.claimCode.trim() : "";
  const token = typeof body?.pairingToken === "string" ? body.pairingToken.trim() : "";
  if (token) {
    return pairing.consume(token, deviceId) ? { via: "pairing-token" } : { status: 403, error: "That pairing token is wrong, used or expired. Make a new one on the hub (tc pair)." };
  }
  if (code) {
    if (!expectedHash) {
      return { status: 409, error: "This hub has not heard a claim code from that device. Power it on near the hub, or use a pairing token (tc pair)." };
    }
    return sameHex(claimHash(deviceId, code), expectedHash) ? { via: "claim-code" } : { status: 403, error: "That claim code does not match this device." };
  }
  return { status: 400, error: "Enter the claim code printed on the device (serial banner or setup page), or a pairing token from the hub (tc pair)." };
}

/**
 * May `uid` take this device, given its current document?
 *
 * @returns null when allowed, otherwise the reason (HTTP 409)
 */
export function claimConflict(existing: Record<string, unknown> | undefined, uid: string): string | null {
  const owner = existing ? (existing.ownerId ?? existing.userId) : undefined;
  if (!owner || owner === uid) return null;
  // Only a client-created simulation document can be displaced by the real board's proof.
  if (existing?.simOnly === true) return null;
  return "Device already claimed by another account. The owner must release it first.";
}

/** Is this request from the hub machine itself (not proxied)? */
export function isLocalRequest(remoteAddress: string | undefined, headers: Record<string, unknown>): boolean {
  if (headers["x-forwarded-for"] || headers["forwarded"]) return false;
  return remoteAddress === "127.0.0.1" || remoteAddress === "::1" || remoteAddress === "::ffff:127.0.0.1";
}

/** Constant-time check of X-TC-Hub-Admin against TC_HUB_ADMIN_KEY (off when unset or short). */
export function hubAdminOk(presented: unknown, configured: string | undefined): boolean {
  if (!configured || configured.length < 16 || typeof presented !== "string") return false;
  const a = Buffer.from(sha(presented), "hex");
  const b = Buffer.from(sha(configured), "hex");
  return timingSafeEqual(a, b);
}
