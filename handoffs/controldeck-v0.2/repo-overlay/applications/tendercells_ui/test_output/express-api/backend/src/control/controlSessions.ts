import type { ControlFrame } from './types';

export interface SessionRecord {
  sessionId: string;
  deviceId: string;
  profileId: string;
  openedAtMs: number;
  lastFrameAtMs: number;
  lastSeq: number;
}

export type Neutralize = (deviceId: string, reason: string) => void;

export class ControlSessionManager {
  private byDevice = new Map<string, SessionRecord>();
  private timer: ReturnType<typeof setInterval> | null = null;

  constructor(
    readonly staleMs = 500,
    private readonly neutralize: Neutralize = () => {},
  ) {}

  open(sessionId: string, deviceId: string, profileId: string, now = Date.now()): SessionRecord {
    const existing = this.byDevice.get(deviceId);
    if (existing && existing.sessionId !== sessionId) {
      throw new Error('device already has an active controller lease');
    }
    const record = existing ?? {
      sessionId, deviceId, profileId, openedAtMs: now, lastFrameAtMs: now, lastSeq: 0,
    };
    this.byDevice.set(deviceId, record);
    return record;
  }

  accept(frame: ControlFrame, now = Date.now()): { ok: true } | { ok: false; reason: string } {
    const current = this.byDevice.get(frame.deviceId);
    if (!current || current.sessionId !== frame.sessionId) return { ok:false, reason:'no active lease' };
    if (frame.profileId !== current.profileId) return { ok:false, reason:'profile changed during session' };
    if (frame.seq <= current.lastSeq) return { ok:false, reason:'out-of-order or duplicate frame' };
    if (now - frame.sentAtMs > this.staleMs) return { ok:false, reason:'stale frame' };

    current.lastSeq = frame.seq;
    current.lastFrameAtMs = now;
    return { ok:true };
  }

  close(deviceId: string, sessionId: string, reason = 'controller disconnected'): void {
    const current = this.byDevice.get(deviceId);
    if (!current || current.sessionId !== sessionId) return;
    this.byDevice.delete(deviceId);
    this.neutralize(deviceId, reason);
  }

  sweep(now = Date.now()): string[] {
    const expired: string[] = [];
    for (const [deviceId, s] of this.byDevice) {
      if (now - s.lastFrameAtMs > this.staleMs) {
        this.byDevice.delete(deviceId);
        expired.push(deviceId);
        this.neutralize(deviceId, 'control stream stale');
      }
    }
    return expired;
  }

  startWatchdog(periodMs = 100): void {
    if (this.timer) return;
    this.timer = setInterval(() => this.sweep(), Math.max(25, periodMs));
  }

  stopWatchdog(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  get(deviceId: string): SessionRecord | undefined {
    return this.byDevice.get(deviceId);
  }
}
