// Service Provider Card Components
import { trackEvent } from '../utils/analytics.js';

export function createServiceCard(service) {
  const categoryInfo = getCategoryInfo(service.category);
  const distanceText = service.distance ? `${service.distance.toFixed(1)} mi` : '';
  const isEmergency = service.emergencyContact || service.hours.includes('24');
  
  return `
    <div class="service-card" data-category="${service.category}" data-service-id="${service.id}">
      <div class="service-header">
        <div class="service-icon" style="background-color: ${categoryInfo.color}">
          ${categoryInfo.icon}
        </div>
        <div class="service-info">
          <h3 class="service-name">${service.name}</h3>
          <div class="service-category">${categoryInfo.name}</div>
          ${distanceText ? `<div class="service-distance">📍 ${distanceText}</div>` : ''}
        </div>
        ${isEmergency ? '<div class="emergency-badge">🚨 Emergency</div>' : ''}
      </div>
      
      <div class="service-body">
        <div class="service-rating">
          <div class="rating-stars">
            ${generateStars(service.rating)}
          </div>
          <span class="rating-text">${service.rating} (${service.reviews} reviews)</span>
        </div>
        
        <div class="service-contact">
          <div class="contact-item">
            <span class="contact-icon">📞</span>
            <a href="tel:${service.phone}" onclick="trackServiceClick('${service.id}', 'phone')">${service.phone}</a>
          </div>
          <div class="contact-item">
            <span class="contact-icon">📍</span>
            <span class="address">${service.address}</span>
          </div>
          <div class="contact-item">
            <span class="contact-icon">🕒</span>
            <span class="hours">${service.hours}</span>
          </div>
        </div>
        
        <div class="service-specialties">
          <h4>Specialties:</h4>
          <div class="specialty-tags">
            ${service.specialties.map(specialty => 
              `<span class="specialty-tag">${specialty}</span>`
            ).join('')}
          </div>
        </div>
        
        ${service.packages ? `
          <div class="service-packages">
            <h4>Packages:</h4>
            <ul class="package-list">
              ${service.packages.map(pkg => `<li>${pkg}</li>`).join('')}
            </ul>
          </div>
        ` : ''}
      </div>
      
      <div class="service-actions">
        <button class="btn btn-primary" onclick="visitService('${service.id}')">
          Visit Website
        </button>
        <button class="btn btn-secondary" onclick="getDirections('${service.coordinates.lat}', '${service.coordinates.lng}')">
          Get Directions
        </button>
        ${service.emergencyContact ? `
          <button class="btn btn-emergency" onclick="callEmergency('${service.emergencyContact}')">
            Emergency Contact
          </button>
        ` : ''}
      </div>
    </div>
  `;
}

export function createServiceCategoryCard(category) {
  return `
    <div class="category-card" onclick="filterByCategory('${category.id}')">
      <div class="category-icon" style="background-color: ${category.color}">
        ${category.icon}
      </div>
      <h3 class="category-name">${category.name}</h3>
      <p class="category-description">${category.description}</p>
      <div class="category-arrow">→</div>
    </div>
  `;
}

export function createEmergencyServiceCard(service) {
  return `
    <div class="emergency-service-card" data-service-id="${service.id}">
      <div class="emergency-header">
        <div class="emergency-icon">🚨</div>
        <div class="emergency-info">
          <h3>${service.name}</h3>
          <div class="emergency-type">${service.category === 'hospitals' ? 'Animal Hospital' : 'Veterinary Clinic'}</div>
        </div>
      </div>
      
      <div class="emergency-contact">
        <a href="tel:${service.emergencyContact || service.phone}" class="emergency-call-btn">
          📞 Call Now: ${service.emergencyContact || service.phone}
        </a>
      </div>
      
      <div class="emergency-details">
        <div class="detail-item">
          <strong>Address:</strong> ${service.address}
        </div>
        <div class="detail-item">
          <strong>Hours:</strong> ${service.hours}
        </div>
        <div class="detail-item">
          <strong>Specialties:</strong> ${service.specialties.slice(0, 2).join(', ')}
        </div>
      </div>
      
      <div class="emergency-actions">
        <button class="btn btn-emergency" onclick="callEmergency('${service.emergencyContact || service.phone}')">
          Emergency Call
        </button>
        <button class="btn btn-secondary" onclick="getDirections('${service.coordinates.lat}', '${service.coordinates.lng}')">
          Directions
        </button>
      </div>
    </div>
  `;
}

