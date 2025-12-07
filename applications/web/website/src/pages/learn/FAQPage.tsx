import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/Layout';
import { ChevronRight, Search, ChevronDown, MessageCircle, BookOpen, Github } from 'lucide-react';

// Converted from src/pages/faq.js

interface FAQItem {
  q: string;
  a: string;
}

interface FAQCategory {
  id: string;
  name: string;
  icon: string;
  questions: FAQItem[];
}

const faqCategories: FAQCategory[] = [
  {
    id: 'general',
    name: 'General',
    icon: '❓',
    questions: [
      {
        q: 'What is Tender Cells?',
        a: 'Tender Cells is a smart farming platform that combines IoT hardware, AI-powered software, and mobile apps to help farmers monitor and automate their animal care operations. Our flagship product, Chicken Tender, focuses on poultry management, with additional systems for cattle, pigs, goats, and ducks in development.'
      },
      {
        q: 'Who is Tender Cells designed for?',
        a: 'Tender Cells is designed for farmers of all sizes—from backyard homesteaders with a few chickens to commercial operations with thousands of birds. Our modular system scales to fit your needs, and our intuitive interface makes it accessible regardless of technical experience.'
      },
      {
        q: 'Do I need technical skills to use Tender Cells?',
        a: "Not at all! We've designed our system to be as simple as using a smartphone. The setup process is guided step-by-step, and our mobile app is intuitive and user-friendly. If you can use email, you can use Tender Cells."
      },
      {
        q: 'Is Tender Cells available internationally?',
        a: 'Yes! We ship worldwide with free shipping on all orders. Our system supports multiple languages and works with both metric and imperial units. Local power adapters are included based on your shipping destination.'
      }
    ]
  },
  {
    id: 'products',
    name: 'Products & Pricing',
    icon: '🛒',
    questions: [
      {
        q: "What's included in the Chicken Tender system?",
        a: 'The base Chicken Tender system includes: 1 Smart Hub, 2 Climate Sensors (temperature/humidity), 1 Water Level Sensor, 1 Smart Feeder Controller, the mobile app (iOS/Android), and free cloud monitoring for 1 year. Additional sensors and accessories can be added based on your needs.'
      },
      {
        q: 'How much does Tender Cells cost?',
        a: 'The Chicken Tender base system starts at $299. We also offer financing options starting at $25/month. Enterprise pricing for commercial operations is available—contact our sales team for a custom quote.'
      },
      {
        q: 'Is there a subscription fee?',
        a: 'Basic cloud monitoring is included free for the first year, then $9.99/month. However, all core functionality works locally without any subscription—cloud features are optional. We also offer annual plans with 2 months free.'
      },
      {
        q: "What's your return policy?",
        a: "We offer a 90-day satisfaction guarantee. If you're not completely happy with your Tender Cells system, return it for a full refund—no questions asked. We'll even cover return shipping."
      },
      {
        q: 'Do you offer bulk or educational discounts?',
        a: 'Yes! Educational institutions receive 30% off all products. We also offer volume discounts for orders of 5+ units. Contact our sales team for details.'
      }
    ]
  },
  {
    id: 'setup',
    name: 'Setup & Installation',
    icon: '🔧',
    questions: [
      {
        q: 'How long does setup take?',
        a: 'Most users complete setup in about 45 minutes. The Smart Hub takes about 15 minutes to configure, and each sensor takes 5-10 minutes to place and connect. Our app guides you through every step.'
      },
      {
        q: 'Do I need WiFi in my barn or coop?',
        a: "The Smart Hub needs WiFi to connect to the cloud, but it doesn't need to be in the barn itself—it can be up to 100 meters from your sensors. Many customers place the hub in their house and use the mesh network to reach the coop."
      },
      {
        q: 'Can I install the system myself?',
        a: 'Absolutely! Tender Cells is designed for DIY installation. No electrician or special tools required. All components use standard power outlets or batteries, and sensors mount with screws or magnetic mounts.'
      },
      {
        q: "What if my barn doesn't have electricity?",
        a: 'Our sensors run on long-life batteries (2+ years) or optional solar panels. The Smart Hub requires power, but can be located anywhere within range of the sensors—even in your house.'
      }
    ]
  },
  {
    id: 'features',
    name: 'Features & Capabilities',
    icon: '⚡',
    questions: [
      {
        q: 'What can Tender Cells monitor?',
        a: 'Tender Cells can monitor: temperature, humidity, water levels, feed levels, door status (open/closed), light levels, motion/activity, and with our AI camera, individual animal health and behavior. The specific capabilities depend on which sensors you have installed.'
      },
      {
        q: 'How does the AI health monitoring work?',
        a: "Our AI analyzes patterns across all your sensor data. If it detects anomalies—like decreased activity, unusual feeding patterns, or environmental stress—it alerts you immediately. The system learns your flock's normal behavior and improves over time."
      },
      {
        q: 'Can I control devices automatically?',
        a: 'Yes! You can create automation rules like "turn on the heater when temperature drops below 60°F" or "close the coop door at sunset." Our system supports complex conditions and schedules.'
      },
      {
        q: 'Does it work without internet?',
        a: "Yes. All monitoring and automation runs locally on the Smart Hub. You'll lose remote access and cloud features during an outage, but your farm keeps running normally. Data syncs automatically when connectivity returns."
      },
      {
        q: 'Can I integrate with other smart home systems?',
        a: 'Tender Cells integrates with Home Assistant, Apple HomeKit, Amazon Alexa, Google Home, and IFTTT. We also provide a REST API for custom integrations.'
      }
    ]
  },
  {
    id: 'technical',
    name: 'Technical',
    icon: '💻',
    questions: [
      {
        q: 'What wireless protocol do the sensors use?',
        a: 'Our sensors use Zigbee 3.0, which creates a self-healing mesh network. This provides better range and reliability than WiFi or Bluetooth, with much longer battery life. Range is 100+ meters outdoors, more with mesh nodes.'
      },
      {
        q: 'How often is sensor data updated?',
        a: 'Temperature and humidity update every 5 seconds. Water and feed levels update every minute. Motion and activity are real-time. You can adjust these intervals in settings if needed.'
      },
      {
        q: 'Is my data secure?',
        a: "Yes. All data is encrypted end-to-end using AES-256 encryption. Communications use TLS 1.3. We're SOC 2 Type II certified and GDPR compliant. Your data is never sold to third parties."
      },
      {
        q: 'Can I export my data?',
        a: "Absolutely. You can export all your data in CSV, JSON, or PDF format at any time. We believe you own your data—it's yours to use however you want."
      },
      {
        q: 'Is the software open source?',
        a: 'Large portions of our software are open source under the MIT license, including the sensor firmware, API libraries, and integration plugins. The AI models and cloud infrastructure are proprietary. Visit our GitHub for details.'
      }
    ]
  },
  {
    id: 'support',
    name: 'Support & Warranty',
    icon: '🛠️',
    questions: [
      {
        q: 'What warranty do you offer?',
        a: 'All Tender Cells hardware comes with a 3-year warranty covering defects in materials and workmanship. Sensors have a 2-year warranty. Extended warranties are available for purchase.'
      },
      {
        q: 'How do I get support?',
        a: 'We offer multiple support channels: in-app chat, email (support@tendercells.com), phone (1-800-TENDER-CELLS), and community forums. Phone support is available Monday-Friday, 9 AM-6 PM EST.'
      },
      {
        q: 'Do you offer on-site installation?',
        a: 'For commercial installations, we offer on-site setup and training through our network of certified installers. Contact sales for pricing and availability in your area.'
      },
      {
        q: 'What if a sensor breaks?',
        a: "Under warranty, we'll ship a replacement immediately—often before you return the defective unit. Our modular design means you can usually swap components yourself in minutes."
      }
    ]
  }
];

