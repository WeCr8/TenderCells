// Goat Guardian Application Page
export function createGoatGuardianPage() {
  return `
    <div class="app-page">
      <!-- Hero Section -->
      <section class="app-hero">
        <div class="container">
          <div class="app-hero-content">
            <div class="app-hero-text">
              <div class="app-status-badge planning">In Planning</div>
              <h1>Goat Guardian</h1>
              <p class="app-tagline">Intelligent goat herd management and pasture optimization</p>
              <p class="app-description">
                Comprehensive goat farming system with rotational grazing optimization, milk production tracking, 
                health monitoring, and breeding management for sustainable goat operations.
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
              <img src="https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop" alt="Goat Guardian System Concept">
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
              <div class="feature-icon">🐐</div>
              <h3>Herd Management</h3>
              <p>Individual goat tracking, breeding records, kidding management, and milk production monitoring.</p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">🌱</div>
              <h3>Pasture Management</h3>
              <p>Rotational grazing optimization, pasture health monitoring, and carrying capacity calculations.</p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">🥛</div>
              <h3>Milk Production</h3>
              <p>Daily yield tracking, quality testing records, milking schedule optimization, and production analysis.</p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">🏥</div>
              <h3>Health & Wellness</h3>
              <p>Vaccination schedules, hoof trimming reminders, parasite management, and body condition scoring.</p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">📊</div>
              <h3>Analytics & Insights</h3>
              <p>Herd performance metrics, breeding success rates, pasture utilization, and financial tracking.</p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">🌍</div>
              <h3>Sustainability Focus</h3>
              <p>Carbon footprint tracking, soil health monitoring, and regenerative farming practices.</p>
            </div>
          </div>
        </div>
      </section>

      <!-- Sustainable Farming Focus -->
      <section class="app-sustainability">
        <div class="container">
          <h2>Sustainable & Regenerative Farming</h2>
          <div class="sustainability-content">
            <div class="sustainability-text">
              <p>Goat Guardian emphasizes sustainable farming practices that benefit both your operation and the environment.</p>
              <div class="sustainability-benefits">
                <div class="benefit-item">
                  <span class="benefit-icon">🌱</span>
                  <div>
                    <h4>Soil Health Improvement</h4>
                    <p>Monitor soil carbon sequestration and track pasture restoration progress</p>
                  </div>
                </div>
                <div class="benefit-item">
                  <span class="benefit-icon">💧</span>
                  <div>
                    <h4>Water Usage Optimization</h4>
                    <p>Track water consumption and optimize irrigation for maximum efficiency</p>
                  </div>
                </div>
                <div class="benefit-item">
                  <span class="benefit-icon">🦋</span>
                  <div>
                    <h4>Biodiversity Enhancement</h4>
                    <p>Monitor wildlife habitat creation and native plant species integration</p>
                  </div>
                </div>
                <div class="benefit-item">
                  <span class="benefit-icon">📉</span>
                  <div>
                    <h4>Carbon Footprint Tracking</h4>
                    <p>Measure and reduce your operation's environmental impact</p>
                  </div>
                </div>
              </div>
            </div>
            <div class="sustainability-image">
              <img src="https://images.pexels.com/photos/2889440/pexels-photo-2889440.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&fit=crop" alt="Sustainable Goat Farming">
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
              <div class="roadmap-date">Q4 2025</div>
              <div class="roadmap-content">
                <h3>Phase 1: Core Management</h3>
                <ul>
                  <li>Basic goat profile management</li>
                  <li>Simple health record system</li>
                  <li>Milk production tracking</li>
                  <li>Basic analytics dashboard</li>
                </ul>
              </div>
            </div>
            <div class="roadmap-item">
              <div class="roadmap-date">Q1 2026</div>
              <div class="roadmap-content">
                <h3>Phase 2: Pasture Integration</h3>
                <ul>
                  <li>Pasture mapping and management</li>
                  <li>Rotational grazing scheduler</li>
                  <li>GPS tracking integration</li>
                  <li>Weather data integration</li>
                </ul>
              </div>
            </div>
            <div class="roadmap-item">
              <div class="roadmap-date">Q2 2026</div>
              <div class="roadmap-content">
                <h3>Phase 3: Advanced Features</h3>
                <ul>
                  <li>AI-powered breeding recommendations</li>
                  <li>Predictive health analytics</li>
                  <li>Market price integration</li>
                  <li>Advanced reporting system</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Integration Capabilities -->
      <section class="app-integrations">
        <div class="container">
          <h2>Planned Integrations</h2>
          <div class="integrations-grid">
            <div class="integration-card">
              <div class="integration-icon">🌤️</div>
              <h3>Weather Services</h3>
              <p>Grazing condition forecasts, severe weather alerts, and seasonal planning assistance.</p>
            </div>
            <div class="integration-card">
              <div class="integration-icon">💰</div>
              <h3>Market Data</h3>
              <p>Goat meat and milk price tracking, breeding stock valuations, and feed cost optimization.</p>
            </div>
            <div class="integration-card">
              <div class="integration-icon">🏥</div>
              <h3>Veterinary Systems</h3>
              <p>Health record sharing, appointment scheduling, and treatment plan integration.</p>
            </div>
            <div class="integration-card">
              <div class="integration-icon">📱</div>
              <h3>Mobile Apps</h3>
              <p>Native iOS and Android apps with offline capabilities and real-time synchronization.</p>
            </div>
          </div>
        </div>
      </section>

      <!-- Community Section -->
      <section class="app-community">
        <div class="container">
          <div class="community-content">
            <div class="community-text">
              <h2>Join the Goat Guardian Community</h2>
              <p>We're building Goat Guardian with input from experienced goat farmers, veterinarians, and sustainable agriculture advocates. Looking for contributors with expertise in:</p>
              <ul>
                <li>Goat farming and ranching</li>
                <li>Veterinary medicine (small ruminants)</li>
                <li>Sustainable farming practices</li>
                <li>Agricultural extension services</li>
                <li>Software development</li>
              </ul>
              <div class="community-buttons">
                <button class="btn btn-primary">Join Community</button>
                <button class="btn btn-secondary">Research Partnerships</button>
              </div>
            </div>
            <div class="community-stats">
              <div class="stat-card">
                <h3>18+</h3>
                <p>Goat Farmers</p>
              </div>
              <div class="stat-card">
                <h3>5</h3>
                <p>Veterinarians</p>
              </div>
              <div class="stat-card">
                <h3>3</h3>
                <p>Universities</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Newsletter Section -->
      <section class="app-newsletter">
        <div class="container">
          <div class="newsletter-card">
            <h2>Stay Updated on Goat Guardian</h2>
            <p>Be the first to know about development milestones, beta testing opportunities, and sustainable farming insights.</p>
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

export function initializeGoatGuardianPage() {
  // Newsletter form handler
  const form = document.querySelector('.newsletter-form');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = e.target.querySelector('input[type="email"]').value;
      alert(`Thank you! We'll keep ${email} updated on Goat Guardian development.`);
      e.target.reset();
    });
  }
  
  console.log('Goat Guardian page initialized');
}