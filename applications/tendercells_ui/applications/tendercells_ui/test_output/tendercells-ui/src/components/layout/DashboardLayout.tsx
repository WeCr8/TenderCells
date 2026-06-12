// DashboardLayout.tsx
import React, { useState } from "react";
import Grid from "@mui/material/Grid";
import Viewport3D from "../viewport/Viewport3D";
import Viewport2D, { Device2D } from "../viewport/Viewport2D";
import TelemetryPanel from "../telemetry/TelemetryPanel";
import BottomToolbar from "../toolbar/BottomToolbar";
import DeviceSelectionScreen from "../devices/DeviceSelectionScreen";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import type { Product } from "../../types/products";

type DashboardLayoutProps = {
  productName: string;
  children?: React.ReactNode;
};

export default function DashboardLayout({ productName, children }: DashboardLayoutProps) {
  const [mapView, setMapView] = useState<"2d" | "3d">("3d");
  const [devices, setDevices] = useState<Device2D[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<Product | null>(null);

  const handleDeviceAdd = (device: Device2D) => {
    setDevices((prev) => [...prev, device]);
  };

  const handleDeviceUpdate = (device: Device2D) => {
    setDevices((prev) => prev.map((d) => (d.id === device.id ? device : d)));
  };

  const handleDeviceDelete = (deviceId: string) => {
    setDevices((prev) => prev.filter((d) => d.id !== deviceId));
  };

  const handleDeviceSelect = (product: Product) => {
    setSelectedDevice(product);
    // Optionally convert product to Device2D if it has position data
    // For now, just set the selected device
  };

  const handleBackToSelection = () => {
    setSelectedDevice(null);
  };

  // Show device selection screen if no device is selected
  if (!selectedDevice) {
    return (
      <Box sx={{ height: "100%", overflow: "auto" }}>
        <DeviceSelectionScreen
          onDeviceSelect={handleDeviceSelect}
          productName={productName}
        />
      </Box>
    );
  }

  return (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      {/* Device Info Header */}
      <Box
        sx={{
          p: 2,
          bgcolor: "#1a2512",
          borderBottom: "1px solid #2d3e1f",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Box>
          <Typography variant="h6" sx={{ color: "#faf8f5", fontWeight: 600 }}>
            {selectedDevice.product_name}
          </Typography>
          <Typography variant="body2" sx={{ color: "rgba(250, 248, 245, 0.7)" }}>
            {selectedDevice.location} • {selectedDevice.connection_status === 'online' ? 'Online' : 'Offline'}
          </Typography>
        </Box>
        <Button
          variant="outlined"
          onClick={handleBackToSelection}
          sx={{
            color: "#faf8f5",
            borderColor: "#4a5d3a",
            "&:hover": {
              borderColor: "#5a6d4a",
              bgcolor: "rgba(74, 93, 58, 0.1)",
            },
          }}
        >
          Change Device
        </Button>
      </Box>

      <Grid container spacing={2} sx={{ flex: 1, minHeight: 0 }}>
        {/* Main Viewport Area */}
        <Grid item xs={12} md={8} sx={{ display: "flex", flexDirection: "column", minHeight: 0 }}>
          <Box sx={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
            {mapView === "3d" ? (
              <Viewport3D devices={devices} />
            ) : (
              <Viewport2D
                devices={devices}
                onDeviceAdd={handleDeviceAdd}
                onDeviceUpdate={handleDeviceUpdate}
                onDeviceDelete={handleDeviceDelete}
              />
            )}
            {children && (
              <Box sx={{ mt: 2 }}>
                {children}
              </Box>
            )}
          </Box>
        </Grid>
        
        {/* Sidebar with Telemetry */}
        <Grid item xs={12} md={4} sx={{ display: "flex", flexDirection: "column", minHeight: 0 }}>
          <Box sx={{ height: "100%", overflow: "auto" }}>
            <TelemetryPanel />
          </Box>
        </Grid>
      </Grid>
      
      {/* Bottom Toolbar */}
      <Box sx={{ flexShrink: 0 }}>
        <BottomToolbar mapView={mapView} onMapViewChange={setMapView} />
      </Box>
    </Box>
  );
}




