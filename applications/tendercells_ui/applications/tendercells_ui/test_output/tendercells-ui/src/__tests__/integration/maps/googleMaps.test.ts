import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setupGoogleMapsMock, resetMapsMocks, mockGoogleMaps } from '../../../../tests/mocks/maps';
import { mockLocations, mockPlaces, mockAutocompleteResults, mockDirections } from '../../../../tests/fixtures/maps';

describe('Google Maps Integration', () => {
  beforeEach(() => {
    resetMapsMocks();
    setupGoogleMapsMock();
  });

  describe('Map Initialization', () => {
    it('initializes a map', () => {
      const mapElement = document.createElement('div');
      const map = new mockGoogleMaps.Map(mapElement, {
        center: mockLocations.default,
        zoom: 10,
      });

      expect(mockGoogleMaps.Map).toHaveBeenCalled();
      expect(map).toBeDefined();
    });

    it('sets map center', () => {
      const map = new mockGoogleMaps.Map(document.createElement('div'));
      map.setCenter(mockLocations.farm1);

      expect(map.setCenter).toHaveBeenCalledWith(mockLocations.farm1);
    });

    it('sets map zoom level', () => {
      const map = new mockGoogleMaps.Map(document.createElement('div'));
      map.setZoom(15);

      expect(map.setZoom).toHaveBeenCalledWith(15);
    });
  });

  describe('Marker Placement', () => {
    it('creates a marker on the map', () => {
      const map = new mockGoogleMaps.Map(document.createElement('div'));
      const marker = new mockGoogleMaps.Marker({
        position: mockLocations.farm1,
        map: map,
      });

      expect(mockGoogleMaps.Marker).toHaveBeenCalled();
      expect(marker).toBeDefined();
    });

    it('sets marker position', () => {
      const marker = new mockGoogleMaps.Marker();
      marker.setPosition(mockLocations.farm2);

      expect(marker.setPosition).toHaveBeenCalledWith(mockLocations.farm2);
    });

    it('sets marker title', () => {
      const marker = new mockGoogleMaps.Marker();
      marker.setTitle('Farm Location');

      expect(marker.setTitle).toHaveBeenCalledWith('Farm Location');
    });
  });

  describe('Geocoding', () => {
    it('geocodes an address to coordinates', (done) => {
      const geocoder = new mockGoogleMaps.Geocoder();
      geocoder.geocode({ address: '123 Farm Road' }, (results, status) => {
        expect(status).toBe('OK');
        expect(results).toBeDefined();
        expect(results[0].geometry.location).toBeDefined();
        done();
      });
    });
  });

  describe('Places API', () => {
    it('searches for places', (done) => {
      const placesService = new mockGoogleMaps.places.PlacesService(
        new mockGoogleMaps.Map(document.createElement('div'))
      );

      placesService.textSearch({ query: 'farm' }, (results, status) => {
        expect(status).toBe('OK');
        expect(results).toEqual(mockPlaces);
        done();
      });
    });

    it('gets place details', (done) => {
      const placesService = new mockGoogleMaps.places.PlacesService(
        new mockGoogleMaps.Map(document.createElement('div'))
      );

      placesService.getDetails({ placeId: 'place-1' }, (place, status) => {
        expect(status).toBe('OK');
        expect(place).toEqual(mockPlaces[0]);
        done();
      });
    });

    it('provides autocomplete suggestions', (done) => {
      const autocompleteService = new mockGoogleMaps.places.AutocompleteService();

      autocompleteService.getPlacePredictions(
        { input: 'TenderCells' },
        (predictions, status) => {
          expect(status).toBe('OK');
          expect(predictions).toEqual(mockAutocompleteResults);
          done();
        }
      );
    });
  });

  describe('Directions', () => {
    it('calculates directions between two points', (done) => {
      const directionsService = new mockGoogleMaps.DirectionsService();

      directionsService.route(
        {
          origin: mockDirections.origin,
          destination: mockDirections.destination,
          travelMode: mockGoogleMaps.TravelMode.DRIVING,
        },
        (result, status) => {
          expect(status).toBe('OK');
          expect(result).toBeDefined();
          done();
        }
      );
    });

    it('renders directions on map', () => {
      const map = new mockGoogleMaps.Map(document.createElement('div'));
      const directionsRenderer = new mockGoogleMaps.DirectionsRenderer();
      
      directionsRenderer.setMap(map);
      directionsRenderer.setDirections(mockDirections);

      expect(directionsRenderer.setMap).toHaveBeenCalledWith(map);
      expect(directionsRenderer.setDirections).toHaveBeenCalled();
    });
  });
});





