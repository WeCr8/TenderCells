// TopNavBar.tsx
import React from "react";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";

type TopNavBarProps = {
  title?: string;
  product: string;
  onProductChange: (product: string) => void;
};

export default function TopNavBar({ title, product, onProductChange }: TopNavBarProps) {
  return (
    <AppBar position="static" color="primary" enableColorOnDark>
      <Toolbar>
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          TENDER CELLS {title ? `| ${title}` : "| DASHBOARD"}
        </Typography>
        <Select
          value={product}
          onChange={(e) => onProductChange(e.target.value)}
          sx={{ mr: 1 }}
        >
          <MenuItem value="chicken-tender">Chicken Tender</MenuItem>
          <MenuItem value="roaming-roost">Roaming Roost</MenuItem>
          <MenuItem value="duck-dock">Duck Dock</MenuItem>
          <MenuItem value="goat-guardian">Goat Guardian</MenuItem>
          <MenuItem value="bunny-burrow">Bunny Burrow</MenuItem>
          <MenuItem value="turkey-tower">Turkey Tower</MenuItem>
          <MenuItem value="predator-monitor">Predator Monitor</MenuItem>
          <MenuItem value="rail-system-modules">Rail System Modules</MenuItem>
          <MenuItem value="tender-cells-cloud">TenderCells Cloud</MenuItem>
          <MenuItem value="pigeon-palace">Pigeon Palace</MenuItem>
        </Select>
        <Button
          variant="outlined"
          color="error"
          size="small"
          sx={{ mr: 1 }}
        >
          E-STOP
        </Button>
        <Button
          variant="contained"
          color="error"
          size="small"
        >
          E-STOP
        </Button>
      </Toolbar>
    </AppBar>
  );
}
