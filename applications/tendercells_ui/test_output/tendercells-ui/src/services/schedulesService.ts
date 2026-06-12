// schedulesService.ts — Firestore CRUD for device schedules
// Collection: schedules/{deviceId}/items/{scheduleId}

import { db } from '../lib/firebase/firebaseApp';
import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  Timestamp,
} from 'firebase/firestore';

export interface Schedule {
  id: string;
  deviceId: string;
  action: 'feed' | 'clean' | 'door' | 'water';
  cronExpression: string;
  enabled: boolean;
  label?: string;
  amount?: number; // grams (feed) or ml (water)
  lastRun?: Timestamp | null;
  createdAt?: Timestamp;
}

export type CreateScheduleData = Omit<Schedule, 'id' | 'lastRun' | 'createdAt'>;
export type UpdateScheduleData = Partial<Omit<Schedule, 'id' | 'deviceId' | 'createdAt'>>;

function itemsRef(deviceId: string) {
  return collection(db, `schedules/${deviceId}/items`);
}

function itemRef(deviceId: string, scheduleId: string) {
  return doc(db, `schedules/${deviceId}/items/${scheduleId}`);
}

export const schedulesService = {
  async getSchedules(deviceId: string): Promise<Schedule[]> {
    try {
      const q = query(itemsRef(deviceId), orderBy('createdAt', 'asc'));
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Schedule));
    } catch {
      // Fallback without orderBy if index not ready
      const snap = await getDocs(itemsRef(deviceId));
      return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Schedule));
    }
  },

  async createSchedule(deviceId: string, data: CreateScheduleData): Promise<Schedule> {
    const payload = {
      ...data,
      deviceId,
      lastRun: null,
      createdAt: Timestamp.now(),
    };
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
