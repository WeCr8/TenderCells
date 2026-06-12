// BunnyBurrowDashboard.tsx
import React from "react";
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
import HomeIcon from "@mui/icons-material/Home";
import RestaurantIcon from "@mui/icons-material/Restaurant";
import FavoriteIcon from "@mui/icons-material/Favorite";
import { useLocation } from "react-router-dom";
import ProductSectionPanel from "../components/navigation/ProductSectionPanel";
import { ProductDetailsPanel, ProductHero } from "../components/products/ProductOverview";

export default function BunnyBurrowDashboard() {
  const location = useLocation();
  const section = new URLSearchParams(location.search).get("section") || "shelter";

  return (
    <Box>
      <ProductHero product="bunny-burrow" />
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <ProductViewportPanel product="bunny-burrow" title="Burrow Yard View" />
          <ProductSectionPanel product="bunny-burrow" section={section} />
          <BottomToolbar />
        </Grid>
        <Grid item xs={12} md={4}>
          <ProductDetailsPanel product="bunny-burrow" />
          <TelemetryPanel />
          <Paper elevation={2} sx={{ p: 2, mt: 2 }}>
            <Typography variant="h6" gutterBottom>
              Burrow Management
            </Typography>
            <Stack spacing={2} sx={{ mt: 2 }}>
              <Button variant="outlined" startIcon={<HomeIcon />} fullWidth>
                Burrow Access
              </Button>
              <Button variant="outlined" startIcon={<RestaurantIcon />} fullWidth>
                Feeding Station
              </Button>
              <Button variant="outlined" startIcon={<FavoriteIcon />} fullWidth>
                Health Monitor
              </Button>
            </Stack>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
