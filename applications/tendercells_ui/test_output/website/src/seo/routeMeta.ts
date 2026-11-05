// routeMeta.ts - the title, description, image and canonical URL of every public page.
// One source for both:
//   - the browser (src/hooks/usePageTracking.ts updates <head> on each route change), and
//   - the build (scripts/seo-pages.mjs writes dist/<route>/index.html with these tags in the
//     initial HTML, and the generated block of public/sitemap.xml).
// FIX(2026-10-22): Search Console flagged "Duplicate, Google chose different canonical than
// user" (/library/animals/pig -> /assistants). Every route used to be served the same
// index.html (canonical = home page) and pages without an entry here rendered the same default
// title + description, so Google clustered them. Every indexable page now has its own entry
// and a self-referencing canonical in the served HTML.
import SITE_DOCS from "../data/siteDocs.json";
import { LESSONS } from "../data/lessons";
import { DOC_GROUPS } from "../data/docs";
import { ANIMALS, GROUP_LABEL, animalById } from "../../../shared/library/animals";
import { PLANTS, plantById } from "../../../shared/library/plants";
import { WILDLIFE, wildlifeById } from "../../../shared/library/wildlife";

export const SITE = "https://tendercells.com";
export const DEFAULT_IMAGE = "https://tendercells.com/assets/images/products/chicken-tender-concept.png";

export interface RouteMeta {
  title: string;
  description: string;
  image?: string;
  /** Another page this one duplicates; its URL becomes this page's canonical. */
  canonicalPath?: string;
}

export const DEFAULT_META: RouteMeta = {
  title: 'TenderCells - Open-Source Smart Animal Care',
  description: 'TenderCells is an open-source agricultural engineering ecosystem for smart animal care, STEM education, 4-H, FFA, homesteaders, makers, and future engineers.',
};

