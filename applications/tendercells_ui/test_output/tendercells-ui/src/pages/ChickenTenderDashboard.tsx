// ChickenTenderDashboard.tsx
import React, { useState, useEffect } from "react";
import Grid from "@mui/material/Grid";
import Viewport3D from "../components/viewport/Viewport3D";
import TelemetryPanel from "../components/telemetry/TelemetryPanel";
import BottomToolbar from "../components/toolbar/BottomToolbar";
import QuickActions from "../components/toolbar/QuickActions";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import AgricultureIcon from "@mui/icons-material/Agriculture";
import Alert from "@mui/material/Alert";

export default function ChickenTenderDashboard() {
  const [deviceId, setDeviceId] = useState("ct_001"); // Default device ID
  const [apiStatus, setApiStatus] = useState<"ok" | "error" | "loading">("loading");

  useEffect(() => {
    // Check API health on mount
    fetch("http://localhost:4000/health")
      .then((res) => setApiStatus(res.ok ? "ok" : "error"))
      .catch(() => setApiStatus("error"));
  }, []);

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <AgricultureIcon sx={{ fontSize: 40, mr: 2, color: '#6BBF59' }} />
        <Typography variant="h4" sx={{ color: '#E4E7E5' }}>Chicken Tender Dashboard</Typography>
      </Box>

      {apiStatus === "error" && (
        <Alert severity="error" sx={{ mb: 2 }}>
          API server unavailable. Ensure express-api running on :4000
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper elevation={3} sx={{ p: 2, mb: 2 }}>
            <Typography variant="h5" gutterBottom>
              Coop 3D View
            </Typography>
            <Viewport3D />
          </Paper>
          <BottomToolbar />
        </Grid>
        <Grid item xs={12} md={4}>
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
