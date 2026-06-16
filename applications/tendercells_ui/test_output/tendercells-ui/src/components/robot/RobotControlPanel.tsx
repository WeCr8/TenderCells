// RobotControlPanel.tsx — 6DOF arm + GRBL gantry controls, wired to the live backend.
//
// Wiring fixes (2026-06-15): uses useHardwareControl (correct API base + Bearer auth),
// shows LIVE arm/gantry state from the backend, sends the correct arm joints[6]+speed
// payload, real /gantry + /estop endpoints, a chicken-presence safety gate before arm
// motion, and optional USB game-controller jog (off by default).

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Box, Paper, Typography, Grid, Button, Stack, Card, CardContent, Slider,
  Dialog, DialogTitle, DialogContent, Chip, IconButton, Tooltip, Switch,
  FormControlLabel, TextField, Alert,
} from '@mui/material';
import {
  Videocam as CameraIcon, Close as CloseIcon, PlayArrow as StartIcon,
  Stop as StopIcon, Home as HomeIcon, SportsEsports as GamepadIcon,
} from '@mui/icons-material';
import CameraFeedViewer from '../camera/CameraFeedViewer';
import ArmKinematics3D from './ArmKinematics3D';
import { useHardwareControl } from '../../hooks/useHardwareControl';
import { useGamepad, type GamepadFrame } from '../../hooks/useGamepad';

type Joints = [number, number, number, number, number, number];

