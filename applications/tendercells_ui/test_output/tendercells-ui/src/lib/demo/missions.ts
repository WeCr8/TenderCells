// missions.ts - short guided missions through the demo for students, families and first-time
// visitors. Each mission is a few steps; steps tick themselves off from what the visitor does
// (an event triggered, its "Why?" opened, a page visited) and every mission ends with how to
// build it for real.
import type { EventLogEntry } from "./eventSimulator";

export type MissionStep =
  | { kind: "trigger"; scenario: string; text: string }
  | { kind: "explain"; scenario: string; text: string }
  | { kind: "visit"; path: string; text: string };

export interface Mission {
  id: string;
  title: string;
  emoji: string;
  goal: string;
  steps: MissionStep[];
  concepts: string[];
  build: { label: string; href: string };
}

export const MISSIONS: Mission[] = [
  {
    id: "protect-the-flock",
    title: "Protect the flock",
    emoji: "🛡️",
    goal: "Respond to a predator near the coop.",
    steps: [
      { kind: "trigger", scenario: "predator", text: "Trigger \"Predator detected\"" },
      { kind: "explain", scenario: "predator", text: "Open \"Why did this happen?\" and follow the chain" },
      { kind: "visit", path: "/predator-monitor", text: "Find the WatchTower on the predator monitor" },
    ],
    concepts: ["computer vision", "sensors", "event handling", "automation", "actuators"],
    build: { label: "Build a camera node", href: "/guides/camera-node-first-build" },
  },
  {
    id: "close-before-sunset",
    title: "Close the coop before sunset",
    emoji: "🌇",
    goal: "Make the door close at dusk - but only when everyone is home.",
    steps: [
      { kind: "trigger", scenario: "sunset", text: "Trigger \"Sunset - close the coop\"" },
      { kind: "trigger", scenario: "missing-hen", text: "Now try \"Hen missing at dusk\" - what changes?" },
      { kind: "visit", path: "/schedules", text: "Look at the door schedules" },
    ],
    concepts: ["schedules", "environmental conditions", "conditional logic", "motors", "limit switches"],
    build: { label: "Sensors → Automation lesson", href: "/lessons/sensors-automation" },
  },
  {
    id: "find-todays-eggs",
    title: "Find today's eggs",
    emoji: "🥚",
    goal: "Spot a new egg and find it on the egg map.",
    steps: [
      { kind: "trigger", scenario: "egg-laid", text: "Trigger \"Egg laid\"" },
      { kind: "visit", path: "/egg-map", text: "Find the new egg on the egg map" },
    ],
    concepts: ["computer vision", "data records", "production tracking"],
    build: { label: "Your First Coop Brain", href: "/lessons/your-first-coop-brain" },
  },
  {
    id: "fix-low-water",
    title: "Fix the low-water alert",
    emoji: "💧",
    goal: "See how a sensor, a rule and a valve keep water topped up.",
    steps: [
      { kind: "trigger", scenario: "water-low", text: "Trigger \"Water level low\"" },
      { kind: "explain", scenario: "water-low", text: "Open \"Why did this happen?\" - which number starts it?" },
      { kind: "visit", path: "/chicken-tender", text: "Check the water level on Chicken Tender" },
    ],
    concepts: ["sensors", "analog signals", "thresholds", "alerts", "relays"],
    build: { label: "Feeder + Waterer lesson", href: "/lessons/feeder-waterer" },
  },
  {
    id: "find-missing-chicken",
    title: "Find the missing chicken",
    emoji: "🐔",
    goal: "Use the headcount to find a hen that did not come home.",
    steps: [
      { kind: "trigger", scenario: "missing-hen", text: "Trigger \"Hen missing at dusk\"" },
      { kind: "explain", scenario: "missing-hen", text: "Open \"Why did this happen?\"" },
      { kind: "visit", path: "/animals", text: "Look her up in the animal roster" },
    ],
    concepts: ["RFID", "counting", "rules with exceptions"],
    build: { label: "Build the door (with headcount)", href: "/lessons/door-roaming-roost" },
  },
];

export const VISITED_KEY = "tendercells_demo_visited_v1";

export function readVisited(): string[] {
  try { return JSON.parse(localStorage.getItem(VISITED_KEY) || "[]") as string[]; } catch { return []; }
}

export function markVisited(path: string): void {
  try {
    const v = new Set(readVisited());
    v.add(path);
    localStorage.setItem(VISITED_KEY, JSON.stringify([...v]));
  } catch { /* storage unavailable */ }
}

/** Is this step done, given the event log and the pages visited? */
export function stepDone(step: MissionStep, log: EventLogEntry[], visited: string[]): boolean {
  if (step.kind === "trigger") return log.some((e) => e.scenarioId === step.scenario);
  if (step.kind === "explain") return log.some((e) => e.scenarioId === step.scenario && e.explained);
  return visited.includes(step.path);
}

export function missionProgress(m: Mission, log: EventLogEntry[], visited: string[]): { done: number; total: number } {
  return { done: m.steps.filter((s) => stepDone(s, log, visited)).length, total: m.steps.length };
}
