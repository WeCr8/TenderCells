// ApiKeysSection.tsx - Settings → Robot & hub API keys: issue, list and revoke long-lived keys for
// robots, hubs and starter nodes. A key is shown once; the cloud keeps only its SHA-256 hash.
import { useCallback, useEffect, useState } from 'react';
import {
  Alert, Box, Button, Checkbox, Chip, FormControlLabel, IconButton, Stack, TextField, Tooltip, Typography,
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import {
  API_KEY_SCOPES, API_KEYS_AVAILABLE, SCOPE_LABELS, apiKeysService, keyStatus, type ApiKeyScope, type ApiKeyView,
} from '../../services/apiKeysService';

const C = { surface: '#1A3D2B', accent: '#4A7C59', gold: '#C8B882', goldMuted: '#8A7D55', danger: '#CC3333', white: '#F0EDE4' };
const inputSx = {
  '& label': { color: C.goldMuted },
  '& input': { color: C.white },
  '& .MuiOutlinedInput-notchedOutline': { borderColor: C.accent },
};
const fmt = (ms: number | null) => (ms ? new Date(ms).toLocaleDateString() : '—');

export default function ApiKeysSection({ signedIn }: { signedIn: boolean }) {
  const [keys, setKeys] = useState<ApiKeyView[]>([]);
  const [name, setName] = useState('');
  const [scopes, setScopes] = useState<ApiKeyScope[]>(['device:telemetry', 'device:commands']);
  const [deviceId, setDeviceId] = useState('');
  const [days, setDays] = useState('365');
  const [created, setCreated] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    if (!API_KEYS_AVAILABLE || !signedIn) return;
    try {
      setKeys(await apiKeysService.list());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load API keys');
    }
  }, [signedIn]);

  useEffect(() => { void refresh(); }, [refresh]);

  const create = async () => {
    setBusy(true); setError(null); setCreated(null);
    try {
      const out = await apiKeysService.create({
        name: name.trim(), scopes, ...(deviceId.trim() ? { deviceId: deviceId.trim() } : {}),
        ...(Number(days) > 0 ? { expiresInDays: Number(days) } : {}),
      });
      setCreated(out.key);
      setName(''); setDeviceId('');
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not create the key');
    } finally { setBusy(false); }
  };

  const revoke = async (keyId: string) => {
    setBusy(true); setError(null);
    try {
      await apiKeysService.revoke(keyId);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not revoke the key');
    } finally { setBusy(false); }
  };

  if (!API_KEYS_AVAILABLE) {
    return <Alert severity="info">API keys need a signed-in Tender Cells account. This build runs in simulation only.</Alert>;
  }
  if (!signedIn) return <Alert severity="info">Sign in to issue API keys for your robots and hubs.</Alert>;

  const toggle = (s: ApiKeyScope) => setScopes((cur) => (cur.includes(s) ? cur.filter((x) => x !== s) : [...cur, s]));

  return (
    <Stack spacing={2}>
      <Typography sx={{ color: C.goldMuted, fontSize: 13 }}>
        Long-lived keys for robots, hubs and starter nodes. A key acts as your account, only with the
        permissions you tick, and optionally only for one device. Send it as <code>Authorization: Bearer tck_…</code> to
        the hub or device API, or as the MQTT password (username = device id) on a starter node.
      </Typography>

      {created && (
        <Alert severity="success" sx={{ wordBreak: 'break-all' }}
          action={<Tooltip title="Copy"><IconButton size="small" onClick={() => void navigator.clipboard?.writeText(created)}><ContentCopyIcon fontSize="small" /></IconButton></Tooltip>}>
          Copy this key now. It will not be shown again:<br /><code data-testid="new-api-key">{created}</code>
        </Alert>
      )}
      {error && <Alert severity="error">{error}</Alert>}

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
        <TextField label="Name" placeholder="Coop robot" value={name} onChange={(e) => setName(e.target.value)} size="small" sx={{ ...inputSx, flex: 1 }} />
        <TextField label="Only for device (optional)" placeholder="ct_001" value={deviceId} onChange={(e) => setDeviceId(e.target.value)} size="small" sx={{ ...inputSx, flex: 1 }} />
        <TextField label="Expires in days" type="number" value={days} onChange={(e) => setDays(e.target.value)} size="small" sx={{ ...inputSx, width: 140 }}
          helperText="Blank = never" FormHelperTextProps={{ sx: { color: C.goldMuted } }} inputProps={{ min: 1, max: 730 }} />
      </Stack>
      <Box>
        {API_KEY_SCOPES.map((s) => (
          <FormControlLabel key={s} sx={{ color: C.white, display: 'block' }}
            control={<Checkbox size="small" checked={scopes.includes(s)} onChange={() => toggle(s)} sx={{ color: C.accent }} />}
            label={<span><code>{s}</code> — {SCOPE_LABELS[s]}</span>} />
        ))}
      </Box>
      <Box>
        <Button variant="contained" onClick={() => void create()} disabled={busy || !name.trim() || scopes.length === 0} sx={{ bgcolor: C.accent }}>
          Create key
        </Button>
      </Box>

      <Stack spacing={1}>
        {keys.length === 0 && <Typography sx={{ color: C.goldMuted, fontSize: 13 }}>No keys yet.</Typography>}
        {keys.map((k) => {
          const status = keyStatus(k);
          return (
            <Stack key={k.keyId} direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ sm: 'center' }}
              sx={{ p: 1.5, borderRadius: 1, border: `1px solid ${C.accent}44`, opacity: status === 'active' ? 1 : 0.6 }}>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography sx={{ color: C.white, fontWeight: 600 }}>{k.name} <code style={{ color: C.goldMuted, fontWeight: 400 }}>{k.preview}</code></Typography>
                <Typography sx={{ color: C.goldMuted, fontSize: 12 }}>
                  {k.scopes.join(', ')}{k.deviceId ? ` · only ${k.deviceId}` : ''} · created {fmt(k.createdAt)} · expires {fmt(k.expiresAt)} · last used {fmt(k.lastUsedAt)}
                </Typography>
              </Box>
              <Chip size="small" label={status} color={status === 'active' ? 'success' : 'default'} />
              {status === 'active' && (
                <Button size="small" onClick={() => void revoke(k.keyId)} disabled={busy} sx={{ color: C.danger }}>Revoke</Button>
              )}
            </Stack>
          );
        })}
      </Stack>
    </Stack>
  );
}
