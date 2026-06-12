// App.tsx
import React, { useState, useEffect } from "react";
import SplashScreen from "./components/SplashScreen";
import MainLayout from "./components/layout/MainLayout";
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { ChickenTenderDashboard, RoamingRoostDashboard, DuckDockDashboard, GoatGuardianDashboard, BunnyBurrowDashboard, TurkeyTowerDashboard, PredatorMonitorDashboard, RailSystemModulesDashboard, TenderCellsCloudDashboard, PigeonPalaceDashboard, SettingsPage, AccountPage, ProductsPage, PropertyLayoutBuilder, ProductSpecsPage, DeviceDetailPage } from "./pages";

function AppContent() {
  const [product, setProduct] = useState("chicken-tender");
  const [showSplash, setShowSplash] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2000); // Splash screen duration

    return () => clearTimeout(timer);
  }, []);

  // Update product state based on current route
  useEffect(() => {
    const pathProduct = location.pathname.split('/')[1];
    if (pathProduct && pathProduct !== 'settings' && pathProduct !== 'account' && pathProduct !== 'schedules') {
      setProduct(pathProduct);
    }
  }, [location.pathname]);

  const handleProductChange = (newProduct: string) => {
    setProduct(newProduct);
    navigate(`/${newProduct}`);
  };

  if (showSplash) {
    return <SplashScreen />;
  }

  return (
    <MainLayout title={product} product={product} onProductChange={handleProductChange}>
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
    </MainLayout>
  );
}

function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
