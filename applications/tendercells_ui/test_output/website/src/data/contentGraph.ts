// contentGraph.ts - how guides, lessons, docs, the OS and tools link to each other.
//
// Every topic lists its content in reading order by kind:
//   guide   why and what (plain language)          /guides/...
//   lesson  build it, step by step                  /lessons/...
//   doc     exact reference (pins, topics, specs)   /docs/...
//   os      try it in Tender Cells OS (demo data)   /app/demo?next=/page
//   tool    flasher, 3D viewer, backend XML
// Pages show a "Keep going" block for their topics (RelatedContent), so a reader can always
// move from understanding -> building -> reference -> using it. scripts/check-links.mjs
// validates every link here, including the OS page behind ?next=.

export type ContentKind = "guide" | "lesson" | "doc" | "os" | "tool";

export interface ContentLink { kind: ContentKind; title: string; to: string }

export type TopicId =
  | "coop" | "predator" | "rover" | "sensors" | "garden" | "devices" | "design" | "habitat" | "schools" | "science-fair" | "twin";

export interface Topic { title: string; blurb: string; links: ContentLink[] }

/** A demo deep link: seeds the public demo, then opens that OS page. */
export const demo = (page: string): string => `/app/demo?next=${page}`;

export const TOPICS: Record<TopicId, Topic> = {
  twin: {
    title: "Farm digital twin",
    blurb: "Build the farm digitally, connect it physically: identity, state, events and provenance.",
    links: [
      { kind: "guide", title: "What a farm digital twin is", to: "/digital-twin" },
      { kind: "lesson", title: "Sensors → Automation", to: "/lessons/sensors-automation" },
      { kind: "doc", title: "Digital twin architecture", to: "/docs/digital-twin" },
      { kind: "doc", title: "Connect a device", to: "/docs/connect-a-device" },
      { kind: "os", title: "Property Twin", to: demo("/layout") },
      { kind: "os", title: "Trigger an event", to: demo("/simulator") },
      { kind: "tool", title: "Backend + MQTT contract (XML)", to: "/api/tendercells-backend.xml" },
    ],
  },
  coop: {
    title: "Smart coop",
    blurb: "Doors, feed, water, climate and eggs for a backyard flock.",
    links: [
      { kind: "guide", title: "Smart Chicken Coop Guide", to: "/guides/smart-chicken-coop" },
      { kind: "lesson", title: "Door + Basic Roaming Roost", to: "/lessons/door-roaming-roost" },
      { kind: "lesson", title: "Feeder + Waterer", to: "/lessons/feeder-waterer" },
      { kind: "lesson", title: "Sensors → Automation", to: "/lessons/sensors-automation" },
      { kind: "doc", title: "Chicken Tender product doc", to: "/docs/chicken-tender" },
      { kind: "doc", title: "Hardware catalog", to: "/docs/hardware-catalog" },
      { kind: "os", title: "Chicken Tender controls", to: demo("/chicken-tender") },
      { kind: "os", title: "Egg map", to: demo("/egg-map") },
    ],
  },
  predator: {
    title: "Predators & cameras",
    blurb: "Cameras, alerts and safe responses around the coop and property.",
    links: [
      { kind: "guide", title: "Predator Monitoring Guide", to: "/guides/predator-monitoring" },
      { kind: "guide", title: "Camera Node: first build", to: "/guides/camera-node-first-build" },
      { kind: "lesson", title: "Build Your Own Device (threat alerts)", to: "/lessons/build-your-own" },
      { kind: "doc", title: "Device UI & secure video", to: "/docs/device-ui-and-secure-video" },
      { kind: "doc", title: "Camera relay: deployment modes", to: "/docs/camera-relay" },
      { kind: "os", title: "Predator monitor", to: demo("/predator-monitor") },
      { kind: "tool", title: "Flash a camera node", to: "/flash?target=camera-node" },
    ],
  },
  rover: {
    title: "Rovers & mobile coops",
    blurb: "Routes, exclusion zones, weed and leak patrols, moving coops safely.",
    links: [
      { kind: "guide", title: "Mobile Coop and Pasture Rotation", to: "/guides/pasture-rotation" },
      { kind: "lesson", title: "Door + Basic Roaming Roost (drive a rover)", to: "/lessons/door-roaming-roost" },
      { kind: "doc", title: "Weed patrol on a rover", to: "/docs/weed-patrol#weed-patrol-on-a-rover" },
      { kind: "doc", title: "Robot exclusion zones", to: "/docs/robot-exclusion-zones" },
      { kind: "doc", title: "Roaming Roost product doc", to: "/docs/roaming-roost" },
      { kind: "os", title: "Property layout (2D / 3D, routes, zones)", to: demo("/layout") },
      { kind: "os", title: "Weed patrol with a rover", to: demo("/weed-patrol") },
    ],
  },
  sensors: {
    title: "Sensors & automation",
    blurb: "Read a sensor, publish it, turn it into a rule or a schedule.",
    links: [
      { kind: "lesson", title: "Your First Coop Brain", to: "/lessons/your-first-coop-brain" },
      { kind: "lesson", title: "Sensors → Automation", to: "/lessons/sensors-automation" },
      { kind: "doc", title: "Starter Node firmware", to: "/docs/starter-node-firmware" },
      { kind: "doc", title: "Connect a device", to: "/docs/connect-a-device" },
      { kind: "os", title: "Analytics (sensor history)", to: demo("/analytics") },
      { kind: "os", title: "Schedules", to: demo("/schedules") },
      { kind: "tool", title: "Flash a starter node", to: "/flash?target=starter-node" },
    ],
  },
  garden: {
    title: "Garden & weeds",
    blurb: "Beds, weed finding with a camera, and robots that ask before acting.",
    links: [
      { kind: "lesson", title: "Gantry + BOMs", to: "/lessons/gantry-bom" },
      { kind: "doc", title: "Weed patrol (bed + rover)", to: "/docs/weed-patrol" },
      { kind: "doc", title: "NVIDIA Isaac Sim", to: "/docs/isaac-sim" },
      { kind: "os", title: "Weed patrol", to: demo("/weed-patrol") },
      { kind: "os", title: "Plant library", to: demo("/library") },
    ],
  },
  devices: {
    title: "Build a device for the OS",
    blurb: "From a bare board to a device that shows up and works in Tender Cells OS.",
    links: [
      { kind: "guide", title: "Build a device for Tender Cells OS", to: "/os#build" },
      { kind: "lesson", title: "Your First Coop Brain", to: "/lessons/your-first-coop-brain" },
      { kind: "lesson", title: "Build Your Own Device", to: "/lessons/build-your-own" },
      { kind: "doc", title: "Connect a device (MQTT topics)", to: "/docs/connect-a-device#topics" },
      { kind: "doc", title: "Starter Node firmware", to: "/docs/starter-node-firmware" },
      { kind: "doc", title: "Machine-readable backend", to: "/docs/machine-readable-backend" },
      { kind: "os", title: "Products & devices", to: demo("/products") },
      { kind: "tool", title: "Flash a device", to: "/flash" },
      { kind: "tool", title: "Backend API (XML)", to: "/api/tendercells-backend.xml" },
    ],
  },
  design: {
    title: "Design & CAD",
    blurb: "Model parts, bring them into the 3D view, document a product.",
    links: [
      { kind: "lesson", title: "AI + CAD with Fusion MCP", to: "/lessons/ai-cad-fusion" },
      { kind: "doc", title: "CAD to web (SolidWorks export)", to: "/docs/cad-to-web" },
      { kind: "doc", title: "Product documentation standard", to: "/docs/product-documentation-standard" },
      { kind: "doc", title: "Product ideas", to: "/docs/product-ideas" },
      { kind: "os", title: "Property layout (see your model in 3D)", to: demo("/layout") },
      { kind: "tool", title: "3D model viewer", to: "/viewer" },
    ],
  },
  habitat: {
    title: "Indoor habitats",
    blurb: "Terrariums, enclosure cameras, sound monitors and ponds.",
    links: [
      { kind: "doc", title: "DIY habitat projects", to: "/docs/diy-habitat-projects" },
      { kind: "guide", title: "Camera Node: first build", to: "/guides/camera-node-first-build" },
      { kind: "os", title: "DIY projects", to: demo("/projects") },
      { kind: "os", title: "Animal library", to: demo("/library") },
    ],
  },
  schools: {
    title: "Schools & clubs",
    blurb: "Run it in a classroom: quickstart, tracks, sign-in and devices.",
    links: [
      { kind: "lesson", title: "Classroom Quickstart", to: "/lessons/classroom-quickstart" },
      { kind: "lesson", title: "Learning Tracks", to: "/lessons/learning-tracks" },
      { kind: "guide", title: "Schools: sign-in & IT setup", to: "/schools" },
      { kind: "guide", title: "Science fair projects", to: "/science-fair" },
      { kind: "doc", title: "School network & device enrollment", to: "/docs/school-network-enrollment" },
    ],
  },
  "science-fair": {
    title: "Science fair",
    blurb: "Testable questions, real data and a working prototype.",
    links: [
      { kind: "guide", title: "Science fair projects", to: "/science-fair" },
      { kind: "lesson", title: "Classroom Quickstart: competition challenges", to: "/lessons/classroom-quickstart#competition--science-fair-challenges" },
      { kind: "lesson", title: "Sensors → Automation", to: "/lessons/sensors-automation" },
      { kind: "os", title: "Analytics (export your data)", to: demo("/analytics") },
    ],
  },
};

