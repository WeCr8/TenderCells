import React, { useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Drawer,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  Add as AddIcon,
  Build as BuildIcon,
  Delete as DeleteIcon,
  Devices as DevicesIcon,
  Edit as EditIcon,
  Hub as HubIcon,
  Inventory2 as InventoryIcon,
  Link as LinkIcon,
  Refresh as RefreshIcon,
  Router as RouterIcon,
  Visibility as VisibilityIcon,
  Wifi as WifiIcon,
  WifiOff as WifiOffIcon,
} from '@mui/icons-material';
import { useProducts } from '../hooks/useProducts';
import ProductRegistrationModal from '../components/products/ProductRegistrationModal';
import ConnectionSetupWizard from '../components/products/ConnectionSetupWizard';
import type {
  ConnectionStatus,
  Product,
  ProductFilter,
  ProductFamily,
  ProductStatus,
  ProductType,
  RegisterProductData,
  BuildSource,
  UpdateProductData,
} from '../types/products';
import { ProductsService } from '../services/productsService';

type EditableProduct = {
  product_name: string;
  model: string;
  location: string;
  device_id: string;
  status: ProductStatus;
  connection_status: ConnectionStatus;
  owner_email: string;
  product_family: string;
  build_source: string;
  custom_product_name: string;
  animal_count: string;
  hardware_setup_mode: string;
  simulation_backend: string;
  simulation_profile: string;
  robotics_middleware: string;
  property_scene_url: string;
  terrain_source: string;
  terrain_capture_device_id: string;
  custom_device_asset_url: string;
  telemetry_consent: string;
  telemetry_retention_days: string;
  safety_validation_status: string;
  asset_license: string;
  cad_revision: string;
  firmware_contract_version: string;
  pinout_revision: string;
  hardware_revision: string;
  firmware_target: string;
  firmware_version: string;
  mqtt_base_topic: string;
  repo_url: string;
  schematic_url: string;
  notes: string;
};

const emptyEditForm: EditableProduct = {
  product_name: '',
  model: '',
  location: '',
  device_id: '',
  status: 'setup_required',
  connection_status: 'offline',
  owner_email: '',
  product_family: 'chicken-tender',
  build_source: 'tendercells-kit',
  custom_product_name: '',
  animal_count: '4',
  hardware_setup_mode: 'sim_only',
  simulation_backend: 'browser_threejs',
  simulation_profile: 'layout-and-axis-preview',
  robotics_middleware: 'mqtt_bridge',
  property_scene_url: '',
  terrain_source: 'manual_layout',
  terrain_capture_device_id: '',
  custom_device_asset_url: '',
  telemetry_consent: 'not_requested',
  telemetry_retention_days: '30',
  safety_validation_status: 'not_started',
  asset_license: '',
  cad_revision: '',
  firmware_contract_version: '',
  pinout_revision: '',
  hardware_revision: '',
  firmware_target: '',
  firmware_version: '',
  mqtt_base_topic: '',
  repo_url: '',
  schematic_url: '',
  notes: '',
};

const statusColor = (status: ProductStatus): 'success' | 'warning' | 'error' | 'default' => {
  if (status === 'connected') return 'success';
  if (status === 'registered') return 'success';
  if (status === 'setup_required') return 'warning';
  if (status === 'disconnected') return 'error';
  return 'default';
};

const connectionColor = (status: ConnectionStatus): 'success' | 'warning' | 'error' | 'default' => {
  if (status === 'online') return 'success';
  if (status === 'connecting') return 'warning';
  if (status === 'error') return 'error';
  return 'default';
};

const formatDate = (value?: string) => {
  if (!value) return 'Never';
  return new Date(value).toLocaleString();
};

const displayOwner = (product: Product) => {
  const owner = String(product.metadata?.owner_email || product.user_id || '');
  if (!owner) return 'Private local owner';
  if (owner === ProductsService.GARAGE_OWNER_EMAIL) return 'Private local owner';
  if (owner.includes('@')) return 'Private local owner';
  return owner;
};

const editableOwnerValue = (product: Product) => {
  const owner = displayOwner(product);
  return owner === 'Private local owner' ? '' : owner;
};

