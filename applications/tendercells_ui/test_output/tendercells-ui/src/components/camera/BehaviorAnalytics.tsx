// BehaviorAnalytics.tsx - Chicken behavior & health monitoring from camera feeds
import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  LinearProgress,
  Stack,
  Chip,
  Card,
  CardContent,
} from '@mui/material';
import {
  LocalDining as EatingIcon,
  Opacity as WaterIcon,
  Favorite as HealthIcon,
  LocalOffer as TagIcon,
} from '@mui/icons-material';

interface BehaviorMetric {
  name: string;
  value: number; // percentage 0-100
  unit: string;
  threshold: number; // alert if below this
  icon: React.ReactNode;
  status: 'normal' | 'warning' | 'alert';
}

interface ChickenDetection {
  id: string;
  identifier: string; // tag ID or "Bird #3"
  health: 'healthy' | 'concerning' | 'alert';
  lastSeen: string;
  location: string;
}

export default function BehaviorAnalytics() {
  // Mock data - in production, comes from ML inference on camera feeds
  const metrics: BehaviorMetric[] = [
    {
      name: 'Feeding Activity',
      value: 72,
      unit: '%',
      threshold: 60,
      icon: <EatingIcon />,
      status: 'normal',
    },
    {
      name: 'Water Consumption',
      value: 65,
      unit: '%',
      threshold: 50,
      icon: <WaterIcon />,
      status: 'normal',
    },
    {
      name: 'Overall Health',
      value: 88,
      unit: '%',
      threshold: 70,
      icon: <HealthIcon />,
      status: 'normal',
    },
  ];

  const detectedChickens: ChickenDetection[] = [
    {
      id: 'chicken-1',
      identifier: 'Tag #001',
      health: 'healthy',
      lastSeen: '2 min ago',
      location: 'Feeding area',
    },
    {
      id: 'chicken-2',
      identifier: 'Tag #002',
      health: 'healthy',
      lastSeen: '5 min ago',
      location: 'Roost',
    },
    {
      id: 'chicken-3',
      identifier: 'Bird #3',
      health: 'concerning',
      lastSeen: '12 min ago',
      location: 'Nest box',
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'normal':
        return '#4A7C59';
      case 'warning':
        return '#E8A020';
      case 'alert':
        return '#CC3333';
      default:
        return '#8A7D55';
    }
  };

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'healthy':
        return 'success';
      case 'concerning':
        return 'warning';
      case 'alert':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ color: '#C8B882', mb: 3 }}>
        Chicken Health & Behavior Analytics
      </Typography>

      {/* Behavior Metrics */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        {metrics.map((metric) => (
          <Grid item xs={12} md={4} key={metric.name}>
            <Paper sx={{ p: 2, bgcolor: '#1A3D2B' }}>
              <Stack direction="row" spacing={2} alignItems="flex-start">
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: getStatusColor(metric.status),
                    fontSize: 28,
                  }}
                >
                  {metric.icon}
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle2" sx={{ color: '#8A7D55' }}>
                    {metric.name}
                  </Typography>
                  <Typography variant="h6" sx={{ color: '#C8B882', mb: 1 }}>
                    {metric.value}
                    {metric.unit}
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={metric.value}
                    sx={{
                      bgcolor: 'rgba(74, 124, 89, 0.2)',
                      '& .MuiLinearProgress-bar': {
                        bgcolor: getStatusColor(metric.status),
                      },
                    }}
                  />
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                    Target: {metric.threshold}% or higher
                  </Typography>
                </Box>
              </Stack>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Detected Chickens */}
      <Typography variant="h6" sx={{ color: '#C8B882', mb: 2 }}>
        Detected Chickens ({detectedChickens.length})
      </Typography>
      <Grid container spacing={2}>
        {detectedChickens.map((chicken) => (
          <Grid item xs={12} sm={6} md={4} key={chicken.id}>
            <Card sx={{ bgcolor: '#1A3D2B', border: '1px solid #4A7C59' }}>
              <CardContent>
                <Stack spacing={1.5}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <TagIcon
                        sx={{
                          color: '#C8B882',
                          fontSize: 20,
                        }}
                      />
                      <Typography variant="subtitle2" sx={{ color: '#C8B882' }}>
                        {chicken.identifier}
                      </Typography>
                    </Stack>
                    <Chip
                      label={chicken.health.toUpperCase()}
                      size="small"
                      color={getHealthColor(chicken.health)}
                      variant="outlined"
                    />
                  </Stack>

                  <Typography variant="body2" color="text.secondary">
                    Location: {chicken.location}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Last seen: {chicken.lastSeen}
                  </Typography>

                  {chicken.health === 'concerning' && (
                    <Paper
                      sx={{
                        p: 1,
                        bgcolor: 'rgba(232, 160, 32, 0.1)',
                        border: '1px solid #E8A020',
                        borderRadius: 1,
                      }}
                    >
                      <Typography variant="caption" sx={{ color: '#E8A020' }}>
                        ⚠️ Reduced movement detected. Monitor closely.
                      </Typography>
                    </Paper>
                  )}
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Vision-based Insights */}
      <Paper
        sx={{
          p: 3,
          mt: 3,
          bgcolor: '#1A3D2B',
          border: '1px solid #4A7C59',
        }}
      >
        <Typography variant="subtitle2" sx={{ color: '#C8B882', mb: 2 }}>
          Vision Analytics
        </Typography>
        <Stack spacing={1}>
          <Typography variant="body2" color="text.secondary">
            ✓ Feeding behavior: 3/3 chickens eating regularly
          </Typography>
          <Typography variant="body2" color="text.secondary">
            ✓ Water consumption: All chickens drinking normally
          </Typography>
          <Typography variant="body2" color="text.secondary">
            ⚠ Movement patterns: 1 chicken showing reduced mobility
          </Typography>
          <Typography variant="body2" color="text.secondary">
            ✓ Crowding detection: Safe spacing maintained
          </Typography>
          <Typography variant="body2" color="text.secondary">
            ✓ Predator alerts: None in last 24 hours
          </Typography>
        </Stack>
      </Paper>
    </Box>
  );
}
