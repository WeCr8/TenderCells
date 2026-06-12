// PropertyList.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Grid,
  Chip,
} from '@mui/material';
import { Home, LocationOn } from '@mui/icons-material';
import type { Property } from '../../types/property';
import { PropertyService } from '../../services/propertyService';

interface PropertyListProps {
  properties: Property[];
  onPropertySelect?: (property: Property) => void;
}

export default function PropertyList({ properties, onPropertySelect }: PropertyListProps) {
  const navigate = useNavigate();
  const [placementsCount, setPlacementsCount] = React.useState<Record<string, number>>({});

  React.useEffect(() => {
    const fetchPlacements = async () => {
      const counts: Record<string, number> = {};
      for (const property of properties) {
        try {
          const placements = await PropertyService.getPropertyPlacements(property.id);
          counts[property.id] = placements.length;
        } catch (error) {
          counts[property.id] = 0;
        }
      }
      setPlacementsCount(counts);
    };

    if (properties.length > 0) {
      fetchPlacements();
    }
  }, [properties]);

  const handlePropertyClick = (property: Property) => {
    if (onPropertySelect) {
      onPropertySelect(property);
    } else {
      navigate('/dashboard');
    }
  };

  if (properties.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="body1" color="text.secondary">
          No properties yet. Create your first property to get started!
        </Typography>
      </Box>
    );
  }

  return (
    <Grid container spacing={3}>
      {properties.map((property) => (
        <Grid item xs={12} sm={6} md={4} key={property.id}>
          <Card
            sx={{
              cursor: 'pointer',
              transition: 'all 0.2s',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: 4,
              },
            }}
            onClick={() => handlePropertyClick(property)}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Home color="primary" />
                <Typography variant="h6" component="div">
                  {property.name}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <LocationOn fontSize="small" color="action" />
                  <Typography variant="body2" color="text.secondary">
                    {property.dimensions.width}ft × {property.dimensions.depth}ft
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Chip
                    label={property.shape}
                    size="small"
                    variant="outlined"
                  />
                  <Chip
                    label={`${placementsCount[property.id] || 0} products`}
                    size="small"
                    color="primary"
                  />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}
