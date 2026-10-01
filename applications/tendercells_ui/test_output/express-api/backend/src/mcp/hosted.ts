// hosted.ts - the customer-facing Tender Cells connector for Claude and ChatGPT, served by
// the `mcp` Firebase Function behind tendercells.com:
//
//   POST /mcp        a person's own farm, read-only, after OAuth sign-in (scope farm:read)
//   POST /mcp/demo   the simulated demo farm, no sign-in (reviewers, try-before-you-buy)
//   /.well-known/oauth-protected-resource[/mcp], /.well-known/oauth-authorization-server
//   /oauth/register | authorize | request/:id | approve | token | revoke
//   /oauth/connections[/revoke]   a signed-in person's connected assistants (Firebase ID token)
//
// The cloud never moves hardware: hosted modes register no actions and no E-STOP, and the
// Firestore source refuses every write. Actions stay on the farm network (local plugin / OS).
import express, { type Request, type Response } from "express";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { demoHub } from "./demoHub.js";
import type { HubFetch } from "./hubClient.js";
import {
  ACCESS_TTL_MS, CODE_TTL_MS, REFRESH_TTL_MS, REQUEST_TTL_MS, SCOPE,
  allowedRedirect, pkceOk, secret, sha256, type Grant, type OAuthStore,
} from "./oauth.js";
import { createTenderCellsMcp, type McpMode } from "./server.js";

export interface HostedOptions {
  store: OAuthStore;
  /** Verify a Firebase ID token from the consent page. */
  verifyIdToken: (idToken: string) => Promise<{ uid: string }>;
  /** Read-only farm data for a signed-in person. */
  hubFor: (uid: string) => HubFetch;
  /** Public origin, e.g. https://tendercells.com */
  issuer?: string;
  now?: () => number;
}

const esc = (v: string) => v.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

