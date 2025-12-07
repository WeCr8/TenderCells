"""
Unified TenderCells UI project builder.
Ports all functionality from the original tender.py build_tendercells_ui_project.
"""

import os
from ..core.generator import ProjectGenerator
from ..structures.react_app import ReactAppStructures
from ..templates.react import ReactTemplates


def build_tendercells_ui_project(base_path: str = "") -> ProjectGenerator:
    """Build the unified TenderCells UI project structure."""
    
    gen = ProjectGenerator("TenderCells UI", base_path=base_path)
    
    # Frontend structure
    frontend_base = "src"
    gen.add_directories(ReactAppStructures.full_react_app(frontend_base))
    
    # Unified UI templates
    add_unified_frontend_templates(gen, frontend_base)
    
    # Root files, env, Firebase
    add_root_files(gen, "tendercells")
    
    # PWA, analytics, error tracking
    add_pwa_analytics_error_tracking(gen)
    
    # E2E testing templates
    add_e2e_testing_templates(gen)
    
    return gen


def add_unified_frontend_templates(gen: ProjectGenerator, base: str) -> None:
    """Add unified UI templates with dynamic product routing."""
    
    # Main entry with Material theme (unified main color)
    main_color = "#6750A4"  # Unified main color for all products
    gen.add_template(f"{base}/main.tsx", f"""// main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import {{ ThemeProvider, CssBaseline, createTheme }} from "@mui/material";

const theme = createTheme({{
  palette: {{
    mode: "dark",
    primary: {{ main: "{main_color}" }},
    secondary: {{ main: "#625B71" }},
  }},
  breakpoints: {{
    values: {{
      xs: 0,
      sm: 600,
      md: 900,
      lg: 1200,
      xl: 1600,
    }},
  }},
}});

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <ThemeProvider theme={{theme}}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  </React.StrictMode>
);""")
    
    # Breakpoints constants
    gen.add_template(
        f"{base}/constants/breakpoints.ts",
        """// breakpoints.ts
/**
 * Responsive breakpoints for TenderCells UI
 * 
 * Breakpoint definitions:
 * xs: 0      // mobile
 * sm: 600    // small tablets
 * md: 900    // large tablets / small laptops
 * lg: 1200   // desktop
 * xl: 1600   // big desktop
 */

export const BREAKPOINTS = {
  xs: 0,
  sm: 600,
  md: 900,
  lg: 1200,
  xl: 1600,
} as const;

/**
 * Viewport dimensions for testing
 */
export const VIEWPORTS = {
  // Desktop
  desktopXL: { width: 1600, height: 900 },
  desktopL: { width: 1440, height: 900 },
  desktopM: { width: 1280, height: 720 },
  // Tablet
  tabletL: { width: 1024, height: 768 }, // landscape
  tabletP: { width: 834, height: 1112 }, // portrait
  // Mobile
  mobileTall: { width: 390, height: 844 }, // iPhone 14/15 style
  mobileCommon: { width: 360, height: 800 }, // Many Android devices
} as const;

/**
 * Layout dimensions for each breakpoint
 */
export const LAYOUT_DIMENSIONS = {
  // Desktop XL (1600px) - Maximum space utilization
  desktopXL: {
    leftNav: 260,
    rightPanel: 360,
    gap: 24,
    viewportHeight: 640,
    telemetryItemsPerRow: 1, // Full width items for better readability
    showDiagnostics: true,
    showAllTelemetry: true,
  },
  // Desktop L (1440px) - Balanced layout
  desktopL: {
    leftNav: 240,
    rightPanel: 320,
    gap: 24,
    viewportHeight: 620,
    telemetryItemsPerRow: 1,
    showDiagnostics: true,
    showAllTelemetry: true,
  },
  // Desktop M (1280px) - Compact but functional
  desktopM: {
    leftNav: 220,
    rightPanel: 300,
    gap: 16,
    viewportHeight: 600,
    telemetryItemsPerRow: 1,
    showDiagnostics: true,
    showAllTelemetry: true,
  },
  // Tablet Landscape (1024px) - Optimized for landscape viewing
  tabletL: {
    leftNav: 200,
    rightPanel: 280,
    gap: 16,
    viewportHeight: 480,
    telemetryItemsPerRow: 1,
    showDiagnostics: false, // Hide to save space
    showAllTelemetry: true,
  },
  // Tablet Portrait (834px) - 2-row layout, prioritize viewport
  tabletP: {
    viewportHeight: 520,
    viewportAspectRatio: 16 / 10,
    telemetryItemsPerRow: 2, // 2-column grid
    showDiagnostics: false,
    showAllTelemetry: false, // Show only critical metrics
  },
  // Mobile - Minimal, essential information only
  mobile: {
    contentPadding: 16,
    viewportMinHeight: 220,
    viewportMaxHeight: 260,
    viewportAspectRatio: 16 / 10,
    telemetryTileHeight: 72, // Slightly smaller for mobile
    telemetryItemsPerRow: 2, // 2-column grid
    bottomToolbarHeight: 56, // Standard mobile toolbar
    showDiagnostics: false,
    showAllTelemetry: false, // Show only 6-7 critical metrics
    maxTelemetryItems: 6, // Limit to prevent overwhelming
  },
} as const;

/**
 * Calculate main viewport width for a given screen width
 */
export function calculateViewportWidth(screenWidth: number): number {
  if (screenWidth >= BREAKPOINTS.xl) {
    const dims = LAYOUT_DIMENSIONS.desktopXL;
    return screenWidth - dims.leftNav - dims.rightPanel - (dims.gap * 2);
  } else if (screenWidth >= BREAKPOINTS.lg) {
    const dims = LAYOUT_DIMENSIONS.desktopL;
    return screenWidth - dims.leftNav - dims.rightPanel - (dims.gap * 2);
  } else if (screenWidth >= BREAKPOINTS.md) {
    const dims = LAYOUT_DIMENSIONS.desktopM;
    return screenWidth - dims.leftNav - dims.rightPanel - (dims.gap * 2);
  } else if (screenWidth >= BREAKPOINTS.sm) {
    const dims = LAYOUT_DIMENSIONS.tabletL;
    return screenWidth - dims.leftNav - dims.rightPanel - (dims.gap * 2);
  }
  // Mobile: full width minus padding
  return screenWidth - (LAYOUT_DIMENSIONS.mobile.contentPadding * 2);
}"""
    )
    
    # Layout components (Material)
    gen.add_template(
        f"{base}/components/layout/MainLayout.tsx",
        """// MainLayout.tsx
import React from "react";
import TopNavBar from "./TopNavBar";
import Container from "@mui/material/Container";

type MainLayoutProps = {
  title?: string;
  children: React.ReactNode;
};

export default function MainLayout({ title, children }: MainLayoutProps) {
  return (
    <div className="app-root">
      <TopNavBar title={title} />
      <Container maxWidth={false} sx={{ py: 2, px: { xs: 0, sm: 2 } }}>
        {children}
      </Container>
    </div>
  );
}"""
    )
    
    gen.add_template(
        f"{base}/components/layout/TopNavBar.tsx",
        """// TopNavBar.tsx
import React from "react";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import BatteryIcon from "@mui/icons-material/BatteryFull";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import { useMediaQuery, useTheme } from "@mui/material";

type TopNavBarProps = {
  title?: string;
  status?: string;
  time?: string;
  batteryLevel?: number;
};

export default function TopNavBar({ 
  title = "CHICKEN TENDERS", 
  status = "Idle",
  time,
  batteryLevel = 100,
}: TopNavBarProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  
  const currentTime = time || new Date().toLocaleTimeString("en-US", { 
    hour: "numeric", 
    minute: "2-digit",
    hour12: true 
  });

  return (
    <AppBar 
      position="static" 
      sx={{ 
        bgcolor: "primary.dark",
        borderBottom: 1,
        borderColor: "divider",
      }}
    >
      <Toolbar sx={{ 
        minHeight: { xs: 48, sm: 56, md: 64 },
        px: { xs: 2, sm: 3, md: 4 },
        justifyContent: "space-between",
      }}>
        {/* Left: Title */}
        <Typography 
          variant="h6" 
          sx={{ 
            fontSize: { xs: "0.875rem", sm: "1rem", md: "1.125rem" },
            fontWeight: 600,
            letterSpacing: "0.05em",
          }}
        >
          TENDER CELLS | {title}
        </Typography>

        {/* Center: Status, Time, Battery */}
        {!isMobile && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Chip
              icon={<PlayArrowIcon sx={{ fontSize: "0.875rem !important" }} />}
              label={status}
              size="small"
              sx={{ 
                bgcolor: "background.paper",
                color: "text.primary",
                fontWeight: 500,
              }}
            />
            <Typography variant="body2" sx={{ fontSize: "0.875rem" }}>
              {currentTime}
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <BatteryIcon sx={{ fontSize: "1.25rem" }} />
              <Typography variant="body2" sx={{ fontSize: "0.875rem" }}>
                {batteryLevel}%
              </Typography>
            </Box>
          </Box>
        )}

        {/* Right: E-STOP Buttons */}
        <Box sx={{ display: "flex", gap: 1 }}>
        <Button
          variant="outlined"
          color="error"
            size={isMobile ? "small" : "medium"}
            sx={{ 
              fontWeight: "bold",
              fontSize: { xs: "0.75rem", sm: "0.875rem" },
              minWidth: { xs: 70, sm: 80 },
            }}
        >
          E-STOP
        </Button>
        <Button
          variant="contained"
          color="error"
            size={isMobile ? "small" : "medium"}
            sx={{ 
              fontWeight: "bold",
              fontSize: { xs: "0.75rem", sm: "0.875rem" },
              minWidth: { xs: 70, sm: 80 },
            }}
        >
          E-STOP
        </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
}"""
    )
    
    # Product selector and routing
    gen.add_template(
        f"{base}/App.tsx",
        """// App.tsx
import React, { useState, useEffect } from "react";
import SplashScreen from "./components/SplashScreen";
import MainLayout from "./components/layout/MainLayout";
import { Routes, Route, Navigate } from "react-router-dom";
import DashboardPage from "./pages/DashboardPage";
import FlockPage from "./pages/FlockPage";
import FlockHealthPage from "./pages/FlockHealthPage";
import FlockProductionPage from "./pages/FlockProductionPage";
import AutomationPage from "./pages/AutomationPage";
import AutomationRulesPage from "./pages/AutomationRulesPage";
import AutomationSchedulesPage from "./pages/AutomationSchedulesPage";
import AutomationDevicesPage from "./pages/AutomationDevicesPage";
import CNCPage from "./pages/CNCPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import AnalyticsReportsPage from "./pages/AnalyticsReportsPage";
import AnalyticsInsightsPage from "./pages/AnalyticsInsightsPage";
import MacrosPage from "./pages/MacrosPage";
import SettingsPage from "./pages/SettingsPage";
import AccountPage from "./pages/AccountPage";
import SignInPage from "./pages/SignInPage";
import SignUpPage from "./pages/SignUpPage";
import { ChickenTenderDashboard, RoamingRoostDashboard, DuckDockDashboard, GoatGuardianDashboard, BunnyBurrowDashboard, TurkeyTowerDashboard, PredatorMonitorDashboard, RailSystemModulesDashboard, TenderCellsCloudDashboard, PigeonPalaceDashboard } from "./pages";

function App() {
  const [product, setProduct] = useState("chicken-tender");
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  if (showSplash) {
    return <SplashScreen />;
  }

  return (
      <Routes>
      {/* Auth Routes */}
      <Route path="/signin" element={<SignInPage />} />
      <Route path="/signup" element={<SignUpPage />} />
      
      {/* Product Routes */}
        <Route path="/chicken-tender" element={<ChickenTenderDashboard />} />
        <Route path="/roaming-roost" element={<RoamingRoostDashboard />} />
        <Route path="/duck-dock" element={<DuckDockDashboard />} />
        <Route path="/goat-guardian" element={<GoatGuardianDashboard />} />
        <Route path="/bunny-burrow" element={<BunnyBurrowDashboard />} />
        <Route path="/turkey-tower" element={<TurkeyTowerDashboard />} />
        <Route path="/predator-monitor" element={<PredatorMonitorDashboard />} />
        <Route path="/rail-system-modules" element={<RailSystemModulesDashboard />} />
        <Route path="/tender-cells-cloud" element={<TenderCellsCloudDashboard />} />
        <Route path="/pigeon-palace" element={<PigeonPalaceDashboard />} />
      
      {/* Feature Routes - nested under product */}
      <Route path="/app" element={<MainLayout title={product} />}>
        <Route index element={<DashboardPage />} />
        <Route path="dashboard" element={<DashboardPage />} />
        
        {/* Flock Routes */}
        <Route path="flock" element={<FlockPage />} />
        <Route path="flock/health" element={<FlockHealthPage />} />
        <Route path="flock/production" element={<FlockProductionPage />} />
        
        {/* Automation Routes */}
        <Route path="automation" element={<AutomationPage />} />
        <Route path="automation/rules" element={<AutomationRulesPage />} />
        <Route path="automation/schedules" element={<AutomationSchedulesPage />} />
        <Route path="automation/devices" element={<AutomationDevicesPage />} />
        <Route path="automation/cnc" element={<CNCPage />} />
        
        {/* Analytics Routes */}
        <Route path="analytics" element={<AnalyticsPage />} />
        <Route path="analytics/reports" element={<AnalyticsReportsPage />} />
        <Route path="analytics/insights" element={<AnalyticsInsightsPage />} />
        
        {/* Macros Route */}
        <Route path="macros" element={<MacrosPage />} />
        
        {/* Settings Routes */}
        <Route path="settings" element={<SettingsPage />} />
        <Route path="account" element={<AccountPage />} />
      </Route>
      
      {/* Default redirect */}
      <Route path="/" element={<Navigate to="/app" replace />} />
      </Routes>
  );
}

export default App;"""
    )
    
    # SignInPage and SignUpPage
    gen.add_template(f"{base}/pages/SignInPage.tsx", """// SignInPage.tsx
import React from "react";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import SignInForm from "../components/forms/SignInForm";

export default function SignInPage() {
  return (
    <Container maxWidth="sm">
      <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <SignInForm />
      </Box>
    </Container>
  );
}""")
    
    gen.add_template(f"{base}/pages/SignUpPage.tsx", """// SignUpPage.tsx
import React from "react";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import SignUpForm from "../components/forms/SignUpForm";

export default function SignUpPage() {
  return (
    <Container maxWidth="sm">
      <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <SignUpForm />
      </Box>
    </Container>
  );
}""")
    
    # Splash screen component
    gen.add_template(
        f"{base}/components/SplashScreen.tsx",
        """// SplashScreen.tsx
import React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { CircularProgress } from "@mui/material";

export default function SplashScreen() {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        backgroundColor: "#6750A4",
        color: "white",
      }}
    >
      <img src="/assets/logo.png" alt="TenderCells Logo" style={{ width: "200px", marginBottom: "20px" }} />
      <Typography variant="h4">TenderCells</Typography>
      <CircularProgress sx={{ mt: 2, color: "white" }} />
    </Box>
  );
}"""
    )
    
    # Product-specific pages
    products = [
        ("ChickenTender", "chicken-tender", "Chicken Tender"),
        ("RoamingRoost", "roaming-roost", "Roaming Roost"),
        ("DuckDock", "duck-dock", "Duck Dock"),
        ("GoatGuardian", "goat-guardian", "Goat Guardian"),
        ("BunnyBurrow", "bunny-burrow", "Bunny Burrow"),
        ("TurkeyTower", "turkey-tower", "Turkey Tower"),
        ("PredatorMonitor", "predator-monitor", "Predator Monitor"),
        ("RailSystemModules", "rail-system-modules", "Rail System Modules"),
        ("TenderCellsCloud", "tender-cells-cloud", "TenderCells Cloud"),
        ("PigeonPalace", "pigeon-palace", "Pigeon Palace"),
    ]
    for product_component, product_slug, product_name in products:
        gen.add_template(
            f"{base}/pages/{product_component}Dashboard.tsx",
            f"""// {product_component}Dashboard.tsx
import React from "react";
import DashboardLayout from "../components/layout/DashboardLayout";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

export default function {product_component}Dashboard() {{
  return (
    <DashboardLayout activeSection="dashboard">
      <Box sx={{ p: {{ xs: 2, sm: 3 }} }}>
        <Typography variant="h4" gutterBottom>
          {product_name} Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Welcome to {product_name}. Use the navigation menu to access different features.
        </Typography>
      </Box>
    </DashboardLayout>
  );
}}"""
        )
    
    # Settings page
    gen.add_template(
        f"{base}/pages/SettingsPage.tsx",
        """// SettingsPage.tsx
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
}"""
    )
    
    # Account page
    gen.add_template(
        f"{base}/pages/AccountPage.tsx",
        """// AccountPage.tsx
import React from "react";
import { Box, Typography, TextField, Button } from "@mui/material";

export default function AccountPage() {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>Account</Typography>
      <TextField label="Email" fullWidth margin="normal" />
      <TextField label="Password" fullWidth margin="normal" />
      <Button variant="contained" color="primary" sx={{ mt: 2 }}>Update Account</Button>
    </Box>
  );
}"""
    )
    
    # Reusable action primitives
    gen.add_template(
        f"{base}/components/common/ActionButton.tsx",
        """// ActionButton.tsx
import React from "react";
import Button, { ButtonProps } from "@mui/material/Button";
import SaveIcon from "@mui/icons-material/Save";
import CloseIcon from "@mui/icons-material/Close";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";

export type ActionKind = "primary" | "secondary" | "danger" | "ghost";
export type ActionIcon = "save" | "close" | "delete" | "edit" | "none";

export interface ActionButtonProps extends ButtonProps {
  kind?: ActionKind;
  icon?: ActionIcon;
  label: string;
}

function resolveIcon(icon: ActionIcon) {
  switch (icon) {
    case "save":
      return <SaveIcon fontSize="small" />;
    case "close":
      return <CloseIcon fontSize="small" />;
    case "delete":
      return <DeleteIcon fontSize="small" />;
    case "edit":
      return <EditIcon fontSize="small" />;
    default:
      return null;
  }
}

export default function ActionButton({
  kind = "primary",
  icon = "none",
  label,
  ...rest
}: ActionButtonProps) {
  const color =
    kind === "danger" ? "error" : kind === "secondary" ? "secondary" : "primary";
  const variant =
    kind === "ghost" ? "text" : kind === "secondary" ? "outlined" : "contained";

  const startIcon = icon !== "none" ? resolveIcon(icon) : undefined;

  return (
    <Button
      color={color}
      variant={variant}
      size="small"
      startIcon={startIcon}
      {...rest}
    >
      {label}
    </Button>
  );
}"""
    )
    
    # Navigation
    gen.add_template(
        f"{base}/components/navigation/SideMenuItem.tsx",
        """// SideMenuItem.tsx
import React from "react";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";

type SideMenuItemProps = {
  label: string;
  active?: boolean;
  onClick?: () => void;
  href?: string;
};

export default function SideMenuItem({ label, active, onClick, href }: SideMenuItemProps) {
  const handleClick = () => {
    if (href) {
      window.location.href = href;
    }
    onClick?.();
  };

  return (
    <ListItemButton 
      selected={active} 
      onClick={handleClick}
      sx={{
        "&:hover": {
          bgcolor: "action.hover",
        },
        "&.Mui-selected": {
          bgcolor: "action.selected",
        },
      }}
    >
      <ListItemText 
        primary={label}
        primaryTypographyProps={{
          fontSize: "0.875rem",
        }}
      />
      <Box sx={{ ml: "auto", opacity: 0.5 }}>
        →
      </Box>
    </ListItemButton>
  );
}"""
    )
    
    gen.add_template(
        f"{base}/components/navigation/SideMenu.tsx",
        """// SideMenu.tsx
import React from "react";
import List from "@mui/material/List";
import SideMenuItem from "./SideMenuItem";
import Drawer from "@mui/material/Drawer";
import Box from "@mui/material/Box";
import { useTheme, useMediaQuery } from "@mui/material";

type SideMenuProps = {
  activeSection?: string;
  open?: boolean;
  onClose?: () => void;
  variant?: "permanent" | "persistent" | "temporary";
};

const ITEMS = [
  { id: "coop", label: "Coop Settings", href: "/app/coop" },
  { id: "doors", label: "Doors & Latches", href: "/app/doors" },
  { id: "motors", label: "Motors & Rails", href: "/app/motors" },
  { id: "robot", label: "Robot Arm", href: "/app/robot" },
  { id: "sensors", label: "Sensors", href: "/app/sensors" },
  { id: "feed", label: "Feeding & Water", href: "/app/feeding" },
  { id: "waste", label: "Waste Cleaning", href: "/app/waste" },
  { id: "eggs", label: "Egg Map", href: "/app/eggs" },
  { id: "schedules", label: "Schedules", href: "/app/schedules" },
  { id: "custom", label: "Custom Settings", href: "/app/custom" },
  { id: "account", label: "Account", href: "/app/account" },
];

export default function SideMenu({ 
  activeSection, 
  open = true, 
  onClose,
  variant = "permanent" 
}: SideMenuProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  
  const menuContent = (
    <Box sx={{ width: { xs: 240, sm: 260 }, pt: 2 }}>
      <List dense>
        {ITEMS.map((item) => (
          <SideMenuItem
            key={item.id}
            label={item.label}
            active={activeSection === item.id}
            onClick={isMobile ? onClose : undefined}
            href={item.href}
          />
        ))}
      </List>
    </Box>
  );

  if (variant === "temporary" || isMobile) {
    return (
      <Drawer
        variant="temporary"
        open={open}
        onClose={onClose}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: "block", md: "none" },
          "& .MuiDrawer-paper": {
            width: 240,
            boxSizing: "border-box",
          },
        }}
      >
        {menuContent}
      </Drawer>
    );
  }

  return (
    <Drawer
      variant="permanent"
      sx={{
        display: { xs: "none", md: "block" },
        width: { md: 220, lg: 240, xl: 260 },
        flexShrink: 0,
        "& .MuiDrawer-paper": {
          width: { md: 220, lg: 240, xl: 260 },
          boxSizing: "border-box",
          position: "relative",
          height: "100%",
        },
      }}
      open
    >
      {menuContent}
    </Drawer>
  );
}"""
    )
    
    # Responsive Dashboard Layout
    gen.add_template(
        f"{base}/components/layout/DashboardLayout.tsx",
        """// DashboardLayout.tsx
import React, { useState } from "react";
import Box from "@mui/material/Box";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import MenuIcon from "@mui/icons-material/Menu";
import { useTheme, useMediaQuery } from "@mui/material";
import SideMenu from "../navigation/SideMenu";
import Viewport3D from "../viewport/Viewport3D";
import TelemetryPanel from "../telemetry/TelemetryPanel";
import BottomToolbar from "../toolbar/BottomToolbar";
import { LAYOUT_DIMENSIONS } from "../../constants/breakpoints";

type DashboardLayoutProps = {
  activeSection?: string;
};

export default function DashboardLayout({ activeSection }: DashboardLayoutProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const isTablet = useMediaQuery(theme.breakpoints.between("md", "lg"));
  const isDesktop = useMediaQuery(theme.breakpoints.up("lg"));
  const isDesktopXL = useMediaQuery(theme.breakpoints.up("xl"));
  
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [rightPanelCollapsed, setRightPanelCollapsed] = useState(false);

  // Get layout dimensions based on breakpoint
  const getLayoutDimensions = () => {
    if (isDesktopXL) return LAYOUT_DIMENSIONS.desktopXL;
    if (isDesktop) return LAYOUT_DIMENSIONS.desktopL;
    if (isTablet) return LAYOUT_DIMENSIONS.tabletL;
    return LAYOUT_DIMENSIONS.mobile;
  };

  const dims = getLayoutDimensions();
  const isPortraitTablet = useMediaQuery("(max-width: 900px) and (orientation: portrait)");
  const tabletPDims = LAYOUT_DIMENSIONS.tabletP;

  // Mobile layout: single column with tabs
  if (isMobile && !isPortraitTablet) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", height: "100vh" }}>
        {/* Top bar with hamburger */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            px: 2,
            py: 1,
            borderBottom: 1,
            borderColor: "divider",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <IconButton onClick={() => setMobileMenuOpen(true)}>
              <MenuIcon />
            </IconButton>
            <Box>
              <Box component="span" sx={{ fontWeight: "bold" }}>
                Tender Cells
              </Box>
              {" | "}
              <Box component="span">Chicken Tender</Box>
            </Box>
          </Box>
          <Box component="button" sx={{ 
            bgcolor: "error.main", 
            color: "white", 
            border: "none", 
            px: 2, 
            py: 0.5, 
            borderRadius: 1,
            fontWeight: "bold",
            cursor: "pointer",
          }}>
            E-STOP
          </Box>
        </Box>

        {/* Main tab bar */}
        <Box
          sx={{
            display: "flex",
            borderBottom: 1,
            borderColor: "divider",
            overflowX: "auto",
          }}
        >
          {["Overview", "Coop", "Sensors", "Hogs"].map((tab) => (
            <Box
              key={tab}
              sx={{
                px: 2,
                py: 1,
                borderBottom: 2,
                borderColor: "primary.main",
                fontWeight: "medium",
                whiteSpace: "nowrap",
              }}
            >
              {tab}
            </Box>
          ))}
        </Box>

        {/* Content area */}
        <Box sx={{ flex: 1, overflow: "auto", p: 2 }}>
          {/* Coop viewport - Optimized for mobile screens */}
          <Box
            sx={{
              width: "100%",
              minHeight: dims.viewportMinHeight,
              maxHeight: dims.viewportMaxHeight || 260,
              height: `min(calc((100vw - ${dims.contentPadding * 2}px) / ${dims.viewportAspectRatio}), ${dims.viewportMaxHeight || 260}px)`,
              aspectRatio: `${dims.viewportAspectRatio}`,
              mb: 2,
              flexShrink: 0,
              // Ensure viewport doesn't overwhelm mobile screen
              mx: "auto",
            }}
          >
            <Viewport3D />
          </Box>

          {/* Telemetry tiles grid - Optimized for mobile */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: { xs: 1, sm: 1.5 },
              mb: 2,
            }}
          >
            {[
              { label: "Temperature", value: "72°F", critical: true },
              { label: "Humidity", value: "54%", critical: true },
              { label: "Ammonia", value: "OK", critical: true },
              { label: "Active", value: "24", critical: false },
              { label: "Chickens", value: "24", critical: false },
              { label: "Feed", value: "OK", critical: true },
              { label: "Water", value: "OK", critical: true },
            ]
            .filter((_, index) => index < (dims.maxTelemetryItems || 7)) // Limit items on mobile
            .map((item) => (
              <Box
                key={item.label}
                sx={{
                  p: { xs: 1.5, sm: 2 },
                  bgcolor: "background.paper",
                  borderRadius: 1,
                  border: 1,
                  borderColor: item.critical ? "warning.main" : "divider",
                  minHeight: dims.telemetryTileHeight,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                }}
              >
                <Box sx={{ fontSize: { xs: "0.7rem", sm: "0.75rem" }, color: "text.secondary", mb: 0.5 }}>
                  {item.label}
                </Box>
                <Box sx={{ fontSize: { xs: "0.9rem", sm: "1rem" }, fontWeight: "medium" }}>
                  {item.value}
                </Box>
              </Box>
            ))}
          </Box>

          {/* Diagnostics card - Only show if space allows */}
          {dims.showDiagnostics !== false && (
            <Box
              sx={{
                p: { xs: 1.5, sm: 2 },
                bgcolor: "background.paper",
                borderRadius: 1,
                border: 1,
                borderColor: "divider",
                mb: 2,
              }}
            >
              <Box sx={{ fontWeight: "medium", mb: 1, fontSize: { xs: "0.875rem", sm: "1rem" } }}>
                Diagnostics
              </Box>
              <Box sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" }, color: "text.secondary" }}>
                System status: Online
              </Box>
            </Box>
          )}
        </Box>

        {/* Bottom action row - Optimized spacing for mobile */}
        <Box
          sx={{
            borderTop: 1,
            borderColor: "divider",
            p: { xs: 1, sm: 1.5 },
            minHeight: dims.bottomToolbarHeight,
            flexShrink: 0,
            // Prevent toolbar from taking too much space
            maxHeight: dims.bottomToolbarHeight + 8,
          }}
        >
          <BottomToolbar />
        </Box>

        {/* Mobile drawer */}
        <SideMenu
          activeSection={activeSection}
          open={mobileMenuOpen}
          onClose={() => setMobileMenuOpen(false)}
          variant="temporary"
        />
      </Box>
    );
  }

  // Tablet portrait: 2-row layout
  if (isPortraitTablet) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", height: "100vh" }}>
        {/* Top bar */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            px: 2,
            py: 1,
            borderBottom: 1,
            borderColor: "divider",
          }}
        >
          <IconButton onClick={() => setMobileMenuOpen(true)}>
            <MenuIcon />
          </IconButton>
          <Box component="button" sx={{ 
            bgcolor: "error.main", 
            color: "white", 
            border: "none", 
            px: 2, 
            py: 0.5, 
            borderRadius: 1,
            fontWeight: "bold",
            cursor: "pointer",
          }}>
            E-STOP
          </Box>
        </Box>

        {/* Row 1: Coop viewport full width */}
        <Box
          sx={{
            width: "100%",
            height: tabletPDims.viewportHeight,
            aspectRatio: tabletPDims.viewportAspectRatio,
          }}
        >
          <Viewport3D />
        </Box>

        {/* Row 2: Tabs for Telemetry / Network / Hogs - Optimized for tablet portrait */}
        <Box sx={{ 
          flex: 1, 
          overflow: "auto", 
          p: { xs: 1.5, sm: 2 },
          // Use available space efficiently without overwhelming
          minHeight: 0,
        }}>
          <Box sx={{ 
            display: "grid", 
            gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)" },
            gap: { xs: 1.5, sm: 2 },
            height: "100%",
          }}>
            <TelemetryPanel />
            <Box sx={{ 
              p: { xs: 1.5, sm: 2 }, 
              bgcolor: "background.paper", 
              borderRadius: 1,
              display: "flex",
              flexDirection: "column",
            }}>
              <Typography variant="subtitle2" sx={{ mb: 1, fontSize: { xs: "0.875rem", sm: "1rem" } }}>
                Network Status
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" } }}>
                Connected
              </Typography>
            </Box>
          </Box>
        </Box>

        <SideMenu
          activeSection={activeSection}
          open={mobileMenuOpen}
          onClose={() => setMobileMenuOpen(false)}
          variant="temporary"
        />
      </Box>
    );
  }

  // Desktop/Tablet landscape: 3-column layout - Matching image design
  return (
    <Box sx={{ 
      display: "flex", 
      height: "calc(100vh - 64px)",
      maxWidth: "100%",
      overflow: "hidden",
      bgcolor: "background.default",
    }}>
      {/* Left Nav - Matching image design */}
      <Box
        sx={{
          width: dims.leftNav,
          flexShrink: 0,
          borderRight: 1,
          borderColor: "divider",
          overflow: "auto",
          bgcolor: "background.paper",
        }}
      >
        <SideMenu activeSection={activeSection} variant="permanent" />
      </Box>

      {/* Gap */}
      <Box sx={{ width: dims.gap, flexShrink: 0 }} />

      {/* Main Viewport - Optimized for each screen size */}
      <Box
        sx={{
          flex: 1,
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "stretch",
        }}
      >
        <Box
          sx={{
            width: "100%",
            height: dims.viewportHeight,
            minHeight: dims.viewportHeight,
            maxHeight: dims.viewportHeight,
            mb: { xs: 1, sm: 2 },
            flexShrink: 0,
            // Ensure viewport uses available space efficiently
            flexGrow: 0,
          }}
        >
          <Viewport3D />
        </Box>
        <Box sx={{ flexShrink: 0 }}>
          <BottomToolbar />
        </Box>
      </Box>

      {/* Gap */}
      <Box sx={{ width: dims.gap, flexShrink: 0 }} />

      {/* Right Panel - Matching image design with REALTIME and Diagnostics */}
      <Box
        sx={{
          width: rightPanelCollapsed ? 0 : dims.rightPanel,
          flexShrink: 0,
          borderLeft: 1,
          borderColor: "divider",
          overflow: "auto",
          transition: "width 0.3s",
          display: rightPanelCollapsed ? "none" : "block",
          bgcolor: "background.paper",
        }}
      >
        <TelemetryPanel />
      </Box>
    </Box>
  );
}"""
    )
    
    # Viewport stub
    gen.add_template(
        f"{base}/components/viewport/Viewport3D.tsx",
        """// Viewport3D.tsx
import React from "react";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";

export default function Viewport3D() {
  return (
    <Box
      sx={{
        width: "100%",
        height: "100%",
        position: "relative",
        overflow: "hidden",
        bgcolor: "#2d5016", // Dark green background matching image
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        // Grid pattern for ground
        backgroundImage: `
          linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
        `,
        backgroundSize: "20px 20px",
      }}
    >
      {/* 3D Coop Scene Placeholder */}
      <Box
        sx={{
          position: "relative",
          width: "80%",
          height: "80%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Typography 
          variant="body1" 
          sx={{ 
            color: "rgba(255,255,255,0.7)",
            fontSize: { xs: "0.875rem", sm: "1rem", md: "1.125rem" },
          }}
        >
          3D Coop / Robot Scene
        </Typography>
      </Box>
    </Box>
  );
}"""
    )
    
    # Telemetry panel
    gen.add_template(
        f"{base}/components/telemetry/TelemetryPanel.tsx",
        """// TelemetryPanel.tsx
import React from "react";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Grid";
import Box from "@mui/material/Box";
import TelemetryItem from "./TelemetryItem";
import { useMediaQuery, useTheme } from "@mui/material";

export default function TelemetryPanel() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const isDesktop = useMediaQuery(theme.breakpoints.up("lg"));

  // REALTIME data matching the image layout
  const realtimeItems = [
    { label: "Temperature", value: "67 °F", icon: "thermometer", critical: true },
    { label: "Humidity", value: "72 %", icon: "water", critical: true },
    { label: "Ammonia", value: "4 ppm", icon: "warning", critical: true },
    { label: "Active", value: "Active", icon: "activity", critical: false },
    { label: "Chicken", value: "3", icon: "chicken", critical: false },
    { label: "Feed aval", value: "80 %", icon: "feed", critical: true },
    { label: "Water level", value: "56 %", icon: "water", critical: true },
  ];

  // Diagnostics messages matching the image
  const diagnosticsMessages = [
    "Waste detected. Run cleaning cycle regularly",
    "Scraper jammed. Error code 31",
    "Blocked rail. Code 12",
  ];

  return (
    <Box sx={{ 
      p: { xs: 1.5, sm: 1.5, md: 2 }, 
      height: "100%",
      display: "flex",
      flexDirection: "column",
      gap: 2,
    }}>
      {/* REALTIME Section */}
      <Box>
        <Typography 
          variant="h6" 
          gutterBottom 
          sx={{ 
            fontSize: { xs: "0.875rem", sm: "1rem", md: "1rem" },
            fontWeight: 600,
            mb: 1.5,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          REALTIME
      </Typography>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          {realtimeItems.map((item) => (
            <TelemetryItem 
              key={item.label}
              label={item.label} 
              value={item.value}
              critical={item.critical}
              icon={item.icon}
            />
          ))}
        </Box>
      </Box>
      
      {/* Diagnostics Section */}
      <Box sx={{ 
        mt: "auto",
        pt: 2, 
        borderTop: 1, 
        borderColor: "divider", 
        flexShrink: 0,
      }}>
        <Typography 
          variant="h6" 
          gutterBottom 
          sx={{ 
            fontSize: { xs: "0.875rem", sm: "1rem", md: "1rem" },
            fontWeight: 600,
            mb: 1.5,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          Diagnostics
        </Typography>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          {diagnosticsMessages.map((message, index) => (
            <Box
              key={index}
              sx={{
                p: 1,
                bgcolor: "warning.light",
                borderRadius: 0.5,
                borderLeft: 2,
                borderColor: "warning.main",
              }}
            >
              <Typography 
                variant="body2" 
                sx={{ 
                  fontSize: { xs: "0.7rem", sm: "0.75rem", md: "0.875rem" },
                  color: "text.primary",
                }}
              >
                {message}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
}"""
    )
    
    gen.add_template(
        f"{base}/components/telemetry/TelemetryItem.tsx",
        """// TelemetryItem.tsx
import React from "react";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";

type TelemetryItemProps = {
  label: string;
  value: string;
};

type TelemetryItemProps = {
  label: string;
  value: string;
  critical?: boolean;
  icon?: string;
};

export default function TelemetryItem({ label, value, critical = false, icon }: TelemetryItemProps) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        p: { xs: 0.75, sm: 1, md: 1.25 },
        borderBottom: 1,
        borderColor: "divider",
        "&:last-child": {
          borderBottom: 0,
        },
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, flex: 1 }}>
        {icon && (
          <Box
            sx={{
              width: 20,
              height: 20,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              opacity: 0.7,
            }}
          >
            {/* Icon placeholder - can be replaced with actual icons */}
            <Box
              sx={{
                width: 16,
                height: 16,
                borderRadius: "50%",
                bgcolor: critical ? "warning.main" : "text.secondary",
              }}
            />
          </Box>
        )}
        <Typography 
          variant="body2"
          sx={{ 
            fontSize: { xs: "0.75rem", sm: "0.8125rem", md: "0.875rem" },
            color: "text.primary",
            fontWeight: 400,
          }}
        >
          {label}:
      </Typography>
      </Box>
      <Typography 
        variant="body2"
        sx={{ 
          fontSize: { xs: "0.75rem", sm: "0.8125rem", md: "0.875rem" },
          fontWeight: critical ? 600 : 500,
          color: critical ? "warning.main" : "text.primary",
        }}
      >
        {value}
      </Typography>
    </Box>
  );
}"""
    )
    
    # Toolbar, using ActionButton via ToolbarButton
    gen.add_template(
        f"{base}/components/toolbar/ToolbarButton.tsx",
        """// ToolbarButton.tsx
import React from "react";
import ActionButton, { ActionButtonProps } from "../common/ActionButton";

type ToolbarButtonProps = Omit<ActionButtonProps, "kind">;

export default function ToolbarButton(props: ToolbarButtonProps) {
  return <ActionButton kind="secondary" {...props} />;
}"""
    )
    
    gen.add_template(
        f"{base}/components/toolbar/BottomToolbar.tsx",
        """// BottomToolbar.tsx
import React from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import Slider from "@mui/material/Slider";
import Switch from "@mui/material/Switch";
import MenuIcon from "@mui/icons-material/Menu";
import VolumeUpIcon from "@mui/icons-material/VolumeUp";
import GridOnIcon from "@mui/icons-material/GridOn";
import MusicNoteIcon from "@mui/icons-material/MusicNote";
import SearchIcon from "@mui/icons-material/Search";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import WindowIcon from "@mui/icons-material/Window";

export default function BottomToolbar() {
  const [map3DEnabled, setMap3DEnabled] = React.useState(true);

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        px: { xs: 1, sm: 2 },
        py: 1,
        borderTop: 1,
        borderColor: "divider",
        bgcolor: "background.paper",
        minHeight: { xs: 56, sm: 60 },
      }}
    >
      {/* Left: Icons and controls */}
      <Stack direction="row" spacing={0.5} alignItems="center" sx={{ flexWrap: "wrap", gap: 0.5 }}>
        <IconButton size="small" sx={{ minWidth: 44, minHeight: 44 }}>
          <MenuIcon fontSize="small" />
        </IconButton>
        <Typography variant="caption" sx={{ fontSize: "0.75rem", mr: 1, display: { xs: "none", sm: "block" } }}>
          ID
        </Typography>
        <IconButton size="small" sx={{ minWidth: 44, minHeight: 44 }}>
          <VolumeUpIcon fontSize="small" />
        </IconButton>
        <IconButton size="small" sx={{ minWidth: 44, minHeight: 44 }}>
          <GridOnIcon fontSize="small" />
        </IconButton>
        <IconButton size="small" sx={{ minWidth: 44, minHeight: 44 }}>
          <MusicNoteIcon fontSize="small" />
        </IconButton>
        <IconButton size="small" sx={{ minWidth: 44, minHeight: 44 }}>
          <SearchIcon fontSize="small" />
        </IconButton>
        <Slider
          defaultValue={50}
          size="small"
          sx={{ width: { xs: 60, sm: 100 }, mx: 1 }}
        />
        <IconButton size="small" sx={{ minWidth: 44, minHeight: 44 }}>
          <AddIcon fontSize="small" />
        </IconButton>
        <IconButton size="small" sx={{ minWidth: 44, minHeight: 44 }}>
          <RemoveIcon fontSize="small" />
        </IconButton>
        <IconButton size="small" sx={{ minWidth: 44, minHeight: 44 }}>
          <WindowIcon fontSize="small" />
        </IconButton>
    </Stack>

      {/* Right: 3D MAP BETA Toggle */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexShrink: 0 }}>
        <Typography variant="caption" sx={{ fontSize: { xs: "0.7rem", sm: "0.75rem" }, whiteSpace: "nowrap" }}>
          3D MAP BETA
        </Typography>
        <Switch
          checked={map3DEnabled}
          onChange={(e) => setMap3DEnabled(e.target.checked)}
          size="small"
          color="primary"
        />
      </Box>
    </Box>
  );
}"""
    )
    
    # 3D model templates and Firebase storage client
    add_3d_model_templates(gen, base)
    
    # Key types (Bird, Coop, notifications, treatment)
    gen.add_template(
        f"{base}/types/bird.ts",
        """// bird.ts

export interface Bird {
  id: string;
  name: string;
  breed?: string;
  sex?: "hen" | "rooster" | "unknown";
  hatchDate?: string; // ISO date
  status: "active" | "watch" | "quarantine" | "rehoming" | "deceased";
  rfidTag?: string;
  photoUrl?: string;
  notes?: string;
  createdAt: string; // ISO datetime
}"""
    )
    
    gen.add_template(
        f"{base}/types/treatment.ts",
        """// treatment.ts

export interface BirdTreatment {
  id: string;
  birdId: string;
  timestamp: string; // ISO datetime
  medication?: string;
  dose?: string;
  route?: string;
  notes?: string;
}"""
    )
    
    gen.add_template(
        f"{base}/types/notifications.ts",
        """// notifications.ts

export type NotificationLevel = "info" | "warning" | "critical";

export interface CoopNotification {
  id: string;
  coopId: string;
  type: string; // e.g. 'bird-risk', 'hardware', 'system'
  birdId?: string;
  level: NotificationLevel;
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
}"""
    )
    
    gen.add_template(
        f"{base}/types/coop.ts",
        """// coop.ts

export type CoopPresetSize = "3x3x5" | "4x4x6" | "6x6x8" | "custom";

export interface CoopDimensions {
  width: number; // X axis (feet)
  depth: number; // Z axis (feet)
  height: number; // Y axis (feet)
}

export interface CoopModelConfig {
  id: string;
  name: string;
  size: CoopPresetSize;
  dimensions: CoopDimensions;
  modelUrl?: string; // URL to custom 3D model (GLB/GLTF)
  thumbnailUrl?: string;
  isCustom: boolean;
  uploadedAt?: string;
  scale?: { x: number; y: number; z: number };
  position?: { x: number; y: number; z: number };
  rotation?: { x: number; y: number; z: number };
}

export const COOP_PRESETS: Record<string, CoopModelConfig> = {
  "3x3x5": {
    id: "preset-3x3x5",
    name: "Small Coop (3x3x5)",
    size: "3x3x5",
    dimensions: { width: 3, depth: 3, height: 5 },
    modelUrl: "/models/coops/presets/coop-3x3x5.glb",
    isCustom: false,
  },
  "4x4x6": {
    id: "preset-4x4x6",
    name: "Medium Coop (4x4x6)",
    size: "4x4x6",
    dimensions: { width: 4, depth: 4, height: 6 },
    modelUrl: "/models/coops/presets/coop-4x4x6.glb",
    isCustom: false,
  },
  "6x6x8": {
    id: "preset-6x6x8",
    name: "Large Coop (6x6x8)",
    size: "6x6x8",
    dimensions: { width: 6, depth: 6, height: 8 },
    modelUrl: "/models/coops/presets/coop-6x6x8.glb",
    isCustom: false,
  },
};"""
    )
    
    # Additional type definitions for all features
    add_type_definitions(gen, base)
    
    # Services and hooks
    add_services_and_hooks(gen, base)
    
    # Form components
    add_form_components(gen, base)
    
    # Feature-specific components
    add_feature_components(gen, base)
    
    # Feature pages
    add_feature_pages(gen, base)
    
    # Generic stubs for core pages and routes
    for file in [
        "routes/AppRoutes.tsx",
        "pages/ChickenEyeDashboardPage.tsx",
        "pages/ChickenEyeBirdPage.tsx",
        "pages/BirdManagementPage.tsx",
        "pages/BirdEditPage.tsx",
        "pages/SetupWizardPage.tsx",
    ]:
        path = f"{base}/{file}"
        name = os.path.basename(file).replace(".tsx", "").replace(".ts", "")
        # Use a closure to capture the name correctly
        def make_template(component_name: str):
            return lambda: ReactTemplates.react_component(component_name)
        gen.add_template(path, make_template(name))


