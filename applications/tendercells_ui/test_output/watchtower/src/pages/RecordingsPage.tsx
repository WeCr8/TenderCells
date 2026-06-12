import { useState } from 'react'
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Button,
  Stack,
  Select,
  MenuItem,
  LinearProgress,
  Chip,
} from '@mui/material'
import {
  Download as DownloadIcon,
  Delete as DeleteIcon,
  PlayArrow as PlayIcon,
} from '@mui/icons-material'

interface Recording {
  id: string
  cameraId: string
  cameraName: string
  startTime: number
  duration: number
  size: number
  quality: '1080p' | '720p' | '480p'
  hasAlert: boolean
}

export default function RecordingsPage() {
  const [recordings] = useState<Recording[]>([
    {
      id: 'rec_001',
      cameraId: 'cam_001',
      cameraName: 'North Camera',
      startTime: Date.now() - 7200000,
      duration: 3600,
      size: 850,
      quality: '1080p',
      hasAlert: true,
    },
    {
      id: 'rec_002',
      cameraId: 'cam_002',
      cameraName: 'East Camera',
      startTime: Date.now() - 3600000,
      duration: 3600,
      size: 750,
      quality: '1080p',
      hasAlert: false,
    },
    {
      id: 'rec_003',
      cameraId: 'cam_001',
      cameraName: 'North Camera',
      startTime: Date.now() - 86400000,
      duration: 3600,
      size: 820,
      quality: '1080p',
      hasAlert: true,
    },
  ])
  const [filter, setFilter] = useState('all')
  const [dateRange, setDateRange] = useState('7days')

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString()
  }

  const formatSize = (bytes: number) => {
    return `${(bytes / 1024).toFixed(1)} MB`
  }

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    return `${hours}h ${mins}m`
  }

  const filteredRecordings =
    filter === 'alerts'
      ? recordings.filter((r) => r.hasAlert)
      : filter === 'recent'
        ? recordings.slice(0, 3)
        : recordings

  const totalStorage = recordings.reduce((sum, r) => sum + r.size, 0)

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ color: '#C8B882', mb: 1 }}>
          Recordings
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Manage and download camera footage
        </Typography>
      </Box>

      {/* Storage Info */}
      <Card sx={{ bgcolor: '#1A3D2B', mb: 3 }}>
        <CardContent>
          <Stack spacing={2}>
            <Box>
              <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Storage Used
                </Typography>
                <Typography variant="body2" sx={{ color: '#C8B882' }}>
                  {formatSize(totalStorage)} / 256 GB
                </Typography>
              </Stack>
              <LinearProgress
                variant="determinate"
                value={(totalStorage / 256000) * 100}
                sx={{
                  height: 8,
                  borderRadius: 4,
                  bgcolor: '#0D2B1E',
                  '& .MuiLinearProgress-bar': {
                    bgcolor: '#4A7C59',
                  },
                }}
              />
            </Box>
          </Stack>
        </CardContent>
      </Card>

      {/* Filters */}
      <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
        <Select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          sx={{ minWidth: 150, bgcolor: '#1A3D2B' }}
        >
          <MenuItem value="all">All Recordings</MenuItem>
          <MenuItem value="alerts">With Alerts</MenuItem>
          <MenuItem value="recent">Recent</MenuItem>
        </Select>

        <Select
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value)}
          sx={{ minWidth: 150, bgcolor: '#1A3D2B' }}
        >
          <MenuItem value="1day">Last 24 hours</MenuItem>
          <MenuItem value="7days">Last 7 days</MenuItem>
          <MenuItem value="30days">Last 30 days</MenuItem>
        </Select>
      </Stack>

      {/* Recordings Grid */}
      <Grid container spacing={2}>
        {filteredRecordings.map((recording) => (
          <Grid item xs={12} sm={6} md={4} key={recording.id}>
            <Card
              sx={{
                bgcolor: '#1A3D2B',
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
              }}
            >
              <CardMedia
                sx={{
                  height: 180,
                  background: 'linear-gradient(135deg, #2a5a3d 0%, #0D2B1E 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                }}
              >
                <PlayIcon sx={{ color: '#C8B882', fontSize: 48 }} />
                {recording.hasAlert && (
                  <Chip
                    label="Alert Recorded"
                    sx={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      bgcolor: '#CC3333',
                      color: '#fff',
                    }}
                  />
                )}
              </CardMedia>

              <CardContent sx={{ flex: 1 }}>
                <Typography variant="subtitle2" sx={{ color: '#C8B882', mb: 1 }}>
                  {recording.cameraName}
                </Typography>

                <Stack spacing={1} sx={{ mb: 2 }}>
                  <Typography variant="caption" color="text.secondary">
                    {formatTime(recording.startTime)}
                  </Typography>
                  <Stack direction="row" spacing={1}>
                    <Chip
                      label={`${formatDuration(recording.duration)}`}
                      size="small"
                      variant="outlined"
                      sx={{ borderColor: '#4A7C59', color: '#4A7C59' }}
                    />
                    <Chip
                      label={`${formatSize(recording.size)}`}
                      size="small"
                      variant="outlined"
                      sx={{ borderColor: '#C8B882', color: '#C8B882' }}
                    />
                  </Stack>
                </Stack>

                <Stack direction="row" spacing={1}>
                  <Button
                    size="small"
                    startIcon={<PlayIcon />}
                    fullWidth
                    variant="outlined"
                    sx={{
                      borderColor: '#4A7C59',
                      color: '#4A7C59',
                      '&:hover': { bgcolor: '#4A7C59', color: '#0D2B1E' },
                    }}
                  >
                    Play
                  </Button>
                  <Button
                    size="small"
                    startIcon={<DownloadIcon />}
                    sx={{ color: '#C8B882' }}
                  />
                  <Button
                    size="small"
                    startIcon={<DeleteIcon />}
                    sx={{ color: '#CC3333' }}
                  />
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  )
}
