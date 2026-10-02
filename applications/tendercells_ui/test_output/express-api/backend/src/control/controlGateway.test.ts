import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { once } from 'node:events';
import WebSocket from 'ws';
import { attachControlGateway } from './controlGateway.js';
async function setup(authorize?: () => Promise<boolean>, publishOk = true) {
  const server = createServer();
  const published: Record<string, unknown>[] = [];
  const gateway = attachControlGateway(server, { publish: (_id, payload) => { published.push(payload); return publishOk; } }, { authorize });
  server.listen(0, '127.0.0.1'); await once(server, 'listening');
  const address = server.address() as { port: number };
  return { server, gateway, published, url: `ws://127.0.0.1:${address.port}/api/control/ws?deviceId=sim&profileId=freetouch` };
}
const frame = (sessionId = 'session-first', seq = 1) => ({ type: 'frame', frame: { v: 1, deviceId: 'sim', profileId: 'freetouch', sessionId, seq, sentAtMs: Date.now(), deadman: true, axes: { throttle: .5 } } });
test('gateway denies connections without explicit authorization', async () => {
  const s = await setup();
  try {
    const ws = new WebSocket(s.url);
    const error = await new Promise<Error>(resolve => ws.once('error', resolve));
    assert.match(error.message, /403/); assert.equal(s.published.length, 0);
  } finally { s.server.close(); }
});
test('gateway neutralizes on disconnect and rejects competing sockets with the same session ID', async () => {
  const s = await setup(async () => true);
  const first = new WebSocket(s.url); const second = new WebSocket(s.url);
  try {
    await Promise.all([once(first, 'open'), once(second, 'open')]);
    first.send(JSON.stringify(frame())); await once(first, 'message');
    second.send(JSON.stringify(frame())); await once(second, 'close');
    assert.equal(s.published.length, 1);
    const serverSocket = [...s.gateway.wss.clients][0];
    const closed = once(serverSocket, 'close'); first.close(); await closed;
    assert.equal(s.published[s.published.length - 1]?.deadman, false);
  } finally { first.terminate(); second.terminate(); s.server.close(); }
});
test('duplicate frame closes and neutralizes the active stream', async () => {
  const s = await setup(async () => true); const ws = new WebSocket(s.url);
  try {
    await once(ws, 'open'); ws.send(JSON.stringify(frame())); await once(ws, 'message');
    ws.send(JSON.stringify(frame())); await once(ws, 'close');
    assert.equal(s.published[s.published.length - 1]?.deadman, false);
    assert.equal(s.published.filter(p => p.deadman).length, 1);
  } finally { ws.terminate(); s.server.close(); }
});

test('failed publisher closes without acknowledging motion', async () => {
  const s = await setup(async () => true, false); const ws = new WebSocket(s.url);
  const replies: string[] = [];
  ws.on('message', raw => replies.push(raw.toString()));
  try {
    await once(ws, 'open'); ws.send(JSON.stringify(frame())); await once(ws, 'close');
    assert.deepEqual(replies, []); assert.equal(s.published[s.published.length - 1]?.deadman, false);
  } finally { ws.terminate(); s.server.close(); }
});
