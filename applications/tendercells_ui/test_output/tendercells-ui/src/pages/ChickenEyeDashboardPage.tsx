// ChickenEyeDashboardPage.tsx — AI vision monitoring: bird detection, health, behavioral analytics
import { useState, useEffect } from 'react';
import {
  Box, Paper, Grid, Stack, Typography, Chip, Avatar,
  LinearProgress, IconButton, Tooltip,
} from '@mui/material';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import VisibilityIcon from '@mui/icons-material/Visibility';
import WarningIcon from '@mui/icons-material/Warning';
import RefreshIcon from '@mui/icons-material/Refresh';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import { useNavigate } from 'react-router-dom';

const C = {
  bg: '#0D2B1E', surface: '#1A3D2B', accent: '#4A7C59',
  gold: '#C8B882', goldMuted: '#8A7D55', danger: '#CC3333',
  warning: '#E8A020', white: '#F0EDE4',
};

interface DetectedBird {
  id: string;
  name: string;
  confidence: number;
  zone: string;
  posture: 'normal' | 'alert' | 'resting' | 'feeding' | 'unknown';
  healthScore: number;
  lastSeen: Date;
  flagged: boolean;
}

const POSTURE_COLOR: Record<string, string> = {
  normal: '#4CAF50', alert: C.warning, resting: '#4A90E2',
  feeding: C.gold, unknown: C.goldMuted,
};

const ZONES = ['Nest Box A', 'Nest Box B', 'Feeding Area', 'Perch', 'Floor', 'Door Area'];

function makeBird(id: string, name: string, zone: string, posture: DetectedBird['posture'], health: number, flagged = false): DetectedBird {
  return { id, name, confidence: Math.round(85 + Math.random() * 15), zone, posture, healthScore: health, lastSeen: new Date(Date.now() - Math.random() * 120000), flagged };
}

const INITIAL_BIRDS: DetectedBird[] = [
  makeBird('1', 'Henrietta', 'Nest Box A', 'resting', 94),
  makeBird('2', 'Dotty', 'Feeding Area', 'feeding', 88),
  makeBird('3', 'Goldie', 'Perch', 'normal', 97),
  makeBird('4', 'Bluebell', 'Floor', 'alert', 72, true),
];

function CameraFeedSim({ label, cameraId }: { label: string; cameraId: number }) {
  const [pulse, setPulse] = useState(false);
  useEffect(() => {
    const t = setInterval(() => setPulse(p => !p), 1800 + cameraId * 400);
    return () => clearInterval(t);
  }, [cameraId]);

  return (
    <Paper elevation={0} sx={{ bgcolor: '#060E08', border: `1px solid ${C.accent}44`, borderRadius: 2, aspectRatio: '16/9', position: 'relative', overflow: 'hidden' }}>
      {/* Simulated camera overlay */}
      <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 1 }}>
        <CameraAltIcon sx={{ color: C.accent + '66', fontSize: 36 }} />
        <Typography sx={{ color: C.goldMuted, fontSize: 11 }}>{label}</Typography>
        <Typography sx={{ color: C.accent + '66', fontSize: 10 }}>Sim — Live feed requires ESP32-S3-EYE</Typography>
      </Box>
      {/* Detection boxes (simulated) */}
      {INITIAL_BIRDS.slice(0, 2 + cameraId).map((b, i) => (
        <Box key={b.id} sx={{
          position: 'absolute',
          left: `${15 + i * 25}%`, top: `${20 + i * 15}%`,
          width: '20%', height: '28%',
          border: `2px solid ${b.flagged ? C.danger : C.accent}`,
          borderRadius: 1,
        }}>
          <Box sx={{ bgcolor: b.flagged ? C.danger : C.accent, px: 0.5, position: 'absolute', top: -14, left: 0 }}>
            <Typography sx={{ color: C.white, fontSize: 8, lineHeight: '14px' }}>{b.name} {b.confidence}%</Typography>
          </Box>
        </Box>
      ))}
      {/* Live indicator */}
      <Stack direction="row" spacing={0.5} alignItems="center" sx={{ position: 'absolute', top: 8, right: 8 }}>
        <FiberManualRecordIcon sx={{ fontSize: 8, color: pulse ? '#FF4444' : '#AA2222' }} />
        <Typography sx={{ color: C.white, fontSize: 10, opacity: 0.7 }}>SIM</Typography>
      </Stack>
      {/* Timestamp */}
      <Typography sx={{ position: 'absolute', bottom: 6, left: 8, color: C.goldMuted, fontSize: 9 }}>
        {new Date().toLocaleTimeString()}
      </Typography>
    </Paper>
  );
}

