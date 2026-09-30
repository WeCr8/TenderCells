// detections.ts - which robot findings alert the user, and how they are coloured on maps.
import type { YardFlag } from './yardTypes';

/** Flags from robots that should alert: new weeds waiting for review, active robot sightings. */
export function isRobotFinding(f: YardFlag): boolean {
  if (f.type === 'weed_detected') return f.status === 'pending_review';
  return f.type === 'alert' && f.status === 'active' && !!(f.propFt || f.bedMm);
}

/**
 * New findings since the last check. The first call only records what exists, so opening
 * the OS does not replay old alerts.
 */
export function newFindings(flags: YardFlag[], seen: Set<string> | null): { fresh: YardFlag[]; seen: Set<string> } {
  const now = new Set(flags.filter(isRobotFinding).map((f) => `${f.deviceId}:${f.id}`));
  if (!seen) return { fresh: [], seen: now };
  return { fresh: flags.filter((f) => isRobotFinding(f) && !seen.has(`${f.deviceId}:${f.id}`)), seen: now };
}

/** Colour of an open alert by what it is about: leak blue, own animals gold, plants amber, others red. */
export function findingColor(f: Pick<YardFlag, 'finding' | 'animalGroup' | 'label'>): string {
  if (f.finding === 'leak') return '#4FC3F7';
  if (f.finding === 'plant' || (!f.finding && f.label && ['Wilting', 'Yellow leaves', 'Pest damage'].includes(f.label))) return '#E8A020';
  if (f.animalGroup === 'flock' || f.animalGroup === 'pet') return '#C8B882';
  if (f.animalGroup === 'wildlife') return '#8DD47A';
  return '#CC3333';
}

/** Marker colour: alerts by finding (muted once cleared), weeds amber until treated (green) or rejected (muted). */
export const detectionColor = (f: YardFlag): string =>
  f.type === 'alert' ? (f.status === 'active' ? findingColor(f) : '#8A7D55')
    : f.status === 'treated' ? '#4A7C59'
      : f.status === 'rejected' ? '#8A7D55'
        : '#E8A020';

/** Most urgent first: leaks and predators, then own animals out, then the rest (weeds last). */
export function urgency(f: YardFlag): number {
  if (f.finding === 'leak' || f.animalGroup === 'predator' || (f.type === 'alert' && !f.finding)) return 0;
  if (f.animalGroup === 'flock') return 1;
  if (f.type === 'alert') return 2;
  return 3;
}
