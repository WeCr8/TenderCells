// server.ts
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initializeFirebaseAdmin } from './config/firebase-admin.js';
import mqttRoutes from './routes/mqtt.routes.js';

dotenv.config();

// Initialize Firebase Admin SDK
try {
  initializeFirebaseAdmin();
} catch (error) {
  console.error('Failed to initialize Firebase Admin SDK:', error);
  console.warn('Server will continue without Firebase Admin SDK');
}

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// MQTT hardware control routes
app.use('/api/mqtt', mqttRoutes);

// API status dashboard
app.get('/api/status', (req, res) => {
  res.json({
    service: 'tender-cells-api',
    version: '0.1.0',
    status: 'running',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/health',
      mqtt: '/api/mqtt/mqtt/status',
      devices: '/api/mqtt/devices/:deviceId/telemetry',
    },
  });
});

app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════╗
║  Tender Cells API Server                              ║
║  http://localhost:${PORT}                                 ║
╚════════════════════════════════════════════════════════╝

Endpoints:
  GET  /health                            — Health check
  GET  /api/status                        — API status
  GET  /api/mqtt/mqtt/status              — MQTT broker status
  POST /api/mqtt/mqtt/connect             — Connect to MQTT broker
  GET  /api/mqtt/devices/:id/telemetry    — Device sensor data
  GET  /api/mqtt/devices/:id/state        — Device state
  GET  /api/mqtt/devices/:id/alerts       — Device alerts
  POST /api/mqtt/devices/:id/door         — Control door (open|close)
  POST /api/mqtt/devices/:id/feed         — Dispense feed
  POST /api/mqtt/devices/:id/clean        — Start cleaning cycle
  POST /api/mqtt/devices/:id/arm          — Control arm joints
  POST /api/mqtt/devices/:id/estop        — Emergency stop

MQTT Broker: ${process.env.MQTT_BROKER || 'localhost:1883'}
  `);
});
