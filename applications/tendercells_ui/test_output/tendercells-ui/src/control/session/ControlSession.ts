import { ControlEngine } from '../core/ControlEngine';
import type { RawInput } from '../types';
import type { ControlTransport } from '../transports/ControlTransport';

export class ControlSession {
  private timer: ReturnType<typeof setInterval> | null = null;
  private generation = 0;
  private latest: RawInput = { source: 'sim', axes: {}, active: false, timestampMs: 0 };
  constructor(readonly engine: ControlEngine, readonly transport: ControlTransport, readonly rateHz: number) {}
  updateInput(input: RawInput): void {
    this.latest = input;
    if (!input.active) this.transport.send(this.engine.neutral());
  }
  async start(): Promise<void> {
    if (this.timer) return;
    const generation = ++this.generation;
    await this.transport.connect();
    if (generation !== this.generation) return;
    const interval = Math.max(20, Math.round(1000 / Math.max(1, this.rateHz)));
    this.timer = setInterval(() => {
      const fresh = Date.now() - this.latest.timestampMs < 250;
      this.transport.send(this.latest.active && fresh ? this.engine.next(this.latest) : this.engine.neutral());
    }, interval);
  }
  stop(): void {
    ++this.generation;
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    this.latest = { source: 'sim', axes: {}, active: false, timestampMs: 0 };
    this.transport.send(this.engine.neutral());
    this.transport.close();
  }
}
