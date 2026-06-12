/**
 * DashboardPage.tsx
 * Main dashboard with 3D/2D viewport, side menu, and telemetry
 */

import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Box, Grid } from '@mui/material';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../lib/firebase/firebaseApp';
import { PropertyService } from '../services/propertyService';
import MainLayout from '../components/layout/MainLayout';
import TelemetryPanel from '../components/telemetry/TelemetryPanel';
import BottomToolbar from '../components/toolbar/BottomToolbar';
import CoopProductGate from '../components/products/CoopProductGate';
import ViewportModeGate, { ViewportMode } from '../components/viewport/ViewportModeGate';
import type { Property } from '../types/property';

export default function DashboardPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [currentProperty, setCurrentProperty] = useState<Property | null>(null);
  const [viewportMode, setViewportMode] = useState<ViewportMode>('3d');
  const [productId, setProductId] = useState<string | undefined>(
    location.state?.productId
  );
  const [propertyId, setPropertyId] = useState<string | undefined>(
    location.state?.propertyId
  );

  useEffect(() => {
    if (!auth) {
      // Firebase not configured - allow demo mode
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserId(user.uid);
        try {
          const userProperties = await PropertyService.getUserProperties(user.uid);
          setProperties(userProperties);
          
          // Set current property from state or first property
          if (propertyId) {
            const property = userProperties.find(p => p.id === propertyId);
            if (property) {
              setCurrentProperty(property);
            } else if (userProperties.length > 0) {
              setCurrentProperty(userProperties[0]);
              setPropertyId(userProperties[0].id);
            }
          } else if (userProperties.length > 0) {
            setCurrentProperty(userProperties[0]);
            setPropertyId(userProperties[0].id);
          }
        } catch (error) {
          console.error('Error fetching properties:', error);
        }
      } else {
        navigate('/start');
      }
    });

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [navigate, propertyId]);

  const handleViewModeToggle = (mode: '2d' | '3d') => {
    const normalizedMode = mode.toLowerCase() as ViewportMode;
    setViewportMode(normalizedMode);
    if ((normalizedMode === '2d' || normalizedMode === '2D') && currentProperty) {
      navigate(`/property/${currentProperty.id}/layout`);
    }
  };

  const handle2DPlanClick = () => {
    if (currentProperty) {
      navigate(`/property/${currentProperty.id}/layout`);
    }
  };

  const handleProductChange = (newProduct: string) => {
    // Navigate to the product's dashboard route
    navigate(`/${newProduct}`);
  };

  return (
    <MainLayout title="Dashboard" product="chicken-tender" onProductChange={handleProductChange}>
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <Grid container spacing={2} sx={{ flex: 1, overflow: 'hidden' }}>
          {/* Center - Viewport */}
          <Grid item xs={12} md={8}>
            <Box sx={{ height: '100%', position: 'relative' }}>
              <CoopProductGate productId={productId}>
                <ViewportModeGate
                  mode={viewportMode}
                  onModeChange={handleViewModeToggle}
                />
              </CoopProductGate>
            </Box>
          </Grid>

          {/* Right Sidebar - Telemetry */}
          <Grid item xs={12} md={4}>
            <Box sx={{ height: '100%', overflow: 'auto' }}>
              <TelemetryPanel />
            </Box>
          </Grid>
        </Grid>

        {/* Bottom Toolbar */}
        <BottomToolbar
          mapView={viewportMode === '3d' || viewportMode === '3D' ? '3d' : '2d'}
          onMapViewChange={(view) => handleViewModeToggle(view)}
        />
      </Box>
    </MainLayout>
  );
}
