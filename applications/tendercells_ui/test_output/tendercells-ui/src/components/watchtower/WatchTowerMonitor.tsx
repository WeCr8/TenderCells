// WatchTowerMonitor.tsx - WatchTower AI predator detection display
import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  LinearProgress,
  Chip,
  Stack,
  Card,
  CardContent,
} from '@mui/material';
import { WATCHTOWER_SPECS } from '../../types/watchtower';
import SolarPowerIcon from '@mui/icons-material/SolarPower';
import BatteryCharging60Icon from '@mui/icons-material/BatteryCharging60';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import SignalCellularAltIcon from '@mui/icons-material/SignalCellularAlt';

interface WatchTowerMonitorProps {
  battery?: number;
  solarCharge?: number;
  connected?: boolean;
  lastSeen?: string;
}

export default function WatchTowerMonitor({
  battery = 85,
  solarCharge = 60,
  connected = true,
  lastSeen = 'Just now',
}: WatchTowerMonitorProps) {
  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" gutterBottom sx={{ color: '#C8B882', fontWeight: 'bold' }}>
          {WATCHTOWER_SPECS.name}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {WATCHTOWER_SPECS.description}
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Hardware Visualization */}
        <Grid item xs={12} md={5}>
          <Paper
            sx={{
              p: 3,
              background: 'linear-gradient(180deg, #1B542B 0%, #165024 100%)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: 400,
              position: 'relative',
            }}
          >
            {/* WatchTower SVG */}
            <svg width="200" height="250" viewBox="0 0 200 250">
              {/* Solar panel */}
              <rect x="60" y="10" width="80" height="50" fill="#333" stroke="#666" strokeWidth="2" rx="4" />
              <g stroke="#444" strokeWidth="1" opacity="0.5">
                {Array.from({ length: 4 }).map((_, i) => (
                  <line key={`v${i}`} x1={70 + i * 20} y1="10" x2={70 + i * 20} y2="60" />
                ))}
                {Array.from({ length: 3 }).map((_, i) => (
                  <line key={`h${i}`} x1="60" y1={20 + i * 15} x2="140" y2={20 + i * 15} />
                ))}
              </g>

              {/* Pole */}
              <rect x="90" y="60" width="20" height="80" fill="#666" />

              {/* Dome main body */}
              <circle cx="100" cy="150" r="60" fill="#444" stroke="#999" strokeWidth="2" />

              {/* Camera openings (3 cameras at 120° intervals) */}
              {[0, 120, 240].map((angle) => {
                const rad = (angle * Math.PI) / 180;
                const x = 100 + Math.cos(rad) * 45;
                const y = 150 + Math.sin(rad) * 45;
                return (
                  <circle key={`cam${angle}`} cx={x} cy={y} r="8" fill="#222" stroke="#666" strokeWidth="1" />
                );
              })}

              {/* Dome top/cap */}
              <ellipse cx="100" cy="150" rx="60" ry="20" fill="#666" opacity="0.3" />

              {/* LED indicator */}
              <circle cx="100" cy="130" r="4" fill={connected ? '#4AFF00' : '#FF4A4A'} />
              <circle cx="100" cy="130" r="4" fill={connected ? '#4AFF00' : '#FF4A4A'} opacity="0.3" r="8" />
            </svg>

            {/* Status indicator */}
            <Box
              sx={{
                position: 'absolute',
                bottom: 20,
                display: 'flex',
                gap: 1,
                alignItems: 'center',
              }}
            >
              <Box
                sx={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  bgcolor: connected ? '#4AFF00' : '#FF4A4A',
                  animation: connected ? 'pulse 2s infinite' : 'none',
                  '@keyframes pulse': {
                    '0%, 100%': { opacity: 1 },
                    '50%': { opacity: 0.5 },
                  },
                }}
              />
              <Typography variant="caption" sx={{ color: '#E4E7E5' }}>
                {connected ? 'Connected' : 'Offline'}
              </Typography>
            </Box>
          </Paper>
        </Grid>

        {/* Specs and Status */}
        <Grid item xs={12} md={7}>
          <Stack spacing={2}>
            {/* Power Status */}
            <Card sx={{ bgcolor: '#1A3D2B' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <BatteryCharging60Icon sx={{ color: '#4A7C59' }} />
                  <Typography variant="subtitle2">Battery Status</Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={battery}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    mb: 1,
                    bgcolor: '#0D2B1E',
                    '& .MuiLinearProgress-bar': {
                      bgcolor: battery > 20 ? '#4AFF00' : '#FF4A4A',
                    },
                  }}
                />
                <Typography variant="caption" color="text.secondary">
                  {battery}% • {lastSeen}
                </Typography>
              </CardContent>
            </Card>

            {/* Solar Charge */}
            <Card sx={{ bgcolor: '#1A3D2B' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <SolarPowerIcon sx={{ color: '#FFD700' }} />
                  <Typography variant="subtitle2">Solar Charge Rate</Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={solarCharge}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    mb: 1,
                    bgcolor: '#0D2B1E',
                    '& .MuiLinearProgress-bar': {
                      bgcolor: '#FFD700',
                    },
                  }}
                />
                <Typography variant="caption" color="text.secondary">
                  {solarCharge}% efficiency
                </Typography>
              </CardContent>
            </Card>

            {/* Hardware Specs */}
            <Card sx={{ bgcolor: '#1A3D2B' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ color: '#C8B882' }}>
                  Hardware Specifications
                </Typography>
                <Grid container spacing={1}>
                  {Object.entries(WATCHTOWER_SPECS.specs).map(([key, value]) => (
                    <Grid item xs={12} sm={6} key={key}>
                      <Box>
                        <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'capitalize' }}>
                          {key.replace(/([A-Z])/g, ' $1')}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#E4E7E5' }}>
                          {value}
                        </Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>

            {/* Features */}
            <Box>
              <Typography variant="subtitle2" gutterBottom sx={{ color: '#C8B882' }}>
                Features
              </Typography>
              <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
                {[
                  { icon: <CameraAltIcon />, label: '360° Coverage' },
                  { icon: <SolarPowerIcon />, label: 'Solar Powered' },
                  { icon: <SignalCellularAltIcon />, label: 'LoRa Mesh' },
                ].map((feature, i) => (
                  <Chip
                    key={i}
                    icon={feature.icon}
                    label={feature.label}
                    variant="outlined"
                    sx={{
                      borderColor: '#4A7C59',
                      color: '#E4E7E5',
                      '& .MuiChip-icon': { color: '#4A7C59' },
                    }}
                  />
                ))}
              </Stack>
            </Box>
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
}
