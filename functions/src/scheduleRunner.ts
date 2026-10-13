// scheduleRunner.ts - one pass of the cloud schedule runner (executeSchedules), with the
// Firestore access injected so the whole decision path is unit-tested. See scheduleExec.ts.
import {
  COMMAND_TTL_MS, commandFor, commandId, dueMinutes, estopLatched, resolveTimeZone, type CloudSchedule,
} from "./scheduleExec";

export interface ScheduleRunStore {
  listDevices(): Promise<Array<{ id: string; data: Record<string, unknown> }>>;
  listEnabledSchedules(deviceId: string): Promise<Array<{ id: string; data: CloudSchedule }>>;
  getDeviceState(deviceId: string): Promise<Record<string, unknown> | undefined>;
  /** users/{uid}/settings/prefs.preferences.timezone (what Settings → Timezone saves). */
  getOwnerTimeZone(ownerId: string): Promise<string | undefined>;
  /** Create deviceCommands/{deviceId}/queue/{cmdId}; false when it already exists (hub or an earlier run). */
  enqueue(deviceId: string, cmdId: string, doc: Record<string, unknown>): Promise<boolean>;
  markRan(deviceId: string, scheduleId: string, atMs: number): Promise<void>;
}

/** A device the hub mirrored or that posted telemetry within this window counts as online. */
export const ONLINE_WINDOW_MS = 5 * 60_000;

export interface RunSummary { queued: string[]; skipped: Array<{ deviceId: string; scheduleId?: string; reason: string }> }

/**
 * Queue every schedule that came due in (fromMs, toMs].
 *
 * @param store - Firestore access (or a fake)
 * @param fromMs - End of the previous window (exclusive)
 * @param toMs - Now (inclusive)
 */
export async function runSchedules(store: ScheduleRunStore, fromMs: number, toMs: number): Promise<RunSummary> {
  const summary: RunSummary = { queued: [], skipped: [] };
  for (const { id: deviceId, data: device } of await store.listDevices()) {
    const schedules = await store.listEnabledSchedules(deviceId);
    if (!schedules.length) continue;

    const state = await store.getDeviceState(deviceId);
    // E-STOP: the coop is stopped until a person clears it in the app. Nothing scheduled runs.
    if (estopLatched(state, device.state as Record<string, unknown> | undefined, device)) {
      summary.skipped.push({ deviceId, reason: "estop" });
      continue;
    }
    const lastSeen = Math.max(Number(state?.lastSeen) || 0, Number(device.telemetryAt) || 0, Number(device.stateAt) || 0);
    if (!lastSeen || toMs - lastSeen > ONLINE_WINDOW_MS) {
      summary.skipped.push({ deviceId, reason: "offline" });
      continue;
    }
    const owner = (device.ownerId ?? device.userId) as string | undefined;
    let ownerTz: string | undefined;
    let ownerTzLoaded = false;

    for (const { id: scheduleId, data: s } of schedules) {
      if (!s.cronExpression) continue;
      const cmd = commandFor(s);
      if (!cmd) { summary.skipped.push({ deviceId, scheduleId, reason: `unknown action ${String(s.action)}` }); continue; }
      let tz = resolveTimeZone(s.timeZone, device.timeZone);
      if (!tz && owner) {
        if (!ownerTzLoaded) { ownerTz = await store.getOwnerTimeZone(owner); ownerTzLoaded = true; }
        tz = resolveTimeZone(ownerTz);
      }
      if (!tz) { summary.skipped.push({ deviceId, scheduleId, reason: "no time zone (schedule, coop or owner settings)" }); continue; }
      for (const minute of dueMinutes(s.cronExpression, tz, fromMs, toMs)) {
        const id = commandId(scheduleId, minute);
        const created = await store.enqueue(deviceId, id, {
          deviceId, ownerId: owner ?? null, command: cmd.command, payload: cmd.payload, motion: cmd.motion,
          source: "schedule", scheduleId, dueAt: minute, timeZone: tz, status: "pending", createdBy: "cloud",
          createdAt: toMs, expiresAt: minute + COMMAND_TTL_MS,
        });
        if (created) {
          summary.queued.push(id);
          await store.markRan(deviceId, scheduleId, minute);
        } else {
          summary.skipped.push({ deviceId, scheduleId, reason: "already queued or fired by the hub" });
        }
      }
    }
  }
  return summary;
}
