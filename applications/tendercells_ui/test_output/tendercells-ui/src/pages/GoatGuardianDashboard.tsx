// GoatGuardianDashboard.tsx
import Grid from "@mui/material/Grid";
import ProductViewportPanel from "../components/viewport/ProductViewportPanel";
import TelemetryPanel from "../components/telemetry/TelemetryPanel";
import BottomToolbar from "../components/toolbar/BottomToolbar";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import PetsIcon from "@mui/icons-material/Pets";
import FenceIcon from "@mui/icons-material/Fence";
import SecurityIcon from "@mui/icons-material/Security";
import GrassIcon from "@mui/icons-material/Grass";
import { useLocation } from "react-router-dom";
import ProductSectionPanel from "../components/navigation/ProductSectionPanel";
import { ProductDetailsPanel, ProductHero } from "../components/products/ProductOverview";

export default function GoatGuardianDashboard() {
  const location = useLocation();
  const section = new URLSearchParams(location.search).get("section") || "shelter";

  return (
    <Box>
      <ProductHero product="goat-guardian" />
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <ProductViewportPanel product="goat-guardian" title="Pasture & Shelter Yard View" />
          <ProductSectionPanel product="goat-guardian" section={section} />
          <BottomToolbar />
        </Grid>
        <Grid item xs={12} md={4}>
          <ProductDetailsPanel product="goat-guardian" />
          <TelemetryPanel />
          <Paper elevation={2} sx={{ p: 2, mt: 2 }}>
            <Typography variant="h6" gutterBottom>
              Guardian Controls
            </Typography>
            <Stack spacing={2} sx={{ mt: 2 }}>
              <Button variant="outlined" startIcon={<FenceIcon />} fullWidth>
                Fence Status
              </Button>
              <Button variant="outlined" startIcon={<SecurityIcon />} fullWidth>
                Predator Alert
              </Button>
              <Button variant="outlined" startIcon={<GrassIcon />} fullWidth>
                Grazing Area
              </Button>
            </Stack>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
