// wildlife.ts - predators and pests around animals: what they take, signs, prevention and
// what WatchTower / patrol robots do about them. Shared by tendercells.com and the OS.
// Patrols only watch, log and deter with light / sound; nothing here is ever a laser target,
// and many of these animals (hawks, owls, most snakes) are legally protected.
import type { SpeciesId } from './animals';

export type WildlifeKind = 'predator' | 'pest' | 'venomous';

export interface Wildlife {
  id: string;
  name: string;
  emoji: string;
  kind: WildlifeKind;
  /** When it is usually active. */
  active: 'day' | 'night' | 'dawn-dusk' | 'any';
  threatTo: SpeciesId[];
  signs: string;
  prevention: string;
  /** What Tender Cells patrols and cameras do. */
  patrol: string;
  /** Legal / safety note shown in red. */
  caution?: string;
}

const POULTRY: SpeciesId[] = ['chicken', 'duck', 'turkey', 'goose', 'quail', 'pigeon'];
const SMALL: SpeciesId[] = ['rabbit', 'guinea-pig', 'chinchilla'];

export const WILDLIFE: Wildlife[] = [
  { id: 'raccoon', name: 'Raccoon', emoji: '🦝', kind: 'predator', active: 'night', threatTo: [...POULTRY, ...SMALL, 'pond-fish', 'tortoise'],
    signs: 'Heads or crops eaten, birds pulled through wire, opened latches, muddy hand prints',
    prevention: '1/2 in hardware cloth (not chicken wire), two-step or locking latches, close doors at dusk',
    patrol: 'WatchTower night cameras flag it; the coop door auto-closes at dusk; lights and sound deter' },
  { id: 'fox', name: 'Red fox', emoji: '🦊', kind: 'predator', active: 'dawn-dusk', threatTo: [...POULTRY, ...SMALL],
    signs: 'Missing birds, scattered feathers, digging along the fence line',
    prevention: 'Bury a 12 in hardware-cloth apron, electric wire at nose height, secure run roof',
    patrol: 'Perimeter cameras log bearing and time; predator patrol task drives the Roaming Roost fence line' },
  { id: 'coyote', name: 'Coyote', emoji: '🐺', kind: 'predator', active: 'dawn-dusk', threatTo: [...POULTRY, ...SMALL, 'goat', 'sheep', 'alpaca', 'pig'],
    signs: 'Whole animals missing, tracks, howling nearby',
    prevention: 'Tall fencing with an outward lean or electric top wire, guardian animals, lock up at night',
    patrol: 'WatchTower detection alerts, Roaming Roost recall to the shelter' },
  { id: 'hawk', name: 'Hawks', emoji: '🦅', kind: 'predator', active: 'day', threatTo: ['chicken', 'quail', 'pigeon', 'duck', 'guinea-pig', 'rabbit'],
    signs: 'Plucked feathers in one spot, attacks in open runs during the day',
    prevention: 'Covered run or netting, cover to hide under, a rooster or guardian',
    patrol: 'Sky camera alerts; covered-run reminders when chickens free range',
    caution: 'Protected by federal law (Migratory Bird Treaty Act) - never trap or harm.' },
  { id: 'owl', name: 'Owls', emoji: '🦉', kind: 'predator', active: 'night', threatTo: ['chicken', 'quail', 'pigeon', 'rabbit', 'guinea-pig'],
    signs: 'Birds taken from open roosts at night, head injuries',
    prevention: 'Everyone inside a closed coop at night',
    patrol: 'Headcount at dusk before the door closes',
    caution: 'Protected by federal law - never trap or harm.' },
  { id: 'opossum', name: 'Opossum', emoji: '🐀', kind: 'predator', active: 'night', threatTo: ['chicken', 'quail', 'duck'],
    signs: 'Eggs eaten in the nest, chicks missing, slow attacks on sleeping birds',
    prevention: 'Close pop doors at night, collect eggs daily, seal gaps over 2 in',
    patrol: 'Egg-station flags vs. egg counts show missing eggs; night cameras' },
  { id: 'weasel', name: 'Weasel / mink', emoji: '🦦', kind: 'predator', active: 'night', threatTo: [...POULTRY, ...SMALL, 'pond-fish'],
    signs: 'Several birds killed at once, bites to the head and neck, tiny entry holes',
    prevention: 'Seal every gap larger than 1 in; 1/4-1/2 in hardware cloth on vents',
    patrol: 'Coop interior camera + headcount alert' },
  { id: 'skunk', name: 'Skunk', emoji: '🦨', kind: 'predator', active: 'night', threatTo: ['chicken', 'quail', 'duck'],
    signs: 'Eggs opened at one end, shallow digging, smell',
    prevention: 'Fence apron, collect eggs, no spilled feed',
    patrol: 'Night camera; motion light deterrent' },
  { id: 'loose-dog', name: 'Loose dogs', emoji: '🐕', kind: 'predator', active: 'any', threatTo: [...POULTRY, ...SMALL, 'goat', 'sheep', 'alpaca'],
    signs: 'Many animals chased or killed, not eaten; fence damage',
    prevention: 'Strong fencing and a closed coop; talk to neighbors and animal control',
    patrol: 'Camera clip + alert to the owner; never automated deterrents aimed at pets' },
  { id: 'rat', name: 'Rats (pest)', emoji: '🐀', kind: 'pest', active: 'night', threatTo: ['chicken', 'quail', 'duck', 'rabbit', 'guinea-pig', 'pond-fish'],
    signs: 'Feed disappearing, droppings, burrows under the coop, eggs and chicks taken',
    prevention: 'Rodent-proof metal feeders, no feed left out at night, raise coops, 1/4 in mesh on the floor',
    patrol: 'Feeder-level drops at night + camera sightings logged; snap traps in covered stations only',
    caution: 'Avoid poison bait - it kills owls, hawks, pets and chickens that eat poisoned rodents.' },
  { id: 'mouse', name: 'Mice (pest)', emoji: '🐁', kind: 'pest', active: 'night', threatTo: ['chicken', 'rabbit', 'guinea-pig'],
    signs: 'Small droppings, chewed bags and wiring, nests in bedding',
    prevention: 'Metal bins for feed, seal gaps over 1/4 in, keep bedding dry',
    patrol: 'Enclosure cameras and sound monitor pick up night activity',
    caution: 'Avoid poison bait near animals.' },
  { id: 'rat-snake', name: 'Rat snakes (non-venomous)', emoji: '🐍', kind: 'predator', active: 'day', threatTo: ['chicken', 'quail', 'duck', 'pigeon'],
    signs: 'Eggs gone with no shells left, chicks missing, snake in the nest box',
    prevention: '1/4 in mesh on gaps, collect eggs often, keep grass short around the coop',
    patrol: 'Snake patrol task logs sightings in the bed and around coops; alerts only',
    caution: 'Protected in many states and useful rodent control - relocate, do not kill.' },
  { id: 'venomous-snake', name: 'Venomous snakes (rattlesnake, copperhead, cottonmouth)', emoji: '⚠️', kind: 'venomous', active: 'any', threatTo: ['chicken', 'duck', 'goat', 'sheep', 'alpaca', 'pig', 'rabbit'],
    signs: 'Sudden swelling and pain, fang marks, animal collapses',
    prevention: 'Clear brush and wood piles, seal gaps, control rodents that attract them',
    patrol: 'Snake patrol sighting raises a red alert to keep people and students away',
    caution: 'Never approach or handle. Keep students back. Call animal control or a wildlife professional; a bitten animal needs a vet right away.' },
];

export const wildlifeById = (id: string): Wildlife | undefined => WILDLIFE.find((w) => w.id === id);

/** Predators and pests that threaten a species. */
export const threatsTo = (species: SpeciesId): Wildlife[] => WILDLIFE.filter((w) => w.threatTo.includes(species));
