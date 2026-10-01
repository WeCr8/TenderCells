// stdio.ts - run the Tender Cells MCP server over stdio, for assistants on the same computer
// as (or with network access to) the hub: Claude Desktop, Claude Code and other local
// MCP clients. Usage: `npm run mcp`, or `npm run mcp:demo` for the simulated farm
// (see docs/AI_ASSISTANT_PLUGIN.md).
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { describeEnv, mcpEnv } from "./env.js";
import { createTenderCellsMcp } from "./server.js";

const env = mcpEnv();
const server = createTenderCellsMcp({ hub: env.hub, allowActions: env.allowActions });
await server.connect(new StdioServerTransport());
// stdout carries the protocol; log to stderr only.
console.error(`[tendercells-mcp] stdio ready · ${describeEnv(env)}`);
