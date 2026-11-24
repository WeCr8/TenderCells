// yearsSim.ts - "Coop through the years": a simple, kid-readable ESTIMATE of what a
// 4-hen Chicken Tender coop does week by week over 1-5 years. Pure functions, no I/O,
// so the /demo/coop page and its tests share one model.
//
// THIS IS AN ESTIMATE, NOT A PREDICTION. Real hens vary a lot (weather, health, feed,
// broodiness, predators). Numbers come from extension-service planning figures:
//
// Eggs per year (first laying year, good care, about 14+ h of light):
//   - White Leghorn 280-320, Australorp 250-300, Plymouth Rock 200-250
//     Utah State Univ. Extension, "Managing Chickens From Chicks to Peak Egg Production",
//     Table 1 (2025). https://digitalcommons.usu.edu/cgi/viewcontent.cgi?article=3570&context=extension_curall
//   - Buff Orpington 200-280, Barred Rock 200-280; ~20 dozen eggs and 90-100 lb feed per hen
//     in ~13 months. UNH Extension, "Producing Your Own Eggs".
//     https://extension.unh.edu/resource/producing-your-own-eggs
//   We use values inside (and toward the low side of) those ranges for backyard hens.
// Start of lay, decline with age, molt, day length:
//   - Lay starts at 18-22 weeks; flock falls to ~65% of peak after 12 months of lay; good layers
//     lay 50-60 weeks then molt; many hens decline a lot after 2-3 years; ~14 h of day length
//     needed to keep laying. UF/IFAS Extension PS-35, "Factors Affecting Egg Production in
//     Backyard Chicken Flocks". https://ask.ifas.ufl.edu/publication/PS029/pdf
//   - Production, egg size and shell quality drop each year; most flocks lay for 3-4 years;
//     add pullets every 2-3 years. Univ. of Wisconsin Extension, "Life Cycle of a Laying Hen".
//     https://livestock.extension.wisc.edu/articles/life-cycle-of-a-laying-hen
//   - Leghorns drop off faster after year 1; Orpingtons/Australorps hold their rate longer
//     (hatchery guidance, Meyer Hatchery FAQ) - used only to pick the per-breed decline.
//   - Natural molt usually Sep-Oct once days fall below ~12 h; 14-16 h of light keeps hens
//     laying. Penn State Extension, "Artificial Lighting for Winter Egg Production" (2025).
//     https://extension.psu.edu/artificial-lighting-for-winter-egg-production/
// Feed:
//   - A laying hen eats 100-150 g (about 0.25 lb) of complete layer feed a day.
//     Alabama Cooperative Extension ANR-2913, "Feeding the Laying Hen".
//     https://www.aces.edu/blog/topics/farming/backyard-small-poultry-flock-management-series-feeding-the-laying-hen/
// Day length: standard solar declination / sunrise-equation approximation (accurate to a few
// minutes, ignores refraction), as in the NOAA solar calculator notes.
//
// Coop routine counts (CLEAN, EGG, DoorCell cycles) and maintenance intervals are OUR
// ASSUMED SCHEDULE for the showcase, not measured values. The DoorCell V1.4 assembly guide
// only says the rack strip is a wear item and to run 50 test cycles before unattended use.

export const BREED_IDS = ['leghorn', 'australorp', 'barredRock', 'buffOrpington'] as const;
export type BreedId = (typeof BREED_IDS)[number];

export type Breed = {
  id: BreedId;
  /** Kid-readable name. */
  name: string;
  /** Hen node prefix in the coop GLB (hen1..hen4, set by sc_params HEN_BREEDS). */
  henNode: string;
  /** Feather colour for the legend (matches the GLB material). */
  color: string;
  eggColor: string;
  /** Eggs in the first laying year with long days (see sources above). */
  eggsPerYearYear1: number;
  /** Each later laying year keeps this fraction of the year before. */
  yearlyKeep: number;
  /** Age (weeks) at first egg. */
  firstEggWeeks: number;
  /** Feed per day, grams (light breeds eat less). */
  feedGPerDay: number;
};

export const BREEDS: Record<BreedId, Breed> = {
  leghorn: { id: 'leghorn', name: 'White Leghorn', henNode: 'hen1', color: '#F2F0EA', eggColor: 'white', eggsPerYearYear1: 280, yearlyKeep: 0.75, firstEggWeeks: 19, feedGPerDay: 105 },
  australorp: { id: 'australorp', name: 'Black Australorp', henNode: 'hen2', color: '#1F2328', eggColor: 'brown', eggsPerYearYear1: 255, yearlyKeep: 0.82, firstEggWeeks: 22, feedGPerDay: 120 },
  barredRock: { id: 'barredRock', name: 'Barred Plymouth Rock', henNode: 'hen3', color: '#8C8F94', eggColor: 'brown', eggsPerYearYear1: 220, yearlyKeep: 0.82, firstEggWeeks: 22, feedGPerDay: 125 },
  buffOrpington: { id: 'buffOrpington', name: 'Buff Orpington', henNode: 'hen4', color: '#D9A85B', eggColor: 'light brown', eggsPerYearYear1: 200, yearlyKeep: 0.85, firstEggWeeks: 24, feedGPerDay: 130 },
};

