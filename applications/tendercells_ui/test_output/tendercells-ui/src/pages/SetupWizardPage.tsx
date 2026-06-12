// SetupWizardPage.tsx — Step-by-step new device setup: select product → name → connect → verify
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Paper, Stack, Typography, Button, TextField, Stepper,
  Step, StepLabel, Grid, Chip, CircularProgress,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import RouterIcon from '@mui/icons-material/Router';
import DevicesIcon from '@mui/icons-material/Devices';
import SettingsIcon from '@mui/icons-material/Settings';
import WifiIcon from '@mui/icons-material/Wifi';

const C = {
  bg: '#0D2B1E', surface: '#1A3D2B', accent: '#4A7C59',
  gold: '#C8B882', goldMuted: '#8A7D55', danger: '#CC3333',
  warning: '#E8A020', white: '#F0EDE4',
};

type ProductFamily = 'chicken-tender' | 'roaming-roost' | 'duck-dock' | 'goat-guardian' | 'bunny-burrow' | 'turkey-tower' | 'pigeon-palace' | 'predator-monitor';

interface ProductOption {
  family: ProductFamily;
  label: string;
  emoji: string;
  desc: string;
  route: string;
}

const PRODUCTS: ProductOption[] = [
  { family: 'chicken-tender', label: 'Chicken Tender™', emoji: '🐔', desc: '4×4×5 ft automated coop with robot arm, egg map, cleaning, feeding', route: '/chicken-tender' },
  { family: 'roaming-roost', label: 'Roaming Roost™', emoji: '🏕️', desc: '~5 ft octagonal mobile igloo dome with perimeter wheel drive', route: '/roaming-roost' },
  { family: 'duck-dock', label: 'Duck Dock™', emoji: '🦆', desc: '4×4×6 ft duck platform with pond level management', route: '/duck-dock' },
  { family: 'goat-guardian', label: 'Goat Guardian™', emoji: '🐐', desc: '6×6×8 ft large enclosure automation', route: '/goat-guardian' },
  { family: 'bunny-burrow', label: 'Bunny Burrow™', emoji: '🐇', desc: '3×3×5 ft rabbit housing with climate and feeding automation', route: '/bunny-burrow' },
  { family: 'turkey-tower', label: 'Turkey Tower™', emoji: '🦃', desc: '4×4×6 ft turkey enclosure automation', route: '/turkey-tower' },
  { family: 'pigeon-palace', label: 'Pigeon Palace™', emoji: '🕊️', desc: '4×4×6 ft smart pigeon loft housing', route: '/pigeon-palace' },
  { family: 'predator-monitor', label: 'WatchTower AI™', emoji: '👁️', desc: '3×3×5 ft solar predator monitor — ESP32-S3 + LoRa + 3-cam dome', route: '/predator-monitor' },
];

const STEPS = ['Select Product', 'Name & Location', 'Connect Hardware', 'Verify & Launch'];

