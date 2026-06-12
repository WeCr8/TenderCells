// MainLayout.tsx
import React, { useState } from "react";
import TopNavBar from "./TopNavBar";
import SideMenu from "../navigation/SideMenu";
import Box from "@mui/material/Box";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import MenuIcon from "@mui/icons-material/Menu";
import { useLocation } from "react-router-dom";

const DRAWER_WIDTH = 240;

type MainLayoutProps = {
  title?: string;
  product?: string;
  onProductChange?: (product: string) => void;
  children: React.ReactNode;
};

export default function MainLayout({ title, product, onProductChange, children }: MainLayoutProps) {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Extract active section from path
  const section = new URLSearchParams(location.search).get('section');
  const activeSection = section || location.pathname.split('/').pop() || 'coop';

  const menu = (
    <Box sx={{ pt: { xs: 1, md: 8 }, pb: 2 }} onClick={() => setMobileMenuOpen(false)}>
      <SideMenu activeSection={activeSection} product={product} />
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100dvh', overflow: 'hidden' }}>
      <TopNavBar title={title} product={product || "chicken-tender"} onProductChange={onProductChange || (() => {})} />
      <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <Tooltip title="Open navigation">
          <IconButton
            onClick={() => setMobileMenuOpen(true)}
            sx={{
              display: { xs: 'inline-flex', md: 'none' },
              position: 'fixed',
              left: 12,
              bottom: 'calc(env(safe-area-inset-bottom) + 12px)',
              zIndex: (theme) => theme.zIndex.drawer + 1,
              bgcolor: '#003323',
              color: '#E4E7E5',
              border: '1px solid #1F5C3B',
              boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
              '&:hover': { bgcolor: '#0C5138' },
            }}
          >
            <MenuIcon />
          </IconButton>
        </Tooltip>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
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
          {menu}
        </Drawer>
        <Drawer
          variant="temporary"
          open={mobileMenuOpen}
          onClose={() => setMobileMenuOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': {
              width: { xs: 'min(86vw, 320px)', sm: 320 },
              boxSizing: 'border-box',
              bgcolor: '#001F16',
              borderRight: '1px solid #1F5C3B',
            },
          }}
        >
          {menu}
        </Drawer>
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            minWidth: 0,
            p: { xs: 1.5, sm: 2, lg: 3 },
            pb: { xs: 'calc(env(safe-area-inset-bottom) + 72px)', md: 3 },
            overflow: 'auto',
            backgroundColor: "#001B14", // TenderCells Deep Forest background
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
}