const getProductNeeds = (product: Product) => {
  const needs: string[] = [];
  if (product.status === 'setup_required') needs.push('Complete setup');
  if (product.connection_status !== 'online') needs.push('Bring online');
  if (!product.device_id) needs.push('Assign device id');
  if (!product.location) needs.push('Set location');
  if (!product.model) needs.push('Set model/build');
  if (!product.metadata?.hardware_revision) needs.push('Hardware revision');
  if (!product.metadata?.firmware_target) needs.push('Firmware target');
  if (!product.metadata?.mqtt_base_topic) needs.push('MQTT topic');
  if (product.product_type === 'custom_product' && !product.metadata?.custom_product_name) needs.push('Custom name');
  return needs;
};

const productToForm = (product: Product): EditableProduct => ({
  product_name: product.product_name,
  model: product.model || '',
  location: product.location || '',
  device_id: product.device_id || '',
  status: product.status,
  connection_status: product.connection_status,
  owner_email: editableOwnerValue(product),
  product_family: String(product.metadata?.product_family || 'community-custom'),
  build_source: String(product.metadata?.build_source || 'prototype'),
  custom_product_name: String(product.metadata?.custom_product_name || ''),
  animal_count: String(product.metadata?.animal_count || ''),
  hardware_setup_mode: String(product.metadata?.hardware_setup_mode || 'sim_only'),
  simulation_backend: String(product.metadata?.simulation_backend || 'browser_threejs'),
  simulation_profile: String(product.metadata?.simulation_profile || ''),
  robotics_middleware: String(product.metadata?.robotics_middleware || 'mqtt_bridge'),
  property_scene_url: String(product.metadata?.property_scene_url || ''),
  terrain_source: String(product.metadata?.terrain_source || 'manual_layout'),
  terrain_capture_device_id: String(product.metadata?.terrain_capture_device_id || ''),
  custom_device_asset_url: String(product.metadata?.custom_device_asset_url || ''),
  telemetry_consent: String(product.metadata?.telemetry_consent || 'not_requested'),
  telemetry_retention_days: String(product.metadata?.telemetry_retention_days || '30'),
  safety_validation_status: String(product.metadata?.safety_validation_status || 'not_started'),
  asset_license: String(product.metadata?.asset_license || ''),
  cad_revision: String(product.metadata?.cad_revision || ''),
  firmware_contract_version: String(product.metadata?.firmware_contract_version || ''),
  pinout_revision: String(product.metadata?.pinout_revision || ''),
  hardware_revision: String(product.metadata?.hardware_revision || ''),
  firmware_target: String(product.metadata?.firmware_target || ''),
  firmware_version: String(product.metadata?.firmware_version || ''),
  mqtt_base_topic: String(product.metadata?.mqtt_base_topic || ''),
  repo_url: String(product.metadata?.repo_url || ''),
  schematic_url: String(product.metadata?.schematic_url || ''),
  notes: String(product.metadata?.notes || ''),
});