export default function RobotControlPanel({ deviceId = 'ct_001' }: { deviceId?: string }) {
  const hw = useHardwareControl(deviceId);

  const [joints, setJoints] = useState<Joints>([0, 45, 90, 0, 45, 0]);
  const [feedRate, setFeedRate] = useState(50);
  const [gantry, setGantry] = useState({ x: 0, y: 0 });
  const [connected, setConnected] = useState(false);
  const [status, setStatus] = useState<'idle' | 'moving' | 'error' | 'estop'>('idle');
  const [chickenPresent, setChickenPresent] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [useController, setUseController] = useState(false);
  const [selJoint, setSelJoint] = useState(0);

  // Refs for the gamepad loop (avoids stale closures + re-subscribes).
  const jointsRef = useRef(joints);  jointsRef.current = joints;
  const gantryRef = useRef(gantry);  gantryRef.current = gantry;
  const feedRef = useRef(feedRate);  feedRef.current = feedRate;
  const lastSend = useRef(0);

  // ── Live state: poll the backend (arm joints + gantry position + presence) ──
  useEffect(() => {
    let alive = true;
    const tick = async () => {
      try {
        const [arm, gan] = await Promise.all([hw.getArmState(), hw.getGantryState()]);
        if (!alive) return;
        if (arm) {
          setConnected(true);
          if (Array.isArray(arm.joints)) setJoints(arm.joints.slice(0, 6) as Joints);
          if (arm.state === 'estop') setStatus('estop');
        }
        if (gan && typeof gan.gantryX === 'number') setGantry({ x: gan.gantryX, y: gan.gantryY });
        if (!arm && !gan) setConnected(false);
      } catch {
        if (alive) setConnected(false);
      }
    };
    tick();
    const id = setInterval(tick, 1500);
    return () => { alive = false; clearInterval(id); };
    // Poll on a fixed 1.5s interval keyed to the device only. Depending on `hw`
    // (a fresh object each render) would tear down + refetch every render — with
    // live joint updates that becomes a tight fetch/render loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deviceId]);

  // ── Actions (all go through the wired hook) ──
  const applyJoints = useCallback(async (j: Joints) => {
    // Safety gate (project rule): no arm motion while a chicken is detected.
    if (chickenPresent) { setStatus('error'); return; }
    try { setStatus('moving'); await hw.controlArm(j, feedRef.current / 100); setStatus('idle'); }
    catch { setStatus('error'); }
  }, [hw, chickenPresent]);

  const eStop = useCallback(async () => {
    try { await hw.emergencyStop(); setStatus('estop'); } catch { setStatus('error'); }
  }, [hw]);

  const jogGantry = useCallback((dx: number, dy: number) => {
    const nx = gantryRef.current.x + dx, ny = gantryRef.current.y + dy;
    setGantry({ x: nx, y: ny });
    void hw.moveGantry(nx, ny, feedRef.current / 100);
  }, [hw]);

  // ── USB controller mapping (only when the user opts in) ──
  const onPad = useCallback((f: GamepadFrame) => {
    const now = Date.now();
    // Start button (9) → E-STOP, always. A (0) → gantry home.
    if (f.pressed.includes(9)) void eStop();
    if (f.pressed.includes(0)) void hw.gantryHome();
    if (now - lastSend.current < 150) return;  // throttle motion sends
    const [lx, ly, rx = 0, ry = 0] = f.axes;
    if (lx || ly) { jogGantry(lx * 5, -ly * 5); lastSend.current = now; }
    if (ry) {  // right stick Y nudges the selected joint
      const j = [...jointsRef.current] as Joints;
      j[selJoint] = Math.max(-180, Math.min(180, j[selJoint] - ry * 3));
      setJoints(j); void applyJoints(j); lastSend.current = now;
    }
    void rx;
  }, [eStop, hw, jogGantry, applyJoints, selJoint]);

  const pad = useGamepad(useController, onPad);

  const statusColor = ({ idle: '#4A7C59', moving: '#E8A020', error: '#CC3333', estop: '#CC3333' } as const)[status];

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ color: '#C8B882', mb: 0.5 }}>
            TenderCells Rail System™ Controls
          </Typography>
          <Typography variant="body2" color="text.secondary">
            6DOF Robot Arm + GRBL Gantry Motion Control
          </Typography>
        </Box>
        <Tooltip title="View live robot camera feed">
          <IconButton onClick={() => setShowCamera(true)}
            sx={{ bgcolor: '#4A7C59', color: '#C8B882', padding: 2, '&:hover': { bgcolor: '#5a8c69' } }}>
            <CameraIcon />
          </IconButton>
        </Tooltip>
      </Stack>

      {/* Status + connection + controller toggle */}
      <Paper sx={{ p: 2, mb: 3, bgcolor: '#1A3D2B', border: '1px solid #4A7C59' }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={6} sm={3}>
            <Typography variant="subtitle2" color="text.secondary">Status</Typography>
            <Chip label={status.toUpperCase()} sx={{ bgcolor: statusColor, color: '#F0EDE4', fontWeight: 'bold' }} />
          </Grid>
          <Grid item xs={6} sm={3}>
            <Typography variant="subtitle2" color="text.secondary">Connection</Typography>
            <Chip label={connected ? 'LIVE' : 'OFFLINE'} color={connected ? 'success' : 'error'} variant="outlined" />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControlLabel
              control={<Switch checked={useController} onChange={(e) => setUseController(e.target.checked)} />}
              label={
                <Stack direction="row" spacing={1} alignItems="center">
                  <GamepadIcon fontSize="small" />
                  <span>USB controller {useController ? (pad.connected ? `· ${pad.id?.slice(0, 18)}` : '· plug in a pad') : 'support'}</span>
                </Stack>
              }
            />
          </Grid>
        </Grid>
        {useController && !pad.supported && (
          <Alert severity="warning" sx={{ mt: 1 }}>This browser has no Gamepad API — use Chrome or Edge.</Alert>
        )}
      </Paper>

      {/* Chicken-presence safety gate */}
      <FormControlLabel sx={{ mb: 2 }}
        control={<Switch checked={chickenPresent} color="warning" onChange={(e) => setChickenPresent(e.target.checked)} />}
        label={<Typography sx={{ color: chickenPresent ? '#E8A020' : '#8A7D55' }}>
          Chicken present (blocks arm motion — safety)</Typography>} />

      {/* Camera dialog */}
      <Dialog open={showCamera} onClose={() => setShowCamera(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ bgcolor: '#0D2B1E', color: '#C8B882' }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography>Robot Arm Live Feed</Typography>
            <IconButton onClick={() => setShowCamera(false)} size="small"><CloseIcon /></IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent sx={{ bgcolor: '#0D2B1E', p: 2 }}>
          <CameraFeedViewer camera={{ id: 'robot-camera-1', deviceId, name: 'Robot Arm Overhead View',
            location: 'main-feed', resolution: '1080p', fps: 30, connected: true, signal: -55 }} height={480} />
        </DialogContent>
      </Dialog>

      {/* Live 3D forward-kinematics view — true position from joints + gantry */}
      <Typography variant="h6" sx={{ color: '#C8B882', mb: 1 }}>Live 3D Position (kinematics)</Typography>
      <Paper sx={{ mb: 3, bgcolor: '#0D2B1E', border: '1px solid #4A7C59', overflow: 'hidden' }}>
        <ArmKinematics3D joints={joints} gantry={gantry} height={320} />
      </Paper>

      {/* Joint controls */}
      <Typography variant="h6" sx={{ color: '#C8B882', mb: 2 }}>Joint Angles (live)</Typography>
      <Grid container spacing={2} sx={{ mb: 2 }}>
        {joints.map((angle, idx) => (
          <Grid item xs={12} sm={6} md={4} key={idx}>
            <Card sx={{ bgcolor: '#1A3D2B', border: selJoint === idx ? '1px solid #C8B882' : 'none' }}
              onClick={() => setSelJoint(idx)}>
              <CardContent>
                <Stack spacing={1}>
                  <Typography variant="subtitle2" sx={{ color: '#C8B882' }}>
                    Joint {idx + 1} {selJoint === idx && '•'}
                  </Typography>
                  <Typography variant="h6" sx={{ color: '#F0EDE4' }}>{angle.toFixed(1)}°</Typography>
                  <Slider value={angle} min={-180} max={180} step={1} valueLabelDisplay="auto"
                    onChange={(_, v) => { const j = [...joints] as Joints; j[idx] = v as number; setJoints(j); }}
                    sx={{ '& .MuiSlider-thumb': { backgroundColor: '#4A7C59' }, '& .MuiSlider-track': { backgroundColor: '#4A7C59' } }} />
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
      <Button variant="contained" startIcon={<StartIcon />} disabled={chickenPresent || hw.isLoading}
        onClick={() => applyJoints(joints)}
        sx={{ mb: 4, bgcolor: '#4A7C59', '&:hover': { bgcolor: '#5a8c69' } }}>
        Apply Joints {chickenPresent && '(blocked — chicken present)'}
      </Button>

      {/* Gantry controls */}
      <Typography variant="h6" sx={{ color: '#C8B882', mb: 2 }}>Gantry (GRBL) — X/Y mm</Typography>
      <Paper sx={{ p: 2, mb: 3, bgcolor: '#1A3D2B' }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={6} sm={3}>
            <TextField label="X (mm)" type="number" size="small" value={gantry.x}
              onChange={(e) => setGantry({ ...gantry, x: Number(e.target.value) })} fullWidth />
          </Grid>
          <Grid item xs={6} sm={3}>
            <TextField label="Y (mm)" type="number" size="small" value={gantry.y}
              onChange={(e) => setGantry({ ...gantry, y: Number(e.target.value) })} fullWidth />
          </Grid>
          <Grid item xs={12} sm={6}>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              <Button size="small" variant="contained" onClick={() => hw.moveGantry(gantry.x, gantry.y, feedRate / 100)}
                sx={{ bgcolor: '#4A7C59' }}>Move</Button>
              <Button size="small" startIcon={<HomeIcon />} onClick={() => hw.gantryHome()} sx={{ color: '#C8B882' }}>Home</Button>
              <Button size="small" onClick={() => hw.gantryHold()} sx={{ color: '#E8A020' }}>Hold</Button>
              <Button size="small" onClick={() => hw.gantryResume()} sx={{ color: '#4A7C59' }}>Resume</Button>
              <Button size="small" onClick={() => hw.gantryUnlock()} sx={{ color: '#8A7D55' }}>Unlock</Button>
            </Stack>
          </Grid>
        </Grid>
        <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
          <Button size="small" onClick={() => jogGantry(-5, 0)}>X−</Button>
          <Button size="small" onClick={() => jogGantry(5, 0)}>X+</Button>
          <Button size="small" onClick={() => jogGantry(0, 5)}>Y+</Button>
          <Button size="small" onClick={() => jogGantry(0, -5)}>Y−</Button>
          <Typography variant="caption" sx={{ color: '#8A7D55', alignSelf: 'center' }}>
            pos: {gantry.x.toFixed(1)}, {gantry.y.toFixed(1)} mm
          </Typography>
        </Stack>
      </Paper>

      {/* Feed rate */}
      <Typography variant="h6" sx={{ color: '#C8B882', mb: 1 }}>Feed Rate</Typography>
      <Paper sx={{ p: 2, mb: 3, bgcolor: '#1A3D2B' }}>
        <Slider value={feedRate} min={0} max={100} step={5} valueLabelDisplay="auto"
          onChange={(_, v) => setFeedRate(v as number)}
          sx={{ '& .MuiSlider-thumb': { backgroundColor: '#4A7C59' }, '& .MuiSlider-track': { backgroundColor: '#4A7C59' } }} />
      </Paper>

      {hw.error && <Alert severity="error" sx={{ mb: 2 }}>{hw.error}</Alert>}

      {/* E-STOP — dedicated endpoint */}
      <Button variant="contained" fullWidth startIcon={<StopIcon />} onClick={eStop}
        sx={{ bgcolor: '#CC3333', '&:hover': { bgcolor: '#dd4444' }, p: 2, fontWeight: 'bold' }}>
        EMERGENCY STOP
      </Button>
    </Box>
  );
}
