import { ControlEngine } from '../core/ControlEngine';
import type { RawInput } from '../types';
import type { ControlTransport } from '../transports/ControlTransport';

export class ControlSession {
  private timer: ReturnType<typeof setInterval> | null = null;
  private latest: RawInput = { source: 'sim', axes: {}, active: false, timestampMs: 0 };

  constructor(
    readonly engine: ControlEngine,
    readonly transport: ControlTransport,
    readonly rateHz: number,
  ) {}

  updateInput(input: RawInput): void {
    this.latest = input;
  }

  async start(): Promise<void> {
    if (this.timer) return;
    await this.transport.connect();
    const interval = Math.max(20, Math.round(1000 / Math.max(1, this.rateHz)));
    this.timer = setInterval(() => {
      this.transport.send(this.latest.active ? this.engine.next(this.latest) : this.engine.neutral());
    }, interval);
  }

  stop(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    // Best effort neutral before closing.
    this.transport.send(this.engine.neutral());
    this.transport.close();
  }
}
