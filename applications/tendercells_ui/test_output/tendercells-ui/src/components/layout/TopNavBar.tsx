// TopNavBar.tsx
import React from "react";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Box from "@mui/material/Box";
import AgricultureIcon from "@mui/icons-material/Agriculture";
import WaterIcon from "@mui/icons-material/Water";
import PetsIcon from "@mui/icons-material/Pets";
import FlightIcon from "@mui/icons-material/Flight";
import SecurityIcon from "@mui/icons-material/Security";
import TrainIcon from "@mui/icons-material/Train";
import CloudIcon from "@mui/icons-material/Cloud";
import StopIcon from "@mui/icons-material/Stop";

// Product icons mapping - using AgricultureIcon for poultry products
const PRODUCT_ICONS: Record<string, React.ReactNode> = {
  "chicken-tender": <AgricultureIcon />,
  "roaming-roost": <AgricultureIcon />,
  "duck-dock": <WaterIcon />,
  "goat-guardian": <PetsIcon />,
  "bunny-burrow": <PetsIcon />,
  "turkey-tower": <AgricultureIcon />,
  "predator-monitor": <SecurityIcon />,
  "rail-system-modules": <TrainIcon />,
  "tender-cells-cloud": <CloudIcon />,
  "pigeon-palace": <FlightIcon />,
};

type TopNavBarProps = {
  title?: string;
  product: string;
  onProductChange: (product: string) => void;
};

export default function TopNavBar({ title, product, onProductChange }: TopNavBarProps) {
  return (
    <AppBar position="static" color="primary" enableColorOnDark>
      <Toolbar>
        <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
          {PRODUCT_ICONS[product] && (
            <Box sx={{ mr: 1, display: 'flex', alignItems: 'center', color: '#6BBF59' }}>
              {PRODUCT_ICONS[product]}
            </Box>
          )}
          <Typography variant="h6">
            TENDER CELLS {title ? `| ${title}` : "| DASHBOARD"}
          </Typography>
        </Box>
        <Select
          value={product}
          onChange={(e) => onProductChange(e.target.value)}
          sx={{ mr: 1, minWidth: 200 }}
        >
          <MenuItem value="chicken-tender">
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <AgricultureIcon sx={{ mr: 1, fontSize: 20 }} />
              Chicken Tender
            </Box>
          </MenuItem>
          <MenuItem value="roaming-roost">
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <AgricultureIcon sx={{ mr: 1, fontSize: 20 }} />
              Roaming Roost
            </Box>
          </MenuItem>
          <MenuItem value="duck-dock">
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <WaterIcon sx={{ mr: 1, fontSize: 20 }} />
              Duck Dock
            </Box>
          </MenuItem>
          <MenuItem value="goat-guardian">
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <PetsIcon sx={{ mr: 1, fontSize: 20 }} />
              Goat Guardian
            </Box>
          </MenuItem>
          <MenuItem value="bunny-burrow">
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <PetsIcon sx={{ mr: 1, fontSize: 20 }} />
              Bunny Burrow
            </Box>
          </MenuItem>
          <MenuItem value="turkey-tower">
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <AgricultureIcon sx={{ mr: 1, fontSize: 20 }} />
              Turkey Tower
            </Box>
          </MenuItem>
          <MenuItem value="predator-monitor">
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <SecurityIcon sx={{ mr: 1, fontSize: 20 }} />
              Predator Monitor
            </Box>
          </MenuItem>
          <MenuItem value="rail-system-modules">
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <TrainIcon sx={{ mr: 1, fontSize: 20 }} />
              Rail System Modules
            </Box>
          </MenuItem>
          <MenuItem value="tender-cells-cloud">
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <CloudIcon sx={{ mr: 1, fontSize: 20 }} />
              TenderCells Cloud
            </Box>
          </MenuItem>
          <MenuItem value="pigeon-palace">
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <FlightIcon sx={{ mr: 1, fontSize: 20 }} />
              Pigeon Palace
            </Box>
          </MenuItem>
        </Select>
        <Button
          variant="outlined"
          color="error"
          size="small"
          startIcon={<StopIcon />}
          sx={{ mr: 1 }}
        >
          E-STOP
        </Button>
        <Button
          variant="contained"
          color="error"
          size="small"
          startIcon={<StopIcon />}
        >
          E-STOP
        </Button>
      </Toolbar>
    </AppBar>
  );
}
