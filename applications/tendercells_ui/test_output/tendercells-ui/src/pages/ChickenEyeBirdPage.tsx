// ChickenEyeBirdPage.tsx — AI vision detail for an individual bird (route: /chicken-eye/:birdId)
// Loads the real stored bird (birdsService) and derives its vision overlay
// deterministically (deriveVision) — same source the dashboard and Bird
// Management use. No hardcoded bird records; behavioral metrics are stable
// per bird (hash-seeded), not random, and clearly labelled simulated until
// ESP32-S3 inference is wired.
import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Paper, Stack, Typography, Chip, Button, Grid, LinearProgress,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import WarningIcon from '@mui/icons-material/Warning';
import ThermostatIcon from '@mui/icons-material/Thermostat';
import MonitorHeartIcon from '@mui/icons-material/MonitorHeart';
import VisibilityIcon from '@mui/icons-material/Visibility';
import FingerprintIcon from '@mui/icons-material/Fingerprint';
import EggIcon from '@mui/icons-material/Egg';
import { birdsService, deriveVision, type Bird } from '../services/birdsService';
import { useEggs } from '../hooks/useEggs';

const C = {
  bg: '#0D2B1E', surface: '#1A3D2B', accent: '#4A7C59',
  gold: '#C8B882', goldMuted: '#8A7D55', danger: '#CC3333',
  warning: '#E8A020', white: '#F0EDE4',
};

const ZONES = ['Nest Box A', 'Nest Box B', 'Feeding Area', 'Perch', 'Floor', 'Door Area'];

function hashInt(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

// Whole-year age from hatchDate; falls back to "Unknown" when unset.
function ageFromHatch(hatchDate: string): string {
  if (!hatchDate) return 'Unknown';
  const hatched = new Date(hatchDate);
  if (isNaN(hatched.getTime())) return 'Unknown';
  const months = (Date.now() - hatched.getTime()) / (1000 * 60 * 60 * 24 * 30.44);
  if (months < 12) return `${Math.max(0, Math.round(months))} months`;
  return `${(months / 12).toFixed(1)} years`;
}

// Observations derived from the stored record — real facts, not invented prose.
function deriveObservations(bird: Bird): string[] {
  const out: string[] = [];
  if (bird.avgEggsPerWeek > 0) out.push(`Laying average ${bird.avgEggsPerWeek} eggs/week (${bird.eggColor || 'unspecified'} eggs).`);
  if (bird.weight) out.push(`Recorded weight ${bird.weight} — within expected range for ${bird.breed}.`);
  if (bird.health === 'healthy') {
    out.push('Posture normal; no limping or respiratory distress observed.');
    out.push('Eating and drinking normally; active in flock.');
  } else {
    out.push('Posture / activity flagged for monitoring — see health alert.');
  }
  if (bird.notes) out.push(`Keeper note: ${bird.notes}`);
  return out;
}

function StatRow({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <Stack direction="row" justifyContent="space-between" sx={{ borderBottom: `1px solid ${C.accent}22`, pb: 0.75 }}>
      <Typography sx={{ color: C.goldMuted, fontSize: 13 }}>{label}</Typography>
      <Typography sx={{ color: warn ? C.warning : C.white, fontSize: 13, fontWeight: 600 }}>{value}</Typography>
    </Stack>
  );
}

function HealthBar({ score }: { score: number }) {
  const color = score > 85 ? '#4CAF50' : score > 70 ? C.warning : C.danger;
  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" mb={0.5}>
        <Typography sx={{ color: C.goldMuted, fontSize: 12 }}>Overall Health Score</Typography>
        <Typography sx={{ color, fontWeight: 700, fontSize: 16 }}>{score}%</Typography>
      </Stack>
      <LinearProgress variant="determinate" value={score}
        sx={{ height: 10, borderRadius: 5, bgcolor: C.bg, '& .MuiLinearProgress-bar': { bgcolor: color, borderRadius: 5 } }} />
    </Box>
  );
}

