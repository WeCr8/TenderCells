// PropertyLayoutCanvas.tsx
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Paper,
  Box,
  Typography,
} from '@mui/material';
import type { Property, PropertyPlacement } from '../../types/property';

interface PropertyLayoutCanvasProps {
  property: Property;
  placements: PropertyPlacement[];
  onPlacementClick?: (placement: PropertyPlacement) => void;
  onPlacementAdd?: (x: number, y: number) => void;
  onPlacementUpdate?: (placementId: string, x: number, y: number) => void;
}

export default function PropertyLayoutCanvas({
  property,
  placements,
  onPlacementClick,
  onPlacementAdd,
  onPlacementUpdate,
}: PropertyLayoutCanvasProps) {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragPlacement, setDragPlacement] = useState<PropertyPlacement | null>(null);

  // Calculate grid dimensions
  const gridCols = Math.ceil(property.dimensions.width / property.gridScale);
  const gridRows = Math.ceil(property.dimensions.depth / property.gridScale);

  const handlePlacementClick = (placement: PropertyPlacement) => {
    if (onPlacementClick) {
      onPlacementClick(placement);
    } else {
      navigate(`/coop/${placement.productId}/dashboard`);
    }
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDragging || dragPlacement) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    if (onPlacementAdd) {
      onPlacementAdd(x, y);
    }
  };

  const getPlacementStyle = (placement: PropertyPlacement) => {
    const widthPercent = (placement.width / gridCols) * 100;
    const heightPercent = (placement.height / gridRows) * 100;

    return {
      position: 'absolute' as const,
      left: `${placement.x}%`,
      top: `${placement.y}%`,
      width: `${widthPercent}%`,
      height: `${heightPercent}%`,
      transform: `translate(-50%, -50%) rotate(${placement.rotation}deg)`,
      cursor: 'pointer',
      border: '2px solid #4a5d3a',
      borderRadius: '4px',
      bgcolor: 'rgba(74, 93, 58, 0.3)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'all 0.2s',
      '&:hover': {
        bgcolor: 'rgba(74, 93, 58, 0.5)',
        transform: `translate(-50%, -50%) rotate(${placement.rotation}deg) scale(1.05)`,
        zIndex: 10,
      },
    };
  };

  const getProductEmoji = (productType: string): string => {
    const emojiMap: Record<string, string> = {
      'chicken-tender': '🐔',
      'roaming-roost': '🐓',
      'duck-dock': '🦆',
      'goat-guardian': '🐐',
      'bunny-burrow': '🐰',
      'turkey-tower': '🦃',
      'watchtower-ai': '👁️',
      'rail-system-modules': '🚂',
      'tender-cells-cloud': '☁️',
      'pigeon-palace': '🕊️',
    };
    return emojiMap[productType] || '📦';
  };

  return (
    <Paper
      ref={canvasRef}
      elevation={3}
      onClick={handleCanvasClick}
      sx={{
        height: '100%',
        minHeight: 500,
        position: 'relative',
        overflow: 'hidden',
        bgcolor: '#1a2512',
        backgroundImage: `
          linear-gradient(rgba(74, 93, 58, 0.2) 1px, transparent 1px),
          linear-gradient(90deg, rgba(74, 93, 58, 0.2) 1px, transparent 1px)
        `,
        backgroundSize: `${100 / gridCols}% ${100 / gridRows}%`,
        cursor: onPlacementAdd ? 'crosshair' : 'default',
      }}
    >
      {/* Grid overlay */}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
        }}
      />

      {/* Placements */}
      {placements.map((placement) => (
        <Box
          key={placement.id}
          onClick={(e) => {
            e.stopPropagation();
            handlePlacementClick(placement);
          }}
          sx={getPlacementStyle(placement)}
        >
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h4" sx={{ mb: 0.5 }}>
              {getProductEmoji(placement.productType)}
            </Typography>
            {placement.nickname && (
              <Typography variant="caption" sx={{ color: '#faf8f5', fontSize: '0.7rem' }}>
                {placement.nickname}
              </Typography>
            )}
          </Box>
        </Box>
      ))}

      {/* Empty state */}
      {placements.length === 0 && (
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#faf8f5',
            opacity: 0.5,
          }}
        >
          <Typography variant="body1">
            Click to add products to your property layout
          </Typography>
        </Box>
      )}
    </Paper>
  );
}
