// YardAttentionPanel.tsx - "Needs attention" list for the station flags on the 3D map.
//
// Usage: <YardAttentionPanel flags={flags} act={act} onFocus={...} />
// Eggs / pickups: "Picked up" clears the flag; WatchTower predator alerts: "Seen it". Weeds (human in the loop): each
// detection waits for a person - Aim (aiming dot only), Burn (laser, interlocked
// on the robot) or Not a weed. Aim and Burn move hardware, so they confirm first.
// Weeds found by a camera-only rover scout get "Pulled it" (done by hand) or Not a weed.
import { useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Snackbar from '@mui/material/Snackbar';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import type { YardAction } from '../../hooks/useYardEvents';
import { FLAG_COLORS, needsAttention, type YardFlag } from '../../lib/yard/yardTypes';
import { findingColor, urgency } from '../../lib/yard/detections';

const colors = {
  bg: '#0D2B1E',
  surface: '#1A3D2B',
  accent: '#4A7C59',
  gold: '#C8B882',
  goldMuted: '#8A7D55',
  danger: '#CC3333',
  warning: '#E8A020',
  white: '#F0EDE4',
};

const ICON: Record<YardFlag['type'], string> = {
  egg_ready: '🥚', pickup_ready: '📦', weed_detected: '🌱', headcount: '🐔', alert: '⚠️',
};

/** Row icon: leaks and rover animal sightings get their own. */
const iconFor = (f: YardFlag): string =>
  f.finding === 'leak' ? '💧' : f.animalGroup === 'flock' ? '🐔' : f.finding === 'animal' ? '🐾' : f.finding === 'plant' ? '🍂' : ICON[f.type];

interface Props {
  flags: YardFlag[];
  act: (flag: YardFlag, action: YardAction) => Promise<string>;
  /** Called when a flag row is clicked (e.g. switch the map to show items). */
  onFocus?: (flag: YardFlag) => void;
  /** Rows shown before "+N more". */
  maxRows?: number;
  /** Fill the parent (page layout) instead of the compact map overlay size. */
  fill?: boolean;
}

const CONFIRM: Record<'aim' | 'burn', { title: string; message: string }> = {
  aim: {
    title: 'Aim at this weed?',
    message: 'The robot will move over the bed and point its low-power aiming dot at the weed. Keep hands, people and animals clear of the gantry.',
  },
  burn: {
    title: 'Fire the laser on this weed?',
    message: 'The robot will move and pulse its weeding laser (Class 4). It re-checks E-STOP, burn enable and the closed enclosure before firing. '
      + 'Confirm that no people or animals are near the bed and nobody is looking at the beam.',
  },
};

/** Compact list of flags that need a person, with the allowed actions per flag. */
export default function YardAttentionPanel({ flags, act, onFocus, maxRows = 6, fill = false }: Props) {
  const [confirm, setConfirm] = useState<{ flag: YardFlag; action: 'aim' | 'burn' } | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [snack, setSnack] = useState<{ msg: string; error?: boolean } | null>(null);
  const [collapsed, setCollapsed] = useState(false);

  // Leaks and predators first, then animals out, then the rest; newest first within each.
  const open = flags.filter(needsAttention).sort((a, b) => urgency(a) - urgency(b) || b.updatedAt - a.updatedAt);
  const counts = flags.filter((f) => f.type === 'headcount');

  const run = async (flag: YardFlag, action: YardAction) => {
    setBusy(`${flag.deviceId}:${flag.id}`);
    try {
      setSnack({ msg: await act(flag, action) });
    } catch (err) {
      setSnack({ msg: err instanceof Error ? err.message : String(err), error: true });
    } finally {
      setBusy(null);
    }
  };

  if (!open.length && !counts.length) return null;

  return (
    <Box
      data-testid="yard-attention"
      sx={{
        bgcolor: 'rgba(13,43,30,0.9)', border: `1px solid ${colors.accent}`, borderRadius: 2, p: 1.25,
        maxWidth: fill ? 'none' : 360, maxHeight: fill ? 'none' : 320, overflowY: 'auto', color: colors.white, backdropFilter: 'blur(4px)',
      }}
    >
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: open.length && !collapsed ? 1 : 0, flexWrap: 'wrap', rowGap: 0.5 }}>
        <Typography variant="subtitle2" sx={{ color: colors.gold, fontWeight: 700 }}>
          {open.length ? `Needs attention (${open.length})` : 'Yard'}
        </Typography>
        {!fill && open.length > 0 && (
          <Button size="small" onClick={() => setCollapsed((c) => !c)} sx={{ color: colors.goldMuted, minWidth: 0, ml: 'auto !important', py: 0 }}>
            {collapsed ? 'Show' : 'Hide'}
          </Button>
        )}
        {counts.map((c) => (
          <Chip key={`${c.deviceId}:${c.id}`} size="small" label={`🐔 ${c.title}${c.detail ? ` · ${c.detail}` : ''}`}
            onClick={onFocus ? () => onFocus(c) : undefined}
            sx={{ bgcolor: colors.surface, color: colors.white, border: `1px solid ${colors.accent}` }} />
        ))}
      </Stack>
      <Stack spacing={0.75} sx={{ display: collapsed ? 'none' : 'flex' }}>
        {open.slice(0, maxRows).map((f) => {
          const key = `${f.deviceId}:${f.id}`;
          const weed = f.type === 'weed_detected';
          return (
            <Box key={key} sx={{ bgcolor: colors.surface, borderLeft: `4px solid ${f.type === 'alert' ? findingColor(f) : FLAG_COLORS[f.type]}`, borderRadius: 1, p: 0.75 }}>
              <Box onClick={onFocus ? () => onFocus(f) : undefined} sx={{ cursor: onFocus ? 'pointer' : 'default' }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {iconFor(f)} {f.title}{f.count ? ` · ${f.count}` : ''}
                  {weed && f.confidence != null ? ` · ${Math.round(f.confidence * 100)}%` : ''}
                </Typography>
                {f.detail && <Typography variant="caption" sx={{ color: colors.goldMuted }}>{f.detail}</Typography>}
              </Box>
              <Stack direction="row" spacing={0.5} sx={{ mt: 0.5 }}>
                {weed && f.scout ? (
                  <>
                    <Button size="small" variant="outlined" disabled={busy === key} onClick={() => void run(f, 'ack')}
                      sx={{ color: colors.gold, borderColor: colors.accent, minWidth: 0 }}>Pulled it</Button>
                    <Button size="small" disabled={busy === key} onClick={() => void run(f, 'reject')}
                      sx={{ color: colors.goldMuted, minWidth: 0 }}>Not a weed</Button>
                  </>
                ) : weed ? (
                  <>
                    <Button size="small" variant="outlined" disabled={busy === key}
                      onClick={() => setConfirm({ flag: f, action: 'aim' })}
                      sx={{ color: colors.gold, borderColor: colors.accent, minWidth: 0 }}>Aim</Button>
                    <Button size="small" variant="contained" disabled={busy === key}
                      onClick={() => setConfirm({ flag: f, action: 'burn' })}
                      sx={{ bgcolor: colors.warning, color: colors.bg, minWidth: 0, '&:hover': { bgcolor: colors.warning } }}>Burn</Button>
                    <Button size="small" disabled={busy === key} onClick={() => void run(f, 'reject')}
                      sx={{ color: colors.goldMuted, minWidth: 0 }}>Not a weed</Button>
                  </>
                ) : (
                  <Button size="small" variant="outlined" disabled={busy === key} onClick={() => void run(f, 'ack')}
                    sx={{ color: colors.gold, borderColor: colors.accent }}>{f.finding === 'leak' ? 'Fixed' : f.animalGroup === 'flock' ? 'Back inside' : f.type === 'alert' ? 'Seen it' : 'Picked up'}</Button>
                )}
              </Stack>
            </Box>
          );
        })}
        {open.length > maxRows && (
          <Typography variant="caption" sx={{ color: colors.goldMuted }}>+{open.length - maxRows} more</Typography>
        )}
      </Stack>

      <Dialog open={!!confirm} onClose={() => setConfirm(null)} PaperProps={{ sx: { bgcolor: colors.surface, color: colors.white } }}>
        <DialogTitle sx={{ color: confirm?.action === 'burn' ? colors.danger : colors.gold }}>
          {confirm ? CONFIRM[confirm.action].title : ''}
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ color: colors.white }}>{confirm ? CONFIRM[confirm.action].message : ''}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirm(null)} sx={{ color: colors.goldMuted }}>Cancel</Button>
          <Button
            variant="contained"
            sx={{ bgcolor: confirm?.action === 'burn' ? colors.danger : colors.accent }}
            onClick={() => { if (confirm) void run(confirm.flag, confirm.action); setConfirm(null); }}
          >
            {confirm?.action === 'burn' ? 'Fire laser' : 'Aim'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={!!snack} autoHideDuration={4000} onClose={() => setSnack(null)} message={snack?.msg}
        ContentProps={{ sx: { bgcolor: snack?.error ? colors.danger : colors.accent, color: colors.white } }} />
    </Box>
  );
}
