import { BrowserRouter, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import ShopPage from "./pages/ShopPage";
import ProductDetailPage from "./pages/ProductDetailPage";
import EducationPage from "./pages/EducationPage";
import ApplicationsPage from "./pages/ApplicationsPage";
import LearnPage from "./pages/LearnPage";
import HomesteadingPage from "./pages/HomesteadingPage";
import AutomationPage from "./pages/AutomationPage";
import FaqPage from "./pages/FaqPage";
import HealthPage from "./pages/HealthPage";
import ServicesPage from "./pages/ServicesPage";
import OpenSourcePage from "./pages/OpenSourcePage";
import BlogPage from "./pages/BlogPage";
import NotFoundPage from "./pages/NotFoundPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />

        {/* Shop */}
        <Route path="/shop" element={<ShopPage />} />
        <Route path="/shop/:slug" element={<ProductDetailPage />} />

        {/* Education */}
        <Route path="/education" element={<EducationPage />} />

        {/* Applications */}
        <Route path="/apps" element={<ApplicationsPage />} />

        {/* Learn */}
        <Route path="/learn" element={<LearnPage />} />
        <Route path="/learn/homesteading" element={<HomesteadingPage />} />
        <Route path="/learn/automation" element={<AutomationPage />} />
        <Route path="/learn/faq" element={<FaqPage />} />

        {/* Animal Health */}
        <Route path="/health" element={<HealthPage />} />

        {/* Local Services */}
        <Route path="/services" element={<ServicesPage />} />

        {/* Open Source */}
        <Route path="/open-source" element={<OpenSourcePage />} />

        {/* Blog */}
        <Route path="/blog" element={<BlogPage />} />

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