function StepSelectProduct({ value, onChange }: { value: ProductFamily | null; onChange: (f: ProductFamily) => void }) {
  return (
    <Box>
      <Typography sx={{ color: C.goldMuted, mb: 2, fontSize: 14 }}>Choose the Tender Cells product you are setting up.</Typography>
      <Grid container spacing={1.5}>
        {PRODUCTS.map(p => (
          <Grid item xs={12} sm={6} key={p.family}>
            <Paper elevation={0} onClick={() => onChange(p.family)} sx={{
              bgcolor: value === p.family ? C.accent + '33' : C.bg,
              border: `2px solid ${value === p.family ? C.accent : C.accent + '33'}`,
              borderRadius: 2, p: 1.5, cursor: 'pointer',
              '&:hover': { border: `2px solid ${C.accent}`, bgcolor: C.accent + '22' },
            }}>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Typography fontSize={28}>{p.emoji}</Typography>
                <Box flex={1}>
                  <Typography sx={{ color: C.gold, fontWeight: 700, fontSize: 13 }}>{p.label}</Typography>
                  <Typography sx={{ color: C.goldMuted, fontSize: 11, lineHeight: 1.3 }}>{p.desc}</Typography>
                </Box>
                {value === p.family && <CheckCircleIcon sx={{ color: C.accent }} />}
              </Stack>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}

function StepNameLocation({ name, location, onName, onLocation }: {
  name: string; location: string; onName: (v: string) => void; onLocation: (v: string) => void;
}) {
  const inputSx = {
    '& label': { color: C.goldMuted },
    '& input': { color: C.white },
    '& .MuiOutlinedInput-notchedOutline': { borderColor: C.accent + '88' },
  };
  return (
    <Stack spacing={2.5}>
      <Typography sx={{ color: C.goldMuted, fontSize: 14 }}>Give your device a friendly name and describe where it is located.</Typography>
      <TextField label="Device Name" placeholder="e.g. Backyard Coop" value={name} onChange={e => onName(e.target.value)}
        fullWidth sx={inputSx} helperText="Used in the dashboard and alerts" FormHelperTextProps={{ sx: { color: C.goldMuted } }} />
      <TextField label="Location Description" placeholder="e.g. North corner of backyard, near the oak tree"
        value={location} onChange={e => onLocation(e.target.value)} fullWidth sx={inputSx}
        helperText="Helps identify the device on your property map" FormHelperTextProps={{ sx: { color: C.goldMuted } }} />
    </Stack>
  );
}

function StepConnect({ simOnly, onToggleSim }: { simOnly: boolean; onToggleSim: () => void }) {
  const [testing, setTesting] = useState(false);
  const [mqttResult, setMqttResult] = useState<'idle' | 'ok' | 'fail'>('idle');

  const testConnection = async () => {
    setTesting(true);
    try {
      const res = await fetch('http://localhost:3001/api/mqtt/status');
      setMqttResult(res.ok ? 'ok' : 'fail');
    } catch {
      setMqttResult('fail');
    } finally {
      setTesting(false);
    }
  };

  return (
    <Stack spacing={2.5}>
      <Typography sx={{ color: C.goldMuted, fontSize: 14 }}>
        Connect your device to Wi-Fi and the MQTT broker, or run in simulation mode to explore the dashboard.
      </Typography>

      <Paper elevation={0} onClick={onToggleSim} sx={{
        bgcolor: simOnly ? C.accent + '33' : C.bg,
        border: `2px solid ${simOnly ? C.accent : C.accent + '33'}`,
        borderRadius: 2, p: 2, cursor: 'pointer',
      }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <DevicesIcon sx={{ color: simOnly ? C.accent : C.goldMuted }} />
          <Box flex={1}>
            <Typography sx={{ color: C.gold, fontWeight: 700 }}>Simulation Mode</Typography>
            <Typography sx={{ color: C.goldMuted, fontSize: 12 }}>Explore the dashboard with simulated sensor data — no hardware required.</Typography>
          </Box>
          {simOnly ? <CheckCircleIcon sx={{ color: C.accent }} /> : <RadioButtonUncheckedIcon sx={{ color: C.goldMuted }} />}
        </Stack>
      </Paper>

      <Paper elevation={0} onClick={() => !simOnly && onToggleSim()} sx={{
        bgcolor: !simOnly ? C.accent + '33' : C.bg,
        border: `2px solid ${!simOnly ? C.accent : C.accent + '33'}`,
        borderRadius: 2, p: 2, cursor: 'pointer',
      }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <WifiIcon sx={{ color: !simOnly ? C.accent : C.goldMuted }} />
          <Box flex={1}>
            <Typography sx={{ color: C.gold, fontWeight: 700 }}>Connect Real Hardware</Typography>
            <Typography sx={{ color: C.goldMuted, fontSize: 12 }}>Requires ESP32 flashed with Chicken Tender firmware + MQTT broker running.</Typography>
          </Box>
          {!simOnly ? <CheckCircleIcon sx={{ color: C.accent }} /> : <RadioButtonUncheckedIcon sx={{ color: C.goldMuted }} />}
        </Stack>
      </Paper>

      {!simOnly && (
        <Paper elevation={0} sx={{ bgcolor: C.bg, border: `1px solid ${C.accent}44`, borderRadius: 2, p: 2 }}>
          <Stack direction="row" spacing={1} alignItems="center" mb={1}>
            <RouterIcon sx={{ color: C.accent, fontSize: 18 }} />
            <Typography sx={{ color: C.gold, fontWeight: 600, fontSize: 13 }}>MQTT Broker Test</Typography>
          </Stack>
          <Typography sx={{ color: C.goldMuted, fontSize: 12, mb: 1.5 }}>
            Default broker: <Box component="code" sx={{ color: C.accent }}>mqtt://localhost:1883</Box>
            {' '}via Express API at <Box component="code" sx={{ color: C.accent }}>http://localhost:3001</Box>
          </Typography>
          <Stack direction="row" spacing={1} alignItems="center">
            <Button size="small" variant="outlined" onClick={() => void testConnection()} disabled={testing}
              sx={{ borderColor: C.accent, color: C.accent }}>
              {testing ? <CircularProgress size={14} sx={{ color: C.accent }} /> : 'Test Connection'}
            </Button>
            {mqttResult === 'ok' && <Chip label="Connected ✓" size="small" sx={{ bgcolor: '#4CAF50' + '22', color: '#4CAF50', fontWeight: 700 }} />}
            {mqttResult === 'fail' && <Chip label="Offline" size="small" sx={{ bgcolor: C.danger + '22', color: C.danger, fontWeight: 700 }} />}
          </Stack>
        </Paper>
      )}

      <Paper elevation={0} sx={{ bgcolor: C.bg, border: `1px solid ${C.accent}33`, borderRadius: 2, p: 1.5 }}>
        <Typography sx={{ color: C.goldMuted, fontSize: 12 }}>
          📋 Firmware flash guide: <Box component="code" sx={{ color: C.accent }}>scripts/flash-firmware.sh --target chicken-tender</Box>
        </Typography>
      </Paper>
    </Stack>
  );
}

function StepVerify({ name, family, simOnly }: { name: string; family: ProductFamily | null; simOnly: boolean }) {
  const product = PRODUCTS.find(p => p.family === family);
  return (
    <Stack spacing={2}>
      <Typography sx={{ color: C.goldMuted, fontSize: 14 }}>Review your setup and launch the dashboard.</Typography>
      <Paper elevation={0} sx={{ bgcolor: C.bg, border: `1px solid ${C.accent}44`, borderRadius: 2, p: 2 }}>
        <Stack spacing={1.5}>
          {[
            { label: 'Product', value: product ? `${product.emoji} ${product.label}` : '—' },
            { label: 'Name', value: name || '(not set)' },
            { label: 'Mode', value: simOnly ? 'Simulation' : 'Hardware Connected' },
          ].map(row => (
            <Stack key={row.label} direction="row" justifyContent="space-between" sx={{ borderBottom: `1px solid ${C.accent}22`, pb: 0.75 }}>
              <Typography sx={{ color: C.goldMuted, fontSize: 13 }}>{row.label}</Typography>
              <Typography sx={{ color: C.white, fontSize: 13, fontWeight: 600 }}>{row.value}</Typography>
            </Stack>
          ))}
        </Stack>
      </Paper>
      <Stack direction="row" spacing={1} alignItems="center">
        <CheckCircleIcon sx={{ color: '#4CAF50' }} />
        <Typography sx={{ color: C.white, fontSize: 14 }}>Ready to launch — click Finish to open your dashboard.</Typography>
      </Stack>
    </Stack>
  );
}

export default function SetupWizardPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [selectedFamily, setSelectedFamily] = useState<ProductFamily | null>(null);
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [simOnly, setSimOnly] = useState(true);

  const canNext = [
    selectedFamily != null,
    name.trim().length > 0,
    true,
    true,
  ][step];

  const next = () => {
    if (step < STEPS.length - 1) { setStep(s => s + 1); return; }
    const product = PRODUCTS.find(p => p.family === selectedFamily);
    navigate(product?.route ?? '/products');
  };

  return (
    <Box sx={{ bgcolor: C.bg, minHeight: '100dvh', p: { xs: 2, sm: 3 }, display: 'flex', alignItems: 'flex-start', justifyContent: 'center' }}>
      <Stack spacing={3} sx={{ maxWidth: 860, width: '100%' }}>

        {/* Header */}
        <Stack direction="row" spacing={1.5} alignItems="center">
          <SettingsIcon sx={{ color: C.accent, fontSize: 28 }} />
          <Box>
            <Typography variant="h5" sx={{ color: C.gold, fontWeight: 700 }}>Setup Wizard</Typography>
            <Typography sx={{ color: C.goldMuted, fontSize: 13 }}>Configure your new Tender Cells device in 4 steps</Typography>
          </Box>
        </Stack>

        {/* Stepper */}
        <Stepper activeStep={step}>
          {STEPS.map(label => (
            <Step key={label}>
              <StepLabel sx={{
                '& .MuiStepLabel-label': { color: C.goldMuted, fontSize: 12 },
                '& .MuiStepLabel-label.Mui-active': { color: C.gold },
                '& .MuiStepLabel-label.Mui-completed': { color: C.accent },
                '& .MuiStepIcon-root': { color: C.accent + '66' },
                '& .MuiStepIcon-root.Mui-active': { color: C.accent },
                '& .MuiStepIcon-root.Mui-completed': { color: C.accent },
              }}>
                {label}
              </StepLabel>
            </Step>
          ))}
        </Stepper>

        {/* Step content */}
        <Paper elevation={0} sx={{ bgcolor: C.surface, border: `1px solid ${C.accent}44`, borderRadius: 2, p: { xs: 2, sm: 3 } }}>
          {step === 0 && <StepSelectProduct value={selectedFamily} onChange={setSelectedFamily} />}
          {step === 1 && <StepNameLocation name={name} location={location} onName={setName} onLocation={setLocation} />}
          {step === 2 && <StepConnect simOnly={simOnly} onToggleSim={() => setSimOnly(v => !v)} />}
          {step === 3 && <StepVerify name={name} family={selectedFamily} simOnly={simOnly} />}
        </Paper>

        {/* Navigation */}
        <Stack direction="row" justifyContent="space-between">
          <Button onClick={() => step === 0 ? navigate('/products') : setStep(s => s - 1)}
            sx={{ color: C.goldMuted }}>
            {step === 0 ? 'Cancel' : 'Back'}
          </Button>
          <Button variant="contained" onClick={next} disabled={!canNext} sx={{ bgcolor: C.accent }}>
            {step === STEPS.length - 1 ? 'Finish — Open Dashboard' : 'Next'}
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
}
