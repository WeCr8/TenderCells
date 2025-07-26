// Chicken Tender Application Page
export function createChickenTenderPage() {
  return `
    <div class="app-page">
      <!-- Hero Section -->
      <section class="app-hero">
        <div class="container">
          <div class="app-hero-content">
            <div class="app-hero-text">
              <div class="app-status-badge beta">Build/Beta Testing</div>
              <h1>Chicken Tender</h1>
              <p class="app-tagline">Intelligent chicken coop management for modern homesteaders</p>
              <p class="app-description">
                Our flagship smart coop system featuring advanced climate control, automated feeding, 
                AI-powered health analytics, and real-time monitoring. Perfect for backyard coops, 
                research facilities, and homesteads of all sizes.
              </p>
              <div class="app-hero-buttons">
                <button class="btn btn-primary btn-large" onclick="navigateTo('store')">
                  Order Now - $2,999
                </button>
                <button class="btn btn-secondary btn-large">
                  Watch Demo
                </button>
              </div>
            </div>
            <div class="app-hero-image">
              <img src="https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop" alt="Chicken Tender Smart Coop">
            </div>
          </div>
        </div>
      </section>

      <!-- Features Section -->
      <section class="app-features">
        <div class="container">
          <h2>Advanced Features</h2>
          <div class="features-grid">
            <div class="feature-card">
              <div class="feature-icon">🌡️</div>
              <h3>Climate Control</h3>
              <p>Automated temperature and humidity monitoring with intelligent ventilation control to keep your chickens comfortable year-round.</p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">🍽️</div>
              <h3>Smart Feeding</h3>
              <p>Programmable feeding schedules with portion control and feed level monitoring to ensure optimal nutrition.</p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">📊</div>
              <h3>Health Analytics</h3>
              <p>AI-powered health insights with behavior pattern analysis and early disease detection capabilities.</p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">🔔</div>
              <h3>Smart Alerts</h3>
              <p>Real-time notifications for temperature changes, feeding schedules, health concerns, and maintenance reminders.</p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">🥚</div>
              <h3>Egg Production</h3>
              <p>Track daily egg production with quality assessment and collection scheduling for maximum yield.</p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">📱</div>
              <h3>Cross-Platform</h3>
              <p>Native iOS and Android apps plus responsive web interface for monitoring from anywhere.</p>
            </div>
          </div>
        </div>
      </section>

      <!-- Specifications Section -->
      <section class="app-specs">
        <div class="container">
          <div class="specs-content">
            <div class="specs-text">
              <h2>Technical Specifications</h2>
              <div class="specs-grid">
                <div class="spec-item">
                  <dt>Dimensions</dt>
                  <dd>48" x 36" x 24"</dd>
                </div>
                <div class="spec-item">
                  <dt>Weight</dt>
                  <dd>85 lbs</dd>
                </div>
                <div class="spec-item">
                  <dt>Power</dt>
                  <dd>12V DC, Solar Compatible</dd>
                </div>
                <div class="spec-item">
                  <dt>Connectivity</dt>
                  <dd>WiFi, Bluetooth</dd>
                </div>
                <div class="spec-item">
                  <dt>Capacity</dt>
                  <dd>Up to 12 chickens</dd>
                </div>
                <div class="spec-item">
                  <dt>Installation</dt>
                  <dd>2-4 hours</dd>
                </div>
                <div class="spec-item">
                  <dt>Warranty</dt>
                  <dd>2 years full coverage</dd>
                </div>
                <div class="spec-item">
                  <dt>Sensors</dt>
                  <dd>Temperature, Humidity, Motion, Weight</dd>
                </div>
              </div>
            </div>
            <div class="specs-image">
              <img src="https://images.pexels.com/photos/2889440/pexels-photo-2889440.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&fit=crop" alt="Chicken Tender Components">
            </div>
          </div>
        </div>
      </section>

      <!-- Pricing Section -->
      <section class="app-pricing">
        <div class="container">
          <div class="pricing-card featured">
            <div class="pricing-header">
              <h3>Chicken Tender v1.0.0</h3>
              <div class="price">
                <span class="price-original">$3,499</span>
                <span class="price-current">$2,999</span>
              </div>
              <p class="price-note">Free shipping worldwide</p>
            </div>
            <div class="pricing-features">
              <ul>
                <li>✅ Complete smart coop system</li>
                <li>✅ 95% pre-assembled</li>
                <li>✅ All sensors included</li>
                <li>✅ Mobile apps (iOS/Android/Web)</li>
                <li>✅ 2-year warranty</li>
                <li>✅ 24/7 support</li>
                <li>✅ Free software updates</li>
                <li>✅ Open source platform</li>
              </ul>
            </div>
            <button class="btn btn-primary btn-large" onclick="navigateTo('store')">
              Order Now
            </button>
          </div>
        </div>
      </section>
    </div>
  `;
}

export function initializeChickenTenderPage() {
  // Add any page-specific functionality here
  console.log('Chicken Tender page initialized');
}