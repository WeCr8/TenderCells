// PropertyLayoutPage.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../lib/firebase/firebaseApp';
import { PropertyService } from '../services/propertyService';
import { ProductsFirebaseService } from '../services/productsFirebaseService';
import MainLayout from '../components/layout/MainLayout';
import SideMenu from '../components/navigation/SideMenu';
import BottomToolbar from '../components/toolbar/BottomToolbar';
import PropertyLayoutCanvas from '../components/properties/PropertyLayoutCanvas';
import PropertySizePanel from '../components/properties/PropertySizePanel';
import PropertyProductPalette from '../components/products/PropertyProductPalette';
import { Box, Grid, Alert } from '@mui/material';
import type { Property, PropertyPlacement } from '../types/property';

export default function PropertyLayoutPage() {
  const { id: propertyId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [property, setProperty] = useState<Property | null>(null);
  const [placements, setPlacements] = useState<PropertyPlacement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [pendingPlacement, setPendingPlacement] = useState<{ productType: string; preset: any } | null>(null);

  useEffect(() => {
    if (!auth) {
      // Firebase not configured - allow demo mode
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid);
      }
    });

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  useEffect(() => {
    if (!propertyId || !userId) return;

    const loadData = async () => {
      try {
        const [propertyData, placementsData] = await Promise.all([
          PropertyService.getProperty(propertyId),
          PropertyService.getPropertyPlacements(propertyId),
        ]);

        if (propertyData) {
          setProperty(propertyData);
        } else {
          setError('Property not found');
        }

        setPlacements(placementsData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load property');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [propertyId, userId]);

  const handlePlacementClick = (placement: PropertyPlacement) => {
    navigate(`/coop/${placement.productId}/dashboard`);
  };

  const handlePlacementAdd = async (x: number, y: number) => {
    if (!pendingPlacement || !propertyId || !userId) return;

    try {
      // First, check if product already exists
      const products = await ProductsFirebaseService.getUserProducts(userId, {
        productType: pendingPlacement.productType,
        propertyId: propertyId,
      });
      
      let productId: string;
      
      if (products.length > 0) {
        // Use existing product
        productId = products[0].id!;
      } else {
        // Create a new product
        const product = await ProductsFirebaseService.createProduct(userId, {
          productType: pendingPlacement.productType,
          productName: pendingPlacement.productType,
          location: 'Property Layout',
          propertyId: propertyId,
          hardwareMode: 'sim',
        });
        productId = product.id!;
      }

      // Create placement
      const placement = await PropertyService.createPlacement(propertyId, {
        productId: productId,
        productType: pendingPlacement.productType,
        x,
        y,
        width: pendingPlacement.preset.width,
        height: pendingPlacement.preset.height,
        rotation: 0,
      });

      // Update product with placement ID
      await ProductsFirebaseService.updateProduct(productId, {
        placementId: placement.id,
      } as any);

      setPlacements([...placements, placement]);
      setPendingPlacement(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add placement');
    }
  };

  const handlePresetSelect = (productType: string, preset: any) => {
    setPendingPlacement({ productType, preset });
  };

  const handlePropertyUpdate = async (updates: {
    name?: string;
    width?: number;
    depth?: number;
    shape?: any;
    gridScale?: any;
  }) => {
    if (!propertyId || !property) return;

    try {
      await PropertyService.updateProperty(propertyId, {
        name: updates.name,
        dimensions: updates.width && updates.depth
          ? { width: updates.width, depth: updates.depth }
          : undefined,
        shape: updates.shape,
        gridScale: updates.gridScale,
      });

      // Reload property
      const updatedProperty = await PropertyService.getProperty(propertyId);
      if (updatedProperty) {
        setProperty(updatedProperty);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update property');
    }
  };

  if (loading) {
    return (
      <MainLayout title="Property Layout" product="chicken-tender" onProductChange={() => {}}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
          Loading...
        </Box>
      </MainLayout>
    );
  }

  if (!property) {
    return (
      <MainLayout title="Property Layout" product="chicken-tender" onProductChange={() => {}}>
        <Box sx={{ p: 3 }}>
          <Alert severity="error">Property not found</Alert>
        </Box>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Property Layout" product="chicken-tender" onProductChange={() => {}}>
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {error && (
          <Alert severity="error" sx={{ m: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Grid container spacing={2} sx={{ flex: 1, overflow: 'hidden' }}>
          {/* Left Sidebar */}
          <Grid item xs={12} md={2}>
            <Box sx={{ height: '100%', overflow: 'auto' }}>
              <SideMenu />
            </Box>
          </Grid>

          {/* Center - Canvas */}
          <Grid item xs={12} md={7}>
            <Box sx={{ height: '100%' }}>
              <PropertyLayoutCanvas
                property={property}
                placements={placements}
                onPlacementClick={handlePlacementClick}
                onPlacementAdd={pendingPlacement ? handlePlacementAdd : undefined}
              />
            </Box>
          </Grid>

          {/* Right Sidebar */}
          <Grid item xs={12} md={3}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, height: '100%', overflow: 'auto' }}>
              <PropertySizePanel
                name={property.name}
                onNameChange={(name) => handlePropertyUpdate({ name })}
                width={property.dimensions.width}
                onWidthChange={(width) => handlePropertyUpdate({ width, depth: property.dimensions.depth })}
                depth={property.dimensions.depth}
                onDepthChange={(depth) => handlePropertyUpdate({ width: property.dimensions.width, depth })}
                shape={property.shape}
                onShapeChange={(shape) => handlePropertyUpdate({ shape })}
                gridScale={property.gridScale}
                onGridScaleChange={(gridScale) => handlePropertyUpdate({ gridScale })}
                showTitle={true}
              />
              <PropertyProductPalette onPresetSelect={handlePresetSelect} />
            </Box>
          </Grid>
        </Grid>

        {/* Bottom Toolbar */}
        <BottomToolbar
          mapView="2d"
          onMapViewChange={(view) => {
            if (view === '3d') {
              navigate('/dashboard');
            }
          }}
        />
      </Box>
    </MainLayout>
  );
}
