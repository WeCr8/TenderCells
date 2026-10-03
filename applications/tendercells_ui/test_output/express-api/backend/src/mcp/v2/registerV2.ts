import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { FarmOverview } from '../server.js';
import { READ, result, registerBuilderReadTools } from './builderTools.js';
export const V2_TOOLS = ['get_farm_home','list_devices','list_missions','get_mission','list_builder_projects','get_builder_project','get_builder_step'];
export function registerV2ReadTools(server: McpServer, overview: () => Promise<FarmOverview>, source: string) {
  for (const name of ['get_farm_home', 'list_devices']) {
    server.registerTool(name, { description: name === 'get_farm_home' ? 'Concise farm home with device health and attention items. Only devices accessible to this account/hub; not a complete property or animal registry.' : 'List accessible devices with online, state and health status. Limited to the existing overview cap of 20 devices.', annotations: READ }, async () => {
      const o = await overview();
      return { ...result({ simulated: o.simulated, source, generatedAt: o.generatedAt, hubError: o.hubError ?? null, limit: 20,
        devices: o.devices.map(d => ({ id: d.id, online: d.online, state: d.state, flags: d.flags })),
        ...(name === 'get_farm_home' ? { systemCount: o.devices.length, attention: o.attention.slice(0, 10), needsAttention: o.attention.length } : {}) }), isError: Boolean(o.hubError) || undefined };
    });
  }
  registerBuilderReadTools(server);
}
