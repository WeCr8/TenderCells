// Simple Router for Single Page Application
import { analytics, trackPageView } from './utils/analytics.js';
import { seoManager, updatePageSEO } from './utils/seo.js';
import { createStorePage, initializeStore } from './pages/store.js';
import { createCheckoutPage, initializeCheckout } from './pages/checkout.js';
import { createContactPage, initializeContactPage } from './pages/contact.js';
import { createSupportPage, initializeSupportPage } from './pages/support.js';
import { createEducationPage, initializeEducationPage } from './pages/education.js';
import { createChickenTenderPage, initializeChickenTenderPage } from './pages/chicken-tender.js';
import { createCattleCarePage, initializeCattleCarePage } from './pages/cattle-care.js';
import { createPigPalPage, initializePigPalPage } from './pages/pig-pal.js';
import { createGoatGuardianPage, initializeGoatGuardianPage } from './pages/goat-guardian.js';
import { createDuckDockPage, initializeDuckDockPage } from './pages/duck-dock.js';
import { createTenderCellsApplicationPage, initializeTenderCellsApplicationPage } from './pages/tender-cells-application.js';
import { createAllProductsPage, initializeAllProductsPage } from './pages/all-products.js';
import { createPigeonPalacePage, initializePigeonPalacePage } from './pages/pigeon-palace.js';
import { createBunnyBurrowPage, initializeBunnyBurrowPage } from './pages/bunny-burrow.js';
import { createTurkeyTowerPage, initializeTurkeyTowerPage } from './pages/turkey-tower.js';
import { createRoamingRoostPage, initializeRoamingRoostPage } from './pages/roaming-roost.js';
import { createPredatorMonitoringPage, initializePredatorMonitoringPage } from './pages/predator-monitoring.js';
import { createEducationalProgramsPage, initializeEducationalProgramsPage } from './pages/education/programs.js';
import { createCurriculumFrameworkPage, initializeCurriculumFrameworkPage } from './pages/education/curriculum.js';
import { createTeacherResourcesPage, initializeTeacherResourcesPage } from './pages/education/resources.js';
import { createStudentProjectsPage, initializeStudentProjectsPage } from './pages/education/projects.js';
import { createEducationalPricingPage, initializeEducationalPricingPage } from './pages/education/pricing.js';
import { createEducationContactPage, initializeEducationContactPage } from './pages/education/contact.js';
import { createOpenSourcePage, initializeOpenSourcePage } from './pages/open-source.js';
import { createBlogPage, initializeBlogPage } from './pages/blog.js';
import { createBlogPostPage, initializeBlogPostPage } from './pages/blog-post.js';
import { createHowItWorksPage, initializeHowItWorksPage } from './pages/how-it-works.js';
import { createTechnologyPage, initializeTechnologyPage } from './pages/technology.js';
import { createSuccessStoriesPage, initializeSuccessStoriesPage } from './pages/success-stories.js';
import { createFAQPage, initializeFAQPage } from './pages/faq.js';
import { createAnimalHealthPage, initializeAnimalHealthPage } from './pages/animal-health.js';
import { createAccountPage, initializeAccountPage } from './pages/account.js';
import { createAssetsPage, initializeAssetsPage } from './pages/assets.js';
import { createServicesPage, initServicesPage } from './pages/services.js';
import { createPressPage, initializePressPage } from './pages/press.js';
import { createPartnershipsPage, initializePartnershipsPage } from './pages/partnerships.js';
import { createSalesPage, initializeSalesPage } from './pages/sales.js';
import { resetBodyScroll } from './utils/scrollLock.js';

class Router {
  constructor() {
    this.routes = {
      '': this.renderHome,
      'store': this.renderStore,
      'checkout': this.renderCheckout,
      'contact': this.renderContact,
      'support': this.renderSupport,
      'education': this.renderEducation,
      'education/programs': this.renderEducationPrograms,
      'education/curriculum': this.renderEducationCurriculum,
      'education/resources': this.renderEducationResources,
      'education/projects': this.renderEducationProjects,
      'education/pricing': this.renderEducationPricing,
      'education/contact': this.renderEducationContact,
      'open-source': this.renderOpenSource,
      'blog': this.renderBlog,
      'how-it-works': this.renderHowItWorks,
      'technology': this.renderTechnology,
      'success-stories': this.renderSuccessStories,
      'faq': this.renderFAQ,
      'chicken-tender': this.renderChickenTender,
      'cattle-care': this.renderCattleCare,
      'pig-pal': this.renderPigPal,
      'goat-guardian': this.renderGoatGuardian,
      'duck-dock': this.renderDuckDock,
      'tender-cells-application': this.renderTenderCellsApplication,
      'all-products': this.renderAllProducts,
      'pigeon-palace': this.renderPigeonPalace,
      'bunny-burrow': this.renderBunnyBurrow,
      'turkey-tower': this.renderTurkeyTower,
      'roaming-roost': this.renderRoamingRoost,
      'predator-monitoring': this.renderPredatorMonitoring,
      'animal-health': this.renderAnimalHealth,
      'services': this.renderServices,
      'account': this.renderAccount,
      'assets': this.renderAssets,
      'press': this.renderPress,
      'partnerships': this.renderPartnerships,
      'sales': this.renderSales
    };
    
    this.init();
  }