const popularTopics = [
  { icon: '📦', title: 'Getting Started', description: 'Setup guides and first steps', category: 'setup' },
  { icon: '📱', title: 'Mobile App', description: 'App features and usage', category: 'features' },
  { icon: '🔗', title: 'Integrations', description: 'Smart home connections', category: 'technical' },
  { icon: '💳', title: 'Billing & Plans', description: 'Pricing and subscriptions', category: 'products' }
];

export default function FAQPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());

  const toggleItem = (id: string) => {
    setOpenItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const scrollToCategory = (categoryId: string) => {
    setActiveCategory(categoryId);
    document.getElementById(`faq-${categoryId}`)?.scrollIntoView({ behavior: 'smooth' });
  };

  const filteredCategories = faqCategories.map(category => ({
    ...category,
    questions: category.questions.filter(q => 
      searchTerm === '' || 
      q.q.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.a.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(category => category.questions.length > 0);

  return (
    <Layout>
      {/* Hero Section */}
      <section className="py-24 px-8">
        <div className="max-w-4xl mx-auto text-center">
          <span className="inline-block px-4 py-2 rounded-full bg-emerald-500/20 text-emerald-400 text-sm font-semibold mb-6">
            Help Center
          </span>
          <h1 className="text-5xl font-bold text-white mb-6">
            Frequently Asked <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">Questions</span>
          </h1>
          <p className="text-xl text-slate-400 mb-10">
            Find answers to common questions about Tender Cells products, features, and support.
          </p>

          {/* Search */}
          <div className="relative max-w-xl mx-auto">
            <input
              type="text"
              placeholder="Search for answers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-6 py-4 pr-12 rounded-2xl bg-white/5 border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/50"
            />
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          </div>
        </div>
      </section>

      {/* Category Navigation */}
      <section className="px-8 pb-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap justify-center gap-2">
            {faqCategories.map((category) => (
              <button
                key={category.id}
                onClick={() => scrollToCategory(category.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${activeCategory === category.id ? 'bg-emerald-500 text-white' : 'bg-white/5 text-slate-300 hover:bg-white/10'}`}
              >
                <span>{category.icon}</span>
                <span className="text-sm font-medium">{category.name}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Content */}
      <section className="py-16 px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-3 gap-12">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-12">
              {filteredCategories.map((category) => (
                <div key={category.id} id={`faq-${category.id}`}>
                  <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                    <span>{category.icon}</span>
                    {category.name}
                  </h2>

                  <div className="space-y-4">
                    {category.questions.map((item, i) => {
                      const itemId = `${category.id}-${i}`;
                      const isOpen = openItems.has(itemId);

                      return (
                        <div 
                          key={i}
                          className="rounded-xl bg-white/[0.03] border border-white/10 overflow-hidden"
                        >
                          <button
                            onClick={() => toggleItem(itemId)}
                            className="w-full px-6 py-4 flex items-center justify-between text-left"
                          >
                            <span className="text-white font-medium pr-4">{item.q}</span>
                            <ChevronDown className={`w-5 h-5 text-slate-400 flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                          </button>
                          {isOpen && (
                            <div className="px-6 pb-4">
                              <p className="text-slate-400 leading-relaxed">{item.a}</p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Sidebar */}
            <aside className="space-y-6">
              <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/10">
                <h3 className="text-lg font-bold text-white mb-3">Still Have Questions?</h3>
                <p className="text-slate-400 text-sm mb-4">
                  Can't find what you're looking for? Our support team is here to help.
                </p>
                <Link 
                  to="/contact"
                  className="block w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-white font-semibold rounded-xl text-center transition-all"
                >
                  Contact Support
                </Link>
              </div>

              <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/10">
                <h3 className="text-lg font-bold text-white mb-3">Quick Links</h3>
                <ul className="space-y-2">
                  <li><Link to="/how-it-works" className="text-slate-400 hover:text-white transition-colors text-sm">How It Works</Link></li>
                  <li><Link to="/technology" className="text-slate-400 hover:text-white transition-colors text-sm">Our Technology</Link></li>
                  <li><Link to="/store" className="text-slate-400 hover:text-white transition-colors text-sm">Shop Products</Link></li>
                  <li><Link to="/open-source" className="text-slate-400 hover:text-white transition-colors text-sm">Open Source</Link></li>
                </ul>
              </div>

              <div className="p-6 rounded-2xl bg-gradient-to-br from-emerald-900/30 to-teal-900/30 border border-emerald-500/20">
                <h3 className="text-lg font-bold text-white mb-3">Join Our Community</h3>
                <p className="text-slate-400 text-sm mb-4">
                  Connect with other Tender Cells users, share tips, and get help from the community.
                </p>
                <div className="grid grid-cols-3 gap-2">
                  <a href="https://discord.gg/tendercells" target="_blank" rel="noopener noreferrer" className="flex flex-col items-center p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
                    <MessageCircle className="w-5 h-5 text-slate-300 mb-1" />
                    <span className="text-xs text-slate-400">Discord</span>
                  </a>
                  <a href="#" className="flex flex-col items-center p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
                    <BookOpen className="w-5 h-5 text-slate-300 mb-1" />
                    <span className="text-xs text-slate-400">Forum</span>
                  </a>
                  <a href="https://github.com/tendercells" target="_blank" rel="noopener noreferrer" className="flex flex-col items-center p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
                    <Github className="w-5 h-5 text-slate-300 mb-1" />
                    <span className="text-xs text-slate-400">GitHub</span>
                  </a>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* Popular Topics */}
      <section className="py-16 px-8 bg-white/[0.02]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">Popular Topics</h2>
            <p className="text-slate-400">Quick answers to the most common questions.</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {popularTopics.map((topic, i) => (
              <button
                key={i}
                onClick={() => scrollToCategory(topic.category)}
                className="p-6 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-emerald-500/30 transition-colors text-left"
              >
                <span className="text-3xl mb-3 block">{topic.icon}</span>
                <h4 className="text-white font-semibold mb-1">{topic.title}</h4>
                <p className="text-slate-400 text-sm">{topic.description}</p>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="p-12 rounded-3xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-emerald-500/20">
            <h2 className="text-4xl font-bold text-white mb-4">Ready to Get Started?</h2>
            <p className="text-slate-300 text-lg mb-8">
              Transform your farming operation with intelligent automation.
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
                to="/support"
                className="w-full sm:w-auto px-8 py-4 bg-transparent text-white font-semibold rounded-2xl border border-white/20 hover:bg-white/5 transition-all"
              >
                Get Support
              </Link>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}