function BirdCard({ bird, onClick }: { bird: DetectedBird; onClick: () => void }) {
  const secsAgo = Math.round((Date.now() - bird.lastSeen.getTime()) / 1000);
  return (
    <Paper elevation={0} onClick={onClick} sx={{
      bgcolor: bird.flagged ? C.danger + '11' : C.bg,
      border: `1px solid ${bird.flagged ? C.danger : C.accent}44`,
      borderRadius: 2, p: 1.5, cursor: 'pointer',
      '&:hover': { border: `1px solid ${bird.flagged ? C.danger : C.accent}` },
    }}>
      <Stack direction="row" spacing={1.5} alignItems="center">
        <Avatar sx={{ bgcolor: bird.flagged ? C.danger + '33' : C.accent + '33', color: bird.flagged ? C.danger : C.accent, width: 36, height: 36, fontSize: 20 }}>🐔</Avatar>
        <Box flex={1}>
          <Stack direction="row" spacing={0.75} alignItems="center">
            <Typography sx={{ color: C.gold, fontWeight: 700, fontSize: 13 }}>{bird.name}</Typography>
            {bird.flagged && <WarningIcon sx={{ color: C.danger, fontSize: 14 }} />}
          </Stack>
          <Typography sx={{ color: C.goldMuted, fontSize: 11 }}>{bird.zone} · {secsAgo}s ago</Typography>
        </Box>
        <Stack alignItems="flex-end" spacing={0.5}>
          <Chip label={bird.posture} size="small" sx={{ bgcolor: POSTURE_COLOR[bird.posture] + '22', color: POSTURE_COLOR[bird.posture], fontSize: 10, fontWeight: 700 }} />
          <Typography sx={{ color: bird.healthScore > 85 ? '#4CAF50' : bird.healthScore > 70 ? C.warning : C.danger, fontSize: 11, fontWeight: 700 }}>
            {bird.healthScore}% health
          </Typography>
        </Stack>
      </Stack>
      <Box mt={0.75}>
        <LinearProgress variant="determinate" value={bird.confidence}
          sx={{ height: 3, borderRadius: 2, bgcolor: C.accent + '22', '& .MuiLinearProgress-bar': { bgcolor: C.accent } }} />
        <Typography sx={{ color: C.goldMuted, fontSize: 9, mt: 0.25 }}>Detection confidence: {bird.confidence}%</Typography>
      </Box>
    </Paper>
  );
}

