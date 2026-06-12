// TelemetryPanel.tsx
import React from "react";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Alert from "@mui/material/Alert";

// REALTIME telemetry panel matching unified_ui.py design
export default function TelemetryPanel() {
  // REALTIME data matching the image layout
  const realtimeItems = [
    { label: "Temperature", value: "67 °F", critical: true },
    { label: "Humidity", value: "72 %", critical: true },
    { label: "Ammonia", value: "4 ppm", critical: true },
    { label: "Active", value: "Active", critical: false },
    { label: "Chicken", value: "3", critical: false },
    { label: "Feed aval", value: "80 %", critical: true },
    { label: "Water level", value: "56 %", critical: true },
  ];

  // Diagnostics messages matching the image
  const diagnosticsMessages = [
    "Waste detected. Run cleaning cycle regularly",
    "Scraper jammed. Error code 31",
    "Blocked rail. Code 12",
  ];

  return (
    <Paper
      elevation={2}
      sx={{
        p: 3,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        bgcolor: "background.paper",
      }}
    >
      {/* REALTIME Section */}
      <Box sx={{ mb: 3 }}>
        <Typography
          variant="subtitle2"
          sx={{
            fontWeight: 600,
            mb: 2,
            textTransform: "uppercase",
            letterSpacing: "0.5px",
            fontSize: "0.875rem",
          }}
        >
          REALTIME
        </Typography>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
          {realtimeItems.map((item) => (
            <Box
              key={item.label}
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                py: 1,
                borderBottom: "1px solid",
                borderColor: "divider",
                "&:last-child": { borderBottom: "none" },
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, flex: 1 }}>
                <Box
                  sx={{
                    width: 12,
                    height: 12,
                    borderRadius: "50%",
                    bgcolor: item.critical ? "#f59e0b" : "#9ca3af",
                    flexShrink: 0,
                  }}
                />
                <Typography variant="body2" sx={{ color: "text.secondary", fontSize: "0.875rem" }}>
                  {item.label}:
                </Typography>
              </Box>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: item.critical ? 600 : 400,
                  color: item.critical ? "#f59e0b" : "text.primary",
                  fontSize: "0.875rem",
                }}
              >
                {item.value}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>

      {/* Diagnostics Section */}
      <Box sx={{ mt: "auto", pt: 3, borderTop: "1px solid", borderColor: "divider" }}>
        <Typography
          variant="subtitle2"
          sx={{
            fontWeight: 600,
            mb: 2,
            textTransform: "uppercase",
            letterSpacing: "0.5px",
            fontSize: "0.875rem",
          }}
        >
          Diagnostics
        </Typography>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          {diagnosticsMessages.map((message, index) => (
            <Alert
              key={index}
              severity="warning"
              sx={{
                py: 1,
                fontSize: "0.875rem",
                "& .MuiAlert-message": { fontSize: "0.875rem" },
              }}
            >
              {message}
            </Alert>
          ))}
        </Box>
      </Box>
    </Paper>
  );
}
