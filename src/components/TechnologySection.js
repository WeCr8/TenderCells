// Technology Section Component - Modular technology showcase
export function createTechnologySection() {
  return `
    <!-- Technology Section -->
    <section id="technology" class="technology">
      <div class="container">
        <h2>Powered by Modern Technology</h2>
        <p class="tech-subtitle">Built with cutting-edge tools for reliability, intelligence, and scalability.</p>
        <div class="tech-grid">
          <div class="tech-card">
            <div class="tech-icon">🔥</div>
            <h3>Firebase</h3>
            <p>Real-time database, authentication, and cloud functions for seamless data synchronization across all your devices.</p>
          </div>
          <div class="tech-card">
            <div class="tech-icon">🤖</div>
            <h3>Google AI & Genkit</h3>
            <p>Advanced AI capabilities for predictive analytics, health monitoring, and intelligent farming recommendations.</p>
          </div>
          <div class="tech-card">
            <div class="tech-icon">📱</div>
            <h3>Cross-Platform</h3>
            <p>Native iOS and Android apps plus responsive web interface - access your farm data anywhere, anytime.</p>
          </div>
        </div>
      </div>
    </section>
  `;
}

export function initializeTechnologySection() {
  console.log('Technology section initialized');
}