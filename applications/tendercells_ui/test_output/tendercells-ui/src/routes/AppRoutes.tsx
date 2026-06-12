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
  SettingsPage,
  TenderCellsCloudDashboard,
  TurkeyTowerDashboard,
} from "../pages";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/chicken-tender" replace />} />
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
      <Route path="/products" element={<ProductsPage />} />
      <Route path="/layout" element={<PropertyLayoutBuilder />} />
      <Route path="/specs" element={<ProductSpecsPage />} />
      <Route path="/device/:deviceId" element={<DeviceDetailPage />} />
      <Route path="/settings" element={<SettingsPage />} />
      <Route path="/account" element={<AccountPage />} />
    </Routes>
  );
}
