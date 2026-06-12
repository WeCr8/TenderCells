// All Products Page - Complete product catalog
import { trackEngagement } from '../utils/analytics.js';

export function createAllProductsPage() {
  return `
    <div class="all-products-page">
      <!-- Hero Section -->
      <section class="products-hero">
        <div class="container">
          <div class="products-hero-content">
            <span class="products-badge">Complete Catalog</span>
            <h1>All Tender Cells Products</h1>
            <p class="products-tagline">
              Discover our complete range of smart farming solutions. From chicken coops to cattle management, 
              we have intelligent systems for every type of animal and farming operation.
            </p>
          </div>
        </div>
      </section>

      <!-- Products Grid -->
      <section class="products-grid-section">
        <div class="container">
          <div class="products-categories">
            <!-- Smart Coops Category -->
            <div class="product-category">
              <h2 class="category-title">Smart Coops & Housing</h2>
              <div class="products-grid">
                <div class="product-card">
                  <div class="product-emoji">🐔</div>
                  <h3>Chicken Tender</h3>
                  <p class="product-status beta">Build/Beta Testing</p>
                  <p class="product-description">Intelligent chicken coop management with climate control, automated feeding, and AI-powered health analytics.</p>
                  <div class="product-features">
                    <span class="feature-tag">Climate Control</span>
                    <span class="feature-tag">Smart Feeding</span>
                    <span class="feature-tag">Health Analytics</span>
                  </div>
                  <a href="#chicken-tender" class="btn btn-primary">Learn More</a>
                </div>

                <div class="product-card">
                  <div class="product-emoji">🕊️</div>
                  <h3>Pigeon Palace</h3>
                  <p class="product-status coming-soon">Coming Soon</p>
                  <p class="product-description">Specialized smart housing for pigeons with flight tracking, breeding management, and health monitoring.</p>
                  <div class="product-features">
                    <span class="feature-tag">Flight Tracking</span>
                    <span class="feature-tag">Breeding Management</span>
                    <span class="feature-tag">Health Monitoring</span>
                  </div>
                  <a href="#pigeon-palace" class="btn btn-secondary">Learn More</a>
                </div>

                <div class="product-card">
                  <div class="product-emoji">🦃</div>
                  <h3>Turkey Tower</h3>
                  <p class="product-status coming-soon">Coming Soon</p>
                  <p class="product-description">Advanced turkey housing system with growth tracking, temperature control, and automated care systems.</p>
                  <div class="product-features">
                    <span class="feature-tag">Growth Tracking</span>
                    <span class="feature-tag">Temperature Control</span>
                    <span class="feature-tag">Automated Care</span>
                  </div>
                  <a href="#turkey-tower" class="btn btn-secondary">Learn More</a>
                </div>

                <div class="product-card">
                  <div class="product-emoji">🐰</div>
                  <h3>Bunny Burrow</h3>
                  <p class="product-status coming-soon">Coming Soon</p>
                  <p class="product-description">Smart rabbit housing with burrow monitoring, breeding cycle management, and health tracking.</p>
                  <div class="product-features">
                    <span class="feature-tag">Burrow Monitoring</span>
                    <span class="feature-tag">Breeding Cycles</span>
                    <span class="feature-tag">Health Tracking</span>
                  </div>
                  <a href="#bunny-burrow" class="btn btn-secondary">Learn More</a>
                </div>

                <div class="product-card">
                  <div class="product-emoji">🐓</div>
                  <h3>Roaming Roost</h3>
                  <p class="product-status coming-soon">Coming Soon</p>
                  <p class="product-description">Mobile chicken coop system with GPS tracking, automated movement, and pasture management.</p>
                  <div class="product-features">
                    <span class="feature-tag">GPS Tracking</span>
                    <span class="feature-tag">Mobile Coop</span>
                    <span class="feature-tag">Pasture Management</span>
                  </div>
                  <a href="#roaming-roost" class="btn btn-secondary">Learn More</a>
                </div>
              </div>
            </div>

            <!-- Large Animal Management Category -->
            <div class="product-category">
              <h2 class="category-title">Large Animal Management</h2>
              <div class="products-grid">
                <div class="product-card">
                  <div class="product-emoji">🐄</div>
                  <h3>Cattle Care</h3>
                  <p class="product-status coming-soon">Coming Soon</p>
                  <p class="product-description">Comprehensive cattle management with GPS tracking, herd health monitoring, and grazing optimization.</p>
                  <div class="product-features">
                    <span class="feature-tag">GPS Tracking</span>
                    <span class="feature-tag">Herd Management</span>
                    <span class="feature-tag">Health Monitoring</span>
                  </div>
                  <a href="#cattle-care" class="btn btn-secondary">Learn More</a>
                </div>

                <div class="product-card">
                  <div class="product-emoji">🐐</div>
                  <h3>Goat Guardian</h3>
                  <p class="product-status coming-soon">Coming Soon</p>
                  <p class="product-description">Intelligent goat herd management with pasture rotation, milk production tracking, and health monitoring.</p>
                  <div class="product-features">
                    <span class="feature-tag">Pasture Management</span>
                    <span class="feature-tag">Milk Tracking</span>
                    <span class="feature-tag">Breeding Cycles</span>
                  </div>
                  <a href="#goat-guardian" class="btn btn-secondary">Learn More</a>
                </div>

                <div class="product-card">
                  <div class="product-emoji">🐷</div>
                  <h3>Pig Pal</h3>
                  <p class="product-status coming-soon">Coming Soon</p>
                  <p class="product-description">Smart pig farming with weight tracking, automated feeding, and growth analytics.</p>
                  <div class="product-features">
                    <span class="feature-tag">Weight Tracking</span>
                    <span class="feature-tag">Growth Analytics</span>
                    <span class="feature-tag">Automated Feeding</span>
                  </div>
                  <a href="#pig-pal" class="btn btn-secondary">Learn More</a>
                </div>
              </div>
            </div>

            <!-- Waterfowl Management Category -->
            <div class="product-category">
              <h2 class="category-title">Waterfowl Management</h2>
              <div class="products-grid">
                <div class="product-card">
                  <div class="product-emoji">🦆</div>
                  <h3>Duck Dock</h3>
                  <p class="product-status coming-soon">Coming Soon</p>
                  <p class="product-description">Comprehensive waterfowl management with pond monitoring, feeding optimization, and egg collection tracking.</p>
                  <div class="product-features">
                    <span class="feature-tag">Pond Monitoring</span>
                    <span class="feature-tag">Water Quality</span>
                    <span class="feature-tag">Egg Collection</span>
                  </div>
                  <a href="#duck-dock" class="btn btn-secondary">Learn More</a>
                </div>
              </div>
            </div>

            <!-- Monitoring & Security Category -->
            <div class="product-category">
              <h2 class="category-title">Monitoring & Security</h2>
              <div class="products-grid">
                <div class="product-card">
                  <div class="product-emoji">🦅</div>
                  <h3>Predator Monitoring</h3>
                  <p class="product-status in-development">In Development</p>
                  <p class="product-description">Advanced predator detection and alert system using AI-powered cameras and motion sensors.</p>
                  <div class="product-features">
                    <span class="feature-tag">AI Detection</span>
                    <span class="feature-tag">Motion Sensors</span>
                    <span class="feature-tag">Real-time Alerts</span>
                  </div>
                  <a href="#predator-monitoring" class="btn btn-secondary">Learn More</a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- CTA Section -->
      <section class="products-cta">
        <div class="container">
          <div class="cta-content">
            <h2>Ready to Get Started?</h2>
            <p>Browse our complete product catalog and find the perfect smart farming solution for your needs.</p>
            <div class="cta-buttons">
              <a href="#store" class="btn btn-primary btn-large">Shop Now</a>
              <a href="#contact" class="btn btn-outline btn-large">Contact Sales</a>
            </div>
          </div>
        </div>
      </section>
    </div>
  `;
}

export function initializeAllProductsPage() {
  if (typeof trackEngagement === 'function') {
    trackEngagement('all_products_page_view');
  }

  // Product links are handled by the global click handler in main.js
  // But we can add specific handlers here if needed
  // The event delegation in main.js should catch all links

  console.log('All Products page initialized');
}