export type CoopTierId = 'base' | 'starter' | 'plus' | 'pro';
/** Plus and Pro have the ceiling gantry + SO-101 arm, so CLEAN and EGG run on their own. */
export const hasGantry = (tier: CoopTierId) => tier === 'plus' || tier === 'pro';

export type Season = 'Spring' | 'Summer' | 'Autumn' | 'Winter';

export type YearsSimConfig = {
  years: number; // 1..5
  /** Latitude in degrees (north positive). Default ~Lakeside, CA. */
  latitude: number;
  /** ISO date the pullets move in. */
  startDate: string;
  /** Age of the pullets on move-in day, weeks. */
  startAgeWeeks: number;
  /** Coop light tops the day up to 14 h (keeps hens laying in winter, skips most of the dip). */
  coopLight: boolean;
  flock: BreedId[];
  tier: CoopTierId;
};

export const DEFAULT_CONFIG: YearsSimConfig = {
  years: 3,
  latitude: 32.9,
  startDate: '2027-03-01',
  startAgeWeeks: 18,
  coopLight: false,
  flock: [...BREED_IDS],
  tier: 'plus',
};

export const LOCATIONS = [
  { id: 'socal', label: 'Southern California (33°N)', latitude: 32.9 },
  { id: 'midwest', label: 'Midwest (42°N)', latitude: 42 },
  { id: 'north', label: 'Far north (47°N)', latitude: 47 },
] as const;

const DAY_MS = 86_400_000;
const rad = (d: number) => (d * Math.PI) / 180;
const deg = (r: number) => (r * 180) / Math.PI;

/** Day of year 1..366 (UTC). */
export function dayOfYear(d: Date): number {
  return Math.floor((Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) - Date.UTC(d.getUTCFullYear(), 0, 0)) / DAY_MS);
}

/** Solar declination (degrees) for a day of year. */
export function declination(doy: number): number {
  return 23.44 * Math.sin(rad((360 / 365) * (doy - 81)));
}

/** Hours of daylight (sunrise to sunset) at a latitude on a day of year. */
export function dayLengthHours(latitude: number, doy: number): number {
  const x = -Math.tan(rad(latitude)) * Math.tan(rad(declination(doy)));
  if (x <= -1) return 24;
  if (x >= 1) return 0;
  return (2 * deg(Math.acos(x))) / 15;
}

/** Sun height above the horizon at solar noon, degrees. */
export function noonSunAltitude(latitude: number, doy: number): number {
  return 90 - Math.abs(latitude - declination(doy));
}

/** Northern-hemisphere meteorological season. */
export function seasonOf(d: Date): Season {
  const m = d.getUTCMonth(); // 0 = Jan
  if (m >= 2 && m <= 4) return 'Spring';
  if (m >= 5 && m <= 7) return 'Summer';
  if (m >= 8 && m <= 10) return 'Autumn';
  return 'Winter';
}

/** Light factor 0..1: full lay at >= 14 h, falling to a floor at <= 10 h. */
export function lightFactor(hours: number, firstLayingYear: boolean): number {
  const floor = firstLayingYear ? 0.55 : 0.25; // pullets usually lay through their first winter
  if (hours >= 14) return 1;
  if (hours <= 10) return floor;
  return floor + ((hours - 10) / 4) * (1 - floor);
}

export type HenWeek = {
  breed: BreedId;
  ageWeeks: number;
  laying: boolean;
  molting: boolean;
  eggs: number; // eggs this week (fractional = average)
};

export type Reminder = { id: string; text: string; kind: 'door' | 'gantry' | 'safety' | 'predator' | 'bedding' | 'flock' };

export type SimWeek = {
  index: number; // 0-based week
  date: string; // ISO date (start of week)
  year: number; // 1-based sim year
  season: Season;
  dayLengthH: number;
  sunAltitudeDeg: number;
  /** Approximate solar-time door open/close (sunrise / sunset + 30 min), "HH:MM". */
  doorOpen: string;
  doorClose: string;
  hens: HenWeek[];
  eggs: number;
  feedKg: number;
  // Running totals since move-in.
  totalEggs: number;
  totalFeedKg: number;
  doorCycles: number;
  cleanRuns: number;
  eggRuns: number;
  beddingTopUps: number;
  beddingChanges: number;
  reminders: Reminder[];
};

