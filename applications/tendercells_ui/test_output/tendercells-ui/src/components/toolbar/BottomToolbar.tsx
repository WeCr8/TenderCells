// BottomToolbar.tsx
import React from "react";
import Stack from "@mui/material/Stack";
import ToolbarButton from "./ToolbarButton";

export default function BottomToolbar() {
  return (
    <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
      <ToolbarButton label="Home" />
      <ToolbarButton label="Center" />
      <ToolbarButton label="Jog" />
      <ToolbarButton label="Map" />
      <ToolbarButton label="3D View" />
    </Stack>
  );
}
