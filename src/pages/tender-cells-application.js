// Tender Cells Application Page - Unified UI Showcase
import { trackEngagement } from '../utils/analytics.js';

export function createTenderCellsApplicationPage() {
  return `
    <div class="tender-cells-app-page">
      <!-- Hero Section -->
      <section class="tca-hero">
        <div class="container">
          <div class="tca-hero-content">
            <div class="tca-hero-text">
              <span class="tca-badge">Unified Interface</span>
              <h1>Your Digital Farm at Your Fingertips</h1>
              <p class="tca-tagline">
                Experience farming like never before with Tender Cells Application - 
                a unified interface that brings all your farm products together in one 
                beautiful, intuitive digital experience. Think "Farmville" in real life.
              </p>
              <p class="tca-description">
                One application. All your animals. Complete control. The Tender Cells Application 
                is your command center for managing every aspect of your smart farm, from chickens 
                to cattle, pigs to goats, and everything in between.
              </p>
              <div class="tca-hero-buttons">
                <a href="#store" class="btn btn-primary btn-large">Get Started Free</a>
                <button class="btn btn-secondary btn-large" id="watchDemoBtn">
                  <span class="play-icon">▶</span> Watch Demo
                </button>
              </div>
            </div>
            <div class="tca-hero-visual">
              <div class="tca-mockup">
                <div class="mockup-screen">
                  <div class="mockup-header">
                    <span>🏠 My Farm</span>
                    <span>🔔 3</span>
                  </div>
                  <div class="mockup-farm-view">
                    <div class="farm-layout-preview">
                      <div class="farm-item coop">🐔</div>
                      <div class="farm-item pasture">🐄</div>
                      <div class="farm-item pen">🐷</div>
                      <div class="farm-item field">🐐</div>
                      <div class="farm-item pond">🦆</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- What is Tender Cells UI Section -->
      <section class="tca-what-is">
        <div class="container">
          <div class="section-header">
            <h2>What is Tender Cells Application?</h2>
            <p>The unified interface that connects all your Tender Cells products into one seamless experience</p>
          </div>
          
          <div class="tca-explanation">
            <div class="explanation-content">
              <p>
                Tender Cells Application is a comprehensive digital farming platform that provides 
                a single, unified interface for managing all your Tender Cells smart farming products. 
                Whether you're running a small homestead with chickens or a large operation with 
                multiple animal types, this application adapts to your needs.
              </p>
              <p>
                Just like how Farmville lets you manage your virtual farm with a visual layout, 
                Tender Cells Application gives you a real-time view of your actual farm with 
                interactive layouts, animal tracking, and intelligent monitoring - all in one place.
              </p>
            </div>
            <div class="explanation-visual">
              <div class="unified-diagram">
                <div class="diagram-center">Tender Cells Application</div>
                <div class="diagram-products">
                  <div class="diagram-item">🐔 Chicken Tender</div>
                  <div class="diagram-item">🐄 Cattle Care</div>
                  <div class="diagram-item">🐷 Pig Pal</div>
                  <div class="diagram-item">🐐 Goat Guardian</div>
                  <div class="diagram-item">🦆 Duck Dock</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Digital Farming Experience Section -->
      <section class="tca-digital-experience">
        <div class="container">
          <div class="section-header">
            <h2>Experience Digital Farming Like Never Before</h2>
            <p>Visual layouts, real-time monitoring, and interactive management - all in one beautiful interface</p>
          </div>

          <div class="experience-features">
            <div class="exp-feature">
              <div class="exp-icon">🗺️</div>
              <h3>Visual Farm Layout</h3>
              <p>
                See your entire farm at a glance with an interactive layout view. Drag and drop 
                to customize your property layout, see where all your animals are located, and 
                monitor each area in real-time.
              </p>
              <div class="screenshot-placeholder" data-screenshot="layout">
                <div class="placeholder-content">
                  <span class="placeholder-icon">📸</span>
                  <p>Farm Layout Screenshot</p>
                  <small>Interactive property layout showing all structures and animals</small>
                </div>
              </div>
            </div>

            <div class="exp-feature">
              <div class="exp-icon">🐾</div>
              <h3>Animal Management & Tracking</h3>
              <p>
                Track every animal on your farm with detailed profiles, health records, and 
                activity monitoring. See which animals need attention, track growth, and 
                manage breeding cycles - all from one interface.
              </p>
              <div class="screenshot-placeholder" data-screenshot="animals">
                <div class="placeholder-content">
                  <span class="placeholder-icon">📸</span>
                  <p>Animal Management Screenshot</p>
                  <small>Animal tracking interface with health status and profiles</small>
                </div>
              </div>
            </div>

            <div class="exp-feature">
              <div class="exp-icon">📊</div>
              <h3>Real-Time Monitoring Dashboards</h3>
              <p>
                Get instant insights into your farm's health with customizable dashboards. 
                Monitor temperature, humidity, feeding schedules, water levels, and more 
                across all your products simultaneously.
              </p>
              <div class="screenshot-placeholder" data-screenshot="dashboard">
                <div class="placeholder-content">
                  <span class="placeholder-icon">📸</span>
                  <p>Dashboard Overview Screenshot</p>
                  <small>Real-time monitoring dashboard with all farm metrics</small>
                </div>
              </div>
            </div>

            <div class="exp-feature">
              <div class="exp-icon">🏡</div>
              <h3>Interactive Property Management</h3>
              <p>
                Manage multiple properties from one account. Switch between locations, 
                compare performance, and get unified insights across all your farming operations.
              </p>
              <div class="screenshot-placeholder" data-screenshot="property">
                <div class="placeholder-content">
                  <span class="placeholder-icon">📸</span>
                  <p>Property Management Screenshot</p>
                  <small>Multi-property view with location switching</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Product Integration Section -->
      <section class="tca-product-integration">
        <div class="container">
          <div class="section-header">
            <h2>One App, All Your Products</h2>
            <p>The interface adapts seamlessly to work with every Tender Cells product</p>
          </div>

          <div class="product-cards">
            <div class="product-card">
              <div class="product-emoji">🐔</div>
              <h3>Chicken Tender</h3>
              <p>Monitor your coop's climate, feeding schedules, egg production, and flock health all from the unified dashboard.</p>
              <div class="product-features">
                <span class="feature-tag">Climate Control</span>
                <span class="feature-tag">Feeding Automation</span>
                <span class="feature-tag">Egg Tracking</span>
              </div>
            </div>

            <div class="product-card">
              <div class="product-emoji">🐄</div>
              <h3>Cattle Care</h3>
              <p>Track your herd's location, health metrics, grazing patterns, and breeding cycles with GPS-enabled monitoring.</p>
              <div class="product-features">
                <span class="feature-tag">GPS Tracking</span>
                <span class="feature-tag">Herd Management</span>
                <span class="feature-tag">Health Monitoring</span>
              </div>
            </div>

            <div class="product-card">
              <div class="product-emoji">🐷</div>
              <h3>Pig Pal</h3>
              <p>Manage pig health, weight tracking, automated feeding, and growth analytics through the unified interface.</p>
              <div class="product-features">
                <span class="feature-tag">Weight Tracking</span>
                <span class="feature-tag">Growth Analytics</span>
                <span class="feature-tag">Automated Feeding</span>
              </div>
            </div>

            <div class="product-card">
              <div class="product-emoji">🐐</div>
              <h3>Goat Guardian</h3>
              <p>Optimize pasture rotation, track milk production, monitor herd health, and manage breeding schedules.</p>
              <div class="product-features">
                <span class="feature-tag">Pasture Management</span>
                <span class="feature-tag">Milk Tracking</span>
                <span class="feature-tag">Breeding Cycles</span>
              </div>
            </div>

            <div class="product-card">
              <div class="product-emoji">🦆</div>
              <h3>Duck Dock</h3>
              <p>Monitor pond water quality, track waterfowl health, optimize feeding schedules, and track egg collection.</p>
              <div class="product-features">
                <span class="feature-tag">Water Quality</span>
                <span class="feature-tag">Pond Monitoring</span>
                <span class="feature-tag">Egg Collection</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Screenshot Gallery Section -->
      <section class="tca-screenshots">
        <div class="container">
          <div class="section-header">
            <h2>See It In Action</h2>
            <p>Explore the Tender Cells Application interface</p>
          </div>

          <div class="screenshot-gallery">
            <div class="gallery-item">
              <div class="screenshot-placeholder large" data-screenshot="dashboard-overview">
                <div class="placeholder-content">
                  <span class="placeholder-icon">📸</span>
                  <p>Dashboard Overview</p>
                  <small>Main dashboard showing all farm metrics and status</small>
                </div>
              </div>
              <h4>Unified Dashboard</h4>
              <p>See all your farm data in one place with customizable widgets and real-time updates.</p>
            </div>

            <div class="gallery-item">
              <div class="screenshot-placeholder large" data-screenshot="animal-management">
                <div class="placeholder-content">
                  <span class="placeholder-icon">📸</span>
                  <p>Animal Management</p>
                  <small>Detailed animal profiles with health tracking and records</small>
                </div>
              </div>
              <h4>Animal Management</h4>
              <p>Track individual animals, view health records, and manage your entire livestock from one interface.</p>
            </div>

            <div class="gallery-item">
              <div class="screenshot-placeholder large" data-screenshot="property-layout">
                <div class="placeholder-content">
                  <span class="placeholder-icon">📸</span>
                  <p>Property Layout</p>
                  <small>Interactive farm layout with drag-and-drop customization</small>
                </div>
              </div>
              <h4>Property Layout</h4>
              <p>Visualize your farm layout, customize structures, and see where everything is located.</p>
            </div>

            <div class="gallery-item">
              <div class="screenshot-placeholder large" data-screenshot="product-dashboard">
                <div class="placeholder-content">
                  <span class="placeholder-icon">📸</span>
                  <p>Product Dashboard</p>
                  <small>Product-specific dashboard (e.g., Chicken Tender interface)</small>
                </div>
              </div>
              <h4>Product Dashboards</h4>
              <p>Each product has its own specialized dashboard that adapts to show relevant metrics and controls.</p>
            </div>

            <div class="gallery-item">
              <div class="screenshot-placeholder large" data-screenshot="mobile-app">
                <div class="placeholder-content">
                  <span class="placeholder-icon">📸</span>
                  <p>Mobile App</p>
                  <small>Mobile app interface for iOS and Android</small>
                </div>
              </div>
              <h4>Mobile Experience</h4>
              <p>Full-featured mobile apps for iOS and Android let you manage your farm from anywhere.</p>
            </div>

            <div class="gallery-item">
              <div class="screenshot-placeholder large" data-screenshot="analytics">
                <div class="placeholder-content">
                  <span class="placeholder-icon">📸</span>
                  <p>Analytics & Reports</p>
                  <small>Advanced analytics with charts and insights</small>
                </div>
              </div>
              <h4>Analytics & Insights</h4>
              <p>Deep dive into your farm's performance with AI-powered insights and detailed reports.</p>
            </div>
          </div>
        </div>
      </section>

      <!-- Key Features Section -->
      <section class="tca-key-features">
        <div class="container">
          <div class="section-header">
            <h2>Key Features</h2>
            <p>Everything you need to manage your smart farm</p>
          </div>

          <div class="features-grid">
            <div class="feature-item">
              <div class="feature-icon">🔗</div>
              <h3>Unified Interface</h3>
              <p>One application manages all your Tender Cells products. No need to switch between different apps.</p>
            </div>

            <div class="feature-item">
              <div class="feature-icon">⚡</div>
              <h3>Real-Time Sync</h3>
              <p>All data synchronizes in real-time across all your devices using Firebase. Changes update instantly.</p>
            </div>

            <div class="feature-item">
              <div class="feature-icon">🏡</div>
              <h3>Multi-Property</h3>
              <p>Manage multiple farms or properties from one account. Switch between locations seamlessly.</p>
            </div>

            <div class="feature-item">
              <div class="feature-icon">🐾</div>
              <h3>Animal Tracking</h3>
              <p>Track every animal with detailed profiles, health records, and activity monitoring.</p>
            </div>

            <div class="feature-item">
              <div class="feature-icon">🗺️</div>
              <h3>Layout Customization</h3>
              <p>Customize your farm layout visually. Drag and drop to organize structures and areas.</p>
            </div>

            <div class="feature-item">
              <div class="feature-icon">📱</div>
              <h3>Cross-Platform</h3>
              <p>Access from web, iOS, or Android. Your data syncs across all platforms automatically.</p>
            </div>

            <div class="feature-item">
              <div class="feature-icon">🤖</div>
              <h3>AI-Powered Insights</h3>
              <p>Get intelligent recommendations and alerts powered by Google AI and Genkit.</p>
            </div>

            <div class="feature-item">
              <div class="feature-icon">🔔</div>
              <h3>Smart Notifications</h3>
              <p>Receive alerts for important events, health issues, and maintenance needs across all products.</p>
            </div>
          </div>
        </div>
      </section>

      <!-- How It Works Section -->
      <section class="tca-how-it-works">
        <div class="container">
          <div class="section-header">
            <h2>How It Works</h2>
            <p>Get started with Tender Cells Application in minutes</p>
          </div>

          <div class="steps-timeline">
            <div class="step-item">
              <div class="step-number">1</div>
              <div class="step-content">
                <h3>Create Your Account</h3>
                <p>Sign up for free and create your Tender Cells account. No credit card required.</p>
              </div>
            </div>

            <div class="step-item">
              <div class="step-number">2</div>
              <div class="step-content">
                <h3>Add Your Properties</h3>
                <p>Set up your farm locations and customize your property layout using our visual editor.</p>
              </div>
            </div>

            <div class="step-item">
              <div class="step-number">3</div>
              <div class="step-content">
                <h3>Register Your Products</h3>
                <p>Connect your Tender Cells products (Chicken Tender, Cattle Care, etc.) to your account.</p>
              </div>
            </div>

            <div class="step-item">
              <div class="step-number">4</div>
              <div class="step-content">
                <h3>Add Your Animals</h3>
                <p>Register your animals and start tracking their health, activity, and productivity.</p>
              </div>
            </div>

            <div class="step-item">
              <div class="step-number">5</div>
              <div class="step-content">
                <h3>Start Monitoring</h3>
                <p>Begin monitoring your farm in real-time. Set up alerts, customize dashboards, and let AI help optimize your operations.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- CTA Section -->
      <section class="tca-cta">
        <div class="container">
          <div class="cta-content">
            <h2>Ready to Experience Digital Farming?</h2>
            <p>Join thousands of farmers who are already using Tender Cells Application to manage their smart farms.</p>
            <div class="cta-buttons">
              <a href="#store" class="btn btn-primary btn-large">Get Started Free</a>
              <a href="#contact" class="btn btn-outline btn-large">Schedule a Demo</a>
            </div>
            <div class="cta-features">
              <div class="cta-feature">
                <span class="check-icon">✓</span>
                <span>Free to start</span>
              </div>
              <div class="cta-feature">
                <span class="check-icon">✓</span>
                <span>No credit card required</span>
              </div>
              <div class="cta-feature">
                <span class="check-icon">✓</span>
                <span>Works with all Tender Cells products</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  `;
}

