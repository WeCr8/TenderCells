import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Grid,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Paper,
} from '@mui/material';
import { Add as AddIcon, Devices as DevicesIcon } from '@mui/icons-material';
import { useProducts } from '../hooks/useProducts';
import ProductCard from '../components/products/ProductCard';
import ProductRegistrationModal from '../components/products/ProductRegistrationModal';
import type { ProductFilter, ProductType, ProductStatus, ConnectionStatus } from '../types/products';

export default function ProductsPage() {
  const { products, loading, refetch, registerProduct } = useProducts();
  const [isRegistrationModalOpen, setIsRegistrationModalOpen] = useState(false);
  const [filter, setFilter] = useState<ProductFilter>({});
  const [search, setSearch] = useState('');

  const handleRegister = async (data: any) => {
    await registerProduct(data);
    await refetch(filter);
  };

  const handleFilterChange = (newFilter: ProductFilter) => {
    setFilter(newFilter);
    refetch({ ...filter, ...newFilter });
  };

  const filteredProducts = products.filter((product) => {
    if (search) {
      const searchLower = search.toLowerCase();
      return (
        product.product_name.toLowerCase().includes(searchLower) ||
        product.serial_number.toLowerCase().includes(searchLower) ||
        (product.location && product.location.toLowerCase().includes(searchLower))
      );
    }
    return true;
  });

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            My Products
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage your registered hardware units and automation devices
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setIsRegistrationModalOpen(true)}
        >
          Register Product
        </Button>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, serial, or location..."
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel>Type</InputLabel>
              <Select
                value={filter.product_type?.[0] || ''}
                onChange={(e) =>
                  handleFilterChange({
                    product_type: e.target.value ? [e.target.value as ProductType] : undefined,
                  })
                }
                label="Type"
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="hardware_unit">Hardware Unit</MenuItem>
                <MenuItem value="automation_device">Automation Device</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={filter.status?.[0] || ''}
                onChange={(e) =>
                  handleFilterChange({
                    status: e.target.value ? [e.target.value as ProductStatus] : undefined,
                  })
                }
                label="Status"
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="registered">Registered</MenuItem>
                <MenuItem value="connected">Connected</MenuItem>
                <MenuItem value="disconnected">Disconnected</MenuItem>
                <MenuItem value="setup_required">Setup Required</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Connection</InputLabel>
              <Select
                value={filter.connection_status?.[0] || ''}
                onChange={(e) =>
                  handleFilterChange({
                    connection_status: e.target.value
                      ? [e.target.value as ConnectionStatus]
                      : undefined,
                  })
                }
                label="Connection"
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

      {/* Products Grid */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : filteredProducts.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <DevicesIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            {products.length === 0 ? 'No products registered' : 'No products match your filters'}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {products.length === 0
              ? 'Get started by registering your first product'
              : 'Try adjusting your search or filter criteria'}
          </Typography>
          {products.length === 0 && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setIsRegistrationModalOpen(true)}
            >
              Register Product
            </Button>
          )}
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {filteredProducts.map((product) => (
            <Grid item xs={12} sm={6} md={4} key={product.id}>
              <ProductCard
                product={product}
                onUpdate={() => refetch(filter)}
              />
            </Grid>
          ))}
        </Grid>
      )}

      <ProductRegistrationModal
        isOpen={isRegistrationModalOpen}
        onClose={() => setIsRegistrationModalOpen(false)}
        onRegister={handleRegister}
      />
    </Box>
  );
}

