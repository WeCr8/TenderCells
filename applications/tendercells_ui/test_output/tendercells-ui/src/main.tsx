// main.tsx
import React, { Component, ReactNode } from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import CssBaseline from "@mui/material/CssBaseline";
import createTheme from "@mui/material/styles/createTheme";
import ThemeProvider from "@mui/material/styles/ThemeProvider";

class StartupErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state: { error: Error | null } = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error) {
    console.error("TenderCells startup error", error);
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{ minHeight: "100vh", padding: 24, background: "#001B14", color: "#E4E7E5" }}>
          <h1 style={{ marginTop: 0 }}>TenderCells could not start</h1>
          <pre style={{ whiteSpace: "pre-wrap", color: "#EF5350" }}>{this.state.error.message}</pre>
        </div>
      );
    }

    return this.props.children;
  }
}

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
    MuiCssBaseline: {
      styleOverrides: {
        '*': {
          scrollbarWidth: 'thin',
          scrollbarColor: '#4A7C59 #001B14',
        },
        '*::-webkit-scrollbar': {
          width: '10px',
          height: '10px',
        },
        '*::-webkit-scrollbar-track': {
          backgroundColor: '#001B14',
          borderRadius: '999px',
        },
        '*::-webkit-scrollbar-thumb': {
          backgroundColor: '#4A7C59',
          border: '2px solid #001B14',
          borderRadius: '999px',
        },
        '*::-webkit-scrollbar-thumb:hover': {
          backgroundColor: '#6BBF59',
        },
        '*::-webkit-scrollbar-corner': {
          backgroundColor: '#001B14',
        },
      },
    },
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
    <StartupErrorBoundary>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <App />
      </ThemeProvider>
    </StartupErrorBoundary>
  </React.StrictMode>
);
