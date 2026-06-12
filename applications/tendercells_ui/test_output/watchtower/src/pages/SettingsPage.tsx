import { useState } from 'react'
import {
  Box,
  Typography,
  Card,
  CardContent,
  Stack,
  Switch,
  TextField,
  Button,
  Divider,
  Select,
  MenuItem,
} from '@mui/material'
import { Save as SaveIcon } from '@mui/icons-material'

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    deviceName: 'WatchTower AI - Property Perimeter',
    location: 'Backyard Perimeter',
    recordingEnabled: true,
    motionDetection: true,
    predatorDetection: true,
    alertFrequency: 'immediate',
    resolution: '1080p',
    fps: 30,
    autoRetention: 30,
  })

  const handleChange = (field: string, value: any) => {
    setSettings((prev) => ({ ...prev, [field]: value }))
  }

  const handleSave = () => {
    console.log('Settings saved:', settings)
  }

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ color: '#C8B882', mb: 1 }}>
          Settings
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Configure device and monitoring preferences
        </Typography>
      </Box>

      <Stack spacing={2}>
        {/* Device Settings */}
        <Card sx={{ bgcolor: '#1A3D2B' }}>
          <CardContent>
            <Typography variant="h6" sx={{ color: '#C8B882', mb: 2 }}>
              Device Settings
            </Typography>
            <Stack spacing={2}>
              <TextField
                label="Device Name"
                fullWidth
                value={settings.deviceName}
                onChange={(e) => handleChange('deviceName', e.target.value)}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: '#F0EDE4',
                  },
                }}
              />
              <TextField
                label="Location"
                fullWidth
                value={settings.location}
                onChange={(e) => handleChange('location', e.target.value)}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: '#F0EDE4',
                  },
                }}
              />
            </Stack>
          </CardContent>
        </Card>

        {/* Recording Settings */}
        <Card sx={{ bgcolor: '#1A3D2B' }}>
          <CardContent>
            <Typography variant="h6" sx={{ color: '#C8B882', mb: 2 }}>
              Recording Settings
            </Typography>
            <Stack spacing={2}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="body2">Enable Recording</Typography>
                <Switch
                  checked={settings.recordingEnabled}
                  onChange={(e) => handleChange('recordingEnabled', e.target.checked)}
                  sx={{
                    '& .MuiSwitch-switchBase.Mui-checked': {
                      color: '#4A7C59',
                    },
                  }}
                />
              </Stack>

              <Divider sx={{ borderColor: '#0D2B1E' }} />

              <Select
                value={settings.resolution}
                onChange={(e) => handleChange('resolution', e.target.value)}
                fullWidth
              >
                <MenuItem value="480p">480p (Low - Fast)</MenuItem>
                <MenuItem value="720p">720p (HD - Balanced)</MenuItem>
                <MenuItem value="1080p">1080p (Full HD - Quality)</MenuItem>
              </Select>

              <TextField
                label="Frame Rate (fps)"
                type="number"
                inputProps={{ min: 5, max: 60 }}
                value={settings.fps}
                onChange={(e) => handleChange('fps', parseInt(e.target.value))}
              />

              <TextField
                label="Auto-delete after (days)"
                type="number"
                inputProps={{ min: 7, max: 365 }}
                value={settings.autoRetention}
                onChange={(e) => handleChange('autoRetention', parseInt(e.target.value))}
                helperText="Recordings older than this will be automatically deleted"
              />
            </Stack>
          </CardContent>
        </Card>

        {/* Detection Settings */}
        <Card sx={{ bgcolor: '#1A3D2B' }}>
          <CardContent>
            <Typography variant="h6" sx={{ color: '#C8B882', mb: 2 }}>
              Detection Settings
            </Typography>
            <Stack spacing={2}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="body2">Motion Detection</Typography>
                <Switch
                  checked={settings.motionDetection}
                  onChange={(e) => handleChange('motionDetection', e.target.checked)}
                  sx={{
                    '& .MuiSwitch-switchBase.Mui-checked': {
                      color: '#4A7C59',
                    },
                  }}
                />
              </Stack>

              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="body2">Predator Detection (AI)</Typography>
                <Switch
                  checked={settings.predatorDetection}
                  onChange={(e) => handleChange('predatorDetection', e.target.checked)}
                  sx={{
                    '& .MuiSwitch-switchBase.Mui-checked': {
                      color: '#4A7C59',
                    },
                  }}
                />
              </Stack>

              <Divider sx={{ borderColor: '#0D2B1E' }} />

              <Select
                value={settings.alertFrequency}
                onChange={(e) => handleChange('alertFrequency', e.target.value)}
                fullWidth
              >
                <MenuItem value="immediate">Immediate</MenuItem>
                <MenuItem value="batched">Batched (5 min)</MenuItem>
                <MenuItem value="hourly">Hourly Digest</MenuItem>
              </Select>
            </Stack>
          </CardContent>
        </Card>

        {/* Save */}
        <Button
          variant="contained"
          startIcon={<SaveIcon />}
          onClick={handleSave}
          sx={{
            bgcolor: '#4A7C59',
            '&:hover': { bgcolor: '#5a8c69' },
            py: 1.5,
          }}
        >
          Save Settings
        </Button>
      </Stack>
    </Box>
  )
}
