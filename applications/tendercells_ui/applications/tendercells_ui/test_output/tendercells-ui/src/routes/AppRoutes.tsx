// AppRoutes.tsx
import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Box, Typography, CircularProgress } from '@mui/material';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, isFirebaseReady } from '../lib/firebase/firebaseApp';
import { PropertyService } from '../services/propertyService';
import SetupWizardPage from '../pages/SetupWizardPage';
import PropertySetupPage from '../pages/PropertySetupPage';
import ProductSelectionPage from '../pages/ProductSelectionPage';
import ProductRegistrationPage from '../pages/ProductRegistrationPage';
import DashboardPage from '../pages/DashboardPage';
import PropertyLayoutPage from '../pages/PropertyLayoutPage';
import AnimalRegistrationPage from '../pages/AnimalRegistrationPage';
import AnimalManagementPage from '../pages/AnimalManagementPage';
import { ChickenTenderDashboard, RoamingRoostDashboard, DuckDockDashboard, GoatGuardianDashboard, BunnyBurrowDashboard, TurkeyTowerDashboard, PredatorMonitorDashboard, RailSystemModulesDashboard, TenderCellsCloudDashboard, PigeonPalaceDashboard, SettingsPage, AccountPage, LoginPage, SignupPage } from '../pages';

export default function AppRoutes() {
  const [isChecking, setIsChecking] = useState(true);
  const [hasProperties, setHasProperties] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [firebaseConfigured, setFirebaseConfigured] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;
    let initTimer: NodeJS.Timeout | null = null;

    // Ensure Firebase initialization is complete before checking auth
    const checkAuth = () => {
      if (!auth) {
        // Firebase Auth is not available (either not configured or not ready)
        // Only log once to reduce console noise
        if (!(window as any).__firebaseAuthWarningShown) {
          console.warn('Firebase Auth is not configured. App will run in demo mode.');
          (window as any).__firebaseAuthWarningShown = true;
        }
        setFirebaseConfigured(false);
        setHasProperties(false);
        setIsAuthenticated(false);
        setIsChecking(false);
        return;
      }

      // Auth is available - Firebase is configured
      setFirebaseConfigured(true);

      // Auth is available, check auth state
      unsubscribe = onAuthStateChanged(auth, async (user) => {
        if (user) {
          setIsAuthenticated(true);
          try {
            const properties = await PropertyService.getUserProperties(user.uid);
            setHasProperties(properties.length > 0);
          } catch (error) {
            console.error('Error checking properties:', error);
            setHasProperties(false);
          }
        } else {
          setIsAuthenticated(false);
          setHasProperties(false);
        }
        setIsChecking(false);
      });
    };

    // Wait a brief moment to ensure Firebase module initialization is complete
    initTimer = setTimeout(() => {
      checkAuth();
    }, 10);

    return () => {
      if (initTimer) {
        clearTimeout(initTimer);
      }
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  if (isChecking) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          gap: 2,
        }}
      >
        <CircularProgress />
        <Typography variant="body1" color="text.secondary">
          Loading...
        </Typography>
      </Box>
    );
  }

  return (
    <Routes>
      {/* Root route - redirect based on auth and property status */}
      <Route
        path="/"
        element={
          !isAuthenticated ? (
            <Navigate to="/login" replace />
          ) : hasProperties ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <Navigate to="/start" replace />
          )
        }
      />

      {/* Authentication routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />

      {/* Onboarding routes */}
      <Route path="/start" element={<SetupWizardPage />} />
      <Route path="/property/new/setup" element={<PropertySetupPage />} />
      <Route path="/property/:id/setup" element={<PropertySetupPage />} />
      <Route path="/property/:id/products" element={<ProductSelectionPage />} />
      <Route
        path="/property/:id/products/:productType/register"
        element={<ProductRegistrationPage />}
      />

      {/* Main app routes */}
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/property/:id/layout" element={<PropertyLayoutPage />} />
      <Route path="/coop/:id/dashboard" element={<DashboardPage />} />

      {/* Product dashboard routes */}
      <Route path="/chicken-tender" element={<ChickenTenderDashboard />} />
      <Route path="/roaming-roost" element={<RoamingRoostDashboard />} />
      <Route path="/duck-dock" element={<DuckDockDashboard />} />
      <Route path="/goat-guardian" element={<GoatGuardianDashboard />} />
      <Route path="/bunny-burrow" element={<BunnyBurrowDashboard />} />
      <Route path="/turkey-tower" element={<TurkeyTowerDashboard />} />
      <Route path="/predator-monitor" element={<PredatorMonitorDashboard />} />
      <Route path="/rail-system-modules" element={<RailSystemModulesDashboard />} />
      <Route path="/tender-cells-cloud" element={<TenderCellsCloudDashboard />} />
      <Route path="/pigeon-palace" element={<PigeonPalaceDashboard />} />

      {/* Animal management routes */}
      <Route path="/property/:propertyId/animals" element={<AnimalManagementPage />} />
      <Route path="/property/:propertyId/animals/register" element={<AnimalRegistrationPage />} />
      <Route path="/property/:propertyId/product/:productId/animals" element={<AnimalManagementPage />} />
      <Route path="/property/:propertyId/product/:productId/animals/register" element={<AnimalRegistrationPage />} />

      {/* Settings routes */}
      <Route path="/settings" element={<SettingsPage />} />
      <Route path="/account" element={<AccountPage />} />
    </Routes>
  );
}
