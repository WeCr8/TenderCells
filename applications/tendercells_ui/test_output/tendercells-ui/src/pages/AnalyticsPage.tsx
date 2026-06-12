// AnalyticsPage.tsx — Telemetry history, usage stats, trend charts (simulated)
import { useState, useMemo } from 'react';
import {
  Box, Paper, Grid, Stack, Typography, Chip, ToggleButtonGroup,
  ToggleButton, Select, MenuItem, FormControl, InputLabel,
} from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import ThermostatIcon from '@mui/icons-material/Thermostat';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import ScienceIcon from '@mui/icons-material/Science';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import EggIcon from '@mui/icons-material/Egg';
import { useProducts } from '../hooks/useProducts';

const C = {
  bg: '#0D2B1E', surface: '#1A3D2B', accent: '#4A7C59',
  gold: '#C8B882', goldMuted: '#8A7D55', danger: '#CC3333',
  warning: '#E8A020', white: '#F0EDE4',
};

type Range = '24h' | '7d' | '30d';

// Generate simulated telemetry history
function genHistory(points: number, base: number, variance: number, trend = 0): number[] {
  const out: number[] = [];
  let v = base;
  for (let i = 0; i < points; i++) {
    v += (Math.random() - 0.5) * variance + trend / points;
    out.push(Math.round(v * 10) / 10);
  }
  return out;
}

const RANGE_POINTS: Record<Range, number> = { '24h': 24, '7d': 48, '30d': 30 };
const RANGE_LABELS: Record<Range, string> = { '24h': 'Last 24 Hours', '7d': 'Last 7 Days', '30d': 'Last 30 Days' };

