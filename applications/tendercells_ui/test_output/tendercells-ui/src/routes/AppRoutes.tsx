// AppRoutes.tsx
import { useEffect } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { trackPageView } from "../analytics";
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
  ResourcesPage,
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
import DemoLandingPage from "../pages/DemoLandingPage";
import WeedPatrolPage from "../pages/WeedPatrolPage";
import MowersPage from "../pages/MowersPage";
import WatershedPage from "../pages/WatershedPage";
import LibraryPage from "../pages/LibraryPage";
import ProjectsPage from "../pages/ProjectsPage";
import EventSimulatorPage from "../pages/EventSimulatorPage";
import AssistantsPage from "../pages/AssistantsPage";
import MissionsPage from "../pages/MissionsPage";
import BuilderLibraryPage from "../features/builder/pages/BuilderLibraryPage";
import BuilderStepPage from "../features/builder/pages/BuilderStepPage";
import { markVisited } from "../lib/demo/missions";
import ProductDashboardPage from "../pages/ProductDashboardPage";
import CameraNodeFirstBuildPage from "../pages/guides/CameraNodeFirstBuildPage";

// Fires a page_view on every route change. No-op when analytics is disabled.
function RouteAnalytics() {
  const location = useLocation();
  useEffect(() => {
    void trackPageView(location.pathname + location.search);
    markVisited(location.pathname); // demo missions tick off "visit" steps
  }, [location.pathname, location.search]);
  return null;
}

export default function AppRoutes() {
  return (
    <>
    <RouteAnalytics />
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      {/* Public, no-signup demo front door — auto-seeds then lands on dashboard */}
      <Route path="/demo" element={<DemoLandingPage />} />
      <Route path="/try" element={<DemoLandingPage />} />

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
      <Route path="/resources" element={<ResourcesPage />} />
      <Route path="/guides/camera-node-first-build" element={<CameraNodeFirstBuildPage />} />
      <Route path="/coop" element={<Navigate to="/chicken-tender" replace />} />
      <Route path="/sensors" element={<Navigate to="/chicken-tender?section=sensors" replace />} />
      <Route path="/egg-map" element={<Navigate to="/chicken-tender?section=eggs" replace />} />
      <Route path="/eggs" element={<Navigate to="/chicken-tender?section=eggs" replace />} />
      <Route path="/flock" element={<Navigate to="/animals" replace />} />
      <Route path="/flock-roster" element={<Navigate to="/animals" replace />} />
      <Route path="/tenderai" element={<Navigate to="/ai" replace />} />
      <Route path="/tender-ai" element={<Navigate to="/ai" replace />} />
      <Route path="/tender-ai-chat" element={<Navigate to="/ai" replace />} />
      <Route path="/chat" element={<Navigate to="/ai" replace />} />
      <Route path="/automation/schedules" element={<Navigate to="/schedules" replace />} />
      <Route path="/products" element={<ProductsPage />} />
      <Route path="/layout" element={<PropertyLayoutBuilder />} />
      <Route path="/schedules" element={<SchedulesPage />} />
      <Route path="/weed-patrol" element={<WeedPatrolPage />} />
      <Route path="/mowers" element={<MowersPage />} />
      <Route path="/watershed" element={<WatershedPage />} />
      <Route path="/library" element={<LibraryPage />} />
      <Route path="/library/:kind/:id" element={<LibraryPage />} />
      <Route path="/projects" element={<ProjectsPage />} />
      <Route path="/simulator" element={<EventSimulatorPage />} />
      <Route path="/missions" element={<MissionsPage />} />
      <Route path="/builder" element={<BuilderLibraryPage />} />
      <Route path="/builder/:id" element={<BuilderStepPage />} />
      <Route path="/specs" element={<ProductSpecsPage />} />
      <Route path="/device/:deviceId" element={<DeviceDetailPage />} />
      <Route path="/product/:productId" element={<ProductDashboardPage />} />
      <Route path="/analytics" element={<AnalyticsPage />} />
      <Route path="/diagnostics" element={<DiagnosticsPage />} />
      <Route path="/animals" element={<BirdManagementPage />} />
      <Route path="/animals/:birdId" element={<BirdEditPage />} />
      <Route path="/birds" element={<Navigate to="/animals" replace />} />
      <Route path="/birds/:birdId" element={<Navigate to="/animals" replace />} />
      <Route path="/ai" element={<TenderAIPage />} />
      <Route path="/setup" element={<SetupWizardPage />} />
      <Route path="/chicken-eye" element={<ChickenEyeDashboardPage />} />
      <Route path="/chicken-eye/:birdId" element={<ChickenEyeBirdPage />} />
      <Route path="/settings" element={<SettingsPage />} />
      <Route path="/account" element={<AccountPage />} />
      <Route path="/assistants" element={<AssistantsPage />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
    </>
  );
}
