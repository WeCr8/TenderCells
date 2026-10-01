// BuilderLibraryPage (/builder) - the Builder ladder: start with no hardware (missions on the
// simulated farm), then build real electronics and connect a live device.
//   OBSERVE → DECIDE → AUTOMATE → BUILD → CONNECT → INVENT
// Every item is one action per screen with four explanation depths; progress and milestones
// stay in this browser (no account needed). Cards show their cover art; concept books (illustrated
// step-by-step previews, not yet verified against real parts) sit in their own section.
import { useMemo } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { BOOKS, LADDER, NEXT_MILESTONES } from '../lib/registry';
import { assetUrl } from '../lib/assets';
import { isComplete, readProgress } from '../lib/progress';
import type { MissionPhase } from '../types';

const C = { bg: '#0D2B1E', surface: '#1A3D2B', accent: '#4A7C59', gold: '#C8B882', goldMuted: '#8A7D55', white: '#F0EDE4' };
const C2 = { warning: '#E8A020' };
const PHASES: MissionPhase[] = ['OBSERVE', 'DECIDE', 'AUTOMATE', 'BUILD', 'CONNECT', 'INVENT'];

export default function BuilderLibraryPage() {
  const navigate = useNavigate();
  const progress = useMemo(() => readProgress(), []);
  const earned = LADDER.filter((i) => isComplete(progress, i.id));
  const nextUp = LADDER.find((i) => !isComplete(progress, i.id));

  return (
    <Box sx={{ p: { xs: 2, sm: 3 }, maxWidth: 1100, mx: 'auto' }} data-testid="builder-library">
      <Typography variant="h4" component="h1" sx={{ color: C.gold, fontWeight: 800 }}>Builder</Typography>
      <Typography sx={{ color: C.white, fontWeight: 700, maxWidth: 760 }}>
        Learn by doing, one step at a time. Start on the simulated farm with no hardware, then build real electronics and
        bring your first device online.
      </Typography>
      <Typography sx={{ color: C.goldMuted, fontSize: 13, maxWidth: 760, mb: 1.5 }}>
        Every screen is one action. Pick how deep the explanations go (Young, Beginner, Advanced or Teacher). Your progress
        stays in this browser; no account needed.
      </Typography>

      <Stack direction="row" spacing={0.5} useFlexGap flexWrap="wrap" alignItems="center" sx={{ mb: 2 }} aria-label="Learning phases">
        {PHASES.map((p, i) => (
          <Stack key={p} direction="row" alignItems="center" spacing={0.5}>
            <Chip size="small" label={p} sx={{ bgcolor: `${C.accent}33`, color: C.gold, fontWeight: 800, letterSpacing: 0.5 }} />
            {i < PHASES.length - 1 && <Typography aria-hidden sx={{ color: C.goldMuted }}>→</Typography>}
          </Stack>
        ))}
      </Stack>

      {nextUp && (
        <Button variant="contained" onClick={() => navigate(`/builder/${nextUp.id}`)} data-testid="builder-continue" sx={{ bgcolor: C.accent, fontWeight: 800, mb: 2 }}>
          {earned.length ? 'Continue' : 'Start'}: {nextUp.title}
        </Button>
      )}

      <Grid container spacing={1.5}>
        {LADDER.map((item, n) => {
          const done = isComplete(progress, item.id);
          const at = progress[item.id]?.step;
          return (
            <Grid item xs={12} sm={6} md={4} key={item.id}>
              <Paper elevation={0} data-testid="builder-card"
                sx={{ p: 2, height: '100%', bgcolor: C.surface, color: C.white, border: `1px solid ${done ? C.gold : `${C.accent}55`}`, display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                {item.cover && (
                  <Box component="img" src={assetUrl(item.cover)} alt="" loading="lazy" data-testid="builder-cover"
                    sx={{ width: '100%', aspectRatio: '16 / 9', objectFit: 'cover', borderRadius: 1, border: `1px solid ${C.accent}55` }} />
                )}
                <Stack direction="row" spacing={0.75} alignItems="center">
                  <Typography sx={{ color: C.goldMuted, fontFamily: 'monospace', fontSize: 12 }}>M{n}</Typography>
                  <Chip size="small" label={item.phase} sx={{ height: 20, fontSize: 10, bgcolor: `${C.accent}33`, color: C.gold }} />
                  <Chip size="small" label={item.hardware ? 'Hardware' : 'No hardware'} sx={{ height: 20, fontSize: 10, bgcolor: 'transparent', border: `1px solid ${C.accent}`, color: C.goldMuted }} />
                </Stack>
                <Typography sx={{ color: C.gold, fontWeight: 800, fontSize: 17 }}>{item.title}</Typography>
                <Typography sx={{ color: C.goldMuted, fontSize: 13, flex: 1 }}>
                  {item.steps.length} steps{item.minutes ? ` · about ${item.minutes} min` : ''} · milestone: {item.milestone}
                </Typography>
                {done
                  ? <Typography sx={{ color: C.gold, fontWeight: 700, fontSize: 13 }}>🏅 {item.milestone} earned</Typography>
                  : at !== undefined && <Typography sx={{ color: C.goldMuted, fontSize: 13 }}>On step {at + 1} of {item.steps.length}</Typography>}
                <Button variant={done ? 'outlined' : 'contained'} component={RouterLink} to={`/builder/${item.id}`}
                  sx={done ? { borderColor: C.accent, color: C.gold } : { bgcolor: C.accent }}>
                  {done ? 'Review' : at !== undefined ? 'Continue' : 'Start'}
                </Button>
              </Paper>
            </Grid>
          );
        })}
        {NEXT_MILESTONES.map((m, i) => (
          <Grid item xs={12} sm={6} md={4} key={m.milestone}>
            <Paper elevation={0} sx={{ p: 2, height: '100%', bgcolor: 'transparent', color: C.goldMuted, border: `1px dashed ${C.accent}88` }}>
              <Typography sx={{ fontFamily: 'monospace', fontSize: 12 }}>M{LADDER.length + i} · {m.phase}</Typography>
              <Typography sx={{ fontWeight: 800 }}>{m.title}</Typography>
              <Typography sx={{ fontSize: 13 }}>Coming next · milestone: {m.milestone}</Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {BOOKS.length > 0 && (
        <Box sx={{ mt: 3 }} data-testid="builder-books">
          <Typography sx={{ color: C.gold, fontWeight: 800 }}>Build books · concept preview</Typography>
          <Typography sx={{ color: C.goldMuted, fontSize: 13, mb: 1, maxWidth: 760 }}>
            Picture-book walkthroughs of a whole build. The art is concept only - follow the real wiring guide and the
            board's pinout when you build.
          </Typography>
          <Grid container spacing={1.5}>
            {BOOKS.map((item) => {
              const done = isComplete(progress, item.id);
              const at = progress[item.id]?.step;
              return (
                <Grid item xs={12} sm={6} md={4} key={item.id}>
                  <Paper elevation={0} data-testid="builder-book"
                    sx={{ p: 2, height: '100%', bgcolor: C.surface, color: C.white, border: `1px dashed ${C2.warning}88`, display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                    {item.cover && (
                      <Box component="img" src={assetUrl(item.cover)} alt="" loading="lazy"
                        sx={{ width: '100%', aspectRatio: '4 / 3', objectFit: 'cover', objectPosition: 'top', borderRadius: 1, bgcolor: C.white }} />
                    )}
                    <Stack direction="row" spacing={0.75}>
                      <Chip size="small" label="CONCEPT" sx={{ height: 20, fontSize: 10, fontWeight: 800, bgcolor: `${C2.warning}26`, color: C2.warning }} />
                      <Chip size="small" label="Hardware" sx={{ height: 20, fontSize: 10, bgcolor: 'transparent', border: `1px solid ${C.accent}`, color: C.goldMuted }} />
                    </Stack>
                    <Typography sx={{ color: C.gold, fontWeight: 800, fontSize: 17 }}>{item.title}</Typography>
                    <Typography sx={{ color: C.goldMuted, fontSize: 13, flex: 1 }}>{item.steps.length} illustrated steps · milestone: {item.milestone}</Typography>
                    {done && <Typography sx={{ color: C.gold, fontWeight: 700, fontSize: 13 }}>🏅 {item.milestone} earned</Typography>}
                    <Button variant="outlined" component={RouterLink} to={`/builder/${item.id}`} sx={{ borderColor: C.accent, color: C.gold }}>
                      {done ? 'Review' : at !== undefined ? 'Continue' : 'Open the book'}
                    </Button>
                  </Paper>
                </Grid>
              );
            })}
          </Grid>
        </Box>
      )}

      {earned.length > 0 && (
        <Box sx={{ mt: 2 }} data-testid="builder-milestones">
          <Typography sx={{ color: C.gold, fontWeight: 800 }}>Milestones</Typography>
          <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap">
            {earned.map((i) => <Chip key={i.id} label={`🏅 ${i.milestone}`} sx={{ bgcolor: `${C.accent}33`, color: C.gold }} />)}
          </Stack>
        </Box>
      )}

      <Typography sx={{ color: C.goldMuted, fontSize: 13, mt: 2 }}>
        Want something quicker? Try the <RouterLink to="/missions" style={{ color: C.gold }}>short missions</RouterLink> or{' '}
        <RouterLink to="/simulator" style={{ color: C.gold }}>trigger an event</RouterLink>. Ready for the real thing? Use the{' '}
        <a href="/flash" style={{ color: C.gold }}>browser flasher</a>.
      </Typography>
    </Box>
  );
}
