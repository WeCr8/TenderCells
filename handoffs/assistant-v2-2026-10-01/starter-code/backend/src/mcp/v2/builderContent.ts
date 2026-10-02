/** SCAFFOLD — generated content adapter. */
import { GENERATED_BUILDER_CONTENT } from "./generatedBuilderContent.js";

type Wrapped = { sourceFile: string; data: Record<string, any> };

const missions = GENERATED_BUILDER_CONTENT.missions as readonly Wrapped[];
const projects = GENERATED_BUILDER_CONTENT.projects as readonly Wrapped[];

export function missionSummaries() {
  return missions.map(({ sourceFile, data }) => ({
    id: data.id, title: data.title, milestone: data.milestone, phase: data.phase,
    hardwareRequired: data.hardware_required ?? false,
    cover: data.cover, sourceFile,
    stepCount: Array.isArray(data.steps) ? data.steps.length : 0,
  }));
}

export function findMission(id: string) {
  return missions.find((x) => x.data.id === id) ?? null;
}

export function projectSummaries() {
  return projects.map(({ sourceFile, data }) => ({
    id: data.id, title: data.title, milestone: data.milestone, phase: data.phase,
    concept: Boolean(data.concept), cover: data.cover, sourceFile,
    estimatedMinutes: data.estimated_minutes,
    stages: Array.isArray(data.stages) ? data.stages.length : 0,
  }));
}

export function findProject(id: string) {
  return projects.find((x) => x.data.id === id) ?? null;
}

export function flattenProjectSteps(project: Record<string, any>) {
  const out: Array<Record<string, any> & { stage?: string }> = [];
  for (const stage of project.stages ?? []) {
    for (const step of stage.steps ?? []) out.push({ ...step, stage: stage.title ?? stage.id });
  }
  return out;
}

export function pickInstruction(step: Record<string, any>, depth: string) {
  const layers = step.instruction_layers ?? {};
  return layers[depth] ?? layers.beginner ?? step.instruction;
}
