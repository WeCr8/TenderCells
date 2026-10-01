// progress.ts - local, anonymous Builder progress (no account; classroom-safe). Stores the
// step each item is on and when it was completed; completed items earn their milestone.
export const PROGRESS_KEY = 'tendercells_builder_progress_v1';
export const DEPTH_KEY = 'tendercells_builder_depth_v1';

export interface ItemProgress { step: number; completedAt?: number }
export type Progress = Record<string, ItemProgress>;

export function readProgress(): Progress {
  try { return JSON.parse(localStorage.getItem(PROGRESS_KEY) || '{}') as Progress; } catch { return {}; }
}
function write(p: Progress): void {
  try { localStorage.setItem(PROGRESS_KEY, JSON.stringify(p)); } catch { /* storage unavailable */ }
}
/** Remember the step an item is on (clamped to its length). */
export function saveStep(id: string, step: number, total: number): Progress {
  const p = readProgress();
  p[id] = { ...p[id], step: Math.max(0, Math.min(total - 1, step)) };
  write(p);
  return p;
}
export function complete(id: string, now: number = Date.now()): Progress {
  const p = readProgress();
  p[id] = { step: p[id]?.step ?? 0, completedAt: p[id]?.completedAt ?? now };
  write(p);
  return p;
}
export function resetItem(id: string): Progress {
  const p = readProgress();
  delete p[id];
  write(p);
  return p;
}
export const isComplete = (p: Progress, id: string): boolean => !!p[id]?.completedAt;