def add_3d_model_templates(gen: ProjectGenerator, base: str) -> None:
    """Add 3D model management templates."""
    
    gen.add_template(f"{base}/models/loaders/ModelLoader.ts", """// ModelLoader.ts
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';

export class ModelLoader {
  private gltfLoader: GLTFLoader;
  private dracoLoader: DRACOLoader;
  
  constructor() {
    this.dracoLoader = new DRACOLoader();
    this.dracoLoader.setDecoderPath('/draco/');
    
    this.gltfLoader = new GLTFLoader();
    this.gltfLoader.setDRACOLoader(this.dracoLoader);
  }
  
  async loadModel(url: string): Promise<THREE.Group> {
    return new Promise((resolve, reject) => {
      this.gltfLoader.load(
        url,
        (gltf) => resolve(gltf.scene),
        (progress) => {
          const percent = (progress.loaded / progress.total) * 100;
          console.log(`Loading model: ${percent.toFixed(2)}%`);
        },
        (error) => reject(error)
      );
    });
  }
  
  dispose(): void {
    this.dracoLoader.dispose();
  }
}""")
    
    gen.add_template(f"{base}/models/presets/coopPresets.ts", """// coopPresets.ts
import { CoopModelConfig, COOP_PRESETS } from '@/types/coop';

export function getPresetModel(size: string): CoopModelConfig | null {
  return COOP_PRESETS[size] || null;
}

export function getAllPresets(): CoopModelConfig[] {
  return Object.values(COOP_PRESETS);
}

export function getDefaultPreset(): CoopModelConfig {
  return COOP_PRESETS["4x4x6"];
}""")
    
    gen.add_template(f"{base}/components/viewport/CoopModelSelector.tsx", """// CoopModelSelector.tsx
import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardMedia,
  Grid,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { Upload as UploadIcon } from '@mui/icons-material';
import { CoopModelConfig, COOP_PRESETS } from '@/types/coop';

type CoopModelSelectorProps = {
  currentModel?: CoopModelConfig;
  onSelectModel: (model: CoopModelConfig) => void;
  onUploadCustom: (file: File) => void;
};

export default function CoopModelSelector({
  currentModel,
  onSelectModel,
  onUploadCustom,
}: CoopModelSelectorProps) {
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.name.match(/\\.(glb|gltf)$/i)) {
      alert('Please select a GLB or GLTF file');
      return;
    }
    
    if (file.size > 50 * 1024 * 1024) {
      alert('File size must be less than 50MB');
      return;
    }
    
    setUploading(true);
    try {
      await onUploadCustom(file);
      setOpen(false);
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Failed to upload model');
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <Button variant="outlined" onClick={() => setOpen(true)}>
        Change Coop Model
      </Button>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Select Coop Model</DialogTitle>
        <DialogContent>
          <Typography variant="subtitle2" gutterBottom>
            Preset Models
          </Typography>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            {Object.values(COOP_PRESETS).map((preset) => (
              <Grid item xs={12} sm={4} key={preset.id}>
                <Card
                  sx={{
                    cursor: 'pointer',
                    border: currentModel?.id === preset.id ? 2 : 0,
                    borderColor: 'primary.main',
                  }}
                  onClick={() => {
                    onSelectModel(preset);
                    setOpen(false);
                  }}
                >
                  <CardMedia
                    component="div"
                    sx={{
                      height: 120,
                      bgcolor: 'grey.800',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Typography variant="h6" color="text.secondary">
                      {preset.dimensions.width}×{preset.dimensions.depth}×
                      {preset.dimensions.height}
                    </Typography>
                  </CardMedia>
                  <CardContent>
                    <Typography variant="body2">{preset.name}</Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          <Typography variant="subtitle2" gutterBottom>
            Custom Model
          </Typography>
          <Box
            sx={{
              border: '2px dashed',
              borderColor: 'grey.600',
              borderRadius: 1,
              p: 3,
              textAlign: 'center',
            }}
          >
            <input
              type="file"
              accept=".glb,.gltf"
              style={{ display: 'none' }}
              id="model-upload"
              onChange={handleFileSelect}
            />
            <label htmlFor="model-upload">
              <Button
                variant="contained"
                component="span"
                startIcon={<UploadIcon />}
                disabled={uploading}
              >
                {uploading ? 'Uploading...' : 'Upload Custom Model'}
              </Button>
            </label>
            <Typography variant="caption" display="block" sx={{ mt: 1 }}>
              GLB or GLTF format, max 50MB
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}""")
    
    gen.add_template(f"{base}/lib/firebase/modelStorageClient.ts", """// modelStorageClient.ts
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from './firebaseApp';
import { CoopModelConfig } from '@/types/coop';

export async function uploadCoopModel(
  file: File,
  userId: string,
  coopId: string
): Promise<string> {
  const timestamp = Date.now();
  const fileName = `${timestamp}-${file.name}`;
  const storageRef = ref(storage, `users/${userId}/coops/${coopId}/models/${fileName}`);
  
  await uploadBytes(storageRef, file, {
    contentType: file.type || 'application/octet-stream',
    customMetadata: {
      originalName: file.name,
      uploadedAt: new Date().toISOString(),
    },
  });
  
  const downloadURL = await getDownloadURL(storageRef);
  return downloadURL;
}

export async function deleteCoopModel(
  userId: string,
  coopId: string,
  fileName: string
): Promise<void> {
  const storageRef = ref(storage, `users/${userId}/coops/${coopId}/models/${fileName}`);
  await deleteObject(storageRef);
}

export function createCustomModelConfig(
  modelUrl: string,
  fileName: string,
  dimensions: { width: number; depth: number; height: number }
): CoopModelConfig {
  return {
    id: `custom-${Date.now()}`,
    name: `Custom Model (${fileName})`,
    size: 'custom',
    dimensions,
    modelUrl,
    isCustom: true,
    uploadedAt: new Date().toISOString(),
  };
}""")


