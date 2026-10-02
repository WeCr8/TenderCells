import type { Server as HttpServer, IncomingMessage } from 'node:http';
import type { Duplex } from 'node:stream';
import { WebSocketServer } from 'ws';
import { ControlSessionManager } from './controlSessions.js';
import { validateControlFrame } from './controlSchema.js';
import { frameToMqttPayload, neutralMotionPayload, type MotionPublisher } from './controlAdapters.js';
import type { ControlFrame } from './types.js';
export interface GatewayOptions {
  path?: string; staleMs?: number;
  authorize?: (req: IncomingMessage, deviceId: string) => Promise<boolean>;
}
export function attachControlGateway(server: HttpServer, publisher: MotionPublisher, options: GatewayOptions = {}) {
  const route = options.path ?? '/api/control/ws';
  const wss = new WebSocketServer({ noServer: true, maxPayload: 8192 });
  const manager = new ControlSessionManager(options.staleMs ?? 500, (id, reason) => {
    try { publisher.publish(id, neutralMotionPayload(reason)); } catch { /* Transport failed; device watchdog must also stop. */ }
  });
  manager.startWatchdog(25);
  const reject = (socket: Duplex, status: number) => { socket.end(`HTTP/1.1 ${status} Rejected\r\nConnection: close\r\n\r\n`); };
  const upgrade = async (req: IncomingMessage, socket: Duplex, head: Buffer) => {
    const url = new URL(req.url ?? '/', 'http://tendercells.local');
    if (url.pathname !== route) return;
    const deviceId = url.searchParams.get('deviceId') ?? '';
    const profileId = url.searchParams.get('profileId') ?? '';
    if (!/^[A-Za-z0-9][A-Za-z0-9_.:-]{0,95}$/.test(deviceId) || !/^[a-z0-9][a-z0-9-]{0,63}$/.test(profileId)) return reject(socket, 400);
    try {
      // No implicit trust for localhost. Production leaves this unconfigured.
      if (!options.authorize || !await options.authorize(req, deviceId)) return reject(socket, 403);
    } catch { return reject(socket, 403); }
    if (socket.destroyed) return;
    wss.handleUpgrade(req, socket, head, ws => {
      let sessionId = '';
      const close = () => { if (sessionId) manager.close(deviceId, sessionId); };
      const fail = (reason: string) => { close(); ws.close(1008, reason.slice(0, 100)); };
      ws.on('message', raw => {
        let msg: { type?: string; frame?: ControlFrame };
        try { msg = JSON.parse(raw.toString()); } catch { fail('invalid JSON'); return; }
        if (!msg || msg.type !== 'frame' || !msg.frame) { fail('expected frame'); return; }
        const frame = msg.frame;
        const err = validateControlFrame(frame);
        if (err || frame.deviceId !== deviceId || frame.profileId !== profileId || (sessionId && frame.sessionId !== sessionId)) {
          fail(err ?? 'session identity mismatch'); return;
        }
        if (!sessionId) {
          try { manager.open(frame.sessionId, deviceId, profileId); sessionId = frame.sessionId; }
          catch { fail('control lease unavailable'); return; }
        }
        const accepted = manager.accept(frame);
        if (!accepted.ok) { fail(accepted.reason); return; }
        try {
          if (!publisher.publish(deviceId, frameToMqttPayload(frame))) { fail('motion publisher unavailable'); return; }
        } catch { fail('motion publish failed'); return; }
        ws.send(JSON.stringify({ type: 'ack', seq: frame.seq, serverAtMs: Date.now(), echoSentAtMs: frame.sentAtMs }));
      });
      ws.on('close', close); ws.on('error', close);
    });
  };
  server.on('upgrade', upgrade);
  const dispose = () => {
    server.off('upgrade', upgrade); manager.stopWatchdog();
    for (const client of wss.clients) client.terminate();
    wss.close();
  };
  server.once('close', dispose);
  return { wss, manager, dispose };
}