function Sparkline({ values, color, height = 48 }: { values: number[]; color: string; height?: number }) {
  if (values.length < 2) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const w = 200;
  const h = height;
  const pad = 4;
  const pts = values.map((v, i) => {
    const x = pad + (i / (values.length - 1)) * (w - pad * 2);
    const y = h - pad - ((v - min) / range) * (h - pad * 2);
    return `${x},${y}`;
  }).join(' ');
  const lastX = pad + ((values.length - 1) / (values.length - 1)) * (w - pad * 2);
  const lastY = h - pad - ((values[values.length - 1] - min) / range) * (h - pad * 2);

  return (
    <Box component="svg" viewBox={`0 0 ${w} ${h}`} width="100%" sx={{ display: 'block' }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" opacity={0.8} />
      <circle cx={lastX} cy={lastY} r={3} fill={color} />
    </Box>
  );
}

interface MetricCard {
  label: string;
  unit: string;
  icon: React.ReactNode;
  color: string;
  base: number;
  variance: number;
  warningHigh?: number;
  warningLow?: number;
  good: 'high' | 'low' | 'mid';
}

const METRICS: MetricCard[] = [
  { label: 'Temperature', unit: '°F', icon: <ThermostatIcon />, color: '#E8A020', base: 68, variance: 8, warningHigh: 85, warningLow: 35, good: 'mid' },
  { label: 'Humidity', unit: '%', icon: <WaterDropIcon />, color: '#4A90E2', base: 70, variance: 12, warningHigh: 90, warningLow: 40, good: 'mid' },
  { label: 'Ammonia', unit: 'ppm', icon: <ScienceIcon />, color: '#8DD47A', base: 5, variance: 4, warningHigh: 10, good: 'low' },
  { label: 'Feed Level', unit: '%', icon: <RestaurantIcon />, color: '#C8B882', base: 65, variance: 15, warningLow: 20, good: 'high' },
  { label: 'Water Level', unit: '%', icon: <WaterDropIcon />, color: '#4A90E2', base: 72, variance: 18, warningLow: 15, good: 'high' },
  { label: 'Eggs Collected', unit: '/day', icon: <EggIcon />, color: '#D4A574', base: 4, variance: 2, good: 'high' },
];

function MetricPanel({ metric, values }: { metric: MetricCard; values: number[] }) {
  const current = values[values.length - 1];
  const avg = Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10;
  const minV = Math.min(...values);
  const maxV = Math.max(...values);
  const isWarning = (metric.warningHigh != null && current > metric.warningHigh) ||
                    (metric.warningLow != null && current < metric.warningLow);

  return (
    <Paper elevation={0} sx={{ bgcolor: C.surface, border: `1px solid ${isWarning ? C.warning : C.accent}44`, borderRadius: 2, p: 2 }}>
      <Stack direction="row" alignItems="flex-start" justifyContent="space-between" mb={0.5}>
        <Stack direction="row" spacing={0.75} alignItems="center">
          <Box sx={{ color: metric.color, display: 'flex', fontSize: 18 }}>{metric.icon}</Box>
          <Typography sx={{ color: C.goldMuted, fontSize: 12 }}>{metric.label}</Typography>
        </Stack>
        {isWarning && <Chip label="⚠ Alert" size="small" sx={{ bgcolor: C.warning + '22', color: C.warning, fontSize: 9, fontWeight: 700 }} />}
      </Stack>

      <Typography sx={{ color: isWarning ? C.warning : C.white, fontWeight: 700, fontSize: 26, lineHeight: 1.1 }}>
        {current}<Typography component="span" sx={{ fontSize: 13, color: C.goldMuted }}> {metric.unit}</Typography>
      </Typography>

      <Box my={1}><Sparkline values={values} color={metric.color} /></Box>

      <Grid container spacing={1}>
        {[{ l: 'Avg', v: avg }, { l: 'Min', v: minV }, { l: 'Max', v: maxV }].map(s => (
          <Grid item xs={4} key={s.l}>
            <Typography sx={{ color: C.goldMuted, fontSize: 10 }}>{s.l}</Typography>
            <Typography sx={{ color: C.white, fontSize: 12, fontWeight: 600 }}>{s.v}{metric.unit}</Typography>
          </Grid>
        ))}
      </Grid>
    </Paper>
  );
}

export default function AnalyticsPage() {
  const { products } = useProducts();
  const [range, setRange] = useState<Range>('24h');
  const [selectedDevice, setSelectedDevice] = useState('ct_001');

  const points = RANGE_POINTS[range];

  const metricData = useMemo(() =>
    METRICS.map(m => ({ metric: m, values: genHistory(points, m.base, m.variance) })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [range, selectedDevice]
  );

  const deviceOptions = products.length > 0
    ? products.map(p => ({ id: p.device_id ?? p.id, name: p.product_name }))
    : [{ id: 'ct_001', name: 'Chicken Tender (sim)' }];

  // Egg collection this week (simulated)
  const weeklyEggs = Array.from({ length: 7 }, (_, i) => ({
    day: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][i],
    count: Math.floor(Math.random() * 4) + 2,
  }));
  const totalEggs = weeklyEggs.reduce((a, b) => a + b.count, 0);

  return (
    <Box sx={{ bgcolor: C.bg, minHeight: '100dvh', p: { xs: 2, sm: 3 } }}>
      <Stack spacing={3} sx={{ maxWidth: 1100, mx: 'auto' }}>

        {/* Header */}
        <Stack direction="row" alignItems="flex-start" justifyContent="space-between" flexWrap="wrap" gap={2}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <TrendingUpIcon sx={{ color: C.accent, fontSize: 28 }} />
            <Box>
              <Typography variant="h5" sx={{ color: C.gold, fontWeight: 700 }}>Analytics</Typography>
              <Typography sx={{ color: C.goldMuted, fontSize: 13 }}>Telemetry history and usage trends</Typography>
            </Box>
          </Stack>
          <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel sx={{ color: C.goldMuted }}>Device</InputLabel>
              <Select value={selectedDevice} label="Device" onChange={e => setSelectedDevice(e.target.value)}
                sx={{ color: C.white, '& .MuiOutlinedInput-notchedOutline': { borderColor: C.accent } }}>
                {deviceOptions.map(d => (
                  <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <ToggleButtonGroup value={range} exclusive onChange={(_, v) => v && setRange(v as Range)} size="small">
              {(['24h', '7d', '30d'] as Range[]).map(r => (
                <ToggleButton key={r} value={r}
                  sx={{ color: C.goldMuted, borderColor: C.accent, '&.Mui-selected': { bgcolor: C.accent, color: C.white } }}>
                  {r}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
          </Stack>
        </Stack>

        <Typography sx={{ color: C.goldMuted, fontSize: 12 }}>{RANGE_LABELS[range]} — {selectedDevice}</Typography>

        {/* Metric grid */}
        <Grid container spacing={2}>
          {metricData.map(({ metric, values }) => (
            <Grid item xs={12} sm={6} md={4} key={metric.label}>
              <MetricPanel metric={metric} values={values} />
            </Grid>
          ))}
        </Grid>

        {/* Weekly egg collection */}
        <Paper elevation={0} sx={{ bgcolor: C.surface, border: `1px solid ${C.accent}44`, borderRadius: 2, p: 2 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
            <Stack direction="row" spacing={1} alignItems="center">
              <EggIcon sx={{ color: '#D4A574' }} />
              <Typography sx={{ color: C.gold, fontWeight: 700 }}>Weekly Egg Collection</Typography>
            </Stack>
            <Chip label={`${totalEggs} total`} sx={{ bgcolor: '#D4A574' + '22', color: '#D4A574', fontWeight: 700 }} />
          </Stack>
          <Stack direction="row" spacing={1} alignItems="flex-end" sx={{ height: 80 }}>
            {weeklyEggs.map(d => {
              const maxCount = Math.max(...weeklyEggs.map(w => w.count));
              const heightPct = (d.count / maxCount) * 100;
              return (
                <Box key={d.day} sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                  <Typography sx={{ color: '#D4A574', fontSize: 11, fontWeight: 700 }}>{d.count}</Typography>
                  <Box sx={{ width: '100%', height: `${heightPct}%`, bgcolor: '#D4A574', borderRadius: '4px 4px 0 0', minHeight: 4 }} />
                  <Typography sx={{ color: C.goldMuted, fontSize: 10 }}>{d.day}</Typography>
                </Box>
              );
            })}
          </Stack>
        </Paper>

        {/* Info notice */}
        <Paper elevation={0} sx={{ bgcolor: C.surface, border: `1px solid ${C.accent}44`, borderRadius: 2, p: 2 }}>
          <Typography sx={{ color: C.goldMuted, fontSize: 12 }}>
            📊 Charts show simulated data. Live telemetry requires the Express API running at{' '}
            <Box component="code" sx={{ color: C.accent }}>http://localhost:3001</Box> and an MQTT-connected device.
            Data will auto-populate once hardware is online.
          </Typography>
        </Paper>
      </Stack>
    </Box>
  );
}
