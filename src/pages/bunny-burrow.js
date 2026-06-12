// Bunny Burrow Product Page
export function createBunnyBurrowPage() {
  return `
    <div class="app-page">
      <section class="app-hero">
        <div class="container">
          <div class="app-hero-content">
            <div class="app-hero-text">
              <div class="app-status-badge coming-soon">Coming Soon</div>
              <h1>Bunny Burrow</h1>
              <p class="app-tagline">Smart rabbit housing with burrow monitoring and breeding cycle management</p>
              <p class="app-description">
                Intelligent rabbit housing system featuring burrow monitoring, breeding cycle tracking, 
                health management, and automated care. Perfect for meat rabbits, show rabbits, and pet breeding operations.
              </p>
              <div class="app-hero-buttons">
                <button class="btn btn-secondary btn-large">Notify Me When Available</button>
                <button class="btn btn-outline btn-large">Learn More</button>
              </div>
            </div>
            <div class="app-hero-image">
              <img src="https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop" alt="Bunny Burrow">
            </div>
          </div>
        </div>
      </section>

      <section class="app-features">
        <div class="container">
          <h2>Key Features</h2>
          <div class="features-grid">
            <div class="feature-card">
              <div class="feature-icon">🕳️</div>
              <h3>Burrow Monitoring</h3>
              <p>Underground burrow sensors for temperature, humidity, and activity monitoring.</p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">🐰</div>
              <h3>Breeding Cycles</h3>
              <p>Comprehensive breeding cycle management with gestation tracking and kindling alerts.</p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">🌡️</div>
              <h3>Climate Control</h3>
              <p>Automated temperature and humidity control for optimal rabbit health and comfort.</p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">🍽️</div>
              <h3>Feeding Management</h3>
              <p>Automated feeding schedules with portion control and nutrition tracking.</p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">📊</div>
              <h3>Health Tracking</h3>
              <p>Individual rabbit health records with weight tracking and disease prevention alerts.</p>
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
                  <dd>Customizable hutch sizes</dd>
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
                  <dd>Up to 20 rabbits</dd>
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
                  <dd>Temperature, Humidity, Motion, Burrow Depth</dd>
                </div>
                <div class="spec-item">
                  <dt>Special Features</dt>
                  <dd>Burrow monitoring, Breeding management</dd>
                </div>
              </div>
            </div>
            <div class="specs-image">
              <img src="https://images.pexels.com/photos/2889440/pexels-photo-2889440.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&fit=crop" alt="Bunny Burrow Components">
            </div>
          </div>
        </div>
      </section>

      <!-- Pricing Section -->
      <section class="app-pricing">
        <div class="container">
          <div class="pricing-card featured">
            <div class="pricing-header">
              <h3>Bunny Burrow</h3>
              <div class="price">
                <span class="price-current">Coming Soon</span>
              </div>
              <p class="price-note">Pre-order available soon</p>
            </div>
            <div class="pricing-features">
              <ul>
                <li>✅ Complete smart hutch system</li>
                <li>✅ Burrow monitoring sensors</li>
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

export function initializeBunnyBurrowPage() {
  console.log('Bunny Burrow page initialized');
}

