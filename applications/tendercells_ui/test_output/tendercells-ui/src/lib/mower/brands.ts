// brands.ts - robot mower brands the Link dialog offers, how each connects, and how much we
// trust that connection. Trust levels are shown on every card (never upgrade one):
//   OFFICIAL      the vendor's documented API, used with the owner's own developer credentials
//   PARTNER       vendor-maintained integration we use through Home Assistant
//   COMMUNITY     a community (often reverse-engineered) Home Assistant integration
//   OPEN          open-source hardware / firmware speaking the Tender Cells contract
// Checked September 2026. docs/ROBOT_MOWERS.md has the sources.
import type { MowerAdapter } from "./mower";

export type Trust = "OFFICIAL" | "PARTNER" | "COMMUNITY" | "OPEN";

export interface MowerBrand {
  id: string;
  name: string;
  /** The vendor app owners already use. */
  app: string;
  adapter: MowerAdapter;
  trust: Trust;
  /** Short note: what works and what stays in the vendor app. */
  note: string;
}

export const MOWER_BRANDS: MowerBrand[] = [
  { id: "husqvarna", name: "Husqvarna Automower", app: "Automower Connect", adapter: "husqvarna", trust: "OFFICIAL",
    note: "Start (for a time or in a work area), pause, park, resume schedule, cutting height, headlight, weekly schedule, stay-out zones, errors, GPS. Patterns are set per work area in Automower Connect." },
  { id: "gardena", name: "GARDENA SILENO", app: "GARDENA smart system", adapter: "gardena", trust: "OFFICIAL",
    note: "Mow for a time, resume schedule, park until next task or until further notice, battery and status. No pause through the API." },
  { id: "mammotion", name: "Mammotion LUBA / YUKA", app: "Mammotion", adapter: "mammotion", trust: "OFFICIAL",
    note: "Official Open API for models released in 2025 and later: start a plan saved in the Mammotion app (pattern included), pause, resume, return to dock." },
  { id: "navimow", name: "Segway Navimow", app: "Navimow", adapter: "home-assistant", trust: "PARTNER",
    note: "Through Segway's own Home Assistant integration: start, pause, dock, battery." },
  { id: "ecovacs", name: "Ecovacs GOAT", app: "Ecovacs Home", adapter: "home-assistant", trust: "PARTNER",
    note: "Through the Ecovacs integration built into Home Assistant: start, pause, dock." },
  { id: "worx", name: "Worx Landroid / Kress / LandXcape", app: "Landroid / Kress Mission", adapter: "home-assistant", trust: "COMMUNITY",
    note: "Through the community Landroid Cloud integration (not supported by Worx): start, pause, dock." },
  { id: "dreame", name: "Dreame / MOVA", app: "Dreamehome / MOVAhome", adapter: "home-assistant", trust: "COMMUNITY",
    note: "Through a community Home Assistant integration: start, pause, dock." },
  { id: "bosch", name: "Bosch Indego", app: "Bosch Smart Gardening", adapter: "home-assistant", trust: "COMMUNITY",
    note: "Through a community Home Assistant integration: start, pause, dock." },
  { id: "stihl", name: "STIHL iMOW", app: "iMOW", adapter: "home-assistant", trust: "COMMUNITY",
    note: "Through a community Home Assistant integration: start, pause, dock." },
  { id: "other-ha", name: "Any other mower in Home Assistant", app: "-", adapter: "home-assistant", trust: "COMMUNITY",
    note: "Anything Home Assistant shows as a lawn_mower entity: start, pause, dock." },
  { id: "diy", name: "OpenMower / DIY mower", app: "-", adapter: "mqtt", trust: "OPEN",
    note: "Speaks the Tender Cells MQTT contract: every pattern (stripes, checkerboard, diamonds, spiral, edges), angle, edge passes, overlap, cutting height and area." },
];

export const TRUST_HINT: Record<Trust, string> = {
  OFFICIAL: "The vendor's documented API with your own developer keys.",
  PARTNER: "Maintained by the vendor, used through Home Assistant.",
  COMMUNITY: "Community-built integration - not supported by the vendor; may break when the vendor changes their cloud.",
  OPEN: "Open-source hardware / firmware on your own network.",
};

export const brandById = (id: string): MowerBrand | undefined => MOWER_BRANDS.find((b) => b.id === id);
