import { useState, type FormEvent } from 'react';
import { Alert, Box, Button, Paper, Stack, TextField, Typography } from '@mui/material';
import { ControlDeck } from '../control/components/ControlDeck';
import type { DeviceControlCapabilities } from '../control/types';
import { HARDWARE_API_CONFIGURED, HARDWARE_API_ORIGIN } from '../lib/api/hardwareApi';
import { useAuth } from '../contexts/useAuth';
import { useHardwareControl } from '../hooks/useHardwareControl';

const capabilities: DeviceControlCapabilities = {
  motion: true,
  kinematics: 'differential',
  estop: true,
  maxCommandHz: 20,
  allowedProfiles: ['freetouch'],
};

function controlSocketUrl(deviceId: string): string {
  const url = new URL('/api/control/ws', HARDWARE_API_ORIGIN);
  url.searchParams.set('deviceId', deviceId);
  url.searchParams.set('profileId', 'freetouch');
  return url.toString();
}

export default function RoamingRoostLiveControlPage() {
  const { user, loading } = useAuth();
  const [deviceId, setDeviceId] = useState('');
  const [selectedDeviceId, setSelectedDeviceId] = useState('');
  const [controlToken, setControlToken] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const hardware = useHardwareControl(selectedDeviceId);

  const chooseDevice = async (event: FormEvent) => {
    event.preventDefault();
    const id = deviceId.trim();
    if (!/^[A-Za-z0-9][A-Za-z0-9_.:-]{0,95}$/.test(id)) {
      setError('Enter a valid device ID.');
      return;
    }
    if (!user) {
      setError('Sign in before connecting to a physical device.');
      return;
    }
    if (!HARDWARE_API_CONFIGURED) {
      setError('Configure VITE_MQTT_API_BASE_URL for the Tender Cells hardware service.');
      return;
    }
    setConnecting(true);
    setError(null);
    try {
      setControlToken(await user.getIdToken());
      setSelectedDeviceId(id);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not authenticate this control session.');
    } finally {
      setConnecting(false);
    }
  };

  return (
    <Box sx={{ p: { xs: 1, sm: 3 }, maxWidth: 1100, mx: 'auto' }}>
      <Stack spacing={2}>
        <Typography variant="h4" component="h1">Live Roaming Roost control</Typography>
        <Alert severity="warning">
          Stay beside the rover, maintain direct sight, keep the test area clear, and have the physical E-STOP within reach.
          The live path is disabled on the server by default and requires a claimed Roaming Roost.
        </Alert>
        {loading ? <Typography>Checking sign-in…</Typography> : !user ? (
          <Alert severity="info">Sign in to your Tender Cells account to control a device you own.</Alert>
        ) : null}
        {!selectedDeviceId && <Paper component="form" onSubmit={chooseDevice} sx={{ p: 2 }}>
          <Stack spacing={2}>
            <Typography>Enter the ID of a Roaming Roost claimed to your account.</Typography>
            <TextField
              label="Roaming Roost device ID"
              value={deviceId}
              onChange={event => setDeviceId(event.target.value)}
              required
              disabled={!user || connecting}
              autoComplete="off"
            />
            {error && <Alert severity="error">{error}</Alert>}
            <Button type="submit" variant="contained" disabled={!user || connecting}>
              {connecting ? 'Authenticating…' : 'Continue'}
            </Button>
          </Stack>
        </Paper>}
        {selectedDeviceId && <Stack spacing={1}>
          <Typography>Device: {selectedDeviceId}</Typography>
          <Alert severity="info">No camera feed is connected here. Do not drive unless you can see the rover directly.</Alert>
          <ControlDeck
            deviceId={selectedDeviceId}
            capabilities={capabilities}
            controlSocketUrl={controlSocketUrl(selectedDeviceId)}
            controlToken={controlToken}
            simulation={false}
            onEmergencyStop={() => hardware.emergencyStop()}
          />
          <Button variant="outlined" onClick={() => { setSelectedDeviceId(''); setControlToken(''); }}>
            Choose another device
          </Button>
        </Stack>}
      </Stack>
    </Box>
  );
}
