// Open Source Section Component - Modular open source showcase
export function createOpenSourceSection() {
  return `
    <!-- Open Source Section -->
    <section id="open-source" class="open-source">
      <div class="container">
        <div class="open-source-content">
          <div class="open-source-text">
            <h2>Open Source & Community Driven</h2>
            <p>We believe in the power of community collaboration. All Tender Cells applications are open source, allowing homesteaders worldwide to contribute, customize, and improve our farming solutions.</p>
            
            <div class="open-source-benefits">
              <div class="benefit-item">
                <span class="benefit-icon">🔓</span>
                <div>
                  <h4>Fully Open</h4>
                  <p>Complete source code available on GitHub</p>
                </div>
              </div>
              <div class="benefit-item">
                <span class="benefit-icon">🤝</span>
                <div>
                  <h4>Community Driven</h4>
                  <p>Built by farmers, for farmers</p>
                </div>
              </div>
              <div class="benefit-item">
                <span class="benefit-icon">🔧</span>
                <div>
                  <h4>Customizable</h4>
                  <p>Adapt to your specific farming needs</p>
                </div>
              </div>
            </div>
            
            <a href="#" class="btn btn-primary">
              <span>⭐</span>
              Star on GitHub
            </a>
          </div>
          <div class="github-stats">
            <div class="stat-card">
              <h3>1.2k+</h3>
              <p>GitHub Stars</p>
            </div>
            <div class="stat-card">
              <h3>150+</h3>
              <p>Contributors</p>
            </div>
            <div class="stat-card">
              <h3>50+</h3>
              <p>Forks</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  `;
}

export function initializeOpenSourceSection() {
  console.log('Open source section initialized');
}