export default function ProductsPage() {
  const {
    products,
    stats,
    loading,
    error,
    refetch,
    registerProduct,
    updateProduct,
    deleteProduct,
    connectProduct,
    disconnectProduct,
    seedFirstGarageCoop,
  } = useProducts();
  const [isRegistrationModalOpen, setIsRegistrationModalOpen] = useState(false);
  const [connectionProduct, setConnectionProduct] = useState<Product | null>(null);
  const [detailProduct, setDetailProduct] = useState<Product | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editForm, setEditForm] = useState<EditableProduct>(emptyEditForm);
  const [filter, setFilter] = useState<ProductFilter>({});
  const [search, setSearch] = useState('');

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const haystack = [
        product.product_name,
        product.model,
        product.serial_number,
        product.activation_code,
        product.device_id,
        product.location,
        product.metadata?.product_family,
        product.metadata?.build_source,
        product.metadata?.custom_product_name,
        product.metadata?.mqtt_base_topic,
        product.metadata?.hardware_revision,
        product.metadata?.firmware_target,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return !search || haystack.includes(search.toLowerCase());
    });
  }, [products, search]);

  const openEditDialog = (product: Product) => {
    setEditingProduct(product);
    setEditForm(productToForm(product));
  };

  const closeEditDialog = () => {
    setEditingProduct(null);
    setEditForm(emptyEditForm);
  };

  const handleRegister = async (data: RegisterProductData) => {
    await registerProduct(data);
    await refetch(filter);
  };

  const handleFilterChange = async (newFilter: ProductFilter) => {
    const nextFilter = { ...filter, ...newFilter };
    setFilter(nextFilter);
    await refetch(nextFilter);
  };

  const handleSaveEdit = async () => {
    if (!editingProduct) return;

    const updates: UpdateProductData = {
      product_name: editForm.product_name,
      model: editForm.model,
      location: editForm.location,
      device_id: editForm.device_id,
      status: editForm.status,
      connection_status: editForm.connection_status,
      last_seen: editForm.connection_status === 'online' ? new Date().toISOString() : editingProduct.last_seen,
      network_config: {
        ...editingProduct.network_config,
        connected: editForm.connection_status === 'online',
      },
      metadata: {
        ...editingProduct.metadata,
        owner_email: editForm.owner_email,
        product_family: editForm.product_family,
        build_source: editForm.build_source,
        custom_product_name: editForm.custom_product_name,
        animal_count: editForm.animal_count ? Number(editForm.animal_count) : undefined,
        hardware_setup_mode: editForm.hardware_setup_mode,
        simulation_backend: editForm.simulation_backend,
        simulation_profile: editForm.simulation_profile,
        robotics_middleware: editForm.robotics_middleware,
        property_scene_url: editForm.property_scene_url,
        terrain_source: editForm.terrain_source,
        terrain_capture_device_id: editForm.terrain_capture_device_id,
        custom_device_asset_url: editForm.custom_device_asset_url,
        property_simulation_enabled: Boolean(editForm.property_scene_url),
        telemetry_learning_enabled: Boolean(editForm.terrain_capture_device_id),
        nvidia_isaac_enabled: editForm.simulation_backend === 'nvidia_isaac',
        telemetry_consent: editForm.telemetry_consent,
        telemetry_retention_days: editForm.telemetry_retention_days ? Number(editForm.telemetry_retention_days) : undefined,
        telemetry_export_enabled: editForm.telemetry_consent !== 'not_requested',
        safety_validation_status: editForm.safety_validation_status,
        asset_license: editForm.asset_license,
        cad_revision: editForm.cad_revision,
        firmware_contract_version: editForm.firmware_contract_version,
        pinout_revision: editForm.pinout_revision,
        hardware_revision: editForm.hardware_revision,
        firmware_target: editForm.firmware_target,
        firmware_version: editForm.firmware_version,
        mqtt_base_topic: editForm.mqtt_base_topic,
        repo_url: editForm.repo_url,
        schematic_url: editForm.schematic_url,
        notes: editForm.notes,
      },
    };

    const updated = await updateProduct(editingProduct.id, updates);
    setDetailProduct((current) => (current?.id === updated.id ? updated : current));
    closeEditDialog();
  };

  const handleDelete = async (product: Product) => {
    if (!confirm(`Remove ${product.product_name} from the registry?`)) return;
    await deleteProduct(product.id);
    setDetailProduct((current) => (current?.id === product.id ? null : current));
  };

  const handleQuickConnect = async (product: Product) => {
    await connectProduct(product.id, {
      network_config: {
        ...product.network_config,
        connected: true,
        lastConnected: new Date().toISOString(),
      },
    });
    await refetch(filter);
  };

  const handleDisconnect = async (product: Product) => {
    await disconnectProduct(product.id);
    await refetch(filter);
  };

  const summaryItems = [
    { label: 'Registered', value: stats?.totalProducts ?? products.length, icon: <InventoryIcon /> },
    { label: 'Hardware Units', value: stats?.hardwareUnits ?? 0, icon: <DevicesIcon /> },
    { label: 'Automation Devices', value: stats?.automationDevices ?? 0, icon: <HubIcon /> },
    { label: 'Online', value: stats?.onlineProducts ?? 0, icon: <WifiIcon /> },
    { label: 'Setup Needed', value: stats?.setupRequired ?? 0, icon: <BuildIcon /> },
  ];

  return (
    <Box sx={{ p: { xs: 1.5, sm: 2, md: 3 } }}>
      <Stack direction={{ xs: 'column', lg: 'row' }} spacing={2} justifyContent="space-between" sx={{ mb: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontSize: { xs: 26, md: 34 }, fontWeight: 700 }}>
            Product & Device Registry
          </Typography>
          <Typography variant="body2" color="text.secondary">
            All registered products, devices, build details, setup needs, and local test metadata.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={() => refetch(filter)}>
            Refresh
          </Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setIsRegistrationModalOpen(true)}>
            Register Product
          </Button>
        </Stack>
      </Stack>

      {error && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 2, mb: 2, border: '1px solid #4A7C59' }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} justifyContent="space-between">
          <Box>
            <Typography variant="subtitle2" sx={{ color: '#C8B882' }}>
              Browser-local demo build
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Owner Private local owner | Serial {ProductsService.FIRST_COOP_SERIAL} | Device {ProductsService.FIRST_COOP_DEVICE_ID}
            </Typography>
          </Box>
          <Chip label={`MQTT tc/${ProductsService.FIRST_COOP_DEVICE_ID}/...`} color="success" variant="outlined" />
        </Stack>
      </Paper>

      <Grid container spacing={1.5} sx={{ mb: 2 }}>
        {summaryItems.map((item) => (
          <Grid item xs={6} sm={4} md={2.4} key={item.label}>
            <Paper sx={{ p: 1.5, minHeight: 92 }}>
              <Stack direction="row" spacing={1} alignItems="center">
                <Box sx={{ color: 'primary.main', display: 'flex' }}>{item.icon}</Box>
                <Box>
                  <Typography variant="h5">{item.value}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {item.label}
                  </Typography>
                </Box>
              </Stack>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Search registry"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Name, serial, device id, MQTT..."
            />
          </Grid>
          <Grid item xs={12} sm={4} md={2.5}>
            <FormControl fullWidth>
              <InputLabel>Type</InputLabel>
              <Select
                value={filter.product_type?.[0] || ''}
                label="Type"
                onChange={(event) =>
                  handleFilterChange({
                    product_type: event.target.value ? [event.target.value as ProductType] : undefined,
                  })
                }
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="hardware_unit">Hardware Unit</MenuItem>
                <MenuItem value="automation_device">Automation Device</MenuItem>
                <MenuItem value="custom_product">Custom Product</MenuItem>
                <MenuItem value="software_only">Software Only</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={4} md={2.5}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={filter.status?.[0] || ''}
                label="Status"
                onChange={(event) =>
                  handleFilterChange({
                    status: event.target.value ? [event.target.value as ProductStatus] : undefined,
                  })
                }
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="registered">Registered</MenuItem>
                <MenuItem value="connected">Connected</MenuItem>
                <MenuItem value="disconnected">Disconnected</MenuItem>
                <MenuItem value="setup_required">Setup Required</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={4} md={3}>
            <FormControl fullWidth>
              <InputLabel>Connection</InputLabel>
              <Select
                value={filter.connection_status?.[0] || ''}
                label="Connection"
                onChange={(event) =>
                  handleFilterChange({
                    connection_status: event.target.value
                      ? [event.target.value as ConnectionStatus]
                      : undefined,
                  })
                }
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="online">Online</MenuItem>
                <MenuItem value="offline">Offline</MenuItem>
                <MenuItem value="connecting">Connecting</MenuItem>
                <MenuItem value="error">Error</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      <Paper sx={{ overflow: 'hidden' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : filteredProducts.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <DevicesIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6">
              {products.length === 0 ? 'No products registered' : 'No products match your filters'}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Register the demo coop or add a product manually to begin local testing.
            </Typography>
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setIsRegistrationModalOpen(true)}>
              Register Product
            </Button>
          </Box>
        ) : (
          <TableContainer sx={{ maxWidth: '100%', overflowX: 'auto' }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>Product</TableCell>
                  <TableCell>Device</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Build</TableCell>
                  <TableCell>Needs</TableCell>
                  <TableCell>Location</TableCell>
                  <TableCell>Last Seen</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredProducts.map((product) => {
                  const needs = getProductNeeds(product);
                  return (
                    <TableRow hover key={product.id}>
                      <TableCell sx={{ minWidth: 220 }}>
                        <Typography variant="subtitle2">{product.product_name}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {product.serial_number}
                        </Typography>
                        {product.activation_code && (
                          <Typography variant="caption" color="text.secondary" display="block">
                            Activation {product.activation_code}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell sx={{ minWidth: 170 }}>
                        <Stack spacing={0.5}>
                          <Typography variant="body2">{product.device_id || 'Unassigned'}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {product.metadata?.mqtt_base_topic || 'No MQTT topic'}
                          </Typography>
                        </Stack>
                      </TableCell>
                      <TableCell sx={{ minWidth: 170 }}>
                        <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                          <Chip size="small" label={product.status.replace('_', ' ')} color={statusColor(product.status)} />
                          <Chip
                            size="small"
                            label={product.connection_status}
                            color={connectionColor(product.connection_status)}
                            variant="outlined"
                          />
                        </Stack>
                      </TableCell>
                      <TableCell sx={{ minWidth: 190 }}>
                        <Typography variant="body2">{product.model || 'Model needed'}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {product.metadata?.hardware_revision || 'Revision needed'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" display="block">
                          {product.metadata?.product_family || 'Family needed'}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ minWidth: 220 }}>
                        <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                          {needs.length === 0 ? (
                            <Chip size="small" color="success" label="Ready" />
                          ) : (
                            needs.slice(0, 3).map((need) => <Chip size="small" key={need} label={need} variant="outlined" />)
                          )}
                          {needs.length > 3 && <Chip size="small" label={`+${needs.length - 3}`} />}
                        </Stack>
                      </TableCell>
                      <TableCell sx={{ minWidth: 170 }}>{product.location || 'Not placed'}</TableCell>
                      <TableCell sx={{ minWidth: 170 }}>{formatDate(product.last_seen)}</TableCell>
                      <TableCell align="right" sx={{ minWidth: 190 }}>
                        <Tooltip title="View details">
                          <IconButton onClick={() => setDetailProduct(product)} aria-label={`View ${product.product_name}`}>
                            <VisibilityIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit registry entry">
                          <IconButton onClick={() => openEditDialog(product)} aria-label={`Edit ${product.product_name}`}>
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={product.connection_status === 'online' ? 'Disconnect' : 'Connect'}>
                          <IconButton
                            onClick={() =>
                              product.connection_status === 'online'
                                ? handleDisconnect(product)
                                : handleQuickConnect(product)
                            }
                            aria-label={`${product.connection_status === 'online' ? 'Disconnect' : 'Connect'} ${product.product_name}`}
                          >
                            {product.connection_status === 'online' ? <WifiOffIcon /> : <WifiIcon />}
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Connection wizard">
                          <IconButton onClick={() => setConnectionProduct(product)} aria-label={`Setup ${product.product_name}`}>
                            <RouterIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Remove">
                          <IconButton color="error" onClick={() => handleDelete(product)} aria-label={`Remove ${product.product_name}`}>
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      <Drawer
        anchor="right"
        open={Boolean(detailProduct)}
        onClose={() => setDetailProduct(null)}
        PaperProps={{ sx: { width: { xs: '100%', sm: 460 }, p: 2 } }}
      >
        {detailProduct && (
          <Stack spacing={2}>
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
              <Box>
                <Typography variant="h5">{detailProduct.product_name}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {detailProduct.serial_number}
                </Typography>
              </Box>
              <Button size="small" startIcon={<EditIcon />} onClick={() => openEditDialog(detailProduct)}>
                Edit
              </Button>
            </Stack>
            <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
              <Chip label={detailProduct.status.replace('_', ' ')} color={statusColor(detailProduct.status)} />
              <Chip label={detailProduct.connection_status} color={connectionColor(detailProduct.connection_status)} variant="outlined" />
            </Stack>
            <Divider />
            <Grid container spacing={1.5}>
              {[
                ['Product ID', detailProduct.id],
                ['Owner', displayOwner(detailProduct)],
                ['Type', detailProduct.product_type.replace('_', ' ')],
                ['Family', detailProduct.metadata?.product_family || 'Needed'],
                ['Build Source', detailProduct.metadata?.build_source || 'Needed'],
                ['Custom Name', detailProduct.metadata?.custom_product_name || 'None'],
                ['Model', detailProduct.model || 'Needed'],
                ['Device ID', detailProduct.device_id || 'Needed'],
                ['Activation', detailProduct.activation_code || 'None'],
                ['Location', detailProduct.location || 'Not placed'],
                ['Animals', detailProduct.metadata?.animal_count || 'Not set'],
                ['Hardware Setup', detailProduct.metadata?.hardware_setup_mode || 'Not set'],
                ['Simulator', detailProduct.metadata?.simulation_backend || 'Browser Three.js'],
                ['Simulation Profile', detailProduct.metadata?.simulation_profile || 'Not set'],
                ['Middleware', detailProduct.metadata?.robotics_middleware || 'Not set'],
                ['Property Scene', detailProduct.metadata?.property_scene_url || 'Not set'],
                ['Terrain Source', detailProduct.metadata?.terrain_source || 'Not set'],
                ['Terrain Capture', detailProduct.metadata?.terrain_capture_device_id || 'Not set'],
                ['Device Asset', detailProduct.metadata?.custom_device_asset_url || 'Not set'],
                ['Telemetry Consent', detailProduct.metadata?.telemetry_consent || 'Not requested'],
                ['Retention Days', detailProduct.metadata?.telemetry_retention_days || 'Not set'],
                ['Safety Status', detailProduct.metadata?.safety_validation_status || 'Not started'],
                ['Asset License', detailProduct.metadata?.asset_license || 'Not set'],
                ['CAD Revision', detailProduct.metadata?.cad_revision || 'Not set'],
                ['Firmware Contract', detailProduct.metadata?.firmware_contract_version || 'Not set'],
                ['Pinout Revision', detailProduct.metadata?.pinout_revision || 'Not set'],
                ['Hardware Rev', detailProduct.metadata?.hardware_revision || 'Needed'],
                ['Firmware', detailProduct.metadata?.firmware_target || 'Needed'],
                ['Firmware Version', detailProduct.metadata?.firmware_version || 'Not set'],
                ['MQTT', detailProduct.metadata?.mqtt_base_topic || 'Needed'],
                ['Repo', detailProduct.metadata?.repo_url || 'Not set'],
                ['Docs/Schematic', detailProduct.metadata?.schematic_url || 'Not set'],
                ['API Health', detailProduct.metadata?.api_health_url || 'Not set'],
                ['Last Seen', formatDate(detailProduct.last_seen)],
                ['Created', formatDate(detailProduct.created_at)],
                ['Updated', formatDate(detailProduct.updated_at)],
              ].map(([label, value]) => (
                <Grid item xs={12} sm={6} key={label}>
                  <Typography variant="caption" color="text.secondary">
                    {label}
                  </Typography>
                  <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
                    {String(value)}
                  </Typography>
                </Grid>
              ))}
            </Grid>
            <Divider />
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Needs
              </Typography>
              <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                {getProductNeeds(detailProduct).length === 0 ? (
                  <Chip label="Ready for local testing" color="success" />
                ) : (
                  getProductNeeds(detailProduct).map((need) => <Chip key={need} label={need} variant="outlined" />)
                )}
              </Stack>
            </Box>
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Notes
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {detailProduct.metadata?.notes || 'No notes yet.'}
              </Typography>
            </Box>
            {detailProduct.qr_code && (
              <Alert severity="info" icon={<LinkIcon />}>
                {detailProduct.qr_code}
              </Alert>
            )}
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              <Button variant="contained" onClick={() => setConnectionProduct(detailProduct)}>
                Setup
              </Button>
              <Button
                variant="outlined"
                onClick={() =>
                  detailProduct.connection_status === 'online'
                    ? handleDisconnect(detailProduct)
                    : handleQuickConnect(detailProduct)
                }
              >
                {detailProduct.connection_status === 'online' ? 'Disconnect' : 'Mark Online'}
              </Button>
              <Button color="error" variant="outlined" onClick={() => handleDelete(detailProduct)}>
                Remove
              </Button>
            </Stack>
          </Stack>
        )}
      </Drawer>

      <Dialog open={Boolean(editingProduct)} onClose={closeEditDialog} maxWidth="md" fullWidth>
        <DialogTitle>Edit Registry Entry</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Product name"
                value={editForm.product_name}
                onChange={(event) => setEditForm((form) => ({ ...form, product_name: event.target.value }))}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Model/build"
                value={editForm.model}
                onChange={(event) => setEditForm((form) => ({ ...form, model: event.target.value }))}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Device id"
                value={editForm.device_id}
                onChange={(event) => setEditForm((form) => ({ ...form, device_id: event.target.value }))}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Owner label"
                value={editForm.owner_email}
                onChange={(event) => setEditForm((form) => ({ ...form, owner_email: event.target.value }))}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Product Family</InputLabel>
                <Select
                  label="Product Family"
                  value={editForm.product_family}
                  onChange={(event) => setEditForm((form) => ({ ...form, product_family: event.target.value as ProductFamily }))}
                >
                  <MenuItem value="chicken-tender">Chicken Tender</MenuItem>
                  <MenuItem value="roaming-roost">Roaming Roost</MenuItem>
                  <MenuItem value="duck-dock">Duck Dock</MenuItem>
                  <MenuItem value="goat-guardian">Goat Guardian</MenuItem>
                  <MenuItem value="bunny-burrow">Bunny Burrow</MenuItem>
                  <MenuItem value="turkey-tower">Turkey Tower</MenuItem>
                  <MenuItem value="predator-monitor">Predator Monitor</MenuItem>
                  <MenuItem value="rail-system">Rail System</MenuItem>
                  <MenuItem value="rail-system-modules">Rail System Modules</MenuItem>
                  <MenuItem value="tendercells-cloud">TenderCells Cloud</MenuItem>
                  <MenuItem value="pigeon-palace">Pigeon Palace</MenuItem>
                  <MenuItem value="door-system">Door System</MenuItem>
                  <MenuItem value="latch-system">Latch System</MenuItem>
                  <MenuItem value="waterer">Waterer</MenuItem>
                  <MenuItem value="feeder">Feeder</MenuItem>
                  <MenuItem value="sensor-pod">Sensor Pod</MenuItem>
                  <MenuItem value="camera-kit">Camera Kit</MenuItem>
                  <MenuItem value="motor-axis-kit">Motor / Axis Kit</MenuItem>
                  <MenuItem value="controller-board">Controller Board</MenuItem>
                  <MenuItem value="printed-part">3D Printed Part</MenuItem>
                  <MenuItem value="community-custom">Community Custom</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Build Source</InputLabel>
                <Select
                  label="Build Source"
                  value={editForm.build_source}
                  onChange={(event) => setEditForm((form) => ({ ...form, build_source: event.target.value as BuildSource }))}
                >
                  <MenuItem value="tendercells-kit">TenderCells Kit</MenuItem>
                  <MenuItem value="prebuilt-unit">Prebuilt Unit</MenuItem>
                  <MenuItem value="open-source-diy">Open Source DIY</MenuItem>
                  <MenuItem value="third-party">Third Party</MenuItem>
                  <MenuItem value="prototype">Prototype</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Custom product name"
                value={editForm.custom_product_name}
                onChange={(event) => setEditForm((form) => ({ ...form, custom_product_name: event.target.value }))}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Number of animals"
                value={editForm.animal_count}
                onChange={(event) => setEditForm((form) => ({ ...form, animal_count: event.target.value }))}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Hardware setup</InputLabel>
                <Select
                  label="Hardware setup"
                  value={editForm.hardware_setup_mode}
                  onChange={(event) => setEditForm((form) => ({ ...form, hardware_setup_mode: event.target.value }))}
                >
                  <MenuItem value="sim_only">Sim-only testing</MenuItem>
                  <MenuItem value="connect_now">Connect hardware now</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Simulator</InputLabel>
                <Select
                  label="Simulator"
                  value={editForm.simulation_backend}
                  onChange={(event) => setEditForm((form) => ({ ...form, simulation_backend: event.target.value }))}
                >
                  <MenuItem value="browser_threejs">Browser Three.js</MenuItem>
                  <MenuItem value="nvidia_isaac">NVIDIA Isaac / Omniverse</MenuItem>
                  <MenuItem value="ros_gazebo">ROS / Gazebo</MenuItem>
                  <MenuItem value="hardware_in_loop">Hardware-in-loop</MenuItem>
                  <MenuItem value="none">None</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Middleware</InputLabel>
                <Select
                  label="Middleware"
                  value={editForm.robotics_middleware}
                  onChange={(event) => setEditForm((form) => ({ ...form, robotics_middleware: event.target.value }))}
                >
                  <MenuItem value="mqtt_bridge">MQTT Bridge</MenuItem>
                  <MenuItem value="ros2">ROS 2</MenuItem>
                  <MenuItem value="none">None</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Simulation profile"
                value={editForm.simulation_profile}
                onChange={(event) => setEditForm((form) => ({ ...form, simulation_profile: event.target.value }))}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Property scene URL"
                value={editForm.property_scene_url}
                onChange={(event) => setEditForm((form) => ({ ...form, property_scene_url: event.target.value }))}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Terrain source</InputLabel>
                <Select
                  label="Terrain source"
                  value={editForm.terrain_source}
                  onChange={(event) => setEditForm((form) => ({ ...form, terrain_source: event.target.value }))}
                >
                  <MenuItem value="manual_layout">Manual layout</MenuItem>
                  <MenuItem value="device_telemetry">Device telemetry</MenuItem>
                  <MenuItem value="depth_camera">Depth camera</MenuItem>
                  <MenuItem value="lidar">LiDAR</MenuItem>
                  <MenuItem value="photogrammetry">Photogrammetry</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Terrain capture device"
                value={editForm.terrain_capture_device_id}
                onChange={(event) => setEditForm((form) => ({ ...form, terrain_capture_device_id: event.target.value }))}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Custom device asset URL"
                value={editForm.custom_device_asset_url}
                onChange={(event) => setEditForm((form) => ({ ...form, custom_device_asset_url: event.target.value }))}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Telemetry consent</InputLabel>
                <Select
                  label="Telemetry consent"
                  value={editForm.telemetry_consent}
                  onChange={(event) => setEditForm((form) => ({ ...form, telemetry_consent: event.target.value }))}
                >
                  <MenuItem value="not_requested">Not requested</MenuItem>
                  <MenuItem value="local_only">Local only</MenuItem>
                  <MenuItem value="share_anonymized">Share anonymized</MenuItem>
                  <MenuItem value="share_with_support">Share with support</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Telemetry retention days"
                value={editForm.telemetry_retention_days}
                onChange={(event) => setEditForm((form) => ({ ...form, telemetry_retention_days: event.target.value }))}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Safety validation</InputLabel>
                <Select
                  label="Safety validation"
                  value={editForm.safety_validation_status}
                  onChange={(event) => setEditForm((form) => ({ ...form, safety_validation_status: event.target.value }))}
                >
                  <MenuItem value="not_started">Not started</MenuItem>
                  <MenuItem value="simulated">Simulated</MenuItem>
                  <MenuItem value="bench_tested">Bench tested</MenuItem>
                  <MenuItem value="field_tested">Field tested</MenuItem>
                  <MenuItem value="blocked">Blocked</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Asset license"
                value={editForm.asset_license}
                onChange={(event) => setEditForm((form) => ({ ...form, asset_license: event.target.value }))}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="CAD revision"
                value={editForm.cad_revision}
                onChange={(event) => setEditForm((form) => ({ ...form, cad_revision: event.target.value }))}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Firmware contract"
                value={editForm.firmware_contract_version}
                onChange={(event) => setEditForm((form) => ({ ...form, firmware_contract_version: event.target.value }))}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Pinout revision"
                value={editForm.pinout_revision}
                onChange={(event) => setEditForm((form) => ({ ...form, pinout_revision: event.target.value }))}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  label="Status"
                  value={editForm.status}
                  onChange={(event) => setEditForm((form) => ({ ...form, status: event.target.value as ProductStatus }))}
                >
                  <MenuItem value="registered">Registered</MenuItem>
                  <MenuItem value="connected">Connected</MenuItem>
                  <MenuItem value="disconnected">Disconnected</MenuItem>
                  <MenuItem value="setup_required">Setup Required</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Connection</InputLabel>
                <Select
                  label="Connection"
                  value={editForm.connection_status}
                  onChange={(event) =>
                    setEditForm((form) => ({ ...form, connection_status: event.target.value as ConnectionStatus }))
                  }
                >
                  <MenuItem value="online">Online</MenuItem>
                  <MenuItem value="offline">Offline</MenuItem>
                  <MenuItem value="connecting">Connecting</MenuItem>
                  <MenuItem value="error">Error</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Location"
                value={editForm.location}
                onChange={(event) => setEditForm((form) => ({ ...form, location: event.target.value }))}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Hardware revision"
                value={editForm.hardware_revision}
                onChange={(event) => setEditForm((form) => ({ ...form, hardware_revision: event.target.value }))}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Firmware target"
                value={editForm.firmware_target}
                onChange={(event) => setEditForm((form) => ({ ...form, firmware_target: event.target.value }))}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Firmware version"
                value={editForm.firmware_version}
                onChange={(event) => setEditForm((form) => ({ ...form, firmware_version: event.target.value }))}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="MQTT base topic"
                value={editForm.mqtt_base_topic}
                onChange={(event) => setEditForm((form) => ({ ...form, mqtt_base_topic: event.target.value }))}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Repo URL"
                value={editForm.repo_url}
                onChange={(event) => setEditForm((form) => ({ ...form, repo_url: event.target.value }))}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Schematic/BOM URL"
                value={editForm.schematic_url}
                onChange={(event) => setEditForm((form) => ({ ...form, schematic_url: event.target.value }))}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                minRows={3}
                label="Notes"
                value={editForm.notes}
                onChange={(event) => setEditForm((form) => ({ ...form, notes: event.target.value }))}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeEditDialog}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveEdit}>
            Save
          </Button>
        </DialogActions>
      </Dialog>

      <ProductRegistrationModal
        isOpen={isRegistrationModalOpen}
        onClose={() => setIsRegistrationModalOpen(false)}
        onRegister={handleRegister}
        onRegisterFirstChickenTender={async () => {
          const product = await seedFirstGarageCoop();
          await refetch(filter);
          return product;
        }}
      />

      {connectionProduct && (
        <ConnectionSetupWizard
          isOpen={Boolean(connectionProduct)}
          onClose={() => setConnectionProduct(null)}
          product={connectionProduct}
          onComplete={async () => {
            setConnectionProduct(null);
            await refetch(filter);
          }}
        />
      )}
    </Box>
  );
}
