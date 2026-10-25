// ConnectPropertyPage.tsx (/connect) - "Connect My Property": discover and import devices
// the owner already has (Home Assistant, MQTT, ONVIF cameras) or enter a camera URL directly.
// Read-only by construction - nothing here can enable control of an imported device; that's a
// later milestone behind its own capability-policy review, same bar as the mower interlocks.
// Backed by express-api/backend/src/routes/integrations.routes.ts via connectPropertyService.ts.
// Off at the hub unless TC_CONNECT_PROPERTY_ENABLED=1 is set there - this page shows that
// plainly (FEATURE_DISABLED) rather than pretending discovery works.
import { useCallback, useState } from 'react';
import {
  Alert, Box, Button, Chip, CircularProgress, Divider, FormControlLabel, Checkbox, Grid, MenuItem,
  Paper, Stack, Step, StepLabel, Stepper, TextField, Typography,
} from '@mui/material';
import WifiIcon from '@mui/icons-material/Wifi';
import {
  ConnectPropertyApiError, ConnectPropertyService,
  type AdapterKind, type DiscoveryCandidate, type IntegrationRecord,
} from '../services/connectPropertyService';

const C = {
  bg: '#0D2B1E', surface: '#1A3D2B', accent: '#4A7C59', gold: '#C8B882', goldMuted: '#8A7D55',
  danger: '#CC3333', warning: '#E8A020', white: '#F0EDE4',
};
const field = { '& .MuiInputBase-root': { color: C.white }, '& label': { color: C.goldMuted } };

const ADAPTER_LABEL: Record<AdapterKind, string> = {
  home_assistant: 'Home Assistant', mqtt: 'MQTT broker', onvif: 'ONVIF camera (auto-discover)', rtsp: 'RTSP camera (manual)', mjpeg: 'MJPEG camera',
};
const DEFAULT_GATEWAY_ID = 'default';

type Step = 'choose' | 'discovering' | 'review' | 'done';

function TierChip({ tier }: { tier: string }) {
  const color = tier === 'observe' ? C.accent : tier === 'safety_critical' ? C.danger : C.warning;
  return <Chip size="small" label={tier.replace('_', ' ')} sx={{ bgcolor: `${color}33`, color, fontWeight: 600 }} />;
}

