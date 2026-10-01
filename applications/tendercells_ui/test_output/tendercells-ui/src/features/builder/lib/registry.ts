// registry.ts - every Builder mission and project, in ladder order.
// Missions: OBSERVE → DECIDE → AUTOMATE (no hardware). Projects: BUILD → CONNECT.
import manifest from '../data/missions/manifest.json';
import m00 from '../data/missions/00-explore-the-farm.mission.json';
import m01 from '../data/missions/01-protect-the-chickens.mission.json';
import m02 from '../data/missions/02-beat-the-heat.mission.json';
import m03 from '../data/missions/03-robot-traffic-jam.mission.json';
import m04 from '../data/missions/04-build-a-coop-brain.mission.json';
import m05 from '../data/missions/05-sensor-detective.mission.json';
import blink from '../data/projects/electronics-blink-xiao.project.json';
import starter from '../data/projects/starter-node-first-coop-brain.project.json';
import doorBook from '../data/projects/chicken-tender-door-book.project.json';
import type { BuilderItem, BuilderMission, BuilderProject, LearnerDepth, BuilderStep } from '../types';

export const MISSION_FILES = [m00, m01, m02, m03, m04, m05] as unknown as BuilderMission[];
export const PROJECT_FILES = [blink, starter] as unknown as BuilderProject[];
export const MANIFEST = manifest;

const fromMission = (m: BuilderMission): BuilderItem => ({
  kind: 'mission', id: m.id, title: m.title, milestone: m.milestone, phase: m.phase, hardware: m.hardware_required,
  steps: m.steps, outcomes: m.learning_outcomes ?? [], bridge: m.bridge, cover: m.cover,
});
const fromProject = (p: BuilderProject): BuilderItem => ({
  kind: 'project', id: p.id, title: p.title, milestone: p.milestone, phase: p.phase, hardware: true,
  steps: p.stages.flatMap((s) => s.steps.map((st) => ({ ...st, stage: s.title }))), outcomes: [], bridge: p.bridge,
  minutes: p.estimated_minutes, difficulty: p.difficulty, cover: p.cover, concept: p.concept, conceptNote: p.concept_note, partsList: p.parts_list,
});

/** The whole ladder: missions in manifest order, then hardware projects. */
export const LADDER: BuilderItem[] = [
  ...manifest.missions.map((e) => fromMission(MISSION_FILES.find((m) => m.id === e.id)!)),
  ...PROJECT_FILES.map(fromProject),
];
/** Concept-preview books (art not yet verified) - shown apart from the ladder. */
export const BOOKS: BuilderItem[] = [doorBook as unknown as BuilderProject].map(fromProject);
export const ALL_ITEMS: BuilderItem[] = [...LADDER, ...BOOKS];
export const builderItem = (id: string): BuilderItem | undefined => ALL_ITEMS.find((i) => i.id === id);

/** Instruction text at a depth; falls back to the base instruction. */
export const instructionAt = (step: BuilderStep, depth: LearnerDepth): string =>
  step.instruction_layers?.[depth] ?? step.instruction;

/** Milestones still to come on the ladder (shown as "coming next"). */
export const NEXT_MILESTONES = [
  { title: 'Replace the button with a sensor', milestone: 'Sensor Maker', phase: 'CONNECT' },
  { title: 'Invent a TenderCell', milestone: 'TenderCell Inventor', phase: 'INVENT' },
] as const;
