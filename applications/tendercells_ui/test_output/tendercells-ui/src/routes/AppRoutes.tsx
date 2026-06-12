// AppRoutes.tsx
import { Navigate, Route, Routes } from "react-router-dom";
import {
  AccountPage,
  BunnyBurrowDashboard,
  ChickenTenderDashboard,
  DeviceDetailPage,
  DuckDockDashboard,
  GoatGuardianDashboard,
  PigeonPalaceDashboard,
  PredatorMonitorDashboard,
  ProductSpecsPage,
  ProductsPage,
  PropertyLayoutBuilder,
  RailSystemModulesDashboard,
  RoamingRoostDashboard,
  SchedulesPage,
  SettingsPage,
  TenderCellsCloudDashboard,
  TurkeyTowerDashboard,
} from "../pages";
import DashboardPage from "../pages/DashboardPage";
import DiagnosticsPage from "../pages/DiagnosticsPage";
import AnalyticsPage from "../pages/AnalyticsPage";
import BirdManagementPage from "../pages/BirdManagementPage";
import BirdEditPage from "../pages/BirdEditPage";
import TenderAIPage from "../pages/TenderAIPage";
import SetupWizardPage from "../pages/SetupWizardPage";
import ChickenEyeDashboardPage from "../pages/ChickenEyeDashboardPage";
import ChickenEyeBirdPage from "../pages/ChickenEyeBirdPage";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      {/* Product dashboards */}
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

      {/* Global pages */}
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/products" element={<ProductsPage />} />
      <Route path="/layout" element={<PropertyLayoutBuilder />} />
      <Route path="/schedules" element={<SchedulesPage />} />
      <Route path="/specs" element={<ProductSpecsPage />} />
      <Route path="/device/:deviceId" element={<DeviceDetailPage />} />
      <Route path="/analytics" element={<AnalyticsPage />} />
      <Route path="/diagnostics" element={<DiagnosticsPage />} />
      <Route path="/birds" element={<BirdManagementPage />} />
      <Route path="/birds/:birdId" element={<BirdEditPage />} />
      <Route path="/ai" element={<TenderAIPage />} />
      <Route path="/setup" element={<SetupWizardPage />} />
      <Route path="/chicken-eye" element={<ChickenEyeDashboardPage />} />
      <Route path="/chicken-eye/:birdId" element={<ChickenEyeBirdPage />} />
      <Route path="/settings" element={<SettingsPage />} />
      <Route path="/account" element={<AccountPage />} />
    </Routes>
  );
}
