// How It Works Page
import { trackEngagement } from '../utils/analytics.js';

export function createHowItWorksPage() {
  return `
    <div class="how-it-works-page">
      <!-- Hero Section -->
      <section class="hiw-hero">
        <div class="container">
          <div class="hiw-hero-content">
            <span class="hiw-badge">How It Works</span>
            <h1>Smart Farming Made <span class="highlight">Simple</span></h1>
            <p class="hiw-tagline">
              From setup to daily operations, discover how Tender Cells transforms 
              your farming experience with intelligent automation and real-time monitoring.
            </p>
            <div class="hiw-cta">
              <a href="#store" class="btn btn-primary btn-large">Get Started</a>
              <a href="#" class="btn btn-secondary btn-large" id="watchDemoBtn">
                <span class="play-icon">▶</span> Watch Demo
              </a>
            </div>
          </div>
        </div>
        <div class="hiw-hero-visual">
          <div class="floating-elements">
            <div class="float-item float-1">🐔</div>
            <div class="float-item float-2">📊</div>
            <div class="float-item float-3">🌡️</div>
            <div class="float-item float-4">💧</div>
          </div>
        </div>
      </section>

      <!-- Steps Overview -->
      <section class="hiw-steps">
        <div class="container">
          <div class="section-header">
            <h2>Get Up and Running in 4 Simple Steps</h2>
            <p>Our system is designed for farmers, not engineers. No complex setup required.</p>
          </div>
          
          <div class="steps-timeline">
            <div class="step-card" data-step="1">
              <div class="step-number">01</div>
              <div class="step-icon">📦</div>
              <h3>Unbox & Connect</h3>
              <p>Receive your Tender Cells system pre-configured and ready to go. Simply connect to power and your WiFi network using our guided setup app.</p>
              <div class="step-time">⏱️ ~15 minutes</div>
            </div>

            <div class="step-card" data-step="2">
              <div class="step-number">02</div>
              <div class="step-icon">📱</div>
              <h3>Configure Your Farm</h3>
              <p>Tell us about your animals, set feeding schedules, temperature preferences, and notification settings through our intuitive mobile app.</p>
              <div class="step-time">⏱️ ~10 minutes</div>
            </div>

            <div class="step-card" data-step="3">
              <div class="step-number">03</div>
              <div class="step-icon">🔧</div>
              <h3>Install Sensors</h3>
              <p>Place wireless sensors for temperature, humidity, and water levels. Our magnetic mounts make repositioning easy as your needs change.</p>
              <div class="step-time">⏱️ ~20 minutes</div>
            </div>

            <div class="step-card" data-step="4">
              <div class="step-number">04</div>
              <div class="step-icon">✨</div>
              <h3>Let AI Take Over</h3>
              <p>Our intelligent system learns your animals' patterns and optimizes operations automatically. Monitor everything from anywhere, anytime.</p>
              <div class="step-time">⏱️ Ongoing</div>
            </div>
          </div>
        </div>
      </section>

      <!-- Features Deep Dive -->
      <section class="hiw-features">
        <div class="container">
          <div class="section-header">
            <h2>Powerful Features Working Together</h2>
            <p>Every component is designed to work seamlessly, creating an integrated ecosystem for your farm.</p>
          </div>

          <div class="features-showcase">
            <div class="feature-block">
              <div class="feature-visual">
                <div class="feature-icon-large">🌡️</div>
                <div class="feature-stats">
                  <div class="stat">
                    <span class="stat-value">±0.5°C</span>
                    <span class="stat-label">Accuracy</span>
                  </div>
                  <div class="stat">
                    <span class="stat-value">5sec</span>
                    <span class="stat-label">Update Rate</span>
                  </div>
                </div>
              </div>
              <div class="feature-content">
                <h3>Climate Control</h3>
                <p>Maintain optimal temperature and humidity levels automatically. Our sensors monitor conditions 24/7 and adjust ventilation, heating, or cooling to keep your animals comfortable.</p>
                <ul class="feature-list">
                  <li>Automatic temperature regulation</li>
                  <li>Humidity monitoring and control</li>
                  <li>Seasonal adjustments</li>
                  <li>Emergency alerts for extreme conditions</li>
                </ul>
              </div>
            </div>

            <div class="feature-block reverse">
              <div class="feature-visual">
                <div class="feature-icon-large">🍽️</div>
                <div class="feature-stats">
                  <div class="stat">
                    <span class="stat-value">8</span>
                    <span class="stat-label">Schedules/Day</span>
                  </div>
                  <div class="stat">
                    <span class="stat-value">99.9%</span>
                    <span class="stat-label">Reliability</span>
                  </div>
                </div>
              </div>
              <div class="feature-content">
                <h3>Automated Feeding</h3>
                <p>Set it and forget it. Our smart feeders dispense the right amount of food at the right times, tracking consumption patterns and alerting you to any changes.</p>
                <ul class="feature-list">
                  <li>Customizable feeding schedules</li>
                  <li>Portion control for each animal</li>
                  <li>Low-food alerts</li>
                  <li>Consumption analytics</li>
                </ul>
              </div>
            </div>

            <div class="feature-block">
              <div class="feature-visual">
                <div class="feature-icon-large">💧</div>
                <div class="feature-stats">
                  <div class="stat">
                    <span class="stat-value">24/7</span>
                    <span class="stat-label">Monitoring</span>
                  </div>
                  <div class="stat">
                    <span class="stat-value">Auto</span>
                    <span class="stat-label">Refill</span>
                  </div>
                </div>
              </div>
              <div class="feature-content">
                <h3>Water Management</h3>
                <p>Never worry about empty water containers again. Smart sensors monitor water levels, quality, and consumption, triggering automatic refills when needed.</p>
                <ul class="feature-list">
                  <li>Real-time level monitoring</li>
                  <li>Water quality sensors</li>
                  <li>Automatic refill triggers</li>
                  <li>Consumption tracking</li>
                </ul>
              </div>
            </div>

            <div class="feature-block reverse">
              <div class="feature-visual">
                <div class="feature-icon-large">🤖</div>
                <div class="feature-stats">
                  <div class="stat">
                    <span class="stat-value">AI</span>
                    <span class="stat-label">Powered</span>
                  </div>
                  <div class="stat">
                    <span class="stat-value">24/7</span>
                    <span class="stat-label">Learning</span>
                  </div>
                </div>
              </div>
              <div class="feature-content">
                <h3>Intelligent Insights</h3>
                <p>Our AI continuously analyzes data from all sensors to identify patterns, predict issues, and provide actionable recommendations for improving animal health and productivity.</p>
                <ul class="feature-list">
                  <li>Behavior pattern recognition</li>
                  <li>Health anomaly detection</li>
                  <li>Productivity predictions</li>
                  <li>Optimization suggestions</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Mobile App Section -->
      <section class="hiw-app">
        <div class="container">
          <div class="app-content">
            <div class="app-text">
              <span class="section-badge">Mobile App</span>
              <h2>Control Everything From Your Pocket</h2>
              <p>Our mobile app puts complete farm control at your fingertips. Monitor, adjust, and receive alerts wherever you are.</p>
              
              <div class="app-features">
                <div class="app-feature">
                  <span class="app-feature-icon">📊</span>
                  <div>
                    <h4>Real-time Dashboard</h4>
                    <p>See all your farm stats at a glance with customizable widgets.</p>
                  </div>
                </div>
                <div class="app-feature">
                  <span class="app-feature-icon">🔔</span>
                  <div>
                    <h4>Smart Notifications</h4>
                    <p>Get alerts for important events and customize notification preferences.</p>
                  </div>
                </div>
                <div class="app-feature">
                  <span class="app-feature-icon">📈</span>
                  <div>
                    <h4>Analytics & Reports</h4>
                    <p>Track trends, compare periods, and export detailed reports.</p>
                  </div>
                </div>
                <div class="app-feature">
                  <span class="app-feature-icon">🎮</span>
                  <div>
                    <h4>Remote Control</h4>
                    <p>Trigger feeding, adjust temperatures, and control devices remotely.</p>
                  </div>
                </div>
              </div>

              <div class="app-download">
                <a href="#" class="download-btn apple">
                  <span class="store-icon">🍎</span>
                  <div>
                    <span class="download-label">Download on</span>
                    <span class="store-name">App Store</span>
                  </div>
                </a>
                <a href="#" class="download-btn google">
                  <span class="store-icon">▶️</span>
                  <div>
                    <span class="download-label">Get it on</span>
                    <span class="store-name">Google Play</span>
                  </div>
                </a>
              </div>
            </div>
            
            <div class="app-visual">
              <div class="phone-mockup">
                <div class="phone-screen">
                  <div class="mock-header">
                    <span>Tender Cells</span>
                    <span>🔔</span>
                  </div>
                  <div class="mock-stats">
                    <div class="mock-stat">
                      <span class="mock-label">Temperature</span>
                      <span class="mock-value">72°F</span>
                    </div>
                    <div class="mock-stat">
                      <span class="mock-label">Humidity</span>
                      <span class="mock-value">65%</span>
                    </div>
                    <div class="mock-stat">
                      <span class="mock-label">Feed Level</span>
                      <span class="mock-value">85%</span>
                    </div>
                  </div>
                  <div class="mock-chart"></div>
                  <div class="mock-nav">
                    <span>🏠</span>
                    <span>📊</span>
                    <span>⚙️</span>
                    <span>👤</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Integration Section -->
      <section class="hiw-integration">
        <div class="container">
          <div class="section-header">
            <h2>Works With Your Existing Setup</h2>
            <p>Tender Cells integrates with popular smart home platforms and services.</p>
          </div>

          <div class="integration-grid">
            <div class="integration-card">
              <div class="integration-logo">🏠</div>
              <span>Home Assistant</span>
            </div>
            <div class="integration-card">
              <div class="integration-logo">📱</div>
              <span>Apple HomeKit</span>
            </div>
            <div class="integration-card">
              <div class="integration-logo">🔊</div>
              <span>Amazon Alexa</span>
            </div>
            <div class="integration-card">
              <div class="integration-logo">🎙️</div>
              <span>Google Home</span>
            </div>
            <div class="integration-card">
              <div class="integration-logo">⚡</div>
              <span>IFTTT</span>
            </div>
            <div class="integration-card">
              <div class="integration-logo">🔗</div>
              <span>REST API</span>
            </div>
          </div>
        </div>
      </section>

      <!-- CTA Section -->
      <section class="hiw-cta-section">
        <div class="container">
          <div class="cta-content">
            <h2>Ready to Transform Your Farm?</h2>
            <p>Join thousands of farmers who have already modernized their operations with Tender Cells.</p>
            <div class="cta-buttons">
              <a href="#store" class="btn btn-primary btn-large">Shop Now</a>
              <a href="#contact" class="btn btn-outline btn-large">Talk to Sales</a>
            </div>
          </div>
        </div>
      </section>
    </div>
  `;
}

export function initializeHowItWorksPage() {
  // Animate steps on scroll
  const stepCards = document.querySelectorAll('.step-card');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animate-in');
      }
    });
  }, { threshold: 0.2 });

  stepCards.forEach(card => observer.observe(card));

  // Watch demo button
  const watchDemoBtn = document.getElementById('watchDemoBtn');
  if (watchDemoBtn) {
    watchDemoBtn.addEventListener('click', (e) => {
      e.preventDefault();
      trackEngagement('video_play', { video_name: 'how_it_works_demo' });
      alert('Demo video would play here');
    });
  }

  console.log('How It Works page initialized');
}

