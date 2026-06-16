// Lesson manifest — drives the in-site lesson index + pages.
// Markdown source lives in /public/lessons/<slug>.md (copied from repo docs/).
// Images can be added later under /public/lessons/img and referenced from the md.

export interface LessonMeta {
  slug: string;
  title: string;
  desc: string;
  tag: "Ages 7+" | "Beginner" | "Advanced" | "Map";
}

export const LESSONS: LessonMeta[] = [
  { slug: "your-first-coop-brain", title: "🐣 Your First Coop Brain", desc: "Start here. Flash a board and watch it wake up — LEGO-style steps.", tag: "Ages 7+" },
  { slug: "door-roaming-roost", title: "🚪 Door + Basic Roaming Roost", desc: "Wire a servo; open/close a door and drive a rover from the OS.", tag: "Beginner" },
  { slug: "sensors-automation", title: "🌡️ Sensors → Automation", desc: "Add a light sensor; auto-open the door at sunrise.", tag: "Beginner" },
  { slug: "feeder-waterer", title: "🍽️ Feeder + Waterer", desc: "Relay-driven feeding and watering, on a schedule.", tag: "Beginner" },
  { slug: "build-your-own", title: "🦅 Build Your Own Device", desc: "Invent an animal + threat; fire a live alert, no extra wiring.", tag: "Beginner" },
  { slug: "gantry-bom", title: "🤖 Gantry + BOMs", desc: "Build an XY robot gantry (coop & duck dock) with parts lists.", tag: "Advanced" },
  { slug: "ai-cad-fusion", title: "🧠 AI + CAD with Fusion MCP", desc: "Design parts with AI; model in Fusion 360 over MCP.", tag: "Advanced" },
  { slug: "learning-tracks", title: "🗺️ Learning Tracks (map)", desc: "The full curriculum: 5 tiers, every project, build status.", tag: "Map" },
];

export const lessonBySlug = (slug: string) => LESSONS.find((l) => l.slug === slug);
