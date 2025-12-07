// Local Services Page - Find Service Providers Near You
import { 
  createServiceCard, 
  createServiceCategoryCard, 
  createEmergencyServiceCard,
  createMapSearchWidget 
} from '../components/ServiceCards.js';
import { 
  serviceCategories, 
  serviceProviders, 
  searchServices, 
  getFeaturedServices, 
  getEmergencyServices,
  getServicesByCategory 
} from '../store/services.js';
import { trackEvent } from '../utils/analytics.js';
import serviceSearch from '../components/ServiceSearch.js';

export function createServicesPage() {
  const featuredServices = getFeaturedServices();
  const emergencyServices = getEmergencyServices();
  
  return `
    <div class="services-page">
      <!-- Hero Section -->
      <section class="services-hero">
        <div class="container">
          <div class="services-hero-content">
            <h1>🏪 Local Animal Services</h1>
            <p class="services-tagline">Find trusted service providers in your area</p>
            <p class="services-description">
              Connect with local veterinarians, animal hospitals, memorial services, and more. 
              We partner with quality providers to ensure your animals get the best care possible.
            </p>
            <div class="hero-stats">
              <div class="stat">
                <span class="stat-number">${serviceProviders.length}+</span>
                <span class="stat-label">Service Providers</span>
              </div>
              <div class="stat">
                <span class="stat-number">${serviceCategories.length}</span>
                <span class="stat-label">Service Categories</span>
              </div>
              <div class="stat">
                <span class="stat-number">24/7</span>
                <span class="stat-label">Emergency Support</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Enhanced Search Section -->
      <section class="services-search-section">
        <div class="container">
          <div id="service-search-container"></div>
        </div>
      </section>

      <!-- Emergency Services Section -->
      <section class="emergency-services" id="emergency-services">
        <div class="container">
          <div class="section-header emergency-header">
            <h2>🚨 Emergency Services</h2>
            <p>24/7 emergency veterinary care and animal hospitals</p>
          </div>
          <div class="emergency-grid">
            ${emergencyServices.map(service => createEmergencyServiceCard(service)).join('')}
          </div>
        </div>
      </section>

      <!-- Map Search Widget -->
      <section class="map-search-section">
        <div class="container">
          ${createMapSearchWidget()}
        </div>
      </section>

      <!-- Service Categories -->
      <section class="service-categories" id="categories">
        <div class="container">
          <div class="section-header">
            <h2>🏷️ Service Categories</h2>
            <p>Browse services by type to find exactly what you need</p>
          </div>
          <div class="categories-grid">
            ${serviceCategories.map(category => createServiceCategoryCard(category)).join('')}
          </div>
        </div>
      </section>

      <!-- Featured Services -->
      <section class="featured-services" id="featured">
        <div class="container">
          <div class="section-header">
            <h2>⭐ Featured Service Providers</h2>
            <p>Top-rated services in your area</p>
          </div>
          <div class="services-grid">
            ${featuredServices.map(service => createServiceCard(service)).join('')}
          </div>
        </div>
      </section>

      <!-- All Services Browser -->
      <section class="all-services" id="all-services">
        <div class="container">
          <div class="section-header">
            <h2>🔍 Browse All Services</h2>
            <p>Complete directory of local animal service providers</p>
          </div>
          
          <div class="services-controls">
            <div class="search-controls">
              <input type="text" 
                     id="service-search" 
                     placeholder="Search services, specialties, or provider names..." 
                     class="search-input"
                     onkeyup="handleServiceSearch()">
              <button class="btn btn-primary" onclick="performServiceSearch()">
                Search
              </button>
            </div>
            
            <div class="filter-controls">
              <select id="category-filter" onchange="handleCategoryFilter()">
                <option value="">All Categories</option>
                ${serviceCategories.map(cat => 
                  `<option value="${cat.id}">${cat.name}</option>`
                ).join('')}
              </select>
              
              <select id="rating-filter" onchange="handleRatingFilter()">
                <option value="">All Ratings</option>
                <option value="4.5">4.5+ Stars</option>
                <option value="4.0">4.0+ Stars</option>
                <option value="3.5">3.5+ Stars</option>
              </select>
              
              <button class="btn btn-secondary" onclick="clearAllFilters()">
                Clear Filters
              </button>
            </div>
          </div>
          
          <div id="services-results" class="services-grid">
            ${serviceProviders.map(service => createServiceCard(service)).join('')}
          </div>
          
          <div class="load-more-section">
            <button class="btn btn-outline" onclick="loadMoreServices()">
              Load More Services
            </button>
          </div>
        </div>
      </section>

      <!-- Affiliate Program Info -->
      <section class="affiliate-info">
        <div class="container">
          <div class="affiliate-content">
            <div class="affiliate-text">
              <h2>🤝 Partner with TenderCells</h2>
              <p>
                Are you a service provider? Join our network of trusted partners and reach more customers 
                in your area. We help connect animal owners with quality services while providing you 
                with additional revenue opportunities.
              </p>
              <div class="affiliate-benefits">
                <div class="benefit">
                  <span class="benefit-icon">📈</span>
                  <span>Increased Visibility</span>
                </div>
                <div class="benefit">
                  <span class="benefit-icon">💰</span>
                  <span>Commission Earnings</span>
                </div>
                <div class="benefit">
                  <span class="benefit-icon">👥</span>
                  <span>Quality Referrals</span>
                </div>
              </div>
              <div class="affiliate-actions">
                <button class="btn btn-primary" onclick="navigateTo('contact')">
                  Become a Partner
                </button>
                <button class="btn btn-secondary" onclick="learnMoreAboutAffiliate()">
                  Learn More
                </button>
              </div>
            </div>
            <div class="affiliate-image">
              <div class="affiliate-placeholder">
                <div class="placeholder-icon">🤝</div>
                <p>Partner Network Illustration</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Service Quality Guarantee -->
      <section class="quality-guarantee">
        <div class="container">
          <div class="guarantee-content">
            <h2>🛡️ Our Quality Guarantee</h2>
            <p>All service providers in our network are vetted for quality and reliability.</p>
            
            <div class="guarantee-features">
              <div class="guarantee-item">
                <div class="guarantee-icon">✅</div>
                <h3>Verified Providers</h3>
                <p>All partners are licensed and insured professionals</p>
              </div>
              <div class="guarantee-item">
                <div class="guarantee-icon">⭐</div>
                <h3>Rated & Reviewed</h3>
                <p>Real customer reviews and ratings for transparency</p>
              </div>
              <div class="guarantee-item">
                <div class="guarantee-icon">🔄</div>
                <h3>Satisfaction Guaranteed</h3>
                <p>We work to resolve any service issues</p>
              </div>
              <div class="guarantee-item">
                <div class="guarantee-icon">🏆</div>
                <h3>Premium Support</h3>
                <p>Direct access to top-rated service providers</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  `;
}

