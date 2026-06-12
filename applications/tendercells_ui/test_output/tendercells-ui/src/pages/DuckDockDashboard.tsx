// DuckDockDashboard.tsx
import Grid from "@mui/material/Grid";
import Viewport3D from "../components/viewport/Viewport3D";
import TelemetryPanel from "../components/telemetry/TelemetryPanel";
import BottomToolbar from "../components/toolbar/BottomToolbar";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import WaterIcon from "@mui/icons-material/Water";
import PoolIcon from "@mui/icons-material/Pool";
import WavesIcon from "@mui/icons-material/Waves";
import { useLocation } from "react-router-dom";
import ProductSectionPanel from "../components/navigation/ProductSectionPanel";
import { ProductDetailsPanel, ProductHero } from "../components/products/ProductOverview";

export default function DuckDockDashboard() {
  const location = useLocation();
  const section = new URLSearchParams(location.search).get("section") || "dock";

  return (
    <Box>
      <ProductHero product="duck-dock" />
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper elevation={3} sx={{ p: 2, mb: 2 }}>
            <Typography variant="h5" gutterBottom>
              Pond & Dock 3D View
            </Typography>
            <Viewport3D />
          </Paper>
          <ProductSectionPanel product="duck-dock" section={section} />
          <BottomToolbar />
        </Grid>
        <Grid item xs={12} md={4}>
          <ProductDetailsPanel product="duck-dock" />
          <TelemetryPanel />
          <Paper elevation={2} sx={{ p: 2, mt: 2 }}>
            <Typography variant="h6" gutterBottom>
              Water Management
            </Typography>
            <Stack spacing={2} sx={{ mt: 2 }}>
              <Button variant="outlined" startIcon={<PoolIcon />} fullWidth>
                Pond Level
              </Button>
              <Button variant="outlined" startIcon={<WavesIcon />} fullWidth>
                Water Quality
              </Button>
              <Button variant="outlined" startIcon={<WaterIcon />} fullWidth>
                Dock Access
              </Button>
            </Stack>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