export const ROUTE_META: Record<string, RouteMeta> = {
  '/': {
    title: 'TenderCells - Open-Source Smart Animal Care',
    description: 'Build and explore open-source animal-care automation for coops, predator monitoring, STEM education, homesteads, and agricultural robotics.',
  },
  '/shop': {
    title: 'TenderCells Products - Smart Animal Care Hardware',
    description: 'Explore TenderCells product concepts including Chicken Tender, WatchTower AI, Roaming Roost, Barn Brain, and animal-care automation modules.',
  },
  '/shop/chicken-tender': {
    title: 'Chicken Tender - Smart Coop, Health Monitoring, Cameras, and Swappable Robotics',
    description: 'Chicken Tender is the first TenderCells OS hardware cell for smart coop automation, animal health monitoring, cameras, Jetson edge AI, and swappable robotics modules.',
    image: 'https://tendercells.com/assets/images/products/chicken-tender-concept.png',
  },
  '/shop/watchtower': {
    title: 'WatchTower AI - Solar Predator Monitor',
    description: 'WatchTower AI is a solar pole-mounted predator monitor concept with 360-degree cameras, ESP32 electronics, battery, and local alerts.',
    image: 'https://tendercells.com/assets/images/products/predator-monitor-pole-mount.png',
  },
  '/shop/roaming-roost': {
    title: 'Roaming Roost - Mobile Pasture Coop Concept',
    description: 'Roaming Roost is a mobile pasture coop concept for automated rotation, docking, GPS boundaries, and WatchTower predator-alert integration.',
    image: 'https://tendercells.com/assets/images/products/roaming-roost-concept.png',
  },
  '/shop/barn-brain': {
    title: 'Barn Brain - TenderCells Edge Hub Idea',
    description: 'Barn Brain is a TenderCells edge hub idea for local MQTT, device registry, routines, safety interlocks, offline dashboards, and student-built farm automation.',
    image: 'https://tendercells.com/assets/images/demos/door-device-crud-demo.png',
  },
  '/education': {
    title: '4-H STEM, FFA, and Young Engineer Projects - TenderCells',
    description: 'TenderCells education resources help 4-H members, FFA students, homeschoolers, and young engineers build smart animal-care automation projects.',
  },
  '/audiences': {
    title: 'TenderCells Audiences - 4-H, FFA, Homeschool, Makers, and Future Founders',
    description: 'Find TenderCells pages for 4-H, FFA, homeschool, young engineers, makers, teachers, developers, and future founders.',
  },
  '/academy': {
    title: 'TenderCells Academy - Agricultural Robotics Curriculum',
    description: 'TenderCells Academy teaches smart animal care, robotics, sensors, computer vision, data science, open-source farming, and safe automation.',
  },
  '/4h': {
    title: '4-H STEM Projects - Smart Animal Care and Engineering',
    description: 'TenderCells helps 4-H members build smart chicken coop, predator monitor, sensor, data, and agricultural technology projects.',
  },
  '/ffa': {
    title: 'FFA Agricultural Technology Projects - TenderCells',
    description: 'TenderCells gives FFA students SAE-ready projects for poultry technology, livestock monitoring, farm automation, and animal-care data.',
  },
  '/homeschool': {
    title: 'Homeschool STEM Projects - Robotics, Animal Care, and Homesteading',
    description: 'TenderCells helps homeschool families teach robotics, coding, biology, data science, and smart homesteading through real animal-care projects.',
  },
  '/science-fair': {
    title: 'Science Fair Agricultural Robotics Projects - TenderCells',
    description: 'TenderCells science fair ideas combine animal welfare, environmental sensing, smart chicken coops, robotics, and open-source farming.',
  },
  '/apps': {
    title: 'TenderCells Apps - Web Dashboard and Integrations',
    description: 'Explore TenderCells web dashboard, app concepts, developer APIs, MQTT integration, and public demo workflows.',
  },
  '/demo': {
    title: 'TenderCells Public Demo - Farming OS Experience',
    description: 'Learn what the TenderCells public demo shows, how to test it, and how AI tools can evaluate the smart animal-care Farming OS experience.',
  },
  '/learn': {
    title: 'Learn Smart Animal Care Automation - TenderCells',
    description: 'Learn homestead automation, smart chicken coops, animal-care robotics, open-source agriculture, and practical STEM projects.',
  },
  '/learn/homesteading': {
    title: 'Smart Homesteading Guide - TenderCells',
    description: 'A practical guide to smart homesteading with animal-care automation, monitoring, safety, and open-source hardware.',
  },
  '/learn/automation': {
    title: 'Animal Care Automation Ideas - TenderCells',
    description: 'Automation ideas for coops, feeders, water systems, cameras, predator monitoring, sensors, and student engineering projects.',
  },
  '/learn/faq': {
    title: 'TenderCells FAQ - Smart Animal Care Questions',
    description: 'Answers about TenderCells products, open-source hardware, animal-care automation, demos, education, and developer docs.',
  },
  '/guides': {
    title: 'TenderCells Guides - Smart Coop, Predator Monitoring, and Pasture Rotation',
    description: 'Original TenderCells guides for smart chicken coops, predator monitoring, mobile coops, pasture rotation, and animal-care automation.',
  },
  '/guides/smart-chicken-coop': {
    title: 'Smart Chicken Coop Guide - TenderCells',
    description: 'Plan a smart chicken coop with sensors, safe automation, manual override, animal-care records, and open-source learning paths.',
  },
  '/guides/predator-monitoring': {
    title: 'Predator Monitoring Guide - TenderCells',
    description: 'Learn how camera, solar, alert, and local AI concepts can support safer outdoor animal care and student engineering projects.',
  },
  '/guides/pasture-rotation': {
    title: 'Mobile Coop and Pasture Rotation Guide - TenderCells',
    description: 'Study mobile coop design, route planning, docking, safety, and pasture rotation ideas for students and homesteaders.',
  },
  '/guides/camera-node-first-build': {
    title: 'ESP32-S3 Camera Node Build Guide | TenderCells',
    description: 'Electrical wiring, browser flashing, device registration, MQTT onboarding, and responsive build instructions for a Seeed XIAO ESP32-S3 Sense camera node.',
  },
  '/farm-automation': {
    title: 'Farm Automation Software and Smart Farm Routines - TenderCells',
    description: 'TenderCells Farm Automation and Routines is a Home Assistant for agriculture, IFTTT for animal care, and Node-RED for homesteaders.',
  },
  '/health': {
    title: 'Animal Health Knowledge Base - TenderCells',
    description: 'Animal health resources for chickens, ducks, goats, rabbits, stress monitoring, unusual behavior alerts, sensor trends, and human-review smart care systems.',
    image: 'https://tendercells.com/assets/images/health/free-range-flock.jpg',
  },
  '/services': {
    title: 'TenderCells Services - Installers and Local Support',
    description: 'Find local service concepts for installers, technicians, feed suppliers, and community support around smart animal-care systems.',
  },
  '/partners': {
    title: 'TenderCells Partners and Sponsors - 4-H, FFA, Schools, and AgTech',
    description: 'Partner with TenderCells to sponsor 4-H, FFA, school, homeschool, open-source, robotics, and smart animal-care engineering programs.',
    image: 'https://tendercells.com/assets/images/demos/tendercells-education-format.png',
  },
  '/open-source': {
    title: 'Open Source TenderCells OS',
    description: 'TenderCells is an open-source platform for animal-care automation, firmware, hardware docs, simulation, and community-built products.',
  },
  '/developers': {
    title: 'TenderCells Developer Docs - API, Firmware, Hardware, Simulation',
    description: 'Developer entrypoint for TenderCells software, firmware, MQTT, hardware catalogs, CAD concepts, product docs, simulation, and security.',
  },
  '/tender-cells-overview': {
    title: 'TenderCells Overview - Smart Animal Care, STEM, and Open Agriculture',
    description: 'Plain-language overview of TenderCells for search engines, AI tools, educators, partners, journalists, homesteaders, and open-source builders.',
  },
  '/llm-demo-test': {
    title: 'TenderCells Demo Evaluation Protocol for ChatGPT and LLM Search Tools',
    description: 'Machine-oriented instructions for ChatGPT, Gemini, Perplexity, Claude-style browsers, AI answer engines, and search tools to test and summarize the TenderCells public demo.',
  },
  '/story': {
    title: 'TenderCells Story - Teaching Future Builders, AI Tools, Robotics, and Product Creation',
    description: 'TenderCells helps kids, students, engineers, makers, and future founders use AI tools, robotics, software, and hardware to build products, ideas, and companies.',
  },
  '/our-story': {
    canonicalPath: '/story',
    title: 'TenderCells Story - Teaching Future Builders, AI Tools, Robotics, and Product Creation',
    description: 'TenderCells helps kids, students, engineers, makers, and future founders use AI tools, robotics, software, and hardware to build products, ideas, and companies.',
  },
  '/about': {
    title: 'About Tender Cells',
    description: 'Learn about Tender Cells, an open-source agricultural engineering project for smart animal care, education, makers, and homesteaders.',
  },
  '/contact': {
    title: 'Contact Tender Cells',
    description: 'Contact Tender Cells for education, open-source, product, partnership, support, and media questions.',
  },
  '/privacy': {
    title: 'Privacy Policy - Tender Cells',
    description: 'Tender Cells privacy policy for public website analytics, Google advertising, cookies, contact messages, and student-oriented educational content.',
  },
  '/cookie-policy': {
    title: 'Cookie Policy - Tender Cells',
    description: 'Tender Cells cookie policy for necessary storage, Google Analytics, Google Tag Manager, Google AdSense, advertising cookies, consent choices, and opt-outs.',
  },
  '/advertising-disclosure': {
    title: 'Advertising Disclosure - Tender Cells',
    description: 'Tender Cells advertising disclosure for Google AdSense, Google Ads, ad cookies, personalized ads, editorial separation, and invalid traffic policy.',
  },
  '/terms': {
    title: 'Terms of Use - Tender Cells',
    description: 'Terms for using the Tender Cells public website, educational materials, demo, product concepts, and open-source resources.',
  },
  '/editorial-policy': {
    title: 'Editorial Policy - Tender Cells',
    description: 'How Tender Cells publishes original, useful, safety-aware educational and technical content.',
  },
  '/blog': {
    title: 'TenderCells Blog - Smart Animal Care and Ag Robotics',
    description: 'Updates and articles about smart animal care, agricultural robotics, education, open-source hardware, and homestead automation.',
  },
  '/os': {
    title: 'Tender Cells OS - The Farming OS for Animals, Gardens and Robots',
    description: 'One app for the whole property: a live 2D / 3D map, animal care, cameras, schedules and robots that ask before they act. Local-first and open source.',
  },
  '/digital-twin': {
    title: 'Farm Digital Twin - Tender Cells OS',
    description: 'Build the farm digitally, connect it physically: every coop, animal, camera, water point, gate, sensor and robot in one property model kept current by real devices.',
  },
  '/schools': {
    title: 'Tender Cells for Schools - Farm Lab, Garden and Robots',
    description: 'Your school owns its farm lab, garden and robots. Teachers choose what each class can see and run; students sign in with their school account.',
  },
  '/library': {
    title: 'Animal Health and Plant Library - Tender Cells',
    description: 'Species care guides for poultry, rabbits, livestock, pond fish and reptiles, plus predators and pests, toxic plants, garden crops, weeds and DIY habitat projects.',
  },
  '/docs': {
    title: 'Tender Cells Documentation - Build Guides and References',
    description: 'Build guides, hardware references, product specs and school setup for Tender Cells - the same docs the project keeps in its open-source repository.',
  },
  '/lessons': {
    title: 'Hands-on Lessons - Tender Cells',
    description: 'Step-by-step, LEGO-style lessons for students, clubs and teachers: flash a board, wire a door, add sensors, build a gantry and design parts with AI.',
  },
  '/assistants': {
    title: 'Ask Claude or ChatGPT About Your Farm - Tender Cells',
    description: 'Connect your Tender Cells account to Claude or ChatGPT and get answers from your own coop: readings, health warnings, predator alerts and a farm card.',
  },
  '/connect': {
    title: 'Connect an AI Assistant - Tender Cells',
    description: 'Authorize Claude, ChatGPT or another AI assistant to read your Tender Cells farm data. The connector is read-only and never moves hardware.',
  },
  '/newsletter': {
    title: 'Tender Cells Newsletter',
    description: 'Occasional updates on Tender Cells lessons, open-source hardware, smart animal care and agricultural robotics.',
  },
  '/search': {
    title: 'Search - Tender Cells',
    description: 'Search Tender Cells pages, lessons, docs and the animal and plant library.',
  },
  '/shop/duck-dock': {
    title: 'Duck Dock - Automated Duck Habitat Concept',
    description: 'Duck Dock is an automated duck habitat concept with pond fill and drain, water quality monitoring and robust cleaning, built on the open-source TenderCells OS.',
    image: 'https://tendercells.com/assets/images/products/duck-dock-concept.png',
  },
  '/shop/bunny-burrow': {
    title: 'Bunny Burrow - Rabbit Habitat Automation Concept',
    description: 'Bunny Burrow is a TenderCells rabbit habitat concept: feeding, temperature and enrichment automation for rabbits and small mammals.',
  },
  '/shop/goat-guardian': {
    title: 'Goat Guardian - Large Enclosure Automation Concept',
    description: 'Goat Guardian is a TenderCells concept for large enclosure automation for goats, sheep, pigs and alpacas: feed, water, gates and health monitoring.',
  },
  '/shop/turkey-tower': {
    title: 'Turkey Tower - Turkey Enclosure Concept',
    description: 'Turkey Tower is a TenderCells enclosure concept built for larger birds, with feeding, watering and monitoring for turkeys.',
  },
  '/shop/pigeon-palace': {
    title: 'Pigeon Palace - Smart Pigeon Loft Concept',
    description: 'Pigeon Palace is a TenderCells smart pigeon loft concept with individual bird tracking, feeding and loft monitoring.',
  },
  '/shop/accessories': {
    title: 'Accessories and Parts - TenderCells',
    description: 'Planned TenderCells end effectors, sensors, upgrade kits and spare parts for smart animal-care hardware.',
  },
  '/shop/gift-cards': {
    title: 'Gift Cards - TenderCells',
    description: 'TenderCells gift cards are planned for after hardware availability is clearer.',
  },
};

