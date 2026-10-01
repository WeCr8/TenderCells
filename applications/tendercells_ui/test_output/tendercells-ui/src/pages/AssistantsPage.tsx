// AssistantsPage.tsx - /assistants: connect Claude or ChatGPT to YOUR farm, and see or
// disconnect the assistants you've connected. Customer-facing and scoped to the signed-in
// person: the hosted connector (tendercells.com/mcp) can only read the devices on this
// account - never other people's farms, never Firebase or admin settings, never hardware.
// Usage: Account → "Claude & ChatGPT" in the side menu.
import { useCallback, useEffect, useState } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from '../lib/firebase/firebaseApp';

const C = { bg: '#0D2B1E', surface: '#1A3D2B', accent: '#4A7C59', gold: '#C8B882', goldMuted: '#8A7D55', white: '#F0EDE4', warning: '#E8A020', danger: '#CC3333' };
export const CONNECTOR_URL = 'https://tendercells.com/mcp';
export const DEMO_URL = 'https://tendercells.com/mcp/demo';

interface Connection { clientId: string; name: string; host: string; connectedAt: number; until: number }

function CopyField({ value, label }: { value: string; label: string }) {
  const [done, setDone] = useState(false);
  return (
    <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
      <Box component="code" aria-label={label} sx={{ flex: 1, px: 1.25, py: 0.9, bgcolor: '#08170F', color: C.white, borderRadius: 1, border: `1px solid ${C.accent}88`, fontSize: 15, wordBreak: 'break-all' }}>{value}</Box>
      <Button variant="outlined" onClick={() => { void navigator.clipboard?.writeText(value).then(() => setDone(true)).catch(() => {}); }} sx={{ borderColor: C.accent, color: C.gold, minWidth: 92 }}>
        {done ? 'Copied ✓' : 'Copy'}
      </Button>
    </Stack>
  );
}

const STEPS: Array<{ app: string; steps: string[]; note: string }> = [
  { app: 'Claude', steps: ['Open Settings → Connectors and choose Add custom connector.', 'Name it Tender Cells and paste the address above.', 'Click Connect, sign in with your Tender Cells account and choose Allow read-only access.', 'In a chat, turn Tender Cells on (+ or tools menu) and ask "How is my farm?"'], note: 'Works on claude.ai, the desktop app and - once added - the mobile apps.' },
  { app: 'ChatGPT', steps: ['Open Settings → Apps & Connectors and create a connector (developer mode may need to be on until Tender Cells is in the app directory).', 'Paste the address above and choose OAuth.', 'Sign in with your Tender Cells account and allow read-only access.', 'Ask "How is my farm?"'], note: 'Menu names change from time to time - look for Connectors.' },
];

