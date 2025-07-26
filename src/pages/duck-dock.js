// Duck Dock Application Page
export function createDuckDockPage() {
  return `
    <div class="app-page">
      <!-- Hero Section -->
      <section class="app-hero">
        <div class="container">
          <div class="app-hero-content">
            <div class="app-hero-text">
              <div class="app-status-badge planning">In Planning</div>
              <h1>Duck Dock</h1>
              <p class="app-tagline">Comprehensive waterfowl management with intelligent pond monitoring</p>
              <p class="app-description">
                Advanced duck farming system featuring pond water quality monitoring, automated care scheduling, 
                egg production tracking, and environmental controls for optimal waterfowl management.
              </p>
              <div class="app-hero-buttons">
                <button class="btn btn-secondary btn-large">
                  Join Development
                </button>
                <button class="btn btn-secondary btn-large">
                  Get Updates
                </button>
              </div>
            </div>
            <div class="app-hero-image">
              <img src="https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop" alt="Duck Dock System Concept">
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
              <div class="feature-icon">🦆</div>
              <h3>Flock Management</h3>
              <p>Individual duck identification, breed-specific care requirements, and comprehensive health tracking.</p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">🏊</div>
              <h3>Pond & Water Management</h3>
              <p>Water quality monitoring (pH, oxygen, temperature), automatic level control, and filtration management.</p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">🥚</div>
              <h3>Egg Production</h3>
              <p>Daily collection tracking, quality assessment, incubation management, and hatchling care protocols.</p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">🍽️</div>
              <h3>Feeding Optimization</h3>
              <p>Species-specific nutrition plans, automated schedules, feed conversion tracking, and seasonal adjustments.</p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">🌡️</div>
              <h3>Environmental Monitoring</h3>
              <p>Pond temperature regulation, shelter climate control, weather impact assessment, and predator alerts.</p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">🔬</div>
              <h3>Water Quality Testing</h3>
              <p>Automated pH, dissolved oxygen, ammonia, and nitrate monitoring with alert systems.</p>
            </div>
          </div>
        </div>
      </section>

      <!-- Waterfowl Specific Features -->
      <section class="app-waterfowl">
        <div class="container">
          <h2>Waterfowl-Specific Features</h2>
          <div class="waterfowl-content">
            <div class="waterfowl-text">
              <h3>Species Variations Support</h3>
              <p>Duck Dock is designed to handle the unique needs of different waterfowl species:</p>
              <div class="species-list">
                <div class="species-item">
                  <span class="species-icon">🦆</span>
                  <div>
                    <h4>Mallard Management</h4>
                    <p>Wild and domestic mallard care optimization</p>
                  </div>
                </div>
                <div class="species-item">
                  <span class="species-icon">🦆</span>
                  <div>
                    <h4>Pekin Duck Optimization</h4>
                    <p>Commercial meat production management</p>
                  </div>
                </div>
                <div class="species-item">
                  <span class="species-icon">🦆</span>
                  <div>
                    <h4>Muscovy Duck Care</h4>
                    <p>Specialized care for this unique breed</p>
                  </div>
                </div>
                <div class="species-item">
                  <span class="species-icon">🦆</span>
                  <div>
                    <h4>Wood Duck Conservation</h4>
                    <p>Native species habitat management</p>
                  </div>
                </div>
              </div>
            </div>
            <div class="waterfowl-image">
              <img src="https://images.pexels.com/photos/2889440/pexels-photo-2889440.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&fit=crop" alt="Duck Pond Management">
            </div>
          </div>
        </div>
      </section>

      <!-- IoT Sensor Integration -->
      <section class="app-iot">
        <div class="container">
          <h2>IoT Sensor Integration</h2>
          <div class="iot-grid">
            <div class="iot-card">
              <div class="iot-icon">💧</div>
              <h3>Water Quality Sensors</h3>
              <p>Real-time monitoring of pH, dissolved oxygen, turbidity, ammonia, and nitrate levels.</p>
            </div>
            <div class="iot-card">
              <div class="iot-icon">⚖️</div>
              <h3>Automated Systems</h3>
              <p>Water level controllers, feeding dispensers, filtration pumps, and heating/cooling systems.</p>
            </div>
            <div class="iot-card">
              <div class="iot-icon">📹</div>
              <h3>Security Cameras</h3>
              <p>Motion detection, predator alerts, and behavioral monitoring with AI analysis.</p>
            </div>
            <div class="iot-card">
              <div class="iot-icon">🌡️</div>
              <h3>Environmental Sensors</h3>
              <p>Temperature, humidity, air quality, and weather monitoring for optimal conditions.</p>
            </div>
          </div>
        </div>
      </section>

      <!-- Development Timeline -->
      <section class="app-roadmap">
        <div class="container">
          <h2>Development Timeline</h2>
          <div class="roadmap-timeline">
            <div class="roadmap-item">
              <div class="roadmap-date">Q1 2026</div>
              <div class="roadmap-content">
                <h3>Phase 1: Foundation</h3>
                <ul>
                  <li>Basic flock management system</li>
                  <li>Simple pond monitoring</li>
                  <li>Egg production tracking</li>
                  <li>Basic health records</li>
                </ul>
              </div>
            </div>
            <div class="roadmap-item">
              <div class="roadmap-date">Q2 2026</div>
              <div class="roadmap-content">
                <h3>Phase 2: Automation</h3>
                <ul>
                  <li>Automated water quality monitoring</li>
                  <li>Smart feeding systems</li>
                  <li>Environmental controls</li>
                  <li>Alert system implementation</li>
                </ul>
              </div>
            </div>
            <div class="roadmap-item">
              <div class="roadmap-date">Q3 2026</div>
              <div class="roadmap-content">
                <h3>Phase 3: Intelligence</h3>
                <ul>
                  <li>AI-powered health insights</li>
                  <li>Predictive water quality management</li>
                  <li>Optimal breeding recommendations</li>
                  <li>Advanced analytics dashboard</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Environmental Sustainability -->
      <section class="app-sustainability">
        <div class="container">
          <h2>Environmental Sustainability</h2>
          <div class="sustainability-content">
            <div class="sustainability-text">
              <h3>Water Conservation & Ecosystem Benefits</h3>
              <p>Duck Dock promotes sustainable waterfowl farming that benefits both your operation and the environment.</p>
              <div class="sustainability-benefits">
                <div class="benefit-item">
                  <span class="benefit-icon">💧</span>
                  <div>
                    <h4>Water Conservation</h4>
                    <p>Rainwater collection integration and efficient water recycling systems</p>
                  </div>
                </div>
                <div class="benefit-item">
                  <span class="benefit-icon">🌿</span>
                  <div>
                    <h4>Wetland Habitat Creation</h4>
                    <p>Support local wildlife and enhance biodiversity through managed wetlands</p>
                  </div>
                </div>
                <div class="benefit-item">
                  <span class="benefit-icon">🐛</span>
                  <div>
                    <h4>Natural Pest Control</h4>
                    <p>Track the pest control benefits ducks provide to surrounding areas</p>
                  </div>
                </div>
                <div class="benefit-item">
                  <span class="benefit-icon">📊</span>
                  <div>
                    <h4>Carbon Footprint Monitoring</h4>
                    <p>Measure and optimize your operation's environmental impact</p>
                  </div>
                </div>
              </div>
            </div>
            <div class="sustainability-image">
              <img src="https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&fit=crop" alt="Sustainable Duck Farming">
            </div>
          </div>
        </div>
      </section>

      <!-- Research & Development -->
      <section class="app-research">
        <div class="container">
          <h2>Current Research Areas</h2>
          <div class="research-grid">
            <div class="research-card">
              <h3>🌊 Optimal Pond Ecosystem Balance</h3>
              <p>Researching the ideal balance of beneficial bacteria, aquatic plants, and filtration for healthy pond ecosystems.</p>
            </div>
            <div class="research-card">
              <h3>🤖 Automated Water Quality Management</h3>
              <p>Developing AI systems that can predict and prevent water quality issues before they affect duck health.</p>
            </div>
            <div class="research-card">
              <h3>🦆 Duck Behavior Pattern Analysis</h3>
              <p>Using computer vision to analyze duck behavior patterns for early health issue detection.</p>
            </div>
            <div class="research-card">
              <h3>🛡️ Predator Deterrent Systems</h3>
              <p>Creating humane, automated systems to protect ducks from predators while maintaining natural behaviors.</p>
            </div>
          </div>
        </div>
      </section>

      <!-- Community Section -->
      <section class="app-community">
        <div class="container">
          <div class="community-content">
            <div class="community-text">
              <h2>Join the Duck Dock Community</h2>
              <p>We're developing Duck Dock with input from waterfowl farmers, conservationists, and aquaculture specialists. We're seeking contributors with experience in:</p>
              <ul>
                <li>Duck farming and breeding</li>
                <li>Waterfowl conservation</li>
                <li>Aquaculture and pond management</li>
                <li>Water quality testing</li>
                <li>IoT sensor integration</li>
                <li>Mobile app development</li>
              </ul>
              <div class="community-buttons">
                <button class="btn btn-primary">Join Community</button>
                <button class="btn btn-secondary">Academic Partnerships</button>
              </div>
            </div>
            <div class="community-stats">
              <div class="stat-card">
                <h3>12+</h3>
                <p>Duck Farmers</p>
              </div>
              <div class="stat-card">
                <h3>4</h3>
                <p>Conservationists</p>
              </div>
              <div class="stat-card">
                <h3>2</h3>
                <p>Research Institutions</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Newsletter Section -->
      <section class="app-newsletter">
        <div class="container">
          <div class="newsletter-card">
            <h2>Stay Updated on Duck Dock Development</h2>
            <p>Get the latest updates on development progress, research findings, and beta testing opportunities.</p>
            <form class="newsletter-form">
              <input type="email" placeholder="Enter your email" required>
              <button type="submit" class="btn btn-primary">Get Updates</button>
            </form>
          </div>
        </div>
      </section>
    </div>
  `;
}

export function initializeDuckDockPage() {
  // Newsletter form handler
  const form = document.querySelector('.newsletter-form');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = e.target.querySelector('input[type="email"]').value;
      alert(`Thank you! We'll keep ${email} updated on Duck Dock development.`);
      e.target.reset();
    });
  }
  
  console.log('Duck Dock page initialized');
}