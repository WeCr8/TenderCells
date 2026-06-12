import { useEffect, useRef } from 'react'
import { Box, Grid, Paper, Typography, Stack, Chip, CircularProgress } from '@mui/material'
import {
  CameraAlt as CameraIcon,
  SignalCellularAlt as SignalIcon,
} from '@mui/icons-material'
import { CameraFeed } from '../../types/camera'

interface CameraDomeGridProps {
  cameras: CameraFeed[]
}

export default function CameraDomeGrid({ cameras }: CameraDomeGridProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Draw dome visualization
    const w = canvas.width
    const h = canvas.height
    const cx = w / 2
    const cy = h / 2
    const radius = 80

    // Background
    ctx.fillStyle = '#0D2B1E'
    ctx.fillRect(0, 0, w, h)

    // Dome circle
    ctx.strokeStyle = '#4A7C59'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(cx, cy, radius, 0, Math.PI * 2)
    ctx.stroke()

    // Camera positions (120° apart)
    cameras.forEach((camera, idx) => {
      const angle = (idx * 120 * Math.PI) / 180 - Math.PI / 2
      const x = cx + Math.cos(angle) * radius
      const y = cy + Math.sin(angle) * radius

      // Camera indicator
      const bgColor = camera.connected ? '#4AFF00' : '#CC3333'
      ctx.fillStyle = bgColor
      ctx.beginPath()
      ctx.arc(x, y, 6, 0, Math.PI * 2)
      ctx.fill()

      // Camera label background
      ctx.fillStyle = 'rgba(13, 43, 30, 0.8)'
      ctx.fillRect(x - 35, y + 15, 70, 16)

      // Camera label
      ctx.fillStyle = '#C8B882'
      ctx.font = '11px Arial'
      ctx.textAlign = 'center'
      ctx.fillText(camera.position.toUpperCase(), x, y + 26)
    })

    // Center label
    ctx.fillStyle = '#C8B882'
    ctx.font = 'bold 14px Arial'
    ctx.textAlign = 'center'
    ctx.fillText('WatchTower', cx, cy - 5)
    ctx.font = '10px Arial'
    ctx.fillStyle = '#8A7D55'
    ctx.fillText('360° Coverage', cx, cy + 10)
  }, [cameras])


  const getSignalLabel = (signal?: number) => {
    if (!signal) return 'No signal'
    if (signal > -50) return 'Excellent'
    if (signal > -70) return 'Good'
    if (signal > -80) return 'Fair'
    return 'Poor'
  }

  return (
    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      {/* Dome Visualization */}
      <Box sx={{ mb: 3, textAlign: 'center' }}>
        <canvas
          ref={canvasRef}
          width={400}
          height={300}
          style={{
            maxWidth: '100%',
            height: 'auto',
            border: '1px solid #4A7C59',
            borderRadius: 8,
            background: '#0D2B1E',
          }}
        />
      </Box>

      {/* Camera Grid */}
      <Grid container spacing={2} sx={{ flex: 1 }}>
        {cameras.map((camera) => (
          <Grid item xs={12} sm={6} md={4} key={camera.id}>
            <Paper
              sx={{
                bgcolor: '#0D2B1E',
                p: 2,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                border: camera.connected ? '2px solid #4A7C59' : '2px solid #CC3333',
                position: 'relative',
              }}
            >
              {/* Feed Preview */}
              <Box
                sx={{
                  width: '100%',
                  aspectRatio: '16/9',
                  bgcolor: '#1A3D2B',
                  borderRadius: 1,
                  mb: 1.5,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {/* Simulated feed gradient */}
                <Box
                  sx={{
                    width: '100%',
                    height: '100%',
                    background: `linear-gradient(135deg,
                      ${camera.connected ? '#2a5a3d' : '#5a2a2a'} 0%,
                      ${camera.connected ? '#1A3D2B' : '#3a1a1a'} 100%)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                  }}
                >
                  <CameraIcon
                    sx={{
                      fontSize: 40,
                      color: camera.connected ? '#4A7C59' : '#CC3333',
                    }}
                  />

                  {!camera.connected && (
                    <CircularProgress
                      sx={{
                        position: 'absolute',
                        color: '#CC3333',
                      }}
                      size={50}
                    />
                  )}
                </Box>

                {/* Status badge */}
                <Chip
                  label={camera.connected ? 'LIVE' : 'OFFLINE'}
                  size="small"
                  sx={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    bgcolor: camera.connected ? '#4AFF00' : '#CC3333',
                    color: camera.connected ? '#0D2B1E' : '#fff',
                    fontWeight: 'bold',
                  }}
                />
              </Box>

              {/* Camera Info */}
              <Stack spacing={1.5} sx={{ flex: 1 }}>
                <Box>
                  <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
                    <CameraIcon sx={{ fontSize: 16, color: '#C8B882' }} />
                    <Typography variant="subtitle2" sx={{ color: '#C8B882' }}>
                      {camera.name}
                    </Typography>
                  </Stack>
                  <Typography variant="caption" color="text.secondary">
                    {camera.position.toUpperCase()} position
                  </Typography>
                </Box>

                {/* Specs */}
                <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 0.5 }}>
                  <Chip
                    label={`${camera.fps}fps`}
                    size="small"
                    variant="outlined"
                    sx={{
                      borderColor: '#4A7C59',
                      color: '#4A7C59',
                      fontSize: '0.65rem',
                    }}
                  />
                  <Chip
                    label={camera.resolution}
                    size="small"
                    variant="outlined"
                    sx={{
                      borderColor: '#C8B882',
                      color: '#C8B882',
                      fontSize: '0.65rem',
                    }}
                  />
                </Stack>

                {/* Signal */}
                {camera.signal && (
                  <Stack direction="row" alignItems="center" spacing={0.5}>
                    <SignalIcon sx={{ fontSize: 14, color: '#E8A020' }} />
                    <Typography variant="caption" color="text.secondary">
                      {getSignalLabel(camera.signal)} ({camera.signal} dBm)
                    </Typography>
                  </Stack>
                )}

                {/* Motion Detection */}
                <Stack direction="row" spacing={1} sx={{ mt: 'auto' }}>
                  {camera.motionDetection && (
                    <Chip
                      label="Motion"
                      size="small"
                      variant="filled"
                      sx={{
                        bgcolor: '#4A7C59',
                        color: '#0D2B1E',
                        fontSize: '0.7rem',
                      }}
                    />
                  )}
                  {camera.recordingEnabled && (
                    <Chip
                      label="Recording"
                      size="small"
                      variant="filled"
                      sx={{
                        bgcolor: '#CC3333',
                        color: '#fff',
                        fontSize: '0.7rem',
                      }}
                    />
                  )}
                </Stack>

                {/* Last seen */}
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                  {camera.lastSeen || 'Connecting...'}
                </Typography>
              </Stack>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Box>
  )
}
