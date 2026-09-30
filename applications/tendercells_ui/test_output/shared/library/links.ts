// links.ts - how library entries correlate with tendercells.com pages and OS screens.
// One map used by the website library, the OS library, product pages and the health guide,
// so a species always points at its product page + health guide and a product page points
// back at its species. A unit test checks every href is a real website route.
import type { SpeciesId } from './animals';
import type { PlantKind } from './plants';

export interface PageLink { label: string; href: string }

/** Website product page slug (/shop/:slug) per species. */
/** Species without a product (reptiles) use the build-your-own path instead. */
export const PRODUCT_SLUG_BY_SPECIES: Partial<Record<SpeciesId, string>> = {
  chicken: 'chicken-tender', quail: 'chicken-tender', duck: 'duck-dock', goose: 'duck-dock', 'pond-fish': 'duck-dock',
  turkey: 'turkey-tower', pigeon: 'pigeon-palace',
  rabbit: 'bunny-burrow', 'guinea-pig': 'bunny-burrow', chinchilla: 'bunny-burrow', hamster: 'bunny-burrow', rat: 'bunny-burrow', mouse: 'bunny-burrow',
  goat: 'goat-guardian', sheep: 'goat-guardian', pig: 'goat-guardian', alpaca: 'goat-guardian',
};

/** Species each product page serves (reverse of PRODUCT_SLUG_BY_SPECIES). */
export function speciesForProduct(slug: string): SpeciesId[] {
  return (Object.keys(PRODUCT_SLUG_BY_SPECIES) as SpeciesId[]).filter((s) => PRODUCT_SLUG_BY_SPECIES[s] === slug);
}

/** tendercells.com pages related to a species. */
export function animalPages(id: SpeciesId): PageLink[] {
  const slug = PRODUCT_SLUG_BY_SPECIES[id];
  return [
    slug ? { label: 'Product page', href: `/shop/${slug}` } : { label: 'Build your own enclosure (lesson)', href: '/lessons/build-your-own' },
    { label: id === 'chicken' ? 'Chicken health guide (sensor ranges)' : 'Animal health overview', href: id === 'chicken' ? '/health#chicken' : '/health' },
    { label: 'Nutrition & feed', href: '/health#nutrition' },
    { label: 'Disease monitoring', href: '/health#disease' },
    { label: 'Predator prevention', href: '/guides/predator-monitoring' },
    { label: 'Sensors → automation (lesson)', href: '/lessons/sensors-automation' },
  ];
}

/** tendercells.com pages related to a kind of plant. */
export const PLANT_PAGES: Record<PlantKind, PageLink[]> = {
  crop: [{ label: 'Farm automation & gardens', href: '/farm-automation' }, { label: 'Homesteading', href: '/learn/homesteading' }],
  weed: [{ label: 'Farm automation (Weed Patrol)', href: '/farm-automation' }, { label: 'Automation guide', href: '/learn/automation' }],
  toxic: [{ label: 'Nutrition & feed', href: '/health#nutrition' }, { label: 'Animal health', href: '/health' }],
};

/** tendercells.com pages for predators and pests. */
export const WILDLIFE_PAGES: PageLink[] = [
  { label: 'Predator monitoring guide', href: '/guides/predator-monitoring' },
  { label: 'Predator prevention', href: '/health#predators' },
  { label: 'WatchTower AI', href: '/shop/watchtower' },
  { label: 'Farm automation (patrols)', href: '/farm-automation' },
];

/** OS (app) screens related to an entry - paths inside tendercells.com/app. */
export const OS_SCREENS = {
  animal: { label: 'My animals', path: '/birds' },
  weed: { label: 'Weed Patrol', path: '/weed-patrol' },
  crop: { label: 'Property layout', path: '/layout' },
  wildlife: { label: 'Predator Monitor', path: '/predator-monitor' },
} as const;
