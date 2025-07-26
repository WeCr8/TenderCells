// Cattle Care Application Page
export function createCattleCarePage() {
  return `
    <div class="app-page">
      <!-- Hero Section -->
      <section class="app-hero">
        <div class="container">
          <div class="app-hero-content">
            <div class="app-hero-text">
              <div class="app-status-badge coming-soon">Coming Q3 2025</div>
              <h1>Cattle Care</h1>
              <p class="app-tagline">Comprehensive cattle management and health monitoring</p>
              <p class="app-description">
                Advanced herd management system with GPS tracking, health monitoring, grazing optimization, 
                and breeding management. Designed for modern ranchers and cattle operations of all sizes.
              </p>
              <div class="app-hero-buttons">
                <button class="btn btn-primary btn-large" onclick="navigateTo('store')">
                  Pre-order - $4,999
                </button>
                <button class="btn btn-secondary btn-large">
                  Join Waitlist
                </button>
              </div>
            </div>
            <div class="app-hero-image">
              <img src="https://images.pexels.com/photos/422218/pexels-photo-422218.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop" alt="Cattle Care System">
            </div>
          </div>
        </div>
      </section>

      <!-- Features Section -->
      <section class="app-features">
        <div class="container">
          <h2>Planned Features</h2>
          <div class="features-grid">
            <div class="feature-card">
              <div class="feature-icon">🐄</div>
              <h3>Herd Management</h3>
              <p>Individual cattle profiles with identification, breeding records, genealogy tracking, and performance metrics.</p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">📍</div>
              <h3>GPS Tracking</h3>
              <p>Real-time location monitoring with geofencing alerts and movement pattern analysis for optimal grazing.</p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">🏥</div>
              <h3>Health Monitoring</h3>
              <p>Vaccination schedules, medical records, disease prevention protocols, and veterinary appointment management.</p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">🌱</div>
              <h3>Grazing Optimization</h3>
              <p>Pasture rotation planning, grass growth monitoring, and carrying capacity calculations for sustainable grazing.</p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">📊</div>
              <h3>Analytics Dashboard</h3>
              <p>Comprehensive performance metrics, feed conversion ratios, breeding success rates, and financial tracking.</p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">🔔</div>
              <h3>Smart Alerts</h3>
              <p>Health emergency notifications, breeding cycle reminders, vaccination schedules, and weather warnings.</p>
            </div>
          </div>
        </div>
      </section>

      <!-- Development Roadmap -->
      <section class="app-roadmap">
        <div class="container">
          <h2>Development Roadmap</h2>
          <div class="roadmap-timeline">
            <div class="roadmap-item">
              <div class="roadmap-date">Q2 2025</div>
              <div class="roadmap-content">
                <h3>Phase 1: Core Features</h3>
                <ul>
                  <li>Basic herd management interface</li>
                  <li>Individual cattle profiles</li>
                  <li>Health record system</li>
                  <li>Simple analytics dashboard</li>
                </ul>
              </div>
            </div>
            <div class="roadmap-item">
              <div class="roadmap-date">Q3 2025</div>
              <div class="roadmap-content">
                <h3>Phase 2: Advanced Features</h3>
                <ul>
                  <li>GPS tracking integration</li>
                  <li>Breeding management system</li>
                  <li>Pasture rotation planning</li>
                  <li>Mobile app synchronization</li>
                </ul>
              </div>
            </div>
            <div class="roadmap-item">
              <div class="roadmap-date">Q4 2025</div>
              <div class="roadmap-content">
                <h3>Phase 3: AI Integration</h3>
                <ul>
                  <li>Predictive health analytics</li>
                  <li>Optimal breeding recommendations</li>
                  <li>Feed optimization suggestions</li>
                  <li>Market price predictions</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Specifications Section -->
      <section class="app-specs">
        <div class="container">
          <div class="specs-content">
            <div class="specs-text">
              <h2>Planned Specifications</h2>
              <div class="specs-grid">
                <div class="spec-item">
                  <dt>Herd Capacity</dt>
                  <dd>Up to 500 cattle</dd>
                </div>
                <div class="spec-item">
                  <dt>GPS Accuracy</dt>
                  <dd>±3 meters</dd>
                </div>
                <div class="spec-item">
                  <dt>Battery Life</dt>
                  <dd>6 months per tag</dd>
                </div>
                <div class="spec-item">
                  <dt>Range</dt>
                  <dd>10 mile radius</dd>
                </div>
                <div class="spec-item">
                  <dt>Connectivity</dt>
                  <dd>LoRaWAN, Cellular, WiFi</dd>
                </div>
                <div class="spec-item">
                  <dt>Weather Rating</dt>
                  <dd>IP67 waterproof</dd>
                </div>
                <div class="spec-item">
                  <dt>Installation</dt>
                  <dd>Professional setup included</dd>
                </div>
                <div class="spec-item">
                  <dt>Warranty</dt>
                  <dd>3 years full coverage</dd>
                </div>
              </div>
            </div>
            <div class="specs-image">
              <img src="https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&fit=crop" alt="Cattle Care Components">
            </div>
          </div>
        </div>
      </section>

      <!-- Pricing Section -->
      <section class="app-pricing">
        <div class="container">
          <div class="pricing-card preorder">
            <div class="pricing-header">
              <h3>Cattle Care System</h3>
              <div class="price">
                <span class="price-current">$4,999</span>
              </div>
              <p class="price-note">Pre-order pricing • Expected Q3 2025</p>
            </div>
            <div class="pricing-features">
              <ul>
                <li>🔄 Complete herd management system</li>
                <li>🔄 GPS tracking tags (10 included)</li>
                <li>🔄 Base station and connectivity</li>
                <li>🔄 Mobile apps (iOS/Android/Web)</li>
                <li>🔄 Professional installation</li>
                <li>🔄 3-year warranty</li>
                <li>🔄 Priority support</li>
                <li>🔄 Free software updates</li>
              </ul>
            </div>
            <button class="btn btn-primary btn-large" onclick="navigateTo('store')">
              Pre-order Now
            </button>
            <p class="preorder-note">No charge until shipping. Cancel anytime.</p>
          </div>
        </div>
      </section>
    </div>
  `;
}

export function initializeCattleCarePage() {
  console.log('Cattle Care page initialized');
}