export default function ChickenEyeDashboardPage() {
  const navigate = useNavigate();
  const [birds, setBirds] = useState<DetectedBird[]>(INITIAL_BIRDS);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [activeCamera, setActiveCamera] = useState(0);

  const refresh = () => {
    setBirds(b => b.map(bird => ({
      ...bird,
      confidence: Math.round(85 + Math.random() * 15),
      zone: ZONES[Math.floor(Math.random() * ZONES.length)],
      lastSeen: new Date(Date.now() - Math.random() * 60000),
      healthScore: Math.max(55, bird.healthScore + Math.round((Math.random() - 0.5) * 6)),
    })));
    setLastRefresh(new Date());
  };

  const flaggedCount = birds.filter(b => b.flagged).length;
  const avgHealth = Math.round(birds.reduce((a, b) => a + b.healthScore, 0) / birds.length);
  const cameras = ['Camera 1 — Coop Interior', 'Camera 2 — Nest Boxes', 'Camera 3 — Yard'];

  return (
    <Box sx={{ bgcolor: C.bg, minHeight: '100dvh', p: { xs: 2, sm: 3 } }}>
      <Stack spacing={3} sx={{ maxWidth: 1200, mx: 'auto' }}>

        {/* Header */}
        <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <VisibilityIcon sx={{ color: C.accent, fontSize: 28 }} />
            <Box>
              <Typography variant="h5" sx={{ color: C.gold, fontWeight: 700 }}>ChickenEye™ AI Vision</Typography>
              <Typography sx={{ color: C.goldMuted, fontSize: 13 }}>ESP32-S3 3-camera detection · TFLite Micro on-device inference</Typography>
            </Box>
          </Stack>
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography sx={{ color: C.goldMuted, fontSize: 11 }}>Updated {lastRefresh.toLocaleTimeString()}</Typography>
            <Tooltip title="Refresh detections">
              <IconButton onClick={refresh} sx={{ color: C.accent }}><RefreshIcon /></IconButton>
            </Tooltip>
          </Stack>
        </Stack>

        {/* Status row */}
        <Stack direction="row" spacing={1.5} flexWrap="wrap">
          <Chip label={`${birds.length} birds detected`} sx={{ bgcolor: C.accent + '22', color: C.accent, fontWeight: 700 }} />
          <Chip label={`Avg health: ${avgHealth}%`} sx={{ bgcolor: avgHealth > 85 ? '#4CAF50' + '22' : C.warning + '22', color: avgHealth > 85 ? '#4CAF50' : C.warning, fontWeight: 700 }} />
          {flaggedCount > 0 && <Chip icon={<WarningIcon />} label={`${flaggedCount} flagged`} sx={{ bgcolor: C.danger + '22', color: C.danger, fontWeight: 700 }} />}
          <Chip label="3 cameras · SIM mode" sx={{ bgcolor: C.bg, color: C.goldMuted, border: `1px solid ${C.accent}44` }} />
        </Stack>

        <Grid container spacing={2.5}>
          {/* Camera feeds */}
          <Grid item xs={12} lg={7}>
            <Stack spacing={1.5}>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                {cameras.map((cam, i) => (
                  <Chip key={i} label={`Cam ${i + 1}`} size="small" clickable onClick={() => setActiveCamera(i)}
                    sx={{ bgcolor: activeCamera === i ? C.accent : C.surface, color: activeCamera === i ? C.white : C.goldMuted }} />
                ))}
              </Stack>
              <CameraFeedSim label={cameras[activeCamera]} cameraId={activeCamera} />
              <Grid container spacing={1.5}>
                {cameras.filter((_, i) => i !== activeCamera).map((cam, i) => (
                  <Grid item xs={6} key={cam}>
                    <Box onClick={() => setActiveCamera(cameras.indexOf(cam))} sx={{ cursor: 'pointer' }}>
                      <CameraFeedSim label={cam} cameraId={cameras.indexOf(cam)} />
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Stack>
          </Grid>

          {/* Bird roster */}
          <Grid item xs={12} lg={5}>
            <Stack spacing={2}>
              <Typography sx={{ color: C.gold, fontWeight: 700 }}>Detected Flock</Typography>
              <Stack spacing={1.5}>
                {birds.map(bird => (
                  <BirdCard key={bird.id} bird={bird} onClick={() => navigate(`/chicken-eye/${bird.id}`)} />
                ))}
              </Stack>

              {/* Zone heatmap (simplified) */}
              <Paper elevation={0} sx={{ bgcolor: C.surface, border: `1px solid ${C.accent}44`, borderRadius: 2, p: 2 }}>
                <Typography sx={{ color: C.gold, fontWeight: 700, mb: 1.5, fontSize: 13 }}>Zone Activity</Typography>
                <Stack spacing={0.75}>
                  {ZONES.map(zone => {
                    const count = birds.filter(b => b.zone === zone).length;
                    return (
                      <Stack key={zone} direction="row" spacing={1} alignItems="center">
                        <Typography sx={{ color: C.goldMuted, fontSize: 11, width: 90, flexShrink: 0 }}>{zone}</Typography>
                        <Box flex={1}>
                          <LinearProgress variant="determinate" value={count === 0 ? 0 : (count / birds.length) * 100}
                            sx={{ height: 8, borderRadius: 4, bgcolor: C.bg, '& .MuiLinearProgress-bar': { bgcolor: count > 0 ? C.accent : 'transparent', borderRadius: 4 } }} />
                        </Box>
                        <Typography sx={{ color: C.white, fontSize: 11, fontWeight: 700, width: 16, textAlign: 'right' }}>{count}</Typography>
                      </Stack>
                    );
                  })}
                </Stack>
              </Paper>

              <Paper elevation={0} sx={{ bgcolor: C.surface, border: `1px solid ${C.accent}44`, borderRadius: 2, p: 2 }}>
                <Typography sx={{ color: C.goldMuted, fontSize: 12 }}>
                  🔬 Live AI detection requires <Box component="code" sx={{ color: C.accent }}>ESP32-S3-EYE × 3</Box> with TFLite Micro firmware flashed.
                  Use <Box component="code" sx={{ color: C.accent }}>scripts/flash-firmware.sh --target watchtower</Box> to deploy.
                </Typography>
              </Paper>
            </Stack>
          </Grid>
        </Grid>
      </Stack>
    </Box>
  );
}
