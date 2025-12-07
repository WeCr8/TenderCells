import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import ProductLayout from '../../components/marketing/ProductLayout';
import { ChevronRight, Check, Mail, Droplets, Waves, Shield, Thermometer } from 'lucide-react';

// Converted from src/pages/duck-dock.js

const features = [
  {
    icon: '🦆',
    title: 'Flock Management',
    description: 'Individual duck identification, breed-specific care requirements, and comprehensive health tracking.'
  },
  {
    icon: '🏊',
    title: 'Pond & Water Management',
    description: 'Water quality monitoring (pH, oxygen, temperature), automatic level control, and filtration management.'
  },
  {
    icon: '🥚',
    title: 'Egg Production',
    description: 'Daily collection tracking, quality assessment, incubation management, and hatchling care protocols.'
  },
  {
    icon: '🍽️',
    title: 'Feeding Optimization',
    description: 'Species-specific nutrition plans, automated schedules, feed conversion tracking, and seasonal adjustments.'
  },
  {
    icon: '🌡️',
    title: 'Environmental Monitoring',
    description: 'Pond temperature regulation, shelter climate control, weather impact assessment, and predator alerts.'
  },
  {
    icon: '🔬',
    title: 'Water Quality Testing',
    description: 'Automated pH, dissolved oxygen, ammonia, and nitrate monitoring with alert systems.'
  }
];

const speciesVariations = [
  { icon: '🦆', name: 'Mallard Management', description: 'Wild and domestic mallard care optimization' },
  { icon: '🦆', name: 'Pekin Duck Optimization', description: 'Commercial meat production management' },
  { icon: '🦆', name: 'Muscovy Duck Care', description: 'Specialized care for this unique breed' },
  { icon: '🦆', name: 'Wood Duck Conservation', description: 'Native species habitat management' }
];

const iotSensors = [
  { icon: '💧', title: 'Water Quality Sensors', description: 'Real-time monitoring of pH, dissolved oxygen, turbidity, ammonia, and nitrate levels.' },
  { icon: '⚖️', title: 'Automated Systems', description: 'Water level controllers, feeding dispensers, filtration pumps, and heating/cooling systems.' },
  { icon: '📹', title: 'Security Cameras', description: 'Motion detection, predator alerts, and behavioral monitoring with AI analysis.' },
  { icon: '🌡️', title: 'Environmental Sensors', description: 'Temperature, humidity, air quality, and weather monitoring for optimal conditions.' }
];

const roadmap = [
  {
    date: 'Q1 2026',
    title: 'Phase 1: Foundation',
    items: ['Basic flock management system', 'Simple pond monitoring', 'Egg production tracking', 'Basic health records']
  },
  {
    date: 'Q2 2026',
    title: 'Phase 2: Automation',
    items: ['Automated water quality monitoring', 'Smart feeding systems', 'Environmental controls', 'Alert system implementation']
  },
  {
    date: 'Q3 2026',
    title: 'Phase 3: Intelligence',
    items: ['AI-powered health insights', 'Predictive water quality management', 'Optimal breeding recommendations', 'Advanced analytics dashboard']
  }
];

const sustainabilityFeatures = [
  { icon: '💧', title: 'Water Conservation', description: 'Rainwater collection integration and efficient water recycling systems' },
  { icon: '🌿', title: 'Wetland Habitat Creation', description: 'Support local wildlife and enhance biodiversity through managed wetlands' },
  { icon: '🐛', title: 'Natural Pest Control', description: 'Track the pest control benefits ducks provide to surrounding areas' },
  { icon: '📊', title: 'Carbon Footprint Monitoring', description: 'Measure and optimize your operation\'s environmental impact' }
];

const researchAreas = [
  { icon: '🌊', title: 'Optimal Pond Ecosystem Balance', description: 'Researching the ideal balance of beneficial bacteria, aquatic plants, and filtration for healthy pond ecosystems.' },
  { icon: '🤖', title: 'Automated Water Quality Management', description: 'Developing AI systems that can predict and prevent water quality issues before they affect duck health.' },
  { icon: '🦆', title: 'Duck Behavior Pattern Analysis', description: 'Using computer vision to analyze duck behavior patterns for early health issue detection.' },
  { icon: '🛡️', title: 'Predator Deterrent Systems', description: 'Creating humane, automated systems to protect ducks from predators while maintaining natural behaviors.' }
];