def add_root_files(gen: ProjectGenerator, animal: str) -> None:
    """Add root configuration and docs."""
    
    gen.add_templates({
        "package.json": """{
  "name": "tendercells-ui",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "lint": "eslint .",
    "preview": "vite preview",
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage"
  },
  "dependencies": {
    "@mui/material": "^5.15.0",
    "@mui/icons-material": "^5.15.0",
    "@emotion/react": "^11.11.1",
    "@emotion/styled": "^11.11.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.28.0",
    "three": "^0.160.0",
    "firebase": "^10.7.1"
  },
  "devDependencies": {
    "@types/react": "^18.3.12",
    "@types/react-dom": "^18.3.1",
    "@types/three": "^0.160.0",
    "@vitejs/plugin-react": "^4.3.3",
    "typescript": "~5.6.2",
    "vite": "^5.4.10",
    "vitest": "^2.1.4"
  }
}""",
        
        "vite.config.ts": """import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
})""",
        
        "tsconfig.json": """{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}""",
        
        "tsconfig.node.json": """{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true
  },
  "include": ["vite.config.ts"]
}""",
        
        "index.html": """<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>TenderCells Unified UI</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>""",
        
        ".env.example": """# Frontend
VITE_API_BASE_URL=http://localhost:5173/api
VITE_SIM_MODE=true

# Backend
API_PORT=4000

# 3D Model Storage
VITE_MODEL_STORAGE_URL=http://localhost:5173/models
MAX_MODEL_FILE_SIZE=50MB""",
        
        "firebase.json": """{
  "hosting": {
    "public": "dist",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [{"source": "**", "destination": "/index.html"}]
  },
  "storage": {
    "rules": "storage.rules"
  }
}""",
        
        "storage.rules": """rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /users/{userId}/coops/{coopId}/models/{modelFile} {
      allow read: if request.auth != null;
      allow write: if request.auth != null 
        && request.auth.uid == userId
        && request.resource.size < 50 * 1024 * 1024 // 50MB limit
        && request.resource.contentType.matches('model/gltf-binary|model/gltf\\+json|application/octet-stream');
    }
  }
}""",
        
        "docs/architecture.md": """# TenderCells Unified UI Architecture

Full-stack application with React frontend and Express backend for multiple products.""",
        
        "docs/responsive-breakpoints.md": """# Responsive Breakpoints & Layout Guide

This document describes the responsive breakpoints and exact layout dimensions used in the TenderCells UI.

## Breakpoint Definitions

The application uses Material-UI breakpoints with the following values:

- **xs**: 0px (mobile)
- **sm**: 600px (small tablets)
- **md**: 900px (large tablets / small laptops)
- **lg**: 1200px (desktop)
- **xl**: 1600px (big desktop)

## Viewport Testing Targets

### Desktop / Laptop (Web)

| Name | Viewport (px) | Notes |
|------|---------------|-------|
| Desktop XL | 1600 × 900 | Big monitors, main design reference |
| Desktop L | 1440 × 900 | Common MacBook / 15" laptops |
| Desktop M | 1280 × 720 | Lower-res / smaller laptops |

### Tablet (Web & App)

| Name | Viewport (px) | Notes |
|------|---------------|-------|
| Tablet L | 1024 × 768 | iPad standard (landscape) |
| Tablet P | 834 × 1112 | Newer iPads / Android tablets (portrait) |

### Mobile (Web & Native App)

| Name | Viewport (px) | Example |
|------|---------------|---------|
| Mobile Tall | 390 × 844 | iPhone 14/15 style |
| Mobile Common | 360 × 800 | Many Android devices |

## Layout Dimensions

### Desktop XL (1600px)

- Left nav: **260px**
- Right panel: **360px**
- Gap between columns: **24px** each side
- Main viewport width: **932px** (1600 - 260 - 360 - 48)
- Viewport height: **~640px**

### Desktop L (1440px)

- Left nav: **240px**
- Right panel: **320px**
- Gap: **24px**
- Main viewport width: **832px** (1440 - 240 - 320 - 48)
- Viewport height: **~620px**

### Desktop M (1280px)

- Left nav: **220px**
- Right panel: **300px**
- Gap: **16px**
- Main viewport width: **728px** (1280 - 220 - 300 - 32)
- Viewport height: **~600px**

### Tablet Landscape (1024px)

- Left nav: **200px**
- Right panel: **280px**
- Gap: **16px**
- Main viewport width: **512px** (1024 - 200 - 280 - 32)
- Viewport height: **~480px**

### Tablet Portrait (834px)

Switches to **2-row layout**:

- Row 1: Coop viewport full width (aspect-ratio: 16/10, ~834 × 520px)
- Row 2: Tabs for "Telemetry / Network / Hogs" below
- Hamburger nav for left items (drawer slide-out)

### Mobile (390 × 844 / 360 × 800)

**Single column layout**:

- Content padding: **16px**
- Coop viewport: 100% width minus padding, aspect-ratio 16/10 (~220–260px height)
- Telemetry tiles: 2-column grid, height **72–88px**
- Bottom toolbar: **56–64px**

## Layout Behavior by Breakpoint

### xl & lg (≥1200px)
- **3 columns**: nav + viewport + telemetry
- All panels visible
- Full feature set

### md (900–1199px)
- **3 columns**, but right panel can be collapsible or narrower
- Some text labels may shorten (e.g., "Waste Cleaning" → "Waste")

### sm (600–899px)
- **2 rows**: viewport on top, telemetry below
- Nav in drawer (hamburger menu)
- Portrait tablets use this layout

### xs (0–599px)
- **Single column**
- Full-width coop viewport
- Navigation & telemetry via tabs/drawers
- Mobile-optimized controls

## Testing

To test responsive layouts:

1. Use browser DevTools to simulate viewport sizes
2. Test at exact breakpoint values (600px, 900px, 1200px, 1600px)
3. Test orientation changes on tablets
4. Verify touch targets are at least 44×44px on mobile

## Implementation

The responsive layout is implemented in:
- `components/layout/DashboardLayout.tsx` - Main responsive layout component
- `constants/breakpoints.ts` - Breakpoint constants and layout dimensions
- `components/navigation/SideMenu.tsx` - Responsive navigation drawer
- `components/telemetry/TelemetryPanel.tsx` - Responsive telemetry display
""",
        
        "docs/3d-models.md": """# 3D Model Integration Guide

This document describes how coop models are stored, validated, and loaded in the TenderCells app.""",
        
        "docs/connectivity.md": """# Connectivity Services Guide

Overview of BLE, WiFi, MQTT, and WebSocket integration for TenderCells hardware devices.""",
    })


