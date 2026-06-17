// ChickenEyeDashboardPage.tsx — AI vision monitoring: live camera control, bird
// detection, per-bird identity, health metrics, and egg detection.
//
// Data sources (all real / deterministic — no fabricated-per-render data):
//   • Flock roster  → birdsService (useBirds); vision overlay via deriveVision()
//   • Egg map       → eggService (useEggs); per-nest-box egg state, seeded per day
//   • Device list   → useProducts
// Camera controls (PTZ / zoom / night / record / snapshot) drive the SIM viewport
// locally today; the same control surface maps onto ESP32-S3 PTZ + stream when
// real firmware is flashed.
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Box, Paper, Grid, Stack, Typography, Chip, Avatar, LinearProgress,
  IconButton, Tooltip, Button, Tabs, Tab, Slider, Divider,
  FormControl, InputLabel, Select, MenuItem, Snackbar, Alert,
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import WarningIcon from '@mui/icons-material/Warning';
import RefreshIcon from '@mui/icons-material/Refresh';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import CenterFocusStrongIcon from '@mui/icons-material/CenterFocusStrong';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowLeftIcon from '@mui/icons-material/KeyboardArrowLeft';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import GridOnIcon from '@mui/icons-material/GridOn';
import EggIcon from '@mui/icons-material/Egg';
import MonitorHeartIcon from '@mui/icons-material/MonitorHeart';
import FingerprintIcon from '@mui/icons-material/Fingerprint';
import { useNavigate } from 'react-router-dom';
import { useBirds } from '../hooks/useBirds';
import { useEggs } from '../hooks/useEggs';
import { useProducts } from '../hooks/useProducts';
import { deriveVision, type Bird } from '../services/birdsService';
import type { NestBox } from '../services/eggService';

const C = {
  bg: '#0D2B1E', surface: '#1A3D2B', accent: '#4A7C59',
  gold: '#C8B882', goldMuted: '#8A7D55', danger: '#CC3333',
  warning: '#E8A020', white: '#F0EDE4',
};

const POSTURE_COLOR: Record<string, string> = {
  normal: '#4CAF50', alert: C.warning, resting: '#4A90E2',
  feeding: C.gold, unknown: C.goldMuted,
};

const ZONES = ['Nest Box A', 'Nest Box B', 'Feeding Area', 'Perch', 'Floor', 'Door Area'];
const CAMERAS = ['Camera 1 — Coop Interior', 'Camera 2 — Nest Boxes', 'Camera 3 — Yard'];

