import { useCallback, useRef, useState } from 'react';
import { Box, Button, Stack, Typography } from '@mui/material';
import { Link } from 'react-router-dom';
import { ControlDeck } from '../control/components/ControlDeck';
import { RoverSimulator, type SimPose } from '../control/sim/RoverSimulator';
import type { ControlFrame, DeviceControlCapabilities } from '../control/types';
import { controlColors as C } from '../control/tokens';
const capabilities: DeviceControlCapabilities = { motion: true, kinematics: 'differential', estop: true, maxCommandHz: 20, allowedProfiles: ['freetouch'] };
export default function ControlDemoPage() {
  const rover = useRef(new RoverSimulator());
  const previous = useRef<number>();
  const [pose, setPose] = useState<SimPose>({ x: 0, y: 0, headingRad: 0 });
  const [moving, setMoving] = useState(false);
  const frame = useCallback((value: ControlFrame) => {
    const dt = previous.current === undefined ? 0 : (value.sentAtMs - previous.current) / 1000;
    previous.current = value.sentAtMs;
    setPose({ ...rover.current.step(value, dt) });
    setMoving(value.deadman && Object.values(value.axes).some(v => v !== 0));
  }, []);
  return <Box sx={{ p: { xs: 1, sm: 3 }, maxWidth: 1100, mx: 'auto' }}>
    <Stack spacing={2}>
      <Typography variant="h4" component="h1">Practice driving</Typography>
      <Typography>Try touch, keyboard or a gamepad with a simulated Roaming Roost. No physical device is connected.</Typography>
      <ControlDeck deviceId="sim-control-roost" capabilities={capabilities} onFrame={frame} onEmergencyStop={() => setMoving(false)} cameraSlot={
        <svg viewBox="0 0 600 360" width="100%" height="100%" role="img" aria-label="Simulated rover practice field" style={{ background: C.surface }}>
          <defs><pattern id="control-grid" width="30" height="30" patternUnits="userSpaceOnUse"><path d="M 30 0 L 0 0 0 30" fill="none" stroke={C.guide} strokeWidth="1" /></pattern></defs>
          <rect width="600" height="360" fill="url(#control-grid)" />
          <text x="16" y="26" fill={C.text}>SIMULATED FIELD - follows the rover</text>
          <g transform={`translate(300 180) rotate(${-pose.headingRad * 180 / Math.PI})`}><rect x="-22" y="-16" width="44" height="32" rx="8" fill={C.accent} /><path d="M 8 -9 L 22 0 L 8 9" fill="none" stroke={C.bg} strokeWidth="4" /></g>
          <circle cx={300 - pose.x * 30} cy={180 + pose.y * 30} r="6" fill={C.warning} />
          <text x="16" y="338" fill={C.text}>Gold marker: starting position</text>
        </svg>
      } />
      <Typography data-testid="control-motion">{moving ? 'Moving (simulated)' : 'Stopped (simulated)'}</Typography>
      <Typography data-testid="control-pose">X {pose.x.toFixed(2)} m | Y {pose.y.toFixed(2)} m | heading {(pose.headingRad * 180 / Math.PI).toFixed(0)} degrees</Typography>
      <Button onClick={() => { rover.current.pose = { x: 0, y: 0, headingRad: 0 }; setPose({ ...rover.current.pose }); }}>Reset field position</Button>
      <Button component={Link} to="/demo">Back to the farm demo</Button>
    </Stack>
  </Box>;
}
