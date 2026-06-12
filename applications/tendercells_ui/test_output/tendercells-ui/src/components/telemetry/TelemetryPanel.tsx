// TelemetryPanel.tsx
import React from "react";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Grid";
import TelemetryItem from "./TelemetryItem";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import { useTelemetry } from "../../hooks/useTelemetry";

interface TelemetryPanelProps {
  deviceId?: string;
}

export default function TelemetryPanel({ deviceId = "ct_001" }: TelemetryPanelProps) {
  const { data, loading, error } = useTelemetry(deviceId);

  return (
    <Paper elevation={2} sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Telemetry
      </Typography>
      {loading && <CircularProgress size={20} />}
      {error && <Alert severity="warning">No data: {error}</Alert>}
      {data && (
        <Grid container spacing={1}>
          <Grid item xs={6}>
            <TelemetryItem
              label="Temp"
              value={data.temperature ? `${data.temperature.toFixed(1)}°C` : "N/A"}
            />
          </Grid>
          <Grid item xs={6}>
            <TelemetryItem
              label="Humidity"
              value={data.humidity ? `${data.humidity}%` : "N/A"}
            />
          </Grid>
          <Grid item xs={6}>
            <TelemetryItem
              label="Feed Level"
              value={data.feedLevel ? `${data.feedLevel}%` : "N/A"}
            />
          </Grid>
          <Grid item xs={6}>
            <TelemetryItem
              label="Water Level"
              value={data.waterLevel ? `${data.waterLevel}%` : "N/A"}
            />
          </Grid>
          <Grid item xs={6}>
            <TelemetryItem
              label="Ammonia"
              value={data.ammonia ? `${data.ammonia}ppm` : "N/A"}
            />
          </Grid>
          <Grid item xs={6}>
            <TelemetryItem
              label="Chickens"
              value={data.chickenCount ? `${data.chickenCount}` : "N/A"}
            />
          </Grid>
        </Grid>
      )}
    </Paper>
  );
}
