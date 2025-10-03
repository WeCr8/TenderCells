import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
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

export default function AppRouter() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Auth Routes (no auth required) */}
          <Route path="/signin" element={<SignInPage />} />
          <Route path="/signup" element={<SignUpPage />} />
          <Route path="/auth/callback/:provider" element={<AuthCallbackPage />} />
          
          {/* Protected Routes (auth required) */}
          <Route element={<AuthGuard><Layout /></AuthGuard>}>
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

          {/* 404 Page */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}