/** What a browser shows at /mcp or /mcp/demo: this is a connector URL, here is how to add it. */
export function landingPage(url: string, demo: boolean): string {
  const u = esc(url);
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Tender Cells connector${demo ? " (demo farm)" : ""}</title><meta name="robots" content="noindex">
<style>body{margin:0;background:#F7F4EE;color:#0D2B1E;font:16px/1.5 system-ui,-apple-system,"Segoe UI",sans-serif}
main{max-width:640px;margin:0 auto;padding:32px 20px}img{border-radius:16px}h1{font-size:26px;margin:12px 0 4px}
code{display:block;background:#fff;border:1px solid #c9c2b0;border-radius:8px;padding:10px 12px;font-size:15px;word-break:break-all;margin:8px 0 16px}
h2{font-size:18px;margin:24px 0 6px}ol{padding-left:22px}li{margin:4px 0}.note{color:#5b5440;font-size:14px}a{color:#147C38}</style></head>
<body><main><img src="/brand/tendercells-icon-128.png" width="64" height="64" alt="Tender Cells">
<h1>Tender Cells connector${demo ? " - demo farm" : ""}</h1>
<p>This address is for <strong>Claude</strong> or <strong>ChatGPT</strong>, not for a web browser. ${demo ? "It serves a simulated farm, so no sign-in is needed." : "You'll sign in with your Tender Cells account when you connect, and it can only read your farm (it never moves hardware)."}</p>
<code>${u}</code>
<h2>Claude</h2><ol><li>Open <strong>Settings → Connectors</strong> and choose <strong>Add custom connector</strong>.</li><li>Name it <em>Tender Cells</em> and paste the address above.</li><li>${demo ? "Click Add" : "Click Connect, sign in on tendercells.com and allow read-only access"}.</li><li>In a chat, switch the connector on and ask <em>“How is my farm?”</em></li></ol>
<h2>ChatGPT</h2><ol><li>Open <strong>Settings → Apps &amp; Connectors</strong> (developer mode may need to be on) and create a connector.</li><li>Paste the address above${demo ? " and choose no authentication" : " and choose OAuth"}.</li><li>Ask <em>“How is my farm?”</em></li></ol>
<p class="note">Menu names change from time to time. Step-by-step with pictures: <a href="/assistants">tendercells.com/assistants</a> · manage connected assistants in the Tender Cells app under Account → Claude &amp; ChatGPT.</p>
</main></body></html>`;
}

const rpcError = (res: Response, status: number, message: string) =>
  res.status(status).json({ jsonrpc: "2.0", error: { code: -32000, message }, id: null });

/**
 * Build the hosted connector (OAuth + MCP) as an Express app.
 *
 * @param opts - Store, ID-token verifier, per-person data source, issuer and clock
 * @returns The Express app; mount it at the site root
 */
export function createHostedApp(opts: HostedOptions) {
  const issuer = (opts.issuer ?? "https://tendercells.com").replace(/\/$/, "");
  const resource = `${issuer}/mcp`;
  const now = opts.now ?? Date.now;
  const { store } = opts;
  const app = express();
  app.disable("x-powered-by");
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: false }));
  app.use((_req, res, next) => { res.set("Cache-Control", "no-store"); next(); });

  // ── discovery ────────────────────────────────────────────────────────────────
  const protectedResource = {
    resource,
    authorization_servers: [issuer],
    scopes_supported: [SCOPE],
    bearer_methods_supported: ["header"],
    resource_name: "Tender Cells",
    resource_documentation: `${issuer}/docs/ai-assistant-plugin`,
  };
  app.get(["/.well-known/oauth-protected-resource", "/.well-known/oauth-protected-resource/mcp"], (_req, res) => { res.json(protectedResource); });
  app.get(["/.well-known/oauth-authorization-server", "/.well-known/oauth-authorization-server/mcp"], (_req, res) => {
    res.json({
      issuer,
      authorization_endpoint: `${issuer}/oauth/authorize`,
      token_endpoint: `${issuer}/oauth/token`,
      registration_endpoint: `${issuer}/oauth/register`,
      revocation_endpoint: `${issuer}/oauth/revoke`,
      response_types_supported: ["code"],
      grant_types_supported: ["authorization_code", "refresh_token"],
      code_challenge_methods_supported: ["S256"],
      token_endpoint_auth_methods_supported: ["none"],
      scopes_supported: [SCOPE],
      service_documentation: `${issuer}/docs/ai-assistant-plugin`,
    });
  });

  // ── dynamic client registration (public clients) ─────────────────────────────
  app.post("/oauth/register", async (req, res) => {
    const body = (req.body ?? {}) as { client_name?: unknown; redirect_uris?: unknown };
    const uris = Array.isArray(body.redirect_uris) ? body.redirect_uris.filter((u): u is string => typeof u === "string") : [];
    if (!uris.length || uris.length > 10 || !uris.every(allowedRedirect)) {
      res.status(400).json({ error: "invalid_redirect_uri", error_description: "redirect_uris must be 1-10 https URLs (or http on localhost)" });
      return;
    }
    const name = typeof body.client_name === "string" && body.client_name.trim() ? body.client_name.trim().slice(0, 100) : "AI assistant";
    const client = { id: `tc_${secret(18)}`, name, redirectUris: uris, createdAt: now() };
    await store.putClient(client);
    res.status(201).json({
      client_id: client.id, client_name: name, redirect_uris: uris, client_id_issued_at: Math.floor(client.createdAt / 1000),
      token_endpoint_auth_method: "none", grant_types: ["authorization_code", "refresh_token"], response_types: ["code"], scope: SCOPE,
    });
  });

  // ── authorize: validate, park the request, send the person to the consent page ─
  app.get("/oauth/authorize", async (req, res) => {
    const q = req.query as Record<string, string | undefined>;
    const client = q.client_id ? await store.getClient(q.client_id) : null;
    // Never redirect to an unverified URI: show the error here instead.
    if (!client || !q.redirect_uri || !client.redirectUris.includes(q.redirect_uri)) {
      res.status(400).type("text/plain").send("Unknown client or redirect URI. Reconnect Tender Cells from your assistant's settings.");
      return;
    }
    const back = (error: string, description: string) => {
      const u = new URL(q.redirect_uri!);
      u.searchParams.set("error", error);
      u.searchParams.set("error_description", description);
      if (q.state) u.searchParams.set("state", q.state);
      u.searchParams.set("iss", issuer);
      res.redirect(302, u.toString());
    };
    if (q.response_type !== "code") return back("unsupported_response_type", "Only response_type=code is supported");
    if (!q.code_challenge || q.code_challenge_method !== "S256") return back("invalid_request", "PKCE with S256 is required");
    if (q.scope && !q.scope.split(" ").every((s) => s === SCOPE)) return back("invalid_scope", `Supported scope: ${SCOPE}`);
    if (q.resource && q.resource.replace(/\/$/, "") !== resource) return back("invalid_target", `Resource must be ${resource}`);
    const id = secret(18);
    await store.putRequest({ id, clientId: client.id, redirectUri: q.redirect_uri, state: q.state, codeChallenge: q.code_challenge, scope: SCOPE, resource, expiresAt: now() + REQUEST_TTL_MS });
    res.redirect(302, `${issuer}/connect?request=${encodeURIComponent(id)}`);
  });

  // What the consent page shows (no secrets).
  app.get("/oauth/request/:id", async (req, res) => {
    const r = await store.getRequest(req.params.id);
    if (!r || r.expiresAt < now()) { res.status(404).json({ error: "This sign-in request expired. Start again from your assistant." }); return; }
    const client = await store.getClient(r.clientId);
    res.json({ clientName: client?.name ?? "AI assistant", redirectHost: new URL(r.redirectUri).host, scope: r.scope, expiresAt: r.expiresAt });
  });

  // The consent page posts the person's decision with a fresh Firebase ID token.
  app.post("/oauth/approve", async (req, res) => {
    const { request: id, idToken, approve } = (req.body ?? {}) as { request?: string; idToken?: string; approve?: boolean };
    const r = id ? await store.getRequest(id) : null;
    if (!r || r.expiresAt < now()) { res.status(404).json({ error: "This sign-in request expired. Start again from your assistant." }); return; }
    let uid: string;
    try {
      uid = (await opts.verifyIdToken(String(idToken ?? ""))).uid;
    } catch {
      res.status(401).json({ error: "Please sign in again." });
      return;
    }
    await store.deleteRequest(r.id);
    const u = new URL(r.redirectUri);
    if (r.state) u.searchParams.set("state", r.state);
    u.searchParams.set("iss", issuer);
    if (approve !== true) {
      u.searchParams.set("error", "access_denied");
      res.json({ redirect: u.toString() });
      return;
    }
    const code = secret();
    await store.putGrant(sha256(code), { kind: "code", uid, clientId: r.clientId, scope: r.scope, resource: r.resource, redirectUri: r.redirectUri, codeChallenge: r.codeChallenge, expiresAt: now() + CODE_TTL_MS, issuedAt: now() });
    u.searchParams.set("code", code);
    res.json({ redirect: u.toString() });
  });

  // ── token ─────────────────────────────────────────────────────────────────────
  const issueTokens = async (g: Pick<Grant, "uid" | "clientId" | "scope" | "resource" | "issuedAt">) => {
    const access = secret();
    const refresh = secret();
    // issuedAt = when the person first approved this assistant (kept across refreshes).
    const base = { uid: g.uid, clientId: g.clientId, scope: g.scope, resource: g.resource, issuedAt: g.issuedAt ?? now() };
    await store.putGrant(sha256(access), { ...base, kind: "access", expiresAt: now() + ACCESS_TTL_MS });
    await store.putGrant(sha256(refresh), { ...base, kind: "refresh", expiresAt: now() + REFRESH_TTL_MS });
    return { access_token: access, token_type: "Bearer", expires_in: Math.floor(ACCESS_TTL_MS / 1000), refresh_token: refresh, scope: g.scope };
  };
  app.post("/oauth/token", async (req, res) => {
    const b = (req.body ?? {}) as Record<string, string | undefined>;
    const bad = (error: string, description: string) => { res.status(400).json({ error, error_description: description }); };
    if (b.grant_type === "authorization_code") {
      const g = b.code ? await store.takeGrant(sha256(b.code)) : null;
      if (!g || g.kind !== "code" || g.expiresAt < now()) return bad("invalid_grant", "Code is invalid, used or expired");
      if (g.clientId !== b.client_id || g.redirectUri !== b.redirect_uri) return bad("invalid_grant", "Client or redirect URI does not match");
      if (!b.code_verifier || !pkceOk(b.code_verifier, g.codeChallenge ?? "")) return bad("invalid_grant", "PKCE verification failed");
      res.json(await issueTokens(g));
      return;
    }
    if (b.grant_type === "refresh_token") {
      const g = b.refresh_token ? await store.takeGrant(sha256(b.refresh_token)) : null; // rotation: old token is gone
      if (!g || g.kind !== "refresh" || g.expiresAt < now()) return bad("invalid_grant", "Refresh token is invalid or expired");
      if (b.client_id && g.clientId !== b.client_id) return bad("invalid_grant", "Client does not match");
      res.json(await issueTokens(g));
      return;
    }
    bad("unsupported_grant_type", "Use authorization_code or refresh_token");
  });

  app.post("/oauth/revoke", async (req, res) => {
    const token = (req.body as { token?: string } | undefined)?.token;
    if (token) await store.deleteGrant(sha256(token));
    res.status(200).end();
  });

  // ── connected assistants: the person manages their own connections ────────────
  // Authenticated with the person's own Firebase ID token (from the Tender Cells app),
  // never with a connector token, so an assistant cannot list or revoke connections.
  const signedIn = async (req: Request, res: Response): Promise<string | null> => {
    const header = String(req.headers.authorization ?? "");
    const idToken = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
    try {
      if (!idToken) throw new Error("missing");
      return (await opts.verifyIdToken(idToken)).uid;
    } catch {
      res.status(401).json({ error: "Sign in to Tender Cells to manage connected assistants." });
      return null;
    }
  };
  app.get("/oauth/connections", async (req, res) => {
    const uid = await signedIn(req, res);
    if (!uid) return;
    const live = (await store.listGrantsForUid(uid)).filter(({ grant }) => grant.kind !== "code" && grant.expiresAt > now());
    const byClient = new Map<string, { connectedAt: number; until: number }>();
    for (const { grant } of live) {
      const prev = byClient.get(grant.clientId);
      const connectedAt = Math.min(prev?.connectedAt ?? Infinity, grant.issuedAt ?? grant.expiresAt);
      byClient.set(grant.clientId, { connectedAt, until: Math.max(prev?.until ?? 0, grant.expiresAt) });
    }
    const connections = await Promise.all([...byClient].map(async ([clientId, v]) => {
      const client = await store.getClient(clientId);
      const host = client?.redirectUris[0] ? new URL(client.redirectUris[0]).host : "";
      return { clientId, name: client?.name ?? "AI assistant", host, scope: SCOPE, connectedAt: v.connectedAt, until: v.until };
    }));
    res.json({ connections: connections.sort((a, b) => b.connectedAt - a.connectedAt) });
  });
  app.post("/oauth/connections/revoke", async (req, res) => {
    const uid = await signedIn(req, res);
    if (!uid) return;
    const clientId = String((req.body as { clientId?: string } | undefined)?.clientId ?? "");
    const mine = (await store.listGrantsForUid(uid)).filter(({ grant }) => !clientId || grant.clientId === clientId);
    await Promise.all(mine.map(({ hash }) => store.deleteGrant(hash)));
    res.json({ revoked: mine.length });
  });

  // ── MCP ───────────────────────────────────────────────────────────────────────
  const serve = async (req: Request, res: Response, hub: HubFetch, mode: McpMode) => {
    const server = createTenderCellsMcp({ hub, mode });
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true });
    res.on("close", () => { void transport.close(); void server.close(); });
    try {
      await server.connect(transport);
      await transport.handleRequest(req, res, req.body);
    } catch (err) {
      if (!res.headersSent) rpcError(res, 500, (err as Error).message);
    }
  };

  app.post("/mcp/demo", (req, res) => { void serve(req, res, demoHub(now), "hosted-demo"); });
  app.post("/mcp", async (req, res) => {
    const header = String(req.headers.authorization ?? "");
    const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
    const g = token ? await store.getGrant(sha256(token)) : null;
    if (!g || g.kind !== "access" || g.expiresAt < now() || g.resource !== resource) {
      res.set("WWW-Authenticate", `Bearer resource_metadata="${issuer}/.well-known/oauth-protected-resource/mcp", scope="${SCOPE}"${token ? ', error="invalid_token"' : ""}`);
      rpcError(res, 401, "Sign in to Tender Cells to connect your farm.");
      return;
    }
    await serve(req, res, opts.hubFor(g.uid), "hosted");
  });
  // A person who opens the URL in a browser gets a short "how to add this" page; MCP
  // clients (which never ask for text/html) keep getting the JSON-RPC 405.
  app.get(["/mcp", "/mcp/demo"], (req, res, next) => {
    const accept = String(req.headers.accept ?? "");
    if (!accept.includes("text/html") || accept.includes("text/event-stream")) return next();
    res.set("Content-Security-Policy", "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'; frame-ancestors 'none'");
    res.type("html").send(landingPage(`${issuer}${req.path}`, req.path.endsWith("/demo")));
  });
  app.all(["/mcp", "/mcp/demo"], (_req, res) => { res.set("Allow", "POST"); rpcError(res, 405, "Method not allowed (stateless server: POST only)"); });

  return app;
}
