// health.ts - what a reading means for the animals, using the project thresholds
// (CLAUDE.md "Key Constants"). The MCP server attaches these flags to every device in the
// farm overview, so every assistant - and the farm card - leads with animal safety.

export const TEMP_MIN_F = 35;
export const TEMP_MAX_F = 85;
export const TEMP_CRITICAL_LOW_F = 32;
export const TEMP_CRITICAL_HIGH_F = 90;
export const AMMONIA_WARNING_PPM = 10;
export const AMMONIA_CRITICAL_PPM = 25;
export const FEED_LOW_PCT = 20;
export const WATER_LOW_PCT = 15;

export type FlagLevel = "critical" | "warning";
export interface HealthFlag {
  level: FlagLevel;
  text: string;
}

/** Telemetry fields the hub relays from tc/{id}/sensors (all optional). */
export interface Reading {
  temp?: number;
  humidity?: number;
  ammonia?: number;
  feedLevel?: number;
  waterLevel?: number;
  chickenCount?: number;
  doorState?: string;
}

/**
 * Flag anything in a reading that matters for the animals, most serious first.
 *
 * @param r     - Latest telemetry (temp °F, ammonia ppm, feed / water %)
 * @param state - System state (idle | running | error | estop), if known
 * @returns Flags, critical before warning; empty when all is well
 */
export function assessReading(r: Reading, state?: string): HealthFlag[] {
  const flags: HealthFlag[] = [];
  const add = (level: FlagLevel, text: string) => flags.push({ level, text });
  if (state === "estop") add("critical", "E-STOP is latched - check the coop, then clear it in the Tender Cells OS");
  if (state === "error") add("warning", "Device reports an error");
  if (typeof r.temp === "number") {
    if (r.temp < TEMP_CRITICAL_LOW_F || r.temp > TEMP_CRITICAL_HIGH_F) add("critical", `Temperature ${r.temp}°F is dangerous (safe ${TEMP_MIN_F}-${TEMP_MAX_F}°F)`);
    else if (r.temp < TEMP_MIN_F) add("warning", `Cold: ${r.temp}°F (below ${TEMP_MIN_F}°F) - consider the heat lamp`);
    else if (r.temp > TEMP_MAX_F) add("warning", `Hot: ${r.temp}°F (above ${TEMP_MAX_F}°F) - shade, water and airflow`);
  }
  if (typeof r.ammonia === "number") {
    if (r.ammonia > AMMONIA_CRITICAL_PPM) add("critical", `Ammonia ${r.ammonia} ppm - ventilate and clean now`);
    else if (r.ammonia > AMMONIA_WARNING_PPM) add("warning", `Ammonia ${r.ammonia} ppm - ventilation or cleaning needed`);
  }
  if (typeof r.waterLevel === "number" && r.waterLevel < WATER_LOW_PCT) add("warning", `Water low: ${r.waterLevel}%`);
  if (typeof r.feedLevel === "number" && r.feedLevel < FEED_LOW_PCT) add("warning", `Feed low: ${r.feedLevel}%`);
  return flags.sort((a, b) => (a.level === b.level ? 0 : a.level === "critical" ? -1 : 1));
}
