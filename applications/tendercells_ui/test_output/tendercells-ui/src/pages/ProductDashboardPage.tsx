import { Alert, Box, Button, Chip, CircularProgress, FormControlLabel, Grid, Paper, Stack, Switch, Typography } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SettingsRemoteIcon from '@mui/icons-material/SettingsRemote';
import SystemUpdateAltIcon from '@mui/icons-material/SystemUpdateAlt';
import MicIcon from '@mui/icons-material/Mic';
import SdStorageIcon from '@mui/icons-material/SdStorage';
import BatteryChargingFullIcon from '@mui/icons-material/BatteryChargingFull';
import DeveloperBoardIcon from '@mui/icons-material/DeveloperBoard';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import HealthAndSafetyIcon from '@mui/icons-material/HealthAndSafety';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { useState } from 'react';
import { useProducts } from '../hooks/useProducts';
import Viewport3D from '../components/viewport/Viewport3D';
import CameraFeedViewer from '../components/camera/CameraFeedViewer';
import { useHardwareControl } from '../hooks/useHardwareControl';

export default function ProductDashboardPage() {
  const { productId = '' } = useParams();
  const navigate = useNavigate();
  const { products, loading, updateProduct } = useProducts();
  const [savingCapability, setSavingCapability] = useState<string | null>(null);
  const [capabilityError, setCapabilityError] = useState<string | null>(null);
  const product = products.find((item) => item.id === productId);
  const hardware = useHardwareControl(product?.device_id || 'unassigned');

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
                resolution: '720p',
                fps: 15,
                connected: product.connection_status === 'online' && Boolean(streamUrl),
              }} height={480} allowBrowserCamera={false} />
              {!streamUrl && <Typography variant="body2" color="text.secondary">Flash the camera, complete its WiFi setup, then add the reported <code>/stream</code> address in Configure.</Typography>}
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
