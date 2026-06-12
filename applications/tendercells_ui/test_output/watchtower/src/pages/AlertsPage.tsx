import { useState } from 'react'
import { Box, Typography, Card, CardContent, Chip, Stack, Button, Grid } from '@mui/material'
import { WarningAmber as WarningIcon, CheckCircle as CheckIcon } from '@mui/icons-material'
import { PredatorAlert } from '../types/camera'

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<PredatorAlert[]>([
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
    {
      id: 'alert_003',
      type: 'predator',
      confidence: 0.92,
      timestamp: Date.now() - 3600000,
      cameraId: 'cam_001',
      cameraPosition: 'north',
      description: 'Coyote spotted at property boundary',
      acknowledged: true,
      notified: true,
    },
  ])

  const handleAcknowledge = (alertId: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, acknowledged: true } : a))
    )
  }

  const formatTime = (timestamp: number) => {
    const now = Date.now()
    const diffSecs = Math.floor((now - timestamp) / 1000)
    if (diffSecs < 60) return 'Just now'
    if (diffSecs < 3600) return `${Math.floor(diffSecs / 60)}m ago`
    if (diffSecs < 86400) return `${Math.floor(diffSecs / 3600)}h ago`
    return `${Math.floor(diffSecs / 86400)}d ago`
  }

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ color: '#C8B882', mb: 1 }}>
          Alert History
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {alerts.filter((a) => !a.acknowledged).length} unacknowledged alerts
        </Typography>
      </Box>

      <Grid container spacing={2}>
        {alerts.map((alert) => (
          <Grid item xs={12} key={alert.id}>
            <Card
              sx={{
                bgcolor: '#1A3D2B',
                borderLeft: `4px solid ${
                  alert.type === 'predator'
                    ? alert.confidence > 0.8
                      ? '#CC3333'
                      : '#E8A020'
                    : '#4A7C59'
                }`,
              }}
            >
              <CardContent>
                <Stack spacing={2}>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                    <Stack spacing={1} flex={1}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        {alert.type === 'predator' ? (
                          <WarningIcon sx={{ color: '#CC3333' }} />
                        ) : (
                          <CheckIcon sx={{ color: '#4A7C59' }} />
                        )}
                        <Typography variant="h6" sx={{ color: '#C8B882' }}>
                          {alert.type === 'predator' ? 'Predator Alert' : 'Motion Detected'}
                        </Typography>
                        <Chip
                          label={`${(alert.confidence * 100).toFixed(0)}% confidence`}
                          size="small"
                          variant="outlined"
                          sx={{
                            borderColor: '#C8B882',
                            color: '#C8B882',
                          }}
                        />
                        {!alert.acknowledged && (
                          <Chip
                            label="NEW"
                            size="small"
                            sx={{
                              bgcolor: '#CC3333',
                              color: '#fff',
                            }}
                          />
                        )}
                      </Stack>

                      <Typography variant="body2" sx={{ color: '#F0EDE4' }}>
                        {alert.description}
                      </Typography>

                      <Stack direction="row" spacing={2} sx={{ typography: 'caption', color: 'text.secondary' }}>
                        <span>📷 {alert.cameraPosition.toUpperCase()} camera</span>
                        <span>🕐 {formatTime(alert.timestamp)}</span>
                      </Stack>
                    </Stack>

                    {!alert.acknowledged && (
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => handleAcknowledge(alert.id)}
                        sx={{
                          borderColor: '#4A7C59',
                          color: '#4A7C59',
                          '&:hover': { bgcolor: '#4A7C59', color: '#0D2B1E' },
                        }}
                      >
                        Acknowledge
                      </Button>
                    )}
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  )
}
