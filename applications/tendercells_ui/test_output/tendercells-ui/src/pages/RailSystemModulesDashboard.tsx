// RailSystemModulesDashboard.tsx
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
import TrainIcon from "@mui/icons-material/Train";
import SettingsIcon from "@mui/icons-material/Settings";
import PrecisionManufacturingIcon from "@mui/icons-material/PrecisionManufacturing";
import BuildIcon from "@mui/icons-material/Build";
import { useLocation } from "react-router-dom";
import ProductSectionPanel from "../components/navigation/ProductSectionPanel";
import { ProductDetailsPanel, ProductHero } from "../components/products/ProductOverview";

export default function RailSystemModulesDashboard() {
  const location = useLocation();
  const section = new URLSearchParams(location.search).get("section") || "rails";

  return (
    <Box>
      <ProductHero product="rail-system-modules" />
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper elevation={3} sx={{ p: 2, mb: 2 }}>
            <Typography variant="h5" gutterBottom>
              Rail System 3D View
            </Typography>
            <Viewport3D />
          </Paper>
          <ProductSectionPanel product="rail-system-modules" section={section} />
          <BottomToolbar />
        </Grid>
        <Grid item xs={12} md={4}>
          <ProductDetailsPanel product="rail-system-modules" />
          <TelemetryPanel />
          <Paper elevation={2} sx={{ p: 2, mt: 2 }}>
            <Typography variant="h6" gutterBottom>
              Rail Controls
            </Typography>
            <Stack spacing={2} sx={{ mt: 2 }}>
              <Button variant="outlined" startIcon={<SettingsIcon />} fullWidth>
                Rail Configuration
              </Button>
              <Button variant="outlined" startIcon={<PrecisionManufacturingIcon />} fullWidth>
                Module Control
              </Button>
              <Button variant="outlined" startIcon={<BuildIcon />} fullWidth>
                Maintenance
              </Button>
            </Stack>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
