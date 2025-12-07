// MainLayout.tsx
import React from "react";
import TopNavBar from "./TopNavBar";
import SideMenu from "../navigation/SideMenu";
import Box from "@mui/material/Box";
import Drawer from "@mui/material/Drawer";
import { useLocation, useNavigate } from "react-router-dom";

const DRAWER_WIDTH = 240;

type MainLayoutProps = {
  title?: string;
  product?: string;
  onProductChange?: (product: string) => void;
  children: React.ReactNode;
};

export default function MainLayout({ title, product, onProductChange, children }: MainLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Extract active section from path
  const activeSection = location.pathname.split('/').pop() || 'coop';

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <TopNavBar title={title} product={product || "chicken-tender"} onProductChange={onProductChange || (() => {})} />
      <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <Drawer
          variant="permanent"
          sx={{
            width: DRAWER_WIDTH,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: DRAWER_WIDTH,
              boxSizing: 'border-box',
              position: 'relative',
              height: '100%',
            },
          }}
        >
          <Box sx={{ overflow: 'auto', mt: 8 }}>
            <SideMenu activeSection={activeSection} product={product} />
          </Box>
        </Drawer>
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: 3,
            overflow: 'auto',
            backgroundColor: "#001B14", // TenderCells Deep Forest background
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
}
