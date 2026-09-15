// useCoopModel.ts - Manage coop 3D model state
import { useState, useCallback, useEffect } from 'react';
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

  // FIX(hooks): this is the root cause of ALL THREE exhaustive-deps warnings below in this
  // file. `new ModelLoader()` on every render is a fresh, unstable reference, so it cannot
  // safely be added to a dependency array (it would refire every render / recreate every
  // callback). Wrap it exactly like this - a memoized reference is then safe to depend on:
  //   const modelLoader = useMemo(() => new ModelLoader(), []);
  const modelLoader = new ModelLoader();

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
    // FIX(hooks): once modelLoader above is memoized, add it here - safe now, was not before.
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
  const updateModel = useCallback((config: Partial<CoopModelConfig>) => {
    setState(prev => {
      const updated = { ...prev.current, ...config };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return { ...prev, current: updated as CoopModelConfig };
    });
  }, []);

  // FIX(hooks): this effect must genuinely run only once on mount (it restores from
  // localStorage) - adding defaultSize/loadModel to the deps array as-is would make it
  // re-run and re-restore whenever those change, which is not what this does today. A ref
  // guard satisfies exhaustive-deps by including the real deps AND keeps the once-only
  // behavior, without disabling the rule:
  //   const didRestoreRef = useRef(false);
  //   useEffect(() => {
  //     if (didRestoreRef.current) return;
  //     didRestoreRef.current = true;
  //     ...exact same body as below...
  //   }, [defaultSize, loadModel]);
  // Load from localStorage on mount
  useEffect(() => {
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
  }, []);

  // FIX(hooks): once modelLoader above is memoized, add it here - safe now, was not before.
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