const hhmm = (h: number) => {
  const t = ((h % 24) + 24) % 24;
  const hh = Math.floor(t);
  const mm = Math.round((t - hh) * 60);
  return `${String(hh + (mm === 60 ? 1 : 0)).padStart(2, '0')}:${String(mm === 60 ? 0 : mm).padStart(2, '0')}`;
};

/** Molt: from the second autumn a hen has been laying (>= 40 weeks of lay), Oct 1 + 8 weeks. */
function isMolting(date: Date, weeksLaying: number): boolean {
  if (weeksLaying < 40) return false;
  const doy = dayOfYear(date);
  return doy >= 274 && doy < 274 + 56; // ~Oct 1 to ~Nov 26
}

/** Weekly peak eggs for a breed in its Nth laying year (0-based), before light/molt. */
export function weeklyRate(b: Breed, layingYear: number): number {
  // Calibrate so a full first laying year at long days, with no molt, gives eggsPerYearYear1.
  // Ramp-up and the first winter dip are applied in the week loop.
  const base = b.eggsPerYearYear1 / 52;
  return Math.min(7, base * Math.pow(b.yearlyKeep, layingYear));
}

const ASSUMED = {
  doorCyclesPerDay: 1, // open at sunrise, close after dusk = one cycle
  cleanRunsPerDay: 1, // Plus/Pro gantry CLEAN stir (skipped while raining; not modelled)
  eggRunsPerDay: 2, // Plus/Pro EGG pick: late morning + mid afternoon
  beddingTopUpEveryWeeks: 4,
  rackInspectEveryCycles: 500,
  rackReplaceEveryCycles: 1500, // printed rack strip; ASSUMED, no rated life yet
};
export const ASSUMED_SCHEDULE = ASSUMED;

