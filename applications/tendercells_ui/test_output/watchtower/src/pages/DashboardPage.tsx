import { useState } from 'react'
import { Box, Typography, Grid, Paper } from '@mui/material'
import CameraDomeGrid from '../components/camera/CameraDomeGrid'
import AlertsPanel from '../components/alerts/AlertsPanel'
import SystemStatus from '../components/status/SystemStatus'
import { WatchTowerDevice } from '../types/camera'

export default function DashboardPage() {
  const [device] = useState<WatchTowerDevice>({
    id: 'wt_001',
    name: 'WatchTower AI - Property Perimeter',
    location: 'Backyard Perimeter',
    installed: '2026-05-15',
    battery: 85,
    solar: 65,
    connected: true,
    lastSeen: Date.now(),
    recordingEnabled: true,
    storageUsed: 145,
    storageTotal: 256,
    cameras: [
      {
        id: 'cam_001',
        deviceId: 'wt_001',
        name: 'North Camera',
        position: 'north',
        resolution: '1080p',
        fps: 30,
        connected: true,
        lastSeen: 'Just now',
        signal: -45,
        motionDetection: true,
        recordingEnabled: true,
      },
      {
        id: 'cam_002',
        deviceId: 'wt_001',
        name: 'East Camera',
        position: 'east',
        resolution: '1080p',
        fps: 30,
        connected: true,
        lastSeen: 'Just now',
        signal: -50,
        motionDetection: true,
        recordingEnabled: true,
      },
      {
        id: 'cam_003',
        deviceId: 'wt_001',
        name: 'West Camera',
        position: 'west',
        resolution: '1080p',
        fps: 30,
        connected: false,
        lastSeen: '3 minutes ago',
        signal: -75,
        motionDetection: true,
        recordingEnabled: false,
      },
    ],
    alerts: [
      {
        id: 'alert_001',
        type: 'predator',
        confidence: 0.87,
        timestamp: Date.now() - 120000,
        cameraId: 'cam_001',
        cameraPosition: 'north',
        description: 'Possible raccoon detected near northwest corner',
        acknowledged: false,
        notified: true,
      },
      {
        id: 'alert_002',
        type: 'motion',
        confidence: 0.65,
        timestamp: Date.now() - 300000,
        cameraId: 'cam_002',
        cameraPosition: 'east',
        description: 'Motion detected at east boundary fence',
        acknowledged: true,
        notified: true,
      },
    ],
  })

  const unacknowledgedAlerts = device.alerts.filter((a) => !a.acknowledged)

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ color: '#C8B882', mb: 1 }}>
          WatchTower AI™ Predator Monitor
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Real-time 360° coverage • Motion & predator detection
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Camera Dome Grid */}
        <Grid item xs={12} lg={8}>
          <Paper
            sx={{
              bgcolor: '#1A3D2B',
              p: 2,
              minHeight: 600,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <Typography variant="h6" sx={{ color: '#C8B882', mb: 2 }}>
              Live Camera Feeds
            </Typography>
            <CameraDomeGrid cameras={device.cameras} />
          </Paper>
        </Grid>

        {/* Right Sidebar */}
        <Grid item xs={12} lg={4}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {/* System Status */}
            <SystemStatus
              device={device}
              unacknowledgedAlerts={unacknowledgedAlerts.length}
            />

            {/* Recent Alerts */}
            <Paper sx={{ bgcolor: '#1A3D2B', p: 2 }}>
              <Typography variant="h6" sx={{ color: '#C8B882', mb: 2 }}>
                Recent Alerts ({unacknowledgedAlerts.length} new)
              </Typography>
              <AlertsPanel alerts={device.alerts} maxHeight={350} />
            </Paper>
          </Box>
        </Grid>
      </Grid>
    </Box>
  )
}
