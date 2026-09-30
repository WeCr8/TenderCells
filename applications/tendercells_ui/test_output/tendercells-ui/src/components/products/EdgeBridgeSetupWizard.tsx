import { useState } from 'react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Link from '@mui/material/Link';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import app from '../../lib/firebase/firebaseApp';
import type { Product } from '../../types/products';

type Props = { isOpen: boolean; onClose: () => void; product: Product };
type Enrollment = { code: string; deviceId: string; expiresAt: number };

export default function EdgeBridgeSetupWizard({ isOpen, onClose, product }: Props) {
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const deviceId = product.device_id || product.id;

  const createCode = async () => {
    if (!app) { setError('Sign-in services are not configured in this build.'); return; }
    setBusy(true);
    setError('');
    try {
      const result = await httpsCallable<{ deviceId: string }, Enrollment>(getFunctions(app), 'createEdgeEnrollmentCode')({ deviceId });
      setEnrollment(result.data);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'The enrollment code could not be created.');
    } finally {
      setBusy(false);
    }
  };

  const command = enrollment
    ? `export TC_DEVICE_CLAIM_CODE='${enrollment.code}'\nnode deploy/edge-bridge/enroll.mjs --device ${deviceId} --url https://us-central1-tender-cells.cloudfunctions.net/redeemEdgeEnrollmentCode\nunset TC_DEVICE_CLAIM_CODE`
    : '';

  return (
    <Dialog open={isOpen} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Set up {product.product_name || 'edge bridge'}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <Typography>Install the official Raspberry Pi or NVIDIA operating system first, then run the TenderCells enrollment utility on the bridge.</Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
            <Button component={Link} href="https://www.raspberrypi.com/software/" target="_blank" rel="noopener noreferrer" variant="outlined">Raspberry Pi Imager</Button>
            <Button component={Link} href="https://developer.nvidia.com/embedded/learn/get-started-jetson-orin-nano-devkit" target="_blank" rel="noopener noreferrer" variant="outlined">NVIDIA setup</Button>
          </Stack>
          <Alert severity="info">The code expires after 10 minutes and works once. TenderCells never asks for the bridge administrator or Wi-Fi password.</Alert>
          {error && <Alert severity="error">{error}</Alert>}
          {!enrollment ? (
            <Button variant="contained" disabled={busy} onClick={() => void createCode()}>{busy ? 'Creating...' : 'Create enrollment code'}</Button>
          ) : (
            <>
              <Typography variant="h5" component="p" sx={{ fontFamily: 'monospace', fontWeight: 700 }}>{enrollment.code}</Typography>
              <Typography variant="caption">Expires {new Date(enrollment.expiresAt).toLocaleTimeString()}</Typography>
              <Paper variant="outlined" component="pre" sx={{ p: 1.5, m: 0, overflowX: 'auto', whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', fontSize: 12 }}>{command}</Paper>
              <Button variant="outlined" onClick={() => void navigator.clipboard.writeText(command)}>Copy command</Button>
            </>
          )}
        </Stack>
      </DialogContent>
      <DialogActions><Button onClick={onClose}>Done</Button></DialogActions>
    </Dialog>
  );
}
