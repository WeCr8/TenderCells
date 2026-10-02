import type { ControlFrame, LinkMetrics } from '../types';
import type { ControlTransport } from './ControlTransport';

export class WebSocketControlTransport implements ControlTransport {
  private socket: WebSocket | null = null;
  private state: LinkMetrics['state'] = 'idle';
  private lastSendAtMs: number | undefined;
  private lastAckAtMs: number | undefined;
  private rttMs: number | undefined;

  constructor(private readonly url: string, private readonly token?: string) {}

  connect(): Promise<void> {
    this.state = 'connecting';
    const url = new URL(this.url, window.location.href);
    if (this.token) url.searchParams.set('token', this.token);

    return new Promise((resolve, reject) => {
      const ws = new WebSocket(url);
      this.socket = ws;
      ws.onopen = () => { this.state = 'connected'; resolve(); };
      ws.onerror = () => { this.state = 'error'; reject(new Error('Control socket failed')); };
      ws.onclose = () => { this.state = 'closed'; };
      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(String(event.data)) as { type?: string; seq?: number; serverAtMs?: number; echoSentAtMs?: number };
          if (msg.type === 'ack') {
            this.lastAckAtMs = Date.now();
            if (typeof msg.echoSentAtMs === 'number') this.rttMs = this.lastAckAtMs - msg.echoSentAtMs;
          }
        } catch {
          // Ignore non-control diagnostic messages.
        }
      };
    });
  }

  send(frame: ControlFrame): void {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) return;
    this.lastSendAtMs = Date.now();
    this.socket.send(JSON.stringify({ type: 'frame', frame }));
  }

  close(): void {
    this.socket?.close();
    this.socket = null;
    this.state = 'closed';
  }

  metrics(): LinkMetrics {
    return {
      state: this.state,
      lastSendAtMs: this.lastSendAtMs,
      lastAckAtMs: this.lastAckAtMs,
      rttMs: this.rttMs,
    };
  }
}
