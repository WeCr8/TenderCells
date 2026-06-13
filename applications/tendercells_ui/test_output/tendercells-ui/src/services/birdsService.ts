// birdsService.ts — single source of truth for the flock roster.
// Backend selection mirrors schedulesService / productsService:
//   • localStorage — sim mode (default), so users build a real persistent flock
//     with no backend and demos populate intentionally via seedDemoFlock().
//   • Firestore    — used when Firebase is configured (VITE_FIREBASE_PROJECT_ID).
//     Collection: birds/{deviceId}/items/{birdId}
// No data is fabricated per render: ChickenEye derives its vision overlay
// deterministically from these stored records (see deriveVision()).

// firebaseApp is already eagerly initialized app-wide (AuthContext), so this
// static import adds no bundle cost and avoids the mixed static/dynamic-import
// warning. The firestore query SDK below stays dynamic to keep it lazy.
import { db } from '../lib/firebase/firebaseApp';

export type Sex = 'hen' | 'rooster' | 'doe' | 'buck' | 'wether' | 'unknown';
export type HealthStatus = 'healthy' | 'watch' | 'sick' | 'quarantine';
export type Species = 'chicken' | 'duck' | 'turkey' | 'goose' | 'quail' | 'pigeon' | 'rabbit' | 'goat';

export interface Bird {
  id: string;
  name: string;
  species: Species;
  breed: string;
  sex: Sex;
  hatchDate: string;
  color: string;
  weight: string;
  health: HealthStatus;
  notes: string;
  eggColor: string;
  avgEggsPerWeek: number;
  bandId: string;
  device: string;
}

export type CreateBirdData = Omit<Bird, 'id'>;

export const EMPTY_BIRD: CreateBirdData = {
  name: '', species: 'chicken', breed: '', sex: 'hen', hatchDate: '',
  color: '', weight: '', health: 'healthy', notes: '',
  eggColor: '', avgEggsPerWeek: 0, bandId: '', device: 'ct_001',
};

export const SPECIES_EMOJI: Record<Species, string> = {
  chicken: '🐔', duck: '🦆', turkey: '🦃', goose: '🪿',
  quail: '🐦', pigeon: '🕊️', rabbit: '🐇', goat: '🐐',
};

export const BREEDS_BY_SPECIES: Record<Species, string[]> = {
  chicken: ['Rhode Island Red', 'Barred Rock', 'Buff Orpington', 'Leghorn', 'Easter Egger', 'Silkie', 'Australorp', 'Plymouth Rock', 'Other'],
  duck: ['Pekin', 'Khaki Campbell', 'Muscovy', 'Runner', 'Rouen', 'Other'],
  turkey: ['Broad Breasted White', 'Heritage', 'Narragansett', 'Bronze', 'Other'],
  goose: ['Toulouse', 'Embden', 'Chinese', 'Pilgrim', 'Other'],
  quail: ['Coturnix', 'Bobwhite', 'Button', 'Other'],
  pigeon: ['Racing Homer', 'King', 'Fantail', 'Roller', 'Other'],
  rabbit: ['Rex', 'Holland Lop', 'Flemish Giant', 'New Zealand', 'Other'],
  goat: ['Boer', 'Nubian', 'LaMancha', 'Nigerian Dwarf', 'Other'],
};

