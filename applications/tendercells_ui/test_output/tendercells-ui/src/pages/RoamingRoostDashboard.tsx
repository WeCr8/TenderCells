// RoamingRoostDashboard.tsx
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
import ExploreIcon from "@mui/icons-material/Explore";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import MapIcon from "@mui/icons-material/Map";
import { useLocation } from "react-router-dom";
import ProductSectionPanel from "../components/navigation/ProductSectionPanel";

export default function RoamingRoostDashboard() {
  const location = useLocation();
  const section = new URLSearchParams(location.search).get("section") || "mobile-coop";

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <AgricultureIcon sx={{ fontSize: 40, mr: 2, color: '#6BBF59' }} />
        <Typography variant="h4" sx={{ color: '#E4E7E5' }}>Roaming Roost Dashboard</Typography>
      </Box>
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper elevation={3} sx={{ p: 2, mb: 2 }}>
            <Typography variant="h5" gutterBottom>
              Mobile Coop 3D View
            </Typography>
            <Viewport3D />
          </Paper>
          <ProductSectionPanel product="roaming-roost" section={section} />
          <BottomToolbar />
        </Grid>
        <Grid item xs={12} md={4}>
          <TelemetryPanel />
          <Paper elevation={2} sx={{ p: 2, mt: 2 }}>
            <Typography variant="h6" gutterBottom>
              Roaming Controls
            </Typography>
            <Stack spacing={2} sx={{ mt: 2 }}>
              <Button variant="outlined" startIcon={<ExploreIcon />} fullWidth>
                Track Location
              </Button>
              <Button variant="outlined" startIcon={<LocationOnIcon />} fullWidth>
                Set Waypoint
              </Button>
              <Button variant="outlined" startIcon={<MapIcon />} fullWidth>
                View Map
              </Button>
            </Stack>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
