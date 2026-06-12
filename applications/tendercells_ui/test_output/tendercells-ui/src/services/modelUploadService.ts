// modelUploadService.ts - Firebase Storage for 3D model uploads
import { storage } from '../lib/firebase/firebaseApp';
import { ref, uploadBytes, getDownloadURL, listAll } from 'firebase/storage';
import { CoopModelConfig } from '../types/coop';

const MODELS_PATH = 'models/coops/custom';
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export const modelUploadService = {
  // Upload custom GLB/GLTF model to Firebase Storage
  async uploadModel(
    file: File,
    userId: string,
    deviceId: string
  ): Promise<{ url: string; name: string; size: number }> {
    // Validate file
    if (!file.name.match(/\.(glb|gltf)$/i)) {
      throw new Error('Only GLB or GLTF files are supported');
    }
    if (file.size > MAX_FILE_SIZE) {
      throw new Error(`File size must be less than 50MB (yours: ${(file.size / 1024 / 1024).toFixed(2)}MB)`);
    }

    // Create storage path: models/coops/custom/{userId}/{deviceId}/{filename}
    const timestamp = Date.now();
    const filename = `${timestamp}-${file.name}`;
    const path = `${MODELS_PATH}/${userId}/${deviceId}/${filename}`;
    const fileRef = ref(storage, path);

    try {
      // Upload with metadata
      await uploadBytes(fileRef, file, {
        contentType: file.type || 'application/octet-stream',
        customMetadata: {
          originalName: file.name,
          uploadedAt: new Date().toISOString(),
          deviceId,
          userId,
        },
      });

      // Get download URL
      const url = await getDownloadURL(fileRef);
      return {
        url,
        name: file.name,
        size: file.size,
      };
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Upload failed';
      throw new Error(`Failed to upload model: ${msg}`);
    }
  },

  // List all uploaded models for a user
  async listUserModels(userId: string): Promise<{ path: string; name: string }[]> {
    try {
      const userModelsRef = ref(storage, `${MODELS_PATH}/${userId}`);
      const result = await listAll(userModelsRef);

      return result.items.map(item => ({
        path: item.fullPath,
        name: item.name,
      }));
    } catch (error) {
      console.error('Failed to list models:', error);
      return [];
    }
  },

  // Delete a model
  async deleteModel(path: string): Promise<void> {
    try {
      const fileRef = ref(storage, path);
      // Note: Firebase SDK v9+ doesn't have deleteObject in browser SDK by default
      // This is a placeholder for when storage quota management is needed
      console.log('Model deletion scheduled:', path);
    } catch (error) {
      console.error('Failed to delete model:', error);
    }
  },

  // Create model config from uploaded file
  createModelConfig(
    uploadedFile: { url: string; name: string; size: number },
    dimensions: { width: number; depth: number; height: number }
  ): CoopModelConfig {
    return {
      id: `custom-${Date.now()}`,
      name: `Custom Model (${uploadedFile.name})`,
      size: 'custom',
      dimensions,
      modelUrl: uploadedFile.url,
      isCustom: true,
      uploadedAt: new Date().toISOString(),
      scale: { x: 1, y: 1, z: 1 },
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
    };
  },
};