  init() {
    // Listen for hash changes
    window.addEventListener('hashchange', () => this.handleRoute());
    
    // Handle initial route
    this.handleRoute();
  }

  handleRoute() {
    const hash = window.location.hash.slice(1); // Remove #
    const route = this.routes[hash] || this.routes[''];

    resetBodyScroll();
    
    // Update SEO for current route
    updatePageSEO(hash);
    
    // Track page view
    const pageTitle = document.title;
    trackPageView(hash || '/', pageTitle);
    
    // Update active navigation
    this.updateNavigation(hash);
    
    // Render the route
    route.call(this);
  }

  updateNavigation(currentRoute) {
    // Remove active class from all nav items
    document.querySelectorAll('.nav-link').forEach(link => {
      link.classList.remove('active');
    });
    
    // Add active class to current route
    const activeLink = document.querySelector(`a[href="#${currentRoute}"]`);
    if (activeLink) {
      activeLink.classList.add('active');
    }
  }

  renderHome() {
    // Show the main homepage content
    const mainContent = document.querySelector('main');
    if (mainContent) {
      mainContent.style.display = 'block';
    }
    
    // Hide any page-specific content
    this.hidePageContent();
  }

  renderStore() {
    this.hideMainContent();
    this.showPageContent(createStorePage());
    
    // Initialize store functionality
    setTimeout(() => initializeStore(), 100);
  }

  renderCheckout() {
    this.hideMainContent();
    this.showPageContent(createCheckoutPage());
    
    // Initialize checkout functionality
    setTimeout(() => initializeCheckout(), 100);
  }

  renderContact() {
    this.hideMainContent();
    this.showPageContent(createContactPage());
    
    // Initialize contact functionality
    setTimeout(() => initializeContactPage(), 100);
  }

  renderSupport() {
    this.hideMainContent();
    this.showPageContent(createSupportPage());
    
    // Initialize support functionality
    setTimeout(() => initializeSupportPage(), 100);
  }

  renderEducation() {
    this.hideMainContent();
    this.showPageContent(createEducationPage());
    
    // Initialize education functionality
    setTimeout(() => initializeEducationPage(), 100);
  }

  renderEducationPrograms() {
    this.hideMainContent();
    this.showPageContent(createEducationalProgramsPage());
    
    setTimeout(() => initializeEducationalProgramsPage(), 100);
  }

  renderEducationCurriculum() {
    this.hideMainContent();
    this.showPageContent(createCurriculumFrameworkPage());
    
    setTimeout(() => initializeCurriculumFrameworkPage(), 100);
  }

  renderEducationResources() {
    this.hideMainContent();
    this.showPageContent(createTeacherResourcesPage());
    
    setTimeout(() => initializeTeacherResourcesPage(), 100);
  }

  renderEducationProjects() {
    this.hideMainContent();
    this.showPageContent(createStudentProjectsPage());
    
    setTimeout(() => initializeStudentProjectsPage(), 100);
  }

  renderEducationPricing() {
    this.hideMainContent();
    this.showPageContent(createEducationalPricingPage());
    
    setTimeout(() => initializeEducationalPricingPage(), 100);
  }

  renderEducationContact() {
    this.hideMainContent();
    this.showPageContent(createEducationContactPage());
    
    setTimeout(() => initializeEducationContactPage(), 100);
  }

  renderBlog() {
    const hash = window.location.hash.slice(1);
    
    // Check if it's a blog post URL (blog/post-slug)
    if (hash.startsWith('blog/') && hash.length > 5) {
      const slug = hash.substring(5); // Remove 'blog/' prefix
      this.hideMainContent();
      this.showPageContent(createBlogPostPage(slug));
      setTimeout(() => initializeBlogPostPage(slug), 100);
    } else {
      // Regular blog page
      this.hideMainContent();
      this.showPageContent(createBlogPage());
      setTimeout(() => initializeBlogPage(), 100);
    }
  }

  renderOpenSource() {
    this.hideMainContent();
    this.showPageContent(createOpenSourcePage());
    
    setTimeout(() => initializeOpenSourcePage(), 100);
  }

  renderHowItWorks() {
    this.hideMainContent();
    this.showPageContent(createHowItWorksPage());
    
    setTimeout(() => initializeHowItWorksPage(), 100);
  }

  renderTechnology() {
    this.hideMainContent();
    this.showPageContent(createTechnologyPage());
    
    setTimeout(() => initializeTechnologyPage(), 100);
  }

  renderSuccessStories() {
    this.hideMainContent();
    this.showPageContent(createSuccessStoriesPage());
    
    setTimeout(() => initializeSuccessStoriesPage(), 100);
  }

  renderFAQ() {
    this.hideMainContent();
    this.showPageContent(createFAQPage());
    
    setTimeout(() => initializeFAQPage(), 100);
  }