function hashInt(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

interface DetectedBird {
  id: string;
  name: string;
  breed: string;
  bandId: string;
  color: string;
  confidence: number;
  zone: string;
  posture: string;
  healthScore: number;
  flagged: boolean;
  flagReason?: string;
}

function toDetected(bird: Bird): DetectedBird {
  const v = deriveVision(bird);
  return {
    id: bird.id,
    name: bird.name,
    breed: bird.breed,
    bandId: bird.bandId,
    color: bird.color,
    confidence: v.confidence,
    zone: ZONES[hashInt(bird.id) % ZONES.length],
    posture: v.posture,
    healthScore: v.healthScore,
    flagged: v.flagged,
    flagReason: v.flagReason,
  };
}

const healthColor = (s: number) => (s > 85 ? '#4CAF50' : s > 70 ? C.warning : C.danger);

// ── Camera viewport with PTZ / zoom / night / detection overlay ────────────────
interface CamState {
  zoom: number; panX: number; tiltY: number;
  night: boolean; overlay: boolean; recording: boolean; recSecs: number;
}

function CameraViewport({
  label, cameraId, birds, cam, flash, allowWebcam = false,
}: { label: string; cameraId: number; birds: DetectedBird[]; cam: CamState; flash: boolean; allowWebcam?: boolean }) {
  const shown = birds.slice(0, 2 + cameraId);
  const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  // Live "use my camera" preview (no hardware). Opt-in; client-side only.
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [webcamOn, setWebcamOn] = useState(false);
  const [webcamErr, setWebcamErr] = useState<string | null>(null);

  const startWebcam = async () => {
    setWebcamErr(null);
    // getUserMedia only exists in a secure context (HTTPS or localhost). Over a LAN
    // IP / plain http (common on phones) it's undefined — say so instead of silently
    // doing nothing.
    if (!navigator.mediaDevices?.getUserMedia) {
      setWebcamErr('Camera needs HTTPS or localhost. Open the deployed https:// site (or localhost) — a LAN IP over http blocks camera access.');
      return;
    }
    try {
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      } catch {
        stream = await navigator.mediaDevices.getUserMedia({ video: true }); // mic denied/absent
      }
      streamRef.current = stream;
      setWebcamOn(true);
    } catch {
      setWebcamErr('Camera permission denied or no camera — showing the sim feed.');
      setWebcamOn(false);
    }
  };
  const stopWebcam = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setWebcamOn(false);
  };
  useEffect(() => {
    if (webcamOn && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      void videoRef.current.play();
    }
  }, [webcamOn]);
  useEffect(() => () => { streamRef.current?.getTracks().forEach((t) => t.stop()); }, []);

  return (
    <Paper elevation={0} sx={{
      bgcolor: '#060E08', border: `1px solid ${C.accent}44`, borderRadius: 2,
      aspectRatio: '16/9', position: 'relative', overflow: 'hidden',
      filter: cam.night ? 'sepia(1) hue-rotate(70deg) saturate(2) brightness(1.1)' : 'none',
    }}>
      {/* Transformable scene layer (zoom/pan/tilt) */}
      <Box sx={{
        position: 'absolute', inset: 0,
        transform: `scale(${cam.zoom}) translate(${cam.panX}%, ${cam.tiltY}%)`,
        transformOrigin: 'center', transition: 'transform 0.18s ease-out',
      }}>
        {/* faux coop backdrop */}
        <Box sx={{ position: 'absolute', inset: 0, background: `radial-gradient(circle at 50% 40%, ${C.surface} 0%, #060E08 75%)` }} />
        {/* live webcam layer (default system camera) — covers the sim backdrop when on */}
        {webcamOn && (
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
          />
        )}
        <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 0.5 }}>
          {!webcamOn && <Typography sx={{ color: C.goldMuted, fontSize: 11 }}>{label}</Typography>}
          {!webcamOn && <Typography sx={{ color: C.accent + '88', fontSize: 9 }}>SIM feed · ESP32-S3-EYE stream when flashed</Typography>}
        </Box>
        {cam.overlay && shown.map((b, i) => (
          <Box key={b.id} sx={{
            position: 'absolute', left: `${15 + i * 24}%`, top: `${22 + i * 14}%`,
            width: '20%', height: '28%',
            border: `2px solid ${b.flagged ? C.danger : '#4CAF50'}`, borderRadius: 1,
            boxShadow: `0 0 8px ${b.flagged ? C.danger : '#4CAF50'}66`,
          }}>
            <Box sx={{ bgcolor: b.flagged ? C.danger : '#4CAF50', px: 0.5, position: 'absolute', top: -15, left: 0, borderRadius: '2px 2px 0 0' }}>
              <Typography sx={{ color: '#06140C', fontSize: 8, fontWeight: 700, lineHeight: '15px' }}>{b.name} · {b.confidence}%</Typography>
            </Box>
          </Box>
        ))}
      </Box>

      {/* Snapshot flash */}
      {flash && <Box sx={{ position: 'absolute', inset: 0, bgcolor: '#fff', opacity: 0.7, animation: 'none' }} />}

      {/* HUD overlays (fixed, not transformed) */}
      <Stack direction="row" spacing={0.5} alignItems="center" sx={{ position: 'absolute', top: 8, right: 8 }}>
        {cam.recording && (
          <Chip size="small" icon={<FiberManualRecordIcon sx={{ fontSize: 10, color: '#FF4444 !important' }} />}
            label={`REC ${fmt(cam.recSecs)}`} sx={{ bgcolor: '#00000099', color: C.white, fontSize: 10, height: 20, '& .MuiChip-label': { px: 0.5 } }} />
        )}
        {cam.night && <Chip size="small" label="NIGHT" sx={{ bgcolor: '#00000099', color: '#8DD47A', fontSize: 9, height: 20 }} />}
        <Chip size="small" label={`${cam.zoom.toFixed(1)}×`} sx={{ bgcolor: '#00000099', color: C.white, fontSize: 9, height: 20 }} />
      </Stack>
      <Typography sx={{ position: 'absolute', bottom: 6, left: 8, color: C.white, opacity: 0.7, fontSize: 9 }}>
        {new Date().toLocaleTimeString()}
      </Typography>
      {/* crosshair when zoomed/panned */}
      {(cam.zoom > 1 || cam.panX !== 0 || cam.tiltY !== 0) && (
        <CenterFocusStrongIcon sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', color: '#ffffff22', fontSize: 40 }} />
      )}

      {/* "Use my camera" — only on the main viewport; uses the default system camera */}
      {allowWebcam && (
        <Stack sx={{ position: 'absolute', bottom: 8, right: 8, alignItems: 'flex-end', gap: 0.5, maxWidth: '80%' }}>
          {webcamOn && (
            <Chip size="small" label="● MY CAMERA · local only"
              sx={{ bgcolor: C.danger, color: '#fff', fontSize: 9, height: 20 }} />
          )}
          <Button size="small" variant="contained" onClick={webcamOn ? stopWebcam : startWebcam}
            sx={{ bgcolor: webcamOn ? C.danger : C.accent, fontSize: 11, py: 0.4 }}>
            {webcamOn ? 'Stop camera' : '📷 Use my camera'}
          </Button>
          {webcamErr && (
            <Alert severity="warning" sx={{ py: 0, fontSize: 10, '& .MuiAlert-message': { py: 0.5 } }}>{webcamErr}</Alert>
          )}
        </Stack>
      )}
    </Paper>
  );
}

