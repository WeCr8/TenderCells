// Static, client-side search index for the marketing site.
// No backend — entries are matched against the user's query by title, keywords,
// and description. Add new public pages here so site search can find them.

export interface SearchEntry {
  title: string;
  path: string;
  description: string;
  keywords: string[];
}

export const SEARCH_INDEX: SearchEntry[] = [
  // Products
  { title: "Chicken Tender™", path: "/shop/chicken-tender", description: "Automated chicken coop concept — robot arm, cleaning, egg collection, feeding.", keywords: ["coop", "chicken", "robot arm", "eggs", "feeding", "cleaning", "automation"] },
  { title: "Roaming Roost™", path: "/shop/roaming-roost", description: "Mobile pasture coop concept with rotation and smart boundaries.", keywords: ["mobile", "pasture", "rotation", "roost", "octagon", "wheels"] },
  { title: "WatchTower AI™", path: "/shop/watchtower", description: "Solar predator monitor with cameras and LoRa mesh alerts.", keywords: ["predator", "camera", "lora", "solar", "security", "monitor", "watchtower"] },
  { title: "Barn Brain", path: "/shop/barn-brain", description: "Central controller hub for Tender Cells devices.", keywords: ["controller", "hub", "barn", "brain", "mqtt"] },
  { title: "Duck Dock™", path: "/shop/duck-dock", description: "Duck platform concept with pond management.", keywords: ["duck", "pond", "water", "dock"] },
  { title: "Bunny Burrow™", path: "/shop/bunny-burrow", description: "Rabbit automation concept — feeding, temperature, housing.", keywords: ["rabbit", "bunny", "burrow", "feeding"] },
  { title: "Goat Guardian™", path: "/shop/goat-guardian", description: "Large enclosure automation concept for goats.", keywords: ["goat", "guardian", "enclosure", "livestock"] },
  { title: "Turkey Tower™", path: "/shop/turkey-tower", description: "Turkey-specific enclosure concept.", keywords: ["turkey", "tower"] },
  { title: "Pigeon Palace™", path: "/shop/pigeon-palace", description: "Smart pigeon housing concept.", keywords: ["pigeon", "palace", "loft"] },
  { title: "Accessories & Parts", path: "/shop/accessories", description: "Parts and accessories for Tender Cells builds.", keywords: ["parts", "accessories", "sensors", "components"] },
  { title: "Shop All Products", path: "/shop", description: "Browse all Tender Cells product concepts.", keywords: ["shop", "store", "products", "buy", "kits"] },

  // Education
  { title: "Tender Cells in Education", path: "/education", description: "STEM programs, school partnerships, curriculum, and grants.", keywords: ["education", "stem", "school", "curriculum", "teachers", "classroom", "grants"] },
  { title: "TenderCells Academy", path: "/academy", description: "Agricultural robotics curriculum for builders and founders.", keywords: ["academy", "curriculum", "course", "learn", "robotics"] },
  { title: "4-H STEM Projects", path: "/4h", description: "Engineering and animal science project ideas for 4-H.", keywords: ["4-h", "4h", "stem", "project", "fair"] },
  { title: "FFA AgTech Projects", path: "/ffa", description: "SAE-ready poultry and farm automation projects for FFA.", keywords: ["ffa", "agtech", "sae", "agriculture"] },
  { title: "Homeschool STEM", path: "/homeschool", description: "Family-scale robotics, coding, and homesteading lessons.", keywords: ["homeschool", "family", "lessons", "coding"] },
  { title: "Science Fair Projects", path: "/science-fair", description: "Testable questions around coops, sensors, and animal care.", keywords: ["science fair", "experiment", "project"] },
  { title: "Audiences", path: "/audiences", description: "Find the right path for students, makers, teachers, and founders.", keywords: ["audiences", "paths", "makers", "students"] },
  { title: "Partners & Sponsors", path: "/partners", description: "Education partners and sponsors.", keywords: ["partners", "sponsors", "donate"] },

  // Apps & developers
  { title: "Applications", path: "/apps", description: "Mobile app, web dashboard, developer API, MQTT integration.", keywords: ["app", "ios", "android", "dashboard", "api", "mqtt"] },
  { title: "Public Demo", path: "/demo", description: "No-signup browser demo of the Tender Cells app.", keywords: ["demo", "try", "app demo", "test"] },
  { title: "Developers", path: "/developers", description: "API, firmware, hardware, simulation, and contribution routes.", keywords: ["developers", "api", "firmware", "code", "docs"] },
  { title: "Open Source", path: "/open-source", description: "Firmware, app source, schematics, STL files, and how to contribute.", keywords: ["open source", "github", "firmware", "stl", "contribute", "license", "flash"] },

  // Learn / guides
  { title: "Learn More", path: "/learn", description: "Getting started, how it works, documentation, and support.", keywords: ["learn", "getting started", "docs", "support", "help"] },
  { title: "All Guides", path: "/guides", description: "Learning guides for smart coops, predators, and pasture.", keywords: ["guides", "tutorials", "how to"] },
  { title: "Smart Coop Guide", path: "/guides/smart-chicken-coop", description: "How to build and automate a smart chicken coop.", keywords: ["smart coop", "chicken coop", "automation guide"] },
  { title: "Predator Monitoring Guide", path: "/guides/predator-monitoring", description: "Detect and deter coop predators.", keywords: ["predator", "monitoring", "security", "hawk", "fox"] },
  { title: "Pasture Rotation Guide", path: "/guides/pasture-rotation", description: "Rotate pasture for healthier flocks and land.", keywords: ["pasture", "rotation", "grazing"] },
  { title: "Farm Automation", path: "/farm-automation", description: "Automate farm and homestead animal care.", keywords: ["farm", "automation", "homestead"] },
  { title: "Homesteading Guide", path: "/learn/homesteading", description: "Homesteading with smart animal care.", keywords: ["homesteading", "self sufficient", "homestead"] },
  { title: "Automation Ideas", path: "/learn/automation", description: "Ideas for automating animal care tasks.", keywords: ["automation", "ideas", "diy"] },
  { title: "FAQ", path: "/learn/faq", description: "Frequently asked questions.", keywords: ["faq", "questions", "answers", "help"] },

  // Health
  { title: "Animal Health", path: "/health", description: "Chicken health, predator prevention, nutrition, and disease monitoring.", keywords: ["health", "disease", "nutrition", "feed", "vet"] },

  // Services
  { title: "Local Services", path: "/services", description: "Find installers, feed suppliers, technicians, and events.", keywords: ["services", "installer", "technician", "feed", "events", "local"] },

  // Company
  { title: "Our Story", path: "/story", description: "The mission behind Tender Cells.", keywords: ["story", "about", "mission", "company", "wecr8"] },
  { title: "Blog", path: "/blog", description: "News and updates from Tender Cells.", keywords: ["blog", "news", "updates", "articles"] },
  { title: "Privacy Policy", path: "/privacy", description: "How we handle data and privacy.", keywords: ["privacy", "data", "coppa", "kids"] },
  { title: "Cookie Policy", path: "/cookie-policy", description: "How cookies and consent work on this site.", keywords: ["cookies", "consent", "tracking"] },
  { title: "Contact", path: "/contact", description: "Get in touch with Tender Cells.", keywords: ["contact", "email", "support", "reach"] },
];

/**
 * Rank index entries against a free-text query. Case-insensitive substring
 * match across title, keywords, and description, with title hits ranked highest.
 *
 * @param query - raw user search text
 * @returns matching entries, best first (empty array for empty query)
 */
export function searchSite(query: string): SearchEntry[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const terms = q.split(/\s+/);

  const scored = SEARCH_INDEX.map((entry) => {
    const title = entry.title.toLowerCase();
    const desc = entry.description.toLowerCase();
    const kw = entry.keywords.join(" ").toLowerCase();
    let score = 0;
    for (const t of terms) {
      if (title.includes(t)) score += 5;
      if (kw.includes(t)) score += 3;
      if (desc.includes(t)) score += 1;
    }
    return { entry, score };
  })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored.map((s) => s.entry);
}
