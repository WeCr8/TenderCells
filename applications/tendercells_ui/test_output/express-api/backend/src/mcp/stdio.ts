// stdio.ts - run the Tender Cells MCP server over stdio, for assistants on the same computer
// as (or with network access to) the hub: Claude Desktop, Claude Code and other local
// MCP clients. Usage: `npm run mcp` (see docs/AI_ASSISTANT_PLUGIN.md).
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { hubClient } from "./hubClient.js";
import { createTenderCellsMcp } from "./server.js";

const server = createTenderCellsMcp({ hub: hubClient(), allowActions: process.env.TC_MCP_ALLOW_ACTIONS === "1" });
await server.connect(new StdioServerTransport());
// stdout carries the protocol; log to stderr only.
console.error(`[tendercells-mcp] stdio ready · actions ${process.env.TC_MCP_ALLOW_ACTIONS === "1" ? "enabled (confirm-twice)" : "off (read + E-STOP only)"}`);