def add_pwa_analytics_error_tracking(gen: ProjectGenerator) -> None:
    """Add PWA, analytics, and error tracking templates."""
    
    gen.add_template("public/manifest.json", """{
  "name": "TenderCells",
  "short_name": "TenderCells",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#6750A4",
  "theme_color": "#6750A4",
  "icons": [
    {
      "src": "assets/logo.png",
      "sizes": "192x192",
      "type": "image/png"
    }
  ]
}""")
    
    gen.add_template("src/service-worker.ts", """// service-worker.ts
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open('tendercells-cache').then((cache) => {
      return cache.addAll([
        '/',
        '/index.html',
        '/assets/logo.png',
        '/assets/main.css',
        '/assets/main.js'
      ]);
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});""")
    
    gen.add_template("src/analytics.ts", """// analytics.ts
import { initializeApp } from 'firebase/app';
import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
  // Your Firebase config here
};

const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app);""")
    
    gen.add_template("src/error-tracking.ts", """// error-tracking.ts
import * as Sentry from '@sentry/react';
import { Integrations } from '@sentry/tracing';

Sentry.init({
  dsn: 'your-sentry-dsn',
  integrations: [new Integrations.BrowserTracing()],
  tracesSampleRate: 1.0,
});""")


def add_type_definitions(gen: ProjectGenerator, base: str) -> None:
    """Add all TypeScript type definitions for features."""
    
    # Flock types
    gen.add_template(f"{base}/types/flock.ts", """// flock.ts
export interface FlockMember {
  id: string;
  name: string;
  breed: string;
  age: number;
  status: 'healthy' | 'sick' | 'missing' | 'quarantine';
  rfidTag: string;
  lastSeen: string;
  location: string;
  healthScore: number;
  eggProduction: {
    daily: number;
    weekly: number;
    monthly: number;
  };
  vaccinations: Vaccination[];
  notes: string;
}

export interface Vaccination {
  id: string;
  name: string;
  date: string;
  nextDue?: string;
  veterinarian: string;
}

export interface FlockStats {
  totalBirds: number;
  healthyBirds: number;
  sickBirds: number;
  missingBirds: number;
  averageAge: number;
  totalEggsToday: number;
  averageHealthScore: number;
  lastUpdated: string;
}

export interface FlockGroup {
  id: string;
  name: string;
  description: string;
  memberCount: number;
  location: string;
  createdAt: string;
  status: 'active' | 'inactive';
  healthScore: number;
}""")
    
    # Automation types
    gen.add_template(f"{base}/types/automation.ts", """// automation.ts
export interface AutomationRule {
  id: string;
  name: string;
  description: string;
  type: 'feeding' | 'lighting' | 'temperature' | 'door' | 'cleaning' | 'health_check';
  status: 'active' | 'inactive' | 'paused';
  trigger: AutomationTrigger;
  actions: AutomationAction[];
  schedule?: AutomationSchedule;
  lastExecuted?: string;
  nextExecution?: string;
  executionCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface AutomationTrigger {
  type: 'time' | 'sensor' | 'manual' | 'condition';
  conditions: TriggerCondition[];
}

export interface TriggerCondition {
  parameter: string;
  operator: 'equals' | 'greater_than' | 'less_than' | 'between';
  value: any;
  unit?: string;
}

export interface AutomationAction {
  id: string;
  type: 'device_control' | 'notification' | 'data_log' | 'alert';
  device?: string;
  parameters: Record<string, any>;
  delay?: number;
}

export interface AutomationSchedule {
  type: 'daily' | 'weekly' | 'monthly' | 'custom';
  time: string;
  days?: string[];
  interval?: number;
  endDate?: string;
}

export interface AutomationStats {
  totalRules: number;
  activeRules: number;
  executionsToday: number;
  successRate: number;
  lastExecution: string;
  upcomingTasks: number;
}""")
    
    # Analytics types
    gen.add_template(f"{base}/types/analytics.ts", """// analytics.ts
export type AnalyticsChartType = 'line' | 'bar' | 'pie' | 'area' | 'scatter' | 'radar' | 'heatmap';
export type AnalyticsDataType = 'production' | 'health' | 'environment' | 'automation' | 'financial';
export type AnalyticsPeriod = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'custom';
export type AnalyticsTrend = 'up' | 'down' | 'stable';

export interface AnalyticsMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  trend: AnalyticsTrend;
  change: number;
  changePercent: number;
  period: string;
  category: AnalyticsDataType;
}

export interface ChartData {
  labels: string[];
  datasets: ChartDataset[];
}

export interface ChartDataset {
  label: string;
  data: number[];
  borderColor?: string;
  backgroundColor?: string;
  fill?: boolean;
}

export interface AnalyticsReport {
  id: string;
  title: string;
  description: string;
  type: AnalyticsDataType;
  period: AnalyticsPeriod;
  chartType: AnalyticsChartType;
  data: ChartData;
  insights: string[];
  recommendations: string[];
  generatedAt: string;
  status: 'ready' | 'generating' | 'error';
}

export interface AnalyticsFilter {
  dateRange?: {
    start: string;
    end: string;
  };
  categories?: AnalyticsDataType[];
  locations?: string[];
  flockGroups?: string[];
  search?: string;
}

export interface AnalyticsDashboard {
  metrics: AnalyticsMetric[];
  charts: AnalyticsReport[];
  alerts: AnalyticsAlert[];
  lastUpdated: string;
}

export interface AnalyticsAlert {
  id: string;
  type: 'warning' | 'critical' | 'info';
  title: string;
  description: string;
  metric: string;
  threshold: number;
  currentValue: number;
  createdAt: string;
}

export interface AnalyticsInsight {
  id: string;
  title: string;
  description: string;
  category: AnalyticsDataType;
  severity: 'low' | 'medium' | 'high';
  impact: 'positive' | 'negative' | 'neutral';
  relatedMetrics: string[];
  recommendations: string[];
  createdAt: string;
}""")
    
    # Macros types
    gen.add_template(f"{base}/types/macros.ts", """// macros.ts
export type MacroType = 'record' | 'task' | 'configuration' | 'flock' | 'chicken' | 'feeding' | 'maintenance';
export type MacroStatus = 'idle' | 'running' | 'completed' | 'failed';

export interface MacroFunction<T = any> {
  id: string;
  name: string;
  description: string;
  type: MacroType;
  icon?: string;
  parameters: MacroParameter[];
  execute: (params: Record<string, any>) => Promise<T>;
  validate?: (params: Record<string, any>) => MacroValidationResult;
  isRepeatable: boolean;
  requiresConfirmation: boolean;
  category: string;
  tags: string[];
}

export interface MacroParameter {
  id: string;
  name: string;
  description: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'select' | 'multiselect' | 'entity';
  required: boolean;
  defaultValue?: any;
  options?: { label: string; value: any }[];
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    entityType?: string;
  };
  placeholder?: string;
}

export interface MacroValidationResult {
  isValid: boolean;
  errors: { field: string; message: string }[];
}

export interface MacroTask {
  id: string;
  macroId: string;
  name: string;
  description: string;
  status: MacroStatus;
  parameters: Record<string, any>;
  result?: any;
  error?: string;
  startTime?: string;
  endTime?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface MacroRecord {
  id: string;
  macroId: string;
  name: string;
  type: MacroType;
  parameters: Record<string, any>;
  result: any;
  executedBy: string;
  executedAt: string;
  status: 'success' | 'partial' | 'failed';
  duration: number;
  notes?: string;
}

export interface MacroStats {
  totalExecutions: number;
  successRate: number;
  averageDuration: number;
  mostUsedMacros: {
    macroId: string;
    name: string;
    count: number;
  }[];
  recentExecutions: MacroRecord[];
}""")
    
    # Environment types
    gen.add_template(f"{base}/types/environment.ts", """// environment.ts
export interface EnvironmentData {
  temperature: {
    current: number;
    target: number;
    unit: 'celsius' | 'fahrenheit';
    trend: 'rising' | 'falling' | 'stable';
  };
  humidity: {
    current: number;
    target: number;
    trend: 'rising' | 'falling' | 'stable';
  };
  airQuality: {
    co2: number;
    ammonia: number;
    dust: number;
    rating: 'excellent' | 'good' | 'fair' | 'poor';
  };
  lighting: {
    intensity: number;
    schedule: {
      sunrise: string;
      sunset: string;
    };
  };
  timestamp: string;
}

export interface EnvironmentControls {
  coopDoor: {
    isOpen: boolean;
    autoMode: boolean;
    schedule: {
      openTime: string;
      closeTime: string;
    };
  };
  lighting: {
    enabled: boolean;
    autoMode: boolean;
    intensity: number;
  };
  ventilation: {
    enabled: boolean;
    autoMode: boolean;
    speed: number;
  };
  heating: {
    enabled: boolean;
    autoMode: boolean;
    targetTemperature: number;
  };
  cooling: {
    enabled: boolean;
    autoMode: boolean;
    targetTemperature: number;
  };
}""")
    
    # Alerts types
    gen.add_template(f"{base}/types/alerts.ts", """// alerts.ts
export type AlertType = 'warning' | 'info' | 'success' | 'error' | 'critical';
export type AlertCategory = 'chicken_health' | 'chicken_missing' | 'environment' | 'system' | 'security' | 'maintenance';

export interface Alert {
  id: string;
  type: AlertType;
  category: AlertCategory;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  isRead: boolean;
  isDismissed: boolean;
  actionRequired: boolean;
  actionLabel?: string;
  actionUrl?: string;
  relatedEntityId?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  expiresAt?: string;
}

export interface AlertSummary {
  total: number;
  unread: number;
  critical: number;
  byType: Record<AlertType, number>;
  byCategory: Record<AlertCategory, number>;
}""")
    
    # Automation devices types
    gen.add_template(f"{base}/types/automationDevices.ts", """// automationDevices.ts
export type DeviceType = 'feeder' | 'water_dispenser' | 'door' | 'light' | 'heater' | 'fan' | 'camera' | 'sensor' | 'motor' | 'custom';
export type DeviceStatus = 'online' | 'offline' | 'maintenance' | 'error' | 'disabled';

export interface Device {
  id: string;
  name: string;
  description: string;
  type: DeviceType;
  status: DeviceStatus;
  location: string;
  lastSeen: string;
  createdAt: string;
  updatedAt: string;
}

export interface DeviceStats {
  totalDevices: number;
  onlineDevices: number;
  offlineDevices: number;
  maintenanceDevices: number;
  errorDevices: number;
  lastUpdated: string;
}""")
    
    # Flock health types
    gen.add_template(f"{base}/types/flockHealth.ts", """// flockHealth.ts
export type HealthStatus = 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
export type HealthEventType = 'vaccination' | 'treatment' | 'checkup' | 'illness' | 'injury' | 'quarantine';

export interface HealthRecord {
  id: string;
  chickenId: string;
  chickenName: string;
  recordType: HealthEventType;
  date: string;
  veterinarian?: string;
  description: string;
  symptoms?: string[];
  diagnosis?: string;
  treatment?: Treatment;
  followUpRequired: boolean;
  followUpDate?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'active' | 'resolved' | 'ongoing';
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface Treatment {
  id: string;
  name: string;
  type: 'medication' | 'procedure' | 'therapy' | 'surgery';
  dosage?: string;
  frequency?: string;
  duration?: string;
  startDate: string;
  endDate?: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  administeredBy: string;
}

export interface HealthStats {
  totalRecords: number;
  activeIssues: number;
  resolvedIssues: number;
  vaccinationsThisMonth: number;
  treatmentsInProgress: number;
  averageHealthScore: number;
  healthTrend: 'improving' | 'stable' | 'declining';
  lastUpdated: string;
}""")
    
    # Flock production types
    gen.add_template(f"{base}/types/flockProduction.ts", """// flockProduction.ts
export type ProductionType = 'eggs' | 'meat' | 'breeding' | 'feathers';
export type EggGrade = 'AA' | 'A' | 'B' | 'C' | 'reject';

export interface ProductionRecord {
  id: string;
  chickenId: string;
  chickenName: string;
  date: string;
  type: ProductionType;
  quantity: number;
  quality: EggGrade;
  weight?: number;
  notes?: string;
  collectedBy: string;
  location: string;
  createdAt: string;
}

export interface ProductionStats {
  totalEggsToday: number;
  totalEggsThisWeek: number;
  totalEggsThisMonth: number;
  averageDailyProduction: number;
  productionRate: number;
  qualityDistribution: Record<EggGrade, number>;
  topProducers: {
    chickenId: string;
    chickenName: string;
    eggsThisWeek: number;
  }[];
  productionTrend: 'increasing' | 'stable' | 'decreasing';
  lastUpdated: string;
}""")


