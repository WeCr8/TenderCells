import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/Layout';
import { ChevronRight, Shield, Cpu, Radio, Wifi, Lock, Github } from 'lucide-react';

// Converted from src/pages/technology.js

const coreTechnologies = [
  {
    icon: '🔌',
    title: 'Edge Computing',
    description: 'All critical operations run locally on our custom hardware. Your farm stays operational even without internet, with data syncing when connectivity returns.',
    specs: [
      { label: 'Processor', value: 'ARM Cortex-A72' },
      { label: 'Memory', value: '4GB LPDDR4' },
      { label: 'Storage', value: '64GB eMMC' }
    ],
    featured: false
  },
  {
    icon: '🧠',
    title: 'Machine Learning',
    description: 'Our proprietary ML models analyze behavior patterns, predict health issues, and optimize operations. Trained on millions of data points from real farms.',
    specs: [
      { label: 'Models', value: 'TenderNet v3' },
      { label: 'Inference', value: '<50ms' },
      { label: 'Accuracy', value: '98.5%' }
    ],
    featured: true
  },
  {
    icon: '📡',
    title: 'Wireless Mesh',
    description: 'Our sensors communicate via a self-healing mesh network. Add devices anywhere on your property—they automatically find the best connection path.',
    specs: [
      { label: 'Protocol', value: 'Zigbee 3.0' },
      { label: 'Range', value: '100m+' },
      { label: 'Devices', value: '250+ per hub' }
    ],
    featured: false
  }
];

const hardwareFeatures = [
  { icon: '💪', title: 'IP67 Rated', description: 'Dust-proof and waterproof. Survives power washes, rain, and dust storms.' },
  { icon: '🌡️', title: 'Extreme Temps', description: 'Operates reliably from -40°F to 140°F (-40°C to 60°C).' },
  { icon: '⚡', title: 'Low Power', description: 'Sensors run 2+ years on a single battery. Solar options available.' },
  { icon: '🔧', title: 'Field Repairable', description: 'Modular design means you can replace parts, not entire units.' }
];

const aiCapabilities = [
  {
    icon: '🔍',
    title: 'Anomaly Detection',
    description: 'Automatically identifies unusual patterns in temperature, feeding, water consumption, or animal behavior that might indicate health issues.',
    stat: { value: '6 hours', label: 'Average early warning time' }
  },
  {
    icon: '📈',
    title: 'Predictive Analytics',
    description: 'Forecasts egg production, growth rates, and resource needs based on historical data and current conditions.',
    stat: { value: '92%', label: 'Prediction accuracy' }
  },
  {
    icon: '⚡',
    title: 'Optimization Engine',
    description: 'Continuously adjusts feeding schedules, climate settings, and lighting to maximize health and productivity while minimizing costs.',
    stat: { value: '23%', label: 'Average efficiency gain' }
  },
  {
    icon: '🎯',
    title: 'Computer Vision',
    description: 'Our cameras use AI to monitor animal activity, detect health symptoms, count populations, and identify individual animals.',
    stat: { value: '98.5%', label: 'Recognition accuracy' }
  }
];

const securityFeatures = [
  { icon: '🔐', text: 'End-to-end encryption (AES-256)' },
  { icon: '🌐', text: 'TLS 1.3 for all communications' },
  { icon: '🔑', text: 'Two-factor authentication' },
  { icon: '📋', text: 'SOC 2 Type II certified' },
  { icon: '🇪🇺', text: 'GDPR compliant' },
  { icon: '💾', text: 'Local data ownership option' }
];

const roadmapItems = [
  { date: 'Q1 2024', title: 'TenderNet v3 AI Engine', description: 'Next-generation ML models with 40% better prediction accuracy.', status: 'completed' },
  { date: 'Q2 2024', title: 'Voice Control Integration', description: 'Full Alexa and Google Assistant support for hands-free operation.', status: 'completed' },
  { date: 'Q3 2024', title: 'Solar-Powered Sensors', description: 'Completely self-sufficient sensors with integrated solar panels.', status: 'current' },
  { date: 'Q4 2024', title: 'Multi-Farm Dashboard', description: 'Manage multiple locations from a single unified interface.', status: 'upcoming' },
  { date: '2025', title: 'Autonomous Drone Integration', description: 'Automated aerial monitoring and inspection capabilities.', status: 'upcoming' }
];

const openSourceStats = [
  { value: '50K+', label: 'GitHub Stars' },
  { value: '2,500+', label: 'Contributors' },
  { value: 'MIT', label: 'License' }
];

