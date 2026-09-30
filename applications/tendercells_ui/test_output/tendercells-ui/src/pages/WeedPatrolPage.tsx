// WeedPatrolPage.tsx - automatic weed finding + treatment with a human in the loop.
//
// Usage: route /weed-patrol (?robot=<layout item id> from alerts). Pick a robot:
//   - a garden bed robot (FarmBot-style gantry / arm): passes over the bed, pins in bed mm;
//   - a rover (Weed Rover, Roaming Roost, custom mobile robot): drives the whole property
//     (or its drawn route) with its camera, pins each weed where it grows (property feet)
//     on the 2D and 3D maps and alerts you (DetectionAlerts, app-wide).
// Run 1-10 passes (now, or on a schedule from Schedules → "Weed pass") and decide each weed:
// aim / burn / not a weed on laser robots, "Pulled it" / not a weed on camera-only scouts.
// The robot never treats a weed on its own; lasers never fire inside exclusion zones.
//
// Live: express-api → MQTT tc/{id}/cmd/weed → firmware/jetson-nano/weed_patrol_service.py
// (bed or rover). Demo (no API configured): lib/yard/weedSim.ts / roverSim.ts.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import FormControlLabel from '@mui/material/FormControlLabel';
import LinearProgress from '@mui/material/LinearProgress';
import ListSubheader from '@mui/material/ListSubheader';
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
import WeedPropertyMap2D from '../components/yard/WeedPropertyMap2D';
import { loadPropertyLayout, PROPERTY_LAYOUT_EVENT, type PropertyLayoutState } from '../components/property/propertyLayoutStore';
import { deviceForItem, useYardEvents } from '../hooks/useYardEvents';
import { fetchWeedState, sendEstop, startWeedPass } from '../lib/yard/yardApi';
import { waterPoints } from '../lib/yard/roverFindings';
import { BED_ROBOT_TYPES, setSimEstop, setSimRobotType, setSimSafety, simBed, startSimPass, clearSimHistory, WEED_ROBOT_TYPES, WEED_SIM_EVENT } from '../lib/yard/weedSim';
import { clearRoverHistory, ROVER_SIM_EVENT, setRoverBuild, setRoverEstop, setRoverSafety, simRover, startRoverPass, type RoverBuild } from '../lib/yard/roverSim';
import { LASER_ROVER_TYPES, ROBOT_TASKS, WEED_BED_TYPES, WEED_ROVER_TYPES, YARD_LIVE, type RobotTask, type WeedRobotState, type WeedRobotType } from '../lib/yard/yardTypes';

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
const field = { '& .MuiInputBase-root': { color: C.white }, '& label': { color: C.goldMuted }, '& .MuiFormHelperText-root': { color: C.goldMuted } };

function useLayout(): PropertyLayoutState {
  const [layout, setLayout] = useState<PropertyLayoutState>(loadPropertyLayout);
  useEffect(() => {
    const onChange = () => setLayout(loadPropertyLayout());
    window.addEventListener(PROPERTY_LAYOUT_EVENT, onChange);
    return () => window.removeEventListener(PROPERTY_LAYOUT_EVENT, onChange);
  }, []);
  return layout;
}

/** Robot state: live from GET state/weed, demo from the bed / rover simulators. */
function useWeedRobot(itemId: string | undefined, layout: PropertyLayoutState): WeedRobotState | null {
  const [state, setState] = useState<WeedRobotState | null>(null);
  useEffect(() => {
    const item = layout.items.find((i) => i.id === itemId);
    if (!item) { setState(null); return; }
    const deviceId = deviceForItem(item) ?? item.id;
    const rover = WEED_ROVER_TYPES.has(item.type);
    if (!YARD_LIVE) {
      const read = () => setState({ ...(rover ? simRover(item, deviceId, layout) : simBed(item, deviceId)).robot });
      read();
      const ev = rover ? ROVER_SIM_EVENT : WEED_SIM_EVENT;
      window.addEventListener(ev, read);
      return () => window.removeEventListener(ev, read);
    }
    let alive = true;
    const poll = async () => { const s = await fetchWeedState(deviceId).catch(() => null); if (alive) setState(s); };
    void poll();
    const t = setInterval(() => void poll(), 2000);
    return () => { alive = false; clearInterval(t); };
  }, [itemId, layout]);
  return state;
}

