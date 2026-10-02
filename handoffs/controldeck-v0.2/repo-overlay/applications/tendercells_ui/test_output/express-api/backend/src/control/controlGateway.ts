import type { Server as HttpServer, IncomingMessage } from 'node:http';
import { WebSocketServer, type WebSocket } from 'ws';
import { ControlSessionManager } from './controlSessions';
import { validateControlFrame } from './controlSchema';
import { frameToMqttPayload, neutralMotionPayload, type MotionPublisher } from './controlAdapters';
import type { ControlFrame } from './types';

export interface GatewayOptions {
  path?: string;
  staleMs?: number;
  authorize?: (req: IncomingMessage, deviceId: string) => Promise<boolean>;
}

function query(req: IncomingMessage): URL {
  return new URL(req.url ?? '/', 'http://tendercells.local');
}

export function attachControlGateway(
  server: HttpServer,
  publisher: MotionPublisher,
  options: GatewayOptions = {},
) {
  const path = options.path ?? '/api/control/ws';
  const wss = new WebSocketServer({ noServer: true });
  const manager = new ControlSessionManager(options.staleMs ?? 500, (deviceId, reason) => {
    publisher.publish(deviceId, neutralMotionPayload(reason));
  });
  manager.startWatchdog(100);

  server.on('upgrade', async (req, socket, head) => {
    const u = query(req);
    if (u.pathname !== path) return;
    const deviceId = u.searchParams.get('deviceId') ?? '';
    const profileId = u.searchParams.get('profileId') ?? '';
    if (!deviceId || !profileId) {
      socket.write('HTTP/1.1 400 Bad Request\r\nConnection: close\r\n\r\n');
      socket.destroy();
      return;
    }
    if (options.authorize && !(await options.authorize(req, deviceId))) {
      socket.write('HTTP/1.1 403 Forbidden\r\nConnection: close\r\n\r\n');
      socket.destroy();
      return;
    }
    wss.handleUpgrade(req, socket, head, (ws) => {
      wss.emit('connection', ws, req, { deviceId, profileId });
    });
  });

  wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
    const u = query(req);
    const deviceId = u.searchParams.get('deviceId')!;
    const profileId = u.searchParams.get('profileId')!;
    let sessionId = '';

    ws.on('message', (raw) => {
      let msg: any;
      try { msg = JSON.parse(raw.toString()); } catch {
        ws.send(JSON.stringify({ type:'error', error:'invalid JSON' }));
        return;
      }
      if (msg?.type !== 'frame') return;
      const frame = msg.frame as ControlFrame;
      const err = validateControlFrame(frame);
      if (err || frame.deviceId !== deviceId || frame.profileId !== profileId) {
        ws.send(JSON.stringify({ type:'error', error:err ?? 'session identity mismatch' }));
        return;
      }

      try {
        if (!sessionId) {
          sessionId = frame.sessionId;
          manager.open(sessionId, deviceId, profileId);
        }
      } catch (e) {
        ws.send(JSON.stringify({ type:'error', error:(e as Error).message }));
        ws.close(1008, 'control lease unavailable');
        return;
      }

      const accepted = manager.accept(frame);
      if (!accepted.ok) {
        ws.send(JSON.stringify({ type:'error', error:accepted.reason }));
        return;
      }

      publisher.publish(deviceId, frameToMqttPayload(frame));
      ws.send(JSON.stringify({
        type:'ack',
        seq:frame.seq,
        serverAtMs:Date.now(),
        echoSentAtMs:frame.sentAtMs,
      }));
    });

    const close = () => {
      if (sessionId) manager.close(deviceId, sessionId);
    };
    ws.on('close', close);
    ws.on('error', close);
  });

  return { wss, manager };
}
