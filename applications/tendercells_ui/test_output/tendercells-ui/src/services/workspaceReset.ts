import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase/firebaseApp';

const RESET_APPLIED_KEY = 'tendercells_workspace_reset_applied';
const WORKSPACE_KEY_PREFIXES = ['tendercells_', 'tc_'];

const resetValue = (value: unknown): number => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return Date.parse(value) || 0;
  if (value && typeof value === 'object' && 'toMillis' in value) {
    const toMillis = (value as { toMillis?: unknown }).toMillis;
    if (typeof toMillis === 'function') return Number(toMillis.call(value)) || 0;
  }
  return 0;
};

export function clearTenderCellsWorkspace(uid: string, resetAt: number): void {
  const appliedKey = `${RESET_APPLIED_KEY}:${uid}`;
  for (let index = localStorage.length - 1; index >= 0; index -= 1) {
    const key = localStorage.key(index);
    if (key && WORKSPACE_KEY_PREFIXES.some((prefix) => key.startsWith(prefix))) {
      localStorage.removeItem(key);
    }
  }
  localStorage.setItem(appliedKey, String(resetAt));
}

export async function applyPendingWorkspaceReset(uid: string): Promise<boolean> {
  const snapshot = await getDoc(doc(db, 'users', uid));
  if (!snapshot.exists()) return false;
  const requestedAt = resetValue(snapshot.data().workspaceResetAt);
  const appliedAt = Number(localStorage.getItem(`${RESET_APPLIED_KEY}:${uid}`) || 0);
  if (!requestedAt || requestedAt <= appliedAt) return false;
  clearTenderCellsWorkspace(uid, requestedAt);
  return true;
}
