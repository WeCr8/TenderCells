// TopNavBar.tsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import IconButton from "@mui/material/IconButton";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import DialogContentText from "@mui/material/DialogContentText";
import {
  Menu as MenuIcon,
  PowerSettingsNew,
  Warning,
  CheckCircle,
  Settings,
  Notifications,
  AccountCircle,
} from "@mui/icons-material";
import { useMediaQuery, useTheme, Badge, Tooltip } from "@mui/material";

type TopNavBarProps = {
  title?: string;
  product: string;
  onProductChange: (product: string) => void;
  onMenuToggle?: () => void;
  systemStatus?: "online" | "offline" | "warning";
  connectionStatus?: "connected" | "disconnected";
};

export default function TopNavBar({
  title,
  product,
  onProductChange,
  onMenuToggle,
  systemStatus = "online",
  connectionStatus = "connected",
}: TopNavBarProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const navigate = useNavigate();
  const [estopDialogOpen, setEstopDialogOpen] = useState(false);
  const [estopType, setEstopType] = useState<"soft" | "hard" | null>(null);

  const handleEstopClick = () => {
    setEstopDialogOpen(true);
  };

  const handleEstopConfirm = (type: "soft" | "hard") => {
    setEstopType(type);
    // TODO: Implement E-STOP logic
    console.log(`${type.toUpperCase()} E-STOP activated`);
    alert(`${type.toUpperCase()} E-STOP ACTIVATED - All operations stopped`);
    setEstopDialogOpen(false);
    setEstopType(null);
  };

  const handleEstopCancel = () => {
    setEstopDialogOpen(false);
    setEstopType(null);
  };

  const getStatusColor = () => {
    if (systemStatus === "online" && connectionStatus === "connected") return "success";
    if (systemStatus === "warning") return "warning";
    return "error";
  };

  const getStatusIcon = () => {
    if (systemStatus === "online" && connectionStatus === "connected")
      return <CheckCircle fontSize="small" />;
    if (systemStatus === "warning") return <Warning fontSize="small" />;
    return <Warning fontSize="small" />;
  };

  return (
    <>
      <AppBar
        position="static"
        sx={{
          bgcolor: "#2d3e1f", // Dark green
          color: "#faf8f5", // Off-white text
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.2)",
          zIndex: theme.zIndex.drawer + 1,
        }}
      >
        <Toolbar sx={{ gap: 2, px: { xs: 1, sm: 2, md: 3 } }}>
          {/* Mobile Menu Button */}
          {isMobile && onMenuToggle && (
            <IconButton
              edge="start"
              onClick={onMenuToggle}
              sx={{
                color: "#faf8f5",
                mr: 1,
              }}
              aria-label="open drawer"
            >
              <MenuIcon />
            </IconButton>
          )}

          {/* Logo/Title */}
          <Typography
            variant="h6"
            sx={{
              color: "#faf8f5",
              fontWeight: 600,
              fontSize: { xs: "0.9rem", sm: "1rem", md: "1.25rem" },
              flexGrow: { xs: 1, md: 0 },
              mr: { xs: 1, md: 3 },
            }}
          >
            TENDER CELLS {title ? `| ${title.toUpperCase()}` : "| DASHBOARD"}
          </Typography>

          {/* Status Indicator - Desktop only */}
          {!isMobile && (
            <Tooltip title={`System: ${systemStatus}, Connection: ${connectionStatus}`}>
              <Chip
                icon={getStatusIcon()}
                label={
                  systemStatus === "online" && connectionStatus === "connected"
                    ? "Online"
                    : systemStatus === "warning"
                    ? "Warning"
                    : "Offline"
                }
                color={getStatusColor()}
                size="small"
                sx={{ fontWeight: 500 }}
              />
            </Tooltip>
          )}

          {/* Spacer */}
          <Box sx={{ flexGrow: 1 }} />

          {/* Product Selector */}
          <Select
            value={product}
            onChange={(e) => onProductChange(e.target.value)}
            sx={{
              minWidth: { xs: 160, sm: 200 },
              mr: { xs: 1, sm: 2 },
              height: { xs: 36, sm: 40 },
              bgcolor: "#4a5d3a", // Green-light background
              color: "#faf8f5",
              "& .MuiSelect-select": {
                color: "#faf8f5",
                fontWeight: 500,
                fontSize: { xs: "0.875rem", sm: "0.9375rem" },
                py: { xs: 1, sm: 1.25 },
                px: 2,
              },
              "& .MuiOutlinedInput-notchedOutline": {
                borderColor: "#4a5d3a",
                borderWidth: 2,
              },
              "&:hover .MuiOutlinedInput-notchedOutline": {
                borderColor: "#faf8f5",
              },
              "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                borderColor: "#faf8f5",
                borderWidth: 2,
              },
              "& .MuiSvgIcon-root": {
                color: "#faf8f5",
              },
            }}
            MenuProps={{
              PaperProps: {
                sx: {
                  mt: 0.5,
                  bgcolor: "#2d3e1f",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                  "& .MuiMenuItem-root": {
                    color: "#faf8f5",
                    fontSize: "0.9375rem",
                    py: 1.25,
                    px: 2,
                    "&:hover": {
                      bgcolor: "#4a5d3a",
                    },
                    "&.Mui-selected": {
                      bgcolor: "#4a5d3a",
                      color: "#faf8f5",
                      fontWeight: 600,
                      "&:hover": {
                        bgcolor: "#5a6d4a",
                      },
                    },
                  },
                },
              },
            }}
          >
            <MenuItem value="chicken-tender">Chicken Tender</MenuItem>
            <MenuItem value="roaming-roost">Roaming Roost</MenuItem>
            <MenuItem value="duck-dock">Duck Dock</MenuItem>
            <MenuItem value="goat-guardian">Goat Guardian</MenuItem>
            <MenuItem value="bunny-burrow">Bunny Burrow</MenuItem>
            <MenuItem value="turkey-tower">Turkey Tower</MenuItem>
            <MenuItem value="predator-monitor">Predator Monitor</MenuItem>
            <MenuItem value="rail-system-modules">Rail System Modules</MenuItem>
            <MenuItem value="tender-cells-cloud">TenderCells Cloud</MenuItem>
            <MenuItem value="pigeon-palace">Pigeon Palace</MenuItem>
          </Select>

          {/* System Controls */}
          <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 0.5, sm: 1 } }}>
            {/* Notifications - Desktop only */}
            {!isMobile && (
              <Tooltip title="Notifications">
                <IconButton
                  size="small"
                  sx={{
                    color: "#faf8f5",
                    "&:hover": { bgcolor: "rgba(255,255,255,0.1)" },
                  }}
                  aria-label="notifications"
                >
                  <Badge badgeContent={3} color="error">
                    <Notifications />
                  </Badge>
                </IconButton>
              </Tooltip>
            )}

            {/* Settings - Desktop only */}
            {!isMobile && (
              <Tooltip title="Settings">
                <IconButton
                  size="small"
                  onClick={() => navigate("/settings")}
                  sx={{
                    color: "#faf8f5",
                    "&:hover": { bgcolor: "rgba(255,255,255,0.1)" },
                  }}
                  aria-label="settings"
                >
                  <Settings />
                </IconButton>
              </Tooltip>
            )}

            {/* Account - Desktop only */}
            {!isMobile && (
              <Tooltip title="Account">
                <IconButton
                  size="small"
                  onClick={() => navigate("/account")}
                  sx={{
                    color: "#faf8f5",
                    "&:hover": { bgcolor: "rgba(255,255,255,0.1)" },
                  }}
                  aria-label="account"
                >
                  <AccountCircle />
                </IconButton>
              </Tooltip>
            )}

            {/* E-STOP Button */}
            <Button
              variant="contained"
              color="error"
              startIcon={<PowerSettingsNew />}
              onClick={handleEstopClick}
              sx={{
                minWidth: { xs: 90, sm: 120 },
                height: { xs: 36, sm: 40 },
                fontWeight: 700,
                fontSize: { xs: "0.75rem", sm: "0.875rem" },
                boxShadow: 2,
                "&:hover": {
                  boxShadow: 4,
                  bgcolor: "error.dark",
                },
              }}
            >
              E-STOP
            </Button>
          </Box>
        </Toolbar>
      </AppBar>

      {/* E-STOP Confirmation Dialog */}
      <Dialog
        open={estopDialogOpen}
        onClose={handleEstopCancel}
        aria-labelledby="estop-dialog-title"
        aria-describedby="estop-dialog-description"
      >
        <DialogTitle id="estop-dialog-title" sx={{ color: "error.main" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Warning color="error" />
            Emergency Stop Confirmation
          </Box>
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="estop-dialog-description">
            Choose the type of emergency stop:
            <br />
            <br />
            <strong>Soft E-STOP:</strong> Gracefully stops all operations and saves current state.
            <br />
            <strong>Hard E-STOP:</strong> Immediately stops all operations without saving state.
            <br />
            <br />
            This action cannot be undone. Are you sure you want to proceed?
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button onClick={handleEstopCancel} variant="outlined">
            Cancel
          </Button>
          <Button
            onClick={() => handleEstopConfirm("soft")}
            variant="contained"
            color="warning"
            sx={{ minWidth: 120 }}
          >
            Soft E-STOP
          </Button>
          <Button
            onClick={() => handleEstopConfirm("hard")}
            variant="contained"
            color="error"
            sx={{ minWidth: 120 }}
          >
            Hard E-STOP
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
