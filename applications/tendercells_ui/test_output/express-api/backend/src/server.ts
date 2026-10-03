// server.ts

// Load .env first (see loadEnv.ts — ESM evaluates imports before body code).
import './loadEnv.js';

// Start the embedded MQTT broker BEFORE importing the MQTT bridge, so the broker
// is listening when the bridge auto-connects on module load.
import './broker.js';

import express from 'express';
import { createServer } from 'node:http';
import { attachControlGateway } from './control/controlGateway.js';
import { createMotionPublisher } from './control/controlAdapters.js';
import cors from 'cors';
import os from 'node:os';
import mqttRoutes from './routes/mqtt.routes.js';
import productsRoutes from './routes/products.routes.js';
import { startScheduleRunner } from './schedule.runner.js';
import { buildBackendXml, buildStateXml } from './describe.js';
import { MQTTController } from './controllers/mqtt.controller.js';
import { onEstop as mowerOnEstop, startMowerBridge } from './mowerBridge.js';
import { AUTH_ENABLED, authorizeRoamingRoostControl, ownedDeviceIds, requireAuth, type AuthedRequest } from './middleware/auth.js';

/**
 * First non-internal IPv4 address, so we can print a URL other devices on the
 * same network (a phone, a second laptop, a judge's tablet at a science fair)
 * can actually open. Returns null if only loopback is available.
 */
function lanAddress(): string | null {
  for (const ifaces of Object.values(os.networkInterfaces())) {
    for (const i of ifaces ?? []) {
      if (i.family === 'IPv4' && !i.internal) return i.address;
    }
  }
  return null;
}

// Firebase optional - MQTT is primary control path
try {
  // Lazy load Firebase if needed later
  // const { initializeFirebaseAdmin } = await import('./config/firebase-admin.js');
  // initializeFirebaseAdmin();
  console.log('Firebase skipped - MQTT primary control path');
} catch {
  console.warn('Firebase not available (optional for MQTT-only mode)');
}

const app = express();
const PORT = Number(process.env.PORT || 4000);
// Bind to loopback by default (safe). Set HOST=0.0.0.0 (or LAN=1) to expose the
// API to other devices on the network — needed for science-fair / classroom setups
// where the dashboard or a phone runs on a different machine than the coop.
const HOST = process.env.HOST || (process.env.LAN === '1' ? '0.0.0.0' : '127.0.0.1');

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// MQTT hardware control routes
console.log('Loading MQTT routes..., router:', typeof mqttRoutes);
app.use('/api/mqtt', mqttRoutes);
console.log('MQTT routes loaded successfully');
app.use('/api/products', productsRoutes);

// Fire device schedules at their cron time (no-op without Firebase admin).
startScheduleRunner();
// Bring-your-own robot mowers: poll, interlock, and send a mower home on E-STOP.
startMowerBridge(MQTTController.host());
MQTTController.onEstopHooks.push(mowerOnEstop);

// Machine-readable backend description for LLMs / tools (no scraping needed).
type Layer = { route?: { path: string; methods: Record<string, boolean> }; name?: string; handle?: { stack?: Layer[] }; regexp?: RegExp };
function registeredRoutes(): Array<{ method: string; path: string }> {
  const out: Array<{ method: string; path: string }> = [];
  const mounts: Array<[string, Layer[] | undefined]> = [
    ['', (app as unknown as { _router?: { stack: Layer[] } })._router?.stack],
    ['/api/mqtt', (mqttRoutes as unknown as { stack: Layer[] }).stack],
    ['/api/products', (productsRoutes as unknown as { stack: Layer[] }).stack],
  ];
  for (const [prefix, stack] of mounts) {
    for (const layer of stack ?? []) {
      if (!layer.route) continue;
      for (const m of Object.keys(layer.route.methods)) {
        const path = (prefix + layer.route.path).replace(/\/$/, '') || '/';
        out.push({ method: m.toUpperCase(), path });
      }
    }
  }
  return out;
}

app.get('/api/describe.xml', (_req, res) => {
  res.type('application/xml').send(buildBackendXml({ routes: registeredRoutes() }));
});

app.get('/api/state.xml', requireAuth, async (req, res) => {
  try {
    const only = await ownedDeviceIds((req as AuthedRequest).uid);
    res.type('application/xml').send(buildStateXml(MQTTController.devicesSnapshot(only)));
  } catch {
    res.status(500).type('application/xml').send('<?xml version="1.0" encoding="UTF-8"?><error>state unavailable</error>');
  }
});

// API status dashboard
app.get('/api/status', (req, res) => {
  res.json({
    service: 'tender-cells-api',
    version: '0.1.0',
    status: 'running',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/health',
      products: '/api/products',
      productStats: '/api/products/stats',
      mqtt: '/api/mqtt/mqtt/status',
      devices: '/api/mqtt/devices/:deviceId/telemetry',
      describe: '/api/describe.xml',
      state: '/api/state.xml',
    },
  });
});

const server = createServer(app);
const controlHost = MQTTController.host();
attachControlGateway(server, createMotionPublisher(controlHost.publish), {
  authenticate: authorizeRoamingRoostControl,
  canPublish: deviceId => process.env.TC_CONTROL_LIVE === '1' && AUTH_ENABLED && !controlHost.estopLatched(deviceId),
});
server.listen(PORT, HOST, () => {
  const lan = HOST === '0.0.0.0' ? lanAddress() : null;
  const lanLine = lan
    ? `║  LAN:   http://${lan}:${PORT}  (open this on a phone / other laptop)`
    : `║  (loopback only — set HOST=0.0.0.0 to reach from other devices)`;
  console.log(`
╔════════════════════════════════════════════════════════╗
║  Tender Cells API Server                              ║
║  Local: http://localhost:${PORT}
${lanLine}
╚════════════════════════════════════════════════════════╝

Endpoints:
  GET  /health                            — Health check
  GET  /api/status                        — API status
  GET  /api/mqtt/mqtt/status              — MQTT broker status
  POST /api/mqtt/mqtt/connect             — Connect to MQTT broker
  GET  /api/mqtt/devices/:id/telemetry    — Device sensor data
  GET  /api/mqtt/devices/:id/state        — Device state
  GET  /api/mqtt/devices/:id/alerts       — Device alerts
  POST /api/mqtt/devices/:id/claim        — Claim device to account (auth)
  POST /api/mqtt/devices/:id/door         — Control door (open|close)
  POST /api/mqtt/devices/:id/drive        — Drive rover (forward|back|left|right|stop)
  POST /api/mqtt/devices/:id/feed         — Dispense feed
  POST /api/mqtt/devices/:id/clean        — Start cleaning cycle
  POST /api/mqtt/devices/:id/arm          — Control arm joints
  POST /api/mqtt/devices/:id/estop        — Emergency stop

MQTT Broker: ${process.env.MQTT_BROKER || 'localhost:1883'}
  `);
});
