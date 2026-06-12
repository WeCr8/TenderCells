/**
 * Test fixtures for Google Maps and Places API
 */

export interface MapLocation {
  lat: number;
  lng: number;
  address?: string;
}

export interface Place {
  place_id: string;
  name: string;
  formatted_address: string;
  geometry: {
    location: MapLocation;
  };
  rating?: number;
  types?: string[];
}

export const mockLocations: Record<string, MapLocation> = {
  default: { lat: 39.8283, lng: -98.5795, address: 'Center of USA' },
  farm1: { lat: 40.7128, lng: -74.0060, address: 'New York, NY' },
  farm2: { lat: 34.0522, lng: -118.2437, address: 'Los Angeles, CA' },
  farm3: { lat: 41.8781, lng: -87.6298, address: 'Chicago, IL' },
};

export const mockPlaces: Place[] = [
  {
    place_id: 'place-1',
    name: 'TenderCells Farm Main',
    formatted_address: '123 Farm Road, Rural Town, ST 12345',
    geometry: {
      location: mockLocations.farm1,
    },
    rating: 4.5,
    types: ['establishment', 'point_of_interest'],
  },
  {
    place_id: 'place-2',
    name: 'TenderCells Coop Location',
    formatted_address: '456 Coop Lane, Farm City, ST 67890',
    geometry: {
      location: mockLocations.farm2,
    },
    rating: 4.8,
    types: ['establishment'],
  },
];

export const mockAutocompleteResults = [
  { description: 'TenderCells Farm Main, 123 Farm Road', place_id: 'place-1' },
  { description: 'TenderCells Coop Location, 456 Coop Lane', place_id: 'place-2' },
  { description: 'TenderCells Processing Center, 789 Main St', place_id: 'place-3' },
];

export const mockDirections = {
  origin: mockLocations.farm1,
  destination: mockLocations.farm2,
  distance: { text: '2,789 mi', value: 4487000 },
  duration: { text: '1 day 18 hours', value: 151200 },
  steps: [
    {
      distance: { text: '0.5 mi', value: 800 },
      duration: { text: '2 mins', value: 120 },
      instruction: 'Head north on Farm Road',
    },
  ],
};





