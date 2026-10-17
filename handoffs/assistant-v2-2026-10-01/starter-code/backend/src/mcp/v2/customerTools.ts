/** SCAFFOLD — customer-friendly facade over the existing farmOverview. */
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { farmOverview } from "../server.js";
import type { HubFetch } from "../hubClient.js";

const READ = { readOnlyHint: true, openWorldHint: false } as const;
const text = (v: unknown) => ({ content: [{ type: "text" as const, text: typeof v === "string" ? v : JSON.stringify(v, null, 2) }] });

export function registerCustomerReadTools(server: McpServer, hub: HubFetch) {
  server.registerTool("get_farm_home", {
    title: "TenderCells farm home",
    description: "Concise home view of this farm: systems, attention items and device status. Customer-friendly alternative to parsing raw snapshots.",
    annotations: READ,
  }, async () => {
    const o = await farmOverview(hub);
    const payload = {
      simulated: o.simulated,
      generatedAt: o.generatedAt,
      hubError: o.hubError,
      systemCount: o.devices.length,
      needsAttention: o.attention.length,
      attention: o.attention.slice(0, 10),
      devices: o.devices.map((d) => ({ id: d.id, online: d.online, state: d.state, flags: d.flags })),
    };
    return { ...text(payload), structuredContent: payload as unknown as Record<string, unknown>, isError: Boolean(o.hubError) || undefined };
  });

  server.registerTool("list_devices", {
    title: "TenderCells devices",
    description: "List devices on this farm with concise online/state/health status.",
    annotations: READ,
  }, async () => {
    const o = await farmOverview(hub);
    return text({
      simulated: o.simulated,
      devices: o.devices.map((d) => ({
        id: d.id, online: d.online, state: d.state, flags: d.flags,
        openEventCount: d.openEvents.length, recentAlertCount: d.recentAlerts.length,
      })),
    });
  });
}
