// WeedPatrolPage.tsx - automatic weed finding + laser treatment with a human in the loop.
//
// Usage: route /weed-patrol. Pick a garden bed from the property layout, run 1-10
// detection passes (now, or on a schedule from Schedules → "Weed pass"), watch
// detections appear as pins on the 3D map, and approve each weed (aim dot or laser
// burn) or reject it. The robot never treats a weed on its own.
//
// Live: express-api → MQTT tc/{id}/cmd/weed → firmware/jetson-nano/weed_patrol_service.py.
// Demo (no API configured): an in-browser simulated robot (lib/yard/weedSim.ts).
// Student mode (default on the robot) only ever points the aiming dot.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import FormControlLabel from '@mui/material/FormControlLabel';
import LinearProgress from '@mui/material/LinearProgress';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Snackbar from '@mui/material/Snackbar';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import GrassIcon from '@mui/icons-material/Grass';
import Viewport3D from '../components/viewport/Viewport3D';
import YardAttentionPanel from '../components/yard/YardAttentionPanel';
import WeedBedMap2D from '../components/yard/WeedBedMap2D';
import { loadPropertyLayout, PROPERTY_LAYOUT_EVENT, type PropertyItem } from '../components/property/propertyLayoutStore';
import { useYardEvents } from '../hooks/useYardEvents';
import { fetchWeedState, sendEstop, startWeedPass } from '../lib/yard/yardApi';
import { setSimEstop, setSimRobotType, setSimSafety, simBed, startSimPass, clearSimHistory, WEED_ROBOT_TYPES, WEED_SIM_EVENT } from '../lib/yard/weedSim';
import { ROBOT_TASKS, WEED_BED_TYPES, YARD_LIVE, weedDeviceFor, type RobotTask, type WeedRobotState, type WeedRobotType } from '../lib/yard/yardTypes';

const C = {
  bg: '#0D2B1E',
  surface: '#1A3D2B',
  accent: '#4A7C59',
  gold: '#C8B882',
  goldMuted: '#8A7D55',
  danger: '#CC3333',
  warning: '#E8A020',
  white: '#F0EDE4',
};

const card = { bgcolor: C.surface, border: `1px solid ${C.accent}44`, borderRadius: 2, p: 2, color: C.white };

function useGardens(): PropertyItem[] {
  const [items, setItems] = useState<PropertyItem[]>(() => loadPropertyLayout().items);
  useEffect(() => {
    const onChange = () => setItems(loadPropertyLayout().items);
    window.addEventListener(PROPERTY_LAYOUT_EVENT, onChange);
    return () => window.removeEventListener(PROPERTY_LAYOUT_EVENT, onChange);
  }, []);
  return useMemo(() => items.filter((i) => i.kind === 'hardware' && WEED_BED_TYPES.has(i.type)), [items]);
}

/** Robot state: live from GET state/weed, demo from the simulator. */
function useWeedRobot(item: PropertyItem | undefined): WeedRobotState | null {
  const [state, setState] = useState<WeedRobotState | null>(null);
  useEffect(() => {
    if (!item) { setState(null); return; }
    const deviceId = weedDeviceFor(item);
    if (!YARD_LIVE) {
      const read = () => setState({ ...simBed(item, deviceId).robot });
      read();
      window.addEventListener(WEED_SIM_EVENT, read);
      return () => window.removeEventListener(WEED_SIM_EVENT, read);
    }
    let alive = true;
    const poll = async () => { const s = await fetchWeedState(deviceId).catch(() => null); if (alive) setState(s); };
    void poll();
    const t = setInterval(() => void poll(), 2000);
    return () => { alive = false; clearInterval(t); };
  }, [item]);
  return state;
}

function SafetyChip({ ok, label }: { ok: boolean; label: string }) {
  const color = ok ? C.accent : C.warning;
  return <Chip size="small" label={label} sx={{ bgcolor: `${color}22`, color: ok ? C.white : C.warning, border: `1px solid ${color}` }} />;
}

