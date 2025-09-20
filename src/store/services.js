// Services Data Store - Local Service Providers and Affiliate Partners
export const serviceCategories = [
  {
    id: 'veterinary',
    name: 'Veterinary Services',
    icon: '🏥',
    description: 'Emergency and routine veterinary care',
    color: '#e74c3c'
  },
  {
    id: 'funeral',
    name: 'Pet Memorial Services',
    icon: '🌹',
    description: 'Cremation, burial, and memorial services',
    color: '#8e44ad'
  },
  {
    id: 'hospitals',
    name: 'Animal Hospitals',
    icon: '🏨',
    description: '24/7 emergency animal hospitals',
    color: '#3498db'
  },
  {
    id: 'grooming',
    name: 'Grooming & Care',
    icon: '✂️',
    description: 'Professional animal grooming services',
    color: '#f39c12'
  },
  {
    id: 'boarding',
    name: 'Boarding & Daycare',
    icon: '🏠',
    description: 'Temporary care and boarding facilities',
    color: '#27ae60'
  },
  {
    id: 'training',
    name: 'Training Services',
    icon: '🎯',
    description: 'Professional animal training and behavior',
    color: '#e67e22'
  },
  {
    id: 'supplies',
    name: 'Feed & Supplies',
    icon: '🛒',
    description: 'Local feed stores and equipment suppliers',
    color: '#95a5a6'
  },
  {
    id: 'transport',
    name: 'Animal Transport',
    icon: '🚛',
    description: 'Livestock and pet transportation services',
    color: '#2c3e50'
  }
];

export const serviceProviders = [
  // Veterinary Services
  {
    id: 'vet-001',
    name: 'Country Animal Hospital',
    category: 'veterinary',
    phone: '(555) 123-4567',
    address: '123 Rural Route 1, Farmville, TX 75001',
    coordinates: { lat: 32.7767, lng: -96.7970 },
    hours: 'Mon-Fri 8AM-6PM, Sat 9AM-3PM',
    services: ['Emergency Care', 'Routine Checkups', 'Surgery', 'Vaccinations'],
    rating: 4.8,
    reviews: 156,
    website: 'https://countryanimalhospital.com',
    affiliateId: 'CAH001',
    commission: 5.5,
    specialties: ['Large Animals', 'Farm Calls', 'Reproductive Health'],
    emergencyContact: '(555) 123-HELP'
  },
  {
    id: 'vet-002', 
    name: 'Meadowbrook Veterinary Clinic',
    category: 'veterinary',
    phone: '(555) 234-5678',
    address: '456 Farm Road, Greenfield, TX 75002',
    coordinates: { lat: 32.8767, lng: -96.8970 },
    hours: '24/7 Emergency Available',
    services: ['24/7 Emergency', 'Mobile Services', 'Diagnostic Imaging'],
    rating: 4.9,
    reviews: 203,
    website: 'https://meadowbrookvet.com',
    affiliateId: 'MVC002',
    commission: 6.0,
    specialties: ['Emergency Medicine', 'Cattle', 'Equine'],
    emergencyContact: '(555) 234-EMER'
  },

  // Pet Memorial Services
  {
    id: 'memorial-001',
    name: 'Peaceful Paws Memorial',
    category: 'funeral',
    phone: '(555) 345-6789',
    address: '789 Memorial Drive, Restville, TX 75003',
    coordinates: { lat: 32.9767, lng: -96.9970 },
    hours: 'Mon-Sat 9AM-5PM',
    services: ['Pet Cremation', 'Memorial Products', 'Grief Counseling'],
    rating: 4.7,
    reviews: 89,
    website: 'https://peacefulpaws.com',
    affiliateId: 'PPM001',
    commission: 8.0,
    specialties: ['Individual Cremation', 'Custom Urns', 'Memorial Jewelry'],
    packages: ['Basic Cremation - $150', 'Premium Memorial - $350', 'Complete Service - $650']
  },
  {
    id: 'memorial-002',
    name: 'Rainbow Bridge Pet Services',
    category: 'funeral',
    phone: '(555) 456-7890',
    address: '321 Bridge Street, Memoriam, TX 75004',
    coordinates: { lat: 33.0767, lng: -97.0970 },
    hours: 'Daily 8AM-6PM',
    services: ['Pet Burial', 'Cremation Services', 'Memorial Gardens'],
    rating: 4.6,
    reviews: 124,
    website: 'https://rainbowbridgepets.com',
    affiliateId: 'RBP002',
    commission: 7.5,
    specialties: ['Natural Burial', 'Memorial Trees', 'Online Tributes'],
    packages: ['Cremation Only - $125', 'Garden Burial - $450', 'Memorial Package - $750']
  },

  // Animal Hospitals
  {
    id: 'hospital-001',
    name: '24/7 Animal Emergency Center',
    category: 'hospitals',
    phone: '(555) 567-8901',
    address: '654 Emergency Blvd, Urgentcare, TX 75005',
    coordinates: { lat: 33.1767, lng: -97.1970 },
    hours: '24 Hours / 7 Days',
    services: ['Emergency Surgery', 'Critical Care', 'Trauma Treatment'],
    rating: 4.8,
    reviews: 278,
    website: 'https://24animalemergency.com',
    affiliateId: 'AEC001',
    commission: 4.5,
    specialties: ['Trauma Surgery', 'Poison Control', 'Critical Care'],
    insuranceAccepted: ['PetPlan', 'Healthy Paws', 'ASPCA', 'Trupanion']
  },

  // Feed & Supplies
  {
    id: 'supply-001',
    name: 'Farm & Ranch Supply Co.',
    category: 'supplies',
    phone: '(555) 678-9012',
    address: '987 Supply Road, Feedtown, TX 75006',
    coordinates: { lat: 33.2767, lng: -97.2970 },
    hours: 'Mon-Sat 7AM-7PM, Sun 9AM-5PM',
    services: ['Animal Feed', 'Farm Equipment', 'Health Supplements'],
    rating: 4.6,
    reviews: 145,
    website: 'https://farmranchsupply.com',
    affiliateId: 'FRS001',
    commission: 3.5,
    specialties: ['Bulk Feed Sales', 'Custom Supplements', 'Equipment Rental'],
    deliveryRadius: '50 miles',
    products: ['Cattle Feed', 'Poultry Feed', 'Supplements', 'Equipment']
  },

  // Training Services
  {
    id: 'training-001',
    name: 'Professional Animal Training',
    category: 'training',
    phone: '(555) 789-0123',
    address: '159 Training Lane, Skillville, TX 75007',
    coordinates: { lat: 33.3767, lng: -97.3970 },
    hours: 'By Appointment',
    services: ['Livestock Training', 'Behavior Modification', 'Handling Workshops'],
    rating: 4.9,
    reviews: 67,
    website: 'https://proanimaltraining.com',
    affiliateId: 'PAT001',
    commission: 12.0,
    specialties: ['Cattle Handling', 'Horse Training', 'Herding Dogs'],
    programs: ['Basic Handling - $200', 'Advanced Training - $500', 'Workshop Series - $300']
  }
];