function PanTiltPad({ onPan, onTilt, onHome }: { onPan: (d: number) => void; onTilt: (d: number) => void; onHome: () => void }) {
  const btn = { color: C.gold, bgcolor: C.bg, border: `1px solid ${C.accent}44`, '&:hover': { bgcolor: C.accent + '33' } };
  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 32px)', gridTemplateRows: 'repeat(3, 32px)', gap: 0.5 }}>
      <Box />
      <IconButton size="small" sx={btn} onClick={() => onTilt(-4)}><KeyboardArrowUpIcon fontSize="small" /></IconButton>
      <Box />
      <IconButton size="small" sx={btn} onClick={() => onPan(-4)}><KeyboardArrowLeftIcon fontSize="small" /></IconButton>
      <Tooltip title="Recenter"><IconButton size="small" sx={btn} onClick={onHome}><CenterFocusStrongIcon fontSize="small" /></IconButton></Tooltip>
      <IconButton size="small" sx={btn} onClick={() => onPan(4)}><KeyboardArrowRightIcon fontSize="small" /></IconButton>
      <Box />
      <IconButton size="small" sx={btn} onClick={() => onTilt(4)}><KeyboardArrowDownIcon fontSize="small" /></IconButton>
      <Box />
    </Box>
  );
}

function BirdCard({ bird, onClick }: { bird: DetectedBird; onClick: () => void }) {
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
          <Typography sx={{ color: C.goldMuted, fontSize: 11 }}>{bird.zone}</Typography>
        </Box>
        <Stack alignItems="flex-end" spacing={0.5}>
          <Chip label={bird.posture} size="small" sx={{ bgcolor: POSTURE_COLOR[bird.posture] + '22', color: POSTURE_COLOR[bird.posture], fontSize: 10, fontWeight: 700 }} />
          <Typography sx={{ color: healthColor(bird.healthScore), fontSize: 11, fontWeight: 700 }}>{bird.healthScore}% health</Typography>
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

// ── Tab panels ─────────────────────────────────────────────────────────────────
function DetectionPanel({ birds, onOpen }: { birds: DetectedBird[]; onOpen: (id: string) => void }) {
  return (
    <Stack spacing={1.5}>
      {birds.map(b => <BirdCard key={b.id} bird={b} onClick={() => onOpen(b.id)} />)}
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
    </Stack>
  );
}

function IdentityPanel({ birds, onOpen }: { birds: DetectedBird[]; onOpen: (id: string) => void }) {
  return (
    <Stack spacing={1.5}>
      <Typography sx={{ color: C.goldMuted, fontSize: 12 }}>
        Each detected bird is matched to a registered flock identity by plumage colour, comb shape, and leg band.
      </Typography>
      {birds.map(b => {
        const registered = Boolean(b.bandId);
        return (
          <Paper key={b.id} elevation={0} onClick={() => onOpen(b.id)} sx={{
            bgcolor: C.bg, border: `1px solid ${C.accent}44`, borderRadius: 2, p: 1.5, cursor: 'pointer',
            '&:hover': { border: `1px solid ${C.accent}` },
          }}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Avatar sx={{ bgcolor: C.accent + '33', color: C.accent, width: 36, height: 36 }}><FingerprintIcon fontSize="small" /></Avatar>
              <Box flex={1} minWidth={0}>
                <Typography sx={{ color: C.gold, fontWeight: 700, fontSize: 13 }}>{b.name}</Typography>
                <Typography sx={{ color: C.goldMuted, fontSize: 11 }} noWrap>{b.breed}{b.color ? ` · ${b.color}` : ''}</Typography>
              </Box>
              <Stack alignItems="flex-end" spacing={0.5}>
                <Chip size="small" label={registered ? `Band ${b.bandId}` : 'Unbanded'}
                  sx={{ bgcolor: registered ? C.accent + '22' : C.warning + '22', color: registered ? C.accent : C.warning, fontSize: 10, fontWeight: 700 }} />
                <Typography sx={{ color: C.white, fontSize: 11, fontWeight: 700 }}>{b.confidence}% match</Typography>
              </Stack>
            </Stack>
            <Box mt={0.75}>
              <LinearProgress variant="determinate" value={b.confidence}
                sx={{ height: 4, borderRadius: 2, bgcolor: C.bg, '& .MuiLinearProgress-bar': { bgcolor: b.confidence > 90 ? '#4CAF50' : C.warning } }} />
            </Box>
          </Paper>
        );
      })}
    </Stack>
  );
}

function HealthPanel({ birds }: { birds: DetectedBird[] }) {
  const flagged = birds.filter(b => b.flagged);
  return (
    <Stack spacing={1.5}>
      {flagged.length > 0 && (
        <Paper elevation={0} sx={{ bgcolor: C.danger + '11', border: `1px solid ${C.danger}66`, borderRadius: 2, p: 1.5 }}>
          <Stack direction="row" spacing={1} alignItems="center" mb={0.5}>
            <WarningIcon sx={{ color: C.danger, fontSize: 18 }} />
            <Typography sx={{ color: C.danger, fontWeight: 700, fontSize: 13 }}>{flagged.length} bird{flagged.length > 1 ? 's' : ''} need attention</Typography>
          </Stack>
          {flagged.map(b => (
            <Typography key={b.id} sx={{ color: C.white, fontSize: 12, ml: 3.25 }}>
              <b>{b.name}</b> — {b.flagReason || 'flagged for monitoring'}
            </Typography>
          ))}
        </Paper>
      )}
      {birds.map(b => (
        <Paper key={b.id} elevation={0} sx={{ bgcolor: C.bg, border: `1px solid ${C.accent}44`, borderRadius: 2, p: 1.5 }}>
          <Stack direction="row" justifyContent="space-between" mb={0.5}>
            <Stack direction="row" spacing={1} alignItems="center">
              <MonitorHeartIcon sx={{ color: healthColor(b.healthScore), fontSize: 18 }} />
              <Typography sx={{ color: C.gold, fontWeight: 700, fontSize: 13 }}>{b.name}</Typography>
            </Stack>
            <Typography sx={{ color: healthColor(b.healthScore), fontWeight: 700, fontSize: 14 }}>{b.healthScore}%</Typography>
          </Stack>
          <LinearProgress variant="determinate" value={b.healthScore}
            sx={{ height: 7, borderRadius: 4, bgcolor: C.bg, '& .MuiLinearProgress-bar': { bgcolor: healthColor(b.healthScore), borderRadius: 4 } }} />
          <Stack direction="row" spacing={2} mt={0.75}>
            <Typography sx={{ color: C.goldMuted, fontSize: 10 }}>Posture: <Box component="span" sx={{ color: POSTURE_COLOR[b.posture] }}>{b.posture}</Box></Typography>
            <Typography sx={{ color: C.goldMuted, fontSize: 10 }}>Zone: <Box component="span" sx={{ color: C.white }}>{b.zone}</Box></Typography>
          </Stack>
        </Paper>
      ))}
    </Stack>
  );
}

function EggsPanel({ boxes, loading, onCollect, onMarkLaid }: {
  boxes: NestBox[]; loading: boolean; onCollect: (id: string) => void; onMarkLaid: (id: string) => void;
}) {
  const ready = boxes.filter(b => b.hasEgg && b.collectedAt == null).length;
  const collected = boxes.filter(b => b.collectedAt != null).length;
  const fmtTime = (ms?: number | null) => (ms ? new Date(ms).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : '—');

  if (loading) return <Typography sx={{ color: C.goldMuted }}>Reading nest boxes…</Typography>;

  return (
    <Stack spacing={1.5}>
      <Stack direction="row" spacing={1} flexWrap="wrap">
        <Chip icon={<EggIcon sx={{ color: '#D4A574 !important' }} />} label={`${ready} ready to collect`} sx={{ bgcolor: '#D4A574' + '22', color: '#D4A574', fontWeight: 700 }} />
        <Chip label={`${collected} collected today`} sx={{ bgcolor: C.accent + '22', color: C.accent, fontWeight: 700 }} />
      </Stack>
      {boxes.map(b => {
        const isCollected = b.collectedAt != null;
        const status = isCollected ? 'Collected' : b.hasEgg ? 'Egg detected' : 'Empty — monitoring';
        const col = isCollected ? C.accent : b.hasEgg ? '#D4A574' : C.goldMuted;
        return (
          <Paper key={b.id} elevation={0} sx={{ bgcolor: C.bg, border: `1px solid ${col}44`, borderRadius: 2, p: 1.5 }}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Avatar sx={{ bgcolor: col + '22', color: col, width: 38, height: 38, fontSize: 20 }}>{b.hasEgg ? '🥚' : '🪺'}</Avatar>
              <Box flex={1} minWidth={0}>
                <Typography sx={{ color: C.gold, fontWeight: 700, fontSize: 13 }}>{b.label}</Typography>
                <Typography sx={{ color: col, fontSize: 11 }}>
                  {status}{b.hasEgg && b.eggColor ? ` · ${b.eggColor}` : ''}{b.hasEgg ? ` · ${b.confidence}%` : ''}
                </Typography>
                {b.hasEgg && <Typography sx={{ color: C.goldMuted, fontSize: 10 }}>Laid ~{fmtTime(b.laidAt)}{isCollected ? ` · collected ${fmtTime(b.collectedAt)}` : ''}</Typography>}
              </Box>
              {b.hasEgg && !isCollected && (
                <Button size="small" variant="contained" onClick={() => onCollect(b.id)} sx={{ bgcolor: C.accent, fontSize: 11 }}>Collect</Button>
              )}
              {!b.hasEgg && (
                <Tooltip title="Simulate a lay event (demo)">
                  <IconButton size="small" onClick={() => onMarkLaid(b.id)} sx={{ color: C.goldMuted }}><AddIcon fontSize="small" /></IconButton>
                </Tooltip>
              )}
            </Stack>
          </Paper>
        );
      })}
      <Typography sx={{ color: C.goldMuted, fontSize: 11 }}>
        🥚 Egg detection runs on the nest-box camera (Camera 2). When ESP32-S3 firmware is flashed, lay events post
        automatically; today's layout is seeded for demo until then.
      </Typography>
    </Stack>
  );
}

export default function ChickenEyeDashboardPage() {
  const navigate = useNavigate();
  const { products } = useProducts();
  const deviceOptions = products.length > 0
    ? products.map(p => ({ id: p.device_id ?? p.id, name: p.product_name }))
    : [{ id: 'ct_001', name: 'Chicken Tender (sim)' }];
  const [deviceId, setDeviceId] = useState(deviceOptions[0].id);

  const { birds: roster, loading, seedDemoFlock } = useBirds();
  const eggColors = useMemo(() => Array.from(new Set(roster.map(b => b.eggColor).filter(Boolean))) as string[], [roster]);
  const { boxes, loading: eggsLoading, collectEgg, markLaid } = useEggs(deviceId, { eggColors });

  const [activeCamera, setActiveCamera] = useState(0);
  const [tab, setTab] = useState(0);
  const [cam, setCam] = useState<CamState>({ zoom: 1, panX: 0, tiltY: 0, night: false, overlay: true, recording: false, recSecs: 0 });
  const [flash, setFlash] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const viewportRef = useRef<HTMLDivElement>(null);

  const birds = useMemo(() => roster.map(toDetected), [roster]);
  const flaggedCount = birds.filter(b => b.flagged).length;
  const avgHealth = birds.length ? Math.round(birds.reduce((a, b) => a + b.healthScore, 0) / birds.length) : 0;
  const eggsReady = boxes.filter(b => b.hasEgg && b.collectedAt == null).length;

  // recording timer
  useEffect(() => {
    if (!cam.recording) return;
    const t = setInterval(() => setCam(c => ({ ...c, recSecs: c.recSecs + 1 })), 1000);
    return () => clearInterval(t);
  }, [cam.recording]);

  const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
  const setZoom = (z: number) => setCam(c => ({ ...c, zoom: clamp(z, 1, 4) }));
  const pan = (d: number) => setCam(c => ({ ...c, panX: clamp(c.panX + d, -20, 20) }));
  const tilt = (d: number) => setCam(c => ({ ...c, tiltY: clamp(c.tiltY + d, -20, 20) }));
  const home = () => setCam(c => ({ ...c, zoom: 1, panX: 0, tiltY: 0 }));

  const snapshot = () => { setFlash(true); setTimeout(() => setFlash(false), 160); setToast(`Snapshot saved — ${CAMERAS[activeCamera]} (sim)`); };
  const toggleRecord = () => setCam(c => ({ ...c, recording: !c.recording, recSecs: c.recording ? 0 : c.recSecs }));
  const goFullscreen = () => { void viewportRef.current?.requestFullscreen?.(); };

  const toolBtn = (active: boolean) => ({
    color: active ? C.white : C.gold, bgcolor: active ? C.accent : C.bg,
    border: `1px solid ${C.accent}44`, '&:hover': { bgcolor: active ? C.accent : C.accent + '33' },
  });

  return (
    <Box sx={{ bgcolor: C.bg, minHeight: '100dvh', p: { xs: 2, sm: 3 } }}>
      <Stack spacing={2.5} sx={{ maxWidth: 1280, mx: 'auto' }}>

        {/* Header */}
        <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1.5}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <VisibilityIcon sx={{ color: C.accent, fontSize: 28 }} />
            <Box>
              <Typography variant="h5" sx={{ color: C.gold, fontWeight: 700 }}>ChickenEye™ AI Vision</Typography>
              <Typography sx={{ color: C.goldMuted, fontSize: 13 }}>ESP32-S3 3-camera detection · TFLite Micro on-device inference</Typography>
            </Box>
          </Stack>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <FormControl size="small" sx={{ minWidth: 170 }}>
              <InputLabel sx={{ color: C.goldMuted }}>Device</InputLabel>
              <Select value={deviceId} label="Device" onChange={e => setDeviceId(e.target.value)}
                sx={{ color: C.white, '& .MuiOutlinedInput-notchedOutline': { borderColor: C.accent } }}>
                {deviceOptions.map(d => <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>)}
              </Select>
            </FormControl>
            <Tooltip title="Manage flock roster">
              <IconButton onClick={() => navigate('/birds')} sx={{ color: C.accent }}><RefreshIcon /></IconButton>
            </Tooltip>
          </Stack>
        </Stack>

        {loading ? (
          <Paper elevation={0} sx={{ bgcolor: C.surface, border: `1px solid ${C.accent}44`, borderRadius: 2, p: 4, textAlign: 'center' }}>
            <Typography sx={{ color: C.goldMuted }}>Loading flock…</Typography>
          </Paper>
        ) : birds.length === 0 ? (
          <Paper elevation={0} sx={{ bgcolor: C.surface, border: `1px solid ${C.accent}44`, borderRadius: 2, p: 4, textAlign: 'center' }}>
            <VisibilityIcon sx={{ color: C.goldMuted, fontSize: 40, mb: 1 }} />
            <Typography sx={{ color: C.gold, fontWeight: 700, mb: 0.5 }}>No birds detected</Typography>
            <Typography sx={{ color: C.goldMuted, mb: 2 }}>
              ChickenEye watches the birds in your flock roster. Add birds in Bird Management, or load a sample flock to explore.
            </Typography>
            <Stack direction="row" spacing={1.5} justifyContent="center">
              <Button variant="contained" onClick={() => navigate('/birds')} sx={{ bgcolor: C.accent }}>Manage Flock</Button>
              <Button variant="outlined" onClick={() => void seedDemoFlock()} sx={{ borderColor: C.accent, color: C.accent }}>Load Demo Flock</Button>
            </Stack>
          </Paper>
        ) : (
          <>
            {/* Status row */}
            <Stack direction="row" spacing={1.5} flexWrap="wrap">
              <Chip label={`${birds.length} birds detected`} sx={{ bgcolor: C.accent + '22', color: C.accent, fontWeight: 700 }} />
              <Chip label={`Avg health: ${avgHealth}%`} sx={{ bgcolor: avgHealth > 85 ? '#4CAF50' + '22' : C.warning + '22', color: avgHealth > 85 ? '#4CAF50' : C.warning, fontWeight: 700 }} />
              {flaggedCount > 0 && <Chip icon={<WarningIcon />} label={`${flaggedCount} flagged`} sx={{ bgcolor: C.danger + '22', color: C.danger, fontWeight: 700 }} />}
              {eggsReady > 0 && <Chip icon={<EggIcon sx={{ color: '#D4A574 !important' }} />} label={`${eggsReady} egg${eggsReady > 1 ? 's' : ''} ready`} sx={{ bgcolor: '#D4A574' + '22', color: '#D4A574', fontWeight: 700 }} />}
              <Chip label="3 cameras · SIM mode" sx={{ bgcolor: C.bg, color: C.goldMuted, border: `1px solid ${C.accent}44` }} />
            </Stack>

            <Grid container spacing={2.5}>
              {/* Camera + controls */}
              <Grid item xs={12} lg={7}>
                <Stack spacing={1.5}>
                  {/* Camera tabs + action toolbar */}
                  <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1}>
                    <Stack direction="row" spacing={0.75}>
                      {CAMERAS.map((c, i) => (
                        <Chip key={i} label={`Cam ${i + 1}`} size="small" clickable onClick={() => setActiveCamera(i)}
                          sx={{ bgcolor: activeCamera === i ? C.accent : C.surface, color: activeCamera === i ? C.white : C.goldMuted, fontWeight: 700 }} />
                      ))}
                    </Stack>
                    <Stack direction="row" spacing={0.5}>
                      <Tooltip title="Detection overlay"><IconButton size="small" sx={toolBtn(cam.overlay)} onClick={() => setCam(c => ({ ...c, overlay: !c.overlay }))}><GridOnIcon fontSize="small" /></IconButton></Tooltip>
                      <Tooltip title="Night vision"><IconButton size="small" sx={toolBtn(cam.night)} onClick={() => setCam(c => ({ ...c, night: !c.night }))}><DarkModeIcon fontSize="small" /></IconButton></Tooltip>
                      <Tooltip title="Snapshot"><IconButton size="small" sx={toolBtn(false)} onClick={snapshot}><PhotoCameraIcon fontSize="small" /></IconButton></Tooltip>
                      <Tooltip title={cam.recording ? 'Stop recording' : 'Record'}><IconButton size="small" sx={toolBtn(cam.recording)} onClick={toggleRecord}><FiberManualRecordIcon fontSize="small" sx={{ color: cam.recording ? '#FF4444' : undefined }} /></IconButton></Tooltip>
                      <Tooltip title="Fullscreen"><IconButton size="small" sx={toolBtn(false)} onClick={goFullscreen}><FullscreenIcon fontSize="small" /></IconButton></Tooltip>
                    </Stack>
                  </Stack>

                  {/* Viewport */}
                  <Box ref={viewportRef}>
                    <CameraViewport label={CAMERAS[activeCamera]} cameraId={activeCamera} birds={birds} cam={cam} flash={flash} allowWebcam />
                  </Box>

                  {/* PTZ + zoom controls */}
                  <Paper elevation={0} sx={{ bgcolor: C.surface, border: `1px solid ${C.accent}44`, borderRadius: 2, p: 1.5 }}>
                    <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1.5}>
                      <Stack direction="row" spacing={1.5} alignItems="center">
                        <PanTiltPad onPan={pan} onTilt={tilt} onHome={home} />
                        <Box>
                          <Typography sx={{ color: C.goldMuted, fontSize: 11, fontWeight: 700 }}>PAN / TILT</Typography>
                          <Typography sx={{ color: C.white, fontSize: 11 }}>X {cam.panX > 0 ? '+' : ''}{cam.panX}° · Y {cam.tiltY > 0 ? '+' : ''}{cam.tiltY}°</Typography>
                        </Box>
                      </Stack>
                      <Box sx={{ flex: 1, minWidth: 180 }}>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <IconButton size="small" sx={{ color: C.gold }} onClick={() => setZoom(cam.zoom - 0.5)}><RemoveIcon fontSize="small" /></IconButton>
                          <Slider value={cam.zoom} min={1} max={4} step={0.1} onChange={(_, v) => setZoom(v as number)}
                            sx={{ color: C.accent, '& .MuiSlider-thumb': { bgcolor: C.gold } }} />
                          <IconButton size="small" sx={{ color: C.gold }} onClick={() => setZoom(cam.zoom + 0.5)}><AddIcon fontSize="small" /></IconButton>
                          <Typography sx={{ color: C.white, fontSize: 12, fontWeight: 700, width: 36, textAlign: 'right' }}>{cam.zoom.toFixed(1)}×</Typography>
                        </Stack>
                        <Typography sx={{ color: C.goldMuted, fontSize: 10, textAlign: 'center', mt: 0.25 }}>Digital zoom</Typography>
                      </Box>
                    </Stack>
                  </Paper>

                  {/* Other camera slots — not connected until you add a real device. */}
                  <Grid container spacing={1.5}>
                    {CAMERAS.map((c, i) => i !== activeCamera && (
                      <Grid item xs={6} key={c}>
                        <Paper elevation={0} sx={{
                          bgcolor: C.bg, border: `1px dashed ${C.accent}66`, borderRadius: 2,
                          aspectRatio: '16/9', display: 'flex', flexDirection: 'column',
                          alignItems: 'center', justifyContent: 'center', gap: 0.4, p: 1, textAlign: 'center',
                        }}>
                          <Typography sx={{ fontSize: 20, opacity: 0.6 }}>📷</Typography>
                          <Typography sx={{ color: C.goldMuted, fontSize: 10 }}>{c}</Typography>
                          <Typography sx={{ color: C.danger, fontSize: 9, fontWeight: 700, letterSpacing: 0.5 }}>NOT CONNECTED</Typography>
                          <Button size="small" href="/flash" sx={{ color: C.accent, fontSize: 9, minWidth: 0 }}>+ Connect camera</Button>
                        </Paper>
                      </Grid>
                    ))}
                    {/* Add more devices / cameras */}
                    <Grid item xs={6}>
                      <Paper elevation={0} sx={{
                        bgcolor: C.bg, border: `1px dashed ${C.accent}66`, borderRadius: 2,
                        aspectRatio: '16/9', display: 'flex', flexDirection: 'column',
                        alignItems: 'center', justifyContent: 'center', gap: 0.4, p: 1, textAlign: 'center',
                      }}>
                        <AddIcon sx={{ color: C.accent }} />
                        <Typography sx={{ color: C.goldMuted, fontSize: 10 }}>Connect additional devices &amp; cameras</Typography>
                        <Button size="small" href="/flash" sx={{ color: C.accent, fontSize: 9, minWidth: 0 }}>Flash a device →</Button>
                      </Paper>
                    </Grid>
                  </Grid>
                </Stack>
              </Grid>

              {/* Tabbed analysis panel */}
              <Grid item xs={12} lg={5}>
                <Paper elevation={0} sx={{ bgcolor: C.surface, border: `1px solid ${C.accent}44`, borderRadius: 2, overflow: 'hidden' }}>
                  <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="fullWidth"
                    sx={{ minHeight: 44, '& .MuiTab-root': { color: C.goldMuted, minHeight: 44, fontSize: 12, fontWeight: 700 }, '& .Mui-selected': { color: `${C.gold} !important` }, '& .MuiTabs-indicator': { bgcolor: C.accent } }}>
                    <Tab icon={<GridOnIcon sx={{ fontSize: 16 }} />} iconPosition="start" label="Detect" />
                    <Tab icon={<FingerprintIcon sx={{ fontSize: 16 }} />} iconPosition="start" label="ID" />
                    <Tab icon={<MonitorHeartIcon sx={{ fontSize: 16 }} />} iconPosition="start" label="Health" />
                    <Tab icon={<EggIcon sx={{ fontSize: 16 }} />} iconPosition="start" label="Eggs" />
                  </Tabs>
                  <Divider sx={{ borderColor: C.accent + '22' }} />
                  <Box sx={{ p: 2, maxHeight: { lg: 620 }, overflowY: 'auto' }}>
                    {tab === 0 && <DetectionPanel birds={birds} onOpen={id => navigate(`/chicken-eye/${id}`)} />}
                    {tab === 1 && <IdentityPanel birds={birds} onOpen={id => navigate(`/chicken-eye/${id}`)} />}
                    {tab === 2 && <HealthPanel birds={birds} />}
                    {tab === 3 && <EggsPanel boxes={boxes} loading={eggsLoading} onCollect={id => void collectEgg(id)} onMarkLaid={id => void markLaid(id)} />}
                  </Box>
                </Paper>
              </Grid>
            </Grid>

            <Paper elevation={0} sx={{ bgcolor: C.surface, border: `1px solid ${C.accent}44`, borderRadius: 2, p: 2 }}>
              <Typography sx={{ color: C.goldMuted, fontSize: 12 }}>
                🔬 Live AI detection runs on-device — <Box component="code" sx={{ color: C.accent }}>ESP32-S3-EYE × 3</Box> with
                TFLite Micro classifying threat vs. non-threat locally (no Jetson Nano or cloud LLM required).
                Add a LoRa <Box component="code" sx={{ color: C.accent }}>SX1276</Box> to mesh with WatchTower AI predator
                monitors for whole-yard live view and predator alarms beyond WiFi range. Flash via{' '}
                <Box component="code" sx={{ color: C.accent }}>scripts/flash-firmware.sh --target watchtower</Box>.
              </Typography>
            </Paper>
          </>
        )}
      </Stack>

      <Snackbar open={Boolean(toast)} autoHideDuration={2500} onClose={() => setToast(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity="success" variant="filled" onClose={() => setToast(null)} sx={{ bgcolor: C.accent }}>{toast}</Alert>
      </Snackbar>
    </Box>
  );
}