export default function TechnologyPage() {
  const [animatedCards, setAnimatedCards] = useState<Set<number>>(new Set());
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = Number(entry.target.getAttribute('data-index'));
            setAnimatedCards((prev) => new Set([...prev, index]));
          }
        });
      },
      { threshold: 0.2 }
    );

    cardRefs.current.forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative py-24 px-8 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-emerald-500/20 via-transparent to-transparent" />
          {/* Circuit Pattern */}
          <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <pattern id="circuit" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
              <path d="M 50 0 L 50 40 M 50 60 L 50 100 M 0 50 L 40 50 M 60 50 L 100 50" stroke="currentColor" strokeWidth="0.5" fill="none" opacity="0.3" />
              <circle cx="50" cy="50" r="3" fill="currentColor" opacity="0.5" />
            </pattern>
            <rect width="100%" height="100%" fill="url(#circuit)" />
          </svg>
        </div>

        <div className="max-w-5xl mx-auto text-center relative z-10">
          <span className="inline-block px-4 py-2 rounded-full bg-emerald-500/20 text-emerald-400 text-sm font-semibold mb-6">
            Our Technology
          </span>
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
            Built for the <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">Future</span> of Farming
          </h1>
          <p className="text-xl text-slate-400 max-w-3xl mx-auto">
            Combining cutting-edge hardware, advanced AI, and open-source software 
            to create the most intelligent farming system on the planet.
          </p>
        </div>
      </section>

      {/* Core Technologies */}
      <section className="py-24 px-8 bg-white/[0.02]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">Core Technologies</h2>
            <p className="text-slate-400 text-lg">The building blocks that power every Tender Cells system.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {coreTechnologies.map((tech, i) => (
              <div 
                key={i}
                ref={(el) => (cardRefs.current[i] = el)}
                data-index={i}
                className={`p-8 rounded-2xl transition-all duration-700 ${tech.featured ? 'bg-gradient-to-br from-emerald-900/50 to-teal-900/50 border-2 border-emerald-500/30' : 'bg-white/[0.03] border border-white/10'} ${animatedCards.has(i) ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
                style={{ transitionDelay: `${i * 100}ms` }}
              >
                <div className="text-5xl mb-4">{tech.icon}</div>
                <h3 className="text-2xl font-bold text-white mb-3">{tech.title}</h3>
                <p className="text-slate-400 mb-6">{tech.description}</p>
                <div className="space-y-2">
                  {tech.specs.map((spec, j) => (
                    <div key={j} className="flex justify-between text-sm">
                      <span className="text-slate-500">{spec.label}</span>
                      <span className="text-white font-medium">{spec.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Hardware Section */}
      <section className="py-24 px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <span className="inline-block px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 text-sm font-semibold mb-4">
                Hardware
              </span>
              <h2 className="text-4xl font-bold text-white mb-6">Purpose-Built for Farm Environments</h2>
              <p className="text-slate-400 text-lg mb-8">
                Consumer electronics fail in barns. That's why we designed hardware from scratch to withstand the realities of agricultural life.
              </p>

              <div className="grid grid-cols-2 gap-4">
                {hardwareFeatures.map((feature, i) => (
                  <div key={i} className="p-4 rounded-xl bg-white/[0.03] border border-white/5">
                    <div className="text-2xl mb-2">{feature.icon}</div>
                    <h4 className="text-white font-semibold mb-1">{feature.title}</h4>
                    <p className="text-slate-400 text-sm">{feature.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Hardware Showcase */}
            <div className="grid grid-cols-2 gap-4">
              {['Smart Hub', 'Climate Sensor', 'AI Camera', 'Smart Feeder'].map((item, i) => (
                <div 
                  key={i}
                  className="aspect-square rounded-2xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-white/10 flex items-center justify-center hover:border-emerald-500/50 transition-colors cursor-pointer group"
                >
                  <div className="text-center">
                    <div className="text-4xl mb-2 group-hover:scale-110 transition-transform">
                      {i === 0 ? '🔌' : i === 1 ? '🌡️' : i === 2 ? '📹' : '🍽️'}
                    </div>
                    <div className="text-white text-sm font-medium">{item}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* AI & Analytics */}
      <section className="py-24 px-8 bg-white/[0.02]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">AI-Powered Analytics</h2>
            <p className="text-slate-400 text-lg">Our machine learning models turn raw sensor data into actionable insights.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {aiCapabilities.map((ai, i) => (
              <div key={i} className="p-6 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-emerald-500/30 transition-colors">
                <div className="text-4xl mb-4">{ai.icon}</div>
                <h3 className="text-xl font-bold text-white mb-2">{ai.title}</h3>
                <p className="text-slate-400 text-sm mb-4">{ai.description}</p>
                <div className="pt-4 border-t border-white/5">
                  <div className="text-2xl font-bold text-emerald-400">{ai.stat.value}</div>
                  <div className="text-slate-500 text-sm">{ai.stat.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section className="py-24 px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="flex justify-center">
              <div className="relative w-48 h-48">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-6xl">🛡️</div>
                </div>
                <div className="absolute inset-0 border-2 border-emerald-500/30 rounded-full animate-pulse" />
                <div className="absolute inset-4 border border-emerald-500/20 rounded-full animate-ping" style={{ animationDuration: '2s' }} />
                <div className="absolute inset-8 border border-emerald-500/10 rounded-full animate-ping" style={{ animationDuration: '3s' }} />
              </div>
            </div>

            <div>
              <span className="inline-block px-3 py-1 rounded-full bg-purple-500/20 text-purple-400 text-sm font-semibold mb-4">
                Security
              </span>
              <h2 className="text-4xl font-bold text-white mb-6">Your Data, Protected</h2>
              <p className="text-slate-400 text-lg mb-8">
                We take security seriously. Your farm data is encrypted, protected, and never sold to third parties.
              </p>

              <div className="grid grid-cols-2 gap-4">
                {securityFeatures.map((feature, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-xl">{feature.icon}</span>
                    <span className="text-slate-300 text-sm">{feature.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Open Source Section */}
      <section className="py-24 px-8 bg-white/[0.02]">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <span className="inline-block px-3 py-1 rounded-full bg-orange-500/20 text-orange-400 text-sm font-semibold mb-4">
                Open Source
              </span>
              <h2 className="text-4xl font-bold text-white mb-6">Built in the Open</h2>
              <p className="text-slate-400 text-lg mb-8">
                We believe in transparency and community. Large portions of our codebase are open source, allowing farmers, developers, and researchers to inspect, modify, and contribute.
              </p>

              <div className="flex gap-8 mb-8">
                {openSourceStats.map((stat, i) => (
                  <div key={i}>
                    <div className="text-3xl font-bold text-emerald-400">{stat.value}</div>
                    <div className="text-slate-500 text-sm">{stat.label}</div>
                  </div>
                ))}
              </div>

              <Link 
                to="/open-source"
                className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-white font-semibold rounded-xl transition-all"
              >
                <Github className="w-5 h-5" />
                Explore Our Repos
              </Link>
            </div>

            {/* Code Block */}
            <div className="bg-slate-900 rounded-2xl border border-white/10 overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 bg-slate-800/50 border-b border-white/5">
                <span className="w-3 h-3 rounded-full bg-red-500" />
                <span className="w-3 h-3 rounded-full bg-yellow-500" />
                <span className="w-3 h-3 rounded-full bg-green-500" />
                <span className="ml-4 text-slate-400 text-sm">tender-cells/core</span>
              </div>
              <pre className="p-6 text-sm overflow-x-auto">
                <code className="text-slate-300">
                  <span className="text-slate-500">// Monitor chicken health</span>{'\n'}
                  <span className="text-purple-400">const</span> health = <span className="text-purple-400">await</span> tender{'\n'}
                  {'  '}.flock(<span className="text-emerald-400">'main-coop'</span>){'\n'}
                  {'  '}.analyze({'{'}
                  {'\n'}
                  {'    '}metrics: [<span className="text-emerald-400">'activity'</span>, <span className="text-emerald-400">'feeding'</span>],{'\n'}
                  {'    '}period: <span className="text-emerald-400">'24h'</span>{'\n'}
                  {'  '}{'}'}){';'}{'\n'}
                  {'\n'}
                  <span className="text-purple-400">if</span> (health.anomalies.length {'>'} <span className="text-amber-400">0</span>) {'{'}{'\n'}
                  {'  '}tender.alert(health.anomalies){';'}{'\n'}
                  {'}'}{'\n'}
                </code>
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* Roadmap Section */}
      <section className="py-24 px-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">Technology Roadmap</h2>
            <p className="text-slate-400 text-lg">See what we're building next to make your farm even smarter.</p>
          </div>

          <div className="space-y-6">
            {roadmapItems.map((item, i) => (
              <div 
                key={i}
                className={`relative pl-8 pb-6 border-l-2 ${item.status === 'completed' ? 'border-emerald-500' : item.status === 'current' ? 'border-amber-500' : 'border-slate-700'}`}
              >
                <div className={`absolute -left-2 top-0 w-4 h-4 rounded-full ${item.status === 'completed' ? 'bg-emerald-500' : item.status === 'current' ? 'bg-amber-500 animate-pulse' : 'bg-slate-700'}`} />
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold mb-2 ${item.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' : item.status === 'current' ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-500/20 text-slate-400'}`}>
                  {item.date}
                </span>
                <h4 className="text-xl font-bold text-white mb-1">{item.title}</h4>
                <p className="text-slate-400">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-8 bg-gradient-to-b from-transparent via-emerald-950/20 to-transparent">
        <div className="max-w-4xl mx-auto text-center">
          <div className="p-12 rounded-3xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-emerald-500/20">
            <h2 className="text-4xl font-bold text-white mb-4">Experience the Technology</h2>
            <p className="text-slate-300 text-lg mb-8">
              See how Tender Cells can transform your farming operation.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link 
                to="/store"
                className="w-full sm:w-auto px-8 py-4 bg-white text-slate-900 font-semibold rounded-2xl hover:bg-slate-100 transition-all flex items-center justify-center gap-2"
              >
                Shop Now
                <ChevronRight className="w-5 h-5" />
              </Link>
              <Link 
                to="/contact"
                className="w-full sm:w-auto px-8 py-4 bg-transparent text-white font-semibold rounded-2xl border border-white/20 hover:bg-white/5 transition-all"
              >
                Request Demo
              </Link>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}

