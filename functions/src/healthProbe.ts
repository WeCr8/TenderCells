// healthProbe.ts - "can this function's runtime service account use Firestore?"
//
// FIX(2026-10-15): every Firestore-backed callable (school sign-in getSchoolLoginOptions,
// claimSchoolMembership, newsletter confirm) and the AI connector answered a bare INTERNAL / 503
// because the runtime service account was denied by IAM. `GET /health?deep=1` names the gRPC
// code so an IAM fix can be verified in one request. It reads one fixed document and never
// writes.

export interface FirestoreProbeResult {
  firestore: "ok" | "error";
  code?: string;
}

interface DocGetter {
  doc(path: string): { get(): Promise<unknown> };
}

const GRPC_NAMES: Record<number, string> = {
  1: "CANCELLED", 2: "UNKNOWN", 3: "INVALID_ARGUMENT", 4: "DEADLINE_EXCEEDED", 5: "NOT_FOUND",
  6: "ALREADY_EXISTS", 7: "PERMISSION_DENIED", 8: "RESOURCE_EXHAUSTED", 9: "FAILED_PRECONDITION",
  10: "ABORTED", 11: "OUT_OF_RANGE", 12: "UNIMPLEMENTED", 13: "INTERNAL", 14: "UNAVAILABLE",
  15: "DATA_LOSS", 16: "UNAUTHENTICATED",
};

/** "PERMISSION_DENIED (7)" for gRPC errors, otherwise the error's own code or "UNKNOWN". */
export function grpcCodeLabel(err: unknown): string {
  const raw = typeof err === "object" && err && "code" in err ? (err as { code?: unknown }).code : undefined;
  if (typeof raw === "number") return `${GRPC_NAMES[raw] ?? "UNKNOWN"} (${raw})`;
  if (typeof raw === "string" && raw) return raw;
  return "UNKNOWN";
}

export async function probeFirestore(db: DocGetter, timeoutMs = 5000): Promise<FirestoreProbeResult> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    await Promise.race([
      db.doc("_health/probe").get(),
      new Promise((_, reject) => {
        timer = setTimeout(() => reject(Object.assign(new Error("timeout"), { code: 4 })), timeoutMs);
      }),
    ]);
    return { firestore: "ok" };
  } catch (err) {
    return { firestore: "error", code: grpcCodeLabel(err) };
  } finally {
    if (timer) clearTimeout(timer);
  }
}
