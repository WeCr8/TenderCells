// types.ts - TenderCells Builder content contract (docs/builder/README.md). One step = one
// physical or conceptual action. Missions (no hardware) and projects (hardware builds) share
// the same step shape; schemas live in docs/builder/schemas/.
export type BuilderStepType = 'assembly' | 'electronics' | 'concept' | 'flash' | 'test' | 'checkpoint' | 'safety' | 'mission';
export type SafetyGate = 'CHILD_OK' | 'SUPERVISION_RECOMMENDED' | 'ADULT_REQUIRED' | 'POWER_OFF_REQUIRED' | 'MOTION_LOCKOUT_REQUIRED';
export type ImageCueType = 'arrow' | 'rotate' | 'target' | 'path' | 'correct' | 'incorrect' | 'measure' | 'power_off' | 'tool';
export type LearnerDepth = 'young' | 'beginner' | 'advanced' | 'teacher';
export type MissionPhase = 'OBSERVE' | 'DECIDE' | 'AUTOMATE' | 'BUILD' | 'CONNECT' | 'INVENT';

export interface ImageCue { type: ImageCueType; from?: [number, number]; to?: [number, number]; target?: string; label?: string }
export interface BuilderPartRef { asset_id: string; qty: number }
export interface InstructionLayers { young?: string; beginner?: string; advanced?: string; teacher?: string }
/** Optional link from a step to the live demo: run an event, or open the page it is about. */
export interface DemoBinding { run?: string; open?: string; label: string }
export interface Bridge { label: string; path?: string; href?: string }

export interface BuilderStep {
  id: string;
  type: BuilderStepType;
  action: string;
  instruction: string;
  instruction_layers?: InstructionLayers;
  parts?: BuilderPartRef[];
  image?: { base_asset?: string; step_asset?: string; view?: string; cues?: ImageCue[] };
  safety?: SafetyGate[];
  concept?: { title: string; text: string };
  checkpoint?: boolean;
  source_refs?: string[];
  demo?: DemoBinding;
}
export interface BuilderStage { id: string; title: string; steps: BuilderStep[] }
export interface BuilderProject {
  id: string; title: string; version: string; milestone: string; phase: MissionPhase;
  audience?: string[]; difficulty?: number; estimated_minutes?: number; source_docs?: string[];
  stages: BuilderStage[]; bridge?: Bridge;
}
export interface BuilderMission {
  id: string; title: string; version: string; milestone: string; phase: MissionPhase; hardware_required: boolean;
  audience_layers?: LearnerDepth[]; prerequisites?: string[]; learning_outcomes?: string[];
  steps: BuilderStep[]; bridge?: Bridge;
}

/** A mission or project flattened for the step player. */
export interface BuilderItem {
  kind: 'mission' | 'project';
  id: string;
  title: string;
  milestone: string;
  phase: MissionPhase;
  hardware: boolean;
  steps: Array<BuilderStep & { stage?: string }>;
  outcomes: string[];
  bridge?: Bridge;
  minutes?: number;
  difficulty?: number;
}
