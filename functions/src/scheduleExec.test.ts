import { commandFor, commandId, cronMatchesAt, dueMinutes, estopLatched, localParts, resolveTimeZone } from "./scheduleExec";
import { runSchedules, type ScheduleRunStore } from "./scheduleRunner";

// 2026-07-01 13:00:00 UTC = 06:00 PDT (America/Los_Angeles, UTC-7) = 09:00 EDT.
const JUL1_1300Z = Date.UTC(2026, 6, 1, 13, 0, 0);
// 2026-01-15 14:00:00 UTC = 06:00 PST (UTC-8).
const JAN15_1400Z = Date.UTC(2026, 0, 15, 14, 0, 0);

describe("cron in the coop's time zone", () => {
  it("matches 6:00 local, not 6:00 UTC, across daylight saving", () => {
    expect(cronMatchesAt("0 6 * * *", JUL1_1300Z, "America/Los_Angeles")).toBe(true);
    expect(cronMatchesAt("0 6 * * *", JAN15_1400Z, "America/Los_Angeles")).toBe(true);
    expect(cronMatchesAt("0 6 * * *", Date.UTC(2026, 6, 1, 6, 0), "America/Los_Angeles")).toBe(false);
    expect(cronMatchesAt("0 6 * * *", Date.UTC(2026, 6, 1, 6, 0), "UTC")).toBe(true);
  });

  it("uses the local weekday (Wed 06:00 in LA is still Wed; 23:30 Tue LA is Wed UTC)", () => {
    expect(localParts(JUL1_1300Z, "America/Los_Angeles").weekday).toBe(3);
    const tue2330LA = Date.UTC(2026, 6, 1, 6, 30); // Wed 06:30 UTC
    expect(cronMatchesAt("30 23 * * 2", tue2330LA, "America/Los_Angeles")).toBe(true);
    expect(cronMatchesAt("30 23 * * 3", tue2330LA, "America/Los_Angeles")).toBe(false);
  });

  it("supports lists, ranges and steps", () => {
    expect(cronMatchesAt("15,45 6 * * 1-5", JUL1_1300Z + 15 * 60_000, "America/Los_Angeles")).toBe(true);
    expect(cronMatchesAt("*/20 * * * *", JUL1_1300Z + 40 * 60_000, "UTC")).toBe(true);
    expect(cronMatchesAt("*/20 * * * *", JUL1_1300Z + 41 * 60_000, "UTC")).toBe(false);
    expect(cronMatchesAt("bad", JUL1_1300Z, "UTC")).toBe(false);
  });

  it("finds minutes that are not multiples of 5 inside the 5-minute window", () => {
    const due = dueMinutes("32 6 * * *", "America/Los_Angeles", JUL1_1300Z + 30 * 60_000, JUL1_1300Z + 35 * 60_000);
    expect(due).toEqual([JUL1_1300Z + 32 * 60_000]);
    expect(dueMinutes("30 6 * * *", "America/Los_Angeles", JUL1_1300Z + 30 * 60_000, JUL1_1300Z + 35 * 60_000)).toEqual([]);
  });

  it("resolves the zone from schedule, then coop, then owner; rejects junk", () => {
    expect(resolveTimeZone(undefined, "Europe/Berlin", "America/Chicago")).toBe("Europe/Berlin");
    expect(resolveTimeZone("Not/AZone", "", "America/Chicago")).toBe("America/Chicago");
    expect(resolveTimeZone(undefined, null)).toBeNull();
  });
});

describe("the schedule's own action", () => {
  it("closes doors, uses the amount, switches water off, and marks robot motion", () => {
    expect(commandFor({ action: "door", state: "close" })).toEqual({ command: "door", payload: { state: "close" }, motion: false });
    expect(commandFor({ action: "door" })!.payload).toEqual({ state: "open" });
    expect(commandFor({ action: "feed", amount: 120 })!.payload).toEqual({ amount: 120 });
    expect(commandFor({ action: "water", on: false })).toEqual({ command: "light", payload: { on: false }, motion: false });
    expect(commandFor({ action: "clean" })!.motion).toBe(true);
    expect(commandFor({ action: "weed_pass", passes: 40, task: "patrol" })!.payload).toEqual({ action: "pass", passes: 10, task: "patrol" });
    expect(commandFor({ action: "launch" })).toBeNull();
  });

  it("sees E-STOP from device-states, the hub's mirrored state, or a flag", () => {
    expect(estopLatched({ systemState: "estop" })).toBe(true);
    expect(estopLatched(undefined, { state: "estop" })).toBe(true);
    expect(estopLatched(undefined, undefined, { estop: true })).toBe(true);
    expect(estopLatched({ systemState: "idle" }, { state: "idle" })).toBe(false);
  });
});

