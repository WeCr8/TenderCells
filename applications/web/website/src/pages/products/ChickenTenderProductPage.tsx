import React from 'react';
import { Link } from 'react-router-dom';
import ProductLayout from '../../components/marketing/ProductLayout';
import { Thermometer, Utensils, BarChart3, Bell, Egg, Smartphone, ChevronRight, Check } from 'lucide-react';

// Converted from src/pages/chicken-tender.js

const features = [
  {
    icon: '🌡️',
    title: 'Climate Control',
    description: 'Automated temperature and humidity monitoring with intelligent ventilation control to keep your chickens comfortable year-round.'
  },
  {
    icon: '🍽️',
    title: 'Smart Feeding',
    description: 'Programmable feeding schedules with portion control and feed level monitoring to ensure optimal nutrition.'
  },
  {
    icon: '📊',
    title: 'Health Analytics',
    description: 'AI-powered health insights with behavior pattern analysis and early disease detection capabilities.'
  },
  {
    icon: '🔔',
    title: 'Smart Alerts',
    description: 'Real-time notifications for temperature changes, feeding schedules, health concerns, and maintenance reminders.'
  },
  {
    icon: '🥚',
    title: 'Egg Production',
    description: 'Track daily egg production with quality assessment and collection scheduling for maximum yield.'
  },
  {
    icon: '📱',
    title: 'Cross-Platform',
    description: 'Native iOS and Android apps plus responsive web interface for monitoring from anywhere.'
  }
];

const specs = [
  { label: 'Dimensions', value: '48" x 36" x 24"' },
  { label: 'Weight', value: '85 lbs' },
  { label: 'Power', value: '12V DC, Solar Compatible' },
  { label: 'Connectivity', value: 'WiFi, Bluetooth' },
  { label: 'Capacity', value: 'Up to 12 chickens' },
  { label: 'Installation', value: '2-4 hours' },
  { label: 'Warranty', value: '2 years full coverage' },
  { label: 'Sensors', value: 'Temperature, Humidity, Motion, Weight' }
];

const pricingFeatures = [
  'Complete smart coop system',
  '95% pre-assembled',
  'All sensors included',
  'Mobile apps (iOS/Android/Web)',
  '2-year warranty',
  '24/7 support',
  'Free software updates',
  'Open source platform'
];

export default function ChickenTenderProductPage() {
  return (
    <ProductLayout>
      {/* Hero Section */}
      <section className="py-24 px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <span className="inline-block px-4 py-2 rounded-full bg-amber-500/20 text-amber-400 text-sm font-semibold mb-6">
                Build/Beta Testing
              </span>
              <h1 className="text-5xl font-bold text-white mb-6">Chicken Tender</h1>
              <p className="text-2xl text-emerald-400 mb-4">
                Intelligent chicken coop management for modern homesteaders
              </p>
              <p className="text-slate-400 text-lg leading-relaxed mb-8">
                Our flagship smart coop system featuring advanced climate control, automated feeding, 
                AI-powered health analytics, and real-time monitoring. Perfect for backyard coops, 
                research facilities, and homesteads of all sizes.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link 
                  to="/store"
                  className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-semibold rounded-2xl transition-all hover:shadow-xl hover:shadow-emerald-500/25 flex items-center justify-center gap-2"
                >
                  Order Now - $2,999
                  <ChevronRight className="w-5 h-5" />
                </Link>
                <button 
                  className="px-8 py-4 bg-white/5 hover:bg-white/10 text-white font-semibold rounded-2xl border border-white/10 transition-all"
                  onClick={() => alert('Demo video would play here')}
                >
                  Watch Demo
                </button>
              </div>
            </div>
            <div className="relative">
              <img 
                src="https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop" 
                alt="Chicken Tender Smart Coop"
                className="rounded-3xl shadow-2xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-8 bg-white/[0.02]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">Advanced Features</h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              Everything you need to manage your flock with intelligence and ease.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, i) => (
              <div key={i} className="p-8 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-white/10 transition-all group">
                <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                <p className="text-slate-400 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Specifications Section */}
      <section className="py-24 px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl font-bold text-white mb-8">Technical Specifications</h2>
              <div className="grid grid-cols-2 gap-6">
                {specs.map((spec, i) => (
                  <div key={i} className="p-4 rounded-xl bg-white/[0.03] border border-white/5">
                    <dt className="text-slate-400 text-sm mb-1">{spec.label}</dt>
                    <dd className="text-white font-semibold">{spec.value}</dd>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <img 
                src="https://images.pexels.com/photos/2889440/pexels-photo-2889440.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&fit=crop" 
                alt="Chicken Tender Components"
                className="rounded-3xl shadow-xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-24 px-8 bg-gradient-to-b from-transparent via-emerald-950/20 to-transparent">
        <div className="max-w-4xl mx-auto">
          <div className="p-12 rounded-3xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-emerald-500/20 text-center">
            <h2 className="text-3xl font-bold text-white mb-2">Chicken Tender v1.0.0</h2>
            <div className="flex items-center justify-center gap-4 mb-2">
              <span className="text-2xl text-slate-500 line-through">$3,499</span>
              <span className="text-5xl font-bold text-white">$2,999</span>
            </div>
            <p className="text-emerald-400 mb-8">Free shipping worldwide</p>

            <div className="grid md:grid-cols-2 gap-4 text-left mb-10 max-w-2xl mx-auto">
              {pricingFeatures.map((feature, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                  <span className="text-slate-300">{feature}</span>
                </div>
              ))}
            </div>

            <Link 
              to="/store"
              className="inline-flex items-center gap-2 px-10 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-semibold rounded-2xl transition-all hover:shadow-xl hover:shadow-emerald-500/25 text-lg"
            >
              Order Now
              <ChevronRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>
    </ProductLayout>
  );
}

