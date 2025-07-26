// Product Catalog
export const products = [
  {
    id: 'chicken-tender-v1',
    name: 'Chicken Tender v1.0.0',
    shortName: 'Chicken Tender',
    price: 2999.00,
    originalPrice: 3499.00,
    currency: 'USD',
    category: 'Smart Coops',
    status: 'beta',
    featured: true,
    image: 'https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop',
    gallery: [
      'https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop',
      'https://images.pexels.com/photos/2889440/pexels-photo-2889440.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop',
      'https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop'
    ],
    description: 'Our flagship smart coop system for homesteaders featuring advanced technology, climate control, and AI-powered insights.',
    longDescription: `
      Chicken Tender is our flagship smart coop system currently in build and beta testing phase. 
      Designed specifically for homesteaders and chicken enthusiasts, this system will feature our 
      most advanced technology and come 95% pre-assembled for easy installation.

      Join our beta testing program to be among the first to experience smart farming technology.
    `,
    features: [
      '🌡️ Advanced Climate Control',
      '🍽️ Automated Smart Feeding',
      '📊 AI-Powered Health Analytics',
      '🔔 Real-time Smart Alerts',
      '🥚 Egg Production Tracking',
      '📱 Cross-platform Mobile Apps',
      '☁️ Cloud Data Synchronization',
      '🔧 95% Pre-assembled'
    ],
    specifications: {
      'Dimensions': '48" x 36" x 24"',
      'Weight': '85 lbs',
      'Power': '12V DC, Solar Compatible',
      'Connectivity': 'WiFi, Bluetooth',
      'Capacity': 'Up to 12 chickens',
      'Installation': '2-4 hours',
      'Warranty': '2 years full coverage'
    },
    shipping: {
      free: false,
      estimatedDays: 'Beta testing phase',
      international: true
    },
  },
  {
    id: 'chicken-tender-accessories',
    name: 'Chicken Tender Accessories Kit',
    shortName: 'Accessories Kit',
    price: 299.00,
    currency: 'USD',
    category: 'Accessories',
    status: 'available',
    featured: false,
    image: 'https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop',
    description: 'Essential accessories and replacement parts for your Chicken Tender system.',
    features: [
      '🔧 Essential Tools',
      '🔄 Replacement Sensors',
      '🍽️ Extra Feeders',
      '💧 Water System Parts'
    ],
    inStock: true,
    stockCount: 156
  },
  {
    id: 'cattle-care-preorder',
    name: 'Cattle Care System',
    shortName: 'Cattle Care',
    price: 4999.00,
    currency: 'USD',
    category: 'Smart Systems',
    status: 'preorder',
    featured: true,
    image: 'https://images.pexels.com/photos/422218/pexels-photo-422218.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop',
    description: 'Comprehensive cattle management system with GPS tracking and health monitoring. Coming Q3 2025.',
    features: [
      '🐄 Herd Management',
      '📍 GPS Tracking',
      '🏥 Health Monitoring',
      '🌱 Grazing Optimization'
    ],
    preorderDate: '2025-07-01',
    inStock: false,
    stockCount: 0
  }
];

// Get product by ID
export const getProductById = (id) => {
  return products.find(product => product.id === id);
};

// Get products by category
export const getProductsByCategory = (category) => {
  return products.filter(product => product.category === category);
};

// Get featured products
export const getFeaturedProducts = () => {
  return products.filter(product => product.featured);
};

// Get available products
export const getAvailableProducts = () => {
  return products.filter(product => product.status === 'available');
};