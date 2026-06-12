// MainLayout.tsx
import React from "react";
import TopNavBar from "./TopNavBar";
import SideMenu from "../navigation/SideMenu";
import Box from "@mui/material/Box";
import Drawer from "@mui/material/Drawer";
import { useTheme, useMediaQuery } from "@mui/material";

const DRAWER_WIDTH = 240;

type MainLayoutProps = {
  title?: string;
  product: string;
  onProductChange: (product: string) => void;
  children: React.ReactNode;
};

export default function MainLayout({ title, product, onProductChange, children }: MainLayoutProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const drawer = (
    <Box
      sx={{
        width: DRAWER_WIDTH,
        height: "calc(100vh - 64px)", // Account for AppBar height
        bgcolor: "#1a2512", // Dark green background
        borderRight: 1,
        borderColor: "#2d3e1f", // Green border
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <SideMenu />
    </Box>
  );

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <TopNavBar 
        title={title} 
        product={product} 
        onProductChange={onProductChange}
        onMenuToggle={handleDrawerToggle}
      />
      <Box sx={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* Sidebar - Desktop only, positioned below AppBar */}
        <Box
          component="nav"
          sx={{
            width: { md: DRAWER_WIDTH },
            flexShrink: { md: 0 },
            display: { xs: "none", md: "block" },
          }}
        >
          {/* Mobile drawer */}
          <Drawer
            variant="temporary"
            open={mobileOpen}
            onClose={handleDrawerToggle}
            ModalProps={{
              keepMounted: true, // Better open performance on mobile.
            }}
            sx={{
              display: { xs: "block", md: "none" },
              "& .MuiDrawer-paper": {
                boxSizing: "border-box",
                width: DRAWER_WIDTH,
              },
            }}
          >
            {drawer}
          </Drawer>
          {/* Desktop drawer */}
          <Drawer
            variant="permanent"
            sx={{
              display: { xs: "none", md: "block" },
              "& .MuiDrawer-paper": {
                boxSizing: "border-box",
                width: DRAWER_WIDTH,
                position: "relative",
                height: "calc(100vh - 64px)", // Account for AppBar
                top: 0,
                borderRight: "1px solid",
                borderColor: "#2d3e1f",
                overflow: "hidden",
              },
            }}
            open
          >
            {drawer}
          </Drawer>
        </Box>
        {/* Main content */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: 3,
            overflow: "auto",
            bgcolor: "background.default",
            width: { md: `calc(100% - ${DRAWER_WIDTH}px)` }, // Account for sidebar on desktop
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
}