// Demo flock — written to storage ONLY when the user opts in (seedDemoFlock),
// never auto-injected. Lets a fresh install demo cleanly without faking data
// behind the user's back.
export const DEMO_BIRDS: Bird[] = [
  { id: 'b1', name: 'Henrietta', species: 'chicken', breed: 'Rhode Island Red', sex: 'hen', hatchDate: '2023-03-15', color: 'Mahogany red', weight: '6.5 lbs', health: 'healthy', notes: 'Top of pecking order. Reliable layer.', eggColor: 'Brown', avgEggsPerWeek: 5, bandId: 'RIR-001', device: 'ct_001' },
  { id: 'b2', name: 'Dotty', species: 'chicken', breed: 'Barred Rock', sex: 'hen', hatchDate: '2023-03-15', color: 'Black/white barred', weight: '7 lbs', health: 'healthy', notes: 'Very calm. Great forager.', eggColor: 'Brown', avgEggsPerWeek: 4, bandId: 'BR-002', device: 'ct_001' },
  { id: 'b3', name: 'Goldie', species: 'chicken', breed: 'Buff Orpington', sex: 'hen', hatchDate: '2023-04-02', color: 'Golden buff', weight: '8 lbs', health: 'watch', notes: 'Showing mild lethargy — monitor for 48h.', eggColor: 'Light brown', avgEggsPerWeek: 3, bandId: 'BO-003', device: 'ct_001' },
  { id: 'b4', name: 'Bluebell', species: 'chicken', breed: 'Easter Egger', sex: 'hen', hatchDate: '2023-05-10', color: 'Blue-grey mottled', weight: '5.5 lbs', health: 'healthy', notes: 'Lays blue-green eggs. Shy but friendly.', eggColor: 'Blue-green', avgEggsPerWeek: 4, bandId: 'EE-004', device: 'ct_001' },
];

// Demo duck flock for the Duck Dock demo device (dd_001). Same opt-in rules.
export const DEMO_DUCKS: Bird[] = [
  { id: 'd1', name: 'Drake', species: 'duck', breed: 'Pekin', sex: 'rooster', hatchDate: '2023-04-20', color: 'White', weight: '8 lbs', health: 'healthy', notes: 'Lead drake. Strong swimmer.', eggColor: 'Cream', avgEggsPerWeek: 4, bandId: 'PK-001', device: 'dd_001' },
  { id: 'd2', name: 'Daffy', species: 'duck', breed: 'Khaki Campbell', sex: 'hen', hatchDate: '2023-04-20', color: 'Khaki brown', weight: '4.5 lbs', health: 'healthy', notes: 'Prolific layer.', eggColor: 'White', avgEggsPerWeek: 6, bandId: 'KC-002', device: 'dd_001' },
];

const DEMO_ROAMING_ROOST: Bird[] = [
  { id: 'rr1', name: 'Juniper', species: 'chicken', breed: 'Australorp', sex: 'hen', hatchDate: '2023-05-22', color: 'Black with green sheen', weight: '6.8 lbs', health: 'healthy', notes: 'Foraging lead in mobile roaming enclosure.', eggColor: 'Brown', avgEggsPerWeek: 4, bandId: 'RR-AUS-001', device: 'rr_001' },
  { id: 'rr2', name: 'Maple', species: 'chicken', breed: 'Leghorn', sex: 'hen', hatchDate: '2023-06-01', color: 'White', weight: '4.6 lbs', health: 'healthy', notes: 'High activity layer used for roaming route demos.', eggColor: 'White', avgEggsPerWeek: 5, bandId: 'RR-LG-002', device: 'rr_001' },
];

const DEMO_RABBITS: Bird[] = [
  { id: 'rb1', name: 'Clover', species: 'rabbit', breed: 'Holland Lop', sex: 'doe', hatchDate: '2024-02-14', color: 'Broken cream', weight: '3.8 lbs', health: 'healthy', notes: 'Demo rabbit for feeder, temperature, and shelter automation.', eggColor: '', avgEggsPerWeek: 0, bandId: 'BB-001', device: 'bb_001' },
  { id: 'rb2', name: 'Thistle', species: 'rabbit', breed: 'Rex', sex: 'buck', hatchDate: '2024-03-02', color: 'Castor', weight: '4.4 lbs', health: 'watch', notes: 'Mild appetite dip for health alert demos.', eggColor: '', avgEggsPerWeek: 0, bandId: 'BB-002', device: 'bb_001' },
];

