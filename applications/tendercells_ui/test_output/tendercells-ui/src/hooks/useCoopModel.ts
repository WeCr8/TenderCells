// useCoopModel.ts - Manage coop 3D model state
import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { getDefaultPreset, getPresetModel } from '../models/presets/coopPresets';
import type { CoopModelConfig, COOP_PRESETS } from '../types/coop';
import { ModelLoader } from '../models/loaders/ModelLoader';
import * as THREE from 'three';

const STORAGE_KEY = 'tendercells_coop_model';

interface CoopModelState {
  current: CoopModelConfig;
  loadedScene: THREE.Group | null;
  loading: boolean;
  error: string | null;
}

export const useCoopModel = (defaultSize: keyof typeof COOP_PRESETS = '4x4x6') => {
  const [state, setState] = useState<CoopModelState>({
    current: getPresetModel(defaultSize) || getDefaultPreset(),
    loadedScene: null,
    loading: false,
    error: null,
  });

  const modelLoader = useMemo(() => new ModelLoader(), []);

  // Load model from URL
  const loadModel = useCallback(async (url: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const scene = await modelLoader.loadModel(url);
      setState(prev => ({ ...prev, loadedScene: scene, loading: false }));
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to load model';
      setState(prev => ({ ...prev, error: msg, loading: false }));
    }
  }, [modelLoader]);

  // Select preset model
  const selectPreset = useCallback((size: keyof typeof COOP_PRESETS) => {
    const preset = getPresetModel(size) || getDefaultPreset();
    setState(prev => ({
      ...prev,
      current: preset,
      loadedScene: null,
      error: null,
    }));

    // Load the GLB if URL exists
    if (preset.modelUrl) {
      loadModel(preset.modelUrl);
    }

    // Save to localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(preset));
  }, [loadModel]);

  // Update current model config
  // FIX(2026-09-27): a newly uploaded custom model was saved but never loaded, so it
  // did not appear until a reload (by which time its blob: URL was dead). Load it now.
  const currentUrlRef = useRef(state.current.modelUrl);
  currentUrlRef.current = state.current.modelUrl;
  const updateModel = useCallback((config: Partial<CoopModelConfig>) => {
    const urlChanged = !!config.modelUrl && config.modelUrl !== currentUrlRef.current;
    setState(prev => {
      const updated = { ...prev.current, ...config };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return { ...prev, current: updated as CoopModelConfig };
    });
    if (urlChanged && config.modelUrl) loadModel(config.modelUrl);
  }, [loadModel]);

  // Load from localStorage on mount - genuinely once-only (restores saved state), so a ref
  // guard is used to satisfy exhaustive-deps with the real deps without re-running on change.
  const didRestoreRef = useRef(false);
  useEffect(() => {
    if (didRestoreRef.current) return;
    didRestoreRef.current = true;
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const savedModel = JSON.parse(saved) as CoopModelConfig;
        const model = savedModel.isCustom
          ? savedModel
          : getPresetModel(savedModel.size) || getPresetModel(defaultSize) || getDefaultPreset();
        setState(prev => ({ ...prev, current: model }));
        if (model.modelUrl) {
          loadModel(model.modelUrl);
        }
      } catch (e) {
        console.error('Failed to restore model from storage:', e);
      }
    }
  }, [defaultSize, loadModel]);

  // Cleanup
  useEffect(() => {
    return () => {
      modelLoader.dispose();
    };
  }, [modelLoader]);

  return {
    model: state.current,
    loadedScene: state.loadedScene,
    loading: state.loading,
    error: state.error,
    loadModel,
    selectPreset,
    updateModel,
  };
};
