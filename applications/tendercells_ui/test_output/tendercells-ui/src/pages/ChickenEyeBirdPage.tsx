// ChickenEyeBirdPage.tsx — AI vision detail for an individual bird (route: /chicken-eye/:birdId)
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Paper, Stack, Typography, Chip, Button, Grid, LinearProgress,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import WarningIcon from '@mui/icons-material/Warning';
import ThermostatIcon from '@mui/icons-material/Thermostat';
import MonitorHeartIcon from '@mui/icons-material/MonitorHeart';
import VisibilityIcon from '@mui/icons-material/Visibility';

const C = {
  bg: '#0D2B1E', surface: '#1A3D2B', accent: '#4A7C59',
  gold: '#C8B882', goldMuted: '#8A7D55', danger: '#CC3333',
  warning: '#E8A020', white: '#F0EDE4',
};

interface BirdRecord {
  id: string; name: string; breed: string; age: string;
  weight: string; healthScore: number; posture: string;
  currentZone: string; flagged: boolean; flagReason?: string;
  observations: string[];
}

const BIRD_DATA: Record<string, BirdRecord> = {
  '1': { id: '1', name: 'Henrietta', breed: 'Rhode Island Red', age: '2 years', weight: '6.2 lbs', healthScore: 94, posture: 'resting', currentZone: 'Nest Box A', flagged: false, observations: ['Laying pattern normal — 5 eggs this week', 'Feather condition excellent', 'Eating and drinking normally', 'No limping or respiratory distress observed'] },
  '2': { id: '2', name: 'Dotty', breed: 'Barred Plymouth Rock', age: '1.5 years', weight: '5.8 lbs', healthScore: 88, posture: 'feeding', currentZone: 'Feeding Area', flagged: false, observations: ['Active feeder — visited trough 8× today', 'Feather condition good', 'Normal social interaction with flock', 'Slightly below average egg count this week (3/7 days)'] },
  '3': { id: '3', name: 'Goldie', breed: 'Buff Orpington', age: '3 years', weight: '7.1 lbs', healthScore: 97, posture: 'normal', currentZone: 'Perch', flagged: false, observations: ['Healthy weight for breed', 'Consistent layer — 6 eggs this week', 'Dominant position in pecking order, no conflict', 'Perching at optimal position — ventilation good'] },
  '4': { id: '4', name: 'Bluebell', breed: 'Easter Egger', age: '1 year', weight: '4.9 lbs', healthScore: 72, posture: 'alert', currentZone: 'Floor', flagged: true, flagReason: 'Abnormal posture + reduced activity detected. Check for respiratory distress or mite infestation.', observations: ['Standing with wings slightly lowered — possible lethargy', 'Activity count 40% below flock average today', 'Not observed at feeder in last 3 hours', 'Tail position slightly drooped — monitor closely'] },
};

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
  const bird = BIRD_DATA[birdId ?? ''];

  if (!bird) {
    return (
      <Box sx={{ bgcolor: C.bg, minHeight: '100dvh', p: 3, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Stack spacing={2} alignItems="center">
          <Typography sx={{ color: C.danger, fontSize: 18 }}>Bird ID not found: {birdId}</Typography>
          <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/chicken-eye')} sx={{ color: C.accent }}>
            Back to ChickenEye
          </Button>
        </Stack>
      </Box>
    );
  }

  return (
    <Box sx={{ bgcolor: C.bg, minHeight: '100dvh', p: { xs: 2, sm: 3 } }}>
      <Stack spacing={3} sx={{ maxWidth: 900, mx: 'auto' }}>

        {/* Header */}
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/chicken-eye')} sx={{ color: C.goldMuted }}>Back</Button>
          <Box sx={{ width: '1px', height: 24, bgcolor: C.accent + '44' }} />
          <VisibilityIcon sx={{ color: C.accent }} />
          <Typography variant="h5" sx={{ color: C.gold, fontWeight: 700 }}>ChickenEye — {bird.name}</Typography>
          {bird.flagged && <Chip icon={<WarningIcon />} label="Flagged" sx={{ bgcolor: C.danger + '22', color: C.danger, fontWeight: 700 }} />}
        </Stack>

        {/* Flag alert */}
        {bird.flagged && bird.flagReason && (
          <Paper elevation={0} sx={{ bgcolor: C.danger + '11', border: `1px solid ${C.danger}66`, borderRadius: 2, p: 2 }}>
            <Stack direction="row" spacing={1}>
              <WarningIcon sx={{ color: C.danger, mt: 0.2, flexShrink: 0 }} />
              <Box>
                <Typography sx={{ color: C.danger, fontWeight: 700, mb: 0.25 }}>AI Health Alert</Typography>
                <Typography sx={{ color: C.white, fontSize: 14 }}>{bird.flagReason}</Typography>
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
                  <StatRow label="Age" value={bird.age} />
                  <StatRow label="Weight" value={bird.weight} />
                  <StatRow label="Current Zone" value={bird.currentZone} />
                  <StatRow label="Posture" value={bird.posture} warn={bird.posture === 'alert'} />
                </Stack>
              </Paper>

              {/* Health score */}
              <Paper elevation={0} sx={{ bgcolor: C.surface, border: `1px solid ${C.accent}44`, borderRadius: 2, p: 2 }}>
                <Stack direction="row" spacing={1} alignItems="center" mb={1.5}>
                  <MonitorHeartIcon sx={{ color: C.accent }} />
                  <Typography sx={{ color: C.gold, fontWeight: 700 }}>AI Health Assessment</Typography>
                </Stack>
                <HealthBar score={bird.healthScore} />
                <Typography sx={{ color: C.goldMuted, fontSize: 11, mt: 1 }}>
                  Based on posture analysis, activity patterns, and behavioral indicators detected by ChickenEye vision model.
                </Typography>
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
                  <Typography sx={{ color: C.gold, fontWeight: 700 }}>AI Observations</Typography>
                </Stack>
                <Stack spacing={0.75}>
                  {bird.observations.map((obs, i) => (
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
                  {[
                    { label: 'Feeder visits', value: bird.id === '4' ? 2 : 7, max: 12, unit: 'today' },
                    { label: 'Activity level', value: bird.id === '4' ? 38 : 72, max: 100, unit: '%' },
                    { label: 'Zone changes', value: bird.id === '4' ? 3 : 9, max: 20, unit: 'today' },
                    { label: 'Detection confidence', value: 92, max: 100, unit: '%' },
                  ].map(m => (
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

              <Paper elevation={0} sx={{ bgcolor: C.surface, border: `1px solid ${C.accent}44`, borderRadius: 2, p: 2 }}>
                <Typography sx={{ color: C.goldMuted, fontSize: 12 }}>
                  🔬 Data shown is simulated. Live detection requires <Box component="code" sx={{ color: C.accent }}>ESP32-S3-EYE</Box> + TFLite Micro predator/bird classifier firmware.
                </Typography>
              </Paper>
            </Stack>
          </Grid>
        </Grid>
      </Stack>
    </Box>
  );
}
