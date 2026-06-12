import { Box, Stack, Typography, Chip } from '@mui/material'
import { WarningAmber as WarningIcon } from '@mui/icons-material'
import { PredatorAlert } from '../../types/camera'

interface AlertsPanelProps {
  alerts: PredatorAlert[]
  maxHeight?: number | string
}

export default function AlertsPanel({ alerts, maxHeight = 'auto' }: AlertsPanelProps) {
  const unacknowledged = alerts.filter((a) => !a.acknowledged)

  const formatTime = (timestamp: number) => {
    const now = Date.now()
    const diffSecs = Math.floor((now - timestamp) / 1000)
    if (diffSecs < 60) return 'Just now'
    if (diffSecs < 3600) return `${Math.floor(diffSecs / 60)}m ago`
    return `${Math.floor(diffSecs / 3600)}h ago`
  }

  const getAlertColor = (type: string, confidence: number) => {
    if (type === 'predator') {
      return confidence > 0.8 ? '#CC3333' : '#E8A020'
    }
    return '#4A7C59'
  }

  return (
    <Box sx={{ maxHeight, overflow: 'auto' }}>
      {unacknowledged.length === 0 && alerts.length === 0 ? (
        <Box
          sx={{
            textAlign: 'center',
            py: 3,
            color: 'text.secondary',
          }}
        >
          <Typography variant="body2">No alerts</Typography>
        </Box>
      ) : unacknowledged.length === 0 ? (
        <Box
          sx={{
            textAlign: 'center',
            py: 3,
            color: 'text.secondary',
          }}
        >
          <Typography variant="body2">All clear ✓</Typography>
        </Box>
      ) : (
        <Stack spacing={1.5}>
          {unacknowledged.map((alert) => (
            <Box
              key={alert.id}
              sx={{
                p: 1.5,
                bgcolor: '#0D2B1E',
                border: `1px solid ${getAlertColor(alert.type, alert.confidence)}`,
                borderRadius: 1,
                display: 'flex',
                gap: 1,
              }}
            >
              <WarningIcon
                sx={{
                  color: getAlertColor(alert.type, alert.confidence),
                  fontSize: 18,
                  flexShrink: 0,
                  mt: 0.25,
                }}
              />

              <Stack spacing={0.5} sx={{ flex: 1, minWidth: 0 }}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography
                    variant="subtitle2"
                    sx={{
                      color: '#C8B882',
                      fontSize: '0.85rem',
                      flex: 1,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {alert.type === 'predator' ? '🚨 Predator' : '📹 Motion'}
                  </Typography>
                  <Chip
                    label={`${(alert.confidence * 100).toFixed(0)}%`}
                    size="small"
                    sx={{
                      height: 20,
                      fontSize: '0.65rem',
                      bgcolor: getAlertColor(alert.type, alert.confidence),
                      color: '#fff',
                    }}
                  />
                </Stack>

                <Typography
                  variant="caption"
                  sx={{
                    color: '#F0EDE4',
                    fontSize: '0.75rem',
                    lineHeight: 1.3,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                  }}
                >
                  {alert.description}
                </Typography>

                <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                    {alert.cameraPosition.toUpperCase()}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                    {formatTime(alert.timestamp)}
                  </Typography>
                </Stack>
              </Stack>
            </Box>
          ))}
        </Stack>
      )}
    </Box>
  )
}
