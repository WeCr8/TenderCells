// Pigeon Palace Product Page
export function createPigeonPalacePage() {
  return `
    <div class="app-page">
      <section class="app-hero">
        <div class="container">
          <div class="app-hero-content">
            <div class="app-hero-text">
              <div class="app-status-badge coming-soon">Coming Soon</div>
              <h1>Pigeon Palace</h1>
              <p class="app-tagline">Specialized smart housing for pigeons with flight tracking and breeding management</p>
              <p class="app-description">
                Advanced pigeon loft management system featuring flight tracking, breeding cycle management, 
                health monitoring, and automated care. Perfect for racing pigeons, show pigeons, and breeding operations.
              </p>
              <div class="app-hero-buttons">
                <button class="btn btn-secondary btn-large">Notify Me When Available</button>
                <button class="btn btn-outline btn-large">Learn More</button>
              </div>
            </div>
            <div class="app-hero-image">
              <img src="https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop" alt="Pigeon Palace">
            </div>
          </div>
        </div>
      </section>

      <section class="app-features">
        <div class="container">
          <h2>Key Features</h2>
          <div class="features-grid">
            <div class="feature-card">
              <div class="feature-icon">✈️</div>
              <h3>Flight Tracking</h3>
              <p>GPS-enabled flight tracking for racing pigeons with route analysis and performance metrics.</p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">🥚</div>
              <h3>Breeding Management</h3>
              <p>Comprehensive breeding cycle tracking, egg incubation monitoring, and hatchling care protocols.</p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">🏠</div>
              <h3>Loft Management</h3>
              <p>Climate-controlled loft environment with automated ventilation and temperature regulation.</p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">🍽️</div>
              <h3>Smart Feeding</h3>
              <p>Automated feeding schedules with nutrition tracking and feed level monitoring.</p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">📊</div>
              <h3>Health Analytics</h3>
              <p>AI-powered health monitoring with disease detection and behavior pattern analysis.</p>
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
                  <dd>Customizable loft sizes</dd>
                </div>
                <div class="spec-item">
                  <dt>Power</dt>
                  <dd>12V DC, Solar Compatible</dd>
                </div>
                <div class="spec-item">
                  <dt>Connectivity</dt>
                  <dd>WiFi, Bluetooth, GPS</dd>
                </div>
                <div class="spec-item">
                  <dt>Capacity</dt>
                  <dd>Up to 50 pigeons</dd>
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
                  <dd>Temperature, Humidity, GPS, Motion</dd>
                </div>
                <div class="spec-item">
                  <dt>Special Features</dt>
                  <dd>Flight tracking, Breeding management</dd>
                </div>
              </div>
            </div>
            <div class="specs-image">
              <img src="https://images.pexels.com/photos/2889440/pexels-photo-2889440.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&fit=crop" alt="Pigeon Palace Components">
            </div>
          </div>
        </div>
      </section>

      <!-- Pricing Section -->
      <section class="app-pricing">
        <div class="container">
          <div class="pricing-card featured">
            <div class="pricing-header">
              <h3>Pigeon Palace</h3>
              <div class="price">
                <span class="price-current">Coming Soon</span>
              </div>
              <p class="price-note">Pre-order available soon</p>
            </div>
            <div class="pricing-features">
              <ul>
                <li>✅ Complete smart loft system</li>
                <li>✅ GPS flight tracking</li>
                <li>✅ Breeding cycle management</li>
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

export function initializePigeonPalacePage() {
  console.log('Pigeon Palace page initialized');
}