const DEMO_GOATS: Bird[] = [
  { id: 'g1', name: 'Mabel', species: 'goat', breed: 'Nigerian Dwarf', sex: 'doe', hatchDate: '2022-04-18', color: 'Tan and white', weight: '62 lbs', health: 'healthy', notes: 'Fence, gate, and pasture rotation demo animal.', eggColor: '', avgEggsPerWeek: 0, bandId: 'GG-001', device: 'gg_001' },
  { id: 'g2', name: 'Otis', species: 'goat', breed: 'Nubian', sex: 'wether', hatchDate: '2021-09-10', color: 'Brown with black points', weight: '118 lbs', health: 'healthy', notes: 'Large-animal water and shelter demo animal.', eggColor: '', avgEggsPerWeek: 0, bandId: 'GG-002', device: 'gg_001' },
];

const DEMO_TURKEYS: Bird[] = [
  { id: 't1', name: 'Hazel', species: 'turkey', breed: 'Narragansett', sex: 'hen', hatchDate: '2023-05-05', color: 'Grey bronze', weight: '14 lbs', health: 'healthy', notes: 'Turkey Tower roosting and shelter demo.', eggColor: 'Speckled cream', avgEggsPerWeek: 2, bandId: 'TT-001', device: 'tt_001' },
  { id: 't2', name: 'Bramble', species: 'turkey', breed: 'Heritage', sex: 'rooster', hatchDate: '2023-05-05', color: 'Bronze', weight: '22 lbs', health: 'healthy', notes: 'Tom used for access door and predator-lockout scenarios.', eggColor: '', avgEggsPerWeek: 0, bandId: 'TT-002', device: 'tt_001' },
];

const DEMO_PIGEONS: Bird[] = [
  { id: 'p1', name: 'Comet', species: 'pigeon', breed: 'Racing Homer', sex: 'hen', hatchDate: '2024-01-12', color: 'Blue bar', weight: '0.8 lbs', health: 'healthy', notes: 'Pigeon Palace perch and entry tracking demo.', eggColor: 'White', avgEggsPerWeek: 1, bandId: 'PP-001', device: 'pp_001' },
  { id: 'p2', name: 'Orbit', species: 'pigeon', breed: 'Roller', sex: 'unknown', hatchDate: '2024-02-01', color: 'Ash red', weight: '0.7 lbs', health: 'healthy', notes: 'Loft camera identity matching demo.', eggColor: '', avgEggsPerWeek: 0, bandId: 'PP-002', device: 'pp_001' },
];

export const DEMO_ANIMAL_PACKS = [
  { productFamily: 'chicken-tender', label: 'Chicken Tender Demo', deviceId: 'ct_001', animals: DEMO_BIRDS },
  { productFamily: 'roaming-roost', label: 'Roaming Roost Demo', deviceId: 'rr_001', animals: DEMO_ROAMING_ROOST },
  { productFamily: 'duck-dock', label: 'Duck Dock Demo', deviceId: 'dd_001', animals: DEMO_DUCKS },
  { productFamily: 'bunny-burrow', label: 'Bunny Burrow Demo', deviceId: 'bb_001', animals: DEMO_RABBITS },
  { productFamily: 'goat-guardian', label: 'Goat Guardian Demo', deviceId: 'gg_001', animals: DEMO_GOATS },
  { productFamily: 'turkey-tower', label: 'Turkey Tower Demo', deviceId: 'tt_001', animals: DEMO_TURKEYS },
  { productFamily: 'pigeon-palace', label: 'Pigeon Palace Demo', deviceId: 'pp_001', animals: DEMO_PIGEONS },
] as const;

export const DEMO_ANIMALS: Bird[] = DEMO_ANIMAL_PACKS.flatMap((pack) => pack.animals);

export function getDemoAnimalsForProduct(productFamily: string, deviceId?: string): Bird[] {
  const pack = DEMO_ANIMAL_PACKS.find((item) => item.productFamily === productFamily) || DEMO_ANIMAL_PACKS[0];
  return pack.animals.map((animal) => ({
    ...animal,
    device: deviceId || animal.device || pack.deviceId,
  }));
}

const FIREBASE_ENABLED = Boolean(import.meta.env.VITE_FIREBASE_PROJECT_ID);
const STORAGE_KEY = 'tendercells_birds_v1';
export const BIRDS_UPDATED_EVENT = 'tendercells-birds-updated';

