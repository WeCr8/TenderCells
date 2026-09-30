// projects.ts - DIY habitat projects (terrarium / vivarium, indoor small animals, ponds,
// coops) with video, audio and Hugging Face models. Shared by tendercells.com (/library)
// and the OS (/projects, where a built project connects and shows its live feed).
//
// Local-first feeds: video and audio go straight from the device to the viewer's browser
// on the same network (or the owner's own tunnel), and AI runs on the device or the local
// hub. Only small JSON (telemetry every 10 s, events) goes through Tender Cells, so a
// feed costs almost nothing to transmit. See feedBudget() and docs/DIY_HABITAT_PROJECTS.md.
import type { AnimalGroup } from './animals';

export interface HfModel {
  /** Hugging Face repo id - https://huggingface.co/{id} */
  id: string;
  task: 'audio-classification' | 'zero-shot-image-classification' | 'zero-shot-object-detection';
  use: string;
}

export interface HabitatProject {
  id: string;
  title: string;
  emoji: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  groups: AnimalGroup[];
  summary: string;
  parts: string[];
  /** Fields the device publishes on tc/{deviceId}/sensors (JSON, every 10 s). */
  publishes: string[];
  video?: boolean;
  audio?: boolean;
  hf: HfModel[];
  /** Website lesson slugs (/lessons/:slug). */
  lessons: string[];
  safety: string;
}

const AST: HfModel = { id: 'MIT/ast-finetuned-audioset-10-10-0.4593', task: 'audio-classification',
  use: 'AudioSet sound labels (e.g. "Chicken, rooster", "Duck", "Dog", "Rodents, rats, mice", "Hiss") - run on the hub, publish only the label' };
const BIOCLIP: HfModel = { id: 'imageomics/bioclip', task: 'zero-shot-image-classification',
  use: 'Tree-of-life species ID from a snapshot - "which animal is this?" for students' };
const OWLV2: HfModel = { id: 'google/owlv2-base-patch16-ensemble', task: 'zero-shot-object-detection',
  use: 'Find things by text prompt ("a rat", "a snake", "a tortoise", "an empty water bowl") and count them' };

export const PROJECTS: HabitatProject[] = [
  { id: 'terrarium-climate', title: 'DIY terrarium / vivarium climate monitor', emoji: '🦎', level: 'Beginner', groups: ['reptile', 'small-mammal'],
    summary: 'Warm-side, cool-side and basking temperatures, humidity and the UVB light schedule, with alerts when a gradient drifts out of range for the species.',
    parts: ['ESP32 dev board', '2 x SHT31 or DHT22 (warm and cool side)', 'DS18B20 probe (basking spot)', 'Plug-in reptile thermostat (primary heat control)', 'Relay or smart plug for the UVB timer'],
    publishes: ['warmF', 'coolF', 'baskF', 'humidity', 'uvbOn'],
    hf: [], lessons: ['sensors-automation', 'build-your-own'],
    safety: 'A hardware thermostat controls heat - the ESP32 only monitors and switches UVB. Guard every lamp so animals cannot touch it.' },
  { id: 'enclosure-camera', title: 'Enclosure camera + AI species check', emoji: '📷', level: 'Intermediate', groups: ['reptile', 'small-mammal', 'poultry', 'aquatic'],
    summary: 'An ESP32-CAM or Pi camera streams MJPEG on your network; the hub runs a Hugging Face model on occasional snapshots and publishes only what it saw.',
    parts: ['ESP32-CAM or Raspberry Pi + camera', 'IR LEDs for night (no visible light for nocturnal animals)', 'Local hub (Pi / Jetson) for AI'],
    publishes: ['streamUrl', 'lastSeen', 'count'],
    video: true, hf: [BIOCLIP, OWLV2], lessons: ['build-your-own'],
    safety: 'Mount outside the enclosure or behind mesh; no cables inside reach of chewing rodents.' },
  { id: 'sound-monitor', title: 'Habitat sound monitor', emoji: '🎙️', level: 'Intermediate', groups: ['poultry', 'small-mammal', 'livestock'],
    summary: 'A microphone on the local hub classifies sounds (distress calls, rodents in the coop at night, a dog, a rooster count) and publishes labels, never the audio.',
    parts: ['USB microphone or I2S INMP441', 'Raspberry Pi / Jetson running firmware/jetson-nano/habitat_listener.py'],
    publishes: ['soundLabel', 'score'],
    audio: true, hf: [AST], lessons: ['build-your-own'],
    safety: 'Tell people when a microphone is recording in a classroom; audio stays on the hub.' },
  { id: 'aquarium-pond', title: 'Aquarium / pond water monitor', emoji: '🐟', level: 'Beginner', groups: ['aquatic', 'reptile'],
    summary: 'Water temperature, level and pH for fish tanks, turtle tanks and ponds, with a low-oxygen warning on hot nights (aerator off + warm water).',
    parts: ['ESP32', 'DS18B20 waterproof probe', 'Float switch', 'pH probe board (optional)', 'Aerator on a relay'],
    publishes: ['waterF', 'waterLevel', 'ph', 'aeratorOn'],
    hf: [], lessons: ['sensors-automation', 'feeder-waterer'],
    safety: 'Use a GFCI outlet for everything near water; keep electronics above the waterline.' },
  { id: 'activity-wheel', title: 'Small-animal activity wheel counter', emoji: '🐹', level: 'Beginner', groups: ['small-mammal'],
    summary: 'A magnet and hall sensor count wheel turns at night for hamsters, mice and rats - a sudden drop is an early sign something is wrong.',
    parts: ['ESP32 or Pi Pico W', 'Hall-effect sensor', 'Small magnet on the wheel'],
    publishes: ['wheelTurns', 'distanceM'],
    hf: [], lessons: ['your-first-coop-brain'],
    safety: 'Glue the magnet where it cannot come loose and be swallowed.' },
];

