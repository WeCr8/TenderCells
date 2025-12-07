// SideMenu.tsx
import React from "react";
import List from "@mui/material/List";
import SideMenuItem from "./SideMenuItem";
import { useNavigate, useLocation } from "react-router-dom";
import HomeIcon from "@mui/icons-material/Home";
import SettingsIcon from "@mui/icons-material/Settings";
import LockIcon from "@mui/icons-material/Lock";
import BuildIcon from "@mui/icons-material/Build";
import PrecisionManufacturingIcon from "@mui/icons-material/PrecisionManufacturing";
import SensorsIcon from "@mui/icons-material/Sensors";
import RestaurantIcon from "@mui/icons-material/Restaurant";
import CleaningServicesIcon from "@mui/icons-material/CleaningServices";
import EggIcon from "@mui/icons-material/Egg";
import ScheduleIcon from "@mui/icons-material/Schedule";
import TuneIcon from "@mui/icons-material/Tune";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";

type SideMenuProps = {
  activeSection?: string;
  product?: string;
};

const ITEMS = [
  { id: "coop", label: "Coop Settings", icon: <HomeIcon />, path: "/chicken-tender" },
  { id: "doors", label: "Doors & Latches", icon: <LockIcon />, path: "/chicken-tender" },
  { id: "motors", label: "Motors & Rails", icon: <BuildIcon />, path: "/chicken-tender" },
  { id: "robot", label: "Robot Arm", icon: <PrecisionManufacturingIcon />, path: "/chicken-tender" },
  { id: "sensors", label: "Sensors", icon: <SensorsIcon />, path: "/chicken-tender" },
  { id: "feed", label: "Feeding & Water", icon: <RestaurantIcon />, path: "/chicken-tender" },
  { id: "waste", label: "Waste Cleaning", icon: <CleaningServicesIcon />, path: "/chicken-tender" },
  { id: "eggs", label: "Egg Map", icon: <EggIcon />, path: "/chicken-tender" },
  { id: "schedules", label: "Schedules", icon: <ScheduleIcon />, path: "/schedules" },
  { id: "custom", label: "Custom Settings", icon: <TuneIcon />, path: "/settings" },
  { id: "account", label: "Account", icon: <AccountCircleIcon />, path: "/account" },
];

export default function SideMenu({ activeSection, product = "chicken-tender" }: SideMenuProps) {
  const navigate = useNavigate();
  const location = useLocation();

  // Update paths based on current product
  const getPath = (item: typeof ITEMS[0]) => {
    if (item.id === "schedules" || item.id === "custom" || item.id === "account") {
      return item.path;
    }
    return `/${product}`;
  };

  return (
    <nav>
      <List dense>
        {ITEMS.map((item) => (
          <SideMenuItem
            key={item.id}
            label={item.label}
            icon={item.icon}
            active={activeSection === item.id || location.pathname === getPath(item)}
            onClick={() => navigate(getPath(item))}
          />
        ))}
      </List>
    </nav>
  );
}
