// App.tsx
import React, { useState, useEffect } from "react";
import SplashScreen from "./components/SplashScreen";
import AppRoutes from "./routes/AppRoutes";

function App() {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2000); // Splash screen duration

    return () => clearTimeout(timer);
  }, []);

  if (showSplash) {
    return <SplashScreen />;
  }

  return <AppRoutes />;
}

export default App;
