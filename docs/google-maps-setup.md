# Google Maps Integration Setup Guide

## Overview
This guide will help you set up Google Maps functionality for the TenderCells services search feature. The integration provides interactive maps, location-based search, and enhanced service discovery.

## Features Included
- 🗺️ Interactive Google Maps integration
- 📍 Current location detection
- 🔍 Advanced service search with filters
- 📊 Real-time service results
- 🧭 Directions and navigation
- 📱 Mobile-responsive design
- 📈 Analytics tracking

## Prerequisites
- Google Cloud Platform account
- Valid billing account (Google Maps requires billing)
- Domain where the application will be hosted

## Step 1: Google Cloud Platform Setup

### 1.1 Create a Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. Enter project name (e.g., "TenderCells Maps")
4. Click "Create"

### 1.2 Enable Required APIs
Navigate to "APIs & Services" → "Library" and enable:

#### Required APIs:
- **Maps JavaScript API** - For map display
- **Places API** - For service search and details
- **Geocoding API** - For address to coordinates conversion
- **Geolocation API** - For current location detection

#### Optional APIs (for enhanced features):
- **Directions API** - For navigation routes
- **Distance Matrix API** - For travel time calculations
- **Roads API** - For route optimization

### 1.3 Create API Credentials
1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "API Key"
3. Copy the generated API key
4. Click "Restrict Key" for security

### 1.4 Configure API Key Restrictions
For security, restrict your API key:

#### Application Restrictions:
- **HTTP referrers**: Add your domain(s)
  ```
  https://yourdomain.com/*
  https://*.yourdomain.com/*
  http://localhost:*  (for development)
  ```

#### API Restrictions:
- Select "Restrict key"
- Choose the APIs you enabled above

## Step 2: Environment Configuration

### 2.1 Update .env File
Copy the API key to your `.env` file:
```env
VITE_GOOGLE_MAPS_API_KEY=your_actual_api_key_here
VITE_GOOGLE_PLACES_API_KEY=your_actual_api_key_here
```

### 2.2 Configuration Options
Customize map behavior in `.env`:
```env
# Geolocation
VITE_ENABLE_GEOLOCATION=true
VITE_DEFAULT_LATITUDE=39.8283
VITE_DEFAULT_LONGITUDE=-98.5795

# Map Display
VITE_DEFAULT_ZOOM_LEVEL=10
VITE_MAP_THEME=standard

# Search Configuration
VITE_MAX_SEARCH_RADIUS=50
VITE_MAX_SEARCH_RESULTS=20

# Analytics
VITE_TRACK_MAP_INTERACTIONS=true
VITE_TRACK_SERVICE_CLICKS=true
```

## Step 3: Testing the Integration

### 3.1 Development Testing
1. Start your development server:
   ```bash
   npm run dev
   ```
2. Navigate to `/services` page
3. Test the search functionality:
   - Use current location
   - Search by address
   - Apply filters
   - View results on map

### 3.2 Verification Checklist
- [ ] Map loads without errors
- [ ] Current location detection works
- [ ] Address search returns results
- [ ] Service markers appear on map
- [ ] Info windows show service details
- [ ] Directions functionality works
- [ ] Mobile responsiveness

## Step 4: Production Deployment

### 4.1 Update API Key Restrictions
For production, update HTTP referrers to include only your production domain:
```
https://yourdomain.com/*
https://*.yourdomain.com/*
```

### 4.2 Monitor Usage
1. Set up billing alerts in Google Cloud
2. Monitor API usage in Cloud Console
3. Implement rate limiting if needed

## Pricing Information

### Google Maps Pricing (as of 2024)
- **Maps JavaScript API**: $7.00 per 1,000 loads
- **Places API**: $17.00 per 1,000 requests
- **Geocoding API**: $5.00 per 1,000 requests

### Cost Optimization Tips
1. **Implement caching** for repeated searches
2. **Use session tokens** for Places API
3. **Optimize map loads** with lazy loading
4. **Set usage quotas** to prevent overages
5. **Use static maps** where interactivity isn't needed

## Troubleshooting

### Common Issues

#### Map Not Loading
```javascript
// Check console for errors
// Verify API key in .env file
// Ensure APIs are enabled
```

#### "This page can't load Google Maps correctly" Error
- Check API key restrictions
- Verify billing is enabled
- Ensure Maps JavaScript API is enabled

#### Geolocation Not Working
- Requires HTTPS in production
- User must grant permission
- Check browser compatibility

#### Search Results Empty
- Verify Places API is enabled
- Check search radius settings
- Ensure location coordinates are valid

### Debug Mode
Enable debug mode for detailed logging:
```env
VITE_DEBUG_MODE=true
```

## Integration Architecture

### File Structure
```
src/
├── utils/
│   └── googleMaps.js          # Core Google Maps service
├── components/
│   └── ServiceSearch.js       # Search interface
├── pages/
│   └── services.js           # Services page
└── style.css                 # Map styling
```

### Key Components

#### GoogleMapsService (`src/utils/googleMaps.js`)
- Handles map initialization
- Manages markers and info windows
- Provides search functionality
- Tracks user interactions

#### ServiceSearchManager (`src/components/ServiceSearch.js`)
- User interface for search
- Filter management
- Results display
- Integration with maps

## Security Considerations

1. **API Key Protection**
   - Use environment variables
   - Restrict by domain
   - Monitor usage regularly

2. **Data Privacy**
   - Handle location data responsibly
   - Comply with privacy regulations
   - Implement user consent

3. **Rate Limiting**
   - Implement client-side throttling
   - Cache search results
   - Use efficient search patterns

## Advanced Features

### Custom Markers
```javascript
// Customize marker icons by service type
const customIcon = {
  url: 'path/to/custom-icon.png',
  scaledSize: new google.maps.Size(40, 40)
};
```

### Clustering
For large numbers of markers:
```javascript
// Implement marker clustering
import { MarkerClusterer } from '@googlemaps/markerclusterer';
```

### Heatmaps
For service density visualization:
```javascript
// Add heatmap layer
const heatmap = new google.maps.visualization.HeatmapLayer({
  data: serviceLocations
});
```

## Support

### Documentation
- [Google Maps JavaScript API](https://developers.google.com/maps/documentation/javascript)
- [Places API](https://developers.google.com/maps/documentation/places/web-service)
- [Geocoding API](https://developers.google.com/maps/documentation/geocoding)

### Getting Help
1. Check Google Maps Platform documentation
2. Review API quota and billing
3. Test with different browsers/devices
4. Check browser console for errors

## Migration Notes

If migrating from another mapping service:
1. Export existing location data
2. Update coordinate formats if needed
3. Test search functionality thoroughly
4. Update any custom styling
5. Verify mobile compatibility

---

**Note**: This integration requires a valid Google Cloud billing account. Free tier includes $200 monthly credit, which covers moderate usage. Monitor your usage to avoid unexpected charges.