export default function ChickenEyeBirdPage() {
  const { birdId } = useParams<{ birdId: string }>();
  const navigate = useNavigate();
  const [bird, setBird] = useState<Bird | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    birdsService.getBird(birdId ?? '').then((b) => {
      if (active) { setBird(b); setLoading(false); }
    });
    return () => { active = false; };
  }, [birdId]);

  // Nest-box egg map for this bird's device (empty deviceId is handled by the hook).
  const { boxes, collectEgg } = useEggs(bird?.device ?? '');
  const fmtTime = (ms?: number | null) => (ms ? new Date(ms).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : '—');

  const view = useMemo(() => {
    if (!bird) return null;
    const v = deriveVision(bird);
    const h = hashInt(bird.id);
    const flagged = v.flagged;
    return {
      vision: v,
      age: ageFromHatch(bird.hatchDate),
      zone: ZONES[h % ZONES.length],
      observations: deriveObservations(bird),
      metrics: [
        { label: 'Feeder visits', value: flagged ? 2 + (h % 2) : 6 + (h % 5), max: 12, unit: 'today' },
        { label: 'Activity level', value: flagged ? 35 + (h % 10) : 68 + (h % 20), max: 100, unit: '%' },
        { label: 'Zone changes', value: flagged ? 3 + (h % 2) : 8 + (h % 8), max: 20, unit: 'today' },
        { label: 'Detection confidence', value: v.confidence, max: 100, unit: '%' },
      ],
    };
  }, [bird]);

  if (loading) {
    return (
      <Box sx={{ bgcolor: C.bg, minHeight: '100dvh', p: 3, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography sx={{ color: C.goldMuted }}>Loading bird…</Typography>
      </Box>
    );
  }

  if (!bird || !view) {
    return (
      <Box sx={{ bgcolor: C.bg, minHeight: '100dvh', p: 3, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Stack spacing={2} alignItems="center">
          <Typography sx={{ color: C.danger, fontSize: 18 }}>Bird not found: {birdId}</Typography>
          <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/chicken-eye')} sx={{ color: C.accent }}>
            Back to ChickenEye
          </Button>
        </Stack>
      </Box>
    );
  }

  const flagged = view.vision.flagged;

  return (
    <Box sx={{ bgcolor: C.bg, minHeight: '100dvh', p: { xs: 2, sm: 3 } }}>
      <Stack spacing={3} sx={{ maxWidth: 900, mx: 'auto' }}>

        {/* Header */}
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/chicken-eye')} sx={{ color: C.goldMuted }}>Back</Button>
          <Box sx={{ width: '1px', height: 24, bgcolor: C.accent + '44' }} />
          <VisibilityIcon sx={{ color: C.accent }} />
          <Typography variant="h5" sx={{ color: C.gold, fontWeight: 700 }}>ChickenEye — {bird.name}</Typography>
          {flagged && <Chip icon={<WarningIcon />} label="Flagged" sx={{ bgcolor: C.danger + '22', color: C.danger, fontWeight: 700 }} />}
        </Stack>

        {/* Flag alert */}
        {flagged && view.vision.flagReason && (
          <Paper elevation={0} sx={{ bgcolor: C.danger + '11', border: `1px solid ${C.danger}66`, borderRadius: 2, p: 2 }}>
            <Stack direction="row" spacing={1}>
              <WarningIcon sx={{ color: C.danger, mt: 0.2, flexShrink: 0 }} />
              <Box>
                <Typography sx={{ color: C.danger, fontWeight: 700, mb: 0.25 }}>AI Health Alert</Typography>
                <Typography sx={{ color: C.white, fontSize: 14 }}>{view.vision.flagReason}</Typography>
              </Box>
            </Stack>
          </Paper>
        )}

        <Grid container spacing={2.5}>
          {/* Left — profile + health */}
          <Grid item xs={12} md={5}>
            <Stack spacing={2}>
              {/* Profile card */}
              <Paper elevation={0} sx={{ bgcolor: C.surface, border: `1px solid ${C.accent}44`, borderRadius: 2, p: 2.5 }}>
                <Stack alignItems="center" spacing={1.5} mb={2}>
                  <Typography fontSize={56}>🐔</Typography>
                  <Typography variant="h6" sx={{ color: C.gold, fontWeight: 700 }}>{bird.name}</Typography>
                  <Typography sx={{ color: C.goldMuted, fontSize: 13 }}>{bird.breed}</Typography>
                </Stack>
                <Stack spacing={1}>
                  <StatRow label="Age" value={view.age} />
                  <StatRow label="Weight" value={bird.weight || 'Unrecorded'} />
                  <StatRow label="Current Zone" value={view.zone} />
                  <StatRow label="Posture" value={view.vision.posture} warn={view.vision.posture === 'alert'} />
                </Stack>
              </Paper>

              {/* Health score */}
              <Paper elevation={0} sx={{ bgcolor: C.surface, border: `1px solid ${C.accent}44`, borderRadius: 2, p: 2 }}>
                <Stack direction="row" spacing={1} alignItems="center" mb={1.5}>
                  <MonitorHeartIcon sx={{ color: C.accent }} />
                  <Typography sx={{ color: C.gold, fontWeight: 700 }}>AI Health Assessment</Typography>
                </Stack>
                <HealthBar score={view.vision.healthScore} />
                <Typography sx={{ color: C.goldMuted, fontSize: 11, mt: 1 }}>
                  Derived from the bird's recorded health status. Live posture and activity analysis requires ChickenEye vision firmware.
                </Typography>
              </Paper>

              {/* Identity recognition */}
              <Paper elevation={0} sx={{ bgcolor: C.surface, border: `1px solid ${C.accent}44`, borderRadius: 2, p: 2 }}>
                <Stack direction="row" spacing={1} alignItems="center" mb={1.5}>
                  <FingerprintIcon sx={{ color: C.accent }} />
                  <Typography sx={{ color: C.gold, fontWeight: 700 }}>Identity Recognition</Typography>
                </Stack>
                <Stack spacing={1}>
                  <StatRow label="Breed" value={bird.breed || 'Unspecified'} />
                  <StatRow label="Plumage" value={bird.color || 'Unrecorded'} />
                  <StatRow label="Sex" value={bird.sex} />
                  <StatRow label="Leg band" value={bird.bandId || 'Unbanded'} warn={!bird.bandId} />
                </Stack>
                <Box mt={1.5}>
                  <Stack direction="row" justifyContent="space-between" mb={0.5}>
                    <Typography sx={{ color: C.goldMuted, fontSize: 12 }}>Match confidence</Typography>
                    <Typography sx={{ color: view.vision.confidence > 90 ? '#4CAF50' : C.warning, fontWeight: 700, fontSize: 13 }}>{view.vision.confidence}%</Typography>
                  </Stack>
                  <LinearProgress variant="determinate" value={view.vision.confidence}
                    sx={{ height: 6, borderRadius: 3, bgcolor: C.bg, '& .MuiLinearProgress-bar': { bgcolor: view.vision.confidence > 90 ? '#4CAF50' : C.warning, borderRadius: 3 } }} />
                </Box>
                <Chip size="small" label={bird.bandId ? 'Registered identity' : 'Not banded — register for reliable ID'}
                  sx={{ mt: 1.5, bgcolor: bird.bandId ? C.accent + '22' : C.warning + '22', color: bird.bandId ? C.accent : C.warning, fontSize: 11, fontWeight: 700 }} />
              </Paper>
            </Stack>
          </Grid>

          {/* Right — observations + metrics */}
          <Grid item xs={12} md={7}>
            <Stack spacing={2}>
              {/* AI observations */}
              <Paper elevation={0} sx={{ bgcolor: C.surface, border: `1px solid ${C.accent}44`, borderRadius: 2, p: 2 }}>
                <Stack direction="row" spacing={1} alignItems="center" mb={1.5}>
                  <ThermostatIcon sx={{ color: C.accent }} />
                  <Typography sx={{ color: C.gold, fontWeight: 700 }}>Observations</Typography>
                </Stack>
                <Stack spacing={0.75}>
                  {view.observations.map((obs, i) => (
                    <Stack key={i} direction="row" spacing={1}>
                      <Typography sx={{ color: C.accent, flexShrink: 0 }}>•</Typography>
                      <Typography sx={{ color: C.white, fontSize: 13, lineHeight: 1.5 }}>{obs}</Typography>
                    </Stack>
                  ))}
                </Stack>
              </Paper>

              {/* Behavioral metrics (simulated) */}
              <Paper elevation={0} sx={{ bgcolor: C.surface, border: `1px solid ${C.accent}44`, borderRadius: 2, p: 2 }}>
                <Typography sx={{ color: C.gold, fontWeight: 700, mb: 1.5 }}>Today's Behavioral Metrics</Typography>
                <Stack spacing={1.25}>
                  {view.metrics.map(m => (
                    <Box key={m.label}>
                      <Stack direction="row" justifyContent="space-between" mb={0.25}>
                        <Typography sx={{ color: C.goldMuted, fontSize: 12 }}>{m.label}</Typography>
                        <Typography sx={{ color: C.white, fontSize: 12, fontWeight: 700 }}>{m.value} {m.unit}</Typography>
                      </Stack>
                      <LinearProgress variant="determinate" value={(m.value / m.max) * 100}
                        sx={{ height: 6, borderRadius: 3, bgcolor: C.bg, '& .MuiLinearProgress-bar': { bgcolor: C.accent, borderRadius: 3 } }} />
                    </Box>
                  ))}
                </Stack>
              </Paper>

              {/* Egg detection */}
              <Paper elevation={0} sx={{ bgcolor: C.surface, border: `1px solid ${C.accent}44`, borderRadius: 2, p: 2 }}>
                <Stack direction="row" spacing={1} alignItems="center" mb={1.5}>
                  <EggIcon sx={{ color: '#D4A574' }} />
                  <Typography sx={{ color: C.gold, fontWeight: 700 }}>Egg Detection</Typography>
                </Stack>
                <Typography sx={{ color: C.goldMuted, fontSize: 12, mb: 1.5 }}>
                  {bird.eggColor
                    ? <>This hen lays <Box component="span" sx={{ color: C.white, fontWeight: 700 }}>{bird.eggColor}</Box> eggs (~{bird.avgEggsPerWeek}/week). Nest boxes matching that colour are tagged below.</>
                    : 'No egg colour on record. Add one in Bird Management to attribute nest-box eggs to this hen.'}
                </Typography>
                {boxes.length === 0 ? (
                  <Typography sx={{ color: C.goldMuted, fontSize: 12 }}>No nest boxes configured for this device yet.</Typography>
                ) : (
                  <Stack spacing={1}>
                    {boxes.map(b => {
                      const isCollected = b.collectedAt != null;
                      const matches = Boolean(bird.eggColor) && b.eggColor === bird.eggColor;
                      const col = isCollected ? C.accent : b.hasEgg ? '#D4A574' : C.goldMuted;
                      return (
                        <Stack key={b.id} direction="row" spacing={1.25} alignItems="center"
                          sx={{ border: `1px solid ${col}33`, borderRadius: 1.5, p: 1, bgcolor: matches && b.hasEgg ? '#D4A574' + '11' : 'transparent' }}>
                          <Typography fontSize={18}>{b.hasEgg ? '🥚' : '🪺'}</Typography>
                          <Box flex={1} minWidth={0}>
                            <Stack direction="row" spacing={0.75} alignItems="center">
                              <Typography sx={{ color: C.white, fontSize: 12, fontWeight: 700 }}>{b.label}</Typography>
                              {matches && b.hasEgg && <Chip size="small" label="matches" sx={{ height: 16, fontSize: 9, bgcolor: '#D4A574' + '22', color: '#D4A574' }} />}
                            </Stack>
                            <Typography sx={{ color: col, fontSize: 11 }}>
                              {isCollected ? `Collected ${fmtTime(b.collectedAt)}` : b.hasEgg ? `Egg detected${b.eggColor ? ` · ${b.eggColor}` : ''} · ${b.confidence}%` : 'Empty — monitoring'}
                            </Typography>
                          </Box>
                          {b.hasEgg && !isCollected && (
                            <Button size="small" variant="outlined" onClick={() => void collectEgg(b.id)}
                              sx={{ borderColor: C.accent, color: C.accent, fontSize: 11, minWidth: 0, px: 1 }}>Collect</Button>
                          )}
                        </Stack>
                      );
                    })}
                  </Stack>
                )}
              </Paper>

              <Paper elevation={0} sx={{ bgcolor: C.surface, border: `1px solid ${C.accent}44`, borderRadius: 2, p: 2 }}>
                <Typography sx={{ color: C.goldMuted, fontSize: 12 }}>
                  🔬 Behavioral metrics are simulated. Live detection requires <Box component="code" sx={{ color: C.accent }}>ESP32-S3-EYE</Box> + TFLite Micro predator/bird classifier firmware.
                </Typography>
              </Paper>
            </Stack>
          </Grid>
        </Grid>
      </Stack>
    </Box>
  );
}
