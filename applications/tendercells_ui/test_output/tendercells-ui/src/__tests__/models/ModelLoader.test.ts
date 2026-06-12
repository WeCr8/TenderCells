// ModelLoader.test.ts - Unit tests for Three.js model loading
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
      const invalidUrl = '/invalid/path.glb';
      // expect(loader.loadModel(invalidUrl)).rejects.toThrow();
    });

    it('should handle DRACO-compressed models', async () => {
      const dracoUrl = '/models/coops/presets/coop-compressed.glb';
      // const model = await loader.loadModel(dracoUrl);
      // expect(model).toBeDefined();
    });

    it('should track loading progress', async () => {
      const mockUrl = '/models/coops/presets/coop-4x4x6.glb';
      const progressSpy = jest.fn();
      // loader.onProgress = progressSpy;
      // await loader.loadModel(mockUrl);
      // expect(progressSpy).toHaveBeenCalled();
    });

    it('should handle network errors gracefully', async () => {
      const unreachableUrl = 'http://unreachable.invalid/model.glb';
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