export function initializeTenderCellsApplicationPage() {
  // Track page view
  if (typeof trackEngagement === 'function') {
    trackEngagement('tender_cells_application_page_view');
  }

  // Screenshot gallery lightbox functionality
  const screenshotPlaceholders = document.querySelectorAll('.screenshot-placeholder');
  screenshotPlaceholders.forEach(placeholder => {
    placeholder.addEventListener('click', function() {
      const screenshotType = this.getAttribute('data-screenshot');
      // Open lightbox or modal for screenshot
      // This is a placeholder - can be enhanced with actual lightbox library
      console.log('Screenshot clicked:', screenshotType);
    });
  });

  // Watch demo button
  const watchDemoBtn = document.getElementById('watchDemoBtn');
  if (watchDemoBtn) {
    watchDemoBtn.addEventListener('click', function() {
      // Open video modal or navigate to demo
      console.log('Watch demo clicked');
      if (typeof trackEngagement === 'function') {
        trackEngagement('watch_demo_clicked');
      }
    });
  }

  // Smooth scrolling for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const href = this.getAttribute('href');
      if (href !== '#' && href.startsWith('#')) {
        e.preventDefault();
        const target = document.querySelector(href);
        if (target) {
          target.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        }
      }
    });
  });

  console.log('Tender Cells Application page initialized');
}

