// twin.ts - Tender Cells digital-twin primitives: stable twin IDs, where a value came from
// (provenance), and how mature a twin is. See docs/TENDERCELLS_DIGITAL_TWIN_ARCHITECTURE.md.
//
// A twin ID is `tc:{kind}:{type}:{localId}`, e.g. tc:habitat:chicken-tender:ct_001. The local
// id is the same deviceId used by MQTT topics (tc/{deviceId}/...), schedules, eggs and the
// property grid, so one entity has one identity everywhere.

export type TwinKind = "property" | "environment" | "animal" | "habitat" | "device" | "sensor" | "robot";

/** Where a value came from. Simulated, sensed, entered and inferred data must never look the same. */
export type SourceType =
  | "SENSED" | "USER_ENTERED" | "INFERRED" | "SIMULATED" | "CALCULATED" | "EXTERNAL" | "COMMAND_STATE";

/** How far a twin has come, weakest first. Never show a stronger label than the data supports. */
export type TwinMaturity = "Simulated" | "Twin ready" | "Connected prototype" | "Hardware validated" | "Field testing" | "Live twin";

export const DEMO_PROPERTY_ID = "tc:property:demo-farm";

/**
 * Build a twin ID.
 *
 * @param kind    - Twin kind (habitat, device, robot, ...)
 * @param type    - Product family or entity type, e.g. "chicken-tender", "chicken"
 * @param localId - The entity's local id (deviceId for devices)
 * @returns A stable id, e.g. "tc:habitat:chicken-tender:ct_001"
 * @example
 *   twinId("device", "watchtower", "wt_001") // "tc:device:watchtower:wt_001"
 */
export function twinId(kind: TwinKind, type: string, localId: string): string {
  const clean = (s: string) => s.trim().toLowerCase().replace(/[^a-z0-9_-]+/g, "-");
  return `tc:${kind}:${clean(type)}:${clean(localId)}`;
}

// Demo device prefix -> [kind, family]. Coops and docks are habitats; WatchTower is a device;
// Roaming Roost moves, so it is a robot twin.
const DEMO_PREFIX: Record<string, [TwinKind, string]> = {
  ct: ["habitat", "chicken-tender"],
  dd: ["habitat", "duck-dock"],
  bb: ["habitat", "bunny-burrow"],
  gg: ["habitat", "goat-guardian"],
  tt: ["habitat", "turkey-tower"],
  pp: ["habitat", "pigeon-palace"],
  rr: ["robot", "roaming-roost"],
  wt: ["device", "watchtower"],
};

/**
 * The twin ID for a demo / registered device id such as "ct_001".
 *
 * @param deviceId - Device id used in MQTT topics and the demo
 * @returns Twin ID; unknown prefixes become generic device twins
 */
export function deviceTwinId(deviceId: string): string {
  const [kind, family] = DEMO_PREFIX[deviceId.split("_")[0] ?? ""] ?? ["device", "device"];
  return twinId(kind, family, deviceId);
}

export const SOURCE_LABEL: Record<SourceType, string> = {
  SENSED: "Sensed - a direct sensor reading",
  USER_ENTERED: "Entered by a person",
  INFERRED: "Inferred - a model's guess with a confidence",
  SIMULATED: "Simulated - produced by the demo simulator",
  CALCULATED: "Calculated - derived by a rule or the OS",
  EXTERNAL: "External data source (e.g. weather)",
  COMMAND_STATE: "Command state - what the OS asked a device to do",
};
