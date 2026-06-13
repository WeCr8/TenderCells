// useEggs.ts — reactive nest-box egg map for a device/day, backed by eggService.
// Re-fetches whenever any component mutates egg state (collect / mark laid).
import { useCallback, useEffect, useState } from 'react';
import { eggService, EGGS_UPDATED_EVENT, todayKey, type NestBox } from '../services/eggService';

export function useEggs(deviceId: string, opts?: { boxCount?: number; eggColors?: string[] }) {
  const [boxes, setBoxes] = useState<NestBox[]>([]);
  const [loading, setLoading] = useState(true);
  const date = todayKey();

  const refresh = useCallback(async () => {
    if (!deviceId) { setBoxes([]); setLoading(false); return; }
    const day = await eggService.getDay(deviceId, date, opts);
    setBoxes(day.nestBoxes);
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deviceId, date]);

  useEffect(() => {
    void refresh();
    const onUpdate = () => void refresh();
    window.addEventListener(EGGS_UPDATED_EVENT, onUpdate);
    return () => window.removeEventListener(EGGS_UPDATED_EVENT, onUpdate);
  }, [refresh]);

  const collectEgg = useCallback(async (boxId: string) => {
    await eggService.collectEgg(deviceId, boxId);
    await refresh();
  }, [deviceId, refresh]);

  const markLaid = useCallback(async (boxId: string, eggColor?: string) => {
    await eggService.markLaid(deviceId, boxId, eggColor);
    await refresh();
  }, [deviceId, refresh]);

  return { boxes, loading, refresh, collectEgg, markLaid };
}
