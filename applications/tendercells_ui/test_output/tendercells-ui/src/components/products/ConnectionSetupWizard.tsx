import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Box,
  Stepper,
  Step,
  StepLabel,
  Typography,
  Alert,
  Checkbox,
  FormControlLabel,
  IconButton,
  Paper,
} from '@mui/material';
import {
  Close as CloseIcon,
  CheckCircle,
} from '@mui/icons-material';
import type { Product, NetworkConfig } from '../../types/products';
import { useProducts } from '../../hooks/useProducts';

interface ConnectionSetupWizardProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
  onComplete?: () => void;
}

const steps = ['Find Node', 'Home Wi-Fi', 'Verify Camera', 'Ready'];

export default function ConnectionSetupWizard({
  isOpen,
  onClose,
  product,
  onComplete,
}: ConnectionSetupWizardProps) {
  const { connectProduct, updateProduct } = useProducts();
  const productFamily = String(product.metadata?.product_family || '');
  const isCamera = productFamily === 'camera-kit' || String(product.metadata?.firmware_target || '').includes('camera-node');
  const setupNetwork = isCamera
    ? 'TenderCam-Setup'
    : productFamily === 'chicken-tender'
      ? 'ChickenTender-Setup'
      : 'TenderNode-Setup';
  const suggestedStreamUrl = product.device_id ? `http://${product.device_id}.local/stream` : '';
  const [activeStep, setActiveStep] = useState(0);
  const [ssid, setSsid] = useState('');
  const [securityType, setSecurityType] = useState<'none' | 'WPA' | 'WPA2' | 'WPA3'>('WPA2');
  const [portalComplete, setPortalComplete] = useState(false);
  const [streamUrl, setStreamUrl] = useState(String(product.metadata?.camera_stream_url || suggestedStreamUrl));
  const [cameraVerified, setCameraVerified] = useState(false);
  const [, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'connecting' | 'success' | 'error'>('idle');

  const handleNext = async () => {
    if (activeStep === steps.length - 1) {
      handleComplete();
      return;
    }

    if (activeStep === 2) {
      await handlePairing();
    } else {
      setActiveStep((prevActiveStep) => prevActiveStep + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handlePairing = async () => {
    setIsConnecting(true);
    setConnectionError(null);
    setConnectionStatus('connecting');

    try {
      const networkConfig: NetworkConfig = {
        ssid: ssid.trim(),
        securityType,
        connected: true,
        lastConnected: new Date().toISOString(),
      };

      if (isCamera) {
        await updateProduct(product.id, {
          metadata: { ...product.metadata, camera_stream_url: streamUrl.trim() },
        });
      }
      await connectProduct(product.id, { network_config: networkConfig });
      setConnectionStatus('success');
      setActiveStep(3);
      setIsConnecting(false);
    } catch (error) {
      setConnectionStatus('error');
      setConnectionError(error instanceof Error ? error.message : 'Connection failed');
      setIsConnecting(false);
    }
  };

  const handleComplete = () => {
    if (onComplete) {
      onComplete();
    }
    handleReset();
  };

  const handleReset = () => {
    setActiveStep(0);
    setSsid('');
    setSecurityType('WPA2');
    setPortalComplete(false);
    setStreamUrl(String(product.metadata?.camera_stream_url || suggestedStreamUrl));
    setCameraVerified(false);
    setConnectionError(null);
    setConnectionStatus('idle');
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Alert severity="info">
              After flashing, this device creates <strong>{setupNetwork}</strong>. Join it from the Wi-Fi menu; no password is required.
            </Alert>
            <Typography variant="body2" color="text.secondary">
              Web browsers cannot scan or change your computer's Wi-Fi network. The camera node performs the nearby-network scan on its private setup page.
            </Typography>
            <Paper variant="outlined" sx={{ p: 1.5 }}>
              <Typography variant="body2"><strong>Windows:</strong> select the network icon on the taskbar, then choose {setupNetwork}.</Typography>
              <Typography variant="body2" sx={{ mt: 1 }}><strong>macOS:</strong> select Wi-Fi in Control Center or the menu bar, then choose {setupNetwork}.</Typography>
            </Paper>
          </Box>
        );
      case 1:
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Alert severity="warning">
              Use a 2.4 GHz network. ESP32-S3 cannot join a 5 GHz-only SSID.
            </Alert>
            <Button variant="contained" onClick={() => window.open('http://192.168.4.1', 'tendercells-device-setup', 'noopener,noreferrer')}>
              Open Camera Node Wi-Fi Setup
            </Button>
            <Typography variant="body2" color="text.secondary">
              The node scans nearby networks on that page. Select your main Wi-Fi and enter its password there; TenderCells never receives or stores it.
            </Typography>
            <Alert severity="info">
              In the portal, set Device ID to <strong>{product.device_id || 'the ID shown on the registry card'}</strong>. Keep that value identical so discovery, MQTT, and the dashboard agree.
            </Alert>
            <TextField
              fullWidth
              label="Selected home network"
              value={ssid}
              onChange={(e) => setSsid(e.target.value)}
              placeholder="2.4 GHz SSID shown in the node portal"
            />
            <FormControl fullWidth>
              <InputLabel>Security Type</InputLabel>
              <Select value={securityType} onChange={(e) => setSecurityType(e.target.value as 'none' | 'WPA' | 'WPA2' | 'WPA3')} label="Security Type">
                <MenuItem value="none">None (Open)</MenuItem><MenuItem value="WPA">WPA</MenuItem><MenuItem value="WPA2">WPA2</MenuItem><MenuItem value="WPA3">WPA3</MenuItem>
              </Select>
            </FormControl>
            <FormControlLabel control={<Checkbox checked={portalComplete} onChange={(e) => setPortalComplete(e.target.checked)} />} label="The node portal confirmed Wi-Fi was saved" />
          </Box>
        );
      case 2:
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {isCamera ? (
              <>
                <TextField fullWidth label="Camera stream URL" value={streamUrl} onChange={(e) => { setStreamUrl(e.target.value); setCameraVerified(false); }} placeholder="http://192.168.1.50/stream" />
                <Button variant="outlined" disabled={!/^http:\/\/[^/]+\/stream$/i.test(streamUrl.trim())} onClick={() => window.open(streamUrl.trim(), 'tendercells-camera-test', 'noopener,noreferrer')}>
                  Open Live Camera Test
                </Button>
                <FormControlLabel control={<Checkbox checked={cameraVerified} onChange={(e) => setCameraVerified(e.target.checked)} />} label="I can see the live camera image" />
              </>
            ) : (
              <>
                <Alert severity="info">Confirm the device restarted on <strong>{ssid}</strong> and reports device ID <strong>{product.device_id || 'the registered device ID'}</strong>.</Alert>
                <FormControlLabel control={<Checkbox checked={cameraVerified} onChange={(e) => setCameraVerified(e.target.checked)} />} label="The node reports that it joined the home network" />
              </>
            )}
            {connectionStatus === 'error' && connectionError && (
              <Alert severity="error" sx={{ width: '100%' }}>
                <Typography variant="body2" fontWeight="medium">Connection Failed</Typography>
                <Typography variant="body2">{connectionError}</Typography>
                <Button
                  variant="contained"
                  size="small"
                  sx={{ mt: 2 }}
                  onClick={() => {
                    setConnectionStatus('idle');
                    setConnectionError(null);
                    setActiveStep(2);
                  }}
                >
                  Try Again
                </Button>
              </Alert>
            )}
          </Box>
        );
      case 3:
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center', py: 4 }}>
            <CheckCircle color="success" sx={{ fontSize: 64 }} />
            <Typography variant="h6" fontWeight="medium">
              Setup Complete!
            </Typography>
            <Typography variant="body2" color="text.secondary" textAlign="center">
              {product.product_name} is now connected and ready to use.
            </Typography>
          </Box>
        );
      default:
        return null;
    }
  };

  return (
    <Dialog
      open={isOpen}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Connect {product.product_name}</Typography>
          <IconButton onClick={handleClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
        <Typography variant="body2" color="text.secondary">
          Connect the real camera node without sharing its Wi-Fi password
        </Typography>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          <Stepper activeStep={activeStep}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
          <Box sx={{ mt: 4 }}>
            {renderStepContent(activeStep)}
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        {activeStep > 0 && activeStep < 3 && (
          <Button onClick={handleBack}>Back</Button>
        )}
        {activeStep < 3 && (
          <Button
            variant="contained"
            onClick={handleNext}
            disabled={
              (activeStep === 1 && (!ssid.trim() || !portalComplete)) ||
              (activeStep === 2 && ((isCamera && !/^http:\/\/[^/]+\/stream$/i.test(streamUrl.trim())) || !cameraVerified || connectionStatus === 'connecting'))
            }
          >
            Next
          </Button>
        )}
        {activeStep === 3 && (
          <Button variant="contained" onClick={handleComplete}>
            Done
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}