// ── localStorage backend (sim mode) ───────────────────────────────────────────
function readAll(): Bird[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') as Bird[];
  } catch {
    return [];
  }
}

function writeAll(rows: Bird[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
  window.dispatchEvent(new CustomEvent(BIRDS_UPDATED_EVENT));
}

const localBackend = {
  async getBirds(deviceId?: string): Promise<Bird[]> {
    const all = readAll();
    return deviceId ? all.filter((b) => b.device === deviceId) : all;
  },
  async createBird(data: CreateBirdData): Promise<Bird> {
    const rows = readAll();
    const bird: Bird = { ...data, id: `b_${Date.now()}_${Math.random().toString(36).slice(2, 7)}` };
    rows.push(bird);
    writeAll(rows);
    return bird;
  },
  async updateBird(id: string, data: CreateBirdData): Promise<void> {
    writeAll(readAll().map((b) => (b.id === id ? { ...data, id } : b)));
  },
  async deleteBird(id: string): Promise<void> {
    writeAll(readAll().filter((b) => b.id !== id));
  },
  async getBird(id: string): Promise<Bird | null> {
    return readAll().find((b) => b.id === id) ?? null;
  },
  async seedDemoFlock(): Promise<Bird[]> {
    const rows = readAll();
    const existing = rows.filter((b) => b.device === 'ct_001');
    if (existing.length > 0) return existing; // never overwrite a real flock
    writeAll([...rows, ...DEMO_BIRDS]);
    return DEMO_BIRDS;
  },
  // Idempotent per-id upsert — adds any missing demo birds without touching
  // the user's own records (different ids). Safe to re-run; used by the demo
  // environment orchestrator to seed multiple devices coherently.
  async seedFlock(birds: Bird[]): Promise<Bird[]> {
    const rows = readAll();
    const known = new Set(rows.map((b) => b.id));
    const additions = birds.filter((b) => !known.has(b.id));
    if (additions.length) writeAll([...rows, ...additions]);
    return [...rows, ...additions];
  },
};

// ── Firestore backend (loaded only when configured) ───────────────────────────
async function firestoreBackend() {
  const { collection, doc, addDoc, getDoc, getDocs, updateDoc, deleteDoc, setDoc } =
    await import('firebase/firestore');

  const itemsRef = (deviceId: string) => collection(db, `birds/${deviceId}/items`);
  // Roster lives per-device; default device used when none is specified.
  const DEFAULT_DEVICE = 'ct_001';

  return {
    async getBirds(deviceId?: string): Promise<Bird[]> {
      const snap = await getDocs(itemsRef(deviceId ?? DEFAULT_DEVICE));
      return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Bird));
    },
    async createBird(data: CreateBirdData): Promise<Bird> {
      const ref = await addDoc(itemsRef(data.device || DEFAULT_DEVICE), data);
      return { id: ref.id, ...data };
    },
    async updateBird(id: string, data: CreateBirdData): Promise<void> {
      await updateDoc(doc(db, `birds/${data.device || DEFAULT_DEVICE}/items/${id}`), { ...data });
    },
    async deleteBird(id: string, deviceId = DEFAULT_DEVICE): Promise<void> {
      await deleteDoc(doc(db, `birds/${deviceId}/items/${id}`));
    },
    async getBird(id: string, deviceId = DEFAULT_DEVICE): Promise<Bird | null> {
      const snap = await getDoc(doc(db, `birds/${deviceId}/items/${id}`));
      return snap.exists() ? ({ id: snap.id, ...snap.data() } as Bird) : null;
    },
    async seedDemoFlock(): Promise<Bird[]> {
      const existing = await getDocs(itemsRef(DEFAULT_DEVICE));
      if (!existing.empty) return existing.docs.map((d) => ({ id: d.id, ...d.data() } as Bird));
      await Promise.all(
        DEMO_BIRDS.map((b) => setDoc(doc(db, `birds/${DEFAULT_DEVICE}/items/${b.id}`), b)),
      );
      return DEMO_BIRDS;
    },
    async seedFlock(birds: Bird[]): Promise<Bird[]> {
      // Upsert by fixed demo id under each bird's own device collection.
      await Promise.all(
        birds.map((b) => setDoc(doc(db, `birds/${b.device || DEFAULT_DEVICE}/items/${b.id}`), b)),
      );
      return birds;
    },
  };
}

