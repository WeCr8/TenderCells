import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { RESOURCE_MIME_TYPE, registerAppResource, registerAppTool } from '@modelcontextprotocol/ext-apps/server';
import { z } from 'zod';
import { builderCardHtml } from '../builderCard.js';
import { missionEntries, projectEntries, summary, oneStep } from './builderContent.js';
export const READ = { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false } as const;
export const result = (data: Record<string, unknown>) => ({ content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }], structuredContent: data });
const failure = (error: unknown) => ({ content: [{ type: 'text' as const, text: error instanceof Error ? error.message : String(error) }], isError: true });
const id = z.string().min(1).max(128);
const selection = { stepId: id.optional(), stepNumber: z.number().int().min(1).optional(), depth: z.enum(['young','beginner','advanced','teacher']).default('beginner') };
export const BUILDER_CARD_URI = 'ui://tendercells/builder-card.html';
export function registerBuilderReadTools(server: McpServer) {
  server.registerTool('list_missions', { description: 'List learning missions from the existing Builder library. Read-only.', annotations: READ }, async () => result({ missions: missionEntries.map(summary) }));
  registerAppTool(server, 'get_mission', {
    title: 'Builder mission step',
    description: 'Read exactly one existing mission step at the selected learner depth. Stop at checkpoints. Read-only; never execute demo bindings or hardware actions.',
    inputSchema: { missionId: id, ...selection },
    annotations: READ,
    _meta: { ui: { resourceUri: BUILDER_CARD_URI } },
  }, async ({ missionId, stepId, stepNumber, depth }) => {
    const entry = missionEntries.find(x => x.data.id === missionId);
    if (!entry) return failure(`Unknown mission "${missionId}". Call list_missions to see available ids.`);
    try { return result(oneStep(entry, stepId, stepNumber, depth, 'mission')); } catch (e) { return failure(e); }
  });
  server.registerTool('list_builder_projects', { description: 'List hardware projects and concept books with their provenance.', annotations: READ }, async () => result({ projects: projectEntries.map(summary) }));
  registerAppTool(server, 'get_builder_project', {
    title: 'Builder project',
    description: 'Read existing project metadata, parts, stages and source references. Fetch individual instructions one step at a time. Read-only.',
    inputSchema: { projectId: id },
    annotations: READ,
    _meta: { ui: { resourceUri: BUILDER_CARD_URI } },
  }, async ({ projectId }) => {
    const entry = projectEntries.find(x => x.data.id === projectId);
    return entry ? result({
      kind: 'project',
      ...summary(entry),
      parts: entry.data.parts_list ?? [],
      sourceDocs: entry.data.source_docs ?? [],
      estimatedMinutes: entry.data.estimated_minutes ?? null,
      stages: entry.data.stages?.map(s => ({ id: s.id ?? null, title: s.title ?? null, stepIds: s.steps.map(x => x.id) })) ?? [],
    }) : failure(`Unknown project "${projectId}". Call list_builder_projects to see available ids.`);
  });
  registerAppTool(server, 'get_builder_step', {
    title: 'Builder project step',
    description: 'Read exactly one existing project step with its source references, safety gates and checkpoint status. Choose a step id or 1-based step number. Read-only; never invent wiring.',
    inputSchema: { projectId: id, ...selection },
    annotations: READ,
    _meta: { ui: { resourceUri: BUILDER_CARD_URI } },
  }, async ({ projectId, stepId, stepNumber, depth }) => {
    const entry = projectEntries.find(x => x.data.id === projectId);
    if (!entry) return failure(`Unknown project "${projectId}". Call list_builder_projects to see available ids.`);
    try { return result(oneStep(entry, stepId, stepNumber, depth, 'project')); } catch (e) { return failure(e); }
  });

  registerAppResource(server, 'builder-card', BUILDER_CARD_URI, {
    title: 'Tender Cells Builder card',
    description: 'Read-only view of one mission or Builder project step, with safety gates, checkpoints and source references.',
    mimeType: RESOURCE_MIME_TYPE,
  }, async () => ({
    contents: [{ uri: BUILDER_CARD_URI, mimeType: RESOURCE_MIME_TYPE, text: await builderCardHtml() }],
  }));
}
