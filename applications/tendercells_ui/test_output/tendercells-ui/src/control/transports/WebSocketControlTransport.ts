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
    if (!this.token) return Promise.reject(new Error('Sign in to connect to a live Roaming Roost.'));
    this.state = 'connecting';
    const url = new URL(this.url, window.location.href);
    url.protocol = url.protocol === 'https:' ? 'wss:' : url.protocol === 'http:' ? 'ws:' : url.protocol;
    if (url.protocol !== 'wss:' && !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)) {
      this.state = 'error';
      return Promise.reject(new Error('Live control requires a secure WebSocket (WSS) outside localhost.'));
    }

    return new Promise((resolve, reject) => {
      const ws = new WebSocket(url);
      this.socket = ws;
      let settled = false;
      const timeout = setTimeout(() => {
        ws.close();
        if (!settled) { settled = true; this.state = 'error'; reject(new Error('Control socket authentication timed out')); }
      }, 5000);
      ws.onopen = () => ws.send(JSON.stringify({ type: 'auth', token: this.token }));
      ws.onerror = () => {
        clearTimeout(timeout); this.state = 'error';
        if (!settled) { settled = true; reject(new Error('Control socket failed')); }
      };
      ws.onclose = () => {
        clearTimeout(timeout); this.state = 'closed';
        if (!settled) { settled = true; reject(new Error('Control socket rejected or closed')); }
      };
      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(String(event.data)) as { type?: string; seq?: number; serverAtMs?: number; echoSentAtMs?: number };
          if (msg.type === 'ready' && !settled) {
            settled = true; clearTimeout(timeout); this.state = 'connected'; resolve();
          } else if (msg.type === 'ack') {
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
