// TelemetryItem.tsx
import React from "react";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";

type TelemetryItemProps = {
  label: string;
  value: string;
};

export default function TelemetryItem({ label, value }: TelemetryItemProps) {
  return (
    <Paper variant="outlined" sx={{ p: 1 }}>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body2">
        {value}
      </Typography>
    </Paper>
  );
}
