// plants.ts - garden crops, common weeds (what Weed Patrol targets) and plants that are
// toxic to animals. Shared by tendercells.com (/library) and the OS (/library).

export type PlantKind = 'crop' | 'weed' | 'toxic';

export interface Plant {
  id: string;
  name: string;
  kind: PlantKind;
  emoji: string;
  summary: string;
  /** Crops: spacing, days to harvest, water. */
  spacingIn?: number;
  daysToHarvest?: [number, number];
  water?: string;
  /** Weeds: how to recognise it and how to control it. */
  identify?: string;
  control?: string;
  /** Weeds: is laser weeding a good fit, and what to know. */
  laser?: string;
  /** Animals it is poisonous to (see animals.ts species ids). */
  toxicTo?: string[];
}

export const PLANTS: Plant[] = [
  // ── crops ──
  { id: 'tomato', kind: 'crop', name: 'Tomato', emoji: '🍅', summary: 'Warm-season fruit; stake or cage.', spacingIn: 24, daysToHarvest: [60, 85], water: 'Deep, even watering 1-2 in a week; mulch to prevent splitting' },
  { id: 'lettuce', kind: 'crop', name: 'Lettuce', emoji: '🥬', summary: 'Cool-season leaves; bolts in heat.', spacingIn: 8, daysToHarvest: [30, 60], water: 'Light and frequent; shallow roots' },
  { id: 'carrot', kind: 'crop', name: 'Carrot', emoji: '🥕', summary: 'Root crop; loose stone-free soil.', spacingIn: 2, daysToHarvest: [60, 80], water: 'Keep the surface moist until sprouts appear' },
  { id: 'bean', kind: 'crop', name: 'Bush bean', emoji: '🫘', summary: 'Fixes nitrogen; easy for students.', spacingIn: 4, daysToHarvest: [50, 60], water: 'About 1 in a week at the roots, not the leaves' },
  { id: 'squash', kind: 'crop', name: 'Summer squash', emoji: '🥒', summary: 'Big leaves shade out weeds once established.', spacingIn: 36, daysToHarvest: [45, 60], water: 'Deep watering; avoid wetting leaves (mildew)' },
  { id: 'pepper', kind: 'crop', name: 'Pepper', emoji: '🌶️', summary: 'Warm-season; slow to start.', spacingIn: 18, daysToHarvest: [60, 90], water: 'Even moisture; mulch' },
  { id: 'basil', kind: 'crop', name: 'Basil', emoji: '🌿', summary: 'Herb; pinch flowers to keep leaves coming.', spacingIn: 10, daysToHarvest: [30, 60], water: 'Keep evenly moist' },
  { id: 'strawberry', kind: 'crop', name: 'Strawberry', emoji: '🍓', summary: 'Perennial; runners fill the bed.', spacingIn: 12, daysToHarvest: [90, 120], water: '1 in a week; drip keeps berries clean' },
  // ── weeds ──
  { id: 'pigweed', kind: 'weed', name: 'Pigweed / amaranth', emoji: '🌱', summary: 'Fast summer annual; one plant makes huge numbers of seeds.',
    identify: 'Oval leaves on a reddish taproot; hairy stems (redroot pigweed)', control: 'Hoe or pull before it flowers; mulch; never let it go to seed',
    laser: 'Good target when small (2-4 leaf stage); one of the three weeds LiteWeed was field-tested on' },
  { id: 'purslane', kind: 'weed', name: 'Purslane', emoji: '🌱', summary: 'Succulent mat-forming annual; edible.',
    identify: 'Thick fleshy paddle-shaped leaves, reddish stems lying flat', control: 'Pull and remove from the bed - stem pieces re-root on moist soil',
    laser: 'Good target; LiteWeed field-tested it. Treat the growing point early' },
  { id: 'nutsedge', kind: 'weed', name: 'Nutsedge', emoji: '🌱', summary: 'Grass-like sedge that regrows from underground tubers.',
    identify: 'Triangular stem ("sedges have edges"), shiny yellow-green leaves', control: 'Repeated removal to exhaust the tubers; pulling snaps them off and they regrow',
    laser: 'Regrows from tubers - plan repeated passes (Weed Patrol schedule); LiteWeed field-tested it' },
  { id: 'crabgrass', kind: 'weed', name: 'Crabgrass', emoji: '🌾', summary: 'Summer annual grass spreading from the center.',
    identify: 'Wide light-green blades radiating like crab legs', control: 'Mulch, dense planting, pull young plants', laser: 'Hard - many growing points; better prevented with mulch' },
  { id: 'dandelion', kind: 'weed', name: 'Dandelion', emoji: '🌼', summary: 'Perennial with a deep taproot; flowers feed pollinators.',
    identify: 'Toothed leaves in a rosette, yellow flower, hollow stem with milky sap', control: 'Dig the whole taproot', laser: 'Top growth returns from the root - repeated passes' },
  { id: 'lambsquarters', kind: 'weed', name: 'Lambsquarters', emoji: '🌱', summary: 'Tall annual; edible young leaves.',
    identify: 'Diamond-shaped leaves with a white mealy coating', control: 'Pull before seeds form', laser: 'Good target while small' },
  { id: 'bindweed', kind: 'weed', name: 'Field bindweed', emoji: '🌸', summary: 'Perennial vine with very deep roots.',
    identify: 'Arrowhead leaves, white-pink trumpet flowers, twining stems', control: 'Persistent removal over seasons; smother with mulch',
    laser: 'Only slows it - roots go very deep; combine with mulch' },
  // ── toxic to animals ──
  { id: 'avocado', kind: 'toxic', name: 'Avocado (leaves, pit, skin)', emoji: '🥑', summary: 'Contains persin - dangerous to birds, rabbits and goats.', toxicTo: ['chicken', 'duck', 'rabbit', 'goat'] },
  { id: 'nightshade', kind: 'toxic', name: 'Nightshades (green parts)', emoji: '☠️', summary: 'Leaves and green fruit of tomato, potato and wild nightshade contain solanine.', toxicTo: ['chicken', 'duck', 'goat', 'rabbit'] },
  { id: 'yew', kind: 'toxic', name: 'Yew', emoji: '🌲', summary: 'Evergreen hedge; very toxic to livestock and poultry even in small amounts.', toxicTo: ['chicken', 'duck', 'goat', 'rabbit'] },
  { id: 'rhododendron', kind: 'toxic', name: 'Rhododendron / azalea', emoji: '🌺', summary: 'Grayanotoxins - a common cause of goat poisoning.', toxicTo: ['goat', 'rabbit'] },
  { id: 'oleander', kind: 'toxic', name: 'Oleander', emoji: '🌸', summary: 'Heart toxin; all parts, fresh or dried.', toxicTo: ['goat', 'chicken', 'rabbit'] },
  { id: 'foxglove', kind: 'toxic', name: 'Foxglove', emoji: '🔔', summary: 'Heart toxin (digitalis).', toxicTo: ['rabbit', 'goat'] },
  { id: 'rhubarb-leaves', kind: 'toxic', name: 'Rhubarb leaves', emoji: '🍂', summary: 'Oxalic acid in the leaves.', toxicTo: ['chicken', 'goat', 'rabbit'] },
];

export const plantById = (id: string): Plant | undefined => PLANTS.find((p) => p.id === id);
