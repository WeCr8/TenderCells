// Technology Page
import { trackEngagement } from '../utils/analytics.js';

export function createTechnologyPage() {
  return `
    <div class="technology-page">
      <!-- Hero Section -->
      <section class="tech-hero">
        <div class="container">
          <div class="tech-hero-content">
            <span class="tech-badge">Our Technology</span>
            <h1>Built for the <span class="highlight">Future</span> of Farming</h1>
            <p class="tech-tagline">
              Combining cutting-edge hardware, advanced AI, and open-source software 
              to create the most intelligent farming system on the planet.
            </p>
          </div>
        </div>
        <div class="tech-hero-bg">
          <div class="circuit-pattern"></div>
        </div>
      </section>

      <!-- Core Technologies -->
      <section class="tech-core">
        <div class="container">
          <div class="section-header">
            <h2>Core Technologies</h2>
            <p>The building blocks that power every Tender Cells system.</p>
          </div>

          <div class="tech-pillars">
            <div class="pillar-card">
              <div class="pillar-icon">
                <span>🔌</span>
              </div>
              <h3>Edge Computing</h3>
              <p>All critical operations run locally on our custom hardware. Your farm stays operational even without internet, with data syncing when connectivity returns.</p>
              <div class="pillar-specs">
                <div class="spec">
                  <span class="spec-label">Processor</span>
                  <span class="spec-value">ARM Cortex-A72</span>
                </div>
                <div class="spec">
                  <span class="spec-label">Memory</span>
                  <span class="spec-value">4GB LPDDR4</span>
                </div>
                <div class="spec">
                  <span class="spec-label">Storage</span>
                  <span class="spec-value">64GB eMMC</span>
                </div>
              </div>
            </div>

            <div class="pillar-card featured">
              <div class="pillar-icon">
                <span>🧠</span>
              </div>
              <h3>Machine Learning</h3>
              <p>Our proprietary ML models analyze behavior patterns, predict health issues, and optimize operations. Trained on millions of data points from real farms.</p>
              <div class="pillar-specs">
                <div class="spec">
                  <span class="spec-label">Models</span>
                  <span class="spec-value">TenderNet v3</span>
                </div>
                <div class="spec">
                  <span class="spec-label">Inference</span>
                  <span class="spec-value">&lt;50ms</span>
                </div>
                <div class="spec">
                  <span class="spec-label">Accuracy</span>
                  <span class="spec-value">98.5%</span>
                </div>
              </div>
            </div>

            <div class="pillar-card">
              <div class="pillar-icon">
                <span>📡</span>
              </div>
              <h3>Wireless Mesh</h3>
              <p>Our sensors communicate via a self-healing mesh network. Add devices anywhere on your property—they automatically find the best connection path.</p>
              <div class="pillar-specs">
                <div class="spec">
                  <span class="spec-label">Protocol</span>
                  <span class="spec-value">Zigbee 3.0</span>
                </div>
                <div class="spec">
                  <span class="spec-label">Range</span>
                  <span class="spec-value">100m+</span>
                </div>
                <div class="spec">
                  <span class="spec-label">Devices</span>
                  <span class="spec-value">250+ per hub</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Hardware Section -->
      <section class="tech-hardware">
        <div class="container">
          <div class="hardware-content">
            <div class="hardware-text">
              <span class="section-badge">Hardware</span>
              <h2>Purpose-Built for Farm Environments</h2>
              <p>Consumer electronics fail in barns. That's why we designed hardware from scratch to withstand the realities of agricultural life.</p>
              
              <div class="hardware-features">
                <div class="hw-feature">
                  <div class="hw-icon">💪</div>
                  <div>
                    <h4>IP67 Rated</h4>
                    <p>Dust-proof and waterproof. Survives power washes, rain, and dust storms.</p>
                  </div>
                </div>
                <div class="hw-feature">
                  <div class="hw-icon">🌡️</div>
                  <div>
                    <h4>Extreme Temps</h4>
                    <p>Operates reliably from -40°F to 140°F (-40°C to 60°C).</p>
                  </div>
                </div>
                <div class="hw-feature">
                  <div class="hw-icon">⚡</div>
                  <div>
                    <h4>Low Power</h4>
                    <p>Sensors run 2+ years on a single battery. Solar options available.</p>
                  </div>
                </div>
                <div class="hw-feature">
                  <div class="hw-icon">🔧</div>
                  <div>
                    <h4>Field Repairable</h4>
                    <p>Modular design means you can replace parts, not entire units.</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="hardware-visual">
              <div class="hardware-showcase">
                <div class="showcase-item" data-item="hub">
                  <div class="showcase-label">Smart Hub</div>
                </div>
                <div class="showcase-item" data-item="sensor">
                  <div class="showcase-label">Climate Sensor</div>
                </div>
                <div class="showcase-item" data-item="camera">
                  <div class="showcase-label">AI Camera</div>
                </div>
                <div class="showcase-item" data-item="feeder">
                  <div class="showcase-label">Smart Feeder</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- AI & Analytics -->
      <section class="tech-ai">
        <div class="container">
          <div class="section-header">
            <h2>AI-Powered Analytics</h2>
            <p>Our machine learning models turn raw sensor data into actionable insights.</p>
          </div>

          <div class="ai-capabilities">
            <div class="ai-card">
              <div class="ai-icon">🔍</div>
              <h3>Anomaly Detection</h3>
              <p>Automatically identifies unusual patterns in temperature, feeding, water consumption, or animal behavior that might indicate health issues.</p>
              <div class="ai-stat">
                <span class="ai-stat-value">6 hours</span>
                <span class="ai-stat-label">Average early warning time</span>
              </div>
            </div>

            <div class="ai-card">
              <div class="ai-icon">📈</div>
              <h3>Predictive Analytics</h3>
              <p>Forecasts egg production, growth rates, and resource needs based on historical data and current conditions.</p>
              <div class="ai-stat">
                <span class="ai-stat-value">92%</span>
                <span class="ai-stat-label">Prediction accuracy</span>
              </div>
            </div>

            <div class="ai-card">
              <div class="ai-icon">⚡</div>
              <h3>Optimization Engine</h3>
              <p>Continuously adjusts feeding schedules, climate settings, and lighting to maximize health and productivity while minimizing costs.</p>
              <div class="ai-stat">
                <span class="ai-stat-value">23%</span>
                <span class="ai-stat-label">Average efficiency gain</span>
              </div>
            </div>

            <div class="ai-card">
              <div class="ai-icon">🎯</div>
              <h3>Computer Vision</h3>
              <p>Our cameras use AI to monitor animal activity, detect health symptoms, count populations, and identify individual animals.</p>
              <div class="ai-stat">
                <span class="ai-stat-value">98.5%</span>
                <span class="ai-stat-label">Recognition accuracy</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Security Section -->
      <section class="tech-security">
        <div class="container">
          <div class="security-content">
            <div class="security-visual">
              <div class="security-shield">
                <div class="shield-icon">🛡️</div>
                <div class="shield-rings">
                  <div class="ring ring-1"></div>
                  <div class="ring ring-2"></div>
                  <div class="ring ring-3"></div>
                </div>
              </div>
            </div>
            
            <div class="security-text">
              <span class="section-badge">Security</span>
              <h2>Your Data, Protected</h2>
              <p>We take security seriously. Your farm data is encrypted, protected, and never sold to third parties.</p>
              
              <div class="security-features">
                <div class="sec-feature">
                  <span class="sec-icon">🔐</span>
                  <span>End-to-end encryption (AES-256)</span>
                </div>
                <div class="sec-feature">
                  <span class="sec-icon">🌐</span>
                  <span>TLS 1.3 for all communications</span>
                </div>
                <div class="sec-feature">
                  <span class="sec-icon">🔑</span>
                  <span>Two-factor authentication</span>
                </div>
                <div class="sec-feature">
                  <span class="sec-icon">📋</span>
                  <span>SOC 2 Type II certified</span>
                </div>
                <div class="sec-feature">
                  <span class="sec-icon">🇪🇺</span>
                  <span>GDPR compliant</span>
                </div>
                <div class="sec-feature">
                  <span class="sec-icon">💾</span>
                  <span>Local data ownership option</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Open Source Section -->
      <section class="tech-opensource">
        <div class="container">
          <div class="opensource-content">
            <div class="opensource-text">
              <span class="section-badge">Open Source</span>
              <h2>Built in the Open</h2>
              <p>We believe in transparency and community. Large portions of our codebase are open source, allowing farmers, developers, and researchers to inspect, modify, and contribute.</p>
              
              <div class="os-stats">
                <div class="os-stat">
                  <span class="os-stat-value">50K+</span>
                  <span class="os-stat-label">GitHub Stars</span>
                </div>
                <div class="os-stat">
                  <span class="os-stat-value">2,500+</span>
                  <span class="os-stat-label">Contributors</span>
                </div>
                <div class="os-stat">
                  <span class="os-stat-value">MIT</span>
                  <span class="os-stat-label">License</span>
                </div>
              </div>

              <a href="#open-source" class="btn btn-primary">Explore Our Repos</a>
            </div>
            
            <div class="opensource-visual">
              <div class="code-block">
                <div class="code-header">
                  <span class="dot red"></span>
                  <span class="dot yellow"></span>
                  <span class="dot green"></span>
                  <span class="filename">tender-cells/core</span>
                </div>
                <pre class="code-content">
<span class="comment">// Monitor chicken health</span>
<span class="keyword">const</span> health = <span class="keyword">await</span> tender
  .flock(<span class="string">'main-coop'</span>)
  .analyze({
    metrics: [<span class="string">'activity'</span>, <span class="string">'feeding'</span>],
    period: <span class="string">'24h'</span>
  });

<span class="keyword">if</span> (health.anomalies.length > <span class="number">0</span>) {
  tender.alert(health.anomalies);
}</pre>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Roadmap Section -->
      <section class="tech-roadmap">
        <div class="container">
          <div class="section-header">
            <h2>Technology Roadmap</h2>
            <p>See what we're building next to make your farm even smarter.</p>
          </div>

          <div class="roadmap-timeline">
            <div class="roadmap-item completed">
              <div class="roadmap-dot"></div>
              <div class="roadmap-content">
                <span class="roadmap-date">Q1 2024</span>
                <h4>TenderNet v3 AI Engine</h4>
                <p>Next-generation ML models with 40% better prediction accuracy.</p>
              </div>
            </div>

            <div class="roadmap-item completed">
              <div class="roadmap-dot"></div>
              <div class="roadmap-content">
                <span class="roadmap-date">Q2 2024</span>
                <h4>Voice Control Integration</h4>
                <p>Full Alexa and Google Assistant support for hands-free operation.</p>
              </div>
            </div>

            <div class="roadmap-item current">
              <div class="roadmap-dot"></div>
              <div class="roadmap-content">
                <span class="roadmap-date">Q3 2024</span>
                <h4>Solar-Powered Sensors</h4>
                <p>Completely self-sufficient sensors with integrated solar panels.</p>
              </div>
            </div>

            <div class="roadmap-item">
              <div class="roadmap-dot"></div>
              <div class="roadmap-content">
                <span class="roadmap-date">Q4 2024</span>
                <h4>Multi-Farm Dashboard</h4>
                <p>Manage multiple locations from a single unified interface.</p>
              </div>
            </div>

            <div class="roadmap-item">
              <div class="roadmap-dot"></div>
              <div class="roadmap-content">
                <span class="roadmap-date">2025</span>
                <h4>Autonomous Drone Integration</h4>
                <p>Automated aerial monitoring and inspection capabilities.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- CTA Section -->
      <section class="tech-cta">
        <div class="container">
          <div class="cta-content">
            <h2>Experience the Technology</h2>
            <p>See how Tender Cells can transform your farming operation.</p>
            <div class="cta-buttons">
              <a href="#store" class="btn btn-primary btn-large">Shop Now</a>
              <a href="#contact" class="btn btn-outline btn-large">Request Demo</a>
            </div>
          </div>
        </div>
      </section>
    </div>
  `;
}

export function initializeTechnologyPage() {
  // Animate elements on scroll
  const animateElements = document.querySelectorAll('.pillar-card, .ai-card, .roadmap-item');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animate-in');
      }
    });
  }, { threshold: 0.2 });

  animateElements.forEach(el => observer.observe(el));

  // Hardware showcase interactions
  const showcaseItems = document.querySelectorAll('.showcase-item');
  showcaseItems.forEach(item => {
    item.addEventListener('click', () => {
      showcaseItems.forEach(i => i.classList.remove('active'));
      item.classList.add('active');
      trackEngagement('hardware_view', { item: item.dataset.item });
    });
  });

  console.log('Technology page initialized');
}

