// FarmBotLivePanel.tsx - live link from a garden to the user's FarmBot on my.farm.bot.
//
// Uses FarmBot's own MIT-licensed `farmbot` client (loaded on demand) against
// FarmBot Inc's hosted instance, so it always talks to their current software -
// no fork. Shows online / E-STOP state and tool position, mirrors the position
// into the 3D yard, sends E-STOP, and runs saved sequences. Editing, planting and
// sequence building stay in FarmBot's web app (the "Open FarmBot Web App" button).
//
// Safety: E-STOP is one tap. Unlock and Run sequence move hardware, so both go
// through a confirm dialog (CLAUDE.md: no hardware action without confirmation).
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert, Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle,
  MenuItem, Stack, TextField, Typography,
} from '@mui/material';
import type { Farmbot } from 'farmbot';
import type { PropertyItem } from '../property/propertyLayoutStore';
import {
  clearFarmBotSession, listFarmBotSequences, loadFarmBotSession, publishFarmBotPosition,
  requestFarmBotToken, saveFarmBotSession, type FarmBotPosition, type FarmBotSequence, type FarmBotToken,
} from '../../lib/farmbot/farmbotCloud';

const FARMBOT_GREEN = '#61B833';
const CONNECT_TIMEOUT_MS = 15000;

type Phase = 'signed-out' | 'connecting' | 'connected';
type Pending = { title: string; message: string; run: () => Promise<unknown> } | null;

interface LiveState {
  online: boolean;
  locked: boolean;
  busy: boolean;
  position: FarmBotPosition | null;
}

const fmt = (v: number | null | undefined) => (typeof v === 'number' ? Math.round(v).toString() : '—');

/**
 * Live FarmBot controls for one garden item.
 *
 * @param item - Garden PropertyItem the FarmBot is linked to
 */
