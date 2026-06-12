// TurkeyTowerDashboard.tsx
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
import HeightIcon from "@mui/icons-material/Height";
import VisibilityIcon from "@mui/icons-material/Visibility";
import SecurityIcon from "@mui/icons-material/Security";
import { useLocation } from "react-router-dom";
import ProductSectionPanel from "../components/navigation/ProductSectionPanel";
import { ProductDetailsPanel, ProductHero } from "../components/products/ProductOverview";

export default function TurkeyTowerDashboard() {
  const location = useLocation();
  const section = new URLSearchParams(location.search).get("section") || "shelter";

  return (
    <Box>
      <ProductHero product="turkey-tower" />
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper elevation={3} sx={{ p: 2, mb: 2 }}>
            <Typography variant="h5" gutterBottom>
              Tower 3D View
            </Typography>
            <Viewport3D />
          </Paper>
          <ProductSectionPanel product="turkey-tower" section={section} />
          <BottomToolbar />
        </Grid>
        <Grid item xs={12} md={4}>
          <ProductDetailsPanel product="turkey-tower" />
          <TelemetryPanel />
          <Paper elevation={2} sx={{ p: 2, mt: 2 }}>
            <Typography variant="h6" gutterBottom>
              Tower Controls
            </Typography>
            <Stack spacing={2} sx={{ mt: 2 }}>
              <Button variant="outlined" startIcon={<HeightIcon />} fullWidth>
                Tower Height
              </Button>
              <Button variant="outlined" startIcon={<VisibilityIcon />} fullWidth>
                Perch View
              </Button>
              <Button variant="outlined" startIcon={<SecurityIcon />} fullWidth>
                Predator Watch
              </Button>
            </Stack>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
