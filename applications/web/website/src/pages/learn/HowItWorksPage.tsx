import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/Layout';
import { ChevronRight, Thermometer, Utensils, Droplets, Cpu, Play, Clock, Download, Home as HomeIcon, Mic, Link2 } from 'lucide-react';

// Converted from src/pages/how-it-works.js

const steps = [
  {
    number: '01',
    icon: '📦',
    title: 'Unbox & Connect',
    description: 'Receive your Tender Cells system pre-configured and ready to go. Simply connect to power and your WiFi network using our guided setup app.',
    time: '~15 minutes'
  },
  {
    number: '02',
    icon: '📱',
    title: 'Configure Your Farm',
    description: 'Tell us about your animals, set feeding schedules, temperature preferences, and notification settings through our intuitive mobile app.',
    time: '~10 minutes'
  },
  {
    number: '03',
    icon: '🔧',
    title: 'Install Sensors',
    description: 'Place wireless sensors for temperature, humidity, and water levels. Our magnetic mounts make repositioning easy as your needs change.',
    time: '~20 minutes'
  },
  {
    number: '04',
    icon: '✨',
    title: 'Let AI Take Over',
    description: "Our intelligent system learns your animals' patterns and optimizes operations automatically. Monitor everything from anywhere, anytime.",
    time: 'Ongoing'
  }
];

const features = [
  {
    icon: '🌡️',
    title: 'Climate Control',
    description: 'Maintain optimal temperature and humidity levels automatically. Our sensors monitor conditions 24/7 and adjust ventilation, heating, or cooling to keep your animals comfortable.',
    stats: [
      { value: '±0.5°C', label: 'Accuracy' },
      { value: '5sec', label: 'Update Rate' }
    ],
    points: [
      'Automatic temperature regulation',
      'Humidity monitoring and control',
      'Seasonal adjustments',
      'Emergency alerts for extreme conditions'
    ],
    reverse: false
  },
  {
    icon: '🍽️',
    title: 'Automated Feeding',
    description: 'Set it and forget it. Our smart feeders dispense the right amount of food at the right times, tracking consumption patterns and alerting you to any changes.',
    stats: [
      { value: '8', label: 'Schedules/Day' },
      { value: '99.9%', label: 'Reliability' }
    ],
    points: [
      'Customizable feeding schedules',
      'Portion control for each animal',
      'Low-food alerts',
      'Consumption analytics'
    ],
    reverse: true
  },
  {
    icon: '💧',
    title: 'Water Management',
    description: 'Never worry about empty water containers again. Smart sensors monitor water levels, quality, and consumption, triggering automatic refills when needed.',
    stats: [
      { value: '24/7', label: 'Monitoring' },
      { value: 'Auto', label: 'Refill' }
    ],
    points: [
      'Real-time level monitoring',
      'Water quality sensors',
      'Automatic refill triggers',
      'Consumption tracking'
    ],
    reverse: false
  },
  {
    icon: '🤖',
    title: 'Intelligent Insights',
    description: 'Our AI continuously analyzes data from all sensors to identify patterns, predict issues, and provide actionable recommendations for improving animal health and productivity.',
    stats: [
      { value: 'AI', label: 'Powered' },
      { value: '24/7', label: 'Learning' }
    ],
    points: [
      'Behavior pattern recognition',
      'Health anomaly detection',
      'Productivity predictions',
      'Optimization suggestions'
    ],
    reverse: true
  }
];

const appFeatures = [
  { icon: '📊', title: 'Real-time Dashboard', description: 'See all your farm stats at a glance with customizable widgets.' },
  { icon: '🔔', title: 'Smart Notifications', description: 'Get alerts for important events and customize notification preferences.' },
  { icon: '📈', title: 'Analytics & Reports', description: 'Track trends, compare periods, and export detailed reports.' },
  { icon: '🎮', title: 'Remote Control', description: 'Trigger feeding, adjust temperatures, and control devices remotely.' }
];

const integrations = [
  { icon: '🏠', name: 'Home Assistant' },
  { icon: '📱', name: 'Apple HomeKit' },
  { icon: '🔊', name: 'Amazon Alexa' },
  { icon: '🎙️', name: 'Google Home' },
  { icon: '⚡', name: 'IFTTT' },
  { icon: '🔗', name: 'REST API' }
];

