import { vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import type { Place, MapLocation } from '../fixtures/maps';
import { mockPlaces, mockLocations, mockAutocompleteResults, mockDirections } from '../fixtures/maps';

// Mock Google Maps API
export const mockGoogleMaps = {
  Map: vi.fn().mockImplementation(() => ({
    setCenter: vi.fn(),
    setZoom: vi.fn(),
    setMapTypeId: vi.fn(),
    getCenter: vi.fn().mockReturnValue({ lat: () => mockLocations.default.lat, lng: () => mockLocations.default.lng }),
    getZoom: vi.fn().mockReturnValue(10),
  })),
  Marker: vi.fn().mockImplementation(() => ({
    setPosition: vi.fn(),
    setMap: vi.fn(),
    setTitle: vi.fn(),
    setIcon: vi.fn(),
    setVisible: vi.fn(),
    getPosition: vi.fn().mockReturnValue({ lat: () => mockLocations.default.lat, lng: () => mockLocations.default.lng }),
  })),
  InfoWindow: vi.fn().mockImplementation(() => ({
    setContent: vi.fn(),
    open: vi.fn(),
    close: vi.fn(),
  })),
  Geocoder: vi.fn().mockImplementation(() => ({
    geocode: vi.fn().mockImplementation((request, callback) => {
      callback([{ geometry: { location: mockLocations.default } }], 'OK');
    }),
  })),
  DirectionsService: vi.fn().mockImplementation(() => ({
    route: vi.fn().mockImplementation((request, callback) => {
      callback(mockDirections, 'OK');
    }),
  })),
  DirectionsRenderer: vi.fn().mockImplementation(() => ({
    setDirections: vi.fn(),
    setMap: vi.fn(),
  })),
  places: {
    PlacesService: vi.fn().mockImplementation(() => ({
      nearbySearch: vi.fn().mockImplementation((request, callback) => {
        callback(mockPlaces, 'OK');
      }),
      textSearch: vi.fn().mockImplementation((request, callback) => {
        callback(mockPlaces, 'OK');
      }),
      getDetails: vi.fn().mockImplementation((request, callback) => {
        callback(mockPlaces[0], 'OK');
      }),
    }),
    AutocompleteService: vi.fn().mockImplementation(() => ({
      getPlacePredictions: vi.fn().mockImplementation((request, callback) => {
        callback(mockAutocompleteResults, 'OK');
      }),
    })),
    PlacesAutocomplete: vi.fn().mockImplementation(() => ({
      getPlace: vi.fn().mockResolvedValue(mockPlaces[0]),
    })),
  },
};

// Mock Google Maps Loader
export const mockLoadGoogleMaps = vi.fn().mockResolvedValue(mockGoogleMaps);

// MSW Handlers for Google Maps/Places API
export const mapsHandlers = [
  // Geocoding API
  http.get('https://maps.googleapis.com/maps/api/geocode/json', ({ request }) => {
    const url = new URL(request.url);
    const address = url.searchParams.get('address');
    return HttpResponse.json({
      status: 'OK',
      results: [
        {
          formatted_address: address || 'Test Address',
          geometry: {
            location: mockLocations.default,
          },
        },
      ],
    });
  }),

  // Places API - Text Search
  http.get('https://maps.googleapis.com/maps/api/place/textsearch/json', () => {
    return HttpResponse.json({
      status: 'OK',
      results: mockPlaces,
    });
  }),

  // Places API - Autocomplete
  http.get('https://maps.googleapis.com/maps/api/place/autocomplete/json', () => {
    return HttpResponse.json({
      status: 'OK',
      predictions: mockAutocompleteResults,
    });
  }),

  // Places API - Details
  http.get('https://maps.googleapis.com/maps/api/place/details/json', () => {
    return HttpResponse.json({
      status: 'OK',
      result: mockPlaces[0],
    });
  }),

  // Directions API
  http.get('https://maps.googleapis.com/maps/api/directions/json', () => {
    return HttpResponse.json({
      status: 'OK',
      routes: [
        {
          legs: [
            {
              distance: mockDirections.distance,
              duration: mockDirections.duration,
              steps: mockDirections.steps,
            },
          ],
        },
      ],
    });
  }),
];

// Helper to reset mocks
export const resetMapsMocks = () => {
  vi.clearAllMocks();
};

// Setup global Google Maps mock
export const setupGoogleMapsMock = () => {
  if (typeof window !== 'undefined') {
    (window as any).google = {
      maps: mockGoogleMaps,
    };
  }
};