export const birdsService = {
  async getBirds(deviceId?: string): Promise<Bird[]> {
    if (!FIREBASE_ENABLED) return localBackend.getBirds(deviceId);
    try {
      return await (await firestoreBackend()).getBirds(deviceId);
    } catch {
      return localBackend.getBirds(deviceId);
    }
  },
  async createBird(data: CreateBirdData): Promise<Bird> {
    if (!FIREBASE_ENABLED) return localBackend.createBird(data);
    try {
      return await (await firestoreBackend()).createBird(data);
    } catch {
      return localBackend.createBird(data);
    }
  },
  async updateBird(id: string, data: CreateBirdData): Promise<void> {
    if (!FIREBASE_ENABLED) return localBackend.updateBird(id, data);
    try {
      return await (await firestoreBackend()).updateBird(id, data);
    } catch {
      return localBackend.updateBird(id, data);
    }
  },
  async deleteBird(id: string, deviceId?: string): Promise<void> {
    if (!FIREBASE_ENABLED) return localBackend.deleteBird(id);
    try {
      return await (await firestoreBackend()).deleteBird(id, deviceId);
    } catch {
      return localBackend.deleteBird(id);
    }
  },
  async getBird(id: string, deviceId?: string): Promise<Bird | null> {
    if (!FIREBASE_ENABLED) return localBackend.getBird(id);
    try {
      return await (await firestoreBackend()).getBird(id, deviceId);
    } catch {
      return localBackend.getBird(id);
    }
  },
  async seedDemoFlock(): Promise<Bird[]> {
    if (!FIREBASE_ENABLED) return localBackend.seedDemoFlock();
    try {
      return await (await firestoreBackend()).seedDemoFlock();
    } catch {
      return localBackend.seedDemoFlock();
    }
  },
  async seedFlock(birds: Bird[]): Promise<Bird[]> {
    if (!FIREBASE_ENABLED) return localBackend.seedFlock(birds);
    try {
      return await (await firestoreBackend()).seedFlock(birds);
    } catch {
      return localBackend.seedFlock(birds);
    }
  },
  async seedDemoAnimalsForProduct(productFamily: string, deviceId?: string): Promise<Bird[]> {
    return this.seedFlock(getDemoAnimalsForProduct(productFamily, deviceId));
  },
};

// ── ChickenEye vision overlay — derived, deterministic, NOT random ────────────
// Maps a stored bird record to the AI-vision fields ChickenEye shows. Stable
// per bird (no per-render churn). When real ESP32-S3 inference is wired, replace
// this with the live detection payload.
export type Posture = 'normal' | 'alert' | 'resting' | 'feeding' | 'unknown';

export interface BirdVision {
  posture: Posture;
  healthScore: number;
  confidence: number;
  flagged: boolean;
  flagReason?: string;
}

const HEALTH_TO_SCORE: Record<HealthStatus, number> = {
  healthy: 94, watch: 72, sick: 55, quarantine: 48,
};

const HEALTH_TO_POSTURE: Record<HealthStatus, Posture> = {
  healthy: 'normal', watch: 'alert', sick: 'alert', quarantine: 'resting',
};

// Deterministic 0..1 hash from a string — stable across renders/sessions.
function hash01(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return (Math.abs(h) % 1000) / 1000;
}

export function deriveVision(bird: Bird): BirdVision {
  const flagged = bird.health === 'sick' || bird.health === 'watch' || bird.health === 'quarantine';
  return {
    posture: HEALTH_TO_POSTURE[bird.health],
    healthScore: HEALTH_TO_SCORE[bird.health],
    confidence: 85 + Math.round(hash01(bird.id) * 14), // 85–99, stable per bird
    flagged,
    flagReason: flagged
      ? bird.notes || 'Health status flagged for monitoring. Review posture and activity.'
      : undefined,
  };
}
