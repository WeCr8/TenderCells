// PredatorMonitorDashboard.tsx
import React from "react";
import Grid from "@mui/material/Grid";
import Viewport3D from "../components/viewport/Viewport3D";
import TelemetryPanel from "../components/telemetry/TelemetryPanel";
import BottomToolbar from "../components/toolbar/BottomToolbar";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import SecurityIcon from "@mui/icons-material/Security";
import CameraAltIcon from "@mui/icons-material/CameraAlt";
import WarningIcon from "@mui/icons-material/Warning";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";

export default function PredatorMonitorDashboard() {
  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <SecurityIcon sx={{ fontSize: 40, mr: 2, color: '#6BBF59' }} />
        <Typography variant="h4" sx={{ color: '#E4E7E5' }}>Predator Monitor Dashboard</Typography>
      </Box>
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper elevation={3} sx={{ p: 2, mb: 2 }}>
            <Typography variant="h5" gutterBottom>
              Surveillance 3D View
            </Typography>
            <Viewport3D />
          </Paper>
          <BottomToolbar />
        </Grid>
        <Grid item xs={12} md={4}>
          <TelemetryPanel />
          <Paper elevation={2} sx={{ p: 2, mt: 2 }}>
            <Typography variant="h6" gutterBottom>
              Monitor Controls
            </Typography>
            <Stack spacing={2} sx={{ mt: 2 }}>
              <Button variant="outlined" startIcon={<CameraAltIcon />} fullWidth>
                Camera Feed
              </Button>
              <Button variant="outlined" startIcon={<WarningIcon />} fullWidth>
                Alert System
              </Button>
              <Button variant="outlined" startIcon={<NotificationsActiveIcon />} fullWidth>
                Notifications
              </Button>
            </Stack>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
