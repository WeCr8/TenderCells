// Roaming Roost Product Page
export function createRoamingRoostPage() {
  return `
    <div class="app-page">
      <section class="app-hero">
        <div class="container">
          <div class="app-hero-content">
            <div class="app-hero-text">
              <div class="app-status-badge coming-soon">Coming Soon</div>
              <h1>Roaming Roost</h1>
              <p class="app-tagline">Mobile chicken coop system with GPS tracking and pasture management</p>
              <p class="app-description">
                Revolutionary mobile chicken coop system that moves automatically across your pasture, 
                providing fresh grazing areas while maintaining all smart coop features. Perfect for 
                free-range operations and rotational grazing.
              </p>
              <div class="app-hero-buttons">
                <button class="btn btn-secondary btn-large">Notify Me When Available</button>
                <button class="btn btn-outline btn-large">Learn More</button>
              </div>
            </div>
            <div class="app-hero-image">
              <img src="https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop" alt="Roaming Roost">
            </div>
          </div>
        </div>
      </section>

      <section class="app-features">
        <div class="container">
          <h2>Key Features</h2>
          <div class="features-grid">
            <div class="feature-card">
              <div class="feature-icon">📍</div>
              <h3>GPS Tracking</h3>
              <p>Real-time GPS tracking of coop location with movement history and pasture mapping.</p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">🚜</div>
              <h3>Automated Movement</h3>
              <p>Programmable movement schedules for optimal pasture rotation and grazing management.</p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">🌱</div>
              <h3>Pasture Management</h3>
              <p>Grazing area optimization with soil health monitoring and rotation recommendations.</p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">🌡️</div>
              <h3>Climate Control</h3>
              <p>Full climate control system that works in any location with solar power options.</p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">🍽️</div>
              <h3>Smart Feeding</h3>
              <p>Automated feeding systems that operate independently during movement.</p>
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
                  <dd>Mobile coop, various sizes</dd>
                </div>
                <div class="spec-item">
                  <dt>Power</dt>
                  <dd>Solar Powered, Battery Backup</dd>
                </div>
                <div class="spec-item">
                  <dt>Connectivity</dt>
                  <dd>WiFi, Bluetooth, GPS, Cellular</dd>
                </div>
                <div class="spec-item">
                  <dt>Capacity</dt>
                  <dd>Up to 15 chickens</dd>
                </div>
                <div class="spec-item">
                  <dt>Installation</dt>
                  <dd>4-6 hours</dd>
                </div>
                <div class="spec-item">
                  <dt>Warranty</dt>
                  <dd>2 years full coverage</dd>
                </div>
                <div class="spec-item">
                  <dt>Sensors</dt>
                  <dd>GPS, Temperature, Humidity, Motion, Soil</dd>
                </div>
                <div class="spec-item">
                  <dt>Special Features</dt>
                  <dd>Automated movement, Pasture mapping</dd>
                </div>
              </div>
            </div>
            <div class="specs-image">
              <img src="https://images.pexels.com/photos/2889440/pexels-photo-2889440.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&fit=crop" alt="Roaming Roost Components">
            </div>
          </div>
        </div>
      </section>

      <!-- Pricing Section -->
      <section class="app-pricing">
        <div class="container">
          <div class="pricing-card featured">
            <div class="pricing-header">
              <h3>Roaming Roost</h3>
              <div class="price">
                <span class="price-current">Coming Soon</span>
              </div>
              <p class="price-note">Pre-order available soon</p>
            </div>
            <div class="pricing-features">
              <ul>
                <li>✅ Mobile smart coop system</li>
                <li>✅ GPS tracking & automated movement</li>
                <li>✅ Pasture management tools</li>
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

export function initializeRoamingRoostPage() {
  console.log('Roaming Roost page initialized');
}

