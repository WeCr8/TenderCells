// SideMenuItem.tsx
import React from "react";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";

type SideMenuItemProps = {
  label: string;
  active?: boolean;
  onClick?: () => void;
};

export default function SideMenuItem({ label, active, onClick }: SideMenuItemProps) {
  return (
    <ListItemButton selected={active} onClick={onClick}>
      <ListItemText primary={label} />
    </ListItemButton>
  );
}
