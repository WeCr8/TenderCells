import { BUILDER_CONTENT } from './generatedBuilderContent.js';
import type { BuilderEntry, BuilderStep } from './contentTypes.js';
export const missionEntries = BUILDER_CONTENT.missions;
export const projectEntries = BUILDER_CONTENT.projects;
export function steps(entry: BuilderEntry): BuilderStep[] {
  if (entry.data.steps?.length) return entry.data.steps;
  return entry.data.stages?.flatMap(s => s.steps.map(step => ({ ...step, stage: s.title ?? s.id }))) ?? [];
}
export function summary(entry: BuilderEntry) {
  const d = entry.data;
  return { id: d.id, title: d.title, version: d.version ?? null, phase: d.phase ?? null, milestone: d.milestone ?? null,
    audience: d.audience ?? [], difficulty: d.difficulty ?? null, hardwareRequired: d.hardware_required ?? null,
    learningOutcomes: d.learning_outcomes ?? [], prerequisites: d.prerequisites ?? [],
    concept: Boolean(d.concept), conceptNote: d.concept_note ?? null, sourceFile: entry.sourceFile,
    stepCount: steps(entry).length, url: `https://tendercells.com/app/builder/${encodeURIComponent(d.id)}` };
}
export function oneStep(
  entry: BuilderEntry,
  stepId: string | undefined,
  stepNumber: number | undefined,
  depth: string,
  kind: 'mission' | 'project',
) {
  if (stepId !== undefined && stepNumber !== undefined) throw new Error('Choose stepId or stepNumber, not both.');
  const all = steps(entry);
  const index = stepId === undefined ? (stepNumber ?? 1) - 1 : all.findIndex(s => s.id === stepId);
  const step = all[index];
  if (!step) throw new Error('Step not found. List the project or mission first.');
  const { instruction_layers: instructionLayers, shot, ...stepFields } = step;
  void shot;
  return { kind, ...summary(entry), stepNumber: index + 1, totalSteps: all.length, depth,
    step: {
      ...stepFields,
      instruction: instructionLayers?.[depth] ?? instructionLayers?.beginner ?? step.instruction,
      safety: step.safety ?? [],
      source_refs: step.source_refs ?? [],
      checkpoint: Boolean(step.checkpoint),
    },
    previousStepId: all[index - 1]?.id ?? null, nextStepId: all[index + 1]?.id ?? null,
    guidance: 'One step at a time. Stop at safety gates and checkpoints. Never execute demo bindings. Concept art is not an authoritative wiring source.' };
}
