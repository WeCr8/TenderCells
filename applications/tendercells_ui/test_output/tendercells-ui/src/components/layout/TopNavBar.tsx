// TopNavBar.tsx
import React from "react";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Box from "@mui/material/Box";
import DevicesIcon from "@mui/icons-material/Devices";
import StopIcon from "@mui/icons-material/Stop";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import LogoutIcon from "@mui/icons-material/Logout";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogActions from "@mui/material/DialogActions";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/useAuth";
import { useHardwareControl } from "../../hooks/useHardwareControl";
import type { Product } from "../../types/products";

type TopNavBarProps = {
  title?: string;
  product: string;
  products: Product[];
};

export default function TopNavBar({ title, product, products }: TopNavBarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  // Global E-STOP broadcasts to all devices via the MQTT bridge.
  const hardware = useHardwareControl("broadcast");
  const [estopOpen, setEstopOpen] = React.useState(false);
  const pathParts = location.pathname.split('/').filter(Boolean);
  const routeProductId = pathParts[0] === 'product' ? decodeURIComponent(pathParts[1] || '') : '';
  const selectedProductId = products.some((item) => item.id === routeProductId)
    ? routeProductId
    : products.find((item) => item.metadata?.product_family === product)?.id || '';

  const handleEstop = async () => {
    try {
      await hardware.emergencyStop();
      setEstopOpen(false);
    } catch (error) {
      console.error("E-STOP failed:", error);
    }
  };

  const handleAuthAction = async () => {
    if (!isAuthenticated) {
      navigate('/account');
      return;
    }

    await logout();
  };

  return (
    <AppBar position="static" elevation={0} sx={{ bgcolor: '#001F16', color: '#E4E7E5', borderBottom: '1px solid #1F5C3B' }}>
      <Toolbar
        sx={{
          gap: 1,
          flexWrap: { xs: 'wrap', lg: 'nowrap' },
          alignItems: 'center',
          minHeight: { xs: 64, sm: 68 },
          px: { xs: 1, sm: 2 },
          py: { xs: 1, lg: 0.75 },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1, minWidth: { xs: '100%', sm: 260 }, maxWidth: '100%' }}>
          <Box
            component="img"
            src="/assets/images/tender-cells-logo.svg"
            alt="Tender Cells"
            sx={{ width: { xs: 32, sm: 36 }, height: { xs: 32, sm: 36 }, objectFit: 'contain', mr: 1, borderRadius: 1, flexShrink: 0 }}
          />
          {selectedProductId && (
            <Box sx={{ mr: 1, display: 'flex', alignItems: 'center', color: '#8DD47A' }}>
              <DevicesIcon />
            </Box>
          )}
          <Typography
            variant="h6"
            sx={{
              color: '#E4E7E5',
              fontWeight: 700,
              letterSpacing: 0,
              textShadow: '0 1px 2px rgba(0,0,0,0.45)',
              fontSize: { xs: '0.95rem', sm: '1.1rem', md: '1.25rem' },
              minWidth: 0,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            TENDER CELLS {title ? `| ${title}` : "| DASHBOARD"}
          </Typography>
        </Box>
        <Select
          value={selectedProductId}
          displayEmpty
          disabled={products.length === 0}
          onChange={(e) => navigate(`/product/${encodeURIComponent(e.target.value)}`)}
          renderValue={(value) => value ? products.find((item) => item.id === value)?.product_name || 'Registered product' : 'No products registered'}
          sx={{
            mr: { xs: 0, sm: 1 },
            minWidth: { xs: 0, sm: 220 },
            flex: { xs: '1 1 100%', sm: '1 1 260px', lg: '0 0 220px' },
            color: '#E4E7E5',
            '.MuiOutlinedInput-notchedOutline': { borderColor: '#1F5C3B' },
            '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#6BBF59' },
            '.MuiSvgIcon-root': { color: '#E4E7E5' },
          }}
        >
          {products.map((item) => (
            <MenuItem key={item.id} value={item.id}>
              <Box sx={{ display: 'flex', alignItems: 'center', minWidth: 0 }}>
                <DevicesIcon sx={{ mr: 1, fontSize: 20, flexShrink: 0 }} />
                <Box component="span" sx={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.product_name}</Box>
              </Box>
            </MenuItem>
          ))}
        </Select>
        <Button
          variant="outlined"
          size="small"
          startIcon={isAuthenticated ? <LogoutIcon /> : <AccountCircleIcon />}
          onClick={handleAuthAction}
          sx={{
            mr: { xs: 0, sm: 1 },
            color: '#E4E7E5',
            borderColor: '#6BBF59',
            minHeight: 40,
            maxWidth: { xs: '100%', sm: 240 },
            flex: { xs: '1 1 100%', sm: '1 1 180px', lg: '0 1 auto' },
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            textTransform: 'none',
          }}
        >
          {isAuthenticated ? user?.email || 'Logout' : 'Sign In'}
        </Button>
        <Button
          variant="contained"
          color="error"
          size="small"
          startIcon={<StopIcon />}
          onClick={() => setEstopOpen(true)}
          sx={{
            minHeight: 40,
            minWidth: 0,
            flex: { xs: '1 1 100%', sm: '0 0 auto' },
            '& .MuiButton-startIcon': { mr: { xs: 0.5, sm: 1 } },
          }}
        >
          E-STOP
        </Button>
      </Toolbar>

      <Dialog open={estopOpen} onClose={() => setEstopOpen(false)}>
        <DialogTitle sx={{ color: '#CC3333', fontWeight: 700 }}>Emergency Stop</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Cut power to all actuators on every connected device immediately?
            Devices stay stopped until manually cleared.
          </DialogContentText>
          {hardware.error && <Alert severity="error" sx={{ mt: 2 }}>{hardware.error}</Alert>}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEstopOpen(false)} disabled={hardware.isLoading}>Cancel</Button>
          <Button
            onClick={handleEstop}
            variant="contained"
            color="error"
            disabled={hardware.isLoading}
            startIcon={hardware.isLoading ? <CircularProgress size={16} color="inherit" /> : <StopIcon />}
          >
            {hardware.isLoading ? 'Stopping…' : 'Confirm E-STOP'}
          </Button>
        </DialogActions>
      </Dialog>
    </AppBar>
  );
}
