// docs.ts - the current documentation and build guides, grouped, for the Docs, Learn and
// Education pages. Every entry is a page on this site: `doc` is a published doc
// (siteDocs.json -> /docs/<slug>, rendered from the repo by scripts/sync-docs.mjs) and `to`
// any other site page. scripts/check-links.mjs fails CI when either no longer exists.
import SITE_DOCS from "./siteDocs.json";

export interface SiteDoc { slug: string; source: string; title: string }
export const siteDocBySlug = (slug: string): SiteDoc | undefined => (SITE_DOCS as SiteDoc[]).find((d) => d.slug === slug);

export interface DocLink {
  title: string;
  desc: string;
  /** A published doc: /docs/<slug>. */
  doc?: string;
  /** Any other page on this site (or, rarely, off it). */
  to?: string;
}

export const docHref = (d: DocLink): string => d.to ?? `/docs/${d.doc}`;

export const DOC_GROUPS: { id: string; title: string; docs: DocLink[] }[] = [
  {
    id: "build-guides",
    title: "Build guides",
    docs: [
      { title: "Camera Node: first build", desc: "Seeed XIAO ESP32-S3 camera node: parts, wiring, flashing, registering it in the OS.", to: "/guides/camera-node-first-build" },
      { title: "Flash a device", desc: "Flash starter, camera and Chicken Tender firmware from the browser (USB, Chrome / Edge).", to: "/flash" },
      { title: "Connect a device", desc: "Run a real device path with no hardware, a simulated device, or a board on your desk.", doc: "connect-a-device" },
      { title: "Motors, axis & drives testing", desc: "Bench-test NEMA 23 steppers, DM542T drivers and gantry axes safely.", doc: "hardware-testing-motors" },
      { title: "Device testing setup", desc: "Register and test Chicken Tender hardware while software and CAD develop in parallel.", doc: "device-testing-setup" },
      { title: "Hardware catalog", desc: "Every part: structure, fasteners, doors, motion, sensors, solar, networking, vendors.", doc: "hardware-catalog" },
      { title: "Weed patrol (bed + rover)", desc: "Weed-finding robots: camera scout or laser, animal and leak checks, laser safety.", doc: "weed-patrol" },
      { title: "Robot arm service", desc: "Simulated, Universal Robots and LeRobot arms over MQTT; Hugging Face policies.", doc: "arm-service" },
      { title: "DIY habitat projects", desc: "Terrarium climate, enclosure camera, sound monitor, pond and activity-wheel builds.", doc: "diy-habitat-projects" },
      { title: "NVIDIA Isaac Sim", desc: "Export your property to USD, drive the arm in simulation, make synthetic weed data.", doc: "isaac-sim" },
    ],
  },
  {
    id: "reference",
    title: "Reference",
    docs: [
      { title: "Usage guide", desc: "What the OS does today, page by page, for homesteads, schools and makers.", doc: "usage" },
      { title: "Backend API (XML)", desc: "Every REST endpoint and MQTT topic in one machine-readable file.", to: "/api/tendercells-backend.xml" },
      { title: "Machine-readable backend", desc: "How the XML is made and how tools and LLMs can use it.", doc: "machine-readable-backend" },
      { title: "Robot exclusion zones", desc: "No-go, keep-out and no-laser zones: how robots are kept out of restricted areas.", doc: "robot-exclusion-zones" },
      { title: "Property map layers", desc: "Terrain, elevation, drainage, detections and camera layers on the 2D / 3D map.", doc: "property-map-layers" },
      { title: "Control types & arm plan", desc: "Every control type the OS supports, printing tactics and the robot-arm plan.", doc: "control-types-and-arm-plan" },
      { title: "Chicken Tender master spec", desc: "Product requirements: sizes, zones, robot safety, cloud, manufacturing.", doc: "chicken-tender-master-spec" },
      { title: "Starter Node firmware", desc: "The general-purpose ESP32 firmware: peripherals, pins, MQTT topics, building it yourself.", doc: "starter-node-firmware" },
      { title: "CAD to web", desc: "Export SolidWorks / Fusion parts so they load in the 3D viewer and the OS.", doc: "cad-to-web" },
      { title: "Documentation index", desc: "Where everything is: products, hardware, software, schools.", doc: "index" },
    ],
  },
  {
    id: "schools-docs",
    title: "Schools & teachers",
    docs: [
      { title: "Classroom Quickstart", desc: "Run a simulated smart coop on a laptop in 5 minutes - no hardware, no accounts.", to: "/lessons/classroom-quickstart" },
      { title: "Learning tracks", desc: "The full curriculum: five tiers, every project and its build status.", to: "/lessons/learning-tracks" },
      { title: "Schools: sign-in and IT setup", desc: "School-code sign-in, Google / Microsoft admin steps and the pilot form.", to: "/schools" },
      { title: "School network & device enrollment", desc: "Enroll classroom devices without sharing production Wi-Fi credentials.", doc: "school-network-enrollment" },
      { title: "School single sign-on", desc: "Google Workspace and Microsoft sign-in for districts, step by step.", doc: "school-sso-plan" },
      { title: "School platform operations", desc: "Organizations, classes, rosters and subscriptions for districts.", doc: "school-platform-operations" },
      { title: "Lesson template", desc: "Write a new lesson in the same LEGO-style format.", doc: "lesson-template" },
    ],
  },
];
