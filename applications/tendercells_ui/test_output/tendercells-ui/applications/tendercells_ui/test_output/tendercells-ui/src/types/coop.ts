// coop.ts

export type CoopPresetSize = "3x3x5" | "4x4x6" | "6x6x8" | "custom";

export interface CoopDimensions {
  width: number; // X axis (feet)
  depth: number; // Z axis (feet)
  height: number; // Y axis (feet)
}

export interface CoopModelConfig {
  id: string;
  name: string;
  size: CoopPresetSize;
  dimensions: CoopDimensions;
  modelUrl?: string; // URL to custom 3D model (GLB/GLTF)
  thumbnailUrl?: string;
  isCustom: boolean;
  uploadedAt?: string;
  scale?: { x: number; y: number; z: number };
  position?: { x: number; y: number; z: number };
  rotation?: { x: number; y: number; z: number };
}

export const COOP_PRESETS: Record<string, CoopModelConfig> = {
  "3x3x5": {
    id: "preset-3x3x5",
    name: "Small Coop (3x3x5)",
    size: "3x3x5",
    dimensions: { width: 3, depth: 3, height: 5 },
    modelUrl: "/models/coops/presets/coop-3x3x5.glb",
    isCustom: false,
  },
  "4x4x6": {
    id: "preset-4x4x6",
    name: "Medium Coop (4x4x6)",
    size: "4x4x6",
    dimensions: { width: 4, depth: 4, height: 6 },
    modelUrl: "/models/coops/presets/coop-4x4x6.glb",
    isCustom: false,
  },
  "6x6x8": {
    id: "preset-6x6x8",
    name: "Large Coop (6x6x8)",
    size: "6x6x8",
    dimensions: { width: 6, depth: 6, height: 8 },
    modelUrl: "/models/coops/presets/coop-6x6x8.glb",
    isCustom: false,
  },
};