export default function FarmBotLivePanel({ item }: { item: PropertyItem }) {
  const [phase, setPhase] = useState<Phase>('signed-out');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [live, setLive] = useState<LiveState>({ online: false, locked: false, busy: false, position: null });
  const [sequences, setSequences] = useState<FarmBotSequence[]>([]);
  const [sequenceId, setSequenceId] = useState<number | ''>('');
  const [pending, setPending] = useState<Pending>(null);
  const botRef = useRef<Farmbot | null>(null);

  const disconnectBot = useCallback(() => {
    botRef.current?.client?.end(true);
    botRef.current = null;
    publishFarmBotPosition(item.id, null);
  }, [item.id]);

  const connect = useCallback(async (token: FarmBotToken) => {
    setPhase('connecting');
    setError(null);
    try {
      // Loaded on demand so the MQTT client is not in the main bundle.
      const { Farmbot } = await import('farmbot');
      const bot = new Farmbot({ token: token.encoded });
      bot.on('online', () => setLive((s) => ({ ...s, online: true })));
      bot.on('offline', () => setLive((s) => ({ ...s, online: false })));
      bot.on('status', (status: { location_data?: { position?: FarmBotPosition }; informational_settings?: { locked?: boolean; busy?: boolean } }) => {
        const position = status.location_data?.position ?? null;
        setLive((s) => ({
          ...s,
          online: true,
          locked: !!status.informational_settings?.locked,
          busy: !!status.informational_settings?.busy,
          position,
        }));
        if (position) publishFarmBotPosition(item.id, position);
      });
      botRef.current = bot; // so a timeout/unmount can close the half-open client
      // farmbot-js's connect() never rejects (MQTT.js keeps retrying), so bound it.
      await Promise.race([
        bot.connect(),
        new Promise((_, reject) => setTimeout(
          () => reject(new Error('FarmBot\'s live server did not answer. Try again in a moment.')),
          CONNECT_TIMEOUT_MS,
        )),
      ]);
      setPhase('connected');
      listFarmBotSequences(token.encoded)
        .then(setSequences)
        .catch((err: unknown) => setNotice(`Sequences unavailable: ${err instanceof Error ? err.message : String(err)}`));
    } catch (err) {
      disconnectBot();
      setPhase('signed-out');
      setError(`Could not connect to your FarmBot: ${err instanceof Error ? err.message : String(err)}`);
    }
  }, [disconnectBot, item.id]);

  // Resume this tab's session (token only) when the panel reopens.
  useEffect(() => {
    const token = loadFarmBotSession(item.id);
    if (token) void connect(token);
    return () => disconnectBot();
  }, [connect, disconnectBot, item.id]);

  const signIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      setPhase('connecting');
      const token = await requestFarmBotToken(email.trim(), password);
      setPassword(''); // never kept
      saveFarmBotSession(item.id, token);
      await connect(token);
    } catch (err) {
      setPhase('signed-out');
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  const signOut = () => {
    disconnectBot();
    clearFarmBotSession(item.id);
    setLive({ online: false, locked: false, busy: false, position: null });
    setSequences([]);
    setSequenceId('');
    setPhase('signed-out');
  };

  const rpc = async (label: string, run: () => Promise<unknown>) => {
    setNotice(null);
    setError(null);
    try {
      await run();
      setNotice(`${label} sent to FarmBot.`);
    } catch (err) {
      const text = typeof err === 'object' && err && 'args' in err
        ? JSON.stringify((err as { args: unknown }).args)
        : err instanceof Error ? err.message : String(err);
      setError(`${label} failed: ${text}`);
    }
  };

  if (phase !== 'connected') {
    return (
      <Box component="form" onSubmit={signIn} sx={{ mt: 1.5 }}>
        <Typography variant="caption" sx={{ color: '#8A7D55', display: 'block', mb: 0.75 }}>
          Connect your FarmBot account for live status, E-STOP and sequences here.
          Your password goes to FarmBot only and is not saved.
        </Typography>
        {error && <Alert severity="error" sx={{ mb: 1, py: 0 }}>{error}</Alert>}
        <Stack spacing={1}>
          <TextField size="small" type="email" required placeholder="FarmBot email" autoComplete="username"
            value={email} onChange={(e) => setEmail(e.target.value)} inputProps={{ 'aria-label': 'FarmBot email' }} />
          <TextField size="small" type="password" required placeholder="FarmBot password" autoComplete="current-password"
            value={password} onChange={(e) => setPassword(e.target.value)} inputProps={{ 'aria-label': 'FarmBot password' }} />
          <Button type="submit" variant="outlined" disabled={phase === 'connecting'}
            sx={{ borderColor: FARMBOT_GREEN, color: FARMBOT_GREEN }}>
            {phase === 'connecting' ? 'Connecting…' : 'Connect FarmBot'}
          </Button>
        </Stack>
      </Box>
    );
  }

  const bot = botRef.current;
  return (
    <Box sx={{ mt: 1.5 }}>
      <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap sx={{ mb: 1 }}>
        <Chip size="small" label={live.online ? 'Online' : 'Offline'}
          sx={{ bgcolor: live.online ? `${FARMBOT_GREEN}33` : '#8A7D5533', color: live.online ? FARMBOT_GREEN : '#C8B882' }} />
        {live.locked && <Chip size="small" label="E-STOP active" sx={{ bgcolor: '#CC3333', color: '#F0EDE4' }} />}
        {live.busy && <Chip size="small" label="Moving" sx={{ bgcolor: '#E8A02033', color: '#E8A020' }} />}
        <Box sx={{ flex: 1 }} />
        <Button size="small" onClick={signOut} sx={{ color: '#8A7D55' }}>Disconnect</Button>
      </Stack>

      <Typography variant="body2" sx={{ fontFamily: 'monospace', color: '#E4E7E5', mb: 1 }} aria-label="FarmBot position">
        X {fmt(live.position?.x)} · Y {fmt(live.position?.y)} · Z {fmt(live.position?.z)} mm
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 1, py: 0 }}>{error}</Alert>}
      {notice && <Alert severity="info" sx={{ mb: 1, py: 0 }}>{notice}</Alert>}

      <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
        <Button fullWidth variant="contained" disabled={!bot}
          onClick={() => bot && rpc('E-STOP', () => bot.emergencyLock())}
          sx={{ bgcolor: '#CC3333', '&:hover': { bgcolor: '#B22A2A' }, fontWeight: 700 }}>
          E-STOP
        </Button>
        <Button fullWidth variant="outlined" disabled={!bot || !live.locked}
          onClick={() => bot && setPending({
            title: 'Unlock FarmBot',
            message: 'Clear the E-STOP on your FarmBot? It can move again after this.',
            run: () => rpc('Unlock', () => bot.emergencyUnlock()),
          })}
          sx={{ borderColor: '#4A7C59', color: '#9CCC65' }}>
          Unlock
        </Button>
      </Stack>

      <Stack direction="row" spacing={1}>
        <TextField select size="small" fullWidth label="Sequence" value={sequenceId}
          onChange={(e) => setSequenceId(Number(e.target.value))}
          disabled={!sequences.length} helperText={sequences.length ? undefined : 'No saved sequences yet'}>
          {sequences.map((s) => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
        </TextField>
        <Button variant="contained" disabled={!bot || sequenceId === '' || live.locked}
          onClick={() => {
            const seq = sequences.find((s) => s.id === sequenceId);
            if (!bot || !seq) return;
            setPending({
              title: 'Run FarmBot sequence',
              message: `Run "${seq.name}" on your FarmBot now? The gantry will move.`,
              run: () => rpc(`Sequence "${seq.name}"`, () => bot.execSequence(seq.id)),
            });
          }}
          sx={{ bgcolor: '#4A7C59', alignSelf: 'flex-start' }}>
          Run
        </Button>
      </Stack>

      <Dialog open={!!pending} onClose={() => setPending(null)} PaperProps={{ sx: { bgcolor: '#1A3D2B', color: '#F0EDE4' } }}>
        <DialogTitle sx={{ color: '#C8B882' }}>{pending?.title}</DialogTitle>
        <DialogContent><Typography>{pending?.message}</Typography></DialogContent>
        <DialogActions>
          <Button onClick={() => setPending(null)} sx={{ color: '#8A7D55' }}>Cancel</Button>
          <Button variant="contained" sx={{ bgcolor: '#4A7C59' }}
            onClick={() => { const p = pending; setPending(null); void p?.run(); }}>
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
