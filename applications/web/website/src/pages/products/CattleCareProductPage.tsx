import React from 'react';
import { Link } from 'react-router-dom';
import ProductLayout from '../../components/marketing/ProductLayout';
import { ChevronRight, Check, MapPin, Heart, Leaf, BarChart3, Cpu, Smartphone } from 'lucide-react';

// Converted from src/pages/cattle-care.js

const cattleHealthTopics = [
  {
    id: 'cattle-nutrition',
    title: 'Cattle Nutrition Essentials',
    summary: 'Complete guide to cattle feeding, pasture management, and nutritional requirements.',
    category: 'Nutrition',
    icon: '🌾',
    readTime: 12,
    lastUpdated: '3 days ago'
  },
  {
    id: 'cattle-breeding',
    title: 'Breeding Management',
    summary: 'Comprehensive breeding programs, pregnancy care, and calf management strategies.',
    category: 'Breeding',
    icon: '🐄',
    readTime: 18,
    lastUpdated: '1 week ago'
  },
  {
    id: 'cattle-health-monitoring',
    title: 'Health Monitoring Systems',
    summary: 'Smart monitoring technology for early disease detection and herd health management.',
    category: 'Health',
    icon: '📊',
    readTime: 10,
    lastUpdated: '2 days ago'
  }
];

const cattleReferences = [
  {
    id: 'cattle-emergency',
    title: 'Cattle Emergency Signs',
    summary: 'Critical signs requiring immediate veterinary attention.',
    urgency: 'emergency',
    urgencyIcon: '🚨',
    details: [
      { label: 'Body Temperature', value: 'Normal 101.5°F (38.6°C)' },
      { label: 'Heart Rate', value: '60-70 beats/min' },
      { label: 'Emergency Signs', value: 'Difficulty breathing, bloat' }
    ]
  },
  {
    id: 'cattle-feeding',
    title: 'Daily Feeding Guidelines',
    summary: 'Nutritional requirements and feeding schedules for cattle.',
    urgency: 'normal',
    urgencyIcon: '🍽️',
    details: [
      { label: 'Daily Feed', value: '2-3% of body weight' },
      { label: 'Water', value: '30-50 gallons per day' },
      { label: 'Pasture', value: '0.5-2 acres per head' }
    ]
  }
];

const features = [
  {
    icon: '🐄',
    title: 'Individual Cattle Profiles',
    description: 'Comprehensive profiles with ID tracking, breeding records, health history, and performance metrics for each animal.',
    details: ['RFID/EID tag integration', 'Genealogy tracking', 'Weight gain monitoring', 'Medical history logs']
  },
  {
    icon: '📍',
    title: 'GPS Tracking & Geofencing',
    description: 'Real-time location monitoring with geofencing alerts and movement pattern analysis for optimal grazing management.',
    details: ['Real-time GPS tracking', 'Custom geofence setup', 'Grazing pattern analysis', 'Theft prevention alerts']
  },
  {
    icon: '🏥',
    title: 'Health Monitoring',
    description: 'Continuous health monitoring with early disease detection, temperature tracking, and automated health alerts.',
    details: ['Body temperature monitoring', 'Activity level tracking', 'Eating pattern analysis', 'Disease outbreak detection']
  },
  {
    icon: '🌱',
    title: 'Pasture Management',
    description: 'Intelligent pasture rotation planning, grass condition monitoring, and optimal grazing recommendations.',
    details: ['Grass condition assessment', 'Rotation scheduling', 'Carrying capacity calculation', 'Seasonal planning tools']
  },
  {
    icon: '📊',
    title: 'Analytics Dashboard',
    description: 'Comprehensive analytics with performance insights, financial tracking, and predictive recommendations.',
    details: ['Herd performance metrics', 'Financial analytics', 'Market price integration', 'Predictive insights']
  },
  {
    icon: '💝',
    title: 'Breeding Management',
    description: 'Complete breeding program management with estrus detection, pregnancy tracking, and genetic optimization.',
    details: ['Estrus cycle monitoring', 'Pregnancy confirmation', 'Genetic matching algorithms', 'Calving predictions']
  }
];

