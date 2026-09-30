// Library entries correlate with real tendercells.com pages and each other: every related
// link resolves to a website route (read from the website router), every species / plant /
// wildlife reference exists, and every product page with animals links back to them.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { ANIMALS, animalById, GROUP_LABEL } from '../../../../shared/library/animals';
import { PLANT_PAGES, PRODUCT_SLUG_BY_SPECIES, WILDLIFE_PAGES, animalPages, speciesForProduct } from '../../../../shared/library/links';
import { WILDLIFE, threatsTo } from '../../../../shared/library/wildlife';
import { PROJECTS, feedBudget } from '../../../../shared/library/projects';
import { LESSONS } from '../../../../website/src/data/lessons';

const websiteRouter = readFileSync(resolve(__dirname, '../../../../website/src/App.tsx'), 'utf8');
const routes = [...websiteRouter.matchAll(/path="([^"]+)"/g)].map((m) => m[1]).filter((p) => p !== '*');
const productPage = readFileSync(resolve(__dirname, '../../../../website/src/pages/ProductDetailPage.tsx'), 'utf8');
const healthPage = readFileSync(resolve(__dirname, '../../../../website/src/pages/HealthPage.tsx'), 'utf8');

/** True when a website href (optionally with #anchor) matches a route pattern. */
function routeExists(href: string): boolean {
  const [path, anchor] = href.split('#');
  const ok = routes.some((r) => new RegExp(`^${r.replace(/:[^/]+/g, '[^/]+')}$`).test(path));
  if (!ok) return false;
  if (path === '/health' && anchor) return healthPage.includes(`id="${anchor}"`);
  if (path.startsWith('/shop/')) return productPage.includes(`"${path.slice(6)}": {`);
  if (path.startsWith('/lessons/')) return LESSONS.some((l) => l.slug === path.slice(9));
  return true;
}

describe('library ↔ website correlation', () => {
  it('every related link is a real website page', () => {
    const links = [...ANIMALS.flatMap((a) => animalPages(a.id)), ...Object.values(PLANT_PAGES).flat(), ...WILDLIFE_PAGES];
    for (const l of links) expect(routeExists(l.href), l.href).toBe(true);
    for (const p of PROJECTS) for (const slug of p.lessons) expect(routeExists(`/lessons/${slug}`), slug).toBe(true);
  });

  it('library routes exist on the website for animals, plants and wildlife', () => {
    for (const kind of ['animals', 'plants', 'wildlife']) expect(routeExists(`/library/${kind}/x`), kind).toBe(true);
  });

  it('every species has a group, and product pages link back to their species', () => {
    for (const a of ANIMALS) expect(GROUP_LABEL[a.group], a.id).toBeTruthy();
    for (const slug of new Set(Object.values(PRODUCT_SLUG_BY_SPECIES))) {
      expect(speciesForProduct(slug!).length, slug).toBeGreaterThan(0);
      expect(productPage.includes(`"${slug}": {`), slug).toBe(true);
    }
  });

  it('covers rodents, livestock, fish and reptiles', () => {
    for (const id of ['guinea-pig', 'hamster', 'rat', 'sheep', 'pig', 'pond-fish', 'tortoise', 'bearded-dragon', 'ball-python']) {
      expect(animalById(id), id).toBeTruthy();
    }
  });

  it('wildlife references real species; rodents and snakes are covered with safety notes', () => {
    for (const w of WILDLIFE) for (const s of w.threatTo) expect(animalById(s), `${w.id}→${s}`).toBeTruthy();
    for (const id of ['rat', 'mouse', 'venomous-snake']) expect(WILDLIFE.find((w) => w.id === id)?.caution, id).toBeTruthy();
    expect(threatsTo('chicken').length).toBeGreaterThan(3);
  });

  it('local-first feeds send far less through the cloud than relayed media', () => {
    const b = feedBudget({ video: { fps: 5, kbPerFrame: 30 }, audioKbps: 64 });
    expect(b.cloudBytes).toBeLessThan(5e6);          // JSON only: a few MB a day
    expect(b.relayedBytes).toBeGreaterThan(10e9);    // video + audio: >10 GB a day
    for (const p of PROJECTS) for (const m of p.hf) expect(m.id).toMatch(/^[\w.-]+\/[\w.-]+$/);
  });
});
