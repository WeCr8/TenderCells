// Viewport3D.tsx
import React, { useState } from "react";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import { PlayArrow, Pause, VolumeUp, Fullscreen, Videocam } from "@mui/icons-material";
import type { Device2D } from "./Viewport2D";
import { getDeviceColor } from "../../utils/deviceColors";

type Viewport3DProps = {
  devices?: Device2D[];
};

export default function Viewport3D({ devices = [] }: Viewport3DProps) {
  const [isPlaying, setIsPlaying] = useState(true);
  const [selectedCamera, setSelectedCamera] = useState(0);

  const cameras = [
    { name: "Main Coop", location: "Interior", status: "online" },
    { name: "Yard View", location: "Exterior", status: "online" },
    { name: "Nesting Boxes", location: "Interior", status: "maintenance" },
    { name: "Entrance", location: "Exterior", status: "online" },
  ];

  return (
    <Paper
      elevation={3}
      sx={{
        height: "100%",
        minHeight: 400,
        position: "relative",
        overflow: "hidden",
        bgcolor: "#1a2512", // Dark green background (matching 2D)
        backgroundImage: `
          linear-gradient(rgba(74, 93, 58, 0.2) 1px, transparent 1px),
          linear-gradient(90deg, rgba(74, 93, 58, 0.2) 1px, transparent 1px)
        `,
        backgroundSize: "40px 40px",
      }}
    >
      {/* 3D Coop Scene Placeholder */}
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Box sx={{ textAlign: "center", color: "#faf8f5" }}>
          <Videocam sx={{ fontSize: 64, mb: 2, opacity: 0.5, color: "#4a5d3a" }} />
          <Typography
            variant="h6"
            sx={{ color: "rgba(250, 248, 245, 0.8)", mb: 1 }}
          >
            3D Coop / Robot Scene
          </Typography>
          <Typography
            variant="body2"
            sx={{ color: "rgba(250, 248, 245, 0.6)", mb: 2 }}
          >
            {cameras[selectedCamera].name}
          </Typography>
          {devices.length > 0 && (
            <Typography
              variant="caption"
              sx={{ color: "rgba(250, 248, 245, 0.5)", display: "block" }}
            >
              {devices.length} device{devices.length !== 1 ? "s" : ""} mapped
            </Typography>
          )}
        </Box>
      </Box>

      {/* Device Markers - Display devices in 3D space using 2D coordinates */}
      {devices.map((device) => {
        const deviceColor = getDeviceColor(device.type);
        // Convert 2D percentage coordinates to 3D viewport positions
        // In a real 3D system, these would be transformed to 3D space
        const viewportX = (device.x / 100) * 100;
        const viewportY = (device.y / 100) * 100;
        
        return (
          <Box
            key={device.id}
            className={`device-marker-${device.id}`}
            sx={{
              position: "absolute",
              left: `${viewportX}%`,
              top: `${viewportY}%`,
              transform: "translate(-50%, -50%)",
              width: 48,
              height: 48,
              borderRadius: "50%",
              bgcolor: deviceColor.primary,
              border: `2px solid ${deviceColor.secondary}`,
              boxShadow: `0 4px 12px rgba(0,0,0,0.5), 0 0 0 2px ${deviceColor.border}`,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.2s",
              zIndex: 5,
              "&:hover": {
                transform: "translate(-50%, -50%) scale(1.25)",
                zIndex: 10,
                boxShadow: `0 6px 16px rgba(0,0,0,0.6), 0 0 0 4px ${deviceColor.secondary}`,
                [`& + .device-label-${device.id}`]: {
                  opacity: 1,
                },
              },
            }}
          >
            <Typography
              variant="caption"
              sx={{
                fontSize: "1.25rem",
                lineHeight: 1,
              }}
            >
              {deviceColor.icon}
            </Typography>

              {/* Device Label - Show on hover */}
              <Box
                sx={{
                  position: "absolute",
                  top: "100%",
                  left: "50%",
                  transform: "translateX(-50%)",
                  mt: 0.5,
                  bgcolor: "rgba(45, 62, 31, 0.95)",
                  px: 1,
                  py: 0.5,
                  borderRadius: 0.5,
                  whiteSpace: "nowrap",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.4)",
                  border: "1px solid rgba(74, 93, 58, 0.5)",
                  opacity: 0,
                  transition: "opacity 0.2s",
                  pointerEvents: "none",
                }}
                className={`device-label-${device.id}`}
              >
                <Typography variant="caption" sx={{ fontSize: "0.7rem", color: "#faf8f5", fontWeight: 500 }}>
                  {device.name}
                </Typography>
              </Box>
            </Box>
          );
        })}

      {/* Video Controls - Optional overlay */}
      <Box
        sx={{
          position: "absolute",
          bottom: 16,
          left: 16,
          right: 16,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          opacity: 0,
          "&:hover": { opacity: 1 },
          transition: "opacity 0.3s",
        }}
      >
        <Box sx={{ display: "flex", gap: 1 }}>
          <IconButton
            onClick={() => setIsPlaying(!isPlaying)}
            sx={{
              bgcolor: "rgba(0,0,0,0.5)",
              color: "white",
              "&:hover": { bgcolor: "rgba(0,0,0,0.7)" },
            }}
            size="small"
          >
            {isPlaying ? <Pause /> : <PlayArrow />}
          </IconButton>
          <IconButton
            sx={{
              bgcolor: "rgba(0,0,0,0.5)",
              color: "white",
              "&:hover": { bgcolor: "rgba(0,0,0,0.7)" },
            }}
            size="small"
          >
            <VolumeUp />
          </IconButton>
        </Box>

        <IconButton
          sx={{
            bgcolor: "rgba(0,0,0,0.5)",
            color: "white",
            "&:hover": { bgcolor: "rgba(0,0,0,0.7)" },
          }}
          size="small"
        >
          <Fullscreen />
        </IconButton>
      </Box>
    </Paper>
  );
}
