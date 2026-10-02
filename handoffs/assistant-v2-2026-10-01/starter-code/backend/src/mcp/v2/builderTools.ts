/** SCAFFOLD — v2 read-only Builder/Mission MCP tools. */
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { findMission, findProject, flattenProjectSteps, missionSummaries, pickInstruction, projectSummaries } from "./builderContent.js";

const READ = { readOnlyHint: true, openWorldHint: false } as const;
const text = (v: unknown) => ({ content: [{ type: "text" as const, text: typeof v === "string" ? v : JSON.stringify(v, null, 2) }] });
const id = z.string().min(1).max(128);
const depth = z.enum(["young", "beginner", "advanced", "teacher"]).default("beginner");

export function registerBuilderReadTools(server: McpServer) {
  server.registerTool("list_missions", {
    title: "TenderCells missions",
    description: "List TenderCells learning missions from the existing Builder content library.",
    annotations: READ,
  }, async () => text({ missions: missionSummaries() }));

  server.registerTool("get_mission", {
    title: "TenderCells mission",
    description: "Get one existing TenderCells mission and its steps. Does not run hardware.",
    inputSchema: { missionId: id, depth },
    annotations: READ,
  }, async ({ missionId, depth }) => {
    const found = findMission(missionId);
    if (!found) return { ...text(`Unknown mission: ${missionId}`), isError: true };
    const d = found.data as Record<string, any>;
    return text({
      ...d,
      sourceFile: found.sourceFile,
      steps: (d.steps ?? []).map((s: Record<string, any>) => ({ ...s, instruction: pickInstruction(s, depth) })),
    });
  });

  server.registerTool("list_builder_projects", {
    title: "TenderCells Builder projects",
    description: "List hardware builds and illustrated Builder books from the current Builder library.",
    annotations: READ,
  }, async () => text({ projects: projectSummaries() }));

  server.registerTool("get_builder_project", {
    title: "TenderCells Builder project",
    description: "Get one Builder project's metadata, parts and stages. Concept previews stay marked as concept.",
    inputSchema: { projectId: id },
    annotations: READ,
  }, async ({ projectId }) => {
    const found = findProject(projectId);
    return found ? text({ ...found.data, sourceFile: found.sourceFile }) : { ...text(`Unknown project: ${projectId}`), isError: true };
  });

  server.registerTool("get_builder_step", {
    title: "TenderCells Builder step",
    description: "Return exactly one step from an existing Builder project. Use this instead of inventing wiring or skipping ahead.",
    inputSchema: { projectId: id, stepId: id.optional(), stepNumber: z.number().int().min(1).optional(), depth },
    annotations: READ,
  }, async ({ projectId, stepId, stepNumber, depth }) => {
    const found = findProject(projectId);
    if (!found) return { ...text(`Unknown project: ${projectId}`), isError: true };
    const data = found.data as Record<string, any>;
    const steps = flattenProjectSteps(data);
    const index = stepId ? steps.findIndex((s) => s.id === stepId) : Math.max(0, (stepNumber ?? 1) - 1);
    if (index < 0 || index >= steps.length) return { ...text("Builder step not found."), isError: true };
    const s = steps[index];
    return text({
      projectId,
      concept: Boolean(data.concept),
      conceptNote: data.concept_note,
      stepNumber: index + 1,
      totalSteps: steps.length,
      step: { ...s, instruction: pickInstruction(s, depth) },
      previousStepId: steps[index - 1]?.id ?? null,
      nextStepId: steps[index + 1]?.id ?? null,
      sourceFile: found.sourceFile,
    });
  });
}