  renderChickenTender() {
    this.hideMainContent();
    this.showPageContent(createChickenTenderPage());
    
    // Initialize chicken tender functionality
    setTimeout(() => initializeChickenTenderPage(), 100);
  }

  renderCattleCare() {
    this.hideMainContent();
    this.showPageContent(createCattleCarePage());
    
    // Initialize cattle care functionality
    setTimeout(() => initializeCattleCarePage(), 100);
  }

  renderPigPal() {
    this.hideMainContent();
    this.showPageContent(createPigPalPage());
    
    // Initialize pig pal functionality
    setTimeout(() => initializePigPalPage(), 100);
  }

  renderGoatGuardian() {
    this.hideMainContent();
    this.showPageContent(createGoatGuardianPage());
    
    // Initialize goat guardian functionality
    setTimeout(() => initializeGoatGuardianPage(), 100);
  }

  renderDuckDock() {
    this.hideMainContent();
    this.showPageContent(createDuckDockPage());
    
    // Initialize duck dock functionality
    setTimeout(() => initializeDuckDockPage(), 100);
  }

  renderTenderCellsApplication() {
    this.hideMainContent();
    this.showPageContent(createTenderCellsApplicationPage());
    
    // Initialize Tender Cells Application page functionality
    setTimeout(() => initializeTenderCellsApplicationPage(), 100);
  }

  renderAllProducts() {
    this.hideMainContent();
    this.showPageContent(createAllProductsPage());
    
    setTimeout(() => initializeAllProductsPage(), 100);
  }

  renderPigeonPalace() {
    this.hideMainContent();
    this.showPageContent(createPigeonPalacePage());
    
    setTimeout(() => initializePigeonPalacePage(), 100);
  }

  renderBunnyBurrow() {
    this.hideMainContent();
    this.showPageContent(createBunnyBurrowPage());
    
    setTimeout(() => initializeBunnyBurrowPage(), 100);
  }

  renderTurkeyTower() {
    this.hideMainContent();
    this.showPageContent(createTurkeyTowerPage());
    
    setTimeout(() => initializeTurkeyTowerPage(), 100);
  }

  renderRoamingRoost() {
    this.hideMainContent();
    this.showPageContent(createRoamingRoostPage());
    
    setTimeout(() => initializeRoamingRoostPage(), 100);
  }

  renderPredatorMonitoring() {
    this.hideMainContent();
    this.showPageContent(createPredatorMonitoringPage());
    
    setTimeout(() => initializePredatorMonitoringPage(), 100);
  }

  renderAnimalHealth() {
    this.hideMainContent();
    this.showPageContent(createAnimalHealthPage());
    
    // Initialize animal health functionality
    setTimeout(() => initializeAnimalHealthPage(), 100);
  }

  renderServices() {
    this.hideMainContent();
    this.showPageContent(createServicesPage());
    
    // Initialize services functionality
    setTimeout(() => initServicesPage(), 100);
  }

  renderPress() {
    this.hideMainContent();
    this.showPageContent(createPressPage());
    
    setTimeout(() => initializePressPage(), 100);
  }

  renderPartnerships() {
    this.hideMainContent();
    this.showPageContent(createPartnershipsPage());
    
    setTimeout(() => initializePartnershipsPage(), 100);
  }

  renderSales() {
    this.hideMainContent();
    this.showPageContent(createSalesPage());
    
    setTimeout(() => initializeSalesPage(), 100);
  }

  renderAccount() {
    this.hideMainContent();
    this.showPageContent(createAccountPage());
    
    // Initialize account functionality
    setTimeout(() => initializeAccountPage(), 100);
  }

  renderAssets() {
    this.hideMainContent();
    this.showPageContent(createAssetsPage());
    
    // Initialize assets functionality
    setTimeout(() => initializeAssetsPage(), 100);
  }

  hideMainContent() {
    const mainContent = document.querySelector('main');
    if (mainContent) {
      mainContent.style.display = 'none';
    }
  }

  showPageContent(content) {
    let pageContainer = document.getElementById('pageContainer');
    
    if (!pageContainer) {
      pageContainer = document.createElement('div');
      pageContainer.id = 'pageContainer';
      // Insert after header, before footer
      const header = document.querySelector('header');
      if (header && header.nextSibling) {
        document.body.insertBefore(pageContainer, header.nextSibling);
      } else {
        document.body.appendChild(pageContainer);
      }
    }
    
    pageContainer.innerHTML = content;
    pageContainer.style.display = 'block';
    pageContainer.style.visibility = 'visible';
    pageContainer.style.opacity = '1';
    
    // Scroll to top of page
    window.scrollTo(0, 0);
  }

  hidePageContent() {
    const pageContainer = document.getElementById('pageContainer');
    if (pageContainer) {
      pageContainer.style.display = 'none';
    }
  }

  // Navigate to a specific route
  navigate(route) {
    window.location.hash = route;
  }
}

// Create global router instance
export const router = new Router();

// Make router available globally for link handlers
window.router = router;

// Global navigation function
window.navigateTo = function(route) {
  router.navigate(route);
};