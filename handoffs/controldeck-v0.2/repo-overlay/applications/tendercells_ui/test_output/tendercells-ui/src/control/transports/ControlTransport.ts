import type { ControlFrame, LinkMetrics } from '../types';

export interface ControlTransport {
  connect(): Promise<void>;
  send(frame: ControlFrame): void;
  close(): void;
  metrics(): LinkMetrics;
}
