// oauth.ts - OAuth 2.1 for the hosted Tender Cells connector (tendercells.com/mcp), so a
// customer can connect Claude or ChatGPT to THEIR farm with their Tender Cells account.
//
// Follows the MCP authorization spec: protected-resource metadata (RFC 9728), server
// metadata (RFC 8414), dynamic client registration (RFC 7591, public clients), PKCE S256
// only, resource indicators (RFC 8707), refresh-token rotation and revocation (RFC 7009).
// The person signs in and approves on tendercells.com/connect (Firebase Auth); this module
// never sees a password. Only hashes of codes and tokens are stored.
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

export const SCOPE = "farm:read";
export const ACCESS_TTL_MS = 60 * 60_000;            // 1 hour
export const REFRESH_TTL_MS = 30 * 24 * 60 * 60_000; // 30 days
export const CODE_TTL_MS = 5 * 60_000;
export const REQUEST_TTL_MS = 10 * 60_000;

export interface OAuthClient { id: string; name: string; redirectUris: string[]; createdAt: number }
export interface AuthRequest { id: string; clientId: string; redirectUri: string; state?: string; codeChallenge: string; scope: string; resource: string; expiresAt: number }
export interface Grant { kind: "code" | "access" | "refresh"; uid: string; clientId: string; scope: string; resource: string; expiresAt: number; redirectUri?: string; codeChallenge?: string; issuedAt?: number }

/** Persistence for clients, pending requests and grants (Firestore in production). */
export interface OAuthStore {
  putClient(c: OAuthClient): Promise<void>;
  getClient(id: string): Promise<OAuthClient | null>;
  putRequest(r: AuthRequest): Promise<void>;
  getRequest(id: string): Promise<AuthRequest | null>;
  deleteRequest(id: string): Promise<void>;
  /** Keyed by sha256 of the secret value. */
  putGrant(hash: string, g: Grant): Promise<void>;
  /** Read and delete atomically (single use). */
  takeGrant(hash: string): Promise<Grant | null>;
  getGrant(hash: string): Promise<Grant | null>;
  deleteGrant(hash: string): Promise<void>;
  /** Every grant a person holds (for "connected assistants" in their settings). */
  listGrantsForUid(uid: string): Promise<Array<{ hash: string; grant: Grant }>>;
}

export const sha256 = (v: string) => createHash("sha256").update(v).digest("hex");
export const secret = (bytes = 32) => randomBytes(bytes).toString("base64url");
const b64urlSha256 = (v: string) => createHash("sha256").update(v).digest("base64url");

/** A redirect URI a client may register: https anywhere, or http on localhost for development. */
export function allowedRedirect(uri: string): boolean {
  try {
    const u = new URL(uri);
    if (u.hash) return false;
    if (u.protocol === "https:") return true;
    return u.protocol === "http:" && (u.hostname === "localhost" || u.hostname === "127.0.0.1");
  } catch {
    return false;
  }
}

/** PKCE S256 check, constant-time. */
export function pkceOk(verifier: string, challenge: string): boolean {
  if (!/^[A-Za-z0-9._~-]{43,128}$/.test(verifier)) return false;
  const a = Buffer.from(b64urlSha256(verifier));
  const b = Buffer.from(challenge);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** In-memory store for tests and local development. */
export class MemoryOAuthStore implements OAuthStore {
  clients = new Map<string, OAuthClient>();
  requests = new Map<string, AuthRequest>();
  grants = new Map<string, Grant>();
  async putClient(c: OAuthClient) { this.clients.set(c.id, c); }
  async getClient(id: string) { return this.clients.get(id) ?? null; }
  async putRequest(r: AuthRequest) { this.requests.set(r.id, r); }
  async getRequest(id: string) { return this.requests.get(id) ?? null; }
  async deleteRequest(id: string) { this.requests.delete(id); }
  async putGrant(h: string, g: Grant) { this.grants.set(h, g); }
  async takeGrant(h: string) { const g = this.grants.get(h) ?? null; this.grants.delete(h); return g; }
  async getGrant(h: string) { return this.grants.get(h) ?? null; }
  async deleteGrant(h: string) { this.grants.delete(h); }
  async listGrantsForUid(uid: string) { return [...this.grants].filter(([, g]) => g.uid === uid).map(([hash, grant]) => ({ hash, grant })); }
}

/** The slice of Firestore (Admin SDK) the production store uses. */
export interface FirestoreDocs {
  collection(path: string): {
    doc(id: string): { get(): Promise<{ exists: boolean; data(): Record<string, unknown> | undefined }>; set(v: Record<string, unknown>): Promise<unknown>; delete(): Promise<unknown> };
    where(field: string, op: "==", value: unknown): { get(): Promise<{ docs: Array<{ id: string; data(): Record<string, unknown> }> }> };
  };
  runTransaction<T>(fn: (tx: { get(ref: unknown): Promise<{ exists: boolean; data(): Record<string, unknown> | undefined }>; delete(ref: unknown): unknown }) => Promise<T>): Promise<T>;
}

/**
 * Firestore-backed store. Collections (server-only; firestore.rules denies all client access):
 * oauthClients, oauthRequests, oauthGrants (doc id = sha256 of the code / token).
 */
export function firestoreOAuthStore(db: FirestoreDocs): OAuthStore {
  const col = (name: string) => db.collection(name);
  const read = async <T>(name: string, id: string) => {
    const s = await col(name).doc(id).get();
    return s.exists ? (s.data() as T) : null;
  };
  return {
    putClient: async (c) => { await col("oauthClients").doc(c.id).set({ ...c }); },
    getClient: (id) => read<OAuthClient>("oauthClients", id),
    // expireAt (a timestamp) lets a Firestore TTL policy delete stale documents.
    putRequest: async (r) => { await col("oauthRequests").doc(r.id).set({ ...r, expireAt: new Date(r.expiresAt) }); },
    getRequest: (id) => read<AuthRequest>("oauthRequests", id),
    deleteRequest: async (id) => { await col("oauthRequests").doc(id).delete(); },
    putGrant: async (h, g) => { await col("oauthGrants").doc(h).set({ ...g, expireAt: new Date(g.expiresAt) }); },
    takeGrant: (h) => db.runTransaction(async (tx) => {
      const ref = col("oauthGrants").doc(h);
      const s = await tx.get(ref);
      if (!s.exists) return null;
      tx.delete(ref);
      return s.data() as unknown as Grant;
    }),
    getGrant: (h) => read<Grant>("oauthGrants", h),
    deleteGrant: async (h) => { await col("oauthGrants").doc(h).delete(); },
    listGrantsForUid: async (uid) => (await col("oauthGrants").where("uid", "==", uid).get()).docs.map((d) => ({ hash: d.id, grant: d.data() as unknown as Grant })),
  };
}
