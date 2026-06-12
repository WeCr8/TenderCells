import React, { useEffect, useRef, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Alert,
  CircularProgress,
  Box,
  TextField,
  Typography,
  IconButton,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useTheme, useMediaQuery } from '@mui/material';

interface QRCodeScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (result: string) => void;
}

/**
 * QR Code Scanner component using html5-qrcode library
 * Falls back to manual input if camera is not available
 */
export default function QRCodeScanner({ isOpen, onClose, onScan }: QRCodeScannerProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const scannerRef = useRef<HTMLDivElement>(null);
  const html5QrCodeRef = useRef<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [useManual, setUseManual] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setError(null);
      setManualCode('');
      setUseManual(false);
      // Clean up scanner when dialog closes
      if (html5QrCodeRef.current) {
        html5QrCodeRef.current
          .stop()
          .then(() => {
            html5QrCodeRef.current?.clear();
            html5QrCodeRef.current = null;
          })
          .catch(() => {
            html5QrCodeRef.current = null;
          });
      }
      return;
    }

    // Try to initialize camera scanner
    const initScanner = async () => {
      try {
        // Dynamically import html5-qrcode - handle if package is not installed
        let Html5Qrcode: any;
        try {
          const module = await import('html5-qrcode');
          Html5Qrcode = module.Html5Qrcode;
        } catch (importError) {
          // Package not installed, fallback to manual input
          console.warn('html5-qrcode package not found, using manual input');
          setUseManual(true);
          return;
        }
        
        if (!scannerRef.current || !Html5Qrcode) {
          setUseManual(true);
          return;
        }

        // Clean up any existing scanner
        if (html5QrCodeRef.current) {
          try {
            await html5QrCodeRef.current.stop();
            html5QrCodeRef.current.clear();
          } catch (e) {
            // Ignore cleanup errors
          }
          html5QrCodeRef.current = null;
        }

        const html5QrCode = new Html5Qrcode('qr-scanner');
        html5QrCodeRef.current = html5QrCode;
        
        // Start scanning
        setLoading(true);
        try {
          await html5QrCode.start(
            { facingMode: 'environment' },
            {
              fps: 10,
              qrbox: { width: 250, height: 250 },
            },
            (decodedText) => {
              // Successfully scanned
              html5QrCode.stop().then(() => {
                html5QrCode.clear();
                html5QrCodeRef.current = null;
                onScan(decodedText);
                onClose();
              }).catch(() => {
                html5QrCodeRef.current = null;
              });
            },
            (errorMessage) => {
              // Ignore scanning errors (they're expected while scanning)
            }
          );
          setLoading(false);
        } catch (err) {
          // Camera permission denied or not available
          setUseManual(true);
          setLoading(false);
          html5QrCodeRef.current = null;
        }
      } catch (err) {
        // Library not available, use manual input
        setUseManual(true);
        setLoading(false);
        html5QrCodeRef.current = null;
      }
    };

    initScanner();

    // Cleanup function
    return () => {
      if (html5QrCodeRef.current) {
        html5QrCodeRef.current
          .stop()
          .then(() => {
            html5QrCodeRef.current?.clear();
            html5QrCodeRef.current = null;
          })
          .catch(() => {
            html5QrCodeRef.current = null;
          });
      }
    };
  }, [isOpen, onScan, onClose]);

  const handleManualSubmit = () => {
    if (manualCode.trim()) {
      onScan(manualCode.trim());
      onClose();
    }
  };

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      fullScreen={isMobile}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        Scan QR Code
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
          {error && (
            <Alert severity="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {useManual ? (
            <>
              <Typography variant="body2" color="text.secondary">
                Camera not available. Please enter the QR code manually:
              </Typography>
              <TextField
                fullWidth
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder="Enter QR code"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleManualSubmit();
                  }
                }}
              />
            </>
          ) : (
            <>
              {loading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                  <CircularProgress />
                </Box>
              )}
              <Box
                id="qr-scanner"
                ref={scannerRef}
                sx={{
                  width: '100%',
                  minHeight: '300px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: 'grey.100',
                  borderRadius: 1,
                }}
              />
              <Typography variant="body2" color="text.secondary" textAlign="center">
                Position the QR code within the frame
              </Typography>
            </>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        {useManual && (
          <Button
            onClick={handleManualSubmit}
            variant="contained"
            disabled={!manualCode.trim()}
          >
            Submit
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
