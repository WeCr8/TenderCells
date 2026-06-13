// TopNavBar.tsx
import React from "react";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Box from "@mui/material/Box";
import AgricultureIcon from "@mui/icons-material/Agriculture";
import WaterIcon from "@mui/icons-material/Water";
import PetsIcon from "@mui/icons-material/Pets";
import FlightIcon from "@mui/icons-material/Flight";
import SecurityIcon from "@mui/icons-material/Security";
import TrainIcon from "@mui/icons-material/Train";
import CloudIcon from "@mui/icons-material/Cloud";
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
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useHardwareControl } from "../../hooks/useHardwareControl";

// Product icons mapping - using AgricultureIcon for poultry products
const PRODUCT_ICONS: Record<string, React.ReactNode> = {
  "chicken-tender": <AgricultureIcon />,
  "roaming-roost": <AgricultureIcon />,
  "duck-dock": <WaterIcon />,
  "goat-guardian": <PetsIcon />,
  "bunny-burrow": <PetsIcon />,
  "turkey-tower": <AgricultureIcon />,
  "predator-monitor": <SecurityIcon />,
  "rail-system-modules": <TrainIcon />,
  "tender-cells-cloud": <CloudIcon />,
  "pigeon-palace": <FlightIcon />,
};

type TopNavBarProps = {
  title?: string;
  product: string;
  onProductChange: (product: string) => void;
};

export default function TopNavBar({ title, product, onProductChange }: TopNavBarProps) {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  // Global E-STOP broadcasts to all devices via the MQTT bridge.
  const hardware = useHardwareControl("broadcast");
  const [estopOpen, setEstopOpen] = React.useState(false);

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
          {PRODUCT_ICONS[product] && (
            <Box sx={{ mr: 1, display: 'flex', alignItems: 'center', color: '#8DD47A' }}>
              {PRODUCT_ICONS[product]}
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
          value={product}
          onChange={(e) => onProductChange(e.target.value)}
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
          <MenuItem value="chicken-tender">
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <AgricultureIcon sx={{ mr: 1, fontSize: 20 }} />
              Chicken Tender
            </Box>
          </MenuItem>
          <MenuItem value="roaming-roost">
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <AgricultureIcon sx={{ mr: 1, fontSize: 20 }} />
              Roaming Roost
            </Box>
          </MenuItem>
          <MenuItem value="duck-dock">
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <WaterIcon sx={{ mr: 1, fontSize: 20 }} />
              Duck Dock
            </Box>
          </MenuItem>
          <MenuItem value="goat-guardian">
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <PetsIcon sx={{ mr: 1, fontSize: 20 }} />
              Goat Guardian
            </Box>
          </MenuItem>
          <MenuItem value="bunny-burrow">
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <PetsIcon sx={{ mr: 1, fontSize: 20 }} />
              Bunny Burrow
            </Box>
          </MenuItem>
          <MenuItem value="turkey-tower">
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <AgricultureIcon sx={{ mr: 1, fontSize: 20 }} />
              Turkey Tower
            </Box>
          </MenuItem>
          <MenuItem value="predator-monitor">
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <SecurityIcon sx={{ mr: 1, fontSize: 20 }} />
              Predator Monitor
            </Box>
          </MenuItem>
          <MenuItem value="rail-system-modules">
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <TrainIcon sx={{ mr: 1, fontSize: 20 }} />
              Rail System Modules
            </Box>
          </MenuItem>
          <MenuItem value="tender-cells-cloud">
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <CloudIcon sx={{ mr: 1, fontSize: 20 }} />
              TenderCells Cloud
            </Box>
          </MenuItem>
          <MenuItem value="pigeon-palace">
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <FlightIcon sx={{ mr: 1, fontSize: 20 }} />
              Pigeon Palace
            </Box>
          </MenuItem>
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
