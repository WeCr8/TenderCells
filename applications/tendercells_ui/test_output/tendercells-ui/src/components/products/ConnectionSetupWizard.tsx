import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  Divider,
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

interface SerialPortLike {
  readable: ReadableStream<Uint8Array> | null;
  writable: WritableStream<Uint8Array> | null;
  open(options: { baudRate: number }): Promise<void>;
  close(): Promise<void>;
  setSignals?(signals: { dataTerminalReady?: boolean; requestToSend?: boolean }): Promise<void>;
}

interface SerialNavigator extends Navigator {
  serial?: {
    requestPort(options?: { filters?: Array<{ usbVendorId: number }> }): Promise<SerialPortLike>;
  };
}

interface ScannedNetwork {
  ssid: string;
  rssi: number;
  secure: boolean;
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
  const [networks, setNetworks] = useState<ScannedNetwork[]>([]);
  const [networkScanStatus, setNetworkScanStatus] = useState<'idle' | 'scanning' | 'success' | 'error'>('idle');
  const [showManualSsid, setShowManualSsid] = useState(false);
  const [securityType, setSecurityType] = useState<'none' | 'WPA' | 'WPA2' | 'WPA3'>('WPA2');
  const [portalComplete, setPortalComplete] = useState(false);
  const [wifiPassword, setWifiPassword] = useState('');
  const [usbStatus, setUsbStatus] = useState<'idle' | 'connecting' | 'success' | 'error'>('idle');
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

  const scanNetworksOverUsb = async () => {
    const serialApi = (navigator as SerialNavigator).serial;
    if (!serialApi) {
      setConnectionError('Network scanning requires Chrome or Edge on Windows or macOS.');
      setNetworkScanStatus('error');
      return;
    }
    setConnectionError(null);
    setNetworkScanStatus('scanning');
    let port: SerialPortLike | null = null;
    let writer: WritableStreamDefaultWriter<Uint8Array> | null = null;
    let reader: ReadableStreamDefaultReader<Uint8Array> | null = null;
    try {
      port = await serialApi.requestPort({ filters: [{ usbVendorId: 0x303a }] });
      await port.open({ baudRate: 115200 });
      if (!port.writable || !port.readable) throw new Error('The serial connection did not open correctly.');
      if (port.setSignals) {
        await port.setSignals({ dataTerminalReady: false, requestToSend: true });
        await new Promise((resolve) => setTimeout(resolve, 120));
        await port.setSignals({ dataTerminalReady: false, requestToSend: false });
      }
      writer = port.writable.getWriter();
      reader = port.readable.getReader();
      const request = new TextEncoder().encode('TC_SCAN\n');
      const decoder = new TextDecoder();
      const sendTimer = window.setInterval(() => { void writer?.write(request); }, 500);
      window.setTimeout(() => window.clearInterval(sendTimer), 5000);
      await writer.write(request);
      let response = '';
      const result = await Promise.race([
        (async () => {
          while (true) {
            const chunk = await reader?.read();
            if (!chunk || chunk.done) throw new Error('The camera disconnected during the network scan.');
            response += decoder.decode(chunk.value, { stream: true });
            const match = response.match(/\[USB\] NETWORKS:(\[[^\r\n]*\])/);
            if (match) return JSON.parse(match[1]) as ScannedNetwork[];
          }
        })(),
        new Promise<never>((_, reject) => window.setTimeout(() => reject(new Error('The node did not return a network list. Reset it and retry.')), 20000)),
      ]);
      window.clearInterval(sendTimer);
      const unique = [...new Map(result.map((network) => [network.ssid, network])).values()]
        .sort((a, b) => b.rssi - a.rssi);
      setNetworks(unique);
      if (unique.length === 1) setSsid(unique[0].ssid);
      setNetworkScanStatus('success');
    } catch (error) {
      setNetworkScanStatus('error');
      setConnectionError(error instanceof Error ? error.message : 'Could not scan nearby networks.');
    } finally {
      try { await reader?.cancel(); } catch { /* Port may already be closed. */ }
      try { reader?.releaseLock(); } catch { /* Lock may already be released. */ }
      try { writer?.releaseLock(); } catch { /* Lock may already be released. */ }
      try { await port?.close(); } catch { /* Device resets after scanning. */ }
    }
  };

