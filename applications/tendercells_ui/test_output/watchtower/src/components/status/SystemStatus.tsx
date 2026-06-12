import { Box, Paper, Stack, Typography, LinearProgress, Chip } from '@mui/material'
import {
  BatteryCharging20 as BatteryIcon,
  SolarPower as SolarIcon,
  Storage as StorageIcon,
  SignalCellularAlt as SignalIcon,
} from '@mui/icons-material'
import { WatchTowerDevice } from '../../types/camera'

interface SystemStatusProps {
  device: WatchTowerDevice
  unacknowledgedAlerts: number
}

export default function SystemStatus({ device, unacknowledgedAlerts }: SystemStatusProps) {
  const getStatusColor = (value: number) => {
    if (value > 60) return '#4AFF00'
    if (value > 30) return '#E8A020'
    return '#CC3333'
  }

  const storagePercent = (device.storageUsed / device.storageTotal) * 100

  return (
    <Paper sx={{ bgcolor: '#1A3D2B', p: 2 }}>
      <Typography variant="h6" sx={{ color: '#C8B882', mb: 2 }}>
        System Status
      </Typography>

      <Stack spacing={2}>
        {/* Connection Status */}
        <Box>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
            <SignalIcon sx={{ color: '#4A7C59', fontSize: 18 }} />
            <Typography variant="body2" sx={{ color: '#F0EDE4' }}>
              Connection
            </Typography>
            <Chip
              label={device.connected ? 'ONLINE' : 'OFFLINE'}
              size="small"
              sx={{
                ml: 'auto',
                bgcolor: device.connected ? '#4AFF00' : '#CC3333',
                color: device.connected ? '#0D2B1E' : '#fff',
                fontWeight: 'bold',
              }}
            />
          </Stack>
          <Typography variant="caption" color="text.secondary">
            Last seen: {new Date(device.lastSeen).toLocaleTimeString()}
          </Typography>
        </Box>

        {/* Battery */}
        <Box>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
            <BatteryIcon sx={{ color: '#4A7C59', fontSize: 18 }} />
            <Typography variant="body2" sx={{ color: '#F0EDE4', flex: 1 }}>
              Battery
            </Typography>
            <Typography variant="caption" sx={{ color: getStatusColor(device.battery) }}>
              {device.battery}%
            </Typography>
          </Stack>
          <LinearProgress
            variant="determinate"
            value={device.battery}
            sx={{
              height: 6,
              borderRadius: 3,
              bgcolor: '#0D2B1E',
              '& .MuiLinearProgress-bar': {
                bgcolor: getStatusColor(device.battery),
              },
            }}
          />
        </Box>

        {/* Solar Charge */}
        <Box>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
            <SolarIcon sx={{ color: '#FFD700', fontSize: 18 }} />
            <Typography variant="body2" sx={{ color: '#F0EDE4', flex: 1 }}>
              Solar Charge
            </Typography>
            <Typography variant="caption" sx={{ color: '#FFD700' }}>
              {device.solar}%
            </Typography>
          </Stack>
          <LinearProgress
            variant="determinate"
            value={device.solar}
            sx={{
              height: 6,
              borderRadius: 3,
              bgcolor: '#0D2B1E',
              '& .MuiLinearProgress-bar': {
                bgcolor: '#FFD700',
              },
            }}
          />
        </Box>

        {/* Storage */}
        <Box>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
            <StorageIcon sx={{ color: '#4A7C59', fontSize: 18 }} />
            <Typography variant="body2" sx={{ color: '#F0EDE4', flex: 1 }}>
              Storage
            </Typography>
            <Typography variant="caption" sx={{ color: '#C8B882' }}>
              {device.storageUsed} / {device.storageTotal} GB
            </Typography>
          </Stack>
          <LinearProgress
            variant="determinate"
            value={storagePercent}
            sx={{
              height: 6,
              borderRadius: 3,
              bgcolor: '#0D2B1E',
              '& .MuiLinearProgress-bar': {
                bgcolor: getStatusColor(100 - storagePercent),
              },
            }}
          />
        </Box>

        {/* Alerts Badge */}
        {unacknowledgedAlerts > 0 && (
          <Box
            sx={{
              p: 1.5,
              bgcolor: '#5a2a2a',
              border: '1px solid #CC3333',
              borderRadius: 1,
              textAlign: 'center',
            }}
          >
            <Chip
              label={`${unacknowledgedAlerts} unacknowledged alert${unacknowledgedAlerts !== 1 ? 's' : ''}`}
              icon={
                <Box
                  component="span"
                  sx={{
                    width: 8,
                    height: 8,
                    bgcolor: '#CC3333',
                    borderRadius: '50%',
                    display: 'inline-block',
                  }}
                />
              }
              sx={{
                bgcolor: '#CC3333',
                color: '#fff',
              }}
            />
          </Box>
        )}
      </Stack>
    </Paper>
  )
}
