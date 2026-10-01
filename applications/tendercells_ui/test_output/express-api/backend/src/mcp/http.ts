// http.ts - the Tender Cells MCP server over Streamable HTTP, for assistants that connect
// to a URL: ChatGPT (apps / developer-mode connectors) and Claude custom connectors.
//
//   npm run mcp:http            → http://127.0.0.1:8787/mcp
//
// Environment:
//   TC_MCP_HOST / TC_MCP_PORT   bind address (default 127.0.0.1:8787)
//   TC_MCP_KEY                  access key; required to bind anywhere but loopback. Clients
//                               send it as "Authorization: Bearer <key>", or - for clients
//                               that cannot set headers - in the URL: /mcp/<key>
//   TC_MCP_ALLOW_ACTIONS=1      enable request_action / confirm_action (off by default)
//   TC_MCP_DEMO=1               serve the built-in simulated farm instead of a hub
//   TC_API, TC_TOKEN            how to reach the hub (hubClient.ts)
//
// Expose it to the internet only through an HTTPS tunnel or reverse proxy, with a long
// random TC_MCP_KEY. OAuth for per-user sign-in is the next step (docs/AI_ASSISTANT_PLUGIN.md).
import { timingSafeEqual } from "node:crypto";
import { pathToFileURL } from "node:url";
import express, { type Request, type Response } from "express";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { ConfirmStore } from "./confirm.js";
import { describeEnv, mcpEnv } from "./env.js";
import type { HubFetch } from "./hubClient.js";
import { createTenderCellsMcp, type ActionRequest } from "./server.js";

const LOOPBACK = new Set(["127.0.0.1", "::1", "localhost"]);

/** Is this request carrying the access key (header or URL)? Constant-time compare. */
export function hasKey(req: Pick<Request, "headers" | "params">, key: string | undefined): boolean {
  if (!key) return true;
  const header = String(req.headers.authorization ?? "");
  const given = header.startsWith("Bearer ") ? header.slice(7).trim() : String(req.params?.key ?? "");
  const a = Buffer.from(given);
  const b = Buffer.from(key);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Refuse to serve beyond this machine without a key of at least 24 characters. */
export function checkBind(host: string, key: string | undefined): string | null {
  if (LOOPBACK.has(host)) return null;
  if (!key) return `Refusing to listen on ${host} without TC_MCP_KEY. Set a long random key, or bind to 127.0.0.1 behind a tunnel.`;
  if (key.length < 24) return "TC_MCP_KEY must be at least 24 characters.";
  return null;
}

/**
 * Build the Express app that serves MCP at /mcp (and /mcp/<key>).
 *
 * @param opts - Hub client, access key and whether actions are enabled
 * @returns The Express app (not yet listening)
 */
export function createMcpHttpApp(opts: { hub: HubFetch; key?: string; allowActions?: boolean }) {
  const app = express();
  app.use(express.json({ limit: "1mb" }));
  // One confirmation store for every request: confirm_action arrives in a later HTTP call.
  const confirmations = new ConfirmStore<ActionRequest>();
  const estopSentAt = new Map<string, number>();

  app.get("/health", (_req, res) => { res.json({ ok: true, service: "tendercells-mcp" }); });

  const handle = async (req: Request, res: Response) => {
    if (!hasKey(req, opts.key)) { res.status(401).json({ jsonrpc: "2.0", error: { code: -32001, message: "Missing or wrong access key" }, id: null }); return; }
    if (req.method !== "POST") { res.status(405).set("Allow", "POST").json({ jsonrpc: "2.0", error: { code: -32000, message: "Method not allowed (stateless server: POST only)" }, id: null }); return; }
    // Stateless: a fresh server + transport per request, sharing the confirmation store.
    const server = createTenderCellsMcp({ hub: opts.hub, allowActions: opts.allowActions, confirmations, estopSentAt });
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true });
    res.on("close", () => { void transport.close(); void server.close(); });
    try {
      await server.connect(transport);
      await transport.handleRequest(req, res, req.body);
    } catch (err) {
      if (!res.headersSent) res.status(500).json({ jsonrpc: "2.0", error: { code: -32603, message: (err as Error).message }, id: null });
    }
  };
  app.all("/mcp", handle);
  app.all("/mcp/:key", handle);
  return app;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const host = process.env.TC_MCP_HOST || "127.0.0.1";
  const port = Number(process.env.TC_MCP_PORT || 8787);
  const key = process.env.TC_MCP_KEY || undefined;
  const problem = checkBind(host, key);
  if (problem) { console.error(`[tendercells-mcp] ${problem}`); process.exit(1); }
  const env = mcpEnv();
  createMcpHttpApp({ hub: env.hub, key, allowActions: env.allowActions }).listen(port, host, () => {
    console.log(`[tendercells-mcp] http://${host}:${port}/mcp · key ${key ? "required" : "off (loopback only)"} · ${describeEnv(env)}`);
  });
}