const clip = (s: string, n = 160) => (s.length <= n ? s : `${s.slice(0, n - 1).replace(/\s+\S*$/, "")}…`);
const stripEmoji = (s: string) => s.replace(/^[^\p{L}\p{N}]+/u, "").trim();
const docDesc = (slug: string) => DOC_GROUPS.flatMap((g) => g.docs).find((d) => d.doc === slug)?.desc;
const SITE_DOC_LIST = SITE_DOCS as { slug: string; title: string }[];

/** "/foo/" -> "/foo", "" -> "/". Query strings and hashes are never part of a canonical. */
export function normalizePath(pathname: string): string {
  const p = pathname.split(/[?#]/)[0] || "/";
  return p.length > 1 ? p.replace(/\/+$/, "") || "/" : "/";
}

/** Metadata for a public page, or undefined when the path is not a known page. */
export function metaFor(pathname: string): RouteMeta | undefined {
  const path = normalizePath(pathname);
  if (ROUTE_META[path]) return ROUTE_META[path];
  let m: RegExpMatchArray | null;
  if ((m = path.match(/^\/library\/animals\/([^/]+)$/))) {
    const a = animalById(m[1]);
    if (!a) return undefined;
    return {
      title: `${a.name} Care and Health Guide - Tender Cells Library`,
      description: clip(`${a.name} (${GROUP_LABEL[a.group]}) care guide: daily checks, warning signs, common conditions and when to call a vet. Comfortable ${a.comfortF[0]}-${a.comfortF[1]}°F, lives ${a.lifespanYears[0]}-${a.lifespanYears[1]} years.`),
    };
  }
  if ((m = path.match(/^\/library\/wildlife\/([^/]+)$/))) {
    const w = wildlifeById(m[1]);
    if (!w) return undefined;
    const kind = w.kind === "pest" ? "Pest" : w.kind === "venomous" ? "Venomous Animal" : "Predator";
    return {
      title: `${w.name} - ${kind} Signs and Prevention - Tender Cells Library`,
      description: clip(`How to tell a ${w.name.toLowerCase()} is around your animals and how to keep it out. Signs: ${w.signs}.`),
    };
  }
  if ((m = path.match(/^\/library\/plants\/([^/]+)$/))) {
    const p = plantById(m[1]);
    if (!p) return undefined;
    const kind = p.kind === "crop" ? "Garden Crop" : p.kind === "weed" ? "Weed Identification and Control" : "Toxic to Animals";
    return {
      title: `${p.name} - ${kind} - Tender Cells Library`,
      description: clip(`${p.name}: ${p.summary}${p.identify ? ` Identify: ${p.identify}.` : ""}${p.water ? ` Water: ${p.water}.` : ""}`),
    };
  }
  if ((m = path.match(/^\/docs\/([^/]+)$/))) {
    const d = SITE_DOC_LIST.find((x) => x.slug === m![1]);
    if (!d) return undefined;
    // /docs/index is the repo's docs README; Firebase cleanUrls serves it dist/docs/index.html
    // (the /docs page), so it points at /docs instead of competing with it.
    if (d.slug === "index") return { ...ROUTE_META["/docs"], canonicalPath: "/docs" };
    return {
      title: `${d.title} - Tender Cells Docs`,
      description: clip(docDesc(d.slug) ?? `${d.title}: Tender Cells documentation, published from the project's open-source repository.`),
    };
  }
  if ((m = path.match(/^\/lessons\/([^/]+)$/))) {
    const l = LESSONS.find((x) => x.slug === m![1]);
    if (!l) return undefined;
    return { title: `${stripEmoji(l.title)} - Tender Cells Lesson`, description: clip(l.desc) };
  }
  return undefined;
}

/** The absolute canonical URL for a page: itself (or the page it duplicates), no slash, no query. */
export function canonicalFor(pathname: string): string {
  const path = normalizePath(metaFor(pathname)?.canonicalPath ?? pathname);
  return `${SITE}${path === "/" ? "/" : path}`;
}

/** Pages kept out of search (not in the sitemap, served with noindex). */
export const NOINDEX_PATHS = ["/search", "/connect", "/newsletter", "/shop/accessories", "/shop/gift-cards"];

/** Every page whose HTML the build writes with its own head tags. */
export function prerenderPaths(): string[] {
  return [
    ...Object.keys(ROUTE_META),
    ...ANIMALS.map((a) => `/library/animals/${a.id}`),
    ...WILDLIFE.map((w) => `/library/wildlife/${w.id}`),
    ...PLANTS.map((p) => `/library/plants/${p.id}`),
    ...SITE_DOC_LIST.filter((d) => d.slug !== "index").map((d) => `/docs/${d.slug}`),
    ...LESSONS.map((l) => `/lessons/${l.slug}`),
  ];
}

/** Library pages listed in the generated block of public/sitemap.xml. */
export function libraryPaths(): string[] {
  return prerenderPaths().filter((p) => p.startsWith("/library/"));
}
