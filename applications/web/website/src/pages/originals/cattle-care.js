// Cattle Care Application Page with Enhanced Health Cards
import { 
  createHealthTopicCard, 
  createQuickReferenceCard 
} from '../components/HealthCards.js';
import { trackEvent } from '../utils/analytics.js';

export function createCattleCarePage() {
  const cattleHealthTopics = [
    {
      id: 'cattle-nutrition',
      title: 'Cattle Nutrition Essentials',
      summary: 'Complete guide to cattle feeding, pasture management, and nutritional requirements.',
      category: 'nutrition',
      categoryName: 'Nutrition',
      difficulty: 'medium',
      difficultyText: 'Medium',
      icon: '🌾',
      readTime: 12,
      lastUpdated: '3 days ago'
    },
    {
      id: 'cattle-breeding',
      title: 'Breeding Management',
      summary: 'Comprehensive breeding programs, pregnancy care, and calf management strategies.',
      category: 'breeding',
      categoryName: 'Breeding',
      difficulty: 'hard',
      difficultyText: 'Hard',
      icon: '🐄',
      readTime: 18,
      lastUpdated: '1 week ago'
    },
    {
      id: 'cattle-health-monitoring',
      title: 'Health Monitoring Systems',
      summary: 'Smart monitoring technology for early disease detection and herd health management.',
      category: 'health',
      categoryName: 'Health',
      difficulty: 'medium',
      difficultyText: 'Medium',
      icon: '📊',
      readTime: 10,
      lastUpdated: '2 days ago'
    }
  ];

  const cattleReferences = [
    {
      id: 'cattle-emergency',
      title: 'Cattle Emergency Signs',
      summary: 'Critical signs requiring immediate veterinary attention.',
      urgency: 'emergency',
      urgencyIcon: '🚨',
      details: [
        { label: 'Body Temperature', value: 'Normal 101.5°F (38.6°C)' },
        { label: 'Heart Rate', value: '60-70 beats/min' },
        { label: 'Emergency Signs', value: 'Difficulty breathing, bloat' }
      ]
    },
    {
      id: 'cattle-feeding',
      title: 'Daily Feeding Guidelines',
      summary: 'Nutritional requirements and feeding schedules for cattle.',
      urgency: 'normal',
      urgencyIcon: '🍽️',
      details: [
        { label: 'Daily Feed', value: '2-3% of body weight' },
        { label: 'Water', value: '30-50 gallons per day' },
        { label: 'Pasture', value: '0.5-2 acres per head' }
      ]
    }
  ];

  return `
    <div class="app-page cattle-care-page">
      <!-- Hero Section -->
      <section class="app-hero cattle-hero">
        <div class="container">
          <div class="app-hero-content">
            <div class="app-hero-text">
              <div class="app-status-badge available">Available Now</div>
              <h1>Cattle Care</h1>
              <p class="app-tagline">Comprehensive cattle management and health monitoring</p>
              <p class="app-description">
                Advanced herd management system with GPS tracking, health monitoring, grazing optimization, 
                and breeding management. Designed for modern ranchers and cattle operations of all sizes.
              </p>
              <div class="app-hero-buttons">
                <button class="btn btn-primary btn-large" onclick="navigateTo('store')">
                  Shop System - $4,999
                </button>
                <button class="btn btn-secondary btn-large" onclick="scrollToHealthGuides()">
                  Health Guides
                </button>
                <button class="btn btn-outline btn-large" onclick="navigateTo('services?category=veterinary')">
                  🏥 Find Local Vets
                </button>
              </div>
            </div>
            <div class="app-hero-image">
              <img src="https://images.pexels.com/photos/422218/pexels-photo-422218.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop" alt="Cattle Care System">
            </div>
          </div>
        </div>
      </section>

      <!-- Quick Health References -->
      <section class="cattle-health-refs" id="health-references">
        <div class="container">
          <div class="section-header">
            <h2>🐄 Cattle Health Quick References</h2>
            <p>Essential information for cattle health management</p>
          </div>
          <div class="references-grid">
            ${cattleReferences.map(ref => createQuickReferenceCard(ref)).join('')}
          </div>
        </div>
      </section>

      <!-- Health Topics -->
      <section class="cattle-health-topics" id="health-guides">
        <div class="container">
          <div class="section-header">
            <h2>Cattle Health & Care Topics</h2>
            <p>Comprehensive guides for optimal cattle management</p>
          </div>
          <div class="topics-grid">
            ${cattleHealthTopics.map(topic => createHealthTopicCard(topic)).join('')}
          </div>
        </div>
      </section>

      <!-- Features Section -->
      <section class="app-features cattle-features">
        <div class="container">
          <h2>Cattle Care System Features</h2>
          <div class="features-grid">
            <div class="feature-card">
              <div class="feature-icon">🐄</div>
              <h3>Individual Cattle Profiles</h3>
              <p>Comprehensive profiles with ID tracking, breeding records, health history, and performance metrics for each animal.</p>
              <div class="feature-details">
                <ul>
                  <li>RFID/EID tag integration</li>
                  <li>Genealogy tracking</li>
                  <li>Weight gain monitoring</li>
                  <li>Medical history logs</li>
                </ul>
              </div>
            </div>
            
            <div class="feature-card">
              <div class="feature-icon">📍</div>
              <h3>GPS Tracking & Geofencing</h3>
              <p>Real-time location monitoring with geofencing alerts and movement pattern analysis for optimal grazing management.</p>
              <div class="feature-details">
                <ul>
                  <li>Real-time GPS tracking</li>
                  <li>Custom geofence setup</li>
                  <li>Grazing pattern analysis</li>
                  <li>Theft prevention alerts</li>
                </ul>
              </div>
            </div>
            
            <div class="feature-card">
              <div class="feature-icon">🏥</div>
              <h3>Health Monitoring</h3>
              <p>Continuous health monitoring with early disease detection, temperature tracking, and automated health alerts.</p>
              <div class="feature-details">
                <ul>
                  <li>Body temperature monitoring</li>
                  <li>Activity level tracking</li>
                  <li>Eating pattern analysis</li>
                  <li>Disease outbreak detection</li>
                </ul>
              </div>
            </div>
            
            <div class="feature-card">
              <div class="feature-icon">🌱</div>
              <h3>Pasture Management</h3>
              <p>Intelligent pasture rotation planning, grass condition monitoring, and optimal grazing recommendations.</p>
              <div class="feature-details">
                <ul>
                  <li>Grass condition assessment</li>
                  <li>Rotation scheduling</li>
                  <li>Carrying capacity calculation</li>
                  <li>Seasonal planning tools</li>
                </ul>
              </div>
            </div>
            
            <div class="feature-card">
              <div class="feature-icon">📊</div>
              <h3>Analytics Dashboard</h3>
              <p>Comprehensive analytics with performance insights, financial tracking, and predictive recommendations.</p>
              <div class="feature-details">
                <ul>
                  <li>Herd performance metrics</li>
                  <li>Financial analytics</li>
                  <li>Market price integration</li>
                  <li>Predictive insights</li>
                </ul>
              </div>
            </div>
            
            <div class="feature-card">
              <div class="feature-icon">💝</div>
              <h3>Breeding Management</h3>
              <p>Complete breeding program management with estrus detection, pregnancy tracking, and genetic optimization.</p>
              <div class="feature-details">
                <ul>
                  <li>Estrus cycle monitoring</li>
                  <li>Pregnancy confirmation</li>
                  <li>Genetic matching algorithms</li>
                  <li>Calving predictions</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Technology Integration -->
      <section class="tech-integration">
        <div class="container">
          <div class="section-header">
            <h2>Smart Technology Integration</h2>
            <p>Cutting-edge technology for modern cattle operations</p>
          </div>
          
          <div class="tech-grid">
            <div class="tech-card">
              <div class="tech-icon">📡</div>
              <h3>IoT Sensor Network</h3>
              <p>Advanced sensor network for comprehensive cattle monitoring</p>
              <div class="tech-specs">
                <div class="spec">
                  <span class="spec-label">Range:</span>
                  <span class="spec-value">Up to 5 miles</span>
                </div>
                <div class="spec">
                  <span class="spec-label">Battery Life:</span>
                  <span class="spec-value">2+ years</span>
                </div>
                <div class="spec">
                  <span class="spec-label">Data Points:</span>
                  <span class="spec-value">50+ metrics</span>
                </div>
              </div>
            </div>
            
            <div class="tech-card">
              <div class="tech-icon">🤖</div>
              <h3>AI Health Analysis</h3>
              <p>Machine learning algorithms for predictive health insights</p>
              <div class="tech-specs">
                <div class="spec">
                  <span class="spec-label">Accuracy:</span>
                  <span class="spec-value">95%+ prediction</span>
                </div>
                <div class="spec">
                  <span class="spec-label">Early Detection:</span>
                  <span class="spec-value">3-7 days advance</span>
                </div>
                <div class="spec">
                  <span class="spec-label">Learning:</span>
                  <span class="spec-value">Continuous improvement</span>
                </div>
              </div>
            </div>
            
            <div class="tech-card">
              <div class="tech-icon">📱</div>
              <h3>Mobile Management</h3>
              <p>Complete farm management from your smartphone</p>
              <div class="tech-specs">
                <div class="spec">
                  <span class="spec-label">Platforms:</span>
                  <span class="spec-value">iOS & Android</span>
                </div>
                <div class="spec">
                  <span class="spec-label">Offline Mode:</span>
                  <span class="spec-value">Full functionality</span>
                </div>
                <div class="spec">
                  <span class="spec-label">Sync:</span>
                  <span class="spec-value">Real-time cloud</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Pricing and Packages -->
      <section class="pricing-section">
        <div class="container">
          <div class="section-header">
            <h2>Cattle Care Packages</h2>
            <p>Choose the perfect solution for your herd size and needs</p>
          </div>
          
          <div class="pricing-grid">
            <div class="pricing-card">
              <div class="price-header">
                <h3>Starter Pack</h3>
                <div class="price">$2,499</div>
                <div class="price-subtitle">Up to 50 head</div>
              </div>
              <div class="price-features">
                <ul>
                  <li>✅ 50 smart sensors</li>
                  <li>✅ Basic health monitoring</li>
                  <li>✅ GPS tracking</li>
                  <li>✅ Mobile app access</li>
                  <li>✅ 1-year warranty</li>
                </ul>
              </div>
              <button class="btn btn-secondary">Choose Starter</button>
            </div>
            
            <div class="pricing-card featured">
              <div class="featured-badge">Most Popular</div>
              <div class="price-header">
                <h3>Professional Pack</h3>
                <div class="price">$4,999</div>
                <div class="price-subtitle">Up to 200 head</div>
              </div>
              <div class="price-features">
                <ul>
                  <li>✅ 200 smart sensors</li>
                  <li>✅ Advanced health analytics</li>
                  <li>✅ Breeding management</li>
                  <li>✅ Pasture optimization</li>
                  <li>✅ 2-year warranty</li>
                  <li>✅ Priority support</li>
                </ul>
              </div>
              <button class="btn btn-primary">Choose Professional</button>
            </div>
            
            <div class="pricing-card">
              <div class="price-header">
                <h3>Enterprise Pack</h3>
                <div class="price">$9,999</div>
                <div class="price-subtitle">500+ head</div>
              </div>
              <div class="price-features">
                <ul>
                  <li>✅ Unlimited sensors</li>
                  <li>✅ Complete farm management</li>
                  <li>✅ Custom integrations</li>
                  <li>✅ On-site training</li>
                  <li>✅ 3-year warranty</li>
                  <li>✅ 24/7 support</li>
                </ul>
              </div>
              <button class="btn btn-secondary">Contact Sales</button>
            </div>
          </div>
        </div>
      </section>
    </div>
  `;
}

// Page Initialization
export function initializeCattleCarePage() {
  // Track page view
  trackEvent('page_view', 'cattle_care', 'visited');
  
  // Initialize any interactive features
  console.log('Cattle Care page initialized');
}

// Interactive Functions
window.scrollToHealthGuides = function() {
  document.getElementById('health-guides').scrollIntoView({ 
    behavior: 'smooth' 
  });
  trackEvent('cattle_care', 'navigation', 'health_guides');
};
