// PredatorMonitorDashboard.tsx - WatchTower AI predator detection system
import React from "react";
import WatchTowerMonitor from "../components/watchtower/WatchTowerMonitor";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import SecurityIcon from "@mui/icons-material/Security";

export default function PredatorMonitorDashboard() {
  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <SecurityIcon sx={{ fontSize: 40, mr: 2, color: '#6BBF59' }} />
        <Typography variant="h4" sx={{ color: '#E4E7E5' }}>WatchTower AI™ Predator Monitor</Typography>
      </Box>
      <WatchTowerMonitor battery={85} solarCharge={65} connected={true} lastSeen="2 minutes ago" />
    </Box>
  );
}
