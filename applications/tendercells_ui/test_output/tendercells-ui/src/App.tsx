// App.tsx
import { useState, useEffect } from "react";
import SplashScreen from "./components/SplashScreen";
import MainLayout from "./components/layout/MainLayout";
import { BrowserRouter, useNavigate, useLocation } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import AppRoutes from "./routes/AppRoutes";

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
      <AppRoutes />
    </MainLayout>
  );
}

function App() {
  const basename = import.meta.env.BASE_URL === '/' ? undefined : import.meta.env.BASE_URL.replace(/\/$/, '');

  return (
    <AuthProvider>
      <BrowserRouter basename={basename} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AppContent />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