// Page Initialization
export function initializeServicesPage() {
  // Store services globally for card interactions
  window.currentServices = serviceProviders;
  
  // Set up event listeners
  setupServicePageEvents();
  
  // Track page view
  trackEvent('page_view', 'services', 'visited');
  
  console.log('Services page initialized with', serviceProviders.length, 'providers');
}

function setupServicePageEvents() {
  // Category filter event
  document.addEventListener('categoryFilter', function(e) {
    const categoryId = e.detail;
    const filteredServices = getServicesByCategory(categoryId);
    updateServicesDisplay(filteredServices);
  });
  
  // Search functionality
  let searchTimeout;
  window.handleServiceSearch = function() {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      performServiceSearch();
    }, 300);
  };
}

function updateServicesDisplay(services) {
  const resultsContainer = document.getElementById('services-results');
  if (resultsContainer) {
    resultsContainer.innerHTML = services.map(service => createServiceCard(service)).join('');
    window.currentServices = services;
  }
}

// Interactive Functions
window.performServiceSearch = function() {
  const query = document.getElementById('service-search')?.value || '';
  const category = document.getElementById('category-filter')?.value || null;
  
  const results = searchServices(query, category);
  updateServicesDisplay(results);
  
  trackEvent('service_search', 'text_search', query);
};

window.handleCategoryFilter = function() {
  const category = document.getElementById('category-filter')?.value || '';
  const query = document.getElementById('service-search')?.value || '';
  
  const results = searchServices(query, category || null);
  updateServicesDisplay(results);
  
  trackEvent('service_filter', 'category', category);
};

window.handleRatingFilter = function() {
  const minRating = parseFloat(document.getElementById('rating-filter')?.value || 0);
  const category = document.getElementById('category-filter')?.value || null;
  const query = document.getElementById('service-search')?.value || '';
  
  let results = searchServices(query, category);
  if (minRating > 0) {
    results = results.filter(service => service.rating >= minRating);
  }
  
  updateServicesDisplay(results);
  trackEvent('service_filter', 'rating', minRating.toString());
};

window.clearAllFilters = function() {
  document.getElementById('service-search').value = '';
  document.getElementById('category-filter').value = '';
  document.getElementById('rating-filter').value = '';
  
  updateServicesDisplay(serviceProviders);
  trackEvent('service_filter', 'clear', 'all');
};

window.loadMoreServices = function() {
  // TODO: Implement pagination for large service lists
  trackEvent('service_interaction', 'load_more', 'clicked');
};

// Initialize the services page functionality
export function initServicesPage() {
  // Initialize the enhanced search functionality
  serviceSearch.init('service-search-container');
  
  // Add event listeners for category filtering
  setupCategoryFilters();
  
  // Initialize map search functionality
  initializeMapSearch();
}

// Setup category filter functionality
function setupCategoryFilters() {
  document.addEventListener('click', (e) => {
    if (e.target.closest('.category-card')) {
      const categoryCard = e.target.closest('.category-card');
      const category = categoryCard.dataset.category;
      
      // Update search with selected category
      if (category) {
        const serviceTypeSelect = document.getElementById('service-type');
        if (serviceTypeSelect) {
          serviceTypeSelect.value = category;
          serviceSearch.updateFilters();
          serviceSearch.performSearch();
        }
      }
    }
  });
}

// Initialize map search functionality
function initializeMapSearch() {
  // This will be called after the page is rendered
  setTimeout(() => {
    const mapWidget = document.querySelector('.map-search-widget');
    if (mapWidget) {
      mapWidget.addEventListener('click', () => {
        // Focus on map search
        const mapSection = document.querySelector('.map-section');
        if (mapSection) {
          mapSection.scrollIntoView({ behavior: 'smooth' });
        }
      });
    }
  }, 1000);
}

window.learnMoreAboutAffiliate = function() {
  // Create a modal or navigate to affiliate info page
  alert('Affiliate program details: Earn 3-12% commission on referrals. Contact us for partnership opportunities.');
  trackEvent('affiliate_interest', 'learn_more', 'clicked');
};
