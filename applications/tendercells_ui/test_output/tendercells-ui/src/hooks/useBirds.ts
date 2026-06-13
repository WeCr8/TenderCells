// useBirds.ts — reactive flock roster backed by birdsService.
// Re-fetches whenever any component mutates the roster (storage event) so
// BirdManagement, ChickenEye, and the dashboards stay in sync.
import { useCallback, useEffect, useState } from 'react';
import { birdsService, BIRDS_UPDATED_EVENT, type Bird, type CreateBirdData } from '../services/birdsService';

export function useBirds(deviceId?: string) {
  const [birds, setBirds] = useState<Bird[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const data = await birdsService.getBirds(deviceId);
    setBirds(data);
    setLoading(false);
  }, [deviceId]);

  useEffect(() => {
    void refresh();
    const onUpdate = () => void refresh();
    window.addEventListener(BIRDS_UPDATED_EVENT, onUpdate);
    return () => window.removeEventListener(BIRDS_UPDATED_EVENT, onUpdate);
  }, [refresh]);

  const createBird = useCallback(async (data: CreateBirdData) => {
    await birdsService.createBird(data);
    await refresh();
  }, [refresh]);

  const updateBird = useCallback(async (id: string, data: CreateBirdData) => {
    await birdsService.updateBird(id, data);
    await refresh();
  }, [refresh]);

  const deleteBird = useCallback(async (id: string, dId?: string) => {
    await birdsService.deleteBird(id, dId);
    await refresh();
  }, [refresh]);

  const seedDemoFlock = useCallback(async () => {
    await birdsService.seedDemoFlock();
    await refresh();
  }, [refresh]);

  const seedDemoAnimalsForProduct = useCallback(async (productFamily: string, targetDeviceId?: string) => {
    await birdsService.seedDemoAnimalsForProduct(productFamily, targetDeviceId);
    await refresh();
  }, [refresh]);

  return { birds, loading, refresh, createBird, updateBird, deleteBird, seedDemoFlock, seedDemoAnimalsForProduct };
}
