// CameraGrid.tsx - Multi-camera view layout
import React, { useState } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Stack,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import CameraFeedViewer from './CameraFeedViewer';
import { CameraFeed, CameraLocation, CAMERA_LOCATIONS } from '../../types/camera';

interface CameraGridProps {
  deviceId: string;
  cameras: CameraFeed[];
  onAddCamera?: (camera: CameraFeed) => void;
  onRemoveCamera?: (cameraId: string) => void;
  onUpdateCamera?: (camera: CameraFeed) => void;
}

export default function CameraGrid({
  deviceId,
  cameras,
  onAddCamera,
  onRemoveCamera,
  onUpdateCamera,
}: CameraGridProps) {
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [editingCamera, setEditingCamera] = useState<CameraFeed | null>(null);
  const [newCamera, setNewCamera] = useState({
    name: '',
    location: 'main-feed' as CameraLocation,
    resolution: '1080p' as const,
    fps: 30,
    motionDetection: true,
    recording: true,
  });

  const handleAddCamera = () => {
    if (!newCamera.name) return;

    const camera: CameraFeed = {
      id: `cam-${Date.now()}`,
      deviceId,
      name: newCamera.name,
      location: newCamera.location,
      resolution: newCamera.resolution,
      fps: newCamera.fps,
      connected: false,
      signal: -60,
    };

    onAddCamera?.(camera);
    setNewCamera({
      name: '',
      location: 'main-feed',
      resolution: '1080p',
      fps: 30,
      motionDetection: true,
      recording: true,
    });
    setOpenAddDialog(false);
  };

  return (
    <Box sx={{ p: 2 }}>
      {/* Header */}
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography variant="h5" sx={{ color: '#C8B882', mb: 0.5 }}>
            Coop Cameras
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {cameras.length} camera{cameras.length !== 1 ? 's' : ''} connected
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenAddDialog(true)}
          sx={{
            bgcolor: '#4A7C59',
            '&:hover': { bgcolor: '#5a8c69' },
          }}
        >
          Add Camera
        </Button>
      </Stack>

      {/* Camera Grid */}
      {cameras.length > 0 ? (
        <Grid container spacing={2}>
          {cameras.map((camera) => (
            <Grid item xs={12} sm={6} md={4} key={camera.id}>
              <Box sx={{ position: 'relative' }}>
                <CameraFeedViewer camera={camera} height={240} />
                <Stack
                  direction="row"
                  spacing={1}
                  sx={{
                    position: 'absolute',
                    bottom: 8,
                    right: 8,
                    zIndex: 10,
                  }}
                >
                  <Button
                    size="small"
                    startIcon={<SettingsIcon />}
                    onClick={() => setEditingCamera(camera)}
                    sx={{
                      bgcolor: 'rgba(13, 43, 30, 0.8)',
                      color: '#C8B882',
                      '&:hover': { bgcolor: 'rgba(13, 43, 30, 0.95)' },
                    }}
                  >
                    Edit
                  </Button>
                  <Button
                    size="small"
                    startIcon={<DeleteIcon />}
                    onClick={() => onRemoveCamera?.(camera.id)}
                    sx={{
                      bgcolor: 'rgba(204, 51, 51, 0.8)',
                      color: '#F0EDE4',
                      '&:hover': { bgcolor: 'rgba(204, 51, 51, 0.95)' },
                    }}
                  >
                    Delete
                  </Button>
                </Stack>
              </Box>
            </Grid>
          ))}
        </Grid>
      ) : (
        <Paper
          sx={{
            p: 4,
            textAlign: 'center',
            bgcolor: '#1A3D2B',
            border: '2px dashed #4A7C59',
          }}
        >
          <Typography color="text.secondary" gutterBottom>
            No cameras set up yet
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Add cameras to monitor your coop
          </Typography>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={() => setOpenAddDialog(true)}
          >
            Add First Camera
          </Button>
        </Paper>
      )}

      {/* Add Camera Dialog */}
      <Dialog open={openAddDialog} onClose={() => setOpenAddDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Camera</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={2}>
            <TextField
              label="Camera Name"
              placeholder="e.g., Main Coop Feed"
              fullWidth
              value={newCamera.name}
              onChange={(e) => setNewCamera({ ...newCamera, name: e.target.value })}
            />
            <Select
              value={newCamera.location}
              onChange={(e) =>
                setNewCamera({
                  ...newCamera,
                  location: e.target.value as CameraLocation,
                })
              }
              fullWidth
            >
              {Object.entries(CAMERA_LOCATIONS).map(([key, label]) => (
                <MenuItem key={key} value={key}>
                  {label}
                </MenuItem>
              ))}
            </Select>
            <Select
              value={newCamera.resolution}
              onChange={(e) =>
                setNewCamera({
                  ...newCamera,
                  resolution: e.target.value as any,
                })
              }
              fullWidth
            >
              <MenuItem value="1080p">1080p Full HD</MenuItem>
              <MenuItem value="720p">720p HD</MenuItem>
              <MenuItem value="480p">480p VGA</MenuItem>
            </Select>
            <TextField
              label="Frame Rate (fps)"
              type="number"
              inputProps={{ min: 5, max: 60 }}
              value={newCamera.fps}
              onChange={(e) =>
                setNewCamera({ ...newCamera, fps: parseInt(e.target.value) })
              }
              fullWidth
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={newCamera.motionDetection}
                  onChange={(e) =>
                    setNewCamera({
                      ...newCamera,
                      motionDetection: e.target.checked,
                    })
                  }
                />
              }
              label="Enable Motion Detection"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={newCamera.recording}
                  onChange={(e) =>
                    setNewCamera({ ...newCamera, recording: e.target.checked })
                  }
                />
              }
              label="Enable Recording"
            />
          </Stack>
        </DialogContent>
        <Box sx={{ display: 'flex', gap: 1, p: 2, justifyContent: 'flex-end' }}>
          <Button onClick={() => setOpenAddDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleAddCamera}
            disabled={!newCamera.name}
            sx={{ bgcolor: '#4A7C59' }}
          >
            Add Camera
          </Button>
        </Box>
      </Dialog>

      {/* Edit Camera Dialog */}
      <Dialog
        open={!!editingCamera}
        onClose={() => setEditingCamera(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Edit Camera: {editingCamera?.name}</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {editingCamera && (
            <Stack spacing={2}>
              <TextField
                label="Camera Name"
                fullWidth
                defaultValue={editingCamera.name}
              />
              <Select fullWidth defaultValue={editingCamera.location}>
                {Object.entries(CAMERA_LOCATIONS).map(([key, label]) => (
                  <MenuItem key={key} value={key}>
                    {label}
                  </MenuItem>
                ))}
              </Select>
              <Typography variant="caption" color="text.secondary">
                Connected: {editingCamera.connected ? 'Yes' : 'No'} | Last seen:{' '}
                {editingCamera.lastSeen || 'Never'}
              </Typography>
            </Stack>
          )}
        </DialogContent>
        <Box sx={{ display: 'flex', gap: 1, p: 2, justifyContent: 'flex-end' }}>
          <Button onClick={() => setEditingCamera(null)}>Close</Button>
        </Box>
      </Dialog>
    </Box>
  );
}