export default function AssistantsPage() {
  const [user, setUser] = useState<User | null>(auth.currentUser);
  const [connections, setConnections] = useState<Connection[] | null>(null);
  const [state, setState] = useState<'idle' | 'loading' | 'offline' | 'error'>('idle');
  const [confirm, setConfirm] = useState<Connection | null>(null);

  useEffect(() => {
    try { return onAuthStateChanged(auth, setUser); } catch { return undefined; }
  }, []);

  const call = useCallback(async (path: string, init?: RequestInit) => {
    const token = await user!.getIdToken();
    const r = await fetch(path, { ...init, headers: { ...(init?.headers ?? {}), Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } });
    if (!(r.headers.get('content-type') ?? '').includes('json')) throw new Error('offline');
    if (!r.ok) throw new Error('error');
    return r.json();
  }, [user]);

  const load = useCallback(async () => {
    if (!user) return;
    setState('loading');
    try {
      const body = await call('/oauth/connections') as { connections: Connection[] };
      setConnections(body.connections);
      setState('idle');
    } catch (e) {
      setState((e as Error).message === 'offline' ? 'offline' : 'error');
    }
  }, [call, user]);

  useEffect(() => { void load(); }, [load]);

  const disconnect = async (c: Connection) => {
    setConfirm(null);
    try {
      await call('/oauth/connections/revoke', { method: 'POST', body: JSON.stringify({ clientId: c.clientId }) });
    } finally {
      void load();
    }
  };

  return (
    <Box sx={{ p: { xs: 2, sm: 3 }, maxWidth: 1000, mx: 'auto' }} data-testid="assistants-page">
      <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 1 }}>
        <Box component="img" src={`${import.meta.env.BASE_URL ?? "/"}brand/tendercells-icon-128.png`} alt="" sx={{ width: 56, height: 56, borderRadius: 2 }} />
        <Box>
          <Typography variant="h4" component="h1" sx={{ color: C.gold, fontWeight: 800, fontSize: { xs: 26, sm: 32 } }}>Claude &amp; ChatGPT</Typography>
          <Typography sx={{ color: C.white }}>Ask about your farm in plain words: “How are the chickens?”, “Any predator alerts tonight?”</Typography>
        </Box>
      </Stack>

      <Paper elevation={0} sx={{ p: 2, mt: 2, bgcolor: C.surface, color: C.white, border: `1px solid ${C.gold}66` }}>
        <Typography sx={{ color: C.gold, fontWeight: 800 }}>Your connector address</Typography>
        <CopyField value={CONNECTOR_URL} label="Tender Cells connector address" />
        <Typography sx={{ color: C.goldMuted, fontSize: 13, mt: 1 }}>
          Want to try it first? The demo farm needs no sign-in: <Box component="span" sx={{ color: C.white }}>{DEMO_URL}</Box>
        </Typography>
      </Paper>

      <Grid container spacing={1.5} sx={{ mt: 0.5 }}>
        {STEPS.map((s) => (
          <Grid item xs={12} md={6} key={s.app}>
            <Paper elevation={0} sx={{ p: 2, height: '100%', bgcolor: C.surface, color: C.white, border: `1px solid ${C.accent}55` }}>
              <Typography sx={{ color: C.gold, fontWeight: 800, fontSize: 18 }}>Add to {s.app}</Typography>
              <Box component="ol" sx={{ pl: 2.5, my: 1, '& li': { mb: 0.75 } }}>{s.steps.map((t) => <li key={t}>{t}</li>)}</Box>
              <Typography sx={{ color: C.goldMuted, fontSize: 13 }}>{s.note}</Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Paper elevation={0} sx={{ p: 2, mt: 1.5, bgcolor: C.surface, color: C.white, border: `1px solid ${C.accent}55` }}>
        <Typography sx={{ color: C.gold, fontWeight: 800 }}>What an assistant can and can't do</Typography>
        <Grid container spacing={1} sx={{ mt: 0.25 }}>
          <Grid item xs={12} sm={6}>
            <Box component="ul" sx={{ pl: 2.5, m: 0, '& li': { mb: 0.5 } }}>
              <li>✓ Read <strong>your</strong> devices: temperature, humidity, ammonia, feed, water, headcount, door</li>
              <li>✓ See state, online status and predator / fault / health alerts</li>
              <li>✓ Flag animal-health problems first and show a farm card</li>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Box component="ul" sx={{ pl: 2.5, m: 0, '& li': { mb: 0.5 } }}>
              <li>✕ Move hardware: doors, feeders, robots, E-STOP stay in this app</li>
              <li>✕ See other people's farms, your password or payment details</li>
              <li>✕ Change account, Firebase or admin settings</li>
            </Box>
          </Grid>
        </Grid>
        <Typography sx={{ color: C.goldMuted, fontSize: 13, mt: 1 }}>Your hub must be signed in to your account to share readings with the cloud.</Typography>
      </Paper>

      <Paper elevation={0} sx={{ p: 2, mt: 1.5, bgcolor: C.surface, color: C.white, border: `1px solid ${C.accent}55` }} data-testid="assistant-connections">
        <Typography sx={{ color: C.gold, fontWeight: 800 }}>Connected assistants</Typography>
        {!user && <Typography sx={{ mt: 0.5 }}>Sign in to see and manage the assistants connected to your farm.</Typography>}
        {user && state === 'loading' && <Typography sx={{ mt: 0.5, color: C.goldMuted }}>Loading…</Typography>}
        {user && state === 'offline' && <Alert severity="info" sx={{ mt: 1 }}>Connected assistants are listed on tendercells.com (not in local or demo builds).</Alert>}
        {user && state === 'error' && <Alert severity="warning" sx={{ mt: 1 }}>Couldn't load your connections. <Button size="small" onClick={() => void load()}>Retry</Button></Alert>}
        {user && state === 'idle' && connections && connections.length === 0 && <Typography sx={{ mt: 0.5, color: C.goldMuted }}>None yet. Add Tender Cells in Claude or ChatGPT using the steps above.</Typography>}
        {user && connections && connections.length > 0 && (
          <Stack spacing={1} sx={{ mt: 1 }}>
            {connections.map((c) => (
              <Stack key={c.clientId} direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ sm: 'center' }}
                sx={{ p: 1.25, bgcolor: C.bg, borderRadius: 1.5, border: `1px solid ${C.accent}55` }} data-testid="assistant-connection">
                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ fontWeight: 800 }}>{c.name} <Box component="span" sx={{ color: C.goldMuted, fontWeight: 400 }}>· {c.host}</Box></Typography>
                  <Typography sx={{ color: C.goldMuted, fontSize: 13 }}>Read-only · connected {new Date(c.connectedAt).toLocaleDateString()}</Typography>
                </Box>
                <Button variant="outlined" onClick={() => setConfirm(c)} sx={{ borderColor: C.danger, color: '#F08A80' }}>Disconnect</Button>
              </Stack>
            ))}
          </Stack>
        )}
      </Paper>

      <Dialog open={confirm !== null} onClose={() => setConfirm(null)} PaperProps={{ sx: { bgcolor: C.surface, color: C.white } }}>
        <DialogTitle sx={{ color: C.gold }}>Disconnect {confirm?.name}?</DialogTitle>
        <DialogContent>It will stop reading your farm right away. You can connect it again later from {confirm?.name}.</DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirm(null)} sx={{ color: C.goldMuted }}>Cancel</Button>
          <Button variant="contained" onClick={() => confirm && void disconnect(confirm)} sx={{ bgcolor: C.danger }}>Disconnect</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