/** Topics for a page, by path. */
export const TOPICS_BY_PATH: Record<string, TopicId[]> = {
  "/guides/smart-chicken-coop": ["coop", "sensors"],
  "/guides/predator-monitoring": ["predator", "devices"],
  "/guides/pasture-rotation": ["rover", "garden"],
  "/guides/camera-node-first-build": ["predator", "devices"],
  "/lessons/your-first-coop-brain": ["devices", "sensors"],
  "/lessons/classroom-quickstart": ["schools", "science-fair"],
  "/lessons/door-roaming-roost": ["coop", "rover"],
  "/lessons/sensors-automation": ["sensors", "science-fair"],
  "/lessons/feeder-waterer": ["coop", "sensors"],
  "/lessons/build-your-own": ["devices", "predator"],
  "/lessons/gantry-bom": ["garden", "design"],
  "/lessons/ai-cad-fusion": ["design", "devices"],
  "/lessons/learning-tracks": ["schools", "devices"],
  "/docs/weed-patrol": ["garden", "rover"],
  "/docs/robot-exclusion-zones": ["rover", "garden"],
  "/docs/connect-a-device": ["devices", "sensors"],
  "/docs/starter-node-firmware": ["devices", "sensors"],
  "/docs/machine-readable-backend": ["devices"],
  "/docs/cad-to-web": ["design"],
  "/docs/diy-habitat-projects": ["habitat", "devices"],
  "/docs/chicken-tender": ["coop", "design"],
  "/docs/roaming-roost": ["rover"],
  "/docs/hardware-catalog": ["coop", "design"],
  "/docs/isaac-sim": ["garden", "design"],
  "/docs/school-network-enrollment": ["schools"],
  "/docs/device-ui-and-secure-video": ["predator", "devices"],
};

export const KIND_LABEL: Record<ContentKind, string> = {
  guide: "Guide", lesson: "Lesson", doc: "Reference", os: "In the OS", tool: "Tool",
};

export const KIND_ORDER: ContentKind[] = ["guide", "lesson", "doc", "os", "tool"];
