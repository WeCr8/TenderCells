// schedulesService.ts — device schedule CRUD
// Backend selection mirrors the rest of the app (see productsService):
//   • Firestore   — used when Firebase is configured (VITE_FIREBASE_PROJECT_ID set)
//     Collection: schedules/{deviceId}/items/{scheduleId}
//   • localStorage — sim mode fallback so schedules persist with no backend.
// The Firestore path is kept behind a dynamic import so an unconfigured build
// never instantiates Firestore and never throws "fail to load schedules".

// firebaseApp is already eagerly initialized app-wide (AuthContext), so this
// static import adds no bundle cost and avoids the mixed static/dynamic-import
// warning. The firestore query SDK below stays dynamic to keep it lazy.
import { db } from '../lib/firebase/firebaseApp';

export interface Timestampish {
  toMillis: () => number;
}

export interface Schedule {
  id: string;
  deviceId: string;
  action: 'feed' | 'clean' | 'door' | 'water';
  cronExpression: string;
  enabled: boolean;
  label?: string;
  amount?: number; // grams (feed) or ml (water)
  lastRun?: Timestampish | null;
  createdAt?: Timestampish;
}

export type CreateScheduleData = Omit<Schedule, 'id' | 'lastRun' | 'createdAt'>;
export type UpdateScheduleData = Partial<Omit<Schedule, 'id' | 'deviceId' | 'createdAt'>>;

const FIREBASE_ENABLED = Boolean(import.meta.env.VITE_FIREBASE_PROJECT_ID);
const STORAGE_KEY = 'tendercells_schedules_v1';

// ── localStorage backend (sim mode) ───────────────────────────────────────────
function ms(millis: number): Timestampish {
  return { toMillis: () => millis };
}

type StoredSchedule = Omit<Schedule, 'lastRun' | 'createdAt'> & {
  lastRunMs: number | null;
  createdAtMs: number;
};

function readAll(): StoredSchedule[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') as StoredSchedule[];
  } catch {
    return [];
  }
}