export default function ConnectPropertyPage() {
  const [step, setStep] = useState<Step>('choose');
  const [adapter, setAdapter] = useState<AdapterKind>('home_assistant');
  const [brokerUrl, setBrokerUrl] = useState('');
  const [topics, setTopics] = useState('');
  const [manualUrl, setManualUrl] = useState('');
  const [manualName, setManualName] = useState('');
  const [manualKind, setManualKind] = useState<'rtsp' | 'onvif'>('rtsp');
  const [candidates, setCandidates] = useState<DiscoveryCandidate[]>([]);
  const [jobId, setJobId] = useState<string | null>(null);
  const [imported, setImported] = useState<IntegrationRecord[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const reset = useCallback(() => {
    setStep('choose'); setCandidates([]); setJobId(null); setError(null);
  }, []);

  const startDiscovery = useCallback(async () => {
    setError(null); setBusy(true); setStep('discovering');
    try {
      const mqttOpts = adapter === 'mqtt'
        ? { brokerUrl, topics: topics.split(',').map((t) => t.trim()).filter(Boolean) }
        : undefined;
      const { job } = await ConnectPropertyService.discover(DEFAULT_GATEWAY_ID, adapter, mqttOpts);
      setJobId(job.id);
      const settled = await ConnectPropertyService.awaitJob(job.id);
      if (settled.status === 'error') {
        setError(settled.error || 'Discovery failed.');
        setStep('choose');
        return;
      }
      setCandidates(settled.candidates);
      setStep('review');
    } catch (e) {
      setError(e instanceof ConnectPropertyApiError ? e.message : 'Could not reach the hub.');
      setStep('choose');
    } finally {
      setBusy(false);
    }
  }, [adapter, brokerUrl, topics]);

  const importOne = useCallback(async (candidate: DiscoveryCandidate) => {
    if (!jobId) return;
    setBusy(true); setError(null);
    try {
      const { integration } = await ConnectPropertyService.import(jobId, candidate.tempId);
      setImported((prev) => [...prev, integration]);
      setCandidates((prev) => prev.filter((c) => c.tempId !== candidate.tempId));
    } catch (e) {
      setError(e instanceof ConnectPropertyApiError ? e.message : 'Import failed.');
    } finally {
      setBusy(false);
    }
  }, [jobId]);

  const importManual = useCallback(async () => {
    setBusy(true); setError(null);
    try {
      const { integration } = await ConnectPropertyService.importManual(manualKind, DEFAULT_GATEWAY_ID, manualUrl.trim(), manualName.trim() || undefined);
      setImported((prev) => [...prev, integration]);
      setManualUrl(''); setManualName('');
      setStep('done');
    } catch (e) {
      setError(e instanceof ConnectPropertyApiError ? e.message : 'Could not add that camera.');
    } finally {
      setBusy(false);
    }
  }, [manualKind, manualUrl, manualName]);

  const stepIndex = { choose: 0, discovering: 1, review: 2, done: 3 }[step];

  return (
    <Box sx={{ bgcolor: C.bg, minHeight: '100dvh', p: { xs: 2, sm: 3 } }}>
      <Stack spacing={3} sx={{ maxWidth: 1100, mx: 'auto' }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <WifiIcon sx={{ color: C.accent, fontSize: 28 }} />
          <Box>
            <Typography variant="h5" sx={{ color: C.gold, fontWeight: 700 }}>Connect My Property</Typography>
            <Typography sx={{ color: C.goldMuted, fontSize: 13 }}>
              Link devices you already own - Home Assistant, an MQTT broker, or a camera. Read-only until you decide otherwise.
            </Typography>
          </Box>
        </Stack>

        <Stepper activeStep={stepIndex} sx={{ '& .MuiStepLabel-label': { color: C.goldMuted }, '& .MuiStepLabel-label.Mui-active': { color: C.gold } }}>
          {['Choose', 'Discovering', 'Review', 'Done'].map((label) => (
            <Step key={label}><StepLabel>{label}</StepLabel></Step>
          ))}
        </Stepper>

        {error && <Alert severity="error" onClose={() => setError(null)}>{error}</Alert>}

        {step === 'choose' && (
          <Paper elevation={0} sx={{ bgcolor: C.surface, border: `1px solid ${C.accent}44`, borderRadius: 2, p: 2.5 }}>
            <Stack spacing={2}>
              <TextField select label="What do you want to connect?" value={adapter} onChange={(e) => setAdapter(e.target.value as AdapterKind)} sx={field}>
                {(['home_assistant', 'mqtt', 'onvif'] as AdapterKind[]).map((a) => (
                  <MenuItem key={a} value={a}>{ADAPTER_LABEL[a]}</MenuItem>
                ))}
              </TextField>

              {adapter === 'home_assistant' && (
                <Alert severity="info">
                  Uses the Home Assistant instance already configured on this hub (HA_URL/HA_TOKEN). If it's not set up yet, this will say so rather than finding anything.
                </Alert>
              )}

              {adapter === 'mqtt' && (
                <>
                  <TextField label="Broker URL" placeholder="mqtt://192.168.1.10:1883" value={brokerUrl} onChange={(e) => setBrokerUrl(e.target.value)} sx={field} helperText="Must be a private/local address." />
                  <TextField label="Topic patterns (comma-separated)" placeholder="home/sensor/#, home/switch/#" value={topics} onChange={(e) => setTopics(e.target.value)} sx={field} helperText={'No bare "#", and nothing under "tc/" - that is this hub\'s own device contract.'} />
                </>
              )}

              {adapter === 'onvif' && (
                <Alert severity="info">Scans the local network for ONVIF cameras (about 3 seconds). No credentials needed for discovery itself.</Alert>
              )}

              <Button variant="contained" disabled={busy || (adapter === 'mqtt' && !brokerUrl.trim())} onClick={() => void startDiscovery()}>
                {busy ? <CircularProgress size={20} /> : 'Start discovery'}
              </Button>

              <Divider>or</Divider>

              <Typography sx={{ color: C.gold, fontWeight: 600 }}>Add a camera by URL</Typography>
              <TextField select label="Kind" value={manualKind} onChange={(e) => setManualKind(e.target.value as 'rtsp' | 'onvif')} sx={field}>
                <MenuItem value="rtsp">RTSP URL</MenuItem>
                <MenuItem value="onvif">ONVIF host</MenuItem>
              </TextField>
              <TextField label={manualKind === 'rtsp' ? 'rtsp://192.168.1.50/stream1' : 'http://192.168.1.50/onvif/device_service'} value={manualUrl} onChange={(e) => setManualUrl(e.target.value)} sx={field} />
              <TextField label="Name (optional)" value={manualName} onChange={(e) => setManualName(e.target.value)} sx={field} />
              <Button variant="outlined" disabled={busy || !manualUrl.trim()} onClick={() => void importManual()}>Add camera</Button>
            </Stack>
          </Paper>
        )}

        {step === 'discovering' && (
          <Paper elevation={0} sx={{ bgcolor: C.surface, border: `1px solid ${C.accent}44`, borderRadius: 2, p: 4, textAlign: 'center' }}>
            <CircularProgress sx={{ color: C.accent, mb: 2 }} />
            <Typography sx={{ color: C.white }}>Looking for {ADAPTER_LABEL[adapter]}...</Typography>
          </Paper>
        )}

        {step === 'review' && (
          <Stack spacing={2}>
            {candidates.length === 0 && (
              <Alert severity="info">Nothing found. {adapter === 'onvif' ? 'No ONVIF camera responded on this network.' : 'Check the connection details and try again.'}</Alert>
            )}
            <Grid container spacing={2}>
              {candidates.map((c) => (
                <Grid item xs={12} sm={6} key={c.tempId}>
                  <Paper elevation={0} sx={{ bgcolor: C.surface, border: `1px solid ${C.accent}44`, borderRadius: 2, p: 2 }}>
                    <Stack spacing={1}>
                      <Typography sx={{ color: C.gold, fontWeight: 600 }}>{c.displayName}</Typography>
                      <Typography sx={{ color: C.goldMuted, fontSize: 12 }}>{c.sourceLabel} - {c.identity.externalId}</Typography>
                      <Stack direction="row" spacing={1}>
                        {c.capabilities.map((cap) => <TierChip key={cap.id} tier={cap.tier} />)}
                      </Stack>
                      <Button size="small" variant="contained" disabled={busy} onClick={() => void importOne(c)}>Import (read-only)</Button>
                    </Stack>
                  </Paper>
                </Grid>
              ))}
            </Grid>
            <Button onClick={reset}>Back</Button>
          </Stack>
        )}

        {(step === 'done' || imported.length > 0) && (
          <Paper elevation={0} sx={{ bgcolor: C.surface, border: `1px solid ${C.accent}44`, borderRadius: 2, p: 2.5 }}>
            <Typography sx={{ color: C.gold, fontWeight: 700, mb: 1.5 }}>Connected this session ({imported.length})</Typography>
            <Stack spacing={1}>
              {imported.map((i) => (
                <Stack key={i.id} direction="row" spacing={1.5} alignItems="center">
                  <Typography sx={{ color: C.white }}>{i.displayName}</Typography>
                  <Chip size="small" label={i.provenance} sx={{ bgcolor: `${C.accent}33`, color: C.accent }} />
                  <FormControlLabel
                    control={<Checkbox checked={i.controlEnabled} disabled />}
                    label={<Typography sx={{ color: C.goldMuted, fontSize: 12 }}>Control enabled (not available yet)</Typography>}
                  />
                </Stack>
              ))}
            </Stack>
            {step === 'done' && <Button sx={{ mt: 2 }} onClick={reset}>Connect another</Button>}
          </Paper>
        )}
      </Stack>
    </Box>
  );
}
