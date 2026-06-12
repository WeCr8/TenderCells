// SideMenu.tsx
import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import List from "@mui/material/List";
import Box from "@mui/material/Box";
import SideMenuItem from "./SideMenuItem";

type SideMenuProps = {
  activeSection?: string;
};

const ITEMS = [
  { id: "coop", label: "Coop Settings", path: "/settings" },
  { id: "doors", label: "Doors & Latches", path: "/dashboard" },
  { id: "motors", label: "Motors & Rails", path: "/dashboard" },
  { id: "robot", label: "Robot Arm", path: "/dashboard" },
  { id: "sensors", label: "Sensors", path: "/dashboard" },
  { id: "feed", label: "Feeding & Water", path: "/dashboard" },
  { id: "waste", label: "Waste Cleaning", path: "/dashboard" },
  { id: "eggs", label: "Egg Map", path: "/dashboard" },
  { id: "schedules", label: "Schedules", path: "/dashboard" },
  { id: "custom", label: "Custom Settings", path: "/settings" },
  { id: "settings", label: "Settings", path: "/settings" },
  { id: "account", label: "Account", path: "/account" },
];

export default function SideMenu({ activeSection }: SideMenuProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleItemClick = (path: string, id: string) => {
    navigate(path);
  };

  // Determine active section based on current route
  const getActiveSection = () => {
    if (activeSection) return activeSection;
    
    const currentPath = location.pathname;
    if (currentPath === "/settings") return "settings";
    if (currentPath === "/account") return "account";
    if (currentPath.includes("/settings")) return "settings";
    if (currentPath.includes("/account")) return "account";
    
    return activeSection;
  };

  const currentActiveSection = getActiveSection();

  return (
    <Box
      component="nav"
      sx={{
        height: "100%",
        overflowY: "auto",
        overflowX: "hidden",
        bgcolor: "#1a2512", // Dark green
      }}
    >
      <List dense sx={{ py: 1 }}>
        {ITEMS.map((item) => (
          <SideMenuItem
            key={item.id}
            label={item.label}
            active={currentActiveSection === item.id}
            onClick={() => handleItemClick(item.path, item.id)}
          />
        ))}
      </List>
    </Box>
  );
}
