// modelStore.ts - keep imported GLB files across page reloads.
//
// FIX(2026-09-27): attached models were stored as `blob:` object URLs in the
// saved layout. Those URLs die when the tab closes, so after any reload every
// imported robot / garden model silently fell back to the built-in shape. The
// file itself now goes into IndexedDB and the layout stores a stable
// `idb-model:<id>` reference that is resolved back to a URL when rendering.

const DB_NAME = 'tendercells-models';
const STORE = 'models';
export const MODEL_REF_PREFIX = 'idb-model:';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function tx<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return openDb().then((db) => new Promise<T>((resolve, reject) => {
    const req = run(db.transaction(STORE, mode).objectStore(STORE));
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  }));
}

/**
 * Persist an imported model file and return a reference to store on a layout item.
 *
 * @param file - The .glb chosen by the user
 * @returns `idb-model:<id>` reference, resolvable with {@link resolveModelUrl}
 * @throws if IndexedDB is unavailable (private mode) or the quota is exceeded
 */
export async function saveModelFile(file: Blob): Promise<string> {
  const id = typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  await tx('readwrite', (s) => s.put(file, id));
  return `${MODEL_REF_PREFIX}${id}`;
}

/**
 * Delete a stored model (no-op for non-IndexedDB references).
 *
 * @param ref - Reference previously returned by {@link saveModelFile}
 */
export async function deleteModelFile(ref: string | undefined): Promise<void> {
  if (!ref?.startsWith(MODEL_REF_PREFIX)) return;
  await tx('readwrite', (s) => s.delete(ref.slice(MODEL_REF_PREFIX.length))).catch(() => undefined);
}

const resolved = new Map<string, string>();

/**
 * Resolve a stored model reference to a loadable URL.
 *
 * `idb-model:` references become object URLs (cached for the session); http(s)
 * and data URLs pass through. A `blob:` URL saved by an older build cannot be
 * recovered after a reload and is reported as such.
 *
 * @param ref - modelUrl from a layout item or product metadata
 * @returns A URL GLTFLoader can fetch
 * @throws {Error} with a user-facing message when the model is gone
 */
export async function resolveModelUrl(ref: string): Promise<string> {
  if (!ref.startsWith(MODEL_REF_PREFIX)) {
    if (ref.startsWith('blob:')) {
      throw new Error('this model was attached before models were saved across reloads - attach the .glb again');
    }
    return ref;
  }
  const cached = resolved.get(ref);
  if (cached) return cached;
  const blob = await tx<Blob | undefined>('readonly', (s) => s.get(ref.slice(MODEL_REF_PREFIX.length)));
  if (!blob) throw new Error('the saved model file is missing on this device - attach the .glb again');
  const url = URL.createObjectURL(blob);
  resolved.set(ref, url);
  return url;
}
