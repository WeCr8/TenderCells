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
    id: "robot-traffic-jam",
    title: "Robot traffic jam",
    emoji: "🚦",
    goal: "The mower wants to start, but the Roaming Roost is on its lawn. Find out who wins - and why.",
    steps: [
      { kind: "trigger", scenario: "traffic-jam", text: "Trigger \"Robot traffic jam\"" },
      { kind: "explain", scenario: "traffic-jam", text: "Open \"Why did this happen?\" - try the kid, farmer and engineer answers" },
      { kind: "trigger", scenario: "roost-moves-on", text: "Move the Roaming Roost off the lawn (\"Roaming Roost moves on\")" },
      { kind: "visit", path: "/mowers", text: "Check the mower: is it allowed to start now?" },
    ],
    concepts: ["interlocks", "shared context between systems", "animal safety", "digital twins"],
    build: { label: "Bring your own robot mower", href: "/docs/robot-mowers" },
  },
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
    id: "beat-the-heat",
    title: "Beat the heat",
    emoji: "🌡️",
    goal: "The coop is getting hot. See what Tender Cells does and how it keeps the birds safe.",
    steps: [
      { kind: "trigger", scenario: "heat", text: "Trigger \"Coop too hot\"" },
      { kind: "explain", scenario: "heat", text: "Open \"Why did this happen?\" - which temperature starts the fan?" },
      { kind: "visit", path: "/chicken-tender", text: "See the coop temperature on Chicken Tender" },
    ],
    concepts: ["temperature sensing", "animal welfare thresholds", "relays"],
    build: { label: "Your First Coop Brain", href: "/lessons/your-first-coop-brain" },
  },
  {
    id: "build-a-coop-brain",
    title: "Build a coop brain",
    emoji: "🧠",
    goal: "WHEN it is sunset, IF the chickens are inside, DO close the door - then build it for real.",
    steps: [
      { kind: "trigger", scenario: "sunset", text: "Trigger \"Sunset - close the coop\" (the WHEN)" },
      { kind: "explain", scenario: "sunset", text: "Open \"Why did this happen?\" and find the IF and the DO" },
      { kind: "visit", path: "/schedules", text: "Find the rule in Schedules" },
    ],
    concepts: ["WHEN / IF / DO rules", "sensors", "actuators", "microcontrollers"],
    build: { label: "Your First Coop Brain (Starter Node)", href: "/lessons/your-first-coop-brain" },
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
