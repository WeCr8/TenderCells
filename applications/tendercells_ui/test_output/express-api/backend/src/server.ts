// server.ts
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mqttRoutes from './routes/mqtt.routes.ts';

dotenv.config();

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
const PORT = process.env.PORT || 4000;

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

app.listen(PORT, '127.0.0.1', () => {
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