const techFeatures = [
  {
    icon: '📡',
    title: 'IoT Sensor Network',
    description: 'Advanced sensor network for comprehensive cattle monitoring',
    specs: [
      { label: 'Range', value: 'Up to 5 miles' },
      { label: 'Battery Life', value: '2+ years' },
      { label: 'Data Points', value: '50+ metrics' }
    ]
  },
  {
    icon: '🤖',
    title: 'AI Health Analysis',
    description: 'Machine learning algorithms for predictive health insights',
    specs: [
      { label: 'Accuracy', value: '95%+ prediction' },
      { label: 'Early Detection', value: '3-7 days advance' },
      { label: 'Learning', value: 'Continuous improvement' }
    ]
  },
  {
    icon: '📱',
    title: 'Mobile Management',
    description: 'Complete farm management from your smartphone',
    specs: [
      { label: 'Platforms', value: 'iOS & Android' },
      { label: 'Offline Mode', value: 'Full functionality' },
      { label: 'Sync', value: 'Real-time cloud' }
    ]
  }
];

const pricingTiers = [
  {
    name: 'Starter Pack',
    price: '$2,499',
    capacity: 'Up to 50 head',
    features: ['50 smart sensors', 'Basic health monitoring', 'GPS tracking', 'Mobile app access', '1-year warranty'],
    featured: false
  },
  {
    name: 'Professional Pack',
    price: '$4,999',
    capacity: 'Up to 200 head',
    features: ['200 smart sensors', 'Advanced health analytics', 'Breeding management', 'Pasture optimization', '2-year warranty', 'Priority support'],
    featured: true
  },
  {
    name: 'Enterprise Pack',
    price: '$9,999',
    capacity: '500+ head',
    features: ['Unlimited sensors', 'Complete farm management', 'Custom integrations', 'On-site training', '3-year warranty', '24/7 support'],
    featured: false
  }
];

