import type { ControlFrame, LinkMetrics } from '../types';
import type { ControlTransport } from './ControlTransport';

export class MockTransport implements ControlTransport {
  readonly frames: ControlFrame[] = [];
  private state: LinkMetrics['state'] = 'idle';

  constructor(private readonly onFrame?: (frame: ControlFrame) => void) {}

  async connect(): Promise<void> {
    this.state = 'connected';
  }

  send(frame: ControlFrame): void {
    if (this.state !== 'connected') return;
    this.frames.push(structuredClone(frame));
    if (this.frames.length > 100) this.frames.shift();
    this.onFrame?.(frame);
  }

  close(): void {
    this.state = 'closed';
  }

  metrics(): LinkMetrics {
    return { state: this.state, lastSendAtMs: this.frames[this.frames.length - 1]?.sentAtMs };
  }
}
