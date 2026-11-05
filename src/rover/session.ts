// Rover control session: rate limiting (20 Hz), deadman and E-stop handling on
// top of a transport. Time and timers are injectable for unit tests.
import {
  INPUT_TIMEOUT_MS,
  MIN_SEND_INTERVAL_MS,
  SPEED_MODES,
  STOP_REPEATS,
  STOP_WHEELS,
  isZero,
  sticksToWheels,
  topics,
  wheelsToPayload,
} from './control-core';
import type { ControllerType, DrivePayload, SpeedMode, StickState, WheelTargets } from './control-core';

export interface PublishOptions {
  qos?: 0 | 1;
  retain?: boolean;
}

export type LinkStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface RoverTransport {
  readonly kind: string;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  isConnected(): boolean;
  publish(topic: string, payload: Record<string, unknown>, opts?: PublishOptions): boolean;
  onStatus(cb: (s: LinkStatus, detail?: string) => void): () => void;
}

export interface Clock {
  now(): number;
  setInterval(fn: () => void, ms: number): unknown;
  clearInterval(h: unknown): void;
}

export const realClock: Clock = {
  now: () => Date.now(),
  setInterval: (fn, ms) => setInterval(fn, ms),
  clearInterval: (h) => clearInterval(h as ReturnType<typeof setInterval>),
};

export interface SessionEvents {
  onSend?: (p: DrivePayload) => void;
  onState?: (s: SessionSnapshot) => void;
}

export interface SessionSnapshot {
  link: LinkStatus;
  estop: boolean;
  wheels: WheelTargets;
  lastSent: DrivePayload | null;
  sentCount: number;
  needsRecenter: boolean;
  speedMode: SpeedMode;
  controllerType: ControllerType;
}

const ZERO: StickState = { x: 0, y: 0 };

export class RoverSession {
  private lastInputAt = 0;
  private timer: unknown = null;
  private seq = 0;
  private stopsPending = 0;
  private lastSendAt = -Infinity;
  private wasMoving = false;
  private snapshot: SessionSnapshot;
  private unsub: (() => void) | null = null;
  private transport: RoverTransport;
  private deviceId: string;
  private clock: Clock;
  private events: SessionEvents;

  constructor(
    transport: RoverTransport,
    deviceId: string,
    clock: Clock = realClock,
    events: SessionEvents = {},
    controllerType: ControllerType = 'arcade',
    speedMode: SpeedMode = 'normal',
  ) {
    this.transport = transport;
    this.deviceId = deviceId;
    this.clock = clock;
    this.events = events;
    this.snapshot = {
      link: transport.isConnected() ? 'connected' : 'disconnected',
      estop: false,
      wheels: STOP_WHEELS,
      lastSent: null,
      sentCount: 0,
      needsRecenter: false,
      speedMode,
      controllerType,
    };
    this.unsub = transport.onStatus((s) => this.handleLink(s));
  }

  get state(): SessionSnapshot {
    return this.snapshot;
  }

  start(): void {
    if (this.timer) return;
    this.timer = this.clock.setInterval(() => this.tick(), MIN_SEND_INTERVAL_MS);
  }

  /** Stop the loop. Always tries to send a final stop first. */
  dispose(): void {
    this.forceStop();
    this.flushStopNow();
    if (this.timer) this.clock.clearInterval(this.timer);
    this.timer = null;
    this.unsub?.();
    this.unsub = null;
  }

  setControllerType(t: ControllerType): void {
    this.forceStop();
    this.update({ controllerType: t });
  }

  setSpeedMode(m: SpeedMode): void {
    this.update({ speedMode: m });
  }

  /** Called by the UI every animation frame while a stick is held (and on release). */
  setInput(left: StickState, right: StickState): void {
    this.lastInputAt = this.clock.now();
    const wheels = sticksToWheels(this.snapshot.controllerType, left, right);
    if (this.snapshot.needsRecenter) {
      if (isZero(wheels)) this.update({ needsRecenter: false });
      return;
    }
    if (this.snapshot.estop || this.snapshot.link !== 'connected') return;
    this.update({ wheels });
  }

  /** Deadman: release / touchcancel / blur / page hidden / gamepad lost. */
  release(): void {
    this.setInput(ZERO, ZERO);
    this.forceStop();
  }

  estop(): void {
    this.forceStop();
    this.update({ estop: true });
    // E-stop goes out immediately, not on the next tick; retained so a rover
    // that (re)connects later still sees it.
    this.transport.publish(topics.estop(this.deviceId), { active: true }, { qos: 1, retain: true });
    this.flushStopNow();
  }

  clearEstop(): void {
    this.transport.publish(topics.estop(this.deviceId), { active: false }, { qos: 1, retain: true });
    this.update({ estop: false, needsRecenter: true });
  }

  publishAux(topicSuffix: string, body: Record<string, unknown>): boolean {
    if (!topicSuffix) return false;
    return this.transport.publish(topics.cmd(this.deviceId, topicSuffix), body, { qos: 1 });
  }

  /** One control-loop step (public for tests). */
  tick(): void {
    const now = this.clock.now();
    // Input timeout: a held stick must keep reporting; if it goes quiet
    // (frozen UI thread, app backgrounded, lost touch) treat it as released.
    if (!isZero(this.snapshot.wheels) && now - this.lastInputAt > INPUT_TIMEOUT_MS) {
      this.forceStop();
    }
    if (now - this.lastSendAt < MIN_SEND_INTERVAL_MS - 1) return; // 20 Hz cap
    if (!this.transport.isConnected()) return;

    const moving = !isZero(this.snapshot.wheels) && !this.snapshot.estop;
    if (moving) {
      this.send(this.snapshot.wheels);
      this.wasMoving = true;
      return;
    }
    if (this.wasMoving) {
      this.wasMoving = false;
      this.stopsPending = STOP_REPEATS;
    }
    if (this.stopsPending > 0) {
      this.stopsPending--;
      this.send(STOP_WHEELS);
    }
  }

  private forceStop(): void {
    if (!isZero(this.snapshot.wheels)) this.update({ wheels: STOP_WHEELS });
    if (this.wasMoving || this.stopsPending > 0) {
      this.wasMoving = false;
      this.stopsPending = STOP_REPEATS;
    }
  }

  /** Send a stop right now, ignoring the rate limiter (safety path). */
  private flushStopNow(): void {
    if (!this.transport.isConnected()) return;
    this.send(STOP_WHEELS);
    if (this.stopsPending > 0) this.stopsPending--;
  }

  private send(w: WheelTargets): void {
    const p = wheelsToPayload(w, SPEED_MODES[this.snapshot.speedMode], ++this.seq);
    const ok = this.transport.publish(topics.drive(this.deviceId), p as unknown as Record<string, unknown>, { qos: 0 });
    if (!ok) return;
    this.lastSendAt = this.clock.now();
    this.events.onSend?.(p);
    this.update({ lastSent: p, sentCount: this.snapshot.sentCount + 1 });
  }

  private handleLink(s: LinkStatus): void {
    if (s !== 'connected') {
      // Disconnect = deadman. Firmware also stops on its own (starter-node
      // 1.5 s, Roaming Roost 0.5 s) because no fresh commands arrive.
      this.forceStop();
      this.update({ link: s, needsRecenter: true });
      return;
    }
    this.update({ link: s });
  }

  private update(p: Partial<SessionSnapshot>): void {
    this.snapshot = { ...this.snapshot, ...p };
    this.events.onState?.(this.snapshot);
  }
}
