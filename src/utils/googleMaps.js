// Google Maps and Location Services Utility
// Handles map initialization, service search, and geolocation

class GoogleMapsService {
    constructor() {
        this.map = null;
        this.markers = [];
        this.userLocation = null;
        this.placesService = null;
        this.geocoder = null;
        this.isInitialized = false;
        
        // Configuration from environment
        this.config = {
            apiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
            placesApiKey: import.meta.env.VITE_GOOGLE_PLACES_API_KEY,
            enableGeolocation: import.meta.env.VITE_ENABLE_GEOLOCATION === 'true',
            defaultLat: parseFloat(import.meta.env.VITE_DEFAULT_LATITUDE) || 39.8283,
            defaultLng: parseFloat(import.meta.env.VITE_DEFAULT_LONGITUDE) || -98.5795,
            defaultZoom: parseInt(import.meta.env.VITE_DEFAULT_ZOOM_LEVEL) || 10,
            maxSearchRadius: parseInt(import.meta.env.VITE_MAX_SEARCH_RADIUS) || 50,
            mapTheme: import.meta.env.VITE_MAP_THEME || 'standard',
            maxResults: parseInt(import.meta.env.VITE_MAX_SEARCH_RESULTS) || 20,
            debugMode: import.meta.env.VITE_DEBUG_MODE === 'true'
        };
    }

    // Initialize Google Maps API
    async initializeMap(containerId) {
        try {
            if (!this.config.apiKey || this.config.apiKey === 'your_google_maps_api_key_here') {
                throw new Error('Google Maps API key not configured');
            }

            // Load Google Maps script if not already loaded
            if (!window.google) {
                await this.loadGoogleMapsScript();
            }

            // Get user location if enabled
            if (this.config.enableGeolocation) {
                await this.getCurrentLocation();
            }

            // Initialize map
            const mapOptions = {
                center: this.userLocation || { 
                    lat: this.config.defaultLat, 
                    lng: this.config.defaultLng 
                },
                zoom: this.config.defaultZoom,
                mapTypeId: this.getMapTheme(),
                zoomControl: true,
                streetViewControl: true,
                fullscreenControl: true,
                mapTypeControl: true
            };

            this.map = new google.maps.Map(
                document.getElementById(containerId), 
                mapOptions
            );

            // Initialize additional services
            this.placesService = new google.maps.places.PlacesService(this.map);
            this.geocoder = new google.maps.Geocoder();

            this.isInitialized = true;
            this.log('Google Maps initialized successfully');

            return this.map;
        } catch (error) {
            console.error('Error initializing Google Maps:', error);
            throw error;
        }
    }

