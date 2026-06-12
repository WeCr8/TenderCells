// PredatorMonitorDashboard.tsx - WatchTower AI predator detection system
import WatchTowerMonitor from "../components/watchtower/WatchTowerMonitor";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import SecurityIcon from "@mui/icons-material/Security";
import { useLocation } from "react-router-dom";
import ProductSectionPanel from "../components/navigation/ProductSectionPanel";
import { ProductDetailsPanel, ProductHero } from "../components/products/ProductOverview";

export default function PredatorMonitorDashboard() {
  const location = useLocation();
  const section = new URLSearchParams(location.search).get("section") || "watchtower";

  return (
    <Box>
      <ProductHero product="predator-monitor" />
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <SecurityIcon sx={{ fontSize: 40, mr: 2, color: '#6BBF59' }} />
        <Typography variant="h4" sx={{ color: '#E4E7E5' }}>WatchTower AI™ Predator Monitor</Typography>
      </Box>
      <WatchTowerMonitor battery={85} solarCharge={65} connected={true} lastSeen="2 minutes ago" />
      <ProductDetailsPanel product="predator-monitor" />
      <ProductSectionPanel product="predator-monitor" section={section} />
    </Box>
  );
}
