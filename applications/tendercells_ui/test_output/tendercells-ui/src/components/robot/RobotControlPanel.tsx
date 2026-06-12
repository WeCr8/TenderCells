// RobotControlPanel.tsx - Robot arm & CNC controls with live camera view
import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Button,
  Stack,
  Card,
  CardContent,
  Slider,
  Dialog,
  DialogTitle,
  DialogContent,
  Chip,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Videocam as CameraIcon,
  Close as CloseIcon,
  PlayArrow as StartIcon,
  Stop as StopIcon,
  AutoFixHigh as JointIcon,
} from '@mui/icons-material';
import CameraFeedViewer from '../camera/CameraFeedViewer';

interface RobotState {
  status: 'idle' | 'homing' | 'moving' | 'executing' | 'error' | 'estop';
  position: { x: number; y: number; z: number };
  joints: [number, number, number, number, number, number]; // 6DOF angles
  feedRate: number; // 0-100%
  connected: boolean;
}

interface CNCCommand {
  type: 'move' | 'jog' | 'home' | 'tool-change' | 'stop';
  target?: { x?: number; y?: number; z?: number };
  speed?: number;
}

export default function RobotControlPanel({ deviceId = 'ct_001' }: { deviceId?: string }) {
  const [robotState, setRobotState] = useState<RobotState>({
    status: 'idle',
    position: { x: 0, y: 0, z: 0 },
    joints: [0, 45, 90, 0, 45, 0],
    feedRate: 50,
    connected: false,
  });

  const [showCamera, setShowCamera] = useState(false);
  const [selectedJoint, setSelectedJoint] = useState<number | null>(null);
  const [jointAngle, setJointAngle] = useState(0);

  const handleSendCommand = async (command: CNCCommand) => {
    try {
      const response = await fetch(`http://localhost:3001/api/mqtt/devices/${deviceId}/arm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          seq: Date.now(),
          command: command.type,
          target: command.target,
          speed: command.speed || robotState.feedRate / 100,
          joints: robotState.joints,
        }),
      });

      if (response.ok) {
        setRobotState({ ...robotState, status: 'executing' });
      }
    } catch (error) {
      console.error('Command failed:', error);
      setRobotState({ ...robotState, status: 'error' });
    }
  };

  const updateJoint = (jointIndex: number, angle: number) => {
    const newJoints = [...robotState.joints] as [number, number, number, number, number, number];
    newJoints[jointIndex] = angle;
    setRobotState({ ...robotState, joints: newJoints });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'idle':
        return '#4A7C59';
      case 'moving':
        return '#E8A020';
      case 'executing':
        return '#4A90E2';
      case 'error':
      case 'estop':
        return '#CC3333';
      case 'homing':
        return '#8A7D55';
      default:
        return '#8A7D55';
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header with Camera Button */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ color: '#C8B882', mb: 0.5 }}>
            TenderCells Rail System™ Controls
          </Typography>
          <Typography variant="body2" color="text.secondary">
            6DOF Robot Arm + CNC Motion Control
          </Typography>
        </Box>
        <Tooltip title="View live robot camera feed">
          <IconButton
            onClick={() => setShowCamera(true)}
            sx={{
              bgcolor: '#4A7C59',
              color: '#C8B882',
              fontSize: 28,
              padding: 2,
              '&:hover': { bgcolor: '#5a8c69' },
            }}
          >
            <CameraIcon fontSize="inherit" />
          </IconButton>
        </Tooltip>
      </Stack>

      {/* Live Camera Feed Dialog */}
      <Dialog open={showCamera} onClose={() => setShowCamera(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ bgcolor: '#0D2B1E', color: '#C8B882' }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography>Robot Arm Live Feed</Typography>
            <IconButton onClick={() => setShowCamera(false)} size="small">
              <CloseIcon />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent sx={{ bgcolor: '#0D2B1E', p: 2 }}>
          <CameraFeedViewer
            camera={{
              id: 'robot-camera-1',
              deviceId,
              name: 'Robot Arm Overhead View',
              location: 'main-feed',
              resolution: '1080p',
              fps: 30,
              connected: true,
              signal: -55,
            }}
            height={480}
          />
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            Live 6DOF arm telemetry: Position updates at 30Hz
          </Typography>
        </DialogContent>
      </Dialog>

      {/* Robot Status Card */}
      <Paper sx={{ p: 2, mb: 3, bgcolor: '#1A3D2B', border: '1px solid #4A7C59' }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6}>
            <Stack spacing={1}>
              <Typography variant="subtitle2" color="text.secondary">
                Robot Status
              </Typography>
              <Chip
                label={robotState.status.toUpperCase()}
                sx={{
                  bgcolor: getStatusColor(robotState.status),
                  color: '#F0EDE4',
                  fontWeight: 'bold',
                }}
              />
            </Stack>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Stack spacing={1}>
              <Typography variant="subtitle2" color="text.secondary">
                Connection
              </Typography>
              <Chip
                label={robotState.connected ? 'CONNECTED' : 'DISCONNECTED'}
                color={robotState.connected ? 'success' : 'error'}
                variant="outlined"
              />
            </Stack>
          </Grid>
        </Grid>
      </Paper>

      {/* Joint Controls (6DOF) */}
      <Typography variant="h6" sx={{ color: '#C8B882', mb: 2 }}>
        Joint Angles (Degrees)
      </Typography>
      <Grid container spacing={2} sx={{ mb: 4 }}>
        {robotState.joints.map((angle, idx) => (
          <Grid item xs={12} sm={6} md={4} key={idx}>
            <Card sx={{ bgcolor: '#1A3D2B' }}>
              <CardContent>
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="subtitle2" sx={{ color: '#C8B882', mb: 1 }}>
                      Joint {idx + 1}
                    </Typography>
                    <Typography variant="h6" sx={{ color: '#F0EDE4' }}>
                      {angle.toFixed(1)}°
                    </Typography>
                  </Box>
                  <Slider
                    value={angle}
                    onChange={(e, newValue) => updateJoint(idx, newValue as number)}
                    min={-180}
                    max={180}
                    step={1}
                    marks={[
                      { value: -180, label: '-180°' },
                      { value: 0, label: '0°' },
                      { value: 180, label: '180°' },
                    ]}
                    valueLabelDisplay="auto"
                    sx={{
                      '& .MuiSlider-thumb': { backgroundColor: '#4A7C59' },
                      '& .MuiSlider-track': { backgroundColor: '#4A7C59' },
                    }}
                  />
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Position Display */}
      <Typography variant="h6" sx={{ color: '#C8B882', mb: 2 }}>
        End Effector Position (Cartesian)
      </Typography>
      <Paper sx={{ p: 2, mb: 3, bgcolor: '#1A3D2B' }}>
        <Grid container spacing={2}>
          <Grid item xs={4}>
            <Typography variant="caption" color="text.secondary">
              X
            </Typography>
            <Typography variant="h6" sx={{ color: '#F0EDE4' }}>
              {robotState.position.x.toFixed(2)} mm
            </Typography>
          </Grid>
          <Grid item xs={4}>
            <Typography variant="caption" color="text.secondary">
              Y
            </Typography>
            <Typography variant="h6" sx={{ color: '#F0EDE4' }}>
              {robotState.position.y.toFixed(2)} mm
            </Typography>
          </Grid>
          <Grid item xs={4}>
            <Typography variant="caption" color="text.secondary">
              Z
            </Typography>
            <Typography variant="h6" sx={{ color: '#F0EDE4' }}>
              {robotState.position.z.toFixed(2)} mm
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* Feed Rate Control */}
      <Typography variant="h6" sx={{ color: '#C8B882', mb: 2 }}>
        Feed Rate (Motion Speed)
      </Typography>
      <Paper sx={{ p: 2, mb: 3, bgcolor: '#1A3D2B' }}>
        <Stack spacing={2}>
          <Slider
            value={robotState.feedRate}
            onChange={(e, newValue) =>
              setRobotState({ ...robotState, feedRate: newValue as number })
            }
            min={0}
            max={100}
            step={5}
            marks={[
              { value: 0, label: '0%' },
              { value: 50, label: '50%' },
              { value: 100, label: '100%' },
            ]}
            valueLabelDisplay="auto"
            valueLabelFormat={(value) => `${value}%`}
            sx={{
              '& .MuiSlider-thumb': { backgroundColor: '#4A7C59' },
              '& .MuiSlider-track': { backgroundColor: '#4A7C59' },
            }}
          />
          <Typography variant="body2" color="text.secondary">
            Current: {robotState.feedRate}% ({(robotState.feedRate * 0.5).toFixed(1)} mm/s max)
          </Typography>
        </Stack>
      </Paper>

      {/* Control Buttons */}
      <Typography variant="h6" sx={{ color: '#C8B882', mb: 2 }}>
        Motion Commands
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <Button
            variant="contained"
            fullWidth
            startIcon={<JointIcon />}
            onClick={() => handleSendCommand({ type: 'home' })}
            sx={{
              bgcolor: '#4A7C59',
              '&:hover': { bgcolor: '#5a8c69' },
              p: 1.5,
            }}
          >
            Home Position
          </Button>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Button
            variant="contained"
            fullWidth
            startIcon={<StartIcon />}
            onClick={() =>
              handleSendCommand({ type: 'move', target: { x: 100, y: 100, z: 200 } })
            }
            sx={{
              bgcolor: '#4A7C59',
              '&:hover': { bgcolor: '#5a8c69' },
              p: 1.5,
            }}
          >
            Execute Move
          </Button>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Button
            variant="contained"
            fullWidth
            startIcon={<JointIcon />}
            onClick={() => handleSendCommand({ type: 'tool-change' })}
            sx={{
              bgcolor: '#8A7D55',
              '&:hover': { bgcolor: '#9a8d65' },
              p: 1.5,
            }}
          >
            Change Tool
          </Button>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Button
            variant="contained"
            fullWidth
            startIcon={<StopIcon />}
            onClick={() => handleSendCommand({ type: 'stop' })}
            sx={{
              bgcolor: '#CC3333',
              '&:hover': { bgcolor: '#dd4444' },
              p: 1.5,
            }}
          >
            Emergency Stop
          </Button>
        </Grid>
      </Grid>

      {/* CNC Status Log */}
      <Paper
        sx={{
          p: 2,
          mt: 3,
          bgcolor: '#1A3D2B',
          border: '1px solid #4A7C59',
          maxHeight: 200,
          overflow: 'auto',
        }}
      >
        <Typography variant="subtitle2" sx={{ color: '#C8B882', mb: 1 }}>
          Command Log
        </Typography>
        <Typography variant="caption" sx={{ color: '#8A7D55', fontFamily: 'monospace' }}>
          → Home position initialized{'\n'}
          → Joint 1: 0° | Joint 2: 45° | Joint 3: 90°{'\n'}
          → Ready for motion commands{'\n'}
          → Feed rate: 50%
        </Typography>
      </Paper>
    </Box>
  );
}
