// ProductSelectionOverlay.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Avatar,
} from '@mui/material';

interface Product {
  id: string;
  name: string;
  emoji: string;
  description: string;
  productType: string;
}

const PRODUCTS: Product[] = [
  { id: 'chicken-tender', name: 'Chicken Tender™', emoji: '🐔', description: 'Intelligent chicken coop management', productType: 'chicken-tender' },
  { id: 'roaming-roost', name: 'Roaming Roost™', emoji: '🐓', description: 'Mobile coop system', productType: 'roaming-roost' },
  { id: 'duck-dock', name: 'Duck Dock™', emoji: '🦆', description: 'Waterfowl management system', productType: 'duck-dock' },
  { id: 'goat-guardian', name: 'Goat Guardian™', emoji: '🐐', description: 'Goat herd management', productType: 'goat-guardian' },
  { id: 'bunny-burrow', name: 'Bunny Burrow™', emoji: '🐰', description: 'Rabbit habitat system', productType: 'bunny-burrow' },
  { id: 'turkey-tower', name: 'Turkey Tower™', emoji: '🦃', description: 'Turkey management system', productType: 'turkey-tower' },
  { id: 'watchtower-ai', name: 'WatchTower AI™', emoji: '👁️', description: 'AI-powered monitoring', productType: 'watchtower-ai' },
  { id: 'rail-system', name: 'TenderCells Rail System™', emoji: '🚂', description: 'Automated rail system', productType: 'rail-system-modules' },
  { id: 'cloud', name: 'TenderCells Cloud™', emoji: '☁️', description: 'Cloud services platform', productType: 'tender-cells-cloud' },
  { id: 'pigeon-palace', name: 'Pigeon Palace™', emoji: '🕊️', description: 'Pigeon management system', productType: 'pigeon-palace' },
];

interface ProductSelectionOverlayProps {
  propertyId?: string;
  onProductSelect?: (product: Product) => void;
}

export default function ProductSelectionOverlay({ 
  propertyId, 
  onProductSelect 
}: ProductSelectionOverlayProps) {
  const navigate = useNavigate();

  const handleProductClick = (product: Product) => {
    if (onProductSelect) {
      onProductSelect(product);
    } else if (propertyId) {
      navigate(`/property/${propertyId}/products/${product.productType}/register`);
    } else {
      console.error('Property ID is required to register a product');
    }
  };

  return (
    <Grid container spacing={3}>
      {PRODUCTS.map((product) => (
        <Grid item xs={12} sm={6} md={4} key={product.id}>
          <Card
            sx={{
              cursor: 'pointer',
              transition: 'all 0.2s',
              height: '100%',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: 4,
              },
            }}
            onClick={() => handleProductClick(product)}
          >
            <CardContent>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 2 }}>
                <Avatar
                  sx={{
                    width: 64,
                    height: 64,
                    fontSize: '2.5rem',
                    bgcolor: 'primary.light',
                  }}
                >
                  {product.emoji}
                </Avatar>
                <Typography variant="h6" component="div">
                  {product.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {product.description}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}
