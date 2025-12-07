// modelStorageClient.ts
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from './firebaseApp';
import { CoopModelConfig } from '@/types/coop';

export async function uploadCoopModel(
  file: File,
  userId: string,
  coopId: string
): Promise<string> {
  const timestamp = Date.now();
  const fileName = `${timestamp}-${file.name}`;
  const storageRef = ref(storage, `users/${userId}/coops/${coopId}/models/${fileName}`);
  
  await uploadBytes(storageRef, file, {
    contentType: file.type || 'application/octet-stream',
    customMetadata: {
      originalName: file.name,
      uploadedAt: new Date().toISOString(),
    },
  });
  
  const downloadURL = await getDownloadURL(storageRef);
  return downloadURL;
}

export async function deleteCoopModel(
  userId: string,
  coopId: string,
  fileName: string
): Promise<void> {
  const storageRef = ref(storage, `users/${userId}/coops/${coopId}/models/${fileName}`);
  await deleteObject(storageRef);
}

export function createCustomModelConfig(
  modelUrl: string,
  fileName: string,
  dimensions: { width: number; depth: number; height: number }
): CoopModelConfig {
  return {
    id: `custom-${Date.now()}`,
    name: `Custom Model (${fileName})`,
    size: 'custom',
    dimensions,
    modelUrl,
    isCustom: true,
    uploadedAt: new Date().toISOString(),
  };
}
