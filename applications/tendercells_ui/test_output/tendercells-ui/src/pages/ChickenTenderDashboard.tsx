// ChickenTenderDashboard.tsx
import { useState, useEffect } from "react";
import Grid from "@mui/material/Grid";
import Viewport3D from "../components/viewport/Viewport3D";
import TelemetryPanel from "../components/telemetry/TelemetryPanel";
import BottomToolbar from "../components/toolbar/BottomToolbar";
import QuickActions from "../components/toolbar/QuickActions";
import CameraFeedViewer from "../components/camera/CameraFeedViewer";
import CameraGrid from "../components/camera/CameraGrid";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import AgricultureIcon from "@mui/icons-material/Agriculture";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import Alert from "@mui/material/Alert";
import { useLocation } from "react-router-dom";
import ProductSectionPanel from "../components/navigation/ProductSectionPanel";
import type { CameraFeed } from "../types/camera";

const DEFAULT_CAMERAS: CameraFeed[] = [
  {
    id: "cam-main-feed",
    deviceId: "ct_001",
    name: "Main Feed",
    location: "main-feed",
    streamUrl: "placeholder://main-feed",
    resolution: "1080p",
    fps: 30,
    connected: true,
    signal: -48,
  },
  {
    id: "cam-roost",
    deviceId: "ct_001",
    name: "Roost",
    location: "roost",
    streamUrl: "placeholder://roost",
    resolution: "1080p",
    fps: 24,
    connected: true,
    signal: -58,
  },
  {
    id: "cam-nest",
    deviceId: "ct_001",
    name: "Nest Box",
    location: "nest-box",
    streamUrl: "placeholder://nest",
    resolution: "720p",
    fps: 24,
    connected: false,
    signal: -76,
    lastSeen: "12 minutes ago",
  },
];

export default function ChickenTenderDashboard() {
  const location = useLocation();
  const section = new URLSearchParams(location.search).get("section") || "coop";
  const [deviceId, setDeviceId] = useState("ct_001"); // Default device ID
  const [apiStatus, setApiStatus] = useState<"ok" | "error" | "loading">("loading");
  const [cameraViewEnabled, setCameraViewEnabled] = useState(false);
  const [cameras, setCameras] = useState<CameraFeed[]>(DEFAULT_CAMERAS);
  const [selectedCameraId, setSelectedCameraId] = useState(DEFAULT_CAMERAS[0].id);

  const selectedCamera = cameras.find((camera) => camera.id === selectedCameraId) || cameras[0];

  useEffect(() => {
    // Check API health on mount
    fetch("http://localhost:4000/health")
      .then((res) => setApiStatus(res.ok ? "ok" : "error"))
      .catch(() => setApiStatus("error"));
  }, []);

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: { xs: 2, md: 3 }, minWidth: 0 }}>
        <AgricultureIcon sx={{ fontSize: { xs: 30, sm: 40 }, color: '#6BBF59', flexShrink: 0 }} />
        <Typography variant="h4" sx={{ color: '#E4E7E5', fontSize: { xs: '1.65rem', sm: '2.125rem' }, lineHeight: 1.15 }}>
          Chicken Tender Dashboard
        </Typography>
      </Box>

      {apiStatus === "error" && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          API server unavailable on :4000. Running with local development placeholders.
        </Alert>
      )}

      <Grid container spacing={{ xs: 2, lg: 3 }}>
        <Grid item xs={12} lg={8}>
          <Paper elevation={3} sx={{ p: 2, mb: 2 }}>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={1}
              justifyContent="space-between"
              alignItems={{ xs: "stretch", sm: "center" }}
              sx={{ mb: 2 }}
            >
              <Box>
                <Typography variant="h5" gutterBottom>
                  {cameraViewEnabled ? "Coop Camera View" : "Coop CAD View"}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {cameraViewEnabled
                    ? "Select a camera feed or review all mounted coop cameras."
                    : "Inspect the coop, property, products, and simulation workspace."}
                </Typography>
              </Box>
              <Button
                variant={cameraViewEnabled ? "contained" : "outlined"}
                startIcon={cameraViewEnabled ? <VisibilityOffIcon /> : <VisibilityIcon />}
                onClick={() => setCameraViewEnabled((value) => !value)}
                sx={{ alignSelf: { xs: "stretch", sm: "center" } }}
              >
                {cameraViewEnabled ? "Show CAD" : "Show Cameras"}
              </Button>
            </Stack>

            {cameraViewEnabled ? (
              <Box>
                <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ mb: 2 }}>
                  <ToggleButtonGroup
                    size="small"
                    exclusive
                    value={selectedCameraId}
                    onChange={(_, value) => value && setSelectedCameraId(value)}
                    sx={{ bgcolor: "rgba(0,31,22,0.9)" }}
                  >
                    {cameras.map((camera) => (
                      <ToggleButton key={camera.id} value={camera.id}>
                        {camera.name}
                      </ToggleButton>
                    ))}
                  </ToggleButtonGroup>
                </Stack>

                {selectedCamera && (
                  <CameraFeedViewer camera={selectedCamera} height={420} />
                )}

                <Box sx={{ mt: 2 }}>
                  <CameraGrid
                    deviceId={deviceId}
                    cameras={cameras}
                    onAddCamera={(camera) => {
                      const nextCamera = { ...camera, deviceId };
                      setCameras((current) => [...current, nextCamera]);
                      setSelectedCameraId(nextCamera.id);
                    }}
                    onRemoveCamera={(cameraId) => {
                      setCameras((current) => {
                        const next = current.filter((camera) => camera.id !== cameraId);
                        if (selectedCameraId === cameraId && next[0]) {
                          setSelectedCameraId(next[0].id);
                        }
                        return next;
                      });
                    }}
                  />
                </Box>
              </Box>
            ) : (
              <Viewport3D />
            )}
          </Paper>
          <ProductSectionPanel product="chicken-tender" section={section} />
          <BottomToolbar />
        </Grid>
        <Grid item xs={12} lg={4}>
          <Paper elevation={2} sx={{ p: 2, mb: 2 }}>
            <Typography variant="h6" gutterBottom>
              Device Configuration
            </Typography>
            <TextField
              label="Device ID"
              value={deviceId}
              onChange={(e) => setDeviceId(e.target.value)}
              fullWidth
              size="small"
              helperText="MQTT device ID (tc/{deviceId}/...)"
            />
          </Paper>

          <TelemetryPanel deviceId={deviceId} />

          <Paper elevation={2} sx={{ p: 2, mt: 2 }}>
            <Typography variant="h6" gutterBottom>
              Quick Actions
            </Typography>
            <QuickActions deviceId={deviceId} />
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
