// confirm.ts - the "confirm before hardware" rule for AI assistants.
//
// An assistant can never actuate in one call. It first REQUESTS an action, which touches
// nothing and returns a plain-language preview plus a short confirmation code. Only after
// the person reads the preview and agrees does the assistant CONFIRM with that code. Codes
// are single-use and expire after two minutes. This mirrors the confirm dialog every
// hardware button in the OS goes through.
import { randomInt } from "node:crypto";

export const CONFIRM_TTL_MS = 120_000;

export interface PendingAction<T> {
  code: string;
  action: T;
  expiresAt: number;
}

/** In-memory store of requested-but-not-confirmed actions. */
export class ConfirmStore<T> {
  private pending = new Map<string, PendingAction<T>>();

  constructor(private now: () => number = Date.now, private ttlMs = CONFIRM_TTL_MS) {}

  /**
   * Hold an action until it is confirmed.
   *
   * @param action - The action to run on confirmation
   * @returns The pending entry with its confirmation code and expiry
   */
  request(action: T): PendingAction<T> {
    this.sweep();
    let code: string;
    do code = String(randomInt(100_000, 1_000_000)); while (this.pending.has(code));
    const entry = { code, action, expiresAt: this.now() + this.ttlMs };
    this.pending.set(code, entry);
    return entry;
  }

  /**
   * Take an action for execution. Single-use: a second take of the same code fails.
   *
   * @param code - The confirmation code from request()
   * @returns The action, or an error reason
   */
  take(code: string): { action: T } | { error: string } {
    const entry = this.pending.get(code.trim());
    if (!entry) return { error: "Unknown or already used confirmation code. Request the action again." };
    this.pending.delete(entry.code);
    if (this.now() > entry.expiresAt) return { error: "That confirmation code expired. Request the action again." };
    return { action: entry.action };
  }

  /** Cancel every pending action for a device (used when E-STOP is sent). */
  cancelDevice(match: (a: T) => boolean): number {
    let n = 0;
    for (const [k, v] of this.pending) if (match(v.action)) { this.pending.delete(k); n++; }
    return n;
  }

  private sweep() {
    const t = this.now();
    for (const [k, v] of this.pending) if (t > v.expiresAt) this.pending.delete(k);
  }
}