export function createMapSearchWidget() {
  return `
    <div class="map-search-widget">
      <div class="search-header">
        <h3>🗺️ Find Services Near You</h3>
        <p>Search for local service providers in your area</p>
      </div>
      
      <div class="location-input">
        <input type="text" 
               id="location-search" 
               placeholder="Enter your zip code or city" 
               class="location-field">
        <button class="btn btn-primary" onclick="searchByLocation()">
          Search Area
        </button>
        <button class="btn btn-secondary" onclick="useCurrentLocation()">
          📍 Use My Location
        </button>
      </div>
      
      <div class="search-filters">
        <select id="service-category-filter" onchange="updateServiceFilter()">
          <option value="">All Services</option>
          <option value="veterinary">Veterinary Services</option>
          <option value="hospitals">Animal Hospitals</option>
          <option value="funeral">Memorial Services</option>
          <option value="supplies">Feed & Supplies</option>
          <option value="training">Training Services</option>
        </select>
        
        <select id="distance-filter" onchange="updateDistanceFilter()">
          <option value="10">Within 10 miles</option>
          <option value="25" selected>Within 25 miles</option>
          <option value="50">Within 50 miles</option>
          <option value="100">Within 100 miles</option>
        </select>
      </div>
      
      <div id="map-placeholder" class="map-placeholder">
        <div class="map-coming-soon">
          <div class="map-icon">🗺️</div>
          <h4>Interactive Map Coming Soon</h4>
          <p>We're working on an interactive map feature to help you visualize service locations.</p>
        </div>
      </div>
    </div>
  `;
}

// Helper Functions
function getCategoryInfo(categoryId) {
  const categories = {
    'veterinary': { name: 'Veterinary Services', icon: '🏥', color: '#e74c3c' },
    'funeral': { name: 'Pet Memorial Services', icon: '🌹', color: '#8e44ad' },
    'hospitals': { name: 'Animal Hospitals', icon: '🏨', color: '#3498db' },
    'grooming': { name: 'Grooming & Care', icon: '✂️', color: '#f39c12' },
    'boarding': { name: 'Boarding & Daycare', icon: '🏠', color: '#27ae60' },
    'training': { name: 'Training Services', icon: '🎯', color: '#e67e22' },
    'supplies': { name: 'Feed & Supplies', icon: '🛒', color: '#95a5a6' },
    'transport': { name: 'Animal Transport', icon: '🚛', color: '#2c3e50' }
  };
  return categories[categoryId] || { name: 'Other Services', icon: '🔧', color: '#95a5a6' };
}

function generateStars(rating) {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
  
  return '★'.repeat(fullStars) + 
         (hasHalfStar ? '☆' : '') + 
         '☆'.repeat(emptyStars);
}

// Global Functions for Interaction
window.trackServiceClick = function(serviceId, action) {
  trackEvent('service_interaction', action, serviceId);
};

window.visitService = function(serviceId) {
  const service = window.currentServices?.find(s => s.id === serviceId);
  if (service) {
    // Track affiliate click
    trackEvent('affiliate_click', 'website_visit', service.affiliateId);
    // Open with affiliate tracking
    window.open(`${service.website}?ref=tendercells&affiliate=${service.affiliateId}`, '_blank');
  }
};

window.getDirections = function(lat, lng) {
  const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
  window.open(url, '_blank');
  trackEvent('service_interaction', 'directions', 'google_maps');
};

window.callEmergency = function(phone) {
  window.location.href = `tel:${phone}`;
  trackEvent('service_interaction', 'emergency_call', phone);
};

window.filterByCategory = function(categoryId) {
  const event = new CustomEvent('categoryFilter', { detail: categoryId });
  document.dispatchEvent(event);
  trackEvent('service_filter', 'category', categoryId);
};

window.searchByLocation = function() {
  const location = document.getElementById('location-search').value;
  if (location) {
    // TODO: Implement geocoding and location search
    console.log('Searching for services near:', location);
    trackEvent('service_search', 'location', location);
  }
};

window.useCurrentLocation = function() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(function(position) {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      // TODO: Use coordinates to find nearby services
      console.log('Current location:', lat, lng);
      trackEvent('service_search', 'current_location', `${lat},${lng}`);
    });
  }
};