describe("runSchedules (one executeSchedules pass)", () => {
  function store(over: Partial<ScheduleRunStore> & { devices?: Array<{ id: string; data: Record<string, unknown> }> } = {}) {
    const queued = new Map<string, Record<string, unknown>>();
    const ran: string[] = [];
    const s: ScheduleRunStore = {
      listDevices: async () => over.devices ?? [{ id: "ct_001", data: { ownerId: "u1", telemetryAt: JUL1_1300Z - 30_000 } }],
      listEnabledSchedules: async () => [
        { id: "open", data: { action: "door", state: "open", cronExpression: "0 6 * * *", timeZone: "America/Los_Angeles" } },
        { id: "close", data: { action: "door", state: "close", cronExpression: "0 20 * * *" } },
      ],
      getDeviceState: async () => undefined,
      getOwnerTimeZone: async () => "America/Los_Angeles",
      enqueue: async (_d, id, doc) => { if (queued.has(id)) return false; queued.set(id, doc); return true; },
      markRan: async (_d, id) => { ran.push(id); },
      ...over,
    };
    return { s, queued, ran };
  }

  it("queues the 6:00 local open with the deterministic id the hub also claims", async () => {
    const { s, queued, ran } = store();
    const out = await runSchedules(s, JUL1_1300Z - 5 * 60_000, JUL1_1300Z);
    const id = commandId("open", JUL1_1300Z);
    expect(out.queued).toEqual([id]);
    expect(queued.get(id)).toMatchObject({ command: "door", payload: { state: "open" }, status: "pending", dueAt: JUL1_1300Z, expiresAt: JUL1_1300Z + 600_000 });
    expect(ran).toEqual(["open"]);
    // A second pass over the same minute (or the hub having fired it) queues nothing.
    expect((await runSchedules(s, JUL1_1300Z - 5 * 60_000, JUL1_1300Z)).queued).toEqual([]);
  });

  it("uses the owner's Settings time zone when the schedule has none (20:00 close)", async () => {
    const { s, queued } = store({ devices: [{ id: "ct_001", data: { ownerId: "u1", telemetryAt: Date.UTC(2026, 6, 2, 3, 0) } }] });
    const at = Date.UTC(2026, 6, 2, 3, 0); // 20:00 PDT on Jul 1
    await runSchedules(s, at - 5 * 60_000, at);
    expect(queued.get(commandId("close", at))).toMatchObject({ payload: { state: "close" }, timeZone: "America/Los_Angeles" });
  });

  it("skips everything while E-STOP is latched, when offline, and when no time zone is known", async () => {
    const estop = store({ getDeviceState: async () => ({ systemState: "estop", lastSeen: JUL1_1300Z }) });
    expect((await runSchedules(estop.s, JUL1_1300Z - 300_000, JUL1_1300Z)).skipped).toEqual([{ deviceId: "ct_001", reason: "estop" }]);
    expect(estop.queued.size).toBe(0);

    const offline = store({ devices: [{ id: "ct_001", data: { ownerId: "u1", telemetryAt: JUL1_1300Z - 3_600_000 } }] });
    expect((await runSchedules(offline.s, JUL1_1300Z - 300_000, JUL1_1300Z)).skipped[0].reason).toBe("offline");

    const noTz = store({ getOwnerTimeZone: async () => undefined });
    const at = Date.UTC(2026, 6, 2, 3, 0);
    noTz.s.listDevices = async () => [{ id: "ct_001", data: { ownerId: "u1", telemetryAt: at } }];
    const out = await runSchedules(noTz.s, at - 300_000, at);
    expect(out.skipped.find((x) => x.scheduleId === "close")?.reason).toMatch(/no time zone/);
    expect(noTz.queued.size).toBe(0);
  });
});