export default function HowItWorksPage() {
  const [animatedSteps, setAnimatedSteps] = useState<Set<number>>(new Set());
  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = Number(entry.target.getAttribute('data-index'));
            setAnimatedSteps((prev) => new Set([...prev, index]));
          }
        });
      },
      { threshold: 0.2 }
    );

    stepRefs.current.forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative py-24 px-8 overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center opacity-10">
          <div className="text-[30rem] animate-pulse">🐔</div>
        </div>
        
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <span className="inline-block px-4 py-2 rounded-full bg-emerald-500/20 text-emerald-400 text-sm font-semibold mb-6">
            How It Works
          </span>
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
            Smart Farming Made <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">Simple</span>
          </h1>
          <p className="text-xl text-slate-400 mb-10 max-w-3xl mx-auto">
            From setup to daily operations, discover how Tender Cells transforms 
            your farming experience with intelligent automation and real-time monitoring.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              to="/store"
              className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-semibold rounded-2xl transition-all hover:shadow-xl hover:shadow-emerald-500/25 flex items-center justify-center gap-2"
            >
              Get Started
              <ChevronRight className="w-5 h-5" />
            </Link>
            <button 
              className="w-full sm:w-auto px-8 py-4 bg-white/5 hover:bg-white/10 text-white font-semibold rounded-2xl border border-white/10 transition-all flex items-center justify-center gap-2"
              onClick={() => alert('Demo video would play here')}
            >
              <Play className="w-5 h-5" />
              Watch Demo
            </button>
          </div>
        </div>

        {/* Floating Elements */}
        <div className="absolute top-20 left-10 text-4xl animate-bounce opacity-50">🐔</div>
        <div className="absolute top-40 right-20 text-3xl animate-bounce delay-100 opacity-50">📊</div>
        <div className="absolute bottom-20 left-1/4 text-3xl animate-bounce delay-200 opacity-50">🌡️</div>
        <div className="absolute bottom-40 right-1/4 text-3xl animate-bounce delay-300 opacity-50">💧</div>
      </section>

      {/* Steps Section */}
      <section className="py-24 px-8 bg-white/[0.02]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">Get Up and Running in 4 Simple Steps</h2>
            <p className="text-slate-400 text-lg">Our system is designed for farmers, not engineers. No complex setup required.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, i) => (
              <div 
                key={i}
                ref={(el) => (stepRefs.current[i] = el)}
                data-index={i}
                className={`relative p-8 rounded-2xl bg-white/[0.03] border border-white/10 transition-all duration-700 ${animatedSteps.has(i) ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
                style={{ transitionDelay: `${i * 100}ms` }}
              >
                <div className="absolute -top-4 -left-4 w-10 h-10 rounded-full bg-emerald-500 text-white font-bold flex items-center justify-center text-sm">
                  {step.number}
                </div>
                <div className="text-5xl mb-4">{step.icon}</div>
                <h3 className="text-xl font-bold text-white mb-2">{step.title}</h3>
                <p className="text-slate-400 text-sm mb-4">{step.description}</p>
                <div className="flex items-center gap-2 text-emerald-400 text-sm">
                  <Clock className="w-4 h-4" />
                  {step.time}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Deep Dive */}
      <section className="py-24 px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">Powerful Features Working Together</h2>
            <p className="text-slate-400 text-lg">Every component is designed to work seamlessly, creating an integrated ecosystem for your farm.</p>
          </div>

          <div className="space-y-24">
            {features.map((feature, i) => (
              <div key={i} className={`grid lg:grid-cols-2 gap-16 items-center ${feature.reverse ? 'lg:flex-row-reverse' : ''}`}>
                <div className={feature.reverse ? 'lg:order-2' : ''}>
                  <div className="p-8 rounded-3xl bg-gradient-to-br from-emerald-900/30 to-teal-900/30 border border-emerald-500/20">
                    <div className="text-7xl mb-6">{feature.icon}</div>
                    <div className="grid grid-cols-2 gap-4">
                      {feature.stats.map((stat, j) => (
                        <div key={j} className="text-center p-4 rounded-xl bg-white/5">
                          <div className="text-2xl font-bold text-emerald-400">{stat.value}</div>
                          <div className="text-slate-400 text-sm">{stat.label}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className={feature.reverse ? 'lg:order-1' : ''}>
                  <h3 className="text-3xl font-bold text-white mb-4">{feature.title}</h3>
                  <p className="text-slate-400 text-lg mb-6">{feature.description}</p>
                  <ul className="space-y-3">
                    {feature.points.map((point, j) => (
                      <li key={j} className="flex items-center gap-3 text-slate-300">
                        <span className="w-2 h-2 rounded-full bg-emerald-400" />
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mobile App Section */}
      <section className="py-24 px-8 bg-white/[0.02]">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <span className="inline-block px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 text-sm font-semibold mb-4">
                Mobile App
              </span>
              <h2 className="text-4xl font-bold text-white mb-6">Control Everything From Your Pocket</h2>
              <p className="text-slate-400 text-lg mb-8">
                Our mobile app puts complete farm control at your fingertips. Monitor, adjust, and receive alerts wherever you are.
              </p>

              <div className="grid grid-cols-2 gap-4 mb-8">
                {appFeatures.map((feature, i) => (
                  <div key={i} className="p-4 rounded-xl bg-white/[0.03] border border-white/5">
                    <span className="text-2xl mb-2 block">{feature.icon}</span>
                    <h4 className="text-white font-semibold mb-1">{feature.title}</h4>
                    <p className="text-slate-400 text-sm">{feature.description}</p>
                  </div>
                ))}
              </div>

              <div className="flex gap-4">
                <a href="#" className="flex items-center gap-2 px-6 py-3 bg-black rounded-xl border border-white/10 hover:bg-white/5 transition-colors">
                  <span className="text-2xl">🍎</span>
                  <div className="text-left">
                    <div className="text-xs text-slate-400">Download on</div>
                    <div className="text-white font-semibold">App Store</div>
                  </div>
                </a>
                <a href="#" className="flex items-center gap-2 px-6 py-3 bg-black rounded-xl border border-white/10 hover:bg-white/5 transition-colors">
                  <span className="text-2xl">▶️</span>
                  <div className="text-left">
                    <div className="text-xs text-slate-400">Get it on</div>
                    <div className="text-white font-semibold">Google Play</div>
                  </div>
                </a>
              </div>
            </div>

            {/* Phone Mockup */}
            <div className="flex justify-center">
              <div className="w-64 h-[500px] bg-slate-800 rounded-[3rem] border-4 border-slate-700 p-3 shadow-2xl">
                <div className="w-full h-full bg-slate-900 rounded-[2.5rem] overflow-hidden flex flex-col">
                  <div className="bg-slate-800 px-4 py-3 flex items-center justify-between">
                    <span className="text-white font-semibold">Tender Cells</span>
                    <span className="text-lg">🔔</span>
                  </div>
                  <div className="flex-1 p-4 space-y-4">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-3 rounded-xl bg-emerald-900/30 border border-emerald-500/20">
                        <div className="text-xs text-slate-400 mb-1">Temperature</div>
                        <div className="text-white font-bold">72°F</div>
                      </div>
                      <div className="p-3 rounded-xl bg-blue-900/30 border border-blue-500/20">
                        <div className="text-xs text-slate-400 mb-1">Humidity</div>
                        <div className="text-white font-bold">65%</div>
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-amber-900/30 border border-amber-500/20">
                      <div className="text-xs text-slate-400 mb-1">Feed Level</div>
                      <div className="w-full bg-slate-700 rounded-full h-2 mt-2">
                        <div className="bg-amber-500 h-2 rounded-full" style={{ width: '85%' }} />
                      </div>
                      <div className="text-right text-xs text-white mt-1">85%</div>
                    </div>
                    <div className="h-24 rounded-xl bg-white/5 flex items-center justify-center text-slate-500 text-sm">
                      [Analytics Chart]
                    </div>
                  </div>
                  <div className="px-4 py-3 bg-slate-800 flex justify-around">
                    <span className="text-emerald-400">🏠</span>
                    <span className="text-slate-500">📊</span>
                    <span className="text-slate-500">⚙️</span>
                    <span className="text-slate-500">👤</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Integration Section */}
      <section className="py-24 px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">Works With Your Existing Setup</h2>
            <p className="text-slate-400 text-lg">Tender Cells integrates with popular smart home platforms and services.</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {integrations.map((integration, i) => (
              <div key={i} className="p-6 rounded-2xl bg-white/[0.03] border border-white/10 text-center hover:border-emerald-500/30 transition-colors">
                <div className="text-4xl mb-3">{integration.icon}</div>
                <div className="text-white text-sm font-medium">{integration.name}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-8 bg-gradient-to-b from-transparent via-emerald-950/20 to-transparent">
        <div className="max-w-4xl mx-auto text-center">
          <div className="p-12 rounded-3xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-emerald-500/20">
            <h2 className="text-4xl font-bold text-white mb-4">Ready to Transform Your Farm?</h2>
            <p className="text-slate-300 text-lg mb-8">
              Join thousands of farmers who have already modernized their operations with Tender Cells.
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
                Talk to Sales
              </Link>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}

