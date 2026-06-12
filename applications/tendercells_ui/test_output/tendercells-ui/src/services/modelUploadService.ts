// modelUploadService.ts - Firebase Storage for 3D model uploads
import { storage } from '../lib/firebase/firebaseApp';
import { ref, listAll } from 'firebase/storage';
import {
  createCustomModelConfig,
  deleteCoopModel,
  uploadCoopModel,
} from '../lib/firebase/modelStorageClient';
import type { CoopModelConfig } from '../types/coop';

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

    try {
      const url = await uploadCoopModel(file, userId, deviceId);
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
      const pathParts = path.split('/');
      const usersIndex = pathParts.indexOf('users');
      const coopsIndex = pathParts.indexOf('coops');
      const modelsIndex = pathParts.indexOf('models');

      if (usersIndex < 0 || coopsIndex < 0 || modelsIndex < 0) {
        throw new Error('Unsupported model storage path');
      }

      await deleteCoopModel(
        pathParts[usersIndex + 1],
        pathParts[coopsIndex + 1],
        pathParts.slice(modelsIndex + 1).join('/')
      );
    } catch (error) {
      console.error('Failed to delete model:', error);
    }
  },

  // Create model config from uploaded file
  createModelConfig(
    uploadedFile: { url: string; name: string; size: number },
    dimensions: { width: number; depth: number; height: number }
  ): CoopModelConfig {
    return createCustomModelConfig(uploadedFile.url, uploadedFile.name, dimensions);
  },
};
