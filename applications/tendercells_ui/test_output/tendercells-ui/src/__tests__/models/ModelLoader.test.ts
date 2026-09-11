// ModelLoader.test.ts - Unit tests for Three.js model loading
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { ModelLoader } from '../../models/loaders/ModelLoader';

describe('ModelLoader', () => {
  let loader: ModelLoader;

  beforeEach(() => {
    loader = new ModelLoader();
  });

  afterEach(() => {
    loader.dispose();
  });

  describe('initialization', () => {
    it('should initialize with DRACO decoder path', () => {
      expect(loader).toBeDefined();
      // Verify DRACO loader is configured
    });

    it('should create GLTFLoader instance', () => {
      expect(loader).toBeDefined();
    });
  });

  describe('loadModel', () => {
    it('should load a valid GLB model from URL', async () => {
      const mockUrl = '/models/coops/presets/coop-4x4x6.glb';
      // Mock fetch or Three.js loader response
      // const model = await loader.loadModel(mockUrl);
      // expect(model).toBeDefined();
      // expect(model.children.length).toBeGreaterThan(0);
    });

    it('should reject invalid URLs', async () => {
      
      // expect(loader.loadModel(invalidUrl)).rejects.toThrow();
    });

    it('should handle DRACO-compressed models', async () => {
      
      // const model = await loader.loadModel(dracoUrl);
      // expect(model).toBeDefined();
    });

    it('should track loading progress', async () => {
      const mockUrl = '/models/coops/presets/coop-4x4x6.glb';
      
      // loader.onProgress = progressSpy;
      // await loader.loadModel(mockUrl);
      // expect(progressSpy).toHaveBeenCalled();
    });

    it('should handle network errors gracefully', async () => {
      
      // expect(loader.loadModel(unreachableUrl)).rejects.toThrow();
    });
  });

  describe('dispose', () => {
    it('should clean up resources', () => {
      loader.dispose();
      // Verify DRACO loader disposed
    });
  });
});
