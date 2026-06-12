import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Tabs,
  Tab,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  Box,
  Typography,
  IconButton,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useTheme, useMediaQuery } from '@mui/material';
import QRCodeScanner from './QRCodeScanner';
import ConnectionSetupWizard from './ConnectionSetupWizard';
import type { RegisterProductData, ProductType, Product } from '../../types/products';

interface ProductRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRegister: (data: RegisterProductData) => Promise<Product | void>;
  showConnectionWizardAfterRegister?: boolean;
}

export default function ProductRegistrationModal({
  isOpen,
  onClose,
  onRegister,
  showConnectionWizardAfterRegister = true,
}: ProductRegistrationModalProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [activeTab, setActiveTab] = useState<number>(0);
  const [productType, setProductType] = useState<ProductType>('hardware_unit');
  const [productName, setProductName] = useState('');
  const [model, setModel] = useState('');
  const [location, setLocation] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [activationCode, setActivationCode] = useState('');
  const [qrCode, setQrCode] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [qrScannerOpen, setQrScannerOpen] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [registeredProduct, setRegisteredProduct] = useState<Product | null>(null);
  const [isConnectionWizardOpen, setIsConnectionWizardOpen] = useState(false);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setActiveTab(0);
      setProductType('hardware_unit');
      setProductName('');
      setModel('');
      setLocation('');
      setSerialNumber('');
      setActivationCode('');
      setQrCode('');
      setErrors({});
      setSubmitError(null);
      setRegisteredProduct(null);
      setIsConnectionWizardOpen(false);
    }
  }, [isOpen]);

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
    setErrors({});
    setSubmitError(null);
  };

  const handleQRScan = (result: string) => {
    setQrCode(result);
    setQrScannerOpen(false);
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors.qr_code;
      return newErrors;
    });
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!productName.trim()) {
      newErrors.productName = 'Product name is required';
    }

    if (!location.trim()) {
      newErrors.location = 'Location is required';
    }

    // Validate based on active tab (registration method)
    if (activeTab === 0 && !serialNumber.trim()) {
      newErrors.serialNumber = 'Serial number is required';
    } else if (activeTab === 1 && !qrCode.trim()) {
      newErrors.qrCode = 'QR code is required. Please scan or enter manually.';
    } else if (activeTab === 2 && !activationCode.trim()) {
      newErrors.activationCode = 'Activation code is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const registrationData: RegisterProductData = {
        product_type: productType,
        product_name: productName.trim(),
        model: model.trim() || undefined,
        location: location.trim(),
        serial_number: activeTab === 0 ? serialNumber.trim() : undefined,
        qr_code: activeTab === 1 ? qrCode.trim() : undefined,
        activation_code: activeTab === 2 ? activationCode.trim() : undefined,
      };

      const result = await onRegister(registrationData);
      
      // If registration returns a product and we should show connection wizard, open it
      if (result && 'id' in result && showConnectionWizardAfterRegister) {
        setRegisteredProduct(result as Product);
        setIsConnectionWizardOpen(true);
        // Keep modal open but show connection wizard instead
      } else {
        onClose();
      }
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to register product');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Dialog
        open={isOpen}
        onClose={onClose}
        fullScreen={isMobile}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Register New Product
          <IconButton
            aria-label="close"
            onClick={onClose}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            {submitError && (
              <Alert severity="error" onClose={() => setSubmitError(null)}>
                {submitError}
              </Alert>
            )}

            {/* Product Type Selection */}
            <FormControl fullWidth required>
              <InputLabel>Product Type</InputLabel>
              <Select
                value={productType}
                onChange={(e) => setProductType(e.target.value as ProductType)}
                label="Product Type"
              >
                <MenuItem value="hardware_unit">Hardware Unit</MenuItem>
                <MenuItem value="automation_device">Automation Device</MenuItem>
              </Select>
            </FormControl>

            {/* Product Name */}
            <TextField
              fullWidth
              label="Product Name"
              value={productName}
              onChange={(e) => {
                setProductName(e.target.value);
                if (errors.productName) {
                  setErrors(prev => {
                    const newErrors = { ...prev };
                    delete newErrors.productName;
                    return newErrors;
                  });
                }
              }}
              required
              error={!!errors.productName}
              helperText={errors.productName}
              placeholder="e.g., Chicken Tender, Roaming Roost"
            />

            {/* Model */}
            <TextField
              fullWidth
              label="Model"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="Product model (optional)"
            />

            {/* Location */}
            <TextField
              fullWidth
              label="Location"
              value={location}
              onChange={(e) => {
                setLocation(e.target.value);
                if (errors.location) {
                  setErrors(prev => {
                    const newErrors = { ...prev };
                    delete newErrors.location;
                    return newErrors;
                  });
                }
              }}
              required
              error={!!errors.location}
              helperText={errors.location}
              placeholder="e.g., Main Coop, Run A"
            />

            {/* Registration Method Tabs */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mt: 2 }}>
              <Tabs value={activeTab} onChange={handleTabChange} variant="fullWidth">
                <Tab label="Serial Number" />
                <Tab label="QR Code" />
                <Tab label="Activation Code" />
              </Tabs>
            </Box>

            {/* Serial Number Tab */}
            {activeTab === 0 && (
              <TextField
                fullWidth
                label="Serial Number"
                value={serialNumber}
                onChange={(e) => {
                  setSerialNumber(e.target.value);
                  if (errors.serialNumber) {
                    setErrors(prev => {
                      const newErrors = { ...prev };
                      delete newErrors.serialNumber;
                      return newErrors;
                    });
                  }
                }}
                required
                error={!!errors.serialNumber}
                helperText={errors.serialNumber}
                placeholder="Enter product serial number"
              />
            )}

            {/* QR Code Tab */}
            {activeTab === 1 && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Button
                  variant="outlined"
                  onClick={() => setQrScannerOpen(true)}
                  fullWidth
                >
                  Scan QR Code
                </Button>
                <TextField
                  fullWidth
                  label="QR Code"
                  value={qrCode}
                  onChange={(e) => {
                    setQrCode(e.target.value);
                    if (errors.qrCode) {
                      setErrors(prev => {
                        const newErrors = { ...prev };
                        delete newErrors.qrCode;
                        return newErrors;
                      });
                    }
                  }}
                  required
                  error={!!errors.qrCode}
                  helperText={errors.qrCode || 'Scan QR code or enter manually'}
                  placeholder="QR code will appear here after scanning"
                />
              </Box>
            )}

            {/* Activation Code Tab */}
            {activeTab === 2 && (
              <TextField
                fullWidth
                label="Activation Code"
                value={activationCode}
                onChange={(e) => {
                  setActivationCode(e.target.value);
                  if (errors.activationCode) {
                    setErrors(prev => {
                      const newErrors = { ...prev };
                      delete newErrors.activationCode;
                      return newErrors;
                    });
                  }
                }}
                required
                error={!!errors.activationCode}
                helperText={errors.activationCode}
                placeholder="Enter activation code"
              />
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Registering...' : 'Register Product'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* QR Code Scanner Modal */}
      <QRCodeScanner
        isOpen={qrScannerOpen}
        onClose={() => setQrScannerOpen(false)}
        onScan={handleQRScan}
      />

      {/* Connection Setup Wizard - Opens after product registration */}
      {registeredProduct && (
        <ConnectionSetupWizard
          isOpen={isConnectionWizardOpen}
          onClose={() => {
            setIsConnectionWizardOpen(false);
            setRegisteredProduct(null);
            onClose(); // Close registration modal after connection wizard closes
          }}
          product={registeredProduct}
          onComplete={() => {
            setIsConnectionWizardOpen(false);
            setRegisteredProduct(null);
            onClose();
          }}
        />
      )}
    </>
  );
}

