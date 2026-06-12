// Animal Health Repository Page with Enhanced Health Cards
import { 
  createAnimalHealthCard, 
  createHealthTopicCard, 
  createQuickReferenceCard 
} from '../components/HealthCards.js';
import { 
  animalHealthData, 
  getAnimalsByCategory, 
  getFeaturedTopics, 
  getEmergencyReferences,
  searchHealthTopics 
} from '../store/animal-health.js';
import { trackEvent } from '../utils/analytics.js';

export function createAnimalHealthPage() {
  const featuredTopics = getFeaturedTopics();
  const emergencyReferences = getEmergencyReferences();
  
  return `
    <div class="animal-health-page">
      <!-- Hero Section -->
      <section class="animal-health-hero">
        <div class="container">
          <div class="hero-content">
            <h1>🏥 Animal Health Repository</h1>
            <p class="hero-tagline">Comprehensive health information for all your animals</p>
            <p class="hero-description">
              Expert-curated health guides, emergency references, and professional resources 
              to keep your animals healthy and thriving. Find information by animal type, 
              health topic, or browse our emergency quick references.
            </p>
            <div class="hero-actions">
              <button class="btn btn-primary" onclick="scrollToHealthTopics()">
                Browse Health Topics
              </button>
              <a href="#services" class="btn btn-secondary">
                🏪 Find Local Services
              </a>
            </div>
          </div>
        </div>
      </section>

      <!-- Health Search -->
      <section class="health-search-section">
        <div class="container">
          <div class="health-search">
            <input type="text" 
                   id="health-search-input" 
                   placeholder="Search health topics, symptoms, or treatments..." 
                   class="search-input"
                   onkeyup="handleHealthSearch()">
            <button class="search-btn" onclick="performHealthSearch()">
              🔍
            </button>
          </div>
        </div>
      </section>

      <!-- Emergency Quick References -->
      <section class="emergency-references" id="emergency-references">
        <div class="container">
          <div class="section-header">
            <h2>🚨 Emergency Quick References</h2>
            <p>Critical information for emergency situations</p>
          </div>
          <div class="emergency-grid">
            ${emergencyReferences.map(ref => createQuickReferenceCard(ref)).join('')}
          </div>
        </div>
      </section>

      <!-- Featured Health Topics -->
      <section class="featured-topics" id="featured-topics">
        <div class="container">
          <div class="section-header">
            <h2>📚 Featured Health Topics</h2>
            <p>Most popular and essential health information</p>
          </div>
          <div class="topics-grid">
            ${featuredTopics.map(topic => createHealthTopicCard(topic)).join('')}
          </div>
        </div>
      </section>

      <!-- Animal Care Overview -->
      <section class="animals-overview" id="animals-overview">
        <div class="container">
          <div class="section-header">
            <h2>🐾 Animal Care Overview</h2>
            <p>Browse health information by animal type</p>
          </div>
          
          <div class="health-category-filters">
            <button class="category-filter-btn active" onclick="filterAnimalsByCategory('all')">
              All Animals
            </button>
            <button class="category-filter-btn" onclick="filterAnimalsByCategory('livestock')">
              🐄 Livestock
            </button>
            <button class="category-filter-btn" onclick="filterAnimalsByCategory('poultry')">
              🐓 Poultry
            </button>
            <button class="category-filter-btn" onclick="filterAnimalsByCategory('small-animals')">
              🐰 Small Animals
            </button>
          </div>
          
          <div id="animals-health-grid" class="animals-health-grid">
            ${animalHealthData.animals.map(animal => createAnimalHealthCard(animal)).join('')}
          </div>
        </div>
      </section>

      <!-- Health Topics Library -->
      <section class="health-topics-library" id="health-topics">
        <div class="container">
          <div class="section-header">
            <h2>📖 Health Topics Library</h2>
            <p>Complete collection of health guides and information</p>
          </div>
          
          <div class="topics-filters">
            <button class="filter-btn active" onclick="filterTopicsByCategory('all')">
              All Topics
            </button>
            ${animalHealthData.categories.map(cat => `
              <button class="filter-btn" onclick="filterTopicsByCategory('${cat.id}')">
                ${cat.icon} ${cat.name}
              </button>
            `).join('')}
          </div>
          
          <div id="health-topics-grid" class="health-topics-grid">
            ${animalHealthData.healthTopics.map(topic => createHealthTopicCard(topic)).join('')}
          </div>
        </div>
      </section>

      <!-- Professional Resources -->
      <section class="professional-resources">
        <div class="container">
          <div class="section-header">
            <h2>👨‍⚕️ Professional Resources</h2>
            <p>Connect with veterinarians and animal health professionals</p>
          </div>
          
          <div class="resources-grid">
            <div class="resource-card">
              <div class="resource-icon">🏥</div>
              <h3>Find Local Veterinarians</h3>
              <p>Connect with qualified veterinarians in your area for professional health care.</p>
              <a href="#services" class="btn btn-primary" data-category="veterinary">
                Find Vets
              </a>
            </div>
            
            <div class="resource-card">
              <div class="resource-icon">🚨</div>
              <h3>Emergency Animal Hospitals</h3>
              <p>24/7 emergency care facilities for critical situations and urgent medical needs.</p>
              <a href="#services" class="btn btn-primary" data-category="hospitals">
                Emergency Care
              </a>
            </div>
            
            <div class="resource-card">
              <div class="resource-icon">💊</div>
              <h3>Animal Pharmacies & Supplies</h3>
              <p>Find medical supplies, medications, and health products for your animals.</p>
              <a href="#services" class="btn btn-primary" data-category="supplies">
                Find Supplies
              </a>
            </div>
            
            <div class="resource-card">
              <div class="resource-icon">🎓</div>
              <h3>Animal Training Services</h3>
              <p>Professional training services for behavior modification and skill development.</p>
              <a href="#services" class="btn btn-primary" data-category="training">
                Find Trainers
              </a>
            </div>
            
            <div class="resource-card">
              <div class="resource-icon">🌹</div>
              <h3>Memorial Services</h3>
              <p>Compassionate memorial and burial services for end-of-life care.</p>
              <a href="#services" class="btn btn-primary" data-category="funeral">
                Memorial Services
              </a>
            </div>
            
            <div class="resource-card">
              <div class="resource-icon">📱</div>
              <h3>Telemedicine Consultations</h3>
              <p>Remote veterinary consultations and digital health monitoring services.</p>
              <button class="btn btn-secondary" onclick="openTelemedInfo()">
                Learn More
              </button>
            </div>
          </div>
        </div>
      </section>

      <!-- Call to Action -->
      <section class="health-cta">
        <div class="container">
          <div class="cta-content">
            <h2>🤝 Need Professional Help?</h2>
            <p>
              While our health guides provide valuable information, always consult with 
              qualified veterinarians for professional diagnosis and treatment.
            </p>
            <div class="cta-actions">
              <a href="#services" class="btn btn-primary btn-large">
                Find Local Services
              </a>
              <a href="#contact" class="btn btn-secondary btn-large">
                Contact Support
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  `;
}