def add_services_and_hooks(gen: ProjectGenerator, base: str) -> None:
    """Add service and hook templates."""
    
    # Base API service
    gen.add_template(f"{base}/services/api.ts", """// api.ts
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';

export class ApiService {
  private static async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    return response.json();
  }

  static async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  static async post<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  static async put<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  static async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}""")
    
    # Auth service
    gen.add_template(f"{base}/services/authService.ts", """// authService.ts
import { ApiService } from './api';

export interface User {
  id: string;
  email: string;
  name: string;
}

export class AuthService {
  static async signIn(email: string, password: string): Promise<User> {
    return ApiService.post<User>('/auth/signin', { email, password });
  }

  static async signUp(email: string, password: string, name: string): Promise<User> {
    return ApiService.post<User>('/auth/signup', { email, password, name });
  }

  static async signOut(): Promise<void> {
    return ApiService.post<void>('/auth/signout', {});
  }

  static async getCurrentUser(): Promise<User | null> {
    try {
      return await ApiService.get<User>('/auth/me');
    } catch {
      return null;
    }
  }
}""")
    
    # Hooks - useAuth
    gen.add_template(f"{base}/hooks/useAuth.ts", """// useAuth.ts
import { useState, useEffect } from 'react';
import { AuthService, User } from '../services/authService';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AuthService.getCurrentUser().then(setUser).finally(() => setLoading(false));
  }, []);

  const signIn = async (email: string, password: string) => {
    const user = await AuthService.signIn(email, password);
    setUser(user);
    return user;
  };

  const signUp = async (email: string, password: string, name: string) => {
    const user = await AuthService.signUp(email, password, name);
    setUser(user);
    return user;
  };

  const signOut = async () => {
    await AuthService.signOut();
    setUser(null);
  };

  return { user, loading, signIn, signUp, signOut };
}""")
    
    # Hooks - useChickens
    gen.add_template(f"{base}/hooks/useChickens.ts", """// useChickens.ts
import { useState, useEffect } from 'react';
import { ApiService } from '../services/api';
import type { FlockMember, FlockStats } from '../types/flock';

export function useChickens() {
  const [chickens, setChickens] = useState<FlockMember[]>([]);
  const [summary, setSummary] = useState<FlockStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChickens();
  }, []);

  const fetchChickens = async () => {
    try {
      setLoading(true);
      const [chickensData, summaryData] = await Promise.all([
        ApiService.get<FlockMember[]>('/chickens'),
        ApiService.get<FlockStats>('/chickens/summary'),
      ]);
      setChickens(chickensData);
      setSummary(summaryData);
    } catch (error) {
      console.error('Failed to fetch chickens:', error);
    } finally {
      setLoading(false);
    }
  };

  return { chickens, summary, loading, refetch: fetchChickens };
}""")
    
    # Hooks - useAnalytics
    gen.add_template(f"{base}/hooks/useAnalytics.ts", """// useAnalytics.ts
import { useState, useEffect } from 'react';
import { ApiService } from '../services/api';
import type { AnalyticsDashboard, AnalyticsReport, AnalyticsInsight, AnalyticsFilter } from '../types/analytics';

export function useAnalytics() {
  const [dashboard, setDashboard] = useState<AnalyticsDashboard | null>(null);
  const [reports, setReports] = useState<AnalyticsReport[]>([]);
  const [insights, setInsights] = useState<AnalyticsInsight[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = async (filter?: AnalyticsFilter) => {
    try {
      setLoading(true);
      const data = await ApiService.post<AnalyticsDashboard>('/analytics/dashboard', filter || {});
      setDashboard(data);
    } catch (error) {
      console.error('Failed to fetch dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchReports = async (filter?: AnalyticsFilter) => {
    try {
      const data = await ApiService.post<AnalyticsReport[]>('/analytics/reports', filter || {});
      setReports(data);
    } catch (error) {
      console.error('Failed to fetch reports:', error);
    }
  };

  const fetchInsights = async (filter?: AnalyticsFilter) => {
    try {
      const data = await ApiService.post<AnalyticsInsight[]>('/analytics/insights', filter || {});
      setInsights(data);
    } catch (error) {
      console.error('Failed to fetch insights:', error);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  return {
    dashboard,
    reports,
    insights,
    loading,
    fetchDashboard,
    fetchReports,
    fetchInsights,
    generateReport: async (type: string) => {
      return ApiService.post<AnalyticsReport>('/analytics/reports/generate', { type });
    },
    exportData: async (id: string, format: string) => {
      return ApiService.post(`/analytics/export/${id}`, { format });
    },
  };
}""")
    
    # Additional hooks (simplified versions)
    gen.add_template(f"{base}/hooks/useAutomationRules.ts", """// useAutomationRules.ts
import { useState, useEffect } from 'react';
import { ApiService } from '../services/api';
import type { AutomationRule, AutomationStats } from '../types/automation';

export function useAutomationRules() {
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [stats, setStats] = useState<AutomationStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRules();
  }, []);

  const fetchRules = async () => {
    try {
      setLoading(true);
      const [rulesData, statsData] = await Promise.all([
        ApiService.get<AutomationRule[]>('/automation/rules'),
        ApiService.get<AutomationStats>('/automation/rules/stats'),
      ]);
      setRules(rulesData);
      setStats(statsData);
    } catch (error) {
      console.error('Failed to fetch rules:', error);
    } finally {
      setLoading(false);
    }
  };

  return { rules, stats, loading, refetch: fetchRules };
}""")
    
    gen.add_template(f"{base}/hooks/useAutomationSchedules.ts", """// useAutomationSchedules.ts
import { useState, useEffect } from 'react';
import { ApiService } from '../services/api';

export function useAutomationSchedules() {
  const [schedules, setSchedules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSchedules();
  }, []);

  const fetchSchedules = async () => {
    try {
      setLoading(true);
      const data = await ApiService.get<any[]>('/automation/schedules');
      setSchedules(data);
    } catch (error) {
      console.error('Failed to fetch schedules:', error);
    } finally {
      setLoading(false);
    }
  };

  return { schedules, loading, refetch: fetchSchedules };
}""")
    
    gen.add_template(f"{base}/hooks/useAutomationDevices.ts", """// useAutomationDevices.ts
import { useState, useEffect } from 'react';
import { ApiService } from '../services/api';
import type { Device, DeviceStats } from '../types/automationDevices';

export function useAutomationDevices() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [stats, setStats] = useState<DeviceStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDevices();
  }, []);

  const fetchDevices = async () => {
    try {
      setLoading(true);
      const [devicesData, statsData] = await Promise.all([
        ApiService.get<Device[]>('/automation/devices'),
        ApiService.get<DeviceStats>('/automation/devices/stats'),
      ]);
      setDevices(devicesData);
      setStats(statsData);
    } catch (error) {
      console.error('Failed to fetch devices:', error);
    } finally {
      setLoading(false);
    }
  };

  return { devices, stats, loading, refetch: fetchDevices };
}""")
    
    gen.add_template(f"{base}/hooks/useMacros.ts", """// useMacros.ts
import { useState, useEffect } from 'react';
import { ApiService } from '../services/api';
import type { MacroFunction, MacroStats } from '../types/macros';

export function useMacros() {
  const [macros, setMacros] = useState<MacroFunction[]>([]);
  const [stats, setStats] = useState<MacroStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMacros();
  }, []);

  const fetchMacros = async () => {
    try {
      setLoading(true);
      const [macrosData, statsData] = await Promise.all([
        ApiService.get<MacroFunction[]>('/macros'),
        ApiService.get<MacroStats>('/macros/stats'),
      ]);
      setMacros(macrosData);
      setStats(statsData);
    } catch (error) {
      console.error('Failed to fetch macros:', error);
    } finally {
      setLoading(false);
    }
  };

  return { macros, stats, loading, refetch: fetchMacros };
}""")
    
    gen.add_template(f"{base}/hooks/useFlockHealth.ts", """// useFlockHealth.ts
import { useState, useEffect } from 'react';
import { ApiService } from '../services/api';
import type { HealthRecord, HealthStats } from '../types/flockHealth';

export function useFlockHealth() {
  const [records, setRecords] = useState<HealthRecord[]>([]);
  const [stats, setStats] = useState<HealthStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHealth();
  }, []);

  const fetchHealth = async () => {
    try {
      setLoading(true);
      const [recordsData, statsData] = await Promise.all([
        ApiService.get<HealthRecord[]>('/flock/health'),
        ApiService.get<HealthStats>('/flock/health/stats'),
      ]);
      setRecords(recordsData);
      setStats(statsData);
    } catch (error) {
      console.error('Failed to fetch health records:', error);
    } finally {
      setLoading(false);
    }
  };

  return { records, stats, loading, refetch: fetchHealth };
}""")
    
    gen.add_template(f"{base}/hooks/useFlockProduction.ts", """// useFlockProduction.ts
import { useState, useEffect } from 'react';
import { ApiService } from '../services/api';
import type { ProductionRecord, ProductionStats } from '../types/flockProduction';

export function useFlockProduction() {
  const [records, setRecords] = useState<ProductionRecord[]>([]);
  const [stats, setStats] = useState<ProductionStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProduction();
  }, []);

  const fetchProduction = async () => {
    try {
      setLoading(true);
      const [recordsData, statsData] = await Promise.all([
        ApiService.get<ProductionRecord[]>('/flock/production'),
        ApiService.get<ProductionStats>('/flock/production/stats'),
      ]);
      setRecords(recordsData);
      setStats(statsData);
    } catch (error) {
      console.error('Failed to fetch production records:', error);
    } finally {
      setLoading(false);
    }
  };

  return { records, stats, loading, refetch: fetchProduction };
}""")
    
    gen.add_template(f"{base}/hooks/useEnvironment.ts", """// useEnvironment.ts
import { useState, useEffect } from 'react';
import { ApiService } from '../services/api';
import type { EnvironmentData, EnvironmentControls } from '../types/environment';

export function useEnvironment() {
  const [data, setData] = useState<EnvironmentData | null>(null);
  const [controls, setControls] = useState<EnvironmentControls | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEnvironment();
  }, []);

  const fetchEnvironment = async () => {
    try {
      setLoading(true);
      const [dataResult, controlsResult] = await Promise.all([
        ApiService.get<EnvironmentData>('/environment'),
        ApiService.get<EnvironmentControls>('/environment/controls'),
      ]);
      setData(dataResult);
      setControls(controlsResult);
    } catch (error) {
      console.error('Failed to fetch environment data:', error);
    } finally {
      setLoading(false);
    }
  };

  return { data, controls, loading, refetch: fetchEnvironment };
}""")
    
    gen.add_template(f"{base}/hooks/useAlerts.ts", """// useAlerts.ts
import { useState, useEffect } from 'react';
import { ApiService } from '../services/api';
import type { Alert, AlertSummary } from '../types/alerts';

export function useAlerts() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [summary, setSummary] = useState<AlertSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const [alertsData, summaryData] = await Promise.all([
        ApiService.get<Alert[]>('/alerts'),
        ApiService.get<AlertSummary>('/alerts/summary'),
      ]);
      setAlerts(alertsData);
      setSummary(summaryData);
    } catch (error) {
      console.error('Failed to fetch alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  return { alerts, summary, loading, refetch: fetchAlerts };
}""")


