// eggService.ts — nest-box egg map. ChickenEye "detects" a laid egg per nest box;
// this service is the persistence + state layer behind that.
// Backend selection mirrors birdsService / schedulesService:
//   • localStorage — sim mode (default). Per-day egg state is seeded
//     deterministically (stable across renders) and the user's collect/reset
//     actions persist on top of it.
//   • Firestore    — when Firebase is configured (VITE_FIREBASE_PROJECT_ID).
//     Doc: eggMap/{deviceId}/days/{YYYY-MM-DD} → { nestBoxes: NestBox[] }
//     (matches the /eggMap collection in CLAUDE.md §4).
// Nothing is fabricated per render — once real ESP32-S3 egg detection is wired,
// replace deriveDay() with the live nest-box detection payload.

// firebaseApp is already eagerly initialized app-wide (AuthContext), so this
// static import adds no bundle cost and avoids the mixed static/dynamic-import
// warning. The firestore query SDK below stays dynamic to keep it lazy.
import { db } from '../lib/firebase/firebaseApp';

export interface NestBox {
  id: string;
  label: string;
  hasEgg: boolean;          // egg currently detected in the box
  eggColor?: string;
  laidAt?: number | null;   // ms epoch — when detection first saw the egg
  collectedAt?: number | null;
  confidence: number;       // detection confidence 0-100 (0 when empty)
}

export interface EggDay {
  date: string;             // YYYY-MM-DD
  deviceId: string;
  nestBoxes: NestBox[];
}

const FIREBASE_ENABLED = Boolean(import.meta.env.VITE_FIREBASE_PROJECT_ID);
const STORAGE_KEY = 'tendercells_eggmap_v1';
export const EGGS_UPDATED_EVENT = 'tendercells-eggs-updated';

const DEFAULT_BOX_COUNT = 4;
const DEFAULT_EGG_COLORS = ['Brown', 'Brown', 'Blue-green', 'Light brown', 'White', 'Cream'];

export function todayKey(d: Date = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// ── deterministic seeded helpers (no Math.random — stable per day) ─────────────
function seedFrom(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h) || 1;
}

function seededRng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Seed the day's egg layout deterministically so it reads like a real morning's
// collection until live detection is wired. Boxes labelled A, B, C…
function deriveDay(date: string, deviceId: string, boxCount: number, eggColors: string[]): EggDay {
  const rng = seededRng(seedFrom(`${date}:${deviceId}`));
  const dayStart = new Date(`${date}T00:00:00`).getTime();
  const colors = eggColors.length ? eggColors : DEFAULT_EGG_COLORS;
  const nestBoxes: NestBox[] = Array.from({ length: boxCount }, (_, i) => {
    const hasEgg = rng() < 0.5;
    // Eggs are typically laid mid-morning: 6am–11am window.
    const laidAt = hasEgg ? dayStart + (6 + rng() * 5) * 3600_000 : null;
    return {
      id: `box_${i + 1}`,
      label: `Nest Box ${String.fromCharCode(65 + i)}`,
      hasEgg,
      eggColor: hasEgg ? colors[i % colors.length] : undefined,
      laidAt,
      collectedAt: null,
      confidence: hasEgg ? 88 + Math.round(rng() * 11) : 0,
    };
  });
  return { date, deviceId, nestBoxes };
}

// ── localStorage backend (sim mode) ───────────────────────────────────────────
type Store = Record<string, EggDay>; // key: `${deviceId}:${date}`

function readStore(): Store {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') as Store;
  } catch {
    return {};
  }
}

function writeStore(store: Store): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  window.dispatchEvent(new CustomEvent(EGGS_UPDATED_EVENT));
}

