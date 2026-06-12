import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Map, 
  Users, 
  BarChart3, 
  Home, 
  Link as LinkIcon, 
  Zap, 
  Smartphone, 
  Brain, 
  Bell,
  Check,
  Play,
  ChevronRight
} from 'lucide-react';

export default function TenderCellsApplicationPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      {/* Hero Section */}
      <section className="relative py-20 px-4 overflow-hidden">
        <div className="container mx-auto max-w-7xl">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="inline-block px-4 py-2 bg-purple-500/20 text-purple-300 rounded-full text-sm font-medium mb-6">
                Unified Interface
              </span>
              <h1 className="text-5xl lg:text-6xl font-bold text-white mb-6">
                Your Digital Farm at Your Fingertips
              </h1>
              <p className="text-xl text-slate-300 mb-4">
                Experience farming like never before with Tender Cells Application - 
                a unified interface that brings all your farm products together in one 
                beautiful, intuitive digital experience. Think "Farmville" in real life.
              </p>
              <p className="text-lg text-slate-400 mb-8">
                One application. All your animals. Complete control. The Tender Cells Application 
                is your command center for managing every aspect of your smart farm, from chickens 
                to cattle, pigs to goats, and everything in between.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link 
                  to="/store" 
                  className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors"
                >
                  Get Started Free
                </Link>
                <button className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-semibold transition-colors flex items-center gap-2">
                  <Play className="w-5 h-5" />
                  Watch Demo
                </button>
              </div>
            </div>
            <div className="relative">
              <div className="bg-slate-800 rounded-2xl p-8 border border-slate-700 shadow-2xl">
                <div className="bg-slate-900 rounded-lg p-4 mb-4 flex justify-between items-center">
                  <span className="text-white font-medium">🏠 My Farm</span>
                  <span className="text-slate-400">🔔 3</span>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-amber-600/20 p-6 rounded-lg text-center border border-amber-500/30">
                    <div className="text-4xl mb-2">🐔</div>
                    <div className="text-sm text-amber-300">Coop</div>
                  </div>
                  <div className="bg-green-600/20 p-6 rounded-lg text-center border border-green-500/30">
                    <div className="text-4xl mb-2">🐄</div>
                    <div className="text-sm text-green-300">Pasture</div>
                  </div>
                  <div className="bg-pink-600/20 p-6 rounded-lg text-center border border-pink-500/30">
                    <div className="text-4xl mb-2">🐷</div>
                    <div className="text-sm text-pink-300">Pen</div>
                  </div>
                  <div className="bg-stone-600/20 p-6 rounded-lg text-center border border-stone-500/30">
                    <div className="text-4xl mb-2">🐐</div>
                    <div className="text-sm text-stone-300">Field</div>
                  </div>
                  <div className="bg-teal-600/20 p-6 rounded-lg text-center border border-teal-500/30">
                    <div className="text-4xl mb-2">🦆</div>
                    <div className="text-sm text-teal-300">Pond</div>
                  </div>
                  <div className="bg-slate-700 p-6 rounded-lg text-center border border-slate-600">
                    <div className="text-2xl text-slate-500">+</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What is Tender Cells UI Section */}
      <section className="py-20 px-4 bg-slate-800/50">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-white mb-4">What is Tender Cells Application?</h2>
            <p className="text-xl text-slate-300">The unified interface that connects all your Tender Cells products into one seamless experience</p>
          </div>
          
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-4 text-slate-300">
              <p className="text-lg">
                Tender Cells Application is a comprehensive digital farming platform that provides 
                a single, unified interface for managing all your Tender Cells smart farming products. 
                Whether you're running a small homestead with chickens or a large operation with 
                multiple animal types, this application adapts to your needs.
              </p>
              <p className="text-lg">
                Just like how Farmville lets you manage your virtual farm with a visual layout, 
                Tender Cells Application gives you a real-time view of your actual farm with 
                interactive layouts, animal tracking, and intelligent monitoring - all in one place.
              </p>
            </div>
            <div className="bg-slate-900 rounded-2xl p-8 border border-slate-700">
              <div className="text-center">
                <div className="inline-block px-6 py-4 bg-purple-600/20 text-purple-300 rounded-lg font-semibold mb-8">
                  Tender Cells Application
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">🐔 Chicken Tender</div>
                  <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">🐄 Cattle Care</div>
                  <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">🐷 Pig Pal</div>
                  <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">🐐 Goat Guardian</div>
                  <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 col-span-2">🦆 Duck Dock</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Digital Farming Experience Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-white mb-4">Experience Digital Farming Like Never Before</h2>
            <p className="text-xl text-slate-300">Visual layouts, real-time monitoring, and interactive management - all in one beautiful interface</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-slate-800 rounded-2xl p-8 border border-slate-700">
              <div className="text-4xl mb-4">🗺️</div>
              <h3 className="text-2xl font-bold text-white mb-4">Visual Farm Layout</h3>
              <p className="text-slate-300 mb-6">
                See your entire farm at a glance with an interactive layout view. Drag and drop 
                to customize your property layout, see where all your animals are located, and 
                monitor each area in real-time.
              </p>
              <div className="bg-slate-900 rounded-lg p-8 border border-slate-700 text-center">
                <div className="text-4xl mb-2">📸</div>
                <p className="text-slate-400 text-sm">Farm Layout Screenshot</p>
                <p className="text-slate-500 text-xs mt-1">Interactive property layout showing all structures and animals</p>
              </div>
            </div>

            <div className="bg-slate-800 rounded-2xl p-8 border border-slate-700">
              <div className="text-4xl mb-4">🐾</div>
              <h3 className="text-2xl font-bold text-white mb-4">Animal Management & Tracking</h3>
              <p className="text-slate-300 mb-6">
                Track every animal on your farm with detailed profiles, health records, and 
                activity monitoring. See which animals need attention, track growth, and 
                manage breeding cycles - all from one interface.
              </p>
              <div className="bg-slate-900 rounded-lg p-8 border border-slate-700 text-center">
                <div className="text-4xl mb-2">📸</div>
                <p className="text-slate-400 text-sm">Animal Management Screenshot</p>
                <p className="text-slate-500 text-xs mt-1">Animal tracking interface with health status and profiles</p>
              </div>
            </div>

            <div className="bg-slate-800 rounded-2xl p-8 border border-slate-700">
              <div className="text-4xl mb-4">📊</div>
              <h3 className="text-2xl font-bold text-white mb-4">Real-Time Monitoring Dashboards</h3>
              <p className="text-slate-300 mb-6">
                Get instant insights into your farm's health with customizable dashboards. 
                Monitor temperature, humidity, feeding schedules, water levels, and more 
                across all your products simultaneously.
              </p>
              <div className="bg-slate-900 rounded-lg p-8 border border-slate-700 text-center">
                <div className="text-4xl mb-2">📸</div>
                <p className="text-slate-400 text-sm">Dashboard Overview Screenshot</p>
                <p className="text-slate-500 text-xs mt-1">Real-time monitoring dashboard with all farm metrics</p>
              </div>
            </div>

            <div className="bg-slate-800 rounded-2xl p-8 border border-slate-700">
              <div className="text-4xl mb-4">🏡</div>
              <h3 className="text-2xl font-bold text-white mb-4">Interactive Property Management</h3>
              <p className="text-slate-300 mb-6">
                Manage multiple properties from one account. Switch between locations, 
                compare performance, and get unified insights across all your farming operations.
              </p>
              <div className="bg-slate-900 rounded-lg p-8 border border-slate-700 text-center">
                <div className="text-4xl mb-2">📸</div>
                <p className="text-slate-400 text-sm">Property Management Screenshot</p>
                <p className="text-slate-500 text-xs mt-1">Multi-property view with location switching</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Product Integration Section */}
      <section className="py-20 px-4 bg-slate-800/50">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-white mb-4">One App, All Your Products</h2>
            <p className="text-xl text-slate-300">The interface adapts seamlessly to work with every Tender Cells product</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { emoji: '🐔', name: 'Chicken Tender', desc: 'Monitor your coop\'s climate, feeding schedules, egg production, and flock health all from the unified dashboard.', tags: ['Climate Control', 'Feeding Automation', 'Egg Tracking'] },
              { emoji: '🐄', name: 'Cattle Care', desc: 'Track your herd\'s location, health metrics, grazing patterns, and breeding cycles with GPS-enabled monitoring.', tags: ['GPS Tracking', 'Herd Management', 'Health Monitoring'] },
              { emoji: '🐷', name: 'Pig Pal', desc: 'Manage pig health, weight tracking, automated feeding, and growth analytics through the unified interface.', tags: ['Weight Tracking', 'Growth Analytics', 'Automated Feeding'] },
              { emoji: '🐐', name: 'Goat Guardian', desc: 'Optimize pasture rotation, track milk production, monitor herd health, and manage breeding schedules.', tags: ['Pasture Management', 'Milk Tracking', 'Breeding Cycles'] },
              { emoji: '🦆', name: 'Duck Dock', desc: 'Monitor pond water quality, track waterfowl health, optimize feeding schedules, and track egg collection.', tags: ['Water Quality', 'Pond Monitoring', 'Egg Collection'] }
            ].map((product, idx) => (
              <div key={idx} className="bg-slate-800 rounded-xl p-6 border border-slate-700 hover:border-purple-500 transition-colors">
                <div className="text-5xl mb-4">{product.emoji}</div>
                <h3 className="text-xl font-bold text-white mb-3">{product.name}</h3>
                <p className="text-slate-300 mb-4">{product.desc}</p>
                <div className="flex flex-wrap gap-2">
                  {product.tags.map((tag, tagIdx) => (
                    <span key={tagIdx} className="px-3 py-1 bg-purple-600/20 text-purple-300 rounded-full text-xs">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Key Features Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-white mb-4">Key Features</h2>
            <p className="text-xl text-slate-300">Everything you need to manage your smart farm</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: LinkIcon, title: 'Unified Interface', desc: 'One application manages all your Tender Cells products. No need to switch between different apps.' },
              { icon: Zap, title: 'Real-Time Sync', desc: 'All data synchronizes in real-time across all your devices using Firebase. Changes update instantly.' },
              { icon: Home, title: 'Multi-Property', desc: 'Manage multiple farms or properties from one account. Switch between locations seamlessly.' },
              { icon: Users, title: 'Animal Tracking', desc: 'Track every animal with detailed profiles, health records, and activity monitoring.' },
              { icon: Map, title: 'Layout Customization', desc: 'Customize your farm layout visually. Drag and drop to organize structures and areas.' },
              { icon: Smartphone, title: 'Cross-Platform', desc: 'Access from web, iOS, or Android. Your data syncs across all platforms automatically.' },
              { icon: Brain, title: 'AI-Powered Insights', desc: 'Get intelligent recommendations and alerts powered by Google AI and Genkit.' },
              { icon: Bell, title: 'Smart Notifications', desc: 'Receive alerts for important events, health issues, and maintenance needs across all products.' }
            ].map((feature, idx) => (
              <div key={idx} className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                <feature.icon className="w-8 h-8 text-purple-400 mb-4" />
                <h3 className="text-lg font-bold text-white mb-2">{feature.title}</h3>
                <p className="text-slate-300 text-sm">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-4 bg-slate-800/50">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-white mb-4">How It Works</h2>
            <p className="text-xl text-slate-300">Get started with Tender Cells Application in minutes</p>
          </div>

          <div className="max-w-4xl mx-auto space-y-6">
            {[
              { num: '1', title: 'Create Your Account', desc: 'Sign up for free and create your Tender Cells account. No credit card required.' },
              { num: '2', title: 'Add Your Properties', desc: 'Set up your farm locations and customize your property layout using our visual editor.' },
              { num: '3', title: 'Register Your Products', desc: 'Connect your Tender Cells products (Chicken Tender, Cattle Care, etc.) to your account.' },
              { num: '4', title: 'Add Your Animals', desc: 'Register your animals and start tracking their health, activity, and productivity.' },
              { num: '5', title: 'Start Monitoring', desc: 'Begin monitoring your farm in real-time. Set up alerts, customize dashboards, and let AI help optimize your operations.' }
            ].map((step, idx) => (
              <div key={idx} className="flex gap-6 bg-slate-800 rounded-xl p-6 border border-slate-700">
                <div className="flex-shrink-0 w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                  {step.num}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">{step.title}</h3>
                  <p className="text-slate-300">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-4xl font-bold text-white mb-4">Ready to Experience Digital Farming?</h2>
          <p className="text-xl text-slate-300 mb-8">
            Join thousands of farmers who are already using Tender Cells Application to manage their smart farms.
          </p>
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            <Link 
              to="/store" 
              className="px-8 py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors"
            >
              Get Started Free
            </Link>
            <Link 
              to="/contact" 
              className="px-8 py-4 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-semibold transition-colors"
            >
              Schedule a Demo
            </Link>
          </div>
          <div className="flex flex-wrap justify-center gap-6 text-slate-300">
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 text-green-400" />
              <span>Free to start</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 text-green-400" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 text-green-400" />
              <span>Works with all Tender Cells products</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