function SafetyChip({ ok, label }: { ok: boolean; label: string }) {
  const color = ok ? C.accent : C.warning;
  return <Chip size="small" label={label} sx={{ bgcolor: `${color}22`, color: ok ? C.white : C.warning, border: `1px solid ${color}` }} />;
}

export default function WeedPatrolPage() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const layout = useLayout();
  const gardens = useMemo(() => layout.items.filter((i) => i.kind === 'hardware' && WEED_BED_TYPES.has(i.type)), [layout]);
  const rovers = useMemo(() => layout.items.filter((i) => i.kind === 'hardware' && WEED_ROVER_TYPES.has(i.type)), [layout]);
  const robotsList = useMemo(() => [...gardens, ...rovers], [gardens, rovers]);
  const item = robotsList.find((g) => g.id === params.get('robot')) ?? robotsList[0];
  const isRover = !!item && WEED_ROVER_TYPES.has(item.type);
  const canLaser = !!item && (!isRover || LASER_ROVER_TYPES.has(item.type));
  const deviceId = item ? deviceForItem(item) ?? item.id : '';
  const robot = useWeedRobot(item?.id, layout);
  const scout = isRover && robot?.robotType !== 'rover-laser';
  const bedItems = useMemo(() => (item ? [item] : []), [item]);
  const { flags, act, presence, error } = useYardEvents(bedItems);
  const [passes, setPasses] = useState(1);
  const [task, setTask] = useState<RobotTask>('weed');
  const [confirmPass, setConfirmPass] = useState(false);
  const [snack, setSnack] = useState<{ msg: string; error?: boolean } | null>(null);
  const [mapView, setMapView] = useState<'2d' | '3d'>('2d');
  const [notify, setNotify] = useState<string>(() => ('Notification' in window ? Notification.permission : 'denied'));
  const seenDetections = useRef<Set<string> | null>(null);

  const weeds = flags.filter((f) => f.type === 'weed_detected');
  const pending = weeds.filter((w) => w.status === 'pending_review');
  // Plant-health and snake / predator sightings from this robot (alerts, never lasered).
  const sightings = flags.filter((f) => f.type === 'alert' && (f.bedMm || f.propFt) && f.status === 'active');
  const treated = weeds.filter((w) => w.status === 'treated').length;
  const rejected = weeds.filter((w) => w.status === 'rejected').length;
  const online = YARD_LIVE ? presence[deviceId]?.online ?? false : true;

  // New detection while on this page: the app-wide alert stays quiet here, so say it here.
  useEffect(() => {
    const currentIds = new Set(pending.map((d) => d.id));
    const previousIds = seenDetections.current;
    seenDetections.current = currentIds;
    if (!previousIds) return;
    const fresh = pending.find((d) => !previousIds.has(d.id));
    if (!fresh) return;
    const confidence = fresh.confidence == null ? '' : ` (${Math.round(fresh.confidence * 100)}% confidence)`;
    setSnack({ msg: `Detection alert: ${fresh.title}${confidence}` });
  }, [pending]);

  const report = (msg: string, isError = false) => setSnack({ msg, error: isError });
  const selectRobot = (id: string) => {
    seenDetections.current = null;
    setParams((p) => { p.set('robot', id); return p; }, { replace: true });
  };

  const runPasses = useCallback(async () => {
    if (!item) return;
    try {
      if (YARD_LIVE) {
        // Rovers: what to cover, plus the water points to check for leaks on the way.
        const coverage = isRover
          ? {
            ...(item.patrolPath && item.patrolPath.length > 1
              ? { route: item.patrolPath }
              : { area: { x: 0, y: 0, width: layout.property.widthFt, depth: layout.property.depthFt } }),
            waterPoints: waterPoints(layout.items).map(({ id, name, x, y, radiusFt }) => ({ id, name, x, y, radiusFt })),
          }
          : undefined;
        const res = await startWeedPass(deviceId, passes, task, coverage);
        setSnack({ msg: res.acked ? `Robot started ${passes} pass(es)` : res.message ?? 'Sent' });
      } else if (isRover) {
        startRoverPass(item, layout, passes, task);
        setSnack({ msg: `Simulated rover started ${passes} pass(es) over ${item.patrolPath && item.patrolPath.length > 1 ? 'its route' : 'the property'}` });
      } else {
        startSimPass(item.id, passes, task);
        setSnack({ msg: `Simulated robot started ${passes} pass(es)` });
      }
    } catch (err) {
      setSnack({ msg: err instanceof Error ? err.message : String(err), error: true });
    }
  }, [item, isRover, layout, deviceId, passes, task]);

  const estop = async () => {
    if (!item) return;
    try {
      if (YARD_LIVE) await sendEstop(deviceId); else if (isRover) setRoverEstop(item.id, true); else setSimEstop(item.id, true);
      report('E-STOP sent');
    } catch (err) {
      report(err instanceof Error ? err.message : String(err), true);
    }
  };
  const setSafety = (patch: Partial<{ studentMode: boolean; burnEnabled: boolean; enclosureClosed: boolean }>) => {
    if (!item) return;
    if (isRover) setRoverSafety(item.id, patch); else setSimSafety(item.id, patch);
  };

  const progress = robot?.pass;
  const pct = progress && progress.waypoints
    ? (((progress.pass - 1) * progress.waypoints + progress.waypoint) / (progress.passes * progress.waypoints)) * 100 : 0;
  const roverMarkers = isRover && item && robot?.pose
    ? [{ itemId: item.id, name: item.name, xFt: robot.pose.xFt, yFt: robot.pose.yFt, headingDeg: robot.pose.headingDeg, running: !!robot.pass?.running }]
    : [];

  return (
    <Box sx={{ bgcolor: C.bg, minHeight: '100dvh', p: { xs: 2, sm: 3 } }}>
      <Stack spacing={2.5} sx={{ maxWidth: 1200, mx: 'auto' }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <GrassIcon sx={{ color: C.accent, fontSize: 30 }} />
          <Box sx={{ flex: 1 }}>
            <Typography variant="h5" sx={{ color: C.gold, fontWeight: 700 }}>Weed Patrol</Typography>
            <Typography sx={{ color: C.goldMuted, fontSize: 13 }}>
              Camera passes find weeds - in a garden bed or across the whole property on a rover. You decide every one.
              {YARD_LIVE ? ' Live robot via the hardware API.' : ' Demo - simulated robot in your browser.'}
            </Typography>
          </Box>
          {notify !== 'granted' && 'Notification' in window && (
            <Button size="small" variant="outlined" onClick={() => void Notification.requestPermission().then(setNotify)}
              sx={{ color: C.gold, borderColor: C.accent }}>Enable alerts</Button>
          )}
          <Chip size="small" label={YARD_LIVE ? (online ? 'Robot online' : 'Robot offline') : 'Simulation'}
            sx={{ bgcolor: online ? `${C.accent}33` : `${C.danger}33`, color: C.white, border: `1px solid ${online ? C.accent : C.danger}` }} />
        </Stack>

        {!item ? (
          <Paper elevation={0} sx={card}>
            <Typography sx={{ mb: 1 }}>No weed robot on your property yet - add a garden bed robot or a Weed Rover (any mobile robot with a camera works too).</Typography>
            <Button variant="contained" sx={{ bgcolor: C.accent }} onClick={() => navigate('/layout')}>Open Property Layout</Button>
          </Paper>
        ) : (
          <>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="stretch">
              <Paper elevation={0} sx={{ ...card, flex: 1 }}>
                <Typography variant="subtitle2" sx={{ color: C.gold, mb: 1.5 }}>Run passes</Typography>
                <Stack spacing={1.5}>
                  <TextField select size="small" label="Robot" value={item.id} onChange={(e) => selectRobot(e.target.value)} sx={field}
                    data-testid="weed-robot-select">
                    {gardens.length > 0 && <ListSubheader>Garden beds</ListSubheader>}
                    {gardens.map((g) => <MenuItem key={g.id} value={g.id}>{g.name} ({g.width}×{g.depth} ft bed)</MenuItem>)}
                    {rovers.length > 0 && <ListSubheader>Rovers - whole property</ListSubheader>}
                    {rovers.map((g) => <MenuItem key={g.id} value={g.id}>{g.name} (rover)</MenuItem>)}
                  </TextField>
                  <Typography variant="caption" sx={{ color: C.goldMuted }}>
                    Device: {deviceId}{isRover ? ` · covers ${item.patrolPath && item.patrolPath.length > 1 ? 'its drawn route' : `the whole property (${layout.property.widthFt}×${layout.property.depthFt} ft)`}, skipping exclusion zones` : ''}
                  </Typography>
                  {!YARD_LIVE && robot && !isRover && (
                    <TextField select size="small" label="Robot build (demo)" value={robot.robotType ?? 'genesis-laser'}
                      data-testid="robot-build"
                      onChange={(e) => setSimRobotType(item.id, e.target.value as WeedRobotType)}
                      helperText={WEED_ROBOT_TYPES[robot.robotType ?? 'genesis-laser'].note} sx={field}>
                      {BED_ROBOT_TYPES.map((k) => (
                        <MenuItem key={k} value={k}>
                          {WEED_ROBOT_TYPES[k].label} · Class {WEED_ROBOT_TYPES[k].laser.laserClass} · {WEED_ROBOT_TYPES[k].laser.powerW} W
                        </MenuItem>
                      ))}
                    </TextField>
                  )}
                  {!YARD_LIVE && robot && isRover && (
                    <TextField select size="small" label="Rover build (demo)" value={robot.robotType ?? 'rover-scout'} data-testid="rover-build"
                      onChange={(e) => setRoverBuild(item.id, e.target.value as RoverBuild)} sx={field}
                      helperText={canLaser ? WEED_ROBOT_TYPES[(robot.robotType ?? 'rover-scout') as RoverBuild].note : 'This robot houses animals or is a custom build - camera only, never a laser'}>
                      <MenuItem value="rover-scout">Camera scout - finds and maps weeds for you to pull</MenuItem>
                      <MenuItem value="rover-laser" disabled={!canLaser}>Laser rover · Class 4 · 4 W (Weed Rover only)</MenuItem>
                    </TextField>
                  )}
                  <TextField select size="small" label="Task" value={task} onChange={(e) => setTask(e.target.value as RobotTask)}
                    data-testid="robot-task" helperText={ROBOT_TASKS[task].help} sx={field}>
                    {(Object.keys(ROBOT_TASKS) as RobotTask[]).map((k) => <MenuItem key={k} value={k}>{ROBOT_TASKS[k].label}</MenuItem>)}
                  </TextField>
                  <TextField size="small" type="number" label="Passes (1-10)" value={passes}
                    onChange={(e) => setPasses(Math.min(10, Math.max(1, Math.round(Number(e.target.value) || 1))))}
                    inputProps={{ min: 1, max: 10 }} sx={{ '& input': { color: C.white }, '& label': { color: C.goldMuted } }} />
                  <Stack direction="row" spacing={1}>
                    <Button variant="contained" disabled={!!progress?.running || !!robot?.estop} onClick={() => setConfirmPass(true)}
                      sx={{ bgcolor: C.accent, flex: 1 }} data-testid="start-pass">Start pass</Button>
                    <Button variant="outlined" onClick={() => navigate('/schedules')} sx={{ color: C.gold, borderColor: C.accent }}>Schedule</Button>
                  </Stack>
                  <Button size="small" onClick={() => navigate('/library#weed')} sx={{ alignSelf: 'flex-start', color: C.gold, p: 0 }}>
                    Weed guide: pigweed, purslane, nutsedge…
                  </Button>
                  {isRover && (
                    <Typography variant="caption" sx={{ color: C.goldMuted }}>
                      Draw a route for this robot in Property Layout (Draw Path) to patrol only part of the yard. It never drives into no-go or keep-out zones (Robot zones).
                    </Typography>
                  )}
                  {progress?.running && (
                    <Box>
                      <Typography variant="caption">
                        Pass {progress.pass}/{progress.passes} · {isRover ? 'stop' : 'frame'} {progress.waypoint}/{progress.waypoints}
                        {robot?.pose ? ` · at ${Math.round(robot.pose.xFt)}, ${Math.round(robot.pose.yFt)} ft` : ''}
                      </Typography>
                      <LinearProgress variant="determinate" value={pct} sx={{ mt: 0.5, bgcolor: C.bg, '& .MuiLinearProgress-bar': { bgcolor: C.gold } }} />
                    </Box>
                  )}
                  {robot?.error && <Typography variant="caption" sx={{ color: C.warning }}>{robot.error}</Typography>}
                  {error && <Typography variant="caption" sx={{ color: C.warning }}>API: {error}</Typography>}
                </Stack>
              </Paper>

              <Paper elevation={0} sx={{ ...card, flex: 1 }}>
                <Typography variant="subtitle2" sx={{ color: C.gold, mb: 1.5 }}>{scout ? 'Safety' : 'Laser safety'}</Typography>
                {robot ? (
                  <Stack spacing={1.25}>
                    <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap">
                      <SafetyChip ok={!robot.estop} label={robot.estop ? 'E-STOP latched' : 'E-STOP clear'} />
                      {scout ? <SafetyChip ok label="Camera only - never fires" /> : (
                        <>
                          <SafetyChip ok={robot.laser.studentMode} label={robot.laser.studentMode ? 'Student mode (aim only)' : 'Burn mode'} />
                          <SafetyChip ok={!robot.laser.burnEnabled || robot.laser.enclosureClosed} label={robot.laser.enclosureClosed ? (isRover ? 'Shroud closed' : 'Enclosure closed') : (isRover ? 'Shroud open' : 'Enclosure open')} />
                          <Chip size="small" label={`Pulse ≤ ${robot.laser.pulseMs} ms`} sx={{ color: C.white, border: `1px solid ${C.accent}` }} />
                          {robot.laser.laserClass && !['unknown', 'none'].includes(robot.laser.laserClass) && (
                            <Chip size="small" label={`Class ${robot.laser.laserClass}${robot.laser.wavelengthNm ? ` · ${robot.laser.wavelengthNm} nm` : ''}${robot.laser.powerW ? ` · ${robot.laser.powerW} W` : ''}`}
                              sx={{ color: C.warning, border: `1px solid ${C.warning}` }} />
                          )}
                        </>
                      )}
                    </Stack>
                    <Typography variant="caption" sx={{ color: C.goldMuted }}>
                      {scout
                        ? 'This rover only looks: each weed is pinned on the map with its location and you are alerted. Pull it by hand and press "Pulled it" - or send a laser robot.'
                        : 'The laser fires only when burn is enabled on the robot, student mode is off, the enclosure is closed, E-STOP is clear and a person approves that exact weed. It never fires inside an exclusion zone (including the no-laser buffer around animals). Class 3B and 4 lasers need wavelength-rated eye protection and supervision.'}
                    </Typography>
                    {!YARD_LIVE && !scout && (
                      <Box sx={{ bgcolor: C.bg, borderRadius: 1, p: 1 }}>
                        <Typography variant="caption" sx={{ color: C.goldMuted }}>
                          Simulated robot settings (on a real robot: STUDENT_MODE, LASER_BURN_ENABLED and the enclosure switch)
                        </Typography>
                        <Stack direction="row" useFlexGap flexWrap="wrap">
                          <FormControlLabel control={<Switch size="small" checked={robot.laser.studentMode} onChange={(e) => setSafety({ studentMode: e.target.checked })} />} label="Student mode" />
                          <FormControlLabel control={<Switch size="small" checked={robot.laser.burnEnabled} onChange={(e) => setSafety({ burnEnabled: e.target.checked })} />} label="Burn enabled" />
                          <FormControlLabel control={<Switch size="small" checked={robot.laser.enclosureClosed} onChange={(e) => setSafety({ enclosureClosed: e.target.checked })} />} label={isRover ? 'Shroud closed' : 'Enclosure closed'} />
                        </Stack>
                      </Box>
                    )}
                    <Stack direction="row" spacing={1}>
                      <Button variant="contained" onClick={() => void estop()} sx={{ bgcolor: C.danger, fontWeight: 700, flex: 1 }}>E-STOP</Button>
                      {!YARD_LIVE && robot.estop && (
                        <Button variant="outlined" onClick={() => (isRover ? setRoverEstop(item.id, false) : setSimEstop(item.id, false))} sx={{ color: C.gold, borderColor: C.accent }}>Clear</Button>
                      )}
                    </Stack>
                  </Stack>
                ) : (
                  <Typography variant="body2" sx={{ color: C.goldMuted }}>
                    No state from {deviceId} yet. Start <code>weed_patrol_service.py</code> on the robot{isRover ? ' with WEED_ROBOT=rover-scout' : ''} (WEED_MODE=simulation works without hardware).
                  </Typography>
                )}
              </Paper>
            </Stack>

            <Stack direction={{ xs: 'column', lg: 'row' }} spacing={2}>
              <Box sx={{ flex: 2, minWidth: 0 }}>
                <Paper elevation={0} sx={{ ...card, p: { xs: 1, sm: 2 } }}>
                  <Tabs value={mapView} onChange={(_, value: '2d' | '3d') => setMapView(value)}
                    aria-label="Detection map view" sx={{ mb: 1, minHeight: 40, '& .MuiTab-root': { color: C.goldMuted, minHeight: 40 }, '& .Mui-selected': { color: `${C.gold} !important` } }}>
                    <Tab value="2d" label={isRover ? '2D property' : '2D bed'} />
                    <Tab value="3d" label="3D property" />
                  </Tabs>
                  {mapView === '2d' ? (
                    isRover
                      ? <WeedPropertyMap2D layout={layout} flags={flags} rovers={roverMarkers} />
                      : <WeedBedMap2D name={item.name} widthFt={item.width} depthFt={item.depth} flags={weeds} />
                  ) : (
                    <Viewport3D product={item.type} focusItemId={isRover ? undefined : item.id} initialWorkspaceMode="simulation"
                      showAttentionPanel={false} title={`${item.name} - weed map`} height={{ xs: 420, md: 520 }} />
                  )}
                </Paper>
              </Box>
              <Paper elevation={0} sx={{ ...card, flex: 1, minWidth: 280 }}>
                <Stack direction="row" alignItems="center" sx={{ mb: 1 }}>
                  <Typography variant="subtitle2" sx={{ color: C.gold, flex: 1 }}>Review queue ({pending.length + sightings.length})</Typography>
                  {!YARD_LIVE && (treated + rejected) > 0 && (
                    <Button size="small" onClick={() => (isRover ? clearRoverHistory(item.id) : clearSimHistory(item.id))} sx={{ color: C.goldMuted }}>Clear history</Button>
                  )}
                </Stack>
                <Typography variant="caption" sx={{ color: C.goldMuted, display: 'block', mb: 1 }}>
                  {treated} {scout ? 'pulled / treated' : 'treated'} · {rejected} not weeds · amber pins on the map wait for you
                </Typography>
                {pending.length + sightings.length ? (
                  <YardAttentionPanel flags={[...pending, ...sightings]} act={act} maxRows={50} fill />
                ) : (
                  <Typography variant="body2" sx={{ color: C.goldMuted }}>No weeds waiting. Run a pass to scan {isRover ? 'the property' : 'the bed'}.</Typography>
                )}
              </Paper>
            </Stack>
          </>
        )}
      </Stack>

      <Dialog open={confirmPass} onClose={() => setConfirmPass(false)} PaperProps={{ sx: { bgcolor: C.surface, color: C.white } }}>
        <DialogTitle sx={{ color: C.gold }}>Start {passes} × {ROBOT_TASKS[task].label.toLowerCase()}?</DialogTitle>
        <DialogContent>
          <Typography>
            {isRover
              ? 'The rover will drive across the property with its camera, avoiding exclusion zones. It only detects - nothing is treated without your approval. Keep children and pets clear of its path.'
              : 'The robot will move over the whole bed with the camera. It only detects - nothing is treated without your approval, and the laser is never used on animals. Keep hands and animals clear.'}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmPass(false)} sx={{ color: C.goldMuted }}>Cancel</Button>
          <Button variant="contained" sx={{ bgcolor: C.accent }} onClick={() => { setConfirmPass(false); void runPasses(); }} data-testid="confirm-pass">Start</Button>
        </DialogActions>
      </Dialog>
      <Snackbar open={!!snack} autoHideDuration={4000} onClose={() => setSnack(null)} message={snack?.msg}
        ContentProps={{ sx: { bgcolor: snack?.error ? C.danger : C.accent, color: C.white } }} />
    </Box>
  );
}
