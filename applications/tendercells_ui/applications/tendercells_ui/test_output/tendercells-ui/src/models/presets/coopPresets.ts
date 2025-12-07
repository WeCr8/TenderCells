// coopPresets.ts
import { CoopModelConfig, COOP_PRESETS } from '@/types/coop';

export function getPresetModel(size: string): CoopModelConfig | null {
  return COOP_PRESETS[size] || null;
}

export function getAllPresets(): CoopModelConfig[] {
  return Object.values(COOP_PRESETS);
}

export function getDefaultPreset(): CoopModelConfig {
  return COOP_PRESETS["4x4x6"];
}
