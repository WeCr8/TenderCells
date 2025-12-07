// Enhanced Service Search Component with Google Maps Integration
import mapsService from '../utils/googleMaps.js';
import { searchServices, getServicesNearLocation } from '../store/services.js';

class ServiceSearchManager {
    constructor() {
        this.searchContainer = null;
        this.mapContainer = null;
        this.resultsContainer = null;
        this.currentSearchResults = [];
        this.activeFilters = {
            serviceType: 'all',
            radius: 25,
            rating: 0,
            priceRange: 'all',
            openNow: false,
            emergencyOnly: false
        };
    }

    // Initialize the search interface
    init(containerId) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error('Search container not found');
            return;
        }

        container.innerHTML = this.createSearchInterface();
        this.bindSearchEvents();
        this.initializeMap();
    }

    // Create the search interface HTML
    createSearchInterface() {
        return `
            <div class="service-search-container">
                <!-- Search Header -->
                <div class="search-header">
                    <h2>🔍 Find Local Services</h2>
                    <p>Discover trusted animal care providers near you</p>
                </div>

                <!-- Search Controls -->
                <div class="search-controls">
                    <div class="search-row">
                        <!-- Location Search -->
                        <div class="search-field">
                            <label for="location-input">📍 Location</label>
                            <div class="location-input-group">
                                <input 
                                    type="text" 
                                    id="location-input" 
                                    placeholder="Enter address, city, or ZIP code"
                                    class="search-input"
                                />
                                <button id="use-current-location" class="location-btn" title="Use current location">
                                    🎯
                                </button>
                            </div>
                        </div>

                        <!-- Service Type Filter -->
                        <div class="search-field">
                            <label for="service-type">🏥 Service Type</label>
                            <select id="service-type" class="search-select">
                                <option value="all">All Services</option>
                                <option value="veterinary">Veterinary Clinics</option>
                                <option value="emergency">Emergency Hospitals</option>
                                <option value="pharmacy">Pet Pharmacies</option>
                                <option value="cremation">Cremation Services</option>
                                <option value="boarding">Boarding Facilities</option>
                                <option value="grooming">Grooming Services</option>
                                <option value="training">Training Centers</option>
                                <option value="supplies">Pet Supplies</option>
                            </select>
                        </div>

                        <!-- Search Button -->
                        <div class="search-field">
                            <button id="search-services" class="search-btn">
                                🔍 Search Services
                            </button>
                        </div>
                    </div>

                    <!-- Advanced Filters -->
                    <div class="advanced-filters" id="advanced-filters">
                        <div class="filter-row">
                            <!-- Distance Filter -->
                            <div class="filter-field">
                                <label for="radius-filter">📏 Within</label>
                                <select id="radius-filter" class="filter-select">
                                    <option value="5">5 miles</option>
                                    <option value="10">10 miles</option>
                                    <option value="25" selected>25 miles</option>
                                    <option value="50">50 miles</option>
                                    <option value="100">100 miles</option>
                                </select>
                            </div>

                            <!-- Rating Filter -->
                            <div class="filter-field">
                                <label for="rating-filter">⭐ Min Rating</label>
                                <select id="rating-filter" class="filter-select">
                                    <option value="0">Any Rating</option>
                                    <option value="3">3+ Stars</option>
                                    <option value="4">4+ Stars</option>
                                    <option value="4.5">4.5+ Stars</option>
                                </select>
                            </div>

                            <!-- Price Filter -->
                            <div class="filter-field">
                                <label for="price-filter">💰 Price Range</label>
                                <select id="price-filter" class="filter-select">
                                    <option value="all">Any Price</option>
                                    <option value="1">$ Budget</option>
                                    <option value="2">$$ Moderate</option>
                                    <option value="3">$$$ Premium</option>
                                    <option value="4">$$$$ Luxury</option>
                                </select>
                            </div>

                            <!-- Availability Filter -->
                            <div class="filter-field">
                                <label class="checkbox-label">
                                    <input type="checkbox" id="open-now" class="filter-checkbox">
                                    <span class="checkmark">🟢 Open Now</span>
                                </label>
                            </div>

                            <!-- Emergency Filter -->
                            <div class="filter-field">
                                <label class="checkbox-label">
                                    <input type="checkbox" id="emergency-only" class="filter-checkbox">
                                    <span class="checkmark">🚨 Emergency Only</span>
                                </label>
                            </div>
                        </div>
                    </div>

                    <button id="toggle-filters" class="toggle-filters-btn">
                        ⚙️ Advanced Filters
                    </button>
                </div>

                <!-- Search Results Layout -->
                <div class="search-results-layout">
                    <!-- Map Container -->
                    <div class="map-section">
                        <div id="services-map" class="services-map"></div>
                        <div class="map-controls">
                            <button id="recenter-map" class="map-control-btn">📍 Recenter</button>
                            <button id="toggle-satellite" class="map-control-btn">🛰️ Satellite</button>
                            <button id="directions-mode" class="map-control-btn">🧭 Directions</button>
                        </div>
                    </div>

                    <!-- Results List -->
                    <div class="results-section">
                        <div class="results-header">
                            <h3 id="results-count">Search for services to see results</h3>
                            <div class="sort-controls">
                                <label for="sort-by">Sort by:</label>
                                <select id="sort-by" class="sort-select">
                                    <option value="distance">Distance</option>
                                    <option value="rating">Rating</option>
                                    <option value="name">Name</option>
                                    <option value="price">Price</option>
                                </select>
                            </div>
                        </div>
                        <div id="search-results" class="search-results"></div>
                        
                        <!-- Load More Button -->
                        <div class="load-more-container">
                            <button id="load-more-results" class="load-more-btn" style="display: none;">
                                Load More Results
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Search Status -->
                <div id="search-status" class="search-status" style="display: none;">
                    <div class="status-content">
                        <div class="loading-spinner"></div>
                        <span class="status-text">Searching for services...</span>
                    </div>
                </div>
            </div>
        `;
    }

    // Bind search event handlers
    bindSearchEvents() {
        // Search button
        document.getElementById('search-services').addEventListener('click', () => {
            this.performSearch();
        });

        // Use current location
        document.getElementById('use-current-location').addEventListener('click', () => {
            this.useCurrentLocation();
        });

        // Advanced filters toggle
        document.getElementById('toggle-filters').addEventListener('click', () => {
            this.toggleAdvancedFilters();
        });

        // Filter changes
        document.getElementById('service-type').addEventListener('change', () => {
            this.updateFilters();
        });

        document.getElementById('radius-filter').addEventListener('change', () => {
            this.updateFilters();
        });

        document.getElementById('rating-filter').addEventListener('change', () => {
            this.updateFilters();
        });

        document.getElementById('price-filter').addEventListener('change', () => {
            this.updateFilters();
        });

        document.getElementById('open-now').addEventListener('change', () => {
            this.updateFilters();
        });

        document.getElementById('emergency-only').addEventListener('change', () => {
            this.updateFilters();
        });

        // Sort changes
        document.getElementById('sort-by').addEventListener('change', () => {
            this.sortResults();
        });

        // Map controls
        document.getElementById('recenter-map').addEventListener('click', () => {
            this.recenterMap();
        });

        document.getElementById('toggle-satellite').addEventListener('click', () => {
            this.toggleMapType();
        });

        // Enter key search
        document.getElementById('location-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.performSearch();
            }
        });

        // Load more results
        document.getElementById('load-more-results').addEventListener('click', () => {
            this.loadMoreResults();
        });
    }

    // Initialize Google Maps
    async initializeMap() {
        try {
            await mapsService.initializeMap('services-map');
            console.log('Service search map initialized');
        } catch (error) {
            console.error('Failed to initialize map:', error);
            this.showMapError();
        }
    }

    // Perform service search
    async performSearch() {
        try {
            this.showSearchStatus('Searching for services...');
            
            const location = document.getElementById('location-input').value.trim();
            const serviceType = this.activeFilters.serviceType;

            let searchResults = [];

            if (location) {
                // Search by address using Google Maps
                searchResults = await mapsService.searchServicesByAddress(location, serviceType);
            } else {
                // Search using current location or default location
                searchResults = await mapsService.searchServicesNear({
                    serviceType: serviceType,
                    radius: this.activeFilters.radius * 1000
                });
            }

            // Also search our local database
            const localResults = searchServices(serviceType === 'all' ? '' : serviceType);
            
            // Combine and deduplicate results
            this.currentSearchResults = this.combineSearchResults(searchResults, localResults);
            
            // Apply filters
            this.applyFilters();
            
            // Display results
            this.displaySearchResults();
            
            this.hideSearchStatus();

        } catch (error) {
            console.error('Search error:', error);
            this.showSearchError('Failed to search services. Please try again.');
        }
    }

    // Combine Google Maps and local search results
    combineSearchResults(googleResults, localResults) {
        const combined = [...googleResults];
        
        // Add local results that aren't already in Google results
        localResults.forEach(localService => {
            const isDuplicate = googleResults.some(googleResult => 
                this.isSimilarService(googleResult, localService)
            );
            
            if (!isDuplicate) {
                // Convert local service format to match Google format
                combined.push(this.convertLocalToGoogleFormat(localService));
            }
        });
        
        return combined;
    }

    // Check if services are similar (to avoid duplicates)
    isSimilarService(googleService, localService) {
        const nameMatch = googleService.name.toLowerCase().includes(localService.name.toLowerCase()) ||
                         localService.name.toLowerCase().includes(googleService.name.toLowerCase());
        
        const addressMatch = googleService.vicinity && localService.address &&
                           googleService.vicinity.toLowerCase().includes(localService.address.toLowerCase());
        
        return nameMatch || addressMatch;
    }

    // Convert local service format to Google format
    convertLocalToGoogleFormat(localService) {
        return {
            name: localService.name,
            vicinity: localService.address,
            rating: localService.rating,
            price_level: localService.priceLevel || 2,
            place_id: `local_${localService.id}`,
            formatted_phone_number: localService.phone,
            geometry: {
                location: {
                    lat: () => localService.lat,
                    lng: () => localService.lng
                }
            },
            types: [localService.category],
            opening_hours: localService.hours ? {
                open_now: this.isOpenNow(localService.hours)
            } : null,
            isLocal: true,
            affiliateId: localService.affiliateId,
            commission: localService.commission
        };
    }

    // Apply active filters to search results
    applyFilters() {
        this.currentSearchResults = this.currentSearchResults.filter(service => {
            // Rating filter
            if (this.activeFilters.rating > 0 && service.rating < this.activeFilters.rating) {
                return false;
            }
            
            // Price filter
            if (this.activeFilters.priceRange !== 'all' && 
                service.price_level !== parseInt(this.activeFilters.priceRange)) {
                return false;
            }
            
            // Open now filter
            if (this.activeFilters.openNow && 
                (!service.opening_hours || !service.opening_hours.open_now)) {
                return false;
            }
            
            // Emergency only filter
            if (this.activeFilters.emergencyOnly && 
                !service.types.includes('hospital') && 
                !service.name.toLowerCase().includes('emergency')) {
                return false;
            }
            
            return true;
        });
    }

    // Display search results
    displaySearchResults() {
        const resultsContainer = document.getElementById('search-results');
        const resultsCount = document.getElementById('results-count');
        
        resultsCount.textContent = `Found ${this.currentSearchResults.length} services`;
        
        if (this.currentSearchResults.length === 0) {
            resultsContainer.innerHTML = this.createNoResultsMessage();
            return;
        }
        
        resultsContainer.innerHTML = this.currentSearchResults
            .map(service => this.createServiceResultCard(service))
            .join('');
    }

    // Create service result card HTML
    createServiceResultCard(service) {
        const rating = service.rating || 0;
        const priceLevel = service.price_level ? '$'.repeat(service.price_level) : 'N/A';
        const distance = service.distance ? `${service.distance.toFixed(1)} mi` : '';
        const isOpen = service.opening_hours?.open_now;
        const commission = service.commission ? `${service.commission}% commission` : '';
        
        return `
            <div class="service-result-card" data-place-id="${service.place_id}">
                <div class="service-header">
                    <h4 class="service-name">${service.name}</h4>
                    <div class="service-badges">
                        ${isOpen !== undefined ? 
                            `<span class="status-badge ${isOpen ? 'open' : 'closed'}">
                                ${isOpen ? '🟢 Open' : '🔴 Closed'}
                            </span>` : ''
                        }
                        ${service.isLocal ? '<span class="local-badge">🏆 Partner</span>' : ''}
                        ${service.types.includes('hospital') ? '<span class="emergency-badge">🚨 Emergency</span>' : ''}
                    </div>
                </div>
                
                <div class="service-details">
                    <p class="service-address">📍 ${service.vicinity}</p>
                    <div class="service-metrics">
                        <span class="rating">⭐ ${rating > 0 ? rating.toFixed(1) : 'No rating'}</span>
                        <span class="price">${priceLevel}</span>
                        ${distance ? `<span class="distance">🚗 ${distance}</span>` : ''}
                    </div>
                    ${commission ? `<p class="commission-info">💰 ${commission}</p>` : ''}
                </div>
                
                <div class="service-actions">
                    <button class="action-btn primary" onclick="serviceSearch.selectService('${service.place_id}')">
                        📍 View on Map
                    </button>
                    <button class="action-btn secondary" onclick="serviceSearch.getDirections('${service.place_id}')">
                        🧭 Directions
                    </button>
                    ${service.formatted_phone_number ? 
                        `<button class="action-btn secondary" onclick="serviceSearch.callService('${service.formatted_phone_number}')">
                            📞 Call
                        </button>` : ''
                    }
                    ${service.isLocal && service.affiliateId ? 
                        `<button class="action-btn affiliate" onclick="serviceSearch.visitAffiliate('${service.affiliateId}')">
                            🔗 Visit Website
                        </button>` : ''
                    }
                </div>
            </div>
        `;
    }

    // Create no results message
    createNoResultsMessage() {
        return `
            <div class="no-results">
                <div class="no-results-icon">🔍</div>
                <h3>No services found</h3>
                <p>Try adjusting your search criteria or expanding your search radius.</p>
                <div class="no-results-suggestions">
                    <h4>Suggestions:</h4>
                    <ul>
                        <li>Try a different location or increase search radius</li>
                        <li>Remove some filters to see more results</li>
                        <li>Search for "veterinary" or "emergency" services</li>
                        <li>Check if location services are enabled</li>
                    </ul>
                </div>
            </div>
        `;
    }

    // Utility methods
    useCurrentLocation() {
        if (!navigator.geolocation) {
            alert('Geolocation is not supported by this browser.');
            return;
        }

        this.showSearchStatus('Getting your location...');
        
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                
                // Reverse geocode to get address
                this.reverseGeocode(lat, lng);
                
                this.hideSearchStatus();
            },
            (error) => {
                console.error('Geolocation error:', error);
                this.showSearchError('Could not get your location. Please enter an address manually.');
            }
        );
    }

    async reverseGeocode(lat, lng) {
        try {
            const response = await fetch(
                `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}`
            );
            const data = await response.json();
            
            if (data.results && data.results.length > 0) {
                const address = data.results[0].formatted_address;
                document.getElementById('location-input').value = address;
            }
        } catch (error) {
            console.error('Reverse geocoding error:', error);
        }
    }

    toggleAdvancedFilters() {
        const filtersContainer = document.getElementById('advanced-filters');
        const toggleBtn = document.getElementById('toggle-filters');
        
        if (filtersContainer.style.display === 'none' || !filtersContainer.style.display) {
            filtersContainer.style.display = 'block';
            toggleBtn.textContent = '⬆️ Hide Filters';
        } else {
            filtersContainer.style.display = 'none';
            toggleBtn.textContent = '⚙️ Advanced Filters';
        }
    }

    updateFilters() {
        this.activeFilters = {
            serviceType: document.getElementById('service-type').value,
            radius: parseInt(document.getElementById('radius-filter').value),
            rating: parseFloat(document.getElementById('rating-filter').value),
            priceRange: document.getElementById('price-filter').value,
            openNow: document.getElementById('open-now').checked,
            emergencyOnly: document.getElementById('emergency-only').checked
        };

        // Reapply filters if we have results
        if (this.currentSearchResults.length > 0) {
            this.applyFilters();
            this.displaySearchResults();
        }
    }

    sortResults() {
        const sortBy = document.getElementById('sort-by').value;
        
        this.currentSearchResults.sort((a, b) => {
            switch (sortBy) {
                case 'distance':
                    return (a.distance || 999) - (b.distance || 999);
                case 'rating':
                    return (b.rating || 0) - (a.rating || 0);
                case 'name':
                    return a.name.localeCompare(b.name);
                case 'price':
                    return (a.price_level || 2) - (b.price_level || 2);
                default:
                    return 0;
            }
        });
        
        this.displaySearchResults();
    }

    // Service interaction methods
    selectService(placeId) {
        const service = this.currentSearchResults.find(s => s.place_id === placeId);
        if (service && mapsService.isReady()) {
            const lat = typeof service.geometry.location.lat === 'function' ? 
                      service.geometry.location.lat() : service.geometry.location.lat;
            const lng = typeof service.geometry.location.lng === 'function' ? 
                      service.geometry.location.lng() : service.geometry.location.lng;
            
            mapsService.setMapCenter(lat, lng, 15);
        }
    }

    getDirections(placeId) {
        mapsService.getDirections(placeId);
    }

    callService(phoneNumber) {
        mapsService.callPlace(phoneNumber);
    }

    visitAffiliate(affiliateId) {
        // Track affiliate click and redirect
        if (window.gtag) {
            gtag('event', 'affiliate_click', {
                affiliate_id: affiliateId,
                source: 'service_search'
            });
        }
        
        // Redirect to affiliate URL (implement based on your affiliate system)
        console.log('Visiting affiliate:', affiliateId);
    }

    // Status and error handling
    showSearchStatus(message) {
        const statusElement = document.getElementById('search-status');
        const statusText = statusElement.querySelector('.status-text');
        statusText.textContent = message;
        statusElement.style.display = 'block';
    }

    hideSearchStatus() {
        document.getElementById('search-status').style.display = 'none';
    }

    showSearchError(message) {
        this.hideSearchStatus();
        alert(message); // Replace with better error UI
    }

    showMapError() {
        document.getElementById('services-map').innerHTML = `
            <div class="map-error">
                <h3>🗺️ Map Unavailable</h3>
                <p>Google Maps could not be loaded. Please check your API key configuration.</p>
                <p>Search results will still be available in the list below.</p>
            </div>
        `;
    }

    isOpenNow(hours) {
        // Simple implementation - extend based on actual hours format
        return hours && hours.open_now !== false;
    }

    recenterMap() {
        if (mapsService.isReady() && this.currentSearchResults.length > 0) {
            mapsService.fitMapToMarkers();
        }
    }

    toggleMapType() {
        // Implement map type toggle
        console.log('Toggle map type');
    }

    loadMoreResults() {
        // Implement pagination for large result sets
        console.log('Load more results');
    }
}

// Create global instance
const serviceSearch = new ServiceSearchManager();

// Export for use in other modules
export default serviceSearch;
export { ServiceSearchManager };