// Search and Filter Functions
export function searchServices(query, category = null, location = null) {
  let results = serviceProviders;

  if (category) {
    results = results.filter(service => service.category === category);
  }

  if (query) {
    const searchTerm = query.toLowerCase();
    results = results.filter(service => 
      service.name.toLowerCase().includes(searchTerm) ||
      service.services.some(s => s.toLowerCase().includes(searchTerm)) ||
      service.specialties.some(s => s.toLowerCase().includes(searchTerm))
    );
  }

  // TODO: Add location-based filtering when coordinates are provided
  if (location) {
    // Future implementation for distance-based filtering
    console.log('Location filtering will be implemented with map integration');
  }

  return results;
}

export function getServicesByCategory(categoryId) {
  return serviceProviders.filter(service => service.category === categoryId);
}

export function getFeaturedServices() {
  return serviceProviders
    .filter(service => service.rating >= 4.7)
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 6);
}

export function getEmergencyServices() {
  return serviceProviders.filter(service => 
    service.category === 'veterinary' || 
    service.category === 'hospitals' ||
    service.emergencyContact
  );
}

export function calculateDistance(lat1, lng1, lat2, lng2) {
  // Haversine formula for calculating distance between coordinates
  const R = 3959; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

export function getServicesNearLocation(lat, lng, radiusMiles = 25) {
  return serviceProviders
    .map(service => ({
      ...service,
      distance: calculateDistance(lat, lng, service.coordinates.lat, service.coordinates.lng)
    }))
    .filter(service => service.distance <= radiusMiles)
    .sort((a, b) => a.distance - b.distance);
}
