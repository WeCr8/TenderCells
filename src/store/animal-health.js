// Animal Health Data Store
// Comprehensive data for animal health management

export const animalHealthData = {
  animals: [
    {
      type: 'cattle',
      name: 'Cattle Care',
      image: 'https://images.pexels.com/photos/422218/pexels-photo-422218.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop',
      status: 'excellent',
      statusText: 'Excellent Care',
      careLevel: 'intermediate',
      careLevelText: 'Intermediate',
      description: 'Comprehensive cattle management including herd health, nutrition, breeding, and pasture management for optimal productivity.',
      healthTopics: 45,
      commonIssues: 12,
      categories: [
        { name: 'Nutrition', type: 'nutrition' },
        { name: 'Health', type: 'health' },
        { name: 'Breeding', type: 'breeding' },
        { name: 'Behavior', type: 'behavior' }
      ],
      detailPage: 'cattle-care'
    },
    {
      type: 'chicken',
      name: 'Chicken Tender',
      image: 'https://images.pexels.com/photos/86475/chicken-poultry-livestock-hen-86475.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop',
      status: 'good',
      statusText: 'Good Care',
      careLevel: 'beginner',
      careLevelText: 'Beginner',
      description: 'Complete guide to chicken health, egg production, feed management, and disease prevention for backyard and commercial flocks.',
      healthTopics: 38,
      commonIssues: 15,
      categories: [
        { name: 'Nutrition', type: 'nutrition' },
        { name: 'Health', type: 'health' },
        { name: 'Egg Production', type: 'breeding' },
        { name: 'Environment', type: 'environment' }
      ],
      detailPage: 'chicken-tender'
    },
    {
      type: 'duck',
      name: 'Duck Dock',
      image: 'https://images.pexels.com/photos/416976/pexels-photo-416976.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop',
      status: 'good',
      statusText: 'Good Care',
      careLevel: 'beginner',
      careLevelText: 'Beginner',
      description: 'Waterfowl health management including pond care, specialized nutrition, and disease prevention for healthy duck populations.',
      healthTopics: 32,
      commonIssues: 10,
      categories: [
        { name: 'Nutrition', type: 'nutrition' },
        { name: 'Health', type: 'health' },
        { name: 'Water Management', type: 'environment' },
        { name: 'Behavior', type: 'behavior' }
      ],
      detailPage: 'duck-dock'
    },
    {
      type: 'goat',
      name: 'Goat Guardian',
      image: 'https://images.pexels.com/photos/1459499/pexels-photo-1459499.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop',
      status: 'attention',
      statusText: 'Needs Attention',
      careLevel: 'intermediate',
      careLevelText: 'Intermediate',
      description: 'Goat health management covering nutrition, hoof care, parasite control, and milk production for dairy and meat goats.',
      healthTopics: 42,
      commonIssues: 18,
      categories: [
        { name: 'Nutrition', type: 'nutrition' },
        { name: 'Health', type: 'health' },
        { name: 'Breeding', type: 'breeding' },
        { name: 'Milk Production', type: 'breeding' }
      ],
      detailPage: 'goat-guardian'
    },
    {
      type: 'pig',
      name: 'Pig Pal',
      image: 'https://images.pexels.com/photos/86596/owl-bird-eyes-eagle-owl-86596.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop',
      status: 'excellent',
      statusText: 'Excellent Care',
      careLevel: 'advanced',
      careLevelText: 'Advanced',
      description: 'Advanced swine management including nutrition optimization, disease prevention, breeding programs, and welfare standards.',
      healthTopics: 48,
      commonIssues: 14,
      categories: [
        { name: 'Nutrition', type: 'nutrition' },
        { name: 'Health', type: 'health' },
        { name: 'Breeding', type: 'breeding' },
        { name: 'Environment', type: 'environment' }
      ],
      detailPage: 'pig-pal'
    }
  ],

  healthTopics: [
    {
      id: 'nutrition-basics',
      title: 'Animal Nutrition Fundamentals',
      summary: 'Essential nutrients, feeding schedules, and dietary requirements for healthy animals.',
      category: 'nutrition',
      categoryName: 'Nutrition',
      difficulty: 'easy',
      difficultyText: 'Easy',
      icon: '🌾',
      readTime: 8,
      lastUpdated: '2 days ago'
    },
    {
      id: 'disease-prevention',
      title: 'Disease Prevention Strategies',
      summary: 'Vaccination schedules, biosecurity measures, and early detection methods.',
      category: 'health',
      categoryName: 'Health',
      difficulty: 'medium',
      difficultyText: 'Medium',
      icon: '🏥',
      readTime: 12,
      lastUpdated: '1 week ago'
    },
    {
      id: 'breeding-management',
      title: 'Breeding and Reproduction',
      summary: 'Breeding programs, pregnancy care, and newborn management practices.',
      category: 'breeding',
      categoryName: 'Breeding',
      difficulty: 'hard',
      difficultyText: 'Hard',
      icon: '👶',
      readTime: 15,
      lastUpdated: '3 days ago'
    },
    {
      id: 'emergency-care',
      title: 'Emergency Health Response',
      summary: 'Critical care procedures, when to call a vet, and life-saving techniques.',
      category: 'emergency',
      categoryName: 'Emergency',
      difficulty: 'hard',
      difficultyText: 'Hard',
      icon: '🚨',
      readTime: 10,
      lastUpdated: '1 day ago'
    },
    {
      id: 'behavioral-health',
      title: 'Animal Behavior and Welfare',
      summary: 'Understanding animal behavior, stress indicators, and welfare standards.',
      category: 'behavior',
      categoryName: 'Behavior',
      difficulty: 'medium',
      difficultyText: 'Medium',
      icon: '🧠',
      readTime: 9,
      lastUpdated: '5 days ago'
    },
    {
      id: 'parasite-control',
      title: 'Parasite Prevention and Control',
      summary: 'Identifying, treating, and preventing internal and external parasites.',
      category: 'health',
      categoryName: 'Health',
      difficulty: 'medium',
      difficultyText: 'Medium',
      icon: '🔬',
      readTime: 11,
      lastUpdated: '1 week ago'
    }
  ],

  quickReferences: [
    {
      id: 'emergency-contacts',
      title: 'Emergency Veterinary Contacts',
      summary: 'Essential contact information for veterinary emergencies and after-hours care.',
      urgency: 'emergency',
      urgencyIcon: '📞',
      details: [
        { label: 'Local Emergency Vet', value: '24/7 Available' },
        { label: 'Poison Control', value: 'ASPCA: (888) 426-4435' },
        { label: 'Large Animal Vet', value: 'Farm Call Service' }
      ]
    },
    {
      id: 'vital-signs',
      title: 'Normal Vital Signs by Species',
      summary: 'Reference ranges for temperature, heart rate, and respiratory rate.',
      urgency: 'urgent',
      urgencyIcon: '🌡️',
      details: [
        { label: 'Cattle Temperature', value: '101.5°F (38.6°C)' },
        { label: 'Chicken Temperature', value: '107°F (41.7°C)' },
        { label: 'Goat Temperature', value: '102.5°F (39.2°C)' }
      ]
    },
    {
      id: 'feeding-schedule',
      title: 'Daily Feeding Guidelines',
      summary: 'General feeding schedules and portions by animal type and age.',
      urgency: 'normal',
      urgencyIcon: '🍽️',
      details: [
        { label: 'Adult Cattle', value: '2-3% body weight daily' },
        { label: 'Laying Hens', value: '1/4 pound feed daily' },
        { label: 'Growing Pigs', value: '6-8 pounds daily' }
      ]
    },
    {
      id: 'vaccination-schedule',
      title: 'Basic Vaccination Timeline',
      summary: 'Core vaccination schedules for disease prevention.',
      urgency: 'normal',
      urgencyIcon: '💉',
      details: [
        { label: 'Cattle', value: 'Annual boosters required' },
        { label: 'Poultry', value: 'Marek\'s at day 1' },
        { label: 'Goats', value: 'CDT annually' }
      ]
    }
  ],

  categories: [
    { id: 'all', name: 'All Topics', icon: '📚', count: 156 },
    { id: 'nutrition', name: 'Nutrition', icon: '🌾', count: 45 },
    { id: 'health', name: 'Health & Disease', icon: '🏥', count: 62 },
    { id: 'breeding', name: 'Breeding', icon: '👶', count: 28 },
    { id: 'behavior', name: 'Behavior', icon: '🧠', count: 21 },
    { id: 'emergency', name: 'Emergency Care', icon: '🚨', count: 15 },
    { id: 'environment', name: 'Environment', icon: '🏡', count: 25 }
  ]
};

