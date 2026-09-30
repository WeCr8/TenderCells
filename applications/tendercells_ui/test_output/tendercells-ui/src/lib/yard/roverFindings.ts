// roverFindings.ts - what a rover reports besides weeds while it drives its route
// (mirrors firmware/jetson-nano/rover_patrol.py):
//   animals  every animal its camera sees on the route: your own flock or pets outside,
//            harmless wildlife, or a predator / snake. Alerts only - and a laser rover
//            holds its laser while an animal was seen nearby.
//   leaks    each pass it looks at the ground around every water point (spigot, trough,
//            tank, the waterers of animal housing, aquaponics / hydroponics tanks) for
//            standing water or wet soil and reports a leak at that spot.
import type { PropertyItem } from '../../components/property/propertyLayoutStore';
import type { YardEvent } from './yardTypes';

export type AnimalGroup = NonNullable<YardEvent['animalGroup']>;

/** Items that hold or deliver water; the rover checks around each one for leaks. */
export const WATER_POINT_TYPES = new Set([
  'water-point', 'chicken-tender', 'duck-dock', 'goat-guardian', 'bunny-burrow', 'turkey-tower', 'pigeon-palace',
  'aquaponics', 'hydroponics',
]);

/** A leak is looked for when the camera frame passes within this distance of a water point (ft). */
export const LEAK_CHECK_FT = 6;

/** A laser rover will not fire within this distance of an animal seen in the last ANIMAL_HOLD_MS. */
export const ANIMAL_HOLD_FT = 15;
export const ANIMAL_HOLD_MS = 10 * 60_000;

/** Animals the rover camera labels, with who they are to the property. */
export const ROVER_ANIMALS: Record<string, AnimalGroup> = {
  Hen: 'flock', Duck: 'flock', Goat: 'flock', Rabbit: 'wildlife',
  Dog: 'pet', Cat: 'pet',
  Deer: 'wildlife', Squirrel: 'wildlife', Toad: 'wildlife',
  Snake: 'predator', Fox: 'predator', Raccoon: 'predator', Hawk: 'predator', Rat: 'predator', Coyote: 'predator',
};

/** Group for a camera label ("fox" or "Fox"); unknown animals count as wildlife. */
export const animalGroupOf = (label: string): AnimalGroup =>
  ROVER_ANIMALS[label.charAt(0).toUpperCase() + label.slice(1).toLowerCase()] ?? 'wildlife';

/** Alert title and advice for an animal sighting. */
export function animalAlert(label: string, group: AnimalGroup, near: string | null): { title: string; detail: string } {
  const at = near ? ` near ${near}` : '';
  switch (group) {
    case 'flock': return { title: `${label} outside the run${at}`, detail: 'One of your animals is out - check the door and fence' };
    case 'pet': return { title: `${label} in the yard${at}`, detail: 'Pet seen on the route - the rover slows and keeps clear' };
    case 'predator': return { title: `${label} seen${at}`, detail: 'Predator on the property - keep people and animals clear, close the coop' };
    default: return { title: `${label} seen${at}`, detail: 'Wildlife on the route - no action needed' };
  }
}

export interface WaterPoint { id: string; name: string; x: number; y: number; radiusFt: number }

/** Water points on the layout: centre of each water-holding item, checked out to its edge + LEAK_CHECK_FT. */
export function waterPoints(items: Pick<PropertyItem, 'id' | 'name' | 'type' | 'x' | 'y' | 'width' | 'depth'>[]): WaterPoint[] {
  return items.filter((i) => WATER_POINT_TYPES.has(i.type)).map((i) => ({
    id: i.id, name: i.name, x: i.x + i.width / 2, y: i.y + i.depth / 2,
    radiusFt: Math.max(i.width, i.depth) / 2 + LEAK_CHECK_FT,
  }));
}

/** Water point whose check area contains the point, nearest first. */
export function waterPointAt(points: WaterPoint[], p: { x: number; y: number }): WaterPoint | undefined {
  return points
    .map((w) => ({ w, d: Math.hypot(w.x - p.x, w.y - p.y) }))
    .filter(({ w, d }) => d <= w.radiusFt)
    .sort((a, b) => a.d - b.d)[0]?.w;
}

/**
 * An animal seen recently near a spot - the laser must hold.
 *
 * @param events - The rover's findings
 * @param p - Where the laser would fire (property ft)
 * @param now - Current time (ms)
 */
export function animalNear(events: YardEvent[], p: { x: number; y: number }, now: number): YardEvent | undefined {
  return events.find((e) => e.finding === 'animal' && e.propFt && now - e.ts < ANIMAL_HOLD_MS
    && Math.hypot(e.propFt.x - p.x, e.propFt.y - p.y) <= ANIMAL_HOLD_FT);
}
