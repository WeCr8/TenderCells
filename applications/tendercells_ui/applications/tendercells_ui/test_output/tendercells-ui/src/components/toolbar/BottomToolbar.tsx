// BottomToolbar.tsx
import React, { useState } from "react";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Slider from "@mui/material/Slider";
import Switch from "@mui/material/Switch";
import Typography from "@mui/material/Typography";
import {
  Menu,
  VolumeUp,
  Grid3x3,
  MusicNote,
  Search,
  Add,
  Remove,
  Fullscreen,
  Home,
  Map as MapIcon,
  ViewInAr,
} from "@mui/icons-material";

type BottomToolbarProps = {
  mapView?: "2d" | "3d";
  onMapViewChange?: (view: "2d" | "3d") => void;
  // New props for viewport mode
  currentMode?: "2D" | "3D";
  onViewModeToggle?: (mode: "2D" | "3D") => void;
  on2DPlanClick?: () => void;
};

export default function BottomToolbar({ 
  mapView = "3d", 
  onMapViewChange,
  currentMode,
  onViewModeToggle,
  on2DPlanClick,
}: BottomToolbarProps) {
  // Use new props if provided, otherwise fall back to old props
  const effectiveMode = currentMode || (mapView === "2d" ? "2D" : "3D");
  const handleModeChange = (mode: "2d" | "3d") => {
    if (onViewModeToggle) {
      onViewModeToggle(mode === "2d" ? "2D" : "3D");
    } else if (onMapViewChange) {
      onMapViewChange(mode);
    }
  };
  const [sliderValue, setSliderValue] = useState(50);

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        px: 2,
        py: 1.5,
        borderTop: 1,
        borderColor: "divider",
        bgcolor: "background.paper",
        minHeight: 60,
      }}
    >
      {/* Left: Icons and controls */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
        <IconButton size="small" aria-label="Menu">
          <Menu />
        </IconButton>

        <Typography variant="caption" sx={{ mr: 0.5, color: "text.secondary" }}>
          ID
        </Typography>

        <IconButton size="small" aria-label="Volume">
          <VolumeUp />
        </IconButton>

        <IconButton size="small" aria-label="Grid">
          <Grid3x3 />
        </IconButton>

        <IconButton size="small" aria-label="Music">
          <MusicNote />
        </IconButton>

        <IconButton size="small" aria-label="Search">
          <Search />
        </IconButton>

        {/* Slider */}
        <Box sx={{ width: 100, mx: 1 }}>
          <Slider
            value={sliderValue}
            onChange={(_, newValue) => setSliderValue(newValue as number)}
            size="small"
            sx={{ color: "#8B5CF6" }}
          />
        </Box>

        <IconButton size="small" aria-label="Zoom in">
          <Add />
        </IconButton>

        <IconButton size="small" aria-label="Zoom out">
          <Remove />
        </IconButton>

        <IconButton size="small" aria-label="Fullscreen">
          <Fullscreen />
        </IconButton>
      </Box>

      {/* Right: 2D/3D Map Toggle */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
        <IconButton
          size="small"
          onClick={() => {
            handleModeChange("2d");
            if (on2DPlanClick) {
              on2DPlanClick();
            }
          }}
          sx={{
            color: effectiveMode === "2D" ? "#2d3e1f" : "text.secondary",
            bgcolor: effectiveMode === "2D" ? "#e8dcc6" : "transparent",
            "&:hover": {
              bgcolor: effectiveMode === "2D" ? "#d4c4a0" : "action.hover",
            },
          }}
          aria-label="2D Plan View"
        >
          <MapIcon />
        </IconButton>
        <IconButton
          size="small"
          onClick={() => handleModeChange("3d")}
          sx={{
            color: effectiveMode === "3D" ? "#2d3e1f" : "text.secondary",
            bgcolor: effectiveMode === "3D" ? "#e8dcc6" : "transparent",
            "&:hover": {
              bgcolor: effectiveMode === "3D" ? "#d4c4a0" : "action.hover",
            },
          }}
          aria-label="3D Map View"
        >
          <ViewInAr />
        </IconButton>
        <Typography variant="caption" sx={{ color: "text.secondary", whiteSpace: "nowrap", ml: 0.5 }}>
          {effectiveMode === "2D" ? "2D PLAN" : "3D MAP"}
        </Typography>
      </Box>
    </Box>
  );
}