def add_form_components(gen: ProjectGenerator, base: str) -> None:
    """Add MUI-based form components with responsive breakpoints."""
    
    # AddEntityModal - responsive form modal
    gen.add_template(f"{base}/components/forms/AddEntityModal.tsx", """// AddEntityModal.tsx
import React, { useState, useEffect } from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import FormHelperText from "@mui/material/FormHelperText";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { useTheme, useMediaQuery } from "@mui/material";

interface FormField {
  id: string;
  label: string;
  type: "text" | "number" | "select" | "date" | "textarea" | "checkbox";
  placeholder?: string;
  required?: boolean;
  options?: { label: string; value: string }[];
  defaultValue?: any;
  min?: number;
  max?: number;
}

interface AddEntityModalProps {
  title: string;
  description?: string;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Record<string, any>) => Promise<void>;
  fields: FormField[];
  submitLabel?: string;
}

export default function AddEntityModal({
  title,
  description,
  isOpen,
  onClose,
  onSubmit,
  fields,
  submitLabel = "Save",
}: AddEntityModalProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const initialData: Record<string, any> = {};
    fields.forEach((field) => {
      if (field.defaultValue !== undefined) {
        initialData[field.id] = field.defaultValue;
      } else if (field.type === "checkbox") {
        initialData[field.id] = false;
      }
    });
    setFormData(initialData);
  }, [fields, isOpen]);

  const handleChange = (id: string, value: any) => {
    setFormData((prev) => ({ ...prev, [id]: value }));
    if (errors[id]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[id];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    fields.forEach((field) => {
      if (field.required && (formData[field.id] === undefined || formData[field.id] === "")) {
        newErrors[field.id] = `${field.label} is required`;
      }
      if (field.type === "number" && formData[field.id] !== undefined) {
        const value = Number(formData[field.id]);
        if (field.min !== undefined && value < field.min) {
          newErrors[field.id] = `${field.label} must be at least ${field.min}`;
        }
        if (field.max !== undefined && value > field.max) {
          newErrors[field.id] = `${field.label} must be at most ${field.max}`;
        }
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      onClose();
      setFormData({});
    } catch (error: any) {
      setErrors({ _form: error.message || "Failed to submit form" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      fullScreen={isMobile}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          minHeight: isMobile ? "100vh" : "auto",
        },
      }}
    >
      <DialogTitle>{title}</DialogTitle>
      {description && (
        <Box sx={{ px: 3, pb: 2 }}>
          <Typography variant="body2" color="text.secondary">
            {description}
          </Typography>
        </Box>
      )}
      <form onSubmit={handleSubmit}>
        <DialogContent>
          {errors._form && (
            <Box sx={{ mb: 2, p: 1, bgcolor: "error.light", borderRadius: 1 }}>
              <Typography variant="body2" color="error">
                {errors._form}
              </Typography>
            </Box>
          )}
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {fields.map((field) => (
              <Box key={field.id}>
                {field.type === "text" && (
                  <TextField
                    fullWidth
                    label={field.label}
                    value={formData[field.id] || ""}
                    onChange={(e) => handleChange(field.id, e.target.value)}
                    placeholder={field.placeholder}
                    required={field.required}
                    error={!!errors[field.id]}
                    helperText={errors[field.id]}
                    size={isMobile ? "medium" : "small"}
                  />
                )}
                {field.type === "number" && (
                  <TextField
                    fullWidth
                    type="number"
                    label={field.label}
                    value={formData[field.id] || ""}
                    onChange={(e) => handleChange(field.id, Number(e.target.value))}
                    required={field.required}
                    error={!!errors[field.id]}
                    helperText={errors[field.id]}
                    inputProps={{ min: field.min, max: field.max }}
                    size={isMobile ? "medium" : "small"}
                  />
                )}
                {field.type === "select" && (
                  <FormControl fullWidth required={field.required} error={!!errors[field.id]}>
                    <InputLabel>{field.label}</InputLabel>
                    <Select
                      value={formData[field.id] || ""}
                      onChange={(e) => handleChange(field.id, e.target.value)}
                      label={field.label}
                      size={isMobile ? "medium" : "small"}
                    >
                      {field.options?.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </Select>
                    {errors[field.id] && <FormHelperText>{errors[field.id]}</FormHelperText>}
                  </FormControl>
                )}
                {field.type === "date" && (
                  <TextField
                    fullWidth
                    type="date"
                    label={field.label}
                    value={formData[field.id] || ""}
                    onChange={(e) => handleChange(field.id, e.target.value)}
                    required={field.required}
                    error={!!errors[field.id]}
                    helperText={errors[field.id]}
                    InputLabelProps={{ shrink: true }}
                    size={isMobile ? "medium" : "small"}
                  />
                )}
                {field.type === "textarea" && (
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    label={field.label}
                    value={formData[field.id] || ""}
                    onChange={(e) => handleChange(field.id, e.target.value)}
                    placeholder={field.placeholder}
                    required={field.required}
                    error={!!errors[field.id]}
                    helperText={errors[field.id]}
                    size={isMobile ? "medium" : "small"}
                  />
                )}
                {field.type === "checkbox" && (
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={formData[field.id] || false}
                        onChange={(e) => handleChange(field.id, e.target.checked)}
                      />
                    }
                    label={field.label}
                  />
                )}
              </Box>
            ))}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: { xs: 2, sm: 3 }, pb: { xs: 2, sm: 3 } }}>
          <Button onClick={onClose} disabled={isSubmitting} size={isMobile ? "medium" : "small"}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={isSubmitting}
            size={isMobile ? "medium" : "small"}
            sx={{ minWidth: { xs: 88, sm: 64 } }}
          >
            {isSubmitting ? "Saving..." : submitLabel}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}""")
    
    # SignInForm
    gen.add_template(f"{base}/components/forms/SignInForm.tsx", """// SignInForm.tsx
import React, { useState } from "react";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Link from "@mui/material/Link";
import { useTheme, useMediaQuery } from "@mui/material";
import { useAuth } from "../../hooks/useAuth";

interface SignInFormProps {
  onSuccess?: () => void;
}

export default function SignInForm({ onSuccess }: SignInFormProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signIn(email, password);
      onSuccess?.();
    } catch (err: any) {
      setError(err.message || "Failed to sign in");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ width: "100%", maxWidth: 400, mx: "auto" }}>
      <Typography variant="h5" gutterBottom sx={{ mb: 3, textAlign: "center" }}>
        Sign In
      </Typography>
      {error && (
        <Box sx={{ mb: 2, p: 1, bgcolor: "error.light", borderRadius: 1 }}>
          <Typography variant="body2" color="error">
            {error}
          </Typography>
        </Box>
      )}
      <TextField
        fullWidth
        label="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        margin="normal"
        size={isMobile ? "medium" : "small"}
        sx={{ mb: 2 }}
      />
      <TextField
        fullWidth
        label="Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        margin="normal"
        size={isMobile ? "medium" : "small"}
        sx={{ mb: 2 }}
      />
      <Button
        type="submit"
        fullWidth
        variant="contained"
        disabled={loading}
        size={isMobile ? "large" : "medium"}
        sx={{ mt: 2, mb: 2, minHeight: { xs: 48, sm: 40 } }}
      >
        {loading ? "Signing in..." : "Sign In"}
      </Button>
      <Box sx={{ textAlign: "center" }}>
        <Link href="/signup" variant="body2">
          Don't have an account? Sign up
        </Link>
      </Box>
    </Box>
  );
}""")
    
    # SignUpForm
    gen.add_template(f"{base}/components/forms/SignUpForm.tsx", """// SignUpForm.tsx
import React, { useState } from "react";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Link from "@mui/material/Link";
import { useTheme, useMediaQuery } from "@mui/material";
import { useAuth } from "../../hooks/useAuth";

interface SignUpFormProps {
  onSuccess?: () => void;
}

export default function SignUpForm({ onSuccess }: SignUpFormProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const { signUp } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    setLoading(true);
    try {
      await signUp(email, password, name);
      onSuccess?.();
    } catch (err: any) {
      setError(err.message || "Failed to sign up");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ width: "100%", maxWidth: 400, mx: "auto" }}>
      <Typography variant="h5" gutterBottom sx={{ mb: 3, textAlign: "center" }}>
        Sign Up
      </Typography>
      {error && (
        <Box sx={{ mb: 2, p: 1, bgcolor: "error.light", borderRadius: 1 }}>
          <Typography variant="body2" color="error">
            {error}
          </Typography>
        </Box>
      )}
      <TextField
        fullWidth
        label="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        margin="normal"
        size={isMobile ? "medium" : "small"}
        sx={{ mb: 2 }}
      />
      <TextField
        fullWidth
        label="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        margin="normal"
        size={isMobile ? "medium" : "small"}
        sx={{ mb: 2 }}
      />
      <TextField
        fullWidth
        label="Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        margin="normal"
        size={isMobile ? "medium" : "small"}
        sx={{ mb: 2 }}
      />
      <TextField
        fullWidth
        label="Confirm Password"
        type="password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        required
        margin="normal"
        size={isMobile ? "medium" : "small"}
        sx={{ mb: 2 }}
      />
      <Button
        type="submit"
        fullWidth
        variant="contained"
        disabled={loading}
        size={isMobile ? "large" : "medium"}
        sx={{ mt: 2, mb: 2, minHeight: { xs: 48, sm: 40 } }}
      >
        {loading ? "Signing up..." : "Sign Up"}
      </Button>
      <Box sx={{ textAlign: "center" }}>
        <Link href="/signin" variant="body2">
          Already have an account? Sign in
        </Link>
      </Box>
    </Box>
  );
}""")
    
    # CreateFunctionForm - simplified version
    gen.add_template(f"{base}/components/forms/CreateFunctionForm.tsx", """// CreateFunctionForm.tsx
import React, { useState } from "react";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import { useTheme, useMediaQuery } from "@mui/material";
import type { MacroFunction } from "../../types/macros";

interface CreateFunctionFormProps {
  onSubmit: (macro: Partial<MacroFunction>) => Promise<void>;
  onCancel: () => void;
}

export default function CreateFunctionForm({ onSubmit, onCancel }: CreateFunctionFormProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<MacroFunction["type"]>("record");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({ name, description, type, category, parameters: [], tags: [] });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ p: { xs: 2, sm: 3 } }}>
      <Typography variant="h6" gutterBottom>
        Create Function
      </Typography>
      <TextField
        fullWidth
        label="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        margin="normal"
        size={isMobile ? "medium" : "small"}
      />
      <TextField
        fullWidth
        label="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        multiline
        rows={3}
        margin="normal"
        size={isMobile ? "medium" : "small"}
      />
      <FormControl fullWidth margin="normal">
        <InputLabel>Type</InputLabel>
        <Select value={type} onChange={(e) => setType(e.target.value as MacroFunction["type"])} size={isMobile ? "medium" : "small"}>
          <MenuItem value="record">Record</MenuItem>
          <MenuItem value="task">Task</MenuItem>
          <MenuItem value="configuration">Configuration</MenuItem>
          <MenuItem value="flock">Flock</MenuItem>
          <MenuItem value="chicken">Chicken</MenuItem>
        </Select>
      </FormControl>
      <TextField
        fullWidth
        label="Category"
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        margin="normal"
        size={isMobile ? "medium" : "small"}
      />
      <Box sx={{ display: "flex", gap: 2, mt: 3, justifyContent: "flex-end" }}>
        <Button onClick={onCancel} size={isMobile ? "medium" : "small"}>
          Cancel
        </Button>
        <Button type="submit" variant="contained" disabled={loading} size={isMobile ? "medium" : "small"}>
          {loading ? "Creating..." : "Create"}
        </Button>
      </Box>
    </Box>
  );
}""")
    
    # MacroExecuteForm - simplified version
    gen.add_template(f"{base}/components/forms/MacroExecuteForm.tsx", """// MacroExecuteForm.tsx
import React, { useState } from "react";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { useTheme, useMediaQuery } from "@mui/material";
import type { MacroFunction } from "../../types/macros";

interface MacroExecuteFormProps {
  macro: MacroFunction;
  onExecute: (params: Record<string, any>) => Promise<void>;
  onCancel: () => void;
}

export default function MacroExecuteForm({ macro, onExecute, onCancel }: MacroExecuteFormProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [params, setParams] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onExecute(params);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ p: { xs: 2, sm: 3 } }}>
      <Typography variant="h6" gutterBottom>
        Execute: {macro.name}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {macro.description}
      </Typography>
      {macro.parameters.map((param) => (
        <TextField
          key={param.id}
          fullWidth
          label={param.name}
          value={params[param.id] || param.defaultValue || ""}
          onChange={(e) => setParams({ ...params, [param.id]: e.target.value })}
          required={param.required}
          margin="normal"
          size={isMobile ? "medium" : "small"}
          placeholder={param.placeholder}
        />
      ))}
      <Box sx={{ display: "flex", gap: 2, mt: 3, justifyContent: "flex-end" }}>
        <Button onClick={onCancel} size={isMobile ? "medium" : "small"}>
          Cancel
        </Button>
        <Button type="submit" variant="contained" disabled={loading} size={isMobile ? "medium" : "small"}>
          {loading ? "Executing..." : "Execute"}
        </Button>
      </Box>
    </Box>
  );
}""")


