import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import DashboardPage from '../pages/DashboardPage';
import FlockPage from '../components/flock/FlockPage';
import FlockHealthPage from '../components/flock/health/FlockHealthPage';
import FlockProductionPage from '../components/flock/production/FlockProductionPage';
import AutomationPage from '../components/automation/AutomationPage';
import AutomationSchedulesPage from '../components/automation/AutomationSchedulesPage';
import AutomationDevicesPage from '../components/automation/AutomationDevicesPage';
import AnalyticsPage from '../pages/AnalyticsPage';
import AnalyticsReportsPage from '../components/analytics/AnalyticsReportsPage';
import AnalyticsInsightsPage from '../pages/AnalyticsInsightsPage';
import CNCPage from '../pages/CNCPage';
import SettingsPage from '../pages/SettingsPage';
import AccountPage from '../pages/AccountPage';
import MacrosPage from '../pages/MacrosPage';
import SignInPage from '../pages/SignInPage';
import SignUpPage from '../pages/SignUpPage';
import AuthCallbackPage from '../pages/AuthCallbackPage';
import NotFoundPage from '../pages/NotFoundPage';
import AuthGuard from '../components/auth/AuthGuard';
import { AuthProvider } from '../components/auth/AuthContext';

// Marketing Pages
import LandingPage from '../pages/LandingPage';
import ProductsPage from '../pages/products/ProductsPage';
import ChickenTenderProductPage from '../pages/products/ChickenTenderProductPage';
import CattleCareProductPage from '../pages/products/CattleCareProductPage';
import PigPalProductPage from '../pages/products/PigPalProductPage';
import GoatGuardianProductPage from '../pages/products/GoatGuardianProductPage';
import DuckDockProductPage from '../pages/products/DuckDockProductPage';
import CommunityPage from '../pages/marketing/CommunityPage';
import ContactPage from '../pages/marketing/ContactPage';
import AboutPage from '../pages/marketing/AboutPage';

export default function AppRouter() {
  return (
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <AuthProvider>
        <Routes>
          {/* Public Marketing Routes (no auth required) */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/home" element={<LandingPage />} />
          
          {/* Product Pages */}
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/products/chicken-tender" element={<ChickenTenderProductPage />} />
          <Route path="/products/cattle-care" element={<CattleCareProductPage />} />
          <Route path="/products/pig-pal" element={<PigPalProductPage />} />
          <Route path="/products/goat-guardian" element={<GoatGuardianProductPage />} />
          <Route path="/products/duck-dock" element={<DuckDockProductPage />} />
          
          {/* Marketing Pages */}
          <Route path="/community" element={<CommunityPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/about" element={<AboutPage />} />
          
          {/* Auth Routes (no auth required) */}
          <Route path="/signin" element={<SignInPage />} />
          <Route path="/signup" element={<SignUpPage />} />
          <Route path="/auth/callback/:provider" element={<AuthCallbackPage />} />
          
          {/* Protected App Routes (auth required) */}
          <Route path="/app" element={<AuthGuard><Layout /></AuthGuard>}>
            <Route index element={<DashboardPage />} />
            
            {/* Flock Routes */}
            <Route path="flock" element={<FlockPage />} />
            <Route path="flock/health" element={<FlockHealthPage />} />
            <Route path="flock/production" element={<FlockProductionPage />} />
            
            {/* Automation Routes */}
            <Route path="automation" element={<AutomationPage />} />
            <Route path="automation/rules" element={<AutomationPage />} />
            <Route path="automation/schedules" element={<AutomationSchedulesPage />} />
            <Route path="automation/devices" element={<AutomationDevicesPage />} />
            <Route path="automation/cnc" element={<CNCPage />} />
            
            {/* Analytics Routes */}
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route path="analytics/reports" element={<AnalyticsReportsPage />} />
            <Route path="analytics/insights" element={<AnalyticsInsightsPage />} />
            
            {/* Macros Route */}
            <Route path="macros" element={<MacrosPage />} />
            
            {/* Settings Routes */}
            <Route path="settings" element={<SettingsPage />} />
            
            {/* Account Routes */}
            <Route path="account" element={<AccountPage />} />
            <Route path="account/profile" element={<AccountPage />} />
            <Route path="account/security" element={<AccountPage />} />
            <Route path="account/notifications" element={<AccountPage />} />
          </Route>

          {/* Legacy routes - redirect to /app */}
          <Route element={<AuthGuard><Layout /></AuthGuard>}>
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="flock" element={<FlockPage />} />
            <Route path="flock/health" element={<FlockHealthPage />} />
            <Route path="flock/production" element={<FlockProductionPage />} />
            <Route path="automation" element={<AutomationPage />} />
            <Route path="automation/rules" element={<AutomationPage />} />
            <Route path="automation/schedules" element={<AutomationSchedulesPage />} />
            <Route path="automation/devices" element={<AutomationDevicesPage />} />
            <Route path="automation/cnc" element={<CNCPage />} />
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route path="analytics/reports" element={<AnalyticsReportsPage />} />
            <Route path="analytics/insights" element={<AnalyticsInsightsPage />} />
            <Route path="macros" element={<MacrosPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="account" element={<AccountPage />} />
          </Route>

          {/* Redirect /schedules to /app/automation/schedules for backwards compatibility */}
          <Route path="/schedules" element={<Navigate to="/app/automation/schedules" replace />} />
          
          {/* 404 Page */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
