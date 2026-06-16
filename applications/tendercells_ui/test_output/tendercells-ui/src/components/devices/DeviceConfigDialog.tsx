// DeviceConfigDialog.tsx — full device configuration UI.
//
// One dialog to: discover unclaimed devices on the network, CLAIM one to the account,
// then configure everything — nickname, product type, peripheral, grid placement, and
// (for cameras) the live-stream URL + label/aim. Replaces the curl-only claim flow and
// scattered settings so a student can register + set up a device entirely in the UI.

import { useCallback, useEffect, useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Stack, TextField,
  MenuItem, Typography, Alert, Box, Chip,
} from '@mui/material';
import { useHardwareControl, listUnclaimedDevices } from '../../hooks/useHardwareControl';
import { updateDevice } from '../../services/deviceService';

const PRODUCT_TYPES = ['chicken-tender', 'roaming-roost', 'duck-dock', 'bunny-burrow',
  'goat-guardian', 'turkey-tower', 'pigeon-palace', 'watchtower', 'starter', 'custom'];
const PERIPHERALS = ['none', 'door', 'drive', 'relay', 'gantry', 'camera',
  'temp-humidity', 'light', 'ammonia', 'load-cell', 'custom'];

export default function DeviceConfigDialog({
  open, onClose, onSaved,
}: { open: boolean; onClose: () => void; onSaved?: () => void }) {
  const [unclaimed, setUnclaimed] = useState<Array<{ id: string }>>([]);
  const [deviceId, setDeviceId] = useState('');
  const [nickname, setNickname] = useState('');
  const [productType, setProductType] = useState('chicken-tender');
  const [peripheral, setPeripheral] = useState('none');
  const [x, setX] = useState(0);
  const [y, setY] = useState(0);
  const [streamUrl, setStreamUrl] = useState('');
  const [cameraLabel, setCameraLabel] = useState('');
  const [aim, setAim] = useState(0);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const hw = useHardwareControl(deviceId);

  useEffect(() => {
    if (!open) return;
    void listUnclaimedDevices().then(setUnclaimed);
  }, [open]);

  const claim = useCallback(async () => {
    if (!deviceId) { setMsg({ type: 'error', text: 'Enter or pick a device id first' }); return; }
    setBusy(true); setMsg(null);
    try {
      await hw.claim();
      setMsg({ type: 'success', text: `Claimed ${deviceId} to your account` });
    } catch (e) {
      setMsg({ type: 'error', text: e instanceof Error ? e.message : 'Claim failed' });
    } finally { setBusy(false); }
  }, [deviceId, hw]);

  const save = useCallback(async () => {
    if (!deviceId) { setMsg({ type: 'error', text: 'Device id required' }); return; }
    setBusy(true); setMsg(null);
    try {
      await updateDevice(deviceId, {
        nickname,
        // productType + peripheral are validated server-side / by firmware; stored for UI.
        productType: productType as never,
        peripheral,
        location: { x, y },
        ...(peripheral === 'camera' ? { streamUrl, cameraLabel, aim } : {}),
        unclaimed: false,
      } as never);
      setMsg({ type: 'success', text: 'Saved' });
      onSaved?.();
    } catch (e) {
      setMsg({ type: 'error', text: e instanceof Error ? e.message : 'Save failed' });
    } finally { setBusy(false); }
  }, [deviceId, nickname, productType, peripheral, x, y, streamUrl, cameraLabel, aim, onSaved]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ bgcolor: '#0D2B1E', color: '#C8B882' }}>Configure Device</DialogTitle>
      <DialogContent sx={{ bgcolor: '#0D2B1E', pt: 2 }}>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {unclaimed.length > 0 && (
            <Box>
              <Typography variant="caption" sx={{ color: '#8A7D55' }}>Unclaimed on your network — tap to select:</Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 0.5 }}>
                {unclaimed.map((d) => (
                  <Chip key={d.id} label={d.id} onClick={() => setDeviceId(d.id)}
                    color={deviceId === d.id ? 'primary' : 'default'} variant="outlined" />
                ))}
              </Stack>
            </Box>
          )}

          <TextField label="Device ID" value={deviceId} onChange={(e) => setDeviceId(e.target.value)}
            size="small" fullWidth helperText="From the board's serial banner or tc status" />
          <Button onClick={claim} disabled={busy || !deviceId} variant="outlined">Claim to my account</Button>

          <TextField label="Nickname" value={nickname} onChange={(e) => setNickname(e.target.value)} size="small" fullWidth />
          <TextField select label="Product type" value={productType} onChange={(e) => setProductType(e.target.value)} size="small" fullWidth>
            {PRODUCT_TYPES.map((p) => <MenuItem key={p} value={p}>{p}</MenuItem>)}
          </TextField>
          <TextField select label="Peripheral" value={peripheral} onChange={(e) => setPeripheral(e.target.value)} size="small" fullWidth>
            {PERIPHERALS.map((p) => <MenuItem key={p} value={p}>{p}</MenuItem>)}
          </TextField>

          <Stack direction="row" spacing={2}>
            <TextField label="Grid X" type="number" value={x} onChange={(e) => setX(Number(e.target.value))} size="small" fullWidth />
            <TextField label="Grid Y" type="number" value={y} onChange={(e) => setY(Number(e.target.value))} size="small" fullWidth />
          </Stack>

          {peripheral === 'camera' && (
            <>
              <TextField label="Stream URL (MJPEG)" value={streamUrl} onChange={(e) => setStreamUrl(e.target.value)}
                size="small" fullWidth placeholder="http://<lan-ip>/stream (auto-filled from heartbeat)" />
              <Stack direction="row" spacing={2}>
                <TextField label="Camera label" value={cameraLabel} onChange={(e) => setCameraLabel(e.target.value)} size="small" fullWidth />
                <TextField label="Aim (°)" type="number" value={aim} onChange={(e) => setAim(Number(e.target.value))} size="small" fullWidth />
              </Stack>
            </>
          )}

          {msg && <Alert severity={msg.type}>{msg.text}</Alert>}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ bgcolor: '#0D2B1E' }}>
        <Button onClick={onClose} sx={{ color: '#8A7D55' }}>Close</Button>
        <Button onClick={save} disabled={busy} variant="contained" sx={{ bgcolor: '#4A7C59' }}>Save config</Button>
      </DialogActions>
    </Dialog>
  );
}