def add_feature_components(gen: ProjectGenerator, base: str) -> None:
    """Add feature-specific components using MUI."""
    
    # FlockDashboard
    gen.add_template(f"{base}/components/flock/FlockDashboard.tsx", """// FlockDashboard.tsx
import React from "react";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import { useChickens } from "../../hooks/useChickens";
import type { FlockMember, FlockStats } from "../../types/flock";

export default function FlockDashboard() {
  const { chickens, summary, loading } = useChickens();

  if (loading) {
    return <Box sx={{ p: 3 }}>Loading...</Box>;
  }

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      <Typography variant="h5" gutterBottom>
        Flock Overview
      </Typography>
      {summary && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={6} sm={3}>
            <Card>
              <CardContent>
                <Typography variant="h4">{summary.totalBirds}</Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Birds
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Card>
              <CardContent>
                <Typography variant="h4">{summary.healthyBirds}</Typography>
                <Typography variant="body2" color="text.secondary">
                  Healthy
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Card>
              <CardContent>
                <Typography variant="h4">{summary.totalEggsToday}</Typography>
                <Typography variant="body2" color="text.secondary">
                  Eggs Today
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Card>
              <CardContent>
                <Typography variant="h4">{summary.averageHealthScore}</Typography>
                <Typography variant="body2" color="text.secondary">
                  Avg Health
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
      <Grid container spacing={2}>
        {chickens.map((chicken) => (
          <Grid item xs={12} sm={6} md={4} key={chicken.id}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6">{chicken.name}</Typography>
              <Typography variant="body2" color="text.secondary">
                {chicken.breed} • {chicken.age} months
              </Typography>
              <Typography variant="body2">Status: {chicken.status}</Typography>
              <Typography variant="body2">Health: {chicken.healthScore}/100</Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}""")
    
    # AutomationDashboard
    gen.add_template(f"{base}/components/automation/AutomationDashboard.tsx", """// AutomationDashboard.tsx
import React from "react";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import { useAutomationRules } from "../../hooks/useAutomationRules";
import type { AutomationRule, AutomationStats } from "../../types/automation";

export default function AutomationDashboard() {
  const { rules, stats, loading } = useAutomationRules();

  if (loading) {
    return <Box sx={{ p: 3 }}>Loading...</Box>;
  }

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      <Typography variant="h5" gutterBottom>
        Automation Rules
      </Typography>
      {stats && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={6} sm={3}>
            <Card>
              <CardContent>
                <Typography variant="h4">{stats.totalRules}</Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Rules
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Card>
              <CardContent>
                <Typography variant="h4">{stats.activeRules}</Typography>
                <Typography variant="body2" color="text.secondary">
                  Active
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Card>
              <CardContent>
                <Typography variant="h4">{stats.executionsToday}</Typography>
                <Typography variant="body2" color="text.secondary">
                  Today
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Card>
              <CardContent>
                <Typography variant="h4">{stats.successRate}%</Typography>
                <Typography variant="body2" color="text.secondary">
                  Success Rate
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
      <Grid container spacing={2}>
        {rules.map((rule) => (
          <Grid item xs={12} sm={6} md={4} key={rule.id}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6">{rule.name}</Typography>
              <Typography variant="body2" color="text.secondary">
                {rule.description}
              </Typography>
              <Typography variant="body2">Type: {rule.type}</Typography>
              <Typography variant="body2">Status: {rule.status}</Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}""")
    
    # AnalyticsOverview
    gen.add_template(f"{base}/components/analytics/AnalyticsOverview.tsx", """// AnalyticsOverview.tsx
import React from "react";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import { useAnalytics } from "../../hooks/useAnalytics";
import type { AnalyticsMetric } from "../../types/analytics";

export default function AnalyticsOverview() {
  const { dashboard, loading } = useAnalytics();

  if (loading) {
    return <Box sx={{ p: 3 }}>Loading...</Box>;
  }

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      <Typography variant="h5" gutterBottom>
        Analytics Overview
      </Typography>
      {dashboard && (
        <Grid container spacing={2}>
          {dashboard.metrics.map((metric: AnalyticsMetric) => (
            <Grid item xs={6} sm={4} md={3} key={metric.id}>
              <Card>
                <CardContent>
                  <Typography variant="h6">{metric.value} {metric.unit}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {metric.name}
                  </Typography>
                  <Typography variant="caption" color={metric.trend === "up" ? "success.main" : "error.main"}>
                    {metric.changePercent > 0 ? "+" : ""}{metric.changePercent}%
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}""")
    
    # MacroCard
    gen.add_template(f"{base}/components/macros/MacroCard.tsx", """// MacroCard.tsx
import React from "react";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardActions from "@mui/material/CardActions";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import type { MacroFunction } from "../../types/macros";

interface MacroCardProps {
  macro: MacroFunction;
  onExecute: (macro: MacroFunction) => void;
}

export default function MacroCard({ macro, onExecute }: MacroCardProps) {
  return (
    <Card>
      <CardContent>
        <Typography variant="h6">{macro.name}</Typography>
        <Typography variant="body2" color="text.secondary">
          {macro.description}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Type: {macro.type} • Category: {macro.category}
        </Typography>
      </CardContent>
      <CardActions>
        <Button size="small" onClick={() => onExecute(macro)}>
          Execute
        </Button>
      </CardActions>
    </Card>
  );
}""")