function writeAll(rows: StoredSchedule[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
}

function hydrate(row: StoredSchedule): Schedule {
  const { lastRunMs, createdAtMs, ...rest } = row;
  return { ...rest, lastRun: lastRunMs != null ? ms(lastRunMs) : null, createdAt: ms(createdAtMs) };
}

const localBackend = {
  async getSchedules(deviceId: string): Promise<Schedule[]> {
    return readAll()
      .filter((r) => r.deviceId === deviceId)
      .sort((a, b) => a.createdAtMs - b.createdAtMs)
      .map(hydrate);
  },

  async createSchedule(deviceId: string, data: CreateScheduleData): Promise<Schedule> {
    const rows = readAll();
    const row: StoredSchedule = {
      ...data,
      deviceId,
      id: `sch_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      lastRunMs: null,
      createdAtMs: Date.now(),
    };
    rows.push(row);
    writeAll(rows);
    return hydrate(row);
  },

  async updateSchedule(deviceId: string, scheduleId: string, updates: UpdateScheduleData): Promise<void> {
    writeAll(readAll().map((r) => (r.id === scheduleId ? { ...r, ...updates } : r)));
  },

  async deleteSchedule(_deviceId: string, scheduleId: string): Promise<void> {
    writeAll(readAll().filter((r) => r.id !== scheduleId));
  },

  async toggleSchedule(_deviceId: string, scheduleId: string, enabled: boolean): Promise<void> {
    writeAll(readAll().map((r) => (r.id === scheduleId ? { ...r, enabled } : r)));
  },

  async getSchedule(deviceId: string, scheduleId: string): Promise<Schedule | null> {
    const row = readAll().find((r) => r.id === scheduleId && r.deviceId === deviceId);
    return row ? hydrate(row) : null;
  },
};

// ── Firestore backend (loaded only when configured) ───────────────────────────
async function firestoreBackend() {
  const {
    collection, doc, addDoc, getDoc, getDocs, updateDoc, deleteDoc, query, orderBy, Timestamp,
  } = await import('firebase/firestore');

  const itemsRef = (deviceId: string) => collection(db, `schedules/${deviceId}/items`);
  const itemRef = (deviceId: string, id: string) => doc(db, `schedules/${deviceId}/items/${id}`);

  return {
    async getSchedules(deviceId: string): Promise<Schedule[]> {
      try {
        const snap = await getDocs(query(itemsRef(deviceId), orderBy('createdAt', 'asc')));
        return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Schedule));
      } catch {
        const snap = await getDocs(itemsRef(deviceId));
        return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Schedule));
      }
    },
    async createSchedule(deviceId: string, data: CreateScheduleData): Promise<Schedule> {
      const payload = { ...data, deviceId, lastRun: null, createdAt: Timestamp.now() };
      const ref = await addDoc(itemsRef(deviceId), payload);
      return { id: ref.id, ...payload };
    },
    async updateSchedule(deviceId: string, scheduleId: string, updates: UpdateScheduleData): Promise<void> {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await updateDoc(itemRef(deviceId, scheduleId), updates as any);
    },
    async deleteSchedule(deviceId: string, scheduleId: string): Promise<void> {
      await deleteDoc(itemRef(deviceId, scheduleId));
    },
    async toggleSchedule(deviceId: string, scheduleId: string, enabled: boolean): Promise<void> {
      await updateDoc(itemRef(deviceId, scheduleId), { enabled });
    },
    async getSchedule(deviceId: string, scheduleId: string): Promise<Schedule | null> {
      const snap = await getDoc(itemRef(deviceId, scheduleId));
      if (!snap.exists()) return null;
      return { id: snap.id, ...snap.data() } as Schedule;
    },
  };
}

export const schedulesService = {
  async getSchedules(deviceId: string): Promise<Schedule[]> {
    if (!deviceId) return [];
    if (!FIREBASE_ENABLED) return localBackend.getSchedules(deviceId);
    return (await firestoreBackend()).getSchedules(deviceId);
  },
  async createSchedule(deviceId: string, data: CreateScheduleData): Promise<Schedule> {
    if (!FIREBASE_ENABLED) return localBackend.createSchedule(deviceId, data);
    return (await firestoreBackend()).createSchedule(deviceId, data);
  },
  async updateSchedule(deviceId: string, scheduleId: string, updates: UpdateScheduleData): Promise<void> {
    if (!FIREBASE_ENABLED) return localBackend.updateSchedule(deviceId, scheduleId, updates);
    return (await firestoreBackend()).updateSchedule(deviceId, scheduleId, updates);
  },
  async deleteSchedule(deviceId: string, scheduleId: string): Promise<void> {
    if (!FIREBASE_ENABLED) return localBackend.deleteSchedule(deviceId, scheduleId);
    return (await firestoreBackend()).deleteSchedule(deviceId, scheduleId);
  },
  async toggleSchedule(deviceId: string, scheduleId: string, enabled: boolean): Promise<void> {
    if (!FIREBASE_ENABLED) return localBackend.toggleSchedule(deviceId, scheduleId, enabled);
    return (await firestoreBackend()).toggleSchedule(deviceId, scheduleId, enabled);
  },
  async getSchedule(deviceId: string, scheduleId: string): Promise<Schedule | null> {
    if (!FIREBASE_ENABLED) return localBackend.getSchedule(deviceId, scheduleId);
    return (await firestoreBackend()).getSchedule(deviceId, scheduleId);
  },
};

// ── Cron helpers ──────────────────────────────────────────────────────────────

export interface CronParts {
  hour: number;    // 0-23
  minute: number;  // 0, 15, 30, 45
  days: number[];  // 0=Sun..6=Sat, empty = every day
}

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function buildCron({ hour, minute, days }: CronParts): string {
  const dow = days.length === 0 || days.length === 7 ? '*' : days.sort((a, b) => a - b).join(',');
  return `${minute} ${hour} * * ${dow}`;
}

export function parseCron(expr: string): CronParts | null {
  const parts = expr.trim().split(/\s+/);
  if (parts.length !== 5) return null;
  const [min, hour, , , dow] = parts;
  const parsedHour = parseInt(hour, 10);
  const parsedMin = parseInt(min, 10);
  if (isNaN(parsedHour) || isNaN(parsedMin)) return null;

  let days: number[] = [];
  if (dow !== '*') {
    days = dow.split(',').map(Number).filter((n) => !isNaN(n));
  }

  return { hour: parsedHour, minute: parsedMin, days };
}

export function cronToLabel(expr: string): string {
  const parts = parseCron(expr);
  if (!parts) return expr;

  const h = parts.hour;
  const m = parts.minute;
  const ampm = h < 12 ? 'AM' : 'PM';
  const displayH = h === 0 ? 12 : h > 12 ? h - 12 : h;
  const timeStr = `${displayH}:${m.toString().padStart(2, '0')} ${ampm}`;

  if (parts.days.length === 0 || parts.days.length === 7) return `Daily at ${timeStr}`;
  if (parts.days.length === 5 && [1, 2, 3, 4, 5].every((d) => parts.days.includes(d)))
    return `Weekdays at ${timeStr}`;
  if (parts.days.length === 2 && [0, 6].every((d) => parts.days.includes(d)))
    return `Weekends at ${timeStr}`;

  const dayNames = parts.days.map((d) => DAY_LABELS[d]).join(', ');
  return `${dayNames} at ${timeStr}`;
}

export const ACTION_LABELS: Record<Schedule['action'], string> = {
  feed: 'Feed',
  water: 'Water',
  door: 'Door',
  clean: 'Clean',
};

export const ACTION_COLORS: Record<Schedule['action'], string> = {
  feed:  '#E8A020',
  water: '#2196F3',
  door:  '#4A7C59',
  clean: '#9C27B0',
};
