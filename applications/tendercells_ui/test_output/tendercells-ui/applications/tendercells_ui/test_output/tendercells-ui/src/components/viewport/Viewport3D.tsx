// Viewport3D.tsx
import React from "react";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";

export default function Viewport3D() {
  return (
    <Paper elevation={3} sx={{ height: 400, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <Typography variant="body1">3D Coop / Robot Scene</Typography>
    </Paper>
  );
}
