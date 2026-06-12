// PropertyProductPalette.tsx
import React from 'react';
import {
  Paper,
  Typography,
  Box,
  Button,
  Chip,
} from '@mui/material';
import { Add } from '@mui/icons-material';

interface SizePreset {
  width: number;
  height: number;
  label: string;
  isDefault?: boolean;
}

interface Product {
  id: string;
  name: string;
  emoji: string;
  productType: string;
  presets: SizePreset[];
}

const PRODUCTS: Product[] = [
  {
    id: 'chicken-tender',
    name: 'Chicken Tender',
    emoji: '🐔',
    productType: 'chicken-tender',
    presets: [
      { width: 3, height: 3, label: '3×3×5', isDefault: true },
      { width: 4, height: 4, label: '4×4×6' },
      { width: 6, height: 6, label: '6×6×8' },
    ],
  },
  {
    id: 'roaming-roost',
    name: 'Roaming Roost',
    emoji: '🐓',
    productType: 'roaming-roost',
    presets: [
      { width: 4, height: 4, label: '4×4×6', isDefault: true },
      { width: 6, height: 6, label: '6×6×8' },
    ],
  },
  {
    id: 'duck-dock',
    name: 'Duck Dock',
    emoji: '🦆',
    productType: 'duck-dock',
    presets: [
      { width: 4, height: 4, label: '4×4×6', isDefault: true },
      { width: 6, height: 6, label: '6×6×8' },
    ],
  },
  {
    id: 'goat-guardian',
    name: 'Goat Guardian',
    emoji: '🐐',
    productType: 'goat-guardian',
    presets: [
      { width: 6, height: 6, label: '6×6×8', isDefault: true },
      { width: 8, height: 8, label: '8×8×10' },
    ],
  },
  {
    id: 'bunny-burrow',
    name: 'Bunny Burrow',
    emoji: '🐰',
    productType: 'bunny-burrow',
    presets: [
      { width: 3, height: 3, label: '3×3×5', isDefault: true },
      { width: 4, height: 4, label: '4×4×6' },
    ],
  },
  {
    id: 'turkey-tower',
    name: 'Turkey Tower',
    emoji: '🦃',
    productType: 'turkey-tower',
    presets: [
      { width: 4, height: 4, label: '4×4×6', isDefault: true },
      { width: 6, height: 6, label: '6×6×8' },
    ],
  },
  {
    id: 'watchtower-ai',
    name: 'WatchTower AI',
    emoji: '👁️',
    productType: 'watchtower-ai',
    presets: [
      { width: 2, height: 2, label: '2×2×4', isDefault: true },
    ],
  },
  {
    id: 'rail-system',
    name: 'Rail System',
    emoji: '🚂',
    productType: 'rail-system-modules',
    presets: [
      { width: 1, height: 10, label: '1×10 Rail', isDefault: true },
      { width: 1, height: 20, label: '1×20 Rail' },
    ],
  },
  {
    id: 'pigeon-palace',
    name: 'Pigeon Palace',
    emoji: '🕊️',
    productType: 'pigeon-palace',
    presets: [
      { width: 3, height: 3, label: '3×3×5', isDefault: true },
      { width: 4, height: 4, label: '4×4×6' },
    ],
  },
];

interface PropertyProductPaletteProps {
  onPresetSelect?: (productType: string, preset: SizePreset) => void;
}

export default function PropertyProductPalette({ onPresetSelect }: PropertyProductPaletteProps) {
  const handlePresetClick = (product: Product, preset: SizePreset) => {
    if (onPresetSelect) {
      onPresetSelect(product.productType, preset);
    }
  };

  return (
    <Paper elevation={2} sx={{ p: 2, maxHeight: 400, overflow: 'auto' }}>
      <Typography variant="h6" gutterBottom>
        Products
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
        {PRODUCTS.map((product) => (
          <Box key={product.id} sx={{ borderBottom: '1px solid', borderColor: 'divider', pb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Typography variant="h6" sx={{ fontSize: '1.5rem' }}>
                {product.emoji}
              </Typography>
              <Typography variant="subtitle2">{product.name}</Typography>
            </Box>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {product.presets.map((preset, index) => (
                <Button
                  key={index}
                  variant={preset.isDefault ? 'contained' : 'outlined'}
                  size="small"
                  startIcon={<Add />}
                  onClick={() => handlePresetClick(product, preset)}
                  sx={{ position: 'relative' }}
                >
                  {preset.label}
                  {preset.isDefault && (
                    <Chip
                      label="Default"
                      size="small"
                      color="primary"
                      sx={{
                        position: 'absolute',
                        top: -8,
                        right: -8,
                        height: 16,
                        fontSize: '0.6rem',
                      }}
                    />
                  )}
                </Button>
              ))}
            </Box>
          </Box>
        ))}
      </Box>
    </Paper>
  );
}
