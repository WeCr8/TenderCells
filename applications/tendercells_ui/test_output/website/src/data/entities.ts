// entities.ts - the one canonical description of Tender Cells, Tender Cells OS and each product
// family, with an honest status. Used on /os, the product pages, llms.txt and the structured
// data so the site, the demo, the docs and GitHub describe each system the same way.
//
// Status words (never upgrade one for marketing): concept, CAD prototype, electronics
// prototype, software simulation, firmware source (not yet field-tested), working prototype,
// community testing, stable release. No product is sold yet: production hardware is not
// available for any family.
import { demo } from "./contentGraph";

export type Status =
  | "Concept" | "CAD prototype" | "Electronics prototype" | "Software simulation"
  | "Firmware source (not yet field-tested)" | "Firmware available" | "Working software" | "Source available";

export interface Entity {
  slug: string;
  name: string;
  /** One factual sentence, reused everywhere. */
  definition: string;
  status: Status[];
  /** Website page that explains it. */
  page: string;
  /** Try it in the demo. */
  demo?: string;
  /** Build / reference docs. */
  docs?: string;
}

export const TENDERCELLS =
  "Tender Cells is an open-source animal-care and agricultural automation ecosystem for connecting sensors, cameras, robotics, automation and educational projects.";

export const TENDERCELLS_OS =
  "Tender Cells OS is the software layer used to model, monitor and automate compatible Tender Cells devices and animal-care systems.";

export const PRODUCTION_NOTE = "Production hardware is not yet available - you can run the simulation now and build your own from the open docs.";

export const ENTITIES: Entity[] = [
  { slug: "tendercells-os", name: "Tender Cells OS", definition: TENDERCELLS_OS, status: ["Working software", "Software simulation", "Source available"], page: "/os", demo: "/app/demo", docs: "/docs/usage" },
  { slug: "chicken-tender", name: "Chicken Tender", definition: "Chicken Tender is a Tender Cells system for connected chicken-coop automation and monitoring: doors, feed, water, climate, eggs and a gantry-mounted arm.", status: ["Concept", "CAD prototype", "Software simulation", "Firmware source (not yet field-tested)"], page: "/shop/chicken-tender", demo: demo("/chicken-tender"), docs: "/docs/chicken-tender" },
  { slug: "chickeneye", name: "ChickenEye", definition: "ChickenEye is the Tender Cells computer-vision layer for animal, nest-box, egg and related visual workflows.", status: ["Software simulation"], page: "/os#inside", demo: demo("/chicken-eye"), docs: "/docs/device-ui-and-secure-video" },
  { slug: "watchtower", name: "WatchTower", definition: "WatchTower is a Tender Cells monitoring concept for cameras, property awareness and predator detection workflows.", status: ["Concept", "Software simulation", "Firmware source (not yet field-tested)"], page: "/shop/watchtower", demo: demo("/predator-monitor"), docs: "/guides/predator-monitoring" },
  { slug: "roaming-roost", name: "Roaming Roost", definition: "Roaming Roost is a Tender Cells concept for a mobile protected chicken enclosure integrated with Tender Cells OS.", status: ["Concept", "Software simulation", "Firmware source (not yet field-tested)"], page: "/shop/roaming-roost", demo: demo("/layout"), docs: "/docs/roaming-roost" },
  { slug: "duck-dock", name: "Duck Dock", definition: "Duck Dock is a Tender Cells concept for duck housing with water and pond management.", status: ["Concept", "Software simulation"], page: "/shop/duck-dock", demo: demo("/layout") },
  { slug: "barn-brain", name: "Barn Brain", definition: "Barn Brain is a Tender Cells concept for a local edge hub that runs the MQTT broker, rules and AI on the property.", status: ["Concept"], page: "/shop/barn-brain", docs: "/docs/barn-brain" },
  { slug: "starter-node", name: "Starter Node", definition: "The Starter Node is general-purpose ESP32 firmware that becomes a door, relay, sensor or RC drive and connects to Tender Cells OS.", status: ["Firmware available", "Source available"], page: "/os#build", docs: "/docs/starter-node-firmware" },
  { slug: "camera-node", name: "Camera Node", definition: "The Camera Node is a Seeed XIAO ESP32-S3 Sense camera device that registers with Tender Cells OS for local video and snapshots.", status: ["Firmware available", "Source available"], page: "/guides/camera-node-first-build", docs: "/guides/camera-node-first-build" },
];

export const entityBySlug = (slug: string): Entity | undefined => ENTITIES.find((e) => e.slug === slug);
