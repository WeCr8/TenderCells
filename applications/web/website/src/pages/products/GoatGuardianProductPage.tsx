import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import ProductLayout from '../../components/marketing/ProductLayout';
import { ChevronRight, Check, Mail, Cloud, DollarSign, Building2, Smartphone } from 'lucide-react';

// Converted from src/pages/goat-guardian.js

const features = [
  {
    icon: '🐐',
    title: 'Herd Management',
    description: 'Individual goat tracking, breeding records, kidding management, and milk production monitoring.'
  },
  {
    icon: '🌱',
    title: 'Pasture Management',
    description: 'Rotational grazing optimization, pasture health monitoring, and carrying capacity calculations.'
  },
  {
    icon: '🥛',
    title: 'Milk Production',
    description: 'Daily yield tracking, quality testing records, milking schedule optimization, and production analysis.'
  },
  {
    icon: '🏥',
    title: 'Health & Wellness',
    description: 'Vaccination schedules, hoof trimming reminders, parasite management, and body condition scoring.'
  },
  {
    icon: '📊',
    title: 'Analytics & Insights',
    description: 'Herd performance metrics, breeding success rates, pasture utilization, and financial tracking.'
  },
  {
    icon: '🌍',
    title: 'Sustainability Focus',
    description: 'Carbon footprint tracking, soil health monitoring, and regenerative farming practices.'
  }
];

const sustainabilityBenefits = [
  {
    icon: '🌱',
    title: 'Soil Health Improvement',
    description: 'Monitor soil carbon sequestration and track pasture restoration progress'
  },
  {
    icon: '💧',
    title: 'Water Usage Optimization',
    description: 'Track water consumption and optimize irrigation for maximum efficiency'
  },
  {
    icon: '🦋',
    title: 'Biodiversity Enhancement',
    description: 'Monitor wildlife habitat creation and native plant species integration'
  },
  {
    icon: '📉',
    title: 'Carbon Footprint Tracking',
    description: 'Measure and reduce your operation\'s environmental impact'
  }
];

const roadmap = [
  {
    date: 'Q4 2025',
    title: 'Phase 1: Core Management',
    items: ['Basic goat profile management', 'Simple health record system', 'Milk production tracking', 'Basic analytics dashboard']
  },
  {
    date: 'Q1 2026',
    title: 'Phase 2: Pasture Integration',
    items: ['Pasture mapping and management', 'Rotational grazing scheduler', 'GPS tracking integration', 'Weather data integration']
  },
  {
    date: 'Q2 2026',
    title: 'Phase 3: Advanced Features',
    items: ['AI-powered breeding recommendations', 'Predictive health analytics', 'Market price integration', 'Advanced reporting system']
  }
];

const integrations = [
  { icon: '🌤️', title: 'Weather Services', description: 'Grazing condition forecasts, severe weather alerts, and seasonal planning assistance.' },
  { icon: '💰', title: 'Market Data', description: 'Goat meat and milk price tracking, breeding stock valuations, and feed cost optimization.' },
  { icon: '🏥', title: 'Veterinary Systems', description: 'Health record sharing, appointment scheduling, and treatment plan integration.' },
  { icon: '📱', title: 'Mobile Apps', description: 'Native iOS and Android apps with offline capabilities and real-time synchronization.' }
];

const communityStats = [
  { value: '18+', label: 'Goat Farmers' },
  { value: '5', label: 'Veterinarians' },
  { value: '3', label: 'Universities' }
];

const contributorExpertise = [
  'Goat farming and ranching',
  'Veterinary medicine (small ruminants)',
  'Sustainable farming practices',
  'Agricultural extension services',
  'Software development'
];

