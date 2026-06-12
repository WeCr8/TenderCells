// SideMenuItem.tsx
import React from "react";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import {
  Settings,
  Lock,
  Build,
  PrecisionManufacturing,
  Sensors,
  Restaurant,
  CleaningServices,
  Map,
  Schedule,
  Tune,
  AccountCircle,
} from "@mui/icons-material";

type SideMenuItemProps = {
  label: string;
  active?: boolean;
  onClick?: () => void;
};

const getIconForLabel = (label: string) => {
  const lowerLabel = label.toLowerCase();
  if (lowerLabel.includes("coop")) return <Settings />;
  if (lowerLabel.includes("door") || lowerLabel.includes("latch")) return <Lock />;
  if (lowerLabel.includes("motor") || lowerLabel.includes("rail")) return <Build />;
  if (lowerLabel.includes("robot")) return <PrecisionManufacturing />;
  if (lowerLabel.includes("sensor")) return <Sensors />;
  if (lowerLabel.includes("feed") || lowerLabel.includes("water")) return <Restaurant />;
  if (lowerLabel.includes("waste") || lowerLabel.includes("clean")) return <CleaningServices />;
  if (lowerLabel.includes("egg") || lowerLabel.includes("map")) return <Map />;
  if (lowerLabel.includes("schedule")) return <Schedule />;
  if (lowerLabel.includes("custom") || lowerLabel.includes("setting")) return <Tune />;
  if (lowerLabel.includes("account")) return <AccountCircle />;
  return <Settings />;
};

export default function SideMenuItem({ label, active, onClick }: SideMenuItemProps) {
  return (
    <ListItemButton
      selected={active}
      onClick={onClick}
      sx={{
        mx: 1,
        mb: 0.5,
        borderRadius: 1,
        color: active ? "#faf8f5" : "rgba(250, 248, 245, 0.7)",
        bgcolor: active ? "#4a5d3a" : "transparent",
        "&:hover": {
          bgcolor: active ? "#5a6d4a" : "rgba(74, 93, 58, 0.3)",
        },
        "&.Mui-selected": {
          bgcolor: "#4a5d3a",
          color: "#faf8f5",
          fontWeight: 600,
          "&:hover": {
            bgcolor: "#5a6d4a",
          },
        },
      }}
    >
      <ListItemIcon
        sx={{
          minWidth: 40,
          color: active ? "#faf8f5" : "rgba(250, 248, 245, 0.6)",
        }}
      >
        {getIconForLabel(label)}
      </ListItemIcon>
      <ListItemText
        primary={label}
        primaryTypographyProps={{
          fontSize: "0.875rem",
          fontWeight: active ? 600 : 400,
        }}
      />
    </ListItemButton>
  );
}
