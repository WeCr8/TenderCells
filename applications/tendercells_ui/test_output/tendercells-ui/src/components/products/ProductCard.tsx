import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Box,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Button,
} from '@mui/material';
import {
  Package,
  Wifi,
  WifiOff,
  Settings,
  Delete,
  MoreVert,
} from '@mui/icons-material';
import type { Product, ProductStatus, ConnectionStatus } from '../../types/products';
import { useProducts } from '../../hooks/useProducts';
import ConnectionSetupWizard from './ConnectionSetupWizard';

interface ProductCardProps {
  product: Product;
  onUpdate?: () => void;
}

export default function ProductCard({ product, onUpdate }: ProductCardProps) {
  const { deleteProduct, disconnectProduct } = useProducts();
  const [isConnectionWizardOpen, setIsConnectionWizardOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const getStatusColor = (status: ProductStatus): 'success' | 'warning' | 'error' | 'default' => {
    switch (status) {
      case 'connected':
        return 'success';
      case 'disconnected':
        return 'warning';
      case 'setup_required':
        return 'error';
      default:
        return 'default';
    }
  };

  const getConnectionColor = (status: ConnectionStatus): 'success' | 'warning' | 'error' | 'default' => {
    switch (status) {
      case 'online':
        return 'success';
      case 'connecting':
        return 'warning';
      case 'error':
        return 'error';
      default:
        return 'default';
    }
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to remove ${product.product_name}?`)) {
      return;
    }
    setIsDeleting(true);
    try {
      await deleteProduct(product.id);
      if (onUpdate) {
        onUpdate();
      }
    } catch (error) {
      console.error('Failed to delete product:', error);
    } finally {
      setIsDeleting(false);
      handleMenuClose();
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnectProduct(product.id);
      if (onUpdate) {
        onUpdate();
      }
    } catch (error) {
      console.error('Failed to disconnect product:', error);
    }
    handleMenuClose();
  };

  return (
    <>
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'primary.main' }}>
                <Package />
              </Avatar>
              <Box>
                <Typography variant="h6">{product.product_name}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {product.model || product.product_type.replace('_', ' ')}
                </Typography>
              </Box>
            </Box>
            <IconButton onClick={handleMenuOpen} size="small">
              <MoreVert />
            </IconButton>
          </Box>

          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
          >
            <MenuItem
              onClick={() => {
                handleMenuClose();
                setIsConnectionWizardOpen(true);
              }}
            >
              <Settings sx={{ mr: 1 }} fontSize="small" />
              Connect/Setup
            </MenuItem>
            {product.connection_status === 'online' && (
              <MenuItem onClick={handleDisconnect}>
                <WifiOff sx={{ mr: 1 }} fontSize="small" />
                Disconnect
              </MenuItem>
            )}
            <MenuItem onClick={handleDelete} disabled={isDeleting}>
              <Delete sx={{ mr: 1 }} fontSize="small" />
              Remove
            </MenuItem>
          </Menu>

          <Box sx={{ display: 'flex', gap: 1, mb: 2, alignItems: 'center' }}>
            <Chip
              icon={<Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: getConnectionColor(product.connection_status) === 'success' ? 'success.main' : getConnectionColor(product.connection_status) === 'warning' ? 'warning.main' : getConnectionColor(product.connection_status) === 'error' ? 'error.main' : 'grey.500' }} />}
              label={product.connection_status}
              size="small"
              color={getConnectionColor(product.connection_status)}
              variant="outlined"
            />
            <Chip
              label={product.status.replace('_', ' ')}
              size="small"
              color={getStatusColor(product.status)}
            />
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            {product.serial_number && (
              <Typography variant="body2" color="text.secondary">
                <strong>Serial:</strong> {product.serial_number}
              </Typography>
            )}
            {product.location && (
              <Typography variant="body2" color="text.secondary">
                <strong>Location:</strong> {product.location}
              </Typography>
            )}
            {product.last_seen && (
              <Typography variant="caption" color="text.secondary">
                Last seen: {new Date(product.last_seen).toLocaleDateString()}
              </Typography>
            )}
          </Box>
        </CardContent>
        <CardActions>
          {product.connection_status !== 'online' && (
            <Button
              variant="contained"
              size="small"
              fullWidth
              onClick={() => setIsConnectionWizardOpen(true)}
            >
              {product.status === 'setup_required' ? 'Setup' : 'Connect'}
            </Button>
          )}
        </CardActions>
      </Card>

      <ConnectionSetupWizard
        isOpen={isConnectionWizardOpen}
        onClose={() => setIsConnectionWizardOpen(false)}
        product={product}
        onComplete={async () => {
          if (onUpdate) {
            await onUpdate();
          }
          setIsConnectionWizardOpen(false);
        }}
      />
    </>
  );
}

