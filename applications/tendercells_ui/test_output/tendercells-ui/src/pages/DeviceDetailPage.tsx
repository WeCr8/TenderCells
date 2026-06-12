// DeviceDetailPage.tsx - Individual device detail view
import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Tabs,
  Tab,
  Card,
  CardContent,
  Stack,
  Button,
} from '@mui/material';
import Viewport3D from '../components/viewport/Viewport3D';
import TelemetryPanel from '../components/telemetry/TelemetryPanel';
import QuickActions from '../components/toolbar/QuickActions';
import CameraGrid from '../components/camera/CameraGrid';
import BehaviorAnalytics from '../components/camera/BehaviorAnalytics';
import EditIcon from '@mui/icons-material/Edit';
import StorageIcon from '@mui/icons-material/Storage';
import TimelineIcon from '@mui/icons-material/Timeline';
import VideocamIcon from '@mui/icons-material/Videocam';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`device-tabpanel-${index}`}
      aria-labelledby={`device-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

interface DeviceDetailPageProps {
  deviceId?: string;
  deviceName?: string;
}

export default function DeviceDetailPage({
  deviceId = 'ct_001',
  deviceName = 'Chicken Tender #1',
}: DeviceDetailPageProps) {
  const [activeTab, setActiveTab] = useState(0);
  const [cameras, setCameras] = useState<any[]>([]);

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" gutterBottom sx={{ color: '#C8B882' }}>
            {deviceName}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Device ID: {deviceId}
          </Typography>
        </Box>
        <Button variant="outlined" startIcon={<EditIcon />}>
          Settings
        </Button>
      </Box>

      {/* Tabs */}
      <Paper sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} aria-label="device tabs">
          <Tab label="3D Model" icon={<StorageIcon />} iconPosition="start" />
          <Tab label="Telemetry" icon={<TimelineIcon />} iconPosition="start" />
          <Tab label="Cameras" icon={<VideocamIcon />} iconPosition="start" />
          <Tab label="Health" icon={<FavoriteBorderIcon />} iconPosition="start" />
          <Tab label="Controls" />
          <Tab label="History" />
        </Tabs>
      </Paper>

      {/* 3D Model Tab */}
      <TabPanel value={activeTab} index={0}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 2 }}>
              <Viewport3D />
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card sx={{ bgcolor: '#1A3D2B' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ color: '#C8B882' }}>
                  Model Info
                </Typography>
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Dimensions
                    </Typography>
                    <Typography variant="body2">4 × 4 × 6 ft</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Material
                    </Typography>
                    <Typography variant="body2">Wood (Treated Pine)</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Model File
                    </Typography>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                      coop-4x4x6.glb
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Telemetry Tab */}
      <TabPanel value={activeTab} index={1}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <TelemetryPanel deviceId={deviceId} />
          </Grid>
          <Grid item xs={12} md={6}>
            <Card sx={{ bgcolor: '#1A3D2B' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ color: '#C8B882' }}>
                  Historical Data
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Chart visualization ready for integration with telemetry time-series data
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Cameras Tab */}
      <TabPanel value={activeTab} index={2}>
        <CameraGrid
          deviceId={deviceId}
          cameras={cameras}
          onAddCamera={(camera) => setCameras([...cameras, camera])}
          onRemoveCamera={(cameraId) =>
            setCameras(cameras.filter((c) => c.id !== cameraId))
          }
        />
      </TabPanel>

      {/* Health Tab */}
      <TabPanel value={activeTab} index={3}>
        <BehaviorAnalytics />
      </TabPanel>

      {/* Controls Tab */}
      <TabPanel value={activeTab} index={4}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ color: '#C8B882' }}>
            Hardware Controls
          </Typography>
          <QuickActions deviceId={deviceId} />
        </Paper>
      </TabPanel>

      {/* History Tab */}
      <TabPanel value={activeTab} index={5}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ color: '#C8B882' }}>
            Event History
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Timeline of device events, alerts, and control actions ready for integration
          </Typography>
        </Paper>
      </TabPanel>
    </Box>
  );
}