def add_feature_pages(gen: ProjectGenerator, base: str) -> None:
    """Add feature pages using DashboardLayout."""
    
    # DashboardPage
    gen.add_template(f"{base}/pages/DashboardPage.tsx", """// DashboardPage.tsx
import React from "react";
import DashboardLayout from "../components/layout/DashboardLayout";

export default function DashboardPage() {
  return <DashboardLayout activeSection="coop" />;
}""")
    
    # FlockPage
    gen.add_template(f"{base}/pages/FlockPage.tsx", """// FlockPage.tsx
import React from "react";
import DashboardLayout from "../components/layout/DashboardLayout";
import FlockDashboard from "../components/flock/FlockDashboard";

export default function FlockPage() {
  return (
    <DashboardLayout activeSection="flock">
      <FlockDashboard />
    </DashboardLayout>
  );
}""")
    
    # FlockHealthPage
    gen.add_template(f"{base}/pages/FlockHealthPage.tsx", """// FlockHealthPage.tsx
import React from "react";
import DashboardLayout from "../components/layout/DashboardLayout";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { useFlockHealth } from "../hooks/useFlockHealth";

export default function FlockHealthPage() {
  const { records, stats, loading } = useFlockHealth();

  return (
    <DashboardLayout activeSection="flock">
      <Box sx={{ p: { xs: 2, sm: 3 } }}>
        <Typography variant="h5" gutterBottom>
          Flock Health
        </Typography>
        {loading ? (
          <Typography>Loading...</Typography>
        ) : (
          <Typography>Health records: {records.length}</Typography>
        )}
      </Box>
    </DashboardLayout>
  );
}""")
    
    # FlockProductionPage
    gen.add_template(f"{base}/pages/FlockProductionPage.tsx", """// FlockProductionPage.tsx
import React from "react";
import DashboardLayout from "../components/layout/DashboardLayout";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { useFlockProduction } from "../hooks/useFlockProduction";

export default function FlockProductionPage() {
  const { records, stats, loading } = useFlockProduction();

  return (
    <DashboardLayout activeSection="flock">
      <Box sx={{ p: { xs: 2, sm: 3 } }}>
        <Typography variant="h5" gutterBottom>
          Flock Production
        </Typography>
        {loading ? (
          <Typography>Loading...</Typography>
        ) : stats ? (
          <Typography>Total eggs today: {stats.totalEggsToday}</Typography>
        ) : null}
      </Box>
    </DashboardLayout>
  );
}""")
    
    # AutomationPage
    gen.add_template(f"{base}/pages/AutomationPage.tsx", """// AutomationPage.tsx
import React from "react";
import DashboardLayout from "../components/layout/DashboardLayout";
import AutomationDashboard from "../components/automation/AutomationDashboard";

export default function AutomationPage() {
  return (
    <DashboardLayout activeSection="automation">
      <AutomationDashboard />
    </DashboardLayout>
  );
}""")
    
    # AutomationRulesPage
    gen.add_template(f"{base}/pages/AutomationRulesPage.tsx", """// AutomationRulesPage.tsx
import React from "react";
import DashboardLayout from "../components/layout/DashboardLayout";
import AutomationDashboard from "../components/automation/AutomationDashboard";

export default function AutomationRulesPage() {
  return (
    <DashboardLayout activeSection="automation">
      <AutomationDashboard />
    </DashboardLayout>
  );
}""")
    
    # AutomationSchedulesPage
    gen.add_template(f"{base}/pages/AutomationSchedulesPage.tsx", """// AutomationSchedulesPage.tsx
import React from "react";
import DashboardLayout from "../components/layout/DashboardLayout";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { useAutomationSchedules } from "../hooks/useAutomationSchedules";

export default function AutomationSchedulesPage() {
  const { schedules, loading } = useAutomationSchedules();

  return (
    <DashboardLayout activeSection="automation">
      <Box sx={{ p: { xs: 2, sm: 3 } }}>
        <Typography variant="h5" gutterBottom>
          Automation Schedules
        </Typography>
        {loading ? (
          <Typography>Loading...</Typography>
        ) : (
          <Typography>Schedules: {schedules.length}</Typography>
        )}
      </Box>
    </DashboardLayout>
  );
}""")
    
    # AutomationDevicesPage
    gen.add_template(f"{base}/pages/AutomationDevicesPage.tsx", """// AutomationDevicesPage.tsx
import React from "react";
import DashboardLayout from "../components/layout/DashboardLayout";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import { useAutomationDevices } from "../hooks/useAutomationDevices";

export default function AutomationDevicesPage() {
  const { devices, stats, loading } = useAutomationDevices();

  return (
    <DashboardLayout activeSection="automation">
      <Box sx={{ p: { xs: 2, sm: 3 } }}>
        <Typography variant="h5" gutterBottom>
          Automation Devices
        </Typography>
        {loading ? (
          <Typography>Loading...</Typography>
        ) : (
          <Grid container spacing={2}>
            {devices.map((device) => (
              <Grid item xs={12} sm={6} md={4} key={device.id}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6">{device.name}</Typography>
                  <Typography variant="body2">Type: {device.type}</Typography>
                  <Typography variant="body2">Status: {device.status}</Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
    </DashboardLayout>
  );
}""")
    
    # CNCPage
    gen.add_template(f"{base}/pages/CNCPage.tsx", """// CNCPage.tsx
import React from "react";
import DashboardLayout from "../components/layout/DashboardLayout";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

export default function CNCPage() {
  return (
    <DashboardLayout activeSection="automation">
      <Box sx={{ p: { xs: 2, sm: 3 } }}>
        <Typography variant="h5" gutterBottom>
          CNC Control
        </Typography>
        <Typography>CNC control interface coming soon...</Typography>
      </Box>
    </DashboardLayout>
  );
}""")
    
    # AnalyticsPage
    gen.add_template(f"{base}/pages/AnalyticsPage.tsx", """// AnalyticsPage.tsx
import React, { useState } from "react";
import DashboardLayout from "../components/layout/DashboardLayout";
import AnalyticsOverview from "../components/analytics/AnalyticsOverview";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Box from "@mui/material/Box";

export default function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <DashboardLayout activeSection="analytics">
      <Box sx={{ p: { xs: 2, sm: 3 } }}>
        <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}>
          <Tab label="Overview" />
          <Tab label="Reports" />
          <Tab label="Insights" />
        </Tabs>
        {activeTab === 0 && <AnalyticsOverview />}
        {activeTab === 1 && <Box sx={{ mt: 2 }}>Reports coming soon...</Box>}
        {activeTab === 2 && <Box sx={{ mt: 2 }}>Insights coming soon...</Box>}
      </Box>
    </DashboardLayout>
  );
}""")
    
    # AnalyticsReportsPage
    gen.add_template(f"{base}/pages/AnalyticsReportsPage.tsx", """// AnalyticsReportsPage.tsx
import React from "react";
import DashboardLayout from "../components/layout/DashboardLayout";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { useAnalytics } from "../hooks/useAnalytics";

export default function AnalyticsReportsPage() {
  const { reports, loading } = useAnalytics();

  return (
    <DashboardLayout activeSection="analytics">
      <Box sx={{ p: { xs: 2, sm: 3 } }}>
        <Typography variant="h5" gutterBottom>
          Analytics Reports
        </Typography>
        {loading ? (
          <Typography>Loading...</Typography>
        ) : (
          <Typography>Reports: {reports.length}</Typography>
        )}
      </Box>
    </DashboardLayout>
  );
}""")
    
    # AnalyticsInsightsPage
    gen.add_template(f"{base}/pages/AnalyticsInsightsPage.tsx", """// AnalyticsInsightsPage.tsx
import React from "react";
import DashboardLayout from "../components/layout/DashboardLayout";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { useAnalytics } from "../hooks/useAnalytics";

export default function AnalyticsInsightsPage() {
  const { insights, loading } = useAnalytics();

  return (
    <DashboardLayout activeSection="analytics">
      <Box sx={{ p: { xs: 2, sm: 3 } }}>
        <Typography variant="h5" gutterBottom>
          Analytics Insights
        </Typography>
        {loading ? (
          <Typography>Loading...</Typography>
        ) : (
          <Typography>Insights: {insights.length}</Typography>
        )}
      </Box>
    </DashboardLayout>
  );
}""")
    
    # MacrosPage
    gen.add_template(f"{base}/pages/MacrosPage.tsx", """// MacrosPage.tsx
import React from "react";
import DashboardLayout from "../components/layout/DashboardLayout";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import { useMacros } from "../hooks/useMacros";
import MacroCard from "../components/macros/MacroCard";

export default function MacrosPage() {
  const { macros, loading } = useMacros();

  const handleExecute = (macro: any) => {
    console.log("Execute macro:", macro);
  };

  return (
    <DashboardLayout activeSection="macros">
      <Box sx={{ p: { xs: 2, sm: 3 } }}>
        <Typography variant="h5" gutterBottom>
          Macros
        </Typography>
        {loading ? (
          <Typography>Loading...</Typography>
        ) : (
          <Grid container spacing={2}>
            {macros.map((macro) => (
              <Grid item xs={12} sm={6} md={4} key={macro.id}>
                <MacroCard macro={macro} onExecute={handleExecute} />
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
    </DashboardLayout>
  );
}""")


def add_e2e_testing_templates(gen: ProjectGenerator) -> None:
    """Add e2e testing templates for connectivity pages, components, functions, and services."""
    
    gen.add_template("cypress/e2e/connectivity.cy.ts", """// connectivity.cy.ts
describe('Connectivity Page', () => {
  beforeEach(() => {
    cy.visit('/connectivity');
  });

  it('should display connectivity settings', () => {
    cy.get('[data-testid="connectivity-settings"]').should('be.visible');
  });

  it('should allow device pairing', () => {
    cy.get('[data-testid="pair-device-button"]').click();
    cy.get('[data-testid="pairing-success"]').should('be.visible');
  });
});""")
    
    gen.add_template("cypress/e2e/settings.cy.ts", """// settings.cy.ts
describe('Settings Page', () => {
  beforeEach(() => {
    cy.visit('/settings');
  });

  it('should display settings page', () => {
    cy.get('[data-testid="settings-page"]').should('be.visible');
  });

  it('should allow saving settings', () => {
    cy.get('[data-testid="save-settings-button"]').click();
    cy.get('[data-testid="settings-saved"]').should('be.visible');
  });
});""")
    
    gen.add_template("cypress/e2e/account.cy.ts", """// account.cy.ts
describe('Account Page', () => {
  beforeEach(() => {
    cy.visit('/account');
  });

  it('should display account page', () => {
    cy.get('[data-testid="account-page"]').should('be.visible');
  });

  it('should allow updating account', () => {
    cy.get('[data-testid="update-account-button"]').click();
    cy.get('[data-testid="account-updated"]').should('be.visible');
  });
});""")
    
    gen.add_template("cypress/support/index.ts", """// index.ts
import './commands';
""")
    
    gen.add_template("cypress/support/commands.ts", """// commands.ts
Cypress.Commands.add('login', (email, password) => {
  cy.get('[data-testid="email-input"]').type(email);
  cy.get('[data-testid="password-input"]').type(password);
  cy.get('[data-testid="login-button"]').click();
});
""")
    
    gen.add_template("cypress.config.ts", """// cypress.config.ts
import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    supportFile: 'cypress/support/index.ts',
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
  },
});""")

