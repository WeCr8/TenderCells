import { BrowserRouter, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import ShopPage from "./pages/ShopPage";
import ProductDetailPage from "./pages/ProductDetailPage";
import EducationPage from "./pages/EducationPage";
import ApplicationsPage from "./pages/ApplicationsPage";
import LearnPage from "./pages/LearnPage";
import LessonsPage from "./pages/LessonsPage";
import LessonPage from "./pages/LessonPage";
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
import CameraNodeGuidePage from "./pages/CameraNodeGuidePage";
import SeoHubPage from "./pages/SeoHubPage";
import GuidesPage from "./pages/GuidesPage";
import ScienceFairPage from "./pages/ScienceFairPage";
import TenderCellsOsPage from "./pages/TenderCellsOsPage";
import LLMDemoTestPage from "./pages/LLMDemoTestPage";
import FarmAutomationPage from "./pages/FarmAutomationPage";
import PublicDemoPage from "./pages/PublicDemoPage";
import BlogPage from "./pages/BlogPage";
import StoryPage from "./pages/StoryPage";
import PartnersPage from "./pages/PartnersPage";
import SearchPage from "./pages/SearchPage";
import NotFoundPage from "./pages/NotFoundPage";
import CookieConsent from "./components/CookieConsent";
import ScrollManager from "./components/ScrollManager";
import { usePageTracking } from "./hooks/usePageTracking";
import { useMarketingTelemetry } from "./hooks/useMarketingTelemetry";
import { lazy, Suspense, useEffect } from "react";
import { getConsentChoice } from "./utils/consent";
import { identifyVisitor } from "./utils/analytics";

// Lazy so the Firebase Auth SDK only loads for visitors who open /account.
const AccountPage = lazy(() => import("./pages/AccountPage"));
const AuthActionPage = lazy(() => import("./pages/AuthActionPage"));
const NewsletterPage = lazy(() => import("./pages/NewsletterPage"));
const SchoolsPage = lazy(() => import("./pages/SchoolsPage"));
const LibraryPage = lazy(() => import("./pages/LibraryPage"));
const DocsPage = lazy(() => import("./pages/DocsPage"));

// Fires GA4 page_view on every route change — must be inside <BrowserRouter>
function PageTracker() {
  usePageTracking();
  useMarketingTelemetry();

  // Returning visitor who already accepted analytics in a prior session: re-attach
  // their pseudonymous user_id once on load (fresh accept/withdraw is handled in consent.ts).
  useEffect(() => {
    if (getConsentChoice() === "accepted") identifyVisitor();
  }, []);

  return null;
}

function App() {
  return (
    <BrowserRouter>
      <PageTracker />
      <ScrollManager />
      <Routes>
        <Route path="/" element={<LandingPage />} />

        {/* Shop */}
        <Route path="/shop" element={<ShopPage />} />
        <Route path="/shop/:slug" element={<ProductDetailPage />} />

        {/* Education */}
        <Route path="/education" element={<EducationPage />} />
        <Route path="/audiences" element={<SeoHubPage kind="audiences" />} />
        <Route path="/academy" element={<AudienceProgramPage kind="academy" />} />
        <Route path="/4h" element={<AudienceProgramPage kind="4h" />} />
        <Route path="/ffa" element={<AudienceProgramPage kind="ffa" />} />
        <Route path="/homeschool" element={<AudienceProgramPage kind="homeschool" />} />
        <Route path="/science-fair" element={<ScienceFairPage />} />

        {/* Applications */}
        <Route path="/apps" element={<ApplicationsPage />} />
        <Route path="/demo" element={<PublicDemoPage />} />
        <Route path="/os" element={<TenderCellsOsPage />} />

        {/* Learn */}
        <Route path="/learn" element={<LearnPage />} />
        <Route path="/lessons" element={<LessonsPage />} />
        <Route path="/lessons/:slug" element={<LessonPage />} />
        <Route path="/learn/homesteading" element={<HomesteadingPage />} />
        <Route path="/learn/automation" element={<AutomationPage />} />
        <Route path="/learn/faq" element={<FaqPage />} />
        <Route path="/guides" element={<GuidesPage />} />
        <Route path="/guides/smart-chicken-coop" element={<GuidePage slug="smart-chicken-coop" />} />
        <Route path="/guides/predator-monitoring" element={<GuidePage slug="predator-monitoring" />} />
        <Route path="/guides/pasture-rotation" element={<GuidePage slug="pasture-rotation" />} />
        <Route path="/guides/camera-node-first-build" element={<CameraNodeGuidePage />} />
        <Route path="/farm-automation" element={<FarmAutomationPage />} />
        <Route path="/docs" element={<Suspense fallback={null}><DocsPage /></Suspense>} />
        <Route path="/docs/:slug" element={<Suspense fallback={null}><DocsPage /></Suspense>} />

        {/* Animal Health */}
        <Route path="/health" element={<HealthPage />} />

        {/* Local Services */}
        <Route path="/services" element={<ServicesPage />} />
        <Route path="/partners" element={<PartnersPage />} />

        {/* Open Source */}
        <Route path="/open-source" element={<OpenSourcePage />} />
        <Route path="/developers" element={<DevelopersPage />} />
        <Route path="/tender-cells-overview" element={<TenderCellsOverviewPage />} />
        <Route path="/llm-demo-test" element={<LLMDemoTestPage />} />

        {/* Story */}
        <Route path="/story" element={<StoryPage />} />
        <Route path="/our-story" element={<StoryPage />} />
        <Route path="/about" element={<TrustPage kind="about" />} />
        <Route path="/contact" element={<TrustPage kind="contact" />} />
        <Route path="/privacy" element={<TrustPage kind="privacy" />} />
        <Route path="/cookie-policy" element={<TrustPage kind="cookies" />} />
        <Route path="/advertising-disclosure" element={<TrustPage kind="advertising" />} />
        <Route path="/terms" element={<TrustPage kind="terms" />} />
        <Route path="/editorial-policy" element={<TrustPage kind="editorial" />} />

        {/* Blog */}
        <Route path="/blog" element={<BlogPage />} />

        {/* Account (website sign-in; the OS launches only from its button) */}
        <Route path="/account" element={<Suspense fallback={null}><AccountPage /></Suspense>} />
        <Route path="/account/action" element={<Suspense fallback={null}><AuthActionPage /></Suspense>} />
        <Route path="/newsletter" element={<Suspense fallback={null}><NewsletterPage /></Suspense>} />
        <Route path="/newsletter/confirm" element={<Suspense fallback={null}><NewsletterPage mode="confirm" /></Suspense>} />
        <Route path="/newsletter/unsubscribe" element={<Suspense fallback={null}><NewsletterPage mode="unsubscribe" /></Suspense>} />
        <Route path="/schools" element={<Suspense fallback={null}><SchoolsPage /></Suspense>} />
        <Route path="/library" element={<Suspense fallback={null}><LibraryPage /></Suspense>} />
        <Route path="/library/:kind/:id" element={<Suspense fallback={null}><LibraryPage /></Suspense>} />

        {/* Search */}
        <Route path="/search" element={<SearchPage />} />

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      <CookieConsent />
    </BrowserRouter>
  );
}

export default App;