  const provisionOverUsb = async () => {
    const serialApi = (navigator as SerialNavigator).serial;
    if (!serialApi) {
      setConnectionError('USB setup requires Chrome or Edge on Windows or macOS. Use the camera portal fallback below.');
      setUsbStatus('error');
      return;
    }
    setConnectionError(null);
    setUsbStatus('connecting');
    let port: SerialPortLike | null = null;
    let writer: WritableStreamDefaultWriter<Uint8Array> | null = null;
    let reader: ReadableStreamDefaultReader<Uint8Array> | null = null;
    try {
      port = await serialApi.requestPort({ filters: [{ usbVendorId: 0x303a }] });
      await port.open({ baudRate: 115200 });
      if (!port.writable || !port.readable) throw new Error('The serial connection did not open correctly.');
      if (port.setSignals) {
        await port.setSignals({ dataTerminalReady: false, requestToSend: true });
        await new Promise((resolve) => setTimeout(resolve, 120));
        await port.setSignals({ dataTerminalReady: false, requestToSend: false });
      }

      writer = port.writable.getWriter();
      reader = port.readable.getReader();
      const message = new TextEncoder().encode(`TC_PROVISION:${JSON.stringify({
        ssid: ssid.trim(),
        password: wifiPassword,
        deviceId: product.device_id || '',
        broker: '',
      })}\n`);
      const decoder = new TextDecoder();
      const sendTimer = window.setInterval(() => { void writer?.write(message); }, 500);
      window.setTimeout(() => window.clearInterval(sendTimer), 5000);
      await writer.write(message);
      const confirmation = (async () => {
        let response = '';
        while (true) {
          const result = await reader.read();
          if (result.done) throw new Error('The camera disconnected during Wi-Fi setup.');
          response += decoder.decode(result.value, { stream: true });
          if (response.includes('[USB] ERROR')) throw new Error('The node could not join that network. Check the 2.4 GHz SSID and password.');
          if (response.includes('[USB] CONNECTED')) return;
        }
      })();
      try {
        await Promise.race([
          confirmation,
          new Promise<never>((_, reject) => window.setTimeout(() => reject(new Error('The node did not confirm Wi-Fi before the setup timeout. Reset it and retry.')), 32000)),
        ]);
      } finally {
        window.clearInterval(sendTimer);
      }
      setWifiPassword('');
      setPortalComplete(true);
      setUsbStatus('success');
    } catch (error) {
      setWifiPassword('');
      setUsbStatus('error');
      setConnectionError(error instanceof Error ? error.message : 'USB Wi-Fi setup failed.');
    } finally {
      try { await reader?.cancel(); } catch { /* Port may already be closed. */ }
      try { reader?.releaseLock(); } catch { /* Lock may already be released. */ }
      try { writer?.releaseLock(); } catch { /* Lock may already be released. */ }
      try { await port?.close(); } catch { /* Device resets after provisioning. */ }
    }
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
    setNetworks([]);
    setNetworkScanStatus('idle');
    setShowManualSsid(false);
    setSecurityType('WPA2');
    setPortalComplete(false);
    setWifiPassword('');
    setUsbStatus('idle');
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
              Keep this computer on its normal Wi-Fi and connect the registered device by USB. Chrome or Edge can send network credentials directly to the board in the next step.
            </Alert>
            <Typography variant="body2" color="text.secondary">
              If USB setup is unavailable, the device also creates <strong>{setupNetwork}</strong> for captive-portal setup.
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
            <Typography variant="subtitle2">Recommended: provision over USB</Typography>
            <Button variant="outlined" disabled={networkScanStatus === 'scanning'} onClick={() => void scanNetworksOverUsb()}>
              {networkScanStatus === 'scanning' ? 'Scanning with Camera...' : 'Scan Nearby Networks'}
            </Button>
            {networks.length > 0 ? (
              <FormControl fullWidth>
                <InputLabel>2.4 GHz network</InputLabel>
                <Select value={showManualSsid ? '__hidden__' : ssid} label="2.4 GHz network" onChange={(e) => {
                  const value = e.target.value;
                  setShowManualSsid(value === '__hidden__');
                  setSsid(value === '__hidden__' ? '' : value);
                  setPortalComplete(false);
                  setUsbStatus('idle');
                }}>
                  {networks.map((network) => (
                    <MenuItem key={network.ssid} value={network.ssid}>
                      {network.ssid} ({network.rssi >= -55 ? 'Strong' : network.rssi >= -70 ? 'Good' : 'Weak'}){network.secure ? '' : ' - Open'}
                    </MenuItem>
                  ))}
                  <MenuItem value="__hidden__">Hidden network...</MenuItem>
                </Select>
              </FormControl>
            ) : (
              <TextField fullWidth label="2.4 GHz network name" value={ssid} onChange={(e) => { setSsid(e.target.value); setPortalComplete(false); setUsbStatus('idle'); }} helperText="Scan with the camera, or type the name for a hidden network." />
            )}
            {showManualSsid && <TextField fullWidth label="Hidden network name" value={ssid} onChange={(e) => setSsid(e.target.value)} />}
            <TextField fullWidth type="password" autoComplete="new-password" label="Wi-Fi password" value={wifiPassword} onChange={(e) => setWifiPassword(e.target.value)} helperText="Sent directly to the ESP32-S3 over USB; never saved by TenderCells." />
            <Button variant="contained" disabled={!ssid.trim() || (securityType !== 'none' && !wifiPassword) || usbStatus === 'connecting'} onClick={() => void provisionOverUsb()}>
              {usbStatus === 'connecting' ? 'Connecting over USB...' : usbStatus === 'success' ? 'Wi-Fi Saved on Device' : 'Connect Device over USB'}
            </Button>
            {usbStatus === 'success' && <Alert severity="success">The node joined {ssid}. This computer stayed on its current network.</Alert>}
            {connectionError && usbStatus === 'error' && <Alert severity="error">{connectionError}</Alert>}
            <Divider>Captive portal fallback</Divider>
            <Button variant="contained" onClick={() => window.open('http://192.168.4.1', 'tendercells-device-setup', 'noopener,noreferrer')}>
              Open Camera Node Wi-Fi Setup
            </Button>
            <Typography variant="body2" color="text.secondary">
              The node scans nearby networks on that page. Select your main Wi-Fi and enter its password there; TenderCells never receives or stores it.
            </Typography>
            <Alert severity="info">
              In the portal, set Device ID to <strong>{product.device_id || 'the ID shown on the registry card'}</strong>. Keep that value identical so discovery, MQTT, and the dashboard agree.
            </Alert>
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

