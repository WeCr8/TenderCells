// Stats Section Component - Modular statistics display
export function createStatsSection() {
  return `
    <!-- Stats Section -->
    <section class="stats">
      <div class="container">
        <div class="stats-grid">
          <div class="stat-item">
            <h3>10k+</h3>
            <p>Active Farmers</p>
          </div>
          <div class="stat-item">
            <h3>50k+</h3>
            <p>Animals Monitored</p>
          </div>
          <div class="stat-item">
            <h3>99.9%</h3>
            <p>Uptime</p>
          </div>
          <div class="stat-item">
            <h3>24/7</h3>
            <p>AI Monitoring</p>
          </div>
        </div>
      </div>
    </section>
  `;
}

export function initializeStatsSection() {
  console.log('Stats section initialized');
}