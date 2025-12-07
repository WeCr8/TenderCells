// ChickenTenderDashboard.tsx
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
import AgricultureIcon from "@mui/icons-material/Agriculture";
import DoorFrontIcon from "@mui/icons-material/DoorFront";
import RestaurantIcon from "@mui/icons-material/Restaurant";
import EggIcon from "@mui/icons-material/Egg";

export default function ChickenTenderDashboard() {
  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <AgricultureIcon sx={{ fontSize: 40, mr: 2, color: '#6BBF59' }} />
        <Typography variant="h4" sx={{ color: '#E4E7E5' }}>Chicken Tender Dashboard</Typography>
      </Box>
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
          <TelemetryPanel />
          <Paper elevation={2} sx={{ p: 2, mt: 2 }}>
            <Typography variant="h6" gutterBottom>
              Quick Actions
            </Typography>
            <Stack spacing={2} sx={{ mt: 2 }}>
              <Button variant="outlined" startIcon={<DoorFrontIcon />} fullWidth>
                Control Doors
              </Button>
              <Button variant="outlined" startIcon={<RestaurantIcon />} fullWidth>
                Feeding Schedule
              </Button>
              <Button variant="outlined" startIcon={<EggIcon />} fullWidth>
                Egg Collection
              </Button>
            </Stack>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
