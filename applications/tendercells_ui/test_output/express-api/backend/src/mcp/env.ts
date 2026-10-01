// env.ts - how the transports pick the hub and the action switch from the environment.
//   TC_MCP_DEMO=1|true, --demo  use the built-in simulated farm (demoHub.ts) - no hub needed;
//                            confirm-twice actions are on (they only move simulated devices)
//                            unless TC_MCP_ALLOW_ACTIONS=0
//   TC_MCP_ALLOW_ACTIONS=1   enable request_action / confirm_action against a real hub
import { demoHub } from "./demoHub.js";
import { hubClient, type HubFetch } from "./hubClient.js";

export interface McpEnv {
  hub: HubFetch;
  allowActions: boolean;
  demo: boolean;
}

const on = (v: string | undefined) => v === "1" || v === "true";
const off = (v: string | undefined) => v === "0" || v === "false";

/**
 * Resolve the hub client and action switch from environment variables.
 *
 * @param env  - Environment (defaults to process.env)
 * @param argv - Command line; `--demo` selects the simulated farm
 * @returns Hub client, whether actions are on, and whether this is the demo farm
 */
export function mcpEnv(env: NodeJS.ProcessEnv = process.env, argv: string[] = process.argv): McpEnv {
  const demo = on(env.TC_MCP_DEMO) || argv.includes("--demo");
  if (demo) return { hub: demoHub(), allowActions: !off(env.TC_MCP_ALLOW_ACTIONS), demo };
  return { hub: hubClient(env.TC_API || undefined, env.TC_TOKEN || undefined), allowActions: on(env.TC_MCP_ALLOW_ACTIONS), demo };
}

/** One line for logs: where the data comes from and whether actions are on. */
export const describeEnv = (e: McpEnv) =>
  `${e.demo ? "demo farm (simulated)" : "hub"} · actions ${e.allowActions ? "enabled (confirm-twice)" : "off (read + E-STOP only)"}`;
