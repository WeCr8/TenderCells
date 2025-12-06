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
  CircularProgress,
  IconButton,
} from '@mui/material';
import {
  Close as CloseIcon,
  CheckCircle,
  Wifi,
} from '@mui/icons-material';
import type { Product, NetworkConfig } from '../../types/products';
import { useProducts } from '../../hooks/useProducts';

interface ConnectionSetupWizardProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
  onComplete?: () => void;
}

const steps = ['Network', 'Credentials', 'Pairing', 'Verification'];

export default function ConnectionSetupWizard({
  isOpen,
  onClose,
  product,
  onComplete,
}: ConnectionSetupWizardProps) {
  const { connectProduct } = useProducts();
  const [activeStep, setActiveStep] = useState(0);
  const [ssid, setSsid] = useState('');
  const [password, setPassword] = useState('');
  const [securityType, setSecurityType] = useState<'none' | 'WPA' | 'WPA2' | 'WPA3'>('WPA2');
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'connecting' | 'success' | 'error'>('idle');

  const handleNext = async () => {
    if (activeStep === steps.length - 1) {
      handleComplete();
      return;
    }

    if (activeStep === 1) {
      // Move to pairing and start connection
      setActiveStep(2);
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
      // Simulate pairing process
      await new Promise(resolve => setTimeout(resolve, 2000));

      const networkConfig: NetworkConfig = {
        ssid: ssid.trim(),
        password: password.trim() || undefined,
        securityType,
        connected: true,
        lastConnected: new Date().toISOString(),
      };

      await connectProduct(product.id, { network_config: networkConfig });
      setConnectionStatus('success');

      // Move to verification after a short delay
      setTimeout(() => {
        setActiveStep(3);
        setIsConnecting(false);
      }, 1000);
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
    setPassword('');
    setSecurityType('WPA2');
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
            <TextField
              fullWidth
              label="WiFi Network (SSID)"
              value={ssid}
              onChange={(e) => setSsid(e.target.value)}
              placeholder="Enter network name"
              InputProps={{
                startAdornment: <Wifi sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
            />
            <FormControl fullWidth>
              <InputLabel>Security Type</InputLabel>
              <Select
                value={securityType}
                onChange={(e) => setSecurityType(e.target.value as any)}
                label="Security Type"
              >
                <MenuItem value="none">None (Open)</MenuItem>
                <MenuItem value="WPA">WPA</MenuItem>
                <MenuItem value="WPA2">WPA2</MenuItem>
                <MenuItem value="WPA3">WPA3</MenuItem>
              </Select>
            </FormControl>
          </Box>
        );
      case 1:
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              fullWidth
              label="Network Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={securityType === 'none' ? 'No password required' : 'Enter WiFi password'}
              disabled={securityType === 'none'}
            />
            <Typography variant="body2" color="text.secondary">
              Connecting to: <strong>{ssid}</strong>
            </Typography>
          </Box>
        );
      case 2:
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center', py: 4 }}>
            {connectionStatus === 'connecting' && (
              <>
                <CircularProgress size={48} />
                <Typography variant="body1">Connecting to device...</Typography>
                <Typography variant="body2" color="text.secondary">
                  Make sure the device is in pairing mode
                </Typography>
              </>
            )}
            {connectionStatus === 'success' && (
              <>
                <CheckCircle color="success" sx={{ fontSize: 48 }} />
                <Typography variant="body1" fontWeight="medium">
                  Connection successful!
                </Typography>
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
                    setActiveStep(1);
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
          Setup WiFi and pairing
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
        {activeStep > 0 && activeStep < 2 && (
          <Button onClick={handleBack}>Back</Button>
        )}
        {activeStep < 2 && (
          <Button
            variant="contained"
            onClick={handleNext}
            disabled={
              (activeStep === 0 && !ssid.trim()) ||
              (activeStep === 1 && securityType !== 'none' && !password.trim())
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

