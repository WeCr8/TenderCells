// SideMenuItem.tsx
import React from "react";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";

type SideMenuItemProps = {
  label: string;
  icon?: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
};

export default function SideMenuItem({ label, icon, active, onClick }: SideMenuItemProps) {
  return (
    <ListItemButton 
      selected={active} 
      onClick={onClick}
      sx={{
        '&.Mui-selected': {
          backgroundColor: '#002017', // Botanical Green for active item
          '&:hover': {
            backgroundColor: '#002017',
          },
        },
      }}
    >
      {icon && (
        <ListItemIcon 
          sx={{ 
            color: active ? '#6BBF59' : '#A5B1A9', // Icon Green when active, muted green-gray otherwise
            minWidth: 40 
          }}
        >
          {icon}
        </ListItemIcon>
      )}
      <ListItemText 
        primary={label}
        primaryTypographyProps={{
          sx: {
            color: active ? '#E4E7E5' : '#A5B1A9', // Primary text when active, secondary otherwise
          },
        }}
      />
    </ListItemButton>
  );
}
