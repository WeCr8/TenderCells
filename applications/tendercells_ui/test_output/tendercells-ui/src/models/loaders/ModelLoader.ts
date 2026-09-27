// ModelLoader.ts
import * as THREE from 'three';
import type { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { createGltfLoader, describeModelLoadError } from '../../lib/three/gltfLoader';
import { resolveModelUrl } from '../../lib/three/modelStore';

export class ModelLoader {
  private gltfLoader: GLTFLoader;

  constructor() {
    // FIX(2026-09-27): shared loader - the old '/draco/' decoder path did not exist,
    // so Draco-compressed coop models always failed.
    this.gltfLoader = createGltfLoader();
  }

  /**
   * Load a GLB/glTF model. Accepts http(s) URLs and saved `idb-model:` references.
   *
   * @param url - Model URL or stored model reference
   * @returns The model's scene graph
   * @throws {Error} with a human-readable reason when the model cannot be loaded
   */
  async loadModel(url: string): Promise<THREE.Group> {
    const src = await resolveModelUrl(url);
    try {
      const gltf = await this.gltfLoader.loadAsync(src);
      return gltf.scene;
    } catch (error) {
      throw new Error(`Model could not be loaded: ${describeModelLoadError(error)}`);
    }
  }

  // The Draco decoder is shared app-wide (see createGltfLoader), so there is
  // nothing per-instance to release; kept for callers that dispose on unmount.
  dispose(): void {}
}
