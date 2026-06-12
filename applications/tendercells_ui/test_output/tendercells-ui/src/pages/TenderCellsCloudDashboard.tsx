// TenderCellsCloudDashboard.tsx
import React from "react";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import CloudIcon from "@mui/icons-material/Cloud";
import DashboardIcon from "@mui/icons-material/Dashboard";
import AnalyticsIcon from "@mui/icons-material/Analytics";
import StorageIcon from "@mui/icons-material/Storage";
import DevicesIcon from "@mui/icons-material/Devices";
import { useLocation } from "react-router-dom";
import ProductSectionPanel from "../components/navigation/ProductSectionPanel";
import { ProductDetailsPanel, ProductHero } from "../components/products/ProductOverview";

export default function TenderCellsCloudDashboard() {
  const location = useLocation();
  const section = new URLSearchParams(location.search).get("section") || "overview";

  return (
    <Box>
      <ProductHero product="tender-cells-cloud" />
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <CloudIcon sx={{ fontSize: 40, mr: 2, color: '#6BBF59' }} />
        <Typography variant="h4" sx={{ color: '#E4E7E5' }}>TenderCells Cloud Dashboard</Typography>
      </Box>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              <DashboardIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
              Multi-Device Overview
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              Monitor and manage all your TenderCells devices from a single dashboard.
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              <AnalyticsIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
              Analytics & Reports
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              View comprehensive analytics across all your connected devices.
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              <StorageIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
              Cloud Storage
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              Access your 3D models, configurations, and data from anywhere.
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              <DevicesIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
              Device Management
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              Configure and update all your TenderCells devices remotely.
            </Typography>
          </Paper>
        </Grid>
      </Grid>
      <Box sx={{ mt: 3 }}>
        <ProductDetailsPanel product="tender-cells-cloud" />
        <ProductSectionPanel product="tender-cells-cloud" section={section} />
      </Box>
    </Box>
  );
}
