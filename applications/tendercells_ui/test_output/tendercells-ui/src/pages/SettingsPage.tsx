// SettingsPage.tsx
import React from "react";
import { Box, Typography, TextField, Button } from "@mui/material";

export default function SettingsPage() {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>Settings</Typography>
      <TextField label="Device Name" fullWidth margin="normal" />
      <TextField label="WiFi SSID" fullWidth margin="normal" />
      <TextField label="WiFi Password" fullWidth margin="normal" />
      <Button variant="contained" color="primary" sx={{ mt: 2 }}>Save Settings</Button>
    </Box>
  );
}
