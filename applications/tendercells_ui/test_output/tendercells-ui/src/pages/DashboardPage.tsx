// DashboardPage.tsx — Multi-product overview: status, alerts, quick actions
import { useEffect, useState } from 'react';
import {
  Box, Paper, Grid, Stack, Typography, Button, Chip,
  CircularProgress, IconButton, Tooltip,
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import AddIcon from '@mui/icons-material/Add';
import GridOnIcon from '@mui/icons-material/GridOn';
import ScheduleIcon from '@mui/icons-material/Schedule';
import BugReportIcon from '@mui/icons-material/BugReport';
import RefreshIcon from '@mui/icons-material/Refresh';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import ThermostatIcon from '@mui/icons-material/Thermostat';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import { useNavigate } from 'react-router-dom';
import SettingsRemoteIcon from '@mui/icons-material/SettingsRemote';
import { useProducts } from '../hooks/useProducts';
import { useAuth } from '../contexts/AuthContext';
import DeviceConfigDialog from '../components/devices/DeviceConfigDialog';
import type { Product } from '../types/products';

const C = {
  bg: '#0D2B1E',
  surface: '#1A3D2B',
  accent: '#4A7C59',
  gold: '#C8B882',
  goldMuted: '#8A7D55',
  danger: '#CC3333',
  warning: '#E8A020',
  white: '#F0EDE4',
};

const FAMILY_ROUTES: Record<string, string> = {
  'chicken-tender': '/chicken-tender',
  'roaming-roost': '/roaming-roost',
  'duck-dock': '/duck-dock',
  'goat-guardian': '/goat-guardian',
  'bunny-burrow': '/bunny-burrow',
  'turkey-tower': '/turkey-tower',
  'pigeon-palace': '/pigeon-palace',
  'predator-monitor': '/predator-monitor',
  'rail-system': '/rail-system-modules',
  'rail-system-modules': '/rail-system-modules',
  'tendercells-cloud': '/tender-cells-cloud',
};

const FAMILY_EMOJI: Record<string, string> = {
  'chicken-tender': '🐔', 'roaming-roost': '🏕️', 'duck-dock': '🦆',
  'goat-guardian': '🐐', 'bunny-burrow': '🐇', 'turkey-tower': '🦃',
  'pigeon-palace': '🕊️', 'predator-monitor': '👁️', 'rail-system': '🛤️',
  'tendercells-cloud': '☁️',
};

interface SimAlert {
  id: string; severity: 'warning' | 'danger'; message: string; device: string; time: string;
}

const SIM_ALERTS: SimAlert[] = [
  { id: '1', severity: 'warning', message: 'Temperature 87°F — above heat stress threshold (85°F)', device: 'Chicken Tender', time: '14 min ago' },
  { id: '2', severity: 'warning', message: 'Feed level 18% — below 20% refill threshold', device: 'Chicken Tender', time: '1 hr ago' },
  { id: '3', severity: 'danger',  message: 'Predator detection — hawk, confidence 0.91', device: 'WatchTower AI', time: '3 hr ago' },
];

function ProductCard({ product }: { product: Product }) {
  const navigate = useNavigate();
  const family = (product.metadata?.product_family as string) ?? '';
  const route = FAMILY_ROUTES[family] ?? '/products';
  const emoji = FAMILY_EMOJI[family] ?? '📦';
  const isOnline = product.connection_status === 'online';
  const isSim = product.metadata?.hardware_setup_mode === 'sim_only' || product.metadata?.sim_only;
  const sc = isOnline ? '#4CAF50' : isSim ? C.warning : C.goldMuted;
  const sl = isOnline ? 'Online' : isSim ? 'Sim' : 'Offline';

  return (
    <Paper elevation={0} sx={{ bgcolor: C.surface, border: `1px solid ${C.accent}44`, borderRadius: 2, p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Stack direction="row" alignItems="flex-start" justifyContent="space-between" mb={1.5}>
        <Stack direction="row" spacing={1} alignItems="center">
          <Typography fontSize={22}>{emoji}</Typography>
          <Box>
            <Typography sx={{ color: C.gold, fontWeight: 700, fontSize: 13, lineHeight: 1.2 }}>{product.product_name}</Typography>
            <Typography sx={{ color: C.goldMuted, fontSize: 10 }}>{family}</Typography>
          </Box>
        </Stack>
        <Chip label={sl} size="small" sx={{ bgcolor: sc + '22', color: sc, border: `1px solid ${sc}55`, fontWeight: 700, fontSize: 10 }} />
      </Stack>
      <Stack spacing={0.5} sx={{ flex: 1 }}>
        {isSim && <Typography sx={{ color: C.goldMuted, fontSize: 11, fontStyle: 'italic' }}>Simulation mode</Typography>}
        {product.location && <Typography sx={{ color: C.goldMuted, fontSize: 11 }}>📍 {product.location}</Typography>}
        {product.metadata?.animal_count != null && (
          <Typography sx={{ color: C.white, fontSize: 12 }}>🐾 {String(product.metadata.animal_count)} animals</Typography>
        )}
        {product.device_id && <Typography sx={{ color: C.goldMuted, fontSize: 11 }}>ID: {product.device_id}</Typography>}
      </Stack>
      <Button size="small" onClick={() => navigate(route)}
        sx={{ mt: 1.5, color: C.accent, border: `1px solid ${C.accent}`, borderRadius: 1, fontSize: 11, py: 0.5 }}>
        View Dashboard
      </Button>
    </Paper>
  );
}

function AlertRow({ alert }: { alert: SimAlert }) {
  return (
    <Stack direction="row" spacing={1.5} alignItems="flex-start" sx={{ py: 1, borderBottom: `1px solid ${C.accent}22` }}>
      <Box pt={0.2}>
        {alert.severity === 'danger'
          ? <ErrorIcon sx={{ color: C.danger, fontSize: 18 }} />
          : <WarningAmberIcon sx={{ color: C.warning, fontSize: 18 }} />}
      </Box>
      <Box flex={1}>
        <Typography sx={{ color: C.white, fontSize: 13 }}>{alert.message}</Typography>
        <Typography sx={{ color: C.goldMuted, fontSize: 11 }}>{alert.device} · {alert.time}</Typography>
      </Box>
    </Stack>
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { products, loading, refetch } = useProducts();
  const [now, setNow] = useState(new Date());
  const [configOpen, setConfigOpen] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  const online = products.filter(p => p.connection_status === 'online').length;
  const displayName = user?.displayName ?? user?.email?.split('@')[0] ?? 'there';
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const timeStr = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

  return (
    <Box sx={{ bgcolor: C.bg, minHeight: '100dvh', p: { xs: 2, sm: 3 } }}>
      <DeviceConfigDialog open={configOpen} onClose={() => setConfigOpen(false)} onSaved={() => void refetch()} />
      <Stack spacing={3} sx={{ maxWidth: 1200, mx: 'auto' }}>

        {/* Header */}
        <Stack direction="row" alignItems="flex-start" justifyContent="space-between">
          <Box>
            <Stack direction="row" spacing={1} alignItems="center" mb={0.5}>
              <DashboardIcon sx={{ color: C.accent }} />
              <Typography variant="h5" sx={{ color: C.gold, fontWeight: 700 }}>Welcome back, {displayName}</Typography>
            </Stack>
            <Typography sx={{ color: C.goldMuted, fontSize: 13 }}>{dateStr} · {timeStr}</Typography>
          </Box>
          <Tooltip title="Refresh">
            <IconButton onClick={() => void refetch()} sx={{ color: C.goldMuted }}><RefreshIcon /></IconButton>
          </Tooltip>
        </Stack>

        {/* Status bar */}
        <Paper elevation={0} sx={{ bgcolor: C.surface, border: `1px solid ${C.accent}44`, borderRadius: 2, p: 2 }}>
          <Grid container spacing={2}>
            {[
              { label: 'Total Devices', value: products.length, color: C.gold },
              { label: 'Online', value: online, color: '#4CAF50' },
              { label: 'Offline / Sim', value: products.length - online, color: C.goldMuted },
              { label: 'Active Alerts', value: SIM_ALERTS.length, color: C.warning },
            ].map(s => (
              <Grid item xs={6} sm={3} key={s.label}>
                <Box>
                  <Typography sx={{ color: s.color, fontWeight: 700, fontSize: 26, lineHeight: 1 }}>{s.value}</Typography>
                  <Typography sx={{ color: C.goldMuted, fontSize: 11 }}>{s.label}</Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Paper>

        {/* Quick actions */}
        <Stack direction="row" spacing={1.5} flexWrap="wrap">
          {[
            { label: 'Add Device', icon: <AddIcon />, path: '/products' },
            { label: 'Configure / Claim', icon: <SettingsRemoteIcon />, path: '__config__' },
            { label: 'Property Layout', icon: <GridOnIcon />, path: '/layout' },
            { label: 'Schedules', icon: <ScheduleIcon />, path: '/schedules' },
            { label: 'Diagnostics', icon: <BugReportIcon />, path: '/diagnostics' },
          ].map(a => (
            <Button key={a.label} startIcon={a.icon}
              onClick={() => (a.path === '__config__' ? setConfigOpen(true) : navigate(a.path))}
              variant="outlined" size="small"
              sx={{ borderColor: C.accent, color: C.accent, '&:hover': { bgcolor: C.accent + '22' } }}>
              {a.label}
            </Button>
          ))}
        </Stack>

        <Grid container spacing={3}>
          {/* Product cards */}
          <Grid item xs={12} md={8}>
            <Typography sx={{ color: C.gold, fontWeight: 700, mb: 1.5 }}>Registered Devices</Typography>
            {loading ? (
              <Box display="flex" justifyContent="center" pt={4}><CircularProgress sx={{ color: C.accent }} /></Box>
            ) : products.length === 0 ? (
              <Paper elevation={0} sx={{ bgcolor: C.surface, border: `1px solid ${C.accent}44`, borderRadius: 2, p: 4, textAlign: 'center' }}>
                <Typography sx={{ color: C.goldMuted, mb: 2 }}>No devices registered yet.</Typography>
                <Button variant="contained" onClick={() => navigate('/products')} sx={{ bgcolor: C.accent }}>Add Your First Device</Button>
              </Paper>
            ) : (
              <Grid container spacing={2}>
                {products.map(p => (
                  <Grid item xs={12} sm={6} key={p.id}><ProductCard product={p} /></Grid>
                ))}
              </Grid>
            )}
          </Grid>

          {/* Alerts + thresholds */}
          <Grid item xs={12} md={4}>
            <Typography sx={{ color: C.gold, fontWeight: 700, mb: 1.5 }}>Recent Alerts</Typography>
            <Paper elevation={0} sx={{ bgcolor: C.surface, border: `1px solid ${C.accent}44`, borderRadius: 2, p: 2, mb: 2 }}>
              {SIM_ALERTS.map(a => <AlertRow key={a.id} alert={a} />)}
              <Button size="small" sx={{ mt: 1, color: C.goldMuted, fontSize: 11 }} onClick={() => navigate('/diagnostics')}>
                View all diagnostics →
              </Button>
            </Paper>

            <Paper elevation={0} sx={{ bgcolor: C.surface, border: `1px solid ${C.accent}44`, borderRadius: 2, p: 2 }}>
              <Typography sx={{ color: C.gold, fontWeight: 700, fontSize: 13, mb: 1 }}>Alert Thresholds</Typography>
              {[
                { label: 'Temp range', value: '35–85°F', icon: <ThermostatIcon sx={{ fontSize: 14 }} /> },
                { label: 'Ammonia warn', value: '10 ppm', icon: <WarningAmberIcon sx={{ fontSize: 14 }} /> },
                { label: 'Ammonia critical', value: '25 ppm', icon: <ErrorIcon sx={{ fontSize: 14 }} /> },
                { label: 'Feed low', value: '20%', icon: <RestaurantIcon sx={{ fontSize: 14 }} /> },
                { label: 'Water low', value: '15%', icon: <WaterDropIcon sx={{ fontSize: 14 }} /> },
              ].map(t => (
                <Stack key={t.label} direction="row" justifyContent="space-between" alignItems="center"
                  sx={{ py: 0.5, borderBottom: `1px solid ${C.accent}22` }}>
                  <Stack direction="row" spacing={0.5} alignItems="center" sx={{ color: C.goldMuted }}>
                    {t.icon}
                    <Typography sx={{ color: C.goldMuted, fontSize: 11 }}>{t.label}</Typography>
                  </Stack>
                  <Typography sx={{ color: C.white, fontSize: 12, fontWeight: 600 }}>{t.value}</Typography>
                </Stack>
              ))}
            </Paper>
          </Grid>
        </Grid>
      </Stack>
    </Box>
  );
}
