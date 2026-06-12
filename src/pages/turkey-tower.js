// Turkey Tower Product Page
export function createTurkeyTowerPage() {
  return `
    <div class="app-page">
      <section class="app-hero">
        <div class="container">
          <div class="app-hero-content">
            <div class="app-hero-text">
              <div class="app-status-badge coming-soon">Coming Soon</div>
              <h1>Turkey Tower</h1>
              <p class="app-tagline">Advanced turkey housing system with growth tracking and automated care</p>
              <p class="app-description">
                Comprehensive turkey management system featuring growth tracking, temperature control, 
                automated feeding, and health monitoring. Perfect for commercial turkey operations and homesteaders.
              </p>
              <div class="app-hero-buttons">
                <button class="btn btn-secondary btn-large">Notify Me When Available</button>
                <button class="btn btn-outline btn-large">Learn More</button>
              </div>
            </div>
            <div class="app-hero-image">
              <img src="https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop" alt="Turkey Tower">
            </div>
          </div>
        </div>
      </section>

      <section class="app-features">
        <div class="container">
          <h2>Key Features</h2>
          <div class="features-grid">
            <div class="feature-card">
              <div class="feature-icon">📈</div>
              <h3>Growth Tracking</h3>
              <p>Automated weight monitoring and growth analytics for optimal feed conversion.</p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">🌡️</div>
              <h3>Temperature Control</h3>
              <p>Precise temperature regulation for different growth stages and seasons.</p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">🍽️</div>
              <h3>Automated Feeding</h3>
              <p>Programmable feeding schedules with portion control and feed conversion tracking.</p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">🏥</div>
              <h3>Health Monitoring</h3>
              <p>AI-powered health analytics with disease detection and behavior pattern analysis.</p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">💧</div>
              <h3>Water Management</h3>
              <p>Automated water level monitoring and quality control systems.</p>
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
                  <dd>Customizable housing sizes</dd>
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
                  <dd>Up to 30 turkeys</dd>
                </div>
                <div class="spec-item">
                  <dt>Installation</dt>
                  <dd>3-5 hours</dd>
                </div>
                <div class="spec-item">
                  <dt>Warranty</dt>
                  <dd>2 years full coverage</dd>
                </div>
                <div class="spec-item">
                  <dt>Sensors</dt>
                  <dd>Temperature, Humidity, Weight, Motion</dd>
                </div>
                <div class="spec-item">
                  <dt>Special Features</dt>
                  <dd>Growth tracking, Feed conversion analytics</dd>
                </div>
              </div>
            </div>
            <div class="specs-image">
              <img src="https://images.pexels.com/photos/2889440/pexels-photo-2889440.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&fit=crop" alt="Turkey Tower Components">
            </div>
          </div>
        </div>
      </section>

      <!-- Pricing Section -->
      <section class="app-pricing">
        <div class="container">
          <div class="pricing-card featured">
            <div class="pricing-header">
              <h3>Turkey Tower</h3>
              <div class="price">
                <span class="price-current">Coming Soon</span>
              </div>
              <p class="price-note">Pre-order available soon</p>
            </div>
            <div class="pricing-features">
              <ul>
                <li>✅ Complete smart housing system</li>
                <li>✅ Growth tracking & analytics</li>
                <li>✅ Automated feeding & watering</li>
                <li>✅ Mobile apps (iOS/Android/Web)</li>
                <li>✅ 2-year warranty</li>
                <li>✅ 24/7 support</li>
                <li>✅ Free software updates</li>
                <li>✅ Open source platform</li>
              </ul>
            </div>
            <button class="btn btn-secondary btn-large">
              Notify Me When Available
            </button>
          </div>
        </div>
      </section>
    </div>
  `;
}

export function initializeTurkeyTowerPage() {
  console.log('Turkey Tower page initialized');
}