export default function WeedPatrolPage() {
  const navigate = useNavigate();
  const gardens = useGardens();
  const [itemId, setItemId] = useState<string>('');
  const item = gardens.find((g) => g.id === itemId) ?? gardens[0];
  const deviceId = item ? weedDeviceFor(item) : '';
  const robot = useWeedRobot(item);
  const bedItems = useMemo(() => (item ? [item] : []), [item]);
  const { flags, act, presence, error } = useYardEvents(bedItems);
  const [passes, setPasses] = useState(1);
  const [task, setTask] = useState<RobotTask>('weed');
  const [confirmPass, setConfirmPass] = useState(false);
  const [snack, setSnack] = useState<{ msg: string; error?: boolean } | null>(null);
  const [mapView, setMapView] = useState<'2d' | '3d'>('2d');
  const seenDetections = useRef<Set<string> | null>(null);

  const weeds = flags.filter((f) => f.type === 'weed_detected');
  const pending = weeds.filter((w) => w.status === 'pending_review');
  // Plant-health and snake / predator sightings from this bed's robot (alerts, never lasered).
  const sightings = flags.filter((f) => f.type === 'alert' && f.bedMm && f.status === 'active');
  const treated = weeds.filter((w) => w.status === 'treated').length;
  const rejected = weeds.filter((w) => w.status === 'rejected').length;
  const online = YARD_LIVE ? presence[deviceId]?.online ?? false : true;

  useEffect(() => {
    const currentIds = new Set(pending.map((detection) => detection.id));
    const previousIds = seenDetections.current;
    seenDetections.current = currentIds;
    if (!previousIds) return;
    const fresh = pending.find((detection) => !previousIds.has(detection.id));
    if (!fresh) return;
    const confidence = fresh.confidence == null ? '' : ` (${Math.round(fresh.confidence * 100)}% confidence)`;
    setSnack({ msg: `Detection alert: ${fresh.title}${confidence}` });
    window.dispatchEvent(new CustomEvent('tendercells-detection-alert', { detail: fresh }));
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('TenderCells detection', { body: `${fresh.title}${confidence}` });
    }
  }, [pending]);

  const report = (msg: string, isError = false) => setSnack({ msg, error: isError });
  const runPasses = useCallback(async () => {
    if (!item) return;
    try {
      if (YARD_LIVE) {
        const res = await startWeedPass(deviceId, passes, task);
        report(res.acked ? `Robot started ${passes} pass(es)` : res.message ?? 'Sent');
      } else {
        startSimPass(item.id, passes, task);
        report(`Simulated robot started ${passes} pass(es)`);
      }
    } catch (err) {
      report(err instanceof Error ? err.message : String(err), true);
    }
  }, [item, deviceId, passes, task]);

  const estop = async () => {
    if (!item) return;
    try {
      if (YARD_LIVE) await sendEstop(deviceId); else setSimEstop(item.id, true);
      report('E-STOP sent');
    } catch (err) {
      report(err instanceof Error ? err.message : String(err), true);
    }
  };

  const progress = robot?.pass;
  const pct = progress && progress.waypoints
    ? (((progress.pass - 1) * progress.waypoints + progress.waypoint) / (progress.passes * progress.waypoints)) * 100 : 0;

  return (
    <Box sx={{ bgcolor: C.bg, minHeight: '100dvh', p: { xs: 2, sm: 3 } }}>
      <Stack spacing={2.5} sx={{ maxWidth: 1200, mx: 'auto' }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <GrassIcon sx={{ color: C.accent, fontSize: 30 }} />
          <Box sx={{ flex: 1 }}>
            <Typography variant="h5" sx={{ color: C.gold, fontWeight: 700 }}>Weed Patrol</Typography>
            <Typography sx={{ color: C.goldMuted, fontSize: 13 }}>
              Camera passes find weeds; you approve every treatment. {YARD_LIVE ? 'Live robot via the hardware API.' : 'Demo - simulated robot in your browser.'}
            </Typography>
          </Box>
          <Chip size="small" label={YARD_LIVE ? (online ? 'Robot online' : 'Robot offline') : 'Simulation'}
            sx={{ bgcolor: online ? `${C.accent}33` : `${C.danger}33`, color: C.white, border: `1px solid ${online ? C.accent : C.danger}` }} />
        </Stack>

        {!item ? (
          <Paper elevation={0} sx={card}>
            <Typography sx={{ mb: 1 }}>No garden bed on your property yet.</Typography>
            <Button variant="contained" sx={{ bgcolor: C.accent }} onClick={() => navigate('/layout')}>Add a garden in Property Layout</Button>
          </Paper>
        ) : (
          <>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="stretch">
              <Paper elevation={0} sx={{ ...card, flex: 1 }}>
                <Typography variant="subtitle2" sx={{ color: C.gold, mb: 1.5 }}>Run passes</Typography>
                <Stack spacing={1.5}>
                  <TextField select size="small" label="Garden bed" value={item.id} onChange={(e) => setItemId(e.target.value)}
                    sx={{ '& .MuiInputBase-root': { color: C.white }, '& label': { color: C.goldMuted } }}>
                    {gardens.map((g) => <MenuItem key={g.id} value={g.id}>{g.name} ({g.width}×{g.depth} ft)</MenuItem>)}
                  </TextField>
                  <Typography variant="caption" sx={{ color: C.goldMuted }}>Device: {deviceId}</Typography>
                  {!YARD_LIVE && robot && (
                    <TextField select size="small" label="Robot build (demo)" value={robot.robotType ?? 'genesis-laser'}
                      data-testid="robot-build"
                      onChange={(e) => setSimRobotType(item.id, e.target.value as WeedRobotType)}
                      helperText={WEED_ROBOT_TYPES[robot.robotType ?? 'genesis-laser'].note}
                      sx={{ '& .MuiInputBase-root': { color: C.white }, '& label': { color: C.goldMuted }, '& .MuiFormHelperText-root': { color: C.goldMuted } }}>
                      {(Object.keys(WEED_ROBOT_TYPES) as WeedRobotType[]).map((k) => (
                        <MenuItem key={k} value={k}>
                          {WEED_ROBOT_TYPES[k].label} · Class {WEED_ROBOT_TYPES[k].laser.laserClass} · {WEED_ROBOT_TYPES[k].laser.powerW} W
                        </MenuItem>
                      ))}
                    </TextField>
                  )}
                  <TextField select size="small" label="Task" value={task} onChange={(e) => setTask(e.target.value as RobotTask)}
                    data-testid="robot-task" helperText={ROBOT_TASKS[task].help}
                    sx={{ '& .MuiInputBase-root': { color: C.white }, '& label': { color: C.goldMuted }, '& .MuiFormHelperText-root': { color: C.goldMuted } }}>
                    {(Object.keys(ROBOT_TASKS) as RobotTask[]).map((k) => <MenuItem key={k} value={k}>{ROBOT_TASKS[k].label}</MenuItem>)}
                  </TextField>
                  <TextField size="small" type="number" label="Passes (1-10)" value={passes}
                    onChange={(e) => setPasses(Math.min(10, Math.max(1, Math.round(Number(e.target.value) || 1))))}
                    inputProps={{ min: 1, max: 10 }}
                    sx={{ '& input': { color: C.white }, '& label': { color: C.goldMuted } }} />
                  <Stack direction="row" spacing={1}>
                    <Button variant="contained" disabled={!!progress?.running || !!robot?.estop} onClick={() => setConfirmPass(true)}
                      sx={{ bgcolor: C.accent, flex: 1 }}>Start pass</Button>
                    <Button variant="outlined" onClick={() => navigate('/schedules')} sx={{ color: C.gold, borderColor: C.accent }}>
                      Schedule
                    </Button>
                  </Stack>
                  <Button size="small" onClick={() => navigate('/library#weed')} sx={{ alignSelf: 'flex-start', color: C.gold, p: 0 }}>
                    Weed guide: pigweed, purslane, nutsedge…
                  </Button>
                  <Typography variant="caption" sx={{ color: C.goldMuted }}>
                    For passes at set times (e.g. dawn and dusk), add a <strong>Weed pass</strong> schedule for {deviceId}.
                  </Typography>
                  {progress?.running && (
                    <Box>
                      <Typography variant="caption">Pass {progress.pass}/{progress.passes} · frame {progress.waypoint}/{progress.waypoints}</Typography>
                      <LinearProgress variant="determinate" value={pct} sx={{ mt: 0.5, bgcolor: C.bg, '& .MuiLinearProgress-bar': { bgcolor: C.gold } }} />
                    </Box>
                  )}
                  {robot?.error && <Typography variant="caption" sx={{ color: C.warning }}>{robot.error}</Typography>}
                  {error && <Typography variant="caption" sx={{ color: C.warning }}>API: {error}</Typography>}
                </Stack>
              </Paper>

              <Paper elevation={0} sx={{ ...card, flex: 1 }}>
                <Typography variant="subtitle2" sx={{ color: C.gold, mb: 1.5 }}>Laser safety</Typography>
                {robot ? (
                  <Stack spacing={1.25}>
                    <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap">
                      <SafetyChip ok={!robot.estop} label={robot.estop ? 'E-STOP latched' : 'E-STOP clear'} />
                      <SafetyChip ok={robot.laser.studentMode} label={robot.laser.studentMode ? 'Student mode (aim only)' : 'Burn mode'} />
                      <SafetyChip ok={!robot.laser.burnEnabled || robot.laser.enclosureClosed} label={robot.laser.enclosureClosed ? 'Enclosure closed' : 'Enclosure open'} />
                      <Chip size="small" label={`Pulse ≤ ${robot.laser.pulseMs} ms`} sx={{ color: C.white, border: `1px solid ${C.accent}` }} />
                      {robot.laser.laserClass && robot.laser.laserClass !== 'unknown' && (
                        <Chip size="small" label={`Class ${robot.laser.laserClass}${robot.laser.wavelengthNm ? ` · ${robot.laser.wavelengthNm} nm` : ''}${robot.laser.powerW ? ` · ${robot.laser.powerW} W` : ''}`}
                          sx={{ color: C.warning, border: `1px solid ${C.warning}` }} />
                      )}
                    </Stack>
                    <Typography variant="caption" sx={{ color: C.goldMuted }}>
                      The laser fires only when burn is enabled on the robot, student mode is off, the enclosure is closed, E-STOP is clear
                      and a person approves that exact weed. Class 3B and 4 lasers need wavelength-rated eye protection and supervision.
                    </Typography>
                    {!YARD_LIVE && (
                      <Box sx={{ bgcolor: C.bg, borderRadius: 1, p: 1 }}>
                        <Typography variant="caption" sx={{ color: C.goldMuted }}>
                          Simulated robot settings (on a real robot: STUDENT_MODE, LASER_BURN_ENABLED and the enclosure switch)
                        </Typography>
                        <Stack direction="row" useFlexGap flexWrap="wrap">
                          <FormControlLabel control={<Switch size="small" checked={robot.laser.studentMode}
                            onChange={(e) => setSimSafety(item.id, { studentMode: e.target.checked })} />} label="Student mode" />
                          <FormControlLabel control={<Switch size="small" checked={robot.laser.burnEnabled}
                            onChange={(e) => setSimSafety(item.id, { burnEnabled: e.target.checked })} />} label="Burn enabled" />
                          <FormControlLabel control={<Switch size="small" checked={robot.laser.enclosureClosed}
                            onChange={(e) => setSimSafety(item.id, { enclosureClosed: e.target.checked })} />} label="Enclosure closed" />
                        </Stack>
                      </Box>
                    )}
                    <Stack direction="row" spacing={1}>
                      <Button variant="contained" onClick={() => void estop()} sx={{ bgcolor: C.danger, fontWeight: 700, flex: 1 }}>E-STOP</Button>
                      {!YARD_LIVE && robot.estop && (
                        <Button variant="outlined" onClick={() => setSimEstop(item.id, false)} sx={{ color: C.gold, borderColor: C.accent }}>Clear</Button>
                      )}
                    </Stack>
                  </Stack>
                ) : (
                  <Typography variant="body2" sx={{ color: C.goldMuted }}>
                    No state from {deviceId} yet. Start <code>weed_patrol_service.py</code> on the robot (WEED_MODE=simulation works without hardware).
                  </Typography>
                )}
              </Paper>
            </Stack>

            <Stack direction={{ xs: 'column', lg: 'row' }} spacing={2}>
              <Box sx={{ flex: 2, minWidth: 0 }}>
                <Paper elevation={0} sx={{ ...card, p: { xs: 1, sm: 2 } }}>
                  <Tabs value={mapView} onChange={(_, value: '2d' | '3d') => setMapView(value)}
                    aria-label="Detection map view" sx={{ mb: 1, minHeight: 40, '& .MuiTab-root': { color: C.goldMuted, minHeight: 40 }, '& .Mui-selected': { color: `${C.gold} !important` } }}>
                    <Tab value="2d" label="2D bed" />
                    <Tab value="3d" label="3D property" />
                  </Tabs>
                  {mapView === '2d' ? (
                    <WeedBedMap2D name={item.name} widthFt={item.width} depthFt={item.depth} flags={weeds} />
                  ) : (
                    <Viewport3D product={item.type} focusItemId={item.id} initialWorkspaceMode="simulation"
                      showAttentionPanel={false} title={`${item.name} - weed map`} height={{ xs: 420, md: 520 }} />
                  )}
                </Paper>
              </Box>
              <Paper elevation={0} sx={{ ...card, flex: 1, minWidth: 280 }}>
                <Stack direction="row" alignItems="center" sx={{ mb: 1 }}>
                  <Typography variant="subtitle2" sx={{ color: C.gold, flex: 1 }}>Review queue ({pending.length + sightings.length})</Typography>
                  {!YARD_LIVE && (treated + rejected) > 0 && (
                    <Button size="small" onClick={() => clearSimHistory(item.id)} sx={{ color: C.goldMuted }}>Clear history</Button>
                  )}
                </Stack>
                <Typography variant="caption" sx={{ color: C.goldMuted, display: 'block', mb: 1 }}>
                  {treated} treated · {rejected} not weeds · amber pins on the map wait for you
                </Typography>
                {pending.length + sightings.length ? (
                  <YardAttentionPanel flags={[...pending, ...sightings]} act={act} maxRows={50} fill />
                ) : (
                  <Typography variant="body2" sx={{ color: C.goldMuted }}>No weeds waiting. Run a pass to scan the bed.</Typography>
                )}
              </Paper>
            </Stack>
          </>
        )}
      </Stack>

      <Dialog open={confirmPass} onClose={() => setConfirmPass(false)} PaperProps={{ sx: { bgcolor: C.surface, color: C.white } }}>
        <DialogTitle sx={{ color: C.gold }}>Start {passes} × {ROBOT_TASKS[task].label.toLowerCase()}?</DialogTitle>
        <DialogContent>
          <Typography>The robot will move over the whole bed with the camera. It only detects - nothing is treated without your approval, and the laser is never used on animals. Keep hands and animals clear.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmPass(false)} sx={{ color: C.goldMuted }}>Cancel</Button>
          <Button variant="contained" sx={{ bgcolor: C.accent }} onClick={() => { setConfirmPass(false); void runPasses(); }}>Start</Button>
        </DialogActions>
      </Dialog>
      <Snackbar open={!!snack} autoHideDuration={4000} onClose={() => setSnack(null)} message={snack?.msg}
        ContentProps={{ sx: { bgcolor: snack?.error ? C.danger : C.accent, color: C.white } }} />
    </Box>
  );
}
