// Viewport2D.tsx
import React, { useState, useRef, useEffect } from "react";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import { Add, Delete, Edit, LocationOn } from "@mui/icons-material";
import { getDeviceColor } from "../../utils/deviceColors";

export interface Device2D {
  id: string;
  name: string;
  type: string;
  x: number; // Percentage position (0-100)
  y: number; // Percentage position (0-100)
}

type Viewport2DProps = {
  devices?: Device2D[];
  onDeviceAdd?: (device: Device2D) => void;
  onDeviceUpdate?: (device: Device2D) => void;
  onDeviceDelete?: (deviceId: string) => void;
};

export default function Viewport2D({
  devices = [],
  onDeviceAdd,
  onDeviceUpdate,
  onDeviceDelete,
}: Viewport2DProps) {
  const [selectedDevice, setSelectedDevice] = useState<Device2D | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [editingDevice, setEditingDevice] = useState<Device2D | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const [newDevice, setNewDevice] = useState<Partial<Device2D>>({
    name: "",
    type: "sensor",
    x: 50,
    y: 50,
  });

  const deviceTypes = [
    { value: "sensor", label: "Sensor" },
    { value: "camera", label: "Camera" },
    { value: "feeder", label: "Feeder" },
    { value: "water", label: "Water System" },
    { value: "door", label: "Door" },
    { value: "robot", label: "Robot" },
  ];

  const handleMapClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!mapRef.current || !isAdding) return;

    const rect = mapRef.current.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;

    setNewDevice((prev) => ({ ...prev, x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) }));
    setDialogOpen(true);
  };

  const handleAddDevice = () => {
    if (newDevice.name && newDevice.type && newDevice.x !== undefined && newDevice.y !== undefined) {
      const device: Device2D = {
        id: `device-${Date.now()}`,
        name: newDevice.name,
        type: newDevice.type,
        x: newDevice.x,
        y: newDevice.y,
      };
      onDeviceAdd?.(device);
      setNewDevice({ name: "", type: "sensor", x: 50, y: 50 });
      setIsAdding(false);
      setDialogOpen(false);
    }
  };

  const handleEditDevice = (device: Device2D) => {
    setEditingDevice(device);
    setNewDevice({
      name: device.name,
      type: device.type,
      x: device.x,
      y: device.y,
    });
    setDialogOpen(true);
  };

  const handleUpdateDevice = () => {
    if (editingDevice && newDevice.name && newDevice.type) {
      const updatedDevice: Device2D = {
        ...editingDevice,
        name: newDevice.name,
        type: newDevice.type,
        x: newDevice.x ?? editingDevice.x,
        y: newDevice.y ?? editingDevice.y,
      };
      onDeviceUpdate?.(updatedDevice);
      setEditingDevice(null);
      setNewDevice({ name: "", type: "sensor", x: 50, y: 50 });
      setDialogOpen(false);
    }
  };

  const handleDeleteDevice = (deviceId: string) => {
    if (window.confirm("Are you sure you want to delete this device?")) {
      onDeviceDelete?.(deviceId);
    }
  };


  return (
    <>
      <Paper
        elevation={3}
        sx={{
          height: "100%",
          minHeight: 400,
          position: "relative",
          overflow: "hidden",
          bgcolor: "#1a2512", // Dark green background (matching 3D)
          backgroundImage: `
            linear-gradient(rgba(74, 93, 58, 0.3) 1px, transparent 1px),
            linear-gradient(90deg, rgba(74, 93, 58, 0.3) 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
          cursor: isAdding ? "crosshair" : "default",
        }}
        onClick={handleMapClick}
        ref={mapRef}
      >
        {/* Map Title */}
        <Box
          sx={{
            position: "absolute",
            top: 8,
            left: 8,
            bgcolor: "rgba(45, 62, 31, 0.9)",
            px: 1.5,
            py: 0.5,
            borderRadius: 1,
            display: "flex",
            alignItems: "center",
            gap: 1,
            border: "1px solid rgba(74, 93, 58, 0.5)",
          }}
        >
          <LocationOn sx={{ fontSize: 18, color: "#faf8f5" }} />
          <Typography variant="caption" sx={{ fontWeight: 600, color: "#faf8f5" }}>
            2D Device Map
          </Typography>
        </Box>

        {/* Add Device Button */}
        <Box
          sx={{
            position: "absolute",
            top: 8,
            right: 8,
            display: "flex",
            gap: 1,
          }}
        >
          <Button
            variant={isAdding ? "contained" : "outlined"}
            size="small"
            startIcon={<Add />}
            onClick={() => setIsAdding(!isAdding)}
            sx={{
              bgcolor: isAdding ? "#4a5d3a" : "rgba(45, 62, 31, 0.8)",
              color: "#faf8f5",
              borderColor: "#4a5d3a",
              "&:hover": {
                bgcolor: isAdding ? "#5a6d4a" : "#4a5d3a",
                borderColor: "#4a5d3a",
              },
            }}
          >
            {isAdding ? "Cancel" : "Add Device"}
          </Button>
        </Box>

        {/* Device Markers */}
        {devices.map((device) => {
          const deviceColor = getDeviceColor(device.type);
          return (
            <Box
              key={device.id}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedDevice(device);
              }}
              onDoubleClick={() => handleEditDevice(device)}
              sx={{
                position: "absolute",
                left: `${device.x}%`,
                top: `${device.y}%`,
                transform: "translate(-50%, -50%)",
                width: 48,
                height: 48,
                borderRadius: "50%",
                bgcolor: deviceColor.primary,
                border: selectedDevice?.id === device.id ? `3px solid ${deviceColor.border}` : `2px solid ${deviceColor.secondary}`,
                boxShadow: `0 4px 12px rgba(0,0,0,0.5), 0 0 0 ${selectedDevice?.id === device.id ? "4px" : "0px"} rgba(74, 93, 58, 0.3)`,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.2s",
                "&:hover": {
                  transform: "translate(-50%, -50%) scale(1.25)",
                  zIndex: 10,
                  boxShadow: `0 6px 16px rgba(0,0,0,0.6), 0 0 0 2px ${deviceColor.secondary}`,
                },
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  color: "white",
                  fontWeight: 700,
                  fontSize: "0.875rem",
                  textAlign: "center",
                }}
              >
                {deviceColor.icon}
              </Typography>

              {/* Device Label */}
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
                  display: selectedDevice?.id === device.id ? "block" : "none",
                }}
              >
                <Typography variant="caption" sx={{ fontSize: "0.7rem", color: "#faf8f5", fontWeight: 500 }}>
                  {device.name}
                </Typography>
              </Box>

              {/* Delete Button */}
              {selectedDevice?.id === device.id && (
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteDevice(device.id);
                  }}
                  sx={{
                    position: "absolute",
                    top: -8,
                    right: -8,
                    bgcolor: "error.main",
                    color: "white",
                    width: 20,
                    height: 20,
                    "&:hover": {
                      bgcolor: "error.dark",
                    },
                  }}
                >
                  <Delete sx={{ fontSize: 12 }} />
                </IconButton>
              )}
            </Box>
          );
        })}

        {/* Click Indicator when adding */}
        {isAdding && (
          <Box
            sx={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              color: "#faf8f5",
              bgcolor: "rgba(45, 62, 31, 0.9)",
              px: 2,
              py: 1,
              borderRadius: 2,
              textAlign: "center",
              border: "1px solid rgba(74, 93, 58, 0.5)",
            }}
          >
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              Click on map to place device
            </Typography>
          </Box>
        )}
      </Paper>

      {/* Device Add/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingDevice ? "Edit Device" : "Add New Device"}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
            <TextField
              label="Device Name"
              value={newDevice.name}
              onChange={(e) => setNewDevice((prev) => ({ ...prev, name: e.target.value }))}
              fullWidth
              required
            />
            <Select
              label="Device Type"
              value={newDevice.type || "sensor"}
              onChange={(e) => setNewDevice((prev) => ({ ...prev, type: e.target.value }))}
              fullWidth
              required
            >
              {deviceTypes.map((type) => (
                <MenuItem key={type.value} value={type.value}>
                  {type.label}
                </MenuItem>
              ))}
            </Select>
            <Box sx={{ display: "flex", gap: 2 }}>
              <TextField
                label="X Position (%)"
                type="number"
                value={newDevice.x}
                onChange={(e) =>
                  setNewDevice((prev) => ({
                    ...prev,
                    x: Math.max(0, Math.min(100, parseFloat(e.target.value) || 0)),
                  }))
                }
                inputProps={{ min: 0, max: 100, step: 0.1 }}
              />
              <TextField
                label="Y Position (%)"
                type="number"
                value={newDevice.y}
                onChange={(e) =>
                  setNewDevice((prev) => ({
                    ...prev,
                    y: Math.max(0, Math.min(100, parseFloat(e.target.value) || 0)),
                  }))
                }
                inputProps={{ min: 0, max: 100, step: 0.1 }}
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={editingDevice ? handleUpdateDevice : handleAddDevice}
            variant="contained"
            disabled={!newDevice.name || !newDevice.type}
          >
            {editingDevice ? "Update" : "Add"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}