export function simulateYears(cfg: YearsSimConfig = DEFAULT_CONFIG): SimWeek[] {
  const years = Math.max(1, Math.min(5, Math.round(cfg.years)));
  const weeks = years * 52;
  const start = new Date(`${cfg.startDate}T12:00:00Z`);
  const gantry = hasGantry(cfg.tier);
  const out: SimWeek[] = [];
  let totalEggs = 0;
  let totalFeedKg = 0;
  let doorCycles = 0;
  let cleanRuns = 0;
  let eggRuns = 0;
  let beddingTopUps = 0;
  let beddingChanges = 0;
  const weeksLaying: Record<string, number> = {};

  for (let w = 0; w < weeks; w++) {
    const date = new Date(start.getTime() + w * 7 * DAY_MS);
    const doy = dayOfYear(date);
    const natural = dayLengthHours(cfg.latitude, doy);
    const effective = cfg.coopLight ? Math.max(natural, 14) : natural;
    const season = seasonOf(date);
    const year = Math.floor(w / 52) + 1;

    const hens: HenWeek[] = cfg.flock.map((id) => {
      const b = BREEDS[id];
      const ageWeeks = cfg.startAgeWeeks + w;
      const laid = weeksLaying[id] ?? 0;
      const started = ageWeeks >= b.firstEggWeeks;
      if (!started) return { breed: id, ageWeeks, laying: false, molting: false, eggs: 0 };
      const molting = isMolting(date, laid);
      const layingYear = Math.floor(laid / 52);
      // Ramp to peak over the first ~6 weeks of lay (UF/IFAS: peak 6-8 weeks after first egg).
      const ramp = laid < 6 ? (laid + 1) / 7 : 1;
      const eggs = molting ? 0 : weeklyRate(b, layingYear) * ramp * lightFactor(effective, layingYear === 0);
      weeksLaying[id] = laid + 1;
      return { breed: id, ageWeeks, laying: eggs > 0.05, molting, eggs };
    });

    const eggs = hens.reduce((n, h) => n + h.eggs, 0);
    const feedKg = cfg.flock.reduce((n, id) => n + (BREEDS[id].feedGPerDay * 7) / 1000, 0);
    totalEggs += eggs;
    totalFeedKg += feedKg;
    doorCycles += 7 * ASSUMED.doorCyclesPerDay;
    if (gantry) {
      cleanRuns += 7 * ASSUMED.cleanRunsPerDay;
      eggRuns += 7 * ASSUMED.eggRunsPerDay;
    }
    const topUp = w > 0 && w % ASSUMED.beddingTopUpEveryWeeks === 0;
    if (topUp) beddingTopUps += 1;
    // Full bedding change in the first full week of April and October (deep-litter clean-out).
    const m = date.getUTCMonth();
    const firstWeek = date.getUTCDate() <= 7;
    const change = firstWeek && (m === 3 || m === 9);
    if (change) beddingChanges += 1;

    const reminders: Reminder[] = [];
    const prevCycles = doorCycles - 7 * ASSUMED.doorCyclesPerDay;
    if (Math.floor(doorCycles / ASSUMED.rackReplaceEveryCycles) > Math.floor(prevCycles / ASSUMED.rackReplaceEveryCycles)) {
      reminders.push({ id: 'rack-replace', kind: 'door', text: `DoorCell has done ~${Math.round(doorCycles)} open/close cycles: swap the printed rack strip and pinion (wear parts).` });
    } else if (Math.floor(doorCycles / ASSUMED.rackInspectEveryCycles) > Math.floor(prevCycles / ASSUMED.rackInspectEveryCycles)) {
      reminders.push({ id: 'rack-inspect', kind: 'door', text: `DoorCell ~${Math.round(doorCycles)} cycles: check rack teeth, pinion and rails; clean out grit.` });
    }
    if (w % 4 === 0) {
      reminders.push({ id: 'predator-walk', kind: 'predator', text: 'Walk the run: hardware cloth, buried apron and gate latches - look for gaps or digging.' });
      reminders.push({ id: 'estop-test', kind: 'safety', text: 'Press each E-STOP and open a service door: the door motor and gantry must stop.' });
    }
    if (gantry && w > 0 && w % 13 === 0) {
      reminders.push({ id: 'gantry-belt', kind: 'gantry', text: 'Gantry: check belt tension and carriage wheels; wipe dust off the rails.' });
    }
    if (gantry && w > 0 && w % 26 === 0) {
      reminders.push({ id: 'nest-scale', kind: 'gantry', text: 'Re-zero the 3 nest-box load cells and check the arm gripper pads.' });
    }
    if (topUp) reminders.push({ id: 'bedding-topup', kind: 'bedding', text: 'Top up bedding (a few inches of fresh shavings).' });
    if (change) reminders.push({ id: 'bedding-change', kind: 'bedding', text: 'Big clean-out: replace all bedding and scrub the droppings board.' });
    if (hens.some((h) => h.molting) && !(out.length && out[out.length - 1].hens.some((h) => h.molting))) {
      reminders.push({ id: 'molt', kind: 'flock', text: 'Molt season: feathers drop and eggs pause for a few weeks. Extra protein helps.' });
    }

    const sunrise = 12 - natural / 2;
    const sunset = 12 + natural / 2;
    out.push({
      index: w,
      date: date.toISOString().slice(0, 10),
      year,
      season,
      dayLengthH: natural,
      sunAltitudeDeg: noonSunAltitude(cfg.latitude, doy),
      doorOpen: hhmm(sunrise),
      doorClose: hhmm(sunset + 0.5),
      hens,
      eggs,
      feedKg,
      totalEggs,
      totalFeedKg,
      doorCycles,
      cleanRuns,
      eggRuns,
      beddingTopUps,
      beddingChanges,
      reminders,
    });
  }
  return out;
}

/** Eggs laid by each breed in each sim year. */
export function eggsByYear(weeks: SimWeek[]): { year: number; total: number; byBreed: Partial<Record<BreedId, number>> }[] {
  const rows = new Map<number, { year: number; total: number; byBreed: Partial<Record<BreedId, number>> }>();
  for (const w of weeks) {
    const r = rows.get(w.year) ?? { year: w.year, total: 0, byBreed: {} };
    for (const h of w.hens) r.byBreed[h.breed] = (r.byBreed[h.breed] ?? 0) + h.eggs;
    r.total += w.eggs;
    rows.set(w.year, r);
  }
  return [...rows.values()];
}

/** Kid-readable flock tip for the current week. */
export function flockTip(week: SimWeek, firstYearPeakPerWeek: number): string | null {
  if (week.year >= 3 && firstYearPeakPerWeek > 0 && week.eggs < firstYearPeakPerWeek * 0.5 && week.season === 'Spring') {
    return 'Older hens lay less each year. Many families add 2-3 young pullets every 2-3 years (the older hens can stay as pets).';
  }
  return null;
}

/** Simple ground/sky tint per season for the 3D view. */
export const SEASON_TINT: Record<Season, { ground: string; sky: string; sun: string }> = {
  Spring: { ground: '#3f6b3a', sky: '#123524', sun: '#fff6e0' },
  Summer: { ground: '#56703a', sky: '#173a26', sun: '#fff1c8' },
  Autumn: { ground: '#6b4a2a', sky: '#1d2f22', sun: '#ffd9a8' },
  Winter: { ground: '#4d5a52', sky: '#16242a', sun: '#dfe8ff' },
};