/** Billing plans (functions/src/billing.ts) - 'free' when there is no subscription. */
export type FeedPlan = 'free' | 'starter_monthly' | 'school_annual';

/**
 * Cloud video / audio per plan (proposed - final numbers are set with pricing). Local live view,
 * AI events and telemetry are free on every plan; relaying media through Tender Cells costs real
 * bandwidth, so live cloud view and clip history are paid.
 */
export const CLOUD_FEED: Record<FeedPlan, { label: string; liveHoursPerMonth: number; snapshotDays: number; clipDays: number }> = {
  free: { label: 'Free', liveHoursPerMonth: 0, snapshotDays: 7, clipDays: 0 },
  starter_monthly: { label: 'Starter', liveHoursPerMonth: 20, snapshotDays: 30, clipDays: 7 },
  school_annual: { label: 'School', liveHoursPerMonth: 200, snapshotDays: 30, clipDays: 30 },
};

export const projectById = (id: string): HabitatProject | undefined => PROJECTS.find((p) => p.id === id);
export const projectsFor = (group: AnimalGroup): HabitatProject[] => PROJECTS.filter((p) => p.groups.includes(group));
export const hfUrl = (m: HfModel) => `https://huggingface.co/${m.id}`;

/**
 * Bytes a feed sends through Tender Cells per day, local-first vs relaying media.
 *
 * @param opts.telemetryBytes - Size of one JSON telemetry message
 * @param opts.intervalS      - Telemetry interval (seconds)
 * @param opts.video          - MJPEG frames/s and KB per frame, if the project streams video
 * @param opts.audioKbps      - Audio bitrate, if it streams audio
 * @returns cloudBytes (local-first: JSON only) and relayedBytes (if media went via the cloud)
 */
export function feedBudget(opts: { telemetryBytes?: number; intervalS?: number; video?: { fps: number; kbPerFrame: number }; audioKbps?: number; eventsPerDay?: number }) {
  const day = 86_400;
  const json = (opts.telemetryBytes ?? 200) * (day / (opts.intervalS ?? 10)) + (opts.eventsPerDay ?? 50) * 300;
  const video = opts.video ? opts.video.fps * opts.video.kbPerFrame * 1024 * day : 0;
  const audio = opts.audioKbps ? (opts.audioKbps * 1000 / 8) * day : 0;
  return { cloudBytes: json, relayedBytes: json + video + audio };
}

export const formatBytes = (b: number) =>
  b >= 1e9 ? `${(b / 1e9).toFixed(1)} GB` : b >= 1e6 ? `${(b / 1e6).toFixed(1)} MB` : `${Math.round(b / 1e3)} KB`;
