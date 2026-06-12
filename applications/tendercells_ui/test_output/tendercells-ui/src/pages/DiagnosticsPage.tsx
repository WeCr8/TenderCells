// DiagnosticsPage.tsx — Fault codes reference, MQTT status, device health
import { useEffect, useState } from 'react';
import {
  Box, Paper, Grid, Stack, Typography, Chip, Accordion,
  AccordionSummary, AccordionDetails, CircularProgress, Alert,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import BugReportIcon from '@mui/icons-material/BugReport';
import RouterIcon from '@mui/icons-material/Router';
import HealthAndSafetyIcon from '@mui/icons-material/HealthAndSafety';
import TuneIcon from '@mui/icons-material/Tune';
import { useProducts } from '../hooks/useProducts';

const C = {
  bg: '#0D2B1E', surface: '#1A3D2B', accent: '#4A7C59',
  gold: '#C8B882', goldMuted: '#8A7D55', danger: '#CC3333',
  warning: '#E8A020', white: '#F0EDE4',
};

interface FaultCode {
  code: number;
  description: string;
  category: string;
  severity: 'critical' | 'warning' | 'info';
  resolution: string;
}

const FAULT_CODES: FaultCode[] = [
  { code: 10, description: 'WiFi connection lost', category: 'Connectivity', severity: 'warning', resolution: 'Check WiFi credentials in firmware. Verify router signal strength at device location.' },
  { code: 11, description: 'MQTT broker unreachable', category: 'Connectivity', severity: 'warning', resolution: 'Confirm Mosquitto is running on Raspberry Pi. Check MQTT_BROKER env var. Default: mqtt://localhost:1883.' },
  { code: 12, description: 'Rail blocked — encoder stall detected', category: 'Motion', severity: 'warning', resolution: 'Clear obstruction from rail path. Check encoder connections. Home rail via dashboard.' },
  { code: 20, description: 'Arm joint limit exceeded', category: 'Robot Arm', severity: 'critical', resolution: 'E-STOP active. Check joint angles in command payload. Verify URDF limits match hardware.' },
  { code: 21, description: 'Arm force limit exceeded (collision)', category: 'Robot Arm', severity: 'critical', resolution: 'E-STOP active. Remove obstruction from arm path. Check chicken presence before resuming.' },
  { code: 30, description: 'Cleaning cycle: scraper not at home position', category: 'Cleaning', severity: 'warning', resolution: 'Run scraper home routine. Check homing sensor. Inspect for jam or missed endstop.' },
  { code: 31, description: 'Scraper jammed — motor stall', category: 'Cleaning', severity: 'warning', resolution: 'Clear coop floor obstruction. Check motor current limit. Restart cleaning cycle.' },
  { code: 40, description: 'Feed dispenser jammed', category: 'Feeding', severity: 'warning', resolution: 'Clear feed mechanism. Check auger for blockage. Run dispenser diagnostic.' },
  { code: 41, description: 'Water supply low — below 10%', category: 'Feeding', severity: 'warning', resolution: 'Refill water reservoir. Check float sensor calibration. Inspect supply line.' },
  { code: 50, description: 'Temperature critical (>90°F or <32°F)', category: 'Climate', severity: 'critical', resolution: 'Immediate action: >90°F open vents, add fans. <32°F activate heat lamp. Check DHT22 sensor.' },
  { code: 51, description: 'Ammonia critical (>25 ppm)', category: 'Climate', severity: 'critical', resolution: 'Open doors/vents immediately. Start cleaning cycle. Check MQ-137 sensor calibration.' },
  { code: 60, description: 'WatchTower battery critical (<10%)', category: 'WatchTower AI', severity: 'warning', resolution: 'Check 5W solar panel orientation and shading. Verify MPPT charger. Replace 18650 cells if needed.' },
  { code: 61, description: 'WatchTower LoRa sync lost', category: 'WatchTower AI', severity: 'warning', resolution: 'Check LoRa SX1276 antenna. Verify 915MHz frequency match. Check range — max ~500m.' },
  { code: 70, description: 'Roaming Roost boundary breach', category: 'Roaming Roost', severity: 'warning', resolution: 'Issue recall command. Check GPS/boundary fence config. Inspect wheel encoder calibration.' },
  { code: 71, description: 'Roaming Roost drive motor stall', category: 'Roaming Roost', severity: 'warning', resolution: 'Clear wheel channel obstruction. Check motor current. Verify wheel encoder feedback.' },
  { code: 99, description: 'Unknown fault — check logs', category: 'System', severity: 'warning', resolution: 'Review serial monitor output. Check Firestore device logs. Contact WeCr8 support.' },
];

const CATEGORY_COLORS: Record<string, string> = {
  Connectivity: '#4A90E2',
  Motion: C.warning,
  'Robot Arm': C.danger,
  Cleaning: '#8DD47A',
  Feeding: C.gold,
  Climate: C.danger,
  'WatchTower AI': '#8DD47A',
  'Roaming Roost': C.warning,
  System: C.goldMuted,
};

const THRESHOLDS = [
  { label: 'Temp cold stress', value: '35°F', severity: 'warning' },
  { label: 'Temp heat stress', value: '85°F', severity: 'warning' },
  { label: 'Temp critical max', value: '90°F', severity: 'critical' },
  { label: 'Temp critical min', value: '32°F', severity: 'critical' },
  { label: 'Ammonia warning', value: '10 ppm', severity: 'warning' },
  { label: 'Ammonia critical', value: '25 ppm', severity: 'critical' },
  { label: 'Feed level low', value: '20%', severity: 'warning' },
  { label: 'Water level low', value: '15%', severity: 'warning' },
  { label: 'WatchTower battery critical', value: '10%', severity: 'critical' },
  { label: 'Sensor publish interval', value: '10 s', severity: 'info' },
  { label: 'MQTT reconnect interval', value: '5 s', severity: 'info' },
  { label: 'Watchdog timeout', value: '8 s', severity: 'info' },
  { label: 'Arm command timeout', value: '5 s', severity: 'info' },
  { label: 'Cleaning cycle max', value: '5 min', severity: 'info' },
];

const categories = [...new Set(FAULT_CODES.map(f => f.category))];

export default function DiagnosticsPage() {
  const { products, loading } = useProducts();
  const [mqttStatus, setMqttStatus] = useState<'checking' | 'connected' | 'offline'>('checking');

  useEffect(() => {
    fetch('http://localhost:3001/api/mqtt/status')
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(() => setMqttStatus('connected'))
      .catch(() => setMqttStatus('offline'));
  }, []);

  const severityColor = (s: string) =>
    s === 'critical' ? C.danger : s === 'warning' ? C.warning : C.goldMuted;

  return (
    <Box sx={{ bgcolor: C.bg, minHeight: '100dvh', p: { xs: 2, sm: 3 } }}>
      <Stack spacing={3} sx={{ maxWidth: 1100, mx: 'auto' }}>

        {/* Header */}
        <Stack direction="row" spacing={1.5} alignItems="center">
          <BugReportIcon sx={{ color: C.accent, fontSize: 28 }} />
          <Box>
            <Typography variant="h5" sx={{ color: C.gold, fontWeight: 700 }}>Diagnostics</Typography>
            <Typography sx={{ color: C.goldMuted, fontSize: 13 }}>Fault codes, device health, and connection status</Typography>
          </Box>
        </Stack>

        {/* MQTT + API status */}
        <Paper elevation={0} sx={{ bgcolor: C.surface, border: `1px solid ${C.accent}44`, borderRadius: 2, p: 2 }}>
          <Stack direction="row" spacing={1} alignItems="center" mb={1.5}>
            <RouterIcon sx={{ color: C.accent, fontSize: 20 }} />
            <Typography sx={{ color: C.gold, fontWeight: 700 }}>Connection Status</Typography>
          </Stack>
          <Grid container spacing={2}>
            {[
              { label: 'Express API', url: 'http://localhost:3001/api/mqtt', status: mqttStatus },
              { label: 'MQTT Broker', url: 'mqtt://localhost:1883', status: mqttStatus },
            ].map(item => (
              <Grid item xs={12} sm={6} key={item.label}>
                <Paper elevation={0} sx={{ bgcolor: C.bg, borderRadius: 1.5, p: 1.5 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Box>
                      <Typography sx={{ color: C.white, fontSize: 13, fontWeight: 600 }}>{item.label}</Typography>
                      <Typography sx={{ color: C.goldMuted, fontSize: 11, fontFamily: 'monospace' }}>{item.url}</Typography>
                    </Box>
                    {item.status === 'checking'
                      ? <CircularProgress size={16} sx={{ color: C.goldMuted }} />
                      : <Chip label={item.status === 'connected' ? 'Connected' : 'Offline'} size="small"
                          sx={{ bgcolor: (item.status === 'connected' ? '#4CAF50' : C.danger) + '22',
                                color: item.status === 'connected' ? '#4CAF50' : C.danger,
                                border: `1px solid ${item.status === 'connected' ? '#4CAF50' : C.danger}55`,
                                fontWeight: 700, fontSize: 10 }} />}
                  </Stack>
                </Paper>
              </Grid>
            ))}
          </Grid>
          {mqttStatus === 'offline' && (
            <Alert severity="warning" sx={{ mt: 1.5, bgcolor: C.warning + '22', color: C.warning, '& .MuiAlert-icon': { color: C.warning } }}>
              Express API offline. Hardware control unavailable. Start with: <code>cd express-api && npm run dev</code>
            </Alert>
          )}
        </Paper>

        {/* Device health */}
        <Paper elevation={0} sx={{ bgcolor: C.surface, border: `1px solid ${C.accent}44`, borderRadius: 2, p: 2 }}>
          <Stack direction="row" spacing={1} alignItems="center" mb={1.5}>
            <HealthAndSafetyIcon sx={{ color: C.accent, fontSize: 20 }} />
            <Typography sx={{ color: C.gold, fontWeight: 700 }}>Device Health</Typography>
          </Stack>
          {loading ? (
            <CircularProgress size={20} sx={{ color: C.accent }} />
          ) : products.length === 0 ? (
            <Typography sx={{ color: C.goldMuted, fontSize: 13 }}>No registered devices.</Typography>
          ) : (
            <Stack spacing={1}>
              {products.map(p => {
                const isOnline = p.connection_status === 'online';
                const isSim = p.metadata?.hardware_setup_mode === 'sim_only' || p.metadata?.sim_only;
                const sc = isOnline ? '#4CAF50' : isSim ? C.warning : C.goldMuted;
                const sl = isOnline ? 'Online' : isSim ? 'Simulation' : 'Offline';
                return (
                  <Stack key={p.id} direction="row" alignItems="center" justifyContent="space-between"
                    sx={{ p: 1.5, bgcolor: C.bg, borderRadius: 1.5 }}>
                    <Box>
                      <Typography sx={{ color: C.white, fontSize: 13, fontWeight: 600 }}>{p.product_name}</Typography>
                      <Typography sx={{ color: C.goldMuted, fontSize: 11 }}>
                        {(p.metadata?.product_family as string) ?? p.product_type}
                        {p.device_id ? ` · ${p.device_id}` : ''}
                      </Typography>
                    </Box>
                    <Chip label={sl} size="small"
                      sx={{ bgcolor: sc + '22', color: sc, border: `1px solid ${sc}55`, fontWeight: 700, fontSize: 10 }} />
                  </Stack>
                );
              })}
            </Stack>
          )}
        </Paper>

        {/* Alert thresholds */}
        <Paper elevation={0} sx={{ bgcolor: C.surface, border: `1px solid ${C.accent}44`, borderRadius: 2, p: 2 }}>
          <Stack direction="row" spacing={1} alignItems="center" mb={1.5}>
            <TuneIcon sx={{ color: C.accent, fontSize: 20 }} />
            <Typography sx={{ color: C.gold, fontWeight: 700 }}>Alert Thresholds</Typography>
          </Stack>
          <Grid container spacing={1}>
            {THRESHOLDS.map(t => (
              <Grid item xs={12} sm={6} md={4} key={t.label}>
                <Stack direction="row" justifyContent="space-between" alignItems="center"
                  sx={{ p: 1, bgcolor: C.bg, borderRadius: 1, border: `1px solid ${C.accent}22` }}>
                  <Typography sx={{ color: C.goldMuted, fontSize: 12 }}>{t.label}</Typography>
                  <Chip label={t.value} size="small"
                    sx={{ bgcolor: severityColor(t.severity) + '22', color: severityColor(t.severity),
                          fontWeight: 600, fontSize: 11 }} />
                </Stack>
              </Grid>
            ))}
          </Grid>
        </Paper>

        {/* Fault code reference by category */}
        <Box>
          <Typography sx={{ color: C.gold, fontWeight: 700, mb: 1.5 }}>Fault Code Reference</Typography>
          {categories.map(cat => (
            <Accordion key={cat} defaultExpanded={cat === 'Connectivity' || cat === 'Climate'}
              sx={{ bgcolor: C.surface, border: `1px solid ${C.accent}44`, borderRadius: '8px !important', mb: 1,
                    '&:before': { display: 'none' } }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: C.goldMuted }} />}>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: CATEGORY_COLORS[cat] ?? C.goldMuted }} />
                  <Typography sx={{ color: C.gold, fontWeight: 600 }}>{cat}</Typography>
                  <Chip label={`${FAULT_CODES.filter(f => f.category === cat).length} codes`} size="small"
                    sx={{ bgcolor: C.bg, color: C.goldMuted, fontSize: 10 }} />
                </Stack>
              </AccordionSummary>
              <AccordionDetails sx={{ pt: 0 }}>
                <Stack spacing={0.5}>
                  {FAULT_CODES.filter(f => f.category === cat).map(fc => (
                    <Paper key={fc.code} elevation={0}
                      sx={{ bgcolor: C.bg, borderRadius: 1.5, p: 1.5, border: `1px solid ${severityColor(fc.severity)}33` }}>
                      <Stack direction="row" spacing={1.5} alignItems="flex-start">
                        <Chip label={`Code ${fc.code}`} size="small"
                          sx={{ bgcolor: severityColor(fc.severity) + '22', color: severityColor(fc.severity),
                                fontWeight: 700, fontSize: 11, minWidth: 68 }} />
                        <Box flex={1}>
                          <Typography sx={{ color: C.white, fontSize: 13, fontWeight: 600 }}>{fc.description}</Typography>
                          <Typography sx={{ color: C.goldMuted, fontSize: 11, mt: 0.25 }}>{fc.resolution}</Typography>
                        </Box>
                        <Chip label={fc.severity} size="small"
                          sx={{ bgcolor: severityColor(fc.severity) + '22', color: severityColor(fc.severity), fontSize: 10 }} />
                      </Stack>
                    </Paper>
                  ))}
                </Stack>
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>
      </Stack>
    </Box>
  );
}
