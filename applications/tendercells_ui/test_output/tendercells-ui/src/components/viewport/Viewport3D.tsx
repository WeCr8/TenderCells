// Viewport3D.tsx
import React from "react";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";

export default function Viewport3D() {
  return (
    <Paper 
      elevation={3} 
      sx={{ 
        height: 400, 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center",
        background: `linear-gradient(180deg, #1B542B 0%, #165024 100%)`, // Green grid field / grass shader
        position: "relative",
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          position: "absolute",
          width: "100%",
          height: "100%",
          backgroundImage: `
            linear-gradient(rgba(107, 191, 89, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(107, 191, 89, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: "20px 20px",
          opacity: 0.3,
        }}
      />
      <Typography 
        variant="body1" 
        sx={{ 
          color: "#E4E7E5",
          position: "relative",
          zIndex: 1,
        }}
      >
        3D Coop / Robot Scene
      </Typography>
    </Paper>
  );
}
