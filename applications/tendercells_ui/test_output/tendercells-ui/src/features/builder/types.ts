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
  /** LEGO-style detail: the small physical actions that make up this one step, in order. */
  details?: string[];
  /** What the learner should see when the step is done right. */
  look_for?: string;
  /** The most common mistake or safety point for this step. */
  watch_out?: string;
  /** Program text to type or paste (shown with a Copy button). */
  code?: string;
  /** How scripts/builder/capture-steps.mjs takes this step's screenshot. */
  shot?: { path: string; target: string; label: string; run?: string[]; click?: string; press?: boolean; app?: 'web' };
}
export interface BuilderStage { id: string; title: string; steps: BuilderStep[] }
export interface BuilderProject {
  id: string; title: string; version: string; milestone: string; phase: MissionPhase;
  audience?: string[]; difficulty?: number; estimated_minutes?: number; source_docs?: string[];
  stages: BuilderStage[]; bridge?: Bridge;
  /** Everything to gather before step 1 (shown on the first step). */
  parts_list?: Array<BuilderPartRef & { note?: string }>;
  /** Path under public/builder-assets/ for the cover image. */
  cover?: string;
  /** Concept preview: art and labels are not verified; never wire from it. */
  concept?: boolean;
  concept_note?: string;
}
export interface BuilderMission {
  id: string; title: string; version: string; milestone: string; phase: MissionPhase; hardware_required: boolean;
  audience_layers?: LearnerDepth[]; prerequisites?: string[]; learning_outcomes?: string[];
  steps: BuilderStep[]; bridge?: Bridge;
  cover?: string;
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
  cover?: string;
  concept?: boolean;
  conceptNote?: string;
  partsList?: Array<BuilderPartRef & { note?: string }>;
}