    // Load Google Maps script dynamically
    loadGoogleMapsScript() {
        return new Promise((resolve, reject) => {
            if (window.google) {
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = `https://maps.googleapis.com/maps/api/js?key=${this.config.apiKey}&libraries=places,geometry`;
            script.async = true;
            script.defer = true;
            
            script.onload = () => resolve();
            script.onerror = (error) => reject(error);
            
            document.head.appendChild(script);
        });
    }

    // Get user's current location
    getCurrentLocation() {
        return new Promise((resolve) => {
            if (!navigator.geolocation) {
                this.log('Geolocation not supported');
                resolve(null);
                return;
            }

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    this.userLocation = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    };
                    this.log('User location obtained:', this.userLocation);
                    resolve(this.userLocation);
                },
                (error) => {
                    this.log('Geolocation error:', error.message);
                    resolve(null);
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 300000
                }
            );
        });
    }

    // Search for services near a location
    async searchServicesNear(searchParams) {
        try {
            if (!this.isInitialized) {
                throw new Error('Google Maps not initialized');
            }

            const {
                location,
                serviceType,
                radius = this.config.maxSearchRadius * 1000, // Convert to meters
                keyword = '',
                maxResults = this.config.maxResults
            } = searchParams;

            // Clear existing markers
            this.clearMarkers();

            // Define search parameters
            const request = {
                location: location || this.userLocation || {
                    lat: this.config.defaultLat,
                    lng: this.config.defaultLng
                },
                radius: radius,
                keyword: `${serviceType} ${keyword}`.trim(),
                type: this.getPlaceTypeFromService(serviceType)
            };

            // Perform places search
            return new Promise((resolve, reject) => {
                this.placesService.nearbySearch(request, (results, status) => {
                    if (status === google.maps.places.PlacesServiceStatus.OK) {
                        const limitedResults = results.slice(0, maxResults);
                        this.displaySearchResults(limitedResults);
                        resolve(limitedResults);
                    } else {
                        reject(new Error(`Places search failed: ${status}`));
                    }
                });
            });
        } catch (error) {
            console.error('Error searching services:', error);
            throw error;
        }
    }

    // Search for services by address
    async searchServicesByAddress(address, serviceType) {
        try {
            // Geocode the address first
            const location = await this.geocodeAddress(address);
            
            return await this.searchServicesNear({
                location,
                serviceType,
                keyword: serviceType
            });
        } catch (error) {
            console.error('Error searching by address:', error);
            throw error;
        }
    }

    // Geocode an address to coordinates
    geocodeAddress(address) {
        return new Promise((resolve, reject) => {
            this.geocoder.geocode({ address }, (results, status) => {
                if (status === google.maps.GeocoderStatus.OK) {
                    const location = results[0].geometry.location;
                    resolve({
                        lat: location.lat(),
                        lng: location.lng()
                    });
                } else {
                    reject(new Error(`Geocoding failed: ${status}`));
                }
            });
        });
    }

    // Display search results on map
    displaySearchResults(places) {
        places.forEach((place, index) => {
            const marker = new google.maps.Marker({
                position: place.geometry.location,
                map: this.map,
                title: place.name,
                icon: this.getCustomMarkerIcon(place.types[0])
            });

            // Create info window
            const infoWindow = new google.maps.InfoWindow({
                content: this.createInfoWindowContent(place)
            });

            marker.addListener('click', () => {
                this.closeAllInfoWindows();
                infoWindow.open(this.map, marker);
                
                // Track analytics if enabled
                if (import.meta.env.VITE_TRACK_MAP_INTERACTIONS === 'true') {
                    this.trackMapInteraction('marker_click', place);
                }
            });

            this.markers.push({ marker, infoWindow, place });
        });

        // Fit map to show all markers
        if (places.length > 0) {
            this.fitMapToMarkers();
        }
    }

    // Create custom marker icons based on service type
    getCustomMarkerIcon(placeType) {
        const iconMap = {
            'veterinary_care': '🏥',
            'hospital': '🏥',
            'doctor': '👨‍⚕️',
            'pharmacy': '💊',
            'pet_store': '🐾',
            'funeral_home': '⚱️',
            'crematorium': '⚱️'
        };

        return {
            url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
                `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
                    <circle cx="20" cy="20" r="18" fill="#2563eb" stroke="#1e40af" stroke-width="2"/>
                    <text x="20" y="26" text-anchor="middle" font-size="16" fill="white">
                        ${iconMap[placeType] || '📍'}
                    </text>
                </svg>`
            )}`,
            scaledSize: new google.maps.Size(40, 40),
            anchor: new google.maps.Point(20, 20)
        };
    }

    // Create info window content
    createInfoWindowContent(place) {
        const rating = place.rating ? `⭐ ${place.rating}` : 'No rating';
        const priceLevel = place.price_level ? '💰'.repeat(place.price_level) : '';
        
        return `
            <div style="max-width: 250px; padding: 10px;">
                <h3 style="margin: 0 0 8px 0; color: #1e40af;">${place.name}</h3>
                <p style="margin: 4px 0; color: #6b7280;">${place.vicinity}</p>
                <div style="margin: 8px 0;">
                    <span style="margin-right: 10px;">${rating}</span>
                    <span>${priceLevel}</span>
                </div>
                ${place.opening_hours ? 
                    `<p style="margin: 4px 0; color: ${place.opening_hours.open_now ? '#059669' : '#dc2626'};">
                        ${place.opening_hours.open_now ? '🟢 Open Now' : '🔴 Closed'}
                    </p>` : ''
                }
                <div style="margin-top: 10px;">
                    <button onclick="mapsService.getDirections('${place.place_id}')" 
                            style="background: #2563eb; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; margin-right: 8px;">
                        Directions
                    </button>
                    <button onclick="mapsService.callPlace('${place.formatted_phone_number || ''}')" 
                            style="background: #059669; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer;">
                        Call
                    </button>
                </div>
            </div>
        `;
    }

    // Get directions to a place
    getDirections(placeId) {
        const url = `https://www.google.com/maps/dir/?api=1&destination_place_id=${placeId}`;
        window.open(url, '_blank');
    }

    // Call a place
    callPlace(phoneNumber) {
        if (phoneNumber) {
            window.location.href = `tel:${phoneNumber}`;
        }
    }

    // Map service types to Google Places types
    getPlaceTypeFromService(serviceType) {
        const typeMap = {
            'veterinary': 'veterinary_care',
            'hospital': 'hospital',
            'pharmacy': 'pharmacy',
            'emergency': 'hospital',
            'cremation': 'funeral_home',
            'boarding': 'pet_store',
            'grooming': 'pet_store',
            'training': 'pet_store'
        };
        
        return typeMap[serviceType.toLowerCase()] || 'establishment';
    }

    // Get map theme
    getMapTheme() {
        const themeMap = {
            'standard': google.maps.MapTypeId.ROADMAP,
            'satellite': google.maps.MapTypeId.SATELLITE,
            'hybrid': google.maps.MapTypeId.HYBRID,
            'terrain': google.maps.MapTypeId.TERRAIN
        };
        
        return themeMap[this.config.mapTheme] || google.maps.MapTypeId.ROADMAP;
    }

    // Utility methods
    clearMarkers() {
        this.markers.forEach(({ marker, infoWindow }) => {
            marker.setMap(null);
            infoWindow.close();
        });
        this.markers = [];
    }

    closeAllInfoWindows() {
        this.markers.forEach(({ infoWindow }) => {
            infoWindow.close();
        });
    }

    fitMapToMarkers() {
        if (this.markers.length === 0) return;

        const bounds = new google.maps.LatLngBounds();
        this.markers.forEach(({ marker }) => {
            bounds.extend(marker.getPosition());
        });
        
        this.map.fitBounds(bounds);
    }

    // Analytics tracking
    trackMapInteraction(action, place) {
        if (window.gtag) {
            gtag('event', 'map_interaction', {
                action: action,
                place_name: place.name,
                place_type: place.types[0],
                rating: place.rating
            });
        }
    }

    // Debug logging
    log(...args) {
        if (this.config.debugMode) {
            console.log('[GoogleMapsService]', ...args);
        }
    }

    // Public method to check if maps is ready
    isReady() {
        return this.isInitialized && this.map !== null;
    }

    // Get current map center
    getMapCenter() {
        if (!this.map) return null;
        const center = this.map.getCenter();
        return {
            lat: center.lat(),
            lng: center.lng()
        };
    }

    // Set map center
    setMapCenter(lat, lng, zoom = null) {
        if (!this.map) return;
        
        this.map.setCenter({ lat, lng });
        if (zoom !== null) {
            this.map.setZoom(zoom);
        }
    }
}

// Create global instance
const mapsService = new GoogleMapsService();

// Export for use in other modules
export default mapsService;
export { GoogleMapsService };
