import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mockFirebaseStorage } from '../../../../tests/mocks/firebase';

describe('Firebase Storage Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('File Uploads', () => {
    it('uploads a file to Storage', async () => {
      const file = new File(['test content'], 'test.glb', { type: 'model/gltf-binary' });
      const storageRef = mockFirebaseStorage.ref('models/test.glb');

      const result = await storageRef.put(file);

      expect(storageRef.put).toHaveBeenCalledWith(file);
      expect(result.ref.fullPath).toBe('models/test.glb');
      expect(result.metadata.name).toBe('test.glb');
    });

    it('uploads a 3D model file', async () => {
      const modelFile = new File(['model data'], 'coop-model.glb', { type: 'model/gltf-binary' });
      const storageRef = mockFirebaseStorage.ref('models/coops/coop-model.glb');

      const result = await storageRef.put(modelFile);

      expect(result.metadata.contentType).toBe('application/octet-stream');
      expect(result.metadata.size).toBeGreaterThan(0);
    });

    it('uploads an image file', async () => {
      const imageFile = new File(['image data'], 'photo.jpg', { type: 'image/jpeg' });
      const storageRef = mockFirebaseStorage.ref('images/photo.jpg');

      const result = await storageRef.put(imageFile);

      expect(result.metadata.name).toBe('photo.jpg');
    });
  });

  describe('File Retrieval', () => {
    it('gets download URL for a file', async () => {
      const storageRef = mockFirebaseStorage.ref('models/test.glb');

      const url = await storageRef.getDownloadURL();

      expect(storageRef.getDownloadURL).toHaveBeenCalled();
      expect(url).toContain('storage.googleapis.com');
      expect(url).toContain('models/test.glb');
    });
  });

  describe('File Management', () => {
    it('deletes a file from Storage', async () => {
      const storageRef = mockFirebaseStorage.ref('models/test.glb');

      await storageRef.delete();

      expect(storageRef.delete).toHaveBeenCalled();
    });

    it('lists all files in a directory', async () => {
      const storageRef = mockFirebaseStorage.ref('models/');

      const result = await storageRef.listAll();

      expect(storageRef.listAll).toHaveBeenCalled();
      expect(result.items).toBeDefined();
      expect(result.prefixes).toBeDefined();
    });
  });
});





