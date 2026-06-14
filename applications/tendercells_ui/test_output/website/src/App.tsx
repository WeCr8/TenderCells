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
import DevelopersPage from "./pages/DevelopersPage";
import TenderCellsOverviewPage from "./pages/TenderCellsOverviewPage";
import AudienceProgramPage from "./pages/AudienceProgramPage";
import TrustPage from "./pages/TrustPage";
import GuidePage from "./pages/GuidePage";
import BlogPage from "./pages/BlogPage";
import StoryPage from "./pages/StoryPage";
import NotFoundPage from "./pages/NotFoundPage";
import { usePageTracking } from "./hooks/usePageTracking";
import { useMarketingTelemetry } from "./hooks/useMarketingTelemetry";

// Fires GA4 page_view on every route change — must be inside <BrowserRouter>
function PageTracker() {
  usePageTracking();
  useMarketingTelemetry();
  return null;
}

function App() {
  return (
    <BrowserRouter>
      <PageTracker />
      <Routes>
        <Route path="/" element={<LandingPage />} />

        {/* Shop */}
        <Route path="/shop" element={<ShopPage />} />
        <Route path="/shop/:slug" element={<ProductDetailPage />} />

        {/* Education */}
        <Route path="/education" element={<EducationPage />} />
        <Route path="/academy" element={<AudienceProgramPage kind="academy" />} />
        <Route path="/4h" element={<AudienceProgramPage kind="4h" />} />
        <Route path="/ffa" element={<AudienceProgramPage kind="ffa" />} />
        <Route path="/homeschool" element={<AudienceProgramPage kind="homeschool" />} />
        <Route path="/science-fair" element={<AudienceProgramPage kind="science-fair" />} />

        {/* Applications */}
        <Route path="/apps" element={<ApplicationsPage />} />

        {/* Learn */}
        <Route path="/learn" element={<LearnPage />} />
        <Route path="/learn/homesteading" element={<HomesteadingPage />} />
        <Route path="/learn/automation" element={<AutomationPage />} />
        <Route path="/learn/faq" element={<FaqPage />} />
        <Route path="/guides/smart-chicken-coop" element={<GuidePage slug="smart-chicken-coop" />} />
        <Route path="/guides/predator-monitoring" element={<GuidePage slug="predator-monitoring" />} />
        <Route path="/guides/pasture-rotation" element={<GuidePage slug="pasture-rotation" />} />

        {/* Animal Health */}
        <Route path="/health" element={<HealthPage />} />

        {/* Local Services */}
        <Route path="/services" element={<ServicesPage />} />

        {/* Open Source */}
        <Route path="/open-source" element={<OpenSourcePage />} />
        <Route path="/developers" element={<DevelopersPage />} />
        <Route path="/tender-cells-overview" element={<TenderCellsOverviewPage />} />

        {/* Story */}
        <Route path="/story" element={<StoryPage />} />
        <Route path="/about" element={<TrustPage kind="about" />} />
        <Route path="/contact" element={<TrustPage kind="contact" />} />
        <Route path="/privacy" element={<TrustPage kind="privacy" />} />
        <Route path="/terms" element={<TrustPage kind="terms" />} />
        <Route path="/editorial-policy" element={<TrustPage kind="editorial" />} />

        {/* Blog */}
        <Route path="/blog" element={<BlogPage />} />

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
