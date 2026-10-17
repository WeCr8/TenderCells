/** SCAFFOLD — single v2 registration point. */
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { HubFetch } from "../hubClient.js";
import { registerBuilderReadTools } from "./builderTools.js";
import { registerCustomerReadTools } from "./customerTools.js";

export function registerV2ReadTools(server: McpServer, opts: { hub: HubFetch }) {
  registerCustomerReadTools(server, opts.hub);
  registerBuilderReadTools(server);
}
