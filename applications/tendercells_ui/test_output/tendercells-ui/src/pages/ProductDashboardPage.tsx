import { Alert, Box, Button, Chip, CircularProgress, FormControl, FormControlLabel, Grid, IconButton, InputLabel, MenuItem, Paper, Select, Stack, Switch, Tooltip, Typography } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import SettingsRemoteIcon from '@mui/icons-material/SettingsRemote';
import SystemUpdateAltIcon from '@mui/icons-material/SystemUpdateAlt';
import MicIcon from '@mui/icons-material/Mic';
import SdStorageIcon from '@mui/icons-material/SdStorage';
import BatteryChargingFullIcon from '@mui/icons-material/BatteryChargingFull';
import DeveloperBoardIcon from '@mui/icons-material/DeveloperBoard';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import HealthAndSafetyIcon from '@mui/icons-material/HealthAndSafety';
import ThermostatIcon from '@mui/icons-material/Thermostat';
import WifiIcon from '@mui/icons-material/Wifi';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useProducts } from '../hooks/useProducts';
import Viewport3D from '../components/viewport/Viewport3D';
import CameraFeedViewer from '../components/camera/CameraFeedViewer';
import { useHardwareControl } from '../hooks/useHardwareControl';
import { useTelemetry } from '../hooks/useTelemetry';
import { classifyCameraStream } from '../lib/camera/cameraStream';

