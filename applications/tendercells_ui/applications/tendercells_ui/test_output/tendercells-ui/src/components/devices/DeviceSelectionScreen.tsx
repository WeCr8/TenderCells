// DeviceSelectionScreen.tsx
import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  Chip,
  Avatar,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Inventory2,
  Add,
  Wifi,
  WifiOff,
  ArrowForward,
} from '@mui/icons-material';
import { useProducts } from '../../hooks/useProducts';
import { useLogger } from '../../utils/logger';
import ProductCard from '../products/ProductCard';
import ProductRegistrationModal from '../products/ProductRegistrationModal';
import type { Product } from '../../types/products';

interface DeviceSelectionScreenProps {
  onDeviceSelect: (product: Product) => void;
  productName?: string;
}

export default function DeviceSelectionScreen({
  onDeviceSelect,
  productName,
}: DeviceSelectionScreenProps) {
  const { products, loading, refetch, registerProduct } = useProducts();
  const [isRegistrationModalOpen, setIsRegistrationModalOpen] = useState(false);
  const { logInfo, logError, logSuccess } = useLogger();

  // Filter products that match the current product type (if specified)
  // For now, show all connected products
  const connectedProducts = products.filter(
    (p) => p.connection_status === 'online' || p.status === 'connected'
  );
  const allProducts = products;

  const handleRegister = async (data: any) => {
    try {
      logInfo('DeviceSelectionScreen: Registering product', { productName: data.product_name });
      await registerProduct(data);
      await refetch();
      logSuccess('DeviceSelectionScreen: Product registered successfully');
    } catch (error) {
      logError('DeviceSelectionScreen: Failed to register product', { error, data });
      throw error;
    }
  };

  const handleProductClick = (product: Product) => {
    logInfo('DeviceSelectionScreen: Device selected', { 
      productId: product.id, 
      productName: product.product_name 
    });
    onDeviceSelect(product);
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 400,
          gap: 2,
        }}
      >
        <CircularProgress size={48} />
        <Typography variant="body1" color="text.secondary">
          Loading devices...
        </Typography>
      </Box>
    );
  }

  if (allProducts.length === 0) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 400,
          gap: 3,
          p: 4,
        }}
      >
        <Avatar
          sx={{
            width: 80,
            height: 80,
            bgcolor: 'primary.main',
            mb: 2,
          }}
        >
          <Inventory2 sx={{ fontSize: 40 }} />
        </Avatar>
        <Typography variant="h5" fontWeight={600} textAlign="center">
          No Devices Connected
        </Typography>
        <Typography variant="body1" color="text.secondary" textAlign="center" sx={{ maxWidth: 500 }}>
          Get started by registering and connecting your first {productName || 'device'}. Once connected, you'll be able to view it on the 2D and 3D maps.
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
          <Button
            variant="contained"
            size="large"
            startIcon={<Add />}
            onClick={() => setIsRegistrationModalOpen(true)}
            sx={{
              bgcolor: '#4a5d3a',
              '&:hover': {
                bgcolor: '#5a6d4a',
              },
            }}
          >
            Register Device
          </Button>
        </Box>

        <ProductRegistrationModal
          isOpen={isRegistrationModalOpen}
          onClose={() => setIsRegistrationModalOpen(false)}
          onRegister={handleRegister}
        />
      </Box>
    );
  }

  // Show connected devices first, then other devices
  const connectedDevices = allProducts.filter(
    (p) => p.connection_status === 'online'
  );
  const otherDevices = allProducts.filter(
    (p) => p.connection_status !== 'online'
  );

  return (
    <Box sx={{ p: 3 }}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
        }}
      >
        <Box>
          <Typography variant="h5" fontWeight={600} gutterBottom>
            Select a Device
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Choose a connected device to view on the 2D/3D maps
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<Add />}
          onClick={() => setIsRegistrationModalOpen(true)}
        >
          Register New Device
        </Button>
      </Box>

      {connectedDevices.length > 0 && (
        <>
          <Typography variant="h6" sx={{ mb: 2, mt: 2, color: '#4a5d3a', fontWeight: 600 }}>
            Connected Devices ({connectedDevices.length})
          </Typography>
          <Grid container spacing={2} sx={{ mb: 4 }}>
            {connectedDevices.map((product) => (
              <Grid item xs={12} sm={6} md={4} key={product.id}>
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    border: '2px solid transparent',
                    '&:hover': {
                      borderColor: '#4a5d3a',
                      boxShadow: 4,
                      transform: 'translateY(-4px)',
                    },
                  }}
                  onClick={() => handleProductClick(product)}
                >
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        mb: 2,
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{ bgcolor: '#4a5d3a' }}>
                          <Inventory2 />
                        </Avatar>
                        <Box>
                          <Typography variant="h6">{product.product_name}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            {product.model || product.product_type.replace('_', ' ')}
                          </Typography>
                        </Box>
                      </Box>
                      <Chip
                        icon={<Wifi />}
                        label="Online"
                        size="small"
                        color="success"
                        sx={{ fontWeight: 600 }}
                      />
                    </Box>

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                      {product.location && (
                        <Typography variant="body2" color="text.secondary">
                          <strong>Location:</strong> {product.location}
                        </Typography>
                      )}
                      {product.serial_number && (
                        <Typography variant="body2" color="text.secondary">
                          <strong>Serial:</strong> {product.serial_number}
                        </Typography>
                      )}
                    </Box>
                  </CardContent>
                  <CardActions sx={{ p: 2, pt: 0 }}>
                    <Button
                      variant="contained"
                      fullWidth
                      endIcon={<ArrowForward />}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleProductClick(product);
                      }}
                      sx={{
                        bgcolor: '#4a5d3a',
                        '&:hover': {
                          bgcolor: '#5a6d4a',
                        },
                      }}
                    >
                      View on Map
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        </>
      )}

      {otherDevices.length > 0 && (
        <>
          <Typography variant="h6" sx={{ mb: 2, mt: 2, fontWeight: 600 }}>
            Other Devices ({otherDevices.length})
          </Typography>
          {connectedDevices.length === 0 && (
            <Alert severity="info" sx={{ mb: 2 }}>
              Connect a device to view it on the 2D/3D maps. Click on any device card below to set it up.
            </Alert>
          )}
          <Grid container spacing={2}>
            {otherDevices.map((product) => (
              <Grid item xs={12} sm={6} md={4} key={product.id}>
                <ProductCard product={product} onUpdate={refetch} />
              </Grid>
            ))}
          </Grid>
        </>
      )}

      <ProductRegistrationModal
        isOpen={isRegistrationModalOpen}
        onClose={() => setIsRegistrationModalOpen(false)}
        onRegister={handleRegister}
      />
    </Box>
  );
}
