// App.tsx
import React, { useState, useEffect } from "react";
import SplashScreen from "./components/SplashScreen";
import MainLayout from "./components/layout/MainLayout";
import { Routes, Route, useNavigate } from "react-router-dom";
import { ChickenTenderDashboard, RoamingRoostDashboard, DuckDockDashboard, GoatGuardianDashboard, BunnyBurrowDashboard, TurkeyTowerDashboard, PredatorMonitorDashboard, RailSystemModulesDashboard, TenderCellsCloudDashboard, PigeonPalaceDashboard, SettingsPage, AccountPage } from "./pages";

function App() {
  const [product, setProduct] = useState("chicken-tender");
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2000); // Splash screen duration

    return () => clearTimeout(timer);
  }, []);

  const handleProductChange = (newProduct: string) => {
    setProduct(newProduct);
  };

  if (showSplash) {
    return <SplashScreen />;
  }

  return (
    <MainLayout title={product}>
      <Routes>
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
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/account" element={<AccountPage />} />
      </Routes>
    </MainLayout>
  );
}

export default App;
