// safety.ts - which hub commands the E-STOP latch and the work-area gate refuse (unit tested).
//
// Firmware gates every actuator on its own E-STOP flag, so a door/feed/drive command sent
// during E-STOP is silently ignored by the board. FIX(2026-10-12): the hub still answered
// 200 "Door command sent", so the app showed a door closing that never moved. And the GRBL
// gantry (inside the coop, like the arm) skipped both the E-STOP latch and the chicken
// headcount gate that arm / clean / routine already use.

export type Actuator = "door" | "drive" | "feed" | "light" | "gantry";

/** Commands that only stop or switch something off stay allowed during E-STOP. */
export function isStopOnly(command: Actuator, payload: Record<string, unknown>): boolean {
  switch (command) {
    case "drive": return payload.dir === "stop";
    case "light": return payload.on === false;
    case "gantry": return (payload.cmd === "stop" || payload.cmd === "hold") && payload.x === undefined && payload.y === undefined;
    default: return false;
  }
}

/** Gantry motion must pass the same work-area gate as the arm (E-STOP + chicken headcount). */
export function needsClearWorkArea(command: Actuator, payload: Record<string, unknown>): boolean {
  return command === "gantry" && !isStopOnly(command, payload) && payload.cmd !== "unlock";
}

/**
 * Why the hub must refuse this command, or null to send it.
 *
 * @param command - Which actuator route
 * @param payload - The validated request body
 * @param estopLatched - Is the device's E-STOP latched (hub latch or device state)?
 * @param workAreaBlocked - motionBlockedReason() for the device (gantry only)
 */
export function actuatorRefusal(
  command: Actuator,
  payload: Record<string, unknown>,
  estopLatched: boolean,
  workAreaBlocked: () => string | null,
): string | null {
  if (isStopOnly(command, payload)) return null;
  if (estopLatched) return "E-STOP is active on this device. Clear it before sending this command.";
  if (needsClearWorkArea(command, payload)) return workAreaBlocked();
  return null;
}