const localBackend = {
  async getDay(deviceId: string, date: string, opts?: { boxCount?: number; eggColors?: string[] }): Promise<EggDay> {
    const store = readStore();
    const key = `${deviceId}:${date}`;
    if (!store[key]) {
      store[key] = deriveDay(date, deviceId, opts?.boxCount ?? DEFAULT_BOX_COUNT, opts?.eggColors ?? DEFAULT_EGG_COLORS);
      writeStore(store);
    }
    return store[key];
  },

  async collectEgg(deviceId: string, date: string, boxId: string): Promise<void> {
    const store = readStore();
    const key = `${deviceId}:${date}`;
    const day = store[key];
    if (!day) return;
    day.nestBoxes = day.nestBoxes.map((b) =>
      b.id === boxId && b.hasEgg && b.collectedAt == null ? { ...b, collectedAt: Date.now() } : b,
    );
    writeStore(store);
  },

  // Simulate a new lay event on an empty box (useful for demos).
  async markLaid(deviceId: string, date: string, boxId: string, eggColor = 'Brown'): Promise<void> {
    const store = readStore();
    const key = `${deviceId}:${date}`;
    const day = store[key];
    if (!day) return;
    day.nestBoxes = day.nestBoxes.map((b) =>
      b.id === boxId ? { ...b, hasEgg: true, eggColor, laidAt: Date.now(), collectedAt: null, confidence: 90 } : b,
    );
    writeStore(store);
  },
};

// ── Firestore backend (loaded only when configured) ───────────────────────────
async function firestoreBackend() {
  const { doc, getDoc, setDoc, updateDoc } = await import('firebase/firestore');
  const dayRef = (deviceId: string, date: string) => doc(db, `eggMap/${deviceId}/days/${date}`);

  return {
    async getDay(deviceId: string, date: string, opts?: { boxCount?: number; eggColors?: string[] }): Promise<EggDay> {
      const snap = await getDoc(dayRef(deviceId, date));
      if (snap.exists()) return { date, deviceId, ...(snap.data() as { nestBoxes: NestBox[] }) };
      const seeded = deriveDay(date, deviceId, opts?.boxCount ?? DEFAULT_BOX_COUNT, opts?.eggColors ?? DEFAULT_EGG_COLORS);
      await setDoc(dayRef(deviceId, date), { nestBoxes: seeded.nestBoxes });
      return seeded;
    },
    async collectEgg(deviceId: string, date: string, boxId: string): Promise<void> {
      const day = await this.getDay(deviceId, date);
      const nestBoxes = day.nestBoxes.map((b) =>
        b.id === boxId && b.hasEgg && b.collectedAt == null ? { ...b, collectedAt: Date.now() } : b,
      );
      await updateDoc(dayRef(deviceId, date), { nestBoxes });
    },
    async markLaid(deviceId: string, date: string, boxId: string, eggColor = 'Brown'): Promise<void> {
      const day = await this.getDay(deviceId, date);
      const nestBoxes = day.nestBoxes.map((b) =>
        b.id === boxId ? { ...b, hasEgg: true, eggColor, laidAt: Date.now(), collectedAt: null, confidence: 90 } : b,
      );
      await updateDoc(dayRef(deviceId, date), { nestBoxes });
    },
  };
}

export const eggService = {
  async getDay(deviceId: string, date: string = todayKey(), opts?: { boxCount?: number; eggColors?: string[] }): Promise<EggDay> {
    if (!FIREBASE_ENABLED) return localBackend.getDay(deviceId, date, opts);
    try {
      return await (await firestoreBackend()).getDay(deviceId, date, opts);
    } catch (error) {
      console.warn('Egg map Firestore unavailable, using local sim fallback.', error);
      return localBackend.getDay(deviceId, date, opts);
    }
  },
  async collectEgg(deviceId: string, boxId: string, date: string = todayKey()): Promise<void> {
    if (!FIREBASE_ENABLED) return localBackend.collectEgg(deviceId, date, boxId);
    try {
      return await (await firestoreBackend()).collectEgg(deviceId, date, boxId);
    } catch (error) {
      console.warn('Egg collect Firestore unavailable, using local sim fallback.', error);
      return localBackend.collectEgg(deviceId, date, boxId);
    }
  },
  async markLaid(deviceId: string, boxId: string, eggColor?: string, date: string = todayKey()): Promise<void> {
    if (!FIREBASE_ENABLED) return localBackend.markLaid(deviceId, date, boxId, eggColor);
    try {
      return await (await firestoreBackend()).markLaid(deviceId, date, boxId, eggColor);
    } catch (error) {
      console.warn('Egg lay Firestore unavailable, using local sim fallback.', error);
      return localBackend.markLaid(deviceId, date, boxId, eggColor);
    }
  },
};
