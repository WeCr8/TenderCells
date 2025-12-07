import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Thermometer, 
  Utensils, 
  BarChart3, 
  Bell, 
  ChevronRight,
  Shield,
  Zap,
  Users,
  Github
} from 'lucide-react';

interface ProductCardProps {
  emoji: string;
  name: string;
  description: string;
  status: 'available' | 'beta' | 'coming-soon';
  link: string;
  color: string;
}

const ProductCard: React.FC<ProductCardProps> = ({ emoji, name, description, status, link, color }) => {
  const statusLabels = {
    'available': { text: 'Available Now', bg: 'bg-emerald-500' },
    'beta': { text: 'Build/Beta Testing', bg: 'bg-amber-500' },
    'coming-soon': { text: 'Coming Soon', bg: 'bg-slate-500' }
  };

  return (
    <Link 
      to={link}
      className={`group relative overflow-hidden rounded-3xl p-8 transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl ${color}`}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      <div className="relative z-10">
        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold text-white mb-4 ${statusLabels[status].bg}`}>
          {statusLabels[status].text}
        </span>
        
        <div className="text-6xl mb-4 transform group-hover:scale-110 transition-transform duration-300">
          {emoji}
        </div>
        
        <h3 className="text-2xl font-bold text-white mb-2">{name}</h3>
        <p className="text-white/80 text-sm leading-relaxed mb-6">{description}</p>
        
        <div className="flex items-center text-white font-medium">
          Learn More
          <ChevronRight className="w-4 h-4 ml-1 transform group-hover:translate-x-2 transition-transform" />
        </div>
      </div>
    </Link>
  );
};

export default function LandingPage() {
  const products: ProductCardProps[] = [
    {
      emoji: '🐔',
      name: 'Chicken Tender',
      description: 'Our flagship app for intelligent chicken coop management. Monitor temperature, humidity, feeding schedules, and health metrics with AI-powered insights.',
      status: 'beta',
      link: '/products/chicken-tender',
      color: 'bg-gradient-to-br from-amber-600 to-orange-700'
    },
    {
      emoji: '🐄',
      name: 'Cattle Care',
      description: 'Comprehensive cattle management and health monitoring for ranches of all sizes.',
      status: 'coming-soon',
      link: '/products/cattle-care',
      color: 'bg-gradient-to-br from-amber-800 to-yellow-900'
    },
    {
      emoji: '🐷',
      name: 'Pig Pal',
      description: 'Smart pig farming with automated feeding and health tracking systems.',
      status: 'coming-soon',
      link: '/products/pig-pal',
      color: 'bg-gradient-to-br from-pink-500 to-rose-600'
    },
    {
      emoji: '🐐',
      name: 'Goat Guardian',
      description: 'Intelligent goat herd management and pasture optimization tools.',
      status: 'coming-soon',
      link: '/products/goat-guardian',
      color: 'bg-gradient-to-br from-stone-600 to-stone-800'
    },
    {
      emoji: '🦆',
      name: 'Duck Dock',
      description: 'Waterfowl management with pond monitoring and care scheduling.',
      status: 'coming-soon',
      link: '/products/duck-dock',
      color: 'bg-gradient-to-br from-teal-500 to-cyan-700'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      {/* Hero Section */}
      <header className="relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-900/20 via-transparent to-transparent" />
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>

        <nav className="relative z-10 flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-2xl shadow-lg shadow-emerald-500/25">
              🌱
            </div>
            <span className="text-2xl font-bold text-white">Tender Cells</span>
          </div>
          
          <div className="hidden md:flex items-center gap-8">
            <Link to="/products" className="text-slate-300 hover:text-white transition-colors">Products</Link>
            <Link to="/about" className="text-slate-300 hover:text-white transition-colors">About</Link>
            <Link to="/community" className="text-slate-300 hover:text-white transition-colors">Community</Link>
            <a href="https://github.com/tendercells" target="_blank" rel="noopener noreferrer" className="text-slate-300 hover:text-white transition-colors">
              <Github className="w-5 h-5" />
            </a>
          </div>

          <div className="flex items-center gap-4">
            <Link to="/signin" className="text-slate-300 hover:text-white transition-colors">Sign In</Link>
            <Link 
              to="/signup" 
              className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-white font-semibold rounded-xl transition-all hover:shadow-lg hover:shadow-emerald-500/25"
            >
              Get Started
            </Link>
          </div>
        </nav>

        <div className="relative z-10 max-w-7xl mx-auto px-8 pt-20 pb-32 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium mb-8">
            <Zap className="w-4 h-4" />
            Now in Beta: Chicken Tender v1.0
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
            Smart Farming for
            <span className="block bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent">
              Modern Homesteaders
            </span>
          </h1>
          
          <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-12 leading-relaxed">
            AI-powered animal monitoring and automation. From backyard chickens to commercial operations, 
            we help you care for your animals smarter.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              to="/signup"
              className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-semibold rounded-2xl transition-all hover:shadow-xl hover:shadow-emerald-500/25 flex items-center justify-center gap-2"
            >
              Start Free Trial
              <ChevronRight className="w-5 h-5" />
            </Link>
            <Link 
              to="/products/chicken-tender"
              className="w-full sm:w-auto px-8 py-4 bg-white/5 hover:bg-white/10 text-white font-semibold rounded-2xl border border-white/10 transition-all flex items-center justify-center gap-2"
            >
              <span className="text-xl">🐔</span>
              Try Chicken Tender
            </Link>
          </div>
        </div>
      </header>

      {/* Features Strip */}
      <section className="relative py-12 border-y border-white/5 bg-white/[0.02]">
        <div className="max-w-7xl mx-auto px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { icon: Thermometer, label: 'Climate Control', color: 'text-rose-400' },
              { icon: Utensils, label: 'Smart Feeding', color: 'text-amber-400' },
              { icon: BarChart3, label: 'Health Analytics', color: 'text-emerald-400' },
              { icon: Bell, label: 'Smart Alerts', color: 'text-blue-400' }
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-3 justify-center">
                <feature.icon className={`w-6 h-6 ${feature.color}`} />
                <span className="text-white font-medium">{feature.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section className="py-24 px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">Our Products</h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              A complete ecosystem of smart farming applications, each designed for specific animal care needs.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product, i) => (
              <ProductCard key={i} {...product} />
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-24 px-8 bg-gradient-to-b from-transparent via-emerald-950/20 to-transparent">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            {[
              { value: '15K+', label: 'Active Farms' },
              { value: '2.5M+', label: 'Animals Monitored' },
              { value: '35%', label: 'Avg. Productivity Gain' },
              { value: '50K+', label: 'GitHub Stars' }
            ].map((stat, i) => (
              <div key={i} className="p-6">
                <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent mb-2">
                  {stat.value}
                </div>
                <div className="text-slate-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-24 px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">Why Tender Cells?</h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              Built by farmers, for farmers. We understand the challenges of modern agriculture.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Shield,
                title: 'Reliable & Secure',
                description: 'Enterprise-grade security with local-first architecture. Your farm keeps running even without internet.',
                color: 'from-blue-500 to-indigo-600'
              },
              {
                icon: Zap,
                title: 'AI-Powered',
                description: 'Machine learning models trained on millions of data points to predict issues before they become problems.',
                color: 'from-amber-500 to-orange-600'
              },
              {
                icon: Users,
                title: 'Open Source',
                description: 'Large portions of our codebase are open source. Inspect, modify, and contribute to the platform.',
                color: 'from-emerald-500 to-teal-600'
              }
            ].map((feature, i) => (
              <div key={i} className="group p-8 rounded-3xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all hover:bg-white/[0.04]">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                <p className="text-slate-400 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="p-12 rounded-3xl bg-gradient-to-br from-emerald-900/50 to-teal-900/50 border border-emerald-500/20">
            <h2 className="text-4xl font-bold text-white mb-4">Ready to Get Started?</h2>
            <p className="text-slate-300 text-lg mb-8 max-w-xl mx-auto">
              Join thousands of farmers who are already using Tender Cells to manage their operations smarter.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link 
                to="/signup"
                className="w-full sm:w-auto px-8 py-4 bg-white text-slate-900 font-semibold rounded-2xl hover:bg-slate-100 transition-all flex items-center justify-center gap-2"
              >
                Create Free Account
                <ChevronRight className="w-5 h-5" />
              </Link>
              <Link 
                to="/contact"
                className="w-full sm:w-auto px-8 py-4 bg-transparent text-white font-semibold rounded-2xl border border-white/20 hover:bg-white/5 transition-all"
              >
                Contact Sales
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 px-8 border-t border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-xl">
                  🌱
                </div>
                <span className="text-xl font-bold text-white">Tender Cells</span>
              </div>
              <p className="text-slate-400 text-sm">
                Smart farming solutions for modern homesteaders and commercial operations.
              </p>
            </div>
            
            {[
              {
                title: 'Products',
                links: [
                  { label: 'Chicken Tender', href: '/products/chicken-tender' },
                  { label: 'Cattle Care', href: '/products/cattle-care' },
                  { label: 'Pig Pal', href: '/products/pig-pal' },
                  { label: 'Goat Guardian', href: '/products/goat-guardian' },
                  { label: 'Duck Dock', href: '/products/duck-dock' }
                ]
              },
              {
                title: 'Resources',
                links: [
                  { label: 'Documentation', href: '/docs' },
                  { label: 'API Reference', href: '/api' },
                  { label: 'Community', href: '/community' },
                  { label: 'Blog', href: '/blog' }
                ]
              },
              {
                title: 'Company',
                links: [
                  { label: 'About', href: '/about' },
                  { label: 'Careers', href: '/careers' },
                  { label: 'Press', href: '/press' },
                  { label: 'Contact', href: '/contact' }
                ]
              }
            ].map((section, i) => (
              <div key={i}>
                <h4 className="text-white font-semibold mb-4">{section.title}</h4>
                <ul className="space-y-2">
                  {section.links.map((link, j) => (
                    <li key={j}>
                      <Link to={link.href} className="text-slate-400 hover:text-white transition-colors text-sm">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          
          <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-slate-500 text-sm">
              © 2024 Tender Cells. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              <a href="https://github.com/tendercells" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-white transition-colors">
                <Github className="w-5 h-5" />
              </a>
              <Link to="/privacy" className="text-slate-400 hover:text-white transition-colors text-sm">Privacy</Link>
              <Link to="/terms" className="text-slate-400 hover:text-white transition-colors text-sm">Terms</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

