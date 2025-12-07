// TelemetryPanel.tsx
import React from "react";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Grid";
import TelemetryItem from "./TelemetryItem";

export default function TelemetryPanel() {
  return (
    <Paper elevation={2} sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Telemetry
      </Typography>
      <Grid container spacing={1}>
        <Grid item xs={6}><TelemetryItem label="Temp" value="21.3 °C" /></Grid>
        <Grid item xs={6}><TelemetryItem label="Humidity" value="54 %" /></Grid>
        <Grid item xs={6}><TelemetryItem label="Feed Level" value="OK" /></Grid>
        <Grid item xs={6}><TelemetryItem label="Water Level" value="OK" /></Grid>
      </Grid>
    </Paper>
  );
}