export default function GoatGuardianProductPage() {
  const [email, setEmail] = useState('');

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert(`Thank you! We'll keep ${email} updated on Goat Guardian development.`);
    setEmail('');
  };

  return (
    <ProductLayout>
      {/* Hero Section */}
      <section className="py-24 px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <span className="inline-block px-4 py-2 rounded-full bg-stone-500/20 text-stone-400 text-sm font-semibold mb-6">
                In Planning
              </span>
              <h1 className="text-5xl font-bold text-white mb-6">Goat Guardian</h1>
              <p className="text-2xl text-stone-400 mb-4">
                Intelligent goat herd management and pasture optimization
              </p>
              <p className="text-slate-400 text-lg leading-relaxed mb-8">
                Comprehensive goat farming system with rotational grazing optimization, milk production tracking, 
                health monitoring, and breeding management for sustainable goat operations.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <button className="px-8 py-4 bg-stone-600 hover:bg-stone-500 text-white font-semibold rounded-2xl transition-all hover:shadow-xl flex items-center justify-center gap-2">
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
                alt="Goat Guardian System Concept"
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
            <h2 className="text-4xl font-bold text-white mb-4">Planned Features</h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, i) => (
              <div key={i} className="p-8 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-stone-500/30 transition-all group">
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

      {/* Sustainability Section */}
      <section className="py-24 px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl font-bold text-white mb-6">Sustainable & Regenerative Farming</h2>
              <p className="text-slate-400 text-lg mb-8">
                Goat Guardian emphasizes sustainable farming practices that benefit both your operation and the environment.
              </p>
              <div className="space-y-6">
                {sustainabilityBenefits.map((benefit, i) => (
                  <div key={i} className="flex gap-4">
                    <span className="text-3xl flex-shrink-0">{benefit.icon}</span>
                    <div>
                      <h4 className="text-lg font-semibold text-white mb-1">{benefit.title}</h4>
                      <p className="text-slate-400">{benefit.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <img 
                src="https://images.pexels.com/photos/2889440/pexels-photo-2889440.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&fit=crop" 
                alt="Sustainable Goat Farming"
                className="rounded-3xl shadow-xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Development Roadmap */}
      <section className="py-24 px-8 bg-white/[0.02]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">Development Roadmap</h2>
          </div>

          <div className="space-y-8">
            {roadmap.map((phase, i) => (
              <div key={i} className="relative pl-8 border-l-2 border-stone-500/30 pb-8 last:pb-0">
                <div className="absolute -left-2 top-0 w-4 h-4 rounded-full bg-stone-500" />
                <span className="inline-block px-3 py-1 rounded-full bg-stone-500/20 text-stone-400 text-sm font-semibold mb-3">
                  {phase.date}
                </span>
                <h3 className="text-xl font-bold text-white mb-3">{phase.title}</h3>
                <ul className="space-y-2">
                  {phase.items.map((item, j) => (
                    <li key={j} className="flex items-center gap-2 text-slate-400">
                      <Check className="w-4 h-4 text-stone-400 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Integrations */}
      <section className="py-24 px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">Planned Integrations</h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {integrations.map((integration, i) => (
              <div key={i} className="p-6 rounded-2xl bg-white/[0.03] border border-white/10 text-center">
                <div className="text-4xl mb-4">{integration.icon}</div>
                <h3 className="text-lg font-bold text-white mb-2">{integration.title}</h3>
                <p className="text-slate-400 text-sm">{integration.description}</p>
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
              <h2 className="text-4xl font-bold text-white mb-6">Join the Goat Guardian Community</h2>
              <p className="text-slate-400 text-lg mb-6">
                We're building Goat Guardian with input from experienced goat farmers, veterinarians, and sustainable agriculture advocates. 
                Looking for contributors with expertise in:
              </p>
              <ul className="space-y-3 mb-8">
                {contributorExpertise.map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-slate-300">
                    <Check className="w-5 h-5 text-stone-400 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <div className="flex gap-4">
                <button className="px-6 py-3 bg-stone-600 hover:bg-stone-500 text-white font-semibold rounded-xl transition-all">
                  Join Community
                </button>
                <button className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl transition-all">
                  Research Partnerships
                </button>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {communityStats.map((stat, i) => (
                <div key={i} className="p-6 rounded-2xl bg-white/[0.03] border border-white/10 text-center">
                  <div className="text-3xl font-bold text-stone-400 mb-2">{stat.value}</div>
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
          <div className="p-12 rounded-3xl bg-gradient-to-br from-stone-900/30 to-stone-800/30 border border-stone-500/20">
            <h2 className="text-3xl font-bold text-white mb-4">Stay Updated on Goat Guardian</h2>
            <p className="text-slate-400 mb-8">
              Be the first to know about development milestones, beta testing opportunities, and sustainable farming insights.
            </p>
            <form onSubmit={handleNewsletterSubmit} className="flex gap-3">
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email" 
                required
                className="flex-1 px-5 py-3 rounded-xl bg-white/10 border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:border-stone-500/50"
              />
              <button 
                type="submit"
                className="px-6 py-3 bg-stone-600 hover:bg-stone-500 text-white font-semibold rounded-xl transition-all flex items-center gap-2"
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

