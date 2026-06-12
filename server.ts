// Express backend server for Tender Cells
// Runs on port 3000 (separate from web app on :5173)
// Last updated: 2026-06-11

import express from 'express';
import cors from 'cors';
import { json } from 'express';

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(json());

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'tender-cells-backend',
    version: '0.1.0',
  });
});

// Device API endpoints
app.get('/api/devices', (req, res) => {
  res.json({
    devices: [
      {
        id: 'chicken_tender_001',
        nickname: 'Main Coop',
        status: 'online',
        lastUpdate: Date.now(),
      },
      {
        id: 'chicken_tender_002',
        nickname: 'Secondary Coop',
        status: 'offline',
        lastUpdate: Date.now() - 3600000,
      },
      {
        id: 'watchtower_001',
        nickname: 'North Perimeter',
        status: 'online',
        lastUpdate: Date.now(),
      },
    ],
  });
});

// Device telemetry
app.get('/api/devices/:deviceId/telemetry', (req, res) => {
  const { deviceId } = req.params;
  res.json({
    deviceId,
    readings: [
      {
        timestamp: Date.now(),
        temperature: 72.5,
        humidity: 65,
        ammonia: 3.2,
        feedLevel: 85,
        waterLevel: 92,
        chickenCount: 6,
        doorState: 'closed',
        systemState: 'idle',
      },
    ],
  });
});

// Device commands (webhook receiver for MQTT bridge)
app.post('/api/devices/:deviceId/command', (req, res) => {
  const { deviceId } = req.params;
  const { action, payload } = req.body;

  console.log(`[COMMAND] Device: ${deviceId}, Action: ${action}`, payload);

  // TODO: Publish to MQTT broker
  res.json({
    success: true,
    deviceId,
    action,
    message: 'Command queued',
  });
});

// Schedules API
app.get('/api/devices/:deviceId/schedules', (req, res) => {
  const { deviceId } = req.params;
  res.json({
    deviceId,
    schedules: [
      {
        id: 'sched_001',
        action: 'feed',
        cronExpression: '0 7 * * *',
        enabled: true,
      },
      {
        id: 'sched_002',
        action: 'feed',
        cronExpression: '0 18 * * *',
        enabled: true,
      },
    ],
  });
});

// Alerts API
app.get('/api/devices/:deviceId/alerts', (req, res) => {
  const { deviceId } = req.params;
  res.json({
    deviceId,
    alerts: [],
  });
});

// MQTT status
app.get('/api/mqtt/status', (req, res) => {
  res.json({
    broker: 'localhost:1883',
    connected: false,
    lastUpdate: Date.now(),
    message: 'Broker not running. Start with: mosquitto -c mosquitto.conf',
  });
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    error: err.message || 'Internal server error',
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════╗
║  Tender Cells Backend Server                          ║
║  http://localhost:${PORT}                                 ║
╚════════════════════════════════════════════════════════╝

API Endpoints:
  GET  /health                           — Health check
  GET  /api/devices                      — List all devices
  GET  /api/devices/:id/telemetry        — Device sensor data
  POST /api/devices/:id/command          — Send hardware command
  GET  /api/devices/:id/schedules        — Device schedules
  GET  /api/devices/:id/alerts           — Device alerts
  GET  /api/mqtt/status                  — MQTT broker status

Web App:
  http://localhost:5173                  — React web interface

MQTT Broker:
  localhost:1883                         — Not running
  Start with: mosquitto -c mosquitto.conf
  `);
});

export default app;
