import { grpcCodeLabel, probeFirestore } from "./healthProbe";

describe("probeFirestore", () => {
  it("reports ok when the read succeeds", async () => {
    const db = { doc: (p: string) => ({ get: async () => ({ path: p }) }) };
    await expect(probeFirestore(db)).resolves.toEqual({ firestore: "ok" });
  });

  it("names PERMISSION_DENIED when IAM blocks the runtime service account", async () => {
    const err = Object.assign(new Error("7 PERMISSION_DENIED: Missing or insufficient permissions."), { code: 7 });
    const db = { doc: () => ({ get: async () => { throw err; } }) };
    await expect(probeFirestore(db)).resolves.toEqual({ firestore: "error", code: "PERMISSION_DENIED (7)" });
  });

  it("times out instead of hanging", async () => {
    const db = { doc: () => ({ get: () => new Promise(() => undefined) }) };
    await expect(probeFirestore(db, 20)).resolves.toEqual({ firestore: "error", code: "DEADLINE_EXCEEDED (4)" });
  });

  it("reads only the fixed probe document", async () => {
    const seen: string[] = [];
    const db = { doc: (p: string) => { seen.push(p); return { get: async () => ({}) }; } };
    await probeFirestore(db);
    expect(seen).toEqual(["_health/probe"]);
  });
});

describe("grpcCodeLabel", () => {
  it("handles string codes and unknown shapes", () => {
    expect(grpcCodeLabel({ code: "permission-denied" })).toBe("permission-denied");
    expect(grpcCodeLabel(new Error("x"))).toBe("UNKNOWN");
    expect(grpcCodeLabel({ code: 99 })).toBe("UNKNOWN (99)");
  });
});