export default function CattleCareProductPage() {
  const scrollToHealthGuides = () => {
    document.getElementById('health-guides')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <ProductLayout>
      {/* Hero Section */}
      <section className="py-24 px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <span className="inline-block px-4 py-2 rounded-full bg-emerald-500/20 text-emerald-400 text-sm font-semibold mb-6">
                Available Now
              </span>
              <h1 className="text-5xl font-bold text-white mb-6">Cattle Care</h1>
              <p className="text-2xl text-amber-400 mb-4">
                Comprehensive cattle management and health monitoring
              </p>
              <p className="text-slate-400 text-lg leading-relaxed mb-8">
                Advanced herd management system with GPS tracking, health monitoring, grazing optimization, 
                and breeding management. Designed for modern ranchers and cattle operations of all sizes.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link 
                  to="/store"
                  className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-semibold rounded-2xl transition-all hover:shadow-xl hover:shadow-emerald-500/25 flex items-center gap-2"
                >
                  Shop System - $4,999
                  <ChevronRight className="w-5 h-5" />
                </Link>
                <button 
                  onClick={scrollToHealthGuides}
                  className="px-8 py-4 bg-white/5 hover:bg-white/10 text-white font-semibold rounded-2xl border border-white/10 transition-all"
                >
                  Health Guides
                </button>
                <Link 
                  to="/services?category=veterinary"
                  className="px-8 py-4 bg-white/5 hover:bg-white/10 text-white font-semibold rounded-2xl border border-white/10 transition-all flex items-center gap-2"
                >
                  🏥 Find Local Vets
                </Link>
              </div>
            </div>
            <div className="relative">
              <img 
                src="https://images.pexels.com/photos/422218/pexels-photo-422218.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop" 
                alt="Cattle Care System"
                className="rounded-3xl shadow-2xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Quick References */}
      <section className="py-16 px-8 bg-white/[0.02]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">🐄 Cattle Health Quick References</h2>
            <p className="text-slate-400">Essential information for cattle health management</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {cattleReferences.map((ref) => (
              <div 
                key={ref.id} 
                className={`p-6 rounded-2xl border ${ref.urgency === 'emergency' ? 'bg-red-950/30 border-red-500/30' : 'bg-white/[0.03] border-white/10'}`}
              >
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-3xl">{ref.urgencyIcon}</span>
                  <h3 className="text-xl font-bold text-white">{ref.title}</h3>
                </div>
                <p className="text-slate-400 mb-4">{ref.summary}</p>
                <div className="space-y-2">
                  {ref.details.map((detail, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span className="text-slate-500">{detail.label}:</span>
                      <span className="text-white font-medium">{detail.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Health Topics */}
      <section id="health-guides" className="py-24 px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">Cattle Health & Care Topics</h2>
            <p className="text-slate-400">Comprehensive guides for optimal cattle management</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {cattleHealthTopics.map((topic) => (
              <div key={topic.id} className="p-6 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-white/20 transition-all group">
                <div className="text-4xl mb-4">{topic.icon}</div>
                <span className="inline-block px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-semibold mb-3">
                  {topic.category}
                </span>
                <h3 className="text-xl font-bold text-white mb-2">{topic.title}</h3>
                <p className="text-slate-400 text-sm mb-4">{topic.summary}</p>
                <div className="flex justify-between text-xs text-slate-500">
                  <span>{topic.readTime} min read</span>
                  <span>Updated {topic.lastUpdated}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-8 bg-white/[0.02]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">Cattle Care System Features</h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, i) => (
              <div key={i} className="p-8 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-white/10 transition-all">
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                <p className="text-slate-400 text-sm mb-4">{feature.description}</p>
                <ul className="space-y-2">
                  {feature.details.map((detail, j) => (
                    <li key={j} className="flex items-center gap-2 text-sm text-slate-300">
                      <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      {detail}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Technology Integration */}
      <section className="py-24 px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">Smart Technology Integration</h2>
            <p className="text-slate-400">Cutting-edge technology for modern cattle operations</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {techFeatures.map((tech, i) => (
              <div key={i} className="p-8 rounded-2xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-white/10">
                <div className="text-4xl mb-4">{tech.icon}</div>
                <h3 className="text-xl font-bold text-white mb-2">{tech.title}</h3>
                <p className="text-slate-400 text-sm mb-6">{tech.description}</p>
                <div className="space-y-3">
                  {tech.specs.map((spec, j) => (
                    <div key={j} className="flex justify-between text-sm">
                      <span className="text-slate-500">{spec.label}:</span>
                      <span className="text-white font-medium">{spec.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-24 px-8 bg-gradient-to-b from-transparent via-amber-950/10 to-transparent">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">Cattle Care Packages</h2>
            <p className="text-slate-400">Choose the perfect solution for your herd size and needs</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {pricingTiers.map((tier, i) => (
              <div 
                key={i} 
                className={`p-8 rounded-3xl border ${tier.featured ? 'bg-gradient-to-br from-emerald-900/50 to-teal-900/50 border-emerald-500/30' : 'bg-white/[0.03] border-white/10'}`}
              >
                {tier.featured && (
                  <span className="inline-block px-3 py-1 rounded-full bg-emerald-500 text-white text-xs font-semibold mb-4">
                    Most Popular
                  </span>
                )}
                <h3 className="text-2xl font-bold text-white mb-2">{tier.name}</h3>
                <div className="text-4xl font-bold text-white mb-1">{tier.price}</div>
                <p className="text-slate-400 mb-6">{tier.capacity}</p>
                <ul className="space-y-3 mb-8">
                  {tier.features.map((feature, j) => (
                    <li key={j} className="flex items-center gap-3 text-slate-300">
                      <Check className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link
                  to={tier.name === 'Enterprise Pack' ? '/contact' : '/store'}
                  className={`block w-full py-3 rounded-xl font-semibold text-center transition-all ${tier.featured ? 'bg-white text-slate-900 hover:bg-slate-100' : 'bg-white/10 text-white hover:bg-white/20'}`}
                >
                  {tier.name === 'Enterprise Pack' ? 'Contact Sales' : `Choose ${tier.name.replace(' Pack', '')}`}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>
    </ProductLayout>
  );
}

