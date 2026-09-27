// HuggingFacePolicyCard.tsx - run a Hugging Face LeRobot policy on the arm.
//
// The arm service runs LeRobot's own tools: `lerobot-rollout` on a live LeRobot
// arm, `lerobot-eval` in simulation. Policies are Hub model ids (e.g.
// lerobot/smolvla_base, or your own ACT policy trained on egg pick-and-place);
// language-conditioned policies such as SmolVLA take the task text.
//
// Safety: starting a run moves the arm, so it goes through a confirm dialog and the
// same server-side gate as arm motion (E-STOP, chicken presence). Stop is one tap.
import { useState } from 'react';
import {
  Alert, Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem,
  Paper, Stack, TextField, Typography,
} from '@mui/material';

export interface PolicyStatus {
  state?: string;
  repoId?: string | null;
  task?: string | null;
  mode?: string | null;
  message?: string;
  log?: string[];
}

const HF_REPO_ID = /^[A-Za-z0-9][A-Za-z0-9_.-]{0,95}\/[A-Za-z0-9][A-Za-z0-9_.-]{0,95}$/;

// Starting points for farm work - any Hub policy id can be typed instead.
const PRESETS = [
  { label: 'SmolVLA (language-conditioned)', repoId: 'lerobot/smolvla_base', task: 'pick the ripe tomato and place it in the basket' },
  { label: 'Egg pick-and-place (your ACT policy)', repoId: 'your-org/act_egg_pick', task: 'pick up the egg and place it in the tray' },
  { label: 'Diffusion Policy (Push-T sim check)', repoId: 'lerobot/diffusion_pusht', task: '' },
];

interface Props {
  mode: string;                 // "simulation" | "live" from state/arm
  status?: PolicyStatus;
  disabled?: boolean;
  onRun: (repoId: string, task: string, durationS: number, simEnv?: string) => Promise<unknown>;
  onStop: () => Promise<unknown>;
}

export default function HuggingFacePolicyCard({ mode, status, disabled, onRun, onStop }: Props) {
  const [repoId, setRepoId] = useState(PRESETS[0].repoId);
  const [task, setTask] = useState(PRESETS[0].task);
  const [duration, setDuration] = useState(30);
  const [simEnv, setSimEnv] = useState('pusht');
  const [confirm, setConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const running = status?.state === 'running';
  const simulated = mode === 'simulation';
  const repoValid = HF_REPO_ID.test(repoId.trim());

  const start = async () => {
    setConfirm(false);
    setError(null);
    try {
      await onRun(repoId.trim(), task.trim(), duration, simulated ? simEnv : undefined);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  return (
    <Paper sx={{ p: 2, mb: 3, bgcolor: '#1A3D2B', border: '1px solid #4A7C59' }}>
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }} flexWrap="wrap" useFlexGap>
        <Typography variant="h6" sx={{ color: '#C8B882' }}>🤗 Hugging Face policy</Typography>
        <Chip size="small" label={simulated ? 'SIMULATION · lerobot-eval' : 'LIVE · lerobot-rollout'}
          sx={{ bgcolor: simulated ? '#E8A02033' : '#4A7C5955', color: simulated ? '#E8A020' : '#C8B882' }} />
        {status?.state && status.state !== 'idle' && (
          <Chip size="small" label={status.state.toUpperCase()} aria-label="Policy status"
            sx={{ bgcolor: running ? '#E8A020' : status.state === 'failed' ? '#CC3333' : '#4A7C59', color: '#F0EDE4' }} />
        )}
      </Stack>
      <Typography variant="caption" sx={{ color: '#8A7D55', display: 'block', mb: 1.5 }}>
        Runs a LeRobot policy from the Hugging Face Hub on this arm. Use a policy trained for your
        arm (e.g. SO-101) and task. Language models like SmolVLA follow the task text.
      </Typography>

      <Stack spacing={1.5}>
        <TextField select size="small" label="Start from" value="" onChange={(e) => {
          const p = PRESETS[Number(e.target.value)];
          if (p) { setRepoId(p.repoId); setTask(p.task); }
        }}>
          {PRESETS.map((p, i) => <MenuItem key={p.repoId} value={i}>{p.label}</MenuItem>)}
        </TextField>
        <TextField size="small" label="Hugging Face model id" value={repoId} onChange={(e) => setRepoId(e.target.value)}
          error={!!repoId && !repoValid} helperText={!repoValid ? 'Format: owner/model, e.g. lerobot/smolvla_base' : undefined}
          inputProps={{ 'aria-label': 'Hugging Face model id' }} />
        <TextField size="small" label="Task (for language-conditioned policies)" value={task}
          onChange={(e) => setTask(e.target.value.slice(0, 200))} inputProps={{ 'aria-label': 'Policy task' }} />
        <Stack direction="row" spacing={1}>
          <TextField size="small" type="number" label="Max seconds" value={duration} sx={{ width: 140 }}
            onChange={(e) => setDuration(Math.max(1, Math.min(600, Number(e.target.value) || 30)))} />
          {simulated && (
            <TextField select size="small" label="Sim environment" value={simEnv} onChange={(e) => setSimEnv(e.target.value)} sx={{ flex: 1 }}>
              {['pusht', 'aloha', 'libero', 'metaworld'].map((env) => <MenuItem key={env} value={env}>{env}</MenuItem>)}
            </TextField>
          )}
        </Stack>
        <Stack direction="row" spacing={1}>
          <Button variant="contained" disabled={disabled || running || !repoValid} onClick={() => setConfirm(true)}
            sx={{ bgcolor: '#4A7C59', flex: 1 }}>
            Run policy
          </Button>
          <Button variant="outlined" color="error" disabled={!running} onClick={() => { void onStop(); }} sx={{ flex: 1 }}>
            Stop policy
          </Button>
        </Stack>
      </Stack>

      {error && <Alert severity="error" sx={{ mt: 1.5 }}>{error}</Alert>}
      {status?.message && status.state !== 'idle' && (
        <Typography variant="caption" sx={{ color: '#C8B882', display: 'block', mt: 1 }}>{status.message}</Typography>
      )}
      {!!status?.log?.length && (
        <Box component="pre" sx={{ mt: 1, p: 1, bgcolor: '#0D2B1E', color: '#8A7D55', fontSize: 11, maxHeight: 120, overflow: 'auto', whiteSpace: 'pre-wrap' }}>
          {status.log.join('\n')}
        </Box>
      )}

      <Dialog open={confirm} onClose={() => setConfirm(false)} PaperProps={{ sx: { bgcolor: '#1A3D2B', color: '#F0EDE4' } }}>
        <DialogTitle sx={{ color: '#C8B882' }}>Run Hugging Face policy</DialogTitle>
        <DialogContent>
          <Typography>
            Run <strong>{repoId}</strong>{task ? <> for “{task}”</> : null} for up to {duration}s
            {simulated ? ' in simulation?' : '? The arm will move on its own. Keep people and animals clear; E-STOP stops it at once.'}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirm(false)} sx={{ color: '#8A7D55' }}>Cancel</Button>
          <Button variant="contained" onClick={start} sx={{ bgcolor: '#4A7C59' }}>Confirm</Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}
