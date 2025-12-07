// main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { ThemeProvider, CssBaseline, createTheme } from "@mui/material";

const theme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#6BBF59", // Icon Green - primary accent
      light: "#8DD47A",
      dark: "#4A8F3A",
      contrastText: "#001B14",
    },
    secondary: {
      main: "#D8C6A3", // Light wood tone
      light: "#E8DBC4",
      dark: "#B8986C", // Darker wood tone
      contrastText: "#001B14",
    },
    background: {
      default: "#001B14", // TenderCells Deep Forest - primary UI background
      paper: "#001F16", // TenderCells Forest Green - panels
    },
    text: {
      primary: "#E4E7E5", // Near-white primary text
      secondary: "#A5B1A9", // Muted green-gray secondary text
    },
    success: {
      main: "#4CAF50",
      light: "#81C784",
      dark: "#388E3C",
    },
    warning: {
      main: "#D0A34E", // Warning Amber
      light: "#E0B870",
      dark: "#B88A2E",
    },
    error: {
      main: "#C62828", // Bright red variant
      light: "#EF5350",
      dark: "#9B1C1C", // Dark red variant
    },
    info: {
      main: "#6BBF59",
      light: "#8DD47A",
      dark: "#4A8F3A",
    },
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: "#001F16", // Forest Green for app bar
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: "#001F16", // Forest Green for panels
          backgroundImage: "none",
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: "#001F16", // Forest Green for sidebar
        },
      },
    },
  },
});

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  </React.StrictMode>
);