// Page Initialization
export function initializeAnimalHealthPage() {
  // Store data globally for filtering functions
  window.currentAnimals = animalHealthData.animals;
  window.currentTopics = animalHealthData.healthTopics;
  
  // Set up search functionality
  setupHealthSearch();
  
  // Track page view
  trackEvent('page_view', 'animal_health', 'visited');
  
  console.log('Animal Health page initialized');
}

function setupHealthSearch() {
  let searchTimeout;
  window.handleHealthSearch = function() {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      performHealthSearch();
    }, 300);
  };
}

// Interactive Functions
window.scrollToHealthTopics = function() {
  document.getElementById('health-topics').scrollIntoView({ 
    behavior: 'smooth' 
  });
  trackEvent('animal_health', 'navigation', 'health_topics');
};

window.performHealthSearch = function() {
  const query = document.getElementById('health-search-input')?.value || '';
  if (query.length < 2) return;
  
  const results = searchHealthTopics(query);
  updateTopicsDisplay(results);
  
  trackEvent('animal_health', 'search', query);
};

window.filterAnimalsByCategory = function(category) {
  // Update active filter button
  document.querySelectorAll('.category-filter-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  event.target.classList.add('active');
  
  // Filter animals
  const filteredAnimals = category === 'all' 
    ? animalHealthData.animals 
    : getAnimalsByCategory(category);
  
  updateAnimalsDisplay(filteredAnimals);
  trackEvent('animal_health', 'filter_animals', category);
};

window.filterTopicsByCategory = function(category) {
  // Update active filter button
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  event.target.classList.add('active');
  
  // Filter topics
  const filteredTopics = category === 'all' 
    ? animalHealthData.healthTopics 
    : animalHealthData.healthTopics.filter(topic => topic.category === category);
  
  updateTopicsDisplay(filteredTopics);
  trackEvent('animal_health', 'filter_topics', category);
};

window.openTelemedInfo = function() {
  alert('Telemedicine services: Virtual consultations with licensed veterinarians. Available through our partner network. Contact us for more information.');
  trackEvent('animal_health', 'telemedicine_interest', 'clicked');
};

function updateAnimalsDisplay(animals) {
  const grid = document.getElementById('animals-health-grid');
  if (grid) {
    grid.innerHTML = animals.map(animal => createAnimalHealthCard(animal)).join('');
    window.currentAnimals = animals;
  }
}

function updateTopicsDisplay(topics) {
  const grid = document.getElementById('health-topics-grid');
  if (grid) {
    grid.innerHTML = topics.map(topic => createHealthTopicCard(topic)).join('');
    window.currentTopics = topics;
  }
}
