// server.ts

// Load .env first (see loadEnv.ts — ESM evaluates imports before body code).
import './loadEnv.js';

// Start the embedded MQTT broker BEFORE importing the MQTT bridge, so the broker
// is listening when the bridge auto-connects on module load.
import './broker.js';

import express from 'express';
import cors from 'cors';
import os from 'node:os';
import mqttRoutes from './routes/mqtt.routes.js';
import productsRoutes from './routes/products.routes.js';

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
} catch (error) {
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
    },
  });
});

app.listen(PORT, HOST, () => {
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