const communityStats = [
  { value: '12+', label: 'Duck Farmers' },
  { value: '4', label: 'Conservationists' },
  { value: '2', label: 'Research Institutions' }
];

const contributorExpertise = [
  'Duck farming and breeding',
  'Waterfowl conservation',
  'Aquaculture and pond management',
  'Water quality testing',
  'IoT sensor integration',
  'Mobile app development'
];

export default function DuckDockProductPage() {
  const [email, setEmail] = useState('');

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert(`Thank you! We'll keep ${email} updated on Duck Dock development.`);
    setEmail('');
  };

  return (
    <ProductLayout>
      {/* Hero Section */}
      <section className="py-24 px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <span className="inline-block px-4 py-2 rounded-full bg-teal-500/20 text-teal-400 text-sm font-semibold mb-6">
                In Planning
              </span>
              <h1 className="text-5xl font-bold text-white mb-6">Duck Dock</h1>
              <p className="text-2xl text-teal-400 mb-4">
                Comprehensive waterfowl management with intelligent pond monitoring
              </p>
              <p className="text-slate-400 text-lg leading-relaxed mb-8">
                Advanced duck farming system featuring pond water quality monitoring, automated care scheduling, 
                egg production tracking, and environmental controls for optimal waterfowl management.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <button className="px-8 py-4 bg-teal-500 hover:bg-teal-400 text-white font-semibold rounded-2xl transition-all hover:shadow-xl hover:shadow-teal-500/25 flex items-center justify-center gap-2">
                  Join Development
                  <ChevronRight className="w-5 h-5" />
                </button>
                <button className="px-8 py-4 bg-white/5 hover:bg-white/10 text-white font-semibold rounded-2xl border border-white/10 transition-all">
                  Get Updates
                </button>
              </div>
            </div>
            <div className="relative">
              <img 
                src="https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop" 
                alt="Duck Dock System Concept"
                className="rounded-3xl shadow-2xl"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-teal-500/20 to-transparent rounded-3xl" />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-8 bg-white/[0.02]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">Planned Features</h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, i) => (
              <div key={i} className="p-8 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-teal-500/30 transition-all group">
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

      {/* Species Variations */}
      <section className="py-24 px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl font-bold text-white mb-6">Waterfowl-Specific Features</h2>
              <h3 className="text-xl text-teal-400 mb-4">Species Variations Support</h3>
              <p className="text-slate-400 text-lg mb-8">
                Duck Dock is designed to handle the unique needs of different waterfowl species:
              </p>
              <div className="space-y-6">
                {speciesVariations.map((species, i) => (
                  <div key={i} className="flex gap-4">
                    <span className="text-3xl flex-shrink-0">{species.icon}</span>
                    <div>
                      <h4 className="text-lg font-semibold text-white mb-1">{species.name}</h4>
                      <p className="text-slate-400">{species.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <img 
                src="https://images.pexels.com/photos/2889440/pexels-photo-2889440.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&fit=crop" 
                alt="Duck Pond Management"
                className="rounded-3xl shadow-xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* IoT Sensor Integration */}
      <section className="py-24 px-8 bg-white/[0.02]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">IoT Sensor Integration</h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {iotSensors.map((sensor, i) => (
              <div key={i} className="p-6 rounded-2xl bg-gradient-to-br from-teal-900/20 to-cyan-900/20 border border-teal-500/20">
                <div className="text-4xl mb-4">{sensor.icon}</div>
                <h3 className="text-lg font-bold text-white mb-2">{sensor.title}</h3>
                <p className="text-slate-400 text-sm">{sensor.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Development Timeline */}
      <section className="py-24 px-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">Development Timeline</h2>
          </div>

          <div className="space-y-8">
            {roadmap.map((phase, i) => (
              <div key={i} className="relative pl-8 border-l-2 border-teal-500/30 pb-8 last:pb-0">
                <div className="absolute -left-2 top-0 w-4 h-4 rounded-full bg-teal-500" />
                <span className="inline-block px-3 py-1 rounded-full bg-teal-500/20 text-teal-400 text-sm font-semibold mb-3">
                  {phase.date}
                </span>
                <h3 className="text-xl font-bold text-white mb-3">{phase.title}</h3>
                <ul className="space-y-2">
                  {phase.items.map((item, j) => (
                    <li key={j} className="flex items-center gap-2 text-slate-400">
                      <Check className="w-4 h-4 text-teal-400 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Environmental Sustainability */}
      <section className="py-24 px-8 bg-white/[0.02]">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl font-bold text-white mb-6">Environmental Sustainability</h2>
              <h3 className="text-xl text-teal-400 mb-4">Water Conservation & Ecosystem Benefits</h3>
              <p className="text-slate-400 text-lg mb-8">
                Duck Dock promotes sustainable waterfowl farming that benefits both your operation and the environment.
              </p>
              <div className="space-y-6">
                {sustainabilityFeatures.map((feature, i) => (
                  <div key={i} className="flex gap-4">
                    <span className="text-3xl flex-shrink-0">{feature.icon}</span>
                    <div>
                      <h4 className="text-lg font-semibold text-white mb-1">{feature.title}</h4>
                      <p className="text-slate-400">{feature.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <img 
                src="https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&fit=crop" 
                alt="Sustainable Duck Farming"
                className="rounded-3xl shadow-xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Research Areas */}
      <section className="py-24 px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">Current Research Areas</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {researchAreas.map((area, i) => (
              <div key={i} className="p-8 rounded-2xl bg-gradient-to-br from-teal-900/20 to-cyan-900/20 border border-teal-500/20">
                <h3 className="text-xl font-bold text-white mb-3 flex items-center gap-3">
                  <span className="text-2xl">{area.icon}</span>
                  {area.title}
                </h3>
                <p className="text-slate-400 leading-relaxed">{area.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Community Section */}
      <section className="py-24 px-8 bg-white/[0.02]">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl font-bold text-white mb-6">Join the Duck Dock Community</h2>
              <p className="text-slate-400 text-lg mb-6">
                We're developing Duck Dock with input from waterfowl farmers, conservationists, and aquaculture specialists. 
                We're seeking contributors with experience in:
              </p>
              <ul className="space-y-3 mb-8">
                {contributorExpertise.map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-slate-300">
                    <Check className="w-5 h-5 text-teal-400 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <div className="flex gap-4">
                <button className="px-6 py-3 bg-teal-500 hover:bg-teal-400 text-white font-semibold rounded-xl transition-all">
                  Join Community
                </button>
                <button className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl transition-all">
                  Academic Partnerships
                </button>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {communityStats.map((stat, i) => (
                <div key={i} className="p-6 rounded-2xl bg-white/[0.03] border border-white/10 text-center">
                  <div className="text-3xl font-bold text-teal-400 mb-2">{stat.value}</div>
                  <div className="text-slate-400 text-sm">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-24 px-8">
        <div className="max-w-2xl mx-auto text-center">
          <div className="p-12 rounded-3xl bg-gradient-to-br from-teal-900/30 to-cyan-900/30 border border-teal-500/20">
            <h2 className="text-3xl font-bold text-white mb-4">Stay Updated on Duck Dock Development</h2>
            <p className="text-slate-400 mb-8">
              Get the latest updates on development progress, research findings, and beta testing opportunities.
            </p>
            <form onSubmit={handleNewsletterSubmit} className="flex gap-3">
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email" 
                required
                className="flex-1 px-5 py-3 rounded-xl bg-white/10 border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:border-teal-500/50"
              />
              <button 
                type="submit"
                className="px-6 py-3 bg-teal-500 hover:bg-teal-400 text-white font-semibold rounded-xl transition-all flex items-center gap-2"
              >
                <Mail className="w-5 h-5" />
                Get Updates
              </button>
            </form>
          </div>
        </div>
      </section>
    </ProductLayout>
  );
}

