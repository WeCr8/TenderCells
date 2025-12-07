import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Pages - Landing
import LandingPage from './pages/LandingPage';
import NotFoundPage from './pages/NotFoundPage';

// Pages - Products
import ProductsPage from './pages/products/ProductsPage';
import ChickenTenderProductPage from './pages/products/ChickenTenderProductPage';
import CattleCareProductPage from './pages/products/CattleCareProductPage';
import PigPalProductPage from './pages/products/PigPalProductPage';
import GoatGuardianProductPage from './pages/products/GoatGuardianProductPage';
import DuckDockProductPage from './pages/products/DuckDockProductPage';

// Pages - Marketing
import CommunityPage from './pages/marketing/CommunityPage';
import ContactPage from './pages/marketing/ContactPage';
import AboutPage from './pages/marketing/AboutPage';

// Pages - Learn
import HowItWorksPage from './pages/learn/HowItWorksPage';
import TechnologyPage from './pages/learn/TechnologyPage';
import FAQPage from './pages/learn/FAQPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Home */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/home" element={<LandingPage />} />
        
        {/* Products */}
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/products/chicken-tender" element={<ChickenTenderProductPage />} />
        <Route path="/products/cattle-care" element={<CattleCareProductPage />} />
        <Route path="/products/pig-pal" element={<PigPalProductPage />} />
        <Route path="/products/goat-guardian" element={<GoatGuardianProductPage />} />
        <Route path="/products/duck-dock" element={<DuckDockProductPage />} />
        
        {/* Learn More */}
        <Route path="/how-it-works" element={<HowItWorksPage />} />
        <Route path="/technology" element={<TechnologyPage />} />
        <Route path="/faq" element={<FAQPage />} />
        
        {/* Marketing Pages */}
        <Route path="/community" element={<CommunityPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/about" element={<AboutPage />} />
        
        {/* Placeholder routes - these will be created later */}
        <Route path="/store" element={<NotFoundPage />} />
        <Route path="/blog" element={<NotFoundPage />} />
        <Route path="/education" element={<NotFoundPage />} />
        <Route path="/education/*" element={<NotFoundPage />} />
        <Route path="/open-source" element={<NotFoundPage />} />
        <Route path="/animal-health" element={<NotFoundPage />} />
        <Route path="/services" element={<NotFoundPage />} />
        <Route path="/support" element={<NotFoundPage />} />
        <Route path="/success-stories" element={<NotFoundPage />} />
        <Route path="/sales" element={<NotFoundPage />} />
        <Route path="/press" element={<NotFoundPage />} />
        <Route path="/partnerships" element={<NotFoundPage />} />
        <Route path="/assets" element={<NotFoundPage />} />
        <Route path="/signin" element={<NotFoundPage />} />
        <Route path="/signup" element={<NotFoundPage />} />
        <Route path="/cart" element={<NotFoundPage />} />
        <Route path="/search" element={<NotFoundPage />} />
        <Route path="/privacy" element={<NotFoundPage />} />
        <Route path="/terms" element={<NotFoundPage />} />
        <Route path="/cookies" element={<NotFoundPage />} />
        <Route path="/docs" element={<NotFoundPage />} />
        <Route path="/api" element={<NotFoundPage />} />
        <Route path="/careers" element={<NotFoundPage />} />
        
        {/* 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
