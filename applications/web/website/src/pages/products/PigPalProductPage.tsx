import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import ProductLayout from '../../components/marketing/ProductLayout';
import { ChevronRight, Check, Mail } from 'lucide-react';

// Converted from src/pages/pig-pal.js

const features = [
  {
    icon: '🐷',
    title: 'Pig Management',
    description: 'Individual pig identification, growth tracking, breeding records, and pen assignment with movement tracking.'
  },
  {
    icon: '🍽️',
    title: 'Automated Feeding',
    description: 'Smart feeding schedules with portion control, feed conversion tracking, and nutritional optimization.'
  },
  {
    icon: '🏥',
    title: 'Health Monitoring',
    description: 'Vaccination schedules, disease prevention protocols, health alerts, and veterinary record management.'
  },
  {
    icon: '🌡️',
    title: 'Environmental Control',
    description: 'Temperature and humidity monitoring with automated ventilation and air quality management.'
  },
  {
    icon: '📊',
    title: 'Production Analytics',
    description: 'Growth rate analysis, feed efficiency metrics, breeding performance, and financial tracking.'
  },
  {
    icon: '🔧',
    title: 'IoT Integration',
    description: 'Weight scales, environmental sensors, automated feeders, and water monitoring systems.'
  }
];

const roadmap = [
  {
    date: 'Q3 2025',
    title: 'Phase 1: Foundation',
    items: ['Basic pig management system', 'Individual pig profiles', 'Simple feeding schedules', 'Basic health records']
  },
  {
    date: 'Q4 2025',
    title: 'Phase 2: Automation',
    items: ['Automated feeding systems', 'Environmental monitoring', 'Alert system implementation', 'Mobile app integration']
  },
  {
    date: 'Q1 2026',
    title: 'Phase 3: Intelligence',
    items: ['AI-powered health insights', 'Predictive analytics', 'Optimization recommendations', 'Market integration']
  }
];

const researchAreas = [
  {
    icon: '🧠',
    title: 'Optimal Feeding Algorithms',
    description: 'Developing AI models to optimize feed conversion ratios and reduce waste through personalized feeding schedules.'
  },
  {
    icon: '🔬',
    title: 'Disease Prediction Models',
    description: 'Creating early warning systems using behavioral patterns and environmental data to predict health issues.'
  },
  {
    icon: '🌡️',
    title: 'Environmental Optimization',
    description: 'Researching ideal climate conditions for different pig breeds and growth stages to maximize comfort and productivity.'
  },
  {
    icon: '📈',
    title: 'Behavioral Analysis',
    description: 'Studying pig behavior patterns to identify stress indicators and optimize living conditions.'
  }
];

const communityStats = [
  { value: '25+', label: 'Interested Farmers' },
  { value: '8', label: 'Research Partners' },
  { value: '12', label: 'Contributors' }
];

const contributorExpertise = [
  'Swine farming and management',
  'IoT sensor integration',
  'Agricultural automation',
  'Veterinary medicine',
  'React/TypeScript development'
];

export default function PigPalProductPage() {
  const [email, setEmail] = useState('');

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert(`Thank you! We'll keep ${email} updated on Pig Pal development.`);
    setEmail('');
  };

  return (
    <ProductLayout>
      {/* Hero Section */}
      <section className="py-24 px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <span className="inline-block px-4 py-2 rounded-full bg-pink-500/20 text-pink-400 text-sm font-semibold mb-6">
                In Planning
              </span>
              <h1 className="text-5xl font-bold text-white mb-6">Pig Pal</h1>
              <p className="text-2xl text-pink-400 mb-4">
                Smart pig farming with automated feeding and health tracking
              </p>
              <p className="text-slate-400 text-lg leading-relaxed mb-8">
                Comprehensive swine management system featuring automated feeding, environmental control, 
                health monitoring, and growth tracking. Perfect for commercial operations and homestead pig farming.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <button className="px-8 py-4 bg-pink-500 hover:bg-pink-400 text-white font-semibold rounded-2xl transition-all hover:shadow-xl hover:shadow-pink-500/25 flex items-center justify-center gap-2">
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
                alt="Pig Pal System Concept"
                className="rounded-3xl shadow-2xl"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-pink-500/20 to-transparent rounded-3xl" />
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
              <div key={i} className="p-8 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-pink-500/30 transition-all group">
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

      {/* Development Timeline */}
      <section className="py-24 px-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">Development Timeline</h2>
          </div>

          <div className="space-y-8">
            {roadmap.map((phase, i) => (
              <div key={i} className="relative pl-8 border-l-2 border-pink-500/30 pb-8 last:pb-0">
                <div className="absolute -left-2 top-0 w-4 h-4 rounded-full bg-pink-500" />
                <span className="inline-block px-3 py-1 rounded-full bg-pink-500/20 text-pink-400 text-sm font-semibold mb-3">
                  {phase.date}
                </span>
                <h3 className="text-xl font-bold text-white mb-3">{phase.title}</h3>
                <ul className="space-y-2">
                  {phase.items.map((item, j) => (
                    <li key={j} className="flex items-center gap-2 text-slate-400">
                      <Check className="w-4 h-4 text-pink-400 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Research Areas */}
      <section className="py-24 px-8 bg-white/[0.02]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">Current Research Areas</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {researchAreas.map((area, i) => (
              <div key={i} className="p-8 rounded-2xl bg-gradient-to-br from-pink-900/20 to-rose-900/20 border border-pink-500/20">
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
      <section className="py-24 px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl font-bold text-white mb-6">Join the Development Community</h2>
              <p className="text-slate-400 text-lg mb-6">
                Pig Pal is being developed with input from swine farmers, veterinarians, and agricultural experts. 
                We're looking for contributors with experience in:
              </p>
              <ul className="space-y-3 mb-8">
                {contributorExpertise.map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-slate-300">
                    <Check className="w-5 h-5 text-pink-400 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <div className="flex gap-4">
                <button className="px-6 py-3 bg-pink-500 hover:bg-pink-400 text-white font-semibold rounded-xl transition-all">
                  Join Discord
                </button>
                <button className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl transition-all">
                  View GitHub
                </button>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {communityStats.map((stat, i) => (
                <div key={i} className="p-6 rounded-2xl bg-white/[0.03] border border-white/10 text-center">
                  <div className="text-3xl font-bold text-pink-400 mb-2">{stat.value}</div>
                  <div className="text-slate-400 text-sm">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-24 px-8 bg-gradient-to-b from-transparent via-pink-950/20 to-transparent">
        <div className="max-w-2xl mx-auto text-center">
          <div className="p-12 rounded-3xl bg-gradient-to-br from-pink-900/30 to-rose-900/30 border border-pink-500/20">
            <h2 className="text-3xl font-bold text-white mb-4">Stay Updated on Pig Pal Development</h2>
            <p className="text-slate-400 mb-8">
              Get notified about development progress, beta testing opportunities, and launch updates.
            </p>
            <form onSubmit={handleNewsletterSubmit} className="flex gap-3">
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email" 
                required
                className="flex-1 px-5 py-3 rounded-xl bg-white/10 border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:border-pink-500/50"
              />
              <button 
                type="submit"
                className="px-6 py-3 bg-pink-500 hover:bg-pink-400 text-white font-semibold rounded-xl transition-all flex items-center gap-2"
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