export default function ProductDashboardPage() {
  const { productId = '' } = useParams();
  const navigate = useNavigate();
  const { products, loading, updateProduct } = useProducts();
  const [savingCapability, setSavingCapability] = useState<string | null>(null);
  const [capabilityError, setCapabilityError] = useState<string | null>(null);
  const product = products.find((item) => item.id === productId);
  const availableCameras = products.filter((item) => String(item.metadata?.camera_stream_url || '').trim());
  const activeCameraIndex = availableCameras.findIndex((item) => item.id === productId);
  const hardware = useHardwareControl(product?.device_id || 'unassigned');
  const telemetry = useTelemetry(product?.device_id || 'unassigned');

  const selectCamera = (index: number) => {
    if (!availableCameras.length) return;
    const normalized = (index + availableCameras.length) % availableCameras.length;
    navigate(`/product/${encodeURIComponent(availableCameras[normalized].id)}`);
  };

  useEffect(() => {
    if (activeCameraIndex < 0 || availableCameras.length < 2) return undefined;
    const switchWithArrowKeys = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.matches('input, textarea, select, [contenteditable="true"]')) return;
      if (event.key === 'ArrowLeft') selectCamera(activeCameraIndex - 1);
      if (event.key === 'ArrowRight') selectCamera(activeCameraIndex + 1);
    };
    window.addEventListener('keydown', switchWithArrowKeys);
    return () => window.removeEventListener('keydown', switchWithArrowKeys);
  }, [activeCameraIndex, availableCameras.length]);

  if (loading) return <Box sx={{ minHeight: 360, display: 'grid', placeItems: 'center' }}><CircularProgress /></Box>;
  if (!product) return <Navigate to="/products" replace />;

  const family = String(product.metadata?.product_family || 'community-custom');
  const dimensions = [product.metadata?.enclosure_width_ft, product.metadata?.enclosure_depth_ft, product.metadata?.enclosure_height_ft]
    .filter((value) => Number(value) > 0)
    .join(' x ');
  const flashTarget = family === 'camera-kit' || String(product.metadata?.firmware_target || '').includes('camera-node')
    ? 'camera-node'
    : family === 'chicken-tender' ? 'chicken-tender' : 'starter-node';
  const openFlasher = () => {
    const params = new URLSearchParams({ target: flashTarget, product: family, name: product.product_name });
    if (product.device_id) params.set('deviceId', product.device_id);
    window.open(`/flash/?${params.toString()}`, '_blank', 'noopener,noreferrer');
  };
  const isCameraNode = family === 'camera-kit';
  const streamUrl = String(product.metadata?.camera_stream_url || '');
  const streamSecurity = classifyCameraStream(streamUrl);
  const hardwareCapabilities = Array.isArray(product.metadata?.hardware_capabilities) ? product.metadata.hardware_capabilities : [];
  const enabledCapabilities = Array.isArray(product.metadata?.enabled_capabilities) ? product.metadata.enabled_capabilities : [];
  const setCapabilityEnabled = async (capability: string, enabled: boolean) => {
    if (!hardwareCapabilities.includes(capability)) return;
    setSavingCapability(capability);
    setCapabilityError(null);
    const next = enabled
      ? [...new Set([...enabledCapabilities, capability])]
      : enabledCapabilities.filter((item) => item !== capability);
    try {
      await updateProduct(product.id, {
        metadata: { ...product.metadata, enabled_capabilities: next, capability_profile: 'custom' },
      });
      if (product.device_id && product.connection_status === 'online') {
        await hardware.configureCamera(next);
      }
    } catch (error) {
      setCapabilityError(error instanceof Error ? error.message : 'Could not update this board feature.');
    } finally {
      setSavingCapability(null);
    }
  };

  return (
    <Stack spacing={2.5}>
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" gap={2}>
        <Box>
          <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/dashboard')} size="small">Workspace</Button>
          <Typography variant="h4" sx={{ mt: 1 }}>{product.product_name}</Typography>
          <Typography color="text.secondary">{product.model || family}</Typography>
        </Box>
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
          <Chip label={product.connection_status} color={product.connection_status === 'online' ? 'success' : 'default'} />
          <Chip label={String(product.metadata?.connection_type || product.metadata?.build_source || 'registered')} variant="outlined" />
          <Button startIcon={<SystemUpdateAltIcon />} variant="outlined" onClick={openFlasher}>Flash / Program</Button>
          <Button startIcon={<SettingsRemoteIcon />} variant="contained" onClick={() => navigate(`/products?product=${encodeURIComponent(product.id)}`)}>
            Configure
          </Button>
        </Stack>
      </Stack>

      <Grid container spacing={2.5}>
        <Grid item xs={12} lg={8}>
          {isCameraNode ? (
            <Stack spacing={1.5}>
              <CameraFeedViewer camera={{
                id: product.id,
                deviceId: product.device_id || product.id,
                name: product.product_name,
                location: 'main-feed',
                streamUrl: streamUrl || undefined,
                // No camera firmware reports resolution/fps yet - omit rather
                // than claim a fixed 720p/15fps no device actually confirmed.
                connected: product.connection_status === 'online' && Boolean(streamUrl),
                signal: telemetry.data?.wifiRssi ?? undefined,
              }} height="min(62dvh, 480px)" allowBrowserCamera={false} />
              {activeCameraIndex >= 0 && availableCameras.length > 1 && (
                <Stack direction="row" spacing={1} alignItems="center">
                  <Tooltip title="Previous camera">
                    <IconButton aria-label="Previous camera" onClick={() => selectCamera(activeCameraIndex - 1)} size="large">
                      <ArrowBackIosNewIcon />
                    </IconButton>
                  </Tooltip>
                  <FormControl size="small" fullWidth>
                    <InputLabel id="camera-node-selector-label">Camera</InputLabel>
                    <Select
                      labelId="camera-node-selector-label"
                      value={product.id}
                      label="Camera"
                      onChange={(event) => navigate(`/product/${encodeURIComponent(String(event.target.value))}`)}
                    >
                      {availableCameras.map((cameraProduct) => (
                        <MenuItem key={cameraProduct.id} value={cameraProduct.id}>
                          {cameraProduct.product_name} · {cameraProduct.connection_status}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
                    {activeCameraIndex + 1} of {availableCameras.length}
                  </Typography>
                  <Tooltip title="Next camera">
                    <IconButton aria-label="Next camera" onClick={() => selectCamera(activeCameraIndex + 1)} size="large">
                      <ArrowForwardIosIcon />
                    </IconButton>
                  </Tooltip>
                </Stack>
              )}
              {!streamUrl && <Typography variant="body2" color="text.secondary">Flash the camera, complete its WiFi setup, then add the reported <code>/stream</code> address in Configure.</Typography>}
              {streamSecurity === 'local' && <Alert severity="info">Local-network stream: video stays on this Wi-Fi, but HTTP MJPEG is not encrypted. Authenticated remote viewing requires the TenderCells HTTPS relay.</Alert>}
              {streamSecurity === 'insecure-remote' && <Alert severity="error">This remote HTTP stream is not secure. Use a local address or an authenticated HTTPS relay URL.</Alert>}
            </Stack>
          ) : (
            <Viewport3D
              product={family}
              focusItemId={`virtual-${product.id}`}
              title={`${product.product_name} View`}
              initialWorkspaceMode="products"
            />
          )}
        </Grid>
        <Grid item xs={12} lg={4}>
          <Paper variant="outlined" sx={{ p: 2.5 }}>
            <Typography variant="h6" gutterBottom>Product Variation</Typography>
            <Stack spacing={1.25}>
              <Typography variant="body2"><strong>Family:</strong> {family}</Typography>
              <Typography variant="body2"><strong>Device:</strong> {product.device_id || 'Not assigned'}</Typography>
              <Typography variant="body2"><strong>Location:</strong> {product.location || 'Not placed'}</Typography>
              <Typography variant="body2"><strong>Dimensions:</strong> {dimensions ? `${dimensions} ft` : 'Family default'}</Typography>
              <Typography variant="body2"><strong>Firmware:</strong> {String(product.metadata?.firmware_target || 'Not assigned')}</Typography>
              <Typography variant="body2"><strong>Controller:</strong> {String(product.metadata?.controller_board || 'Not specified')}</Typography>
              <Typography variant="body2"><strong>Camera:</strong> {String(product.metadata?.camera_module || 'Not attached')}</Typography>
              <Typography variant="body2"><strong>Power:</strong> {String(product.metadata?.power_source || 'Not specified')}{product.metadata?.battery_capacity_mah ? ` / ${product.metadata.battery_capacity_mah} mAh` : ''}</Typography>
              {isCameraNode && <Typography variant="body2"><strong>Setup:</strong> {String(product.metadata?.capability_profile || 'custom').replace(/_/g, ' ')}</Typography>}
              {isCameraNode && (
                <Box>
                  <Typography variant="body2" sx={{ mb: 0.75 }}><strong>Enabled board features:</strong></Typography>
                  <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                    {hardwareCapabilities.map((capability) => (
                      <Chip
                        key={capability}
                        size="small"
                        variant={enabledCapabilities.includes(capability) ? 'filled' : 'outlined'}
                        color={enabledCapabilities.includes(capability) ? 'success' : 'default'}
                        label={capability.replace(/_/g, ' ')}
                      />
                    ))}
                  </Stack>
                </Box>
              )}
              <Typography variant="body2"><strong>3D asset:</strong> {product.metadata?.custom_device_asset_url ? 'Custom variation model' : 'Family model'}</Typography>
              {product.metadata?.source_url && <Typography variant="body2" sx={{ overflowWrap: 'anywhere' }}><strong>Source:</strong> {String(product.metadata.source_url)}</Typography>}
            </Stack>
          </Paper>
        </Grid>
      </Grid>

      {isCameraNode && (
        <Box>
          <Typography variant="h6" gutterBottom>Board Controls</Typography>
          {capabilityError && <Alert severity="error" sx={{ mb: 1.5 }}>{capabilityError}</Alert>}
          <Grid container spacing={1.5}>
            {[
              ['camera', 'Live camera', 'Show the live camera feed on this dashboard.'],
              ['microphone', 'Sound events', 'Make the onboard microphone available to compatible firmware routines.'],
              ['microsd', 'Local recording', 'Make the onboard microSD slot available to compatible firmware routines.'],
              ['gpio', 'Developer GPIO', 'Make board GPIO available to registered custom code and sensors.'],
            ].map(([capability, label, description]) => {
              const available = hardwareCapabilities.includes(capability);
              return (
                <Grid item xs={12} sm={6} key={capability}>
                  <Paper variant="outlined" sx={{ p: 1.75, height: '100%' }}>
                    <FormControlLabel
                      control={<Switch
                        checked={available && enabledCapabilities.includes(capability)}
                        disabled={!available || savingCapability === capability}
                        onChange={(event) => void setCapabilityEnabled(capability, event.target.checked)}
                      />}
                      label={label}
                    />
                    <Typography variant="body2" color="text.secondary">{available ? description : 'Not available on the registered board.'}</Typography>
                  </Paper>
                </Grid>
              );
            })}
          </Grid>
        </Box>
      )}

      {isCameraNode && (
        <Box>
          <Typography variant="h6" gutterBottom>Live Device Status</Typography>
          {telemetry.error && <Alert severity="info" sx={{ mb: 1.5 }}>{telemetry.error} Registered hardware remains available, but no live readings are being shown.</Alert>}
          <Grid container spacing={1.5}>
            {[
              {
                title: 'Power', icon: <BatteryChargingFullIcon />,
                value: telemetry.data?.batteryPercent != null ? `${telemetry.data.batteryPercent}%` : String(product.metadata?.power_source || 'Not specified'),
                detail: telemetry.data?.batteryVoltage != null ? `${telemetry.data.batteryVoltage.toFixed(2)} V reported by device` : hardwareCapabilities.includes('battery_power') ? 'Battery configured; level is not reporting.' : 'No battery monitor registered.',
              },
              {
                title: 'Temperature', icon: <ThermostatIcon />,
                value: telemetry.data?.temperature != null ? `${telemetry.data.temperature.toFixed(1)}°` : 'Not reporting',
                detail: hardwareCapabilities.includes('temperature') ? 'Temperature sensor is registered but has no current reading.' : 'No temperature sensor registered on this node.',
              },
              {
                title: 'Network', icon: <WifiIcon />,
                value: telemetry.data?.wifiRssi != null ? `${telemetry.data.wifiRssi} dBm` : product.connection_status,
                detail: telemetry.data?.lastSeen ? `Last telemetry ${telemetry.data.lastSeen}` : 'No telemetry heartbeat received.',
              },
              {
                title: 'Sound', icon: <MicIcon />,
                value: telemetry.data?.soundLevelDb != null ? `${telemetry.data.soundLevelDb.toFixed(1)} dB` : 'Not reporting',
                detail: hardwareCapabilities.includes('microphone') ? 'Microphone level appears only when enabled firmware publishes it.' : 'No microphone registered on this node.',
              },
            ].map(item => (
              <Grid item xs={12} sm={6} lg={3} key={item.title}>
                <Paper variant="outlined" sx={{ p: 1.75, height: '100%' }}>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.75 }}>{item.icon}<Typography fontWeight={600}>{item.title}</Typography></Stack>
                  <Typography variant="h6">{item.value}</Typography>
                  <Typography variant="body2" color="text.secondary">{item.detail}</Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {isCameraNode && (
        <Box>
          <Typography variant="h6" gutterBottom>Help & Documentation</Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
            <Button startIcon={<MenuBookIcon />} variant="outlined" onClick={() => navigate('/resources?category=guides')}>Camera Build Guide</Button>
            <Button startIcon={<MenuBookIcon />} variant="outlined" onClick={() => navigate('/resources')}>Animal, Plant & Health Resources</Button>
            <Button startIcon={<HealthAndSafetyIcon />} variant="outlined" onClick={() => navigate('/diagnostics')}>Device Diagnostics</Button>
          </Stack>
        </Box>
      )}

      {isCameraNode && (
        <Box>
          <Typography variant="h6" gutterBottom>Device Functions</Typography>
          <Grid container spacing={1.5}>
            {[
              { capability: 'microphone', title: 'Sound', icon: <MicIcon />, detail: 'Sound-event telemetry will appear when microphone firmware reports a real level.' },
              { capability: 'microsd', title: 'Storage', icon: <SdStorageIcon />, detail: 'Recording and free-space controls require a detected microSD card.' },
              { capability: 'battery_power', title: 'Battery', icon: <BatteryChargingFullIcon />, detail: 'Charge and voltage require a connected battery monitor or supported board reading.' },
              { capability: 'gpio', title: 'GPIO', icon: <DeveloperBoardIcon />, detail: 'Pin controls appear only after a pin map is registered for this device.' },
            ].filter(({ capability }) => hardwareCapabilities.includes(capability)).map(({ capability, title, icon, detail }) => {
              const enabled = enabledCapabilities.includes(capability);
              return (
                <Grid item xs={12} sm={6} lg={3} key={capability}>
                  <Paper variant="outlined" sx={{ p: 1.75, height: '100%' }}>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                      {icon}
                      <Typography fontWeight={600}>{title}</Typography>
                      <Chip size="small" label={enabled ? 'Enabled' : 'Off'} color={enabled ? 'success' : 'default'} />
                    </Stack>
                    <Typography variant="body2" color="text.secondary">{enabled ? detail : `Enable ${title.toLowerCase()} in Board Controls to configure it.`}</Typography>
                  </Paper>
                </Grid>
              );
            })}
          </Grid>
        </Box>
      )}
    </Stack>
  );
}
