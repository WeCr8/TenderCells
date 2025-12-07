// Pig Pal Application Page
export function createPigPalPage() {
  return `
    <div class="app-page">
      <!-- Hero Section -->
      <section class="app-hero">
        <div class="container">
          <div class="app-hero-content">
            <div class="app-hero-text">
              <div class="app-status-badge planning">In Planning</div>
              <h1>Pig Pal</h1>
              <p class="app-tagline">Smart pig farming with automated feeding and health tracking</p>
              <p class="app-description">
                Comprehensive swine management system featuring automated feeding, environmental control, 
                health monitoring, and growth tracking. Perfect for commercial operations and homestead pig farming.
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
              <img src="https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop" alt="Pig Pal System Concept">
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
              <div class="feature-icon">🐷</div>
              <h3>Pig Management</h3>
              <p>Individual pig identification, growth tracking, breeding records, and pen assignment with movement tracking.</p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">🍽️</div>
              <h3>Automated Feeding</h3>
              <p>Smart feeding schedules with portion control, feed conversion tracking, and nutritional optimization.</p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">🏥</div>
              <h3>Health Monitoring</h3>
              <p>Vaccination schedules, disease prevention protocols, health alerts, and veterinary record management.</p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">🌡️</div>
              <h3>Environmental Control</h3>
              <p>Temperature and humidity monitoring with automated ventilation and air quality management.</p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">📊</div>
              <h3>Production Analytics</h3>
              <p>Growth rate analysis, feed efficiency metrics, breeding performance, and financial tracking.</p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">🔧</div>
              <h3>IoT Integration</h3>
              <p>Weight scales, environmental sensors, automated feeders, and water monitoring systems.</p>
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
              <div class="roadmap-date">Q3 2025</div>
              <div class="roadmap-content">
                <h3>Phase 1: Foundation</h3>
                <ul>
                  <li>Basic pig management system</li>
                  <li>Individual pig profiles</li>
                  <li>Simple feeding schedules</li>
                  <li>Basic health records</li>
                </ul>
              </div>
            </div>
            <div class="roadmap-item">
              <div class="roadmap-date">Q4 2025</div>
              <div class="roadmap-content">
                <h3>Phase 2: Automation</h3>
                <ul>
                  <li>Automated feeding systems</li>
                  <li>Environmental monitoring</li>
                  <li>Alert system implementation</li>
                  <li>Mobile app integration</li>
                </ul>
              </div>
            </div>
            <div class="roadmap-item">
              <div class="roadmap-date">Q1 2026</div>
              <div class="roadmap-content">
                <h3>Phase 3: Intelligence</h3>
                <ul>
                  <li>AI-powered health insights</li>
                  <li>Predictive analytics</li>
                  <li>Optimization recommendations</li>
                  <li>Market integration</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Research Areas -->
      <section class="app-research">
        <div class="container">
          <h2>Current Research Areas</h2>
          <div class="research-grid">
            <div class="research-card">
              <h3>🧠 Optimal Feeding Algorithms</h3>
              <p>Developing AI models to optimize feed conversion ratios and reduce waste through personalized feeding schedules.</p>
            </div>
            <div class="research-card">
              <h3>🔬 Disease Prediction Models</h3>
              <p>Creating early warning systems using behavioral patterns and environmental data to predict health issues.</p>
            </div>
            <div class="research-card">
              <h3>🌡️ Environmental Optimization</h3>
              <p>Researching ideal climate conditions for different pig breeds and growth stages to maximize comfort and productivity.</p>
            </div>
            <div class="research-card">
              <h3>📈 Behavioral Analysis</h3>
              <p>Studying pig behavior patterns to identify stress indicators and optimize living conditions.</p>
            </div>
          </div>
        </div>
      </section>

      <!-- Community Section -->
      <section class="app-community">
        <div class="container">
          <div class="community-content">
            <div class="community-text">
              <h2>Join the Development Community</h2>
              <p>Pig Pal is being developed with input from swine farmers, veterinarians, and agricultural experts. We're looking for contributors with experience in:</p>
              <ul>
                <li>Swine farming and management</li>
                <li>IoT sensor integration</li>
                <li>Agricultural automation</li>
                <li>Veterinary medicine</li>
                <li>React/TypeScript development</li>
              </ul>
              <div class="community-buttons">
                <button class="btn btn-primary">Join Discord</button>
                <button class="btn btn-secondary">View GitHub</button>
              </div>
            </div>
            <div class="community-stats">
              <div class="stat-card">
                <h3>25+</h3>
                <p>Interested Farmers</p>
              </div>
              <div class="stat-card">
                <h3>8</h3>
                <p>Research Partners</p>
              </div>
              <div class="stat-card">
                <h3>12</h3>
                <p>Contributors</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Newsletter Section -->
      <section class="app-newsletter">
        <div class="container">
          <div class="newsletter-card">
            <h2>Stay Updated on Pig Pal Development</h2>
            <p>Get notified about development progress, beta testing opportunities, and launch updates.</p>
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

export function initializePigPalPage() {
  // Newsletter form handler
  const form = document.querySelector('.newsletter-form');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = e.target.querySelector('input[type="email"]').value;
      alert(`Thank you! We'll keep ${email} updated on Pig Pal development.`);
      e.target.reset();
    });
  }
  
  console.log('Pig Pal page initialized');
}