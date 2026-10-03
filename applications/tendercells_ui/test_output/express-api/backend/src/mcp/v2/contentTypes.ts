export interface BuilderStep {
  id: string;
  type?: string;
  action?: string;
  instruction?: string;
  instruction_layers?: Record<string, string>;
  details?: string[];
  look_for?: string;
  watch_out?: string;
  safety?: string[];
  checkpoint?: boolean;
  parts?: Array<{ asset_id: string; qty: number; note?: string }>;
  image?: { step_asset?: string; base_asset?: string; view?: string };
  source_refs?: string[];
  demo?: { label: string; run?: string; open?: string };
  concept?: { title: string; text: string };
  code?: string;
  stage?: string;
  [key: string]: unknown;
}
export interface BuilderItem {
  id: string;
  title: string;
  version?: string;
  phase?: string;
  milestone?: string;
  audience?: string[];
  difficulty?: number;
  estimated_minutes?: number;
  hardware_required?: boolean;
  learning_outcomes?: string[];
  prerequisites?: string[];
  concept?: boolean;
  concept_note?: string;
  source_docs?: string[];
  parts_list?: Array<{ asset_id: string; qty: number; note?: string }>;
  steps?: BuilderStep[];
  stages?: Array<{ id?: string; title?: string; steps: BuilderStep[] }>;
  [key: string]: unknown;
}
export interface BuilderEntry { sourceFile: string; data: BuilderItem }
export interface BuilderContent { missions: BuilderEntry[]; projects: BuilderEntry[] }
