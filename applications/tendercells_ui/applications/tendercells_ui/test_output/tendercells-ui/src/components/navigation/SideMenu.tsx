// SideMenu.tsx
import React from "react";
import List from "@mui/material/List";
import SideMenuItem from "./SideMenuItem";

type SideMenuProps = {
  activeSection?: string;
};

const ITEMS = [
  { id: "coop", label: "Coop Settings" },
  { id: "doors", label: "Doors & Latches" },
  { id: "motors", label: "Motors & Rails" },
  { id: "robot", label: "Robot Arm" },
  { id: "sensors", label: "Sensors" },
  { id: "feed", label: "Feeding & Water" },
  { id: "waste", label: "Waste Cleaning" },
  { id: "eggs", label: "Egg Map" },
  { id: "schedules", label: "Schedules" },
  { id: "custom", label: "Custom Settings" },
  { id: "account", label: "Account" },
];

export default function SideMenu({ activeSection }: SideMenuProps) {
  return (
    <nav>
      <List dense>
        {ITEMS.map((item) => (
          <SideMenuItem
            key={item.id}
            label={item.label}
            active={activeSection === item.id}
          />
        ))}
      </List>
    </nav>
  );
}