// Helper functions for filtering and searching
export function getAnimalsByType(type) {
  return animalHealthData.animals.filter(animal => animal.type === type);
}

export function getTopicsByCategory(category) {
  if (category === 'all') return animalHealthData.healthTopics;
  return animalHealthData.healthTopics.filter(topic => topic.category === category);
}

export function getTopicsByDifficulty(difficulty) {
  return animalHealthData.healthTopics.filter(topic => topic.difficulty === difficulty);
}

export function getReferencesByUrgency(urgency) {
  return animalHealthData.quickReferences.filter(ref => ref.urgency === urgency);
}

export function searchHealthTopics(query) {
  const searchTerm = query.toLowerCase();
  return animalHealthData.healthTopics.filter(topic => 
    topic.title.toLowerCase().includes(searchTerm) ||
    topic.summary.toLowerCase().includes(searchTerm) ||
    topic.category.toLowerCase().includes(searchTerm)
  );
}

export function getFeaturedTopics() {
  // Return the most recently updated topics
  return animalHealthData.healthTopics
    .sort((a, b) => new Date(b.lastUpdated) - new Date(a.lastUpdated))
    .slice(0, 3);
}

export function getEmergencyReferences() {
  return animalHealthData.quickReferences.filter(ref => ref.urgency === 'emergency');
}
