import { Box, Button, Chip, CircularProgress, Grid, Paper, Stack, Typography } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SettingsRemoteIcon from '@mui/icons-material/SettingsRemote';
import SystemUpdateAltIcon from '@mui/icons-material/SystemUpdateAlt';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { useProducts } from '../hooks/useProducts';
import Viewport3D from '../components/viewport/Viewport3D';

export default function ProductDashboardPage() {
  const { productId = '' } = useParams();
  const navigate = useNavigate();
  const { products, loading } = useProducts();
  const product = products.find((item) => item.id === productId);

  if (loading) return <Box sx={{ minHeight: 360, display: 'grid', placeItems: 'center' }}><CircularProgress /></Box>;
  if (!product) return <Navigate to="/products" replace />;

  const family = String(product.metadata?.product_family || 'community-custom');
  const dimensions = [product.metadata?.enclosure_width_ft, product.metadata?.enclosure_depth_ft, product.metadata?.enclosure_height_ft]
    .filter((value) => Number(value) > 0)
    .join(' x ');
  const flashTarget = family === 'camera-kit' || String(product.metadata?.firmware_target || '').includes('watchtower-cam')
    ? 'watchtower-cam'
    : family === 'chicken-tender' ? 'chicken-tender' : 'starter-node';
  const openFlasher = () => {
    const params = new URLSearchParams({ target: flashTarget, product: family, name: product.product_name });
    if (product.device_id) params.set('deviceId', product.device_id);
    window.open(`/flash/?${params.toString()}`, '_blank', 'noopener,noreferrer');
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
          <Viewport3D
            product={family}
            focusItemId={`virtual-${product.id}`}
            title={`${product.product_name} View`}
            initialWorkspaceMode="products"
          />
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
              <Typography variant="body2"><strong>3D asset:</strong> {product.metadata?.custom_device_asset_url ? 'Custom variation model' : 'Family model'}</Typography>
              {product.metadata?.source_url && <Typography variant="body2" sx={{ overflowWrap: 'anywhere' }}><strong>Source:</strong> {String(product.metadata.source_url)}</Typography>}
            </Stack>
          </Paper>
        </Grid>
      </Grid>
    </Stack>
  );
}
